/**
 * Monitoring and Analytics Service
 * Handles error tracking, analytics, and performance monitoring
 */

// Error Tracking Interface
interface ErrorTracker {
  captureException: (error: Error, options?: any) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: { id: string; email?: string; name?: string }) => void;
  setContext: (context: Record<string, any>) => void;
}

// Analytics Interface
interface Analytics {
  track: (event: string, properties?: Record<string, any>) => void;
  page: (path: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
}

/**
 * Initialize error tracking (Sentry-compatible interface)
 */
export function initErrorTracking(dsn?: string): ErrorTracker | null {
  const envDsn = import.meta.env?.VITE_SENTRY_DSN as string | undefined;
  if (!dsn && !envDsn) {
    console.warn('[Monitoring] Error tracking DSN not provided. Error tracking disabled.');
    return null;
  }

  const sentryDsn = dsn || envDsn;

  // Try to use actual Sentry SDK if available
  let Sentry: any = null;
  try {
    Sentry = require('@sentry/react');
    if (Sentry && Sentry.init) {
      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE || 'development',
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
        beforeSend(event: any) {
          // Don't send events in development unless explicitly enabled
          if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_ENABLE_DEV) {
            return null;
          }
          return event;
        },
      });
      console.log('[Monitoring] Sentry initialized successfully');
    }
  } catch (e) {
    console.warn('[Monitoring] Sentry SDK not available, using fallback');
  }

  const tracker: ErrorTracker = {
    captureException: (error: Error, options?: any) => {
      if (Sentry && Sentry.captureException) {
        // Use real Sentry if available
        Sentry.withScope((scope: any) => {
          if (options?.tags) {
            scope.setTags(options.tags);
          }
          if (options?.extra) {
            scope.setExtras(options.extra);
          }
          if (options?.user) {
            scope.setUser(options.user);
          }
          Sentry.captureException(error);
        });
      } else {
        // Fallback: send to backend
        console.error('[Error Tracker]', error, options);
        if (import.meta.env.MODE === 'production' && sentryDsn) {
          fetch('/api/logs/error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
              },
              tags: options?.tags,
              extra: options?.extra,
              timestamp: new Date().toISOString(),
            }),
          }).catch(() => {
            // Silently fail if logging endpoint is unavailable
          });
        }
      }
    },
    captureMessage: (message: string, level: string = 'info') => {
      if (Sentry && Sentry.captureMessage) {
        Sentry.captureMessage(message, level);
      } else {
        console.log(`[Error Tracker - ${level}]`, message);
      }
    },
    setUser: (user: { id: string; email?: string; name?: string }) => {
      if (Sentry && Sentry.setUser) {
        Sentry.setUser(user);
      } else {
        console.log('[Error Tracker] Set user:', user);
      }
    },
    setContext: (context: Record<string, any>) => {
      if (Sentry && Sentry.setContext) {
        Sentry.setContext('custom', context);
      } else {
        console.log('[Error Tracker] Set context:', context);
      }
    },
  };

  // Attach to window for global access
  window.errorTracker = tracker;

  return tracker;
}

/**
 * Initialize analytics (Google Analytics compatible)
 */
export function initAnalytics(trackingId?: string): Analytics | null {
  const envGaId = import.meta.env?.VITE_GA_TRACKING_ID as string | undefined;
  const gaId = trackingId || envGaId;

  if (!gaId) {
    console.warn('[Monitoring] Analytics tracking ID not provided. Analytics disabled.');
    return null;
  }

  // Load Google Analytics script
  if (typeof window !== 'undefined' && !window.gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId, {
      page_path: window.location.pathname,
    });
  }

  const analytics: Analytics = {
    track: (event: string, properties?: Record<string, any>) => {
      if (window.gtag) {
        window.gtag('event', event, properties);
      }
      console.log('[Analytics] Track:', event, properties);
    },
    page: (path: string, properties?: Record<string, any>) => {
      if (window.gtag) {
        window.gtag('config', gaId, {
          page_path: path,
          ...properties,
        });
      }
      console.log('[Analytics] Page:', path, properties);
    },
    identify: (userId: string, traits?: Record<string, any>) => {
      if (window.gtag) {
        window.gtag('set', { user_id: userId, ...traits });
      }
      console.log('[Analytics] Identify:', userId, traits);
    },
  };

  window.analytics = analytics;

  return analytics;
}

/**
 * Performance Monitoring - Web Vitals
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') {
    return;
  }

  // Measure Core Web Vitals - use dynamic import with error handling
  // This prevents blocking if web-vitals fails to load
  const loadWebVitals = async () => {
    try {
      const webVitals = await import('web-vitals');
      
      // Only use metrics that are available (onFID was deprecated in v3+)
      if (webVitals.onCLS) {
        webVitals.onCLS((metric) => {
          console.log('[Performance] CLS:', metric);
          sendPerformanceMetric('CLS', metric.value);
        });
      }

      // onFID was deprecated, use onINP instead
      if (webVitals.onINP) {
        webVitals.onINP((metric) => {
          console.log('[Performance] INP:', metric);
          sendPerformanceMetric('INP', metric.value);
        });
      }

      if (webVitals.onFCP) {
        webVitals.onFCP((metric) => {
          console.log('[Performance] FCP:', metric);
          sendPerformanceMetric('FCP', metric.value);
        });
      }

      if (webVitals.onLCP) {
        webVitals.onLCP((metric) => {
          console.log('[Performance] LCP:', metric);
          sendPerformanceMetric('LCP', metric.value);
        });
      }

      if (webVitals.onTTFB) {
        webVitals.onTTFB((metric) => {
          console.log('[Performance] TTFB:', metric);
          sendPerformanceMetric('TTFB', metric.value);
        });
      }
    } catch (error) {
      console.warn('[Monitoring] Web Vitals not available:', error);
      // Silently fail - performance monitoring is non-critical
    }
  };

  // Load after a short delay to avoid blocking initial page load
  setTimeout(() => {
    loadWebVitals();
  }, 1000);

  // Custom performance metrics
  if ('performance' in window && 'PerformanceObserver' in window) {
    // Monitor long tasks
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[Performance] Long task detected:', entry);
            sendPerformanceMetric('LONG_TASK', entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task observer not supported
    }

    // Monitor resource loading
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
          if (entry.duration > 3000) {
            console.warn('[Performance] Slow resource:', entry.name, entry.duration);
            sendPerformanceMetric('SLOW_RESOURCE', entry.duration, {
              resource: entry.name,
              type: entry.initiatorType,
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Resource observer not supported
    }
  }
}

/**
 * Send performance metric to backend
 */
function sendPerformanceMetric(metric: string, value: number, extra?: Record<string, any>) {
  if (import.meta.env.MODE === 'production') {
    fetch('/api/metrics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric,
        value,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...extra,
      }),
    }).catch(() => {
      // Silently fail
    });
  }

  // Send to analytics
  if (window.analytics) {
    window.analytics.track('performance_metric', {
      metric,
      value,
      ...extra,
    });
  }
}

// Extend Window interface
declare global {
  interface Window {
    errorTracker?: ErrorTracker;
    analytics?: Analytics;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

