/**
 * Initialize all monitoring services
 * Call this in your main entry point (index.tsx)
 */
import { initErrorTracking, initAnalytics, initPerformanceMonitoring } from '../services/monitoring';

export function setupMonitoring() {
  // Initialize error tracking
  const errorTracker = initErrorTracking();
  if (errorTracker) {
    console.log('[Monitoring] Error tracking initialized');
  }

  // Initialize analytics
  const analytics = initAnalytics();
  if (analytics) {
    console.log('[Monitoring] Analytics initialized');
    
    // Track page view on load
    analytics.page(window.location.pathname);
  }

  // Initialize performance monitoring
  initPerformanceMonitoring();
  console.log('[Monitoring] Performance monitoring initialized');

  // Track errors globally
  window.addEventListener('error', (event) => {
    if (errorTracker) {
      errorTracker.captureException(event.error || new Error(event.message), {
        tags: { source: 'global' },
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    }
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (errorTracker) {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      errorTracker.captureException(error, {
        tags: { source: 'unhandledRejection' },
      });
    }
  });

  return {
    errorTracker,
    analytics,
  };
}

