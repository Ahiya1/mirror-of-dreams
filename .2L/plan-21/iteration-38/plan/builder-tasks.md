# Builder Task Breakdown

## Overview

**2** primary builders will work in parallel with no dependencies between them.
No sub-builder splits are expected - both tasks are well-scoped.

## Builder Assignment Strategy

- Builder 1 focuses on TypeScript types and removing `any` from API routers
- Builder 2 focuses on testing infrastructure and component tests
- Zero dependencies between builders - they work in completely separate file areas
- Both can start and complete independently

---

## Builder-1: TypeScript Types & Any Removal

### Scope

Create centralized Anthropic type definitions and type guards, then systematically remove all `any` types from `evolution.ts` and `visualizations.ts` routers. Also fix the `any` type in `temporal-distribution.ts`.

### Complexity Estimate

**MEDIUM**

Straightforward type definitions and replacements. The SDK provides all needed types - we're primarily re-exporting and extending them.

### Success Criteria

- [ ] `lib/anthropic/types.ts` created with all type re-exports and extensions
- [ ] `lib/anthropic/type-guards.ts` created with `isTextBlock`, `isThinkingBlock`, `isToolUseBlock` guards
- [ ] `lib/anthropic/index.ts` created for clean barrel exports
- [ ] Zero `any` types remaining in `server/trpc/routers/evolution.ts`
- [ ] Zero `any` types remaining in `server/trpc/routers/visualizations.ts`
- [ ] `server/lib/temporal-distribution.ts` Reflection interface fixed
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] Existing tests still pass

### Files to Create

| File | Purpose |
|------|---------|
| `lib/anthropic/types.ts` | Type re-exports (ContentBlock, TextBlock, etc.) and extensions (ExtendedUsage, ExtendedMessageCreateParams) |
| `lib/anthropic/type-guards.ts` | Type guard functions (isTextBlock, isThinkingBlock, isToolUseBlock) and helpers (extractText, extractThinking) |
| `lib/anthropic/index.ts` | Barrel export for clean imports |

### Files to Modify

| File | Changes |
|------|---------|
| `server/trpc/routers/evolution.ts` | Replace 9 `any` types with proper types |
| `server/trpc/routers/visualizations.ts` | Replace 4 `any` types with proper types |
| `server/lib/temporal-distribution.ts` | Fix Reflection interface (line 15) |

### Detailed Changes

#### evolution.ts Changes (9 any removals)

| Line | Current Code | New Code |
|------|-------------|----------|
| 148 | `const requestConfig: any = {` | `const requestConfig: ExtendedMessageCreateParams = {` |
| 208 | `(response.usage as any).thinking_tokens \|\| 0` | `(response.usage as ExtendedUsage).thinking_tokens ?? 0` |
| 247-248 | `(response.usage as any).thinking_tokens \|\| 0` | `(response.usage as ExtendedUsage).thinking_tokens ?? 0` |
| 339 | `selectedReflections.forEach((r: any)` | `selectedReflections.forEach((r)` (inferred from Reflection type) |
| 383 | `const requestConfig: any = {` | `const requestConfig: ExtendedMessageCreateParams = {` |
| 436-437 | `(response.usage as any).thinking_tokens \|\| 0` | `(response.usage as ExtendedUsage).thinking_tokens ?? 0` |
| 475-476 | `(response.usage as any).thinking_tokens \|\| 0` | `(response.usage as ExtendedUsage).thinking_tokens ?? 0` |

Also update content block type guards:
- Line 190-191: Use `isTextBlock` and `isThinkingBlock` guards
- Add imports at top of file

#### visualizations.ts Changes (4 any removals)

| Line | Current Code | New Code |
|------|-------------|----------|
| 82 | `let reflections: any[]` | `let reflections: Reflection[]` |
| 172 | `const requestConfig: any = {` | `const requestConfig: ExtendedMessageCreateParams = {` |
| 210 | `response.content.find((block: any) => block.type === 'thinking')` | `response.content.find(isThinkingBlock)` |
| 342 | `reflections: any[]` | `reflections: Reflection[]` |

