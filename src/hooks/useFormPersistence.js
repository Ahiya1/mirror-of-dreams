// hooks/useFormPersistence.js - Form state persistence hook

import { useState, useEffect, useCallback, useRef } from "react";
import { storageService } from "../services/storage.service";

/**
 * Form persistence hook that automatically saves and restores form state
 * @param {string} userId - User ID for scoped storage
 * @param {Object} initialData - Initial form data
 * @param {Object} options - Configuration options
 * @returns {Object} - Form state and persistence methods
 */
export const useFormPersistence = (userId, initialData = {}, options = {}) => {
  const {
    debounceMs = 1000,
    enablePersistence = true,
    clearOnSubmit = true,
    validateBeforeRestore = null,
  } = options;

  const [formData, setFormData] = useState(initialData);
  const [isRestored, setIsRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const persistTimeoutRef = useRef(null);
  const hasInitialized = useRef(false);

  /**
   * Save form state to storage with debouncing
   */
  const saveFormState = useCallback(() => {
    if (!enablePersistence || !userId) return;

    // Clear existing timeout
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    // Set up debounced save
    persistTimeoutRef.current = setTimeout(() => {
      try {
        storageService.setFormState(userId, formData);
        setLastSaved(new Date());
        console.log("Form state saved");
      } catch (error) {
        console.warn("Failed to save form state:", error);
      }
    }, debounceMs);
  }, [userId, formData, debounceMs, enablePersistence]);

  /**
   * Restore form state from storage
   */
  const restoreFormState = useCallback(() => {
    if (!enablePersistence || !userId || isRestored) return;

    try {
      const savedState = storageService.getFormState(userId);

      if (!savedState) {
        setIsRestored(true);
        return;
      }

      // Validate restored state if validator provided
      if (validateBeforeRestore && !validateBeforeRestore(savedState)) {
        console.warn("Restored form state failed validation, ignoring");
        storageService.removeFormState(userId);
        setIsRestored(true);
        return;
      }

      // Check for fresh start URL params
      const urlParams = new URLSearchParams(window.location.search);
      const isFreshStart =
        urlParams.get("fresh") === "true" || urlParams.get("new") === "true";

      if (isFreshStart) {
        console.log("Fresh start requested, ignoring saved state");
        setIsRestored(true);
        return;
      }

      // Restore form data (excluding metadata)
      const { userId: savedUserId, timestamp, ...restoreData } = savedState;

      setFormData(restoreData);
      setLastSaved(new Date(timestamp));
      setIsRestored(true);

      console.log("Form state restored");
    } catch (error) {
      console.warn("Failed to restore form state:", error);
      setIsRestored(true);
    }
  }, [userId, enablePersistence, isRestored, validateBeforeRestore]);

  /**
   * Clear saved form state
   */
  const clearFormState = useCallback(() => {
    if (!userId) return;

    try {
      storageService.removeFormState(userId);
      setLastSaved(null);
      console.log("Form state cleared");
    } catch (error) {
      console.warn("Failed to clear form state:", error);
    }
  }, [userId]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData(initialData);
    clearFormState();
  }, [initialData, clearFormState]);

  /**
   * Update a specific form field
   * @param {string} field - Field name
   * @param {any} value - Field value
   */
  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Update multiple form fields
   * @param {Object} updates - Fields to update
   */
  const updateFields = useCallback((updates) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  /**
   * Set entire form data
   * @param {Object} newData - New form data
   */
  const setFormState = useCallback((newData) => {
    setFormData(newData);
  }, []);

  /**
   * Check if form has unsaved changes
   * @returns {boolean} - Whether form has changes since last save
   */
  const hasUnsavedChanges = useCallback(() => {
    if (!lastSaved) return Object.keys(formData).length > 0;

    // Compare current state with initial state
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    return hasChanges;
  }, [formData, initialData, lastSaved]);

  /**
   * Get form field value
   * @param {string} field - Field name
   * @param {any} defaultValue - Default value if field doesn't exist
   * @returns {any} - Field value
   */
  const getField = useCallback(
    (field, defaultValue = "") => {
      return formData[field] ?? defaultValue;
    },
    [formData]
  );

  /**
   * Check if form is empty
   * @returns {boolean} - Whether form is empty
   */
  const isEmpty = useCallback(() => {
    return Object.values(formData).every(
      (value) => value === "" || value === null || value === undefined
    );
  }, [formData]);

  /**
   * Get form completion percentage
   * @param {Array} requiredFields - List of required field names
   * @returns {number} - Completion percentage (0-100)
   */
  const getCompletionPercentage = useCallback(
    (requiredFields = []) => {
      if (requiredFields.length === 0) return 0;

      const completedFields = requiredFields.filter((field) => {
        const value = formData[field];
        return value && value.toString().trim().length > 0;
      });

      return Math.round((completedFields.length / requiredFields.length) * 100);
    },
    [formData]
  );

  /**
   * Prepare form data for submission (removes empty values, trims strings)
   * @returns {Object} - Cleaned form data
   */
  const getSubmissionData = useCallback(() => {
    const cleanData = {};

    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          cleanData[key] = trimmed;
        }
      } else if (value !== null && value !== undefined) {
        cleanData[key] = value;
      }
    });

    return cleanData;
  }, [formData]);

  /**
   * Handle form submission
   * @param {Function} onSubmit - Submit handler
   * @param {Object} options - Submit options
   */
  const handleSubmit = useCallback(
    async (onSubmit, submitOptions = {}) => {
      const { clearAfterSubmit = clearOnSubmit } = submitOptions;

      try {
        const submissionData = getSubmissionData();
        const result = await onSubmit(submissionData);

        if (clearAfterSubmit) {
          clearFormState();
        }

        return result;
      } catch (error) {
        throw error;
      }
    },
    [getSubmissionData, clearOnSubmit, clearFormState]
  );

  // Initialize form persistence
  useEffect(() => {
    if (!hasInitialized.current && userId) {
      restoreFormState();
      hasInitialized.current = true;
    }
  }, [userId, restoreFormState]);

  // Auto-save form changes
  useEffect(() => {
    if (hasInitialized.current && isRestored) {
      saveFormState();
    }
  }, [formData, saveFormState, isRestored]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, []);

  // Security: Clear form states when user changes
  useEffect(() => {
    if (hasInitialized.current && userId) {
      storageService.clearAllFormStates();
      setIsRestored(false);
      hasInitialized.current = false;
    }
  }, [userId]);

  return {
    // Form state
    formData,
    isRestored,
    lastSaved,

    // Form manipulation
    updateField,
    updateFields,
    setFormState,
    resetForm,
    getField,

    // Form status
    hasUnsavedChanges,
    isEmpty,
    getCompletionPercentage,

    // Persistence
    saveFormState,
    clearFormState,
    restoreFormState,

    // Submission
    getSubmissionData,
    handleSubmit,
  };
};
