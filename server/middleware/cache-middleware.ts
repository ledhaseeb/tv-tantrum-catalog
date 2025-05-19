import { Request, Response, NextFunction } from 'express';

/**
 * Cache middleware for Express.js API endpoints
 * This improves SEO by reducing response times and server load
 */

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

// Configuration
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default cache lifetime

/**
 * Express middleware that caches API responses
 * 
 * @param ttl Time to live in milliseconds
 * @param paramName Optional route parameter name to include in cache key
 */
export function cacheMiddleware(ttl: number = DEFAULT_TTL, paramName?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a cache key from the URL and query parameters
    let cacheKey = req.originalUrl;
    
    // If paramName is provided, include that specific parameter in the cache key
    if (paramName && req.params[paramName]) {
      cacheKey = `${req.path}:${req.params[paramName]}`;
      
      // Also include query parameters in the cache key
      if (Object.keys(req.query).length > 0) {
        const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
        cacheKey += `?${queryString}`;
      }
    }

    // Check if we have cached data and it's not expired
    const cachedItem = cache.get(cacheKey);
    if (cachedItem && Date.now() - cachedItem.timestamp < ttl) {
      // Return cached response
      return res.json(cachedItem.data);
    }

    // Cache miss, capture the json method to store response
    const originalJson = res.json;
    res.json = function(data) {
      // Store in cache
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Call the original json method
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Utility to clear the entire cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Invalidate specific cache entries
 * @param pattern Pattern to match against cache keys
 */
export function invalidateCache(pattern: string | RegExp) {
  const keysToInvalidate = Array.from(cache.keys())
    .filter(key => {
      if (pattern instanceof RegExp) {
        return pattern.test(key);
      }
      return key.includes(pattern);
    });
    
  keysToInvalidate.forEach(key => cache.delete(key));
}

/**
 * Get stats about the cache
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}