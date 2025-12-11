# Builder-1 Report: Align Password Policies

## Status
COMPLETE

## Summary
Aligned password policies across all authentication endpoints by creating a shared `passwordSchema` in `types/schemas.ts` that enforces strong password requirements (8+ characters, uppercase, lowercase, and number). Updated `signupSchema`, `changePasswordSchema`, and the reset-password API route to use this shared schema, eliminating the previous inconsistency where signup allowed weak 6-character passwords while reset required 8 characters with complexity rules.

## Files Modified

### Implementation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/schemas.ts` - Added shared `passwordSchema` and updated `signupSchema` and `changePasswordSchema` to use it
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/auth/reset-password/route.ts` - Refactored to use shared `passwordSchema` instead of inline validation

## Changes Made

### 1. Created Shared Password Schema (`types/schemas.ts`)

Added a new section for shared validation schemas with a comprehensive password schema:

```typescript
// Strong password validation - consistent across all endpoints
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');
```

### 2. Updated `signupSchema` (`types/schemas.ts`)

Changed password field from inline `z.string().min(6, ...)` to use the shared schema:

```typescript
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,  // Was: z.string().min(6, 'Password must be at least 6 characters')
  name: z.string().min(1, 'Name is required'),
  language: z.enum(['en', 'he']).default('en'),
});
```

### 3. Updated `changePasswordSchema` (`types/schemas.ts`)

Changed `newPassword` field from inline `z.string().min(6)` to use the shared schema:

```typescript
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: passwordSchema,  // Was: z.string().min(6)
});
```

### 4. Refactored Reset Password Route (`app/api/auth/reset-password/route.ts`)

Replaced 27 lines of inline validation code with a single schema validation:

**Before (inline validation):**
```typescript
// 4 separate if statements checking password length, uppercase, lowercase, and number
if (newPassword.length < 8) { ... }
if (!/[A-Z]/.test(newPassword)) { ... }
if (!/[a-z]/.test(newPassword)) { ... }
if (!/[0-9]/.test(newPassword)) { ... }
```

**After (shared schema):**
```typescript
import { passwordSchema } from '@/types/schemas';

// Validate password strength using shared schema
const passwordResult = passwordSchema.safeParse(newPassword);
if (!passwordResult.success) {
  return NextResponse.json({
    success: false,
    error: passwordResult.error.errors[0].message
  }, { status: 400 });
}
```

## Success Criteria Met
- [x] Created shared `passwordSchema` in `types/schemas.ts`
- [x] Updated `signupSchema` to use `passwordSchema`
- [x] Updated `changePasswordSchema` to use `passwordSchema`
- [x] Refactored reset-password route to use shared schema
- [x] Password requirements are now consistent across all endpoints:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

## Verification
- **TypeScript compilation:** No errors in modified files
- **ESLint:** No lint errors in modified files
- **Pre-existing errors:** Some unrelated TypeScript errors exist in test files (pre-existing, not introduced by this change)

## Patterns Followed
- **Zod validation schemas:** Used existing patterns from `types/schemas.ts`
- **Error response format:** Maintained existing response format in reset-password route
- **Import organization:** Followed existing import structure

## Integration Notes
- The `passwordSchema` is now exported and can be used by any other component that needs password validation
- Frontend forms using these schemas will automatically get the new validation rules
- Existing users with weak passwords can still sign in (signin schema unchanged), but cannot set a new weak password

## Security Impact
- **IMPROVEMENT:** Signup now requires strong passwords (was: min 6 characters)
- **IMPROVEMENT:** Change password now requires strong passwords (was: min 6 characters)
- **MAINTAINED:** Reset password continues to require strong passwords (no change)
- All password entry points now enforce the same strong password policy

## Breaking Changes
- Users attempting to sign up with passwords that don't meet the new requirements will receive validation errors
- Users attempting to change their password to a weak password will receive validation errors
- **Note:** This is intentional security hardening, not a regression
