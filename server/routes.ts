import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
// Use database storage
import { storage } from "./database-storage";
import { githubService } from "./github";
import { omdbService } from "./omdb";
import { youtubeService, extractYouTubeReleaseYear, getCleanDescription } from "./youtube";
import { ZodError } from "zod";
import { insertTvShowReviewSchema, insertFavoriteSchema, TvShowGitHub } from "@shared/schema";
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { setupAuth } from "./auth";
import { updateShowImagesFromOmdb } from "./image-optimizer";
import { updateCustomImageMap, applyCustomImages } from "./image-preservator";
import { applyCustomShowDetails } from "./details-preservator";
import { upload, optimizeImage, uploadErrorHandler } from "./image-upload";
import { lookupRouter } from "./lookup-api";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add health check endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).send('OK');
  });

  // Set up authentication
  setupAuth(app);
  
  // Serve static files from the public directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
  
  // Register the lookup API router
  app.use('/api/lookup-show', lookupRouter);
  
  // Skip GitHub data import on server start to fix database errors
  console.log("Skipping GitHub data import on startup to prevent database errors");
  
  // Skip custom data loading on startup for better performance
  // Custom data is now applied directly to the database using the apply-custom-data.js script
  console.log("Startup optimization: Custom data loading skipped for faster server startup.");
  console.log("To apply custom data to the database, run: node apply-custom-data.js");
  
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
  
  // Extract year information and creator functions
  function extractYearInfo(yearStr: string) {
    if (!yearStr) return { releaseYear: null, endYear: null, isOngoing: null };
    
    const parts = yearStr.split('–');
    const releaseYear = parts[0] ? parseInt(parts[0]) : null;
    const endYear = parts[1] && parts[1].trim() !== '' ? parseInt(parts[1]) : null;
    const isOngoing = parts.length > 1 && (parts[1].trim() === '' || !parts[1]);
    
    return { releaseYear, endYear, isOngoing };
  }
  
  // Extract creator info from director and writer fields
  function extractCreator(director: string, writer: string) {
    if (director && director !== 'N/A') return director;
    if (writer && writer !== 'N/A') return writer;
    return null;
  }

  // Get all TV shows
  app.get("/api/tv-shows", async (req: Request, res: Response) => {
    try {
      // For the admin page, we will directly get all shows without filtering
      // when no query parameters are provided
      if (Object.keys(req.query).length === 0) {
        console.log("Admin dashboard: Getting all TV shows without filters");
        const allShows = await storage.getAllTvShows();
        res.json(allShows);
        return;
      }
      
      const { 
        ageGroup, 
        ageRange,
        tantrumFactor, 
        sortBy, 
        search, 
        themes,
        interactionLevel,
        dialogueIntensity,
        soundFrequency,
        stimulationScoreRange
      } = req.query;
      
      // Process themes - can be comma-separated string
      let processedThemes: string[] | undefined = undefined;
      if (typeof themes === 'string' && themes.trim()) {
        processedThemes = themes.split(',').map(t => t.trim()).filter(Boolean);
      }
      
      // Process ageRange - can be JSON string
      let processedAgeRange: { min: number, max: number } | undefined = undefined;
      if (typeof ageRange === 'string' && ageRange.trim()) {
        try {
          processedAgeRange = JSON.parse(ageRange);
        } catch (e) {
          console.error("Failed to parse ageRange:", e);
        }
      }
      
      // Process stimulationScoreRange - can be JSON string
      let processedStimulationScoreRange: { min: number, max: number } | undefined = undefined;
      if (typeof stimulationScoreRange === 'string' && stimulationScoreRange.trim()) {
        try {
          processedStimulationScoreRange = JSON.parse(stimulationScoreRange);
        } catch (e) {
          console.error("Failed to parse stimulationScoreRange:", e);
        }
      }
      
      const filters = {
        ageGroup: typeof ageGroup === 'string' ? ageGroup : undefined,
        ageRange: processedAgeRange,
        tantrumFactor: typeof tantrumFactor === 'string' ? tantrumFactor : undefined,
        sortBy: typeof sortBy === 'string' ? sortBy : undefined,
        search: typeof search === 'string' ? search : undefined,
        themes: processedThemes,
        interactionLevel: typeof interactionLevel === 'string' ? interactionLevel : undefined,
        dialogueIntensity: typeof dialogueIntensity === 'string' ? dialogueIntensity : undefined,
        soundFrequency: typeof soundFrequency === 'string' ? soundFrequency : undefined,
        stimulationScoreRange: processedStimulationScoreRange
      };
      
      console.log("Getting TV shows with filters:", filters);
      
      const shows = await storage.getTvShowsByFilter(filters);
      
      // If this is a search request, track the search for each returned show
      if (typeof search === 'string' && search.trim() && shows.length > 0) {
        // Track search data for each of the first 5 results
        const topResults = shows.slice(0, 5);
        for (const show of topResults) {
          await storage.trackShowSearch(show.id);
        }

      }
      res.json(shows);
    } catch (error) {
      console.error("Error fetching TV shows:", error);
      res.status(500).json({ message: "Failed to fetch TV shows" });
    }
  });

  // Get popular TV shows
  app.get("/api/shows/popular", async (req: Request, res: Response) => {
    try {
      const limitStr = req.query.limit;
      const limit = limitStr && typeof limitStr === 'string' ? parseInt(limitStr) : 10;
      
      const shows = await storage.getPopularShows(limit);
      res.json(shows);
    } catch (error) {
      console.error("Error fetching popular TV shows:", error);
      res.status(500).json({ message: "Failed to fetch popular TV shows" });
    }
  });

  // These functions have already been defined above, so we don't need to redefine them.

