/**
 * Quick Image Processor for TV Tantrum
 * Efficiently processes all remaining images in larger batches
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configuration
const IMAGE_CONFIG = {
  width: 400,
  height: 600,
  quality: 85,
  format: 'jpeg'
};

const IMAGES_DIR = path.join(__dirname, 'client', 'public', 'images', 'tv-shows');
const SOURCE_IMAGES_DIR = path.join(__dirname, 'attached_assets', 'downloaded-show-images');
const MANIFEST_PATH = path.join(__dirname, 'attached_assets', 'show-images-manifest.json');

/**
 * Process remaining images quickly
 */
async function processRemainingImages() {
  try {
    // Load manifest
    const manifestData = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    console.log(`Processing ${manifestData.length} shows...`);

    // Get list of already processed images
    const existingImages = fs.existsSync(IMAGES_DIR) ? fs.readdirSync(IMAGES_DIR) : [];
    const processedIds = new Set(existingImages.map(img => {
      const match = img.match(/show-(\d+)-/);
      return match ? parseInt(match[1]) : null;
    }).filter(Boolean));

    // Filter shows that need processing
    const remainingShows = manifestData.filter(show => !processedIds.has(show.id));
    console.log(`${remainingShows.length} shows remaining to process`);

    if (remainingShows.length === 0) {
      console.log('All images already processed!');
      return;
    }

    // Process in larger batches
    const batchSize = 20;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < remainingShows.length; i += batchSize) {
      const batch = remainingShows.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(remainingShows.length / batchSize)}`);

      const promises = batch.map(async (show) => {
        try {
          const { id, name, filename } = show;
          
          // Find source image
          const sourcePath = path.join(SOURCE_IMAGES_DIR, filename);
          if (!fs.existsSync(sourcePath)) {
            console.log(`Source not found: ${filename}`);
            return { success: false, id, error: 'Source not found' };
          }

          // Generate output filename
          const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
          const outputFilename = `show-${id}-${sanitizedName}.jpg`;
          const outputPath = path.join(IMAGES_DIR, outputFilename);

          // Skip if already exists
          if (fs.existsSync(outputPath)) {
            return { success: true, id, status: 'already_exists' };
          }

          // Optimize image
          await sharp(sourcePath)
            .resize(IMAGE_CONFIG.width, IMAGE_CONFIG.height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({
              quality: IMAGE_CONFIG.quality,
              progressive: true,
              mozjpeg: true
            })
            .toFile(outputPath);

          // Update database
          const imageUrl = `/images/tv-shows/${outputFilename}`;
          await pool.query(
            'UPDATE catalog_tv_shows SET image_url = $1 WHERE id = $2',
            [imageUrl, id]
          );

          console.log(`✓ ${name}`);
          return { success: true, id, imageUrl };

        } catch (error) {
          console.log(`✗ ${show.name}: ${error.message}`);
          return { success: false, id: show.id, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      
      // Count results
      const batchSuccess = results.filter(r => r.success).length;
      const batchErrors = results.filter(r => !r.success).length;
      
      successCount += batchSuccess;
      errorCount += batchErrors;

      console.log(`Batch complete: ${batchSuccess} success, ${batchErrors} errors`);
    }

    console.log(`\n=== PROCESSING COMPLETE ===`);
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${successCount + errorCount}`);
    console.log(`Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

// Run immediately
processRemainingImages();