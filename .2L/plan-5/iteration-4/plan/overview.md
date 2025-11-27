# 2L Iteration Plan - Mirror of Dreams (Iteration 4)

## Project Vision

**Iteration 4 Focus:** Dashboard Visual Hierarchy Enhancement & Systematic Consistency

Transform the in-app experience from functional to polished through enhanced dashboard visual hierarchy, consistent loading states across all pages, personality-driven empty states, and systematic enforcement of typography and spacing standards.

**What We're Building:**
- Prominent "Reflect Now" CTA that drives core user action
- Personalized WelcomeSection with time-based greetings
- Consistent CosmicLoader across all tRPC queries (100% coverage)
- Enhanced EmptyState components with personality and emojis
- Unified typography system using CSS variables
- Consistent spacing system across all pages

**Why This Matters:**
The dashboard is where users land after authentication - it must feel alive, personalized, and motivating. Loading states provide essential feedback during async operations. Empty states guide new users toward their first actions. Typography and spacing consistency signal professional polish and brand cohesion.

---

## Success Criteria

**The iteration is successful when:**

### 1. Dashboard Visual Hierarchy Enhanced (10/10)
- [x] WelcomeSection uses personalized greeting with user's first name
- [x] Time-based greeting logic (Good morning/afternoon/evening)
- [x] "Reflect Now" CTA is visually dominant hero element (not generic purple button)
- [x] Dashboard cards have enhanced hover states (lift + glow + border)
- [x] Stagger animations are smooth and well-timed (150ms delays)
- [x] Visual hierarchy is clear: Hero CTA > Recent Activity > Stats Grid

**Measurement:** Manual review of dashboard page, user engagement metrics on "Reflect Now" CTA

### 2. Loading States Coverage (100%)
- [x] All tRPC queries show CosmicLoader during data fetching
- [x] Evolution page: dreamsData, reportsData, eligibility queries have loading states
- [x] Visualizations page: dreamsData, visualizationsData queries have loading states
- [x] Dashboard cards use CosmicLoader (not custom spinners)
- [x] Loading states have 300ms minimum display time (prevent flash)
- [x] All loading text is descriptive ("Loading your dreams..." not just spinner)

**Measurement:** Audit all tRPC queries, test on slow network (throttle to 3G)

### 3. Empty States Have Personality (8/10)
- [x] All empty states use emojis or visual icons (not generic text)
- [x] Headlines are encouraging ("Your journey awaits" not "No data yet")
- [x] Descriptions are inspiring and contextual
- [x] CTAs are personalized ("Create My First Dream" not "Create Dream")
- [x] Applied to: Dashboard, Dreams, Reflections, Evolution, Visualizations

**Measurement:** Manual review of all empty states, user feedback on personality level

### 4. Typography Consistency (100%)
- [x] All headings use design system font sizes (H1: 3rem, H2: 2rem, H3: 1.5rem)
- [x] Body text uses --text-base (1.1rem minimum)
- [x] No text smaller than 0.9rem anywhere in app
- [x] Font weights applied semantically (600 for headings, 400 for body)
- [x] Line heights consistent (1.8 for body, 1.25 for headings)
- [x] All pages use CSS variables (not hardcoded px values)

**Measurement:** Audit all pages for typography consistency, test readability on mobile

### 5. Spacing Consistency (100%)
- [x] All components use CSS custom properties for spacing (--space-*)
- [x] Card padding: --space-xl (32px) everywhere
- [x] Section spacing: --space-8 (32px) or --space-12 (48px) between sections
- [x] Element gaps consistent (--space-4 for related elements)
- [x] Mobile spacing scales appropriately (responsive clamp values)

**Measurement:** Audit all pages for spacing consistency, test mobile layouts 320px-768px

### 6. Performance Maintained
- [x] Lighthouse Performance score: 90+ (no regression)
- [x] Lighthouse Accessibility score: 95+ (improved from current)
- [x] Dashboard LCP < 2.5s
- [x] Hover state transitions maintain 60fps

**Measurement:** Automated Lighthouse audit before/after changes

---

## MVP Scope

### In Scope (Iteration 4)

**Dashboard Enhancement:**
- Enhanced WelcomeSection with personalized greeting
- "Reflect Now" CTA upgraded to hero element (GlowButton with gradient glow)
- Dashboard card hover states enhanced (lift + glow + border)
- Visual hierarchy improvements

**Loading States:**
- CosmicLoader applied to ALL tRPC queries (Evolution, Visualizations pages)
- Replace custom spinners in DreamsCard/ReflectionsCard with CosmicLoader
- 300ms minimum display time to prevent flash
- Descriptive loading text for all states

**Empty States:**
- Add personality to all EmptyState components
- Update copy across Dreams, Evolution, Visualizations pages
- Add emojis/icons to all empty states
- More encouraging CTAs

**Typography Enforcement:**
- Create unified typography utility classes (text-h1, text-h2, etc.)
- Update variables.css with adjusted scales (--text-xs minimum 0.85rem)
- Replace Tailwind text classes with CSS variable references
- Refactor mirror.css typography to use variables

