/**
 * Comprehensive Image Fix Script
 * Migrates ALL available images from original database to catalog
 * Handles both external URLs and local optimized images
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

// Enhanced name normalization
function normalizeShowName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Download external image
async function downloadImage(url, showName) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, { timeout: 20000 }, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Optimize image
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
    return `/images/optimized/${filename}`;
  } catch (error) {
    console.error(`Optimization failed for ${showName}: ${error.message}`);
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
    console.error(`Database error for ${showName}: ${error.message}`);
    return false;
  }
}

// Get all shows with any type of image in original database
async function getAllShowsWithImages() {
  try {
    const originalResult = await originalDb.query(`
      SELECT id, name, image_url
      FROM tv_shows
      WHERE image_url IS NOT NULL 
        AND image_url != ''
        AND image_url != '/placeholder-show.svg'
        AND image_url NOT LIKE '/api/placeholder%'
      ORDER BY name
    `);
    
    const catalogResult = await catalogDb.query(`
      SELECT name, image_url as current_url
      FROM catalog_tv_shows
      ORDER BY name
    `);
    
    console.log(`Original database: ${originalResult.rows.length} shows with images`);
    console.log(`Catalog database: ${catalogResult.rows.length} total shows`);
    
    // Create name mappings
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
    
    // Find all possible matches to migrate
    const matches = [];
    for (const [normalizedName, originalShow] of originalMap) {
      if (catalogMap.has(normalizedName)) {
        const catalogShow = catalogMap.get(normalizedName);
        
        // Check if we should update this image
        const shouldUpdate = 
          catalogShow.current_url?.includes('/placeholder') ||
          catalogShow.current_url?.includes('/api/placeholder') ||
          catalogShow.current_url?.includes('/media/tv-shows/') ||
          !catalogShow.current_url;
        
        if (shouldUpdate) {
          matches.push({
            id: originalShow.id,
            catalogName: catalogShow.name,
            originalName: originalShow.name,
            imageUrl: originalShow.image_url,
            currentUrl: catalogShow.current_url,
            isExternal: originalShow.image_url.startsWith('http')
          });
        }
      }
    }
    
    console.log(`Found ${matches.length} shows that can be updated`);
    return matches;
    
  } catch (error) {
    console.error('Error fetching shows:', error);
    return [];
  }
}

// Process shows based on image type
async function processShow(show) {
  try {
    console.log(`\nProcessing: ${show.catalogName}`);
    console.log(`Current: ${show.currentUrl}`);
    console.log(`Source: ${show.imageUrl}`);
    
    if (show.isExternal) {
      // Download and optimize external image
      const imageBuffer = await downloadImage(show.imageUrl, show.catalogName);
      const optimizedUrl = await optimizeImage(imageBuffer, show.catalogName, show.id);
      
      if (optimizedUrl) {
        const updated = await updateCatalogImage(show.catalogName, optimizedUrl);
        if (updated) {
          console.log(`✓ Migrated external image for ${show.catalogName}`);
          return { success: true, type: 'external' };
        }
      }
    } else {
      // For local images, update to use the original path with proxy
      const updated = await updateCatalogImage(show.catalogName, show.imageUrl);
      if (updated) {
        console.log(`✓ Updated local image path for ${show.catalogName}`);
        return { success: true, type: 'local' };
      }
    }
    
    return { success: false, error: 'Processing failed' };
    
  } catch (error) {
    console.error(`✗ Failed: ${show.catalogName} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main migration function
async function runComprehensiveFix() {
  console.log('Starting comprehensive image migration and fix...');
  
  try {
    await fs.mkdir('public/images/optimized', { recursive: true });
    
    const shows = await getAllShowsWithImages();
    
    if (shows.length === 0) {
      console.log('No shows found that need image updates');
      return;
    }
    
    console.log(`\nProcessing ${shows.length} shows...`);
    
    const results = { 
      external: { success: 0, failed: 0 }, 
      local: { success: 0, failed: 0 },
      errors: [] 
    };
    
    for (const show of shows) {
      const result = await processShow(show);
      
      if (result.success) {
        results[result.type].success++;
      } else {
        if (show.isExternal) {
          results.external.failed++;
        } else {
          results.local.failed++;
        }
        results.errors.push(`${show.catalogName}: ${result.error}`);
      }
      
      // Brief pause between shows
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n=== COMPREHENSIVE MIGRATION COMPLETE ===`);
    console.log(`External images - Success: ${results.external.success}, Failed: ${results.external.failed}`);
    console.log(`Local images - Success: ${results.local.success}, Failed: ${results.local.failed}`);
    console.log(`Total successful: ${results.external.success + results.local.success}`);
    
    if (results.errors.length > 0) {
      console.log(`\nErrors encountered:`);
      results.errors.slice(0, 10).forEach(error => console.log(`- ${error}`));
      if (results.errors.length > 10) {
        console.log(`... and ${results.errors.length - 10} more errors`);
      }
    }
    
    // Final comprehensive status
    const finalStatus = await catalogDb.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN image_url LIKE '/images/optimized/%' THEN 1 END) as optimized,
        COUNT(CASE WHEN image_url LIKE '/custom-images/%' THEN 1 END) as custom,
        COUNT(CASE WHEN image_url LIKE '/media/tv-shows/%' THEN 1 END) as original_paths,
        COUNT(CASE WHEN image_url LIKE 'http%' THEN 1 END) as external,
        COUNT(CASE WHEN image_url LIKE '/placeholder%' OR image_url LIKE '/api/placeholder%' THEN 1 END) as placeholders
      FROM catalog_tv_shows
    `);
    
    const status = finalStatus.rows[0];
    console.log(`\n=== FINAL COMPREHENSIVE STATUS ===`);
    console.log(`Total shows: ${status.total}`);
    console.log(`Optimized images: ${status.optimized}`);
    console.log(`Custom images: ${status.custom}`);
    console.log(`Original paths: ${status.original_paths}`);
    console.log(`External URLs: ${status.external}`);
    console.log(`Placeholders: ${status.placeholders}`);
    console.log(`Total with authentic images: ${parseInt(status.optimized) + parseInt(status.custom) + parseInt(status.original_paths) + parseInt(status.external)}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await originalDb.end();
    await catalogDb.end();
  }
}

runComprehensiveFix().catch(console.error);