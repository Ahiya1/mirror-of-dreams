// types/schemas.ts - Zod validation schemas for tRPC

import { z } from 'zod';

// ============================================
// User Schemas
// ============================================

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  language: z.enum(['en', 'he']).default('en'),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  language: z.enum(['en', 'he']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export const deleteAccountSchema = z.object({
  password: z.string(),
  confirmEmail: z.string().email(),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  currentPassword: z.string(),
});

export const updatePreferencesSchema = z.object({
  notification_email: z.boolean().optional(),
  reflection_reminders: z.enum(['off', 'daily', 'weekly']).optional(),
  evolution_email: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  default_tone: z.enum(['fusion', 'gentle', 'intense']).optional(),
  show_character_counter: z.boolean().optional(),
  reduce_motion_override: z.boolean().nullable().optional(),
  analytics_opt_in: z.boolean().optional(),
});

// ============================================
// Reflection Schemas
// ============================================

export const createReflectionSchema = z.object({
  dreamId: z.string().uuid(), // REQUIRED: dream ID to link reflection to
  dream: z.string().min(1).max(3200),
  plan: z.string().min(1).max(4000),
  relationship: z.string().min(1).max(4000),
  offering: z.string().min(1).max(2400),
  tone: z.enum(['gentle', 'intense', 'fusion']).default('fusion'),
  isPremium: z.boolean().default(false),
});

export const reflectionListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  tone: z.enum(['gentle', 'intense', 'fusion']).optional(),
  isPremium: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'word_count', 'rating']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateReflectionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const submitFeedbackSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().min(1).max(10),
  feedback: z.string().optional(),
});

export const reflectionIdSchema = z.object({
  id: z.string().uuid(),
});

// ============================================
// Evolution Report Schemas
// ============================================

export const evolutionReportInputSchema = z.object({
  reportType: z.enum(['deep-pattern', 'growth-journey']).optional(),
});

// ============================================
// Artifact Schemas
// ============================================

export const createArtifactSchema = z.object({
  reflectionId: z.string().uuid(),
  artifactType: z.enum(['visual', 'soundscape', 'poetic']),
  title: z.string().optional(),
  description: z.string().optional(),
});

// ============================================
// Subscription/Payment Schemas
// ============================================

export const paymentIntentSchema = z.object({
  tier: z.enum(['essential', 'premium']),
  period: z.enum(['monthly', 'yearly']),
});

export const subscriptionCancelSchema = z.object({
  reason: z.string().optional(),
});

// ============================================
// Admin Schemas
// ============================================

export const adminCreatorAuthSchema = z.object({
  creatorSecret: z.string(),
});
