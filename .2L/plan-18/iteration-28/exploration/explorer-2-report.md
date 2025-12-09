# Explorer 2: Technical Debt Inventory

## Executive Summary

The codebase contains **162 console statements** (including logs, errors, and warnings), **48 TypeScript `any` types**, and **6 npm security vulnerabilities** (4 moderate, 2 high). The hook architecture is split across `/hooks/` (7 hooks) and `/lib/hooks/` (3 hooks) with no barrel export in the root hooks directory. Export patterns are inconsistent with 63 files using default exports and named exports mixed throughout.

---

## Console.log Statements

### Summary by Directory

| Directory | console.log | console.error | console.warn | Total |
|-----------|-------------|---------------|--------------|-------|
| `server/` | 26 | 23 | 0 | 49 |
| `app/` | 18 | 15 | 0 | 33 |
| `components/` | 1 | 2 | 1 | 4 |
| `lib/` | 0 | 6 | 0 | 6 |
| `scripts/` | 55 | 15 | 1 | 71 |
| **Total** | **100** | **61** | **2** | **163** |

### Production Code (Priority Fix)

#### server/trpc/routers/reflection.ts (13 statements)
```
Line 38: console.log('🔍 Reflection.create called');
Line 39: console.log('📥 Input received:', JSON.stringify(input, null, 2));
Line 40: console.log('👤 User:', ctx.user.email, 'Tier:', ctx.user.tier);
Line 102: console.log('🤖 Calling Anthropic API...');
Line 103: console.log('📝 Prompt length:', userPrompt.length, 'characters');
Line 132: console.log('✅ AI response generated:', aiResponse.length, 'characters');
Line 134: console.error('❌ Claude API error:', error);
Line 146: console.log('💾 Saving to database...');
Line 168: console.error('❌ Database error:', reflectionError);
Line 175: console.log('✅ Reflection created:', reflectionRecord.id);
Line 193: console.error('Failed to update user usage:', updateError);
Line 199: console.log(... multi-line reflection stats);
```
**Action:** Replace with structured logger (e.g., pino/winston) or remove debug logs

#### server/trpc/routers/subscriptions.ts (9 statements)
```
Line 34: console.error('Subscription status query error:', error);
Line 92: console.log('[CreateCheckout] Starting...');
Line 96: console.log('[CreateCheckout] Got plan ID...');
Line 100: console.log('[CreateCheckout] Success...');
Line 103-105: console.error('[CreateCheckout] Error...');
Line 170: console.error('Failed to update user subscription:', error);
Line 177: console.log('[Subscription] User upgraded...');
Line 185: console.error('Activate subscription error:', error);
Line 220: console.error('PayPal cancelSubscription error:', error);
```
**Action:** Keep error logs, remove debug logs

#### app/api/webhooks/paypal/route.ts (19 statements)
```
Lines 54, 70, 75, 85, 96, 116, 126, 142, 149, 170, 174, 181, 191, 212, 216, 225, 239, 243, 252, 264, 268, 275, 286, 289
```
**Action:** Critical payment code - convert to proper audit logging

#### server/lib/email.ts (5 statements)
```
Line 18: console.error('Email service error:', error);
Line 20: console.log('Email service ready');
Line 433: console.log('Password reset email sent to...');
Line 436: console.error('Failed to send password reset email:', error);
Line 465: console.log('Verification email sent...');
Line 468: console.error('Failed to send verification email:', error);
```
**Action:** Keep error logs, remove info logs

#### app/api/cron/consolidate-patterns/route.ts (6 statements)
```
Lines 21, 26, 49, 59, 61, 70, 87
```
**Action:** Convert to structured logging for observability

### Scripts (Lower Priority - Can Keep)
Files in `/scripts/` (seed-demo-user.ts, verify-demo.ts, create-paypal-webhook.ts) are CLI tools where console output is appropriate.

---

## TypeScript `any` Types

### Total Count: 48 occurrences

#### server/lib/temporal-distribution.ts:15
```typescript
[key: string]: any;  // Reflection interface
```
**Fix:** Define proper Reflection type with known fields

#### server/trpc/routers/reflection.ts
```typescript
Line 106: const requestConfig: any = { ... }
Line 133: } catch (error: any) {
```
**Fix:** 
- `requestConfig`: Use `Anthropic.MessageCreateParams`
- `error`: Use `unknown` and type guard

#### server/trpc/routers/users.ts:337
```typescript
function calculateMonthlyBreakdown(reflections: any[])
```
**Fix:** Define `ReflectionRow` type

