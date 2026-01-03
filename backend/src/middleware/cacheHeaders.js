/**
 * Cache Headers Middleware
 * Sets appropriate cache headers for static assets and API responses
 */

export const cacheHeaders = (req, res, next) => {
  // Cache static assets for 1 year
  if (req.path.startsWith('/uploads/') || req.path.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }
  // Cache API responses for short period (5 minutes)
  else if (req.path.startsWith('/api/') && req.method === 'GET') {
    // Only cache GET requests
    res.setHeader('Cache-Control', 'private, max-age=300, must-revalidate');
  }
  // No cache for HTML and other dynamic content
  else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

