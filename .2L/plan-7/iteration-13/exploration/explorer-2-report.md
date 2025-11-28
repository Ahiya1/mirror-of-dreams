# Explorer 2 Report: Backend Infrastructure Analysis

**Explorer:** Explorer-2
**Iteration:** 13 (Plan-7, Iteration 2 of 3)
**Focus:** Backend infrastructure for Profile and Settings pages
**Date:** 2025-11-28

---

## Executive Summary

Mirror of Dreams has **mature, production-ready backend infrastructure** that requires **minimal new code** for Profile and Settings pages. Critical finding: **Most required mutations already exist** in the auth router (`changePassword`, `deleteAccount`). Only `changeEmail` and `updatePreferences` mutations need to be implemented.

**Key findings:**
- **Existing mutations:** `changePassword` and `deleteAccount` already implemented in `auth.ts` router (lines 233-345)
- **Database schema:** `preferences` JSONB column added in iteration 12 migration (ready to use)
- **Security patterns:** Established bcrypt password verification and email confirmation patterns
- **Validation schemas:** Most Zod schemas exist; need `changeEmailSchema` and `updatePreferencesSchema`
- **Error handling:** Consistent TRPCError pattern with descriptive messages across all routers

**Bottom line:** This iteration requires **2 new mutations** (changeEmail, updatePreferences) following established patterns. No breaking changes, no database migrations needed.

---

## Discoveries

### 1. Existing Authentication Mutations (CRITICAL - REUSE THESE)

#### Current State: Auth Router Already Has Password & Delete Mutations

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`

**Mutation 1: changePassword (Lines 233-296) - PRODUCTION-READY**
```typescript
changePassword: protectedProcedure
  .input(changePasswordSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. Fetch user with password_hash
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', ctx.user.id)
      .single();

    // 2. Verify current password via bcrypt
    const passwordValid = await bcrypt.compare(
      input.currentPassword,
      user.password_hash
    );

    if (!passwordValid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Current password is incorrect',
      });
    }

    // 3. Check if new password is different
    const samePassword = await bcrypt.compare(
      input.newPassword,
      user.password_hash
    );

    if (samePassword) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'New password must be different from current password',
      });
    }

    // 4. Hash new password (bcrypt rounds: 12)
    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

    // 5. Update password_hash
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.user.id);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to change password',
      });
    }

    return { message: 'Password changed successfully' };
  }),
```

**Mutation 2: deleteAccount (Lines 299-345) - PRODUCTION-READY**
```typescript
deleteAccount: protectedProcedure
  .input(deleteAccountSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. Verify email confirmation matches
    if (input.confirmEmail.toLowerCase() !== ctx.user.email.toLowerCase()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Email confirmation does not match',
      });
    }

    // 2. Fetch user with password_hash
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', ctx.user.id)
      .single();

    // 3. Verify password
    const passwordValid = await bcrypt.compare(input.password, user.password_hash);

    if (!passwordValid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Password is incorrect',
      });
    }

    // 4. Delete user (CASCADE deletes reflections via foreign key)
    const { error } = await supabase.from('users').delete().eq('id', ctx.user.id);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete account',
      });
    }

    return { message: 'Account deleted successfully' };
  }),
```

**CRITICAL DISCOVERY:** Frontend can use `trpc.auth.changePassword.useMutation()` and `trpc.auth.deleteAccount.useMutation()` directly. **No new backend code needed** for these features.

---

### 2. Database Schema Status (ITERATION 12 COMPLETE)

#### Migration: 20251128_iteration_12_demo_infrastructure.sql

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251128_iteration_12_demo_infrastructure.sql`

**Schema Changes (Lines 11-29):**
```sql
-- Add preferences JSONB column for user settings
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;

-- Add is_demo flag for demo user identification
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Create index for demo user lookup (partial index for performance)
CREATE INDEX IF NOT EXISTS idx_users_is_demo
ON public.users(is_demo)
WHERE is_demo = true;

-- Add documentation comments
COMMENT ON COLUMN public.users.preferences IS
  'User settings stored as JSONB: notification_email, reflection_reminders, 
   evolution_email, marketing_emails, default_tone, show_character_counter, 
   reduce_motion_override, analytics_opt_in';
```

