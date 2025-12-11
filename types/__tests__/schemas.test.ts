// types/__tests__/schemas.test.ts
// Tests for Zod validation schemas

import { describe, expect, test } from 'vitest';

import {
  adminCreatorAuthSchema,
  changeEmailSchema,
  changePasswordSchema,
  createArtifactSchema,
  createReflectionSchema,
  deleteAccountSchema,
  evolutionReportInputSchema,
  paymentIntentSchema,
  reflectionIdSchema,
  reflectionListSchema,
  signinSchema,
  signupSchema,
  submitFeedbackSchema,
  subscriptionCancelSchema,
  updatePreferencesSchema,
  updateProfileSchema,
  updateReflectionSchema,
} from '../schemas';

// ==================================================
// User Schemas
// ==================================================

describe('signupSchema', () => {
  describe('valid inputs', () => {
    test('should accept valid signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBe('SecurePass123');
        expect(result.data.name).toBe('Test User');
        expect(result.data.language).toBe('en'); // Default value
      }
    });

    test('should accept valid signup with explicit language', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
        language: 'he',
      };

      const result = signupSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.language).toBe('he');
      }
    });

    test('should accept valid signup with English language', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
        language: 'en',
      };

      const result = signupSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('email validation', () => {
    test('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePass123',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    test('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'SecurePass123',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    test('should reject email without domain', () => {
      const invalidData = {
        email: 'test@',
        password: 'SecurePass123',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('password validation', () => {
    test('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Short1A',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    test('should reject password without uppercase letter', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
        expect(result.error.issues[0].message).toBe(
          'Password must contain at least one uppercase letter'
        );
      }
    });

    test('should reject password without lowercase letter', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'PASSWORD123',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
        expect(result.error.issues[0].message).toBe(
          'Password must contain at least one lowercase letter'
        );
      }
    });

    test('should reject password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'PasswordABC',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
        expect(result.error.issues[0].message).toBe('Password must contain at least one number');
      }
    });

    test('should accept password meeting all requirements', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password1',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('should accept long password with complexity', () => {
      const validData = {
        email: 'test@example.com',
        password: 'AVeryLongAndSecurePassword123!@#',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('name validation', () => {
    test('should reject empty name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: '',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    test('should accept single character name', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'X',
      };

      const result = signupSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('language validation', () => {
    test('should reject invalid language', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
        language: 'fr',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});

describe('signinSchema', () => {
  test('should accept valid signin data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'anypassword',
    };

    const result = signinSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject invalid email', () => {
    const invalidData = {
      email: 'not-valid',
      password: 'password',
    };

    const result = signinSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should reject missing password', () => {
    const invalidData = {
      email: 'test@example.com',
    };

    const result = signinSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  test('should accept valid profile update', () => {
    const validData = {
      name: 'New Name',
      language: 'he',
    };

    const result = updateProfileSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept partial update (name only)', () => {
    const validData = {
      name: 'New Name',
    };

    const result = updateProfileSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept partial update (language only)', () => {
    const validData = {
      language: 'en',
    };

    const result = updateProfileSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept empty object', () => {
    const validData = {};

    const result = updateProfileSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject empty name', () => {
    const invalidData = {
      name: '',
    };

    const result = updateProfileSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  test('should accept valid password change', () => {
    const validData = {
      currentPassword: 'oldPassword',
      newPassword: 'NewPassword1',
    };

    const result = changePasswordSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject new password not meeting complexity requirements', () => {
    const invalidData = {
      currentPassword: 'oldPassword',
      newPassword: 'short1',
    };

    const result = changePasswordSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('newPassword');
    }
  });
});

describe('deleteAccountSchema', () => {
  test('should accept valid delete account request', () => {
    const validData = {
      password: 'myPassword',
      confirmEmail: 'user@example.com',
    };

    const result = deleteAccountSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject invalid confirm email', () => {
    const invalidData = {
      password: 'myPassword',
      confirmEmail: 'not-an-email',
    };

    const result = deleteAccountSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});

describe('changeEmailSchema', () => {
  test('should accept valid email change request', () => {
    const validData = {
      newEmail: 'newemail@example.com',
      currentPassword: 'myPassword',
    };

    const result = changeEmailSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject invalid new email', () => {
    const invalidData = {
      newEmail: 'invalid',
      currentPassword: 'myPassword',
    };

    const result = changeEmailSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address');
    }
  });
});

describe('updatePreferencesSchema', () => {
  test('should accept valid preferences update', () => {
    const validData = {
      notification_email: true,
      reflection_reminders: 'daily',
      evolution_email: false,
      marketing_emails: false,
      default_tone: 'gentle',
      show_character_counter: true,
      reduce_motion_override: true,
      analytics_opt_in: true,
    };

    const result = updatePreferencesSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept partial preferences update', () => {
    const validData = {
      default_tone: 'intense',
    };

    const result = updatePreferencesSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept null for reduce_motion_override', () => {
    const validData = {
      reduce_motion_override: null,
    };

    const result = updatePreferencesSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject invalid reflection_reminders value', () => {
    const invalidData = {
      reflection_reminders: 'monthly',
    };

    const result = updatePreferencesSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should reject invalid tone', () => {
    const invalidData = {
      default_tone: 'aggressive',
    };

    const result = updatePreferencesSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});

// ==================================================
// Reflection Schemas
// ==================================================

describe('createReflectionSchema', () => {
  const validReflection = {
    dreamId: '550e8400-e29b-41d4-a716-446655440000',
    dream: 'This is my dream content that is at least 10 characters',
    plan: 'This is my plan content that is at least 10 characters',
    relationship: 'This is my relationship content',
    offering: 'This is my offering content',
  };

  test('should accept valid reflection', () => {
    const result = createReflectionSchema.safeParse(validReflection);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tone).toBe('fusion'); // Default
      expect(result.data.isPremium).toBe(false); // Default
    }
  });

  test('should accept reflection with explicit tone', () => {
    const data = {
      ...validReflection,
      tone: 'gentle',
    };

    const result = createReflectionSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tone).toBe('gentle');
    }
  });

  test('should reject invalid dreamId (not UUID)', () => {
    const invalidData = {
      ...validReflection,
      dreamId: 'not-a-uuid',
    };

    const result = createReflectionSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should reject empty dream content', () => {
    const invalidData = {
      ...validReflection,
      dream: '',
    };

    const result = createReflectionSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should reject dream content exceeding max length', () => {
    const invalidData = {
      ...validReflection,
      dream: 'x'.repeat(3201), // Max is 3200
    };

    const result = createReflectionSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should accept dream content at max length', () => {
    const validData = {
      ...validReflection,
      dream: 'x'.repeat(3200),
    };

    const result = createReflectionSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject invalid tone', () => {
    const invalidData = {
      ...validReflection,
      tone: 'calm',
    };

    const result = createReflectionSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should accept all valid tones', () => {
    const tones = ['gentle', 'intense', 'fusion'];

    tones.forEach((tone) => {
      const data = { ...validReflection, tone };
      const result = createReflectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe('reflectionListSchema', () => {
  test('should use defaults when no options provided', () => {
    const result = reflectionListSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe('created_at');
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  test('should accept valid pagination options', () => {
    const validData = {
      page: 5,
      limit: 50,
    };

    const result = reflectionListSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject page less than 1', () => {
    const invalidData = {
      page: 0,
    };

    const result = reflectionListSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should reject limit greater than 100', () => {
    const invalidData = {
      limit: 101,
    };

    const result = reflectionListSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should accept valid sort options', () => {
    const validData = {
      sortBy: 'word_count',
      sortOrder: 'asc',
    };

    const result = reflectionListSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept filter options', () => {
    const validData = {
      tone: 'gentle',
      isPremium: true,
      search: 'dream',
    };

    const result = reflectionListSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});

describe('updateReflectionSchema', () => {
  test('should accept valid update', () => {
    const validData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'New Title',
      tags: ['dream', 'growth'],
    };

    const result = updateReflectionSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject invalid UUID', () => {
    const invalidData = {
      id: 'not-uuid',
    };

    const result = updateReflectionSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should accept empty tags array', () => {
    const validData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tags: [],
    };

    const result = updateReflectionSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});

describe('submitFeedbackSchema', () => {
  test('should accept valid feedback', () => {
    const validData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      rating: 8,
      feedback: 'Great reflection!',
    };

    const result = submitFeedbackSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept feedback without optional message', () => {
    const validData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
    };

    const result = submitFeedbackSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject rating below 1', () => {
    const invalidData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      rating: 0,
    };

    const result = submitFeedbackSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should reject rating above 10', () => {
    const invalidData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      rating: 11,
    };

    const result = submitFeedbackSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should accept boundary ratings (1 and 10)', () => {
    const validData1 = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      rating: 1,
    };
    const validData10 = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      rating: 10,
    };

    expect(submitFeedbackSchema.safeParse(validData1).success).toBe(true);
    expect(submitFeedbackSchema.safeParse(validData10).success).toBe(true);
  });
});

describe('reflectionIdSchema', () => {
  test('should accept valid UUID', () => {
    const validData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = reflectionIdSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject invalid UUID', () => {
    const invalidData = {
      id: '12345',
    };

    const result = reflectionIdSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});

// ==================================================
// Evolution Report Schemas
// ==================================================

describe('evolutionReportInputSchema', () => {
  test('should accept valid report type', () => {
    const validData = {
      reportType: 'deep-pattern',
    };

    const result = evolutionReportInputSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept growth-journey report type', () => {
    const validData = {
      reportType: 'growth-journey',
    };

    const result = evolutionReportInputSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept empty object (optional field)', () => {
    const validData = {};

    const result = evolutionReportInputSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject invalid report type', () => {
    const invalidData = {
      reportType: 'invalid-type',
    };

    const result = evolutionReportInputSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});

// ==================================================
// Artifact Schemas
// ==================================================

describe('createArtifactSchema', () => {
  test('should accept valid artifact creation', () => {
    const validData = {
      reflectionId: '550e8400-e29b-41d4-a716-446655440000',
      artifactType: 'visual',
    };

    const result = createArtifactSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept all artifact types', () => {
    const types = ['visual', 'soundscape', 'poetic'];

    types.forEach((artifactType) => {
      const data = {
        reflectionId: '550e8400-e29b-41d4-a716-446655440000',
        artifactType,
      };
      const result = createArtifactSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  test('should accept optional title and description', () => {
    const validData = {
      reflectionId: '550e8400-e29b-41d4-a716-446655440000',
      artifactType: 'poetic',
      title: 'My Poem',
      description: 'A beautiful reflection',
    };

    const result = createArtifactSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject invalid artifact type', () => {
    const invalidData = {
      reflectionId: '550e8400-e29b-41d4-a716-446655440000',
      artifactType: 'audio',
    };

    const result = createArtifactSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});

// ==================================================
// Payment Schemas
// ==================================================

describe('paymentIntentSchema', () => {
  test('should accept valid payment intent', () => {
    const validData = {
      tier: 'essential',
      period: 'monthly',
    };

    const result = paymentIntentSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept all tier and period combinations', () => {
    const tiers = ['essential', 'premium'];
    const periods = ['monthly', 'yearly'];

    tiers.forEach((tier) => {
      periods.forEach((period) => {
        const data = { tier, period };
        const result = paymentIntentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  test('should reject invalid tier', () => {
    const invalidData = {
      tier: 'free',
      period: 'monthly',
    };

    const result = paymentIntentSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  test('should reject invalid period', () => {
    const invalidData = {
      tier: 'essential',
      period: 'weekly',
    };

    const result = paymentIntentSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});

describe('subscriptionCancelSchema', () => {
  test('should accept with reason', () => {
    const validData = {
      reason: 'Too expensive',
    };

    const result = subscriptionCancelSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should accept without reason', () => {
    const validData = {};

    const result = subscriptionCancelSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});

// ==================================================
// Admin Schemas
// ==================================================

describe('adminCreatorAuthSchema', () => {
  test('should accept valid creator secret', () => {
    const validData = {
      creatorSecret: 'my-secret-key',
    };

    const result = adminCreatorAuthSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  test('should reject missing creator secret', () => {
    const invalidData = {};

    const result = adminCreatorAuthSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});
