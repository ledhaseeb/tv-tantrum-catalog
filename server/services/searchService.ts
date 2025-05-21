import { Pool } from 'pg';
import { pool } from '../db';

/**
 * Search service for TV shows
 * This service handles all search-related functionality
 * and database operations for TV shows
 */
export class SearchService {
  private pool: Pool;
  
  constructor(dbPool: Pool) {
    this.pool = dbPool;
  }
  
  /**
   * Search for TV shows by name or description
   * @param searchTerm The search term to look for
   * @returns Array of TV shows matching the search term
   */
  async searchShows(searchTerm: string) {
    if (!searchTerm || !searchTerm.trim()) {
      return [];
    }
    
    const client = await this.pool.connect();
    
    try {
      // Simple, reliable SQL search with no ORM complexity
      const result = await client.query(
        `SELECT * FROM tv_shows 
         WHERE name ILIKE $1 OR description ILIKE $1
         ORDER BY name ASC`,
        [`%${searchTerm.trim()}%`]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Track a search hit in the background
   * @param showId The ID of the show that was found in search
   */
  async trackSearchHit(showId: number) {
    if (!showId) return;
    
    // Run this in the background so it doesn't block the main thread
    setTimeout(async () => {
      try {
        const trackingClient = await this.pool.connect();
        
        try {
          await trackingClient.query(
            `INSERT INTO tv_show_searches (tv_show_id, search_count, last_searched) 
             VALUES ($1, 1, NOW()) 
             ON CONFLICT (tv_show_id) 
             DO UPDATE SET 
               search_count = tv_show_searches.search_count + 1, 
               last_searched = NOW()`, 
            [showId]
          );
        } finally {
          trackingClient.release();
        }
      } catch (e) {
        // Silently ignore any errors in tracking
        console.error('Search tracking error (non-blocking):', e);
      }
    }, 0);
  }
  
  /**
   * Perform a filtered search based on multiple criteria
   * @param filters The filter criteria
   * @returns Array of TV shows matching the filters
   */
  async searchWithFilters(filters: any) {
    const client = await this.pool.connect();
    
    try {
      // Base query that safely handles all filter combinations
      let query = `SELECT * FROM tv_shows WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;
      
      // Add search filter if present
      if (filters.search) {
        query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      // Add other filters based on what's in the request
      // ageGroup filter
      if (filters.ageGroup) {
        query += ` AND age_group = $${paramIndex}`;
        params.push(filters.ageGroup);
        paramIndex++;
      }
      
      // tantrumFactor filter
      if (filters.tantrumFactor) {
        query += ` AND tantrum_factor = $${paramIndex}`;
        params.push(filters.tantrumFactor);
        paramIndex++;
      }
      
      // Sensory-specific filters
      if (filters.interactivityLevel) {
        query += ` AND interactivity_level = $${paramIndex}`;
        params.push(filters.interactivityLevel);
        paramIndex++;
      }
      
      if (filters.dialogueIntensity) {
        query += ` AND dialogue_intensity = $${paramIndex}`;
        params.push(filters.dialogueIntensity);
        paramIndex++;
      }
      
      if (filters.soundFrequency) {
        query += ` AND sound_frequency = $${paramIndex}`;
        params.push(filters.soundFrequency);
        paramIndex++;
      }
      
      // Sort filter - apply appropriate sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'name_asc':
            query += ` ORDER BY name ASC`;
            break;
          case 'name_desc':
            query += ` ORDER BY name DESC`;
            break;
          case 'newest':
            query += ` ORDER BY release_year DESC NULLS LAST`;
            break;
          case 'oldest':
            query += ` ORDER BY release_year ASC NULLS LAST`;
            break;
          case 'popular':
            query += ` ORDER BY view_count DESC NULLS LAST`;
            break;
          default:
            query += ` ORDER BY name ASC`;
        }
      } else {
        // Default sort
        query += ` ORDER BY name ASC`;
      }
      
      // Execute the query
      const result = await client.query(query, params);
      
      // Process the results for theme filtering if necessary
      let shows = result.rows;
      
      // Handle theme filtering (post-query for better control)
      if (filters.themes && filters.themes.length > 0) {
        const themeMatchMode = ('themeMatchMode' in filters) ? (filters.themeMatchMode || 'AND') : 'AND';
        const searchThemes = Array.isArray(filters.themes) 
          ? filters.themes.map((theme: string) => theme.trim())
          : [filters.themes.trim()];
          
        if (themeMatchMode === 'AND') {
          // All themes must match
          shows = shows.filter((show: any) => {
            const showThemes = show.themes || [];
            return searchThemes.every((theme: string) => {
              return showThemes.some((showTheme: string) => 
                showTheme.toLowerCase() === theme.toLowerCase()
              );
            });
          });
        } else {
          // Any of the themes can match (OR)
          shows = shows.filter((show: any) => {
            const showThemes = show.themes || [];
            return searchThemes.some((theme: string) => {
              return showThemes.some((showTheme: string) => 
                showTheme.toLowerCase() === theme.toLowerCase()
              );
            });
          });
        }
      }
      
      return shows;
    } finally {
      client.release();
    }
  }
}

// Create and export a singleton instance
export const searchService = new SearchService(pool);