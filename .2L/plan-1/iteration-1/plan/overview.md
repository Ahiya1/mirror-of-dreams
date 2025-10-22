# 2L Iteration Plan - Mirror of Dreams (Iteration 1)

## Project Vision

Transform the existing Mirror of Truth JavaScript application into a production-ready TypeScript/tRPC/Next.js foundation. This iteration establishes architectural hardening - migrating from Express to tRPC for type-safe APIs, from JavaScript to TypeScript strict mode, and from Vite to Next.js 14 App Router. All existing reflection features will work perfectly on the new stack, with no visual changes or feature additions.

**Core Principle**: Same business logic, better architecture. No user-facing changes except bug fixes.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [x] **TypeScript Strict Mode**: All code compiles with no TypeScript errors using strict configuration
- [x] **tRPC Type Safety**: Frontend and backend share types automatically via tRPC, no manual type synchronization
- [x] **Existing Reflection Flow**: Users can sign in, create reflections, and receive AI responses without errors
- [x] **Gift Feature Deleted**: All gifting code removed (api/gifting.js, database tables, UI references, email templates)
- [x] **Reflections Route Added**: Users can view all past reflections at /reflections and individual reflection at /reflections/[id]
- [x] **Build Success**: Next.js builds successfully with zero warnings
- [x] **Authentication Works**: JWT authentication integrated into tRPC context, all protected routes secure
- [x] **Stripe Webhooks Preserved**: Payment webhooks remain functional (kept as separate Express endpoint, not migrated to tRPC)
- [x] **All APIs Migrated**: Every Express endpoint (except webhooks) converted to tRPC procedure
- [x] **Database Intact**: Existing Supabase data preserved, gifting tables removed, no data loss

## MVP Scope

**In Scope (Iteration 1):**

- Delete gift feature completely (api/gifting.js, database tables, UI, emails)
- Migrate JavaScript to TypeScript (strict mode)
- Migrate Express endpoints to tRPC procedures
- Migrate Vite to Next.js 14 App Router
- Convert all React components from .jsx to .tsx
- Add missing /reflections route (list view + detail view)
- Preserve existing reflection flow (5-question process)
- Keep Stripe webhooks as separate Express endpoint
- Maintain modular prompt system (prompts/ directory)
- Preserve all authentication logic (JWT, bcrypt)
- Keep Supabase integration identical
- Preserve all UI/UX (cosmic theme, animations, styling)

**Out of Scope (Post-Iteration 1):**

- Dreams feature (Iteration 2)
- Visual rebrand to "Mirror of Dreams" (Iteration 2)
- Evolution reports with temporal distribution (Iteration 3)
- Visualizations (Iteration 3)
- PayPal integration (Iteration 4)
- Admin dashboard enhancements (Iteration 4)
- Any new features or business logic changes
- Performance optimizations
- Testing infrastructure (basic testing only)

## Development Phases

1. **Exploration** - COMPLETE (Explorer-1: Architecture analysis, Explorer-2: API migration analysis)
2. **Planning** - CURRENT (Creating comprehensive 4-file plan)
3. **Building** - 6-7 hours (4 parallel builders)
4. **Integration** - 30-45 minutes (Merge builder outputs, resolve conflicts)
5. **Validation** - 30 minutes (Test reflection flow, authentication, API calls)
6. **Deployment** - Final (Vercel deployment with Next.js)

## Timeline Estimate

- **Exploration**: Complete
- **Planning**: Complete (current task)
- **Building**: 6-7 hours (parallel builders work simultaneously)
  - Builder 1: 1.5-2 hours (TypeScript foundation + shared types)
  - Builder 2: 2-2.5 hours (tRPC setup + authentication migration)
  - Builder 3: 2-2.5 hours (Next.js migration + routing + /reflections route)
  - Builder 4: 1.5-2 hours (API migration - reflections/users/evolution/artifact)
- **Integration**: 30-45 minutes (merge outputs, test together)
- **Validation**: 30 minutes (end-to-end testing)
- **Total**: 7-9 hours (including integration and validation)

