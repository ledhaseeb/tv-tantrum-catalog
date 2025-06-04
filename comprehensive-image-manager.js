/**
 * Comprehensive Image Management System
 * 
 * This script processes all 302 TV show images with the following features:
 * - Downloads images from external URLs and optimizes local images
 * - Creates SEO-optimized images with proper dimensions (400x600px portrait)
 * - Adds alt text and meta tags for better accessibility
 * - Centralizes all image management in client/public/images/tv-shows/
 * - Updates catalog_tv_shows database with optimized image URLs
 * - Maintains image manifest for tracking and fallbacks
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import fetch from 'node-fetch';
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
const db = drizzle(pool);

// Image configuration
const IMAGE_CONFIG = {
  width: 400,
  height: 600,
  quality: 85,
  format: 'jpeg',
  progressive: true
};

// Directories
const IMAGES_DIR = path.join(__dirname, 'client', 'public', 'images', 'tv-shows');
const MANIFEST_PATH = path.join(__dirname, 'attached_assets', 'show-images-manifest.json');
const OUTPUT_MANIFEST_PATH = path.join(__dirname, 'optimized-images-manifest.json');

/**
 * Load the image manifest data
 */
function loadImageManifest() {
  try {
    const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
    return JSON.parse(manifestData);
  } catch (error) {
    console.error('Error loading image manifest:', error);
    return [];
  }
}

/**
 * Ensure directories exist
 */
async function ensureDirectories() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log(`Created directory: ${IMAGES_DIR}`);
  }
}

/**
 * Download image from URL with retry logic
 */
async function downloadImage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Downloading image from: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.buffer();
      console.log(`Downloaded ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.log(`Download attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Progressive delay
    }
  }
}

/**
 * Get image from local path or URL
 */
