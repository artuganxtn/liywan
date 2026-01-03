import { captureException } from './sentry.js';
import logger from './logger.js';
import { sendError } from './response.js';

/**
 * Enhanced error handler with better error categorization
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Enhanced error logging
  const errorContext = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
  };

  logger.error(`Error: ${err.message}`, errorContext);
  
  // Send to Sentry
  if (process.env.SENTRY_DSN) {
    captureException(err, {
      tags: { 
        route: req.path, 
        method: req.method,
        statusCode: error.statusCode || 500,
      },
      extra: errorContext,
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = { message, statusCode: 409 }; // 409 Conflict
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
    }));
    return sendError(res, 'Validation failed', 400, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token expired', statusCode: 401 };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Don't expose internal errors in production
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = errorContext;
  }

  // Include request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  return res.status(statusCode).json(errorResponse);
};

