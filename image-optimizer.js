/**
 * Consolidated Image Optimization Utility
 * 
 * This script replaces multiple overlapping image optimization scripts:
 * - optimize-custom-images.js
 * - optimize-seo-images.js
 * 
 * Features:
 * - Optimizes images for better SEO and performance
 * - Handles both local and remote images
 * - Updates database with optimized image URLs
 * - Preserves custom image mappings
 * - Creates properly sized portrait-style images
 */

import { db } from './server/db.js';
import sharp from 'sharp';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories if they don't exist
const imageDir = './public/uploads';
const optimizedImageDir = './public/uploads/optimized';
const customImageMapPath = './data/custom-image-map.json';

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(optimizedImageDir)) {
  fs.mkdirSync(optimizedImageDir, { recursive: true });
}

/**
 * Load the custom image map from file
 */
function loadCustomImageMap() {
  try {
    if (fs.existsSync(customImageMapPath)) {
      const data = fs.readFileSync(customImageMapPath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading custom image map:', error);
    return {};
  }
}

/**
 * Save the custom image map to file
 */
function saveCustomImageMap(customImageMap) {
  try {
    fs.writeFileSync(customImageMapPath, JSON.stringify(customImageMap, null, 2));
    console.log('Custom image map saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving custom image map:', error);
    return false;
  }
}

/**
 * Update a single entry in the custom image map
 */
function updateCustomImageMap(showId, imageUrl) {
  try {
    const customImageMap = loadCustomImageMap();
    customImageMap[showId] = imageUrl;
    saveCustomImageMap(customImageMap);
    return true;
  } catch (error) {
    console.error(`Error updating custom image map for show ID ${showId}:`, error);
    return false;
  }
}

/**
 * Get all shows with custom images that need optimization
 */
async function getShowsWithCustomImages() {
  const query = `
    SELECT id, name, image_url 
    FROM tv_shows 
    WHERE image_url IS NOT NULL 
      AND image_url NOT LIKE '%/uploads/optimized/%'
      AND image_url NOT LIKE '%m.media-amazon.com%'
      AND image_url NOT LIKE '%omdbapi.com%'
  `;
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting shows with custom images:', error);
    return [];
  }
}

/**
 * Downloads or copies an image from URL or local path
 */
async function getImage(imageUrl, showId) {
  try {
    if (!imageUrl) {
      return null;
    }
    
    // Skip already optimized images
    if (imageUrl.includes('/uploads/optimized/')) {
      return null;
    }

    // Handle local file paths
    if (imageUrl.startsWith('/')) {
      // Try different possible locations
      const possiblePaths = [
        path.join('public', imageUrl),
        path.join('public', 'uploads', path.basename(imageUrl)),
        path.join('public', 'custom-images', path.basename(imageUrl)),
        path.join('public', 'images', path.basename(imageUrl)),
        path.join('attached_assets', path.basename(imageUrl)),
        imageUrl.substring(1) // Try without leading slash
      ];
      
      for (const localPath of possiblePaths) {
        if (fs.existsSync(localPath)) {
          console.log(`Found local image at ${localPath}`);
          
          // Create a copy in uploads directory
          const timestamp = Date.now();
          const uniqueFilename = `show-${showId}-${timestamp}${path.extname(localPath) || '.jpg'}`;
          const tempPath = path.join(imageDir, uniqueFilename);
          
          fs.copyFileSync(localPath, tempPath);
          return tempPath;
        }
      }
      
      console.log(`Could not find local image: ${imageUrl}`);
      return null;
    }
    
    // Download remote URLs
    if (imageUrl.startsWith('http')) {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.error(`Failed to download: ${response.status}`);
          return null;
        }
        
        const buffer = await response.buffer();
        const timestamp = Date.now();
        const uniqueFilename = `show-${showId}-${timestamp}.jpg`;
        const tempPath = path.join(imageDir, uniqueFilename);
        
        fs.writeFileSync(tempPath, buffer);
        return tempPath;
      } catch (error) {
        console.error(`Download error: ${error.message}`);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting image: ${error.message}`);
    return null;
  }
}

/**
 * Optimizes an image for web use
 */
async function optimizeImage(filePath, showId) {
  try {
    const ext = path.extname(filePath);
    const filename = path.basename(filePath, ext);
    const optimizedFilename = `${filename}-optimized.jpg`;
    const optimizedPath = path.join(optimizedImageDir, optimizedFilename);
    
    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;
    
    // Target portrait-style dimensions
    let targetWidth, targetHeight;
    
    if (height >= width) {
      // Already portrait
      targetWidth = Math.min(width, 600);
      targetHeight = Math.round((targetWidth / width) * height);
      
      // Cap height for very tall images
      if (targetHeight > 900) {
        targetHeight = 900;
        targetWidth = Math.round((targetHeight / height) * width);
      }
    } else {
      // Convert landscape to portrait-friendly
      targetHeight = Math.min(height, 800);
      targetWidth = Math.min(width, Math.round(targetHeight * 0.75));
    }
    
    // Optimize the image
    await sharp(filePath)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(optimizedPath);
    
    console.log(`Optimized to ${targetWidth}x${targetHeight}`);
    
    // Return web path
    return `/uploads/optimized/${optimizedFilename}`;
  } catch (error) {
    console.error(`Optimization error: ${error.message}`);
    return null;
  }
}

/**
 * Updates a show's image URL in the database
 */
async function updateShowImage(showId, optimizedUrl) {
  try {
    await db.query(
      'UPDATE tv_shows SET image_url = $1 WHERE id = $2 RETURNING id, name',
      [optimizedUrl, showId]
    );
    
    // Also update custom image map
    updateCustomImageMap(showId, optimizedUrl);
    
    return true;
  } catch (error) {
    console.error(`Database update error: ${error.message}`);
    return false;
  }
}

/**
 * Main function to optimize all images
 */
async function optimizeAllImages() {
  console.log('Starting image optimization process...');
  
  try {
    // Get shows that need optimization
    const shows = await getShowsWithCustomImages();
    console.log(`Found ${shows.length} shows with custom images to optimize`);
    
    let optimized = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each show
    for (const show of shows) {
      try {
        console.log(`\nProcessing: ${show.name} (ID: ${show.id})`);
        
        // Get image file
        const imagePath = await getImage(show.image_url, show.id);
        if (!imagePath) {
          console.log(`Skipping - could not access image for ${show.name}`);
          skipped++;
          continue;
        }
        
        // Optimize image
        const optimizedUrl = await optimizeImage(imagePath, show.id);
        if (!optimizedUrl) {
          console.error(`Failed to optimize image for ${show.name}`);
          errors++;
          continue;
        }
        
        // Update in database
        const updated = await updateShowImage(show.id, optimizedUrl);
        if (updated) {
          console.log(`✅ Successfully optimized image for ${show.name}`);
          optimized++;
        } else {
          console.error(`❌ Failed to update database for ${show.name}`);
          errors++;
        }
        
        // Clean up temp file
        try {
          if (imagePath.startsWith(imageDir)) {
            fs.unlinkSync(imagePath);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        
      } catch (error) {
        console.error(`Error processing ${show.name}: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\nOptimization complete:');
    console.log(`✅ Optimized: ${optimized}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${shows.length}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    // Close database connection when done
    await db.end();
  }
}

// Run the optimization when this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Starting image optimization as a direct script...');
  optimizeAllImages().catch(console.error);
}

// Export functions for use in other modules
export {
  optimizeImage,
  optimizeAllImages,
  updateShowImage,
  getImage,
  loadCustomImageMap,
  saveCustomImageMap,
  updateCustomImageMap
};