/**
 * This script tests the YouTube API integration by:
 * 1. Fetching a YouTube show from the database
 * 2. Calling the YouTube API for metadata
 * 3. Displaying the results
 * 
 * Run with: node test-youtube-integration.js
 */

import { pool } from './server/db.ts';
import fetch from 'node-fetch';

// YouTube API URL and key
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;

// Test function to search for a channel on YouTube
async function searchYouTubeChannel(channelName) {
  try {
    console.log(`Searching for YouTube channel: "${channelName}"`);
    
    // Construct the search URL
    const searchUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1&key=${API_KEY}`;
    
    // Make the request
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    // Check for errors
    if (data.error) {
      console.error('YouTube API Error:', data.error.message);
      return null;
    }
    
    // Check if we got any results
    if (!data.items || data.items.length === 0) {
      console.log(`No channel found for "${channelName}"`);
      return null;
    }
    
    // Extract channel ID and basic info
    const channelId = data.items[0].id.channelId;
    const snippet = data.items[0].snippet;
    
    console.log(`Found channel: "${snippet.title}" (${channelId})`);
    
    // Get more detailed channel information
    const channelUrl = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
    const channelResponse = await fetch(channelUrl);
    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      console.log(`Could not get details for channel ID: ${channelId}`);
      return null;
    }
    
    // Return full channel data
    return {
      id: channelId,
      title: channelData.items[0].snippet.title,
      description: channelData.items[0].snippet.description,
      publishedAt: channelData.items[0].snippet.publishedAt,
      thumbnailUrl: channelData.items[0].snippet.thumbnails.high?.url,
      subscriberCount: channelData.items[0].statistics?.subscriberCount,
      videoCount: channelData.items[0].statistics?.videoCount
    };
  } catch (error) {
    console.error(`Error searching YouTube for "${channelName}":`, error);
    return null;
  }
}

// Get a YouTube show from the database to test with
async function getYouTubeShowFromDatabase() {
  try {
    const result = await pool.query(`
      SELECT id, name, available_on, description 
      FROM tv_shows 
      WHERE available_on::text LIKE '%YouTube%'
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('No YouTube shows found in the database');
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching YouTube show from database:', error);
    return null;
  }
}

// Get a clean description for database storage
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

// Extract release year from publishedAt date
function extractReleaseYear(publishedAt) {
  if (!publishedAt) return null;
  
  try {
    const date = new Date(publishedAt);
    return date.getFullYear();
  } catch (error) {
    console.error('Error parsing publishedAt date:', error);
    return null;
  }
}

// Main test function
async function testYouTubeIntegration() {
  try {
    console.log('Testing YouTube API Integration');
    console.log('==============================');
    
    if (!API_KEY) {
      console.error('Error: YOUTUBE_API_KEY environment variable is not set');
      return;
    }
    
    // Get a YouTube show from the database
    const show = await getYouTubeShowFromDatabase();
    if (!show) {
      console.log('Could not find a YouTube show to test with');
      return;
    }
    
    console.log(`\nFound show in database: "${show.name}" (ID: ${show.id})`);
    console.log(`Current description: "${show.description?.substring(0, 100)}${show.description?.length > 100 ? '...' : ''}"`);
    
    // Search for the channel on YouTube
    const channelData = await searchYouTubeChannel(show.name);
    if (!channelData) {
      console.log('Could not get YouTube data for this show');
      return;
    }
    
    // Display the results
    console.log('\nYouTube API Results:');
    console.log('-------------------');
    console.log(`Channel Title: ${channelData.title}`);
    console.log(`Published At: ${channelData.publishedAt} (${extractReleaseYear(channelData.publishedAt)})`);
    console.log(`Subscriber Count: ${Number(channelData.subscriberCount).toLocaleString()}`);
    console.log(`Video Count: ${Number(channelData.videoCount).toLocaleString()}`);
    console.log(`Thumbnail URL: ${channelData.thumbnailUrl}`);
    
    // Show a cleaned description
    const cleanDesc = getCleanDescription(channelData.description);
    console.log(`\nCleaned Description: "${cleanDesc.substring(0, 100)}${cleanDesc.length > 100 ? '...' : ''}"`);
    
    // Show what would be updated in database
    console.log('\nFields to Update in Database:');
    console.log('---------------------------');
    console.log({
      channelId: channelData.id,
      subscriberCount: channelData.subscriberCount,
      videoCount: channelData.videoCount,
      isYouTubeChannel: true,
      publishedAt: channelData.publishedAt,
      releaseYear: extractReleaseYear(channelData.publishedAt),
      description: cleanDesc,
      // If the creator is missing, we'd use the channel title
      creator: channelData.title
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close the database connection
    pool.end();
  }
}

// Run the test
testYouTubeIntegration();