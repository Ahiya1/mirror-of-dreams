// server/trpc/middleware.ts - Authentication and permission middlewares

import { TRPCError } from '@trpc/server';
import { middleware, publicProcedure } from './trpc';
import { TIER_LIMITS, DAILY_LIMITS, CLARIFY_SESSION_LIMITS } from '@/lib/utils/constants';

// Ensure user is authenticated
export const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type narrowed to User (not null)
    },
  });
});

// Ensure user is creator or admin
export const isCreatorOrAdmin = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (!ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Creator or admin access required.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Ensure user has premium tier
export const isPremium = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (ctx.user.tier === 'free' && !ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Premium tier required. Please upgrade your subscription.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Check usage limits (both daily and monthly)
export const checkUsageLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Creators and admins have unlimited usage
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // Check daily limit first (Pro and Unlimited only)
  if (ctx.user.tier === 'pro' || ctx.user.tier === 'unlimited') {
    const dailyLimit = DAILY_LIMITS[ctx.user.tier];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastDate = ctx.user.lastReflectionDate;

    // Check if already at daily limit
    if (lastDate === today && ctx.user.reflectionsToday >= dailyLimit) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Daily reflection limit reached (${dailyLimit}/day). Try again tomorrow.`,
      });
    }
  }

  // Check monthly limit
  const monthlyLimit = TIER_LIMITS[ctx.user.tier];
  const monthlyUsage = ctx.user.reflectionCountThisMonth;

  if (monthlyUsage >= monthlyLimit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly reflection limit reached (${monthlyLimit}). Please upgrade or wait until next month.`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Ensure user is not a demo user (blocks destructive operations)
export const notDemo = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  if (ctx.user.isDemo) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Create a free account to start your own reflection journey. The demo shows what\'s possible!',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Check Clarify session access and limits
export const checkClarifyAccess = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  // Block free tier entirely (Clarify is paid-only)
  if (ctx.user.tier === 'free' && !ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Clarify requires a Pro or Unlimited subscription. Upgrade to explore your dreams through conversation.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Check Clarify session creation limits
export const checkClarifySessionLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Creators and admins bypass limits
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // Check clarify session limits
  const limit = CLARIFY_SESSION_LIMITS[ctx.user.tier];
  const usage = ctx.user.clarifySessionsThisMonth;

  if (usage >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly Clarify session limit reached (${limit}). Your sessions will reset at the start of next month.`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Export protected procedures
export const protectedProcedure = publicProcedure.use(isAuthed);
export const creatorProcedure = publicProcedure.use(isCreatorOrAdmin);
export const premiumProcedure = publicProcedure.use(isAuthed).use(isPremium);
export const usageLimitedProcedure = publicProcedure.use(isAuthed).use(notDemo).use(checkUsageLimit);
export const writeProcedure = publicProcedure.use(isAuthed).use(notDemo);

// Export Clarify procedures
// Read-only procedure allows demo users to view sessions
export const clarifyReadProcedure = publicProcedure.use(isAuthed).use(checkClarifyAccess);
// Write procedure blocks demo users from creating/modifying sessions
export const clarifyProcedure = publicProcedure.use(isAuthed).use(notDemo).use(checkClarifyAccess);
export const clarifySessionLimitedProcedure = clarifyProcedure.use(checkClarifySessionLimit);
