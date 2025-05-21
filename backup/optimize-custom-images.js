/**
 * A script to optimize all custom images in the database for SEO
 * This improves page load times and overall performance
 */
import { db } from './server/db.js';
import sharp from 'sharp';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCustomImageMap, saveCustomImageMap, updateCustomImageMap } from './server/image-preservator.js';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories if they don't exist
const imageDir = './public/uploads';
const optimizedImageDir = './public/uploads/optimized';

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(optimizedImageDir)) {
  fs.mkdirSync(optimizedImageDir, { recursive: true });
}

/**
 * Downloads an image from URL and returns the local file path
 */
async function downloadImage(url, showId) {
  try {
    // Skip if URL is null or already an optimized path
    if (!url || url.includes('/uploads/optimized/')) {
      return null;
    }

    // For local images that are already in our uploads directory
    if (url.startsWith('/uploads/')) {
      const localPath = path.join('.', url); // e.g. ./uploads/some-image.jpg
      if (fs.existsSync(localPath)) {
        return localPath;
      }
    }

    // For external URLs, download the image
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download image for show ID ${showId}: ${url}`);
      return null;
    }

    const buffer = await response.buffer();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(url) || '.jpg'; // Default to .jpg if no extension
    const tempFilePath = path.join(imageDir, `show-${showId}-${uniqueSuffix}${ext}`);
    
    fs.writeFileSync(tempFilePath, buffer);
    console.log(`Downloaded image for show ID ${showId} to ${tempFilePath}`);
    return tempFilePath;
  } catch (error) {
    console.error(`Error downloading image for show ID ${showId}:`, error);
    return null;
  }
}

/**
 * Optimizes an image for web use - similar to server/image-upload.ts
 */
async function optimizeImage(filePath, showId) {
  const ext = path.extname(filePath);
  const filename = path.basename(filePath, ext);
  const optimizedPath = path.join(optimizedImageDir, `${filename}-optimized.jpg`);
  
  try {
    // Get image dimensions
    const metadata = await sharp(filePath).metadata();
    
    // Default values if metadata isn't available
    const originalWidth = metadata.width || 800;
    const originalHeight = metadata.height || 600;
    
    // Target sizes for portrait format
    let targetWidth;
    let targetHeight;

    // If the original is already portrait or square, maintain aspect ratio but limit max dimensions
    if (originalHeight >= originalWidth) {
      // It's already portrait or square
      targetWidth = Math.min(originalWidth, 600); // Max width of 600px
      targetHeight = Math.round((targetWidth / originalWidth) * originalHeight);

      // Ensure height doesn't exceed 900px (for very tall images)
      if (targetHeight > 900) {
        targetHeight = 900;
        targetWidth = Math.round((targetHeight / originalHeight) * originalWidth);
      }
    } else {
      // It's landscape, convert to portrait-friendly dimensions
      targetHeight = Math.min(originalHeight, 800); // Max height of 800px
      targetWidth = Math.min(originalWidth, Math.round(targetHeight * 0.75)); // Width about 75% of height for 3:4 ratio
    }

    // Process the image with sharp
    await sharp(filePath)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .jpeg({ quality: 85, progressive: true }) // Good balance of quality and file size
      .toFile(optimizedPath);
    
    console.log(`Image optimized: ${optimizedPath} (${targetWidth}x${targetHeight})`);
    
    return `/uploads/optimized/${path.basename(optimizedPath)}`;
  } catch (error) {
    console.error(`Error optimizing image for show ID ${showId}:`, error);
    return null;
  }
}

/**
 * Updates a show's image URL in the database
 */
async function updateShowImageUrl(showId, imageUrl) {
  try {
    // Update the database with the new image URL
    const result = await db.query(
      'UPDATE tv_shows SET image_url = $1 WHERE id = $2 RETURNING id, name',
      [imageUrl, showId]
    );
    
    if (result.rowCount === 1) {
      console.log(`Updated image URL for show ID ${showId}: ${result.rows[0].name}`);
      return true;
    } else {
      console.error(`Failed to update image URL for show ID ${showId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating image URL for show ID ${showId}:`, error);
    return false;
  }
}

/**
 * Main function to process and optimize all custom images in the database
 */
async function optimizeAllCustomImages() {
  try {
    // Get custom image mapping
    const customImageMap = loadCustomImageMap();
    let optimizedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Get all shows with custom images
    const result = await db.query(
      'SELECT id, name, image_url FROM tv_shows WHERE image_url IS NOT NULL'
    );
    
    console.log(`Found ${result.rowCount} shows with images to process`);
    
    // Process each show's image
    for (const show of result.rows) {
      try {
        // Skip OMDB images
        if (show.image_url?.includes('m.media-amazon.com') || show.image_url?.includes('omdbapi.com')) {
          console.log(`Skipping OMDB image for show ID ${show.id}: ${show.name}`);
          skippedCount++;
          continue;
        }
        
        // Skip already optimized images
        if (show.image_url?.includes('/uploads/optimized/')) {
          console.log(`Skipping already optimized image for show ID ${show.id}: ${show.name}`);
          skippedCount++;
          continue;
        }
        
        console.log(`\nProcessing image for show ID ${show.id}: ${show.name}`);
        console.log(`Current image URL: ${show.image_url}`);
        
        // Download the image
        const localImagePath = await downloadImage(show.image_url, show.id);
        if (!localImagePath) {
          console.warn(`Couldn't download image for show ID ${show.id}: ${show.name}`);
          errorCount++;
          continue;
        }
        
        // Optimize the image
        const optimizedImageUrl = await optimizeImage(localImagePath, show.id);
        if (!optimizedImageUrl) {
          console.warn(`Couldn't optimize image for show ID ${show.id}: ${show.name}`);
          errorCount++;
          continue;
        }
        
        // Update the database and custom image map
        const updated = await updateShowImageUrl(show.id, optimizedImageUrl);
        if (updated) {
          // Update custom image map to preserve this optimization
          updateCustomImageMap(show.id, optimizedImageUrl);
          optimizedCount++;
        } else {
          errorCount++;
        }
        
        // Clean up original downloaded file if it's in our temporary directory
        if (localImagePath.startsWith(imageDir)) {
          try {
            fs.unlinkSync(localImagePath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      } catch (error) {
        console.error(`Error processing image for show ID ${show.id}:`, error);
        errorCount++;
      }
    }
    
    // Save updated custom image map
    saveCustomImageMap(customImageMap);
    
    console.log('\nImage optimization complete:');
    console.log(`- Optimized: ${optimizedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total processed: ${result.rowCount}`);
    
  } catch (error) {
    console.error('Error in optimizeAllCustomImages:', error);
  } finally {
    // Close database connection
    await db.end();
  }
}

// Run the optimization
console.log('Starting SEO optimization of all custom images...');
optimizeAllCustomImages().then(() => {
  console.log('Image optimization process complete.');
}).catch(err => {
  console.error('Fatal error in image optimization process:', err);
});

// Convert this file to an ES module
export {};