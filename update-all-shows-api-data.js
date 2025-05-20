/**
 * Script to update all TV shows with data from OMDb and YouTube APIs
 * 
 * This script will:
 * 1. Get all shows from the database
 * 2. For each show, lookup data from OMDb API and YouTube API
 * 3. Update the show with any new information found (EXCEPT custom images)
 * 4. Log the results for review
 * 
 * IMPORTANT: This script never overwrites custom images!
 */

import pg from 'pg';
const { Pool } = pg;
import { omdbService } from './server/omdb.js';
import { youtubeService } from './server/youtube.js';
import dotenv from 'dotenv';
dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to extract release year from YouTube publishedAt date
function extractYouTubeReleaseYear(publishedAt) {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  return date.getFullYear();
}

// Clean YouTube description
function getCleanDescription(description) {
  if (!description) return '';
  
  // Remove URLs
  let cleaned = description.replace(/https?:\/\/\S+/g, '');
  
  // Remove email addresses
  cleaned = cleaned.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '');
  
  // Remove excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Trim and return first 1000 chars
  return cleaned.trim().substring(0, 1000);
}

// Main function to process all shows
async function processAllShows() {
  console.log('Starting to process all TV shows...');
  
  try {
    // Get all shows from database
    const showsResult = await pool.query('SELECT id, name FROM tv_shows ORDER BY name');
    const shows = showsResult.rows;
    console.log(`Found ${shows.length} TV shows to process`);
    
    // Statistics
    let stats = {
      totalProcessed: 0,
      omdbUpdates: 0,
      youtubeUpdates: 0,
      errors: 0,
      noDataFound: 0
    };
    
    // Process each show
    for (const show of shows) {
      try {
        console.log(`Processing show [${show.id}]: ${show.name}`);
        let updateData = {};
        let dataFound = false;
        
        // Try OMDb API
        const omdbData = await omdbService.getShowData(show.name);
        if (omdbData) {
          console.log(`   ✓ Found OMDb data for "${show.name}"`);
          dataFound = true;
          
          // Extract year and convert to numeric if possible
          let releaseYear = null;
          let endYear = null;
          let isOngoing = null;
          
          if (omdbData.year) {
            const yearParts = omdbData.year.split('–'); // Note: this is an en dash, not a hyphen
            if (yearParts.length > 0 && yearParts[0]) {
              releaseYear = parseInt(yearParts[0], 10);
              if (!isNaN(releaseYear)) {
                updateData.releaseYear = releaseYear;
              }
            }
            
            // Check if show is ongoing or ended
            if (yearParts.length > 1) {
              if (yearParts[1]) {
                endYear = parseInt(yearParts[1], 10);
                if (!isNaN(endYear)) {
                  updateData.endYear = endYear;
                  isOngoing = false;
                }
              } else {
                // If format is "2014–" (with nothing after the dash), show is ongoing
                isOngoing = true;
              }
            }
            
            // Only update isOngoing if we have valid year data
            if (releaseYear && (isOngoing !== null)) {
              updateData.isOngoing = isOngoing;
            }
          }
          
          // Set runtime if available
          if (omdbData.runtime && omdbData.runtime !== '') {
            const runtimeMatch = omdbData.runtime.match(/(\d+)/);
            if (runtimeMatch && runtimeMatch[1]) {
              const minutes = parseInt(runtimeMatch[1], 10);
              if (!isNaN(minutes)) {
                updateData.episodeLength = minutes;
              }
            }
          }
          
          // Set seasons if available
          if (omdbData.totalSeasons && omdbData.totalSeasons !== '') {
            const seasons = parseInt(omdbData.totalSeasons, 10);
            if (!isNaN(seasons)) {
              updateData.seasons = seasons;
            }
          }
          
          // Set creator/director if available
          if (omdbData.director && omdbData.director !== '' && omdbData.director !== 'N/A') {
            updateData.creator = omdbData.director;
          }
          
          // If we have a plot and the current description is generic or missing, update it
          if (omdbData.plot && omdbData.plot !== '') {
            // Check current description in database
            const descResult = await pool.query('SELECT description FROM tv_shows WHERE id = $1', [show.id]);
            const currentDesc = descResult.rows[0]?.description;
            
            if (!currentDesc || currentDesc === 'A children\'s TV show' || currentDesc.length < 20) {
              updateData.description = omdbData.plot;
            }
          }
          
          // If show has no image, use OMDb poster
          if (omdbData.poster && omdbData.poster !== '') {
            const imageResult = await pool.query('SELECT imageUrl FROM tv_shows WHERE id = $1', [show.id]);
            const currentImage = imageResult.rows[0]?.imageUrl;
            
            if (!currentImage) {
              updateData.imageUrl = omdbData.poster;
            }
          }
          
          // If we have update data, apply it
          if (Object.keys(updateData).length > 0) {
            console.log(`   ✓ Updating OMDb data for show "${show.name}":`, updateData);
            
            // Build the SQL query
            const updates = [];
            const values = [show.id];
            let paramCount = 2;
            
            for (const [key, value] of Object.entries(updateData)) {
              updates.push(`${key} = $${paramCount}`);
              values.push(value);
              paramCount++;
            }
            
            const updateQuery = `
              UPDATE tv_shows 
              SET ${updates.join(', ')} 
              WHERE id = $1
            `;
            
            await pool.query(updateQuery, values);
            stats.omdbUpdates++;
          }
        }
        
        // Try YouTube API for all shows (might be available on both platforms)
        const youtubeData = await youtubeService.getChannelData(show.name);
        if (youtubeData) {
          console.log(`   ✓ Found YouTube data for "${show.name}"`);
          dataFound = true;
          
          // Reset update data for YouTube specific fields
          updateData = {};
          
          // Extract release year from publishedAt date
          const releaseYear = extractYouTubeReleaseYear(youtubeData.publishedAt);
          
          // Set creator to channel name if no better info
          const creator = youtubeData.title;
          
          // Check current values before updating
          const currentDataResult = await pool.query(`
            SELECT creator, releaseYear, description, imageUrl, isYouTubeChannel
            FROM tv_shows WHERE id = $1
          `, [show.id]);
          const currentData = currentDataResult.rows[0] || {};
          
          // Update creator if not already set
          if (!currentData.creator && creator) {
            updateData.creator = creator;
          }
          
          // Update release year if not already set
          if (!currentData.releaseYear && releaseYear) {
            updateData.releaseYear = releaseYear;
          }
          
          // YouTube shows are typically ongoing
          if (typeof currentData.isOngoing !== 'boolean') {
            updateData.isOngoing = true;
          }
          
          // Get a cleaned description from YouTube
          const cleanDescription = getCleanDescription(youtubeData.description);
          
          // Update description if generic or missing
          if (cleanDescription && (!currentData.description || 
              currentData.description === 'A children\'s TV show' || 
              currentData.description.length < 20)) {
            updateData.description = cleanDescription;
          }
          
          // If show has no image, use YouTube thumbnail
          if (!currentData.imageUrl && youtubeData.thumbnailUrl) {
            updateData.imageUrl = youtubeData.thumbnailUrl;
          }
          
          // Make sure "YouTube" is in the availableOn array
          const availableOnResult = await pool.query(
            'SELECT availableOn FROM tv_shows WHERE id = $1',
            [show.id]
          );
          let availableOn = availableOnResult.rows[0]?.availableOn || [];
          
          if (!Array.isArray(availableOn)) {
            availableOn = [];
          }
          
          if (!availableOn.includes('YouTube')) {
            availableOn.push('YouTube');
            updateData.availableOn = availableOn;
          }
          
          // Add YouTube-specific data
          updateData.subscriberCount = youtubeData.subscriberCount;
          updateData.videoCount = youtubeData.videoCount;
          updateData.channelId = youtubeData.channelId;
          updateData.isYouTubeChannel = true;
          updateData.publishedAt = youtubeData.publishedAt;
          
          // If we have update data, apply it
          if (Object.keys(updateData).length > 0) {
            console.log(`   ✓ Updating YouTube data for show "${show.name}":`, updateData);
            
            // Build the SQL query
            const updates = [];
            const values = [show.id];
            let paramCount = 2;
            
            for (const [key, value] of Object.entries(updateData)) {
              // Handle arrays for availableOn
              if (key === 'availableOn') {
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
              } else {
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
              }
              paramCount++;
            }
            
            const updateQuery = `
              UPDATE tv_shows 
              SET ${updates.join(', ')} 
              WHERE id = $1
            `;
            
            await pool.query(updateQuery, values);
            stats.youtubeUpdates++;
          }
        }
        
        if (!dataFound) {
          console.log(`   ✗ No API data found for "${show.name}"`);
          stats.noDataFound++;
        }
        
        stats.totalProcessed++;
        
      } catch (error) {
        console.error(`Error processing show ${show.name}:`, error);
        stats.errors++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Print statistics
    console.log('\n=== Processing Complete ===');
    console.log(`Total shows processed: ${stats.totalProcessed}`);
    console.log(`Shows updated with OMDb data: ${stats.omdbUpdates}`);
    console.log(`Shows updated with YouTube data: ${stats.youtubeUpdates}`);
    console.log(`Shows with no API data found: ${stats.noDataFound}`);
    console.log(`Errors encountered: ${stats.errors}`);
    
  } catch (error) {
    console.error('Error in main processing:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the main function
processAllShows().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});