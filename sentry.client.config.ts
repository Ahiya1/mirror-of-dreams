// sentry.client.config.ts - Client-side Sentry configuration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring - sampling
  // 10% in production to reduce costs, 100% in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay (disabled for smaller bundle)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Error filtering - ignore common non-bugs
  ignoreErrors: [
    // ResizeObserver loop errors (benign browser behavior)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors (user connectivity issues)
    /^Network request failed$/,
    /^Load failed$/,
    // Chunk load errors (user navigation or network issues)
    /^ChunkLoadError/,
    // Cancelled requests (user navigation)
    /^AbortError/,
  ],

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (set by Vercel)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Limit breadcrumbs to reduce noise
  maxBreadcrumbs: 50,

  // Only enable in environments with DSN configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
