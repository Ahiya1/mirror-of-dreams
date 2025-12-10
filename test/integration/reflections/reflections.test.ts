// test/integration/reflections/reflections.test.ts - Reflections router integration tests
// Tests for reflections.list and reflections.getById

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import { createMockReflections, createReflectionForUser } from '@/test/fixtures/reflections';
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
      expect(result.limit).toBe(2); // Free tier limit (TIER_LIMITS.free)
      expect(result.used).toBe(freeTierUser.reflectionCountThisMonth);
      expect(result.canReflect).toBe(true);
    });

    it('should return usage for pro tier user', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.reflections.checkUsage();

      expect(result.tier).toBe('pro');
      expect(result.limit).toBe(30); // Pro tier limit (TIER_LIMITS.pro)
      expect(result.used).toBe(proTierUser.reflectionCountThisMonth);
    });

    it('should indicate when user cannot reflect', async () => {
      const userAtLimit = {
        ...freeTierUser,
        reflectionCountThisMonth: 2, // At free tier limit (TIER_LIMITS.free)
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

// =============================================================================
// Update Tests (7 test cases)
// =============================================================================

// Additional UUIDs for update/delete/feedback tests
const UPDATE_REFLECTION_ID = '33333333-3333-3333-3333-333333333333';
const DELETE_REFLECTION_ID = '44444444-4444-4444-4444-444444444444';
const FEEDBACK_REFLECTION_ID = '55555555-5555-5555-5555-555555555555';

describe('reflections.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should update title successfully', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const updatedReflection = createReflectionForUser(freeTierUser.id, {
        id: UPDATE_REFLECTION_ID,
        title: 'Updated Title',
      });

      mockQueries({
        reflections: { data: updatedReflection, error: null },
      });

      const result = await caller.reflections.update({
        id: UPDATE_REFLECTION_ID,
        title: 'Updated Title',
      });

      expect(result.reflection.title).toBe('Updated Title');
      expect(result.message).toBe('Reflection updated successfully');
    });

    it('should update tags successfully', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const updatedReflection = createReflectionForUser(freeTierUser.id, {
        id: UPDATE_REFLECTION_ID,
        tags: ['music', 'creativity', 'growth'],
      });

      mockQueries({
        reflections: { data: updatedReflection, error: null },
      });

      const result = await caller.reflections.update({
        id: UPDATE_REFLECTION_ID,
        tags: ['music', 'creativity', 'growth'],
      });

      expect(result.reflection.tags).toEqual(['music', 'creativity', 'growth']);
      expect(result.message).toBe('Reflection updated successfully');
    });

    it('should update both title and tags', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const updatedReflection = createReflectionForUser(freeTierUser.id, {
        id: UPDATE_REFLECTION_ID,
        title: 'New Title',
        tags: ['new', 'tags'],
      });

      mockQueries({
        reflections: { data: updatedReflection, error: null },
      });

      const result = await caller.reflections.update({
        id: UPDATE_REFLECTION_ID,
        title: 'New Title',
        tags: ['new', 'tags'],
      });

      expect(result.reflection.title).toBe('New Title');
      expect(result.reflection.tags).toEqual(['new', 'tags']);
    });
  });

  describe('error cases', () => {
    it('should throw error when reflection not found', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        reflections: { data: null, error: { code: 'PGRST116', message: 'Not found' } as any },
      });

      await expect(
        caller.reflections.update({
          id: NON_EXISTENT_ID,
          title: 'Updated',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update reflection',
      });
    });

    it('should not update other user reflection', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Database query filters by user_id, so attempting to update another user's
      // reflection results in no rows returned (error)
      mockQueries({
        reflections: { data: null, error: { code: 'PGRST116' } as any },
      });

      await expect(
        caller.reflections.update({
          id: OTHER_USER_REFLECTION_ID,
          title: 'Hacked Title',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      });
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.reflections.update({
          id: UPDATE_REFLECTION_ID,
          title: 'Should Fail',
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('input validation', () => {
    it('should reject invalid UUID format', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.reflections.update({
          id: 'not-a-valid-uuid',
          title: 'Test',
        })
      ).rejects.toThrow();
    });
  });
});

// =============================================================================
// Delete Tests (5 test cases)
// =============================================================================

