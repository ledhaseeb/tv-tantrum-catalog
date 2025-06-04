/**
 * TV Show Image Optimization Script
 * 
 * This script processes all 302 TV show images from the centralized directory:
 * - Optimizes images for web performance and SEO
 * - Converts to consistent format (JPEG/PNG as appropriate)
 * - Resizes to optimal dimensions (400x600px portrait)
 * - Updates database with new centralized image paths
 * - Creates a mapping of show names to optimized images
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Directories
const SOURCE_DIR = './public/images/shows';
const OPTIMIZED_DIR = './public/images/tv-shows';
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Get all TV shows from the database
 */
async function getAllTvShows() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, name FROM catalog_tv_shows ORDER BY name');
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Update a show's image URL in the database
 */
async function updateShowImageUrl(showId, imageUrl) {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE catalog_tv_shows SET image_url = $1 WHERE id = $2',
      [imageUrl, showId]
    );
    console.log(`Updated show ${showId} with image: ${imageUrl}`);
  } catch (error) {
    console.error(`Error updating show ${showId}:`, error.message);
  } finally {
    client.release();
  }
}

/**
 * Normalize text for filename matching
 */
function normalizeForMatch(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize spaces
    .trim();
}

/**
 * Find matching image file for a show name
 */
function findImageForShow(showName, imageFiles) {
  const normalizedShow = normalizeForMatch(showName);
  
  // Direct match first
  let match = imageFiles.find(file => {
    const normalizedFile = normalizeForMatch(path.parse(file).name);
    return normalizedFile === normalizedShow;
  });
  
  if (match) return match;
  
  // Partial match
  match = imageFiles.find(file => {
    const normalizedFile = normalizeForMatch(path.parse(file).name);
    return normalizedFile.includes(normalizedShow) || normalizedShow.includes(normalizedFile);
  });
  
  return match;
}

/**
 * Optimize an image for web use
 */
async function optimizeImage(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Determine output format
    const isTransparent = metadata.hasAlpha;
    const outputFormat = isTransparent ? 'png' : 'jpeg';
    
    // Optimize the image
    let pipeline = image
      .resize(400, 600, {
        fit: 'cover',
        position: 'center'
      });
    
    if (outputFormat === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: 85, progressive: true });
    } else {
      pipeline = pipeline.png({ compressionLevel: 8 });
    }
    
    await pipeline.toFile(outputPath);
    
    return {
      success: true,
      format: outputFormat,
      originalSize: metadata.size,
      dimensions: `${metadata.width}x${metadata.height}`
    };
  } catch (error) {
    console.error(`Error optimizing ${inputPath}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main optimization function
 */
async function optimizeAllImages() {
  console.log('Starting TV show image optimization...');
  
  // Create optimized directory
  if (!fs.existsSync(OPTIMIZED_DIR)) {
    fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
  }
  
  // Get all image files from source directory
  const allFiles = fs.readdirSync(SOURCE_DIR);
  const imageFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return SUPPORTED_FORMATS.includes(ext);
  });
  
  console.log(`Found ${imageFiles.length} image files to process`);
  
  // Get all TV shows from database
  const shows = await getAllTvShows();
  console.log(`Found ${shows.length} TV shows in database`);
  
  let processed = 0;
  let matched = 0;
  const unmatchedShows = [];
  const unmatchedImages = [...imageFiles];
  
  // Process each show
  for (const show of shows) {
    const imageFile = findImageForShow(show.name, imageFiles);
    
    if (imageFile) {
      matched++;
      unmatchedImages.splice(unmatchedImages.indexOf(imageFile), 1);
      
      const inputPath = path.join(SOURCE_DIR, imageFile);
      const ext = path.extname(imageFile).toLowerCase();
      const baseName = path.parse(imageFile).name;
      
      // Create clean filename for output
      const cleanName = show.name
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      const outputFilename = `${cleanName}.jpg`; // Standardize to JPEG
      const outputPath = path.join(OPTIMIZED_DIR, outputFilename);
      
      // Optimize the image
      const result = await optimizeImage(inputPath, outputPath);
      
      if (result.success) {
        // Update database with new image path
        const imageUrl = `/images/tv-shows/${outputFilename}`;
        await updateShowImageUrl(show.id, imageUrl);
        processed++;
        
        console.log(`✓ ${show.name} -> ${outputFilename}`);
      } else {
        console.error(`✗ Failed to optimize ${show.name}: ${result.error}`);
        unmatchedShows.push(show.name);
      }
    } else {
      unmatchedShows.push(show.name);
      console.log(`? No image found for: ${show.name}`);
    }
  }
  
  // Summary report
  console.log('\n=== OPTIMIZATION COMPLETE ===');
  console.log(`Successfully processed: ${processed} images`);
  console.log(`Matched shows: ${matched}/${shows.length}`);
  console.log(`Unmatched shows: ${unmatchedShows.length}`);
  console.log(`Unused images: ${unmatchedImages.length}`);
  
  if (unmatchedShows.length > 0) {
    console.log('\nUnmatched shows:');
    unmatchedShows.slice(0, 10).forEach(name => console.log(`  - ${name}`));
    if (unmatchedShows.length > 10) {
      console.log(`  ... and ${unmatchedShows.length - 10} more`);
    }
  }
  
  if (unmatchedImages.length > 0) {
    console.log('\nUnused images:');
    unmatchedImages.slice(0, 10).forEach(name => console.log(`  - ${name}`));
    if (unmatchedImages.length > 10) {
      console.log(`  ... and ${unmatchedImages.length - 10} more`);
    }
  }
  
  console.log('\nAll TV show images optimized and database updated!');
  console.log(`Images available at: ${OPTIMIZED_DIR}`);
}

// Run the optimization
optimizeAllImages()
  .then(() => {
    console.log('Image optimization completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during optimization:', error);
    process.exit(1);
  });

export { optimizeAllImages };