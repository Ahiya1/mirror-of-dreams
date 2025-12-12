// types/__tests__/transformations.test.ts
// Tests for row-to-object transformation functions

import { describe, it, expect } from 'vitest';

import { artifactRowToArtifact } from '../artifact';
import {
  clarifySessionRowToSession,
  clarifyMessageRowToMessage,
  clarifyPatternRowToPattern as clarifyPatternRowToPatternFromClarify,
} from '../clarify';
import { evolutionReportRowToEvolutionReport } from '../evolution';
import { clarifyPatternRowToPattern } from '../pattern';

describe('artifactRowToArtifact', () => {
  it('transforms database row to Artifact correctly', () => {
    const row = {
      id: 'artifact-123',
      user_id: 'user-456',
      reflection_id: 'reflection-789',
      artifact_type: 'visual',
      title: 'Mountain Sunset',
      description: 'A beautiful sunset',
      image_url: 'https://example.com/image.jpg',
      audio_url: null,
      text_content: null,
      metadata: { style: 'impressionist' },
      created_at: '2025-01-15T12:00:00Z',
    };

    const result = artifactRowToArtifact(row);

    expect(result).toEqual({
      id: 'artifact-123',
      userId: 'user-456',
      reflectionId: 'reflection-789',
      artifactType: 'visual',
      title: 'Mountain Sunset',
      description: 'A beautiful sunset',
      imageUrl: 'https://example.com/image.jpg',
      audioUrl: null,
      textContent: null,
      metadata: { style: 'impressionist' },
      createdAt: '2025-01-15T12:00:00Z',
    });
  });

  it('handles soundscape artifact type', () => {
    const row = {
      id: 'artifact-123',
      user_id: 'user-456',
      reflection_id: 'reflection-789',
      artifact_type: 'soundscape',
      title: 'Ocean Waves',
      description: 'Calming ocean sounds',
      image_url: null,
      audio_url: 'https://example.com/audio.mp3',
      text_content: null,
      metadata: { duration: 120 },
      created_at: '2025-01-15T12:00:00Z',
    };

    const result = artifactRowToArtifact(row);

    expect(result.artifactType).toBe('soundscape');
    expect(result.audioUrl).toBe('https://example.com/audio.mp3');
    expect(result.imageUrl).toBeNull();
  });

  it('handles poetic artifact type', () => {
    const row = {
      id: 'artifact-123',
      user_id: 'user-456',
      reflection_id: 'reflection-789',
      artifact_type: 'poetic',
      title: 'Haiku',
      description: 'A reflection poem',
      image_url: null,
      audio_url: null,
      text_content: 'The autumn leaves fall\nDrifting gently to the ground\nNature says goodbye',
      metadata: { form: 'haiku' },
      created_at: '2025-01-15T12:00:00Z',
    };

    const result = artifactRowToArtifact(row);

    expect(result.artifactType).toBe('poetic');
    expect(result.textContent).toContain('autumn leaves');
  });
});

describe('evolutionReportRowToEvolutionReport', () => {
  it('transforms database row to EvolutionReport correctly', () => {
    const row = {
      id: 'report-123',
      user_id: 'user-456',
      report_type: 'deep-pattern',
      analysis_content: 'Analysis of growth patterns...',
      patterns_identified: ['pattern1', 'pattern2', 'pattern3'],
      reflections_analyzed: 10,
      reflection_ids: ['r1', 'r2', 'r3'],
      tier: 'pro',
      word_count: 1500,
      estimated_read_time: 7,
      created_at: '2025-01-15T12:00:00Z',
    };

    const result = evolutionReportRowToEvolutionReport(row);

    expect(result).toEqual({
      id: 'report-123',
      userId: 'user-456',
      reportType: 'deep-pattern',
      analysisContent: 'Analysis of growth patterns...',
      patternsIdentified: ['pattern1', 'pattern2', 'pattern3'],
      reflectionsAnalyzed: 10,
      reflectionIds: ['r1', 'r2', 'r3'],
      tier: 'pro',
      wordCount: 1500,
      estimatedReadTime: 7,
      createdAt: '2025-01-15T12:00:00Z',
    });
  });

  it('handles growth-journey report type', () => {
    const row = {
      id: 'report-456',
      user_id: 'user-789',
      report_type: 'growth-journey',
      analysis_content: 'Your growth journey over time...',
      patterns_identified: ['growth-pattern'],
      reflections_analyzed: 25,
      reflection_ids: ['r1', 'r2', 'r3', 'r4', 'r5'],
      tier: 'unlimited',
      word_count: 3000,
      estimated_read_time: 15,
      created_at: '2025-01-20T12:00:00Z',
    };

    const result = evolutionReportRowToEvolutionReport(row);

    expect(result.reportType).toBe('growth-journey');
    expect(result.reflectionsAnalyzed).toBe(25);
  });
});

