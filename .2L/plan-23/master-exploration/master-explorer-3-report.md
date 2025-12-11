# Master Explorer 3: Code Quality & Integration Points

## Explorer ID
master-explorer-3

## Focus Area
Code Quality & Integration Points

## Vision Summary
Resolve CI-blocking TypeScript errors, align password policies, fix N+1 queries, and refactor large components for improved maintainability.

---

## CI Fix Analysis

### Issue 1: tRPC Mock Types Missing `trpc` Property

**File:** `test/helpers/trpc.ts` (lines 170-266)

**Problem:**
The mock query result types (`QuerySuccessResult`, `QueryLoadingResult`, `QueryErrorResult`) are missing the `trpc` property required by `UseTRPCQueryResult`. The tRPC v11 client hooks return a result that includes a `trpc` property with utility functions like `path` and `invalidate`.

**Current code produces:**
```
Property 'trpc' is missing in type 'QuerySuccessResult<...>' but required in type 'TRPCHookResult'
```

**Affected test files (158 total errors):**
- `components/dashboard/cards/__tests__/VisualizationCard.test.tsx` - 47+ errors
- `components/dashboard/cards/__tests__/DreamsCard.test.tsx` - 50+ errors
- `components/dashboard/__tests__/DashboardHero.test.tsx` - 3 errors
- Additional test files with similar patterns

**Solution:**
Add the `trpc` property to all mock result interfaces in `test/helpers/trpc.ts`:

```typescript
// Add to BaseQueryResult interface (line 26):
interface BaseQueryResult<TData> {
  // ... existing fields ...
  trpc: {
    path: string;
  };
}

// Update createMockQueryResult (line 170):
export function createMockQueryResult<TData>(data: TData): QuerySuccessResult<TData> {
  return {
    // ... existing fields ...
    trpc: { path: '' },
  };
}

// Update createMockLoadingResult (line 206):
export function createMockLoadingResult<TData>(): QueryLoadingResult<TData> {
  return {
    // ... existing fields ...
    trpc: { path: '' },
  };
}

// Update createMockErrorResult (line 251):
export function createMockErrorResult<TData>(error: Error = new Error('Query failed')): QueryErrorResult<TData> {
  return {
    // ... existing fields ...
    trpc: { path: '' },
  };
}

// Update createMockInfiniteQueryResult (line 483):
export function createMockInfiniteQueryResult<TData>(...) {
  return {
    // ... existing fields ...
    trpc: { path: '' },
  };
}
```

**Complexity:** LOW
- Single file change
- Add 4 properties (one per factory function)
- ~15 lines of code

---

### Issue 2: Missing Supabase Types

**File:** `test/fixtures/evolution.ts` (line 4)

**Problem:**
```typescript
import type { Database } from '@/types/supabase';
```
This import references a non-existent file. The `types/` directory contains `evolution.ts` but no `supabase.ts`.

**Current types directory contents:**
- `api.ts`, `artifact.ts`, `clarify.ts`, `evolution.ts`, `glass-components.ts`
- `index.ts`, `pattern.ts`, `reflection.ts`, `schemas.ts`, `subscription.ts`, `user.ts`
- NO `supabase.ts`

**Solution Options:**

**Option A (Recommended): Create minimal types file**
Create `types/supabase.ts` with just the Database types needed for evolution reports:

```typescript
// types/supabase.ts - Supabase Database Types
// Generated from database schema for type safety

export interface Database {
  public: {
    Tables: {
      evolution_reports: {
        Row: {
          id: string;
          user_id: string;
          dream_id: string | null;
          report_category: 'dream-specific' | 'cross-dream';
          report_type: 'essential' | 'premium';
          analysis: string;
          reflections_analyzed: string[];
          reflection_count: number;
          time_period_start: string;
          time_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['evolution_reports']['Row']>;
        Update: Partial<Database['public']['Tables']['evolution_reports']['Row']>;
      };
      // Add other tables as needed
    };
  };
}
```

