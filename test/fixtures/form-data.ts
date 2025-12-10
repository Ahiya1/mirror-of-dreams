// test/fixtures/form-data.ts - Form data test fixtures for reflection feature

import type { FormData } from '@/lib/reflection/types';

/**
 * Empty form data - default state for new reflections
 */
export const EMPTY_FORM_DATA: FormData = {
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
};

/**
 * Creates mock form data with sensible defaults
 * Use this factory for tests that need complete form data
 *
 * @param overrides - Partial form data to override defaults
 * @returns Complete FormData object
 *
 * @example
 * // Complete form data
 * const data = createMockFormData();
 *
 * // With specific overrides
 * const data = createMockFormData({ dream: 'My custom dream' });
 */
export const createMockFormData = (overrides: Partial<FormData> = {}): FormData => ({
  dream: 'My dream is to learn guitar and play my favorite songs',
  plan: 'I will practice 30 minutes daily and take weekly lessons',
  relationship: 'This dream connects to my creative expression and inner peace',
  offering: 'I am willing to sacrifice TV time and invest in equipment',
  ...overrides,
});

/**
 * Partially filled form - typical in-progress state
 * Only the first question has content
 */
export const partialFormData: FormData = {
  dream: 'Started writing about my dream',
  plan: '',
  relationship: '',
  offering: '',
};

/**
 * Minimal valid form - bare minimum content to pass validation
 * Each field has exactly 1 character
 */
export const minimalFormData: FormData = {
  dream: 'a',
  plan: 'b',
  relationship: 'c',
  offering: 'd',
};

/**
 * Long content form - for testing character limits
 * Each field has 500 characters
 */
export const longContentFormData: FormData = {
  dream: 'A'.repeat(500),
  plan: 'B'.repeat(500),
  relationship: 'C'.repeat(500),
  offering: 'D'.repeat(500),
};

/**
 * Whitespace-only form - for testing trim validation
 * Fields contain only spaces which should be treated as empty
 */
export const whitespaceOnlyFormData: FormData = {
  dream: '   ',
  plan: '\t\t',
  relationship: '\n\n',
  offering: ' \t \n ',
};

/**
 * Form with special characters - for testing encoding/display
 */
export const specialCharFormData: FormData = {
  dream: 'My dream has \'quotes\', "double quotes", and <special> chars & symbols',
  plan: 'Unicode: \u2728 sparkles, \u{1F680} rocket, \u{1F3A8} art',
  relationship: 'Newlines\nand\ntabs\there',
  offering: 'Emojis are part of my offering \u{1F64F}',
};

/**
 * Form progress scenarios - for step validation testing
 */
export const formProgressScenarios = {
  // No progress - all empty
  noProgress: EMPTY_FORM_DATA,

  // Question 1 done
  q1Complete: {
    dream: 'My dream is clear',
    plan: '',
    relationship: '',
    offering: '',
  } as FormData,

  // Questions 1-2 done
  q2Complete: {
    dream: 'My dream is clear',
    plan: 'My plan is set',
    relationship: '',
    offering: '',
  } as FormData,

  // Questions 1-3 done
  q3Complete: {
    dream: 'My dream is clear',
    plan: 'My plan is set',
    relationship: 'My relationship is defined',
    offering: '',
  } as FormData,

  // All questions done
  allComplete: createMockFormData(),
};
