/**
 * Enhanced Error Handling Utilities
 * Provides structured error types and handling for the application
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: any;
  timestamp: Date;
  userMessage?: string;
}

export class ApiError extends Error {
  type: ErrorType;
  code?: string | number;
  details?: any;
  userMessage?: string;
  statusCode?: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string | number,
    details?: any,
    userMessage?: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.userMessage = userMessage || message;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toAppError(): AppError {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: new Date(),
      userMessage: this.userMessage,
    };
  }
}

/**
 * Parse axios error and convert to ApiError
 */
export function parseApiError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // Network errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new ApiError(
        'Request timeout. Please check your connection and try again.',
        ErrorType.NETWORK,
        'TIMEOUT',
        error,
        'Connection timeout. Please try again.'
      );
    }
    if (error.message?.includes('Network Error')) {
      return new ApiError(
        'Network error. Please check your internet connection.',
        ErrorType.NETWORK,
        'NETWORK_ERROR',
        error,
        'Unable to connect to the server. Please check your internet connection.'
      );
    }
    return new ApiError(
      'Network error occurred',
      ErrorType.NETWORK,
      'NETWORK_ERROR',
      error,
      'Network error. Please try again.'
    );
  }

  const status = error.response?.status;
  const data = error.response?.data;
  const message = data?.error || data?.message || error.message || 'An error occurred';

  // Map HTTP status codes to error types
  switch (status) {
    case 400:
      return new ApiError(
        message,
        ErrorType.VALIDATION,
        data?.code || 'VALIDATION_ERROR',
        data,
        data?.userMessage || 'Please check your input and try again.',
        status
      );
    case 401:
      return new ApiError(
        message,
        ErrorType.AUTHENTICATION,
        'UNAUTHORIZED',
        data,
        'Your session has expired. Please log in again.',
        status
      );
    case 403:
      return new ApiError(
        message,
        ErrorType.AUTHORIZATION,
        'FORBIDDEN',
        data,
        'You do not have permission to perform this action.',
        status
      );
    case 404:
      return new ApiError(
        message,
        ErrorType.NOT_FOUND,
        'NOT_FOUND',
        data,
        'The requested resource was not found.',
        status
      );
    case 429:
      return new ApiError(
        message || 'Too many requests',
        ErrorType.CLIENT,
        'RATE_LIMIT',
        data,
        'Too many requests. Please wait a moment and try again.',
        status
      );
    case 500:
    case 502:
    case 503:
    case 504:
      return new ApiError(
        message || 'Server error',
        ErrorType.SERVER,
        'SERVER_ERROR',
        data,
        'Server error. Our team has been notified. Please try again later.',
        status
      );
    default:
      return new ApiError(
        message,
        ErrorType.UNKNOWN,
        status?.toString() || 'UNKNOWN',
        data,
        'An unexpected error occurred. Please try again.',
        status
      );
  }
}

/**
 * Log error to console and external service (if configured)
 */
export function logError(error: AppError | Error, context?: string) {
  const errorData = error instanceof ApiError 
    ? error.toAppError() 
    : {
        type: ErrorType.UNKNOWN,
        message: error.message,
        timestamp: new Date(),
        details: { stack: (error as Error).stack },
      };

  console.error(`[Error${context ? ` - ${context}` : ''}]`, errorData);

  // Send to error tracking service (Sentry, etc.)
  if (window.errorTracker) {
    window.errorTracker.captureException(error, {
      tags: { errorType: errorData.type },
      extra: { context, ...errorData.details },
    });
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError | Error | any): string {
  if (error instanceof ApiError) {
    return error.userMessage || error.message;
  }
  if (error?.userMessage) {
    return error.userMessage;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

// Extend Window interface for error tracker
declare global {
  interface Window {
    errorTracker?: {
      captureException: (error: Error, options?: any) => void;
      captureMessage: (message: string, level?: string) => void;
    };
  }
}

