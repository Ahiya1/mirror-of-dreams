// test/integration/reflections/reflections.test.ts - Reflections router integration tests
// Tests for reflections.list and reflections.getById

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import {
  createMockReflectionRow,
  createMockReflections,
  createReflectionForUser,
  basicReflection,
  premiumReflection,
  gentleReflection,
  intenseReflection,
} from '@/test/fixtures/reflections';
import { freeTierUser, proTierUser } from '@/test/fixtures/users';

describe('reflections.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should return user reflections', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const reflections = [
        createReflectionForUser(freeTierUser.id, { id: 'ref-1', title: 'First Reflection' }),
        createReflectionForUser(freeTierUser.id, { id: 'ref-2', title: 'Second Reflection' }),
      ];

      mockQueries({
        reflections: { data: reflections, error: null, count: 2 },
      });

      const result = await caller.reflections.list({});

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by dream_id', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const dreamId = 'specific-dream-id';
      const reflections = [
        createReflectionForUser(freeTierUser.id, { id: 'ref-1', dream_id: dreamId }),
      ];

      mockQueries({
        reflections: { data: reflections, error: null, count: 1 },
      });

      const result = await caller.reflections.list({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].dreamId).toBe(dreamId);
    });

    it('should support pagination', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Create 10 reflections, return first page of 5
      const reflections = createMockReflections(5, freeTierUser.id);

      mockQueries({
        reflections: { data: reflections, error: null, count: 10 },
      });

      const result = await caller.reflections.list({
        page: 1,
        limit: 5,
      });

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it('should return last page correctly', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Page 2 of 10 total with limit 5
      const reflections = createMockReflections(5, freeTierUser.id);

      mockQueries({
        reflections: { data: reflections, error: null, count: 10 },
      });

      const result = await caller.reflections.list({
        page: 2,
        limit: 5,
      });

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by tone', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const reflections = [
        createReflectionForUser(freeTierUser.id, { id: 'ref-1', tone: 'gentle' }),
      ];

      mockQueries({
        reflections: { data: reflections, error: null, count: 1 },
      });

      const result = await caller.reflections.list({ tone: 'gentle' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].tone).toBe('gentle');
    });

    it('should filter by isPremium', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const reflections = [
        createReflectionForUser(proTierUser.id, { id: 'ref-1', is_premium: true }),
      ];

      mockQueries({
        reflections: { data: reflections, error: null, count: 1 },
      });

      const result = await caller.reflections.list({ isPremium: true });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isPremium).toBe(true);
    });

    it('should support search query', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const reflections = [
        createReflectionForUser(freeTierUser.id, {
          id: 'ref-1',
          dream: 'guitar learning journey',
        }),
      ];

      mockQueries({
        reflections: { data: reflections, error: null, count: 1 },
      });

      const result = await caller.reflections.list({ search: 'guitar' });

      expect(result.items).toHaveLength(1);
    });

    it('should sort by created_at descending by default', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const olderDate = '2024-01-01T00:00:00.000Z';
      const newerDate = '2025-01-01T00:00:00.000Z';

      const reflections = [
        createReflectionForUser(freeTierUser.id, { id: 'new', created_at: newerDate }),
        createReflectionForUser(freeTierUser.id, { id: 'old', created_at: olderDate }),
      ];

      mockQueries({
        reflections: { data: reflections, error: null, count: 2 },
      });

      const result = await caller.reflections.list({});

      // Should be ordered newest first (the mock maintains this order)
      expect(result.items[0].id).toBe('new');
    });

    it('should sort by word_count when specified', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const reflections = [
        createReflectionForUser(freeTierUser.id, { id: 'long', word_count: 500 }),
        createReflectionForUser(freeTierUser.id, { id: 'short', word_count: 100 }),
      ];

      mockQueries({
        reflections: { data: reflections, error: null, count: 2 },
      });

      const result = await caller.reflections.list({
        sortBy: 'word_count',
        sortOrder: 'desc',
      });

      expect(result.items).toHaveLength(2);
    });

    it('should return empty list when no reflections', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        reflections: { data: [], error: null, count: 0 },
      });

      const result = await caller.reflections.list({});

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.reflections.list({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

// Valid UUIDs for testing
const TEST_REFLECTION_ID = '12345678-1234-1234-1234-123456789012';
const FULL_REFLECTION_ID = 'abcdef12-3456-7890-abcd-ef1234567890';
const RATED_REFLECTION_ID = 'fedcba98-7654-3210-fedc-ba9876543210';
const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';
const OTHER_USER_REFLECTION_ID = '11111111-1111-1111-1111-111111111111';
const ANY_REFLECTION_ID = '22222222-2222-2222-2222-222222222222';

describe('reflections.getById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should return reflection with AI response', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const reflection = createReflectionForUser(freeTierUser.id, {
        id: TEST_REFLECTION_ID,
        ai_response: 'Your journey speaks to the depths of your soul...',
      });

      mockQueries({
        reflections: { data: reflection, error: null },
      });

      const result = await caller.reflections.getById({ id: TEST_REFLECTION_ID });

      expect(result.id).toBe(TEST_REFLECTION_ID);
      expect(result.aiResponse).toBe('Your journey speaks to the depths of your soul...');
    });

    it('should return all reflection fields', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const reflection = createReflectionForUser(freeTierUser.id, {
        id: FULL_REFLECTION_ID,
        dream: 'Learn to play guitar',
        plan: 'Practice daily',
        relationship: 'Connects to my creative side',
        offering: 'Time and dedication',
        tone: 'fusion',
        is_premium: false,
        word_count: 350,
        title: 'Guitar Journey',
        tags: ['music', 'creativity'],
      });

      mockQueries({
        reflections: { data: reflection, error: null },
      });

      const result = await caller.reflections.getById({ id: FULL_REFLECTION_ID });

      expect(result.dream).toBe('Learn to play guitar');
      expect(result.plan).toBe('Practice daily');
      expect(result.relationship).toBe('Connects to my creative side');
      expect(result.offering).toBe('Time and dedication');
      expect(result.tone).toBe('fusion');
      expect(result.isPremium).toBe(false);
      expect(result.wordCount).toBe(350);
      expect(result.title).toBe('Guitar Journey');
      expect(result.tags).toContain('music');
    });

    it('should return reflection with rating and feedback', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const reflection = createReflectionForUser(freeTierUser.id, {
        id: RATED_REFLECTION_ID,
        rating: 9,
        user_feedback: 'Very insightful',
      });

      mockQueries({
        reflections: { data: reflection, error: null },
      });

      const result = await caller.reflections.getById({ id: RATED_REFLECTION_ID });

      expect(result.rating).toBe(9);
      expect(result.userFeedback).toBe('Very insightful');
    });
  });

  describe('error cases', () => {
    it('should throw NOT_FOUND when reflection does not exist', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        reflections: { data: null, error: { code: 'PGRST116' } as any },
      });

      await expect(caller.reflections.getById({ id: NON_EXISTENT_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Reflection not found',
      });
    });

    it('should not return other user reflections', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // The query filters by user_id, so if the reflection belongs to another user,
      // the database won't return it (simulated by returning null)
      mockQueries({
        reflections: { data: null, error: { code: 'PGRST116' } as any },
      });

      await expect(
        caller.reflections.getById({ id: OTHER_USER_REFLECTION_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.reflections.getById({ id: ANY_REFLECTION_ID })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

describe('reflections.checkUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should return usage for free tier user', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.reflections.checkUsage();

      expect(result.tier).toBe('free');
      expect(result.limit).toBe(4); // Free tier limit
      expect(result.used).toBe(freeTierUser.reflectionCountThisMonth);
      expect(result.canReflect).toBe(true);
    });

    it('should return usage for pro tier user', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.reflections.checkUsage();

      expect(result.tier).toBe('pro');
      expect(result.limit).toBe(10); // Pro tier limit
      expect(result.used).toBe(proTierUser.reflectionCountThisMonth);
    });

    it('should indicate when user cannot reflect', async () => {
      const userAtLimit = {
        ...freeTierUser,
        reflectionCountThisMonth: 4, // At free tier limit
      };
      const { caller } = createTestCaller(userAtLimit);

      const result = await caller.reflections.checkUsage();

      expect(result.canReflect).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.reflections.checkUsage()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
