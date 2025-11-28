// server/trpc/middleware.ts - Authentication and permission middlewares

import { TRPCError } from '@trpc/server';
import { middleware, publicProcedure } from './trpc';
import { TIER_LIMITS } from '@/lib/utils/constants';

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

// Check usage limits
export const checkUsageLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Creators and admins have unlimited usage
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  const limit = TIER_LIMITS[ctx.user.tier];
  const usage = ctx.user.reflectionCountThisMonth;

  if (usage >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly reflection limit reached (${limit}). Please upgrade or wait until next month.`,
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
      message: 'Demo accounts cannot modify data. Sign up to save changes.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Export protected procedures
export const protectedProcedure = publicProcedure.use(isAuthed);
export const creatorProcedure = publicProcedure.use(isCreatorOrAdmin);
export const premiumProcedure = publicProcedure.use(isAuthed).use(isPremium);
export const usageLimitedProcedure = publicProcedure.use(isAuthed).use(checkUsageLimit);
export const writeProcedure = publicProcedure.use(isAuthed).use(notDemo);