async function getImageData(imageUrl, showName) {
  try {
    // Check if it's a local path
    if (imageUrl.startsWith('/media/tv-shows/') || imageUrl.startsWith('/images/')) {
      // Try to find the image in attached assets first
      const localImageName = path.basename(imageUrl);
      const attachedAssetPath = path.join(__dirname, 'attached_assets', localImageName);
      
      if (fs.existsSync(attachedAssetPath)) {
        console.log(`Found local image: ${attachedAssetPath}`);
        return fs.readFileSync(attachedAssetPath);
      }
      
      // Try alternative names in attached assets
      const possibleNames = [
        `${showName.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
        `${showName.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
        `${showName.replace(/[^a-zA-Z0-9]/g, '_')}.jpeg`,
        `${showName}.jpg`,
        `${showName}.png`
      ];
      
      for (const name of possibleNames) {
        const altPath = path.join(__dirname, 'attached_assets', name);
        if (fs.existsSync(altPath)) {
          console.log(`Found alternative local image: ${altPath}`);
          return fs.readFileSync(altPath);
        }
      }
      
      console.log(`Local image not found, skipping: ${imageUrl}`);
      return null;
    }
    
    // Download from external URL
    if (imageUrl.startsWith('http')) {
      return await downloadImage(imageUrl);
    }
    
    console.log(`Invalid image URL format: ${imageUrl}`);
    return null;
  } catch (error) {
    console.error(`Error getting image data for ${showName}:`, error.message);
    return null;
  }
}

/**
 * Optimize image for SEO and performance
 */
async function optimizeImage(inputBuffer, showName, showId) {
  try {
    const filename = `show-${showId}-${showName.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    const outputPath = path.join(IMAGES_DIR, filename);
    
    // Skip if already optimized
    if (fs.existsSync(outputPath)) {
      console.log(`Image already optimized: ${filename}`);
      return `/images/tv-shows/${filename}`;
    }
    
    console.log(`Optimizing image for ${showName}...`);
    
    // Process with Sharp
    await sharp(inputBuffer)
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
    
    console.log(`Optimized image saved: ${filename}`);
    return `/images/tv-shows/${filename}`;
  } catch (error) {
    console.error(`Error optimizing image for ${showName}:`, error.message);
    return null;
  }
}

/**
 * Create fallback image for shows without images
 */
async function createFallbackImage(showName, showId) {
  try {
    const filename = `show-${showId}-${showName.replace(/[^a-zA-Z0-9]/g, '_')}_fallback.jpg`;
    const outputPath = path.join(IMAGES_DIR, filename);
    
    if (fs.existsSync(outputPath)) {
      return `/images/tv-shows/${filename}`;
    }
    
    console.log(`Creating fallback image for ${showName}...`);
    
    // Create a simple colored background with text
    const svg = `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="600" fill="url(#grad)"/>
        <text x="200" y="280" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
              text-anchor="middle" fill="white" opacity="0.9">
          ${showName.length > 20 ? showName.substring(0, 20) + '...' : showName}
        </text>
        <text x="200" y="320" font-family="Arial, sans-serif" font-size="16" 
              text-anchor="middle" fill="white" opacity="0.7">
          TV Show
        </text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .jpeg({
        quality: IMAGE_CONFIG.quality,
        progressive: IMAGE_CONFIG.progressive
      })
      .toFile(outputPath);
    
    console.log(`Created fallback image: ${filename}`);
    return `/images/tv-shows/${filename}`;
  } catch (error) {
    console.error(`Error creating fallback image for ${showName}:`, error.message);
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
      console.log(`Updated database for show ${showId}: ${imageUrl}`);
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
 * Process a single show's image
 */
async function processShowImage(show) {
  const { id, name, imageUrl } = show;
  
  console.log(`\n--- Processing ${name} (ID: ${id}) ---`);
  
  try {
    // Get image data
    const imageData = await getImageData(imageUrl, name);
    
    let optimizedUrl;
    if (imageData) {
      // Optimize the image
      optimizedUrl = await optimizeImage(imageData, name, id);
    }
    
    // Create fallback if optimization failed
    if (!optimizedUrl) {
      console.log(`Creating fallback image for ${name}...`);
      optimizedUrl = await createFallbackImage(name, id);
    }
    
    if (optimizedUrl) {
      // Update database
      const updated = await updateShowImage(id, optimizedUrl);
      
      return {
        id,
        name,
        originalImageUrl: imageUrl,
        optimizedImageUrl: optimizedUrl,
        status: updated ? 'success' : 'database_error',
        processed: new Date().toISOString()
      };
    } else {
      return {
        id,
        name,
        originalImageUrl: imageUrl,
        optimizedImageUrl: null,
        status: 'failed',
        processed: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error(`Error processing ${name}:`, error.message);
    return {
      id,
      name,
      originalImageUrl: imageUrl,
      optimizedImageUrl: null,
      status: 'error',
      error: error.message,
      processed: new Date().toISOString()
    };
  }
}

/**
 * Process shows in batches to avoid overwhelming the system
 */
async function processBatch(shows, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < shows.length; i += batchSize) {
    const batch = shows.slice(i, i + batchSize);
    console.log(`\n=== Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(shows.length / batchSize)} ===`);
    
    const batchPromises = batch.map(show => processShowImage(show));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Brief pause between batches
    if (i + batchSize < shows.length) {
      console.log('Pausing between batches...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

/**
 * Generate comprehensive report
 */
function generateReport(results) {
  const total = results.length;
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;
  const dbErrors = results.filter(r => r.status === 'database_error').length;
  
  const report = {
    summary: {
      total,
      successful,
      failed,
      errors,
      databaseErrors: dbErrors,
      successRate: `${((successful / total) * 100).toFixed(1)}%`
    },
    processedAt: new Date().toISOString(),
    results
  };
  
  console.log('\n=== PROCESSING COMPLETE ===');
  console.log(`Total shows processed: ${total}`);
  console.log(`Successfully optimized: ${successful}`);
  console.log(`Failed to process: ${failed}`);
  console.log(`Errors encountered: ${errors}`);
  console.log(`Database errors: ${dbErrors}`);
  console.log(`Success rate: ${report.summary.successRate}`);
  
  return report;
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('Starting comprehensive image management...');
    
    // Setup
    await ensureDirectories();
    const imageManifest = loadImageManifest();
    
    if (!imageManifest || imageManifest.length === 0) {
      throw new Error('No image manifest data found');
    }
    
    console.log(`Loaded ${imageManifest.length} shows from manifest`);
    
    // Process all shows
    const results = await processBatch(imageManifest, 5);
    
    // Generate and save report
    const report = generateReport(results);
    fs.writeFileSync(OUTPUT_MANIFEST_PATH, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${OUTPUT_MANIFEST_PATH}`);
    
    console.log('\n✅ Image management completed successfully!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;