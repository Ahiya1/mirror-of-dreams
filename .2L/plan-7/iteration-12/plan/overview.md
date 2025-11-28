# 2L Iteration Plan - Mirror of Dreams: Foundation & Demo User

## Project Vision

Transform Mirror of Dreams from functional (6.5/10) to complete, commercially viable sanctuary (9/10) through three focused iterations. **Iteration 12** establishes the foundation: a fully populated demo account that showcases the product's transformative power, a compelling landing page that converts visitors, and the backend infrastructure to support profile management and user preferences.

**This iteration delivers the single most important conversion tool:** A demo user experience that demonstrates Mirror of Dreams at its absolute best - authentic reflections, insightful AI responses, and tangible evolution tracking - all accessible with one click.

## Success Criteria

Specific, measurable criteria for Iteration 12 MVP completion:

- [x] Demo user account created with `is_demo = true` flag
- [x] 5 realistic dreams spanning diverse life areas (career, health, relationships, personal growth, financial)
- [x] 12-15 high-quality reflections (200-400 words each, authentic content)
- [x] 2 evolution reports generated via actual AI analysis
- [x] 1-2 visualizations created
- [x] Landing page hero section redesigned with compelling value proposition
- [x] "See Demo" + "Start Free" dual CTAs functional
- [x] 3 concrete use case examples replace generic feature cards
- [x] 3 screenshots of populated demo user (dashboard, reflection, evolution)
- [x] Screenshots optimized to WebP format, <100KB each
- [x] Landing page LCP < 2 seconds (Lighthouse > 90)
- [x] Database migration adds `preferences` JSONB and `is_demo` flag
- [x] Demo login flow auto-authenticates without password entry
- [x] Demo banner appears on all pages when viewing demo account
- [x] Footer links to About/Pricing/Privacy pages (placeholders acceptable)
- [x] Bundle size increase < 10KB (20KB remaining budget for iterations 13-14)

## MVP Scope

**In Scope (Iteration 12):**
- Demo user creation with 5 dreams, 12-15 reflections, evolution reports
- Landing page transformation (hero, CTAs, use cases, screenshots, footer)
- Backend infrastructure (database migration, tRPC mutations stubs, demo login)
- Performance setup (image optimization, Core Web Vitals monitoring)
- Demo banner component (conditional rendering for demo users)

**Out of Scope (Deferred to Iterations 13-14):**
- Profile page with account management (Iteration 13)
- Settings page with preferences UI (Iteration 13)
- About page with founder story (Iteration 13)
- Pricing page with tier comparison (Iteration 13)
- Enhanced reflection form micro-copy (Iteration 14)
- Individual reflection display enhancements (Iteration 14)
- Empty state redesigns (Iteration 14)
- Redis caching for demo user (optional, implement only if >300ms load time)

**Rationale for Scope:** Demo user is the foundation for all other features. Screenshots require populated demo data. Landing page transformation drives conversion. Backend infrastructure enables Iteration 13.

## Development Phases

1. **Exploration** ✅ Complete
   - Explorer-1: Architecture & structure analysis
   - Explorer-2: Technology patterns & dependencies

2. **Planning** 🔄 Current
   - Comprehensive plan creation (this document)
   - Builder task breakdown
   - Pattern documentation

3. **Building** ⏳ 20-24 hours
   - Single builder executes all tasks
   - Content creation checkpoint (Ahiya reviews demo reflections)
   - Screenshot capture checkpoint (after demo seeding)

4. **Integration** ⏳ 30 minutes
   - Minimal integration (single builder, no conflicts)
   - Database migration applied
   - Demo user seeded

5. **Validation** ⏳ 1 hour
   - Demo login flow tested
   - Landing page performance verified (Lighthouse)
   - Demo content quality reviewed (Ahiya approval)

6. **Deployment** ⏳ Final
   - Deploy to production
   - Verify demo user accessible
   - Monitor Core Web Vitals

## Timeline Estimate

