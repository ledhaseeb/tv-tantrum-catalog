/**
 * This script re-applies all custom images from the customImageMap.json file to the database
 * This ensures that any OMDb API images that overwrote custom images are replaced with the original custom images
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Initialize database connection using DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Load custom image mappings from JSON file
function loadCustomImageMap() {
  try {
    const filePath = path.join(__dirname, 'customImageMap.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading custom image map:', error);
  }
  return {};
}

async function restoreCustomImages() {
  try {
    console.log('Starting custom image restoration process...');
    
    // Load the custom image map
    const customImageMap = loadCustomImageMap();
    const customImageIds = Object.keys(customImageMap);
    
    console.log(`Found ${customImageIds.length} custom images in the map`);
    
    // Track our progress
    let restoredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each image in the map
    for (const showId of customImageIds) {
      try {
        const imageUrl = customImageMap[showId];
        
        // Skip non-custom images (like OMDB images that were added to the map)
        const isCustomImage = imageUrl.includes('/custom-images/') || 
                              imageUrl.includes('/uploads/optimized/');
        
        if (!isCustomImage) {
          console.log(`Skipping non-custom image for show ID ${showId}: ${imageUrl}`);
          skippedCount++;
          continue;
        }
        
        console.log(`Restoring custom image for show ID ${showId}: ${imageUrl}`);
        
        // Update the database with the custom image
        const updateResult = await pool.query(
          'UPDATE tv_shows SET image_url = $1 WHERE id = $2 RETURNING name',
          [imageUrl, showId]
        );
        
        if (updateResult.rowCount > 0) {
          console.log(`✓ Restored custom image for "${updateResult.rows[0].name}" (ID: ${showId})`);
          restoredCount++;
        } else {
          console.log(`⚠ Show ID ${showId} not found in database`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error restoring image for show ID ${showId}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nCustom image restoration complete:');
    console.log(`- Restored: ${restoredCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error in restoreCustomImages:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the restoration process
restoreCustomImages();