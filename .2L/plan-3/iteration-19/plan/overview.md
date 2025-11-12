# 2L Iteration Plan - Mirror of Dreams (Iteration 19)

## Project Vision
Mirror of Dreams is a soft, glossy, sharp AI consciousness companion that helps users reflect on their dreams and see patterns in their growth. This iteration establishes a **solid foundation** by testing current functionality, creating the admin user, fixing critical schema issues, and validating that core flows work end-to-end.

## Success Criteria
Specific, measurable criteria for Iteration 19 completion:

- [ ] Admin user (ahiya.butman@gmail.com) created with is_admin and is_creator flags
- [ ] Admin can sign in and access dashboard successfully
- [ ] Usage tracking schema fixed (month_year TEXT → month DATE)
- [ ] Reflection tier limits corrected (Free: 4/month, not 1/month)
- [ ] Tier structure clarified (2 tiers: Free/Optimal vs 4 tiers in code)
- [ ] Auth flow tested end-to-end (signup → signin → dashboard)
- [ ] Dreams CRUD tested (create → view → edit → archive)
- [ ] Reflection flow tested (5 questions → AI response → save)
- [ ] Dashboard data consolidation refactored (remove dual fetching)
- [ ] Zero critical console errors
- [ ] Complete documentation of current state for Iteration 20

## MVP Scope

**In Scope for Iteration 19:**
- Admin user creation and verification
- Database schema fixes (usage_tracking table)
- Tier limit alignment with vision (Free: 2 dreams, 4 reflections; Optimal: 7 dreams, 30 reflections)
- Core flow testing (auth, dreams, reflections, dashboard)
- Dashboard data consolidation fix
- Critical bug fixes discovered during testing
- State documentation for next iteration

**Out of Scope (Later Iterations):**
- Onboarding flow (Iteration 21)
- Evolution report generation UI (Iteration 20)
- Visualization generation UI (Iteration 20)
- Landing page polish (Iteration 21)
- Payment integration (Post-MVP)
- Email notifications (Post-MVP)

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current (this document)
3. **Building** - 2-4 hours (2-3 parallel builders)
4. **Integration** - 30 minutes
5. **Validation** - 1 hour (manual testing)
6. **Deployment** - N/A (local dev only)

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 2-4 hours
  - Builder-1 (Schema & Admin): 1-2 hours
  - Builder-2 (Dashboard & Testing): 1-2 hours
  - Can work in parallel with minimal dependencies
- Integration: 30 minutes
- Validation: 1 hour (manual testing of all flows)
- **Total: ~4-6 hours**

## Risk Assessment

### High Risks

**Risk:** Usage tracking schema migration fails and breaks evolution/visualization generation
**Mitigation:**
- Test migration on local database first
- Create backup before migration
- Verify all database functions work after migration
- Document rollback steps

**Risk:** Tier limit changes break existing users' access
**Mitigation:**
- Only admin user exists currently (premium tier - unlimited)
- Changes affect new users only
- Test tier enforcement before deploying

### Medium Risks

**Risk:** Dashboard refactoring introduces new bugs
**Mitigation:**
- Keep original code as backup
- Test each card independently after changes
- Verify loading states work correctly
- Check for console errors

**Risk:** Admin user creation script fails due to existing user
**Mitigation:**
- Script already handles "user exists" case
- Verify existing user has correct flags
- Update flags if needed via SQL

## Integration Strategy

Builder-1 and Builder-2 work independently on different areas:
- **Builder-1:** Database schema + admin user (backend focused)
- **Builder-2:** Dashboard refactoring + testing (frontend focused)

Integration points:
1. Builder-1 completes schema migration → Builder-2 can test with new schema
2. Both builders document findings in shared testing report
3. Final integration is simple: merge both fixes into codebase

No file conflicts expected - they work on different files:
- Builder-1: SQL migrations, scripts, backend routers
- Builder-2: Dashboard page, hooks, card components

## Deployment Plan

**Iteration 19 is local development only:**
- No deployment to production
- All testing on local Supabase instance (http://127.0.0.1:54321)
- Changes committed to git but not deployed
- Deployment readiness verified for Iteration 21

**Verification Steps:**
1. TypeScript compilation passes (`npm run build`)
2. No console errors in development mode
3. Admin user can sign in successfully
4. Core flows complete without errors
5. Database functions execute correctly

## Current State Assessment

Based on explorer reports:

**What Works:**
- Database schema exists (7 tables with data)
- tRPC backend is comprehensive and well-structured
- Authentication flow (signup, signin, JWT tokens)
- Dreams management (CRUD operations)
- Reflection flow (5-question Mirror Experience)
- Cosmic glass UI components (production-ready)
- Admin router and permissions system
- AI integration (Anthropic Claude Sonnet 4)

**What's Broken:**
- Usage tracking table schema (month_year TEXT should be month DATE)
- Reflection tier limits wrong (Free: 1 should be 4)
- Tier structure confusion (4 tiers in code, 2 in vision)
- Dashboard has dual data fetching (hook + cards)

**What's Missing:**
- Evolution report generation UI (backend ready)
- Visualization generation UI (backend ready)
- Onboarding flow (planned for Iteration 21)
- Landing page CTA for onboarding (Iteration 21)

**Integration Gaps:**
- Dashboard cards fetch data independently despite useDashboard hook
- Evolution/visualization buttons on dream detail page don't work yet
- Recent reflections section in dashboard needs cross-dream query

## Documentation Plan

Each builder creates a testing report:

**Builder-1 Report:**
- Schema migration results
- Admin user creation verification
- Tier limit enforcement tests
- Database function test results

**Builder-2 Report:**
- Dashboard refactoring changes made
- Core flow testing results (auth, dreams, reflections)
- Console errors found and fixed
- Loading state verification

**Final State Document (created by integrator):**
- Complete list of what works
- Complete list of what's broken/incomplete
- Gaps for Iteration 20 (evolution/viz UI)
- Recommendations for Iteration 21 (onboarding)

---

**Iteration 19 Status:** PLANNED
**Ready for:** Builder execution
**Focus:** Surgical fixes and foundation testing, not rebuilding
**Goal:** Stable foundation for Iteration 20's Evolution/Visualization UI work
