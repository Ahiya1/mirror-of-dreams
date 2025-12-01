import { DAILY_LIMITS, TIER_LIMITS } from '@/lib/utils/constants';
import type { User } from '@/types';

/**
 * Check if user can create a reflection based on daily and monthly limits
 */
export function checkReflectionLimits(user: User): {
  canCreate: boolean;
  reason?: 'monthly_limit' | 'daily_limit';
  resetTime?: Date;
} {
  // Check monthly limit first
  const monthlyLimit = TIER_LIMITS[user.tier];
  if (user.reflectionCountThisMonth >= monthlyLimit) {
    return {
      canCreate: false,
      reason: 'monthly_limit',
    };
  }

  // Free tier has no daily limit
  if (user.tier === 'free') {
    return { canCreate: true };
  }

  // Check daily limit for Pro and Unlimited
  const dailyLimit = DAILY_LIMITS[user.tier];
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // If last reflection was not today, user can create
  if (user.lastReflectionDate !== today) {
    return { canCreate: true };
  }

  // Check if daily limit reached
  if (user.reflectionsToday >= dailyLimit) {
    // Calculate reset time (midnight user's timezone)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      canCreate: false,
      reason: 'daily_limit',
      resetTime: tomorrow,
    };
  }

  return { canCreate: true };
}
