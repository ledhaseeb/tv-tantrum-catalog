import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { githubService } from "./github";
import { ZodError } from "zod";
import { insertTvShowReviewSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the data from GitHub on server start
  try {
    console.log("Fetching TV shows data from GitHub...");
    const showsData = await githubService.fetchTvShowsData();
    console.log(`Fetched ${showsData.length} TV shows from GitHub`);
    
    // Import shows to storage
    if (showsData.length > 0) {
      const importedShows = await storage.importShowsFromGitHub(showsData);
      console.log(`Imported ${importedShows.length} TV shows to storage`);
    }
  } catch (error) {
    console.error("Failed to fetch and import TV shows data:", error);
  }

  // Get all TV shows
  app.get("/api/shows", async (req: Request, res: Response) => {
    try {
      const { ageGroup, tantrumFactor, sortBy, search } = req.query;
      
      const filters = {
        ageGroup: typeof ageGroup === 'string' ? ageGroup : undefined,
        tantrumFactor: typeof tantrumFactor === 'string' ? tantrumFactor : undefined,
        sortBy: typeof sortBy === 'string' ? sortBy : undefined,
        search: typeof search === 'string' ? search : undefined
      };
      
      const shows = await storage.getTvShowsByFilter(filters);
      res.json(shows);
    } catch (error) {
      console.error("Error fetching TV shows:", error);
      res.status(500).json({ message: "Failed to fetch TV shows" });
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

  const httpServer = createServer(app);

  return httpServer;
}