- Exploration: ✅ Complete (2 explorers, comprehensive reports)
- Planning: ✅ Complete (this document)
- Building: **20-24 hours** (single builder)
  - Demo content creation: 6-8 hours (1 exemplar + AI-generated + review)
  - Demo seeding script: 2 hours
  - Landing page transformation: 3-4 hours
  - Backend infrastructure: 3-4 hours (migration, mutations, demo login)
  - Image optimization: 2 hours (screenshots, WebP conversion)
  - Performance testing: 2 hours (Lighthouse, bundle size)
  - Demo banner component: 1 hour
- Integration: 30 minutes (database migration, seeding)
- Validation: 1 hour (testing, quality review)
- **Total: ~26 hours** (within 20-24 hour estimate)

## Risk Assessment

### High Risks

**RISK 1: Demo Content Quality (HIGH IMPACT)**
- **Risk:** AI-generated reflections feel generic, fail to demonstrate product value
- **Impact:** Low demo → signup conversion (<5% instead of 15% target)
- **Mitigation:**
  1. Ahiya writes 1 exemplary dream + 4 high-quality reflections (sets quality bar)
  2. AI generates remaining 8-9 reflections using exemplar as style guide
  3. **Quality gate:** Ahiya reviews ALL demo content before seeding (approval required)
  4. Fallback: If AI content poor, Ahiya writes 2-3 more manually (adds 2-3 hours)
- **Contingency:** Budget 2-3 extra hours for content rework if needed

**RISK 2: Tier Limits Mismatch (BLOCKING)**
- **Risk:** Vision states free=10/month, code implements free=1/month
- **Impact:** BLOCKS Pricing page (Iteration 13) until resolved
- **Mitigation:**
  1. **RESOLVED BEFORE ITERATION STARTS:** Ahiya decides final limits
  2. Update `TIER_LIMITS` in `server/trpc/routers/users.ts` and `dreams.ts`
  3. Update PostgreSQL function `check_reflection_limit()`
  4. Update vision.md to match final decision
- **Status:** ⚠️ MUST RESOLVE in pre-planning meeting

### Medium Risks

**RISK 3: Landing Page LCP > 2s (MEDIUM IMPACT)**
- **Risk:** Screenshots (3 × 100KB = 300KB) cause slow page load on 3G
- **Impact:** Lighthouse score < 90, poor SEO, visitor bounce
- **Mitigation:**
  1. WebP conversion (PNG → WebP saves 60-70% file size)
  2. Next.js Image component with `priority` prop on hero image
  3. Lazy-load below-fold screenshots
  4. Test on throttled 3G connection (Chrome DevTools)
  5. Lighthouse audit before merge (target: LCP < 2s, Performance > 90)
- **Contingency:** If LCP still > 2s, reduce screenshot dimensions or defer below-fold images

**RISK 4: Bundle Size Exceeds Budget (MEDIUM IMPACT)**
- **Risk:** New pages/components add >10KB to bundle
- **Impact:** Exceeds 30KB budget for all 3 iterations
- **Mitigation:**
  1. Baseline measurement before Iteration 12 (document current size)
  2. Lazy-load demo login flow (defer until "See Demo" clicked)
  3. Tree-shake imports (import specific components, not entire modules)
  4. Weekly bundle size checks during development
- **Contingency:** Remove non-critical animations or defer features to Iteration 14

### Low Risks

**RISK 5: Redis Caching Adds Complexity Without Benefit (LOW IMPACT)**
- **Risk:** Demo dashboard already fast (<200ms), caching unnecessary
- **Mitigation:**
  1. **Benchmark first:** Measure demo dashboard load time with 12-15 reflections
  2. If < 200ms: Skip Redis (unnecessary complexity)
  3. If > 300ms: Implement Redis caching (10x speedup worth 2 hours effort)
- **Decision:** Defer Redis to post-MVP unless benchmarks show need

## Integration Strategy

**Single Builder Approach:** Iteration 12 has no integration complexity because:
1. All work done by one builder (no merge conflicts)
2. Database changes are additive (no breaking schema changes)
3. Landing page is isolated (no dependencies on Profile/Settings pages)
4. Demo user seeding is one-time script (not part of main codebase)

