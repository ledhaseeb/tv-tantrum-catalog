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

export class YouTubeService {
  private apiKey: string;
  private baseUrl: string = 'https://www.googleapis.com/youtube/v3';
  private cache: Map<string, YouTubeChannelData> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  async getChannelData(channelName: string): Promise<YouTubeChannelData | null> {
    try {
      // Check cache first
      if (this.isInCache(channelName)) {
        console.log(`Using cached YouTube data for "${channelName}"`);
        return this.getFromCache(channelName);
      }

      console.log(`Fetching YouTube data for "${channelName}"`);

      // First search for the channel
      const searchUrl = `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1&key=${this.apiKey}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.items || searchData.items.length === 0) {
        console.warn(`YouTube API: No channel found for "${channelName}"`);
        return null;
      }

      // Get the channel ID from search results
      const channelId = searchData.items[0].id.channelId;

      // Now get detailed channel information
      const channelUrl = `${this.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${this.apiKey}`;
      const channelResponse = await fetch(channelUrl);
      const channelData = await channelResponse.json() as YouTubeChannelResponse;

      if (!channelData.items || channelData.items.length === 0) {
        console.warn(`YouTube API: Failed to get details for channel "${channelName}"`);
        return null;
      }

      const channel = channelData.items[0];
      
      // Extract only the fields we need
      const channelInfo: YouTubeChannelData = {
        title: channel.snippet.title,
        description: channel.snippet.description || '',
        publishedAt: channel.snippet.publishedAt,
        thumbnailUrl: channel.snippet.thumbnails.high?.url || '',
        subscriberCount: channel.statistics?.subscriberCount || '0',
        videoCount: channel.statistics?.videoCount || '0',
        channelId: channelId,
        isYouTubeChannel: true
      };

      // Store in cache
      this.addToCache(channelName, channelInfo);
      
      return channelInfo;
    } catch (error) {
      console.error(`Error fetching YouTube data for "${channelName}":`, error);
      return null;
    }
  }

  private isInCache(channelName: string): boolean {
    const cacheKey = this.getCacheKey(channelName);
    if (!this.cache.has(cacheKey)) return false;
    
    const expiry = this.cacheExpiry.get(cacheKey) || 0;
    if (Date.now() > expiry) {
      // Cache expired
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      return false;
    }
    
    return true;
  }

  private getFromCache(channelName: string): YouTubeChannelData | null {
    const cacheKey = this.getCacheKey(channelName);
    return this.cache.get(cacheKey) || null;
  }

  private addToCache(channelName: string, data: YouTubeChannelData): void {
    const cacheKey = this.getCacheKey(channelName);
    this.cache.set(cacheKey, data);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
  }

  private getCacheKey(channelName: string): string {
    return channelName.toLowerCase().trim();
  }
}

// Extract the release year from YouTube publishedAt date
export function extractYouTubeReleaseYear(publishedAt: string): number | null {
  if (!publishedAt) return null;
  
  try {
    const date = new Date(publishedAt);
    return date.getFullYear();
  } catch (error) {
    console.error('Error parsing YouTube publishedAt date:', error);
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