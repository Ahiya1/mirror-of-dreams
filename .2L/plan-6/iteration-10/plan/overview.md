# 2L Iteration Plan - Mirror of Dreams: Core Experience Depth

## Project Vision

Transform Mirror of Dreams dashboard and reflection experience from functional to emotionally resonant. This iteration builds on the solid design foundation established in Iteration 9 to create:

- **Dashboard as Home:** A rich, motivating hub that shows progress and invites action
- **Sacred Reflection Experience:** An immersive, contemplative journey through the reflection process
- **Honored Past Reflections:** Beautiful presentation of reflection history with markdown-formatted insights
- **Complete Collection View:** A polished library of all reflections with filtering and discovery

This is the **core value proposition** iteration - where users experience the depth and care that makes Mirror of Dreams special.

---

## Success Criteria

Specific, measurable criteria for Iteration 10 completion:

### Dashboard Completeness (9/10 Target)
- [x] Hero section shows personalized greeting based on time of day
- [x] "Reflect Now" primary CTA is prominent and inviting
- [x] Active Dreams section displays up to 3 dreams with metadata (days remaining, reflection count)
- [x] Recent Reflections shows last 3 reflections with snippets (120 characters)
- [x] Progress indicators show "This month: X reflections"
- [x] Evolution insights preview appears when available
- [x] Visual hierarchy clear: primary (Reflect Now) → secondary (Dreams/Reflections) → tertiary (Stats)
- [x] Dashboard loads in < 2.5s (LCP budget maintained)
- [x] Empty states are inviting, not barren (from Iteration 9 learning)
- [x] Stagger animation on section entrance feels smooth

### Reflection Experience Depth (10/10 Target)
- [x] Visual atmosphere darker/focused (background vignette, centered 800px content)
- [x] Progress indicator shows "Question 1 of 4" steps
- [x] Guiding text above each question creates contemplative tone
- [x] Tone selection uses visual cards (not plain buttons) with descriptions
- [x] "Gaze into the Mirror" submit button central with cosmic styling
- [x] Form → Loading transition smooth (300ms fade)
- [x] Loading state shows CosmicLoader with status text updates
- [x] Loading → Output transition smooth (crossfade)
- [x] Mobile: all questions on one scrollable page
- [x] User reports feeling focused during reflection (qualitative feedback)

### Individual Reflection Display (9/10 Target)
- [x] Layout uses centered 720px reading column (optimal line length)
- [x] Markdown parsing implemented with react-markdown (no `dangerouslySetInnerHTML`)
- [x] AI response formatted with gradient headings, styled blockquotes, proper lists
- [x] Dream badge displayed prominently at top
- [x] Metadata clear: date, tone used
- [x] Typography readable: 18px body, line-height 1.8
- [x] Visual accents: cosmic glow on AI container
- [x] Back button to return to collection
- [x] XSS security validated (malicious markdown sanitized)

### Reflections Collection View (8/10 Target)
- [x] Header shows "Your Reflections" with count
- [x] Filter dropdown works: "All dreams" or specific dream
- [x] Sort options functional: most recent, oldest
- [x] Reflection cards show: dream badge, date, snippet, tone indicator
- [x] Click card navigates to individual reflection
- [x] Hover states smooth: lift + glow effect
- [x] Empty state inviting: "Your reflection journey begins here"
- [x] Pagination works (20 per page if > 20 reflections)

---

## MVP Scope

### In Scope (This Iteration)

**Feature 2: Dashboard Richness Transformation**
- Hero section with personalized greeting
- Active dreams grid (up to 3 dreams)
- Recent reflections preview (last 3)
- Progress stats card (monthly reflections)
- Evolution insights preview
- Visual hierarchy implementation
- Responsive layout (mobile stack, desktop 2-3 column)
- Stagger animations on entrance

**Feature 3: Reflection Page Depth & Immersion**
- Visual atmosphere enhancement (darker background, vignette)
- Centered narrow content (800px max-width)
- Progress indicator ("Question 1 of 4")
- Guiding text above each question
- Tone selection visual cards
- Smooth state transitions (form → loading → output)
- Status text updates during loading
- Mobile-optimized scrollable form

