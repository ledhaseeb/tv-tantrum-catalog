/**
 * Simple in-memory cache implementation to optimize API responses 
 * for better SEO performance
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number; // Time to live in milliseconds

  constructor(defaultTTLSeconds: number = 60) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  /**
   * Get data from cache if it exists and isn't expired
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    // If no entry exists or it's expired
    if (!entry || entry.expiresAt < Date.now()) {
      if (entry) {
        // Clean up expired entry
        this.cache.delete(key);
      }
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set data in the cache with optional custom TTL
   */
  set(key: string, data: any, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, {
      data,
      expiresAt
    });
  }

  /**
   * Remove an item from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entries that match a prefix
   */
  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get statistics about cache usage
   */
  getStats(): { totalEntries: number, memoryUsageEstimate: string } {
    const totalEntries = this.cache.size;
    
    // Rough memory usage estimate
    let memoryUsage = 0;
    for (const [key, value] of this.cache.entries()) {
      // Key size
      memoryUsage += key.length * 2; // UTF-16 characters
      
      // Value size (rough estimate)
      try {
        const jsonStr = JSON.stringify(value.data);
        memoryUsage += jsonStr.length;
      } catch (e) {
        // If not serializable, use a conservative estimate
        memoryUsage += 1000;
      }
      
      // Entry overhead (approx)
      memoryUsage += 50;
    }
    
    // Convert to human-readable format
    const memoryUsageEstimate = memoryUsage < 1024 
      ? `${memoryUsage} bytes` 
      : memoryUsage < 1024 * 1024 
        ? `${(memoryUsage / 1024).toFixed(2)} KB` 
        : `${(memoryUsage / (1024 * 1024)).toFixed(2)} MB`;
    
    return { totalEntries, memoryUsageEstimate };
  }
}

// Create a singleton instance
export const apiCache = new ApiCache();

/**
 * Cache decorator for async API handlers
 * @param cacheKey The cache key or a function to generate it from the request
 * @param ttlSeconds Time to live in seconds
 */
export function withCache(
  cacheKey: string | ((req: any) => string), 
  ttlSeconds?: number
) {
  return function(
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      // First argument is expected to be the request
      const req = args[0];
      const key = typeof cacheKey === 'function' ? cacheKey(req) : cacheKey;
      
      // Check cache first
      const cachedData = apiCache.get(key);
      if (cachedData !== null) {
        console.log(`Cache hit for ${key}`);
        return cachedData;
      }
      
      // Not in cache, call original method
      console.log(`Cache miss for ${key}`);
      const result = await originalMethod.apply(this, args);
      
      // Store in cache
      apiCache.set(key, result, ttlSeconds);
      
      return result;
    };
    
    return descriptor;
  };
}