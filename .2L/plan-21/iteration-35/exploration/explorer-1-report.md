# Explorer 1 Report: Config Validation & JWT Expiry

## Executive Summary

This report provides comprehensive analysis for implementing centralized configuration validation at startup and JWT expiry enforcement. The codebase currently has 35+ environment variables scattered across multiple files with inconsistent validation. JWT tokens include `exp` claims but the `context.ts` file does not explicitly verify expiry - it relies on `jwt.verify()` which does check expiry but errors are caught silently.

## Discoveries

### Environment Variables Inventory

Based on analysis of `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.env.example` and grep results across the codebase:

#### Required Variables (Critical - Application Will Not Function)

| Variable | Type | Used In | Validation Notes |
|----------|------|---------|------------------|
| `SUPABASE_URL` | URL string | `server/lib/supabase.ts` | Must be valid URL, currently has placeholder fallback |
| `SUPABASE_SERVICE_ROLE_KEY` | string | `server/lib/supabase.ts` | Service role key, min 20 chars |
| `JWT_SECRET` | string | `server/trpc/context.ts`, `server/trpc/routers/auth.ts`, `app/api/clarify/stream/route.ts` | Min 32 characters for security |
| `ANTHROPIC_API_KEY` | string | Multiple AI routers | Starts with `sk-ant-` |

#### Required for Features (Graceful Degradation Possible)

| Variable | Type | Used In | Validation Notes |
|----------|------|---------|------------------|
| `PAYPAL_CLIENT_ID` | string | `server/lib/paypal.ts` | Required for payments |
| `PAYPAL_CLIENT_SECRET` | string | `server/lib/paypal.ts` | Required for payments |
| `PAYPAL_ENVIRONMENT` | enum | `server/lib/paypal.ts` | Must be `sandbox` or `live` |
| `PAYPAL_WEBHOOK_ID` | string | `server/lib/paypal.ts` | Optional, webhook verification |
| `PAYPAL_PRO_MONTHLY_PLAN_ID` | string | `server/lib/paypal.ts` | PayPal plan ID format |
| `PAYPAL_PRO_YEARLY_PLAN_ID` | string | `server/lib/paypal.ts` | PayPal plan ID format |
| `PAYPAL_UNLIMITED_MONTHLY_PLAN_ID` | string | `server/lib/paypal.ts` | PayPal plan ID format |
| `PAYPAL_UNLIMITED_YEARLY_PLAN_ID` | string | `server/lib/paypal.ts` | PayPal plan ID format |
| `GMAIL_USER` | email | `server/lib/email.ts` | Valid email format |
| `GMAIL_APP_PASSWORD` | string | `server/lib/email.ts` | 16-char app password |
| `UPSTASH_REDIS_REST_URL` | URL | `server/lib/rate-limiter.ts` | Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | string | `server/lib/rate-limiter.ts` | Redis token |
| `DOMAIN` | URL | `server/lib/paypal.ts`, `server/lib/email.ts` | Application domain |

#### Optional Variables

| Variable | Type | Default | Used In |
|----------|------|---------|---------|
| `NODE_ENV` | enum | `development` | Multiple files |
| `PORT` | number | `3000` | Application config |
| `LOG_LEVEL` | enum | `info`/`debug` | `server/lib/logger.ts` |
| `CRON_SECRET` | string | - | `app/api/cron/consolidate-patterns/route.ts` |
| `CREATOR_SECRET_KEY` | string | - | `server/trpc/routers/admin.ts` |
| `ADMIN_KEY` | string | - | Admin operations |
| `GA_ID` | string | - | Analytics |
| `POSTHOG_KEY` | string | - | Analytics |
| `ENABLE_COST_TRACKING` | boolean | `true` | Feature flag |
| `ENABLE_DETAILED_LOGGING` | boolean | `true` | Feature flag |
| `ENABLE_EMAIL_NOTIFICATIONS` | boolean | `true` | Feature flag |
| `RATE_LIMIT_AUTH` | number | `5` | Rate limiting |
| `RATE_LIMIT_AI` | number | `10` | Rate limiting |
| `RATE_LIMIT_WRITE` | number | `30` | Rate limiting |
| `RATE_LIMIT_GLOBAL` | number | `100` | Rate limiting |
| `RATE_LIMIT_ENABLED` | boolean | `true` | Rate limiting toggle |

