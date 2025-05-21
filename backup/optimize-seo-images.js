/**
 * Script to optimize all custom images in the database for better SEO
 */
const { Pool } = require('pg');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Create directories if needed
const imageDir = './public/uploads';
const optimizedDir = './public/uploads/optimized';

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Get all shows with custom images that need optimization
 */
async function getShowsWithCustomImages() {
  const query = `
    SELECT id, name, image_url 
    FROM tv_shows 
    WHERE image_url IS NOT NULL 
      AND image_url NOT LIKE '%/uploads/optimized/%'
      AND image_url NOT LIKE '%m.media-amazon.com%'
      AND image_url NOT LIKE '%omdbapi.com%'
  `;
  
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Download or copy image from URL or local path
 */
async function getImage(imageUrl, showId) {
  try {
    // Handle local file paths
    if (imageUrl.startsWith('/')) {
      // Try different possible locations
      const possiblePaths = [
        path.join('public', imageUrl),
        path.join('public', 'uploads', path.basename(imageUrl)),
        path.join('public', 'custom-images', path.basename(imageUrl)),
        path.join('public', 'images', path.basename(imageUrl)),
        path.join('attached_assets', path.basename(imageUrl)),
        imageUrl.substring(1) // Try without leading slash
      ];
      
      for (const localPath of possiblePaths) {
        if (fs.existsSync(localPath)) {
          console.log(`Found local image at ${localPath}`);
          
          // Create a copy in uploads directory
          const timestamp = Date.now();
          const uniqueFilename = `show-${showId}-${timestamp}${path.extname(localPath) || '.jpg'}`;
          const tempPath = path.join(imageDir, uniqueFilename);
          
          fs.copyFileSync(localPath, tempPath);
          return tempPath;
        }
      }
      
      console.log(`Could not find local image: ${imageUrl}`);
      return null;
    }
    
    // Download remote URLs
    if (imageUrl.startsWith('http')) {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.error(`Failed to download: ${response.status}`);
          return null;
        }
        
        const buffer = await response.buffer();
        const timestamp = Date.now();
        const uniqueFilename = `show-${showId}-${timestamp}.jpg`;
        const tempPath = path.join(imageDir, uniqueFilename);
        
        fs.writeFileSync(tempPath, buffer);
        return tempPath;
      } catch (error) {
        console.error(`Download error: ${error.message}`);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting image: ${error.message}`);
    return null;
  }
}

/**
 * Optimize image for web use
 */
async function optimizeImage(filePath, showId) {
  try {
    const filename = path.basename(filePath, path.extname(filePath));
    const optimizedFilename = `${filename}-optimized.jpg`;
    const optimizedPath = path.join(optimizedDir, optimizedFilename);
    
    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;
    
    // Target portrait-style dimensions
    let targetWidth, targetHeight;
    
    if (height >= width) {
      // Already portrait
      targetWidth = Math.min(width, 600);
      targetHeight = Math.round((targetWidth / width) * height);
      
      // Cap height for very tall images
      if (targetHeight > 900) {
        targetHeight = 900;
        targetWidth = Math.round((targetHeight / height) * width);
      }
    } else {
      // Convert landscape to portrait-friendly
      targetHeight = Math.min(height, 800);
      targetWidth = Math.min(width, Math.round(targetHeight * 0.75));
    }
    
    // Optimize the image
    await sharp(filePath)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(optimizedPath);
    
    console.log(`Optimized to ${targetWidth}x${targetHeight}`);
    
    // Return web path
    return `/uploads/optimized/${optimizedFilename}`;
  } catch (error) {
    console.error(`Optimization error: ${error.message}`);
    return null;
  }
}

/**
 * Save the new optimized image path to the database
 */
async function updateShowImage(showId, optimizedUrl) {
  try {
    await pool.query(
      'UPDATE tv_shows SET image_url = $1 WHERE id = $2',
      [optimizedUrl, showId]
    );
    
    // Also update custom image map
    try {
      const customImageMap = JSON.parse(fs.readFileSync('./customImageMap.json', 'utf8'));
      customImageMap[showId] = optimizedUrl;
      fs.writeFileSync('./customImageMap.json', JSON.stringify(customImageMap, null, 2));
    } catch (e) {
      console.log('Note: Could not update customImageMap.json');
    }
    
    return true;
  } catch (error) {
    console.error(`Database update error: ${error.message}`);
    return false;
  }
}

/**
 * Main optimization function
 */
async function optimizeAllImages() {
  console.log('Starting SEO image optimization...');
  
  try {
    // Get shows that need optimization
    const shows = await getShowsWithCustomImages();
    console.log(`Found ${shows.length} shows with custom images to optimize`);
    
    let optimized = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each show
    for (const show of shows) {
      try {
        console.log(`\nProcessing: ${show.name} (ID: ${show.id})`);
        
        // Get image file
        const imagePath = await getImage(show.image_url, show.id);
        if (!imagePath) {
          console.log(`Skipping - could not access image for ${show.name}`);
          skipped++;
          continue;
        }
        
        // Optimize image
        const optimizedUrl = await optimizeImage(imagePath, show.id);
        if (!optimizedUrl) {
          console.error(`Failed to optimize image for ${show.name}`);
          errors++;
          continue;
        }
        
        // Update in database
        const updated = await updateShowImage(show.id, optimizedUrl);
        if (updated) {
          console.log(`✅ Successfully optimized image for ${show.name}`);
          optimized++;
        } else {
          console.error(`❌ Failed to update database for ${show.name}`);
          errors++;
        }
        
        // Clean up temp file
        try {
          if (imagePath.startsWith(imageDir)) {
            fs.unlinkSync(imagePath);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        
      } catch (error) {
        console.error(`Error processing ${show.name}: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\nOptimization complete:');
    console.log(`✅ Optimized: ${optimized}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${shows.length}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

// Run the optimization
optimizeAllImages().catch(console.error);