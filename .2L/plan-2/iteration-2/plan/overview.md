# 2L Iteration Plan - Mirror of Dreams Core Pages Redesign

## Project Vision

Transform the three core pages (Dashboard, Dreams, and Reflection) from inline JSX styling to the magical glass design system built in Iteration 1. This redesign will bring sharp, glassy, glowy aesthetics with mystical blue/purple color schemes to create an enchanted mirror experience. The goal is to replace 1,783+ lines of inline styled-jsx with reusable glass components while preserving all existing functionality, state management, and business logic.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] All inline styled-jsx removed from Dashboard, Dreams, and Reflection pages (1,783+ lines eliminated)
- [ ] Glass components used consistently across all three pages (GlassCard, GlowButton, CosmicLoader, etc.)
- [ ] Visual parity achieved - pages look identical or better than current implementation
- [ ] All existing functionality preserved - tRPC queries, state management, navigation, forms work unchanged
- [ ] Animations smooth at 60fps on desktop, 30fps on mobile
- [ ] Lighthouse performance score >85 (no regression from current 90+)
- [ ] Reduced motion support enabled automatically via glass components
- [ ] Mobile responsive on all breakpoints (1200px, 1024px, 768px, 480px)
- [ ] No console errors or TypeScript errors
- [ ] All user flows tested and validated (reflect, create dream, filter dreams, etc.)

## MVP Scope

**In Scope:**

**Dashboard Page:**
- Replace navigation bar with glass styling
- Convert all buttons to GlowButton components (Reflect Now, Refresh, Upgrade)
- Replace loading spinner with CosmicLoader
- Convert toast notifications to GlassCard + GlowBadge
- Replace error banner with GlassCard
- Update user dropdown menu with glass styling
- Preserve all 5 dashboard cards (UsageCard, ReflectionsCard, DreamsCard, EvolutionCard, SubscriptionCard)
- Preserve existing stagger animation system
- Preserve tRPC data fetching logic

**Dreams Page:**
- Replace loading spinner with CosmicLoader
- Convert header section to glass styling
- Replace all filter buttons with GlowButton
- Convert Create Dream button to GlowButton
- Replace limits banner with GlassCard
- Update empty state with GlassCard
- Replace CreateDreamModal with GlassModal wrapper
- Preserve grid layout and masonry pattern
- Preserve tRPC query integration
- Preserve status filtering logic

**Reflection Flow:**
- Replace both loading states with CosmicLoader
- Convert all navigation buttons to GlowButton (Back, Next, Continue)
- Replace Submit button with GlowButton
- Convert New Reflection button to GlowButton
- Replace Progress Ring with ProgressOrbs component
- Update mirror frame with glass styling
- Convert choice buttons to GlowButton
- Update tone selection cards with glass styling
- Update dream selection cards with glass styling
- Update output display with glass styling
- PRESERVE all tone-based ambient animations (fusion-breath, gentle-stars, intense-swirl)
- PRESERVE all cosmic particles and background effects
- PRESERVE multi-step state machine logic

**Out of Scope (Post-MVP):**

- Dashboard card component internal refactoring (cards already have glass-like styling)
- Full multi-step conversion of CreateDreamModal (keep single-step, just add glass effects)
- Migration of separate CSS files (dashboard.css, mirror.css) - minimal changes only
- New features or functionality enhancements
- Evolution and Visualizations pages (deferred to Iteration 3)
- E2E test automation (manual testing only)
- Focus trap implementation for modals (enhancement for future)
- Mobile hamburger menu (current responsive behavior sufficient)

## Development Phases

1. **Exploration** ✅ Complete (2 explorers analyzed current state and design system)
2. **Planning** 🔄 Current (creating comprehensive development plan)
3. **Building** ⏳ 35-45 hours (3-4 primary builders in parallel)
4. **Integration** ⏳ 2-3 hours (merge builder outputs, resolve conflicts)
5. **Validation** ⏳ 3-4 hours (visual regression, functionality testing, performance audit)
6. **Deployment** ⏳ Final (merge to main, deploy to production)

## Timeline Estimate

**Exploration:** Complete (2 explorer reports)
**Planning:** Complete (this document)
**Building:** 35-45 hours total
- Dashboard: 8 hours (1 builder)
- Dreams: 12 hours (1 builder, may split into 2 sub-builders)
- Reflection: 13 hours (2 sub-builders working in parallel)
- Shared GlassInput component: 2 hours (any builder)
- Pattern documentation: 1 hour (any builder)

**Integration:** 2-3 hours
- Merge all builder branches
- Resolve styling conflicts
- Test cross-page navigation
- Verify consistent styling

**Validation:** 3-4 hours
- Visual regression testing (screenshot comparison)
- Functionality testing (all user flows)
- Performance testing (Lighthouse audits)
- Mobile responsiveness testing
- Cross-browser testing (Chrome, Safari, Firefox)

**Total:** ~45 hours of builder work + 6 hours integration/validation = **51 hours**

**Calendar time:**
- With 1 builder sequential: 7 days
- With 2 builders parallel: 4 days
- With 3 builders parallel: 3 days (optimal)

## Risk Assessment

### High Risks

**Risk: Reflection multi-step state machine breaks during refactoring**
- **Impact:** Users cannot create reflections (critical business flow)
- **Likelihood:** Medium (40%)
- **Mitigation:**
  - Split Reflection into 2 sub-builders to reduce scope per builder
  - Preserve ALL state logic - only change UI components
  - Test each step transition manually (0 → 1 → 2 → ... → 6)
  - Create rollback plan if issues arise
  - Document state machine before changes