### Current JWT Handling Analysis

**File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts`**

Current implementation (lines 30-72):
```typescript
if (token) {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);  // Line 33
    const payload = decoded as JWTPayload;
    
    // ... database fetch and user processing ...
  } catch (e) {
    // Invalid token or database error
    authLogger.error({ err: e, operation: 'context.create' }, 'Context creation error');
    user = null;  // Line 71
  }
}
```

**Issues Identified:**
1. **Silent expiry handling**: The `jwt.verify()` function DOES check expiry and throws `TokenExpiredError`, but the catch block treats ALL errors the same way - logging and setting user to null
2. **No explicit expiry check**: The code does not distinguish between:
   - `TokenExpiredError` (token legitimately expired)
   - `JsonWebTokenError` (malformed/invalid token)
   - `NotBeforeError` (token not yet valid)
3. **Logging lacks context**: Error log does not indicate WHY the token was invalid

**File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`**

JWT creation (lines 87-98 for signup, 210-221 for signin):
```typescript
const JWT_EXPIRY_DAYS = 30;  // Line 32

const payload: JWTPayload = {
  userId: newUser.id,
  email: newUser.email,
  tier: newUser.tier,
  isCreator: newUser.is_creator || false,
  isAdmin: newUser.is_admin || false,
  isDemo: newUser.is_demo || false,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * JWT_EXPIRY_DAYS,  // 30 days
};
```

**JWTPayload Type** (from `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts` lines 67-76):
```typescript
export interface JWTPayload {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  isCreator: boolean;
  isAdmin: boolean;
  isDemo?: boolean;
  iat: number;
  exp: number;
}
```

## File Structure for Config Validation

### Proposed: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/config.ts`

```typescript
// server/lib/config.ts - Centralized configuration with Zod validation

import { z } from 'zod';

// =====================================================
// SCHEMA DEFINITIONS
// =====================================================

const requiredEnvSchema = z.object({
  // Database
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY too short'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  
  // AI
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', 'ANTHROPIC_API_KEY must start with sk-ant-'),
});

const paymentEnvSchema = z.object({
  PAYPAL_CLIENT_ID: z.string().min(1),
  PAYPAL_CLIENT_SECRET: z.string().min(1),
  PAYPAL_ENVIRONMENT: z.enum(['sandbox', 'live']),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_PRO_MONTHLY_PLAN_ID: z.string().startsWith('P-'),
  PAYPAL_PRO_YEARLY_PLAN_ID: z.string().startsWith('P-'),
  PAYPAL_UNLIMITED_MONTHLY_PLAN_ID: z.string().startsWith('P-'),
  PAYPAL_UNLIMITED_YEARLY_PLAN_ID: z.string().startsWith('P-'),
});

const emailEnvSchema = z.object({
  GMAIL_USER: z.string().email('GMAIL_USER must be a valid email'),
  GMAIL_APP_PASSWORD: z.string().length(16, 'GMAIL_APP_PASSWORD must be 16 characters'),
});

const redisEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url().startsWith('https://'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

const optionalEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DOMAIN: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional(),
  
  // Security
  CRON_SECRET: z.string().optional(),
  CREATOR_SECRET_KEY: z.string().optional(),
  ADMIN_KEY: z.string().optional(),
  
  // Analytics
  GA_ID: z.string().optional(),
  POSTHOG_KEY: z.string().optional(),
  
  // Feature flags
  ENABLE_COST_TRACKING: z.coerce.boolean().default(true),
  ENABLE_DETAILED_LOGGING: z.coerce.boolean().default(true),
  ENABLE_EMAIL_NOTIFICATIONS: z.coerce.boolean().default(true),
  
  // Rate limiting
  RATE_LIMIT_AUTH: z.coerce.number().default(5),
  RATE_LIMIT_AI: z.coerce.number().default(10),
  RATE_LIMIT_WRITE: z.coerce.number().default(30),
  RATE_LIMIT_GLOBAL: z.coerce.number().default(100),
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
});

// =====================================================
// VALIDATION FUNCTION
// =====================================================

export interface ConfigValidationResult {
  success: boolean;
  config?: ValidatedConfig;
  errors?: string[];
  warnings?: string[];
}

export interface ValidatedConfig {
  // Required
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  jwtSecret: string;
  anthropicApiKey: string;
  
  // Optional features
  payment: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    environment?: 'sandbox' | 'live';
    webhookId?: string;
    planIds?: {
      proMonthly: string;
      proYearly: string;
      unlimitedMonthly: string;
      unlimitedYearly: string;
    };
  };
  
  email: {
    enabled: boolean;
    user?: string;
    password?: string;
  };
  
  redis: {
    enabled: boolean;
    url?: string;
    token?: string;
  };
  
  // Application
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  domain: string;
  logLevel?: string;
  
  // Security
  cronSecret?: string;
  creatorSecretKey?: string;
  adminKey?: string;
  
  // Features
  features: {
    costTracking: boolean;
    detailedLogging: boolean;
    emailNotifications: boolean;
  };
  
  // Rate limits
  rateLimits: {
    enabled: boolean;
    auth: number;
    ai: number;
    write: number;
    global: number;
  };
}

export function validateConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Validate required variables
  const requiredResult = requiredEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  });
  
  if (!requiredResult.success) {
    requiredResult.error.issues.forEach(issue => {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    });
  }
  
  // Early exit if required vars missing
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  // 2. Validate optional feature groups
  const paymentResult = paymentEnvSchema.safeParse({
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT,
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
    PAYPAL_PRO_MONTHLY_PLAN_ID: process.env.PAYPAL_PRO_MONTHLY_PLAN_ID,
    PAYPAL_PRO_YEARLY_PLAN_ID: process.env.PAYPAL_PRO_YEARLY_PLAN_ID,
    PAYPAL_UNLIMITED_MONTHLY_PLAN_ID: process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID,
    PAYPAL_UNLIMITED_YEARLY_PLAN_ID: process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID,
  });
  
  const paymentEnabled = paymentResult.success;
  if (!paymentEnabled && process.env.PAYPAL_CLIENT_ID) {
    warnings.push('PayPal partially configured - payments will be disabled');
  }
  
  const emailResult = emailEnvSchema.safeParse({
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  });
  
  const emailEnabled = emailResult.success;
  if (!emailEnabled && process.env.GMAIL_USER) {
    warnings.push('Email partially configured - email features will be disabled');
  }
  
  const redisResult = redisEnvSchema.safeParse({
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  
  const redisEnabled = redisResult.success;
  if (!redisEnabled && process.env.UPSTASH_REDIS_REST_URL) {
    warnings.push('Redis partially configured - rate limiting will be disabled');
  }
  
  // 3. Parse optional variables
  const optionalResult = optionalEnvSchema.safeParse(process.env);
  const optional = optionalResult.success ? optionalResult.data : optionalEnvSchema.parse({});
  
  // 4. Build validated config
  const config: ValidatedConfig = {
    supabaseUrl: requiredResult.data!.SUPABASE_URL,
    supabaseServiceRoleKey: requiredResult.data!.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: requiredResult.data!.JWT_SECRET,
    anthropicApiKey: requiredResult.data!.ANTHROPIC_API_KEY,
    
    payment: {
      enabled: paymentEnabled,
      ...(paymentEnabled && paymentResult.data ? {
        clientId: paymentResult.data.PAYPAL_CLIENT_ID,
        clientSecret: paymentResult.data.PAYPAL_CLIENT_SECRET,
        environment: paymentResult.data.PAYPAL_ENVIRONMENT,
        webhookId: paymentResult.data.PAYPAL_WEBHOOK_ID,
        planIds: {
          proMonthly: paymentResult.data.PAYPAL_PRO_MONTHLY_PLAN_ID,
          proYearly: paymentResult.data.PAYPAL_PRO_YEARLY_PLAN_ID,
          unlimitedMonthly: paymentResult.data.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID,
          unlimitedYearly: paymentResult.data.PAYPAL_UNLIMITED_YEARLY_PLAN_ID,
        },
      } : {}),
    },
    
    email: {
      enabled: emailEnabled,
      ...(emailEnabled && emailResult.data ? {
        user: emailResult.data.GMAIL_USER,
        password: emailResult.data.GMAIL_APP_PASSWORD,
      } : {}),
    },
    
    redis: {
      enabled: redisEnabled,
      ...(redisEnabled && redisResult.data ? {
        url: redisResult.data.UPSTASH_REDIS_REST_URL,
        token: redisResult.data.UPSTASH_REDIS_REST_TOKEN,
      } : {}),
    },
    
    nodeEnv: optional.NODE_ENV,
    port: optional.PORT,
    domain: optional.DOMAIN,
    logLevel: optional.LOG_LEVEL,
    
    cronSecret: optional.CRON_SECRET,
    creatorSecretKey: optional.CREATOR_SECRET_KEY,
    adminKey: optional.ADMIN_KEY,
    
    features: {
      costTracking: optional.ENABLE_COST_TRACKING,
      detailedLogging: optional.ENABLE_DETAILED_LOGGING,
      emailNotifications: optional.ENABLE_EMAIL_NOTIFICATIONS,
    },
    
    rateLimits: {
      enabled: optional.RATE_LIMIT_ENABLED && redisEnabled,
      auth: optional.RATE_LIMIT_AUTH,
      ai: optional.RATE_LIMIT_AI,
      write: optional.RATE_LIMIT_WRITE,
      global: optional.RATE_LIMIT_GLOBAL,
    },
  };
  
  return {
    success: true,
    config,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// =====================================================
// SINGLETON CONFIG
// =====================================================

let _config: ValidatedConfig | null = null;

export function getConfig(): ValidatedConfig {
  if (!_config) {
    const result = validateConfig();
    if (!result.success) {
      console.error('Configuration validation failed:');
      result.errors?.forEach(err => console.error(`  - ${err}`));
      throw new Error('Invalid configuration. Check environment variables.');
    }
    if (result.warnings) {
      result.warnings.forEach(warn => console.warn(`[Config Warning] ${warn}`));
    }
    _config = result.config!;
  }
  return _config;
}

// Re-export for convenience
export const config = getConfig();
```

## JWT Expiry Enforcement Changes

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts`

**Current Code (lines 30-72):**
```typescript
if (token) {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    // ... rest of code
  } catch (e) {
    // Invalid token or database error
    authLogger.error({ err: e, operation: 'context.create' }, 'Context creation error');
    user = null;
  }
}
```

**Proposed Changes:**

Replace lines 30-72 with:
```typescript
if (token) {
  try {
    // Verify JWT (includes automatic expiry check)
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = decoded as JWTPayload;
    
    // Explicit expiry check with clear logging
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      authLogger.warn(
        { 
          operation: 'context.create',
          userId: payload.userId,
          expiredAt: new Date(payload.exp * 1000).toISOString(),
          expiredAgo: `${Math.floor((now - payload.exp) / 60)} minutes`
        },
        'JWT token expired'
      );
      user = null;
    } else {
      // Fetch fresh user data from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single();

      if (error) {
        authLogger.error(
          { err: error, operation: 'context.create', userId: payload.userId },
          'Context creation - Supabase error'
        );
        user = null;
      } else if (data) {
        // Check if monthly usage needs reset
        const currentMonthYear = new Date().toISOString().slice(0, 7);
        if (data.current_month_year !== currentMonthYear) {
          // Reset monthly counters
          await supabase
            .from('users')
            .update({
              reflection_count_this_month: 0,
              current_month_year: currentMonthYear,
            })
            .eq('id', data.id);

          data.reflection_count_this_month = 0;
          data.current_month_year = currentMonthYear;
        }

        user = userRowToUser(data);
      }
    }
  } catch (e) {
    // Handle specific JWT errors
    if (e instanceof jwt.TokenExpiredError) {
      authLogger.warn(
        { 
          operation: 'context.create',
          expiredAt: e.expiredAt?.toISOString(),
          message: e.message
        },
        'JWT token expired (caught by jwt.verify)'
      );
    } else if (e instanceof jwt.JsonWebTokenError) {
      authLogger.warn(
        { operation: 'context.create', message: (e as Error).message },
        'Invalid JWT token'
      );
    } else if (e instanceof jwt.NotBeforeError) {
      authLogger.warn(
        { operation: 'context.create', date: (e as jwt.NotBeforeError).date?.toISOString() },
        'JWT token not yet valid'
      );
    } else {
      // Database or other error
      authLogger.error(
        { err: e, operation: 'context.create' },
        'Context creation error'
      );
    }
    user = null;
  }
}
```

**Import Addition (line 4):**
Add `TokenExpiredError, JsonWebTokenError, NotBeforeError` to jwt import or use `jwt.TokenExpiredError` etc.

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts`

**Current Code (lines 24-40):**
```typescript
async function verifyAndGetUser(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = decoded as { userId: string };
    // ... database fetch
  } catch {
    return null;
  }
}
```

**Proposed Changes:**
```typescript
async function verifyAndGetUser(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = decoded as JWTPayload;
    
    // Explicit expiry check
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('[Clarify] JWT token expired for user:', payload.userId);
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !data) return null;
    return userRowToUser(data);
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      console.warn('[Clarify] JWT expired:', e.expiredAt);
    }
    return null;
  }
}
```

## Test Requirements

### Config Validation Tests

**File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/config.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Must be at top before importing config
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
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('SUPABASE_URL'));
    });

    it('should fail when JWT_SECRET is too short', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'short'; // Less than 32 chars
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('JWT_SECRET'));
    });

    it('should fail when ANTHROPIC_API_KEY has wrong prefix', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'wrong-prefix-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('ANTHROPIC_API_KEY'));
    });

    it('should pass with all required variables valid', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';

      const { validateConfig } = await import('../config');
      const result = validateConfig();
      
      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
    });
  });

  describe('Optional Feature Groups', () => {
    beforeEach(() => {
      // Set all required vars
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
    });

    it('should warn when PayPal is partially configured', async () => {
      process.env.PAYPAL_CLIENT_ID = 'test-client-id';
      // Missing other PayPal vars

      const { validateConfig } = await import('../config');
      const result = validateConfig();
      
      expect(result.success).toBe(true);
      expect(result.config?.payment.enabled).toBe(false);
      expect(result.warnings).toContain(expect.stringContaining('PayPal'));
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
    });

    it('should handle rate limiting disabled without Redis', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const { validateConfig } = await import('../config');
      const result = validateConfig();
      
      expect(result.success).toBe(true);
      expect(result.config?.rateLimits.enabled).toBe(false);
    });
  });

  describe('Default Values', () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
    });

    it('should use default values for optional variables', async () => {
      const { validateConfig } = await import('../config');
      const result = validateConfig();
      
      expect(result.config?.nodeEnv).toBe('development');
      expect(result.config?.port).toBe(3000);
      expect(result.config?.rateLimits.auth).toBe(5);
      expect(result.config?.features.costTracking).toBe(true);
    });
  });
});
```

### JWT Expiry Tests

**File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/__tests__/jwt-expiry.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

describe('JWT Expiry Enforcement', () => {
  describe('Token Creation', () => {
    it('should create tokens with correct expiry', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        tier: 'free',
        isCreator: false,
        isAdmin: false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp - decoded.iat).toBe(60 * 60 * 24 * 30);
    });

    it('should create demo tokens with 7-day expiry', () => {
      const payload = {
        userId: 'demo-user-id',
        email: 'demo@example.com',
        tier: 'unlimited',
        isCreator: false,
        isAdmin: false,
        isDemo: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

      expect(decoded.isDemo).toBe(true);
      expect(decoded.exp - decoded.iat).toBe(60 * 60 * 24 * 7);
    });
  });

  describe('Token Verification', () => {
    it('should reject expired tokens', () => {
      const expiredPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        tier: 'free',
        isCreator: false,
        isAdmin: false,
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago (expired)
      };

      const token = jwt.sign(expiredPayload, JWT_SECRET, { noTimestamp: true });

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow(jwt.TokenExpiredError);
    });

    it('should accept valid non-expired tokens', () => {
      const validPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        tier: 'free',
        isCreator: false,
        isAdmin: false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      const token = jwt.sign(validPayload, JWT_SECRET);

      expect(() => jwt.verify(token, JWT_SECRET)).not.toThrow();
    });

    it('should provide expiredAt date on TokenExpiredError', () => {
      const expiredAt = new Date(Date.now() - 1800000); // 30 minutes ago
      const expiredPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(expiredAt.getTime() / 1000),
      };

      const token = jwt.sign(expiredPayload, JWT_SECRET, { noTimestamp: true });

      try {
        jwt.verify(token, JWT_SECRET);
        expect.fail('Should have thrown TokenExpiredError');
      } catch (e) {
        expect(e).toBeInstanceOf(jwt.TokenExpiredError);
        expect((e as jwt.TokenExpiredError).expiredAt).toBeDefined();
      }
    });
  });

  describe('Explicit Expiry Check', () => {
    it('should detect expired token via payload check', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        userId: 'test-user-id',
        exp: now - 100, // Expired 100 seconds ago
      };

      const isExpired = payload.exp < now;
      expect(isExpired).toBe(true);
    });

    it('should pass valid token via payload check', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        userId: 'test-user-id',
        exp: now + 3600, // Valid for 1 hour
      };

      const isExpired = payload.exp < now;
      expect(isExpired).toBe(false);
    });
  });
});
```

