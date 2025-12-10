'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import type { ViewMode, NewReflection } from '@/lib/reflection/types';

interface UseReflectionViewModeReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  reflectionId: string | null;
  dreamIdFromUrl: string | null;
  newReflection: NewReflection | null;
  setNewReflection: (ref: NewReflection | null) => void;
  resetToQuestionnaire: () => void;
}

/**
 * Hook for managing reflection view mode and URL synchronization
 *
 * Features:
 * - View mode state (questionnaire/output)
 * - URL parameter sync (id, dreamId)
 * - New reflection handling (show directly without navigation)
 * - Reset functionality
 */
export function useReflectionViewMode(): UseReflectionViewModeReturn {
  const searchParams = useSearchParams();
  const reflectionId = searchParams.get('id');
  const dreamIdFromUrl = searchParams.get('dreamId');

  const initialMode: ViewMode = reflectionId ? 'output' : 'questionnaire';

  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [newReflection, setNewReflection] = useState<NewReflection | null>(null);

  // Sync viewMode with URL params (handles direct URL access and browser navigation)
  useEffect(() => {
    // Don't sync if we just created a reflection (newReflection exists)
    if (newReflection) return;
    const targetMode: ViewMode = reflectionId ? 'output' : 'questionnaire';
    if (viewMode !== targetMode) {
      setViewMode(targetMode);
    }
  }, [reflectionId, newReflection, viewMode]);

  const resetToQuestionnaire = useCallback(() => {
    setViewMode('questionnaire');
    setNewReflection(null);
    window.history.replaceState(null, '', '/reflection');
  }, []);

  return {
    viewMode,
    setViewMode,
    reflectionId,
    dreamIdFromUrl,
    newReflection,
    setNewReflection,
    resetToQuestionnaire,
  };
}
