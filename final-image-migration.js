/**
 * Final Comprehensive Image Migration Script
 * Migrates all available authentic images from original database to catalog
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';
import sharp from 'sharp';

// Database connections
const originalDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZH3VF9BEjlyk@ep-small-cloud-a46us4xp.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const catalogDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Enhanced name normalization for matching
function normalizeShowName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Download with robust error handling
async function downloadImage(url, showName) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, { timeout: 20000 }, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          console.log(`✓ Downloaded ${showName}`);
          resolve(Buffer.concat(chunks));
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode} for ${showName}`));
      }
    });
    
    req.on('error', (error) => reject(new Error(`Network error for ${showName}: ${error.message}`)));
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error(`Timeout downloading ${showName}`));
    });
  });
}

// Optimize image with proper error handling
async function optimizeImage(inputBuffer, showName, showId) {
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
    
    const filename = `show-${showId}-${normalizeShowName(showName).replace(/\s+/g, '-')}.jpg`;
    const fullPath = path.join('public/images/optimized', filename);
    
    await fs.writeFile(fullPath, optimized);
    console.log(`✓ Optimized ${showName}`);
    return `/images/optimized/${filename}`;
  } catch (error) {
    console.error(`✗ Optimization failed for ${showName}: ${error.message}`);
    return null;
  }
}

// Update catalog database
async function updateCatalogImage(showName, imageUrl) {
  try {
    const result = await catalogDb.query(`
      UPDATE catalog_tv_shows 
      SET image_url = $1 
      WHERE name = $2
    `, [imageUrl, showName]);
    
    if (result.rowCount > 0) {
      console.log(`✓ Updated database for ${showName}`);
      return true;
    } else {
      console.log(`✗ No catalog match found for ${showName}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Database error for ${showName}: ${error.message}`);
    return false;
  }
}

// Get comprehensive show matching data
async function getShowsToMigrate() {
  try {
    // Get original shows with external images
    const originalResult = await originalDb.query(`
      SELECT id, name, image_url
      FROM tv_shows
      WHERE image_url IS NOT NULL 
        AND image_url != ''
        AND image_url LIKE 'http%'
      ORDER BY name
    `);
    
    // Get catalog shows needing images
    const catalogResult = await catalogDb.query(`
      SELECT name, image_url as current_url
      FROM catalog_tv_shows
      ORDER BY name
    `);
    
    console.log(`Original database: ${originalResult.rows.length} shows with external images`);
    console.log(`Catalog database: ${catalogResult.rows.length} total shows`);
    
    // Create normalized mappings
    const originalMap = new Map();
    originalResult.rows.forEach(show => {
      const normalized = normalizeShowName(show.name);
      originalMap.set(normalized, show);
    });
    
    const catalogMap = new Map();
    catalogResult.rows.forEach(show => {
      const normalized = normalizeShowName(show.name);
      catalogMap.set(normalized, show);
    });
    
    // Find matches that need migration
    const matches = [];
    for (const [normalizedName, originalShow] of originalMap) {
      if (catalogMap.has(normalizedName)) {
        const catalogShow = catalogMap.get(normalizedName);
        
        // Check if catalog show needs image migration
        const needsMigration = 
          catalogShow.current_url?.includes('/placeholder') ||
          catalogShow.current_url?.includes('/api/placeholder') ||
          catalogShow.current_url?.includes('/media/tv-shows/') ||
          !catalogShow.current_url;
        
        if (needsMigration) {
          matches.push({
            id: originalShow.id,
            name: catalogShow.name, // Use catalog name for database update
            originalName: originalShow.name,
            imageUrl: originalShow.image_url,
            currentUrl: catalogShow.current_url
          });
        }
      }
    }
    
    console.log(`Found ${matches.length} shows needing image migration`);
    return matches;
    
  } catch (error) {
    console.error('Error fetching shows:', error);
    return [];
  }
}

// Process shows in batches
async function processShows(shows) {
  const batchSize = 3; // Conservative batch size
  const results = { success: 0, failed: 0, errors: [] };
  
  for (let i = 0; i < shows.length; i += batchSize) {
    const batch = shows.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(shows.length / batchSize);
    
    console.log(`\nProcessing batch ${batchNum}/${totalBatches}`);
    
    for (const show of batch) {
      try {
        console.log(`\nProcessing: ${show.name}`);
        console.log(`Current URL: ${show.currentUrl}`);
        console.log(`Source URL: ${show.imageUrl}`);
        
        const imageBuffer = await downloadImage(show.imageUrl, show.name);
        const optimizedUrl = await optimizeImage(imageBuffer, show.name, show.id);
        
        if (optimizedUrl) {
          const updated = await updateCatalogImage(show.name, optimizedUrl);
          if (updated) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`${show.name}: Database update failed`);
          }
        } else {
          results.failed++;
          results.errors.push(`${show.name}: Image optimization failed`);
        }
        
      } catch (error) {
        results.failed++;
        results.errors.push(`${show.name}: ${error.message}`);
        console.error(`✗ Failed: ${show.name} - ${error.message}`);
      }
      
      // Pause between shows
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Pause between batches
    if (i + batchSize < shows.length) {
      console.log(`Pausing before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return results;
}

// Main migration function
async function runFinalMigration() {
  console.log('Starting final comprehensive image migration...');
  
  try {
    await fs.mkdir('public/images/optimized', { recursive: true });
    
    const shows = await getShowsToMigrate();
    
    if (shows.length === 0) {
      console.log('All shows already have proper images!');
      return;
    }
    
    console.log(`\nStarting migration of ${shows.length} shows...`);
    const results = await processShows(shows);
    
    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`Successful: ${results.success}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Total processed: ${results.success + results.failed}`);
    
    if (results.errors.length > 0) {
      console.log(`\nErrors encountered:`);
      results.errors.forEach(error => console.log(`- ${error}`));
    }
    
    // Final status check
    const finalStatus = await catalogDb.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN image_url LIKE '/images/optimized/%' THEN 1 END) as optimized,
        COUNT(CASE WHEN image_url LIKE '/custom-images/%' THEN 1 END) as custom,
        COUNT(CASE WHEN image_url LIKE '/placeholder%' OR image_url LIKE '/api/placeholder%' OR image_url LIKE '/media/tv-shows/%' THEN 1 END) as placeholders
      FROM catalog_tv_shows
    `);
    
    const status = finalStatus.rows[0];
    console.log(`\n=== FINAL STATUS ===`);
    console.log(`Total shows: ${status.total}`);
    console.log(`Optimized images: ${status.optimized}`);
    console.log(`Custom images: ${status.custom}`);
    console.log(`Placeholders: ${status.placeholders}`);
    console.log(`Total with images: ${parseInt(status.optimized) + parseInt(status.custom)}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await originalDb.end();
    await catalogDb.end();
  }
}

runFinalMigration().catch(console.error);