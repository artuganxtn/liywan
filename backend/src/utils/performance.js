/**
 * Performance Monitoring Utilities
 * Track and log performance metrics
 */
import logger from './logger.js';

/**
 * Performance monitor middleware
 * Tracks request processing time
 */
export const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  // Set header before response is sent
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds
    
    // Add performance header before sending response
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.url} took ${duration.toFixed(2)}ms`, {
        duration: `${duration.toFixed(2)}ms`,
        url: req.url,
        method: req.method,
        statusCode: res.statusCode,
      });
    }
    
    return originalSend.call(this, data);
  };
  
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests (> 1 second) - only log, don't set headers (already set in send override)
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.url} took ${duration.toFixed(2)}ms`, {
        duration: `${duration.toFixed(2)}ms`,
        url: req.url,
        method: req.method,
        statusCode: res.statusCode,
      });
    }
  });
  
  next();
};

/**
 * Measure function execution time
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for logging
 * @returns {Function} - Wrapped function
 */
export const measureTime = (fn, label = 'Function') => {
  return async (...args) => {
    const startTime = process.hrtime.bigint();
    try {
      const result = await fn(...args);
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      logger.debug(`${label} executed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      logger.error(`${label} failed after ${duration.toFixed(2)}ms`, { error: error.message });
      throw error;
    }
  };
};

