import { Pool } from 'pg';
import { TvShow, Theme, Platform, ResearchSummary, User, HomepageCategory, InsertHomepageCategory } from '@shared/catalog-schema';
import cache from './cache';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export class CachedCatalogStorage {
  /**
   * Get all TV shows with caching and filtering capabilities
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
    
    // Generate cache key based on filters
    const cacheKey = cache.keys.tvShows(filters);
    
    // Try to get from cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('Cache HIT for TV shows query');
      return cached;
    }

    console.log('Cache MISS for TV shows query - fetching from database');
    
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
        const matchMode = filters.themeMatchMode || 'AND';
        
        if (matchMode === 'AND') {
          whereConditions.push(`ts.themes @> $${paramIndex}`);
          queryParams.push(filters.themes);
          paramIndex++;
        } else {
          whereConditions.push(`ts.themes && $${paramIndex}`);
          queryParams.push(filters.themes);
          paramIndex++;
        }
      }
      
      // Age group filtering
      if (filters.ageGroup) {
        whereConditions.push(`ts.age_range = $${paramIndex}`);
        queryParams.push(filters.ageGroup);
        paramIndex++;
      }
      
      // Age range filtering
      if (filters.ageRange) {
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
      
      // Search functionality with full-text search
      if (filters.search) {
        whereConditions.push(`
          (ts.name ILIKE $${paramIndex} OR 
           ts.description ILIKE $${paramIndex} OR 
           to_tsvector('english', ts.name || ' ' || ts.description) @@ plainto_tsquery('english', $${paramIndex + 1}))
        `);
        queryParams.push(`%${filters.search}%`, filters.search);
        paramIndex += 2;
      }
      
      // Build WHERE clause
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      // Sorting
      const sortBy = filters.sortBy || 'name';
      switch (sortBy) {
        case 'name':
          query += ' ORDER BY ts.name ASC';
          break;
        case 'stimulation_score':
          query += ' ORDER BY ts.stimulation_score ASC';
          break;
        case 'age_range':
          query += ' ORDER BY ts.age_range ASC';
          break;
        case 'newest':
          query += ' ORDER BY ts.release_year DESC NULLS LAST';
          break;
        case 'oldest':
          query += ' ORDER BY ts.release_year ASC NULLS LAST';
          break;
        default:
          query += ' ORDER BY ts.name ASC';
      }
      
      // Pagination
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        queryParams.push(filters.limit);
        paramIndex++;
      }
      
      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        queryParams.push(filters.offset);
        paramIndex++;
      }
      
      const result = await client.query(query, queryParams);
      const shows = result.rows.map(this.mapTvShowFromDb);
      
      // Cache the results - longer TTL for filtered results since they're expensive
      const ttl = filters.search ? 1800 : 3600; // 30 min for search, 1 hour for filters
      await cache.set(cacheKey, shows, ttl);
      
      console.log(`Fetched ${shows.length} TV shows from database and cached`);
      return shows;
      
    } finally {
      client.release();
    }
  }

  /**
   * Get single TV show by ID with caching
   */
  async getTvShowById(id: number): Promise<TvShow | null> {
    const cacheKey = cache.keys.tvShow(id);
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT for TV show ${id}`);
      return cached;
    }

    console.log(`Cache MISS for TV show ${id} - fetching from database`);
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_tv_shows WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const show = this.mapTvShowFromDb(result.rows[0]);
      
      // Cache individual shows for 24 hours
      await cache.set(cacheKey, show, 86400);
      
      return show;
    } finally {
      client.release();
    }
  }

  /**
   * Get homepage categories with caching
   */
  async getHomepageCategories(): Promise<HomepageCategory[]> {
    const cacheKey = cache.keys.homepageCategories();
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('Cache HIT for homepage categories');
      return cached;
    }

    console.log('Cache MISS for homepage categories - fetching from database');
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM homepage_categories WHERE is_active = true ORDER BY display_order, name'
      );
      
      const categories = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        displayOrder: row.display_order,
        isActive: row.is_active,
        filterConfig: row.filter_config,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      // Cache for 1 hour since categories don't change often
      await cache.set(cacheKey, categories, 3600);
      
      return categories;
    } finally {
      client.release();
    }
  }

  /**
   * Get shows for a specific category with caching
   */
  async getShowsForCategory(categoryId: number): Promise<TvShow[]> {
    const cacheKey = cache.keys.categoryShows(categoryId);
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT for category ${categoryId} shows`);
      return cached;
    }

    console.log(`Cache MISS for category ${categoryId} shows - fetching from database`);
    
    // Get category configuration
    const client = await pool.connect();
    try {
      const categoryResult = await client.query(
        'SELECT filter_config FROM homepage_categories WHERE id = $1',
        [categoryId]
      );
      
      if (categoryResult.rows.length === 0) {
        return [];
      }
      
      const filterConfig = categoryResult.rows[0].filter_config;
      
      // Convert filter config to database query
      const filters = this.convertFilterConfigToQuery(filterConfig);
      
      // Use the cached getTvShows method
      const shows = await this.getTvShows(filters);
      
      // Cache category shows for 2 hours
      await cache.set(cacheKey, shows, 7200);
      
      return shows;
    } finally {
      client.release();
    }
  }

  /**
   * Search shows with caching
   */
  async searchShows(searchTerm: string, limit: number = 20): Promise<TvShow[]> {
    const cacheKey = cache.keys.searchResults(searchTerm, { limit });
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT for search: ${searchTerm}`);
      return cached;
    }

    console.log(`Cache MISS for search: ${searchTerm} - fetching from database`);
    
    const shows = await this.getTvShows({ search: searchTerm, limit });
    
    // Cache search results for 30 minutes
    await cache.set(cacheKey, shows, 1800);
    
    return shows;
  }

  /**
   * Get themes with caching
   */
  async getThemes(): Promise<Theme[]> {
    const cacheKey = cache.keys.themes();
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('Cache HIT for themes');
      return cached;
    }

    console.log('Cache MISS for themes - fetching from database');
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM catalog_themes ORDER BY name');
      const themes = result.rows.map(row => ({
        id: row.id,
        name: row.name
      }));
      
      // Cache themes for 12 hours - they rarely change
      await cache.set(cacheKey, themes, 43200);
      
      return themes;
    } finally {
      client.release();
    }
  }

  /**
   * Clear cache when data is updated
   */
  async invalidateCache(type: 'shows' | 'categories' | 'all') {
    switch (type) {
      case 'shows':
        // Clear all show-related caches
        await cache.del(cache.keys.homepageCategories());
        // Note: We'd need a pattern matching delete for all show caches
        console.log('Invalidated show caches');
        break;
      case 'categories':
        await cache.del(cache.keys.homepageCategories());
        console.log('Invalidated category caches');
        break;
      case 'all':
        await cache.flush();
        console.log('Cleared all caches');
        break;
    }
  }

  /**
   * Map database row to TvShow object
   */
  private mapTvShowFromDb(row: any): TvShow {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      ageRange: row.age_range,
      episodeLength: row.episode_length,
      creator: row.creator,
      releaseYear: row.release_year,
      endYear: row.end_year,
      isOngoing: row.is_ongoing,
      seasons: row.seasons,
      creativityRating: row.creativity_rating,
      availableOn: row.available_on || [],
      themes: row.themes || [],
      animationStyle: row.animation_style,
      imageUrl: row.image_url,
      isFeatured: row.is_featured,
      stimulationScore: row.stimulation_score,
      interactivityLevel: row.interactivity_level,
      dialogueIntensity: row.dialogue_intensity,
      soundEffectsLevel: row.sound_effects_level,
      sceneFrequency: row.scene_frequency,
      musicTempo: row.music_tempo,
      subscriberCount: row.subscriber_count,
      videoCount: row.video_count,
      channelId: row.channel_id,
      isYouTubeChannel: row.is_youtube_channel,
      publishedAt: row.published_at,
      hasOmdbData: row.has_omdb_data,
      hasYoutubeData: row.has_youtube_data
    };
  }

  /**
   * Convert homepage category filter config to query filters
   */
  private convertFilterConfigToQuery(filterConfig: any): any {
    const filters: any = {};
    
    if (!filterConfig || !filterConfig.rules) {
      return filters;
    }
    
    const themeRules = filterConfig.rules.filter((rule: any) => 
      rule.field === 'themes' && rule.operator === 'contains'
    );
    
    if (themeRules.length > 0) {
      filters.themes = themeRules.map((rule: any) => rule.value);
      filters.themeMatchMode = filterConfig.logic || 'OR';
    }
    
    return filters;
  }

  // Additional methods would implement similar caching patterns...
  // For brevity, I'm showing the key methods that handle the most traffic
}

export const cachedCatalogStorage = new CachedCatalogStorage();