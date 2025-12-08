# 2L Iteration 21 Plan (Plan 14) - Production Readiness

## Project Vision

Enable first-user battle testing of Mirror of Dreams with complete email verification enforcement, admin monitoring capabilities, and verified PayPal payments. This iteration transforms the application from "feature complete" to "production ready."

## Success Criteria

Specific, measurable criteria for this iteration:

- [ ] New signup triggers confirmation email via Gmail SMTP
- [ ] Unverified users see blocking screen with resend option
- [ ] ahiya.butman@gmail.com has admin access in production
- [ ] /admin route loads with real data (users, stats, webhook events)
- [ ] At least 1 real PayPal transaction processed successfully
- [ ] Webhook events visible in admin dashboard

## Iteration Scope

**In Scope:**

1. **Email Verification Enforcement**
   - Fix `useAuth.ts` to use actual `email_verified` value (not hardcoded `true`)
   - Add `email_verified` to `getProfile` query in `users.ts`
   - Create `/app/auth/verify-required/page.tsx` with resend functionality
   - Update protected routes to redirect unverified users

2. **Admin Dashboard**
   - Create `/app/admin/page.tsx` with cosmic glass styling
   - Display stats using existing `getStats` endpoint
   - Display users table using `getAllUsers` endpoint
   - Add `getWebhookEvents` endpoint to admin.ts
   - Display webhook events table

3. **Production Setup & Verification**
   - Admin seeding script for production (Supabase CLI)
   - PayPal production verification documentation
   - Manual verification checklist

**Out of Scope (Post-MVP):**

- Full admin user management (edit/delete users)
- Admin impersonation for debugging
- Advanced webhook analytics
- Email deliverability improvements (DKIM/SPF)

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - 3 parallel builders (2-4 hours each)
4. **Integration** - ~30 minutes
5. **Validation** - ~30 minutes
6. **Deployment** - Final push to production

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 3-4 hours (parallel builders)
- Integration: 30 minutes
- Validation: 30 minutes
- Total: ~4-5 hours

## Risk Assessment

### Low Risks

- **Email backend is complete:** All nodemailer setup, templates, and API routes exist
- **Admin tRPC endpoints exist:** `getStats`, `getAllUsers`, `getAllReflections` all ready
- **Auth middleware proven:** `creatorProcedure` handles admin authorization

### Medium Risks

- **Gmail delivery to spam:** New senders may have emails go to spam
  - *Mitigation:* Clear "check spam" instructions on verify-required page
- **Production user not seeded:** Admin must be created in production Supabase
  - *Mitigation:* Documented SQL commands for Supabase Dashboard
- **PayPal webhook configuration:** May need manual verification in PayPal dashboard
  - *Mitigation:* Documented verification steps

### High Risks

- None identified - all critical infrastructure already exists

## Integration Strategy

**File Isolation:** Builders work on mostly isolated files:
- Builder 1: `useAuth.ts`, `users.ts`, new page, protected routes
- Builder 2: New `admin/page.tsx`, `admin.ts` router
- Builder 3: Documentation and SQL scripts (no code conflicts)

**Shared Dependencies:**
- `useAuth` hook is used by both Builder 1 (modifying) and Builder 2 (consuming)
- Builder 2 should wait for Builder 1's `useAuth` changes to ensure `isAdmin` is accurate

**Integration Order:**
1. Builder 1 completes `useAuth.ts` fix first (critical dependency)
2. Builder 2 and Builder 3 can work in parallel
3. Final integration: verify all routes work together

## Deployment Plan

1. **Pre-deployment:** Run admin seeding SQL in production Supabase
2. **Deploy:** Push all changes to Vercel
3. **Post-deployment verification:**
   - Test signup flow (email received)
   - Verify admin login works
   - Verify admin dashboard loads
   - Execute test PayPal subscription
4. **Monitor:** Watch Vercel function logs for errors

## Key Decisions Made

1. **JWT-based admin auth:** Use existing `creatorProcedure` (checks `isAdmin` flag) instead of legacy `CREATOR_SECRET_KEY`
2. **Full blocking for unverified:** Redirect to `/auth/verify-required` rather than banner warning
3. **Creators/admins bypass verification:** Special users skip email verification check
4. **Demo users bypass verification:** Demo account doesn't need email verification
5. **60-second resend cooldown:** Prevent spam of verification emails
6. **Tier name mapping:** Keep existing tier names (`pro`/`unlimited`) in new code, note legacy names in stats
