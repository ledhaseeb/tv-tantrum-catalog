/**
 * Complete Image Migration Script
 * Fetches all remaining authentic images from the original database
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

// Download image with timeout and retry
async function downloadImage(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const req = protocol.get(url, { timeout: 15000 }, (response) => {
        if (response.statusCode === 200) {
          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
        } else if (remaining > 0) {
          console.log(`Retrying ${url} (${remaining} attempts left)`);
          setTimeout(() => attempt(remaining - 1), 1000);
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      });
      
      req.on('error', (error) => {
        if (remaining > 0) {
          console.log(`Network error, retrying ${url}`);
          setTimeout(() => attempt(remaining - 1), 1000);
        } else {
          reject(error);
        }
      });
      
      req.setTimeout(15000, () => {
        req.destroy();
        if (remaining > 0) {
          attempt(remaining - 1);
        } else {
          reject(new Error('Timeout'));
        }
      });
    };
    
    attempt(retries);
  });
}

// Optimize image for web performance
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
    
    const filename = `show-${showId}-${showName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
    const fullPath = path.join('public/images/optimized', filename);
    
    await fs.writeFile(fullPath, optimized);
    return `/images/optimized/${filename}`;
  } catch (error) {
    console.error(`Optimization failed for ${showName}:`, error.message);
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
    
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Database update failed for ${showName}:`, error.message);
    return false;
  }
}

// Get all shows needing migration
async function getAllUnmigratedShows() {
  try {
    // Get all shows from original database with external URLs
    const originalResult = await originalDb.query(`
      SELECT id, name, image_url
      FROM tv_shows
      WHERE image_url IS NOT NULL 
        AND image_url != ''
        AND image_url LIKE 'http%'
      ORDER BY id
    `);
    
    // Get catalog shows that need migration
    const catalogResult = await catalogDb.query(`
      SELECT name
      FROM catalog_tv_shows
      WHERE image_url LIKE '/placeholder%' 
        OR image_url LIKE '/api/placeholder%'
        OR image_url LIKE '/media/tv-shows/%'
    `);
    
    const catalogSet = new Set(catalogResult.rows.map(row => row.name.toLowerCase().trim()));
    
    // Filter original shows to only those in catalog needing migration
    const matches = originalResult.rows.filter(original => 
      catalogSet.has(original.name.toLowerCase().trim())
    );
    
    console.log(`Found ${matches.length} shows with external images needing migration`);
    return matches;
  } catch (error) {
    console.error('Error fetching shows:', error);
    return [];
  }
}

// Process images in parallel batches
async function processBatch(shows, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < shows.length; i += batchSize) {
    const batch = shows.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(shows.length/batchSize)} (${batch.length} shows)`);
    
    const batchPromises = batch.map(async (show) => {
      try {
        console.log(`Downloading: ${show.name}`);
        const imageBuffer = await downloadImage(show.image_url);
        
        const optimizedUrl = await optimizeImage(imageBuffer, show.name, show.id);
        if (!optimizedUrl) return { success: false, name: show.name, error: 'Optimization failed' };
        
        const updated = await updateCatalogImage(show.name, optimizedUrl);
        if (!updated) return { success: false, name: show.name, error: 'Database update failed' };
        
        console.log(`✓ Completed: ${show.name}`);
        return { success: true, name: show.name };
        
      } catch (error) {
        console.error(`✗ Failed: ${show.name} - ${error.message}`);
        return { success: false, name: show.name, error: error.message };
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(r => r.value || r.reason));
    
    // Brief pause between batches
    if (i + batchSize < shows.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

// Main migration function
async function completeImageMigration() {
  console.log('Starting complete image migration from original database...');
  
  try {
    await fs.mkdir('public/images/optimized', { recursive: true });
    
    const shows = await getAllUnmigratedShows();
    if (shows.length === 0) {
      console.log('No shows found needing migration');
      return;
    }
    
    console.log(`Starting migration of ${shows.length} shows...`);
    const results = await processBatch(shows);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);
    
    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`Successful: ${successful}/${shows.length}`);
    console.log(`Failed: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\nFailed shows:');
      failed.forEach(f => console.log(`- ${f.name}: ${f.error}`));
    }
    
    // Final status check
    const statusResult = await catalogDb.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN image_url LIKE '/images/optimized/%' THEN 1 END) as migrated,
        COUNT(CASE WHEN image_url LIKE '/custom-images/%' THEN 1 END) as custom,
        COUNT(CASE WHEN image_url LIKE '/placeholder%' OR image_url LIKE '/api/placeholder%' THEN 1 END) as placeholders
      FROM catalog_tv_shows
    `);
    
    const status = statusResult.rows[0];
    console.log(`\nFinal Status:`);
    console.log(`Total shows: ${status.total}`);
    console.log(`Migrated images: ${status.migrated}`);
    console.log(`Custom images: ${status.custom}`);
    console.log(`Placeholders: ${status.placeholders}`);
    console.log(`Images with data: ${parseInt(status.migrated) + parseInt(status.custom)}`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await originalDb.end();
    await catalogDb.end();
  }
}

// Run the complete migration
completeImageMigration().catch(console.error);