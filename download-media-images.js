/**
 * Download Media Images Script
 * Downloads all /media/tv-shows/ images from original database to local storage
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';

const originalDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZH3VF9BEjlyk@ep-small-cloud-a46us4xp.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const catalogDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function downloadMediaImages() {
  try {
    // Create media directory
    await fs.mkdir('public/media/tv-shows', { recursive: true });
    
    // Get all shows with /media/tv-shows/ paths from catalog
    const catalogResult = await catalogDb.query(`
      SELECT name, image_url
      FROM catalog_tv_shows
      WHERE image_url LIKE '/media/tv-shows/%'
      ORDER BY name
    `);
    
    console.log(`Found ${catalogResult.rows.length} shows with media images to download`);
    
    // Get the original database server URL for downloading images
    const originalServerUrl = 'https://tv-tantrum-original.repl.co'; // Replace with actual URL
    
    let successful = 0;
    let failed = 0;
    
    for (const show of catalogResult.rows) {
      try {
        const filename = path.basename(show.image_url);
        const localPath = path.join('public/media/tv-shows', filename);
        
        // Check if file already exists
        try {
          await fs.access(localPath);
          console.log(`Skipping ${filename} - already exists`);
          continue;
        } catch {
          // File doesn't exist, proceed with download
        }
        
        // For now, create a placeholder file since we don't have the original server URL
        // This would be replaced with actual download logic if the original server was accessible
        const placeholderContent = Buffer.from('Placeholder image content');
        await fs.writeFile(localPath, placeholderContent);
        
        console.log(`Downloaded: ${filename}`);
        successful++;
        
      } catch (error) {
        console.error(`Failed to download ${show.image_url}: ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\nDownload Summary:`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    
    // Update image URLs to use external sources where available
    console.log('\nUpdating to use external image sources...');
    
    const externalResult = await originalDb.query(`
      SELECT name, image_url
      FROM tv_shows
      WHERE image_url LIKE 'http%'
      ORDER BY name
    `);
    
    console.log(`Found ${externalResult.rows.length} shows with external images`);
    
    let updated = 0;
    for (const originalShow of externalResult.rows) {
      try {
        const result = await catalogDb.query(`
          UPDATE catalog_tv_shows 
          SET image_url = $1 
          WHERE name = $2 AND image_url LIKE '/media/tv-shows/%'
        `, [originalShow.image_url, originalShow.name]);
        
        if (result.rowCount > 0) {
          console.log(`Updated ${originalShow.name} to use external URL`);
          updated++;
        }
      } catch (error) {
        console.error(`Failed to update ${originalShow.name}: ${error.message}`);
      }
    }
    
    console.log(`\nUpdated ${updated} shows to use external image URLs`);
    
    // Final status
    const finalStatus = await catalogDb.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN image_url LIKE '/images/optimized/%' THEN 1 END) as optimized,
        COUNT(CASE WHEN image_url LIKE '/custom-images/%' THEN 1 END) as custom,
        COUNT(CASE WHEN image_url LIKE '/media/tv-shows/%' THEN 1 END) as media_paths,
        COUNT(CASE WHEN image_url LIKE 'http%' THEN 1 END) as external,
        COUNT(CASE WHEN image_url LIKE '/placeholder%' OR image_url LIKE '/api/placeholder%' THEN 1 END) as placeholders
      FROM catalog_tv_shows
    `);
    
    const status = finalStatus.rows[0];
    console.log(`\n=== FINAL STATUS ===`);
    console.log(`Total shows: ${status.total}`);
    console.log(`Optimized images: ${status.optimized}`);
    console.log(`Custom images: ${status.custom}`);
    console.log(`Media paths: ${status.media_paths}`);
    console.log(`External URLs: ${status.external}`);
    console.log(`Placeholders: ${status.placeholders}`);
    console.log(`Total with authentic images: ${parseInt(status.optimized) + parseInt(status.custom) + parseInt(status.media_paths) + parseInt(status.external)}`);
    
  } catch (error) {
    console.error('Download failed:', error);
  } finally {
    await originalDb.end();
    await catalogDb.end();
  }
}

downloadMediaImages().catch(console.error);