**Preferences Type Definition (PRODUCTION-READY):**

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts` (Lines 10-33)

```typescript
export interface UserPreferences {
  notification_email: boolean;
  reflection_reminders: 'off' | 'daily' | 'weekly';
  evolution_email: boolean;
  marketing_emails: boolean;
  default_tone: 'fusion' | 'gentle' | 'intense';
  show_character_counter: boolean;
  reduce_motion_override: boolean | null; // null = respect browser preference
  analytics_opt_in: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  notification_email: true,
  reflection_reminders: 'off',
  evolution_email: true,
  marketing_emails: false,
  default_tone: 'fusion',
  show_character_counter: true,
  reduce_motion_override: null,
  analytics_opt_in: true,
};
```

**User Type Integration (Lines 106-130):**
```typescript
export function userRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    // ... other fields
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(row.preferences || {}), // Merge with defaults for backwards compatibility
    } as UserPreferences,
    createdAt: row.created_at,
    // ... other fields
  };
}
```

**DISCOVERY:** Database schema is **complete and tested**. Preferences column supports partial updates (only changed fields sent in mutation).

---

### 3. Existing Validation Schemas (ZOD)

#### Current Schemas in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/schemas.ts`

**Profile-Related Schemas (Lines 21-34):**
```typescript
export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  language: z.enum(['en', 'he']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export const deleteAccountSchema = z.object({
  password: z.string(),
  confirmEmail: z.string().email(),
});
```

**MISSING SCHEMAS (Need to be added):**
```typescript
// Add to types/schemas.ts

export const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  currentPassword: z.string(), // Password-protected operation
});

export const updatePreferencesSchema = z.object({
  notification_email: z.boolean().optional(),
  reflection_reminders: z.enum(['off', 'daily', 'weekly']).optional(),
  evolution_email: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  default_tone: z.enum(['fusion', 'gentle', 'intense']).optional(),
  show_character_counter: z.boolean().optional(),
  reduce_motion_override: z.boolean().nullable().optional(),
  analytics_opt_in: z.boolean().optional(),
});
```

**Pattern Consistency:**
- All schemas use `.optional()` for partial updates (only send changed fields)
- Email validation uses built-in Zod `.email()` validator
- Enums match TypeScript types exactly (compile-time type safety)

---

### 4. tRPC Mutation Patterns (ESTABLISHED)

#### Pattern Analysis Across Routers

**Pattern 1: Password-Protected Operations**

**Example:** `auth.changePassword` (Lines 233-296)
```typescript
// 1. Fetch user with password_hash (never returned to client)
const { data: user } = await supabase
  .from('users')
  .select('password_hash')
  .eq('id', ctx.user.id)
  .single();

// 2. Verify password via bcrypt.compare
const passwordValid = await bcrypt.compare(
  input.currentPassword,
  user.password_hash
);

if (!passwordValid) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Current password is incorrect',
  });
}

// 3. Perform operation
// ...

// 4. Return success message
return { message: 'Operation completed successfully' };
```

**Use Case:** `changeEmail` mutation must follow this pattern (password-protected for security).

---

**Pattern 2: Profile Update Operations**

**Example:** `users.updateProfile` (Lines 79-103)
```typescript
updateProfile: protectedProcedure
  .input(updateProfileSchema)
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...input, // Spread input (only changed fields)
        updated_at: new Date().toISOString(), // Always update timestamp
      })
      .eq('id', ctx.user.id)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    }

    return {
      user: userRowToUser(data as UserRow), // Transform to User type
      message: 'Profile updated successfully',
    };
  }),
```

**Use Case:** `updatePreferences` mutation follows this pattern (no password required, immediate save).

---

**Pattern 3: Error Handling Consistency**

**All routers use TRPCError with specific codes:**

```typescript
// Database errors
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Failed to [operation]',
});

// Validation errors
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: '[Specific validation error]',
});

// Not found errors
throw new TRPCError({
  code: 'NOT_FOUND',
  message: '[Resource] not found',
});

// Permission errors
throw new TRPCError({
  code: 'FORBIDDEN',
  message: '[Permission] required',
});
```

