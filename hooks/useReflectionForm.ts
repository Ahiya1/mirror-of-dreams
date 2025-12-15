'use client';

import { useState, useEffect, useCallback } from 'react';

import type { FormData, Dream, SavedFormState } from '@/lib/reflection/types';
import type { ToneId } from '@/lib/utils/constants';

import { useToast } from '@/contexts/ToastContext';
import { STORAGE_KEY, STORAGE_EXPIRY_MS, EMPTY_FORM_DATA } from '@/lib/reflection/constants';

interface UseReflectionFormOptions {
  dreams: Dream[] | undefined;
  initialDreamId?: string;
}

interface UseReflectionFormReturn {
  // Form data
  formData: FormData;
  handleFieldChange: (field: keyof FormData, value: string) => void;

  // Dream selection
  selectedDreamId: string;
  selectedDream: Dream | null;
  handleDreamSelect: (dreamId: string) => void;

  // Tone
  selectedTone: ToneId;
  setSelectedTone: (tone: ToneId) => void;

  // Validation
  validateForm: () => boolean;

  // Reset
  clearForm: () => void;
}

/**
 * Hook for managing reflection form state, validation, and persistence
 *
 * Features:
 * - Form data state with localStorage persistence
 * - Dream selection with auto-populate
 * - Tone selection
 * - Validation with toast notifications
 * - Clear/reset functionality
 */
export function useReflectionForm({
  dreams,
  initialDreamId = '',
}: UseReflectionFormOptions): UseReflectionFormReturn {
  const toast = useToast();

  const [selectedDreamId, setSelectedDreamId] = useState<string>(initialDreamId);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneId>('fusion');
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM_DATA);

  // Update selected dream when dreams load or selection changes
  useEffect(() => {
    if (dreams && selectedDreamId) {
      const dream = dreams.find((d) => d.id === selectedDreamId);
      if (dream) {
        setSelectedDream(dream);
      }
    }
  }, [dreams, selectedDreamId]);

  // Load saved form data from localStorage on mount
  // URL parameter (initialDreamId) takes precedence over localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const {
          data,
          timestamp,
          dreamId: savedDreamId,
          tone: savedTone,
        }: SavedFormState = JSON.parse(saved);
        if (Date.now() - timestamp < STORAGE_EXPIRY_MS) {
          setFormData(data);
          // Only restore saved dreamId if no URL parameter was provided
          if (savedDreamId && !initialDreamId) setSelectedDreamId(savedDreamId);
          if (savedTone) setSelectedTone(savedTone);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [initialDreamId]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasContent = Object.values(formData).some((v) => v.trim().length > 0);
    if (hasContent || selectedDreamId) {
      try {
        const state: SavedFormState = {
          data: formData,
          dreamId: selectedDreamId,
          tone: selectedTone,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [formData, selectedDreamId, selectedTone]);

  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDreamSelect = useCallback(
    (dreamId: string) => {
      const dream = dreams?.find((d) => d.id === dreamId);
      setSelectedDream(dream || null);
      setSelectedDreamId(dreamId);
    },
    [dreams]
  );

  const validateForm = useCallback((): boolean => {
    if (!selectedDreamId) {
      toast.warning('Please select a dream');
      return false;
    }
    if (!formData.dream.trim()) {
      toast.warning('Please elaborate on your dream');
      return false;
    }
    if (!formData.plan.trim()) {
      toast.warning('Please describe your plan');
      return false;
    }
    if (!formData.relationship.trim()) {
      toast.warning('Please share your relationship with this dream');
      return false;
    }
    if (!formData.offering.trim()) {
      toast.warning("Please describe what you're willing to give");
      return false;
    }
    return true;
  }, [selectedDreamId, formData, toast]);

  const clearForm = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(EMPTY_FORM_DATA);
    setSelectedDreamId('');
    setSelectedDream(null);
    setSelectedTone('fusion');
  }, []);

  return {
    formData,
    handleFieldChange,
    selectedDreamId,
    selectedDream,
    handleDreamSelect,
    selectedTone,
    setSelectedTone,
    validateForm,
    clearForm,
  };
}
