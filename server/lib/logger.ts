// server/lib/logger.ts - Pino structured logging configuration

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Root logger with structured JSON output in production
 * and pretty printing in development
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Pretty print in development for better readability
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },

  // Base context included in all logs
  base: {
    env: process.env.NODE_ENV,
  },

  // Standard error serializer
  serializers: {
    err: pino.stdSerializers.err,
  },
});

// =====================================================
// SERVICE-SPECIFIC CHILD LOGGERS
// =====================================================

/** Logger for AI/Anthropic API operations */
export const aiLogger = logger.child({ service: 'anthropic' });

/** Logger for database/Supabase operations */
export const dbLogger = logger.child({ service: 'supabase' });

/** Logger for authentication operations */
export const authLogger = logger.child({ service: 'auth' });

/** Logger for payment/PayPal operations */
export const paymentLogger = logger.child({ service: 'paypal' });

/** Logger for email/SMTP operations */
export const emailLogger = logger.child({ service: 'email' });
