# 2L Iteration Plan - Mirror of Dreams: Core Pages & Product Completeness

## Project Vision

Complete the product experience by building essential self-service pages (Profile, Settings, About, Pricing) that transform Mirror of Dreams from a functional application into a complete, commercially viable sanctuary. Users should never encounter 404 errors on navigation links, and all account management features should be self-service.

This iteration eliminates table stakes gaps: users can manage their profile, configure preferences, understand the product story, and explore pricing options - all without leaving the application.

## Success Criteria

- [ ] Zero 404 errors on navigation links (Profile, Settings, About, Pricing all load successfully)
- [ ] Profile mutations functional (name change, email change, password change all work correctly)
- [ ] Email change requires password verification and issues new JWT token
- [ ] Delete account requires email confirmation and password verification
- [ ] Settings persist immediately on toggle (no "Save" button needed)
- [ ] All 8 preference toggles save to database JSONB column correctly
- [ ] About page tells compelling founder story (reviewed by Ahiya for authenticity)
- [ ] Pricing page displays correct tier limits (free=10, premium=50, pro=unlimited)
- [ ] Pricing page clarifies value proposition for each tier
- [ ] Tier limits discrepancy resolved across all files (constants.ts, users.ts router, pricing page)
- [ ] All pages follow established design system (GlassCard, CosmicBackground, consistent spacing)
- [ ] Mobile responsive on all four new pages
- [ ] Toast notifications provide clear feedback for all mutations
- [ ] Demo user protection (read-only for destructive operations)

## MVP Scope

### In Scope

**Backend Infrastructure:**
- Add `changeEmail` mutation to users router (password-protected, JWT invalidation)
- Add `updatePreferences` mutation to users router (partial JSONB updates)
- Add validation schemas: `changeEmailSchema`, `updatePreferencesSchema`
- Reuse existing `changePassword` mutation from auth router
- Reuse existing `deleteAccount` mutation from auth router
- Fix tier limits discrepancy (align vision with code)

**Profile Page:**
- Account information section (name editable, email display, member since)
- Tier and subscription display (current tier, benefits, usage stats)
- Account actions (change email, change password, delete account)
- Usage statistics (reflections this month / limit, total reflections)
- "Danger Zone" section for account deletion
- GlassCard layout with GlassInput components

**Settings Page:**
- Notification preferences (email notifications, reflection reminders)
- Reflection preferences (default tone, character counter visibility)
- Display preferences (reduce motion override)
- Privacy settings (analytics opt-in)
- Immediate save on toggle (no Save button)
- Grouped sections (4 categories)

