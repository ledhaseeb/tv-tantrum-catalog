/**
 * Skool Research Extractor
 * 
 * This script logs into a Skool community and extracts research summaries
 * for import into our research_summaries database table.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { db } = require('./server/db');
const { researchSummaries } = require('./shared/schema');

// Configuration
const SKOOL_URL = 'https://www.skool.com/screen-time-community/classroom/e5da82d5?md=869d5a30cf1144e29cdbf7ec0ed6ca30';
const SKOOL_EMAIL = ''; // Will be provided at runtime
const SKOOL_PASSWORD = ''; // Will be provided at runtime
const OUTPUT_FOLDER = './extracted_research';
const IMAGES_FOLDER = './public/research';

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_FOLDER)) {
  fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
}
if (!fs.existsSync(IMAGES_FOLDER)) {
  fs.mkdirSync(IMAGES_FOLDER, { recursive: true });
}

/**
 * Main extraction function
 */
async function extractResearchFromSkool(email, password) {
  console.log('Starting Skool research extraction...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    defaultViewport: { width: 1366, height: 768 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Login to Skool
    console.log('Logging in to Skool...');
    await page.goto(SKOOL_URL, { waitUntil: 'networkidle2' });
    
    // Check if we need to log in
    const isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('input[type="email"]');
    });
    
    if (!isLoggedIn) {
      // Fill login form
      await page.type('input[type="email"]', email);
      await page.type('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      console.log('Login successful');
    } else {
      console.log('Already logged in');
    }
    
    // Wait for the content to load
    await page.waitForSelector('.classroom-content', { timeout: 30000 });
    
    // Extract all categories (bold text items on the left)
    const categories = await page.evaluate(() => {
      const categoryElements = Array.from(document.querySelectorAll('.sidebar-section-title'));
      return categoryElements.map(el => ({
        name: el.textContent.trim(),
        element: el
      }));
    });
    
    console.log(`Found ${categories.length} research categories`);
    
    // Extracted research data
    const researchData = [];
    
    // Process each category
    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      // We need to re-evaluate the categories each time as the DOM may change
      const categoryElements = await page.$$('.sidebar-section-title');
      if (categoryIndex >= categoryElements.length) continue;
      
      const categoryElement = categoryElements[categoryIndex];
      const categoryName = await page.evaluate(el => el.textContent.trim(), categoryElement);
      
      console.log(`Processing category: ${categoryName}`);
      
      // Click to expand the category
      await categoryElement.click();
      await page.waitForTimeout(1000); // Wait for animation
      
      // Get all summaries under this category
      const summaries = await page.evaluate(categoryEl => {
        // Find all non-bold text items that are children of this category section
        const categorySection = categoryEl.closest('.sidebar-section');
        if (!categorySection) return [];
        
        const summaryElements = Array.from(categorySection.querySelectorAll('.sidebar-lesson-name'));
        return summaryElements.map(el => ({
          title: el.textContent.trim(),
          element: el
        }));
      }, categoryElement);
      
      console.log(`Found ${summaries.length} summaries in category: ${categoryName}`);
      
      // Process each summary
      for (let summaryIndex = 0; summaryIndex < summaries.length; summaryIndex++) {
        // Re-evaluate to get fresh DOM references
        const summaryElements = await page.$$(`[data-testid="sidebar-lesson-name"]`);
        // Find the right element within the visible summaries
        let currentSummaryElement;
        let summaryTitle;
        
        for (const el of summaryElements) {
          const text = await page.evaluate(e => e.textContent.trim(), el);
          if (await page.evaluate(e => e.closest('.sidebar-section').style.display !== 'none', el)) {
            // Count visible elements to match our index
            if (summaryIndex === 0) {
              currentSummaryElement = el;
              summaryTitle = text;
              break;
            }
            summaryIndex--;
          }
        }
        
        if (!currentSummaryElement) continue;
        
        console.log(`Processing summary: ${summaryTitle}`);
        
        // Click on the summary to view its content
        await currentSummaryElement.click();
        await page.waitForTimeout(2000); // Wait for content to load
        
        // Extract the summary content
        const content = await page.evaluate(() => {
          // Get the main content area
          const contentArea = document.querySelector('.lesson-content');
          if (!contentArea) return null;
          
          // Extract title
          const titleElement = contentArea.querySelector('h1, h2, h3');
          const title = titleElement ? titleElement.textContent.trim() : 'Untitled Research';
          
          // Extract full text
          const paragraphs = Array.from(contentArea.querySelectorAll('p, li, h4, h5, h6'));
          const fullText = paragraphs.map(p => p.textContent.trim()).join('\\n\\n');
          
          // Extract summary (first paragraph or two)
          const summaryText = paragraphs.slice(0, 2).map(p => p.textContent.trim()).join(' ');
          
          // Extract source link if present
          const links = Array.from(contentArea.querySelectorAll('a[href*="http"]'));
          let source = null;
          let sourceLink = null;
          
          for (const link of links) {
            const text = link.textContent.toLowerCase().trim();
            if (text.includes('study') || text.includes('research') || text.includes('source') || 
                text.includes('journal') || text.includes('article')) {
              source = link.textContent.trim();
              sourceLink = link.href;
              break;
            }
          }
          
          // Look for images
          const images = Array.from(contentArea.querySelectorAll('img')).map(img => img.src)
            .filter(src => src && !src.includes('avatar') && !src.includes('profile') && !src.includes('logo'));
          
          return {
            title,
            summary: summaryText.substring(0, 300) + (summaryText.length > 300 ? '...' : ''),
            fullText,
            source,
            sourceLink,
            images
          };
        });
        
        if (!content) {
          console.log('Could not extract content, skipping');
          continue;
        }
        
        // Download the first image if available
        let imagePath = null;
        if (content.images && content.images.length > 0) {
          const imageUrl = content.images[0];
          const imageFileName = `${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${
            content.title.toLowerCase().replace(/[^a-z0-9]/g, '-')
          }.jpg`;
          
          imagePath = `/research/${imageFileName}`;
          const fullImagePath = path.join(IMAGES_FOLDER, imageFileName);
          
          try {
            // Download the image
            const imageResponse = await page.goto(imageUrl);
            const imageBuffer = await imageResponse.buffer();
            fs.writeFileSync(fullImagePath, imageBuffer);
            console.log(`Saved image: ${fullImagePath}`);
            
            // Go back to the classroom page
            await page.goto(SKOOL_URL, { waitUntil: 'networkidle2' });
            await page.waitForSelector('.classroom-content', { timeout: 30000 });
            
            // Re-expand the category
            const categoryElements = await page.$$('.sidebar-section-title');
            await categoryElements[categoryIndex].click();
            await page.waitForTimeout(1000);
          } catch (err) {
            console.error(`Error downloading image: ${err.message}`);
            imagePath = null;
          }
        }
        
        // Add to research data
        researchData.push({
          title: content.title,
          summary: content.summary,
          fullText: content.fullText,
          source: content.source || content.sourceLink,
          category: categoryName,
          imageUrl: imagePath,
          publishedDate: new Date() // Default to current date if not available
        });
      }
    }
    
    // Save the extracted data
    const outputPath = path.join(OUTPUT_FOLDER, 'research_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(researchData, null, 2));
    console.log(`Research data saved to ${outputPath}`);
    
    // Return the data for database insertion
    return researchData;
    
  } catch (error) {
    console.error('Error during extraction:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Insert research data into the database
 */
async function insertResearchIntoDatabase(researchData) {
  console.log('Inserting research into database...');
  
  try {
    // Start a transaction
    let insertedCount = 0;
    
    for (const research of researchData) {
      try {
        // Check if a research with this title already exists
        const existingResearch = await db
          .select()
          .from(researchSummaries)
          .where(db.sql`LOWER(title) = LOWER(${research.title})`)
          .limit(1);
        
        if (existingResearch && existingResearch.length > 0) {
          console.log(`Research "${research.title}" already exists, skipping`);
          continue;
        }
        
        // Insert the research summary
        await db.insert(researchSummaries).values({
          title: research.title,
          summary: research.summary,
          fullText: research.fullText,
          category: research.category,
          imageUrl: research.imageUrl,
          source: research.source,
          publishedDate: research.publishedDate,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        insertedCount++;
        console.log(`Inserted research: ${research.title}`);
      } catch (err) {
        console.error(`Error inserting research "${research.title}":`, err);
      }
    }
    
    console.log(`Successfully inserted ${insertedCount} research summaries`);
    return insertedCount;
  } catch (error) {
    console.error('Database insertion error:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Get credentials from command line args or prompt
    const email = process.argv[2] || process.env.SKOOL_EMAIL;
    const password = process.argv[3] || process.env.SKOOL_PASSWORD;
    
    if (!email || !password) {
      console.error('Please provide Skool email and password');
      console.log('Usage: node skool-extractor.js <email> <password>');
      process.exit(1);
    }
    
    // Extract research data
    const researchData = await extractResearchFromSkool(email, password);
    
    // Insert into database
    const insertedCount = await insertResearchIntoDatabase(researchData);
    
    console.log(`Extraction complete! Inserted ${insertedCount} research summaries.`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Execute the script
if (require.main === module) {
  main();
}

module.exports = {
  extractResearchFromSkool,
  insertResearchIntoDatabase
};