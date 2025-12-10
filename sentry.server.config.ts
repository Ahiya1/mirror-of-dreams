// sentry.server.config.ts - Server-side Sentry configuration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  // 10% in production to reduce costs, 100% in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (set by Vercel)
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Server-specific settings - more breadcrumbs for debugging
  maxBreadcrumbs: 100,

  // Only enable in environments with DSN configured
  enabled: !!process.env.SENTRY_DSN,
});