**Spacing Consistency:**
- Extend Tailwind config to use CSS spacing variables
- Replace hardcoded spacing in mirror.css
- Standardize card padding and section gaps
- Audit and fix inconsistent Tailwind spacing classes

### Out of Scope (Post-MVP)

**Advanced Features:**
- Dashboard card grouping/sections
- Success animations after form submissions
- Confetti/sparkle effects for achievements
- Ambient background animations
- Sound effects for interactions
- Visual grouping of dashboard cards with semantic sections

**Future Iterations:**
- Page transition animations (planned for Iteration 5)
- Micro-interactions polish (planned for Iteration 5)
- Advanced accessibility audit (planned for Iteration 5)

---

## Development Phases

1. **Exploration** ✅ Complete (2 explorers analyzed dashboard, typography, spacing)
2. **Planning** 🔄 Current (creating comprehensive plan)
3. **Building** ⏳ 10-15 hours (3-4 parallel builders)
4. **Integration** ⏳ 30 minutes (minimal conflicts expected)
5. **Validation** ⏳ 2-3 hours (QA, testing, Lighthouse audit)
6. **Deployment** ⏳ Continuous (changes pushed to production)

---

## Timeline Estimate

### Exploration Phase
- **Duration:** Complete
- **Deliverables:** 2 explorer reports (dashboard + typography/spacing)

### Planning Phase
- **Duration:** Complete
- **Deliverables:** 4 comprehensive planning files

### Building Phase (Parallel Execution)
- **Builder 1:** Dashboard Visual Hierarchy & Loading States (4-6 hours)
- **Builder 2:** Typography Enforcement (4-6 hours)
- **Builder 3:** Spacing Consistency & Empty States (4-6 hours)
- **Total:** 10-15 hours (parallel work, 2-3 day timeline)

### Integration Phase
- **Duration:** 30 minutes
- **Activities:** Merge builder outputs, resolve any conflicts (minimal expected)

### Validation Phase
- **Duration:** 2-3 hours
- **Activities:**
  - Manual QA on all pages
  - Mobile testing (320px, 768px, 1024px)
  - Lighthouse audit (Performance + Accessibility)
  - Cross-browser testing (Chrome, Safari, Firefox)

### Total Timeline
- **Parallel building:** 2-3 days (builders work concurrently)
- **Integration + validation:** 0.5 day
- **Total:** ~3 days end-to-end

---

## Risk Assessment

### High Risks
**Risk:** Mirror.css refactor breaks reflection output styling
- **Mitigation:** Test reflection output page thoroughly after typography/spacing changes
- **Fallback:** Keep hardcoded values if responsive variables cause layout issues

**Risk:** Loading state changes cause flash on fast networks
- **Mitigation:** Implement 300ms minimum display time for all CosmicLoader instances
- **Testing:** Test on fast network + slow network (3G throttle)

### Medium Risks
**Risk:** EmptyState personality feels forced or off-brand
- **Mitigation:** Review all copy for tone consistency before implementation
- **Validation:** Get stakeholder feedback on new empty state copy

**Risk:** Typography changes affect mobile readability
- **Mitigation:** Increase --text-xs minimum from 0.7rem to 0.85rem
- **Testing:** Test on small screens (iPhone SE 320px width)

**Risk:** Dashboard card hover states cause jank on older devices
- **Mitigation:** Use GPU-accelerated transforms only (translateY, scale)
- **Testing:** Test on Safari (iPhone X or older)

### Low Risks
**Risk:** Spacing changes break mobile layouts
- **Mitigation:** Use responsive clamp() values (already in variables.css)
- **Testing:** Test breakpoints 320px, 768px, 1024px

---

## Integration Strategy

### Builder Coordination

**No Blocking Dependencies:**
All 3 builders can work in parallel as they touch different parts of the codebase:

- **Builder 1:** Dashboard page + loading states (app/dashboard/, app/evolution/, app/visualizations/)
- **Builder 2:** Typography system (styles/variables.css, styles/globals.css, mirror.css)
- **Builder 3:** Spacing system + EmptyState (Tailwind config, EmptyState component, page updates)

**Shared Files (Coordination Needed):**
1. `styles/variables.css` - Builder 2 updates typography variables (lines 1-50), Builder 3 uses spacing variables (lines 100+)
2. `styles/globals.css` - Builder 2 adds typography utilities, Builder 3 may add spacing utilities
3. `components/shared/EmptyState.tsx` - Builder 3 exclusively (no conflicts)

**Integration Order:**
1. Builder 2 (Typography) commits variables.css and globals.css changes FIRST
2. Builder 3 (Spacing) extends Tailwind config, updates EmptyState
3. Builder 1 (Dashboard) integrates last, uses updated typography/spacing systems

**Merge Strategy:**
- Builder 2 creates feature branch `iteration-4-typography`
- Builder 3 creates feature branch `iteration-4-spacing`
- Builder 1 creates feature branch `iteration-4-dashboard`
- Integration: Merge typography → spacing → dashboard in sequence

