/**
 * TV Show Lookup API
 * 
 * This file provides an API endpoint for looking up TV show metadata
 * from external sources like OMDb and YouTube.
 */

import { Request, Response, Router } from 'express';
import { omdbService } from './omdb';
import { youtubeService } from './youtube';

// Create a router for lookup API endpoints
const lookupRouter = Router();

// Helper function to clean up YouTube description text
const getCleanYouTubeDescription = (description: string): string => {
  if (!description) return '';
  
  // Strip out common YouTube description elements
  return description
    .replace(/Follow us on social media:[\s\S]*?(?=\n\n|$)/, '')
    .replace(/Subscribe to our channel:[\s\S]*?(?=\n\n|$)/, '')
    .replace(/Visit our website:[\s\S]*?(?=\n\n|$)/, '')
    .replace(/\bhttps?:\/\/\S+\b/g, '')  // Remove URLs
    .replace(/\n{3,}/g, '\n\n')          // Normalize line breaks
    .replace(/\s{2,}/g, ' ')             // Normalize spaces
    .trim();
};

// Endpoint to lookup show data from external APIs (OMDb and YouTube)
lookupRouter.get("/", async (req: Request, res: Response) => {
  try {
    const showName = req.query.name as string;
    
    if (!showName || showName.trim() === '') {
      return res.status(400).json({ message: "Show name is required" });
    }
    
    console.log(`Looking up external data for show: "${showName}"`);
    
    const results = {
      omdb: null,
      youtube: null
    };
    
    // Check OMDb first
    try {
      const omdbData = await omdbService.getShowData(showName);
      console.log(`OMDb lookup for "${showName}":`, omdbData ? 'Found' : 'Not found');
      
      if (omdbData) {
        results.omdb = {
          title: omdbData.title || showName,
          year: omdbData.year || '',
          plot: omdbData.plot || '',
          director: omdbData.director || '',
          writer: omdbData.writer || '',
          rated: omdbData.rated || '',
          poster: omdbData.poster || '',
          awards: omdbData.awards || '',
          country: omdbData.country || '',
          language: omdbData.language || '',
          runtime: omdbData.runtime || '',
          type: 'series'
        };
      }
    } catch (error) {
      console.error(`OMDb lookup error for "${showName}":`, error);
    }
    
    // Check YouTube API
    try {
      const youtubeData = await youtubeService.getChannelData(showName);
      console.log(`YouTube lookup for "${showName}":`, youtubeData ? 'Found' : 'Not found');
      
      if (youtubeData) {
        results.youtube = {
          title: youtubeData.title || showName,
          description: getCleanYouTubeDescription(youtubeData.description || ''),
          subscriberCount: youtubeData.subscriberCount || 0,
          videoCount: youtubeData.videoCount || 0,
          viewCount: youtubeData.viewCount || 0,
          publishedAt: youtubeData.publishedAt || '',
          thumbnail: youtubeData.thumbnailUrl || ''
        };
      }
    } catch (error) {
      console.error(`YouTube lookup error for "${showName}":`, error);
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error looking up show data:', error);
    res.status(500).json({ 
      message: 'Failed to look up show data', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

export { lookupRouter };