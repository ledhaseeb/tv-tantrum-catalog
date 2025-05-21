import { db, pool } from "./db";
import { eq, and, or, not, sql, desc, inArray, like, count } from "drizzle-orm";
import { 
  users, favorites, tvShows, tvShowReviews, tvShowSearches, tvShowViews, 
  themes, platforms, tvShowThemes, tvShowPlatforms,
  type User, type InsertUser, 
  type TvShow, type InsertTvShow, 
  type TvShowReview, type InsertTvShowReview,
  type TvShowSearch, type InsertTvShowSearch,
  type TvShowView, type InsertTvShowView,
  type Favorite, type InsertFavorite,
  type Theme, type InsertTheme,
  type Platform, type InsertPlatform,
  type TvShowTheme, type InsertTvShowTheme,
  type TvShowPlatform, type InsertTvShowPlatform,
  type TvShowGitHub
} from "@shared/schema";
import { preserveCustomImageUrl, updateCustomImageMap } from "./image-preservator";
import { updateCustomShowDetails, preserveCustomShowDetails } from "./details-preservator";

// We'll implement a simpler solution directly in this file

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserApproval(userId: number, isApproved: boolean): Promise<User | undefined>;
  
  // TV Shows methods
  getAllTvShows(): Promise<TvShow[]>;
  getTvShowById(id: number): Promise<TvShow | undefined>;
  getTvShowsByPlatform(platform: string, limit?: number): Promise<TvShow[]>;
  getTvShowsByFilter(filters: { 
    ageGroup?: string; 
    ageRange?: {min: number, max: number};
    tantrumFactor?: string; 
    sortBy?: string; 
    search?: string;
    themes?: string[];
    themeMatchMode?: 'AND' | 'OR';
    interactionLevel?: string;
    dialogueIntensity?: string;
    soundFrequency?: string;
    stimulationScoreRange?: {min: number, max: number};
  }): Promise<TvShow[]>;
  addTvShow(show: InsertTvShow): Promise<TvShow>;
  updateTvShow(id: number, show: Partial<InsertTvShow>): Promise<TvShow | undefined>;
  deleteTvShow(id: number): Promise<boolean>;
  
  // Reviews methods
  getReviewsByTvShowId(tvShowId: number): Promise<TvShowReview[]>;
  addReview(review: InsertTvShowReview): Promise<TvShowReview>;
  
  // Search/Popularity tracking methods
  trackShowSearch(tvShowId: number): Promise<void>;
  trackShowView(tvShowId: number): Promise<void>;
  getPopularShows(limit?: number): Promise<TvShow[]>;
  
  // Import shows from GitHub data
  importShowsFromGitHub(shows: TvShowGitHub[]): Promise<TvShow[]>;

  // Favorites methods
  addFavorite(userId: number, tvShowId: number): Promise<Favorite>;
  removeFavorite(userId: number, tvShowId: number): Promise<boolean>;
  getUserFavorites(userId: number): Promise<TvShow[]>;
  isFavorite(userId: number, tvShowId: number): Promise<boolean>;
  getSimilarShows(userId: number, limit?: number): Promise<TvShow[]>;
}

