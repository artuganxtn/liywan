/**
 * API Configuration Utility
 * Provides consistent API base URL across the application
 */

/**
 * Get the API base URL based on environment
 * SIMPLE: Always use relative path in browser (production), localhost only in dev server
 */
export function getApiBaseUrl(): string {
  // In browser environment (production or development build), always use relative path
  // This works because Nginx proxies /api to backend in production
  // In local development, if using Vite dev server, you'd typically proxy /api as well
  if (typeof window !== 'undefined') {
    return '/api';
  }
  
  // Only reach here during SSR or build-time
  // During build, Vite replaces import.meta.env values
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    return '/api';
  }
  
  // Development: check for explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;
    // Only use if it's a valid dev URL
    if (apiUrl && (apiUrl.includes('localhost') || apiUrl.startsWith('http://localhost'))) {
      return apiUrl;
    }
  }
  
  // Development fallback: use localhost (only for Node.js/SSR environments)
  return 'http://localhost:8000/api';
}

/**
 * Get full API URL for a given endpoint
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash from endpoint if present (baseUrl already has it)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
}

