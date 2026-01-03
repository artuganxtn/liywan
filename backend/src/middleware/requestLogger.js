/**
 * Enhanced Request Logging Middleware
 * Logs all incoming requests with detailed information
 */
import logger from '../utils/logger.js';
import { sanitizeObject } from '../utils/validation.js';

/**
 * Request logger middleware
 * Logs request details for monitoring and debugging
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Generate request ID for tracking
  req.id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log request
  logger.http(`[${req.id}] ${req.method} ${req.url}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
    query: Object.keys(req.query).length > 0 ? sanitizeObject(req.query) : undefined,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel](`[${req.id}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
    });
  });

  next();
};

