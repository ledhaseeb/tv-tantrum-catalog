import { Router } from 'express';
import { Pool } from 'pg';

const directDbRouter = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get user's reviews directly from database
directDbRouter.get('/api/user/reviews', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    
    // Direct database query for reviews
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          r.id, 
          r.tv_show_id as "tvShowId", 
          r.user_name as "userName",
          r.user_id as "userId",
          r.rating, 
          r.review, 
          r.created_at as "createdAt",
          s.name as "showName",
          s.image_url as "showImage"
        FROM tv_show_reviews r
        JOIN tv_shows s ON r.tv_show_id = s.id
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC
      `, [userId]);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get user's favorites directly from database
directDbRouter.get('/api/user/favorites', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    
    // Direct database query for favorites
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          f.id, 
          f.tv_show_id as "tvShowId", 
          f.user_id as "userId",
          f.created_at as "createdAt",
          s.name as "showName",
          s.image_url as "showImage"
        FROM tv_show_favorites f
        JOIN tv_shows s ON f.tv_show_id = s.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
      `, [userId]);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get user's read research summaries directly from database
directDbRouter.get('/api/user/research/read', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    
    // Direct database query for read research summaries
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          rr.id, 
          rr.research_id as "researchId",
          rr.user_id as "userId",
          rr.created_at as "createdAt",
          r.title,
          r.summary
        FROM research_reads rr
        JOIN research_summaries r ON rr.research_id = r.id
        WHERE rr.user_id = $1
        ORDER BY rr.created_at DESC
      `, [userId]);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching read research:', error);
    res.status(500).json({ error: 'Failed to fetch read research' });
  }
});

// Get user's show submissions directly from database
directDbRouter.get('/api/user/submissions', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    
    // Direct database query for show submissions
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          s.id, 
          s.name,
          s.description,
          s.submitted_by as "submittedBy",
          s.created_at as "createdAt",
          s.is_approved as "isApproved"
        FROM tv_show_submissions s
        WHERE s.submitted_by = $1
        ORDER BY s.created_at DESC
      `, [userId]);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

export default directDbRouter;