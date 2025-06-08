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
    ageRange?: {min: number, max: number};
    stimulationScoreRange?: {min: number, max: number};
    themes?: string[];
    themeMatchMode?: 'AND' | 'OR';
    search?: string;
    sortBy?: string;
    tantrumFactor?: string;
    interactionLevel?: string;
    dialogueIntensity?: string;
    soundFrequency?: string;
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
      
      // Theme filtering using array column
      if (filters.themes && filters.themes.length > 0) {
        // Default to AND mode if no explicit mode is provided
        const matchMode = filters.themeMatchMode || 'AND';
        console.log('Theme filtering mode:', { 
          provided: filters.themeMatchMode, 
          used: matchMode, 
          themes: filters.themes 
        });
        
        if (matchMode === 'AND') {
          // For AND logic, show must have ALL specified themes
          // Use @> operator to check if themes array contains all specified themes
          whereConditions.push(`ts.themes @> $${paramIndex}`);
          queryParams.push(filters.themes);
          paramIndex++;
          console.log('Using AND logic with @> operator');
        } else {
          // For OR logic, show must have ANY of the specified themes  
          whereConditions.push(`ts.themes && $${paramIndex}`);
          queryParams.push(filters.themes);
          paramIndex++;
          console.log('Using OR logic with && operator');
        }
      }
      
      // Age group filtering - simplified to avoid parsing errors
      if (filters.ageGroup) {
        whereConditions.push(`ts.age_range = $${paramIndex}`);
        queryParams.push(filters.ageGroup);
        paramIndex++;
      }
      
      // Age range filtering - more flexible age matching
      if (filters.ageRange) {
        // Extract numeric ages from age_range field (e.g., "2-5" -> min:2, max:5)
        whereConditions.push(`
          (
            CASE 
              WHEN ts.age_range ~ '^[0-9]+-[0-9]+$' THEN
                CAST(split_part(ts.age_range, '-', 1) AS INTEGER) <= $${paramIndex + 1} AND
                CAST(split_part(ts.age_range, '-', 2) AS INTEGER) >= $${paramIndex}
              ELSE false
            END
          )
        `);
        queryParams.push(filters.ageRange.min, filters.ageRange.max);
        paramIndex += 2;
      }
      
      // Stimulation score range filtering
      if (filters.stimulationScoreRange) {
        whereConditions.push(`ts.stimulation_score BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        queryParams.push(filters.stimulationScoreRange.min, filters.stimulationScoreRange.max);
        paramIndex += 2;
      }
      
      // Sensory filters
      if (filters.tantrumFactor) {
        // Map tantrumFactor to stimulation_score for backward compatibility
        const scoreMap: {[key: string]: number} = {
          'low': 1,
          'low-medium': 2,
          'medium': 3,
          'medium-high': 4,
          'high': 5
        };
        const score = scoreMap[filters.tantrumFactor.toLowerCase()];
        if (score) {
          whereConditions.push(`ts.stimulation_score = $${paramIndex}`);
          queryParams.push(score);
          paramIndex++;
        }
      }
      
      if (filters.interactionLevel) {
        whereConditions.push(`ts.interactivity_level = $${paramIndex}`);
        queryParams.push(filters.interactionLevel);
        paramIndex++;
      }
      
      if (filters.dialogueIntensity) {
        whereConditions.push(`ts.dialogue_intensity = $${paramIndex}`);
        queryParams.push(filters.dialogueIntensity);
        paramIndex++;
      }
      
      if (filters.soundFrequency) {
        whereConditions.push(`ts.sound_frequency = $${paramIndex}`);
        queryParams.push(filters.soundFrequency);
        paramIndex++;
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
   * Get a single TV show by ID
   */
  async getTvShowById(id: number): Promise<TvShow | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_tv_shows WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
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
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
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
      const row = result.rows[0];
      if (!row) return null;
      
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
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

  /**
   * Get all users (admin function)
   */
  async getAllUsers(): Promise<User[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM catalog_users ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get all research summaries (admin function)
   */
  async getAllResearchSummaries(): Promise<ResearchSummary[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_research_summaries ORDER BY created_at DESC'
      );
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get research summary by ID (admin function)
   */
  async getResearchSummary(id: number): Promise<ResearchSummary | null> {
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
   * Create research summary (admin function)
   */
  async createResearchSummary(data: any): Promise<ResearchSummary> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO catalog_research_summaries (
          title, category, source, published_date, original_url, image_url,
          headline, sub_headline, summary, key_findings, full_text,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        ) RETURNING *
      `, [
        data.title, data.category, data.source, data.publishedDate, data.originalStudyUrl, data.imageUrl,
        data.headline, data.subHeadline, data.summary, data.keyFindings, data.fullText
      ]);
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update research summary (admin function)
   */
  async updateResearchSummary(id: number, data: any): Promise<ResearchSummary | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        UPDATE catalog_research_summaries 
        SET title = $2, category = $3, source = $4, published_date = $5,
            original_url = $6, image_url = $7, headline = $8, sub_headline = $9,
            summary = $10, key_findings = $11, full_text = $12, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [
        id, data.title, data.category, data.source, data.publishedDate,
        data.originalStudyUrl, data.imageUrl, data.headline, data.subHeadline,
        data.summary, data.keyFindings, data.fullText
      ]);
      const row = result.rows[0];
      if (!row) return null;
      
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * Delete research summary (admin function)
   */
  async deleteResearchSummary(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM catalog_research_summaries WHERE id = $1',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }
}

export const catalogStorage = new CatalogStorage();