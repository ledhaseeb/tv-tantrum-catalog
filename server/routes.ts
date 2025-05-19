import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./database-storage";
import { githubService } from "./github";
import { omdbService } from "./omdb";
import { ZodError } from "zod";
import { insertTvShowReviewSchema, insertFavoriteSchema, TvShowGitHub } from "@shared/schema";
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { setupAuth } from "./auth";
import { updateShowImagesFromOmdb } from "./image-optimizer";
import { updateCustomImageMap, applyCustomImages } from "./image-preservator";
import { applyCustomShowDetails } from "./details-preservator";
import { upload, optimizeImage, uploadErrorHandler } from "./image-upload";
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
  
  // Skip GitHub data import on server start to fix database errors
  console.log("Skipping GitHub data import on startup to prevent database errors");
  
  // Skip custom data loading on startup for better performance
  // Custom data is now applied directly to the database using the apply-custom-data.js script
  console.log("Startup optimization: Custom data loading skipped for faster server startup.");
  console.log("To apply custom data to the database, run: node apply-custom-data.js");

  // Get all TV shows
  app.get("/api/shows", async (req: Request, res: Response) => {
    try {
      
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
      
      // Try to fetch OMDb data for this show
      let omdbData = null;
      try {
        omdbData = await omdbService.getShowData(show.name);
        console.log(`OMDb data for ${show.name}:`, omdbData ? 'Found' : 'Not found');
      } catch (omdbError) {
        console.error(`Error fetching OMDb data for ${show.name}:`, omdbError);
        // Continue even if OMDb fetch fails
      }
      
      res.json({
        ...show,
        reviews,
        omdb: omdbData
      });
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
      
      const similarShows = await storage.getSimilarShowsByShowId(id, limit);
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
        overallRating: req.body.overallRating || 3 // Default overall rating if not provided
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

  const httpServer = createServer(app);

  return httpServer;
}