**Option B: Update fixture to use existing types**
Change `test/fixtures/evolution.ts` to import from existing `types/evolution.ts`:

```typescript
// Instead of:
import type { Database } from '@/types/supabase';
type EvolutionReportRow = Database['public']['Tables']['evolution_reports']['Row'];

// Use existing type:
import type { EvolutionReportRow } from '@/types/evolution';
```

**Complexity:** LOW
- Option A: Create 1 new file (~50 lines)
- Option B: Modify 2 lines in existing file

---

## Password Policy Analysis

### Current State - Signup
**File:** `types/schemas.ts` (line 11)
```typescript
password: z.string().min(6, 'Password must be at least 6 characters'),
```
- Minimum: 6 characters
- No complexity requirements

### Current State - Password Reset
**File:** `app/api/auth/reset-password/route.ts` (lines 28-54)
```typescript
// Validate password strength
if (newPassword.length < 8) {
  return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
}
if (!/[A-Z]/.test(newPassword)) {
  return NextResponse.json({ success: false, error: 'Password must contain at least one uppercase letter' }, { status: 400 });
}
if (!/[a-z]/.test(newPassword)) {
  return NextResponse.json({ success: false, error: 'Password must contain at least one lowercase letter' }, { status: 400 });
}
if (!/[0-9]/.test(newPassword)) {
  return NextResponse.json({ success: false, error: 'Password must contain at least one number' }, { status: 400 });
}
```
- Minimum: 8 characters
- Required: uppercase, lowercase, number

### Current State - Change Password
**File:** `types/schemas.ts` (lines 26-29)
```typescript
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});
```
- Minimum: 6 characters (inconsistent with reset)

### Security Issue
Users can sign up with `abc123` (weak password meeting signup requirements) but cannot reset their password to the same value because the reset requires stronger criteria.

### Recommended Solution
Create a shared password schema with consistent requirements across all endpoints:

**Step 1:** Add shared password schema to `types/schemas.ts`:
```typescript
// Strong password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Update signup schema
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required'),
  language: z.enum(['en', 'he']).default('en'),
});

// Update change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: passwordSchema,
});
```

**Step 2:** Remove inline validation from reset-password route and use schema:
```typescript
// app/api/auth/reset-password/route.ts
import { passwordSchema } from '@/types/schemas';

// Replace lines 28-54 with:
const passwordResult = passwordSchema.safeParse(newPassword);
if (!passwordResult.success) {
  return NextResponse.json({
    success: false,
    error: passwordResult.error.errors[0].message
  }, { status: 400 });
}
```

**Complexity:** MEDIUM
- Modify 2 files: `types/schemas.ts`, `app/api/auth/reset-password/route.ts`
- Existing users with weak passwords may need migration plan
- Should add client-side validation in signup/change password forms

---

## N+1 Query Analysis

**File:** `server/trpc/routers/dreams.ts`

### Current Implementation (getDreamWithStats function, lines 112-148)
```typescript
async function getDreamWithStats(dreamId: string, userId: string) {
  // Query 1: Get dream
  const { data: dream, error: dreamError } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', dreamId)
    .eq('user_id', userId)
    .single();

  // Query 2: Get reflection count (sequential)
  const { count: reflectionCount, error: countError } = await supabase
    .from('reflections')
    .select('*', { count: 'exact', head: true })
    .eq('dream_id', dreamId);

  // Query 3: Get last reflection (sequential)
  const { data: lastReflection, error: lastError } = await supabase
    .from('reflections')
    .select('created_at')
    .eq('dream_id', dreamId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { ...dream, reflectionCount, lastReflectionAt: lastReflection?.created_at };
}
```

**Problem:** Three sequential queries where two could be parallel.

### Already Fixed: List Operation (lines 237-277)
The `dreams.list` query already uses an optimized batch approach - it fetches all reflections for all dreams in a single query and processes in memory:
```typescript
// Single query to get all reflections for all dreams
const { data: allReflections } = await supabase
  .from('reflections')
  .select('dream_id, created_at')
  .in('dream_id', dreamIds)
  .order('created_at', { ascending: false });
```