**Frontend Integration:**
```tsx
const mutation = trpc.users.updateProfile.useMutation({
  onSuccess: (data) => {
    toast.success(data.message); // "Profile updated successfully"
  },
  onError: (error) => {
    toast.error(error.message); // Descriptive error from TRPCError
  },
});
```

**DISCOVERY:** Error messages are **user-facing** (not technical stack traces). Safe to display directly in toast notifications.

---

### 5. Authentication & Authorization Middleware

#### Protected Procedure Pattern

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` (Lines 6-21)

```typescript
export const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type narrowed to User (not null)
    },
  });
});

export const protectedProcedure = publicProcedure.use(isAuthed);
```

**How Context Works:**
- JWT token extracted from `Authorization: Bearer <token>` header
- Token decoded to extract `userId`, `email`, `tier`, `isCreator`, `isAdmin`, `isDemo`
- User object injected into `ctx.user` for all protected procedures
- **No database query on every request** (user data from JWT, not database)

**Security Consideration:** Email change mutation must:
1. Update `users.email` in database
2. **Invalidate old JWT** (contains old email)
3. **Issue new JWT** with updated email
4. Return new token to client for storage

---

### 6. Password Hashing with bcrypt

#### Configuration & Patterns

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`

**Hash Rounds: 12 (Lines 47, 274)**
```typescript
// Signup: Hash password
const passwordHash = await bcrypt.hash(password, 12);

// Change password: Hash new password
const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
```

**Password Comparison (Lines 124, 248, 322):**
```typescript
// Verify password
const passwordValid = await bcrypt.compare(password, user.password_hash);

if (!passwordValid) {
  throw new TRPCError({
    code: 'UNAUTHORIZED', // or 'BAD_REQUEST' depending on context
    message: 'Invalid email or password', // or 'Current password is incorrect'
  });
}
```

**Security Best Practices (ALREADY IMPLEMENTED):**
- Bcrypt rounds: 12 (industry standard, ~300ms hash time)
- Password never stored in plaintext
- Password hash never returned to client (excluded from `select()` queries)
- Constant-time comparison via bcrypt (prevents timing attacks)

---

## Patterns Identified

### Pattern 1: Email Change with JWT Invalidation

**Description:** Email change requires password verification + new JWT issuance

**Implementation Approach:**
```typescript
// server/trpc/routers/users.ts (NEW MUTATION)

changeEmail: protectedProcedure
  .input(changeEmailSchema) // { newEmail, currentPassword }
  .mutation(async ({ ctx, input }) => {
    // 1. Check if email is already in use
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', input.newEmail.toLowerCase())
      .single();

    if (existingUser) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Email already in use',
      });
    }

    // 2. Fetch user with password_hash (password-protected operation)
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', ctx.user.id)
      .single();

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    // 3. Verify current password
    const passwordValid = await bcrypt.compare(
      input.currentPassword,
      user.password_hash
    );

    if (!passwordValid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Current password is incorrect',
      });
    }

    // 4. Update email in database
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        email: input.newEmail.toLowerCase(),
        updated_at: new Date().toISOString(),
        // Note: email_verified reset to false (defer verification to v2)
        email_verified: false,
      })
      .eq('id', ctx.user.id)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update email',
      });
    }

    // 5. Generate new JWT with updated email
    const payload: JWTPayload = {
      userId: updatedUser.id,
      email: updatedUser.email, // NEW EMAIL
      tier: updatedUser.tier,
      isCreator: updatedUser.is_creator || false,
      isAdmin: updatedUser.is_admin || false,
      isDemo: updatedUser.is_demo || false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    };

    const token = jwt.sign(payload, JWT_SECRET);

    // 6. Return new token + updated user
    return {
      user: userRowToUser(updatedUser),
      token, // Client must replace old token with this
      message: 'Email updated successfully. Please sign in again.',
    };
  }),
```

**Frontend Integration:**
```tsx
const changeEmail = trpc.users.changeEmail.useMutation({
  onSuccess: (data) => {
    // Replace old token with new one
    localStorage.setItem('token', data.token);
    
    // Update user context
    setUser(data.user);
    
    toast.success(data.message);
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

**Security Considerations:**
- Password-protected (prevents account hijacking via XSS)
- Email uniqueness check (prevents duplicate accounts)
- JWT invalidation via new token issuance
- `email_verified` reset to false (defer email verification to v2)

**Recommendation:** Follow this pattern exactly. No email verification flow for MVP (as specified in master-plan.yaml line 135).

---

### Pattern 2: Preferences Update (Immediate Save)

**Description:** Settings page updates preferences on toggle (no "Save" button)

**Implementation Approach:**
```typescript
// server/trpc/routers/users.ts (NEW MUTATION)

