# 2L Iteration Plan - Mirror of Dreams Foundation & Infrastructure

**Iteration:** 9 (Global iteration number)
**Plan:** plan-6
**Phase:** Foundation & Infrastructure
**Created:** 2025-11-27

---

## Project Vision

Transform Mirror of Dreams from 5.8/10 design quality to a complete, emotionally resonant sanctuary where every element serves the sacred act of self-reflection. **Iteration 9 establishes the critical foundation** - fixing the navigation overlap issue that blocks content visibility and systematizing the design tokens (spacing, typography, color) that all future polish work depends on.

This iteration is BLOCKING - all subsequent dashboard richness, reflection depth, and visual polish work requires the navigation fix and design system foundation to be solid.

---

## Success Criteria

Specific, measurable criteria for Iteration 9 completion:

### Navigation Never Hides Content: 10/10 (BLOCKING PRIORITY)
- [ ] `--nav-height` CSS variable created and matches AppNavigation actual height
- [ ] All 6+ pages have proper top padding using `--nav-height`
- [ ] Dashboard page: content fully visible below navigation
- [ ] Dreams page: content fully visible below navigation
- [ ] Reflections page: content fully visible below navigation
- [ ] Evolution page: content fully visible below navigation
- [ ] Visualizations page: content fully visible below navigation
- [ ] Reflection creation page: MirrorExperience has proper padding
- [ ] Mobile (320px): navigation + hamburger menu never obscures content
- [ ] Tablet (768px): navigation spacing optimal
- [ ] Desktop (1440px+): navigation spacing optimal
- [ ] Zero gap between nav and content (no visual jump)
- [ ] Pattern documented in patterns.md for future pages

### Design System Foundation Established: 9/10
- [ ] Spacing scale (xs → 3xl) documented with semantic usage
- [ ] Typography hierarchy (h1 → body) documented with examples
- [ ] Color semantic palette audited and usage documented
- [ ] All new spacing follows existing CSS variables (no arbitrary px values)
- [ ] Reading widths defined: dashboard (1200px), reflection form (800px), reflection display (720px)
- [ ] Responsive spacing behavior documented (25% reduction on mobile)
- [ ] WCAG AA contrast maintained (95% opacity for body text, 60-70% for muted)

### Enhanced Empty States Deployed: 8/10
- [ ] EmptyState component enhanced with optional illustration + progress props
- [ ] Dashboard empty state: "Create your first dream to begin your journey" (when no dreams)
- [ ] Dashboard empty state: "Your first reflection awaits" (when no reflections)
- [ ] Dreams page empty state: "Dreams are the seeds of transformation"
- [ ] Reflections page empty state: "Reflection is how you water your dreams"
- [ ] Evolution page empty state: "Evolution insights unlock after 4 reflections" with progress (0/4)
- [ ] Visualizations page empty state: "Visualizations appear after 4 reflections on a dream"
- [ ] All empty states use consistent spacing (xl padding, lg gaps)
- [ ] All empty states have inviting cosmic emoji or illustration

### Zero Regressions: 10/10
- [ ] All existing features still work (dreams, reflections, evolution)
- [ ] No visual breakage on any page
- [ ] Mobile hamburger menu still animates smoothly
- [ ] Glass card effects still render correctly
- [ ] Performance maintained (no bundle size increase)

---

## MVP Scope

**In Scope (Iteration 9):**
- Fix navigation overlap issue (Feature 1 from vision.md)
- Establish spacing & layout system (Feature 10)
- Document typography & readability standards (Feature 8)
- Audit and document color semantic usage (Feature 9)
- Deploy enhanced empty states across app (Feature 6)

**Out of Scope (Future Iterations):**
- Dashboard richness transformation (Iteration 10)
- Reflection page depth & immersion (Iteration 10)
- Individual reflection display enhancement (Iteration 10)
- Reflection collection view (Iteration 10)
- Micro-interactions & animations (Iteration 11)
- Systematic polish & QA (Iteration 11)

