import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import { setupVite, serveStatic } from './vite';
import { catalogStorage } from './catalog-storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    
    if (req.query.search) filters.search = req.query.search;
    if (req.query.ageGroup) filters.ageGroup = req.query.ageGroup;
    if (req.query.stimulationScoreRange) {
      try {
        filters.stimulationScoreRange = JSON.parse(req.query.stimulationScoreRange as string);
      } catch (e) {
        return res.status(400).json({ message: "Invalid stimulationScoreRange format" });
      }
    }
    if (req.query.themes) {
      filters.themes = Array.isArray(req.query.themes) ? req.query.themes : [req.query.themes];
    }
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);

    const shows = await catalogStorage.getTvShows(filters);
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
    const shows = await catalogStorage.getTvShows({});
    const show = shows.find(s => s.id === id);
    
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