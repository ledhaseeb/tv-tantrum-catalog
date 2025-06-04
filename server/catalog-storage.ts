import { Pool } from 'pg';
import { TvShow, Theme, Platform, ResearchSummary, User } from '@shared/catalog-schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export class CatalogStorage {
  /**
   * Get all TV shows with filtering capabilities
   */
  async getTvShows(filters: {
    ageGroup?: string;
    stimulationScoreRange?: {min: number, max: number};
    themes?: string[];
    themeMatchMode?: 'AND' | 'OR';
    search?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<TvShow[]> {
    const client = await pool.connect();
    try {
      let query = `
        SELECT DISTINCT ts.* 
        FROM catalog_tv_shows ts
      `;
      
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;
      
      // Theme filtering with junction table support
      if (filters.themes && filters.themes.length > 0) {
        if (filters.themeMatchMode === 'AND') {
          // For AND logic, show must have ALL specified themes
          query += `
            WHERE ts.id IN (
              SELECT tv_show_id 
              FROM catalog_tv_show_themes tst
              JOIN catalog_themes t ON tst.theme_id = t.id
              WHERE t.name = ANY($${paramIndex})
              GROUP BY tv_show_id
              HAVING COUNT(DISTINCT t.name) = $${paramIndex + 1}
            )
          `;
          queryParams.push(filters.themes, filters.themes.length);
          paramIndex += 2;
        } else {
          // For OR logic, show must have ANY of the specified themes
          query += `
            LEFT JOIN catalog_tv_show_themes tst ON ts.id = tst.tv_show_id
            LEFT JOIN catalog_themes t ON tst.theme_id = t.id
          `;
          whereConditions.push(`(t.name = ANY($${paramIndex}) OR ts.themes && $${paramIndex})`);
          queryParams.push(filters.themes);
          paramIndex++;
        }
      }
      
      // Age group filtering - simplified to avoid parsing errors
      if (filters.ageGroup) {
        whereConditions.push(`ts.age_range = $${paramIndex}`);
        queryParams.push(filters.ageGroup);
        paramIndex++;
      }
      
      // Stimulation score range filtering
      if (filters.stimulationScoreRange) {
        whereConditions.push(`ts.stimulation_score BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        queryParams.push(filters.stimulationScoreRange.min, filters.stimulationScoreRange.max);
        paramIndex += 2;
      }
      
      // Search filtering
      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        whereConditions.push(`(
          LOWER(ts.name) LIKE $${paramIndex} OR 
          LOWER(ts.description) LIKE $${paramIndex} OR
          LOWER(ts.creator) LIKE $${paramIndex}
        )`);
        queryParams.push(searchTerm);
        paramIndex++;
      }
      
      // Add WHERE clause if we have conditions
      if (whereConditions.length > 0) {
        const whereClause = whereConditions.join(' AND ');
        if (query.includes('WHERE')) {
          query += ` AND ${whereClause}`;
        } else {
          query += ` WHERE ${whereClause}`;
        }
      }
      
      // Sorting
      let orderBy = 'ts.name ASC';
      switch (filters.sortBy) {
        case 'stimulation-score':
          orderBy = 'ts.stimulation_score ASC, ts.name ASC';
          break;
        case 'name':
          orderBy = 'ts.name ASC';
          break;
        case 'popular':
          orderBy = 'ts.is_featured DESC, ts.name ASC';
          break;
        case 'release-year':
          orderBy = 'ts.release_year DESC NULLS LAST, ts.name ASC';
          break;
        default:
          orderBy = 'ts.name ASC';
      }
      
      query += ` ORDER BY ${orderBy}`;
      
      // Pagination
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        queryParams.push(filters.limit);
        paramIndex++;
        
        if (filters.offset) {
          query += ` OFFSET $${paramIndex}`;
          queryParams.push(filters.offset);
          paramIndex++;
        }
      }
      
      const result = await client.query(query, queryParams);
      return result.rows;
    } finally {
      client.release();
    }
  }
  

  
  /**
   * Get featured show
   */
  async getFeaturedShow(): Promise<TvShow | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_tv_shows WHERE is_featured = true LIMIT 1'
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get popular shows
   */
  async getPopularShows(limit: number = 10): Promise<TvShow[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM catalog_tv_shows 
        ORDER BY is_featured DESC, stimulation_score ASC, name ASC 
        LIMIT $1
      `, [limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Search shows by name
   */
  async searchShows(searchTerm: string, limit: number = 20): Promise<TvShow[]> {
    const client = await pool.connect();
    try {
      const search = `%${searchTerm.toLowerCase()}%`;
      const result = await client.query(`
        SELECT *, 
          CASE 
            WHEN LOWER(name) = LOWER($2) THEN 1
            WHEN LOWER(name) LIKE LOWER($2 || '%') THEN 2
            WHEN LOWER(name) LIKE LOWER('%' || $2 || '%') THEN 3
            WHEN LOWER(description) LIKE $1 THEN 4
            ELSE 5
          END as search_rank
        FROM catalog_tv_shows 
        WHERE LOWER(name) LIKE $1 
           OR LOWER(description) LIKE $1 
           OR LOWER(creator) LIKE $1
        ORDER BY search_rank, name ASC
        LIMIT $3
      `, [search, searchTerm, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }
  


  /**
   * Get all themes
   */
  async getThemes(): Promise<Theme[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM catalog_themes ORDER BY name');
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get all platforms
   */
  async getPlatforms(): Promise<Platform[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM catalog_platforms ORDER BY name');
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get research summaries
   */
  async getResearchSummaries(category?: string, limit?: number): Promise<ResearchSummary[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM catalog_research_summaries';
      let params: any[] = [];
      
      if (category) {
        query += ' WHERE category = $1';
        params.push(category);
      }
      
      query += ' ORDER BY created_at DESC';
      
      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);
      }
      
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get research summary by ID
   */
  async getResearchSummaryById(id: number): Promise<ResearchSummary | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_research_summaries WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Admin functions - Create/Update/Delete TV shows
   */
  async createTvShow(show: Omit<TvShow, 'id'>): Promise<TvShow> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO catalog_tv_shows (
          name, description, age_range, episode_length, creator, release_year,
          end_year, is_ongoing, seasons, stimulation_score, interactivity_level,
          dialogue_intensity, sound_effects_level, music_tempo, total_music_level,
          total_sound_effect_time_level, scene_frequency, creativity_rating,
          available_on, themes, animation_style, image_url, is_featured,
          subscriber_count, video_count, channel_id, is_youtube_channel,
          published_at, has_omdb_data, has_youtube_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
        ) RETURNING *
      `, [
        show.name, show.description, show.ageRange, show.episodeLength,
        show.creator, show.releaseYear, show.endYear, show.isOngoing,
        show.seasons, show.stimulationScore, show.interactivityLevel,
        show.dialogueIntensity, show.soundEffectsLevel, show.musicTempo,
        show.totalMusicLevel, show.totalSoundEffectTimeLevel, show.sceneFrequency,
        show.creativityRating, show.availableOn, show.themes, show.animationStyle,
        show.imageUrl, show.isFeatured, show.subscriberCount, show.videoCount,
        show.channelId, show.isYouTubeChannel, show.publishedAt, show.hasOmdbData,
        show.hasYoutubeData
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  /**
   * Update TV show
   */
  async updateTvShow(id: number, updates: Partial<TvShow>): Promise<TvShow | null> {
    const client = await pool.connect();
    try {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      
      if (fields.length === 0) return null;
      
      const setClause = fields.map((field, index) => {
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        return `${dbField} = $${index + 1}`;
      }).join(', ');
      
      const result = await client.query(`
        UPDATE catalog_tv_shows 
        SET ${setClause}
        WHERE id = $${fields.length + 1}
        RETURNING *
      `, [...values, id]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get similar shows based on themes and age range
   */
  async getSimilarShows(showId: number, limit: number = 6): Promise<TvShow[]> {
    const client = await pool.connect();
    try {
      // First get the target show to find similar shows
      const targetShowResult = await client.query(
        'SELECT * FROM catalog_tv_shows WHERE id = $1',
        [showId]
      );
      
      if (targetShowResult.rows.length === 0) {
        return [];
      }
      
      const targetShow = targetShowResult.rows[0];
      
      // Find shows with similar themes and age range
      const result = await client.query(`
        SELECT DISTINCT ts.*, 
          CASE 
            WHEN ts.age_range = $2 THEN 3
            WHEN ts.stimulation_score = $3 THEN 2
            ELSE 1
          END as similarity_score
        FROM catalog_tv_shows ts
        WHERE ts.id != $1
          AND (
            ts.themes && $4::text[] OR
            ts.age_range = $2 OR
            ts.stimulation_score = $3
          )
        ORDER BY similarity_score DESC, ts.name
        LIMIT $5
      `, [showId, targetShow.age_range, targetShow.stimulation_score, targetShow.themes || [], limit]);
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Delete TV show
   */
  async deleteTvShow(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM catalog_tv_shows WHERE id = $1',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }
  
  /**
   * Admin authentication check
   */
  async getAdminUser(email: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_users WHERE email = $1 AND is_admin = true',
        [email]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
}

export const catalogStorage = new CatalogStorage();