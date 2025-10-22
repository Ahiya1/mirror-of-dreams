# 2L Iteration Plan - Design System Foundation

## Project Vision

Transform the Mirror of Dreams frontend by building a comprehensive glass-morphism design system foundation. This iteration creates 10 reusable components with sharp glass effects, glowing animations, and dreamy gradients that will serve as the building blocks for the complete UI redesign.

**What we're building:**
- 10 reusable glass components with consistent styling
- Extended Tailwind configuration with mystical blue/purple color palette
- Framer Motion integration for smooth, performant animations
- Animation variants library for consistent motion patterns
- Component showcase page for testing and validation

**Why this matters:**
This foundation enables all subsequent page redesigns by establishing consistent patterns for glassmorphism, animations, and interactions. Every future page will compose these primitives, ensuring visual consistency and code reusability across the entire application.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] **Dependencies Installed**: Framer Motion 11.15.0 and Lucide React 0.546.0 added to package.json
- [ ] **Tailwind Extended**: 15+ mirror colors, 3+ gradients, glass blur utilities, glow shadows configured
- [ ] **Animation Variants**: Reusable motion variants defined in lib/animations/variants.ts
- [ ] **10 Components Built**: All components implemented with TypeScript, 'use client' directive, and accessibility support
- [ ] **Showcase Page**: /design-system route displays all components with variants
- [ ] **Performance**: 60fps animations on desktop, 30fps minimum on mobile with throttling
- [ ] **Accessibility**: All components respect prefers-reduced-motion, have keyboard navigation, meet WCAG AA contrast
- [ ] **Browser Compatibility**: Glass effects work in Chrome 90+, Safari 14+, Firefox 88+ with fallbacks
- [ ] **TypeScript Strict**: No type errors, all props properly typed
- [ ] **Documentation**: Each component has clear prop interface with JSDoc comments

## MVP Scope

**In Scope:**

**Dependencies:**
- Framer Motion 11.15.0 installation
- Lucide React 0.546.0 installation

**Configuration:**
- Tailwind config extension (colors, gradients, blur, shadows)
- TypeScript interfaces for glass components

**Animation System:**
- lib/animations/variants.ts - Motion variants
- lib/animations/config.ts - Animation configuration
- Reduced motion support via useReducedMotion hook

**10 Core Components:**
1. GlassCard - Base glass card with blur backdrop
2. GlowButton - Button with primary/secondary/ghost variants
3. CosmicLoader - Animated gradient ring loader
4. DreamCard - Dream display with gradient border
5. GradientText - Gradient text component
6. GlassModal - Modal with glass overlay
7. FloatingNav - Glass navigation bar
8. ProgressOrbs - Multi-step progress indicator
9. GlowBadge - Status badges with glow effects
10. AnimatedBackground - Subtle animated gradient background

**Testing Infrastructure:**
- Component showcase page at /design-system
- Performance testing with Chrome DevTools
- Accessibility testing with keyboard navigation

**Out of Scope (Post-MVP):**

**Deferred to Iteration 20:**
- Page redesigns (Dashboard, Dreams, Reflection)
- Font loading (Inter, Playfair Display)
- Custom SVG icons (use Lucide for now)
- Bundle size monitoring (@next/bundle-analyzer)
- Automated testing (Playwright, Jest)
- Storybook integration

**Deferred to Iteration 21:**
- Light mode support
- Advanced animations (scroll-triggered, parallax)
- Visual regression testing
- Performance optimization refinements

## Development Phases

1. **Exploration** - COMPLETE
2. **Planning** - Current (creating comprehensive plan)
3. **Building** - 8-12 hours (single builder or 2 builders in parallel)
4. **Integration** - 30 minutes (showcase page testing)
5. **Validation** - 1-2 hours (performance, accessibility, browser testing)
6. **Deployment** - 10 minutes (merge to main)

## Timeline Estimate

- **Exploration**: Complete (2 explorer reports analyzed)
- **Planning**: Complete (this document)
- **Building**: 8-12 hours (depends on single vs split builder)
  - Dependencies & Config: 1 hour
  - Animation Variants: 1 hour
  - Foundation Components (GlassCard, GlowButton, GradientText): 2-3 hours
  - Complex Components (GlassModal, FloatingNav, ProgressOrbs): 3-4 hours
  - Specialty Components (CosmicLoader, DreamCard, GlowBadge, AnimatedBackground): 2-3 hours
  - Showcase Page: 1 hour
- **Integration**: 30 minutes (test all components together)
- **Validation**: 1-2 hours (performance benchmarks, accessibility audit)
- **Total**: ~10-15 hours (1-2 work days)

## Risk Assessment

### High Risks

