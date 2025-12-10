// server/lib/__tests__/config.test.ts - Config validation unit tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Store original env
const originalEnv = process.env;

describe('Config Validation', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    it('should fail when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('SUPABASE_URL')])
      );
    });

    it('should fail when SUPABASE_URL is invalid URL', async () => {
      process.env.SUPABASE_URL = 'not-a-url';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('SUPABASE_URL')])
      );
    });

    it('should fail when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('SUPABASE_SERVICE_ROLE_KEY')])
      );
    });

    it('should fail when SUPABASE_SERVICE_ROLE_KEY is too short', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'short';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('SUPABASE_SERVICE_ROLE_KEY')])
      );
    });

    it('should fail when JWT_SECRET is missing', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      delete process.env.JWT_SECRET;
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('JWT_SECRET')])
      );
    });

    it('should fail when JWT_SECRET is too short', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'short';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('JWT_SECRET')])
      );
    });

    it('should fail when ANTHROPIC_API_KEY is missing', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      delete process.env.ANTHROPIC_API_KEY;

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('ANTHROPIC_API_KEY')])
      );
    });

    it('should fail when ANTHROPIC_API_KEY has wrong prefix', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'wrong-prefix-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('ANTHROPIC_API_KEY')])
      );
    });

    it('should pass with all required variables valid', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.supabaseUrl).toBe('https://test.supabase.co');
      expect(result.config?.jwtSecret).toBe('a-very-long-jwt-secret-at-least-32-characters');
    });

    it('should collect all errors when multiple required vars are invalid', async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.JWT_SECRET;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.ANTHROPIC_API_KEY = 'wrong-prefix';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Optional Feature Groups', () => {
    beforeEach(() => {
      // Set all required vars
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
    });

    describe('PayPal Feature Group', () => {
      beforeEach(() => {
        // Clear all PayPal vars to ensure clean state
        delete process.env.PAYPAL_CLIENT_ID;
        delete process.env.PAYPAL_CLIENT_SECRET;
        delete process.env.PAYPAL_ENVIRONMENT;
        delete process.env.PAYPAL_WEBHOOK_ID;
        delete process.env.PAYPAL_PRO_MONTHLY_PLAN_ID;
        delete process.env.PAYPAL_PRO_YEARLY_PLAN_ID;
        delete process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID;
        delete process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID;
      });

      it('should warn when PayPal is partially configured', async () => {
        process.env.PAYPAL_CLIENT_ID = 'test-client-id';
        // Missing other PayPal vars

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.payment.enabled).toBe(false);
        expect(result.warnings).toBeDefined();
        expect(result.warnings).toEqual(
          expect.arrayContaining([expect.stringContaining('PayPal')])
        );
      });

      it('should enable PayPal when fully configured', async () => {
        process.env.PAYPAL_CLIENT_ID = 'test-client-id';
        process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
        process.env.PAYPAL_ENVIRONMENT = 'sandbox';
        process.env.PAYPAL_PRO_MONTHLY_PLAN_ID = 'P-test-monthly';
        process.env.PAYPAL_PRO_YEARLY_PLAN_ID = 'P-test-yearly';
        process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID = 'P-test-unlimited-monthly';
        process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID = 'P-test-unlimited-yearly';

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.payment.enabled).toBe(true);
        expect(result.config?.payment.clientId).toBe('test-client-id');
        expect(result.config?.payment.environment).toBe('sandbox');
        expect(result.config?.payment.planIds?.proMonthly).toBe('P-test-monthly');
      });

      it('should reject invalid PayPal environment', async () => {
        process.env.PAYPAL_CLIENT_ID = 'test-client-id';
        process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
        process.env.PAYPAL_ENVIRONMENT = 'invalid';
        process.env.PAYPAL_PRO_MONTHLY_PLAN_ID = 'P-test-monthly';
        process.env.PAYPAL_PRO_YEARLY_PLAN_ID = 'P-test-yearly';
        process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID = 'P-test-unlimited-monthly';
        process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID = 'P-test-unlimited-yearly';

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.payment.enabled).toBe(false); // Failed validation = disabled
      });

      it('should reject plan ID without P- prefix', async () => {
        process.env.PAYPAL_CLIENT_ID = 'test-client-id';
        process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
        process.env.PAYPAL_ENVIRONMENT = 'sandbox';
        process.env.PAYPAL_PRO_MONTHLY_PLAN_ID = 'invalid-plan'; // Missing P- prefix
        process.env.PAYPAL_PRO_YEARLY_PLAN_ID = 'P-test-yearly';
        process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID = 'P-test-unlimited-monthly';
        process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID = 'P-test-unlimited-yearly';

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.payment.enabled).toBe(false);
      });

      it('should include optional webhook ID when provided', async () => {
        process.env.PAYPAL_CLIENT_ID = 'test-client-id';
        process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
        process.env.PAYPAL_ENVIRONMENT = 'sandbox';
        process.env.PAYPAL_WEBHOOK_ID = 'webhook-123';
        process.env.PAYPAL_PRO_MONTHLY_PLAN_ID = 'P-test-monthly';
        process.env.PAYPAL_PRO_YEARLY_PLAN_ID = 'P-test-yearly';
        process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID = 'P-test-unlimited-monthly';
        process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID = 'P-test-unlimited-yearly';

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.config?.payment.enabled).toBe(true);
        expect(result.config?.payment.webhookId).toBe('webhook-123');
      });
    });

    describe('Email Feature Group', () => {
      it('should warn when Email is partially configured', async () => {
        process.env.GMAIL_USER = 'test@gmail.com';
        // Missing GMAIL_APP_PASSWORD

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.email.enabled).toBe(false);
        expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Email')]));
      });

      it('should enable Email when fully configured', async () => {
        process.env.GMAIL_USER = 'test@gmail.com';
        process.env.GMAIL_APP_PASSWORD = '1234567890123456'; // 16 chars

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.email.enabled).toBe(true);
        expect(result.config?.email.user).toBe('test@gmail.com');
      });

      it('should reject invalid email format', async () => {
        process.env.GMAIL_USER = 'not-an-email';
        process.env.GMAIL_APP_PASSWORD = '1234567890123456';

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.email.enabled).toBe(false);
      });

      it('should reject app password with wrong length', async () => {
        process.env.GMAIL_USER = 'test@gmail.com';
        process.env.GMAIL_APP_PASSWORD = 'short'; // Not 16 chars

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.email.enabled).toBe(false);
      });
    });

    describe('Redis Feature Group', () => {
      it('should warn when Redis is partially configured', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
        // Missing UPSTASH_REDIS_REST_TOKEN

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.redis.enabled).toBe(false);
        expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Redis')]));
      });

      it('should enable Redis when fully configured', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'token-123';

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.redis.enabled).toBe(true);
        expect(result.config?.redis.url).toBe('https://redis.upstash.io');
      });

      it('should reject non-HTTPS Redis URL', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'http://redis.upstash.io'; // HTTP not HTTPS
        process.env.UPSTASH_REDIS_REST_TOKEN = 'token-123';

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.redis.enabled).toBe(false);
      });

      it('should disable rate limiting without Redis', async () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.rateLimits.enabled).toBe(false);
      });

      it('should enable rate limiting with Redis', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'token-123';

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.config?.rateLimits.enabled).toBe(true);
      });
    });
  });

  describe('Default Values', () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
      // Clear NODE_ENV to test default behavior
      delete (process.env as Record<string, string | undefined>).NODE_ENV;
    });

    it('should use default values for optional variables', async () => {
      const { validateConfig } = await import('../config');
      const result = validateConfig();

      // NODE_ENV defaults to 'development' when not set
      expect(result.config?.nodeEnv).toBe('development');
      expect(result.config?.port).toBe(3000);
      expect(result.config?.domain).toBe('http://localhost:3000');
      expect(result.config?.rateLimits.auth).toBe(5);
      expect(result.config?.rateLimits.ai).toBe(10);
      expect(result.config?.rateLimits.write).toBe(30);
      expect(result.config?.rateLimits.global).toBe(100);
      expect(result.config?.features.costTracking).toBe(true);
      expect(result.config?.features.detailedLogging).toBe(true);
      expect(result.config?.features.emailNotifications).toBe(true);
    });

    it('should override defaults when env vars are set', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.PORT = '8080';
      process.env.DOMAIN = 'https://example.com';
      process.env.RATE_LIMIT_AUTH = '10';
      process.env.ENABLE_COST_TRACKING = 'false';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.config?.nodeEnv).toBe('production');
      expect(result.config?.port).toBe(8080);
      expect(result.config?.domain).toBe('https://example.com');
      expect(result.config?.rateLimits.auth).toBe(10);
      expect(result.config?.features.costTracking).toBe(false);
    });

    it('should handle string boolean conversion', async () => {
      process.env.ENABLE_COST_TRACKING = 'true';
      process.env.ENABLE_DETAILED_LOGGING = 'false';
      process.env.ENABLE_EMAIL_NOTIFICATIONS = '1';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.config?.features.costTracking).toBe(true);
      expect(result.config?.features.detailedLogging).toBe(false);
      expect(result.config?.features.emailNotifications).toBe(true);
    });

    it('should coerce numeric strings to numbers', async () => {
      process.env.PORT = '3001';
      process.env.RATE_LIMIT_AI = '20';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(typeof result.config?.port).toBe('number');
      expect(result.config?.port).toBe(3001);
      expect(result.config?.rateLimits.ai).toBe(20);
    });
  });

  describe('Singleton Pattern', () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
    });

    it('should return same config instance on multiple calls', async () => {
      const { getConfig, resetConfig } = await import('../config');
      resetConfig(); // Ensure clean state

      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toBe(config2);
    });

    it('should reset config when resetConfig is called', async () => {
      const { getConfig, resetConfig } = await import('../config');
      resetConfig();

      const config1 = getConfig();
      resetConfig();

      // Change env
      process.env.PORT = '9999';

      // Re-import to get fresh module
      vi.resetModules();
      const { getConfig: getConfig2, resetConfig: resetConfig2 } = await import('../config');
      resetConfig2();
      const config2 = getConfig2();

      // Should have new port value
      expect(config2.port).toBe(9999);
    });

    it('should throw on invalid config in getConfig', async () => {
      delete process.env.SUPABASE_URL;

      const { getConfig, resetConfig } = await import('../config');
      resetConfig();

      expect(() => getConfig()).toThrow('Invalid configuration');
    });

    it('should log warnings for partial configs', async () => {
      // Clear all PayPal vars first
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_SECRET;
      delete process.env.PAYPAL_ENVIRONMENT;
      delete process.env.PAYPAL_PRO_MONTHLY_PLAN_ID;
      delete process.env.PAYPAL_PRO_YEARLY_PLAN_ID;
      delete process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID;
      delete process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID;

      // Now set just one to trigger partial config warning
      process.env.PAYPAL_CLIENT_ID = 'test-id';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.resetModules();
      const { getConfig, resetConfig } = await import('../config');
      resetConfig();
      getConfig();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Config Warning]'));
      consoleSpy.mockRestore();
    });
  });

  describe('Security Considerations', () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
    });

    it('should not include secret values in error messages', async () => {
      process.env.JWT_SECRET = 'short'; // Invalid

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      // Error message should not contain the actual secret value
      expect(result.errors?.join('')).not.toContain('short');
      expect(result.errors?.join('')).toContain('JWT_SECRET');
    });

    it('should enforce minimum length for security-sensitive fields', async () => {
      // JWT_SECRET must be at least 32 chars
      process.env.JWT_SECRET = '12345678901234567890123456789012'; // Exactly 32

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(true);
    });
  });

  describe('Analytics Configuration', () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
    });

    it('should include GA_ID when provided', async () => {
      process.env.GA_ID = 'G-XXXXXXXXXX';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.config?.gaId).toBe('G-XXXXXXXXXX');
    });

    it('should include POSTHOG_KEY when provided', async () => {
      process.env.POSTHOG_KEY = 'phc_test123';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.config?.posthogKey).toBe('phc_test123');
    });
  });

  describe('Log Level Configuration', () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-characters';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
    });

    it('should accept valid log levels', async () => {
      const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

      for (const level of validLevels) {
        vi.resetModules();
        process.env.LOG_LEVEL = level;

        const { validateConfig } = await import('../config');
        const result = validateConfig();

        expect(result.success).toBe(true);
        expect(result.config?.logLevel).toBe(level);
      }
    });

    it('should handle invalid log level gracefully', async () => {
      process.env.LOG_LEVEL = 'invalid-level';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      // Optional field - should still succeed but without logLevel set
      expect(result.success).toBe(true);
      // Invalid values result in undefined for optional fields
    });
  });
});
