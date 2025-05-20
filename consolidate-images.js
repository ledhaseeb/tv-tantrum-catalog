/**
 * This script consolidates all TV show images into a single primary directory
 * and updates the database to ensure all images continue to display properly.
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

// Define paths
const PRIMARY_IMAGE_DIR = path.join(__dirname, 'public', 'media', 'tv-shows');

// Ensure directory exists
if (!fs.existsSync(PRIMARY_IMAGE_DIR)) {
  fs.mkdirSync(PRIMARY_IMAGE_DIR, { recursive: true });
}

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Load or create imagePathMap.json to track all image mappings
function loadImagePathMap() {
  try {
    const filePath = path.join(__dirname, 'imagePathMap.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading image path map:', error);
  }
  return {};
}

// Save imagePathMap.json
function saveImagePathMap(imagePathMap) {
  try {
    const filePath = path.join(__dirname, 'imagePathMap.json');
    fs.writeFileSync(filePath, JSON.stringify(imagePathMap, null, 2));
    console.log(`Saved ${Object.keys(imagePathMap).length} mappings to imagePathMap.json`);
  } catch (error) {
    console.error('Error saving image path map:', error);
  }
}

// Process an image - copy to primary directory and return new path
async function processImage(imageUrl, showId, showName) {
  // Skip if not a file path or if null
  if (!imageUrl || imageUrl.startsWith('http') || !imageUrl.startsWith('/')) {
    console.log(`Skipping non-file image for ${showName} (ID: ${showId}): ${imageUrl}`);
    return null;
  }
  
  try {
    // Remove leading slash for resolving file paths
    const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    
    // Try different possible source locations
    const possibleSourcePaths = [
      path.join(__dirname, relativePath),
      path.join(__dirname, 'client/public', relativePath),
      path.join(__dirname, 'public', relativePath),
      path.join(__dirname, 'client/public/custom-images', path.basename(relativePath)),
      path.join(__dirname, 'public/custom-images', path.basename(relativePath)),
      path.join(__dirname, 'public/uploads', path.basename(relativePath)),
      path.join(__dirname, 'public/uploads/optimized', path.basename(relativePath))
    ];
    
    // Find the first path that exists
    let sourcePath = null;
    for (const checkPath of possibleSourcePaths) {
      if (fs.existsSync(checkPath)) {
        sourcePath = checkPath;
        break;
      }
    }
    
    if (!sourcePath) {
      console.log(`Could not find source image for ${showName} (ID: ${showId}): ${imageUrl}`);
      return null;
    }
    
    // Determine target filename - use show ID to ensure uniqueness
    const filename = path.basename(sourcePath);
    const ext = path.extname(filename);
    const targetFileName = `show-${showId}${ext}`;
    const targetPath = path.join(PRIMARY_IMAGE_DIR, targetFileName);
    
    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied image for ${showName} to primary directory: ${targetPath}`);
    
    // Return the new web path
    return `/media/tv-shows/${targetFileName}`;
  } catch (error) {
    console.error(`Error processing image for show ${showId}:`, error);
    return null;
  }
}

// Main function to process all images
async function consolidateAllImages() {
  try {
    // Get all TV shows with their current images
    const { rows: shows } = await pool.query(
      'SELECT id, name, image_url FROM tv_shows WHERE image_url IS NOT NULL'
    );
    
    console.log(`Found ${shows.length} shows with images to process`);
    
    // Load or create the image path map
    const imagePathMap = loadImagePathMap();
    
    // Track progress
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each show's image
    for (const show of shows) {
      try {
        const { id, name, image_url } = show;
        
        // Skip shows without images
        if (!image_url) {
          skippedCount++;
          continue;
        }
        
        console.log(`\nProcessing show: ${name} (ID: ${id})`);
        console.log(`Current image URL: ${image_url}`);
        
        // Check if we already have this image mapped in our tracking file
        if (imagePathMap[id]) {
          console.log(`Show already has a mapped image path: ${imagePathMap[id]}`);
          
          // Update the database to use the mapped path
          await pool.query(
            'UPDATE tv_shows SET image_url = $1 WHERE id = $2',
            [imagePathMap[id], id]
          );
          
          updatedCount++;
          processedCount++;
          continue;
        }
        
        // For new images, process and copy to primary directory
        const newImagePath = await processImage(image_url, id, name);
        
        if (newImagePath) {
          // Record the mapping
          imagePathMap[id] = newImagePath;
          
          // Update database with new path
          await pool.query(
            'UPDATE tv_shows SET image_url = $1 WHERE id = $2',
            [newImagePath, id]
          );
          
          updatedCount++;
        } else {
          console.log(`Keeping original image URL for ${name}: ${image_url}`);
          // Still record the original path in our mapping
          imagePathMap[id] = image_url;
          skippedCount++;
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing show:`, error);
        errorCount++;
      }
    }
    
    // Save the updated image path map
    saveImagePathMap(imagePathMap);
    
    console.log('\nConsolidation complete:');
    console.log(`- Total processed: ${processedCount}`);
    console.log(`- Database updated: ${updatedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error during image consolidation:', error);
  } finally {
    pool.end();
  }
}

// Run the main function
consolidateAllImages().catch(console.error);