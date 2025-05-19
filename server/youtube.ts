import fetch from 'node-fetch';

// Interface for YouTube API responses
export interface YouTubeChannelResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeChannelItem[];
}

export interface YouTubeChannelItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    localized: {
      title: string;
      description: string;
    };
  };
  contentDetails?: {
    relatedPlaylists: {
      uploads: string;
    };
  };
  statistics?: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}

// Interface for data we want to store
export interface YouTubeChannelData {
  title: string;
  description: string;
  publishedAt: string; // Can be used for releaseYear
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
  channelId: string;
  isYouTubeChannel: boolean; // Flag to identify YouTube channels
}

/**
 * Service to interact with YouTube API
 */
class YouTubeService {
  private API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
  private API_KEY = process.env.YOUTUBE_API_KEY;
  
  constructor() {
    // Validate API key is available
    if (!this.API_KEY) {
      console.warn('Warning: YOUTUBE_API_KEY environment variable is not set');
    }
  }
  
  /**
   * Search for a YouTube channel by name
   */
  async searchChannel(channelName: string): Promise<{id: string, title: string} | null> {
    try {
      // Don't attempt if API key is missing
      if (!this.API_KEY) {
        console.error('Cannot search YouTube: API key is missing');
        return null;
      }
      
      // Construct the search URL
      const searchUrl = `${this.API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1&key=${this.API_KEY}`;
      
      // Make the request
      const response = await fetch(searchUrl);
      const data: any = await response.json();
      
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
      
      // Return channel ID and title
      return {
        id: data.items[0].id.channelId,
        title: data.items[0].snippet.title
      };
    } catch (error) {
      console.error(`Error searching YouTube for "${channelName}":`, error);
      return null;
    }
  }
  
  /**
   * Get detailed information about a YouTube channel
   */
  async getChannelDetails(channelId: string): Promise<YouTubeChannelData | null> {
    try {
      // Don't attempt if API key is missing
      if (!this.API_KEY) {
        console.error('Cannot get YouTube channel: API key is missing');
        return null;
      }
      
      // Construct the channel URL
      const channelUrl = `${this.API_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${this.API_KEY}`;
      
      // Make the request
      const response = await fetch(channelUrl);
      const data: any = await response.json();
      
      // Check for errors
      if (data.error) {
        console.error('YouTube API Error:', data.error.message);
        return null;
      }
      
      // Check if we got any results
      if (!data.items || data.items.length === 0) {
        console.log(`No details found for channel ID: ${channelId}`);
        return null;
      }
      
      // Extract the data we want to store
      const channelData: YouTubeChannelData = {
        title: data.items[0].snippet.title,
        description: data.items[0].snippet.description,
        publishedAt: data.items[0].snippet.publishedAt,
        thumbnailUrl: data.items[0].snippet.thumbnails.high?.url || '',
        subscriberCount: data.items[0].statistics?.subscriberCount || '0',
        videoCount: data.items[0].statistics?.videoCount || '0',
        channelId: channelId,
        isYouTubeChannel: true
      };
      
      return channelData;
    } catch (error) {
      console.error(`Error fetching YouTube channel ${channelId}:`, error);
      return null;
    }
  }
  
  /**
   * Complete flow to get channel data by name:
   * 1. Search for channel by name
   * 2. Get detailed information about the channel
   */
  async getChannelData(channelName: string): Promise<YouTubeChannelData | null> {
    // Search for the channel first
    const searchResult = await this.searchChannel(channelName);
    
    if (!searchResult) {
      return null;
    }
    
    // Get detailed information
    return await this.getChannelDetails(searchResult.id);
  }
}

// Extract release year from publishedAt date
export function extractYouTubeReleaseYear(publishedAt: string | null): number | null {
  if (!publishedAt) return null;
  
  try {
    const date = new Date(publishedAt);
    return date.getFullYear();
  } catch (error) {
    console.error('Error parsing publishedAt date:', error);
    return null;
  }
}

// Extract a good description for our database from YouTube data
export function getCleanDescription(description: string): string {
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

// Create and export a singleton instance
export const youtubeService = new YouTubeService();