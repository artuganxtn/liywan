/**
 * 404 Not Found Middleware
 * Handles requests to non-existent routes
 */
import { sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

export const notFound = (req, res, next) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  return sendError(
    res,
    `Route ${req.method} ${req.url} not found`,
    404
  );
};

