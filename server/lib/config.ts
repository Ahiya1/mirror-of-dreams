// server/lib/config.ts - Centralized configuration with Zod validation

import { z } from 'zod';

// =====================================================
// HELPER SCHEMAS
// =====================================================

// Custom boolean schema that properly handles string 'false'
const booleanFromString = z.union([z.boolean(), z.string()]).transform((val) => {
  if (typeof val === 'boolean') return val;
  if (val === 'false' || val === '0' || val === '') return false;
  return true;
});

// =====================================================
// SCHEMA DEFINITIONS
// =====================================================

const requiredEnvSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY must be at least 20 characters'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
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
  ENABLE_COST_TRACKING: booleanFromString.default(true),
  ENABLE_DETAILED_LOGGING: booleanFromString.default(true),
  ENABLE_EMAIL_NOTIFICATIONS: booleanFromString.default(true),

  // Rate limiting
  RATE_LIMIT_AUTH: z.coerce.number().default(5),
  RATE_LIMIT_AI: z.coerce.number().default(10),
  RATE_LIMIT_WRITE: z.coerce.number().default(30),
  RATE_LIMIT_GLOBAL: z.coerce.number().default(100),
  RATE_LIMIT_ENABLED: booleanFromString.default(true),
});

// =====================================================
// TYPE DEFINITIONS
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

  // Analytics
  gaId?: string;
  posthogKey?: string;

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

// =====================================================
// VALIDATION FUNCTION
// =====================================================

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
    requiredResult.error.issues.forEach((issue) => {
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
      ...(paymentEnabled && paymentResult.data
        ? {
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
          }
        : {}),
    },

    email: {
      enabled: emailEnabled,
      ...(emailEnabled && emailResult.data
        ? {
            user: emailResult.data.GMAIL_USER,
            password: emailResult.data.GMAIL_APP_PASSWORD,
          }
        : {}),
    },

    redis: {
      enabled: redisEnabled,
      ...(redisEnabled && redisResult.data
        ? {
            url: redisResult.data.UPSTASH_REDIS_REST_URL,
            token: redisResult.data.UPSTASH_REDIS_REST_TOKEN,
          }
        : {}),
    },

    nodeEnv: optional.NODE_ENV,
    port: optional.PORT,
    domain: optional.DOMAIN,
    logLevel: optional.LOG_LEVEL,

    cronSecret: optional.CRON_SECRET,
    creatorSecretKey: optional.CREATOR_SECRET_KEY,
    adminKey: optional.ADMIN_KEY,

    gaId: optional.GA_ID,
    posthogKey: optional.POSTHOG_KEY,

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
      result.errors?.forEach((err) => console.error(`  - ${err}`));
      throw new Error('Invalid configuration. Check environment variables.');
    }
    if (result.warnings) {
      result.warnings.forEach((warn) => console.warn(`[Config Warning] ${warn}`));
    }
    _config = result.config!;
  }
  return _config;
}

// For testing: reset singleton
export function resetConfig(): void {
  _config = null;
}
