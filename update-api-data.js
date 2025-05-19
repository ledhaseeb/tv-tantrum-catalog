/**
 * Script to update all TV shows with data from OMDb and YouTube APIs
 * 
 * This script will:
 * 1. Get all shows from the database
 * 2. For each show, lookup data from OMDb and YouTube APIs
 * 3. Update the show with any new information found
 * 4. Log the results for review
 * 
 * Priority rule: Always prefer OMDb descriptions over YouTube descriptions
 */

// CommonJS imports for compatibility with project structure
const pg = require('pg');
const { Pool } = pg;
const { omdbService } = require('./server/omdb');
const { youtubeService } = require('./server/youtube');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

// Database connection
const pool = createPool({
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

// Store processed shows
let processedShows = {
  omdb: [],
  youtube: [],
  neither: [],
  both: []
};

// Main function to process all shows
async function processAllShows() {
  console.log('Starting to process all TV shows...');
  
  try {
    // Get all shows from database
    const showsResult = await pool.query('SELECT id, name, description FROM tv_shows ORDER BY name');
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
        let hasOmdbData = false;
        let hasYoutubeData = false;
        
        // Variables to track descriptions from both sources
        let omdbDescription = null;
        let youtubeDescription = null;
        
        // Try OMDb API first
        const omdbData = await omdbService.getShowData(show.name);
        if (omdbData) {
          console.log(`   ✓ Found OMDb data for "${show.name}"`);
          dataFound = true;
          hasOmdbData = true;
          
          // Save the OMDb description if available
          if (omdbData.plot && omdbData.plot !== '') {
            omdbDescription = omdbData.plot;
          }
          
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
          
          // If show has no image, use OMDb poster
          if (omdbData.poster && omdbData.poster !== '') {
            const imageResult = await pool.query('SELECT imageUrl FROM tv_shows WHERE id = $1', [show.id]);
            const currentImage = imageResult.rows[0]?.imageUrl;
            
            if (!currentImage) {
              updateData.imageUrl = omdbData.poster;
            }
          }
        }
        
        // Try YouTube API (might be available on both platforms)
        const youtubeData = await youtubeService.getChannelData(show.name);
        if (youtubeData) {
          console.log(`   ✓ Found YouTube data for "${show.name}"`);
          dataFound = true;
          hasYoutubeData = true;
          
          // Save the YouTube description if available
          if (youtubeData.description) {
            youtubeDescription = getCleanDescription(youtubeData.description);
          }
          
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
        }
        
        // Decide which description to use (prioritize OMDb over YouTube)
        const currentDesc = show.description;
        if (!currentDesc || currentDesc === 'A children\'s TV show' || currentDesc.length < 20) {
          // If we have an OMDb description, use it
          if (omdbDescription) {
            updateData.description = omdbDescription;
          }
          // Otherwise, if we have a YouTube description, use it
          else if (youtubeDescription) {
            updateData.description = youtubeDescription;
          }
        }
        
        // Track which APIs had data
        if (hasOmdbData && hasYoutubeData) {
          processedShows.both.push(show.name);
        } else if (hasOmdbData) {
          processedShows.omdb.push(show.name);
        } else if (hasYoutubeData) {
          processedShows.youtube.push(show.name);
        } else {
          processedShows.neither.push(show.name);
        }
        
        // If we have update data, apply it
        if (Object.keys(updateData).length > 0) {
          console.log(`   ✓ Updating data for show "${show.name}":`, updateData);
          
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
          
          if (hasOmdbData) stats.omdbUpdates++;
          if (hasYoutubeData) stats.youtubeUpdates++;
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
    
    // Write processed shows to a report file
    const report = {
      stats,
      shows: processedShows
    };
    
    fs.writeFileSync('api-data-report.json', JSON.stringify(report, null, 2));
    console.log('\nReport written to api-data-report.json');
    
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