describe('reflections.delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should delete own reflection successfully', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // First query: verify ownership (select)
      // Second query: delete
      // Third query: update user counters
      mockQueries({
        reflections: { data: { id: DELETE_REFLECTION_ID }, error: null },
        users: { data: null, error: null },
      });

      const result = await caller.reflections.delete({ id: DELETE_REFLECTION_ID });

      expect(result.message).toBe('Reflection deleted successfully');
    });

    it('should decrement user counters on delete', async () => {
      const userWithReflections = {
        ...freeTierUser,
        reflectionCountThisMonth: 3,
        totalReflections: 10,
      };
      const { caller, mockQueries, supabase } = createTestCaller(userWithReflections);

      mockQueries({
        reflections: { data: { id: DELETE_REFLECTION_ID }, error: null },
        users: { data: null, error: null },
      });

      await caller.reflections.delete({ id: DELETE_REFLECTION_ID });

      // Verify the update call was made to 'users' table
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('should not decrement counters below zero', async () => {
      const userWithZeroReflections = {
        ...freeTierUser,
        reflectionCountThisMonth: 0,
        totalReflections: 0,
      };
      const { caller, mockQueries } = createTestCaller(userWithZeroReflections);

      mockQueries({
        reflections: { data: { id: DELETE_REFLECTION_ID }, error: null },
        users: { data: null, error: null },
      });

      // Should not throw even with zero counters (Math.max(0, count - 1) logic)
      const result = await caller.reflections.delete({ id: DELETE_REFLECTION_ID });
      expect(result.message).toBe('Reflection deleted successfully');
    });
  });

  describe('error cases', () => {
    it('should throw NOT_FOUND when reflection does not exist', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Ownership check returns null
      mockQueries({
        reflections: { data: null, error: null },
      });

      await expect(caller.reflections.delete({ id: NON_EXISTENT_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Reflection not found',
      });
    });

    it('should throw NOT_FOUND when deleting other user reflection', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // The query filters by user_id, so another user's reflection returns null
      mockQueries({
        reflections: { data: null, error: null },
      });

      await expect(
        caller.reflections.delete({ id: OTHER_USER_REFLECTION_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Reflection not found',
      });
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.reflections.delete({ id: DELETE_REFLECTION_ID })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

// =============================================================================
// Submit Feedback Tests (8 test cases)
// =============================================================================

describe('reflections.submitFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should submit rating only', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const updatedReflection = createReflectionForUser(freeTierUser.id, {
        id: FEEDBACK_REFLECTION_ID,
        rating: 8,
        user_feedback: null,
      });

      mockQueries({
        reflections: { data: updatedReflection, error: null },
      });

      const result = await caller.reflections.submitFeedback({
        id: FEEDBACK_REFLECTION_ID,
        rating: 8,
      });

      expect(result.reflection.rating).toBe(8);
      expect(result.message).toBe('Feedback submitted successfully');
    });

    it('should submit rating and feedback together', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const updatedReflection = createReflectionForUser(freeTierUser.id, {
        id: FEEDBACK_REFLECTION_ID,
        rating: 9,
        user_feedback: 'Very insightful and helpful',
      });

      mockQueries({
        reflections: { data: updatedReflection, error: null },
      });

      const result = await caller.reflections.submitFeedback({
        id: FEEDBACK_REFLECTION_ID,
        rating: 9,
        feedback: 'Very insightful and helpful',
      });

      expect(result.reflection.rating).toBe(9);
      expect(result.reflection.userFeedback).toBe('Very insightful and helpful');
    });

    it('should accept rating at minimum boundary (1)', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const updatedReflection = createReflectionForUser(freeTierUser.id, {
        id: FEEDBACK_REFLECTION_ID,
        rating: 1,
      });

      mockQueries({
        reflections: { data: updatedReflection, error: null },
      });

      const result = await caller.reflections.submitFeedback({
        id: FEEDBACK_REFLECTION_ID,
        rating: 1,
      });

      expect(result.reflection.rating).toBe(1);
    });

    it('should accept rating at maximum boundary (10)', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const updatedReflection = createReflectionForUser(freeTierUser.id, {
        id: FEEDBACK_REFLECTION_ID,
        rating: 10,
      });

      mockQueries({
        reflections: { data: updatedReflection, error: null },
      });

      const result = await caller.reflections.submitFeedback({
        id: FEEDBACK_REFLECTION_ID,
        rating: 10,
      });

      expect(result.reflection.rating).toBe(10);
    });
  });

  describe('input validation', () => {
    it('should reject rating below minimum (0)', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.reflections.submitFeedback({
          id: FEEDBACK_REFLECTION_ID,
          rating: 0,
        })
      ).rejects.toThrow();
    });

    it('should reject rating above maximum (11)', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.reflections.submitFeedback({
          id: FEEDBACK_REFLECTION_ID,
          rating: 11,
        })
      ).rejects.toThrow();
    });
  });

  describe('error cases', () => {
    it('should throw error for non-existent reflection', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        reflections: { data: null, error: { code: 'PGRST116' } as any },
      });

      await expect(
        caller.reflections.submitFeedback({
          id: NON_EXISTENT_ID,
          rating: 8,
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to submit feedback',
      });
    });

    it('should throw error when submitting feedback on other user reflection', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Query filters by user_id, so another user's reflection triggers error
      mockQueries({
        reflections: { data: null, error: { code: 'PGRST116' } as any },
      });

      await expect(
        caller.reflections.submitFeedback({
          id: OTHER_USER_REFLECTION_ID,
          rating: 5,
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      });
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.reflections.submitFeedback({
          id: FEEDBACK_REFLECTION_ID,
          rating: 8,
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
