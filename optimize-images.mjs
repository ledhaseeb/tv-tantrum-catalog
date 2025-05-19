/**
 * Optimize custom images in the database for better SEO and page load times
 */
import { pool } from './server/db.js';
import sharp from 'sharp';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCustomImageMap, updateCustomImageMap, saveCustomImageMap } from './server/image-preservator.js';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const imageDir = path.join(__dirname, 'public/uploads');
const optimizedImageDir = path.join(__dirname, 'public/uploads/optimized');

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(optimizedImageDir)) {
  fs.mkdirSync(optimizedImageDir, { recursive: true });
}

/**
 * Download image from URL
 */
async function downloadImage(imageUrl, showId) {
  try {
    // Skip if URL is null or already an optimized path
    if (!imageUrl || imageUrl.includes('/uploads/optimized/')) {
      console.log(`Skipping already optimized or null image for show ID ${showId}`);
      return null;
    }
    
    // Skip OMDB images
    if (imageUrl.includes('m.media-amazon.com') || imageUrl.includes('omdbapi.com')) {
      console.log(`Skipping OMDB image for show ID ${showId}`);
      return null;
    }
    
    // For local images that are already in our uploads directory
    if (imageUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, 'public', imageUrl);
      if (fs.existsSync(localPath)) {
        console.log(`Using existing local image at ${localPath}`);
        return localPath;
      }
    }
    
    // Handle external URLs
    console.log(`Downloading image from URL: ${imageUrl}`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const buffer = await response.buffer();
    const timestamp = Date.now();
    const uniqueFilename = `show-${showId}-${timestamp}.jpg`;
    const tempFilePath = path.join(imageDir, uniqueFilename);
    
    fs.writeFileSync(tempFilePath, buffer);
    console.log(`Downloaded image to: ${tempFilePath}`);
    return tempFilePath;
    
  } catch (error) {
    console.error(`Error downloading image:`, error.message);
    return null;
  }
}

/**
 * Optimize image for web use
 */
async function optimizeImage(filePath, showId) {
  try {
    if (!filePath) return null;
    
    const filename = path.basename(filePath, path.extname(filePath));
    const optimizedFilename = `${filename}-optimized.jpg`;
    const optimizedPath = path.join(optimizedImageDir, optimizedFilename);
    
    // Get image dimensions
    const metadata = await sharp(filePath).metadata();
    const originalWidth = metadata.width || 800;
    const originalHeight = metadata.height || 600;
    
    // Target portrait format sizes
    let targetWidth, targetHeight;
    
    if (originalHeight >= originalWidth) {
      // Already portrait or square
      targetWidth = Math.min(originalWidth, 600);
      targetHeight = Math.round((targetWidth / originalWidth) * originalHeight);
      
      // Limit very tall images
      if (targetHeight > 900) {
        targetHeight = 900;
        targetWidth = Math.round((targetHeight / originalHeight) * originalWidth);
      }
    } else {
      // Landscape - convert to portrait-friendly dimensions
      targetHeight = Math.min(originalHeight, 800);
      targetWidth = Math.min(originalWidth, Math.round(targetHeight * 0.75));
    }
    
    // Process with sharp
    await sharp(filePath)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(optimizedPath);
    
    console.log(`Image optimized: ${optimizedPath} (${targetWidth}x${targetHeight})`);
    
    // Return web path to optimized image
    return `/uploads/optimized/${optimizedFilename}`;
    
  } catch (error) {
    console.error(`Error optimizing image:`, error.message);
    return null;
  }
}

/**
 * Main function to optimize all custom images
 */
async function optimizeAllCustomImages() {
  console.log('Starting image optimization process...');
  
  // Load custom image map
  const customImageMap = loadCustomImageMap();
  let optimizedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  try {
    // Get all shows with images that aren't already optimized
    const query = `
      SELECT id, name, image_url 
      FROM tv_shows 
      WHERE image_url IS NOT NULL 
        AND image_url NOT LIKE '%/uploads/optimized/%'
        AND image_url NOT LIKE '%m.media-amazon.com%'
        AND image_url NOT LIKE '%omdbapi.com%'
    `;
    
    const result = await pool.query(query);
    console.log(`Found ${result.rows.length} images to optimize`);
    
    // Process each image
    for (const show of result.rows) {
      try {
        console.log(`\nProcessing show: ${show.name} (ID: ${show.id})`);
        console.log(`Current image URL: ${show.image_url}`);
        
        // Download image
        const localPath = await downloadImage(show.image_url, show.id);
        if (!localPath) {
          console.log(`Skipping image for show ID ${show.id}: ${show.name}`);
          skippedCount++;
          continue;
        }
        
        // Optimize image
        const optimizedUrl = await optimizeImage(localPath, show.id);
        if (!optimizedUrl) {
          console.error(`Failed to optimize image for show ID ${show.id}`);
          errorCount++;
          continue;
        }
        
        // Update database
        const updateQuery = 'UPDATE tv_shows SET image_url = $1 WHERE id = $2';
        await pool.query(updateQuery, [optimizedUrl, show.id]);
        
        // Update custom image map
        updateCustomImageMap(show.id, optimizedUrl);
        optimizedCount++;
        
        console.log(`Updated image for ${show.name}: ${optimizedUrl}`);
        
        // Clean up temporary file
        if (localPath.startsWith(imageDir)) {
          fs.unlinkSync(localPath);
        }
        
      } catch (error) {
        console.error(`Error processing show ID ${show.id}:`, error.message);
        errorCount++;
      }
    }
    
    // Save updated custom image map
    saveCustomImageMap(customImageMap);
    
    console.log('\nOptimization complete:');
    console.log(`- Optimized: ${optimizedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total processed: ${result.rows.length}`);
    
  } catch (error) {
    console.error('Error during optimization process:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
optimizeAllCustomImages().catch(console.error);