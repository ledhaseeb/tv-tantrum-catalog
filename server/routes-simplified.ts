import express, { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./database-storage";
import { setupVite, serveStatic } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.status(200).send('OK');
  });

  // Get all TV shows with filtering
  app.get('/api/tv-shows', async (req, res) => {
    try {
      const filters: any = {};
      
      // Basic search and age filtering
      if (req.query.search) filters.search = req.query.search;
      if (req.query.ageGroup) filters.ageGroup = req.query.ageGroup;
      
      // Age range filtering
      if (req.query.ageRange) {
        try {
          filters.ageRange = JSON.parse(req.query.ageRange as string);
        } catch (e) {
          return res.status(400).json({ message: "Invalid ageRange format" });
        }
      }
      
      // Stimulation score range filtering
      if (req.query.stimulationScoreRange) {
        try {
          filters.stimulationScoreRange = JSON.parse(req.query.stimulationScoreRange as string);
        } catch (e) {
          return res.status(400).json({ message: "Invalid stimulationScoreRange format" });
        }
      }
      
      // Theme filtering
      if (req.query.themes) {
        if (typeof req.query.themes === 'string') {
          filters.themes = req.query.themes.split(',').map(theme => theme.trim());
        } else if (Array.isArray(req.query.themes)) {
          filters.themes = req.query.themes;
        }
      }
      if (req.query.themeMatchMode) {
        filters.themeMatchMode = req.query.themeMatchMode as 'AND' | 'OR';
      }
      
      // Sorting
      if (req.query.sortBy) filters.sortBy = req.query.sortBy;
      
      // Sensory filters
      if (req.query.tantrumFactor) filters.tantrumFactor = req.query.tantrumFactor;
      if (req.query.interactionLevel) filters.interactionLevel = req.query.interactionLevel;
      if (req.query.dialogueIntensity) filters.dialogueIntensity = req.query.dialogueIntensity;
      if (req.query.soundFrequency) filters.soundFrequency = req.query.soundFrequency;
      
      console.log('API received filters:', filters);
      const shows = await storage.getTvShowsByFilter(filters);
      console.log(`API returning ${shows.length} shows`);
      res.json(shows);
    } catch (error) {
      console.error("Error fetching TV shows:", error);
      res.status(500).json({ message: "Failed to fetch TV shows" });
    }
  });

  // Get single TV show
  app.get('/api/tv-shows/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const show = await storage.getTvShowById(id);
      
      if (!show) {
        return res.status(404).json({ message: "Show not found" });
      }
      
      res.json(show);
    } catch (error) {
      console.error("Error fetching TV show:", error);
      res.status(500).json({ message: "Failed to fetch TV show" });
    }
  });

  // Get all themes
  app.get('/api/themes', async (req, res) => {
    try {
      const themes = await storage.getAllThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  // Get homepage categories
  app.get('/api/homepage-categories', async (req, res) => {
    try {
      const categories = await storage.getHomepageCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching homepage categories:", error);
      res.status(500).json({ message: "Failed to fetch homepage categories" });
    }
  });

  // Get shows for a specific homepage category
  app.get('/api/homepage-categories/:id/shows', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const shows = await storage.getShowsForCategory(categoryId);
      res.json(shows);
    } catch (error) {
      console.error("Error fetching category shows:", error);
      res.status(500).json({ message: "Failed to fetch category shows" });
    }
  });

  // Get research summaries
  app.get('/api/research-summaries', async (req, res) => {
    try {
      const research = await storage.getAllResearchSummaries();
      res.json(research);
    } catch (error) {
      console.error("Error fetching research summaries:", error);
      res.status(500).json({ message: "Failed to fetch research summaries" });
    }
  });

  // Get single research summary
  app.get('/api/research-summaries/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const research = await storage.getResearchSummary(id);
      
      if (!research) {
        return res.status(404).json({ message: "Research summary not found" });
      }
      
      res.json(research);
    } catch (error) {
      console.error("Error fetching research summary:", error);
      res.status(500).json({ message: "Failed to fetch research summary" });
    }
  });

  // Get research summaries
  app.get('/api/research-summaries', async (req, res) => {
    try {
      const summaries = await storage.getResearchSummaries();
      res.json(summaries);
    } catch (error) {
      console.error('Error fetching research summaries:', error);
      res.status(500).json({ message: 'Failed to fetch research summaries' });
    }
  });

  // Add new TV show (Admin)
  app.post('/api/shows', async (req, res) => {
    try {
      const showData = req.body;
      const newShow = await storage.addTvShow(showData);
      res.status(201).json(newShow);
    } catch (error) {
      console.error('Error adding TV show:', error);
      res.status(500).json({ message: 'Failed to add TV show' });
    }
  });

  // Update TV show (Admin)
  app.put('/api/shows/:id', async (req, res) => {
    try {
      const showId = parseInt(req.params.id);
      const showData = req.body;
      const updatedShow = await storage.updateTvShow(showId, showData);
      
      if (!updatedShow) {
        return res.status(404).json({ message: 'Show not found' });
      }
      
      res.json(updatedShow);
    } catch (error) {
      console.error('Error updating TV show:', error);
      res.status(500).json({ message: 'Failed to update TV show' });
    }
  });

  // Delete TV show (Admin)
  app.delete('/api/shows/:id', async (req, res) => {
    try {
      const showId = parseInt(req.params.id);
      await storage.deleteTvShow(showId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting TV show:', error);
      res.status(500).json({ message: 'Failed to delete TV show' });
    }
  });

  // Get shows for a specific homepage category (for preview)
  app.get('/api/homepage-categories/:id/shows', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categories = await storage.getHomepageCategories();
      const category = categories.find(c => c.id === categoryId);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Parse filter config and apply filters
      const filterConfig = typeof category.filterConfig === 'string' 
        ? JSON.parse(category.filterConfig) 
        : category.filterConfig;

      // Get all shows and apply the category's filter config
      const allShows = await storage.getAllTvShows();
      
      // Apply filtering based on the category's filter config
      let filteredShows = allShows;
      
      if (filterConfig && filterConfig.rules) {
        filteredShows = allShows.filter(show => {
          return filterConfig.rules.every((rule: any) => {
            if (rule.field === 'stimulationScore' && rule.operator === 'range') {
              const score = show.stimulationScore;
              return score >= rule.value.min && score <= rule.value.max;
            }
            if (rule.field === 'ageRange' && rule.operator === 'equals') {
              return show.ageRange === rule.value;
            }
            if (rule.field === 'themes' && rule.operator === 'in') {
              if (!show.themes || !Array.isArray(show.themes)) return false;
              return rule.value.some((theme: string) => show.themes!.includes(theme));
            }
            return true;
          });
        });
      }
      
      res.json(filteredShows);
    } catch (error) {
      console.error('Error fetching category shows:', error);
      res.status(500).json({ message: 'Failed to fetch category shows' });
    }
  });

  // Admin authentication endpoint
  app.get('/api/admin/user', async (req, res) => {
    try {
      // Simple admin check - in production this would use proper session management
      const adminUser = { 
        id: 1, 
        email: 'admin@example.com', 
        isAdmin: true 
      };
      res.json(adminUser);
    } catch (error) {
      console.error('Error checking admin user:', error);
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup Vite for development or serve static files for production
  const port = Number(process.env.PORT) || 5000;
  
  if (process.env.NODE_ENV === 'development') {
    setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  return httpServer;
}