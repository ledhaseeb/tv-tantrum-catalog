/**
 * Extract Original Images Script
 * Extracts actual image data from original database and saves locally
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const originalDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZH3VF9BEjlyk@ep-small-cloud-a46us4xp.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const catalogDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function extractOriginalImages() {
  try {
    await fs.mkdir('public/media/tv-shows', { recursive: true });
    
    // Check if original database has an images table or blob storage
    const tablesResult = await originalDb.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%image%'
    `);
    
    console.log('Available image-related tables:', tablesResult.rows);
    
    // Check if tv_shows table has image data columns
    const columnsResult = await originalDb.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tv_shows' 
      AND column_name LIKE '%image%'
    `);
    
    console.log('Image columns in tv_shows:', columnsResult.rows);
    
    // Get shows that need media images converted to external URLs
    const catalogShows = await catalogDb.query(`
      SELECT name, image_url
      FROM catalog_tv_shows
      WHERE image_url LIKE '/media/tv-shows/%'
      ORDER BY name
    `);
    
    console.log(`Found ${catalogShows.rows.length} shows with media paths to convert`);
    
    // Get corresponding external URLs from original database
    const originalShows = await originalDb.query(`
      SELECT name, image_url
      FROM tv_shows
      WHERE image_url LIKE 'http%'
      ORDER BY name
    `);
    
    console.log(`Found ${originalShows.rows.length} shows with external URLs in original database`);
    
    // Create a mapping of show names to external URLs
    const externalUrlMap = new Map();
    originalShows.rows.forEach(show => {
      externalUrlMap.set(show.name.toLowerCase().trim(), show.image_url);
    });
    
    let updated = 0;
    let notFound = 0;
    
    for (const catalogShow of catalogShows.rows) {
      const normalizedName = catalogShow.name.toLowerCase().trim();
      
      if (externalUrlMap.has(normalizedName)) {
        const externalUrl = externalUrlMap.get(normalizedName);
        
        try {
          await catalogDb.query(`
            UPDATE catalog_tv_shows 
            SET image_url = $1 
            WHERE name = $2
          `, [externalUrl, catalogShow.name]);
          
          console.log(`Updated ${catalogShow.name} to external URL`);
          updated++;
        } catch (error) {
          console.error(`Failed to update ${catalogShow.name}: ${error.message}`);
        }
      } else {
        console.log(`No external URL found for: ${catalogShow.name}`);
        notFound++;
      }
    }
    
    console.log(`\nConversion Results:`);
    console.log(`Updated to external URLs: ${updated}`);
    console.log(`No external URL found: ${notFound}`);
    
    // Final status check
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
    console.log(`Media paths remaining: ${status.media_paths}`);
    console.log(`External URLs: ${status.external}`);
    console.log(`Placeholders: ${status.placeholders}`);
    console.log(`Total with images: ${parseInt(status.optimized) + parseInt(status.custom) + parseInt(status.external)}`);
    
  } catch (error) {
    console.error('Extraction failed:', error);
  } finally {
    await originalDb.end();
    await catalogDb.end();
  }
}

extractOriginalImages().catch(console.error);