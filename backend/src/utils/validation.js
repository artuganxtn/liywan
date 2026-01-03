/**
 * Request Validation Utilities
 * Provides common validation functions and sanitization
 */

import { validationResult } from 'express-validator';
import { sendError } from './response.js';

/**
 * Validate request using express-validator results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return sendError(
      res,
      'Validation failed',
      400,
      errorMessages
    );
  }

  next();
};

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Qatar format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone
 */
export const isValidPhone = (phone) => {
  // Qatar phone format: +974 followed by 8 digits
  const phoneRegex = /^\+974[0-9]{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Pagination helper
 * @param {Object} req - Express request object
 * @returns {Object} - Pagination options
 */
export const getPagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-createdAt';
  
  return { page, limit, skip, sort };
};

/**
 * Filter helper - extract filter parameters from query
 * @param {Object} req - Express request object
 * @param {Array} allowedFields - Allowed filter fields
 * @returns {Object} - Filter object
 */
export const getFilters = (req, allowedFields = []) => {
  const filters = {};
  
  allowedFields.forEach(field => {
    if (req.query[field] !== undefined) {
      filters[field] = req.query[field];
    }
  });
  
  return filters;
};