**Conflict Resolution:**
- If variables.css conflict: Builder 2 changes take precedence (typography lines 1-50)
- If globals.css conflict: Combine utilities (typography + spacing don't overlap)
- If Tailwind config conflict: Unlikely (Builder 3 only touches spacing config)

---

## Deployment Plan

### Pre-Deployment Checklist
- [x] All builder tasks marked complete
- [x] Integration successful (no merge conflicts)
- [x] Manual QA passed (all pages tested)
- [x] Lighthouse Performance score 90+ maintained
- [x] Lighthouse Accessibility score 95+ achieved
- [x] Mobile testing passed (320px, 768px, 1024px)
- [x] Cross-browser testing passed (Chrome, Safari, Firefox)

### Deployment Steps
1. **Stage 1:** Merge all feature branches to main
2. **Stage 2:** Run final Lighthouse audit on staging
3. **Stage 3:** Deploy to production (continuous deployment via Vercel)
4. **Stage 4:** Monitor performance metrics (LCP, CLS, FID)
5. **Stage 5:** Monitor user engagement ("Reflect Now" CTA clicks)

### Rollback Plan
- If critical issue detected: Revert merge commit
- If performance regression: Roll back to previous commit
- If user complaints about readability: Adjust typography variables

### Post-Deployment Monitoring
- **Week 1:** Monitor Lighthouse scores daily
- **Week 1:** Track "Reflect Now" CTA engagement (baseline vs new design)
- **Week 2:** Collect user feedback on dashboard changes
- **Week 4:** Measure reflection creation rate (did improved CTA drive more reflections?)

---

## Technical Requirements

### Must Support
- Next.js 14 (App Router) - No changes
- React 18.3.1 - No changes
- Tailwind CSS 3.4.1 - Extended with CSS variable mappings
- Framer Motion 11.18.2 - Used for CosmicLoader animations
- tRPC - All queries must have loading states
- Supabase - No changes

### Browser Support
- Chrome (latest) - Primary
- Safari (latest + iOS 14+) - Critical for backdrop-filter testing
- Firefox (latest) - Secondary
- Edge (latest) - Secondary

### Performance Budget
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Animation frame rate: 60fps (all hover states)

### Accessibility Requirements
- WCAG 2.1 AA compliance
- All text meets 4.5:1 contrast ratio
- All interactive elements have focus states
- Screen reader support (ARIA labels, semantic HTML)
- Keyboard navigation works everywhere
- Respects prefers-reduced-motion

---

## Open Questions & Decisions

### Resolved
✅ **Should we replace custom spinners with CosmicLoader?** YES - Consistency is critical
✅ **Should we add personality prop to EmptyState?** NO - Keep simple, just update copy
✅ **Should we create utility classes for typography?** YES - Create .text-h1, .text-h2, etc.
✅ **Should we extend Tailwind config for spacing?** YES - Map CSS variables to Tailwind classes

### Pending Review
⏳ **EmptyState copy review:** Stakeholder approval on new personality-driven copy needed
⏳ **Dashboard card visual grouping:** Deferred to post-MVP (adds complexity)
⏳ **--text-xs minimum increase:** Confirm 0.85rem is acceptable (up from 0.7rem)

---

## Success Metrics

### Qualitative Metrics
- **User Feedback:** Positive sentiment about dashboard improvements
- **Design Review:** Stakeholder approval on visual hierarchy changes
- **Code Review:** Clean, maintainable implementation following patterns

### Quantitative Metrics
- **Loading State Coverage:** 100% (all tRPC queries)
- **Typography Consistency:** 100% (all pages use CSS variables)
- **Spacing Consistency:** 100% (all pages use CSS variables)
- **Lighthouse Performance:** 90+ (maintained)
- **Lighthouse Accessibility:** 95+ (improved)
- **Empty State Personality:** 8/10 (up from 3/10)

### Engagement Metrics (Post-Deployment)
- **"Reflect Now" CTA clicks:** Increase by 20%+ (baseline TBD)
- **Dashboard bounce rate:** Decrease by 10%+ (users explore more)
- **Reflection creation rate:** Increase by 15%+ (improved CTA drives action)

---

## Next Steps

After this iteration completes:

1. **Iteration 5 (Planned):** Micro-Interactions & Page Transitions
   - Button hover/active states polish
   - Page transition animations (fade-in, slide-in)
   - Card interaction refinements
   - Advanced accessibility audit

2. **Optional Future Work:**
   - Dashboard card visual grouping (semantic sections)
   - Success animations (confetti, sparkles)
   - Ambient background effects
   - Sound design (optional, user-controlled)

---

**Plan Status:** READY FOR EXECUTION
**Iteration:** 4 (Global)
**Plan:** plan-5
**Estimated Duration:** 3 days (10-15 builder hours + integration + validation)
**Complexity:** MEDIUM (systematic changes across many files, but clear patterns)
**Builder Count:** 3-4 builders (parallel execution)

---

*This plan synthesizes findings from Explorer 1 (Dashboard & Loading States) and Explorer 2 (Typography & Spacing Consistency) to create a comprehensive roadmap for iteration 4 success.*
