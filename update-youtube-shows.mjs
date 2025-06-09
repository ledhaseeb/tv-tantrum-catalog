/**
 * Script to update TV shows with YouTube-specific data
 * 
 * This standalone script:
 * 1. Identifies all shows with "YouTube" in their availableOn field
 * 2. Fetches YouTube channel data for each show
 * 3. Updates the database with YouTube-specific information
 */

import { db } from './server/db.ts';
import fetch from 'node-fetch';

// Base URL for YouTube API
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Get YouTube channel data by name
 */
async function getYouTubeChannelData(channelName) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YOUTUBE_API_KEY environment variable is not set');
      return null;
    }

    console.log(`Fetching YouTube data for "${channelName}"`);

    // First search for the channel
    const searchUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1&key=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData?.items || !Array.isArray(searchData.items) || searchData.items.length === 0) {
      console.warn(`No YouTube channel found for "${channelName}"`);
      return null;
    }

    // Get the channel ID from search results
    const channelId = searchData.items[0]?.id?.channelId;
    if (!channelId) {
      console.warn(`Invalid channel ID for "${channelName}"`);
      return null;
    }

    // Get detailed channel information
    const channelUrl = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
    const channelResponse = await fetch(channelUrl);
    const channelData = await channelResponse.json();

    if (!channelData?.items || !Array.isArray(channelData.items) || channelData.items.length === 0) {
      console.warn(`Failed to get details for channel "${channelName}"`);
      return null;
    }

    const channel = channelData.items[0];
    
    return {
      title: channel.snippet.title,
      description: channel.snippet.description || '',
      publishedAt: channel.snippet.publishedAt,
      thumbnailUrl: channel.snippet.thumbnails.high?.url || '',
      subscriberCount: channel.statistics?.subscriberCount || '0',
      videoCount: channel.statistics?.videoCount || '0',
      channelId: channelId
    };
  } catch (error) {
    console.error(`Error fetching YouTube data for "${channelName}":`, error);
    return null;
  }
}

/**
 * Extract a release year from YouTube publishedAt date
 */
function extractReleaseYear(publishedAt) {
  if (!publishedAt) return null;
  
  try {
    const date = new Date(publishedAt);
    return date.getFullYear();
  } catch (error) {
    console.error('Error parsing YouTube publishedAt date:', error);
    return null;
  }
}

/**
 * Clean up YouTube description for the database
 */
function getCleanDescription(description) {
  if (!description) return '';
  
  // Remove common YouTube channel boilerplate
  let cleanDesc = description
    .replace(/subscribe to our channel/gi, '')
    .replace(/follow us on/gi, '')
    .replace(/check out our website/gi, '')
    .replace(/click the bell/gi, '')
    .replace(/http(s)?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\n\s*\n/g, '\n') // Remove extra newlines
    .trim();
    
  // If description is too long, trim it
  if (cleanDesc.length > 500) {
    cleanDesc = cleanDesc.substring(0, 500) + '...';
  }
  
  return cleanDesc || '';
}

/**
 * Main function to update YouTube shows
 */
async function updateYouTubeShows() {
  try {
    console.log('Starting YouTube show update process...');
    
    // Get all shows with "YouTube" in availableOn
    const result = await db.query(`
      SELECT id, name, available_on, description, creator, release_year, 
             is_youtube_channel, channel_id, subscriber_count, video_count
      FROM tv_shows 
      WHERE available_on::text LIKE '%YouTube%'
    `);
    
    const youtubeShows = result.rows;
    console.log(`Found ${youtubeShows.length} YouTube shows`);
    
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const show of youtubeShows) {
      console.log(`\nProcessing: ${show.name}`);
      
      if (show.is_youtube_channel && show.channel_id && show.subscriber_count) {
        console.log(`  Already has YouTube data. Skipping.`);
        skipped++;
        continue;
      }
      
      const youtubeData = await getYouTubeChannelData(show.name);
      if (!youtubeData) {
        console.log(`  No YouTube data found. Failed.`);
        failed++;
        continue;
      }
      
      // Get a clean description
      const cleanDescription = getCleanDescription(youtubeData.description);
      
      // Build update data
      const updates = {
        channel_id: youtubeData.channelId,
        subscriber_count: youtubeData.subscriberCount,
        video_count: youtubeData.videoCount,
        is_youtube_channel: true,
        published_at: youtubeData.publishedAt
      };
      
      // Update description if it's generic
      if ((show.description === 'A children\'s TV show' || !show.description) && cleanDescription) {
        updates.description = cleanDescription;
      }
      
      // Update creator if missing
      if (!show.creator && youtubeData.title) {
        updates.creator = youtubeData.title;
      }
      
      // Update release year if missing
      const releaseYear = extractReleaseYear(youtubeData.publishedAt);
      if (!show.release_year && releaseYear) {
        updates.release_year = releaseYear;
      }
      
      // Format the SET clause for SQL
      const setClause = Object.entries(updates)
        .map(([key, value]) => {
          if (value === null) return `${key} = NULL`;
          if (typeof value === 'boolean') return `${key} = ${value}`;
          if (typeof value === 'number') return `${key} = ${value}`;
          return `${key} = '${value.replace(/'/g, "''")}'`; // Escape single quotes
        })
        .join(', ');
      
      // Update the show
      const updateQuery = `
        UPDATE tv_shows
        SET ${setClause}
        WHERE id = ${show.id}
      `;
      
      try {
        await db.query(updateQuery);
        console.log(`  Successfully updated with YouTube data:`, updates);
        updated++;
      } catch (error) {
        console.error(`  Error updating show:`, error);
        failed++;
      }
      
      // Add a delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    console.log('\nSummary:');
    console.log(`  Total shows processed: ${youtubeShows.length}`);
    console.log(`  Successfully updated: ${updated}`);
    console.log(`  Skipped (already has data): ${skipped}`);
    console.log(`  Failed: ${failed}`);
    
  } catch (error) {
    console.error('Error in update process:', error);
  }
}

// Run the script
updateYouTubeShows()
  .then(() => {
    console.log('YouTube show update complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });