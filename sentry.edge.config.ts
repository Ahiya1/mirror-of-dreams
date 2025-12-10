// sentry.edge.config.ts - Edge runtime Sentry configuration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  // 10% in production to reduce costs, 100% in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Only enable in environments with DSN configured
  enabled: !!process.env.SENTRY_DSN,
});
