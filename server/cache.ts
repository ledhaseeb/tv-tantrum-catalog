import Redis from 'ioredis';

// Redis cache implementation for scalability
class CacheManager {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
        console.log('Redis cache connected');
      } else {
        console.log('No Redis URL found, using memory cache fallback');
      }
    } catch (error) {
      console.error('Redis connection failed, falling back to memory cache:', error);
    }
  }

  async get(key: string): Promise<any> {
    try {
      if (this.redis) {
        const result = await this.redis.get(key);
        return result ? JSON.parse(result) : null;
      } else {
        // Memory cache fallback
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.data;
        }
        this.memoryCache.delete(key);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Memory cache fallback
        this.memoryCache.set(key, {
          data: value,
          expires: Date.now() + (ttlSeconds * 1000)
        });
        
        // Cleanup expired entries periodically
        if (this.memoryCache.size > 1000) {
          this.cleanupMemoryCache();
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushall();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Generate cache keys for different data types
  static keys = {
    tvShows: (filters?: any) => `tv_shows:${JSON.stringify(filters || {})}`,
    tvShow: (id: number) => `tv_show:${id}`,
    homepageCategories: () => 'homepage_categories',
    categoryShows: (id: number) => `category_shows:${id}`,
    themes: () => 'themes',
    platforms: () => 'platforms',
    searchResults: (query: string, filters?: any) => `search:${query}:${JSON.stringify(filters || {})}`,
    similarShows: (id: number, limit?: number) => `similar_shows:${id}:${limit || 6}`,
    research: (category?: string, limit?: number) => `research:${category || 'all'}:${limit || 20}`
  };
}

export const cache = new CacheManager();
export default cache;