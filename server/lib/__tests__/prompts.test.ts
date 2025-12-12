// server/lib/__tests__/prompts.test.ts
// Tests for prompt loading system for AI generation

import fs from 'fs';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
  },
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join('/')),
  },
}));

describe('Prompts Service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // =====================================================
  // loadPrompts TESTS
  // =====================================================

  describe('loadPrompts', () => {
    it('should load base instructions', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base instructions content';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts();

      expect(result).toContain('Base instructions content');
    });

    it('should load fusion tone by default', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('sacred_fusion.txt')) {
          return 'Sacred fusion content';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts();

      expect(result).toContain('Sacred fusion content');
    });

    it('should load gentle tone when specified', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('gentle_clarity.txt')) {
          return 'Gentle clarity content';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts('gentle');

      expect(result).toContain('Gentle clarity content');
    });

    it('should load intense tone when specified', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('luminous_intensity.txt')) {
          return 'Luminous intensity content';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts('intense');

      expect(result).toContain('Luminous intensity content');
    });

    it('should include creator context when isCreator is true', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('sacred_fusion.txt')) {
          return 'Fusion';
        }
        if (String(filepath).includes('creator_context.txt')) {
          return 'Creator specific context';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts('fusion', false, true);

      expect(result).toContain('Creator specific context');
    });

    it('should not include creator context when isCreator is false', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('sacred_fusion.txt')) {
          return 'Fusion';
        }
        if (String(filepath).includes('creator_context.txt')) {
          return 'Creator specific context';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts('fusion', false, false);

      expect(result).not.toContain('Creator specific context');
    });

    it('should include premium enhancement when isPremium is true', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('sacred_fusion.txt')) {
          return 'Fusion';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts('fusion', true);

      expect(result).toContain('PREMIUM REFLECTION ENHANCEMENT');
    });

    it('should not include premium enhancement when isPremium is false', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('sacred_fusion.txt')) {
          return 'Fusion';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts('fusion', false);

      expect(result).not.toContain('PREMIUM REFLECTION ENHANCEMENT');
    });

    it('should handle file read errors gracefully', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts();

      // Should return empty string when all files fail to load
      expect(typeof result).toBe('string');
      consoleSpy.mockRestore();
    });

    it('should join parts with double newlines', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Part 1';
        }
        if (String(filepath).includes('sacred_fusion.txt')) {
          return 'Part 2';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts();

      expect(result).toContain('Part 1\n\nPart 2');
    });

    it('should trim whitespace from loaded content', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return '  Content with spaces  \n\n';
        }
        return '';
      });

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts();

      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });
  });

  // =====================================================
  // loadEvolutionPrompt TESTS
  // =====================================================

  describe('loadEvolutionPrompt', () => {
    it('should load base and evolution instructions', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base instructions';
        }
        if (String(filepath).includes('evolution_instructions.txt')) {
          return 'Evolution instructions';
        }
        return '';
      });

      const { loadEvolutionPrompt } = await import('../prompts');
      const result = await loadEvolutionPrompt();

      expect(result).toContain('Base instructions');
      expect(result).toContain('Evolution instructions');
    });

    it('should include premium enhancement when isPremium is true', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('evolution_instructions.txt')) {
          return 'Evolution';
        }
        return '';
      });

      const { loadEvolutionPrompt } = await import('../prompts');
      const result = await loadEvolutionPrompt(true);

      expect(result).toContain('PREMIUM EVOLUTION ANALYSIS');
    });

    it('should not include premium enhancement when isPremium is false', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('evolution_instructions.txt')) {
          return 'Evolution';
        }
        return '';
      });

      const { loadEvolutionPrompt } = await import('../prompts');
      const result = await loadEvolutionPrompt(false);

      expect(result).not.toContain('PREMIUM EVOLUTION ANALYSIS');
    });

    it('should default to non-premium', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes('base_instructions.txt')) {
          return 'Base';
        }
        if (String(filepath).includes('evolution_instructions.txt')) {
          return 'Evolution';
        }
        return '';
      });

      const { loadEvolutionPrompt } = await import('../prompts');
      const result = await loadEvolutionPrompt();

      expect(result).not.toContain('PREMIUM EVOLUTION ANALYSIS');
    });
  });

  // =====================================================
  // buildReflectionUserPrompt TESTS
  // =====================================================

  describe('buildReflectionUserPrompt', () => {
    it('should include all required fields', async () => {
      const { buildReflectionUserPrompt } = await import('../prompts');

      const data = {
        dream: 'My dream content',
        plan: 'My plan content',
        hasDate: 'no',
        dreamDate: null,
        relationship: 'My relationship content',
        offering: 'My offering content',
      };

      const result = buildReflectionUserPrompt(data);

      expect(result).toContain('My dream content');
      expect(result).toContain('My plan content');
      expect(result).toContain('My relationship content');
      expect(result).toContain('My offering content');
    });

    it('should include date when hasDate is yes', async () => {
      const { buildReflectionUserPrompt } = await import('../prompts');

      const data = {
        dream: 'Dream',
        plan: 'Plan',
        hasDate: 'yes',
        dreamDate: '2025-12-31',
        relationship: 'Relationship',
        offering: 'Offering',
      };

      const result = buildReflectionUserPrompt(data);

      expect(result).toContain('Dream Date: 2025-12-31');
    });

    it('should not include date when hasDate is no', async () => {
      const { buildReflectionUserPrompt } = await import('../prompts');

      const data = {
        dream: 'Dream',
        plan: 'Plan',
        hasDate: 'no',
        dreamDate: '2025-12-31',
        relationship: 'Relationship',
        offering: 'Offering',
      };

      const result = buildReflectionUserPrompt(data);

      expect(result).not.toContain('Dream Date:');
    });

    it('should not include date when dreamDate is null', async () => {
      const { buildReflectionUserPrompt } = await import('../prompts');

      const data = {
        dream: 'Dream',
        plan: 'Plan',
        hasDate: 'yes',
        dreamDate: null,
        relationship: 'Relationship',
        offering: 'Offering',
      };

      const result = buildReflectionUserPrompt(data);

      expect(result).not.toContain('Dream Date:');
    });

    it('should include SACRED REFLECTION REQUEST header', async () => {
      const { buildReflectionUserPrompt } = await import('../prompts');

      const data = {
        dream: 'Dream',
        plan: 'Plan',
        hasDate: 'no',
        dreamDate: null,
        relationship: 'Relationship',
        offering: 'Offering',
      };

      const result = buildReflectionUserPrompt(data);

      expect(result).toContain('SACRED REFLECTION REQUEST');
    });

    it('should include reflection closing request', async () => {
      const { buildReflectionUserPrompt } = await import('../prompts');

      const data = {
        dream: 'Dream',
        plan: 'Plan',
        hasDate: 'no',
        dreamDate: null,
        relationship: 'Relationship',
        offering: 'Offering',
      };

      const result = buildReflectionUserPrompt(data);

      expect(result).toContain('reflect back the truth');
      expect(result).toContain('sovereignty');
    });

    it('should include question labels', async () => {
      const { buildReflectionUserPrompt } = await import('../prompts');

      const data = {
        dream: 'Dream',
        plan: 'Plan',
        hasDate: 'no',
        dreamDate: null,
        relationship: 'Relationship',
        offering: 'Offering',
      };

      const result = buildReflectionUserPrompt(data);

      expect(result).toContain('What is your dream?');
      expect(result).toContain('What is your plan to manifest this dream?');
      expect(result).toContain('What is your relationship with this dream?');
      expect(result).toContain('What are you willing to give in service of this dream?');
    });

    it('should return trimmed result', async () => {
      const { buildReflectionUserPrompt } = await import('../prompts');

      const data = {
        dream: 'Dream',
        plan: 'Plan',
        hasDate: 'no',
        dreamDate: null,
        relationship: 'Relationship',
        offering: 'Offering',
      };

      const result = buildReflectionUserPrompt(data);

      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });
  });

  // =====================================================
  // PREMIUM ENHANCEMENT CONTENT TESTS
  // =====================================================

  describe('Premium Enhancement Content', () => {
    it('premium reflection enhancement should include sacred guidelines', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => '');

      const { loadPrompts } = await import('../prompts');
      const result = await loadPrompts('fusion', true);

      expect(result).toContain('Sacred Guidelines for Premium Reflection');
      expect(result).toContain('Depth of Seeing');
      expect(result).toContain('Truth Without Fixing');
      expect(result).toContain('Sacred Mirroring');
      expect(result).toContain('Philosophical Resonance');
    });

    it('premium evolution enhancement should include analysis depth', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => '');

      const { loadEvolutionPrompt } = await import('../prompts');
      const result = await loadEvolutionPrompt(true);

      expect(result).toContain('extended thinking capabilities');
      expect(result).toContain('pattern recognition');
      expect(result).toContain('consciousness development');
    });
  });
});
