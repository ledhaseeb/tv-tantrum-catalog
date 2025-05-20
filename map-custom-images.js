/**
 * This script maps custom images to TV shows in the database
 * It reads the image filenames and tries to match them with shows by name
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Path to custom images
const CUSTOM_IMAGES_DIR = path.join(__dirname, 'client', 'public', 'custom-images');
const PUBLIC_CUSTOM_IMAGES_DIR = path.join(__dirname, 'public', 'custom-images');

// Load or create customImageMap.json
function loadCustomImageMap() {
  try {
    const filePath = path.join(__dirname, 'customImageMap.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading custom image map:', error);
  }
  return {};
}

// Save customImageMap.json
function saveCustomImageMap(customImageMap) {
  try {
    const filePath = path.join(__dirname, 'customImageMap.json');
    fs.writeFileSync(filePath, JSON.stringify(customImageMap, null, 2));
    console.log(`Saved ${Object.keys(customImageMap).length} mappings to customImageMap.json`);
  } catch (error) {
    console.error('Error saving custom image map:', error);
  }
}

// Clean up text for matching
function cleanText(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

// Find the best matching show for an image filename
async function findMatchingShow(imageFile, shows) {
  // Remove extension and clean up the name
  const baseName = path.basename(imageFile, path.extname(imageFile));
  const cleanName = cleanText(baseName);
  
  // Check for exact match first
  for (const show of shows) {
    if (cleanText(show.name) === cleanName) {
      console.log(`Exact match found: "${imageFile}" -> "${show.name}" (ID: ${show.id})`);
      return show;
    }
  }
  
  // Check for show name contained within image name
  for (const show of shows) {
    const cleanShowName = cleanText(show.name);
    if (cleanName.includes(cleanShowName)) {
      console.log(`Partial match found: "${imageFile}" -> "${show.name}" (ID: ${show.id})`);
      return show;
    }
  }
  
  // Check for image name contained within show name
  for (const show of shows) {
    const cleanShowName = cleanText(show.name);
    if (cleanShowName.includes(cleanName)) {
      console.log(`Reverse partial match: "${imageFile}" -> "${show.name}" (ID: ${show.id})`);
      return show;
    }
  }
  
  // Handle special cases with year disambiguation
  const yearMatch = baseName.match(/\((\d{4}(?:-\d{4})?)\)/);
  if (yearMatch) {
    const nameWithoutYear = cleanText(baseName.replace(yearMatch[0], ''));
    
    for (const show of shows) {
      if (cleanText(show.name).includes(nameWithoutYear) || 
          nameWithoutYear.includes(cleanText(show.name))) {
        console.log(`Year-based match: "${imageFile}" -> "${show.name}" (ID: ${show.id})`);
        return show;
      }
    }
  }
  
  console.log(`No match found for: "${imageFile}"`);
  return null;
}

// Process all images and update the database
async function processImages() {
  try {
    // Get all TV shows from the database
    const { rows: shows } = await pool.query('SELECT id, name FROM tv_shows');
    console.log(`Found ${shows.length} shows in the database`);
    
    // Get all image files
    if (!fs.existsSync(CUSTOM_IMAGES_DIR)) {
      console.error(`Custom images directory not found: ${CUSTOM_IMAGES_DIR}`);
      return;
    }
    
    const imageFiles = fs.readdirSync(CUSTOM_IMAGES_DIR)
      .filter(file => !file.startsWith('.'))
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    
    console.log(`Found ${imageFiles.length} custom images to process`);
    
    // Load existing custom image map
    const customImageMap = loadCustomImageMap();
    let newMappingsCount = 0;
    let updatedCount = 0;
    
    // Process each image
    for (const imageFile of imageFiles) {
      // Skip Mac hidden files
      if (imageFile.startsWith('._')) continue;
      
      const imagePath = `/custom-images/${imageFile}`;
      
      // Check if this image is already mapped to a show
      const existingShowId = Object.keys(customImageMap).find(
        showId => customImageMap[showId] === imagePath
      );
      
      if (existingShowId) {
        console.log(`Image ${imageFile} is already mapped to show ID ${existingShowId}`);
        continue;
      }
      
      // Find a matching show for this image
      const matchingShow = await findMatchingShow(imageFile, shows);
      
      if (matchingShow) {
        // Update the custom image map
        customImageMap[matchingShow.id] = imagePath;
        newMappingsCount++;
        
        // Update the database
        try {
          const updateResult = await pool.query(
            'UPDATE tv_shows SET "imageUrl" = $1 WHERE id = $2 RETURNING id, name',
            [imagePath, matchingShow.id]
          );
          
          if (updateResult.rowCount > 0) {
            console.log(`Updated database for "${matchingShow.name}" with image: ${imagePath}`);
            updatedCount++;
          }
        } catch (err) {
          console.error(`Database update error for ${matchingShow.name}:`, err);
        }
      }
    }
    
    // Save the updated custom image map
    saveCustomImageMap(customImageMap);
    
    console.log(`
Processing complete:
- Added ${newMappingsCount} new image mappings
- Updated ${updatedCount} shows in the database
- Current total mappings: ${Object.keys(customImageMap).length}
    `);
    
    return { newMappingsCount, updatedCount, totalMappings: Object.keys(customImageMap).length };
  } catch (error) {
    console.error('Error processing images:', error);
  } finally {
    pool.end();
  }
}

// Run the script
processImages().catch(console.error);