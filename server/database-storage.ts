import { db, pool } from "./db";
import { eq, and, or, not, sql, desc, inArray, like, count } from "drizzle-orm";
import { 
  users, favorites, tvShows, tvShowReviews, tvShowSearches,
  type User, type InsertUser, 
  type TvShow, type InsertTvShow, 
  type TvShowReview, type InsertTvShowReview,
  type TvShowSearch, type InsertTvShowSearch,
  type Favorite, type InsertFavorite,
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
          publishedAt: row.published_at || null
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
        const result = await client.query('SELECT * FROM tv_shows ORDER BY name');
        console.log(`Retrieved ${result.rowCount} TV shows from database`);
        
        // Map the database rows to our TvShow model
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
          
          // Timestamps
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString()
        }));
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
        return {
          id: row.id,
          name: row.name || '',
          description: row.description || '',
          imageUrl: row.image_url,
          ageRange: row.age_range || '',
          tantrumFactor: row.tantrum_factor || '',
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
          updatedAt: row.updated_at || new Date().toISOString()
        };
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
    tantrumFactor?: string; 
    sortBy?: string; 
    search?: string;
    themes?: string[];
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
    if (filters.ageRange) {
      const { min, max } = filters.ageRange;
      
      // Extract the min and max from the show's ageRange string
      // Patterns we handle: "0-2", "3-5", "6-8", "9-12", "13+", "Any Age"
      conditions.push(
        or(
          // Special case for "Any Age"
          eq(tvShows.ageRange, "Any Age"),
          
          // Match exact ranges
          and(
            or(
              // Handle standard age ranges like "3-5"
              and(
                not(like(tvShows.ageRange, "%+%")), // Not a range ending with +
                sql`
                  CAST(SPLIT_PART(${tvShows.ageRange}, '-', 1) AS INTEGER) >= ${min} AND
                  CAST(SPLIT_PART(${tvShows.ageRange}, '-', 2) AS INTEGER) <= ${max}
                `
              ),
              
              // Handle ranges with + like "13+"
              and(
                like(tvShows.ageRange, "%+%"),
                sql`CAST(SUBSTRING(${tvShows.ageRange} FROM 1 FOR POSITION('+' IN ${tvShows.ageRange})-1) AS INTEGER) BETWEEN ${min} AND ${max}`
              )
            )
          ),
          
          // Include shows where the lower end of the range overlaps with our filter range
          and(
            not(like(tvShows.ageRange, "%+%")), // Not a range ending with +
            sql`
              CAST(SPLIT_PART(${tvShows.ageRange}, '-', 1) AS INTEGER) >= ${min} AND
              CAST(SPLIT_PART(${tvShows.ageRange}, '-', 1) AS INTEGER) <= ${max}
            `
          ),
          
          // Include shows where the upper end of the range overlaps with our filter range
          and(
            not(like(tvShows.ageRange, "%+%")), // Not a range ending with +
            sql`
              CAST(SPLIT_PART(${tvShows.ageRange}, '-', 2) AS INTEGER) >= ${min} AND
              CAST(SPLIT_PART(${tvShows.ageRange}, '-', 2) AS INTEGER) <= ${max}
            `
          ),
          
          // Include shows that completely span our filter range
          and(
            not(like(tvShows.ageRange, "%+%")), // Not a range ending with +
            sql`
              CAST(SPLIT_PART(${tvShows.ageRange}, '-', 1) AS INTEGER) <= ${min} AND
              CAST(SPLIT_PART(${tvShows.ageRange}, '-', 2) AS INTEGER) >= ${max}
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
      conditions.push(eq(tvShows.interactivityLevel, filters.interactionLevel));
    }
    
    if (filters.dialogueIntensity) {
      conditions.push(eq(tvShows.dialogueIntensity, filters.dialogueIntensity));
    }
    
    if (filters.soundFrequency) {
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
      // We need a way to check if all themes are present in the array
      // For multiple themes, we'll need a post-query filter since PostgreSQL array operations 
      // don't easily support checking if an array contains all values from another array
      console.log(`Filtering by themes: ${filters.themes.join(', ')}`);
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
    
    // Post-process for theme filtering
    // This needs to happen after the SQL query because
    // PostgreSQL array operations don't easily support checking if an array contains all values from another array
    if (filters.themes && filters.themes.length > 0) {
      // Filter for shows that have ALL the requested themes
      shows = shows.filter(show => {
        // Make sure show has themes array
        if (!show.themes || !Array.isArray(show.themes) || show.themes.length === 0) {
          return false;
        }
        
        // Using 'every' means ALL filter themes must be present
        // Using 'some' inside means each filter theme needs to match at least one of the show's themes
        return filters.themes!.every(filterTheme => 
          show.themes!.some(showTheme => 
            // Case-insensitive comparison
            showTheme.toLowerCase() === filterTheme.toLowerCase()
          )
        );
      });
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
    return updatedShow;
  }

  async deleteTvShow(id: number): Promise<boolean> {
    const result = await db.delete(tvShows).where(eq(tvShows.id, id));
    return result.count > 0;
  }

  async getReviewsByTvShowId(tvShowId: number): Promise<TvShowReview[]> {
    // Use sql template to explicitly specify column names
    return await db.execute(sql`
      SELECT 
        id, 
        tv_show_id as "tvShowId", 
        user_name as "userName", 
        rating, 
        review, 
        created_at as "createdAt"
      FROM tv_show_reviews 
      WHERE tv_show_id = ${tvShowId}
    `);
  }

  async addReview(review: InsertTvShowReview): Promise<TvShowReview> {
    const now = new Date().toISOString();
    const [newReview] = await db
      .insert(tvShowReviews)
      .values({
        ...review,
        createdAt: now
      })
      .returning();
    return newReview;
  }

  async trackShowSearch(tvShowId: number): Promise<void> {
    const now = new Date().toISOString();
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
  }

  async trackShowView(tvShowId: number): Promise<void> {
    const now = new Date().toISOString();
    const [existingSearch] = await db
      .select()
      .from(tvShowSearches)
      .where(eq(tvShowSearches.tvShowId, tvShowId));

    if (existingSearch) {
      await db
        .update(tvShowSearches)
        .set({
          viewCount: existingSearch.viewCount + 1,
          lastViewed: now,
        })
        .where(eq(tvShowSearches.id, existingSearch.id));
    } else {
      await db.insert(tvShowSearches).values({
        tvShowId,
        searchCount: 0,
        viewCount: 1,
        lastViewed: now,
        lastSearched: now,
      });
    }
  }

  async getPopularShows(limit: number = 10): Promise<TvShow[]> {
    // Get the top viewed shows and join with the tvShows table
    const popularShows = await db
      .select({
        show: tvShows,
        totalViews: tvShowSearches.viewCount,
      })
      .from(tvShowSearches)
      .innerJoin(tvShows, eq(tvShowSearches.tvShowId, tvShows.id))
      .orderBy(desc(tvShowSearches.viewCount))
      .limit(limit);

    return popularShows.map((item) => item.show);
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