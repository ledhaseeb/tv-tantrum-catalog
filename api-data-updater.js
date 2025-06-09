/**
 * Consolidated API Data Update Utility
 * 
 * This script replaces multiple overlapping API update scripts:
 * - update-api-data.js
 * - update-all-shows-api-data.js
 * - update-youtube-metadata.js
 * 
 * Features:
 * - Updates TV show data from OMDb and YouTube APIs
 * - Preserves custom images when updating data
 * - Keeps track of which shows have API data
 * - Handles both traditional TV shows and YouTube channels
 * - Maintains semantic integrity of sensory details
 */

import { Pool } from 'pg';
import { omdbService } from './server/omdb.js';
import { youtubeService } from './server/youtube.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// File paths for custom data
const customImageMapPath = path.join(__dirname, 'data', 'custom-image-map.json');
const customShowDetailsPath = path.join(__dirname, 'data', 'custom-show-details.json');

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
 * Load custom show details from file
 */
function loadCustomShowDetails() {
  try {
    if (fs.existsSync(customShowDetailsPath)) {
      const data = fs.readFileSync(customShowDetailsPath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading custom show details:', error);
    return {};
  }
}

/**
 * Helper function to extract release year from YouTube publishedAt date
 */
function extractYouTubeReleaseYear(publishedAt) {
  if (!publishedAt) return null;
  try {
    return parseInt(publishedAt.substring(0, 4), 10);
  } catch (error) {
    console.error('Error extracting YouTube release year:', error);
    return null;
  }
}

/**
 * Helper function to clean up YouTube description text
 */
function getCleanDescription(description) {
  if (!description) return '';
  
  return description
    .replace(/Follow us on social media:[\s\S]*?(?=\n\n|$)/, '')
    .replace(/Subscribe to our channel:[\s\S]*?(?=\n\n|$)/, '')
    .replace(/Visit our website:[\s\S]*?(?=\n\n|$)/, '')
    .replace(/\bhttps?:\/\/\S+\b/g, '')  // Remove URLs
    .replace(/\n{3,}/g, '\n\n')          // Normalize line breaks
    .replace(/\s{2,}/g, ' ')             // Normalize spaces
    .trim();
}

/**
 * Update a TV show with API data
 */
async function updateShowWithApiData(show) {
  try {
    const customImageMap = loadCustomImageMap();
    const customShowDetails = loadCustomShowDetails();
    
    console.log(`\nProcessing show: ${show.name} (ID: ${show.id})`);
    
    let updatedFields = {};
    let dataSource = null;
    
    // Try OMDb API first (for traditional TV shows)
    try {
      // If it's a YouTube channel, skip OMDb lookup
      if (show.is_youtube_channel) {
        console.log(`Skipping OMDb lookup for YouTube channel: ${show.name}`);
      } else {
        // Try to find on OMDb
        const omdbData = await omdbService.searchShow(show.name);
        
        if (omdbData) {
          console.log(`OMDb data found for "${show.name}"`);
          dataSource = 'omdb';
          
          // Build updated fields
          updatedFields = {
            ...updatedFields,
            description: omdbData.plot || show.description,
            releaseYear: omdbData.year ? parseInt(omdbData.year, 10) : show.release_year,
            creator: omdbData.director || show.creator,
            hasOmdbData: true
          };
          
          // Only update image if we don't have a custom image
          const hasCustomImage = customImageMap[show.id] || 
                               (show.image_url && !show.image_url.includes('m.media-amazon.com'));
          
          if (!hasCustomImage && omdbData.poster && omdbData.poster !== 'N/A') {
            updatedFields.imageUrl = omdbData.poster;
          }
        }
      }
    } catch (omdbError) {
      console.error(`OMDb API error for "${show.name}":`, omdbError.message);
    }
    
    // Try YouTube API for YouTube channels or as fallback
    try {
      // Is it a YouTube channel or should we try as fallback?
      if (show.is_youtube_channel || (show.name.toLowerCase().includes('youtube') && !dataSource)) {
        const youtubeData = await youtubeService.searchChannel(show.name);
        
        if (youtubeData) {
          console.log(`YouTube data found for "${show.name}"`);
          dataSource = dataSource || 'youtube';
          
          // Extract clean description
          const cleanDescription = getCleanDescription(youtubeData.description);
          
          // Extract release year
          const releaseYear = extractYouTubeReleaseYear(youtubeData.publishedAt);
          
          // Only update description if we don't have one from OMDb
          if (!updatedFields.description || updatedFields.description === show.description) {
            updatedFields.description = cleanDescription || show.description;
          }
          
          // Update YouTube-specific fields
          updatedFields = {
            ...updatedFields,
            isYouTubeChannel: true,
            channelId: youtubeData.channelId,
            subscriberCount: youtubeData.subscriberCount,
            videoCount: youtubeData.videoCount,
            publishedAt: youtubeData.publishedAt,
            releaseYear: updatedFields.releaseYear || releaseYear || show.release_year,
            hasYoutubeData: true
          };
          
          // Only update image if we don't have one from OMDb or custom
          const hasImage = updatedFields.imageUrl || 
                          customImageMap[show.id] ||
                          (show.image_url && !show.image_url.includes('yt3.ggpht.com'));
          
          if (!hasImage && youtubeData.thumbnailUrl) {
            updatedFields.imageUrl = youtubeData.thumbnailUrl;
          }
        }
      }
    } catch (youtubeError) {
      console.error(`YouTube API error for "${show.name}":`, youtubeError.message);
    }
    
    // If we found data, update the database
    if (Object.keys(updatedFields).length > 0) {
      // Never overwrite custom show details
      if (customShowDetails[show.id]) {
        // Keep sensory metrics from custom data
        const customData = customShowDetails[show.id];
        for (const key of ['stimulationScore', 'interactivityLevel', 'dialogueIntensity', 
                          'soundEffectsLevel', 'musicTempo', 'totalMusicLevel', 
                          'sceneFrequency', 'animationStyle']) {
          if (customData[key]) {
            delete updatedFields[key];
          }
        }
      }
      
      // Build SQL update query
      const updateFields = Object.keys(updatedFields)
        .map((key, i) => {
          // Convert camelCase to snake_case for database
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          return `${dbField} = $${i + 1}`;
        })
        .join(', ');
      
      const updateValues = Object.values(updatedFields);
      const query = `
        UPDATE tv_shows
        SET ${updateFields}
        WHERE id = $${updateValues.length + 1}
        RETURNING id, name
      `;
      
      // Add the show ID as the last parameter
      updateValues.push(show.id);
      
      try {
        const result = await pool.query(query, updateValues);
        if (result.rowCount > 0) {
          console.log(`✅ Updated "${show.name}" with ${dataSource} data`);
          return { success: true, source: dataSource };
        } else {
          console.error(`❌ Failed to update "${show.name}" in database`);
          return { success: false };
        }
      } catch (dbError) {
        console.error(`Database error updating "${show.name}":`, dbError.message);
        return { success: false, error: dbError.message };
      }
    } else {
      console.log(`No API data found for "${show.name}"`);
      return { success: false, reason: 'no_data_found' };
    }
  } catch (error) {
    console.error(`Error processing show "${show.name}":`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to process all shows
 */
async function updateAllShowsApiData() {
  try {
    console.log('Starting API data update process...');
    
    // Get all TV shows from database
    const result = await pool.query('SELECT * FROM tv_shows ORDER BY name');
    const shows = result.rows;
    
    console.log(`Found ${shows.length} shows to process`);
    
    // Statistics
    let updated = 0;
    let failed = 0;
    let skipped = 0;
    let omdbCount = 0;
    let youtubeCount = 0;
    
    // Process each show with both APIs
    for (const show of shows) {
      const updateResult = await updateShowWithApiData(show);
      
      if (updateResult.success) {
        updated++;
        if (updateResult.source === 'omdb') omdbCount++;
        if (updateResult.source === 'youtube') youtubeCount++;
      } else if (updateResult.reason === 'no_data_found') {
        skipped++;
      } else {
        failed++;
      }
      
      // Add a small delay to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Final statistics
    console.log('\nAPI data update complete:');
    console.log(`✅ Updated: ${updated} shows`);
    console.log(`⏭️ Skipped: ${skipped} shows (no data found)`);
    console.log(`❌ Failed: ${failed} shows`);
    console.log('\nData sources:');
    console.log(`📺 OMDb: ${omdbCount} shows`);
    console.log(`📱 YouTube: ${youtubeCount} shows`);
    console.log(`📊 Total processed: ${shows.length} shows`);
    
  } catch (error) {
    console.error('Fatal error in API data update process:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

/**
 * Update only YouTube shows
 */
async function updateYouTubeShows() {
  try {
    console.log('Starting YouTube-specific update process...');
    
    // Get only YouTube shows/channels
    const result = await pool.query(`
      SELECT * FROM tv_shows 
      WHERE is_youtube_channel = true
      OR name ILIKE '%youtube%'
      ORDER BY name
    `);
    
    const shows = result.rows;
    console.log(`Found ${shows.length} potential YouTube shows/channels`);
    
    // Statistics
    let updated = 0;
    let failed = 0;
    
    // Process only YouTube data
    for (const show of shows) {
      try {
        const youtubeData = await youtubeService.searchChannel(show.name);
        
        if (youtubeData) {
          console.log(`\nYouTube data found for "${show.name}"`);
          
          // Extract data
          const cleanDescription = getCleanDescription(youtubeData.description);
          const releaseYear = extractYouTubeReleaseYear(youtubeData.publishedAt);
          
          // Update fields
          const updateResult = await pool.query(`
            UPDATE tv_shows
            SET 
              is_youtube_channel = true,
              channel_id = $1,
              subscriber_count = $2,
              video_count = $3,
              published_at = $4,
              release_year = COALESCE($5, release_year),
              description = CASE 
                WHEN description = '' OR description IS NULL 
                THEN $6 
                ELSE description 
              END,
              has_youtube_data = true
            WHERE id = $7
            RETURNING id, name
          `, [
            youtubeData.channelId,
            youtubeData.subscriberCount,
            youtubeData.videoCount,
            youtubeData.publishedAt,
            releaseYear,
            cleanDescription,
            show.id
          ]);
          
          if (updateResult.rowCount > 0) {
            console.log(`✅ Updated YouTube data for "${show.name}"`);
            updated++;
          }
        } else {
          console.log(`No YouTube data found for "${show.name}"`);
        }
      } catch (error) {
        console.error(`Error updating YouTube data for "${show.name}":`, error.message);
        failed++;
      }
      
      // Add delay to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\nYouTube update complete:');
    console.log(`✅ Updated: ${updated} shows`);
    console.log(`❌ Failed: ${failed} shows`);
    
  } catch (error) {
    console.error('Fatal error in YouTube update process:', error);
  } finally {
    await pool.end();
  }
}

// Run the appropriate function based on command line argument when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--youtube')) {
    console.log('Running YouTube-only update...');
    updateYouTubeShows().catch(console.error);
  } else {
    console.log('Running full API data update...');
    updateAllShowsApiData().catch(console.error);
  }
}

// Export functions for use in other modules - using ES Module exports
export {
  updateShowWithApiData,
  updateAllShowsApiData,
  updateYouTubeShows,
  extractYouTubeReleaseYear,
  getCleanDescription
};