/**
 * Fix Upvote Points Calculation Script
 * 
 * This script directly updates the user points history table to ensure upvotes received
 * are worth 2 points each as per the updated point system.
 */

import pg from 'pg';
const { Pool } = pg;

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixUpvotePoints() {
  console.log('Starting upvote points fix...');
  
  try {
    // First, let's check how many upvotes the user has received
    const upvotesQuery = await pool.query(
      `SELECT COUNT(*) as count FROM review_upvotes 
       JOIN tv_show_reviews ON review_upvotes.review_id = tv_show_reviews.id 
       WHERE tv_show_reviews.user_id = $1`,
      [8] // User ID for uschooler
    );
    
    const upvotesCount = parseInt(upvotesQuery.rows[0]?.count || '0');
    console.log(`User has received ${upvotesCount} upvotes`);
    
    // Check current points in history for upvotes received
    const currentPointsQuery = await pool.query(
      `SELECT SUM(points) as total FROM user_points_history 
       WHERE user_id = $1 AND activity_type = 'upvote_received'`,
      [8]
    );
    
    const currentPoints = parseInt(currentPointsQuery.rows[0]?.total || '0');
    console.log(`Current points for upvotes received: ${currentPoints}`);
    
    // Calculate the correct points (2 points per upvote)
    const correctPoints = upvotesCount * 2;
    console.log(`Correct points should be: ${correctPoints}`);
    
    if (currentPoints !== correctPoints) {
      console.log('Points mismatch detected, updating...');
      
      // First, clear existing upvote received points
      await pool.query(
        `DELETE FROM user_points_history 
         WHERE user_id = $1 AND activity_type = 'upvote_received'`,
        [8]
      );
      
      // Now add the correct points records
      for (let i = 0; i < upvotesCount; i++) {
        await pool.query(
          `INSERT INTO user_points_history (user_id, points, activity_type, description)
           VALUES ($1, $2, $3, $4)`,
          [8, 2, 'upvote_received', 'Your review received an upvote']
        );
      }
      
      // Update total points in users table
      await pool.query(
        `UPDATE users SET total_points = (
           SELECT SUM(points) FROM user_points_history WHERE user_id = $1
         ) WHERE id = $1`,
        [8]
      );
      
      console.log('Points updated successfully!');
    } else {
      console.log('Points are already correct, no update needed.');
    }
  } catch (error) {
    console.error('Error fixing upvote points:', error);
  } finally {
    await pool.end();
  }
}

fixUpvotePoints().catch(console.error);