export class DatabaseStorage implements IStorage {
  /**
   * Standardizes all sensory metrics in the database to use the approved 5-level scale
   */
  async standardizeAllSensoryMetrics(): Promise<{success: boolean, unrecognizedValues: string[]}> {
    const unrecognizedValues = new Set<string>();
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Get all TV shows
      const result = await client.query('SELECT * FROM tv_shows');
      console.log(`Standardizing sensory metrics for ${result.rowCount} TV shows`);
      
      // Track stats
      let totalUpdates = 0;
      let showsUpdated = 0;
      
      // Process each show
      for (const show of result.rows) {
        let updated = false;
        const updates: Record<string, string> = {};
        
        // Sensory metric fields to standardize
        const fields = [
          'interaction_level',
          'dialogue_intensity',
          'sound_frequency',
          'total_music_level',
          'music_tempo',
          'sound_effects_level',
          'scene_frequency',
          'total_sound_effect_time_level',
          'interactivity_level'
        ];
        
        // Check and standardize each field
        for (const field of fields) {
          const originalValue = show[field];
          
          if (originalValue) {
            const standardizedValue = this.standardizeSensoryMetric(originalValue);
            
            // If the value changed, mark for update
            if (standardizedValue !== originalValue) {
              updates[field] = standardizedValue;
              updated = true;
              totalUpdates++;
              
              // Log non-standard values for reporting
              if (!['Low', 'Low-Moderate', 'Moderate', 'Moderate-High', 'High'].includes(originalValue)) {
                unrecognizedValues.add(`"${originalValue}" → "${standardizedValue}"`);
              }
            }
          }
        }
        
        // If any fields were standardized, update the show
        if (updated) {
          const setClause = Object.entries(updates)
            .map(([field, value]) => `${field} = $${field}`)
            .join(', ');
          
          const queryParams: any = { id: show.id };
          Object.entries(updates).forEach(([field, value]) => {
            queryParams[field] = value;
          });
          
          const updateQuery = `
            UPDATE tv_shows 
            SET ${setClause}
            WHERE id = $id
          `;
          
          await client.query(updateQuery, queryParams);
          showsUpdated++;
        }
      }
      
      // Commit changes
      await client.query('COMMIT');
      console.log(`Standardization complete: Updated ${totalUpdates} metrics across ${showsUpdated} shows`);
      
      return {
        success: true,
        unrecognizedValues: Array.from(unrecognizedValues)
      };
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Error standardizing sensory metrics:', error);
      return {
        success: false,
        unrecognizedValues: Array.from(unrecognizedValues)
      };
    } finally {
      client.release();
    }
  }
  
  // Private helper methods
  
  /**
   * Standardize sensory metric values to use only approved ratings:
   * Low, Low-Moderate, Moderate, Moderate-High, High
   */
  private standardizeSensoryMetric(value: string | null): string | null {
    if (!value) return null;
    
    // Normalize to lowercase and trim for consistent matching
    const normalizedValue = value.toLowerCase().trim();
    
    // Already using the standard terms (case-insensitive)
    if (/^low$/i.test(normalizedValue)) return "Low";
    if (/^low-moderate$/i.test(normalizedValue)) return "Low-Moderate";
    if (/^moderate$/i.test(normalizedValue)) return "Moderate";
    if (/^moderate-high$/i.test(normalizedValue)) return "Moderate-High";
    if (/^high$/i.test(normalizedValue)) return "High";
    
    // Map various terms to standardized values
    
    // LOW mappings
    if ([
      'minimal', 'very low', 'very-low', 'verylow', 'none', 'quiet', 'soft',
      'rare', 'mild', 'limited', 'infrequent', 'sparse', 'little', 'gentle',
      'very minimal', 'very-minimal', 'very little', 'very-little', 'rarely',
      'extremely limited', 'negligible', 'slow', 'calm', 'relaxed', 'lowest',
      'slight', 'trivial', 'minor', 'subtle', 'occasional'
    ].some(term => normalizedValue.includes(term))) {
      return "Low";
    }
    
    // LOW-MODERATE mappings
    if ([
      'low moderate', 'low to moderate', 'lowmoderate', 'low/moderate',
      'light', 'light-moderate', 'light moderate', 'somewhat limited',
      'below average', 'relatively low', 'moderately low', 'light-medium',
      'somewhat low', 'few', 'gentle-moderate', 'low medium', 'moderate-low',
      'low to medium', 'occasionally', 'mild to moderate', 'fairly low'
    ].some(term => normalizedValue.includes(term))) {
      return "Low-Moderate";
    }
    
    // MODERATE mappings
    if ([
      'medium', 'average', 'normal', 'standard', 'balanced', 'regular',
      'middle', 'neutral', 'intermediate', 'sometimes', 'periodically',
      'moderately', 'mid-level', 'mid level', 'midlevel', 'medium level',
      'moderate level', 'reasonable', 'center', 'occasional-frequent',
      'fair', 'halfway', 'moderate amount', 'common', 'mid', 'standard'
    ].some(term => normalizedValue.includes(term))) {
      return "Moderate";
    }
    
    // MODERATE-HIGH mappings
    if ([
      'moderate high', 'moderate to high', 'moderatehigh', 'moderate/high',
      'elevated', 'significant', 'substantial', 'fairly high', 'considerable', 
      'above average', 'pronounced', 'notable', 'noticeable', 'robust',
      'strong', 'frequent', 'often', 'relatively high', 'higher than average',
      'heightened', 'medium-high', 'medium high', 'medium to high', 'quite high',
      'somewhat high', 'moderate-to-high'
    ].some(term => normalizedValue.includes(term))) {
      return "Moderate-High";
    }
    
    // HIGH mappings
    if ([
      'very high', 'very-high', 'veryhigh', 'intense', 'continuous', 'heavy', 
      'extreme', 'maximum', 'highest', 'extensive', 'strong', 'significant',
      'very intense', 'very-intense', 'veryintense', 'constant', 'always',
      'excessive', 'considerable', 'substantial', 'loud', 'abundant',
      'numerous', 'fast', 'rapid', 'consistent', 'dominant'
    ].some(term => normalizedValue.includes(term))) {
      return "High";
    }
    
    // Default to Moderate for any unrecognized values
    // Using specific log format to make these easy to find
    console.warn(`[METRIC_STANDARDIZATION] Unrecognized sensory metric value: "${value}", defaulting to "Moderate"`);
    return "Moderate";
  }
  
  // Private helper methods for junction tables
  
  /**
   * Get theme records for a TV show via junction table
   */
  private async getThemesForShow(tvShowId: number): Promise<Theme[]> {
    try {
      const result = await db
        .select({
          theme: themes
        })
        .from(tvShowThemes)
        .innerJoin(themes, eq(tvShowThemes.themeId, themes.id))
        .where(eq(tvShowThemes.tvShowId, tvShowId));
      
      return result.map(r => r.theme);
    } catch (error) {
      console.error("Error retrieving themes for show", error);
      // Fall back to original array column if junction table query fails
      const result = await db
        .select({ themes: tvShows.themes })
        .from(tvShows)
        .where(eq(tvShows.id, tvShowId));
      
      if (result.length === 0 || !result[0].themes) {
        return [];
      }
      
      // Convert string array to Theme objects
      return result[0].themes.map(name => ({ id: 0, name }));
    }
  }
  
  /**
   * Get platform records for a TV show via junction table
   */
  private async getPlatformsForShow(tvShowId: number): Promise<Platform[]> {
    try {
      const result = await db
        .select({
          platform: platforms
        })
        .from(tvShowPlatforms)
        .innerJoin(platforms, eq(tvShowPlatforms.platformId, platforms.id))
        .where(eq(tvShowPlatforms.tvShowId, tvShowId));
      
      return result.map(r => r.platform);
    } catch (error) {
      console.error("Error retrieving platforms for show", error);
      // Fall back to original array column if junction table query fails
      const result = await db
        .select({ platforms: tvShows.availableOn })
        .from(tvShows)
        .where(eq(tvShows.id, tvShowId));
      
      if (result.length === 0 || !result[0].platforms) {
        return [];
      }
      
      // Convert string array to Platform objects
      return result[0].platforms.map(name => ({ id: 0, name }));
    }
  }
  
  /**
   * Update themes for a TV show using the junction table
   */
  private async updateThemesForShow(tvShowId: number, themeNames: string[]): Promise<void> {
    try {
      // Start a transaction
      await db.transaction(async (tx) => {
        // Remove existing theme associations
        await tx
          .delete(tvShowThemes)
          .where(eq(tvShowThemes.tvShowId, tvShowId));
        
        // Process each theme name
        for (const themeName of themeNames) {
          // Skip empty theme names
          if (!themeName.trim()) continue;
          
          // Find or create the theme
          let themeId: number;
          const existingTheme = await tx
            .select()
            .from(themes)
            .where(eq(themes.name, themeName));
            
          if (existingTheme.length > 0) {
            themeId = existingTheme[0].id;
          } else {
            // Create new theme
            const newTheme = await tx
              .insert(themes)
              .values({ name: themeName })
              .returning();
            themeId = newTheme[0].id;
          }
          
          // Create association in the junction table
          await tx
            .insert(tvShowThemes)
            .values({ tvShowId, themeId })
            .onConflictDoNothing();
        }
        
        // Also update the array column for backward compatibility
        await tx
          .update(tvShows)
          .set({ themes: themeNames })
          .where(eq(tvShows.id, tvShowId));
      });
    } catch (error) {
      console.error("Error updating themes for show", error);
      // Fallback to just updating the array column
      await db
        .update(tvShows)
        .set({ themes: themeNames })
        .where(eq(tvShows.id, tvShowId));
    }
  }
  
  /**
   * Update platforms for a TV show using the junction table
   */
  private async updatePlatformsForShow(tvShowId: number, platformNames: string[]): Promise<void> {
    try {
      // Start a transaction
      await db.transaction(async (tx) => {
        // Remove existing platform associations
        await tx
          .delete(tvShowPlatforms)
          .where(eq(tvShowPlatforms.tvShowId, tvShowId));
        
        // Process each platform name
        for (const platformName of platformNames) {
          // Skip empty platform names
          if (!platformName.trim()) continue;
          
          // Find or create the platform
          let platformId: number;
          const existingPlatform = await tx
            .select()
            .from(platforms)
            .where(eq(platforms.name, platformName));
            
          if (existingPlatform.length > 0) {
            platformId = existingPlatform[0].id;
          } else {
            // Create new platform
            const newPlatform = await tx
              .insert(platforms)
              .values({ name: platformName })
              .returning();
            platformId = newPlatform[0].id;
          }
          
          // Create association in the junction table
          await tx
            .insert(tvShowPlatforms)
            .values({ tvShowId, platformId })
            .onConflictDoNothing();
        }
        
        // Also update the array column for backward compatibility
        await tx
          .update(tvShows)
          .set({ availableOn: platformNames })
          .where(eq(tvShows.id, tvShowId));
      });
    } catch (error) {
      console.error("Error updating platforms for show", error);
      // Fallback to just updating the array column
      await db
        .update(tvShows)
        .set({ availableOn: platformNames })
        .where(eq(tvShows.id, tvShowId));
    }
  }
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        password: result.rows[0].password,
        username: result.rows[0].username,
        isAdmin: result.rows[0].is_admin,
        country: result.rows[0].country,
        createdAt: result.rows[0].created_at,
        isApproved: result.rows[0].is_approved
      };
    } catch (error) {
      console.error(`Error getting user by ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log(`Searching for user with email: ${email}`);
    
    // First, try a simple query to verify the database is accessible
    try {
      const checkResult = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`Total users in database: ${checkResult.rows[0].count}`);
    } catch (error) {
      console.error('Error checking user count:', error);
    }
    
    try {
      // Try direct query without transaction to see if that's the issue
      const directResult = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
      console.log(`Direct query result:`, {
        rowCount: directResult.rowCount,
        found: directResult.rows.length > 0,
        id: directResult.rows[0]?.id
      });
      
      if (directResult.rows.length > 0) {
        // Use direct query result without transaction
        return {
          id: directResult.rows[0].id,
          email: directResult.rows[0].email,
          password: directResult.rows[0].password,
          username: directResult.rows[0].username,
          isAdmin: directResult.rows[0].is_admin,
          country: directResult.rows[0].country,
          createdAt: directResult.rows[0].created_at,
          isApproved: directResult.rows[0].is_approved
        };
      } else {
        console.log(`User with email ${email} not found in direct query`);
      }
    } catch (directError) {
      console.error(`Error in direct query for email ${email}:`, directError);
    }
    
    return undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log(`Searching for user with username: ${username}`);
    
    try {
      // Try direct query without transaction
      const directResult = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
      console.log(`Direct query result for username:`, {
        rowCount: directResult.rowCount,
        found: directResult.rows.length > 0,
        id: directResult.rows[0]?.id
      });
      
      if (directResult.rows.length > 0) {
        // Use direct query result without transaction
        return {
          id: directResult.rows[0].id,
          email: directResult.rows[0].email,
          password: directResult.rows[0].password,
          username: directResult.rows[0].username,
          isAdmin: directResult.rows[0].is_admin,
          country: directResult.rows[0].country,
          createdAt: directResult.rows[0].created_at,
          isApproved: directResult.rows[0].is_approved
        };
      } else {
        console.log(`User with username ${username} not found in direct query`);
      }
    } catch (directError) {
      console.error(`Error in direct query for username ${username}:`, directError);
    }
    
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      const now = new Date().toISOString();
      
      // Ensure username is never null to match schema requirements
      const userToInsert = {
        ...insertUser,
        username: insertUser.username || '', // Convert null to empty string if needed
        createdAt: now,
      };
      
      console.log('Creating user with data:', {...userToInsert, password: '[REDACTED]'});
      
      // Use client instead of pool for transaction
      const result = await client.query(`
        INSERT INTO users (email, password, username, is_admin, country, created_at, is_approved) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *
      `, [
        userToInsert.email,
        userToInsert.password,
        userToInsert.username,
        userToInsert.isAdmin || false,
        userToInsert.country || '',
        userToInsert.createdAt,
        userToInsert.isApproved || false
      ]);
      
      // Explicitly commit the transaction
      await client.query('COMMIT');
      
      // Convert from raw SQL result to our expected User type
      const user: User = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        password: result.rows[0].password,
        username: result.rows[0].username,
        isAdmin: result.rows[0].is_admin,
        country: result.rows[0].country,
        createdAt: result.rows[0].created_at,
        isApproved: result.rows[0].is_approved
      };
      
      console.log('User created successfully with ID:', user.id);
      return user;
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error creating user in database:', error);
      throw error; // Re-throw to be caught by the API layer
    } finally {
      // Always release the client back to the pool
      client.release();
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    const client = await pool.connect();
    
    try {
      // Use a transaction to ensure data consistency
      await client.query('BEGIN');
      
      // Execute the query with the client
      const result = await client.query('SELECT * FROM users ORDER BY id DESC');
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Map the SQL results to our User type
      const userList: User[] = result.rows.map(row => ({
        id: row.id,
        email: row.email,
        password: row.password,
        username: row.username,
        isAdmin: row.is_admin,
        country: row.country,
        createdAt: row.created_at,
        isApproved: row.is_approved
      }));
      
      console.log(`Fetched ${userList.length} users from database`);
      return userList;
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK');
      console.error('Error fetching users:', error);
      return [];
    } finally {
      // Release the client back to the pool
      client.release();
    }
  }
  
  async updateUserApproval(userId: number, isApproved: boolean): Promise<User | undefined> {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Execute update with transaction
      const result = await client.query(`
        UPDATE users 
        SET is_approved = $1 
        WHERE id = $2 
        RETURNING *
      `, [isApproved, userId]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log(`No user found with ID ${userId} to update approval status`);
        return undefined;
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Map the SQL result to our User type
      const updatedUser: User = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        password: result.rows[0].password,
        username: result.rows[0].username,
        isAdmin: result.rows[0].is_admin,
        country: result.rows[0].country,
        createdAt: result.rows[0].created_at,
        isApproved: result.rows[0].is_approved
      };
      
      console.log(`Updated approval status for user ${updatedUser.id} to ${isApproved}`);
      return updatedUser;
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error(`Error updating approval status for user ${userId}:`, error);
      return undefined;
    } finally {
      // Always release the client
      client.release();
    }
  }

  async getTvShowsByPlatform(platform: string, limit: number = 100): Promise<TvShow[]> {
    try {
      const client = await pool.connect();
      try {
        // Use parameterized query to search for shows by platform
        const result = await client.query(
          'SELECT * FROM tv_shows WHERE available_on::text LIKE $1 ORDER BY name LIMIT $2',
          [`%${platform}%`, limit]
        );
        
        console.log(`Retrieved ${result.rowCount} TV shows for platform "${platform}"`);
        
        // Map the database rows to our TvShow model, same mapping as getAllTvShows
        return result.rows.map(row => ({
          id: row.id,
          name: row.name || '',
          description: row.description || '',
          imageUrl: row.image_url,
          ageRange: row.age_range || '',
          tantrumFactor: row.tantrum_factor || '',
          themes: row.themes || [],
          
          // Stimulation metrics
          stimulationScore: row.stimulation_score || 0,
          interactivityLevel: row.interactivity_level || null,
          dialogueIntensity: row.dialogue_intensity || null,
          soundEffectsLevel: row.sound_effects_level || null,
          totalMusicLevel: row.total_music_level || null,
          musicTempo: row.music_tempo || null,
          totalSoundEffectTimeLevel: row.total_sound_effect_time_level || null,
          sceneFrequency: row.scene_frequency || null,
          animationStyle: row.animation_style || null,
          
          // Required schema fields with defaults
          episodeLength: row.episode_length || 0,
          creator: row.creator || null,
          releaseYear: row.release_year || null,
          endYear: row.end_year || null,
          isOngoing: row.is_ongoing || null,
          seasons: row.seasons || null,
          availableOn: row.available_on || [],
          creativityRating: row.creativity_rating || null,
          
          // YouTube-specific fields
          subscriberCount: row.subscriber_count || null,
          videoCount: row.video_count || null,
          channelId: row.channel_id || null,
          isYouTubeChannel: row.is_youtube_channel || false,
          publishedAt: row.published_at || null,
          
          // API data flags
          hasOmdbData: row.has_omdb_data || false,
          hasYoutubeData: row.has_youtube_data || false
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error fetching TV shows for platform "${platform}":`, error);
      return [];
    }
  }
  
  async getAllTvShows(): Promise<TvShow[]> {
    try {
      // Direct SQL query approach for reliability
      const client = await pool.connect();
      try {
        // Get basic show data
        const result = await client.query('SELECT * FROM tv_shows ORDER BY name');
        console.log(`Retrieved ${result.rowCount} TV shows from database`);
        
        // Create initial show objects
        const tvShows = result.rows.map(row => ({
          id: row.id,
          name: row.name || '',
          description: row.description || '',
          imageUrl: row.image_url,
          ageRange: row.age_range || '',
          episodeLength: row.episode_length || 0,
          themes: [], // Will be populated from junction table
          availableOn: [], // Will be populated from junction table
          
          // Stimulation metrics
          stimulationScore: row.stimulation_score || 0,
          interactionLevel: this.standardizeSensoryMetric(row.interaction_level),
          dialogueIntensity: this.standardizeSensoryMetric(row.dialogue_intensity),
          soundFrequency: this.standardizeSensoryMetric(row.sound_frequency),
          totalMusicLevel: this.standardizeSensoryMetric(row.total_music_level),
          musicTempo: this.standardizeSensoryMetric(row.music_tempo),
          soundEffectsLevel: this.standardizeSensoryMetric(row.sound_effects_level),
          animationStyle: row.animation_style || null,
          sceneFrequency: this.standardizeSensoryMetric(row.scene_frequency),
          totalSoundEffectTimeLevel: this.standardizeSensoryMetric(row.total_sound_effect_time_level),
          
          // Other fields
          network: row.network || null,
          year: row.year || '',
          productionCompany: row.production_company || '',
          
          // Required schema fields with defaults
          creator: row.creator || null,
          releaseYear: row.release_year || null,
          endYear: row.end_year || null,
          isOngoing: row.is_ongoing || null,
          seasons: row.seasons || null,
          totalEpisodes: row.total_episodes || null,
          productionCountry: row.production_country || null,
          language: row.language || null,
          genre: row.genre || null,
          targetAudience: row.target_audience || null,
          viewerRating: row.viewer_rating || null,
          
          // Timestamps
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
          
          // API data flags
          hasOmdbData: row.has_omdb_data || false,
          hasYoutubeData: row.has_youtube_data || false
        }));
        
        // Fall back to legacy approach if junction tables have issues
        try {
          // First check if junction tables exist
          const checkThemesTable = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = 'tv_show_themes'
            );
          `);
          
          const junctionTablesExist = checkThemesTable.rows[0].exists;
          
          if (junctionTablesExist) {
            // Get themes from junction table
            const themesResult = await client.query(`
              SELECT tv_show_id, t.name 
              FROM tv_show_themes tst
              JOIN themes t ON tst.theme_id = t.id
            `);
            
            // Group themes by TV show ID
            const themesByShowId = new Map();
            for (const row of themesResult.rows) {
              const showId = row.tv_show_id;
              if (!themesByShowId.has(showId)) {
                themesByShowId.set(showId, []);
              }
              themesByShowId.get(showId).push(row.name);
            }
            
            // Get platforms from junction table
            const platformsResult = await client.query(`
              SELECT tv_show_id, p.name 
              FROM tv_show_platforms tsp
              JOIN platforms p ON tsp.platform_id = p.id
            `);
            
            // Group platforms by TV show ID
            const platformsByShowId = new Map();
            for (const row of platformsResult.rows) {
              const showId = row.tv_show_id;
              if (!platformsByShowId.has(showId)) {
                platformsByShowId.set(showId, []);
              }
              platformsByShowId.get(showId).push(row.name);
            }
            
            // Update each show with its themes and platforms
            for (const show of tvShows) {
              if (themesByShowId.has(show.id)) {
                show.themes = themesByShowId.get(show.id);
              }
              if (platformsByShowId.has(show.id)) {
                show.availableOn = platformsByShowId.get(show.id);
              }
            }
          } else {
            console.log("Junction tables not yet available, using legacy data format");
          }
        } catch (junctionError) {
          console.error("Error enhancing with junction table data:", junctionError);
          // Continue with original data if junction tables fail
        }
        
        return tvShows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching TV shows from database:', error);
      
      // Fall back to ORM if direct query fails
      try {
        console.log('Attempting to fetch TV shows using ORM...');
        const shows = await db.select().from(tvShows);
        console.log(`Retrieved ${shows.length} TV shows using ORM`);
        return shows;
      } catch (ormError) {
        console.error('ORM fallback also failed:', ormError);
        return [];
      }
    }
  }

  async getTvShowById(id: number): Promise<TvShow | undefined> {
    try {
      // Use direct SQL query for reliability, similar to getAllTvShows
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM tv_shows WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        const row = result.rows[0];
        const tvShow = {
          id: row.id,
          name: row.name || '',
          description: row.description || '',
          imageUrl: row.image_url,
          ageRange: row.age_range || '',
          themes: row.themes || [],
          
          // Stimulation metrics
          stimulationScore: row.stimulation_score || 0,
          interactionLevel: row.interaction_level || null,
          dialogueIntensity: row.dialogue_intensity || null,
          soundFrequency: row.sound_frequency || null,
          totalMusicLevel: row.total_music_level || null,
          musicTempo: row.music_tempo || null,
          soundEffectsLevel: row.sound_effects_level || null,
          animationStyle: row.animation_style || null,
          sceneFrequency: row.scene_frequency || null,
          totalSoundEffectTimeLevel: row.total_sound_effect_time_level || null,
          
          // Other fields
          network: row.network || null,
          year: row.year || '',
          productionCompany: row.production_company || '',
          
          // Required schema fields with defaults
          episodeLength: row.episode_length || 0,
          creator: row.creator || null,
          releaseYear: row.release_year || null,
          endYear: row.end_year || null,
          isOngoing: row.is_ongoing || null,
          seasons: row.seasons || null,
          totalEpisodes: row.total_episodes || null,
          productionCountry: row.production_country || null,
          language: row.language || null,
          genre: row.genre || null,
          targetAudience: row.target_audience || null,
          viewerRating: row.viewer_rating || null,
          
          // YouTube-specific fields
          isYouTubeChannel: row.is_youtube_channel || false,
          subscriberCount: row.subscriber_count || null,
          videoCount: row.video_count || null,
          channelId: row.channel_id || null,
          publishedAt: row.published_at || null,
          availableOn: row.available_on || [],
          
          // Timestamps
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
          
          // API data flags
          hasOmdbData: row.has_omdb_data || false,
          hasYoutubeData: row.has_youtube_data || false
        };
        
        // Enhance with junction table data
        try {
          // Get themes from junction table
          const themesResult = await client.query(`
            SELECT t.name FROM themes t
            JOIN tv_show_themes tst ON t.id = tst.theme_id
            WHERE tst.tv_show_id = $1
          `, [id]);
          
          if (themesResult.rows.length > 0) {
            // Use themes from junction table if available
            tvShow.themes = themesResult.rows.map(row => row.name);
          }
          
          // Get platforms from junction table
          const platformsResult = await client.query(`
            SELECT p.name FROM platforms p
            JOIN tv_show_platforms tsp ON p.id = tsp.platform_id
            WHERE tsp.tv_show_id = $1
          `, [id]);
          
          if (platformsResult.rows.length > 0) {
            // Use platforms from junction table if available
            tvShow.availableOn = platformsResult.rows.map(row => row.name);
          }
        } catch (junctionError) {
          console.error("Error enhancing with junction tables:", junctionError);
          // Continue with original data if junction tables fail
        }
        
        return tvShow;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error fetching TV show with ID ${id}:`, error);
      
      // Fall back to ORM if direct query fails
      try {
        const [show] = await db.select().from(tvShows).where(eq(tvShows.id, id));
        return show;
      } catch (ormError) {
        console.error(`ORM fallback for TV show ID ${id} also failed:`, ormError);
        return undefined;
      }
    }
  }

  async getTvShowsByFilter(filters: { 
    ageGroup?: string; 
    ageRange?: {min: number, max: number};
    tantrumFactor?: string; 
    sortBy?: string; 
    search?: string;
    themes?: string[];
    themeMatchMode?: 'AND' | 'OR';
    interactionLevel?: string;
    dialogueIntensity?: string;
    soundFrequency?: string;
    stimulationScoreRange?: {min: number, max: number};
  }): Promise<TvShow[]> {
    // Build query based on filters
    let query = db.select().from(tvShows);
    
    // Apply filters
    const conditions = [];
    
    // Handle age range filtering
    if ('ageRange' in filters && filters.ageRange && 'min' in filters.ageRange && 'max' in filters.ageRange) {
      const min = filters.ageRange.min;
      const max = filters.ageRange.max;
      
      // Log the age range filter for debugging
      console.log(`Filtering by age range: min=${min}, max=${max}`);

      // Extract the min and max from the show's ageRange string
      // Patterns we handle: "0-2", "3-5", "6-8", "9-12", "13+", "Any Age"
      conditions.push(
        or(
          // Special case for "Any Age" - always include these
          eq(tvShows.ageRange, "Any Age"),
          
          // Special case for other non-standard formats
          and(
            not(like(tvShows.ageRange, "%-%")), // Not a standard range with hyphen
            not(like(tvShows.ageRange, "%+%")), // Not a range ending with +
            not(eq(tvShows.ageRange, "Any Age")), // Not "Any Age"
            // Include these non-standard formats only for ages 3+ to avoid excessive filtering
            sql`${min} >= 3`
          ),
          
          // Handle standard age ranges like "3-5" - we only process if it has a hyphen
          and(
            like(tvShows.ageRange, "%-%"), // Contains a hyphen for ranges
            not(like(tvShows.ageRange, "%years%")), // Exclude ranges with "years" text
            not(like(tvShows.ageRange, "%+%")), // Not a range ending with +
            // Safe conversion with regex check
            sql`
              REGEXP_REPLACE(SPLIT_PART(${tvShows.ageRange}, '-', 1), '[^0-9]', '', 'g')::INTEGER >= ${min} AND
              REGEXP_REPLACE(SPLIT_PART(${tvShows.ageRange}, '-', 2), '[^0-9]', '', 'g')::INTEGER <= ${max}
            `
          ),
          
          // Handle ranges with + like "13+"
          and(
            like(tvShows.ageRange, "%+%"),
            // Safe conversion with regex to extract just the number
            sql`REGEXP_REPLACE(${tvShows.ageRange}, '[^0-9]', '', 'g')::INTEGER BETWEEN ${min} AND ${max}`
          ),
          
          // Include shows where the age range contains our filter range
          // For example, "2-8 years" would match filter range 3-6
          and(
            like(tvShows.ageRange, "%-%"), // Contains a hyphen for ranges
            sql`
              REGEXP_REPLACE(SPLIT_PART(${tvShows.ageRange}, '-', 1), '[^0-9]', '', 'g')::INTEGER <= ${min} AND
              REGEXP_REPLACE(SPLIT_PART(${tvShows.ageRange}, '-', 2), '[^0-9]', '', 'g')::INTEGER >= ${max}
            `
          )
        )
      );
    } 
    // Legacy support for exact age group matching
    else if (filters.ageGroup) {
      conditions.push(eq(tvShows.ageRange, filters.ageGroup));
    }
    
    if (filters.tantrumFactor) {
      // Convert descriptive term to numerical value
      let stimulationScore;
      switch (filters.tantrumFactor.toLowerCase()) {
        case 'low': stimulationScore = 1; break;
        case 'low-medium': stimulationScore = 2; break;
        case 'medium': stimulationScore = 3; break;
        case 'medium-high': stimulationScore = 4; break;
        case 'high': stimulationScore = 5; break;
      }
      
      if (stimulationScore) {
        conditions.push(eq(tvShows.stimulationScore, stimulationScore));
      }
    }
    
    if (filters.interactionLevel) {
      // Map frontend 'interactionLevel' to database 'interactivityLevel' field
      console.log("Filtering by interaction level:", filters.interactionLevel);
      
      // Handle different values for High interactivity
      if (filters.interactionLevel === 'High') {
        conditions.push(
          or(
            eq(tvShows.interactivityLevel, 'High'),
            like(tvShows.interactivityLevel, '%High%'), // Catches "Moderate-High" or "Very High"
            like(tvShows.interactivityLevel, '%to High%') // Catches "Moderate to High"
          )
        );
      } else {
        conditions.push(eq(tvShows.interactivityLevel, filters.interactionLevel));
      }
    }
    
    if (filters.dialogueIntensity) {
      // Log for debugging purposes
      console.log("Filtering by dialogue intensity:", filters.dialogueIntensity);
      conditions.push(eq(tvShows.dialogueIntensity, filters.dialogueIntensity));
    }
    
    if (filters.soundFrequency) {
      // Map frontend 'soundFrequency' to database 'soundEffectsLevel' field
      console.log("Filtering by sound frequency level:", filters.soundFrequency);
      conditions.push(eq(tvShows.soundEffectsLevel, filters.soundFrequency));
    }
    
    if (filters.stimulationScoreRange) {
      const { min, max } = filters.stimulationScoreRange;
      conditions.push(sql`${tvShows.stimulationScore} >= ${min} AND ${tvShows.stimulationScore} <= ${max}`);
    }
    
    if (filters.search) {
      // Simple text search across name and description
      const searchTerm = `%${filters.search}%`;
      conditions.push(sql`(${tvShows.name} ILIKE ${searchTerm} OR ${tvShows.description} ILIKE ${searchTerm})`);
    }
    
    // Filter by themes
    if (filters.themes && filters.themes.length > 0) {
      const themeMatchMode = filters.themeMatchMode || 'AND';
      console.log(`Filtering by themes: ${filters.themes.join(', ')}, match mode: ${themeMatchMode}`);
      
      // Don't add SQL conditions - we'll do post-query filtering entirely in JavaScript
      // This allows for more precise control over theme matching logic
      
      // Add a marker that we have theme filters but are handling them post-query
      console.log("Theme filtering will be handled in post-processing");
    }
    
    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sort order
    if (filters.sortBy) {
      switch (filters.sortBy.toLowerCase()) {
        case 'name_asc':
          query = query.orderBy(tvShows.name);
          break;
        case 'name_desc':
          query = query.orderBy(desc(tvShows.name));
          break;
        case 'stimulation_asc':
          query = query.orderBy(tvShows.stimulationScore);
          break;
        case 'stimulation_desc':
          query = query.orderBy(desc(tvShows.stimulationScore));
          break;
        case 'year_asc':
          query = query.orderBy(tvShows.releaseYear);
          break;
        case 'year_desc':
          query = query.orderBy(desc(tvShows.releaseYear));
          break;
        default:
          // Default to name ascending
          query = query.orderBy(tvShows.name);
      }
    } else {
      // Default sort order
      query = query.orderBy(tvShows.name);
    }
    
    // Execute query
    let shows = await query;
    
    // Handle theme filtering (post-query for better control)
    if (filters.themes && filters.themes.length > 0) {
      const themeMatchMode = ('themeMatchMode' in filters) ? (filters.themeMatchMode || 'AND') : 'AND';
      console.log(`Post-query filtering for themes: ${filters.themes.join(', ')} using ${themeMatchMode} mode`);
      
      // Clean up search themes
      const searchThemes = filters.themes.map(theme => theme.trim());
      console.log(`Looking for themes: ${JSON.stringify(searchThemes)}`);

      // Debug how many shows we're starting with
      console.log(`Starting with ${shows.length} shows before theme filtering`);
      
      // Function to check if a show matches a specific theme
      const showMatchesTheme = (show: any, searchTheme: string): boolean => {
        if (!show.themes || !Array.isArray(show.themes) || show.themes.length === 0) {
          return false;
        }
        
        // Normalize the search theme for consistent matching
        const normalizedSearchTheme = searchTheme.toLowerCase().trim();
        
        // 1. Check for exact theme match (case insensitive)
        const hasExactTheme = show.themes.some(showTheme => 
          showTheme && showTheme.toLowerCase().trim() === normalizedSearchTheme
        );
        
        // For OR mode or exact matches, prioritize exact matches only
        if (hasExactTheme) {
          console.log(`Found exact theme match for "${searchTheme}" in show: ${show.name}`);
          return true;
        }
        
        // 2. For compound themes like "Arabic Language Learning"
        // Only if we have more than one word in the search theme
        if (normalizedSearchTheme.includes(' ')) {
          const searchWords = normalizedSearchTheme.split(' ');
          
          // Check if any show theme contains all the words in the search theme
          const hasCompoundMatch = show.themes.some(showTheme => {
            if (!showTheme) return false;
            
            const showThemeLower = showTheme.toLowerCase().trim();
            
            // If the show theme is the exact same length as the search theme
            // and contains all the words, it's likely a match with different word order
            if (Math.abs(showThemeLower.length - normalizedSearchTheme.length) < 5) {
              return searchWords.every(word => showThemeLower.includes(word));
            }
            
            return false;
          });
          
          if (hasCompoundMatch) {
            console.log(`Found compound theme match for "${searchTheme}" in show: ${show.name}`);
            return true;
          }
        }
        
        // No more partial/fuzzy matching to avoid unexpected results
        return false;
      };
      
      // Apply filtering based on theme match mode
      if (themeMatchMode === 'AND') {
        // AND mode - show must match ALL selected themes
        console.log('Using AND mode: Shows must match ALL selected themes');
        shows = shows.filter(show => 
          searchThemes.every(theme => showMatchesTheme(show, theme))
        );
      } else {
        // OR mode - show must match ANY selected theme
        console.log('Using OR mode: Shows must match ANY selected theme');
        shows = shows.filter(show => 
          searchThemes.some(theme => showMatchesTheme(show, theme))
        );
      }
      
      console.log(`Found ${shows.length} shows after theme filtering (${themeMatchMode} mode)`);
    }
    
    return shows;
  }

  async addTvShow(show: InsertTvShow): Promise<TvShow> {
    const [newShow] = await db.insert(tvShows).values(show).returning();
    return newShow;
  }

  async updateTvShow(id: number, show: Partial<InsertTvShow>): Promise<TvShow | undefined> {
    // If we're updating the image URL, save it to our custom map
    if (show.imageUrl) {
      updateCustomImageMap(id, show.imageUrl);
    }
    
    // Fix the availableOn field if it's a string instead of an array
    if (show.availableOn && typeof show.availableOn === 'string') {
      // Convert comma-separated string to array
      show.availableOn = show.availableOn.split(',').map(item => item.trim());
      console.log('Converted availableOn to array:', show.availableOn);
    }
    
    // Handle YouTube-specific fields
    if (show.isYouTubeChannel && !show.availableOn) {
      show.availableOn = ['YouTube'];
    }
    
    // Extract and handle themes with junction table if they're being updated
    const themeNames = show.themes;
    delete show.themes; // Remove themes from the direct update
    
    // Extract and handle platforms with junction table if they're being updated
    const platformNames = show.availableOn;
    delete show.availableOn; // Remove availableOn from the direct update
    
    // Save stimulation metrics and other important details to our custom details map
    const stimulationMetrics: Record<string, any> = {};
    const importantFields = [
      'stimulationScore', 'musicTempo', 'totalMusicLevel', 'totalSoundEffectTimeLevel', 
      'sceneFrequency', 'interactivityLevel', 'dialogueIntensity', 'soundEffectsLevel',
      'animationStyle', 'ageRange', 'themes', 'description'
    ];
    
    // Round stimulation score to whole numbers if it exists
    if ('stimulationScore' in show && show.stimulationScore !== undefined) {
      show.stimulationScore = Math.round(Number(show.stimulationScore));
    }
    
    // Check if we're updating any important fields
    let hasImportantFields = false;
    for (const field of importantFields) {
      if (field in show && show[field as keyof typeof show] !== undefined) {
        stimulationMetrics[field] = show[field as keyof typeof show];
        hasImportantFields = true;
      }
    }
    
    // Save to custom details map if we have important fields to preserve
    if (hasImportantFields) {
      updateCustomShowDetails(id, stimulationMetrics);
    }
    
    const [updatedShow] = await db
      .update(tvShows)
      .set(show)
      .where(eq(tvShows.id, id))
      .returning();
      
    // Update themes if provided
    if (themeNames && Array.isArray(themeNames)) {
      try {
        await this.updateThemesForShow(id, themeNames);
      } catch (error) {
        console.error("Error updating themes:", error);
        // Continue with the update even if theme update fails
      }
    }
    
    // Update platforms if provided
    if (platformNames && Array.isArray(platformNames)) {
      try {
        await this.updatePlatformsForShow(id, platformNames);
      } catch (error) {
        console.error("Error updating platforms:", error);
        // Continue with the update even if platform update fails
      }
    }
    
    // Return the updated show with junction table data included
    return this.getTvShowById(id);
  }

  async deleteTvShow(id: number): Promise<boolean> {
    try {
      // First, delete any junction table entries
      await db.delete(tvShowThemes).where(eq(tvShowThemes.tvShowId, id));
      await db.delete(tvShowPlatforms).where(eq(tvShowPlatforms.tvShowId, id));
      
      // Then delete the show itself
      const result = await db.delete(tvShows).where(eq(tvShows.id, id));
      return result.count > 0;
    } catch (error) {
      console.error(`Error deleting TV show with ID ${id}:`, error);
      throw error;
    }
  }

  async getReviewsByTvShowId(tvShowId: number): Promise<TvShowReview[]> {
    // Use sql template to explicitly specify column names
    return await db.execute(sql`
      SELECT 
        id, 
        tv_show_id as "tvShowId",
        user_id as "userId", 
        user_name as "userName", 
        rating, 
        review, 
        created_at as "createdAt"
      FROM tv_show_reviews 
      WHERE tv_show_id = ${tvShowId}
    `);
  }
  
  async getReviewsByUserId(userId: number): Promise<TvShowReview[]> {
    // Use sql template to explicitly specify column names
    return await db.execute(sql`
      SELECT 
        id, 
        tv_show_id as "tvShowId",
        user_id as "userId", 
        user_name as "userName", 
        rating, 
        review, 
        created_at as "createdAt"
      FROM tv_show_reviews 
      WHERE user_id = ${userId}
    `);
  }

  async addReview(review: InsertTvShowReview): Promise<TvShowReview> {
    // Let Postgres handle the timestamp with defaultNow()
    const [newReview] = await db
      .insert(tvShowReviews)
      .values({
        ...review
      })
      .returning();
    return newReview;
  }

  async trackShowSearch(tvShowId: number): Promise<void> {
    try {
      const now = new Date();
      const [existingSearch] = await db
        .select()
        .from(tvShowSearches)
        .where(eq(tvShowSearches.tvShowId, tvShowId));

      if (existingSearch) {
        await db
          .update(tvShowSearches)
          .set({
            searchCount: existingSearch.searchCount + 1,
            lastSearched: now,
          })
          .where(eq(tvShowSearches.id, existingSearch.id));
      } else {
        await db.insert(tvShowSearches).values({
          tvShowId,
          searchCount: 1,
          viewCount: 0,
          lastSearched: now,
          lastViewed: null,
        });
      }
    } catch (error) {
      // Log error but don't let it block the search functionality
      console.error(`Error tracking search for TV show ID ${tvShowId}:`, error);
    }
  }

  async trackShowView(tvShowId: number): Promise<void> {
    try {
      // Use the new separate table for view tracking
      const [existingView] = await db
        .select()
        .from(tvShowViews)
        .where(eq(tvShowViews.tvShowId, tvShowId));

      if (existingView) {
        // Update existing view record
        await db
          .update(tvShowViews)
          .set({
            viewCount: existingView.viewCount + 1
          })
          .where(eq(tvShowViews.id, existingView.id));
      } else {
        // Create new view record
        await db.insert(tvShowViews).values({
          tvShowId,
          viewCount: 1
        });
      }
    } catch (error) {
      console.error("Error tracking TV show view:", error);
      throw error;
    }
  }

  async getPopularShows(limit: number = 10): Promise<TvShow[]> {
    // Get the top viewed shows using the new dedicated view tracking table
    try {
      const popularShows = await db
        .select({
          show: tvShows,
          totalViews: tvShowViews.viewCount,
        })
        .from(tvShowViews)
        .innerJoin(tvShows, eq(tvShowViews.tvShowId, tvShows.id))
        .orderBy(desc(tvShowViews.viewCount))
        .limit(limit);

      return popularShows.map((item) => item.show);
    } catch (error) {
      console.error("Error getting popular shows:", error);
      // Fallback to get all shows if the join fails
      return this.getAllTvShows().then(shows => shows.slice(0, limit));
    }
  }

  async importShowsFromGitHub(githubShows: TvShowGitHub[]): Promise<TvShow[]> {
    const importedShows: TvShow[] = [];

    for (const githubShow of githubShows) {
      try {
        if (!githubShow.title) {
          console.warn("Skipping show with no title:", githubShow);
          continue;
        }

        // Check if the show already exists
        const [existingShow] = await db
          .select()
          .from(tvShows)
          .where(eq(tvShows.name, githubShow.title));

        if (existingShow) {
          // Update the existing show
          
          // Check for custom image URL first
          const preservedImageUrl = preserveCustomImageUrl(existingShow.id, existingShow.imageUrl);
          
          // Create the update object with GitHub data
          const updateData = {
            // Use the correct property names from the TvShowGitHub type
            description: existingShow.description, // Keep existing description if not provided
            stimulationScore: typeof githubShow.stimulation_score === 'number' 
              ? Math.round(githubShow.stimulation_score) 
              : Math.round(existingShow.stimulationScore),
            dialogueIntensity: githubShow.dialogue_intensity || existingShow.dialogueIntensity,
            soundEffectsLevel: githubShow.sound_effects_level || existingShow.soundEffectsLevel,
            interactivityLevel: githubShow.interactivity_level || existingShow.interactivityLevel,
            ageRange: githubShow.target_age_group || existingShow.ageRange,
            themes: githubShow.themes || existingShow.themes,
            availableOn: [githubShow.platform] || existingShow.availableOn,
            releaseYear: typeof githubShow.release_year === 'number' && !isNaN(githubShow.release_year) ? githubShow.release_year : existingShow.releaseYear,
            endYear: typeof githubShow.end_year === 'number' && !isNaN(githubShow.end_year) ? githubShow.end_year : existingShow.endYear,
            episodeLength: githubShow.avg_episode_length && !isNaN(parseInt(githubShow.avg_episode_length)) ? parseInt(githubShow.avg_episode_length) : existingShow.episodeLength,
            seasons: githubShow.seasons && !isNaN(parseInt(githubShow.seasons)) ? parseInt(githubShow.seasons) : existingShow.seasons,
            // Preserve our custom image URLs during imports
            imageUrl: preservedImageUrl || githubShow.imageUrl || getDefaultImageUrl(githubShow.title, githubShow.image_filename) || existingShow.imageUrl,
          };
          
          // Apply custom details preservation - this will prioritize any custom stimulation metrics
          // and other important details we've saved from admin edits
          const mergedData = preserveCustomShowDetails(existingShow.id, existingShow, updateData);
          
          const [updatedShow] = await db
            .update(tvShows)
            .set(mergedData)
            .where(eq(tvShows.id, existingShow.id))
            .returning();

          importedShows.push(updatedShow);
        } else {
          // Insert new show with default values for required fields
          const tvShow: Partial<InsertTvShow> = {
            name: githubShow.title,
            description: 'A children\'s TV show', // Default description
            stimulationScore: typeof githubShow.stimulation_score === 'number' ? Math.round(githubShow.stimulation_score) : 3,
            dialogueIntensity: githubShow.dialogue_intensity || 'Medium',
            soundEffectsLevel: githubShow.sound_effects_level || 'Medium',
            interactivityLevel: githubShow.interactivity_level || 'Medium',
            ageRange: githubShow.target_age_group || '3-5',
            themes: githubShow.themes || [],
            availableOn: [githubShow.platform],
            releaseYear: typeof githubShow.release_year === 'number' && !isNaN(githubShow.release_year) ? githubShow.release_year : null,
            endYear: typeof githubShow.end_year === 'number' && !isNaN(githubShow.end_year) ? githubShow.end_year : null,
            episodeLength: githubShow.avg_episode_length && !isNaN(parseInt(githubShow.avg_episode_length)) ? parseInt(githubShow.avg_episode_length) : 15,
            seasons: githubShow.seasons && !isNaN(parseInt(githubShow.seasons)) ? parseInt(githubShow.seasons) : null,
            imageUrl: githubShow.imageUrl || getDefaultImageUrl(githubShow.title, githubShow.image_filename),
            // Add default values for required fields using proper camelCase
            overallRating: 3
          };

          const [newShow] = await db.insert(tvShows).values(tvShow).returning();
          importedShows.push(newShow);
        }
      } catch (error) {
        console.error(`Error importing show ${githubShow.title}:`, error);
      }
    }

    return importedShows;
  }

  // Favorites methods
  async addFavorite(userId: number, tvShowId: number): Promise<Favorite> {
    // Check if the favorite already exists
    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.tvShowId, tvShowId)
      ));

    if (existingFavorite) {
      return existingFavorite;
    }

    // Add the favorite
    const now = new Date().toISOString();
    const [favorite] = await db
      .insert(favorites)
      .values({
        userId,
        tvShowId,
        createdAt: now,
      })
      .returning();

    return favorite;
  }

  async removeFavorite(userId: number, tvShowId: number): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.tvShowId, tvShowId)
      ));

    return result.count > 0;
  }

  async getUserFavorites(userId: number): Promise<TvShow[]> {
    const favoriteShows = await db
      .select({
        show: tvShows,
      })
      .from(favorites)
      .innerJoin(tvShows, eq(favorites.tvShowId, tvShows.id))
      .where(eq(favorites.userId, userId))
      .orderBy(tvShows.name);

    return favoriteShows.map(item => item.show);
  }

  async isFavorite(userId: number, tvShowId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.tvShowId, tvShowId)
      ));

    return !!favorite;
  }

  async getSimilarShows(userId: number, limit: number = 5): Promise<TvShow[]> {
    // Get user's favorite shows
    const userFavorites = await this.getUserFavorites(userId);
    
    if (userFavorites.length === 0) {
      // If user has no favorites, return popular shows instead
      return this.getPopularShows(limit);
    }
    
    // Extract features from user's favorites to build a profile
    const favoriteIds = userFavorites.map(show => show.id);
    const avgStimulationScore = Math.round(
      userFavorites.reduce((sum, show) => sum + show.stimulationScore, 0) / userFavorites.length
    );
    
    // Get common themes from user's favorites
    const themeFrequency: Record<string, number> = {};
    userFavorites.forEach(show => {
      show.themes?.forEach(theme => {
        themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
      });
    });
    
    // Get top themes (those that appear in at least 25% of favorites)
    const minThemeCount = Math.max(1, Math.floor(userFavorites.length * 0.25));
    const commonThemes = Object.entries(themeFrequency)
      .filter(([_, count]) => count >= minThemeCount)
      .map(([theme]) => theme);
    
    // Find shows with similar characteristics but not already in favorites
    // This is a simple recommendation algorithm that checks for shows with
    // similar stimulation score and at least one common theme
    const stimScoreRange = { min: Math.max(1, avgStimulationScore - 1), max: Math.min(5, avgStimulationScore + 1) };
    
    const similarShows = await db
      .select()
      .from(tvShows)
      .where(
        and(
          sql`${tvShows.stimulationScore} >= ${stimScoreRange.min} AND ${tvShows.stimulationScore} <= ${stimScoreRange.max}`,
          sql`NOT (${tvShows.id} IN (${favoriteIds.join(',')}))`
        )
      )
      .orderBy(desc(tvShows.stimulationScore)) // Sort by stimulation score for consistent results
      .limit(limit * 2); // Get more than we need to filter by themes
    
    // Score each show based on theme matches and stimulation score similarity
    interface ScoredShow {
      show: TvShow;
      score: number;
    }
    
    const scoredShows: ScoredShow[] = similarShows.map(show => {
      let score = 0;
      
      // Score based on stimulation score similarity (0-5 points)
      const stimDiff = Math.abs(show.stimulationScore - avgStimulationScore);
      score += (5 - stimDiff);
      
      // Score based on theme matches (3 points per match)
      if (show.themes) {
        commonThemes.forEach(theme => {
          if (show.themes?.includes(theme)) {
            score += 3;
          }
        });
      }
      
      return { show, score };
    });
    
    // Sort by score and take the top 'limit' shows
    return scoredShows
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.show);
  }
}

// Helper function to build a default image URL
function getDefaultImageUrl(title: string | undefined, image_filename: string | undefined): string {
  // Check if image_filename exists and use it
  if (image_filename) {
    return `https://raw.githubusercontent.com/ledhaseeb/tvtantrum/main/client/public/images/${image_filename}`;
  }
  
  // Check if title exists
  if (!title) {
    return `https://raw.githubusercontent.com/ledhaseeb/tvtantrum/main/client/public/images/default.jpg`;
  }
  
  // Format the title for a URL-friendly string
  const formattedTitle = title
    .replace(/[^a-zA-Z0-9]/g, "")  // Remove all non-alphanumeric characters
    .toLowerCase();
  
  return `https://raw.githubusercontent.com/ledhaseeb/tvtantrum/main/client/public/images/${formattedTitle}.jpg`;
}

export const storage = new DatabaseStorage();