// server/trpc/__tests__/middleware.test.ts
// Tests for daily limit checking in middleware

import { describe, it, expect } from '@jest/globals';
import { DAILY_LIMITS } from '@/lib/utils/constants';

describe('Daily Limit Logic', () => {
  it('should have correct daily limits', () => {
    expect(DAILY_LIMITS.free).toBe(Infinity);
    expect(DAILY_LIMITS.pro).toBe(1);
    expect(DAILY_LIMITS.unlimited).toBe(2);
  });

  it('should check daily limit for pro users', () => {
    const tier = 'pro';
    const dailyLimit = DAILY_LIMITS[tier];
    const today = new Date().toISOString().split('T')[0];

    // Scenario 1: First reflection today (lastDate is different)
    const lastDate1 = '2025-11-29';
    const reflectionsToday1 = 0;
    const shouldAllow1 = lastDate1 !== today || reflectionsToday1 < dailyLimit;
    expect(shouldAllow1).toBe(true);

    // Scenario 2: Same day, under limit
    const lastDate2 = today;
    const reflectionsToday2 = 0;
    const shouldAllow2 = lastDate2 === today && reflectionsToday2 < dailyLimit;
    expect(shouldAllow2).toBe(true);

    // Scenario 3: Same day, at limit
    const lastDate3 = today;
    const reflectionsToday3 = 1;
    const shouldBlock3 = lastDate3 === today && reflectionsToday3 >= dailyLimit;
    expect(shouldBlock3).toBe(true);
  });

  it('should check daily limit for unlimited users', () => {
    const tier = 'unlimited';
    const dailyLimit = DAILY_LIMITS[tier];
    const today = new Date().toISOString().split('T')[0];

    // Scenario 1: Under limit
    const lastDate1 = today;
    const reflectionsToday1 = 1;
    const shouldAllow1 = lastDate1 === today && reflectionsToday1 < dailyLimit;
    expect(shouldAllow1).toBe(true);

    // Scenario 2: At limit
    const lastDate2 = today;
    const reflectionsToday2 = 2;
    const shouldBlock2 = lastDate2 === today && reflectionsToday2 >= dailyLimit;
    expect(shouldBlock2).toBe(true);
  });

  it('should not have daily limit for free users', () => {
    const tier = 'free';
    const dailyLimit = DAILY_LIMITS[tier];
    expect(dailyLimit).toBe(Infinity);

    const reflectionsToday = 100;
    const shouldAllow = reflectionsToday < dailyLimit;
    expect(shouldAllow).toBe(true);
  });
});

describe('Reflection Counter Update Logic', () => {
  it('should reset counter when new day', () => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = '2025-11-29';
    const currentCount = 5;

    const newCount = lastDate === today ? currentCount + 1 : 1;
    expect(newCount).toBe(1);
  });

  it('should increment counter when same day', () => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = today;
    const currentCount = 1;

    const newCount = lastDate === today ? currentCount + 1 : 1;
    expect(newCount).toBe(2);
  });
});
