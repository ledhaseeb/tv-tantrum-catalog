import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { githubService } from "./github";
import { ZodError } from "zod";
import { insertTvShowReviewSchema, insertFavoriteSchema, TvShowGitHub } from "@shared/schema";
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Initialize the data from GitHub on server start - Limiting to 20 shows for faster startup
  try {
    console.log("Fetching TV shows data from GitHub...");
    const showsData = await githubService.fetchTvShowsData();
    console.log(`Fetched ${showsData.length} TV shows from GitHub`);
    
    // Import all shows to make sure we have the full database available
    if (showsData.length > 0) {
      console.log(`Importing all ${showsData.length} TV shows...`);
      const importedShows = await storage.importShowsFromGitHub(showsData);
      console.log(`Imported ${importedShows.length} TV shows to storage`);
    }
  } catch (error) {
    console.error("Failed to fetch and import TV shows data:", error);
  }

  // Get all TV shows
  app.get("/api/shows", async (req: Request, res: Response) => {
    try {
      // Debug what's coming in as query parameters
      console.log("Shows API - Query params:", req.query);
      
      const { 
        ageGroup, 
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
        tantrumFactor: typeof tantrumFactor === 'string' ? tantrumFactor : undefined,
        sortBy: typeof sortBy === 'string' ? sortBy : undefined,
        search: typeof search === 'string' ? search : undefined,
        themes: processedThemes,
        interactionLevel: typeof interactionLevel === 'string' ? interactionLevel : undefined,
        dialogueIntensity: typeof dialogueIntensity === 'string' ? dialogueIntensity : undefined,
        soundFrequency: typeof soundFrequency === 'string' ? soundFrequency : undefined,
        stimulationScoreRange: processedStimulationScoreRange
      };
      
      console.log("Shows API - Processed filters:", filters);
      
      const shows = await storage.getTvShowsByFilter(filters);
      
      // If this is a search request, track the search for each returned show
      if (typeof search === 'string' && search.trim() && shows.length > 0) {
        // Track search data for each of the first 5 results
        const topResults = shows.slice(0, 5);
        for (const show of topResults) {
          await storage.trackShowSearch(show.id);
        }
        console.log(`Tracked search for term "${search}" with ${topResults.length} top results`);
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
      
      res.json({
        ...show,
        reviews
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
  
  // Update a TV show (admin only)
  app.patch("/api/shows/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in" });
      }
      
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized to update shows" });
      }
      
      const id = parseInt(req.params.id);
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
