# 2L Iteration Plan - Mirror of Dreams Iteration 2

## Project Vision

Transform Mirror of Truth into Mirror of Dreams with dreams as first-class citizens. Users will create and track specific dreams (goals), link reflections to those dreams, and experience a mystic purple/blue visual rebrand that emphasizes dream-based growth tracking. This iteration establishes the foundation for goal-oriented consciousness work.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] Dreams table exists with GENERATED days_left column calculating days until target_date
- [ ] Reflections table has dream_id foreign key linking each reflection to a dream
- [ ] All existing reflections migrated to default "My Journey" dreams per user
- [ ] Admin user ahiya.butman@gmail.com created with Premium tier and unlimited access
- [ ] Dreams tRPC router operational with all 6 procedures (create, list, get, update, updateStatus, delete)
- [ ] Tier limits enforced: Free (2 dreams), Essential (5 dreams), Optimal (7 dreams), Premium (unlimited)
- [ ] Dream selection UI appears before reflection creation flow
- [ ] Dashboard displays dreams grid with reflection counts and days remaining
- [ ] Visual rebrand complete: "Mirror of Truth" changed to "Mirror of Dreams" across all UI
- [ ] Color palette updated to Mystic Purple (#8B5CF6, #A78BFA) + Deep Blue (#1E3A8A, #3B82F6)
- [ ] Mirror shards and cosmic background preserved from original design
- [ ] Claude Sonnet 4.5 model (claude-sonnet-4-5-20250929) successfully generating reflections
- [ ] All pages mobile-responsive with dreams UI optimized for 60%+ mobile traffic
- [ ] No data loss during migration (all reflections preserved with proper dream linkage)

## MVP Scope

**In Scope:**

1. Database Schema Evolution
   - Dreams table with auto-calculated days_left
   - dream_id FK on reflections table
   - Safe migration with rollback capability

2. Dreams Management System
   - Full CRUD operations via tRPC
   - Tier-based limits enforcement
   - Status management (active/achieved/archived/released)
   - Category and priority support

3. Dreams UI Components
   - DreamCard: Display individual dream with stats
   - DreamList: Grid/list view of all dreams
   - CreateDreamForm: Modal/page for dream creation
   - DreamDetailPage: Full dream view with reflection history
   - Dream selector: Pre-reflection flow to choose which dream

4. Visual Rebrand
   - Global search/replace: "Mirror of Truth" to "Mirror of Dreams"
   - CSS variables update to purple/blue palette
   - Landing page hero redesign
   - Dashboard layout update (dreams-first)
   - Component styling updates
   - Logo/branding update (🪞 → 🌟 with purple glow)

5. Claude 4.5 Integration
   - Model string update to claude-sonnet-4-5-20250929
   - Testing reflection generation quality
   - Cost tracking verification

6. Admin User Setup
   - Create ahiya.butman@gmail.com with Premium tier
   - Set is_admin and is_creator flags
   - Verify unlimited access privileges

**Out of Scope (Post-MVP):**

- Dream sharing/collaboration features
- Advanced analytics per dream
- Dream templates library
- AI-suggested dreams based on reflections
- Dream achievement celebrations/badges
- Dream journey visualization timeline
- Export dreams as PDF/image
- Dream reminders/notifications

## Development Phases

1. **Exploration** ✅ Complete (No explorer reports found - proceeding with master plan specs)
2. **Planning** 🔄 Current (This document)
3. **Building** ⏳ 3.5 hours (4 parallel builders)
4. **Integration** ⏳ 30 minutes (Merge builder outputs, resolve conflicts)
5. **Validation** ⏳ 20 minutes (Test migrations, UI flows, Claude 4.5)
6. **Deployment** ⏳ Final (Deploy to production)

## Timeline Estimate

- Exploration: Complete (0h)
- Planning: Complete (0.5h)
- Building: 3.5 hours
  - Builder-1 (Database): 45 minutes
  - Builder-2 (Dreams Router): 60 minutes
  - Builder-3 (Dreams UI): 90 minutes
  - Builder-4 (Rebrand + Claude 4.5): 60 minutes
- Integration: 30 minutes
- Validation: 20 minutes
- **Total: ~5 hours**

## Risk Assessment

### High Risks

**Data Migration Risk**
- **Risk:** Existing reflections could lose data or fail to link to dreams during migration
- **Mitigation:**
  - Create migration rollback script before execution
  - Test migration on copy of production data first
  - Make dream_id nullable during migration, then NOT NULL after linking
  - Keep transaction atomic with proper error handling
  - Create backup of reflections table before migration

**Claude 4.5 Model Change Risk**
- **Risk:** New model may generate different quality/format reflections
- **Mitigation:**
  - Test with 5-10 sample reflections before full deployment
  - Keep prompt templates compatible with model
  - Monitor first 20 production reflections for quality
  - Have rollback plan to claude-sonnet-4-20250514 if needed

**Tier Limits Enforcement Risk**
- **Risk:** Users bypassing dream limits through concurrent requests
- **Mitigation:**
  - Use database transaction with FOR UPDATE lock
  - Check limit immediately before insert
  - Return clear error messages with upgrade CTA
  - Log limit violations for monitoring

### Medium Risks

**Mobile UI Complexity**
- **Risk:** Dreams UI may not render well on mobile (60% of traffic)
- **Mitigation:**
  - Mobile-first design approach
  - Test on actual devices (iOS Safari, Android Chrome)
  - Use responsive CSS Grid with mobile breakpoints
  - Simplify mobile UI (stack cards, reduce visual complexity)

**Visual Rebrand Consistency**
- **Risk:** Missing "Mirror of Truth" references, inconsistent purple/blue usage
- **Mitigation:**
  - Global search for "Mirror of Truth" before deployment
  - CSS variable approach for colors (single source of truth)
  - Visual QA checklist for all pages
  - Builder-4 creates comprehensive rebrand checklist

**Integration Conflicts**
- **Risk:** Builder-3 and Builder-4 both modify dashboard, causing merge conflicts
- **Mitigation:**
  - Clear file ownership in builder-tasks.md
  - Builder-4 focuses on CSS/globals, Builder-3 on new components
  - Integration phase budgets 30 minutes for conflict resolution

### Low Risks

**Performance with Days Left Calculation**
- **Risk:** GENERATED column might slow queries on large datasets
- **Impact:** Low (early stage product, small user base)
- **Mitigation:** Monitor query performance, add index if needed

## Integration Strategy

### Phase 1: Database Foundation (Builder-1 Output)
1. Review migration SQL for safety
2. Execute migration on local/staging first
3. Verify all existing reflections linked to default dreams
4. Confirm admin user created successfully
5. Run test queries to validate GENERATED column

### Phase 2: Backend Integration (Builder-2 Output)
1. Add dreams router to _app.ts
2. Test all 6 procedures with Postman/tRPC client
3. Verify tier limits enforcement with test users
4. Confirm error messages clear and actionable

### Phase 3: Frontend Integration (Builder-3 + Builder-4 Output)
1. **Conflict Resolution:**
   - Dashboard.tsx: Builder-3 adds DreamList component, Builder-4 updates branding
   - Merge both changes, prioritize Builder-3 layout, Builder-4 styling
   - Reflection flow: Builder-3 owns new dream selector
   - Landing page: Builder-4 owns rebrand

2. **Component Integration:**
   - Place new Dream components in /components/dreams/
   - Update dashboard imports
   - Test dream creation → reflection flow end-to-end

3. **Style Integration:**
   - Merge CSS variable changes from Builder-4
   - Apply purple/blue palette globally
   - Verify no style regressions on existing pages

### Phase 4: Testing & Validation
1. Test user journey: Signup → Create Dream → Reflect → View Dashboard
2. Test tier limits: Create max dreams for each tier
3. Test migration: Verify old reflections appear under default dreams
4. Test Claude 4.5: Generate 5 reflections, review quality
5. Mobile testing: Test on iPhone and Android
6. Visual QA: Check all pages for rebrand consistency

### Shared Files Coordination

**Files Modified by Multiple Builders:**

- `app/dashboard/page.tsx`: Builder-3 (layout), Builder-4 (branding)
- `app/page.tsx` (landing): Builder-4 (rebrand)
- `styles/variables.css`: Builder-4 (color palette)
- `server/trpc/routers/_app.ts`: Builder-2 (add dreams router)

**Resolution Strategy:**
- Builder-3 completes first (UI structure)
- Builder-4 applies rebrand on top (non-conflicting styling)
- Integration phase: Manual merge if conflicts occur

## Deployment Plan

### Pre-Deployment Checklist
- [ ] All builder outputs reviewed and integrated
- [ ] Migration tested on staging database
- [ ] Backup of production database created
- [ ] Environment variables verified (ANTHROPIC_API_KEY points to Sonnet 4.5)
- [ ] Mobile testing complete on real devices
- [ ] Visual QA passed on all major pages
- [ ] Admin user credentials securely stored

### Deployment Steps

1. **Database Migration** (5 minutes, downtime required)
   - Put app in maintenance mode
   - Backup production database
   - Run migration SQL
   - Verify migration success
   - Remove maintenance mode

2. **Application Deployment** (10 minutes)
   - Deploy new code to production
   - Restart application servers
   - Clear CDN cache for CSS/JS changes
   - Verify application boots successfully

3. **Post-Deployment Validation** (10 minutes)
   - Test login as admin user
   - Create test dream
   - Generate test reflection with Claude 4.5
   - Check dashboard displays dreams correctly
   - Test mobile view on actual device
   - Monitor error logs for 10 minutes

4. **Rollback Plan (If Needed)**
   - Revert code deployment
   - Restore database from backup
   - Clear caches
   - Investigate failure in staging environment

### Monitoring Post-Launch
- Watch Claude API costs (new model pricing)
- Monitor dream creation rate by tier
- Track reflection → dream linkage success rate
- Review user feedback on visual rebrand
- Check mobile analytics for UI issues

## Notes for Builders

- **Communication:** If you discover an issue with the plan, document it clearly in your completion report
- **Testing:** Each builder should test their own output before marking complete
- **Documentation:** Update inline code comments for complex logic
- **Mobile-First:** Always test responsive behavior, especially Builder-3 and Builder-4
- **Safety:** Builder-1 must include rollback SQL in migration file

## Next Iteration Preview (Iteration 3)

After this iteration completes, Iteration 3 will add:
- Dream achievement flow (mark dream as achieved, generate celebration artifact)
- Dream evolution reports (AI analysis of progress toward specific dream)
- Dream-specific reflection insights (patterns across all reflections for one dream)
- Advanced dream filtering/sorting on dashboard

---

**Planner Sign-Off:** This plan balances ambition with safety, establishes clear builder boundaries, and provides comprehensive integration strategy. Total estimated time: 5 hours. Risk level: MEDIUM (mitigated with proper testing).
