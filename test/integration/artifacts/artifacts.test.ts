// test/integration/artifacts/artifacts.test.ts - Artifact router integration tests
// Tests for artifact CRUD operations

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import { proTierUser, freeTierUser } from '@/test/fixtures/users';

const mockReflection = {
  id: '22222222-2222-4222-8222-222222222222',
  user_id: 'pro-user-001',
  dream: 'Test dream content',
  tone: 'curious',
  is_premium: false,
};

const mockArtifact = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: 'pro-user-001',
  reflection_id: '22222222-2222-4222-8222-222222222222',
  artifact_type: 'visual',
  title: 'Test artifact',
  description: 'Test description',
  artifact_url: 'https://example.com/artifact.png',
  metadata: { tone: 'curious', isPremium: false },
  created_at: '2025-01-15T10:00:00Z',
};

describe('artifact.generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate new artifact for reflection', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockReflection,
            error: null,
          }),
        };
      }
      if (table === 'artifacts') {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          insert: vi.fn().mockReturnThis(),
        };
        // Make insert return the mock chain that eventually returns the artifact
        mock.insert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockArtifact,
              error: null,
            }),
          }),
        });
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.artifact.generate({
      reflectionId: '22222222-2222-4222-8222-222222222222',
      artifactType: 'visual',
    });

    expect(result.isNew).toBe(true);
    expect(result.artifact).toBeDefined();
    expect(result.message).toBe('Artifact generated successfully');
  });

  it('should return existing artifact if already exists', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockReflection,
            error: null,
          }),
        };
      }
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockArtifact,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.artifact.generate({
      reflectionId: '22222222-2222-4222-8222-222222222222',
      artifactType: 'visual',
    });

    expect(result.isNew).toBe(false);
    expect(result.message).toBe('Artifact already exists for this reflection');
  });

  it('should throw NOT_FOUND for non-existent reflection', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await expect(
      caller.artifact.generate({
        reflectionId: '88888888-8888-4888-8888-888888888888',
        artifactType: 'visual',
      })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should throw error on artifact creation failure', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockReflection,
            error: null,
          }),
        };
      }
      if (table === 'artifacts') {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          insert: vi.fn().mockReturnThis(),
        };
        mock.insert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Insert failed'),
            }),
          }),
        });
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await expect(
      caller.artifact.generate({
        reflectionId: '22222222-2222-4222-8222-222222222222',
        artifactType: 'visual',
      })
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('artifact.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated artifacts', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const mockArtifacts = [
      mockArtifact,
      { ...mockArtifact, id: '33333333-3333-4333-8333-333333333333' },
    ];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockArtifacts,
            error: null,
            count: 2,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.artifact.list({ page: 1, limit: 20 });

    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('should filter by artifact type', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [mockArtifact],
            error: null,
            count: 1,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.artifact.list({
      page: 1,
      limit: 20,
      artifactType: 'visual',
    });

    expect(result.items).toHaveLength(1);
  });

  it('should throw error on fetch failure', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB error'),
        count: 0,
      }),
    }));

    await expect(caller.artifact.list({ page: 1, limit: 20 })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('artifact.getById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return artifact by ID', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockArtifact,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.artifact.getById({ id: '11111111-1111-4111-8111-111111111111' });

    expect(result.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(result.artifact_type).toBe('visual');
  });

  it('should throw NOT_FOUND for non-existent artifact', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    }));

    await expect(
      caller.artifact.getById({ id: '99999999-9999-4999-9999-999999999999' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('artifact.getByReflectionId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return artifacts for reflection', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) =>
            resolve({
              data: [mockArtifact],
              error: null,
            })
          ),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.artifact.getByReflectionId({
      reflectionId: '22222222-2222-4222-8222-222222222222',
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('should filter by artifact type', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) =>
            resolve({
              data: [mockArtifact],
              error: null,
            })
          ),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.artifact.getByReflectionId({
      reflectionId: '22222222-2222-4222-8222-222222222222',
      artifactType: 'visual',
    });

    expect(result).toBeDefined();
  });

  it('should return empty array when no artifacts', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) =>
            resolve({
              data: [],
              error: null,
            })
          ),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.artifact.getByReflectionId({
      reflectionId: '99999999-9999-4999-9999-999999999999',
    });

    expect(result).toEqual([]);
  });

  it('should throw error on fetch failure', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: any) =>
        resolve({
          data: null,
          error: new Error('DB error'),
        })
      ),
    }));

    await expect(
      caller.artifact.getByReflectionId({ reflectionId: '22222222-2222-4222-8222-222222222222' })
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('artifact.delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete artifact successfully', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: '11111111-1111-4111-8111-111111111111' },
            error: null,
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.artifact.delete({ id: '11111111-1111-4111-8111-111111111111' });

    expect(result.message).toBe('Artifact deleted successfully');
  });

  it('should throw NOT_FOUND for non-existent artifact', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    }));

    await expect(
      caller.artifact.delete({ id: '99999999-9999-4999-9999-999999999999' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should throw error on delete failure', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: '11111111-1111-4111-8111-111111111111' },
            error: null,
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Delete failed'),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await expect(
      caller.artifact.delete({ id: '11111111-1111-4111-8111-111111111111' })
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('authentication', () => {
  it('should reject unauthenticated requests', async () => {
    const { caller } = createTestCaller(null);

    await expect(caller.artifact.list({ page: 1, limit: 20 })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