#### server/trpc/routers/visualizations.ts
```typescript
Line 84: let reflections: any[];
Line 174: const requestConfig: any = { ... }
Line 202: const thinkingBlock = response.content.find((block: any) => ...)
Line 335: reflections: any[],
```
**Fix:** Use proper Anthropic SDK types and define reflection types

#### server/trpc/routers/evolution.ts
```typescript
Line 152, 365: const requestConfig: any = { ... }
Line 321: selectedReflections.forEach((r: any) => { ... })
```
**Fix:** Use Anthropic SDK types

#### server/trpc/routers/dreams.ts:346
```typescript
const updateData: any = { status: input.status };
```
**Fix:** Define `DreamUpdateInput` type

#### components/reflections/AIResponseRenderer.tsx:151
```typescript
code: ({ node, inline, ...props }: any) =>
```
**Fix:** Import proper types from react-markdown

#### types/clarify.ts:79
```typescript
tool_use: any | null;
```
**Fix:** Define `ClarifyToolUse` type (already exists, use it)

#### types/user.ts:107
```typescript
preferences: any; // JSONB - parsed on transformation
```
**Fix:** Use `UserPreferences | null` type

#### lib/clarify/consolidation.ts
```typescript
Line 96: .filter((p: any) => ...)
Line 105: .map((p: any) => ...)
```
**Fix:** Define pattern extraction response type

#### components/dreams/CreateDreamModal.tsx:64
#### components/dreams/EvolutionModal.tsx:100
```typescript
} catch (err: any) {
```
**Fix:** Use `unknown` and type guard

#### components/dashboard/shared/ReflectionItem.tsx
```typescript
Line 22: onClick?: (reflection: any) => void;
Line 50: function getReflectionPreview(refl: any): string {
```
**Fix:** Import and use `Reflection` type

#### components/dashboard/cards/DreamsCard.tsx:96
```typescript
{activeDreams.map((dream: any, index: number) => { ... })}
```
**Fix:** Use `Dream` type from types

#### app/reflection/MirrorExperience.tsx
```typescript
Line 188: const dream = dreams.find((d: any) => d.id === selectedDreamId);
Line 240: const dream = dreams?.find((d: any) => d.id === dreamId);
Line 569: dreams.map((dream: any) => { ... })
```
**Fix:** Use `Dream` type

#### app/visualizations/page.tsx:286
```typescript
{visualizationsData.items.map((viz: any) => (...)}
```
**Fix:** Define `Visualization` type

#### app/dreams/[id]/page.tsx
```typescript
Line 47: (r: any) => r.dreamId === params.id
Line 89, 98: } catch (error: any) {
Line 426: {dreamReflections.map((reflection: any) => (...)}
```
**Fix:** Use proper types

#### app/evolution/[id]/page.tsx:156
```typescript
code: ({ node, inline, ...props }: any) =>
```
**Fix:** Import react-markdown types

#### app/dreams/page.tsx:168
#### app/evolution/page.tsx:261
```typescript
{dreams.map((dream: any) => ...)}
{reportsData.reports.map((report: any) => ...)}
```
**Fix:** Use proper types

#### app/dreams/[id]/ritual/page.tsx:97
```typescript
} catch (err: any) {
```
**Fix:** Use `unknown`

#### app/settings/page.tsx
```typescript
Line 66: const handleToggle = (key: keyof UserPreferences, value: any) => { ... }
Line 216: onChange: (value: any) => void;
Line 219: value?: any;
Line 220: options?: Array<{ value: any; label: string }>;
```
**Fix:** Use generics or union types

#### app/api/cron/consolidate-patterns/route.ts:45
```typescript
.map((m: any) => m.session?.user_id)
```
**Fix:** Define message row type

#### app/api/webhooks/paypal/route.ts:125
```typescript
} catch (error: any) {
```
**Fix:** Use `unknown`

### `as any` Type Assertions (14 occurrences)

| File | Line | Code |
|------|------|------|
| server/trpc/routers/users.ts | 181 | `tier: updatedUser.tier as any` |
| server/trpc/routers/evolution.ts | 192, 227, 331-332, 403, 438 | `(response.usage as any).thinking_tokens` |
| server/trpc/trpc.ts | 16 | `(error.cause as any).flatten()` |
| components/reflections/ReflectionFilters.tsx | 103 | `e.target.value as any` |
| lib/clarify/context-builder.ts | 195 | `patternType: row.pattern_type as any` |
| components/dreams/CreateDreamModal.tsx | 52 | `category: category as any` |
| components/dreams/EvolutionModal.tsx | 91 | `newCategory: newCategory as any` |
| app/dreams/[id]/ritual/page.tsx | 93 | `reason: reason as any` |

