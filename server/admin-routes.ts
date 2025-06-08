import { Router } from 'express';
import { storage } from './storage';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin authentication middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.session?.adminUser?.isAdmin) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  next();
};

// Get admin stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const shows = await storage.getAllTvShows();
    const totalShows = shows.length;
    const featuredShows = shows.filter(show => show.isFeatured).length;
    
    res.json({
      totalShows,
      featuredShows,
      adminUsers: 1,
      databaseStatus: 'connected'
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all shows with admin fields
router.get('/shows', requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let shows = await storage.getAllTvShows();
    
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      shows = shows.filter(show => 
        show.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // Map to admin table format
    const adminShows = shows.map(show => ({
      id: show.id,
      name: show.name,
      ageRange: show.ageRange,
      stimulationScore: show.stimulationScore,
      isFeatured: show.isFeatured || false,
      hasOmdbData: show.hasOmdbData || false,
      hasYoutubeData: show.hasYoutubeData || false
    }));
    
    res.json(adminShows);
  } catch (error) {
    console.error('Error fetching shows:', error);
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

// Set featured show
router.put('/shows/:id/featured', requireAdmin, async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    
    // First remove featured status from all shows
    const allShows = await storage.getAllTvShows();
    for (const show of allShows) {
      if (show.isFeatured) {
        await storage.updateTvShow(show.id, { isFeatured: false });
      }
    }
    
    // Set the new featured show
    await storage.updateTvShow(showId, { isFeatured: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting featured show:', error);
    res.status(500).json({ error: 'Failed to set featured show' });
  }
});

// Get single show for editing
router.get('/shows/:id', requireAdmin, async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    const show = await storage.getTvShowById(showId);
    
    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }
    
    res.json(show);
  } catch (error) {
    console.error('Error fetching show:', error);
    res.status(500).json({ error: 'Failed to fetch show' });
  }
});

// Create new show
router.post('/shows', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const showData = { ...req.body };
    
    // Parse themes from JSON string if needed
    if (typeof showData.themes === 'string') {
      try {
        showData.themes = JSON.parse(showData.themes);
      } catch (e) {
        showData.themes = [];
      }
    }
    
    // Handle image upload
    if (req.file) {
      const imageUrl = await processImage(req.file, showData.name);
      showData.imageUrl = imageUrl;
    }
    
    // Convert string numbers to actual numbers
    if (showData.stimulationScore) {
      showData.stimulationScore = parseInt(showData.stimulationScore);
    }
    if (showData.episodeLength) {
      showData.episodeLength = parseInt(showData.episodeLength);
    }
    if (showData.seasons) {
      showData.seasons = parseInt(showData.seasons);
    }
    if (showData.releaseYear) {
      showData.releaseYear = parseInt(showData.releaseYear);
    }
    
    const newShow = await storage.createTvShow(showData);
    res.json(newShow);
  } catch (error) {
    console.error('Error creating show:', error);
    res.status(500).json({ error: 'Failed to create show' });
  }
});

// Update existing show
router.put('/shows/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    const showData = { ...req.body };
    
    // Parse themes from JSON string if needed
    if (typeof showData.themes === 'string') {
      try {
        showData.themes = JSON.parse(showData.themes);
      } catch (e) {
        showData.themes = [];
      }
    }
    
    // Handle image upload
    if (req.file) {
      const imageUrl = await processImage(req.file, showData.name);
      showData.imageUrl = imageUrl;
    }
    
    // Convert string numbers to actual numbers
    if (showData.stimulationScore) {
      showData.stimulationScore = parseInt(showData.stimulationScore);
    }
    if (showData.episodeLength) {
      showData.episodeLength = parseInt(showData.episodeLength);
    }
    if (showData.seasons) {
      showData.seasons = parseInt(showData.seasons);
    }
    if (showData.releaseYear) {
      showData.releaseYear = parseInt(showData.releaseYear);
    }
    
    const updatedShow = await storage.updateTvShow(showId, showData);
    res.json(updatedShow);
  } catch (error) {
    console.error('Error updating show:', error);
    res.status(500).json({ error: 'Failed to update show' });
  }
});

// Delete show
router.delete('/shows/:id', requireAdmin, async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    await storage.deleteTvShow(showId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting show:', error);
    res.status(500).json({ error: 'Failed to delete show' });
  }
});

// Process and optimize uploaded images
async function processImage(file: Express.Multer.File, showName: string): Promise<string> {
  try {
    // Ensure images directory exists
    const imagesDir = path.join(process.cwd(), 'client', 'public', 'images', 'tv-shows');
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Create SEO-friendly filename
    const sanitizedName = showName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const fileName = `${sanitizedName}-${Date.now()}.jpg`;
    const filePath = path.join(imagesDir, fileName);
    
    // Optimize image to portrait format (3:4 ratio, 400x600px)
    await sharp(file.buffer)
      .resize(400, 600, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(filePath);
    
    return `/images/tv-shows/${fileName}`;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

export default router;