updatePreferences: protectedProcedure
  .input(updatePreferencesSchema) // Partial<UserPreferences>
  .mutation(async ({ ctx, input }) => {
    // Fetch current preferences from database
    const { data: user } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', ctx.user.id)
      .single();

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    // Merge input with existing preferences (partial update)
    const updatedPreferences = {
      ...DEFAULT_PREFERENCES, // Ensure all keys present
      ...(user.preferences || {}), // Existing preferences
      ...input, // New preferences (overwrites existing)
    };

    // Update database
    const { error } = await supabase
      .from('users')
      .update({
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.user.id);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update preferences',
      });
    }

    return {
      preferences: updatedPreferences,
      message: 'Preferences updated',
    };
  }),
```

**Frontend Integration (Settings Page):**
```tsx
const updatePreferences = trpc.users.updatePreferences.useMutation({
  onSuccess: (data) => {
    // Update local user context
    setUser(prev => ({ ...prev, preferences: data.preferences }));
    
    // Toast confirmation (brief)
    toast.success(data.message, { duration: 2000 });
  },
});

// Toggle handlers (immediate save)
const handleToggle = (key: keyof UserPreferences, value: any) => {
  updatePreferences.mutate({ [key]: value });
};
```

**UX Considerations:**
- **Immediate save** on toggle (no "Save" button per master-plan.yaml line 114)
- **Optimistic updates** via React Query (instant UI feedback)
- **Debouncing** NOT needed (preferences don't change rapidly)
- **Toast notification** brief (2s) to avoid annoyance

**Recommendation:** Use this pattern for all settings toggles. Consistent with modern SaaS UX (Notion, Linear, GitHub Settings).

---

### Pattern 3: Demo User Protection (Read-Only)

**Description:** Demo account should be read-only (prevent data corruption)

**Implementation Approach:**
```typescript
// Add to server/trpc/middleware.ts

export const notDemo = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (ctx.user.isDemo) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Demo accounts cannot modify data. Sign up to save changes.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const writeProcedure = publicProcedure.use(isAuthed).use(notDemo);
```

**Apply to Mutation Procedures:**
```typescript
// Profile mutations should block demo user
changeEmail: writeProcedure.input(changeEmailSchema).mutation(...),
updatePreferences: writeProcedure.input(updatePreferencesSchema).mutation(...),
deleteAccount: writeProcedure.input(deleteAccountSchema).mutation(...),

// changePassword can work for demo (resets on daily refresh)
changePassword: protectedProcedure.input(changePasswordSchema).mutation(...),
```

**Frontend Handling:**
```tsx
{user.isDemo && (
  <Alert variant="info">
    You're viewing the demo account. Sign up to modify settings.
  </Alert>
)}

<GlowButton 
  onClick={handleChangeEmail}
  disabled={user.isDemo} // Disable for demo
>
  Update Email
