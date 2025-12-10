# Builder Task Breakdown

## Overview

**2 primary builders** will work in parallel on isolated test file sets.

| Builder | Components | Estimated Tests | Complexity |
|---------|-----------|-----------------|------------|
| Builder-1 | GlassCard, GlassInput, GlassModal, CosmicLoader | ~90-115 | HIGH |
| Builder-2 | AuthLayout, BottomSheet, AnimatedBackground | ~45-55 | MEDIUM |

**Total Estimated: 135-170 test cases**

---

## Builder-1: Glass UI Components

### Scope

Create comprehensive tests for the core Glass UI component library:
- GlassCard (interactive card container)
- GlassInput (form input with validation and counters)
- GlassModal (modal dialog with focus trap and mobile swipe)
- CosmicLoader (animated loading spinner)

### Complexity Estimate

**HIGH** - GlassInput (245 lines) and GlassModal (246 lines) are complex components with many states, variants, and interactions.

### Success Criteria

- [ ] GlassCard.test.tsx with 20+ test cases covering:
  - Rendering and children
  - Elevated state styling
  - Interactive state (role, tabIndex, cursor)
  - Click and keyboard handlers
  - Custom styling and data attributes
- [ ] GlassInput.test.tsx with 35+ test cases covering:
  - Input types (text, email, password, textarea)
  - Value management and onChange
  - Character counter with color states
  - Word counter with formatted messages
  - Validation states (error, success)
  - Password toggle integration
  - Label and accessibility
- [ ] GlassModal.test.tsx with 25+ test cases covering:
  - Visibility (open/close states)
  - Overlay backdrop and click-to-close
  - Close button functionality
  - Title rendering and heading level
  - Keyboard (Escape) handling
  - Accessibility (role, aria attributes)
  - Mobile behavior (full-screen, drag handle)
- [ ] CosmicLoader.test.tsx with 10+ test cases covering:
  - Rendering and role="status"
  - Size variants (sm, md, lg)
  - Aria-label and screen reader text
  - Custom className
- [ ] All tests pass with `npm run test`

### Files to Create

```
components/ui/glass/__tests__/
├── GlassCard.test.tsx      # 20+ tests
├── GlassInput.test.tsx     # 35+ tests
├── GlassModal.test.tsx     # 25+ tests
└── CosmicLoader.test.tsx   # 10+ tests
```

### Dependencies

**Depends on:** None (parallel execution)
**Blocks:** Integration phase (validation)

### Implementation Notes

1. **GlassCard** uses `motion.div` from framer-motion - mock `useReducedMotion`
2. **GlassInput** has complex state management:
   - Focus state (`isFocused`)
   - Password visibility (`showPassword`)
   - Error shake animation (`isShaking`)
   - Multiple counter modes (characters vs words)
3. **GlassModal** requires multiple mocks:
   - `react-focus-lock` - mock to render children
   - `@/hooks` - mock `useIsMobile` for mobile tests
   - `framer-motion` - mock `useReducedMotion`
4. **CosmicLoader** is memoized - test renders correctly

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **GlassCard Test Pattern** for card tests
- Use **GlassInput Test Pattern** for input tests
- Use **GlassModal Test Pattern** for modal tests
- Use **CosmicLoader Test Pattern** for loader tests
- Follow **Mock Patterns** section for all mocking

### Testing Requirements

- Unit tests for all components
- Test coverage target: 80%+ per component
- All accessibility tests must pass

### Mocks Required

```typescript
// GlassCard, GlassInput, CosmicLoader
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

// GlassInput
vi.mock('@/lib/utils/wordCount', () => ({
  countWords: vi.fn((text: string) =>
    text.trim().split(/\s+/).filter(Boolean).length
  ),
}));

// GlassModal
vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="focus-lock">{children}</div>
  ),
}));

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual('@/hooks');
  return {
    ...actual,
    useIsMobile: vi.fn(() => false),
  };
});
```

---

## Builder-2: Auth and Utility Components

### Scope

Create tests for authentication layout and utility components:
- AuthLayout (auth page wrapper with logo and title)
- BottomSheet (mobile bottom sheet with swipe dismiss)
- AnimatedBackground (decorative animated background)

### Complexity Estimate

**MEDIUM** - Components are simpler than Builder-1's assignments. AuthLayout is 63 lines, BottomSheet has complex swipe logic but can be tested via callbacks.

### Success Criteria

- [ ] AuthLayout.test.tsx with 12+ test cases covering:
  - Children rendering inside GlassCard
  - Logo with link to home
  - Default and custom title
  - Subtitle (present/absent)
  - Accessibility (h1 heading, keyboard navigation)
- [ ] BottomSheet.test.tsx with 25+ test cases covering:
  - Visibility states
  - Height modes (auto, half, full)
  - Title rendering
  - Drag handle indicator
  - Dismiss behaviors (backdrop click, Escape key)
  - Accessibility (dialog role, aria attributes)
- [ ] AnimatedBackground.test.tsx with 10+ test cases covering:
  - Container rendering and positioning
  - Variant classes (cosmic, dream, glow)
  - Intensity levels
  - Reduced motion support
  - Custom className
- [ ] All tests pass with `npm run test`

### Files to Create

```
components/auth/__tests__/
└── AuthLayout.test.tsx           # 12+ tests

components/ui/mobile/__tests__/
└── BottomSheet.test.tsx          # 25+ tests

components/ui/glass/__tests__/
└── AnimatedBackground.test.tsx   # 10+ tests
```

### Dependencies

**Depends on:** None (parallel execution)
**Blocks:** Integration phase (validation)

### Implementation Notes

1. **AuthLayout** uses:
   - `next/link` - mock to standard anchor
   - `GlassCard` - can mock or use real component
2. **BottomSheet** has:
   - Complex swipe-to-dismiss logic
   - Body scroll lock (side effects)
   - `react-focus-lock` for focus trap
   - `framer-motion` for animations and `useMotionValue`
3. **AnimatedBackground** is purely visual:
   - No user interactions
   - Test class application and variant switching
   - Test reduced motion behavior

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **AuthLayout Test Pattern** for auth layout tests
- Use **BottomSheet Test Pattern** for bottom sheet tests
- Use **AnimatedBackground Test Pattern** for background tests
- Follow **Mock Patterns** section for all mocking

### Testing Requirements

- Unit tests for all components
- Test coverage target: 80%+ per component
- All accessibility tests must pass

### Mocks Required

```typescript
// AuthLayout
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Optional: Mock GlassCard for isolation
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

// BottomSheet
vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="focus-lock">{children}</div>
  ),
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useMotionValue: vi.fn(() => ({ set: vi.fn(), get: vi.fn(() => 0) })),
    animate: vi.fn(),
  };
});

// AnimatedBackground
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});
```

---

## Builder Execution Order

### Parallel Group (No dependencies)

Both builders execute simultaneously:
- **Builder-1:** GlassCard, GlassInput, GlassModal, CosmicLoader
- **Builder-2:** AuthLayout, BottomSheet, AnimatedBackground

### Integration Notes

**File Locations:**
- Builder-1 creates files in `/components/ui/glass/__tests__/`
- Builder-2 creates files in:
  - `/components/auth/__tests__/`
  - `/components/ui/mobile/__tests__/`
  - `/components/ui/glass/__tests__/` (AnimatedBackground only)

**Potential Conflict:**
- Both builders touch `/components/ui/glass/__tests__/` directory
- Builder-1: GlassCard, GlassInput, GlassModal, CosmicLoader
- Builder-2: AnimatedBackground
- No file conflicts - different test files

**Shared Test Infrastructure:**
- Both use same mock patterns from `patterns.md`
- Both use existing `vitest.setup.ts` configuration
- No shared state between test files

### Validation Checklist

After both builders complete:

1. [ ] Run `npm run test` - all tests pass
2. [ ] Run `npm run test:coverage` - verify 80%+ coverage
3. [ ] Run `npx tsc --noEmit` - no TypeScript errors
4. [ ] Verify test file locations match plan
5. [ ] Verify test counts meet minimums:
   - GlassCard: 20+ tests
   - GlassInput: 35+ tests
   - GlassModal: 25+ tests
   - CosmicLoader: 10+ tests
   - AuthLayout: 12+ tests
   - BottomSheet: 25+ tests
   - AnimatedBackground: 10+ tests

---

## Summary Table

| Builder | Component | File | Est. Tests | Priority |
|---------|-----------|------|------------|----------|
| 1 | GlassCard | `glass/__tests__/GlassCard.test.tsx` | 20-25 | HIGH |
| 1 | GlassInput | `glass/__tests__/GlassInput.test.tsx` | 35-45 | HIGH |
| 1 | GlassModal | `glass/__tests__/GlassModal.test.tsx` | 25-35 | HIGH |
| 1 | CosmicLoader | `glass/__tests__/CosmicLoader.test.tsx` | 10-12 | MEDIUM |
| 2 | AuthLayout | `auth/__tests__/AuthLayout.test.tsx` | 12-15 | HIGH |
| 2 | BottomSheet | `mobile/__tests__/BottomSheet.test.tsx` | 25-30 | MEDIUM |
| 2 | AnimatedBackground | `glass/__tests__/AnimatedBackground.test.tsx` | 10-12 | LOW |
