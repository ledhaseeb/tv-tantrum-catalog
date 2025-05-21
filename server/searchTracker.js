/**
 * Simple, reliable search tracking functionality
 * This module handles tracking search data for TV shows
 */

const { pool } = require('./db');

/**
 * Track a show search in the database
 * @param {number} tvShowId - The ID of the TV show being searched for
 */
async function trackShowSearch(tvShowId) {
  if (!tvShowId || isNaN(tvShowId)) {
    console.error('Invalid TV show ID for tracking:', tvShowId);
    return;
  }
  
  try {
    const client = await pool.connect();
    
    try {
      // Check if there's an existing record
      const result = await client.query(
        'SELECT id, search_count FROM tv_show_searches WHERE tv_show_id = $1',
        [tvShowId]
      );
      
      if (result.rows.length > 0) {
        // Update existing record
        const { id, search_count } = result.rows[0];
        await client.query(
          'UPDATE tv_show_searches SET search_count = $1, last_searched = NOW() WHERE id = $2',
          [search_count + 1, id]
        );
      } else {
        // Insert new record
        await client.query(
          'INSERT INTO tv_show_searches (tv_show_id, search_count, last_searched) VALUES ($1, 1, NOW())',
          [tvShowId]
        );
      }
    } finally {
      client.release();
    }
  } catch (error) {
    // Log error but don't let it affect the application
    console.error('Error tracking search:', error);
  }
}

/**
 * Get the most popular searches
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} - Most searched shows
 */
async function getPopularSearches(limit = 10) {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT ts.*, t.name, t.image_url
         FROM tv_show_searches ts
         JOIN tv_shows t ON ts.tv_show_id = t.id
         ORDER BY ts.search_count DESC
         LIMIT $1`,
        [limit]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting popular searches:', error);
    return [];
  }
}

module.exports = {
  trackShowSearch,
  getPopularSearches
};