**Risk: Glassmorphism Performance on Mobile**
- **Impact**: Dropped frames, janky animations, poor UX on low-end devices
- **Likelihood**: HIGH
- **Mitigation**:
  - Limit simultaneous backdrop-filter elements (max 3-4 visible)
  - Test on mobile early with CPU throttling (4x slowdown)
  - Reduce blur intensity on mobile (8px instead of 16px)
  - Use will-change: transform sparingly
  - Provide solid background fallback for unsupported browsers
- **Acceptance Criteria**: 30fps minimum on throttled mobile

**Risk: Framer Motion Bundle Size Impact**
- **Impact**: 60KB gzipped added to client bundle
- **Likelihood**: MEDIUM
- **Mitigation**:
  - Use named imports only (tree-shaking)
  - Dynamic imports for heavy components (CosmicLoader)
  - Monitor with Next.js build output
  - Lazy load animations on interaction
- **Acceptance Criteria**: Total bundle <200KB for main page

### Medium Risks

**Risk: Server/Client Boundary Confusion**
- **Impact**: Build errors, incorrect hydration, runtime crashes
- **Likelihood**: MEDIUM (learning curve with App Router)
- **Mitigation**:
  - Strict convention: ALL design system components use 'use client'
  - Clear documentation in patterns.md
  - Template examples for builder
  - ESLint rule to enforce directive
- **Acceptance Criteria**: No hydration errors in console

**Risk: Animation Orchestration Complexity**
- **Impact**: Builder struggles with sequencing, timing coordination
- **Likelihood**: LOW (with pre-built variants)
- **Mitigation**:
  - Pre-define animation variants BEFORE building components
  - Create reusable animation hooks
  - Provide clear examples in patterns.md
  - Test animations in isolation first
- **Acceptance Criteria**: All animations smooth, properly sequenced

### Low Risks

**Risk: TypeScript Strict Mode Compliance**
- **Impact**: Type errors block build
- **Likelihood**: LOW (explorers confirmed existing strict patterns)
- **Mitigation**: Follow existing component patterns, use proper typing
- **Acceptance Criteria**: Zero TypeScript errors

**Risk: Browser Compatibility (backdrop-filter)**
- **Impact**: Glass effects don't render in older browsers
- **Likelihood**: LOW (targeting modern browsers)
- **Mitigation**: Feature detection + fallback solid backgrounds
- **Acceptance Criteria**: Functional in Chrome 90+, Safari 14+, Firefox 88+

## Integration Strategy

**Component Dependencies:**
- Foundation components (GlassCard, GlowButton, GradientText) have NO dependencies
- Complex components depend on foundation:
  - DreamCard extends GlassCard
  - GlassModal uses GlassCard
  - FloatingNav uses GlassCard
- Specialty components are independent

**Build Order:**
1. Phase 1: Dependencies & Config (foundation for everything)
2. Phase 2: Animation Variants (needed by all components)
3. Phase 3: Foundation Components (needed by complex components)
4. Phase 4: Complex Components (depend on Phase 3)
5. Phase 5: Specialty Components (independent, can be parallel)
6. Phase 6: Showcase Page (uses all components)

**Shared Resources:**
- tailwind.config.ts - Extended once, used by all
- lib/animations/variants.ts - Shared animation patterns
- types/glass-components.ts - Shared TypeScript interfaces
- styles/variables.css - Extended with glass-specific CSS vars

**Conflict Prevention:**
- Single builder: No conflicts
- Split builders: Clear file ownership (Builder A: files 1-5, Builder B: files 6-10)
- Shared files edited only in Phase 1 (before builder work begins)

**Testing Integration:**
- Showcase page imports all components
- Test variants individually
- Test composition (complex components using foundation)
- Performance testing on complete page

## Deployment Plan

**Deployment Target:** Existing Next.js 14 application

**Deployment Steps:**
1. Merge plan branch to main
2. Install dependencies: `npm install`
3. Verify build: `npm run build`
4. Run dev server: `npm run dev`
5. Navigate to /design-system for showcase
6. Run Lighthouse audit
7. Test on mobile device
8. Deploy to production (existing deployment pipeline)

**Rollback Strategy:**
- New components in isolated directory (components/ui/glass/)
- No changes to existing pages
- Can delete design system folder without breaking app
- Tailwind extensions are additive (won't break existing styles)

**Monitoring:**
- Chrome DevTools Performance tab (manual)
- Next.js build output (bundle sizes)
- Lighthouse CI (optional, future iteration)

**Success Metrics:**
- All 10 components render without errors
- Showcase page loads < 2 seconds
- Lighthouse Performance score > 90
- No console errors or warnings
- Animations run at 60fps on desktop

**Next Iteration Handoff:**
- Design system ready for consumption
- Iteration 20 can begin page redesigns
- Components fully documented in showcase
- Performance baselines established