Also update content block type guards:
- Line 199: Use `isTextBlock` guard
- Add imports at top of file

#### temporal-distribution.ts Changes

```typescript
// BEFORE (line 12-16):
export interface Reflection {
  id: string;
  created_at: string;
  [key: string]: any;
}

// AFTER:
export interface Reflection {
  id: string;
  created_at: string;
  dream?: string;
  plan?: string;
  relationship?: string;
  offering?: string;
  dream_date?: string;
  dreams?: {
    title: string;
    category: string;
  };
  [key: string]: string | { title: string; category: string } | undefined;
}
```

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (Builder 2 works independently)

### Implementation Notes

1. **Start with types.ts** - Create all type definitions first
2. **Then type-guards.ts** - Create guards that use the types
3. **Then index.ts** - Create barrel export
4. **Fix evolution.ts** - Has more `any` types, fix first
5. **Fix visualizations.ts** - Fewer changes, similar pattern
6. **Fix temporal-distribution.ts** - Simple interface update
7. **Run TypeScript check** - `npx tsc --noEmit` after each file

**Import pattern to use:**
```typescript
import {
  ExtendedMessageCreateParams,
  ExtendedUsage
} from '@/lib/anthropic/types';
import {
  isTextBlock,
  isThinkingBlock
} from '@/lib/anthropic/type-guards';
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Pattern 1: Type Re-exports for `lib/anthropic/types.ts`
- Pattern 2: Type Guards for `lib/anthropic/type-guards.ts`
- Pattern 3: Request Configuration for replacing `any` requestConfig
- Pattern 4: Usage with Thinking Tokens for thinking_tokens access
- Pattern 5: Reflection Interface Fix for temporal-distribution.ts

### Testing Requirements

- Run `npx tsc --noEmit` to verify type safety
- Run `npm test` to verify existing tests still pass
- No new tests required for type definitions

---

## Builder-2: Component Testing Setup & Tests

### Scope

Install testing-library packages, configure Vitest for component testing, and create 10+ component test files covering Priority 1 and 2 components (pure presentational and simple interactive).

### Complexity Estimate

**MEDIUM**

Well-defined scope with clear patterns. Testing-library is standard and well-documented.

### Success Criteria

- [ ] `@testing-library/react` installed
- [ ] `@testing-library/jest-dom` installed
- [ ] `@testing-library/user-event` installed
- [ ] `vitest.setup.ts` updated with jest-dom matchers
- [ ] `vitest.config.ts` updated with component coverage
- [ ] 10+ component test files created
- [ ] All tests passing with `npm test`
- [ ] Coverage includes `components/**/*.tsx`

### Files to Create

| File | Purpose | Test Count |
|------|---------|------------|
| `components/reflection/__tests__/ToneBadge.test.tsx` | ToneBadge tests | ~10 tests |
| `components/reflection/__tests__/CharacterCounter.test.tsx` | CharacterCounter tests | ~10 tests |
| `components/reflection/__tests__/ProgressBar.test.tsx` | ProgressBar tests | ~8 tests |
| `components/ui/glass/__tests__/GlowButton.test.tsx` | GlowButton tests | ~15 tests |
| `components/ui/glass/__tests__/GradientText.test.tsx` | GradientText tests | ~6 tests |
| `components/ui/glass/__tests__/GlowBadge.test.tsx` | GlowBadge tests | ~8 tests |
| `components/dashboard/shared/__tests__/TierBadge.test.tsx` | TierBadge tests | ~12 tests |
| `components/icons/__tests__/DreamCategoryIcon.test.tsx` | Icon tests | ~8 tests |
| `components/icons/__tests__/DreamStatusIcon.test.tsx` | Status icon tests | ~8 tests |
| `components/ui/__tests__/PasswordToggle.test.tsx` | Password toggle tests | ~6 tests |

**Total: 10 test files, ~90 tests**

### Files to Modify

| File | Changes |
|------|---------|
| `vitest.setup.ts` | Add `import '@testing-library/jest-dom/vitest';` |
| `vitest.config.ts` | Add `'components/**/*.tsx'` to coverage include |

### Package Installation

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (Builder 1 works independently)

### Implementation Notes

1. **Install packages first** - Run npm install command
2. **Update vitest.setup.ts** - Add jest-dom import
3. **Update vitest.config.ts** - Add component coverage
4. **Run test to verify setup** - `npm test` should still work
5. **Create test files in order:**
   - Start with simplest: ToneBadge, GradientText
   - Then with calculations: CharacterCounter
   - Then with interactions: GlowButton
   - Then remaining components

**Mock patterns to use:**

For haptics in GlowButton:
```typescript
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
}));
```

For framer-motion if needed:
```typescript
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Pattern 1: Basic Component Test Structure
- Pattern 2: Pure Presentational Component Test
- Pattern 3: Character Counter / Progress Component Test
- Pattern 4: Mocking Haptic Feedback
- Pattern 5: Testing with Framer Motion (if needed)