---

## Development Phases

1. **Exploration** - COMPLETE (Explorer-1: Architecture, Explorer-2: Technology Patterns)
2. **Planning** - CURRENT (This document)
3. **Building** - Next (3 builders, sequential merge workflow)
4. **Integration** - After all builders merge
5. **Validation** - Final testing at all breakpoints
6. **Deployment** - Merge to main

---

## Timeline Estimate

**Iteration 9 Duration:** 3-4 days (18-24 hours)

### Builder Execution Order (SEQUENTIAL MERGE)

**Day 1-2: Builder-1 (Navigation + Spacing)**
- Hours: 6-8 hours
- Scope: Navigation overlap fix + spacing system foundation
- Output: `--nav-height` variable, all pages updated, spacing documented
- **BLOCKING:** Must merge before other builders start page updates

**Day 2-3: Builder-2 (Typography + Color Audit)**
- Hours: 6-8 hours
- Scope: Typography hierarchy audit, color semantic audit, documentation
- Output: Typography patterns documented, color usage audited, WCAG AA verified
- **Dependency:** Can work in parallel with Builder-1, merges second

**Day 3-4: Builder-3 (Enhanced Empty States)**
- Hours: 4-6 hours
- Scope: EmptyState component enhancement, deploy to all pages
- Output: Enhanced component, 5+ empty state variants deployed
- **Dependency:** Requires Builder-1 merge (pages need navigation fix first)

**Day 4: Integration & Validation**
- Hours: 2-3 hours
- Scope: Test all pages at all breakpoints, verify success criteria
- Output: Validated iteration, ready for next iteration

**Total:** 18-24 hours (3-4 days with sequential workflow)

---

## Risk Assessment

### High Risks

**Risk: Navigation height mismatch on mobile (60% probability)**
- **Impact:** Content obscured on mobile devices, critical UX failure
- **Mitigation:**
  - Use JavaScript to measure nav height dynamically (not static CSS value)
  - Test on real devices (iPhone SE, iPad, Android)
  - Test mobile hamburger menu open/closed states
  - Create visual debug overlay to verify nav height = padding
  - Document pattern in patterns.md with testing checklist