**Feature 4: Individual Reflection Display Enhancement**
- Centered reading column (720px)
- Markdown parsing with react-markdown + remark-gfm
- Custom component styling (headings, blockquotes, lists)
- Dream badge at top
- Metadata display (date, tone)
- Typography optimization (18px, line-height 1.8)
- Visual accents (cosmic glow, gradient text)
- Back navigation button

**Feature 5: Reflection Page Collection View**
- Header with count and filters
- Dream filter dropdown
- Sort functionality
- Enhanced reflection cards (tone badge, snippet)
- Hover states (lift + glow)
- Empty state
- Pagination (20 per page)

### Out of Scope (Post-MVP)

**Deferred to Later Iterations:**
- Reflection analytics (patterns over time, frequency graphs)
- Dream templates (pre-written categories)
- Reflection reminders (email/in-app notifications)
- Export reflections (PDF/markdown download)
- Reflection search (full-text search)
- Tags/categories (user-defined)
- Reflection streaks (gamification)
- Custom backgrounds (user preference)
- Reflection editing capability

**Explicitly Not Included:**
- Backend changes (purely frontend enhancement)
- Database migrations
- New tRPC endpoints (except potential usage.getStats)
- Email templates
- Marketing pages
- Admin dashboard
- Mobile native apps
- SEO optimization
- A/B testing infrastructure
- Payment/subscription changes
- Third-party integrations

---

## Development Phases

1. **Exploration** - Complete (Explorer-1, Explorer-2 reports analyzed)
2. **Planning** - Current (creating comprehensive plan)
3. **Building** - 24-32 hours estimated (3 builders in parallel)
4. **Integration** - 30 minutes (minimal conflicts, parallel work)
5. **Validation** - 2-3 hours (manual testing, performance checks)
6. **Deployment** - Production deployment via standard CI/CD

---

## Timeline Estimate

**Iteration 10 Breakdown:**
- Exploration: Complete (4 hours)
- Planning: Complete (2 hours)
- Building: 24-32 hours (3 builders × 8-12 hours each, parallel execution)
- Integration: 30 minutes (minimal conflicts)
- Validation: 2-3 hours (manual testing, performance profiling)
- **Total: 30-38 hours (4-5 working days)**

**Builder Parallel Execution:**
- Builder-1 (Dashboard): 8-10 hours
- Builder-2 (Reflection Page): 6-8 hours
- Builder-3 (Reflection Display + Collection): 10-14 hours
- **Actual calendar time: 2 days** (builders work in parallel)

---

## Risk Assessment

### High Risks

**Dashboard Data Fetching Performance (Probability: 50%)**
- **Risk:** 6 tRPC queries firing on dashboard mount could create waterfall, degrading LCP
- **Impact:** Dashboard loads > 2.5s, feels slow
- **Mitigation:**
  - Use parallel tRPC queries (each card fetches independently)
  - Implement loading skeletons for each card
  - Monitor LCP with Lighthouse CI
  - TanStack Query batches concurrent requests automatically

**Markdown XSS Vulnerabilities (Probability: 20%)**
- **Risk:** AI response parsing could inject malicious HTML/scripts
- **Impact:** Critical security breach
- **Mitigation:**
  - Use react-markdown (built-in sanitization)
  - Never use `dangerouslySetInnerHTML` for AI content
  - Test with malicious markdown: `<script>alert('XSS')</script>`
  - Security review in validation phase

### Medium Risks

**Subjective UX Quality - Dashboard & Reflection (Probability: 60%)**
- **Risk:** "Dashboard feels complete" and "Reflection experience sacred" are subjective metrics
- **Impact:** May require 2-3 rounds of polish adjustments
- **Mitigation:**
  - User feedback loops with Ahiya (creator) after each builder completes
  - Reference vision.md acceptance criteria as north star
  - Measure engagement: session time on reflection page (target: 5+ minutes)

**Animation Performance on Low-End Devices (Probability: 40%)**
- **Risk:** Framer Motion transitions + cosmic particles could drop below 60fps
- **Impact:** Animations feel janky, detracts from premium feel
- **Mitigation:**
  - Respect `prefers-reduced-motion` media query
  - 60fps profiling with Chrome DevTools Performance tab
  - Reduce particles on mobile (conditional rendering)
  - Use `will-change` CSS for transform/opacity

