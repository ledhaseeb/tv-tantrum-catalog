/**
 * Image Migration and Optimization Script
 * 
 * This script connects to the original database, fetches all TV show images,
 * downloads and optimizes them for SEO, then updates the catalog database
 * with the new optimized image URLs.
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Original database connection
const originalDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZH3VF9BEjlyk@ep-small-cloud-a46us4xp.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Current catalog database connection
const catalogDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Ensure directories exist
async function ensureDirectories() {
  const dirs = [
    'public/images',
    'public/images/shows',
    'public/images/optimized'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`Error creating directory ${dir}:`, error);
      }
    }
  }
}

// Download image from URL
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    }).on('error', reject);
  });
}

// Optimize image for web and SEO
async function optimizeImage(inputBuffer, outputPath, showName, showId) {
  try {
    const optimized = await sharp(inputBuffer)
      .resize(400, 600, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        mozjpeg: true
      })
      .toBuffer();
    
    const filename = `show-${showId}-${showName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
    const fullPath = path.join(outputPath, filename);
    
    await fs.writeFile(fullPath, optimized);
    console.log(`Optimized image saved: ${filename}`);
    return `/images/optimized/${filename}`;
  } catch (error) {
    console.error(`Error optimizing image for ${showName}:`, error);
    return null;
  }
}

// Fetch all TV shows from original database
async function fetchOriginalShows() {
  try {
    const result = await originalDb.query(`
      SELECT 
        id, name, image_url
      FROM tv_shows 
      WHERE image_url IS NOT NULL 
        AND image_url != ''
        AND image_url NOT LIKE '/placeholder%'
        AND image_url NOT LIKE '/api/placeholder%'
      ORDER BY id
    `);
    
    console.log(`Found ${result.rows.length} shows with authentic images in original database`);
    return result.rows;
  } catch (error) {
    console.error('Error fetching original shows:', error);
    return [];
  }
}

// Update catalog database with new image URL
async function updateCatalogImage(showName, imageUrl) {
  try {
    const result = await catalogDb.query(`
      UPDATE catalog_tv_shows 
      SET image_url = $1 
      WHERE name = $2
    `, [imageUrl, showName]);
    
    if (result.rowCount > 0) {
      console.log(`Updated ${showName} with image: ${imageUrl}`);
      return true;
    } else {
      console.log(`No matching show found in catalog for: ${showName}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating catalog for ${showName}:`, error);
    return false;
  }
}

// Process a single show's image
async function processShowImage(show) {
  const { id, name, image_url } = show;
  const imageUrl = image_url;
  
  if (!imageUrl) {
    console.log(`No image URL for ${name}`);
    return;
  }
  
  // Skip if already processed or is a local path
  if (imageUrl.startsWith('/') || imageUrl.includes('localhost')) {
    console.log(`Skipping local image for ${name}: ${imageUrl}`);
    return;
  }
  
  try {
    console.log(`Processing ${name}: ${imageUrl}`);
    
    // Download the image
    const imageBuffer = await downloadImage(imageUrl, `${id}-${name}`);
    
    // Optimize and save
    const optimizedUrl = await optimizeImage(
      imageBuffer, 
      'public/images/optimized', 
      name, 
      id
    );
    
    if (optimizedUrl) {
      // Update catalog database
      await updateCatalogImage(name, optimizedUrl);
    }
    
  } catch (error) {
    console.error(`Error processing ${name}:`, error);
  }
}

// Main migration function
async function migrateImages() {
  console.log('Starting image migration from original database...');
  
  try {
    // Ensure directories exist
    await ensureDirectories();
    
    // Fetch all shows from original database
    const originalShows = await fetchOriginalShows();
    
    if (originalShows.length === 0) {
      console.log('No shows with images found in original database');
      return;
    }
    
    // Process each show's image
    let processed = 0;
    let successful = 0;
    
    for (const show of originalShows) {
      await processShowImage(show);
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${originalShows.length} shows...`);
      }
      
      // Add small delay to avoid overwhelming external servers
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nImage migration complete!`);
    console.log(`Processed: ${processed} shows`);
    console.log(`Check public/images/optimized/ for the new optimized images`);
    
  } catch (error) {
    console.error('Error during image migration:', error);
  } finally {
    await originalDb.end();
    await catalogDb.end();
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateImages().catch(console.error);
}

export { migrateImages };