/**
 * CSRF Protection Middleware
 * Handles CSRF token validation and management
 */

import { getCSRFToken, generateCSRFToken } from '../utils/security';

/**
 * Get CSRF token for API requests
 */
export function getCSRFHeader(): Record<string, string> {
  const token = getCSRFToken();
  return {
    'X-CSRF-Token': token,
  };
}

/**
 * Validate CSRF token (for backend integration)
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = sessionStorage.getItem('csrf_token');
  return token === storedToken;
}

/**
 * Refresh CSRF token
 */
export function refreshCSRFToken(): string {
  const newToken = generateCSRFToken();
  sessionStorage.setItem('csrf_token', newToken);
  return newToken;
}

