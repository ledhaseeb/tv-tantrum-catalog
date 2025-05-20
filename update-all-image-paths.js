/**
 * This script updates all image URLs in the database to use the primary image directory
 * It will fetch remote images (GitHub, OMDB) and save them locally if needed
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const PRIMARY_IMAGE_DIR = path.join(__dirname, 'public', 'media', 'tv-shows');

// Ensure directory exists
if (!fs.existsSync(PRIMARY_IMAGE_DIR)) {
  fs.mkdirSync(PRIMARY_IMAGE_DIR, { recursive: true });
}

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Download an image from a URL
async function downloadImage(url, showId) {
  try {
    // Skip if not a URL
    if (!url.startsWith('http')) {
      return null;
    }
    
    // Create a unique filename based on show ID
    const ext = path.extname(url) || '.jpg'; // Default to jpg if no extension
    const filename = `show-${showId}${ext}`;
    const localPath = path.join(PRIMARY_IMAGE_DIR, filename);
    
    // Check if image already exists
    if (fs.existsSync(localPath)) {
      console.log(`Image for show ID ${showId} already exists at ${localPath}`);
      return `/media/tv-shows/${filename}`;
    }
    
    // Fetch the image
    console.log(`Downloading image from ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Get image as buffer
    const imageBuffer = await response.buffer();
    
    // Save to file
    fs.writeFileSync(localPath, imageBuffer);
    console.log(`Saved image to ${localPath}`);
    
    // Return web path
    return `/media/tv-shows/${filename}`;
  } catch (error) {
    console.error(`Error downloading image for show ID ${showId}:`, error);
    return null;
  }
}

// Main function to update all image URLs
async function updateAllImagePaths() {
  try {
    // Get all shows with images
    const { rows: shows } = await pool.query(
      "SELECT id, name, image_url FROM tv_shows WHERE image_url IS NOT NULL AND image_url NOT LIKE '/media/tv-shows/%'"
    );
    
    console.log(`Found ${shows.length} shows with non-primary image paths to update`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each show
    for (const show of shows) {
      try {
        const { id, name, image_url } = show;
        
        console.log(`\nProcessing show: ${name} (ID: ${id})`);
        console.log(`Current image URL: ${image_url}`);
        
        let newPath = null;
        
        // Handle remote images
        if (image_url.startsWith('http')) {
          newPath = await downloadImage(image_url, id);
        } 
        // Handle local images that aren't in the primary directory
        else if (image_url.startsWith('/') && !image_url.startsWith('/media/tv-shows/')) {
          // Create filename based on show ID for consistency
          const ext = path.extname(image_url) || '.jpg';
          const filename = `show-${id}${ext}`;
          const targetPath = path.join(PRIMARY_IMAGE_DIR, filename);
          
          // Try to find the source file
          const relativePath = image_url.startsWith('/') ? image_url.substring(1) : image_url;
          const possibleSourcePaths = [
            path.join(__dirname, relativePath),
            path.join(__dirname, 'client/public', relativePath),
            path.join(__dirname, 'public', relativePath),
            path.join(__dirname, 'client/public/custom-images', path.basename(relativePath)),
            path.join(__dirname, 'public/custom-images', path.basename(relativePath)),
            path.join(__dirname, 'public/uploads', path.basename(relativePath)),
            path.join(__dirname, 'public/uploads/optimized', path.basename(relativePath))
          ];
          
          // Find the first path that exists
          let sourcePath = null;
          for (const checkPath of possibleSourcePaths) {
            if (fs.existsSync(checkPath)) {
              sourcePath = checkPath;
              break;
            }
          }
          
          if (sourcePath) {
            // Copy the file to the primary directory
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`Copied image from ${sourcePath} to ${targetPath}`);
            newPath = `/media/tv-shows/${filename}`;
          } else {
            console.log(`Could not find source image for path: ${image_url}`);
          }
        }
        
        // Update the database if we have a new path
        if (newPath) {
          await pool.query(
            'UPDATE tv_shows SET image_url = $1 WHERE id = $2',
            [newPath, id]
          );
          
          console.log(`Updated image path for ${name} to ${newPath}`);
          successCount++;
        } else {
          console.log(`Could not update image path for ${name}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error processing show:`, error);
        errorCount++;
      }
    }
    
    console.log('\nUpdate complete:');
    console.log(`- Successfully updated: ${successCount}`);
    console.log(`- Failed to update: ${errorCount}`);
    console.log(`- Total processed: ${shows.length}`);
    
  } catch (error) {
    console.error('Error during update process:', error);
  } finally {
    await pool.end();
  }
}

// Run the main function
updateAllImagePaths().catch(console.error);