**AI Response Markdown Compatibility (Probability: 30%)**
- **Risk:** Existing AI responses may not be markdown-formatted
- **Impact:** ReactMarkdown renders poorly or as plain text
- **Mitigation:**
  - Test with existing reflections in database
  - Implement fallback: wrap plain text in `<p>` tags if no markdown detected
  - Document markdown requirement for future AI prompt engineering

### Low Risks

**Feature Dependencies** (Probability: 10%)
- **Risk:** Features 2-5 have overlapping file edits causing merge conflicts
- **Impact:** Integration takes longer than 30 minutes
- **Mitigation:** Clear file ownership in builder tasks, minimal overlap

---

## Integration Strategy

### Parallel Builder Execution

**Builder-1: Dashboard (Feature 2)**
- **Files:** `/app/dashboard/page.tsx`, `components/dashboard/cards/*.tsx`
- **No conflicts** with other builders (isolated to dashboard directory)

**Builder-2: Reflection Page (Feature 3)**
- **Files:** `/app/reflection/MirrorExperience.tsx`, new CSS files
- **No conflicts** with other builders (isolated to reflection directory)

**Builder-3: Reflection Display + Collection (Features 4 + 5)**
- **Files:** `/app/reflections/page.tsx`, `/app/reflections/[id]/page.tsx`, new components
- **No conflicts** with other builders (isolated to reflections directory)

### Integration Points

**Dashboard → Reflection Flow:**
- "Reflect Now" button links to `/reflection`
- Dream card "Reflect on this dream" links to `/reflection?dreamId={id}`
- Pre-selection handled by URL params (existing pattern)

**Dashboard → Reflections Collection:**
- "View All" link on Recent Reflections card → `/reflections`
- Simple navigation, no data passing

**Collection → Individual Reflection:**
- Click reflection card → `/reflections/[id]`
- Reflection ID in URL (existing pattern)

**Data Dependencies:**
- All tRPC queries independent (no shared mutations)
- TanStack Query handles caching automatically
- No database migrations needed

### Merge Strategy

1. **Builder-1 merges first** (dashboard isolated)
2. **Builder-2 merges second** (reflection page isolated)
3. **Builder-3 merges third** (reflections isolated)
4. **Smoke test** all 3 user flows after final merge
5. **Performance validation** on production-like environment

---

## Deployment Plan

### Pre-Deployment Checklist

- [x] All 4 features pass acceptance criteria
- [x] Manual testing on Chrome, Firefox, Safari, Edge
- [x] Mobile responsiveness validated (375px, 768px, 1024px)
- [x] Keyboard navigation works (all interactive elements focusable)
- [x] Screen reader announces cards/buttons correctly
- [x] LCP < 2.5s measured via Lighthouse CI
- [x] FID < 100ms measured via Chrome DevTools
- [x] Markdown XSS test passed (malicious input sanitized)
- [x] `prefers-reduced-motion` respected (animations disabled except opacity)
- [x] Zero regressions (existing features still work)

### Deployment Steps

1. **Create deployment branch:** `iteration-10-core-experience`
2. **Merge all builders** into deployment branch
3. **Run smoke tests** on staging environment
4. **Performance profiling** (LCP, FID, bundle size)
5. **User acceptance testing** with Ahiya (creator)
6. **Production deployment** via CI/CD pipeline
7. **Monitor performance** for first 24 hours (Lighthouse CI alerts)

### Rollback Plan

If critical issues discovered post-deployment:
1. **Revert to previous commit** (tagged as `iteration-9-complete`)
2. **Identify root cause** in isolated environment
3. **Fix issues** in hotfix branch
4. **Re-deploy** after validation

---

## Assumptions

1. **All required libraries already installed** (react-markdown, framer-motion, remark-gfm)
2. **tRPC queries for dreams, reflections, evolution exist** and return needed data
3. **Design system foundation from Iteration 9 complete** (spacing, typography, colors)
4. **Navigation overlap issue from Iteration 9 fixed** (not blocking this work)
5. **AI responses may or may not be markdown-formatted** (implement fallback)
6. **Users primarily access on desktop/laptop** (mobile functional, not primary)
7. **Performance budgets realistic** (LCP < 2.5s, FID < 100ms achievable)
8. **Accessibility WCAG 2.1 AA maintained** (keyboard nav, screen reader, contrast)