### Testing Requirements

- All created tests must pass
- Test coverage should increase after adding component tests
- Use accessible queries (`getByRole`, `getByText`) over `getByTestId`

### Component Test Coverage Guide

| Component | What to Test |
|-----------|--------------|
| ToneBadge | Renders tone text, applies correct colors per tone, glow toggle, custom className |
| CharacterCounter | Displays counts, progress bar aria attrs, warning at 85%, error at 100%, screen reader announcement |
| ProgressBar | Step display, current step highlight, completion state, custom className |
| GlowButton | All variants, all sizes, click handler, disabled state, haptic feedback mock, button type |
| GradientText | Gradient classes, children rendering, custom className |
| GlowBadge | Variant colors, glow effect, children rendering |
| TierBadge | All tiers (free/pro/unlimited), size variants, animation toggle, glow toggle, icon display |
| DreamCategoryIcon | All categories render correct icon, fallback for unknown |
| DreamStatusIcon | All statuses render correct icon/color |
| PasswordToggle | Toggle visibility, icon changes, accessibility |

---

## Builder Execution Order

### Parallel Execution (No dependencies)

Both builders can start immediately and work in parallel:

- **Builder-1:** TypeScript types and any removal
- **Builder-2:** Component testing setup and tests

### Integration Notes

**No conflicts expected** - builders work in completely separate areas:
- Builder-1: `lib/anthropic/`, `server/trpc/routers/`, `server/lib/`
- Builder-2: `components/**/__tests__/`, `vitest.setup.ts`, `vitest.config.ts`

### Final Validation

After both builders complete:

1. Run `npx tsc --noEmit` - Should pass with no errors
2. Run `npm test` - All tests should pass
3. Run `npm run lint` - Should pass (if applicable)
4. Verify coverage report includes components

---

## Quick Reference

### Builder-1 Files
```
CREATE:
  lib/anthropic/types.ts
  lib/anthropic/type-guards.ts
  lib/anthropic/index.ts

MODIFY:
  server/trpc/routers/evolution.ts
  server/trpc/routers/visualizations.ts
  server/lib/temporal-distribution.ts
```

### Builder-2 Files
```
INSTALL:
  @testing-library/react
  @testing-library/jest-dom
  @testing-library/user-event

MODIFY:
  vitest.setup.ts
  vitest.config.ts

CREATE:
  components/reflection/__tests__/ToneBadge.test.tsx
  components/reflection/__tests__/CharacterCounter.test.tsx
  components/reflection/__tests__/ProgressBar.test.tsx
  components/ui/glass/__tests__/GlowButton.test.tsx
  components/ui/glass/__tests__/GradientText.test.tsx
  components/ui/glass/__tests__/GlowBadge.test.tsx
  components/dashboard/shared/__tests__/TierBadge.test.tsx
  components/icons/__tests__/DreamCategoryIcon.test.tsx
  components/icons/__tests__/DreamStatusIcon.test.tsx
  components/ui/__tests__/PasswordToggle.test.tsx
```
