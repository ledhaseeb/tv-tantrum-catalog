/**
 * Batch Image Migration Script
 * Processes images in smaller batches to complete the full migration
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';
import sharp from 'sharp';

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
    }).on('error', reject).setTimeout(10000, () => {
      reject(new Error('Download timeout'));
    });
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
    console.log(`Optimized: ${filename}`);
    return `/images/optimized/${filename}`;
  } catch (error) {
    console.error(`Error optimizing ${showName}:`, error);
    return null;
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
      console.log(`Updated ${showName}`);
      return true;
    } else {
      console.log(`No match for: ${showName}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating ${showName}:`, error);
    return false;
  }
}

// Get shows that still need image migration
async function getUnmigratedShows() {
  try {
    // First get shows from original database with external image URLs
    const originalShows = await originalDb.query(`
      SELECT id, name, image_url
      FROM tv_shows
      WHERE image_url IS NOT NULL 
        AND image_url != ''
        AND image_url NOT LIKE '/placeholder%'
        AND image_url NOT LIKE '/api/placeholder%'
        AND image_url NOT LIKE '/media/tv-shows/%'
        AND image_url LIKE 'http%'
      ORDER BY id
    `);
    
    // Then find matching shows in catalog that need migration
    const catalogShows = await catalogDb.query(`
      SELECT name, image_url
      FROM catalog_tv_shows
      WHERE (image_url LIKE '/placeholder%' OR image_url LIKE '/api/placeholder%')
    `);
    
    // Match shows by name
    const matches = [];
    for (const original of originalShows.rows) {
      for (const catalog of catalogShows.rows) {
        if (original.name.toLowerCase().trim() === catalog.name.toLowerCase().trim()) {
          matches.push({
            catalog_name: catalog.name,
            id: original.id,
            original_name: original.name,
            image_url: original.image_url
          });
          break;
        }
      }
    }
    
    console.log(`Found ${matches.length} shows needing migration`);
    return matches.slice(0, 50); // Process in batches of 50
  } catch (error) {
    console.error('Error fetching unmigrated shows:', error);
    return [];
  }
}

// Process a single show's image
async function processShowImage(show) {
  const { catalog_name, id, original_name, image_url } = show;
  
  if (!image_url || image_url.startsWith('/')) {
    return;
  }
  
  try {
    console.log(`Processing ${catalog_name}: ${image_url}`);
    
    const imageBuffer = await downloadImage(image_url, `${id}-${original_name}`);
    const optimizedUrl = await optimizeImage(
      imageBuffer, 
      'public/images/optimized', 
      catalog_name, 
      id
    );
    
    if (optimizedUrl) {
      await updateCatalogImage(catalog_name, optimizedUrl);
      return true;
    }
    
  } catch (error) {
    console.error(`Error processing ${catalog_name}:`, error);
  }
  return false;
}

// Main migration function
async function migrateBatch() {
  console.log('Starting batch image migration...');
  
  try {
    // Ensure directory exists
    await fs.mkdir('public/images/optimized', { recursive: true });
    
    // Get unmigrated shows
    const shows = await getUnmigratedShows();
    
    if (shows.length === 0) {
      console.log('No shows found needing migration');
      return;
    }
    
    let processed = 0;
    let successful = 0;
    
    for (const show of shows) {
      const success = await processShowImage(show);
      if (success) successful++;
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`Batch progress: ${processed}/${shows.length}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\nBatch complete! Processed: ${processed}, Successful: ${successful}`);
    
  } catch (error) {
    console.error('Error during batch migration:', error);
  } finally {
    await originalDb.end();
    await catalogDb.end();
  }
}

// Run the migration
migrateBatch().catch(console.error);