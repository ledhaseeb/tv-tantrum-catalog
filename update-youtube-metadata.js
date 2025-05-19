/**
 * Script to update TV show metadata using the YouTube API
 * 
 * This script focuses on:
 * 1. Identifying YouTube shows in the database
 * 2. Fetching metadata from YouTube API for each show
 * 3. Updating the database with enriched information
 */

require('dotenv').config();
const { db } = require('./server/db');
const { desc, eq } = require('drizzle-orm');
const { tvShows } = require('./shared/schema');
const fetch = require('node-fetch');

// Base URL for YouTube API
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Get data from YouTube API for a channel
 */
async function getYouTubeChannelData(channelName) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is not set');
    }

    console.log(`Fetching YouTube data for "${channelName}"`);

    // First search for the channel
    const searchUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1&key=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData?.items || !Array.isArray(searchData.items) || searchData.items.length === 0) {
      console.warn(`YouTube API: No channel found for "${channelName}"`);
      return null;
    }

    // Get the channel ID from search results
    const channelId = searchData.items[0]?.id?.channelId;
    if (!channelId) {
      console.warn(`YouTube API: Invalid channel ID for "${channelName}"`);
      return null;
    }

    // Now get detailed channel information
    const channelUrl = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
    const channelResponse = await fetch(channelUrl);
    const channelData = await channelResponse.json();

    if (!channelData?.items || !Array.isArray(channelData.items) || channelData.items.length === 0) {
      console.warn(`YouTube API: Failed to get details for channel "${channelName}"`);
      return null;
    }

    const channel = channelData.items[0];
    
    // Extract only the fields we need
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
 * Extract release year from YouTube publishedAt date
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
 * Clean up YouTube description for our database
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
 * Update a TV show's details in the database
 */
async function updateTvShow(id, details) {
  try {
    const result = await db.update(tvShows)
      .set(details)
      .where(eq(tvShows.id, id))
      .returning();
    
    return result[0] || null;
  } catch (error) {
    console.error(`Error updating TV show ${id}:`, error);
    return null;
  }
}

/**
 * Main function to process YouTube shows
 */
async function updateYouTubeShows() {
  try {
    console.log('Starting YouTube metadata update process...');
    
    // Get all shows that are available on YouTube
    const youtubeShows = await db.select()
      .from(tvShows)
      .where(eq(tvShows.availableOn, 'YouTube'));
    
    console.log(`Found ${youtubeShows.length} YouTube shows in the database`);
    
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    
    // Process each YouTube show
    for (const show of youtubeShows) {
      console.log(`Processing show: ${show.name}`);
      
      // Skip shows that already have complete metadata
      if (show.creator && show.releaseYear && show.description !== 'A children\'s TV show' && show.description) {
        console.log(`Skipping "${show.name}" - already has complete metadata`);
        skipped++;
        continue;
      }
      
      // Get YouTube data
      const youtubeData = await getYouTubeChannelData(show.name);
      
      if (!youtubeData) {
        console.log(`Failed to get YouTube data for "${show.name}"`);
        failed++;
        continue;
      }
      
      // Build update data
      const updateData = {};
      
      // Extract release year
      const releaseYear = extractReleaseYear(youtubeData.publishedAt);
      
      // Set creator to channel name if no better info
      const creator = youtubeData.title;
      
      // Update metadata if not already set
      if (!show.creator && creator) {
        updateData.creator = creator;
      }
      
      if (!show.releaseYear && releaseYear) {
        updateData.releaseYear = releaseYear;
      }
      
      // YouTube shows are typically ongoing
      if (typeof show.isOngoing !== 'boolean') {
        updateData.isOngoing = true;
      }
      
      // Get a cleaned description from YouTube
      const cleanDescription = getCleanDescription(youtubeData.description);
      
      // Update description if generic or missing
      if (cleanDescription && (show.description === 'A children\'s TV show' || !show.description)) {
        updateData.description = cleanDescription;
      }
      
      // If show has no image, use YouTube thumbnail
      if (!show.imageUrl && youtubeData.thumbnailUrl) {
        updateData.imageUrl = youtubeData.thumbnailUrl;
      }
      
      // Only update if we have new data
      if (Object.keys(updateData).length > 0) {
        console.log(`Updating "${show.name}" with YouTube data:`, updateData);
        
        const updatedShow = await updateTvShow(show.id, updateData);
        
        if (updatedShow) {
          console.log(`Successfully updated "${show.name}"`);
          updated++;
        } else {
          console.log(`Failed to update "${show.name}" in database`);
          failed++;
        }
      } else {
        console.log(`No new data to update for "${show.name}"`);
        skipped++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    console.log('\nYouTube metadata update complete:');
    console.log(`- Updated: ${updated} shows`);
    console.log(`- Skipped: ${skipped} shows`);
    console.log(`- Failed: ${failed} shows`);
    
  } catch (error) {
    console.error('Error updating YouTube metadata:', error);
  } finally {
    console.log('Closing database connection...');
    // Close database connection
    await db.end();
    console.log('Done!');
  }
}

// Run the main function
updateYouTubeShows();