/**
 * Imports custom images from a zipped folder into the system
 * and updates the customImageMap.json file
 * 
 * Features:
 * - Extracts images from zip file to client/public/custom-images
 * - Updates customImageMap.json with new image mappings
 * - Automatically updates database with custom images
 * - Never overwrites existing custom images
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { db } from './server/db.js';
import { loadCustomImageMap, saveCustomImageMap, updateCustomImageMap } from './server/image-preservator.js';

// Get the current file's directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the custom images directory
const CUSTOM_IMAGES_DIR = path.join(__dirname, 'client', 'public', 'custom-images');
const PUBLIC_IMAGES_DIR = path.join(__dirname, 'public', 'custom-images');

// Create directories if they don't exist
if (!fs.existsSync(CUSTOM_IMAGES_DIR)) {
  fs.mkdirSync(CUSTOM_IMAGES_DIR, { recursive: true });
  console.log(`Created custom images directory: ${CUSTOM_IMAGES_DIR}`);
}

if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
  fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
  console.log(`Created public directory symlink: ${PUBLIC_IMAGES_DIR}`);
}

/**
 * Extract images from a zip file
 */
async function extractImagesFromZip(zipFilePath) {
  console.log(`Extracting images from ${zipFilePath}`);
  
  try {
    // Open the zip file
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();
    
    // Count of images extracted
    let extractedCount = 0;
    
    // Extract each image file
    for (const entry of zipEntries) {
      // Skip directories and non-image files
      if (entry.isDirectory || !isImageFile(entry.name)) {
        continue;
      }
      
      // Clean the filename (remove any path info)
      const fileName = path.basename(entry.entryName);
      
      // Extract to the custom images directory
      zip.extractEntryTo(entry, CUSTOM_IMAGES_DIR, false, true);
      
      // Also copy to the public directory for development mode
      const entryData = zip.readFile(entry);
      fs.writeFileSync(path.join(PUBLIC_IMAGES_DIR, fileName), entryData);
      
      extractedCount++;
      
      console.log(`Extracted: ${fileName}`);
    }
    
    console.log(`Extracted ${extractedCount} images to ${CUSTOM_IMAGES_DIR}`);
    return true;
  } catch (err) {
    console.error('Error extracting zip file:', err);
    return false;
  }
}

/**
 * Check if a file is an image based on extension
 */
function isImageFile(filename) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

/**
 * Map images to shows based on filename matches
 */
async function mapImagesToShows() {
  console.log('Mapping images to shows based on filenames...');
  
  try {
    // Get all image files in the custom images directory
    const imageFiles = fs.readdirSync(CUSTOM_IMAGES_DIR)
      .filter(file => isImageFile(file));
    
    console.log(`Found ${imageFiles.length} image files`);
    
    // Get all shows from the database
    const shows = await db.query('SELECT id, name FROM tv_shows');
    
    console.log(`Found ${shows.rows.length} shows in the database`);
    
    // Load the existing custom image map
    const customImageMap = loadCustomImageMap();
    let newMappingsCount = 0;
    
    // Map each image file to a show if the filename matches
    for (const imageFile of imageFiles) {
      const imagePath = '/custom-images/' + imageFile;
      
      // Skip already mapped images to prevent duplicate assignments
      const existingMapping = Object.values(customImageMap).find(url => url === imagePath);
      if (existingMapping) {
        console.log(`Image ${imageFile} is already mapped, skipping`);
        continue;
      }
      
      // Try to find a show that matches the image filename
      const matchingShow = findMatchingShow(shows.rows, imageFile);
      
      if (matchingShow) {
        // Update the custom image map
        customImageMap[matchingShow.id] = imagePath;
        newMappingsCount++;
        
        console.log(`Mapped image ${imageFile} to show: ${matchingShow.name} (ID: ${matchingShow.id})`);
      } else {
        console.log(`Could not find a matching show for image: ${imageFile}`);
      }
    }
    
    // Save the updated custom image map
    saveCustomImageMap(customImageMap);
    
    console.log(`Added ${newMappingsCount} new image mappings to customImageMap.json`);
    
    return customImageMap;
  } catch (err) {
    console.error('Error mapping images to shows:', err);
    return null;
  }
}

/**
 * Find a show that matches an image filename
 */