**Risk: Breaking existing page layouts (40% probability)**
- **Impact:** Visual regressions across multiple pages
- **Mitigation:**
  - Screenshot all pages BEFORE making changes (baseline)
  - Git diff review before committing
  - Test ALL pages after navigation fix, not just one
  - Use existing CSS variables (don't change values, ADD new ones)

### Medium Risks

**Risk: Builder coordination merge conflicts (40% probability)**
- **Impact:** Delays due to merge conflicts in shared files (variables.css, globals.css)
- **Mitigation:**
  - SEQUENTIAL MERGE workflow (Builder-1 first, then Builder-2, then Builder-3)
  - File ownership: Builder-1 owns nav-related changes, Builder-2 owns design system docs
  - Daily 15-min sync to coordinate changes
  - Use feature branches with clear naming

**Risk: WCAG AA contrast failures (50% probability)**
- **Impact:** Accessibility issues, text hard to read
- **Mitigation:**
  - Use Lighthouse accessibility audit (automated contrast checks)
  - Bump muted text from 60% → 70% opacity if needed
  - Test on dark background (#020617) with contrast checker
  - Document minimum opacity standards in patterns.md

### Low Risks

**Risk: EmptyState component breaking existing usage (20% probability)**
- **Impact:** Empty states on existing pages break
- **Mitigation:**
  - Make all new props OPTIONAL (backwards compatible)
  - Test all existing empty state locations after component update
  - Keep existing props exactly the same (icon, title, description, ctaLabel, ctaAction)

---

## Integration Strategy

### Sequential Merge Workflow

**Step 1: Builder-1 Merges First**
```
Builder-1 completes → PR review → Merge to main → Tag commit
All subsequent builders pull latest main before starting
```

**Step 2: Builder-2 Merges Second**
```
Builder-2 completes → Pull latest main → Resolve conflicts → PR review → Merge
```

**Step 3: Builder-3 Merges Third**
```
Builder-3 completes → Pull latest main → Deploy empty states → PR review → Merge
```

### Shared Files Coordination

**variables.css** (all 3 builders modify):
- Builder-1: Adds `--nav-height` variable
- Builder-2: Documents existing spacing/typography/color variables
- Builder-3: No changes needed
- **Strategy:** Builder-1 commits first, others pull latest

**globals.css** (Builder-2 only):
- Builder-2: Documents utility classes, no value changes
- **Strategy:** No conflicts expected

**patterns.md** (all 3 builders contribute):
- Builder-1: Documents navigation padding pattern
- Builder-2: Documents spacing/typography/color patterns
- Builder-3: Documents EmptyState usage pattern
- **Strategy:** Each builder adds their section, sequential merge prevents conflicts

### Integration Testing (After All Merges)

**Test ALL pages at ALL breakpoints:**
- [ ] Dashboard: 320px, 768px, 1024px, 1440px, 1920px
- [ ] Dreams: All breakpoints
- [ ] Reflections: All breakpoints
- [ ] Evolution: All breakpoints
- [ ] Visualizations: All breakpoints
- [ ] Reflection creation (MirrorExperience): All breakpoints

**Visual regression:**
- Compare screenshots BEFORE vs AFTER
- Verify no unintended spacing changes
- Verify all content visible (no nav overlap)

**Accessibility:**
- Run Lighthouse on all pages (target: 100% accessibility score)
- Keyboard navigation test (Tab through all interactive elements)
- Verify contrast ratios (WCAG AA)

---

## Deployment Plan

**Deployment target:** Production (main branch)

**Pre-deployment checklist:**
- [ ] All 3 builders merged
- [ ] Integration testing complete (all pages, all breakpoints)
- [ ] No regressions detected
- [ ] Success criteria verified
- [ ] Documentation complete (patterns.md, tech-stack.md)

**Deployment process:**
1. Final PR from iteration-9 branch to main
2. Stakeholder review (Ahiya tests on real devices)
3. Approval + merge
4. Tag release: `iteration-9-complete`
5. Deploy to production (Vercel auto-deploy)

**Rollback plan:**
- If critical issue found post-deploy, revert commit
- Navigation fix is low-risk (CSS variable + padding)
- Design system docs are documentation-only (zero code risk)
- EmptyState enhancement is backwards compatible (low risk)

---

## Key Decisions

### Decision 1: Navigation Height Calculation - JavaScript vs CSS-Only

**Decision:** Use JavaScript to measure navigation height dynamically

**Rationale:**
- Mobile menu height is dynamic (varies when hamburger menu opens/closes)
- Static CSS variable will fail when menu state changes
- JavaScript measurement ensures accuracy across all screen sizes
- App already uses client-side JavaScript extensively (Next.js App Router)

**Implementation:**
```typescript
// AppNavigation.tsx
useEffect(() => {
  const nav = document.querySelector('[data-nav-container]');
  if (nav) {
    const height = nav.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--nav-height', `${height}px`);
  }
}, [showMobileMenu]); // Re-measure when menu toggles
```

### Decision 2: Sequential vs Parallel Builder Merge

**Decision:** Sequential merge workflow (Builder-1 → Builder-2 → Builder-3)

**Rationale:**
- All builders modify shared files (variables.css, patterns.md)
- Parallel merges create high risk of conflicts
- Builder-1 is BLOCKING (navigation fix required before page testing)
- Sequential adds 1 day but eliminates merge conflict risk

**Alternative considered:** Parallel with careful coordination - rejected due to merge risk

### Decision 3: Spacing System - Use Existing vs Create New

**Decision:** Use existing `--space-xs` through `--space-3xl` variables

**Rationale:**
- variables.css already defines perfect spacing scale for Iteration 1 needs
- Scale matches vision.md requirements exactly (xs=4px → 3xl=64px)
- Creating new variables adds complexity without benefit
- Just need to DOCUMENT semantic usage, not redefine

**Alternative considered:** Create semantic aliases (--spacing-card-padding) - rejected as over-engineering

### Decision 4: EmptyState Enhancement Timing - Now vs Later

**Decision:** Basic enhancement now (Iteration 9), advanced features later

**Rationale:**
- Iteration 9 focus is FOUNDATION (consistency across empty states)
- Advanced features (multiple CTAs, complex layouts) are Iteration 10+ scope
- Minimal props (illustration, progress) sufficient for current needs
- Backwards compatibility maintained (all new props optional)

**Enhancements included:**
- Optional `illustration` prop (for custom SVG/image)
- Optional `progress` prop (for "0/4 reflections" indicator)
- Optional `variant` prop (default/compact sizing)

**Enhancements deferred:**
- Multiple CTAs (single action focus maintained)
- Custom layouts (consistency over flexibility)
- Complex animations (foundational iteration)

---

## Communication Plan

**Daily standup (15 minutes):**
- What did you complete yesterday?
- What are you working on today?
- Any blockers or coordination needs?

**Builder handoff:**
- Builder-1 completes → Notify Builder-2 and Builder-3 to pull latest main
- Builder-2 completes → Notify Builder-3 to pull latest main

**Issue escalation:**
- If navigation fix fails on mobile → Escalate immediately (critical blocker)
- If WCAG AA contrast fails → Document, create fix plan
- If merge conflicts arise → Pair with conflicting builder to resolve

**Stakeholder updates:**
- End of Day 2: Builder-1 navigation fix demo
- End of Day 3: Builder-2 design system documentation review
- End of Day 4: Full iteration demo (all features integrated)

---

## Next Steps

1. **Planner:** Review and approve this plan
2. **Builder-1:** Start navigation overlap fix (create `--nav-height`, update pages)
3. **Builder-2:** Start typography/color audit (can work in parallel)
4. **Builder-3:** Wait for Builder-1 merge, then enhance EmptyState + deploy
5. **Integration:** Test all pages at all breakpoints after Builder-3 merges
6. **Validation:** Verify all success criteria met
7. **Deployment:** Merge to main, tag release

---

## Appendix: File Ownership

### Builder-1 (Navigation + Spacing)
**Primary ownership:**
- `components/shared/AppNavigation.tsx` (add height measurement)
- `styles/variables.css` (add `--nav-height` variable)
- `app/dashboard/page.tsx` (update padding)
- `app/dreams/page.tsx` (update padding)
- `app/reflections/page.tsx` (update padding)
- `app/evolution/page.tsx` (update padding)
- `app/visualizations/page.tsx` (update padding)
- `app/reflection/page.tsx` (verify MirrorExperience padding)
- `.2L/plan-6/iteration-9/plan/patterns.md` (navigation section)

### Builder-2 (Typography + Color)
**Primary ownership:**
- `styles/variables.css` (document existing variables, no value changes)
- `styles/globals.css` (document utility classes)
- `.2L/plan-6/iteration-9/plan/patterns.md` (typography + color sections)
- `.2L/plan-6/iteration-9/plan/tech-stack.md` (update if needed)

### Builder-3 (Empty States)
**Primary ownership:**
- `components/shared/EmptyState.tsx` (enhance with new props)
- Dashboard empty states (deploy variants)
- Page empty states (dreams, reflections, evolution, visualizations)
- `.2L/plan-6/iteration-9/plan/patterns.md` (EmptyState usage section)

---

**Iteration Status:** PLANNED
**Ready for:** Builder Execution
**Focus:** BLOCKING foundation - navigation fix + design system documentation
**Success Measure:** All pages have visible content, design patterns documented for future builders