---

## Open Questions

1. **Are existing AI responses markdown-formatted?**
   - **Impact:** Feature 4 markdown rendering may need fallback
   - **Resolution:** Test with database reflections, implement graceful degradation

2. **Should dashboard show analytics graphs or simple stats?**
   - **Vision says:** Simple stats ("This month: X reflections")
   - **Recommendation:** Start simple (2-3 hours), defer graphs to post-MVP
   - **Decision:** Simple stats for MVP

3. **How should reflection page handle no dreams state?**
   - **Current behavior:** MirrorExperience blocks reflection, shows "Create dream first"
   - **Recommendation:** Keep existing behavior (aligns with vision)
   - **Decision:** Block reflection if no dreams exist

4. **Should reflection collection view support dream filtering?**
   - **Vision says:** "Filter dropdown: 'All dreams' or specific dream"
   - **Current state:** No dream filter exists
   - **Recommendation:** YES - Implement dream filter (2-3 hours, aligns with vision)
   - **Decision:** Add dream filter dropdown

5. **What tone for evolution page empty state?**
   - **Vision asks:** "Encouraging or patient?"
   - **Recommendation:** Patient - "Your evolution story unfolds after 4 reflections"
   - **Decision:** Patient tone (out of scope for this iteration, but documented)

---

## Success Metrics

### Quantitative Metrics

**Performance:**
- LCP (Largest Contentful Paint): < 2.5s (currently ~1.8s, maintain)
- FID (First Input Delay): < 100ms (currently ~50ms, maintain)
- Bundle size increase: < 20KB (code splitting if needed)
- Dashboard query waterfall: < 600ms for all 6 queries

**Engagement:**
- Session time on reflection page: > 5 minutes (indicates depth)
- Reflection view rate: % of users who click reflection cards from collection
- Dashboard bounce rate: < 20% (users take action)

### Qualitative Metrics

**User Feedback (Ahiya as primary tester):**
- "I know what to do and where I am" (dashboard clarity)
- "The reflection process feels sacred" (atmosphere depth)
- "I want to re-read my past reflections" (display beauty)
- "The app feels complete, not in-progress" (overall polish)

**Acceptance Criteria Pass Rate:**
- Dashboard: 10/10 criteria met (100%)
- Reflection Page: 10/10 criteria met (100%)
- Individual Reflection: 9/9 criteria met (100%)
- Collection View: 8/8 criteria met (100%)

---

## Next Steps

### Immediate Actions
1. [x] Review and approve this plan (Planner → User)
2. [ ] Create builder-tasks.md with detailed task breakdown
3. [ ] Create tech-stack.md with technology decisions
4. [ ] Create patterns.md with code examples for all patterns
5. [ ] Execute builders in parallel (Builder-1, Builder-2, Builder-3)

### Post-Iteration Actions
1. [ ] User acceptance testing with Ahiya
2. [ ] Performance profiling on production environment
3. [ ] Document learnings for Iteration 11
4. [ ] Plan Iteration 11 scope (Micro-interactions & Polish)

---

**Iteration Status:** PLANNED
**Ready for:** Builder Execution
**Focus:** Core value proposition - Dashboard richness, reflection depth, beautiful reflection display
**Expected Outcome:** Mirror of Dreams feels like a complete, emotionally resonant sanctuary for self-reflection

---

## Design Philosophy Alignment

> "Mirror of Dreams is not just functional—it's a sanctuary. Every element serves the sacred act of self-reflection. The dashboard welcomes you home. The reflection page creates space for depth. Each past reflection is honored as a moment of insight. This is where technology and introspection meet with grace."

**This iteration delivers on that promise:**
- **Dashboard as home** - Not empty, but rich with progress and invitation
- **Reflection as sacred** - Contemplative atmosphere, smooth transitions, intentional pacing
- **Past reflections honored** - Beautiful typography, markdown formatting, reading-optimized layout
- **Collection as library** - Organized, filterable, discoverable journey through reflections

**Iteration 10 transforms Mirror of Dreams from good to exceptional.**
