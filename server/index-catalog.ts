import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from "express-session";
import { catalogStorage } from "./catalog-storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for admin authentication
app.use(session({
  secret: process.env.SESSION_SECRET || 'catalog-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// TV Shows API
app.get("/api/tv-shows", async (req, res) => {
  try {
    const filters: any = {};
    
    if (req.query.search) filters.search = req.query.search;
    if (req.query.ageGroup) filters.ageGroup = req.query.ageGroup;
    if (req.query.sortBy) filters.sortBy = req.query.sortBy;
    if (req.query.themeMatchMode) filters.themeMatchMode = req.query.themeMatchMode;
    
    if (req.query.themes) {
      filters.themes = typeof req.query.themes === 'string'
        ? req.query.themes.split(',').map((theme: string) => theme.trim())
        : (req.query.themes as string[]).map((theme: string) => theme.trim());
    }
    
    if (req.query.stimulationScoreRange) {
      try {
        filters.stimulationScoreRange = typeof req.query.stimulationScoreRange === 'string'
          ? JSON.parse(req.query.stimulationScoreRange as string)
          : req.query.stimulationScoreRange;
      } catch (error) {
        console.error('Error parsing stimulationScoreRange:', error);
      }
    }
    
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.offset) filters.offset = parseInt(req.query.offset as string);
    
    const shows = await catalogStorage.getTvShows(filters);
    res.json(shows);
  } catch (error) {
    console.error("Error fetching TV shows:", error);
    res.status(500).json({ message: "Failed to fetch TV shows" });
  }
});

app.get("/api/tv-shows/:id", async (req, res) => {
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

app.get("/api/shows/featured", async (req, res) => {
  try {
    const show = await catalogStorage.getFeaturedShow();
    
    if (!show) {
      return res.status(404).json({ message: "No featured show found" });
    }
    
    res.json(show);
  } catch (error) {
    console.error("Error fetching featured show:", error);
    res.status(500).json({ message: "Failed to fetch featured show" });
  }
});

app.get("/api/shows/popular", async (req, res) => {
  try {
    const limitStr = req.query.limit;
    const limit = limitStr && typeof limitStr === 'string' ? parseInt(limitStr) : 10;
    
    const shows = await catalogStorage.getPopularShows(limit);
    res.json(shows);
  } catch (error) {
    console.error("Error fetching popular shows:", error);
    res.status(500).json({ message: "Failed to fetch popular shows" });
  }
});

// Admin authentication
app.post("/api/auth/admin-login", async (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
      (req.session as any).isAdmin = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

app.get("/api/auth/admin-check", (req, res) => {
  if ((req.session as any)?.isAdmin) {
    res.json({ isAdmin: true });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Serve static files
app.use(express.static(path.join(process.cwd(), 'client', 'dist')));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('TV Tantrum Catalog Version Started');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Catalog Features:');
  console.log('- Browse shows with advanced filtering');
  console.log('- Age range and stimulation score sliders');
  console.log('- Theme-based filtering');
  console.log('- Compare shows side-by-side');
  console.log('- Research summaries (read-only)');
  console.log('- Admin panel for content management');
  console.log('');
  console.log('Admin Access: Use password "admin123" or set ADMIN_PASSWORD env var');
});

export default app;