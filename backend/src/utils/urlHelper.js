/**
 * URL Helper Utility
 * Properly constructs URLs when behind a reverse proxy (Nginx)
 */

/**
 * Get the base URL for file uploads
 * Handles reverse proxy scenarios where req.protocol and req.host might be incorrect
 */
export function getBaseUrl(req) {
  // Check if we have an explicit base URL in environment variables (for production)
  // This is the most reliable way in production
  if (process.env.BASE_URL) {
    const baseUrl = process.env.BASE_URL.endsWith('/') 
      ? process.env.BASE_URL.slice(0, -1) 
      : process.env.BASE_URL;
    return baseUrl;
  }

  // Check if we have FRONTEND_URL (can use as base)
  if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.endsWith('/')
      ? process.env.FRONTEND_URL.slice(0, -1)
      : process.env.FRONTEND_URL;
    return frontendUrl;
  }

  // In production with reverse proxy, use X-Forwarded-* headers
  // These headers are set by Nginx when proxying
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || req.hostname;

  // Ensure protocol is https in production (force HTTPS)
  const finalProtocol = process.env.NODE_ENV === 'production' ? 'https' : protocol;

  return `${finalProtocol}://${host}`;
}

/**
 * Construct full URL for uploaded file
 */
export function getFileUrl(req, filename) {
  if (!filename) return null;
  
  const baseUrl = getBaseUrl(req);
  // Ensure filename doesn't start with /
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  
  return `${baseUrl}/uploads/${cleanFilename}`;
}

/**
 * Construct relative path for uploaded file (for API responses)
 */
export function getRelativeFileUrl(filename) {
  if (!filename) return null;
  const cleanFilename = filename.startsWith('/') ? filename : filename;
  return `/uploads/${cleanFilename}`;
}