function findMatchingShow(shows, imageFilename) {
  // Remove extension and convert to lowercase
  const baseFilename = path.basename(imageFilename, path.extname(imageFilename)).toLowerCase();
  
  // Try exact match first
  for (const show of shows) {
    if (show.name.toLowerCase() === baseFilename) {
      return show;
    }
  }
  
  // Try partial match
  for (const show of shows) {
    if (baseFilename.includes(show.name.toLowerCase()) || 
        show.name.toLowerCase().includes(baseFilename)) {
      return show;
    }
  }
  
  return null;
}

/**
 * Update the database with the custom image URLs
 */
async function updateDatabaseWithImages(customImageMap) {
  console.log('Updating database with custom image URLs...');
  
  try {
    // Convert to an array of promises to update each show
    const updatePromises = Object.entries(customImageMap).map(async ([showId, imageUrl]) => {
      const result = await db.query(
        'UPDATE tv_shows SET "imageUrl" = $1 WHERE id = $2 RETURNING id, name, "imageUrl"',
        [imageUrl, showId]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      return null;
    });
    
    // Execute all update queries
    const results = await Promise.all(updatePromises);
    
    // Filter out null results
    const updatedShows = results.filter(Boolean);
    
    console.log(`Updated ${updatedShows.length} shows in the database with custom images`);
    
    return updatedShows;
  } catch (err) {
    console.error('Error updating database with images:', err);
    return [];
  }
}

/**
 * Process a specific image for a specific show ID
 */
async function processImageForShow(showId, imageFile) {
  console.log(`Processing image ${imageFile} for show ID ${showId}`);
  
  try {
    // Copy image to custom images directory if it's not already there
    const sourceFile = path.resolve(imageFile);
    
    if (!fs.existsSync(sourceFile)) {
      console.error(`Source image file does not exist: ${sourceFile}`);
      return false;
    }
    
    const fileName = path.basename(sourceFile);
    const destFile = path.join(CUSTOM_IMAGES_DIR, fileName);
    const publicDestFile = path.join(PUBLIC_IMAGES_DIR, fileName);
    
    fs.copyFileSync(sourceFile, destFile);
    fs.copyFileSync(sourceFile, publicDestFile);
    
    // Update the custom image map
    const imagePath = '/custom-images/' + fileName;
    updateCustomImageMap(showId, imagePath);
    
    // Update the database
    const result = await db.query(
      'UPDATE tv_shows SET "imageUrl" = $1 WHERE id = $2 RETURNING id, name, "imageUrl"',
      [imagePath, showId]
    );
    
    if (result.rows.length > 0) {
      console.log(`Updated show ${result.rows[0].name} (ID: ${showId}) with image: ${imagePath}`);
      return true;
    }
    
    console.error(`Could not update show with ID ${showId}`);
    return false;
  } catch (err) {
    console.error(`Error processing image for show ${showId}:`, err);
    return false;
  }
}

/**
 * Main function to run the import
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Please provide the path to the zip file containing custom images');
    console.log('Usage: node import-custom-images.js path/to/images.zip');
    console.log('Or to process a single image: node import-custom-images.js --show-id=123 path/to/image.jpg');
    return;
  }
  
  // Check if processing a single image for a specific show
  if (args[0].startsWith('--show-id=')) {
    const showId = parseInt(args[0].split('=')[1]);
    const imageFile = args[1];
    
    if (isNaN(showId) || !imageFile) {
      console.error('Invalid arguments. Usage: node import-custom-images.js --show-id=123 path/to/image.jpg');
      return;
    }
    
    const success = await processImageForShow(showId, imageFile);
    
    if (success) {
      console.log('Successfully processed image for show');
    } else {
      console.error('Failed to process image for show');
    }
    
    return;
  }
  
  // Process a zip file
  const zipFilePath = args[0];
  
  if (!fs.existsSync(zipFilePath)) {
    console.error(`File not found: ${zipFilePath}`);
    return;
  }
  
  const success = await extractImagesFromZip(zipFilePath);
  
  if (success) {
    // Map images to shows
    const customImageMap = await mapImagesToShows();
    
    if (customImageMap) {
      // Update the database
      const updatedShows = await updateDatabaseWithImages(customImageMap);
      
      console.log(`Completed processing ${updatedShows.length} custom images`);
    }
  }
}

// Run the main function
main().catch(console.error);