**About Page:**
- Founder story section (Ahiya's personal narrative)
- Mission statement (why Mirror of Dreams exists)
- Product philosophy (reflection + AI approach)
- Core values (privacy-first, substance over flash, continuous evolution)
- Call to action ("Start Your Free Account")
- Personal photo (if provided)

**Pricing Page:**
- Three-tier comparison table (Free, Premium, Pro)
- Feature comparison matrix (checkmarks for included features)
- Tier limits display (reflections per month, dreams limit)
- FAQ section (5-7 common questions)
- CTA buttons per tier ("Start Free", "Upgrade to Premium", "Contact Sales")
- Highlight "Most Popular" tier (Premium)

### Out of Scope (Post-MVP)

- Email verification flow (send verification emails on email change)
- Password reset via email (implement in security iteration)
- Two-factor authentication (future security enhancement)
- Soft delete with recovery period (use hard delete for MVP simplicity)
- Subscription management UI (upgrade/downgrade/cancel - defer to payment iteration)
- Advanced settings (timezone, language auto-detect)
- Settings export/import
- Activity log / audit trail
- Team/organization accounts
- Custom pricing tiers
- Annual billing toggle (show pricing only, no implementation)

## Development Phases

1. **Exploration** - COMPLETE (Explorer-1 and Explorer-2 reports finalized)
2. **Planning** - CURRENT (Creating comprehensive plan documents)
3. **Building** - Approximately 12-16 hours (2 builders working in parallel)
4. **Integration** - 30-45 minutes (minimal conflicts, shared components only)
5. **Validation** - 45-60 minutes (manual testing of all mutations and page flows)
6. **Deployment** - 15 minutes (database already has preferences column)

## Timeline Estimate

- **Exploration:** COMPLETE (4 hours total - both explorers)
- **Planning:** COMPLETE (current phase - 2 hours)
- **Building:** 12-16 hours
  - Builder-1 (Backend + Profile/Settings): 8-10 hours
  - Builder-2 (About/Pricing + Tier Limits Fix): 4-6 hours
- **Integration:** 30-45 minutes (merge builder branches, resolve conflicts)
- **Validation:** 45-60 minutes (comprehensive mutation testing)
- **Deployment:** 15 minutes (no migrations needed, preferences column exists)

**Total Estimated Duration:** 20-24 hours (matches master-plan.yaml scope)

## Risk Assessment

### High Risks

**Tier Limits Discrepancy (BLOCKER - RESOLVED IN PLAN)**
- **Risk:** Three conflicting tier limit definitions create Pricing page blocker
  - Vision: free=10, premium=50, pro=unlimited
  - constants.ts: free=3, essential=20, premium=Infinity
  - users.ts router: free=1, essential=5, premium=10
- **Impact:** Cannot build accurate Pricing page without resolution
- **Mitigation:**
  1. **DECISION:** Use vision document values (free=10, premium=50, pro=unlimited)
  2. Update `constants.ts` to match vision (single source of truth)
  3. Remove hardcoded limits from `users.ts` router (import from constants)
  4. Update vision tier naming to match database (free, essential, premium)
  5. Builder-2 handles this as first task before Pricing page

### Medium Risks

**Email Change Without Verification**
- **Risk:** Users can change email to any address without email verification (potential account hijacking)
- **Impact:** Security concern, but password-protection provides mitigation
- **Mitigation:**
  1. Require current password for email change (prevents XSS attacks)
  2. Check email uniqueness in database (prevent duplicate accounts)
  3. Issue new JWT token (invalidate old token containing old email)
  4. Defer email verification to post-MVP (per master-plan.yaml line 135)
  5. Log email changes for future audit trail

**Content Dependency for About Page**
- **Risk:** Waiting for Ahiya's founder story delays iteration completion
- **Impact:** About page incomplete without authentic content
- **Mitigation:**
  1. Builder creates page layout with placeholder content
  2. Mark About page with "NEEDS_CONTENT" flag in PR
  3. Provide content template to Ahiya (structure + word count guidelines)
  4. Ahiya writes content in parallel (2-3 hours)
  5. Content can be added post-merge without code changes

**Demo User Write Protection**
- **Risk:** Demo account data corruption if users modify settings/profile
- **Impact:** Demo experience degrades, requires daily reset
- **Mitigation:**
  1. Implement `notDemo` middleware (blocks destructive operations)
  2. Apply to email change, account deletion (high-value protection)
  3. Allow preference updates for demo (resets nightly via seed script)
  4. Frontend shows banner: "Demo account - Sign up to save changes"
  5. Disable destructive action buttons for demo users

### Low Risks

**JWT Token Invalidation Issues**
- **Risk:** Old JWT still valid after email change (until 30-day expiry)
- **Impact:** Minor security concern (new token issued, frontend replaces)
- **Mitigation:** Email change returns new JWT, frontend replaces in localStorage

**Settings State Sync**
- **Risk:** Optimistic UI updates vs. server state mismatch
- **Impact:** User sees stale preferences after toggle
- **Mitigation:** Use tRPC React Query for automatic state sync + cache invalidation

**Preferences Schema Evolution**
- **Risk:** Future preference fields require migration
- **Impact:** Breaking changes to existing users
- **Mitigation:** JSONB supports dynamic keys + DEFAULT_PREFERENCES merge pattern

## Integration Strategy

### Builder Coordination

**Two Builders, Minimal Overlap:**

**Builder-1 Focus:**
- Backend mutations (users router, schemas)
- Profile page (account management UI)
- Settings page (preferences UI)

**Builder-2 Focus:**
- Tier limits fix (constants.ts, users.ts router)
- About page (marketing content)
- Pricing page (tier comparison)

**Shared Files (Potential Conflicts):**
- `/server/trpc/routers/users.ts` - Builder-1 adds mutations, Builder-2 fixes tier limits
  - **Resolution:** Builder-2 starts after Builder-1 commits mutations (sequential)
- `/types/schemas.ts` - Builder-1 adds validation schemas
  - **Resolution:** Builder-1 commits schemas first, Builder-2 imports only
- No shared frontend files (different pages)

### Integration Process

1. **Builder-1 commits first** (backend mutations + Profile/Settings pages)
   - Creates: `app/profile/page.tsx`, `app/settings/page.tsx`
   - Extends: `server/trpc/routers/users.ts` (adds mutations)
   - Extends: `types/schemas.ts` (adds validation schemas)

2. **Builder-2 pulls Builder-1 branch** (tier limits fix + About/Pricing pages)
   - Modifies: `lib/utils/constants.ts` (updates TIER_LIMITS)
   - Modifies: `server/trpc/routers/users.ts` (removes hardcoded limits, imports from constants)
   - Creates: `app/about/page.tsx`, `app/pricing/page.tsx`

3. **Integration validator merges both branches**
   - Verifies no import conflicts
   - Tests all four pages load
   - Tests all mutations work
   - Runs full validation suite

### Testing Coordination

**Builder-1 Tests:**
- Profile name change (verify toast + database update)
- Email change flow (verify password required, new JWT issued)
- Password change (verify bcrypt validation)
- Delete account (verify cascade delete)
- Settings toggles (verify JSONB updates)

**Builder-2 Tests:**
- Tier limits display correctly on Pricing page
- Constants imported correctly in users router
- About page responsive layout
- Pricing page feature matrix accurate

**Integration Tests:**
- Navigate to all four pages from AppNavigation
- Verify no 404 errors
- Verify design consistency across pages
- Mobile responsive on all pages

## Deployment Plan

### Pre-Deployment Checklist

- [ ] Database schema verification (preferences column exists from iteration 12)
- [ ] Environment variables verified (JWT_SECRET, DATABASE_URL)
- [ ] Tier limits aligned across all files
- [ ] Content review complete (Ahiya approves About page)
- [ ] All mutations tested manually
- [ ] Toast notifications tested for all actions
- [ ] Mobile responsive verified on all pages
- [ ] Demo user protection tested

### Deployment Steps

1. **Code Review**
   - Verify all mutations follow established patterns
   - Check error handling consistency
   - Validate Zod schemas match TypeScript types
   - Review toast message copy for clarity

2. **Database Verification**
   - Confirm `users.preferences` column exists (from iteration 12)
   - Confirm `users.is_demo` column exists (from iteration 12)
   - No migrations needed for this iteration

3. **Merge to Main**
   - Merge Builder-1 branch (backend + Profile/Settings)
   - Merge Builder-2 branch (tier limits + About/Pricing)
   - Deploy to production

4. **Post-Deployment Validation**
   - Test Profile page mutations in production
   - Test Settings page toggles save correctly
   - Verify About page content displays
   - Verify Pricing page tier limits match vision
   - Test demo user protection (email change blocked)

### Rollback Plan

**If critical issues found:**
1. Revert main branch to pre-iteration commit
2. Pages return to 404 (expected state before iteration)
3. No database rollback needed (preferences column optional)
4. Fix issues in feature branch, re-deploy

**Low rollback risk:** Only frontend pages + new mutations (no breaking changes to existing features)

## Performance Targets

- **Page Load Time:** All four pages <1.5s LCP (leverage existing CosmicBackground caching)
- **Bundle Size Impact:** <15KB total increase (4 pages + 2 mutations)
  - Profile page: ~4KB (form components reused)
  - Settings page: ~3KB (toggle logic minimal)
  - About page: ~2KB (static content)
  - Pricing page: ~4KB (comparison table)
  - Backend mutations: ~2KB (validation schemas)
- **Database Query Performance:**
  - Profile mutations <200ms (single UPDATE query)
  - Preferences update <150ms (JSONB partial update)
  - Page loads leverage existing `getProfile` query (no new N+1 queries)
- **Mobile Performance:** All pages maintain 90+ Lighthouse score on mobile

## Security Considerations

**Password-Protected Operations:**
- Email change requires current password verification (bcrypt.compare)
- Account deletion requires password + email confirmation
- No password stored in frontend state (entered, verified, discarded)

**JWT Token Management:**
- Email change invalidates old JWT (new token issued with updated email)
- Frontend replaces token in localStorage immediately
- 30-day expiry maintained on new token (full duration, not inherited)

**Demo User Protection:**
- `notDemo` middleware blocks destructive operations for demo account
- Frontend disables buttons for demo users
- Demo banner alerts users to sign up for full functionality

**Input Validation:**
- All mutations use Zod schemas (runtime validation)
- Email format validation (`.email()` validator)
- Password minimum length (6 characters, enforced at schema level)
- JSONB preferences validated against enum values

**Database Security:**
- Preferences JSONB sanitized (no code injection)
- Email uniqueness enforced at database level
- Cascade delete configured (foreign keys delete reflections on account deletion)

## Content Requirements

**About Page Content (Ahiya to provide):**
- Founder story: 250-350 words (personal narrative, why Mirror of Dreams exists)
- Mission statement: 50-100 words (clear value proposition)
- Product philosophy: 100-150 words (reflection + AI approach)
- Core values: 3-5 bullet points (privacy-first, substance over flash, etc.)
- Founder photo: Optional (WebP format, 800x800px recommended)

**Pricing Page Content:**
- Tier feature descriptions (already defined in vision)
- FAQ answers: 5-7 common questions (Can I change plans? Refund policy? Data security?)
- Value propositions per tier (why upgrade to Premium/Pro?)

**Settings Page Copy:**
- Preference descriptions (already defined in vision)
- Help text for each toggle (brief explanation of impact)

**Template Provided to Ahiya:**
```markdown
# About Page Content Template

## Founder Story (250-350 words)
[Why did you create Mirror of Dreams? What personal experience led to this? What transformation do you hope to enable?]

## Mission Statement (50-100 words)
We believe [core belief about dreams/reflection]...

## Product Philosophy (100-150 words)
Why reflection + AI? [Explain the approach, what makes it unique]

## Core Values
- [Value 1]: [1 sentence explanation]
- [Value 2]: [1 sentence explanation]
- [Value 3]: [1 sentence explanation]
```

## Next Steps

1. **Planner completes this document** (current phase)
2. **Planner creates tech-stack.md** (technology decisions)
3. **Planner creates patterns.md** (code patterns with working examples)
4. **Planner creates builder-tasks.md** (detailed task breakdown for 2 builders)
5. **Orchestrator spawns Builder-1** (backend + Profile/Settings)
6. **Builder-1 completes work** (8-10 hours)
7. **Orchestrator spawns Builder-2** (tier limits + About/Pricing)
8. **Builder-2 completes work** (4-6 hours, pulls Builder-1 branch)
9. **Integration validation** (30-45 minutes)
10. **Content integration** (Ahiya provides About page content)
11. **Final testing** (45-60 minutes)
12. **Deploy to production** (15 minutes)

## Notes

- No database migrations needed (preferences column added in iteration 12)
- Email verification deferred to post-MVP (per master-plan.yaml line 135)
- Delete account uses hard delete (not soft delete) for MVP simplicity
- Demo user can change password (allowed, resets nightly)
- Settings save immediately (no Save button, per master-plan.yaml line 114)
- Tier naming aligned: database uses "essential", vision uses "premium" → keep database naming, update vision