**Risk: Performance degradation from excessive glass blur effects**
- **Impact:** Janky animations, slow interactions, poor mobile experience
- **Likelihood:** Medium (30%)
- **Mitigation:**
  - Set performance budget: <100ms paint time per frame
  - Reduce blur intensity on mobile (8px instead of 16px)
  - Use `will-change: transform` for animated elements
  - Test on real low-power devices (iPhone SE, budget Android)
  - Run Lighthouse audit after Dashboard completion
  - Disable animations on low-end devices with `useReducedMotion`

### Medium Risks

**Risk: Mobile layout breaks on small screens**
- **Impact:** Mobile users cannot use app (high business impact)
- **Likelihood:** Low (20%)
- **Mitigation:**
  - Test all breakpoints during development (1200px, 1024px, 768px, 480px)
  - Ensure touch targets >44px for all buttons
  - Test with real mobile keyboards (iOS Safari, Chrome Android)
  - Use responsive Tailwind classes consistently
  - Verify glass effects work on mobile Safari (backdrop-filter support)

**Risk: Visual inconsistency during incremental migration**
- **Impact:** Pages look mixed during development (some glass, some inline)
- **Likelihood:** High (70%)
- **Mitigation:**
  - Complete one page at a time (Dashboard → Dreams → Reflection)
  - Fast iteration cycles (complete each page in 1-2 days)
  - Use feature flags if needed to hide incomplete work
  - Maintain style guide during migration

**Risk: tRPC query integration issues**
- **Impact:** Data doesn't load correctly on pages
- **Likelihood:** Low (10%)
- **Mitigation:**
  - Do NOT modify tRPC query logic
  - Preserve all data fetching hooks (useDashboard, dreams.list, etc.)
  - Test all data-dependent components after changes
  - Verify loading states work correctly

### Low Risks

**Risk: TypeScript type errors from component prop changes**
- **Impact:** Build errors, delayed integration
- **Likelihood:** Low (15%)
- **Mitigation:**
  - Use TypeScript strict mode during development
  - Reference glass component types from types/glass-components.ts
  - Run `npm run build` frequently during development

## Integration Strategy

### Incremental Replacement Approach

All builders will follow an **incremental replacement strategy** rather than full page rewrites:

1. **Component-by-component replacement:** Replace one inline styled element at a time
2. **Visual parity validation:** Take before/after screenshots for each change
3. **Functionality preservation:** Test that existing behavior unchanged
4. **Parallel safe:** Multiple builders can work on different pages simultaneously

### Builder Coordination

**Phase 1: Quick Wins (Parallel, Day 1)**
- Builder-1 (Dashboard): Replace loading states, primary buttons
- Builder-2 (Dreams): Replace loading states, primary buttons
- Builder-3 (Reflection): Replace loading states, navigation buttons

**Phase 2: Core Components (Parallel, Days 2-3)**
- Builder-1 (Dashboard): Navigation, toasts, dropdowns
- Builder-2 (Dreams): Filters, header, modal
- Builder-3A (Reflection): Mirror frame, progress indicator
- Builder-3B (Reflection): Tone selection, output display

**Phase 3: Integration (Sequential, Day 4)**
- Merge all branches
- Resolve conflicts (shared navigation, CSS imports)
- Test cross-page flows

### Conflict Prevention

**Shared navigation component:**
- Dashboard currently has custom navigation (lines 230-353)
- Decision: Keep per-page navigation for now (don't make app-wide)
- Future iteration can unify navigation

**DreamCard naming conflict:**
- Existing: `components/dreams/DreamCard.tsx`
- Glass version: `components/ui/glass/DreamCard.tsx`
- Resolution: Rename glass version to `GlassDreamCard` in barrel export
- Builders import with clear name: `import { GlassDreamCard } from '@/components/ui/glass'`

**CSS file imports:**
- Dashboard imports `@/styles/dashboard.css`
- Reflection imports `@/styles/mirror.css`
- Strategy: Leave imports intact, remove specific CSS rules as components replaced
- Final cleanup: Delete unused CSS files after all replacements complete

**Animation conflicts:**
- Dashboard has custom stagger animation hook
- Glass components have entrance animations
- Resolution: Disable glass animations with `animated={false}` prop on Dashboard cards
- Preserve existing stagger system

**Z-index layering:**
- CosmicBackground: z-0
- Page content: z-10
- Navigation: z-100
- Modals: z-1000
- Document in patterns.md for consistency

## Deployment Plan

### Pre-Deployment Checklist

- [ ] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] All console errors resolved in browser
- [ ] Visual regression screenshots reviewed and approved
- [ ] All user flows tested manually
- [ ] Lighthouse performance >85 on all pages
- [ ] Mobile responsive verified on real devices
- [ ] Cross-browser testing complete (Chrome, Safari, Firefox)
- [ ] Reduced motion support tested (toggle OS setting)

### Deployment Strategy

**Approach:** Direct merge to main (no feature flags needed)

**Reasoning:**
- Frontend-only changes, no backend dependencies
- Visual parity maintained, users won't notice difference
- Incremental approach minimizes risk
- Rollback available via git revert if critical issues

**Steps:**
1. Final integration testing on staging branch
2. Create PR with before/after screenshots
3. Code review by 1+ reviewer
4. Merge to main after approval
5. Monitor production for errors (Sentry, logs)
6. Quick rollback plan: `git revert` if critical issues

### Post-Deployment Monitoring

**Week 1 Metrics:**
- Monitor error rates (Sentry alerts)
- Track Lighthouse scores (performance regression)
- Gather user feedback (any visual issues reported)
- Monitor mobile analytics (bounce rate changes)

**Success Indicators:**
- No increase in error rates
- Lighthouse scores stable or improved
- No user complaints about visual changes
- Mobile engagement unchanged or improved

---

**This iteration prioritizes visual transformation with zero functional regression. Every interaction should feel more magical while working exactly as before.**