describe('clarifyPatternRowToPattern', () => {
  it('transforms database row to ClarifyPattern correctly', () => {
    const row = {
      id: 'pattern-123',
      user_id: 'user-456',
      session_id: 'session-789',
      pattern_type: 'recurring_theme',
      content: 'Work-life balance concerns',
      strength: 8,
      extracted_at: '2025-01-15T12:00:00Z',
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-01-15T12:00:00Z',
    };

    const result = clarifyPatternRowToPattern(row);

    expect(result).toEqual({
      id: 'pattern-123',
      userId: 'user-456',
      sessionId: 'session-789',
      patternType: 'recurring_theme',
      content: 'Work-life balance concerns',
      strength: 8,
      extractedAt: '2025-01-15T12:00:00Z',
      createdAt: '2025-01-15T12:00:00Z',
      updatedAt: '2025-01-15T12:00:00Z',
    });
  });

  it('handles tension pattern type', () => {
    const row = {
      id: 'pattern-456',
      user_id: 'user-456',
      session_id: 'session-789',
      pattern_type: 'tension',
      content: 'Career vs family conflict',
      strength: 7,
      extracted_at: '2025-01-15T12:00:00Z',
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-01-15T12:00:00Z',
    };

    const result = clarifyPatternRowToPattern(row);

    expect(result.patternType).toBe('tension');
  });

  it('handles potential_dream pattern type', () => {
    const row = {
      id: 'pattern-789',
      user_id: 'user-456',
      session_id: 'session-789',
      pattern_type: 'potential_dream',
      content: 'Desire to learn music',
      strength: 9,
      extracted_at: '2025-01-15T12:00:00Z',
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-01-15T12:00:00Z',
    };

    const result = clarifyPatternRowToPattern(row);

    expect(result.patternType).toBe('potential_dream');
    expect(result.strength).toBe(9);
  });

  it('handles identity_signal pattern type', () => {
    const row = {
      id: 'pattern-abc',
      user_id: 'user-456',
      session_id: 'session-789',
      pattern_type: 'identity_signal',
      content: 'Values creativity and expression',
      strength: 6,
      extracted_at: '2025-01-15T12:00:00Z',
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-01-15T12:00:00Z',
    };

    const result = clarifyPatternRowToPattern(row);

    expect(result.patternType).toBe('identity_signal');
  });

  it('handles null session_id', () => {
    const row = {
      id: 'pattern-null',
      user_id: 'user-456',
      session_id: null,
      pattern_type: 'recurring_theme',
      content: 'Global pattern without specific session',
      strength: 5,
      extracted_at: '2025-01-15T12:00:00Z',
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-01-15T12:00:00Z',
    };

    const result = clarifyPatternRowToPattern(row);

    expect(result.sessionId).toBeNull();
  });
});

// =========================================
// types/clarify.ts transformation tests
// =========================================

describe('clarifySessionRowToSession (from types/clarify)', () => {
  it('transforms database row to ClarifySession correctly', () => {
    const row = {
      id: 'session-123',
      user_id: 'user-456',
      title: 'Career Exploration',
      status: 'active',
      message_count: 15,
      dream_id: null,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T11:30:00Z',
      last_message_at: '2025-01-15T11:30:00Z',
    };

    const result = clarifySessionRowToSession(row);

    expect(result).toEqual({
      id: 'session-123',
      userId: 'user-456',
      title: 'Career Exploration',
      status: 'active',
      messageCount: 15,
      dreamId: null,
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T11:30:00Z',
      lastMessageAt: '2025-01-15T11:30:00Z',
    });
  });

  it('handles sessions with dream_id', () => {
    const row = {
      id: 'session-456',
      user_id: 'user-789',
      title: 'Dream Planning',
      status: 'completed',
      message_count: 5,
      dream_id: 'dream-abc',
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-10T10:30:00Z',
      last_message_at: '2025-01-10T10:30:00Z',
    };

    const result = clarifySessionRowToSession(row);

    expect(result.status).toBe('completed');
    expect(result.dreamId).toBe('dream-abc');
  });
});

describe('clarifyMessageRowToMessage (from types/clarify)', () => {
  it('transforms user message row correctly', () => {
    const row = {
      id: 'msg-123',
      session_id: 'session-456',
      role: 'user',
      content: 'I want to explore my career goals',
      token_count: null,
      tool_use: null,
      created_at: '2025-01-15T10:00:00Z',
    };

    const result = clarifyMessageRowToMessage(row);

    expect(result).toEqual({
      id: 'msg-123',
      sessionId: 'session-456',
      role: 'user',
      content: 'I want to explore my career goals',
      tokenCount: null,
      toolUse: null,
      createdAt: '2025-01-15T10:00:00Z',
    });
  });

  it('transforms assistant message with token count', () => {
    const row = {
      id: 'msg-456',
      session_id: 'session-789',
      role: 'assistant',
      content: 'That sounds like an important goal. Tell me more...',
      token_count: 150,
      tool_use: null,
      created_at: '2025-01-15T10:01:00Z',
    };

    const result = clarifyMessageRowToMessage(row);

    expect(result.role).toBe('assistant');
    expect(result.tokenCount).toBe(150);
  });

  it('handles tool_use data', () => {
    const toolUseData = {
      name: 'createDream',
      input: { title: 'Learn Piano', category: 'creative' },
      result: { success: true, dreamId: 'dream-123' },
    };

    const row = {
      id: 'msg-789',
      session_id: 'session-abc',
      role: 'assistant',
      content: "I've created a dream for you!",
      token_count: 200,
      tool_use: toolUseData,
      created_at: '2025-01-15T10:02:00Z',
    };

    const result = clarifyMessageRowToMessage(row);

    expect(result.toolUse).toEqual(toolUseData);
  });
});

describe('clarifyPatternRowToPattern (from types/clarify)', () => {
  it('transforms database row to ClarifyPattern correctly', () => {
    const row = {
      id: 'pattern-clarify-123',
      user_id: 'user-456',
      session_id: 'session-789',
      pattern_type: 'recurring_theme',
      content: 'Desire for creative expression',
      strength: 8,
      extracted_at: '2025-01-15T12:00:00Z',
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-01-15T12:00:00Z',
    };

    const result = clarifyPatternRowToPatternFromClarify(row);

    expect(result).toEqual({
      id: 'pattern-clarify-123',
      userId: 'user-456',
      sessionId: 'session-789',
      patternType: 'recurring_theme',
      content: 'Desire for creative expression',
      strength: 8,
      extractedAt: '2025-01-15T12:00:00Z',
      createdAt: '2025-01-15T12:00:00Z',
      updatedAt: '2025-01-15T12:00:00Z',
    });
  });
});
