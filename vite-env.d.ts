/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_GA_TRACKING_ID?: string;
  readonly MODE: 'development' | 'production' | 'test';
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Window interface for monitoring services
declare global {
  interface Window {
    errorTracker?: {
      captureException: (error: Error, options?: any) => void;
      captureMessage: (message: string, level?: string) => void;
      setUser: (user: { id: string; email?: string; name?: string }) => void;
      setContext: (context: Record<string, any>) => void;
    };
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