## Risk Assessment

### High Risks

**Risk 1: Stripe Webhook Breaking**
- **Impact**: CRITICAL - Payments would fail, revenue lost
- **Likelihood**: MEDIUM
- **Mitigation**:
  - Keep webhooks as separate Express endpoint (do NOT migrate to tRPC)
  - Test webhook signature verification thoroughly
  - Maintain identical raw body parsing logic
  - Deploy to staging first, test with Stripe test mode
  - Keep rollback plan ready

**Risk 2: Authentication Token Validation Failure**
- **Impact**: HIGH - All protected routes would break
- **Likelihood**: MEDIUM
- **Mitigation**:
  - Reuse existing JWT verification logic verbatim
  - Create tRPC context middleware that wraps existing authenticateRequest()
  - Test token generation and validation extensively
  - Keep JWT_SECRET identical
  - Ensure error messages match existing behavior

**Risk 3: Database Migration Errors (Gift Deletion)**
- **Impact**: HIGH - Could break existing data
- **Likelihood**: LOW-MEDIUM
- **Mitigation**:
  - Backup database before any schema changes
  - Export unredeemed gifts to CSV (archive for records)
  - Drop subscription_gifts table only after verifying no foreign key dependencies
  - Test in development database first
  - Create rollback SQL script

### Medium Risks

**Risk 4: Component TypeScript Conversion Errors**
- **Impact**: MEDIUM - Could introduce runtime bugs
- **Likelihood**: MEDIUM
- **Mitigation**:
  - Start with strict: false, gradually enable
  - Convert leaf components first (no dependencies)
  - Use 'any' initially, refine types incrementally
  - Test each converted component individually
  - Keep integration tests

**Risk 5: Next.js Routing Migration Issues**
- **Impact**: MEDIUM - Broken navigation
- **Likelihood**: MEDIUM
- **Mitigation**:
  - Map React Router routes to Next.js file structure before coding
  - Use Next.js Link component for all navigation
  - Test all route transitions
  - Create redirect rules from old paths if needed

**Risk 6: CSS Styling Breakage**
- **Impact**: LOW-MEDIUM - Visual inconsistencies
- **Likelihood**: MEDIUM
- **Mitigation**:
  - Keep existing CSS files initially
  - Use Tailwind CSS for new components only
  - Test on multiple screen sizes
  - Preserve existing classNames exactly

### Low Risks

**Risk 7: Type Definition Synchronization**
- **Impact**: LOW - TypeScript catches most issues
- **Likelihood**: LOW
- **Mitigation**: Use tRPC's automatic type inference, no manual synchronization needed

**Risk 8: Build Configuration Issues**
- **Impact**: LOW - Build failures
- **Likelihood**: LOW
- **Mitigation**: Use standard Next.js + tRPC configuration patterns, well-documented

## Integration Strategy

**How Builder Outputs Will Be Merged:**

1. **Builder 1 (TypeScript Foundation)** creates:
   - `/types/` directory with all shared types
   - `tsconfig.json` configuration
   - Type definitions used by all other builders

2. **Builder 2 (tRPC Setup)** depends on Builder 1:
   - Uses types from `/types/`
   - Creates `/server/trpc/` directory structure
   - Sets up context, middleware, and routers
   - Other builders import tRPC procedures

3. **Builder 3 (Next.js Migration)** works in parallel with Builder 2:
   - Creates `/app/` directory structure (Next.js App Router)
   - Migrates components to `/components/`
   - Uses types from Builder 1
   - Calls tRPC procedures from Builder 2 (after integration)

4. **Builder 4 (API Migration)** depends on Builder 2:
   - Migrates Express endpoints to tRPC procedures
   - Uses routers created by Builder 2
   - Uses types from Builder 1

