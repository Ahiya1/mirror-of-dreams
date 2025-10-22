# Builder Task Breakdown

## Overview

**Total Builders:** 1 primary builder (with option to split if needed)

**Estimated Duration:** 8-12 hours

**Complexity Assessment:** MEDIUM-HIGH
- 10 components to build (moderate quantity)
- Framer Motion integration (new library)
- TypeScript strict mode (requires proper typing)
- Accessibility requirements (reduced motion, ARIA labels)
- Performance constraints (glassmorphism can be expensive)

**Split Strategy:**
- **Start with 1 builder** handling all tasks sequentially
- **Split after 4 hours** if builder requests it (see split strategy below)
- Foundation components must complete before complex components begin

---

## Builder-1: Design System Foundation (Complete)

### Scope

Build the complete glass-morphism design system foundation including:
- Install Framer Motion 11.15.0 and Lucide React 0.546.0
- Extend Tailwind configuration with mirror colors, gradients, glass effects
- Create animation variants library with reusable motion patterns
- Build 10 core glass components with TypeScript, accessibility, and performance
- Create component showcase page for testing and validation
- Validate performance on desktop and mobile

**This builder is responsible for 100% of the design system foundation.**

### Complexity Estimate

**MEDIUM-HIGH**

**Breakdown:**
- Dependencies & Config: LOW (1 hour)
- Animation Variants: MEDIUM (1 hour)
- Foundation Components (3): MEDIUM (2-3 hours)
- Complex Components (3): HIGH (3-4 hours)
- Specialty Components (4): MEDIUM (2-3 hours)
- Showcase Page: LOW (1 hour)
- Testing & Validation: MEDIUM (1-2 hours)

**Total:** 8-12 hours

**Recommendation:** If builder feels overwhelmed after Phase 3 (foundation components), consider splitting into Sub-builders 1A and 1B (see split strategy below).

### Success Criteria

**Technical Completion:**
- [ ] Framer Motion 11.15.0 installed and imported successfully
- [ ] Lucide React 0.546.0 installed and imported successfully
- [ ] Tailwind config extended with 15+ colors, 3+ gradients, glass utilities
- [ ] Animation variants library created with 8+ variant definitions
- [ ] All 10 components built with 'use client' directive
- [ ] All components have TypeScript interfaces with JSDoc comments
- [ ] Barrel export from components/ui/glass/index.ts working

**Functionality:**
- [ ] All components render without errors
- [ ] Animations work smoothly on desktop (60fps)
- [ ] Reduced motion support tested and working
- [ ] Hover states work on all interactive components
- [ ] Modal opens/closes with animations
- [ ] Showcase page displays all components

**Performance:**
- [ ] Desktop animations run at 60fps (Chrome DevTools Performance tab)
- [ ] Mobile animations run at 30fps+ with 4x CPU throttling
- [ ] No console errors or warnings
- [ ] Lighthouse Performance score > 90 on showcase page
- [ ] Paint times < 100ms per component on desktop

**Accessibility:**
- [ ] All components respect prefers-reduced-motion
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Icon buttons have aria-label attributes
- [ ] Focus indicators visible on keyboard navigation
- [ ] Contrast ratios meet WCAG AA (verify with DevTools)

**Browser Compatibility:**
- [ ] Glass effects work in Chrome 90+
- [ ] Glass effects work in Safari 14+
- [ ] Glass effects work in Firefox 88+
- [ ] Fallback backgrounds work in unsupported browsers

### Files to Create

**Configuration Files (2):**
- `/home/ahiya/mirror-of-dreams/tailwind.config.ts` - EXTEND (not replace)
- `/home/ahiya/mirror-of-dreams/styles/variables.css` - EXTEND (add glass variables)

**Package Dependencies (1):**
- `/home/ahiya/mirror-of-dreams/package.json` - ADD framer-motion and lucide-react

**Animation Library (3):**
- `/home/ahiya/mirror-of-dreams/lib/animations/variants.ts` - Motion variants
- `/home/ahiya/mirror-of-dreams/lib/animations/config.ts` - Animation configuration
- `/home/ahiya/mirror-of-dreams/lib/animations/hooks.ts` - Animation hooks

**TypeScript Types (1):**
- `/home/ahiya/mirror-of-dreams/types/glass-components.ts` - Component prop interfaces

**Components (11):**
- `/home/ahiya/mirror-of-dreams/components/ui/glass/index.ts` - Barrel export
- `/home/ahiya/mirror-of-dreams/components/ui/glass/GlassCard.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/GlowButton.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/CosmicLoader.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/DreamCard.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/GradientText.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/GlassModal.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/FloatingNav.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/ProgressOrbs.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/GlowBadge.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/AnimatedBackground.tsx`