### Solution for getDreamWithStats
Use `Promise.all` to parallelize queries 2 and 3:

```typescript
async function getDreamWithStats(dreamId: string, userId: string) {
  // Query 1: Get dream (must complete first)
  const { data: dream, error: dreamError } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', dreamId)
    .eq('user_id', userId)
    .single();

  if (dreamError || !dream) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Dream not found' });
  }

  // Queries 2 & 3: Run in parallel
  const [countResult, lastReflectionResult] = await Promise.all([
    supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true })
      .eq('dream_id', dreamId),
    supabase
      .from('reflections')
      .select('created_at')
      .eq('dream_id', dreamId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    ...dream,
    daysLeft: calculateDaysLeft(dream.target_date),
    reflectionCount: countResult.count || 0,
    lastReflectionAt: lastReflectionResult.data?.created_at || null,
  };
}
```

**Complexity:** LOW
- Single function modification
- ~10 lines changed
- Reduces latency from 3 sequential queries to 1 + parallel(2)

---

## Large Component Analysis

### 1. MirrorExperience.tsx (606 lines)
**File:** `app/reflection/MirrorExperience.tsx`

**Current structure:**
- Lines 1-34: Imports and dynamic loading
- Lines 35-38: Component documentation
- Lines 39-178: Main component with hooks, state, mutations
- Lines 179-298: Conditional renders (loading, auth guard, demo CTA, mobile)
- Lines 299-413: Desktop experience JSX with animations
- Lines 414-595: Embedded CSS-in-JS styles
- Lines 596-606: Modal and closing tags

**Splitting Strategy:**
1. **Extract CSS to external file** (~175 lines saved)
   - Move lines 418-594 to `app/reflection/MirrorExperience.css` or dedicated styled component

2. **Extract Demo User CTA** (~75 lines saved)
   - Lines 207-281 -> `components/reflection/DemoUserCTA.tsx`

3. **Extract Tone Ambient Elements** (~40 lines saved)
   - Lines 307-348 -> `components/reflection/ToneAmbientEffects.tsx`

**Post-split estimate:** ~300-350 lines (manageable)

**Complexity:** MEDIUM
- Already uses composition (DreamSelectionView, ReflectionFormView, etc.)
- CSS extraction is straightforward
- Need to pass tone and particle position props

---

### 2. profile/page.tsx (528 lines)
**File:** `app/profile/page.tsx`

**Current structure:**
- Lines 1-34: Imports
- Lines 35-201: Component with state and handlers
- Lines 202-216: Loading/auth guard
- Lines 217-464: JSX sections (Account Info, Subscription, Usage, Actions, Danger Zone)
- Lines 465-528: Delete Account Modal

**Splitting Strategy:**
1. **Extract Account Information Section** (~85 lines saved)
   - Create `components/profile/AccountInfoSection.tsx`
   - Props: user, editing state handlers

2. **Extract Account Actions Section** (~60 lines saved)
   - Create `components/profile/AccountActionsSection.tsx`
   - Password change form and tutorial link

3. **Extract Danger Zone Section** (~75 lines saved)
   - Create `components/profile/DangerZoneSection.tsx`
   - Delete account modal and confirmation flow

**Post-split estimate:** ~300 lines

**Complexity:** MEDIUM
- State management needs to be lifted or passed via props
- Mutations can be passed as callbacks

---

### 3. AppNavigation.tsx (522 lines)
**File:** `components/shared/AppNavigation.tsx`

**Current structure:**
- Lines 1-45: Imports and interface
- Lines 46-138: Component setup, effects, handlers
- Lines 139-471: JSX (Desktop nav, User menu, Mobile menu)
- Lines 472-522: Embedded CSS

**Splitting Strategy:**
1. **Extract CSS to external file** (~50 lines saved)
   - Lines 473-518 -> `components/shared/AppNavigation.css`

