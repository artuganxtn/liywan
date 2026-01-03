/**
 * Security Utilities
 * Input sanitization, XSS prevention, and security helpers
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters and patterns
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick=, onerror=, etc.)
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
}

/**
 * Sanitize HTML content (for rich text editors)
 * Uses DOMPurify-like approach - basic implementation
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.textContent = html; // This automatically escapes HTML
  return temp.innerHTML;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number (Qatar format: +974 or 974 or local)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Qatar phone format: +974, 974, or local (5-8 digits)
  const phoneRegex = /^(\+?974|0)?[1-9]\d{6,7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate URL
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Escape HTML entities
 */
export function escapeHTML(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate CSRF token (client-side, should match server)
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token from sessionStorage
 */
export function getCSRFToken(): string {
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem('csrf_token', token);
  }
  return token;
}

/**
 * Validate input length
 */
export function validateLength(input: string, min: number, max: number): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  const length = input.trim().length;
  return length >= min && length <= max;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value) as T[Extract<keyof T, string>];
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value) as T[Extract<keyof T, string>];
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string' ? sanitizeInput(item) : item
        ) as T[Extract<keyof T, string>];
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

/**
 * Rate limiting helper - tracks request counts
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * Get time until next request is allowed
   */
  getTimeUntilNext(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...requests);
    const timeUntilOldestExpires = this.windowMs - (Date.now() - oldestRequest);
    
    return Math.max(0, timeUntilOldestExpires);
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.requests.clear();
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(60000, 10); // 10 requests per minute