**Showcase Page (1):**
- `/home/ahiya/mirror-of-dreams/app/design-system/page.tsx` - Component showcase

**Total Files:** 19 files (2 extended, 17 created)

### Dependencies

**Blocks:** Nothing (this is iteration 1)

**Blocked By:** Nothing (no dependencies)

**External Dependencies:**
- Framer Motion 11.15.0 (npm package)
- Lucide React 0.546.0 (npm package)

**Internal Dependencies:**
- Existing Tailwind setup (already configured)
- Existing TypeScript setup (already configured)
- Existing Next.js 14 App Router (already configured)

### Implementation Notes

**Critical First Steps (Do This First):**

1. **Install Dependencies:**
   ```bash
   cd /home/ahiya/mirror-of-dreams
   npm install framer-motion@^11.15.0 lucide-react@^0.546.0
   ```
   Verify installation:
   ```bash
   npm list framer-motion lucide-react
   ```

2. **Extend Tailwind Config:**
   - Open `/home/ahiya/mirror-of-dreams/tailwind.config.ts`
   - Find `theme.extend.colors` section
   - Add mirror colors (see patterns.md for full example)
   - Add gradients to `theme.extend.backgroundImage`
   - Add glass utilities to `theme.extend.backdropBlur`
   - Add glow shadows to `theme.extend.boxShadow`
   - Add glow animations to `theme.extend.animation` and `theme.extend.keyframes`
   - DO NOT REMOVE existing cosmic colors

3. **Create Animation Variants Library:**
   - Create directory: `mkdir -p /home/ahiya/mirror-of-dreams/lib/animations`
   - Create `variants.ts` with all animation variants (see patterns.md)
   - Create `config.ts` with easing functions and durations
   - Create `hooks.ts` with useAnimationConfig hook
   - This MUST be done before building components

4. **Create TypeScript Interfaces:**
   - Create `/home/ahiya/mirror-of-dreams/types/glass-components.ts`
   - Define GlassBaseProps interface
   - Define all component-specific prop interfaces (10 interfaces)
   - Add barrel export to `/home/ahiya/mirror-of-dreams/types/index.ts`

**Component Build Order (Critical - Follow This Sequence):**

**Phase 1: Foundation Components (Build First)**
These have NO dependencies on other components:
1. GlassCard.tsx
2. GlowButton.tsx
3. GradientText.tsx

**Phase 2: Complex Components (Build Second)**
These depend on Phase 1 components:
4. DreamCard.tsx (uses GlassCard)
5. GlassModal.tsx (uses GlassCard, uses X icon from Lucide)
6. FloatingNav.tsx (uses GlassCard)

**Phase 3: Specialty Components (Build Third)**
These are independent, can be built in parallel:
7. CosmicLoader.tsx (standalone animation)
8. ProgressOrbs.tsx (standalone component)
9. GlowBadge.tsx (standalone component)
10. AnimatedBackground.tsx (standalone background)

**Phase 4: Integration**
11. Create barrel export index.ts
12. Create showcase page

**Important Gotchas:**

1. **'use client' Directive:**
   - EVERY component MUST start with `'use client'` on line 1
   - This is required for Framer Motion to work
   - Missing this will cause hydration errors

2. **Reduced Motion Support:**
   - Import `useReducedMotion` from 'framer-motion' in every animated component
   - Conditionally apply animations based on user preference
   - Test with Chrome DevTools (Cmd+Shift+P → "Emulate CSS prefers-reduced-motion")

3. **Glass Effect Performance:**
   - Limit simultaneous backdrop-filter elements (max 3-4 visible)
   - Test on mobile early (Chrome DevTools → Performance → 4x CPU slowdown)
   - If animations are janky, reduce blur intensity on mobile

4. **TypeScript Strict Mode:**
   - All props must be properly typed
   - Use ReactNode for children prop
   - Optional props marked with `?`
   - Run `npm run build` to check for type errors

5. **Import Paths:**
   - Use `@/` alias for imports (already configured in tsconfig.json)
   - Example: `import { cn } from '@/lib/utils'`
   - Example: `import { cardVariants } from '@/lib/animations/variants'`

6. **Tailwind Class Merging:**
   - Use `cn()` utility from `@/lib/utils` to merge classes
   - This handles conflicting Tailwind classes correctly
   - Example: `cn('bg-white/5', className)`

### Patterns to Follow

Reference **ALL** patterns from `/home/ahiya/mirror-of-dreams/.2L/plan-2/iteration-19/plan/patterns.md`:

**Essential Patterns:**
- Component Structure Pattern (template for all components)
- Animation Patterns (Framer Motion variants)
- Reduced Motion Pattern (accessibility requirement)
- Glass Effect Patterns (backdrop-blur, gradients, glows)
- Button Patterns (primary, secondary, ghost variants)
- Modal Patterns (AnimatePresence, overlay + content)
- Icon Patterns (Lucide React usage)
- TypeScript Patterns (prop interfaces, JSDoc comments)
- Import Order Convention (consistent organization)
- Accessibility Patterns (keyboard nav, ARIA labels)

**Use patterns.md as copy-paste source** - all code examples are production-ready.

### Testing Requirements

**Unit Testing (Manual):**
- Test each component individually on showcase page
- Verify all variants render correctly
- Check animations with Chrome DevTools Performance tab
- Test reduced motion by disabling animations in OS settings

**Integration Testing:**
- Test complex components that use foundation components
- Verify GlassModal uses GlassCard correctly
- Verify DreamCard extends GlassCard properly
- Test showcase page displays all components without errors

**Performance Testing:**
- Open Chrome DevTools → Performance tab
- Record 6 seconds of showcase page interaction
- Verify 60fps on desktop (no dropped frames)
- Enable 4x CPU throttling, verify 30fps minimum
- Check paint times < 100ms per component

**Accessibility Testing:**
- Test keyboard navigation (Tab through all interactive elements)
- Test Enter/Space activation on buttons
- Verify focus indicators visible
- Test with screen reader (optional but recommended)
- Test reduced motion (toggle in OS settings)
- Verify ARIA labels on icon buttons

**Browser Compatibility Testing:**
- Test in Chrome 90+ (primary target)
- Test in Safari 14+ (webkit differences)
- Test in Firefox 88+ (gecko differences)
- Verify glass effects or fallbacks in all browsers

**Mobile Testing:**
- Use Chrome DevTools device emulation
- Test on iPhone 12 / Pixel 5 equivalents
- Enable 4x CPU throttling
- Verify reduced blur on mobile (8px vs 16px desktop)
- Check touch interactions (tap, swipe)

**Coverage Target:**
- 100% of components tested on showcase page
- 100% of variants tested
- 100% of interactive states tested (hover, focus, active)
- Performance validated on desktop and mobile

### Potential Split Strategy (if complexity is HIGH)

If this task proves too complex after 4 hours of work, consider splitting into:

**Foundation (Primary Builder 1 - Completes Before Splitting):**
Before splitting, the primary builder MUST complete:
- Dependencies installation (npm install)
- Tailwind config extension
- Animation variants library
- TypeScript interfaces
- Foundation components (GlassCard, GlowButton, GradientText)

**Sub-builder 1A: Complex Components**
Takes over after foundation complete:

**Scope:**
- DreamCard (extends GlassCard)
- GlassModal (uses GlassCard, AnimatePresence)
- FloatingNav (uses GlassCard)

**Files to Create:**
- `/home/ahiya/mirror-of-dreams/components/ui/glass/DreamCard.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/GlassModal.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/FloatingNav.tsx`

**Dependencies:**
- Foundation components (GlassCard, GlowButton) MUST be complete
- Animation variants library MUST exist
- TypeScript interfaces MUST be defined

**Estimate:** 3-4 hours

**Success Criteria:**
- All 3 components render without errors
- Modal opens/closes with animations
- FloatingNav uses glass effect correctly
- DreamCard extends GlassCard properly

---

**Sub-builder 1B: Specialty Components + Showcase**
Works in parallel with Sub-builder 1A:

**Scope:**
- CosmicLoader (animated gradient ring)
- ProgressOrbs (multi-step indicator)
- GlowBadge (status badges)
- AnimatedBackground (gradient background)
- Component showcase page

**Files to Create:**
- `/home/ahiya/mirror-of-dreams/components/ui/glass/CosmicLoader.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/ProgressOrbs.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/GlowBadge.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/AnimatedBackground.tsx`
- `/home/ahiya/mirror-of-dreams/components/ui/glass/index.ts` (barrel export)
- `/home/ahiya/mirror-of-dreams/app/design-system/page.tsx`

**Dependencies:**
- Animation variants library MUST exist
- TypeScript interfaces MUST be defined
- Foundation components helpful but not required

**Estimate:** 3-4 hours

**Success Criteria:**
- All 4 components render without errors
- CosmicLoader animates smoothly
- ProgressOrbs displays correctly
- Showcase page displays all components (including from Sub-builder 1A)

---

**Integration (Both Sub-builders):**
After both sub-builders complete:
- Update barrel export to include all components
- Test all components together on showcase page
- Validate performance with all components visible
- Run final accessibility audit

**Estimate:** 30 minutes

---

**When to Split:**
- If primary builder feels overwhelmed after 4 hours
- If foundation components take longer than expected (>3 hours)
- If builder prefers parallel work on independent components

**When NOT to Split:**
- If primary builder is making good progress (< 4 hours into work)
- If foundation components complete quickly (< 2 hours)
- If builder prefers working sequentially

**Decision Point:**
Primary builder should assess at 4-hour mark and request split if needed.

---

## Builder Execution Order

### Sequential (Single Builder)

**Phase 1: Setup (1 hour)**
- Install dependencies
- Extend Tailwind config
- Create animation variants library
- Create TypeScript interfaces

**Phase 2: Foundation Components (2-3 hours)**
- GlassCard
- GlowButton
- GradientText

**Phase 3: Complex Components (3-4 hours)**
- DreamCard
- GlassModal
- FloatingNav

**Phase 4: Specialty Components (2-3 hours)**
- CosmicLoader
- ProgressOrbs
- GlowBadge
- AnimatedBackground

**Phase 5: Integration (1 hour)**
- Barrel export
- Showcase page

**Phase 6: Testing (1-2 hours)**
- Performance validation
- Accessibility validation
- Browser compatibility

**Total: 8-12 hours**

---

### Parallel (If Split After Phase 2)

**Primary Builder (Completes Foundation):**
- Phase 1: Setup (1 hour)
- Phase 2: Foundation Components (2-3 hours)
- **Total: 3-4 hours, then hands off**

**Sub-builder 1A (Complex Components):**
- Starts after Primary Builder completes Phase 2
- DreamCard, GlassModal, FloatingNav (3-4 hours)

**Sub-builder 1B (Specialty + Showcase):**
- Starts after Primary Builder completes Phase 2
- CosmicLoader, ProgressOrbs, GlowBadge, AnimatedBackground (2-3 hours)
- Showcase page (1 hour)

**Integration (Both Sub-builders):**
- Merge components (30 minutes)
- Final testing (1 hour)

**Total: 7-10 hours (parallel execution)**

---

## Integration Notes

**Shared Files:**
- `tailwind.config.ts` - Extended in Phase 1 only, no further changes
- `types/glass-components.ts` - Created in Phase 1, extended if new types needed
- `lib/animations/variants.ts` - Created in Phase 1, no changes unless new variants needed
- `components/ui/glass/index.ts` - Barrel export, updated as components complete

**Conflict Prevention:**
- If single builder: No conflicts (sequential work)
- If split builders:
  - Sub-builder 1A owns DreamCard.tsx, GlassModal.tsx, FloatingNav.tsx
  - Sub-builder 1B owns CosmicLoader.tsx, ProgressOrbs.tsx, GlowBadge.tsx, AnimatedBackground.tsx
  - No file overlap between sub-builders
  - Both can update index.ts (add their exports), merge at end

**Coordination Points:**
- Primary builder MUST complete foundation before sub-builders start
- Sub-builders can work in parallel (no dependencies between them)
- Final integration requires both sub-builders complete

**Testing Coordination:**
- Primary builder tests foundation components individually
- Sub-builders test their components individually
- Final integration test requires all components complete
- Showcase page should import and display ALL components

**Communication:**
- If splitting, Primary builder should notify orchestrator when foundation complete
- Sub-builders should notify when their components are ready
- Final integration requires synchronization point

---

## Summary

**Single Builder Approach (Recommended):**
- One builder handles all tasks sequentially
- Clear progression through phases
- No coordination overhead
- Estimated 8-12 hours

**Split Builder Approach (If Needed):**
- Primary builder completes foundation (3-4 hours)
- Sub-builder 1A handles complex components (3-4 hours)
- Sub-builder 1B handles specialty + showcase (3-4 hours)
- Integration and testing (1.5 hours)
- Estimated 7-10 hours (parallel execution)

**Recommendation:** Start with single builder. Only split if builder requests it after 4 hours or if foundation takes longer than 3 hours.

**Next Steps After Completion:**
- Iteration 20 can begin (Core Pages Redesign)
- Design system ready for consumption
- Components documented in showcase
- Performance baselines established
