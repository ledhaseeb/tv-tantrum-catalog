import { Router } from 'express';
import { Pool } from 'pg';

const testRouter = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Endpoint to get all reviews in the system for testing
testRouter.get('/test-api/all-reviews', async (req, res) => {
  try {
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
          s.name as "showName"
        FROM tv_show_reviews r
        JOIN tv_shows s ON r.tv_show_id = s.id
      `);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Endpoint to get reviews for a specific user
testRouter.get('/test-api/user-reviews/:username', async (req, res) => {
  try {
    const { username } = req.params;
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
          s.name as "showName"
        FROM tv_show_reviews r
        JOIN tv_shows s ON r.tv_show_id = s.id
        WHERE r.user_name = $1
      `, [username]);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

export default testRouter;