**Integration Steps:**
1. Merge Builder 1 output first (foundation)
2. Merge Builder 2 output second (tRPC setup)
3. Merge Builder 3 and Builder 4 simultaneously
4. Update Builder 3's components to use Builder 4's migrated APIs
5. Test authentication flow end-to-end
6. Test reflection creation flow
7. Test payment and webhook (staging only)

**Shared Files Requiring Coordination:**
- `/types/index.ts` - All builders add types here, Builder 1 creates structure
- `/server/trpc/routers/_app.ts` - Builder 4 adds routers, Builder 2 creates structure
- `/package.json` - All builders may add dependencies (merge carefully)
- `/.env.example` - Update for Next.js environment variables

**Conflict Prevention:**
- Each builder works in distinct directories when possible
- Builder 1 completes type definitions before others reference them
- Builder 2 completes tRPC setup before Builder 4 adds procedures
- Clear file ownership: Builder 3 owns /app/, Builder 4 owns /server/trpc/routers/

## Deployment Plan

**How the MVP Will Be Deployed:**

1. **Pre-Deployment Checklist:**
   - All success criteria met
   - Build completes with no errors
   - Environment variables configured in Vercel
   - Database migrations applied to production Supabase
   - Stripe webhooks tested in test mode

2. **Vercel Deployment (Next.js):**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy to staging
   vercel --prod=false

   # Test staging thoroughly
   # - Sign in
   # - Create reflection
   # - Test payment (Stripe test mode)
   # - Verify webhooks work

   # Deploy to production
   vercel --prod
   ```

3. **Environment Variables (Vercel Dashboard):**
   ```
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   JWT_SECRET
   ANTHROPIC_API_KEY
   STRIPE_SECRET_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_WEBHOOK_SECRET
   GMAIL_USER
   GMAIL_APP_PASSWORD
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

4. **Post-Deployment Validation:**
   - Test existing user login (do NOT create new users until tested)
   - Verify reflection creation works
   - Check AI response generation
   - Test subscription status display
   - Monitor error logs for 24 hours
   - Verify Stripe webhooks trigger correctly

5. **Rollback Plan:**
   - Keep old Vite/Express deployment running on separate URL
   - If critical bugs found, revert DNS to old deployment
   - Use Vercel's instant rollback feature
   - Maximum downtime target: 5 minutes

6. **Database Migration (Gift Deletion):**
   ```sql
   -- Run BEFORE deployment

   -- Step 1: Backup
   -- Export subscription_gifts table to CSV

   -- Step 2: Drop table
   DROP TABLE IF EXISTS public.subscription_gifts CASCADE;

   -- Step 3: Verify no broken foreign keys
   -- Check other tables for references
   ```

## Notes

- **NO visual changes**: UI must look identical to current Mirror of Truth
- **NO new features**: Only migration + bug fix (/reflections route)
- **Gift deletion is MANDATORY**: Must be completed in this iteration
- **Stripe webhooks stay Express**: Do not migrate to tRPC
- **Modular prompts preserved**: Keep prompts/ directory structure
- **Supabase unchanged**: Database schema identical except gift table deletion
- **Testing is basic**: Comprehensive testing comes in Iteration 4
- **Admin user NOT created yet**: Admin setup happens in Iteration 2

## Dependencies

- Next.js 14.x (App Router)
- TypeScript 5.x (strict mode)
- tRPC 10.x (latest stable)
- React 18.x (already installed)
- Supabase client 2.50.4 (already installed)
- Anthropic SDK 0.52.0 (already installed)
- Stripe SDK 18.3.0 (already installed)
- Tailwind CSS 3.x (new)
- Zod 3.x (for tRPC validation)

## Success Metrics

**How we know we're done:**
1. User can sign in with existing credentials
2. User can create a reflection and receive AI response
3. User can view reflection history at /reflections
4. User can click individual reflection to see detail
5. TypeScript strict mode: 0 errors
6. Next.js build: 0 warnings
7. All tRPC procedures have full type safety
8. No "gift" references in codebase (search confirms)
9. Stripe webhooks process test payments successfully
10. Deployment to Vercel completes without errors
