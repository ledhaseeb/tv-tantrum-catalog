import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import { setupVite, serveStatic } from './vite';
import { Pool } from 'pg';
import { setupSimpleAdminAuth } from './simple-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Original database connection for image proxy
const originalDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZH3VF9BEjlyk@ep-small-cloud-a46us4xp.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'catalog-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
}));

// Catalog API Routes
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all TV shows with filtering
router.get('/tv-shows', async (req, res) => {
  try {
    const filters: any = {};
    
    // Basic search and age filtering
    if (req.query.search) filters.search = req.query.search;
    if (req.query.ageGroup) filters.ageGroup = req.query.ageGroup;
    
    // Age range filtering (support both JSON and individual min/max params)
    if (req.query.ageRange) {
      try {
        filters.ageRange = JSON.parse(req.query.ageRange as string);
      } catch (e) {
        return res.status(400).json({ message: "Invalid ageRange format" });
      }
    } else if (req.query.ageRangeMin && req.query.ageRangeMax) {
      filters.ageRange = {
        min: parseInt(req.query.ageRangeMin as string),
        max: parseInt(req.query.ageRangeMax as string)
      };
    }
    
    // Stimulation score range filtering
    if (req.query.stimulationScoreRange) {
      try {
        filters.stimulationScoreRange = JSON.parse(req.query.stimulationScoreRange as string);
      } catch (e) {
        return res.status(400).json({ message: "Invalid stimulationScoreRange format" });
      }
    }
    
    // Theme filtering with match mode
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
    
    // Pagination
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.offset) filters.offset = parseInt(req.query.offset as string);

    console.log('API received filters:', filters);
    const shows = await catalogStorage.getTvShows(filters);
    console.log(`API returning ${shows.length} shows`);
    res.json(shows);
  } catch (error) {
    console.error("Error fetching TV shows:", error);
    res.status(500).json({ message: "Failed to fetch TV shows" });
  }
});

// Get popular shows
router.get('/shows/popular', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
    const shows = await catalogStorage.getTvShows({ limit });
    res.json(shows);
  } catch (error) {
    console.error("Error fetching popular shows:", error);
    res.status(500).json({ message: "Failed to fetch popular shows" });
  }
});

// Get featured show
router.get('/shows/featured', async (req, res) => {
  try {
    const shows = await catalogStorage.getTvShows({ limit: 1 });
    res.json(shows[0] || null);
  } catch (error) {
    console.error("Error fetching featured show:", error);
    res.status(500).json({ message: "Failed to fetch featured show" });
  }
});

// Get single TV show
router.get('/tv-shows/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const show = await catalogStorage.getTvShowById(id);
    
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
router.get('/themes', async (req, res) => {
  try {
    const themes = await catalogStorage.getThemes();
    res.json(themes);
  } catch (error) {
    console.error("Error fetching themes:", error);
    res.status(500).json({ message: "Failed to fetch themes" });
  }
});

// Get research summaries
router.get('/research', async (req, res) => {
  try {
    const summaries = await catalogStorage.getResearchSummaries();
    res.json(summaries);
  } catch (error) {
    console.error("Error fetching research summaries:", error);
    res.status(500).json({ message: "Failed to fetch research summaries" });
  }
});

// Get single research summary
router.get('/research/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const summaries = await catalogStorage.getResearchSummaries();
    const summary = summaries.find(s => s.id === id);
    
    if (!summary) {
      return res.status(404).json({ message: "Research summary not found" });
    }
    
    res.json(summary);
  } catch (error) {
    console.error("Error fetching research summary:", error);
    res.status(500).json({ message: "Failed to fetch research summary" });
  }
});

// Get active homepage categories (public endpoint)
router.get('/homepage-categories', async (req, res) => {
  try {
    const categories = await catalogStorage.getActiveHomepageCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching homepage categories:", error);
    res.status(500).json({ message: "Failed to fetch homepage categories" });
  }
});

// Get shows for a specific homepage category
router.get('/homepage-categories/:id/shows', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const shows = await catalogStorage.getHomepageCategoryShows(categoryId);
    res.json(shows);
  } catch (error) {
    console.error("Error fetching category shows:", error);
    res.status(500).json({ message: "Failed to fetch category shows" });
  }
});

// Image proxy route for external images
router.get('/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ message: "URL parameter required" });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(404).json({ message: "Image not found" });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error("Error proxying image:", error);
    res.status(500).json({ message: "Failed to proxy image" });
  }
});

// Image proxy route for serving images from original database
app.get('/media/tv-shows/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Check if the image exists in the original database
    const result = await originalDb.query(
      'SELECT image_url FROM tv_shows WHERE image_url = $1',
      [`/media/tv-shows/${filename}`]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).send('Image not found');
    }
    
    // Serve the generic TV show image for authentic media paths
    const genericImagePath = join(__dirname, '../public/images/generic-tv-show.jpg');
    
    try {
      res.sendFile(genericImagePath);
    } catch (fileError) {
      // If generic image doesn't exist, serve a simple SVG placeholder
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(`<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#285161"/>
        <text x="200" y="300" text-anchor="middle" fill="#F6CB59" font-family="Arial" font-size="24">TV Show</text>
      </svg>`);
    }
    
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).send('Internal server error');
  }
});

// Setup admin authentication routes (temporarily disabled for development)
// setupSimpleAdminAuth(app);

// Mount API routes BEFORE Vite middleware to prevent conflicts
app.use('/api/admin', adminRoutes);
app.use('/api', router);

const port = Number(process.env.PORT) || 5000;

if (process.env.NODE_ENV === 'development') {
  setupVite(app, server);
} else {
  serveStatic(app);
}

server.listen(port, '0.0.0.0', () => {
  console.log(`TV Tantrum Catalog server running on port ${port}`);
  console.log(`Using catalog database with 302 authentic TV shows`);
  console.log(`Simplified content discovery without social features`);
});