## Complexity Assessment

### High Complexity Areas
- **Config module singleton pattern**: Must be carefully designed to work with Next.js hot reloading and serverless function cold starts

### Medium Complexity Areas
- **JWT error handling**: Multiple error types need distinct handling
- **Feature flag integration**: Existing code needs updates to use config values

### Low Complexity Areas
- **Zod schema definitions**: Straightforward type definitions
- **Test coverage**: Clear test cases based on requirements

## Recommendations for Planner

1. **Create config.ts first** - All other changes depend on having centralized config validation
2. **Update vitest.setup.ts** - Add all env vars needed for config validation tests
3. **Modify context.ts second** - JWT expiry enforcement is the security-critical change
4. **Update clarify stream route** - Apply same JWT handling pattern for consistency
5. **Consider graceful degradation** - Config should not crash app if optional features are missing

## Resource Map

### Critical Files to Modify

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/config.ts` | NEW | Create entire file |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts` | JWT verification | Lines 30-72, add error handling |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts` | Auth | Lines 24-40, update verifyAndGetUser |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts` | Test config | Add new env vars |

### Test Files to Create

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/config.test.ts` | Config validation tests |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/__tests__/jwt-expiry.test.ts` | JWT expiry tests |

### Key Dependencies

- `zod` (already installed) - Schema validation
- `jsonwebtoken` (already installed) - JWT handling with type support

## Questions for Planner

1. Should the config validation run at build time (Next.js build) or only at runtime?
2. For production deployment, should missing optional features (PayPal, email) cause warnings in logs or be silent?
3. Should there be an endpoint to check config status for health checks (e.g., `/api/health/config`)?
