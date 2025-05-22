import { db, pool } from "./db";
import { eq, and, or, not, sql, desc, inArray } from "drizzle-orm";
import { favorites, tvShows, userPointsHistory, users } from "@shared/schema";
import type { Favorite, TvShow } from "@shared/schema";

/**
 * Add a show to user's favorites
 */
export async function addFavorite(userId: number, tvShowId: number): Promise<any> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First check if this is already a favorite
    const checkResult = await client.query(
      'SELECT * FROM favorites WHERE user_id = $1 AND tv_show_id = $2',
      [userId, tvShowId]
    );
    
    if (checkResult.rows.length > 0) {
      // Already a favorite, no need to add again
      await client.query('COMMIT');
      return checkResult.rows[0];
    }
    
    // Get show name for reference
    const showResult = await client.query(
      'SELECT name FROM tv_shows WHERE id = $1',
      [tvShowId]
    );
    
    const showName = showResult.rows[0]?.name || 'Unknown show';
    
    // Add to favorites with show name
    const result = await client.query(
      'INSERT INTO favorites (user_id, tv_show_id, show_name, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [userId, tvShowId, showName]
    );
    
    // Get count of user's favorites
    const countResult = await client.query(
      'SELECT COUNT(*) FROM favorites WHERE user_id = $1',
      [userId]
    );
    
    const favoriteCount = parseInt(countResult.rows[0].count);
    
    // Award points for favorites (up to the first 10)
    if (favoriteCount <= 10) {
      // Add points to history
      await client.query(
        `INSERT INTO user_points_history 
         (user_id, points, activity_type, description, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, 2, 'add_favorite', `Added ${showName} to favorites`]
      );
      
      // Update user total points
      await client.query(
        `UPDATE users 
         SET total_points = COALESCE(total_points, 0) + $1 
         WHERE id = $2`,
        [2, userId]
      );
      
      console.log(`Awarded 2 points to user ${userId} for adding ${showName} to favorites`);
    }
    
    await client.query('COMMIT');
    console.log(`User ${userId} added show ${tvShowId} (${showName}) to favorites`);
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding favorite:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Remove a show from user's favorites
 */
export async function removeFavorite(userId: number, tvShowId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND tv_show_id = $2',
      [userId, tvShowId]
    );
    
    const removed = result.rowCount > 0;
    if (removed) {
      console.log(`User ${userId} removed show ${tvShowId} from favorites`);
    } else {
      console.log(`Show ${tvShowId} was not in favorites for user ${userId}`);
    }
    
    return removed;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
}

/**
 * Get all shows favorited by a user
 */
export async function getUserFavorites(userId: number): Promise<TvShow[]> {
  try {
    const result = await pool.query(`
      SELECT t.* 
      FROM tv_shows t
      JOIN favorites f ON t.id = f.tv_show_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);
    
    const shows = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      ageRange: row.age_range,
      episodeLength: row.episode_length,
      stimulationScore: row.stimulation_score,
      releaseYear: row.release_year,
      endYear: row.end_year,
      isOngoing: row.is_ongoing,
      creator: row.creator,
      // Add other fields as needed
    }));
    
    console.log(`Retrieved ${shows.length} favorites for user ${userId}`);
    return shows;
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return [];
  }
}

/**
 * Check if a show is in user's favorites
 */
export async function isFavorite(userId: number, tvShowId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT * FROM favorites WHERE user_id = $1 AND tv_show_id = $2',
      [userId, tvShowId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
}

/**
 * Get similar shows based on user's favorites
 */
export async function getSimilarShows(userId: number, limit: number = 5): Promise<TvShow[]> {
  try {
    // First get user's favorite shows
    const favoritesResult = await pool.query(
      'SELECT tv_show_id FROM favorites WHERE user_id = $1',
      [userId]
    );
    
    if (favoritesResult.rows.length === 0) {
      return []; // No favorites, so no similar shows
    }
    
    // Extract favorite IDs
    const favoriteIds = favoritesResult.rows.map(row => row.tv_show_id);
    
    // Find shows with similar themes to user's favorites
    const similarShowsResult = await pool.query(`
      SELECT DISTINCT t.*, COUNT(ts.theme_id) as theme_matches
      FROM tv_shows t
      JOIN tv_show_themes ts ON t.id = ts.tv_show_id
      WHERE ts.theme_id IN (
        SELECT theme_id 
        FROM tv_show_themes 
        WHERE tv_show_id = ANY($1::int[])
      )
      AND t.id <> ALL($1::int[])
      GROUP BY t.id
      ORDER BY theme_matches DESC
      LIMIT $2
    `, [favoriteIds, limit]);
    
    const shows = similarShowsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      ageRange: row.age_range,
      episodeLength: row.episode_length,
      stimulationScore: row.stimulation_score,
      releaseYear: row.release_year,
      endYear: row.end_year,
      isOngoing: row.is_ongoing,
      creator: row.creator,
      // Add other fields as needed
    }));
    
    return shows;
  } catch (error) {
    console.error('Error getting similar shows:', error);
    return [];
  }
}