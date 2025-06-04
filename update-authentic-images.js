/**
 * Update Authentic Images Script
 * Matches shows between databases using exact and fuzzy matching
 * Updates catalog with authentic external image URLs from original database
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
  return name.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createVariations(name) {
  const normalized = normalizeShowName(name);
  const variations = [normalized];
  
  // Remove common suffixes
  const suffixes = [
    '(2017-present)', '(2015-2018)', '(1997-2001)', '(2019)', '(1997–2000)',
    '(2005-2009)', '(2021)', '(1969–1970)', '(1969-present)', '(1998)',
    '(1999-2001)', '(2011)', 'original series', 'reboot', 'special delivery service'
  ];
  
  suffixes.forEach(suffix => {
    const withoutSuffix = normalized.replace(suffix.toLowerCase(), '').trim();
    if (withoutSuffix !== normalized) {
      variations.push(withoutSuffix);
    }
  });
  
  // Add common alternative formats
  variations.push(normalized.replace('&', 'and'));
  variations.push(normalized.replace('and', '&'));
  
  return [...new Set(variations)];
}

async function updateAuthenticImages() {
  try {
    // Get all external URLs from original database
    const originalResult = await originalDb.query(`
      SELECT name, image_url
      FROM tv_shows
      WHERE image_url LIKE 'http%'
      ORDER BY name
    `);
    
    // Get all catalog shows that need images (media paths)
    const catalogResult = await catalogDb.query(`
      SELECT id, name, image_url
      FROM catalog_tv_shows
      WHERE image_url LIKE '/media/tv-shows/%'
      ORDER BY name
    `);
    
    console.log(`Original database: ${originalResult.rows.length} shows with external URLs`);
    console.log(`Catalog database: ${catalogResult.rows.length} shows needing updates`);
    
    // Create comprehensive mapping
    const originalMap = new Map();
    originalResult.rows.forEach(show => {
      const variations = createVariations(show.name);
      variations.forEach(variation => {
        if (!originalMap.has(variation)) {
          originalMap.set(variation, show);
        }
      });
    });
    
    let exactMatches = 0;
    let fuzzyMatches = 0;
    let noMatches = 0;
    
    for (const catalogShow of catalogResult.rows) {
      const variations = createVariations(catalogShow.name);
      let matched = false;
      
      // Try exact matches first
      for (const variation of variations) {
        if (originalMap.has(variation)) {
          const originalShow = originalMap.get(variation);
          
          try {
            await catalogDb.query(`
              UPDATE catalog_tv_shows 
              SET image_url = $1 
              WHERE id = $2
            `, [originalShow.image_url, catalogShow.id]);
            
            console.log(`✓ Exact match: ${catalogShow.name} → ${originalShow.name}`);
            exactMatches++;
            matched = true;
            break;
          } catch (error) {
            console.error(`Database error for ${catalogShow.name}: ${error.message}`);
          }
        }
      }
      
      // If no exact match, try fuzzy matching
      if (!matched) {
        const catalogNormalized = normalizeShowName(catalogShow.name);
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [key, originalShow] of originalMap) {
          const score = calculateSimilarity(catalogNormalized, key);
          if (score > 0.8 && score > bestScore) {
            bestScore = score;
            bestMatch = originalShow;
          }
        }
        
        if (bestMatch) {
          try {
            await catalogDb.query(`
              UPDATE catalog_tv_shows 
              SET image_url = $1 
              WHERE id = $2
            `, [bestMatch.image_url, catalogShow.id]);
            
            console.log(`✓ Fuzzy match: ${catalogShow.name} → ${bestMatch.name} (${Math.round(bestScore * 100)}%)`);
            fuzzyMatches++;
          } catch (error) {
            console.error(`Database error for ${catalogShow.name}: ${error.message}`);
          }
        } else {
          console.log(`✗ No match found for: ${catalogShow.name}`);
          noMatches++;
        }
      }
    }
    
    console.log(`\n=== MATCHING RESULTS ===`);
    console.log(`Exact matches: ${exactMatches}`);
    console.log(`Fuzzy matches: ${fuzzyMatches}`);
    console.log(`No matches: ${noMatches}`);
    console.log(`Total updated: ${exactMatches + fuzzyMatches}`);
    
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
    console.log(`Total with authentic images: ${parseInt(status.optimized) + parseInt(status.custom) + parseInt(status.external)}`);
    
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await originalDb.end();
    await catalogDb.end();
  }
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  
  let matches = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  words1.forEach(word1 => {
    if (word1.length > 2) { // Skip very short words
      words2.forEach(word2 => {
        if (word1 === word2 || 
            (word1.length > 3 && word2.length > 3 && 
             (word1.includes(word2) || word2.includes(word1)))) {
          matches++;
        }
      });
    }
  });
  
  return matches / totalWords;
}

updateAuthenticImages().catch(console.error);