import logger from './logger.js';

/**
 * Enhanced async handler with error logging
 * Wraps async route handlers to catch errors and pass to error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    // Log error details for debugging
    logger.error('Async handler error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
    });
    
    // Pass to error handler
    next(error);
  });
};

