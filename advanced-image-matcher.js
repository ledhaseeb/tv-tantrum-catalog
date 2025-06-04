import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const SOURCE_DIR = './public/images/shows';
const OPTIMIZED_DIR = './public/images/tv-shows';

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(str1, str2);
  return ((maxLength - distance) / maxLength) * 100;
}

/**
 * Normalize text for better matching
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(the|and|&|of|in|on|at|to|for|with|a|an)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract key words from show name
 */
function extractKeywords(text) {
  const normalized = normalizeText(text);
  return normalized.split(' ').filter(word => word.length > 2);
}

/**
 * Calculate keyword match score
 */
function calculateKeywordScore(showWords, fileWords) {
  let matches = 0;
  let totalWords = Math.max(showWords.length, fileWords.length);
  
  for (const showWord of showWords) {
    for (const fileWord of fileWords) {
      if (calculateSimilarity(showWord, fileWord) > 80) {
        matches++;
        break;
      }
    }
  }
  
  return (matches / totalWords) * 100;
}

/**
 * Find best matching image for a show
 */
function findBestMatch(showName, imageFiles) {
  const showNormalized = normalizeText(showName);
  const showKeywords = extractKeywords(showName);
  
  let bestMatch = null;
  let bestScore = 0;
  let bestDetails = {};
  
  for (const imageFile of imageFiles) {
    const fileName = path.parse(imageFile).name;
    const fileNormalized = normalizeText(fileName);
    const fileKeywords = extractKeywords(fileName);
    
    // Calculate different similarity scores
    const directSimilarity = calculateSimilarity(showNormalized, fileNormalized);
    const keywordScore = calculateKeywordScore(showKeywords, fileKeywords);
    
    // Bonus for exact word matches
    let exactWordBonus = 0;
    for (const showWord of showKeywords) {
      if (fileKeywords.includes(showWord)) {
        exactWordBonus += 20;
      }
    }
    
    // Bonus for partial matches in either direction
    let partialBonus = 0;
    if (fileNormalized.includes(showNormalized) || showNormalized.includes(fileNormalized)) {
      partialBonus = 30;
    }
    
    // Calculate weighted final score
    const finalScore = (directSimilarity * 0.4) + (keywordScore * 0.4) + (exactWordBonus * 0.1) + (partialBonus * 0.1);
    
    if (finalScore > bestScore && finalScore > 40) { // Minimum threshold
      bestScore = finalScore;
      bestMatch = imageFile;
      bestDetails = {
        directSimilarity: directSimilarity.toFixed(1),
        keywordScore: keywordScore.toFixed(1),
        exactWordBonus,
        partialBonus,
        finalScore: finalScore.toFixed(1)
      };
    }
  }
  
  return { match: bestMatch, score: bestScore, details: bestDetails };
}

/**
 * Process and optimize matched image
 */
async function processImage(showId, showName, imageFile) {
  const inputPath = path.join(SOURCE_DIR, imageFile);
  const cleanName = showName
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  
  const outputFilename = `${cleanName}.jpg`;
  const outputPath = path.join(OPTIMIZED_DIR, outputFilename);
  
  try {
    await sharp(inputPath)
      .resize(400, 600, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(outputPath);
    
    // Update database
    const client = await pool.connect();
    await client.query(
      'UPDATE catalog_tv_shows SET image_url = $1 WHERE id = $2',
      [`/images/tv-shows/${outputFilename}`, showId]
    );
    client.release();
    
    return true;
  } catch (error) {
    console.error(`Error processing ${showName}: ${error.message}`);
    return false;
  }
}

/**
 * Main advanced matching function
 */
async function advancedImageMatching() {
  console.log('Starting advanced image matching with fuzzy algorithms...\n');
  
  // Get shows without optimized images
  const client = await pool.connect();
  const result = await client.query(`
    SELECT id, name 
    FROM catalog_tv_shows 
    WHERE image_url NOT LIKE '/images/tv-shows/%'
    ORDER BY name
  `);
  const unmatchedShows = result.rows;
  client.release();
  
  // Get available images (excluding already used ones)
  const allFiles = fs.readdirSync(SOURCE_DIR);
  const imageFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });
  
  // Get list of already used images
  const usedImages = fs.existsSync(OPTIMIZED_DIR) ? fs.readdirSync(OPTIMIZED_DIR) : [];
  const usedImageNames = usedImages.map(img => path.parse(img).name);
  
  console.log(`Shows to match: ${unmatchedShows.length}`);
  console.log(`Available images: ${imageFiles.length}`);
  console.log(`Already used images: ${usedImages.length}\n`);
  
  const matches = [];
  const noMatches = [];
  const lowConfidenceMatches = [];
  
  for (const show of unmatchedShows) {
    const result = findBestMatch(show.name, imageFiles);
    
    if (result.match && result.score >= 60) {
      matches.push({
        show: show.name,
        showId: show.id,
        image: result.match,
        score: result.score,
        details: result.details
      });
    } else if (result.match && result.score >= 40) {
      lowConfidenceMatches.push({
        show: show.name,
        image: result.match,
        score: result.score,
        details: result.details
      });
    } else {
      noMatches.push(show.name);
    }
  }
  
  console.log(`HIGH CONFIDENCE MATCHES (${matches.length}):`);
  console.log('='.repeat(50));
  
  let processed = 0;
  for (const match of matches) {
    const success = await processImage(match.showId, match.show, match.image);
    if (success) {
      console.log(`✓ ${match.show} -> ${match.image} (${match.score.toFixed(1)}%)`);
      processed++;
    } else {
      console.log(`✗ ${match.show} -> ${match.image} (FAILED)`);
    }
  }
  
  console.log(`\nLOW CONFIDENCE MATCHES (${lowConfidenceMatches.length}):`);
  console.log('='.repeat(50));
  lowConfidenceMatches.forEach(match => {
    console.log(`? ${match.show} -> ${match.image} (${match.score.toFixed(1)}%)`);
  });
  
  console.log(`\nNO MATCHES FOUND (${noMatches.length}):`);
  console.log('='.repeat(50));
  noMatches.slice(0, 20).forEach(show => {
    console.log(`✗ ${show}`);
  });
  if (noMatches.length > 20) {
    console.log(`... and ${noMatches.length - 20} more`);
  }
  
  // Final statistics
  const finalClient = await pool.connect();
  const finalResult = await finalClient.query(`
    SELECT COUNT(*) as total_optimized 
    FROM catalog_tv_shows 
    WHERE image_url LIKE '/images/tv-shows/%'
  `);
  finalClient.release();
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`MATCHING RESULTS SUMMARY:`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Successfully processed: ${processed} new images`);
  console.log(`Total optimized shows: ${finalResult.rows[0].total_optimized}/302`);
  console.log(`Low confidence matches: ${lowConfidenceMatches.length}`);
  console.log(`No matches found: ${noMatches.length}`);
  
  return {
    processed,
    lowConfidenceMatches,
    noMatches,
    totalOptimized: finalResult.rows[0].total_optimized
  };
}

advancedImageMatching()
  .then((results) => {
    console.log('\nAdvanced image matching completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during advanced matching:', error);
    process.exit(1);
  });