2. **Extract User Dropdown Menu** (~85 lines saved)
   - Lines 286-344 -> `components/shared/UserDropdownMenu.tsx`

3. **Extract Mobile Navigation Menu** (~90 lines saved)
   - Lines 366-469 -> `components/shared/MobileNavigationMenu.tsx`

**Post-split estimate:** ~300 lines

**Complexity:** LOW-MEDIUM
- Mostly UI extraction
- User dropdown and mobile menu are self-contained
- Need to pass currentPage, user, and handlers as props

---

### 4. SubscriptionCard.tsx (473 lines - Borderline)
**File:** `components/dashboard/cards/SubscriptionCard.tsx`

This is borderline at 473 lines (threshold is 400). Consider splitting if time permits:
- Extract subscription tier display component
- Extract usage progress bars component

**Complexity:** LOW (not critical)

---

## Recommended Fix Order

### Iteration 1: CI Critical (Unblocking)
1. **Fix tRPC mock types** - Add `trpc` property to test helpers (LOW, ~30 min)
2. **Fix Supabase types** - Create types/supabase.ts or update fixture import (LOW, ~15 min)

**Expected result:** All 158 TypeScript errors resolved, CI passes

### Iteration 2: Security + Performance
1. **Align password policies** - Create shared schema, update reset route (MEDIUM, ~1 hour)
2. **Fix N+1 query** - Parallelize getDreamWithStats queries (LOW, ~30 min)

### Iteration 3: Code Quality (Optional)
1. **Split MirrorExperience.tsx** - Extract CSS and sub-components (MEDIUM, ~2 hours)
2. **Split profile/page.tsx** - Extract section components (MEDIUM, ~2 hours)
3. **Split AppNavigation.tsx** - Extract menu components (MEDIUM, ~1.5 hours)

---

## Test Coverage Considerations

### Impact of CI Fixes
- **tRPC mock fix:** All existing tests continue to work but now pass type checking
- **Supabase types fix:** Only affects `test/fixtures/evolution.ts` - existing fixture functions unchanged

### Password Policy Changes
- **Existing signup tests:** Will need updates for new validation errors
- **New tests needed:**
  - Signup with weak password (should fail)
  - Change password with weak password (should fail)
  - Password reset with same strong criteria

### N+1 Query Fix
- No test changes needed - behavior unchanged, only performance improved
- Consider adding performance test if not exists

### Component Splitting
- Existing component tests should continue passing
- New unit tests needed for extracted components
- Integration tests remain valid

---

## Additional Findings

### useAuth Mock Issue
**File:** `components/dashboard/__tests__/DashboardHero.test.tsx` (line 80)

The mock `useAuth` return value is missing required properties from `UseAuthReturn` interface:
```
Missing: error, signin, signup, signout, and 2 more
```

**Solution:** Update mock to include all required properties:
```typescript
vi.mocked(useAuth).mockReturnValue({
  user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
  isLoading: false,
  isAuthenticated: true,
  error: null,
  signin: vi.fn(),
  signup: vi.fn(),
  signout: vi.fn(),
  signOut: vi.fn(),
  setUser: vi.fn(),
  // ... any other required properties
});
```

---

## Summary

| Fix | Complexity | Time Est. | Priority |
|-----|------------|-----------|----------|
| tRPC mock types | LOW | 30 min | CRITICAL |
| Supabase types | LOW | 15 min | CRITICAL |
| Password policy | MEDIUM | 1 hour | HIGH |
| N+1 query | LOW | 30 min | HIGH |
| MirrorExperience split | MEDIUM | 2 hours | MEDIUM |
| profile/page split | MEDIUM | 2 hours | MEDIUM |
| AppNavigation split | MEDIUM | 1.5 hours | MEDIUM |

**Total estimated time:**
- Critical (CI fix): ~45 minutes
- High priority: ~1.5 hours
- Medium priority: ~5.5 hours

---

*Exploration completed: 2025-12-11*
*This report informs iteration planning decisions*
