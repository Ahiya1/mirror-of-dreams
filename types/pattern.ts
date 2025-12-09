// types/pattern.ts - Clarify pattern types

export type PatternType = 'recurring_theme' | 'tension' | 'potential_dream' | 'identity_signal';

/**
 * Clarify Pattern - Extracted insight from conversations
 */
export interface ClarifyPattern {
  id: string;
  userId: string;
  sessionId: string | null;
  patternType: PatternType;
  content: string;
  strength: number;
  extractedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Database row type
 */
export interface ClarifyPatternRow {
  id: string;
  user_id: string;
  session_id: string | null;
  pattern_type: string;
  content: string;
  strength: number;
  extracted_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Transform database row to ClarifyPattern
 */
export function clarifyPatternRowToPattern(row: ClarifyPatternRow): ClarifyPattern {
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    patternType: row.pattern_type as PatternType,
    content: row.content,
    strength: row.strength,
    extractedAt: row.extracted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Pattern extraction result from Haiku
 */
export interface ExtractedPattern {
  type: PatternType;
  content: string;
  strength: number;
}

/**
 * Consolidation result
 */
export interface ConsolidationResult {
  userId: string;
  patternsExtracted: number;
  messagesProcessed: number;
  success: boolean;
  error?: string;
}
