// Script to apply custom show details and images to the database
// This script directly updates the database instead of applying changes during server startup
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Get the current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Neon database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set. Please set it before running this script.');
  process.exit(1);
}

// Configure WebSocket for Neon
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Set up database pool with the same configuration as server/db.ts
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // Maximum time to wait for a connection
};

const pool = new Pool(poolConfig);

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Verify database connection before proceeding
async function verifyDatabaseConnection() {
  try {
    console.log('Verifying database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log(`Database connected successfully at: ${result.rows[0].now}`);
    
    // Check if we can access the tv_shows table
    const showCount = await pool.query('SELECT COUNT(*) FROM tv_shows');
    console.log(`Found ${showCount.rows[0].count} TV shows in database`);
    
    return true;
  } catch (error) {
    console.error('Database connection verification failed:', error);
    return false;
  }
}

/**
 * Load custom show details mapping from the JSON file
 */
function loadCustomShowDetailsMap() {
  try {
    const filePath = path.join(process.cwd(), 'customShowDetailsMap.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading custom show details map:', error);
  }
  return {};
}

/**
 * Load custom image mapping from the JSON file
 */
function loadCustomImageMap() {
  try {
    const filePath = path.join(process.cwd(), 'customImageMap.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading custom image map:', error);
  }
  return {};
}

/**
 * Get a specific TV show from the database
 */
async function getTvShowById(id) {
  try {
    const result = await pool.query('SELECT * FROM tv_shows WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error(`Error getting TV show with ID ${id}:`, error);
    return null;
  }
}

/**
 * Convert camelCase to snake_case
 */
function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Map custom field names to database column names
 */
function mapFieldToColumnName(key) {
  // Custom mapping for specific fields
  const fieldMap = {
    'stimulationScore': 'stimulation_score',
    'musicTempo': 'music_tempo',
    'totalMusicLevel': 'total_music_level',
    'totalSoundEffectTimeLevel': 'total_sound_effect_time_level',
    'sceneFrequency': 'scene_frequency',
    'interactivityLevel': 'interactivity_level',
    'dialogueIntensity': 'dialogue_intensity',
    'soundEffectsLevel': 'sound_effects_level',
    'animationStyle': 'animation_style',
    'ageRange': 'age_range',
    'themes': 'themes'
  };
  
  // Return mapped field name or convert to snake_case
  return fieldMap[key] || camelToSnakeCase(key);
}

/**
 * Update a TV show's details in the database
 */
async function updateTvShow(id, details) {
  try {
    // Create SET clause for the SQL update query
    const keys = Object.keys(details);
    if (keys.length === 0) return null;
    
    // Map keys and create parameterized query
    const mappedKeys = keys.map(key => mapFieldToColumnName(key));
    const setClauses = mappedKeys.map((mappedKey, index) => `"${mappedKey}" = $${index + 2}`);
    
    const values = keys.map(key => {
      // Handle arrays (like themes) by converting to JSONB
      if (Array.isArray(details[key])) {
        return JSON.stringify(details[key]);
      }
      // Handle stimulation score specifically
      if (key === 'stimulationScore') {
        // Ensure it's a whole number (integer)
        return Math.round(details[key]);
      }
      return details[key];
    });
    
    const query = `
      UPDATE tv_shows 
      SET ${setClauses.join(', ')} 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, ...values]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error(`Error updating TV show with ID ${id}:`, error);
    return null;
  }
}

/**
 * Process all custom details in batches
 */
async function processCustomDetails() {
  try {
    const customDetailsMap = loadCustomShowDetailsMap();
    console.log(`Processing ${Object.keys(customDetailsMap).length} custom show details...`);
    
    // Process in batches of 20 shows
    const BATCH_SIZE = 20;
    const showIds = Object.keys(customDetailsMap).map(id => parseInt(id)).filter(id => !isNaN(id));
    const totalBatches = Math.ceil(showIds.length / BATCH_SIZE);
    
    console.log(`Processing ${showIds.length} shows in ${totalBatches} batches of ${BATCH_SIZE}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, showIds.length);
      const currentBatch = showIds.slice(batchStart, batchEnd);
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (shows ${batchStart+1}-${batchEnd})`);
      
      // Process each show in the batch
      for (const showId of currentBatch) {
        try {
          const show = await getTvShowById(showId);
          if (show) {
            const details = customDetailsMap[showId.toString()];
            const updatedShow = await updateTvShow(showId, details);
            if (updatedShow) {
              successCount++;
              process.stdout.write('.');
            } else {
              errorCount++;
              process.stdout.write('E');
            }
          } else {
            console.log(`\nShow ID ${showId} not found in database`);
            errorCount++;
          }
        } catch (err) {
          console.error(`\nError processing show ${showId}:`, err);
          errorCount++;
        }
      }
      process.stdout.write('\n');
    }
    
    console.log(`\nCustom details processing completed: ${successCount} successful, ${errorCount} errors`);
    return { successCount, errorCount };
  } catch (error) {
    console.error('Error processing custom show details:', error);
    return { successCount: 0, errorCount: 0 };
  }
}

/**
 * Process all custom images in batches
 */
async function processCustomImages() {
  try {
    const customImageMap = loadCustomImageMap();
    console.log(`Processing ${Object.keys(customImageMap).length} custom images...`);
    
    // Process in batches of 20 shows
    const BATCH_SIZE = 20;
    const showIds = Object.keys(customImageMap).map(id => parseInt(id)).filter(id => !isNaN(id));
    const totalBatches = Math.ceil(showIds.length / BATCH_SIZE);
    
    console.log(`Processing ${showIds.length} images in ${totalBatches} batches of ${BATCH_SIZE}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, showIds.length);
      const currentBatch = showIds.slice(batchStart, batchEnd);
      
      console.log(`Processing image batch ${batchIndex + 1}/${totalBatches} (shows ${batchStart+1}-${batchEnd})`);
      
      // Process each show in the batch
      for (const showId of currentBatch) {
        try {
          const show = await getTvShowById(showId);
          if (show) {
            const imageUrl = customImageMap[showId.toString()];
            const updatedShow = await updateTvShow(showId, { imageUrl });
            if (updatedShow) {
              successCount++;
              process.stdout.write('.');
            } else {
              errorCount++;
              process.stdout.write('E');
            }
          } else {
            console.log(`\nShow ID ${showId} not found in database`);
            errorCount++;
          }
        } catch (err) {
          console.error(`\nError processing image for show ${showId}:`, err);
          errorCount++;
        }
      }
      process.stdout.write('\n');
    }
    
    console.log(`\nCustom images processing completed: ${successCount} successful, ${errorCount} errors`);
    return { successCount, errorCount };
  } catch (error) {
    console.error('Error processing custom images:', error);
    return { successCount: 0, errorCount: 0 };
  }
}

/**
 * Main function to process everything
 */
async function main() {
  try {
    console.log('Starting custom data processing...');
    console.log('This script will update the database directly with custom show details and images');
    
    // Verify database connection before proceeding
    const isConnected = await verifyDatabaseConnection();
    if (!isConnected) {
      console.error('Could not establish database connection. Exiting...');
      return;
    }
    
    // Process custom details
    const detailsResult = await processCustomDetails();
    
    // Process custom images
    const imagesResult = await processCustomImages();
    
    console.log('\nProcessing summary:');
    console.log(`Custom details: ${detailsResult.successCount} successful, ${detailsResult.errorCount} errors`);
    console.log(`Custom images: ${imagesResult.successCount} successful, ${imagesResult.errorCount} errors`);
    console.log('All done!');
    
  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    // Close the database pool
    await pool.end();
  }
}

// Run the main function
main().catch(console.error);