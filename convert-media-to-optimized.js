/**
 * Convert Media Paths to Optimized Images
 * Converts /media/tv-shows/ paths to optimized local images
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import https from 'https';
import http from 'http';

const catalogDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Fallback images from OMDb for popular shows
const fallbackImages = {
  'peppa pig': 'https://m.media-amazon.com/images/M/MV5BMTMzNDU1OTI2M15BMl5BanBnXkFtZTgwNjAzNzczMDE@._V1_SX300.jpg',
  'paw patrol': 'https://m.media-amazon.com/images/M/MV5BMTIzMjQ5NjY4MF5BMl5BanBnXkFtZTcwNjc4ODE3MQ@@._V1_SX300.jpg',
  'doc mcstuffins': 'https://m.media-amazon.com/images/M/MV5BMTY3Nzg4NDM2NV5BMl5BanBnXkFtZTgwNzE1NjAzMDE@._V1_SX300.jpg',
  'mickey mouse clubhouse': 'https://m.media-amazon.com/images/M/MV5BMTYwNTI4NjE0NV5BMl5BanBnXkFtZTcwMzM1Njg2MQ@@._V1_SX300.jpg',
  'daniel tiger': 'https://m.media-amazon.com/images/M/MV5BNTc4ZGY3YjYtNDEzYS00MzVlLWI2YTYtMjNmMTkwOGE4ZDY4XkEyXkFqcGdeQXVyNjk1Njg5NTA@._V1_SX300.jpg',
  'gabby dollhouse': 'https://m.media-amazon.com/images/M/MV5BZjI0MjFhMjMtZWY2Ni00ZDExLTg5OWYtMjMyOTFlODdmMWY4XkEyXkFqcGdeQXVyMTEyMjM2NDc2._V1_SX300.jpg',
  'blaze monster machines': 'https://m.media-amazon.com/images/M/MV5BM2FhNTQ3NGQtZDE5NC00NmJhLWE2Y2EtZWY4ZDkwMzQ1YzVkXkEyXkFqcGdeQXVyNjk1Njg5NTA@._V1_SX300.jpg',
  'dino ranch': 'https://m.media-amazon.com/images/M/MV5BOTU4NTBhODktYzZhYy00NjAwLWJlODEtYWY0MjVhNGQzOWZkXkEyXkFqcGdeQXVyMTA0MTM5NjI2._V1_SX300.jpg',
  'numberblocks': 'https://m.media-amazon.com/images/M/MV5BYzFmN2Q3NGYtNjZlZC00MGQ3LWFjNWEtYzRhOWNlNDE0YWEyXkEyXkFqcGdeQXVyNzE1MzIyNTY@._V1_SX300.jpg',
  'odd squad': 'https://m.media-amazon.com/images/M/MV5BZGY1NjUzNDItNWI5Zi00YzkwLWE3OWQtZWZiZWY0MDAwYzdiXkEyXkFqcGdeQXVyNjk1Njg5NTA@._V1_SX300.jpg'
};

function normalizeShowName(name) {
  return name.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function downloadImage(url, showName) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, { timeout: 15000 }, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

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

async function findFallbackImage(showName) {
  const normalized = normalizeShowName(showName);
  
  // Check exact matches first
  for (const [key, url] of Object.entries(fallbackImages)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }
  
  // Check partial matches
  const words = normalized.split(' ');
  for (const [key, url] of Object.entries(fallbackImages)) {
    const keyWords = key.split(' ');
    if (words.some(word => keyWords.includes(word) && word.length > 3)) {
      return url;
    }
  }
  
  return null;
}

async function convertMediaToOptimized() {
  try {
    await fs.mkdir('public/images/optimized', { recursive: true });
    
    const mediaShows = await catalogDb.query(`
      SELECT id, name, image_url
      FROM catalog_tv_shows
      WHERE image_url LIKE '/media/tv-shows/%'
      ORDER BY name
    `);
    
    console.log(`Converting ${mediaShows.rows.length} shows with media paths`);
    
    let converted = 0;
    let failed = 0;
    
    for (const show of mediaShows.rows) {
      try {
        console.log(`\nProcessing: ${show.name}`);
        
        const fallbackUrl = await findFallbackImage(show.name);
        
        if (fallbackUrl) {
          console.log(`Found fallback image for ${show.name}`);
          
          const imageBuffer = await downloadImage(fallbackUrl, show.name);
          const optimizedUrl = await optimizeImage(imageBuffer, show.name, show.id);
          
          if (optimizedUrl) {
            await catalogDb.query(`
              UPDATE catalog_tv_shows 
              SET image_url = $1 
              WHERE id = $2
            `, [optimizedUrl, show.id]);
            
            console.log(`✓ Converted ${show.name} to optimized image`);
            converted++;
          } else {
            console.log(`✗ Failed to optimize image for ${show.name}`);
            failed++;
          }
        } else {
          console.log(`No fallback image found for ${show.name}`);
          failed++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing ${show.name}: ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\n=== CONVERSION RESULTS ===`);
    console.log(`Successfully converted: ${converted}`);
    console.log(`Failed: ${failed}`);
    
    // Final status
    const finalStatus = await catalogDb.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN image_url LIKE '/images/optimized/%' THEN 1 END) as optimized,
        COUNT(CASE WHEN image_url LIKE '/custom-images/%' THEN 1 END) as custom,
        COUNT(CASE WHEN image_url LIKE '/media/tv-shows/%' THEN 1 END) as media_remaining,
        COUNT(CASE WHEN image_url LIKE 'http%' THEN 1 END) as external,
        COUNT(CASE WHEN image_url LIKE '/placeholder%' OR image_url LIKE '/api/placeholder%' THEN 1 END) as placeholders
      FROM catalog_tv_shows
    `);
    
    const status = finalStatus.rows[0];
    console.log(`\n=== FINAL STATUS ===`);
    console.log(`Total shows: ${status.total}`);
    console.log(`Optimized images: ${status.optimized}`);
    console.log(`Custom images: ${status.custom}`);
    console.log(`Media paths remaining: ${status.media_remaining}`);
    console.log(`External URLs: ${status.external}`);
    console.log(`Placeholders: ${status.placeholders}`);
    console.log(`Total with images: ${parseInt(status.optimized) + parseInt(status.custom) + parseInt(status.external)}`);
    
  } catch (error) {
    console.error('Conversion failed:', error);
  } finally {
    await catalogDb.end();
  }
}

convertMediaToOptimized().catch(console.error);