---

## npm Security Vulnerabilities

### Current Status: 6 vulnerabilities (4 moderate, 2 high)

```
# npm audit report

esbuild  <=0.24.2 (MODERATE)
- esbuild enables any website to send any requests to the development server
- Fix: npm audit fix --force (will install vite@7.2.7 - BREAKING CHANGE)
- node_modules/esbuild

vite  <=6.1.6 (MODERATE)
- Depends on vulnerable versions of esbuild
- node_modules/vite

glob  10.2.0 - 10.4.5 (HIGH)
- glob CLI: Command injection via -c/--cmd
- Fix: npm audit fix (safe)
- node_modules/glob

jws  =4.0.0 || <3.2.3 (HIGH)
- auth0/node-jws Improperly Verifies HMAC Signature
- Fix: npm audit fix (safe)
- node_modules/jsonwebtoken/node_modules/jws
- node_modules/jws

mdast-util-to-hast  13.0.0 - 13.2.0 (MODERATE)
- mdast-util-to-hast has unsanitized class attribute
- Fix: npm audit fix (safe)
- node_modules/mdast-util-to-hast

nodemailer  <=7.0.10 (MODERATE)
- Email to an unintended domain / DoS vulnerability
- Fix: npm audit fix --force (will install nodemailer@7.0.11 - BREAKING CHANGE)
- node_modules/nodemailer
```

### Recommended Fix Strategy

1. **Safe fixes first:**
   ```bash
   npm audit fix
   ```
   This will fix: glob, jws, mdast-util-to-hast

2. **Test vite upgrade separately:**
   ```bash
   npm install vite@latest --save-dev
   npm run build  # Verify no breaking changes
   ```

3. **Test nodemailer upgrade:**
   ```bash
   npm install nodemailer@latest
   # Test email functionality in staging
   ```

---

## Hook Consolidation

### Current State: Split Architecture

**Location 1: `/hooks/` (7 hooks, NO index.ts)**
| Hook | Purpose | Usage Count |
|------|---------|-------------|
| `useAuth.ts` | Authentication state | 25 imports |
| `useDashboard.ts` | Dashboard utilities | 1 import |
| `usePortalState.ts` | Landing page state | 0 imports (possibly unused) |
| `useBreathingEffect.ts` | Animation effect | 0 imports (possibly unused) |
| `useAnimatedCounter.ts` | Number animation | 0 imports (possibly unused) |
| `useReducedMotion.ts` | Accessibility | 0 imports (possibly unused) |
| `useStaggerAnimation.ts` | Stagger animation | 1 import |

**Location 2: `/lib/hooks/` (3 hooks, HAS index.ts)**
| Hook | Purpose | Usage Count |
|------|---------|-------------|
| `useScrollDirection.ts` | Scroll direction detection | 1 import |
| `useIsMobile.ts` | Mobile viewport detection | 2 imports |
| `useKeyboardHeight.ts` | Virtual keyboard detection | 1 import |

### Import Patterns in Use

```typescript
// From /hooks/ (25 files)
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';

// From /lib/hooks/ (4 files)
import { useScrollDirection } from '@/lib/hooks/useScrollDirection';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useKeyboardHeight } from '@/lib/hooks';  // Uses barrel export
```

### Consolidation Plan

**Recommended: Consolidate to `/hooks/` with barrel export**

1. Create `/hooks/index.ts`:
```typescript
// Authentication & State
export { useAuth } from './useAuth';
export { useDashboard } from './useDashboard';
export { usePortalState } from './usePortalState';

// Animation & Effects
export { useBreathingEffect } from './useBreathingEffect';
export { useAnimatedCounter } from './useAnimatedCounter';
export { useStaggerAnimation } from './useStaggerAnimation';

// Accessibility
export { useReducedMotion } from './useReducedMotion';

// Viewport & Input
export { useScrollDirection, type ScrollDirection } from './useScrollDirection';
export { useIsMobile } from './useIsMobile';
export { useKeyboardHeight } from './useKeyboardHeight';
```

2. Move hooks from `/lib/hooks/` to `/hooks/`:
   - `useScrollDirection.ts`
   - `useIsMobile.ts`
   - `useKeyboardHeight.ts`

3. Update all imports to use barrel:
```typescript
// Before
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

// After
import { useAuth, useIsMobile } from '@/hooks';
```

4. Delete `/lib/hooks/` directory

---

## Export Pattern Issues

### Current State: Mixed Patterns

