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
   * Search for a YouTube channel by name with flexible matching
   */
  async searchChannel(channelName: string): Promise<{id: string, title: string} | null> {
    try {
      // Don't attempt if API key is missing
      if (!this.API_KEY) {
        console.error('Cannot search YouTube: API key is missing');
        return null;
      }
      
      // Try different search queries for better matching chances
      const searchQueries = [
        channelName,                                   // Original show name
        `${channelName} official`,                     // Try official channel
        `${channelName} kids show`,                    // Specify kids content
        channelName.replace(/\s*\(\d{4}(-\d{4})?\)$/, '') // Remove year information
      ];
      
      // For kid shows, try some specific patterns
      if (channelName.toLowerCase().includes('&')) {
        // Try replacing & with 'and'
        searchQueries.push(channelName.replace(/&/g, 'and'));
      }
      
      // Try each search query until we find a match
      for (const query of searchQueries) {
        console.log(`Trying YouTube search query: "${query}"`);
        
        // Construct the search URL with more results to find better matches
        const searchUrl = `${this.API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=3&key=${this.API_KEY}`;
        
        // Make the request
        const response = await fetch(searchUrl);
        const data: any = await response.json();
        
        // Check for errors
        if (data.error) {
          console.error('YouTube API Error:', data.error.message);
          continue; // Try next query
        }
        
        // Check if we got any results
        if (data.items && data.items.length > 0) {
          // Look for the best match among results
          for (const item of data.items) {
            const titleLower = item.snippet.title.toLowerCase();
            const channelLower = channelName.toLowerCase();
            
            // Simple fuzzy matching - check if the result contains major parts of our query
            // or if our query contains major parts of the result
            if (titleLower.includes(channelLower) || 
                channelLower.includes(titleLower) ||
                this.calculateSimilarity(titleLower, channelLower) > 0.5) {
              
              console.log(`Found YouTube channel match: ${item.snippet.title} for show "${channelName}"`);
              return {
                id: item.id.channelId,
                title: item.snippet.title
              };
            }
          }
        }
      }
      
      console.log(`No channel found for "${channelName}" after trying all search queries`);
      return null;
    } catch (error) {
      console.error(`Error searching YouTube for "${channelName}":`, error);
      return null;
    }
  }
  
  /**
   * Calculate text similarity between two strings
   * Simple implementation of Jaccard similarity using word sets
   */
  private calculateSimilarity(text1: string, text2: string): number {
    // Tokenize and create sets
    const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    
    // Calculate intersection and union
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    // Jaccard similarity coefficient
    return union.size === 0 ? 0 : intersection.size / union.size;
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