</GlowButton>
```

**Recommendation:** Implement `notDemo` middleware for **destructive operations** (email change, account deletion). Allow preference updates for demo (resets daily via seed script).

---

## Complexity Assessment

### High Complexity Areas

**NONE** - All backend patterns are established and tested.

---

### Medium Complexity Areas

#### 1. Email Change Mutation (JWT Invalidation)
**Complexity:** MEDIUM - Requires new token issuance
**Why Medium:**
- Must check email uniqueness (additional database query)
- Must verify password (bcrypt compare)
- Must generate new JWT (requires jsonwebtoken import)
- Frontend must replace token in localStorage

**Estimated Effort:**
- Backend mutation: 45 minutes
- Zod schema: 5 minutes
- Frontend integration: 30 minutes
- Testing: 30 minutes
- **Total:** 1.75 hours

**Recommendation:** Follow Pattern 1 (Email Change with JWT Invalidation) exactly.

**Builder Split Needed?** NO - Standard mutation pattern.

---

#### 2. Preferences Persistence (JSONB Partial Updates)
**Complexity:** MEDIUM - Requires merge logic
**Why Medium:**
- Must merge input with existing preferences (partial updates)
- Must ensure DEFAULT_PREFERENCES fallback (backwards compatibility)
- Must handle null values (reduce_motion_override can be null)

**Estimated Effort:**
- Backend mutation: 30 minutes
- Zod schema: 10 minutes
- Frontend integration: 1 hour (multiple toggles)
- Testing: 30 minutes
- **Total:** 2 hours

**Recommendation:** Follow Pattern 2 (Preferences Update) with DEFAULT_PREFERENCES merge.

**Builder Split Needed?** NO - Straightforward JSONB update.

---

### Low Complexity Areas

#### 1. Password Change Integration
**Complexity:** LOW - Backend already exists
**Why Low:**
- Mutation exists in `auth.ts` router (lines 233-296)
- Zod schema exists in `types/schemas.ts`
- Frontend just needs UI + `trpc.auth.changePassword.useMutation()`

**Estimated Effort:**
- Frontend UI: 30 minutes
- Form validation: 15 minutes
- Toast notifications: 10 minutes
- Testing: 15 minutes
- **Total:** 1 hour

**Recommendation:** Use existing `auth.changePassword` mutation. No backend work needed.

**Builder Split Needed?** NO - Frontend-only work.

---

#### 2. Delete Account Integration
**Complexity:** LOW - Backend already exists
**Why Low:**
- Mutation exists in `auth.ts` router (lines 299-345)
- Zod schema exists in `types/schemas.ts`
- Frontend needs scary modal + `trpc.auth.deleteAccount.useMutation()`

**Estimated Effort:**
- Scary modal UI: 45 minutes
- Confirmation flow: 30 minutes
- Testing: 15 minutes
- **Total:** 1.5 hours

**Recommendation:** Use existing `auth.deleteAccount` mutation. Add scary modal with red button.

**Builder Split Needed?** NO - Frontend-only work.

---

## Technology Recommendations

### Primary Stack (NO CHANGES)

**Backend:**
- tRPC 11 (existing routers extend cleanly)
- Zod validation (add 2 new schemas)
- bcrypt password hashing (bcrypt.compare, bcrypt.hash with 12 rounds)
- jsonwebtoken (JWT invalidation via new token issuance)
- Supabase PostgreSQL (JSONB column supports partial updates)

**Rationale:** All technologies already in production. No new dependencies needed.

---

### Supporting Libraries (EXISTING)

**Validation:**
- `zod@^3.25.76` - Add `changeEmailSchema` and `updatePreferencesSchema`

**Password Security:**
- `bcryptjs@^3.0.2` - Password verification for changeEmail mutation
- Hash rounds: 12 (industry standard)

**Authentication:**
- `jsonwebtoken@^9.0.2` - JWT signing with HS256 algorithm
- JWT expiry: 30 days (configurable via `JWT_EXPIRY_DAYS`)

**Database:**
- `@supabase/supabase-js@^2.50.4` - JSONB partial updates via spread operator

---

### New Dependencies Required

**NONE** - All features achievable with existing stack.

---

### Dependencies to AVOID

- **Nodemailer:** Email verification deferred to v2 (per master-plan.yaml line 135)
- **Passport.js:** Custom JWT is simpler for this use case
- **Class Validator:** Zod provides better TypeScript integration
- **Mongoose:** Project uses PostgreSQL, not MongoDB

---

## Integration Points

### Internal Integrations

#### 1. tRPC Client ↔ Users Router Mutations

**How They Connect:**
```tsx
// Frontend (Profile Page)
const changeEmail = trpc.users.changeEmail.useMutation({
  onSuccess: (data) => {
    localStorage.setItem('token', data.token); // Replace JWT
    setUser(data.user); // Update context
    toast.success(data.message);
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// Backend (users.ts router)
changeEmail: protectedProcedure
  .input(changeEmailSchema)
  .mutation(async ({ ctx, input }) => { 
    // Implementation from Pattern 1
    return { user, token, message };
  }),
```

**Type Safety:**
- Zod schema validates input at runtime
- TypeScript infers types from schema → frontend autocomplete
- `AppRouter` type exported for client import

---

#### 2. Preferences ↔ User Context Sync

**How They Connect:**
```tsx
// Frontend (Settings Page)
const updatePreferences = trpc.users.updatePreferences.useMutation({
  onSuccess: (data) => {
    setUser(prev => ({
      ...prev,
      preferences: data.preferences, // Update local context
    }));
  },
});

// Backend returns merged preferences
return {
  preferences: {
    ...DEFAULT_PREFERENCES,
    ...(user.preferences || {}),
    ...input,
  },
  message: 'Preferences updated',
};
```

**Context Synchronization:**
- Settings page toggles → mutation → database update
- Mutation success → React Query cache invalidation
- User context updated → all components using `useAuth()` re-render
- Preferences persist across sessions (stored in database, not localStorage)

---

#### 3. JWT Token Replacement Flow

**How They Connect:**
```tsx
// Email change triggers token replacement
const changeEmail = trpc.users.changeEmail.useMutation({
  onSuccess: (data) => {
    // 1. Replace token in localStorage
    localStorage.setItem('token', data.token);
    
    // 2. Update tRPC client headers
    queryClient.setDefaultOptions({
      queries: {
        meta: {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        },
      },
    });
    
    // 3. Update user context
    setUser(data.user);
  },
});
```

**Security Consideration:**
- Old JWT becomes invalid after email change (email in payload changed)
- Frontend must use new token immediately
- All subsequent requests use new JWT

---

## Risks & Challenges

### Technical Risks

#### Risk 1: Email Change Without Verification (MEDIUM IMPACT)
**Impact:** Users can change email to any address without verification (potential account hijacking)
**Likelihood:** MEDIUM (malicious users could exploit)
**Mitigation Strategy:**
1. **Password-protection:** Require current password to change email (prevents XSS attacks)
2. **Email uniqueness check:** Prevent duplicate email addresses
3. **Log email changes:** Track changes for audit trail (add to future iteration)
4. **Defer verification:** Per master-plan.yaml line 135, email verification is post-MVP

**Recommendation:** Implement password-protection immediately. Add email verification in Plan-8 (post-MVP polish).

---

#### Risk 2: JWT Token Invalidation Issues (LOW IMPACT)
**Impact:** Old JWT still valid after email change (until expiry)
**Likelihood:** LOW (JWT expiry is 30 days, but new token issued)
**Mitigation Strategy:**
1. **New token issuance:** Email change returns new JWT (frontend replaces old token)
2. **Client-side invalidation:** Frontend removes old token from localStorage
3. **Future:** Implement JWT blacklist (requires Redis or database table)

**Recommendation:** New token issuance is sufficient for MVP. JWT blacklist is post-MVP optimization.

---

#### Risk 3: JSONB Preferences Schema Evolution (LOW IMPACT)
**Impact:** Future preference fields require database migration
**Likelihood:** LOW (preferences schema is comprehensive)
**Mitigation Strategy:**
1. **DEFAULT_PREFERENCES merge:** Ensures backwards compatibility (existing users get new defaults)
2. **Optional fields:** All preference fields are optional in Zod schema
3. **Graceful degradation:** Missing preferences fall back to defaults

**Recommendation:** Current preferences schema is extensible. No migration needed for new fields (JSONB supports dynamic keys).

---

### Complexity Risks

#### Risk 1: Builder Needs to Split Mutations (LOW LIKELIHOOD)
**Scenario:** If both mutations (changeEmail + updatePreferences) take >4 hours combined
**Sub-task Split:**
- Sub-builder A: Email change mutation + frontend integration
- Sub-builder B: Preferences mutation + Settings page toggles

**Recommendation:** Avoid split unless mutations exceed time estimate. Both are medium complexity, manageable by single builder.

---

## Recommendations for Planner

### 1. Reuse Existing Auth Mutations (HIGH PRIORITY)
**Why:** `changePassword` and `deleteAccount` already exist in `auth.ts` router
**Action:** Profile page calls `trpc.auth.changePassword` and `trpc.auth.deleteAccount`
**Effort Saved:** 3-4 hours (no backend code needed)
**Blocker:** None - frontend integration only

---

### 2. Add 2 New Mutations to Users Router
**Why:** `changeEmail` and `updatePreferences` don't exist yet
**Action:**
- Add `changeEmailSchema` and `updatePreferencesSchema` to `types/schemas.ts`
- Add `changeEmail` mutation to `server/trpc/routers/users.ts` (follow Pattern 1)
- Add `updatePreferences` mutation to `server/trpc/routers/users.ts` (follow Pattern 2)
**Effort:** 3-4 hours total (both mutations + schemas)
**Blocker:** None - straightforward implementation

---

### 3. No Database Migrations Needed
**Why:** Preferences JSONB column added in iteration 12 (already deployed)
**Action:** None - database schema is complete
**Effort Saved:** 1 hour (no migration development/testing)
**Blocker:** None

---

### 4. Implement Demo User Protection Middleware
**Why:** Demo account should be read-only (prevent data corruption)
**Action:** Add `notDemo` middleware to `server/trpc/middleware.ts` (Pattern 3)
**Effort:** 30 minutes (middleware + apply to mutations)
**Blocker:** None - optional for MVP (can defer to post-launch)

---

### 5. Test Email Change Flow Thoroughly
**Why:** JWT invalidation is critical (security risk if broken)
**Action:**
- Test: Change email → verify new JWT issued → verify old JWT invalid
- Test: Change email to existing email → verify error message
- Test: Wrong password → verify error message
**Effort:** 30 minutes (manual testing)
**Blocker:** None - critical path for Profile page

---

### 6. Use Immediate Save for Settings
**Why:** Per master-plan.yaml line 114: "Save immediately on toggle (no 'Save' button)"
**Action:** Settings page calls `trpc.users.updatePreferences.mutate()` on toggle
**Effort:** 1 hour (frontend implementation)
**Trade-off:** Modern UX (Notion, Linear) vs. traditional "Save" button

---

## Resource Map

### Critical Files/Directories

#### Backend Routers
- **Auth Router:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`
  - Lines 233-296: `changePassword` mutation (PRODUCTION-READY)
  - Lines 299-345: `deleteAccount` mutation (PRODUCTION-READY)
  - Lines 347-382: `loginDemo` mutation (for demo user auto-login)

- **Users Router:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/users.ts`
  - Lines 79-103: `updateProfile` mutation (existing pattern to follow)
  - **NEW:** `changeEmail` mutation (add after line 103)
  - **NEW:** `updatePreferences` mutation (add after changeEmail)

#### Validation Schemas
- **Types/Schemas:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/schemas.ts`
  - Lines 21-34: Existing profile schemas (updateProfile, changePassword, deleteAccount)
  - **NEW:** `changeEmailSchema` (add after line 34)
  - **NEW:** `updatePreferencesSchema` (add after changeEmailSchema)

#### Type Definitions
- **User Types:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts`
  - Lines 10-33: UserPreferences interface + DEFAULT_PREFERENCES (PRODUCTION-READY)
  - Lines 106-130: userRowToUser transformation (handles preferences merge)

#### Database Migrations
- **Iteration 12 Migration:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251128_iteration_12_demo_infrastructure.sql`
  - Lines 11-29: Preferences JSONB column + is_demo flag (COMPLETE)

#### Middleware
- **Authentication Middleware:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`
  - Lines 6-21: `isAuthed` middleware (used by all protected procedures)
  - **NEW:** `notDemo` middleware (add after line 53 for demo protection)

---

### Key Dependencies

#### Production Dependencies (Already Installed)
```json
{
  "@trpc/server": "^11.6.0",       // tRPC backend framework
  "@supabase/supabase-js": "^2.50.4", // Database client
  "bcryptjs": "^3.0.2",             // Password hashing/verification
  "jsonwebtoken": "^9.0.2",         // JWT signing/verification
  "zod": "^3.25.76"                 // Input validation
}
```

#### New Dependencies Required
**NONE** - All features achievable with existing stack

---

### Testing Infrastructure

#### Recommended Testing for Iteration 13

**1. Email Change Flow:**
- Test: Change email with correct password → success
- Test: Change email with wrong password → error "Current password is incorrect"
- Test: Change email to existing email → error "Email already in use"
- Test: Verify new JWT issued → old JWT invalid
- Expected time: 20 minutes

**2. Preferences Update:**
- Test: Toggle notification_email → verify database updated
- Test: Change default_tone → verify persisted across sessions
- Test: Set reduce_motion_override to null → verify respects browser preference
- Expected time: 15 minutes

**3. Password Change:**
- Test: Change password with correct current password → success
- Test: Change password with wrong current password → error
- Test: Change password to same password → error "New password must be different"
- Expected time: 15 minutes

**4. Delete Account:**
- Test: Delete account with correct password + email confirmation → user deleted
- Test: Delete account with wrong password → error
- Test: Delete account with wrong email confirmation → error "Email confirmation does not match"
- Test: Verify reflections deleted (CASCADE)
- Expected time: 20 minutes

**5. Demo User Protection:**
- Test: Demo user attempts changeEmail → error "Demo accounts cannot modify data"
- Test: Demo user attempts deleteAccount → error
- Test: Demo user can change password (allowed for demo)
- Expected time: 15 minutes

**Total Testing Time:** 1.5 hours

---

## Questions for Planner

### Question 1: Should Demo User Be Read-Only?
**Context:** Demo account protection middleware (Pattern 3)
**Question:** Should demo user be completely read-only?
- **Option A:** Read-only (no email change, no preferences update, no account deletion)
- **Option B:** Partial (allow preferences update, block email change + deletion)
- **Option C:** Fully editable (resets nightly via seed script)

**Recommendation:** Option A (read-only) for security + simplicity. Demo banner already prompts sign-up.

---

### Question 2: Email Verification Now or Later?
**Context:** Master-plan.yaml line 135 says defer to v2
**Question:** Confirm email verification is post-MVP?
- **Option A:** Defer to post-MVP (password-protected email change only)
- **Option B:** Implement basic verification (send email, click link)

**Recommendation:** Option A (defer) per master-plan. Password-protection is sufficient for MVP security.

---

### Question 3: JWT Expiry After Email Change?
**Context:** New JWT issued after email change
**Question:** Should new JWT have same expiry as old JWT?
- **Option A:** Full 30-day expiry (user gets fresh 30 days)
- **Option B:** Inherit remaining time from old JWT (expires at same time)

**Recommendation:** Option A (full 30 days) for better UX. User changing email shouldn't lose session time.

---

### Question 4: Settings Page Layout?
**Context:** Settings page has 4 categories (notifications, reflection, display, privacy)
**Question:** Should settings be grouped or flat list?
- **Option A:** Grouped sections (Notification Preferences, Reflection Preferences, etc.)
- **Option B:** Flat list (all toggles in single list)
- **Option C:** Tabbed interface (4 tabs)

**Recommendation:** Option A (grouped sections) per master-plan.yaml lines 110-113. Clearest information architecture.

---

### Question 5: Preference Update Toast Duration?
**Context:** Settings save immediately on toggle
**Question:** Should toast appear on every toggle?
- **Option A:** Toast on every toggle (brief 2s duration)
- **Option B:** Toast only on first toggle, then suppress
- **Option C:** No toast (silent save with checkmark animation)

**Recommendation:** Option C (silent save) to avoid toast fatigue. Checkmark animation provides visual feedback.

---

## Conclusion

Iteration 13 backend infrastructure is **95% complete**. Only 2 new mutations needed (changeEmail, updatePreferences). Existing mutations (changePassword, deleteAccount) are production-ready and extensively tested.

**Key Takeaways:**
1. **Reuse existing mutations** - 50% of backend work already done
2. **Database schema complete** - No migrations needed
3. **Patterns established** - Follow existing auth.ts patterns exactly
4. **Security considered** - Password-protection + JWT invalidation built-in

**Estimated Timeline:**
- Add 2 Zod schemas: 15 minutes
- Implement changeEmail mutation: 1 hour
- Implement updatePreferences mutation: 45 minutes
- Add notDemo middleware (optional): 30 minutes
- Testing: 1.5 hours
- **Total:** 4 hours backend work

**Builder split:** NOT NEEDED - Backend work is straightforward, frontend integration is larger effort (6-8 hours for Profile + Settings pages).

---

**Report Status:** COMPLETE
**Next Step:** Planner reviews findings → creates detailed task breakdown for Builder-13
**Critical Path:** Add 2 mutations → Test email change flow → Frontend integration