**Default Exports (63 files)** - Mostly pages and complex components
- All page components (`app/**/page.tsx`)
- Many component files like `LandingHero.tsx`, `DashboardHero.tsx`
- `tailwind.config.ts`

**Named Exports (52+ files)** - Utility components and functions
- All hooks
- Glass design system components
- Utility components
- Types

### Inconsistency Examples

| Pattern | File | Export Style |
|---------|------|--------------|
| Page | `app/page.tsx` | `export default function LandingPage()` |
| Component | `components/landing/LandingHero.tsx` | `export default function LandingHero()` |
| Component | `components/ui/glass/GlassCard.tsx` | `export function GlassCard()` |
| Component | `components/dashboard/DashboardHero.tsx` | `export const DashboardHero: React.FC = ()` |
| Hook | `hooks/useAuth.ts` | `export function useAuth()` |

### Barrel Export Coverage

| Directory | Has index.ts | Coverage |
|-----------|--------------|----------|
| `/components/ui/glass/` | Yes | Full coverage |
| `/components/navigation/` | Yes | Partial (only BottomNavigation) |
| `/components/ui/mobile/` | Yes | Full coverage |
| `/components/reflection/mobile/` | Yes | Full coverage |
| `/lib/hooks/` | Yes | Full coverage |
| `/hooks/` | No | None |
| `/components/shared/` | No | None |
| `/components/dreams/` | No | None |
| `/components/subscription/` | No | None |
| `/components/dashboard/` | No | None |
| `/types/` | Yes | Full coverage |

### Recommended Standard

1. **Pages:** Default export (Next.js requirement)
2. **Components:** Named export + barrel file
3. **Hooks:** Named export + barrel file
4. **Types:** Named export + barrel file (already consistent)
5. **Utilities:** Named export + barrel file

---

## Priority Fixes

### This Iteration (P0 - Must Fix)

1. **npm audit fix (safe)**
   - Fixes 3 vulnerabilities: glob, jws, mdast-util-to-hast
   - Zero risk, run immediately
   - Command: `npm audit fix`

2. **Remove debug console.logs from reflection.ts**
   - 10 debug statements exposing sensitive user data
   - Keep error logs
   - Time: ~15 minutes

3. **Hook consolidation**
   - Move 3 hooks from `/lib/hooks/` to `/hooks/`
   - Create `/hooks/index.ts` barrel export
   - Update 4 import statements
   - Time: ~30 minutes

### This Iteration (P1 - Should Fix)

4. **Remove/replace console.logs in subscriptions.ts**
   - Convert to structured logging or remove
   - Time: ~15 minutes

5. **Fix critical `any` types (15 highest impact)**
   - `error: any` -> `error: unknown` (8 occurrences)
   - Add proper Anthropic SDK types (5 occurrences)
   - Define missing types for dreams/reflections (2 occurrences)
   - Time: ~1 hour

6. **Convert PayPal webhook logs to audit logging**
   - 19 statements need conversion
   - Critical payment code
   - Time: ~30 minutes

### Defer to Next Iteration (P2)

7. **Remaining `any` types (33 occurrences)**
   - Lower impact, component-level
   - Time: ~2 hours

8. **Export pattern standardization**
   - Convert default exports to named exports
   - Add barrel files to remaining component directories
   - Time: ~3 hours

9. **vite/nodemailer upgrades**
   - Breaking changes require testing
   - Schedule for dedicated iteration

### Skip (P3 - Low Value)

10. **Scripts directory console.logs**
    - CLI tools, appropriate use
    - No action needed

---

## Summary Statistics

| Category | Count | Priority |
|----------|-------|----------|
| Console statements (production) | 91 | P0-P1 |
| Console statements (scripts) | 71 | Skip |
| TypeScript `any` types | 48 | P1-P2 |
| `as any` assertions | 14 | P1-P2 |
| npm vulnerabilities | 6 | P0 (3), P2 (3) |
| Hooks needing consolidation | 3 | P0 |
| Missing barrel exports | 6 directories | P2 |
| Inconsistent export patterns | ~20 files | P2 |

---

## Recommended Order of Operations

1. `npm audit fix` (3 min)
2. Create `/hooks/index.ts` barrel export (10 min)
3. Move `/lib/hooks/*` to `/hooks/` (10 min)
4. Update 4 imports to use new locations (5 min)
5. Delete `/lib/hooks/` (1 min)
6. Remove debug logs from `reflection.ts` (15 min)
7. Remove debug logs from `subscriptions.ts` (15 min)
8. Convert `error: any` to `unknown` globally (30 min)
9. Add Anthropic SDK types (30 min)

**Total estimated time: ~2 hours**
