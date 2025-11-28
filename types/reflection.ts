// types/reflection.ts - Reflection types

export type ReflectionTone = 'gentle' | 'intense' | 'fusion';
export type HasDate = 'yes' | 'no';

/**
 * Reflection object - Application representation
 */
export interface Reflection {
  id: string;
  userId: string;
  dreamId: string | null;
  dream: string;
  plan: string;
  hasDate: HasDate;
  dreamDate: string | null;
  relationship: string;
  offering: string;
  aiResponse: string;
  tone: ReflectionTone;
  isPremium: boolean;
  wordCount: number;
  estimatedReadTime: number;
  title: string;
  tags: string[];
  rating: number | null;
  userFeedback: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Reflection creation input (from questionnaire)
 */
export interface ReflectionCreateInput {
  dream: string;
  plan: string;
  hasDate: HasDate;
  dreamDate: string | null;
  relationship: string;
  offering: string;
  tone?: ReflectionTone;
  isPremium?: boolean;
}

/**
 * Reflection list query parameters
 */
export interface ReflectionListParams {
  page?: number;
  limit?: number;
  tone?: ReflectionTone;
  isPremium?: boolean;
  search?: string;
  sortBy?: 'created_at' | 'word_count' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Database row type (matches Supabase schema)
 */
export interface ReflectionRow {
  id: string;
  user_id: string;
  dream_id: string | null;
  dream: string;
  plan: string;
  has_date: string;
  dream_date: string | null;
  relationship: string;
  offering: string;
  ai_response: string;
  tone: string;
  is_premium: boolean;
  word_count: number;
  estimated_read_time: number;
  title: string;
  tags: string[];
  rating: number | null;
  user_feedback: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Transform database row to Reflection type
 */
export function reflectionRowToReflection(row: ReflectionRow): Reflection {
  return {
    id: row.id,
    userId: row.user_id,
    dreamId: row.dream_id,
    dream: row.dream,
    plan: row.plan,
    hasDate: row.has_date as HasDate,
    dreamDate: row.dream_date,
    relationship: row.relationship,
    offering: row.offering,
    aiResponse: row.ai_response,
    tone: row.tone as ReflectionTone,
    isPremium: row.is_premium,
    wordCount: row.word_count,
    estimatedReadTime: row.estimated_read_time,
    title: row.title,
    tags: row.tags,
    rating: row.rating,
    userFeedback: row.user_feedback,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Reflection update input
 */
export interface ReflectionUpdateInput {
  title?: string;
  tags?: string[];
}

/**
 * Reflection feedback input
 */
export interface ReflectionFeedbackInput {
  rating: number;
  feedback?: string;
}
