/**
 * Skool Research Extractor (Simplified Version)
 * 
 * This script logs into a Skool community and extracts research summaries
 * into a JSON file for review before database import.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SKOOL_URL = 'https://www.skool.com/screen-time-community/classroom/e5da82d5?md=869d5a30cf1144e29cdbf7ec0ed6ca30';
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
      return categoryElements.map(el => el.textContent.trim());
    });
    
    console.log(`Found ${categories.length} research categories`);
    console.log('Categories:', categories);
    
    // Extracted research data
    const researchData = [];
    
    // Process each category
    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      // Click to expand the category
      const categoryElements = await page.$$('.sidebar-section-title');
      await categoryElements[categoryIndex].click();
      await page.waitForTimeout(1000); // Wait for animation
      
      const categoryName = await page.evaluate(el => el.textContent.trim(), categoryElements[categoryIndex]);
      console.log(`Processing category: ${categoryName}`);
      
      // Get all summaries under this category
      const summaryElements = await page.$$(`[data-testid="sidebar-lesson-name"]`);
      
      // Filter visible summaries (those belonging to the current expanded category)
      const visibleSummaries = [];
      for (const el of summaryElements) {
        const isVisible = await page.evaluate(e => {
          const section = e.closest('.sidebar-section');
          return section && window.getComputedStyle(section).display !== 'none';
        }, el);
        
        if (isVisible) {
          const title = await page.evaluate(e => e.textContent.trim(), el);
          visibleSummaries.push({ element: el, title });
        }
      }
      
      console.log(`Found ${visibleSummaries.length} summaries in category: ${categoryName}`);
      
      // Process each summary in this category
      for (let i = 0; i < visibleSummaries.length; i++) {
        const summary = visibleSummaries[i];
        console.log(`Processing summary: ${summary.title}`);
        
        // Click on the summary to view its content
        await summary.element.click();
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
          const fullText = paragraphs.map(p => p.textContent.trim()).join('\n\n');
          
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
            summary: summaryText.length > 300 ? summaryText.substring(0, 300) + '...' : summaryText,
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
            console.log(`Downloading image from ${imageUrl}`);
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
            
            // Go back to the classroom page
            await page.goto(SKOOL_URL, { waitUntil: 'networkidle2' });
            await page.waitForSelector('.classroom-content', { timeout: 30000 });
            
            // Re-expand the category
            const categoryElements = await page.$$('.sidebar-section-title');
            await categoryElements[categoryIndex].click();
            await page.waitForTimeout(1000);
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
          publishedDate: new Date().toISOString() // Default to current date if not available
        });
      }
      
      // Close the category before moving to the next one
      await categoryElements[categoryIndex].click();
    }
    
    // Save the extracted data
    const outputPath = path.join(OUTPUT_FOLDER, 'research_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(researchData, null, 2));
    console.log(`Research data saved to ${outputPath}`);
    
    return researchData;
    
  } catch (error) {
    console.error('Error during extraction:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Get credentials from command line args or prompt
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.error('Please provide Skool email and password');
      console.log('Usage: node extract-skool-research.js <email> <password>');
      process.exit(1);
    }
    
    // Extract research data
    const researchData = await extractResearchFromSkool(email, password);
    console.log(`Extraction complete! Extracted ${researchData.length} research summaries.`);
    
    // Create SQL insert statements for review
    const sqlPath = path.join(OUTPUT_FOLDER, 'research_inserts.sql');
    
    let sqlContent = '';
    for (const research of researchData) {
      sqlContent += `INSERT INTO research_summaries (title, summary, full_text, source, category, image_url, published_date, created_at, updated_at)\n`;
      sqlContent += `VALUES (\n`;
      sqlContent += `  '${research.title.replace(/'/g, "''")}'::text,\n`;
      sqlContent += `  '${research.summary.replace(/'/g, "''")}'::text,\n`;
      sqlContent += `  '${research.fullText.replace(/'/g, "''")}'::text,\n`;
      sqlContent += `  '${(research.source || '').replace(/'/g, "''")}'::text,\n`;
      sqlContent += `  '${research.category.replace(/'/g, "''")}'::text,\n`;
      sqlContent += `  ${research.imageUrl ? `'${research.imageUrl}'::text` : 'NULL'},\n`;
      sqlContent += `  '${research.publishedDate}'::timestamp,\n`;
      sqlContent += `  NOW(),\n`;
      sqlContent += `  NOW()\n`;
      sqlContent += `);\n\n`;
    }
    
    fs.writeFileSync(sqlPath, sqlContent);
    console.log(`SQL insert statements saved to ${sqlPath}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Execute the script when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractResearchFromSkool };