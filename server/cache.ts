/**
 * Simple in-memory cache implementation to optimize API responses 
 * for better SEO performance
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

/**
 * API Cache service for improving response times and reducing database load
 */
class ApiCache {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number; // Time to live in milliseconds

  constructor(defaultTTLSeconds: number = 60) {
    this.cache = new Map<string, CacheEntry>();
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  /**
   * Get data from cache if it exists and isn't expired
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    // Return null if not found
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set data in the cache with optional custom TTL
   */
  set(key: string, data: any, ttlSeconds?: number): void {
    const ttl = (ttlSeconds || this.defaultTTL / 1000) * 1000;
    
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
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
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(prefix));
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get statistics about cache usage
   */
  getStats(): { totalEntries: number, memoryUsageEstimate: string } {
    // Estimate memory usage - rough approximation
    let totalSize = 0;
    
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      // Key size
      totalSize += key.length * 2; // 2 bytes per character (UTF-16)
      
      // Value size (rough estimate)
      const jsonSize = JSON.stringify(entry.data).length * 2;
      totalSize += jsonSize + 16; // Add 16 bytes for expiresAt timestamp
    });
    
    // Convert to human-readable format
    const sizeInKB = totalSize / 1024;
    const sizeFormatted = sizeInKB < 1024 
      ? `${sizeInKB.toFixed(2)} KB` 
      : `${(sizeInKB / 1024).toFixed(2)} MB`;
    
    return {
      totalEntries: this.cache.size,
      memoryUsageEstimate: sizeFormatted
    };
  }
}

// Export singleton instance
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
      const req = args[0]; // First argument is typically the request
      
      // Generate cache key
      const key = typeof cacheKey === 'function' 
        ? cacheKey(req) 
        : cacheKey;
      
      // Try to get from cache
      const cachedData = apiCache.get(key);
      if (cachedData) {
        return cachedData;
      }
      
      // Cache miss, run original method
      const result = await originalMethod.apply(this, args);
      
      // Store in cache
      apiCache.set(key, result, ttlSeconds);
      
      return result;
    };
    
    return descriptor;
  };
}