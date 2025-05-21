/**
 * Script to match custom images with TV shows and update the database
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

// Custom image map functions
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

function saveCustomImageMap(customImageMap) {
  try {
    const filePath = path.join(__dirname, 'customImageMap.json');
    fs.writeFileSync(filePath, JSON.stringify(customImageMap, null, 2));
    console.log(`Saved ${Object.keys(customImageMap).length} mappings to customImageMap.json`);
  } catch (error) {
    console.error('Error saving custom image map:', error);
  }
}

// Clean text for better matching
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
  
  // Handle special cases with year in parentheses
  const yearMatches = baseName.match(/\((\d{4}(?:-\d{4}|present)?)\)/i);
  let nameWithoutYear = cleanName;
  
  if (yearMatches) {
    nameWithoutYear = cleanText(baseName.replace(yearMatches[0], ''));
  }
  
  // Check for exact match first (ignore case)
  for (const show of shows) {
    if (cleanText(show.name) === cleanName || 
        cleanText(show.name) === nameWithoutYear) {
      console.log(`Exact match found: "${imageFile}" -> "${show.name}" (ID: ${show.id})`);
      return show;
    }
  }
  
  // Check for show name contained within image name
  for (const show of shows) {
    const cleanShowName = cleanText(show.name);
    if (cleanName.includes(cleanShowName) && cleanShowName.length > 3) {
      console.log(`Partial match found: "${imageFile}" -> "${show.name}" (ID: ${show.id})`);
      return show;
    }
  }
  
  // Check for image name contained within show name
  for (const show of shows) {
    const cleanShowName = cleanText(show.name);
    if (cleanShowName.includes(cleanName) && cleanName.length > 3) {
      console.log(`Reverse partial match: "${imageFile}" -> "${show.name}" (ID: ${show.id})`);
      return show;
    }
  }
  
  console.log(`No match found for: "${imageFile}"`);
  return null;
}

// Main function to update images
async function updateImages() {
  try {
    // Get all TV shows from the database
    const { rows: shows } = await pool.query('SELECT id, name FROM tv_shows');
    console.log(`Found ${shows.length} shows in the database`);
    
    // Get all image files
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
      const imagePath = `/custom-images/${imageFile}`;
      
      // Check if this image is already mapped
      const existingShowId = Object.keys(customImageMap).find(
        showId => customImageMap[showId] === imagePath
      );
      
      if (existingShowId) {
        console.log(`Image ${imageFile} is already mapped to show ID ${existingShowId}`);
        
        // Make sure the database has this image as well
        try {
          await pool.query(
            'UPDATE tv_shows SET image_url = $1 WHERE id = $2 AND (image_url IS NULL OR image_url != $1)',
            [imagePath, existingShowId]
          );
        } catch (err) {
          console.error(`Error updating existing mapping:`, err);
        }
        
        continue;
      }
      
      // Find a matching show for this image
      const matchingShow = await findMatchingShow(imageFile, shows);
      
      if (matchingShow) {
        // Update the custom image map
        customImageMap[matchingShow.id] = imagePath;
        newMappingsCount++;
        
        // Update the database with the correct column name (image_url with underscore)
        try {
          const updateResult = await pool.query(
            'UPDATE tv_shows SET image_url = $1 WHERE id = $2 RETURNING id, name',
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
updateImages().catch(console.error);