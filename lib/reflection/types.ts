// lib/reflection/types.ts - Shared types for reflection feature
import type { ToneId } from '@/lib/utils/constants';

/**
 * Form data for reflection questionnaire
 */
export interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

/**
 * Dream entity for reflection selection
 */
export interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}

/**
 * View mode for reflection experience
 */
export type ViewMode = 'questionnaire' | 'output';

/**
 * Question definition for reflection form
 */
export interface ReflectionQuestion {
  id: keyof FormData;
  number: number;
  text: string;
  guide: string;
  placeholder: string;
  limit: number;
}

/**
 * Newly created reflection data (before page refresh)
 */
export interface NewReflection {
  id: string;
  content: string;
}

/**
 * Saved form state in localStorage
 */
export interface SavedFormState {
  data: FormData;
  dreamId: string;
  tone: ToneId;
  timestamp: number;
}
