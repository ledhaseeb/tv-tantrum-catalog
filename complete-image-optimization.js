import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const SOURCE_DIR = './public/images/shows';
const OPTIMIZED_DIR = './public/images/tv-shows';

async function completeOptimization() {
  console.log('Completing image optimization for remaining shows...');
  
  // Get shows that still need images
  const client = await pool.connect();
  const result = await client.query(`
    SELECT id, name, image_url 
    FROM catalog_tv_shows 
    WHERE image_url NOT LIKE '/images/tv-shows/%'
    ORDER BY name
  `);
  const remainingShows = result.rows;
  client.release();
  
  console.log(`Found ${remainingShows.length} shows still needing optimized images`);
  
  // Get available source images
  const allFiles = fs.readdirSync(SOURCE_DIR);
  const imageFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });
  
  console.log(`Available source images: ${imageFiles.length}`);
  
  let processed = 0;
  
  for (const show of remainingShows) {
    // Find matching image with more flexible matching
    const showName = show.name.toLowerCase();
    
    const imageFile = imageFiles.find(file => {
      const fileName = path.parse(file).name.toLowerCase();
      
      // Direct match
      if (fileName === showName) return true;
      
      // Remove common words and try again
      const cleanShowName = showName
        .replace(/\b(the|and|&|of|in|on|at|to|for|with)\b/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const cleanFileName = fileName
        .replace(/\b(the|and|&|of|in|on|at|to|for|with)\b/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Partial match
      return cleanFileName.includes(cleanShowName) || cleanShowName.includes(cleanFileName);
    });
    
    if (imageFile) {
      const inputPath = path.join(SOURCE_DIR, imageFile);
      const cleanName = show.name
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
        const updateClient = await pool.connect();
        await updateClient.query(
          'UPDATE catalog_tv_shows SET image_url = $1 WHERE id = $2',
          [`/images/tv-shows/${outputFilename}`, show.id]
        );
        updateClient.release();
        
        console.log(`✓ ${show.name} -> ${outputFilename}`);
        processed++;
        
      } catch (error) {
        console.error(`✗ Failed ${show.name}: ${error.message}`);
      }
    }
  }
  
  console.log(`\nCompleted! Processed ${processed} additional images`);
  
  // Final count
  const finalClient = await pool.connect();
  const finalResult = await finalClient.query(`
    SELECT COUNT(*) as total_optimized 
    FROM catalog_tv_shows 
    WHERE image_url LIKE '/images/tv-shows/%'
  `);
  finalClient.release();
  
  console.log(`Total shows with optimized images: ${finalResult.rows[0].total_optimized}/302`);
}

completeOptimization()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });