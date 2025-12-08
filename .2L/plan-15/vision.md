# Project Vision: Thematic Coherence & Visual Consistency

**Created:** 2025-12-09
**Plan:** plan-15

---

## Problem Statement

Mirror of Dreams has an exceptional design system - the void → amethyst → mirror three-plane depth metaphor, glass-morphism components, semantic color tokens - but it's only ~60% adopted across the application.

When you move between pages, the spell breaks. Some pages feel like they belong to the world (Onboarding, Design System showcase). Others feel like they wandered in from a different app (Subscription Success, Profile).

**The experience should be:** Enter the app and feel absorbed. Every surface, every button, every transition feels intentional. Nothing jolts you out of the world.

**Current pain points:**
- Subscription Success page (10% design system compliance) - hardcoded gradients, no glass-morphism
- Profile page (30% compliance) - jarring blue/red colors instead of mirror palette
- Pricing page (50% compliance) - inline button styles, hardcoded toggle colors
- Landing page (40% compliance) - hardcoded gradient text, manual typography
- Three different button implementations across the app
- Typography defined but not used (manual `text-4xl` instead of `text-h1`)
- The three-plane depth metaphor is defined but never visually implemented

---

## Target Users

**Primary user:** Anyone using Mirror of Dreams

This affects every user on every page. Visual inconsistency creates subconscious friction - even if users can't articulate it, they feel it.

---

## Core Value Proposition

**Transform Mirror of Dreams from a collection of pages into a cohesive world.**

When complete, moving through the app should feel like moving through different rooms of the same sacred space - not teleporting between different buildings.

**Key benefits:**
1. Complete immersion - no visual jolts break the experience
2. Professional polish - every detail feels considered
3. Maintainability - one system, consistently applied

---

## Feature Breakdown

### Must-Have (MVP)

1. **Fix Critical Offenders**
   - Description: Bring the worst pages up to design system compliance
   - Pages: Subscription Success (10%→90%), Profile (30%→90%), Pricing toggle/buttons (50%→90%)
   - Acceptance criteria:
     - [ ] Subscription Success uses GlassCard, mirror colors, proper typography
     - [ ] Profile uses mirror.info/mirror.error instead of hardcoded blue/red
     - [ ] Pricing buttons use GlowButton component
     - [ ] Pricing toggle uses design system colors

2. **Eliminate Hardcoded Colors**
   - Description: Replace all hardcoded Tailwind colors with mirror.* tokens
   - Acceptance criteria:
     - [ ] No `text-blue-*`, `text-red-*`, `text-green-*` outside of design system
     - [ ] All status colors use mirror.success, mirror.error, mirror.warning, mirror.info
     - [ ] All purple/amethyst uses mirror.amethyst-* variants
     - [ ] All gradients use defined backgroundImage tokens

3. **Standardize Typography**
   - Description: Replace manual font sizes with typography system
   - Acceptance criteria:
     - [ ] All page titles use `text-h1` or GradientText
     - [ ] All section headings use `text-h2`
     - [ ] No manual `text-4xl sm:text-5xl` patterns
     - [ ] Body text uses `text-body` or appropriate semantic class

4. **Consolidate Buttons**
   - Description: All buttons use GlowButton component
   - Acceptance criteria:
     - [ ] Remove `.cosmic-button` class usage
     - [ ] Remove inline button styling
     - [ ] Every interactive button is a GlowButton with appropriate variant
     - [ ] Consistent hover/active states across all buttons

5. **Standardize Animation Timing**
   - Description: All animations use design system timing tokens
   - Acceptance criteria:
     - [ ] Framer Motion uses `--transition-*` values where possible
     - [ ] No hardcoded `duration: 0.6` without matching system token
     - [ ] Hover transitions consistent across components

### Should-Have (Post-MVP)

1. **Implement Three-Plane Depth Metaphor**
   - Actually apply void → amethyst → mirror layering visually
   - Create visual depth hierarchy on key pages
   - Background shows void (far), UI elements show amethyst glow (mid), text/actions show mirror clarity (near)

2. **Consolidate Card Components**
   - Merge DashboardCard patterns into GlassCard
   - Single card component with variants for different contexts

3. **Consistent Empty/Loading States**
   - Single EmptyState component used everywhere
   - Single loading pattern (CosmicLoader) used everywhere

### Could-Have (Future)

1. **Design System Linting**
   - ESLint rules to prevent hardcoded colors
   - Warn on non-system typography usage

2. **Storybook Documentation**
   - Visual documentation of all components
   - Usage guidelines embedded

---

## Implementation Approach

### Page-by-Page Transformation

Work through pages from worst to best compliance:

1. **Subscription Success** (10% → 90%)
   - Wrap content in GlassCard
   - Use GradientText for heading
   - Replace hardcoded gradient background
   - Use GlowButton for CTA

2. **Profile** (30% → 90%)
   - Replace `bg-blue-500/10` with `bg-mirror-info/10`
   - Replace `text-red-400` with `text-mirror-error`
   - Use GlowButton variant="danger" for delete actions
   - Apply typography system

3. **Landing** (40% → 90%)
   - Replace hardcoded gradient text with `gradient-text-cosmic`
   - Apply `text-h1`, `text-h2` typography
   - Standardize animation timing

4. **Pricing** (50% → 90%)
   - Replace inline button styles with GlowButton
   - Replace toggle hardcoded colors with design tokens
   - Apply typography system

5. **Remaining Pages** - Apply same treatment to any page below 90%

### Component Audit

- Search and replace `.cosmic-button` → `<GlowButton>`
- Search and replace hardcoded color patterns
- Search and replace manual font sizes

---

## Success Criteria

**The MVP is successful when:**

1. **Visual Consistency Score**
   - Metric: % of pages at 90%+ design system compliance
   - Target: 100% of pages

2. **Zero Hardcoded Colors**
   - Metric: Grep for `text-blue-`, `text-red-`, `bg-green-` etc.
   - Target: Zero matches outside of design system files

3. **Component Consistency**
   - Metric: Number of button implementation patterns
   - Target: 1 (GlowButton only)

4. **The Feel Test**
   - Metric: Navigate through all pages
   - Target: No visual jolts, every page feels like the same world

---

## Out of Scope

**Explicitly not included in this plan:**
- New features or functionality
- Performance optimization
- New pages or flows
- Database/backend changes
- Mobile-specific redesign (already addressed in plan-11)

**Why:** This is purely about bringing existing design system to full adoption. No new design, just completing what exists.

---

## Assumptions

1. The current design system is the correct one (no redesign needed)
2. GlassCard, GlowButton, GradientText are the canonical components
3. The mirror.* color palette is complete and correct
4. Typography system is adequate for all use cases

---

## Technical Notes

### Files to Modify (Priority Order)

1. `/app/subscription/success/page.tsx` - Complete redesign to match system
2. `/app/profile/page.tsx` - Color token replacement
3. `/app/pricing/page.tsx` - Button/toggle standardization
4. `/app/page.tsx` (landing) - Typography and gradient standardization
5. `/components/dashboard/cards/DreamsCard.tsx` - Button standardization
6. Any other files with hardcoded colors

### Search Patterns for Audit

```bash
# Find hardcoded colors
grep -r "text-blue-" --include="*.tsx"
grep -r "text-red-" --include="*.tsx"
grep -r "bg-green-" --include="*.tsx"
grep -r "text-green-" --include="*.tsx"

# Find manual typography
grep -r "text-4xl" --include="*.tsx"
grep -r "text-5xl" --include="*.tsx"

# Find non-standard buttons
grep -r "cosmic-button" --include="*.tsx"
```

---

## Reference: Best Practice Pages

Use these as the standard to match:

1. **Onboarding** (`/app/onboarding/page.tsx`) - 95% compliance
   - Proper GlassCard usage
   - GlowButton throughout
   - GradientText for emphasis
   - mirror.* colors
   - ProgressOrbs for state

2. **Design System** (`/app/design-system/page.tsx`) - 100% compliance
   - The canonical reference for every pattern

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
