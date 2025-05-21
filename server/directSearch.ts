import { pool } from './db';

/**
 * Direct search function that bypasses the ORM issues
 * This function performs a direct SQL query against the database
 * to search for TV shows by name or description
 */
export async function directSearchShows(searchTerm: string) {
  // Use a direct database connection for reliability
  const client = await pool.connect();
  
  try {
    // Execute a simple search query that will be reliable
    const result = await client.query(
      `SELECT * FROM tv_shows 
      WHERE name ILIKE $1 OR description ILIKE $1
      ORDER BY name ASC`,
      [`%${searchTerm}%`]
    );
    
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Track a search term in the database without using the ORM
 * This uses direct SQL to avoid timestamp handling issues
 */
export async function trackSearch(tvShowId: number) {
  // Don't let this function throw errors
  try {
    const client = await pool.connect();
    
    try {
      // Check if there's an existing record
      const checkResult = await client.query(
        'SELECT id, search_count FROM tv_show_searches WHERE tv_show_id = $1',
        [tvShowId]
      );
      
      if (checkResult.rows.length > 0) {
        // Update existing record
        const existingSearch = checkResult.rows[0];
        await client.query(
          'UPDATE tv_show_searches SET search_count = $1, last_searched = NOW() WHERE id = $2',
          [existingSearch.search_count + 1, existingSearch.id]
        );
      } else {
        // Insert new record
        await client.query(
          'INSERT INTO tv_show_searches (tv_show_id, search_count, last_searched) VALUES ($1, $2, NOW())',
          [tvShowId, 1]
        );
      }
    } finally {
      client.release();
    }
  } catch (error) {
    // Just log the error but don't let it affect anything else
    console.error('Search tracking failed:', error);
  }
}