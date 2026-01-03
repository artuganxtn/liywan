import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️ Sentry DSN not provided. Error tracking disabled.');
    return null;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Capture unhandled exceptions
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_DEV) {
        return null;
      }
      return event;
    },
  });

  console.log('✅ Sentry initialized successfully');
  return Sentry;
}

/**
 * Capture exception
 */
export function captureException(error, context = {}) {
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context.user) {
        scope.setUser(context.user);
      }
      if (context.tags) {
        scope.setTags(context.tags);
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }
      Sentry.captureException(error);
    });
  }
}

/**
 * Capture message
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context.user) {
        scope.setUser(context.user);
      }
      if (context.tags) {
        scope.setTags(context.tags);
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }
      Sentry.captureMessage(message, level);
    });
  }
}

/**
 * Set user context
 */
export function setUser(user) {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(user);
  }
}

/**
 * Set context
 */
export function setContext(name, context) {
  if (process.env.SENTRY_DSN) {
    Sentry.setContext(name, context);
  }
}

export default Sentry;


