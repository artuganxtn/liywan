/**
 * Request Sanitization Middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */
import { sanitizeObject } from '../utils/validation.js';

/**
 * Sanitize request body, query, and params
 */
export const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

