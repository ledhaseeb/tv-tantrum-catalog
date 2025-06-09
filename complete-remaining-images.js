/**
 * Complete Remaining Image Migration
 * Processes remaining shows in efficient batches
 */

import { Pool } from 'pg';

const originalDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZH3VF9BEjlyk@ep-small-cloud-a46us4xp.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const catalogDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

function normalizeShowName(name) {
  return name.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function getRemainingShows() {
  try {
    const originalResult = await originalDb.query(`
      SELECT id, name, image_url
      FROM tv_shows
      WHERE image_url IS NOT NULL 
        AND image_url != ''
        AND image_url != '/placeholder-show.svg'
      ORDER BY name
    `);
    
    const catalogResult = await catalogDb.query(`
      SELECT name, image_url
      FROM catalog_tv_shows
      WHERE image_url LIKE '/placeholder%' OR image_url LIKE '/api/placeholder%'
      ORDER BY name
    `);
    
    console.log(`Original: ${originalResult.rows.length} shows with images`);
    console.log(`Catalog: ${catalogResult.rows.length} shows needing updates`);
    
    const originalMap = new Map();
    originalResult.rows.forEach(show => {
      originalMap.set(normalizeShowName(show.name), show);
    });
    
    const matches = [];
    catalogResult.rows.forEach(catalogShow => {
      const normalized = normalizeShowName(catalogShow.name);
      if (originalMap.has(normalized)) {
        const originalShow = originalMap.get(normalized);
        matches.push({
          catalogName: catalogShow.name,
          imageUrl: originalShow.image_url
        });
      }
    });
    
    console.log(`Found ${matches.length} shows to update`);
    return matches;
    
  } catch (error) {
    console.error('Error fetching shows:', error);
    return [];
  }
}

async function updateShowImage(catalogName, imageUrl) {
  try {
    const result = await catalogDb.query(`
      UPDATE catalog_tv_shows 
      SET image_url = $1 
      WHERE name = $2
    `, [imageUrl, catalogName]);
    
    if (result.rowCount > 0) {
      console.log(`Updated: ${catalogName}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating ${catalogName}:`, error);
    return false;
  }
}

async function processBatch(shows, batchSize = 20) {
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < shows.length; i += batchSize) {
    const batch = shows.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(shows.length/batchSize)}`);
    
    const promises = batch.map(show => updateShowImage(show.catalogName, show.imageUrl));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successful++;
      } else {
        failed++;
        console.error(`Failed: ${batch[index].catalogName}`);
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { successful, failed };
}

async function runCompletion() {
  console.log('Completing remaining image migrations...');
  
  try {
    const shows = await getRemainingShows();
    
    if (shows.length === 0) {
      console.log('No shows need updates');
      return;
    }
    
    const results = await processBatch(shows);
    
    console.log(`\nCompletion Results:`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    
    const finalStatus = await catalogDb.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN image_url LIKE '/images/optimized/%' THEN 1 END) as optimized,
        COUNT(CASE WHEN image_url LIKE '/custom-images/%' THEN 1 END) as custom,
        COUNT(CASE WHEN image_url LIKE '/media/tv-shows/%' THEN 1 END) as original,
        COUNT(CASE WHEN image_url LIKE '/placeholder%' OR image_url LIKE '/api/placeholder%' THEN 1 END) as placeholders
      FROM catalog_tv_shows
    `);
    
    const status = finalStatus.rows[0];
    console.log(`\nFinal Status:`);
    console.log(`Total shows: ${status.total}`);
    console.log(`Optimized: ${status.optimized}`);
    console.log(`Custom: ${status.custom}`);
    console.log(`Original paths: ${status.original}`);
    console.log(`Placeholders: ${status.placeholders}`);
    console.log(`Total with authentic images: ${parseInt(status.optimized) + parseInt(status.custom) + parseInt(status.original)}`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await originalDb.end();
    await catalogDb.end();
  }
}

runCompletion().catch(console.error);