/**
 * Cache Middleware
 * Caches GET request responses
 */
import cache from '../utils/cache.js';

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Function} - Express middleware
 */
export const cacheMiddleware = (ttl = 5 * 60 * 1000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `cache:${req.originalUrl || req.url}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = function(data) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for specific key pattern
 * @param {string} pattern - Key pattern to clear
 */
export const clearCache = (pattern) => {
  // This is a simple implementation
  // For production, use Redis with pattern matching
  cache.clear();
};

