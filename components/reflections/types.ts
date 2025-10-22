/**
 * Component-specific types for reflections route
 * These will be used by sub-builders when implementing the full components
 */

import { Reflection } from '@/types';

export interface ReflectionCardProps {
  reflection: Reflection;
  onClick?: () => void;
}

export interface ReflectionsListProps {
  initialPage?: number;
  initialLimit?: number;
}

export interface ReflectionDetailProps {
  id: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilter?: (filters: ReflectionFilters) => void;
}

export interface ReflectionFilters {
  tone?: 'gentle' | 'intense' | 'fusion';
  isPremium?: boolean;
  sortBy?: 'created_at' | 'word_count' | 'rating';
  sortOrder?: 'asc' | 'desc';
}
