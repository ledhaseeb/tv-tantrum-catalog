/**
 * Consolidated Image Management Utility
 * 
 * This script replaces multiple overlapping image management scripts:
 * - map-custom-images.js
 * - update-custom-images.js
 * - restore-custom-images.js
 * - consolidate-images.js
 * 
 * Features:
 * - Maps custom images to TV shows
 * - Restores custom images from backup
 * - Consolidates images into a single directory
 * - Maintains image mappings in customImageMap.json
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// File paths
const customImageMapPath = path.join(__dirname, 'data', 'custom-image-map.json');
const customImagesDir = path.join(__dirname, 'public', 'custom-images');
const uploadsDir = path.join(__dirname, 'public', 'uploads');

// Make sure directories exist
if (!fs.existsSync(customImagesDir)) {
  fs.mkdirSync(customImagesDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Load the custom image map from file
 */
function loadCustomImageMap() {
  try {
    if (fs.existsSync(customImageMapPath)) {
      const data = fs.readFileSync(customImageMapPath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading custom image map:', error);
    return {};
  }
}

/**
 * Save the custom image map to file
 */
function saveCustomImageMap(customImageMap) {
  try {
    fs.writeFileSync(customImageMapPath, JSON.stringify(customImageMap, null, 2));
    console.log('Custom image map saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving custom image map:', error);
    return false;
  }
}

/**
 * Update a single entry in the custom image map
 */
function updateCustomImageMap(showId, imageUrl) {
  try {
    const customImageMap = loadCustomImageMap();
    customImageMap[showId] = imageUrl;
    saveCustomImageMap(customImageMap);
    return true;
  } catch (error) {
    console.error(`Error updating custom image map for show ID ${showId}:`, error);
    return false;
  }
}

/**
 * Utility to clean text for comparing show names
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
    .replace(/\s+/g, '');      // Remove whitespace
}

/**
 * Find a TV show that matches an image filename
 */
async function findMatchingShow(imageFile, shows) {
  // Extract name from filename: "show-name.jpg" -> "show name"
  const filenameBase = path.basename(imageFile, path.extname(imageFile))
    .replace(/[-_]/g, ' ')
    .trim();
  
  // Clean the filename for comparison
  const cleanFilename = cleanText(filenameBase);
  
  // Try exact match first
  for (const show of shows) {
    const cleanShowName = cleanText(show.name);
    if (cleanShowName === cleanFilename) {
      console.log(`✅ Found exact match: "${show.name}" for image "${imageFile}"`);
      return show;
    }
  }
  
  // Try contains match
  for (const show of shows) {
    const cleanShowName = cleanText(show.name);
    if (cleanShowName.includes(cleanFilename) || cleanFilename.includes(cleanShowName)) {
      console.log(`✅ Found partial match: "${show.name}" for image "${imageFile}"`);
      return show;
    }
  }
  
  console.log(`❌ No match found for image: ${imageFile}`);
  return null;
}

/**
 * Update a show's image URL in the database
 */
async function updateShowImageUrl(showId, imageUrl) {
  try {
    const result = await pool.query(
      'UPDATE tv_shows SET image_url = $1 WHERE id = $2 RETURNING id, name',
      [imageUrl, showId]
    );
    
    if (result.rowCount === 1) {
      console.log(`Updated image URL for show ID ${showId}: ${result.rows[0].name}`);
      return true;
    } else {
      console.error(`Failed to update image URL for show ID ${showId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating image URL for show ID ${showId}:`, error);
    return false;
  }
}

/**
 * Process and map all custom images to shows
 */
async function mapCustomImages() {
  try {
    console.log('Starting custom image mapping process...');
    
    // Load existing image map
    const customImageMap = loadCustomImageMap();
    
    // Get all images in the custom images directory
    const imageFiles = fs.readdirSync(customImagesDir)
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => path.join(customImagesDir, file));
    
    console.log(`Found ${imageFiles.length} custom images to process`);
    
    // Get all TV shows from the database
    const result = await pool.query('SELECT id, name FROM tv_shows ORDER BY name');
    const shows = result.rows;
    
    console.log(`Found ${shows.length} TV shows in the database`);
    
    // Statistics
    let mapped = 0;
    let errors = 0;
    let skipped = 0;
    
    // Process each image
    for (const imageFile of imageFiles) {
      try {
        const relativePath = path.relative(process.cwd(), imageFile).replace(/\\/g, '/');
        const webPath = `/${relativePath}`;
        
        // Find a matching show
        const show = await findMatchingShow(imageFile, shows);
        
        if (show) {
          // Check if we already have a mapping for this show
          if (customImageMap[show.id]) {
            console.log(`Skipping - show ID ${show.id} already has a custom image: ${customImageMap[show.id]}`);
            skipped++;
            continue;
          }
          
          // Update the image map
          customImageMap[show.id] = webPath;
          
          // Update the database
          const updated = await updateShowImageUrl(show.id, webPath);
          if (updated) {
            console.log(`✅ Mapped image ${webPath} to show "${show.name}" (ID: ${show.id})`);
            mapped++;
          } else {
            console.error(`❌ Failed to update database for show "${show.name}"`);
            errors++;
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error processing image ${imageFile}:`, error);
        errors++;
      }
    }
    
    // Save the updated image map
    saveCustomImageMap(customImageMap);
    
    console.log('\nImage mapping complete:');
    console.log(`✅ Mapped: ${mapped}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${imageFiles.length}`);
    
  } catch (error) {
    console.error('Fatal error in image mapping process:', error);
  } finally {
    await pool.end();
  }
}

/**
 * Restore all custom images from the image map
 */
async function restoreCustomImages() {
  try {
    console.log('Starting custom image restoration process...');
    
    // Load the custom image map
    const customImageMap = loadCustomImageMap();
    const showIds = Object.keys(customImageMap);
    
    console.log(`Found ${showIds.length} custom image mappings to restore`);
    
    // Statistics
    let restored = 0;
    let errors = 0;
    let skipped = 0;
    
    // Process each mapping
    for (const showId of showIds) {
      try {
        const imageUrl = customImageMap[showId];
        
        // Get current image URL from database
        const showResult = await pool.query(
          'SELECT name, image_url FROM tv_shows WHERE id = $1',
          [showId]
        );
        
        if (showResult.rowCount === 0) {
          console.log(`Skipping - show ID ${showId} not found in database`);
          skipped++;
          continue;
        }
        
        const show = showResult.rows[0];
        
        // Skip if current image URL matches the custom one
        if (show.image_url === imageUrl) {
          console.log(`Skipping - show "${show.name}" already has the correct image: ${imageUrl}`);
          skipped++;
          continue;
        }
        
        // Check if image file exists
        const imagePath = path.join(process.cwd(), imageUrl.replace(/^\//, ''));
        if (!fs.existsSync(imagePath)) {
          console.error(`❌ Image file not found: ${imagePath}`);
          errors++;
          continue;
        }
        
        // Update the database
        const updated = await updateShowImageUrl(showId, imageUrl);
        if (updated) {
          console.log(`✅ Restored custom image for show "${show.name}" (ID: ${showId})`);
          restored++;
        } else {
          console.error(`❌ Failed to update database for show "${show.name}"`);
          errors++;
        }
      } catch (error) {
        console.error(`Error restoring image for show ID ${showId}:`, error);
        errors++;
      }
    }
    
    console.log('\nImage restoration complete:');
    console.log(`✅ Restored: ${restored}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${showIds.length}`);
    
  } catch (error) {
    console.error('Fatal error in image restoration process:', error);
  } finally {
    await pool.end();
  }
}

/**
 * Consolidate all images into a single directory
 */
async function consolidateImages() {
  try {
    console.log('Starting image consolidation process...');
    
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Get all TV shows with images
    const result = await pool.query(
      'SELECT id, name, image_url FROM tv_shows WHERE image_url IS NOT NULL'
    );
    
    const shows = result.rows;
    console.log(`Found ${shows.length} shows with images to process`);
    
    // Statistics
    let consolidated = 0;
    let errors = 0;
    let skipped = 0;
    
    // Load the custom image map
    const customImageMap = loadCustomImageMap();
    
    // Process each show
    for (const show of shows) {
      try {
        const { id, name, image_url } = show;
        
        // Skip if image is already in uploads directory
        if (image_url && image_url.startsWith('/uploads/')) {
          console.log(`Skipping - show "${name}" already has image in uploads directory: ${image_url}`);
          skipped++;
          continue;
        }
        
        // Skip external URLs (we'll handle these separately)
        if (image_url && image_url.startsWith('http')) {
          console.log(`Skipping external URL for "${name}": ${image_url}`);
          skipped++;
          continue;
        }
        
        // Process local image
        if (image_url && image_url.startsWith('/')) {
          // Try to locate the file
          const localPath = path.join(process.cwd(), image_url.replace(/^\//, ''));
          
          if (fs.existsSync(localPath)) {
            // Generate new filename in uploads directory
            const ext = path.extname(localPath) || '.jpg';
            const newFilename = `show-${id}-${Date.now()}${ext}`;
            const newPath = path.join(uploadsDir, newFilename);
            
            // Copy file to new location
            fs.copyFileSync(localPath, newPath);
            
            // Update web path
            const newWebPath = `/uploads/${newFilename}`;
            
            // Update database
            const updated = await updateShowImageUrl(id, newWebPath);
            
            if (updated) {
              // Update custom image map if needed
              if (customImageMap[id] === image_url) {
                customImageMap[id] = newWebPath;
              }
              
              console.log(`✅ Consolidated image for "${name}": ${image_url} -> ${newWebPath}`);
              consolidated++;
            } else {
              console.error(`❌ Failed to update database for "${name}"`);
              errors++;
            }
          } else {
            console.error(`❌ Image file not found for "${name}": ${localPath}`);
            errors++;
          }
        } else {
          console.log(`Skipping - show "${name}" has no valid image URL`);
          skipped++;
        }
      } catch (error) {
        console.error(`Error consolidating image for "${show.name}":`, error);
        errors++;
      }
    }
    
    // Save updated custom image map
    saveCustomImageMap(customImageMap);
    
    console.log('\nImage consolidation complete:');
    console.log(`✅ Consolidated: ${consolidated}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${shows.length}`);
    
  } catch (error) {
    console.error('Fatal error in image consolidation process:', error);
  } finally {
    await pool.end();
  }
}

// Run the appropriate function based on command line argument
if (process.argv.includes('--map')) {
  console.log('Running image mapping process...');
  mapCustomImages().catch(console.error);
} else if (process.argv.includes('--restore')) {
  console.log('Running image restoration process...');
  restoreCustomImages().catch(console.error);
} else if (process.argv.includes('--consolidate')) {
  console.log('Running image consolidation process...');
  consolidateImages().catch(console.error);
} else {
  console.log('No command specified. Use one of:');
  console.log('  --map        Map custom images to TV shows');
  console.log('  --restore    Restore custom images from backup');
  console.log('  --consolidate Consolidate images into a single directory');
}

// Export functions for use in other modules
module.exports = {
  mapCustomImages,
  restoreCustomImages,
  consolidateImages,
  updateCustomImageMap,
  loadCustomImageMap,
  saveCustomImageMap,
  updateShowImageUrl
};