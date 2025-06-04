/**
 * Update Specific Images Script
 * Processes the 3 provided images and optimizes them for SEO
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Image configuration for SEO optimization
const IMAGE_CONFIG = {
  width: 400,
  height: 600,
  quality: 85,
  format: 'jpeg',
  progressive: true
};

const IMAGES_DIR = path.join(__dirname, 'client', 'public', 'images', 'tv-shows');
const SOURCE_DIR = path.join(__dirname, 'attached_assets');

// Images to process
const imagesToProcess = [
  {
    id: 13,
    name: "Avatar: The Last Airbender",
    sourceFile: "show-13-Avatar__The_Last_Airbender.jpg",
    outputFile: "show-13-Avatar__The_Last_Airbender.jpg"
  },
  {
    id: 17,
    name: "Badanamu",
    sourceFile: "show-17-Badanamu.jpg", 
    outputFile: "show-17-Badanamu.jpg"
  },
  {
    id: 22,
    name: "Bear in the Big Blue House",
    sourceFile: "show-22-Bear_in_the_Big_Blue_House.jpg",
    outputFile: "show-22-Bear_in_the_Big_Blue_House.jpg"
  }
];

/**
 * Optimize image for SEO and performance
 */
async function optimizeImage(inputPath, outputPath, showName, showId) {
  try {
    console.log(`Optimizing ${showName}...`);
    
    await sharp(inputPath)
      .resize(IMAGE_CONFIG.width, IMAGE_CONFIG.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: IMAGE_CONFIG.quality,
        progressive: IMAGE_CONFIG.progressive,
        mozjpeg: true
      })
      .toFile(outputPath);
    
    console.log(`✓ Optimized: ${path.basename(outputPath)}`);
    return `/images/tv-shows/${path.basename(outputPath)}`;
  } catch (error) {
    console.error(`Error optimizing ${showName}:`, error.message);
    return null;
  }
}

/**
 * Update database with optimized image URL
 */
async function updateShowImage(showId, imageUrl) {
  try {
    const result = await pool.query(
      'UPDATE catalog_tv_shows SET image_url = $1 WHERE id = $2',
      [imageUrl, showId]
    );
    
    if (result.rowCount > 0) {
      console.log(`✓ Updated database for show ${showId}: ${imageUrl}`);
      return true;
    } else {
      console.log(`No rows updated for show ${showId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating database for show ${showId}:`, error.message);
    return false;
  }
}

/**
 * Main processing function
 */
async function processImages() {
  try {
    console.log('Processing specific images for SEO optimization...\n');
    
    let successCount = 0;
    
    for (const image of imagesToProcess) {
      const sourcePath = path.join(SOURCE_DIR, image.sourceFile);
      const outputPath = path.join(IMAGES_DIR, image.outputFile);
      
      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        console.log(`❌ Source file not found: ${image.sourceFile}`);
        continue;
      }
      
      // Optimize the image
      const optimizedUrl = await optimizeImage(sourcePath, outputPath, image.name, image.id);
      
      if (optimizedUrl) {
        // Update database
        const updated = await updateShowImage(image.id, optimizedUrl);
        if (updated) {
          successCount++;
        }
      }
      
      console.log(''); // Add spacing between images
    }
    
    console.log(`\n=== PROCESSING COMPLETE ===`);
    console.log(`Successfully processed: ${successCount}/${imagesToProcess.length} images`);
    console.log(`Images optimized for SEO with:`);
    console.log(`- Dimensions: ${IMAGE_CONFIG.width}x${IMAGE_CONFIG.height}px`);
    console.log(`- Quality: ${IMAGE_CONFIG.quality}%`);
    console.log(`- Progressive JPEG with mozjpeg compression`);
    console.log(`- Proper alt text and meta tags via image service`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
processImages();