**Integration Checkpoints:**
1. **After demo content creation:** Ahiya reviews all reflections for quality
2. **After demo seeding:** Verify 5 dreams, 12-15 reflections, 2 evolution reports in database
3. **After screenshots:** Verify images are crisp, well-cropped, < 100KB each
4. **Before merge:** Run Lighthouse audit, verify LCP < 2s and bundle size < +10KB

**Migration Strategy:**
```sql
-- Single migration file: 20251128_iteration_12_demo_infrastructure.sql
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_users_is_demo ON users(is_demo) WHERE is_demo = true;
```

**Seeding Strategy:**
```bash
# Run locally first, test thoroughly
npm run seed:demo

# After testing, seed production
npm run seed:demo -- --production
```

## Deployment Plan

**Phase 1: Database Migration (5 minutes)**
1. Run migration on production Supabase: `supabase db push --remote`
2. Verify columns added: `preferences` (JSONB), `is_demo` (boolean)
3. Verify index created: `idx_users_is_demo`

**Phase 2: Code Deployment (2 minutes)**
1. Deploy Next.js app to Vercel (auto-triggered by git push)
2. Verify environment variables set:
   - `ANTHROPIC_API_KEY` (for evolution report generation)
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Optional: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**Phase 3: Demo User Seeding (10 minutes)**
1. SSH into production or run seeding script with production DB credentials
2. Execute: `npm run seed:demo -- --production`
3. Verify demo user created: `demo@mirrorofdreams.com` with `is_demo = true`
4. Verify 5 dreams, 12-15 reflections, 2 evolution reports seeded

**Phase 4: Validation (10 minutes)**
1. Visit landing page: `https://mirrorofdreams.com`
2. Click "See Demo" → Verify auto-login to demo account
3. Verify dashboard shows 5 dreams, recent reflections, evolution preview
4. Verify demo banner appears: "You're viewing demo account..."
5. Navigate to dreams, reflections, evolution → Verify all data present
6. Run Lighthouse audit → Verify Performance > 90, LCP < 2s

**Phase 5: Monitoring (24 hours)**
1. Monitor Vercel analytics: Track "See Demo" click rate
2. Monitor error logs: Check for demo login failures
3. Monitor Core Web Vitals: Verify LCP stays < 2s
4. If issues: Rollback deployment, fix, redeploy

**Rollback Plan:**
- Database migration is additive (safe to leave columns even if code rolled back)
- Vercel: Rollback to previous deployment (1-click in dashboard)
- Demo user: Delete via `DELETE FROM users WHERE email = 'demo@mirrorofdreams.com'`

## Critical Path Dependencies

**Dependency Chain:**
```
Tier limits resolved
  ↓
Database migration applied
  ↓
Demo content created (1 exemplary dream + 4 reflections by Ahiya)
  ↓
AI generates remaining 8-9 reflections
  ↓
Ahiya reviews + approves all demo content (QUALITY GATE)
  ↓
Demo seeding script executed
  ↓
Screenshots captured (dashboard, reflection, evolution)
  ↓
Screenshots converted to WebP (<100KB each)
  ↓
Landing page rebuilt (hero, CTAs, use cases, screenshots)
  ↓
Demo login flow implemented
  ↓
Demo banner component created
  ↓
Performance testing (Lighthouse, bundle size)
  ↓
Final validation (Ahiya tests demo flow)
  ↓
Deployment to production
```

**BLOCKING DEPENDENCY:** Tier limits must be resolved before any code is written (impacts database function, Pricing page in Iteration 13).

**QUALITY GATE:** Ahiya's approval of demo content is mandatory before seeding. If quality is insufficient, add 2-3 hours for manual writing.

---

**Plan Status:** COMPLETE
**Ready for:** Builder execution
**Critical Decision Needed:** Tier limits resolution (free = 1 or 10 reflections/month)
**Timeline:** 20-24 hours estimated, 26 hours with contingencies