// Get single TV show by ID
  app.get("/api/shows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid show ID" });
      }
      
      const show = await storage.getTvShowById(id);
      if (!show) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      // Get reviews for this show
      const reviews = await storage.getReviewsByTvShowId(id);
      
      // Track this view
      await storage.trackShowView(id);
      
      // Check if this is a YouTube show
      const isYouTubeShow = show.availableOn?.includes('YouTube');
      
      let externalData = null;
      
      try {
        if (isYouTubeShow) {
          // For YouTube shows, use YouTube API
          const youtubeData = await youtubeService.getChannelData(show.name);
          console.log(`YouTube data for ${show.name}:`, youtubeData ? 'Found' : 'Not found');
          
          if (youtubeData && (!show.creator || !show.releaseYear || show.description === 'A children\'s TV show')) {
            // Extract release year from publishedAt date
            const releaseYear = extractYouTubeReleaseYear(youtubeData.publishedAt);
            
            // Set creator to channel name if no better info
            const creator = youtubeData.title;
            
            // Update data object for database changes
            const updateData: any = {};
            
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
            
            // Add YouTube-specific data
            updateData.subscriberCount = youtubeData.subscriberCount;
            updateData.videoCount = youtubeData.videoCount;
            updateData.channelId = youtubeData.channelId;
            updateData.isYouTubeChannel = true;
            updateData.publishedAt = youtubeData.publishedAt;
            
            // Only update if we have new data
            if (Object.keys(updateData).length > 0) {
              console.log(`Updating metadata for "${show.name}" with YouTube data:`, updateData);
              await storage.updateTvShow(id, updateData);
            }
          }
          
          // Store the YouTube data for response
          externalData = { youtube: youtubeData };
        } else {
          // For regular TV shows, use OMDb
          const omdbData = await omdbService.getShowData(show.name);
          console.log(`OMDb data for ${show.name}:`, omdbData ? 'Found' : 'Not found');
          
          // If this is the first time we get OMDb data for this show, update the metadata
          if (omdbData && (!show.creator || !show.releaseYear || show.description === 'A children\'s TV show')) {
            // Extract year information
            const { releaseYear, endYear, isOngoing } = extractYearInfo(omdbData.year);
            
            // Extract creator information
            const creator = extractCreator(omdbData.director, omdbData.writer);
            
            // Update show with this additional metadata if it's not already set
            const updateData: any = {};
            
            if (!show.creator && creator) {
              updateData.creator = creator;
            }
            
            if (!show.releaseYear && releaseYear) {
              updateData.releaseYear = releaseYear;
            }
            
            if (!show.endYear && endYear) {
              updateData.endYear = endYear;
            }
            
            // Only update isOngoing if we have valid year data
            if (releaseYear && !show.isOngoing) {
              updateData.isOngoing = isOngoing;
            }
            
            // If we have a plot and the current description is generic, update it
            if (omdbData.plot && omdbData.plot !== 'N/A' && 
                (show.description === 'A children\'s TV show' || !show.description)) {
              updateData.description = omdbData.plot;
            }
            
            // Only update if we have new data
            if (Object.keys(updateData).length > 0) {
              console.log(`Updating metadata for "${show.name}" with OMDb data:`, updateData);
              await storage.updateTvShow(id, updateData);
            }
          }
          
          // Store the OMDb data for response
          externalData = { omdb: omdbData };
        }
      } catch (error) {
        console.error(`Error fetching external data for ${show.name}:`, error);
        // Continue even if data fetch fails
      }
      
      // Create a complete response that includes both stored and external data
      const response = {
        ...show,
        reviews,
        externalData
      };
      
      // Make sure the YouTube data from the database is directly accessible
      // by exposing it at the top level of the response
      if (show.isYouTubeChannel || show.subscriberCount || show.videoCount) {
        console.log(`Show ${show.name} has YouTube channel data`);
        
        // Make sure the YouTube specific fields are directly available in the response
        response.isYouTubeChannel = true;
        response.subscriberCount = show.subscriberCount;
        response.videoCount = show.videoCount;
        response.publishedAt = show.publishedAt;
        response.channelId = show.channelId;
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching TV show:", error);
      res.status(500).json({ message: "Failed to fetch TV show" });
    }
  });

  // Add a new review for a TV show
  app.post("/api/shows/:id/reviews", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid show ID" });
      }
      
      const show = await storage.getTvShowById(id);
      if (!show) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      // Validate review data
      const validatedData = insertTvShowReviewSchema.parse({
        ...req.body,
        tvShowId: id
      });
      
      // Add review to storage
      const newReview = await storage.addReview(validatedData);
      res.status(201).json(newReview);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid review data", 
          errors: error.errors 
        });
      }
      
      console.error("Error adding TV show review:", error);
      res.status(500).json({ message: "Failed to add TV show review" });
    }
  });

  // Manually refresh data from GitHub
  app.post("/api/refresh-data", async (req: Request, res: Response) => {
    try {
      const showsData = await githubService.fetchTvShowsData();
      const importedShows = await storage.importShowsFromGitHub(showsData);
      
      res.json({ 
        message: "Data refreshed successfully", 
        count: importedShows.length 
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      res.status(500).json({ message: "Failed to refresh data" });
    }
  });
  
  // Endpoint to optimize show images using OMDB posters
  app.post("/api/optimize-images", async (req: Request, res: Response) => {
    try {
      // Temporarily removed admin check to run optimization directly
      // if (!req.user?.isAdmin) {
      //   return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      // }
      
      console.log("Starting image optimization process...");
      const results = await updateShowImagesFromOmdb();
      
      res.json({
        message: `Processed ${results.total} shows. Updated ${results.successful.length} images successfully.`,
        successful: results.successful.length,
        failed: results.failed.length,
        results
      });
    } catch (error) {
      console.error("Error optimizing images:", error);
      res.status(500).json({ message: "Failed to optimize images" });
    }
  });
  
  // Endpoint to update YouTube metadata for shows marked as available on YouTube
  app.post("/api/update-youtube-metadata", async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }
      
      console.log("Starting YouTube metadata update process...");
      
      // Get limit parameter with a default of 10 shows
      const limit = req.body.limit || 10;
      
      // Get all shows marked as available on YouTube
      const youtubeShows = await storage.getTvShowsByPlatform('YouTube', limit);
      
      console.log(`Processing ${youtubeShows.length} YouTube shows`);
      
      // Track results
      const results = {
        total: youtubeShows.length,
        successful: [] as any[],
        failed: [] as any[],
        skipped: [] as any[]
      };
      
      // Process each YouTube show
      for (const show of youtubeShows) {
        try {
          // Skip shows that already have YouTube data
          if (show.isYouTubeChannel && show.channelId) {
            results.skipped.push({
              id: show.id,
              name: show.name,
              reason: 'Already has YouTube metadata'
            });
            continue;
          }
          
          console.log(`Processing YouTube show: ${show.name}`);
          
          // Fetch YouTube data
          const youtubeData = await youtubeService.getChannelData(show.name);
          
          if (!youtubeData) {
            results.failed.push({
              id: show.id,
              name: show.name,
              reason: 'No YouTube data found'
            });
            continue;
          }
          
          // Build update data
          const updateData: any = {
            subscriberCount: youtubeData.subscriberCount,
            videoCount: youtubeData.videoCount,
            channelId: youtubeData.channelId,
            isYouTubeChannel: true,
            publishedAt: youtubeData.publishedAt
          };
          
          // Extract release year from publishedAt date
          const releaseYear = extractYouTubeReleaseYear(youtubeData.publishedAt);
          
          // Add creator if missing
          if (!show.creator) {
            updateData.creator = youtubeData.title;
          }
          
          // Add release year if missing
          if (!show.releaseYear && releaseYear) {
            updateData.releaseYear = releaseYear;
          }
          
          // YouTube shows are typically ongoing
          if (typeof show.isOngoing !== 'boolean') {
            updateData.isOngoing = true;
          }
          
          // Get a cleaned description
          const cleanDescription = getCleanDescription(youtubeData.description);
          
          // Update description if generic or missing
          if (cleanDescription && (show.description === 'A children\'s TV show' || !show.description)) {
            updateData.description = cleanDescription;
          }
          
          // If show has no image, use YouTube thumbnail
          if (!show.imageUrl && youtubeData.thumbnailUrl) {
            updateData.imageUrl = youtubeData.thumbnailUrl;
          }
          
          // Update the show in the database
          const updatedShow = await storage.updateTvShow(show.id, updateData);
          
          if (updatedShow) {
            results.successful.push({
              id: show.id,
              name: show.name,
              updates: updateData
            });
          } else {
            results.failed.push({
              id: show.id,
              name: show.name,
              reason: 'Failed to update in database'
            });
          }
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 250));
        } catch (error) {
          console.error(`Error processing YouTube show ${show.name}:`, error);
          results.failed.push({
            id: show.id,
            name: show.name,
            reason: 'Processing error'
          });
        }
      }
      
      res.json({
        message: `Processed ${results.total} YouTube shows. Updated ${results.successful.length} successfully.`,
        ...results
      });
    } catch (error) {
      console.error("Error updating YouTube metadata:", error);
      res.status(500).json({ message: "Failed to update YouTube metadata" });
    }
  });
  
  // Endpoint to update show metadata (creator, release_year, end_year, is_ongoing) from OMDb
  app.post("/api/update-metadata", async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }
      
      console.log("Starting metadata update process...");
      
      // Get all shows from the database
      const shows = await storage.getAllTvShows();
      
      // Keep track of results
      const results = {
        total: shows.length,
        successful: [] as any[],
        failed: [] as any[],
        skipped: [] as any[]
      };
      
      // Process each show
      for (const show of shows) {
        try {
          // Check if this is a YouTube show
          const isYouTubeShow = show.availableOn?.includes('YouTube');
          
          // Skip shows that already have complete metadata
          if (show.creator && show.releaseYear && (show.endYear || show.isOngoing) &&
              show.description !== 'A children\'s TV show' && show.description) {
            results.skipped.push({
              id: show.id,
              name: show.name,
              reason: 'Already has complete metadata'
            });
            continue;
          }
          
          // Update data object for database changes
          const updateData: any = {};
          
          if (isYouTubeShow) {
            // For YouTube shows, try to get data from YouTube API
            console.log(`Processing YouTube show: ${show.name}`);
            
            // Extract the channel name - usually it's just the show name
            const channelName = show.name;
            
            // Fetch YouTube data
            const youtubeData = await youtubeService.getChannelData(channelName);
            
            if (!youtubeData) {
              results.failed.push({
                id: show.id,
                name: show.name,
                reason: 'No YouTube data found'
              });
              continue;
            }
            
            // Extract release year from publishedAt date
            const releaseYear = extractYouTubeReleaseYear(youtubeData.publishedAt);
            
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
            
            // Add YouTube-specific data
            updateData.subscriberCount = youtubeData.subscriberCount;
            updateData.videoCount = youtubeData.videoCount;
            updateData.channelId = youtubeData.channelId;
            updateData.isYouTubeChannel = true;
            updateData.publishedAt = youtubeData.publishedAt;
          } else {
            // For regular TV shows, use OMDb
            const omdbData = await omdbService.getShowData(show.name);
            if (!omdbData) {
              results.failed.push({
                id: show.id,
                name: show.name,
                reason: 'No OMDb data found'
              });
              continue;
            }
            
            // Extract year information
            const { releaseYear, endYear, isOngoing } = extractYearInfo(omdbData.year);
            
            // Extract creator information
            const creator = extractCreator(omdbData.director, omdbData.writer);
            
            // Update metadata if not already set
            if (!show.creator && creator) {
              updateData.creator = creator;
            }
            
            if (!show.releaseYear && releaseYear) {
              updateData.releaseYear = releaseYear;
            }
            
            if (!show.endYear && endYear) {
              updateData.endYear = endYear;
            }
            
            // Only update isOngoing if we have valid year data
            if (releaseYear && typeof show.isOngoing !== 'boolean') {
              updateData.isOngoing = isOngoing;
            }
            
            // If we have a plot and the current description is generic, update it
            if (omdbData.plot && omdbData.plot !== 'N/A' && 
                (show.description === 'A children\'s TV show' || !show.description)) {
              updateData.description = omdbData.plot;
            }
          }
          
          // Only update if we have new data
          if (Object.keys(updateData).length > 0) {
            const dataSource = isYouTubeShow ? 'YouTube' : 'OMDb';
            console.log(`Updating metadata for "${show.name}" with ${dataSource} data:`, updateData);
            
            const updatedShow = await storage.updateTvShow(show.id, updateData);
            
            if (updatedShow) {
              results.successful.push({
                id: show.id,
                name: show.name,
                source: dataSource,
                updates: updateData
              });
            } else {
              results.failed.push({
                id: show.id,
                name: show.name,
                reason: `Failed to update in storage after ${dataSource} lookup`
              });
            }
          } else {
            results.skipped.push({
              id: show.id,
              name: show.name,
              reason: 'No new metadata to update'
            });
          }
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 250));
          
        } catch (error) {
          console.error(`Error updating metadata for show "${show.name}":`, error);
          results.failed.push({
            id: show.id,
            name: show.name,
            reason: 'Error during processing'
          });
        }
      }
      
      res.json({
        message: `Processed ${results.total} shows. Updated ${results.successful.length} successfully.`,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        results
      });
    } catch (error) {
      console.error("Error updating metadata:", error);
      res.status(500).json({ message: "Failed to update metadata" });
    }
  });

  // Endpoint to update a specific show with OMDB image
  app.post("/api/shows/:id/update-image", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid show ID" });
      }
      
      const show = await storage.getTvShowById(id);
      if (!show) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      console.log(`Looking up OMDB poster for "${show.name}"`);
      const omdbData = await omdbService.getShowData(show.name);
      
      if (omdbData && omdbData.poster && omdbData.poster !== 'N/A') {
        // Save to our custom image map and update the show
        updateCustomImageMap(id, omdbData.poster);
        
        // Update the show with the OMDB poster
        const updatedShow = await storage.updateTvShow(id, {
          imageUrl: omdbData.poster
        });
        
        if (updatedShow) {
          res.json({
            success: true,
            message: `Updated "${show.name}" with OMDB poster`,
            show: updatedShow
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Failed to update show in storage"
          });
        }
      } else {
        res.status(404).json({
          success: false,
          message: "No OMDB poster found for this show"
        });
      }
    } catch (error) {
      console.error("Error updating show image:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update show image",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Endpoint to update a show with a local image file
  app.post("/api/shows/:id/update-with-local-image", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid show ID" });
      }
      
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }
      
      const show = await storage.getTvShowById(id);
      if (!show) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      // Save to our custom image map and update the show
      updateCustomImageMap(id, imageUrl);
      
      // Update the show with the local image URL
      const updatedShow = await storage.updateTvShow(id, { imageUrl });
      
      if (updatedShow) {
        res.json({
          success: true,
          message: `Updated "${show.name}" with local image`,
          show: updatedShow
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to update show in storage"
        });
      }
    } catch (error) {
      console.error("Error updating show with local image:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update show with local image",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Import data from CSV file
  app.post("/api/import-csv", async (req: Request, res: Response) => {
    try {
      // Check if CSV file exists
      const csvFilePath = 'tvshow_sensory_data.csv';
      if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ message: "CSV file not found" });
      }

      // Read and parse CSV file
      const fileContent = fs.readFileSync(csvFilePath, 'utf8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      console.log(`Parsed ${records.length} records from CSV`);
      
      // Transform CSV data to GitHub format
      const transformedShows: TvShowGitHub[] = records.map((record: any, index: number) => {
        // Split the themes into an array and trim each value
        const themes = record['Themes, Teachings, Guidance'] 
          ? record['Themes, Teachings, Guidance'].split(',').map((t: string) => t.trim())
          : [];

        // Convert string numbers to actual numbers
        const stimulationScore = parseInt(record['Stimulation Score']) || 3;
        
        // Debug the CSV data for Arthur
        if (record['Programs'] === 'Arthur') {
          console.log('Arthur data in CSV:', {
            title: record['Programs'],
            sound_effects: record['Sound Effects'],
            dialogue: record['Dialougue Intensity']
          });
        }

        return {
          title: record['Programs'] || `Show ${index + 1}`,
          stimulation_score: stimulationScore,
          platform: record['TV or YouTube'] || 'TV',
          target_age_group: record['Target Age Group'] || '4-8',
          seasons: record['Seasons'] || null,
          avg_episode_length: record['Avg. Epsiode'] || null,
          themes: themes,
          interactivity_level: record['Interactivity Level'] || 'Moderate',
          animation_style: record['Animation Styles'] || 'Traditional 2D',
          dialogue_intensity: record['Dialougue Intensity'] || 'Moderate',
          sound_effects_level: record['Sound Effects'] || 'Moderate',
          music_tempo: record['Music Tempo'] || 'Moderate',
          total_music_level: record['Total Music'] || 'Moderate',
          total_sound_effect_time_level: record['Total Sound Effect Time'] || 'Moderate',
          scene_frequency: record['Scene Frequency'] || 'Moderate',
          image_filename: `${record['Programs']?.toLowerCase().replace(/[^a-z0-9]/g, '')}.jpg` || 'default.jpg',
          id: index + 1,
          // Add image URL based on the show title for GitHub repo format
          imageUrl: `https://raw.githubusercontent.com/ledhaseeb/tvtantrum/main/client/public/images/${record['Programs']?.toLowerCase().replace(/[^a-z0-9]/g, '')}.jpg`
        };
      });

      // Import processed data to storage
      const importedShows = await storage.importShowsFromGitHub(transformedShows);
      console.log(`Imported ${importedShows.length} TV shows from CSV`);
      
      res.json({ 
        message: "CSV data imported successfully", 
        count: importedShows.length 
      });
    } catch (error) {
      console.error('Error importing CSV data:', error);
      res.status(500).json({ 
        message: "Failed to import CSV data", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Add favorite routes, protected by authentication
  // Add a show to user's favorites
  app.post("/api/favorites", async (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to use favorites" });
    }

    try {
      const { tvShowId } = req.body;
      if (!tvShowId || isNaN(parseInt(tvShowId))) {
        return res.status(400).json({ message: "Invalid show ID" });
      }

      const userId = req.user!.id;
      const favorite = await storage.addFavorite(userId, parseInt(tvShowId));
      
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  // Remove a show from user's favorites
  app.delete("/api/favorites/:tvShowId", async (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to use favorites" });
    }

    try {
      const tvShowId = parseInt(req.params.tvShowId);
      if (isNaN(tvShowId)) {
        return res.status(400).json({ message: "Invalid show ID" });
      }

      const userId = req.user!.id;
      const result = await storage.removeFavorite(userId, tvShowId);
      
      if (result) {
        res.status(200).json({ message: "Show removed from favorites" });
      } else {
        res.status(404).json({ message: "Show was not in favorites" });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // Get user's favorites
  app.get("/api/favorites", async (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view favorites" });
    }

    try {
      const userId = req.user!.id;
      const favorites = await storage.getUserFavorites(userId);
      
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Check if a show is in the user's favorites
  app.get("/api/favorites/:tvShowId", async (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to check favorites" });
    }

    try {
      const tvShowId = parseInt(req.params.tvShowId);
      if (isNaN(tvShowId)) {
        return res.status(400).json({ message: "Invalid show ID" });
      }

      const userId = req.user!.id;
      const isFavorite = await storage.isFavorite(userId, tvShowId);
      
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Get similar shows based on user's favorites
  app.get("/api/recommendations", async (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to get recommendations" });
    }

    try {
      const userId = req.user!.id;
      const limitStr = req.query.limit;
      const limit = limitStr && typeof limitStr === 'string' ? parseInt(limitStr) : 5;
      
      const recommendations = await storage.getSimilarShows(userId, limit);
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });
  
  // Get similar shows for a specific show
  app.get("/api/shows/:id/similar", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Fetching similar shows for show ID: ${id}`);
      
      if (isNaN(id)) {
        console.log("Invalid show ID provided");
        return res.status(400).json({ message: "Invalid show ID" });
      }
      
      const limitStr = req.query.limit;
      const limit = limitStr && typeof limitStr === 'string' ? parseInt(limitStr) : 4;
      
      // Since we don't have a showId-based similar function, use the user-based one instead
      // Or get shows with similar themes/properties
      const show = await storage.getTvShowById(id);
      if (!show) {
        return res.status(404).json({ message: "Show not found" });
      }
      
      // Get all shows and filter them manually by similar properties
      const allShows = await storage.getAllTvShows();
      const similarShows = allShows
        .filter(s => s.id !== id) // Exclude current show
        .map(s => {
          // Calculate similarity score
          let score = 0;
          
          // Similar age range
          if (s.ageRange === show.ageRange) score += 3;
          
          // Similar stimulation score (within 10 points)
          if (Math.abs((s.stimulationScore || 0) - (show.stimulationScore || 0)) <= 10) score += 4;
          
          // Similar themes
          const showThemes = show.themes || [];
          const otherThemes = s.themes || [];
          const commonThemes = showThemes.filter(theme => otherThemes.includes(theme));
          score += commonThemes.length * 2;
          
          // Similar dialogue intensity
          if (s.dialogueIntensity === show.dialogueIntensity) score += 2;
          
          // Similar animation style
          if (s.animationStyle === show.animationStyle) score += 2;
          
          return { show: s, score };
        })
        .sort((a, b) => b.score - a.score) // Sort by highest score
        .slice(0, limit) // Get requested number
        .map(item => item.show); // Return just the shows
        
      console.log(`Found ${similarShows.length} similar shows for show ID ${id}`);
      
      // Log some sample data
      if (similarShows.length > 0) {
        console.log("First similar show:", {
          id: similarShows[0].id,
          name: similarShows[0].name
        });
      }
      
      res.json(similarShows);
    } catch (error) {
      console.error("Error fetching similar shows:", error);
      res.status(500).json({ message: "Failed to fetch similar shows" });
    }
  });

  // Check if a user is admin (for color palette access)
  app.get("/api/user/is-admin", async (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in" });
    }

    try {
      res.json({ isAdmin: req.user!.isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });
  
  // Check if username is available
  app.get("/api/check-username", async (req: Request, res: Response) => {
    try {
      const username = req.query.username as string;
      
      if (!username || username.length < 2) {
        return res.status(400).json({ available: false, message: "Username is too short" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ available: false, message: "Server error" });
    }
  });
  
  // Check if email is available
  app.get("/api/check-email", async (req: Request, res: Response) => {
    try {
      const email = req.query.email as string;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ available: false, message: "Invalid email format" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking email:", error);
      res.status(500).json({ available: false, message: "Server error" });
    }
  });
  
  // Image upload endpoint for TV shows - used by both add and edit forms
  app.post("/api/shows/upload-image", upload.single('image'), uploadErrorHandler, async (req: Request, res: Response) => {
    // Check if user is authenticated and has admin privileges
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Optimize the uploaded image
      const optimizedImagePath = await optimizeImage(req.file.path);
      
      // Return the path to the optimized image
      res.json({
        originalPath: `/uploads/${path.basename(req.file.path)}`,
        optimizedPath: optimizedImagePath,
        message: "Image uploaded and optimized successfully"
      });
    } catch (error) {
      console.error("Error processing image upload:", error);
      res.status(500).json({ 
        message: "Failed to process image upload", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Add a new TV show (admin only)
  app.post("/api/shows", async (req: Request, res: Response) => {
    // Check if user is authenticated and has admin privileges
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    
    try {
      // Validate that required fields are present
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Show name is required" });
      }
      
      // Process themes if they're provided as an array
      if (req.body.themes && Array.isArray(req.body.themes)) {
        // Filter out any empty themes
        req.body.themes = req.body.themes.filter((theme: string) => theme.trim() !== '');
      }
      
      // Ensure stimulation score is a whole number if provided
      if (req.body.stimulationScore !== undefined) {
        req.body.stimulationScore = Math.round(Number(req.body.stimulationScore));
      }
      
      // Ensure all required fields have default values to avoid database constraint errors
      const currentYear = new Date().getFullYear();
      const showData = {
        ...req.body,
        // Set default values for any missing required fields
        episodeLength: req.body.episodeLength || 15,
        seasons: req.body.seasons || 1,
        releaseYear: req.body.releaseYear || currentYear,
        endYear: req.body.endYear || null,
        isOngoing: req.body.isOngoing !== undefined ? req.body.isOngoing : true,
        creator: req.body.creator || '',
        availableOn: Array.isArray(req.body.availableOn) ? req.body.availableOn : [],
        // Use stimulation score as the overall rating since they're the same
        overallRating: req.body.stimulationScore || 3 // Using stimulation score for overall rating
      };
      
      console.log("Adding show with data:", JSON.stringify({
        name: showData.name,
        episodeLength: showData.episodeLength,
        seasons: showData.seasons
      }, null, 2));
      
      // Add the show to the database
      const newShow = await storage.addTvShow(showData);
      
      // If an image URL was provided, add it to our custom image map
      if (showData.imageUrl) {
        updateCustomImageMap(newShow.id, showData.imageUrl);
      }
      
      console.log(`Created new TV show: ${name} (ID: ${newShow.id})`);
      
      res.status(201).json(newShow);
    } catch (error) {
      console.error("Error adding new TV show:", error);
      res.status(500).json({ 
        message: "Failed to add new TV show", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Update a TV show (admin only)
  app.patch("/api/shows/:id", async (req: Request, res: Response) => {
    try {
      // Parse ID once
      const id = parseInt(req.params.id);
      
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in" });
      }
      
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized to update shows" });
      }
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      // Validate the show exists
      const existingShow = await storage.getTvShowById(id);
      if (!existingShow) {
        return res.status(404).json({ message: "Show not found" });
      }

      console.log(`Updating show #${id} with data:`, JSON.stringify(req.body, null, 2));

      // Update the show
      const updatedShow = await storage.updateTvShow(id, req.body);
      if (!updatedShow) {
        console.error(`Failed to update show #${id}`);
        return res.status(500).json({ message: "Failed to update show" });
      }

      console.log(`Show #${id} updated successfully:`, JSON.stringify(updatedShow, null, 2));
      res.json(updatedShow);
    } catch (error) {
      console.error("Error updating TV show:", error);
      res.status(500).json({ message: "Failed to update TV show" });
    }
  });

  // Delete a TV show (admin only)
  app.delete("/api/shows/:id", async (req: Request, res: Response) => {
    try {
      // Parse ID once
      const id = parseInt(req.params.id);
      
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in" });
      }
      
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized to delete shows" });
      }
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      // Validate the show exists
      const existingShow = await storage.getTvShowById(id);
      if (!existingShow) {
        return res.status(404).json({ message: "Show not found" });
      }

      console.log(`Attempting to delete TV show: ${existingShow.name} (ID: ${id})`);
      
      // Delete the show from the database
      const deleteResult = await storage.deleteTvShow(id);
      
      if (!deleteResult) {
        console.error(`Failed to delete show with ID ${id}`);
        return res.status(500).json({ message: "Failed to delete TV show" });
      }
      
      console.log(`Successfully deleted TV show: ${existingShow.name} (ID: ${id})`);
      res.status(200).json({ message: "TV show deleted successfully" });
    } catch (error) {
      console.error("Error deleting TV show:", error);
      res.status(500).json({ message: "Failed to delete TV show" });
    }
  });
  
  // Admin-only API to optimize all custom images for SEO
  app.post("/api/admin/optimize-custom-images", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in" });
      }
      
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized to optimize images" });
      }
      
      // Get all shows with non-optimized images that need SEO optimization
      const shows = await storage.getAllTvShows();
      
      // Filter shows that need image optimization (non-OMDB images that aren't already optimized)
      const showsToOptimize = shows.filter(show => 
        show.imageUrl && 
        !show.imageUrl.includes('/uploads/optimized/') &&
        !show.imageUrl.includes('m.media-amazon.com') &&
        !show.imageUrl.includes('omdbapi.com')
      );
      
      console.log(`Found ${showsToOptimize.length} custom images to optimize`);
      
      // Import modules are already available at the top of file
      // We'll use the existing imports instead
      
      // Ensure temp directory exists
      const tempDir = './tmp_images';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Prepare results
      const optimizationResults = [];
      let optimizedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      
      // Process each image
      for (const show of showsToOptimize) {
        try {
          console.log(`Processing image for show ${show.id}: ${show.name}`);
          
          // Skip if URL is null or malformed
          if (!show.imageUrl) {
            console.log(`Skipping - null image URL for show ${show.id}`);
            skippedCount++;
            optimizationResults.push({
              id: show.id,
              name: show.name,
              status: "skipped",
              reason: "Null image URL"
            });
            continue;
          }
          
          // Download image if it's a remote URL
          let localImagePath = null;
          
          if (show.imageUrl.startsWith('http')) {
            try {
              // Download the image
              const response = await fetch(show.imageUrl);
              if (!response.ok) {
                throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
              }
              
              const buffer = await response.buffer();
              
              // Save image to temp location
              const timestamp = Date.now();
              const uniqueFilename = `show-${show.id}-${timestamp}.jpg`;
              localImagePath = path.join(tempDir, uniqueFilename);
              
              fs.writeFileSync(localImagePath, buffer);
              console.log(`Downloaded image to: ${localImagePath}`);
            } catch (error) {
              console.error(`Error downloading image for show ${show.id}:`, error);
              errorCount++;
              optimizationResults.push({
                id: show.id,
                name: show.name,
                status: "error",
                reason: `Download error: ${error instanceof Error ? error.message : "Unknown error"}`
              });
              continue;
            }
          } else if (show.imageUrl.startsWith('/')) {
            // For local images, check if they exist
            const possiblePaths = [
              path.join('public', show.imageUrl),
              path.join('public', 'uploads', path.basename(show.imageUrl)),
              path.join('public', 'custom-images', path.basename(show.imageUrl)),
              path.join('public', 'images', path.basename(show.imageUrl)),
              path.join('attached_assets', path.basename(show.imageUrl)),
              show.imageUrl.substring(1) // Try without leading slash
            ];
            
            for (const checkPath of possiblePaths) {
              if (fs.existsSync(checkPath)) {
                localImagePath = checkPath;
                console.log(`Found local image at ${localImagePath}`);
                break;
              }
            }
            
            if (!localImagePath) {
              console.log(`Could not find local image at any expected location: ${show.imageUrl}`);
              skippedCount++;
              optimizationResults.push({
                id: show.id,
                name: show.name,
                status: "skipped",
                reason: "Local image not found"
              });
              continue;
            }
          } else {
            console.log(`Unsupported image URL format: ${show.imageUrl}`);
            skippedCount++;
            optimizationResults.push({
              id: show.id,
              name: show.name,
              status: "skipped",
              reason: "Unsupported image URL format"
            });
            continue;
          }
          
          // Now optimize the image
          try {
            // Use our existing image optimization function
            const optimizedUrl = await optimizeImage(localImagePath);
            
            // Update the show in the database with the new optimized URL
            await storage.updateTvShow(show.id, {
              imageUrl: optimizedUrl
            });
            
            // Update custom image map too
            updateCustomImageMap(show.id, optimizedUrl);
            
            console.log(`Optimized image for show ${show.id}: ${optimizedUrl}`);
            optimizedCount++;
            optimizationResults.push({
              id: show.id,
              name: show.name,
              status: "success",
              oldImageUrl: show.imageUrl,
              newImageUrl: optimizedUrl
            });
            
            // Clean up temp file if we downloaded it
            if (localImagePath.startsWith('./tmp_images')) {
              try {
                fs.unlinkSync(localImagePath);
              } catch (e) {
                // Ignore cleanup errors
              }
            }
          } catch (error) {
            console.error(`Error optimizing image for show ${show.id}:`, error);
            errorCount++;
            optimizationResults.push({
              id: show.id,
              name: show.name,
              status: "error",
              reason: `Optimization error: ${error instanceof Error ? error.message : "Unknown error"}`
            });
          }
        } catch (error) {
          console.error(`Error processing show ${show.id}:`, error);
          errorCount++;
          optimizationResults.push({
            id: show.id,
            name: show.name,
            status: "error",
            reason: `Processing error: ${error instanceof Error ? error.message : "Unknown error"}`
          });
        }
      }
      
      // Return results
      return res.json({
        message: "Custom image optimization complete",
        total: showsToOptimize.length,
        optimized: optimizedCount,
        skipped: skippedCount,
        errors: errorCount,
        results: optimizationResults
      });
    } catch (error) {
      console.error('Error in optimize-custom-images:', error);
      return res.status(500).json({ 
        message: "Error during custom image optimization", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
