// server/lib/__tests__/logger.test.ts - Tests for Pino structured logging
// Tests logger configuration, child loggers, and service tags

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the actual logger module - we'll test its real behavior
import { aiLogger, authLogger, dbLogger, emailLogger, logger, paymentLogger } from '../logger';

describe('Logger Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------
  // Logger Exports
  // -------------------------------------------------

  describe('logger exports', () => {
    it('exports base logger', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('exports aiLogger', () => {
      expect(aiLogger).toBeDefined();
      expect(typeof aiLogger.info).toBe('function');
      expect(typeof aiLogger.error).toBe('function');
    });

    it('exports dbLogger', () => {
      expect(dbLogger).toBeDefined();
      expect(typeof dbLogger.info).toBe('function');
      expect(typeof dbLogger.error).toBe('function');
    });

    it('exports authLogger', () => {
      expect(authLogger).toBeDefined();
      expect(typeof authLogger.info).toBe('function');
      expect(typeof authLogger.error).toBe('function');
    });

    it('exports paymentLogger', () => {
      expect(paymentLogger).toBeDefined();
      expect(typeof paymentLogger.info).toBe('function');
      expect(typeof paymentLogger.error).toBe('function');
    });

    it('exports emailLogger', () => {
      expect(emailLogger).toBeDefined();
      expect(typeof emailLogger.info).toBe('function');
      expect(typeof emailLogger.error).toBe('function');
    });
  });

  // -------------------------------------------------
  // Child Logger Service Tags
  // -------------------------------------------------

  describe('child logger service tags', () => {
    it('aiLogger has correct service context', () => {
      // pino child loggers have bindings() method that returns the child context
      const bindings = aiLogger.bindings();
      expect(bindings).toHaveProperty('service', 'anthropic');
    });

    it('dbLogger has correct service context', () => {
      const bindings = dbLogger.bindings();
      expect(bindings).toHaveProperty('service', 'supabase');
    });

    it('authLogger has correct service context', () => {
      const bindings = authLogger.bindings();
      expect(bindings).toHaveProperty('service', 'auth');
    });

    it('paymentLogger has correct service context', () => {
      const bindings = paymentLogger.bindings();
      expect(bindings).toHaveProperty('service', 'paypal');
    });

    it('emailLogger has correct service context', () => {
      const bindings = emailLogger.bindings();
      expect(bindings).toHaveProperty('service', 'email');
    });
  });

  // -------------------------------------------------
  // Log Levels
  // -------------------------------------------------

  describe('log levels', () => {
    it('logger has debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('logger has info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('logger has warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('logger has error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('logger has trace method', () => {
      expect(typeof logger.trace).toBe('function');
    });

    it('logger has fatal method', () => {
      expect(typeof logger.fatal).toBe('function');
    });
  });

  // -------------------------------------------------
  // Child Logger Methods
  // -------------------------------------------------

  describe('child logger methods', () => {
    it('aiLogger has all log level methods', () => {
      expect(typeof aiLogger.debug).toBe('function');
      expect(typeof aiLogger.info).toBe('function');
      expect(typeof aiLogger.warn).toBe('function');
      expect(typeof aiLogger.error).toBe('function');
    });

    it('dbLogger has all log level methods', () => {
      expect(typeof dbLogger.debug).toBe('function');
      expect(typeof dbLogger.info).toBe('function');
      expect(typeof dbLogger.warn).toBe('function');
      expect(typeof dbLogger.error).toBe('function');
    });

    it('authLogger has all log level methods', () => {
      expect(typeof authLogger.debug).toBe('function');
      expect(typeof authLogger.info).toBe('function');
      expect(typeof authLogger.warn).toBe('function');
      expect(typeof authLogger.error).toBe('function');
    });
  });

  // -------------------------------------------------
  // Logger Child Creation
  // -------------------------------------------------

  describe('logger child creation', () => {
    it('base logger can create child loggers', () => {
      expect(typeof logger.child).toBe('function');
    });

    it('created child logger has bindings method', () => {
      const childLogger = logger.child({ service: 'test' });
      expect(typeof childLogger.bindings).toBe('function');
    });

    it('created child logger includes parent bindings', () => {
      const childLogger = logger.child({ service: 'test-service' });
      const bindings = childLogger.bindings();
      expect(bindings).toHaveProperty('service', 'test-service');
    });
  });
});

// =====================================================
// Integration Pattern Tests
// =====================================================

describe('Integration Patterns', () => {
  describe('error logging pattern', () => {
    it('logs errors with structured context without throwing', () => {
      const error = new Error('Database connection failed');
      const context = {
        err: error,
        operation: 'dreams.fetch',
        userId: 'user-123',
        dreamId: 'dream-456',
      };

      // Test that the method can be called with structured context
      expect(() => {
        dbLogger.error(context, 'Failed to fetch dream');
      }).not.toThrow();
    });

    it('logs errors with Error instance', () => {
      const error = new Error('Test error');
      expect(() => {
        dbLogger.error({ err: error }, 'An error occurred');
      }).not.toThrow();
    });
  });

  describe('retry logging pattern', () => {
    it('logs retry attempts with context without throwing', () => {
      const context = {
        attempt: 2,
        maxRetries: 3,
        delay: 2000,
        error: 'Rate limited',
      };

      expect(() => {
        aiLogger.warn(context, 'Retrying AI call');
      }).not.toThrow();
    });
  });

  describe('successful operation logging pattern', () => {
    it('logs successful operations with context without throwing', () => {
      const context = {
        operation: 'reflection.create',
        userId: 'user-123',
        dreamId: 'dream-456',
        tokensUsed: 1500,
      };

      expect(() => {
        aiLogger.info(context, 'Reflection created successfully');
      }).not.toThrow();
    });
  });

  describe('logger level property', () => {
    it('base logger has level property', () => {
      expect(logger.level).toBeDefined();
      expect(typeof logger.level).toBe('string');
    });

    it('child loggers inherit level from parent', () => {
      expect(aiLogger.level).toBeDefined();
      expect(dbLogger.level).toBeDefined();
    });
  });

  describe('base bindings', () => {
    it('base logger has base bindings with env', () => {
      // The base logger should include env in its bindings
      const bindings = logger.bindings();
      expect(bindings).toHaveProperty('env');
    });
  });
});
