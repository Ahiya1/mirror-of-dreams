// types/clarify.ts - Clarify Agent types

export type ClarifyMessageRole = 'user' | 'assistant';
export type ClarifySessionStatus = 'active' | 'archived';

/**
 * Clarify Message - A single message in a conversation
 */
export interface ClarifyMessage {
  id: string;
  sessionId: string;
  createdAt: string;
  role: ClarifyMessageRole;
  content: string;
  tokenCount: number | null;
  toolUse: ClarifyToolUse | null;
}

/**
 * Tool use record for createDream function
 */
export interface ClarifyToolUse {
  name: 'createDream';
  input: {
    title: string;
    description?: string;
    category?: string;
  };
  result?: {
    dreamId: string;
    success: boolean;
  };
}

/**
 * Clarify Session - A conversation thread
 */
export interface ClarifySession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  status: ClarifySessionStatus;
  dreamId: string | null;
}

/**
 * Clarify Session with messages
 */
export interface ClarifySessionWithMessages extends ClarifySession {
  messages: ClarifyMessage[];
}

/**
 * Database row types
 */
export interface ClarifySessionRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  last_message_at: string;
  message_count: number;
  status: string;
  dream_id: string | null;
}

export interface ClarifyMessageRow {
  id: string;
  session_id: string;
  created_at: string;
  role: string;
  content: string;
  token_count: number | null;
  tool_use: any | null;
}

/**
 * Transform database row to ClarifySession
 */
export function clarifySessionRowToSession(row: ClarifySessionRow): ClarifySession {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    title: row.title,
    lastMessageAt: row.last_message_at,
    messageCount: row.message_count,
    status: row.status as ClarifySessionStatus,
    dreamId: row.dream_id,
  };
}

/**
 * Transform database row to ClarifyMessage
 */
export function clarifyMessageRowToMessage(row: ClarifyMessageRow): ClarifyMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    createdAt: row.created_at,
    role: row.role as ClarifyMessageRole,
    content: row.content,
    tokenCount: row.token_count,
    toolUse: row.tool_use as ClarifyToolUse | null,
  };
}

// =====================================================
// PATTERN TYPES (Iteration 25 - Memory Layer)
// =====================================================

/**
 * Pattern types extracted from Clarify conversations
 */
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
 * Database row type for clarify_patterns
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
