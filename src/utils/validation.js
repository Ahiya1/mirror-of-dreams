// utils/validation.js - Form validation utilities

import { FORM_VALIDATION, QUESTION_LIMITS } from "./constants";

/**
 * Validates form data for reflection submission
 * @param {Object} formData - The form data to validate
 * @returns {Object} - { isValid: boolean, errors: string[], field?: string }
 */
export const validateReflectionForm = (formData) => {
  const errors = [];
  let firstInvalidField = null;

  // Check required fields
  for (const field of FORM_VALIDATION.REQUIRED_FIELDS) {
    if (!formData[field] || formData[field].trim().length === 0) {
      errors.push(`${getFieldDisplayName(field)} is required`);
      if (!firstInvalidField) firstInvalidField = field;
    }
  }

  // Check minimum lengths
  Object.entries(FORM_VALIDATION.MIN_LENGTHS).forEach(([field, minLength]) => {
    const value = formData[field];
    if (value && value.trim().length > 0 && value.trim().length < minLength) {
      errors.push(
        `${getFieldDisplayName(field)} must be at least ${minLength} characters`
      );
      if (!firstInvalidField) firstInvalidField = field;
    }
  });

  // Check maximum lengths
  Object.entries(QUESTION_LIMITS).forEach(([field, maxLength]) => {
    const value = formData[field];
    if (value && value.length > maxLength) {
      errors.push(
        `${getFieldDisplayName(field)} cannot exceed ${maxLength} characters`
      );
      if (!firstInvalidField) firstInvalidField = field;
    }
  });

  // Special validation for hasDate field
  if (formData.hasDate === "yes" && !formData.dreamDate) {
    errors.push("Dream date is required when you have set a date");
    if (!firstInvalidField) firstInvalidField = "dreamDate";
  }

  // Validate dream date format if provided
  if (formData.dreamDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dreamDate)) {
      errors.push("Dream date must be in valid format");
      if (!firstInvalidField) firstInvalidField = "dreamDate";
    } else {
      // Check if date is not in the past (optional validation)
      const selectedDate = new Date(formData.dreamDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        // Note: This might be intentional, so we could make this a warning instead
        // errors.push('Dream date should be in the future');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: firstInvalidField,
  };
};

/**
 * Validates individual field in real-time
 * @param {string} field - Field name
 * @param {string} value - Field value
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export const validateField = (field, value) => {
  // Check if field is required
  if (FORM_VALIDATION.REQUIRED_FIELDS.includes(field)) {
    if (!value || value.trim().length === 0) {
      return {
        isValid: false,
        error: `${getFieldDisplayName(field)} is required`,
      };
    }
  }

  // Check minimum length
  const minLength = FORM_VALIDATION.MIN_LENGTHS[field];
  if (
    minLength &&
    value &&
    value.trim().length > 0 &&
    value.trim().length < minLength
  ) {
    return {
      isValid: false,
      error: `Minimum ${minLength} characters required`,
    };
  }

  // Check maximum length
  const maxLength = QUESTION_LIMITS[field];
  if (maxLength && value && value.length > maxLength) {
    return {
      isValid: false,
      error: `Maximum ${maxLength} characters allowed`,
    };
  }

  return { isValid: true };
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[], strength: string }
 */
export const validatePassword = (password) => {
  const errors = [];
  let strength = "weak";

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (password && password.length >= 8) {
    strength = "medium";
  }

  if (
    password &&
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  ) {
    strength = "strong";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Sanitizes user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Validates tone selection
 * @param {string} tone - Tone to validate
 * @returns {boolean} - Whether tone is valid
 */
export const isValidTone = (tone) => {
  return ["fusion", "gentle", "intense"].includes(tone);
};

/**
 * Gets display name for form fields
 * @param {string} field - Field name
 * @returns {string} - Display name
 */
const getFieldDisplayName = (field) => {
  const displayNames = {
    dream: "Dream",
    plan: "Plan",
    hasDate: "Date status",
    dreamDate: "Dream date",
    relationship: "Relationship with dream",
    offering: "What you're willing to give",
  };

  return displayNames[field] || field;
};

/**
 * Validates form state before persistence
 * @param {Object} formState - Form state to validate
 * @returns {boolean} - Whether state is valid for persistence
 */
export const isValidFormState = (formState) => {
  if (!formState || typeof formState !== "object") return false;

  // Check for required properties
  const requiredProps = ["userId", "timestamp"];
  for (const prop of requiredProps) {
    if (!formState[prop]) return false;
  }

  // Check timestamp age
  const age = Date.now() - formState.timestamp;
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours

  return age <= maxAge;
};

/**
 * Character count utilities
 */
export const getCharacterStats = (value, maxLength) => {
  const length = value ? value.length : 0;
  const percentage = (length / maxLength) * 100;

  return {
    length,
    maxLength,
    percentage: Math.min(percentage, 100),
    isApproachingLimit: length >= maxLength * 0.8,
    isAtLimit: length >= maxLength,
    remaining: Math.max(0, maxLength - length),
  };
};
