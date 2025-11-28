# 2L Iteration Plan - Mirror of Dreams (Iteration 15)

## Project Vision
Transform Mirror of Dreams from 7.5/10 (beautiful but buggy/incomplete) to 9/10 (polished, complete, demonstrable) by fixing critical navigation/layout bugs, completing demo user data with evolution reports and visualizations, and enhancing reflection space aesthetics. This iteration focuses exclusively on bug fixes, content completion, and polish - no new features.

## Success Criteria
Specific, measurable criteria for Iteration 15 completion:

- [ ] **Navigation Stack Fixed:** Demo banner fully visible at top, navigation below it, no content overlap on ANY page
- [ ] **Dashboard Displays Content:** All 7 dashboard sections render visibly within 500ms for demo user
- [ ] **Dream Context Visible:** Dream name appears at top of reflection form when pre-selected or after selection
- [ ] **Demo Evolution Reports Exist:** At least 1 evolution report generated for "Launch My SaaS Product" dream
- [ ] **Demo Visualizations Exist:** At least 1 visualization generated for "Launch My SaaS Product" dream
- [ ] **Reflection Space Enhanced:** Form feels sacred and welcoming, not clinical
- [ ] **Layout Consistency Verified:** All 10 authenticated pages tested with demo banner, no overlap issues
- [ ] **Overall Quality:** Stakeholder rates product at 9/10 - "ready to show anyone"

## MVP Scope

**In Scope (Iteration 15):**
- Fix navigation/demo banner CSS variables and z-index stacking
- Fix dashboard animation system (remove conflicts, add fallback)
- Fix dashboard grid layout (2x2 → 3x2 to accommodate 6 cards)
- Add dream context banner to reflection flow
- Generate 1 evolution report for demo user's "Launch My SaaS Product" dream
- Generate 1 visualization for demo user's "Launch My SaaS Product" dream
- Enhance reflection space aesthetics (sacred atmosphere)
- Audit and fix layout padding on all 10 authenticated pages

**Out of Scope (Post-Iteration 15):**
- New features (everything needed exists)
- Additional evolution reports for other dreams
- Additional visualizations for variety
- Database schema changes
- Backend API changes
- Router bug fixes (evolution.ts uses wrong column name - documented separately)
- Demo banner dismiss functionality
- Dark/light theme toggle
- Reflection templates
- Guided onboarding

## Development Phases

1. **Exploration** ✅ Complete (3 explorers: Navigation/CSS, Dashboard/Animation, Demo Data/Schema)
2. **Planning** 🔄 Current
3. **Building** ⏳ 3-4 hours (4 parallel builders)
4. **Integration** ⏳ 15 minutes (minimal conflicts expected)
5. **Validation** ⏳ 30 minutes (test all 10 pages, verify demo content)
6. **Deployment** ⏳ Final

## Timeline Estimate

- Exploration: Complete (3 comprehensive explorer reports)
- Planning: Complete (this document)
- Building: 3-4 hours (parallel builders)
  - Builder-1 (Navigation): 45 minutes
  - Builder-2 (Dashboard): 2 hours
  - Builder-3 (Demo Data): 2 hours
  - Builder-4 (UX Polish): 1.5 hours
- Integration: 15 minutes (builders work on isolated files)
- Validation: 30 minutes (comprehensive testing)
- **Total: ~4-5 hours**

## Risk Assessment

### High Risks
- **Dashboard animation conflicts:** Triple animation system conflict causes complexity
  - **Mitigation:** Remove 2 of 3 animation systems, keep only useStaggerAnimation with fallback
- **Schema column name mismatch:** Router uses `evolution` but migration defines `analysis`
  - **Mitigation:** Use `analysis` column (migration is source of truth), document router bug separately

### Medium Risks
- **IntersectionObserver race condition:** May not trigger on page load, causing dashboard to stay invisible
  - **Mitigation:** Add 2-second fallback timeout to force visibility
- **Grid layout responsive breakpoints:** Changing from 2x2 to 3x2 may affect mobile
  - **Mitigation:** Test responsive breakpoints after changes
- **Evolution content quality:** AI-generated demo content must feel authentic
  - **Mitigation:** Use extended thinking, review output before committing

### Low Risks
- **CSS variable cascade timing:** Variables loaded before JS hydration
  - **Mitigation:** Variables defined in static CSS file, no FOUC expected
- **Multiple pages to update:** 4 pages need manual padding updates
  - **Mitigation:** Clear pattern to follow, low complexity changes

## Integration Strategy

Builders work on **isolated files** with minimal overlap:

- **Builder-1** modifies: CSS variables, utility classes, DemoBanner component, 4 page files
- **Builder-2** modifies: useStaggerAnimation hook, DashboardCard component, dashboard CSS files, DashboardGrid
- **Builder-3** modifies: seed-demo-user.ts script only
- **Builder-4** modifies: MirrorExperience component, reflection CSS files

**No shared files between builders** - integration is straightforward file merge.

**Conflict prevention:**
- Builder-1 owns all CSS variable definitions
- Builder-2 owns all animation-related code
- Builder-3 works in scripts/ directory only
- Builder-4 owns reflection page components only

**Integration order:**
1. Builder-1 (Navigation) → Test all pages
2. Builder-2 (Dashboard) → Test dashboard display
3. Builder-3 (Demo Data) → Verify evolution/visualization pages
4. Builder-4 (UX Polish) → Test reflection flow

## Deployment Plan

**Pre-deployment checklist:**
- [ ] All 4 builders complete successfully
- [ ] Demo user login verified (alex.chen.demo@example.com)
- [ ] Dashboard displays all 7 sections for demo user
- [ ] Evolution report visible at /evolution
- [ ] Visualization visible at /visualizations
- [ ] Reflection flow shows dream context
- [ ] All 10 pages tested with demo banner visible

**Deployment steps:**
1. Commit all builder changes to main branch
2. Run seed script: `npx tsx scripts/seed-demo-user.ts`
3. Verify demo content: `npx tsx scripts/verify-demo.ts`
4. Deploy to production (Vercel auto-deploy on main)
5. Test production site with demo user login
6. Stakeholder final review

**Rollback plan:**
- Git revert if critical issues found
- Seed script is idempotent (safe to re-run)
- No database migrations = low rollback risk

---

**Vision Status:** PLANNED
**Ready for:** Builder Execution
**Focus:** Fix bugs. Complete demo. Polish reflection. Reach 9/10.
