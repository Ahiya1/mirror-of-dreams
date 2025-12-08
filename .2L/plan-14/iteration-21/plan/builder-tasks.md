# Builder Task Breakdown - Iteration 21

## Overview

**3 primary builders** will work in parallel.
**Estimated total time:** 4-5 hours (including integration/validation)

## Builder Assignment Strategy

- Builder 1 handles critical `useAuth` fix (other builders depend on this)
- Builder 2 creates admin dashboard (depends on Builder 1 completing `useAuth`)
- Builder 3 documents production setup (parallel, no code dependencies)

---

## Builder-1: Email Verification Enforcement

### Scope

Fix the email verification system to actually enforce verification. Currently, `useAuth.ts` hardcodes `emailVerified: true` which bypasses all verification checks. This builder will:

1. Fix `useAuth.ts` to use actual `email_verified` value
2. Update `getProfile` query to include `email_verified`
3. Create the verification-required blocking page
4. Update protected routes to redirect unverified users

### Complexity Estimate

**MEDIUM**

Most work is straightforward modifications. The verification page is new but follows existing patterns.

### Success Criteria

- [ ] `useAuth.ts` returns actual `emailVerified` value from database
- [ ] `getProfile` query includes `email_verified` field
- [ ] `/auth/verify-required` page exists and displays correctly
- [ ] Resend button sends verification email with 60-second cooldown
- [ ] Dashboard redirects unverified users to verification page
- [ ] Verified users can access dashboard normally
- [ ] Creators/admins/demo users bypass verification

### Files to Modify

| File | Change |
|------|--------|
| `/hooks/useAuth.ts` | Line 99: Change `emailVerified: true` to `emailVerified: userData.email_verified ?? false` |
| `/server/trpc/routers/users.ts` | Lines 44-51: Add `email_verified` to select query |
| `/app/dashboard/page.tsx` | Add email verification check after auth check |
| `/app/reflections/page.tsx` | Add email verification check |
| `/app/reflection/MirrorExperience.tsx` | Add email verification check |
| `/app/dreams/page.tsx` | Add email verification check |

### Files to Create

| File | Purpose |
|------|---------|
| `/app/auth/verify-required/page.tsx` | Verification blocking page with resend functionality |

### Dependencies

**Depends on:** Nothing (first to complete)
**Blocks:** Builder 2 (admin dashboard uses `useAuth`)

### Implementation Notes

**Critical:** The `useAuth` fix must be done carefully:

1. Ensure `userData.email_verified` is typed correctly (it's a boolean from Supabase)
2. Use nullish coalescing (`??`) not OR (`||`) to handle explicit `false` values
3. The backend already returns `email_verified` in the user row - we just need to add it to the SELECT

**Verification Check Pattern:**

```typescript
useEffect(() => {
  if (!authLoading) {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    } else if (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo) {
      router.push('/auth/verify-required');
    }
  }
}, [isAuthenticated, authLoading, user, router]);
```

**Important:** Apply verification check to:
- `/app/dashboard/page.tsx` (HIGH priority)
- `/app/reflection/MirrorExperience.tsx` (HIGH priority)
- `/app/reflections/page.tsx` (MEDIUM priority)
- `/app/dreams/page.tsx` (MEDIUM priority)

Low priority pages (`/settings`, `/profile`, etc.) can be done if time permits.

### Testing Requirements

Manual testing:
1. Create new user via signup
2. Verify redirect to `/auth/verify-required`
3. Verify resend button works (check email received)
4. Verify cooldown timer appears after resend
5. Click verification link in email
6. Verify redirect to dashboard after verification
7. Sign in as admin/creator - verify no verification required

---

## Builder-2: Admin Dashboard

### Scope

Create the `/admin` dashboard page with proper authorization, stats display, users table, and webhook events table. Also add the missing `getWebhookEvents` endpoint to the admin router.

### Complexity Estimate

**MEDIUM**

New page creation with existing patterns. One new tRPC endpoint needed.

### Success Criteria

- [ ] `/admin` route exists and is protected
- [ ] Non-admins redirected to dashboard
- [ ] Stats cards display: Total users, Free/Pro/Unlimited counts, Total reflections
- [ ] Recent users table displays last 10 users
- [ ] Webhook events table displays last 10 events
- [ ] `getWebhookEvents` endpoint works correctly
- [ ] Page follows cosmic glass UI design

### Files to Modify

| File | Change |
|------|--------|
| `/server/trpc/routers/admin.ts` | Add `getWebhookEvents` endpoint |

### Files to Create

| File | Purpose |
|------|---------|
| `/app/admin/page.tsx` | Admin dashboard with stats, users, webhooks |

### Dependencies

**Depends on:** Builder 1 (for correct `isAdmin` check in `useAuth`)
**Blocks:** Nothing

### Implementation Notes

**Admin Authorization Pattern:**

```typescript
// Client-side check
useEffect(() => {
  if (!authLoading && !user?.isAdmin && !user?.isCreator) {
    router.push('/dashboard');
  }
}, [authLoading, user, router]);

// tRPC queries only enabled for admins
const { data } = trpc.admin.getStats.useQuery(undefined, {
  enabled: !!user?.isAdmin || !!user?.isCreator,
});
```

**getWebhookEvents Endpoint:**

```typescript
getWebhookEvents: creatorProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(20),
    eventType: z.string().optional(),
  }))
  .query(async ({ input }) => {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('id, event_id, event_type, processed_at, payload, user_id')
      .order('processed_at', { ascending: false })
      .limit(input.limit);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch webhook events',
      });
    }

    return { items: data || [] };
  }),
```

**Stats Display:**

Note: The existing `getStats` returns tier names as `essential` and `premium` (legacy names). Display them but map to current names if needed:
- `essential` -> display as "Pro"
- `premium` -> display as "Unlimited"

Or update the `getStats` query to use current tier names (`pro`, `unlimited`).

**Webhook Events Table Columns:**
- Event Type (e.g., `BILLING.SUBSCRIPTION.ACTIVATED`)
- Processed At (formatted date/time)
- User ID (truncated UUID or email if joined)

### Testing Requirements

Manual testing:
1. Sign in as non-admin - verify redirect away from `/admin`
2. Sign in as admin - verify `/admin` loads
3. Verify stats cards show correct numbers
4. Verify users table populates with data
5. Verify webhook events table shows events (may be empty initially)

---

## Builder-3: Production Setup & Verification

### Scope

Create documentation and scripts for production admin seeding, and document PayPal verification steps. This is primarily documentation work with one SQL script.

### Complexity Estimate

**LOW**

Documentation and SQL script. No complex code.

### Success Criteria

- [ ] Admin seeding SQL script created
- [ ] SQL script is idempotent (can run multiple times safely)
- [ ] PayPal verification steps documented
- [ ] Production deployment checklist created
- [ ] Environment variables documented

### Files to Create

| File | Purpose |
|------|---------|
| `/scripts/seed-admin-production.sql` | Idempotent SQL for admin seeding |
| `/.2L/plan-14/iteration-21/PRODUCTION_SETUP.md` | Production verification documentation |

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing

### Implementation Notes

**Admin Seeding SQL:**

```sql
-- Idempotent admin seeding for production
-- Run via Supabase Dashboard > SQL Editor

DO $$
BEGIN
  -- Update existing user to admin
  UPDATE public.users
  SET
    is_admin = true,
    is_creator = true,
    tier = 'unlimited',
    subscription_status = 'active',
    email_verified = true,
    updated_at = NOW()
  WHERE email = 'ahiya.butman@gmail.com';

  -- Log result
  IF FOUND THEN
    RAISE NOTICE 'Admin user updated successfully: ahiya.butman@gmail.com';
  ELSE
    RAISE NOTICE 'User not found - they need to sign up first';
  END IF;
END $$;
```

**PayPal Verification Steps:**

1. Verify webhook URL in PayPal Developer Dashboard
2. Check webhook is enabled for relevant events
3. Execute test subscription
4. Monitor Vercel function logs for webhook receipt
5. Check `webhook_events` table in Supabase
6. Verify user tier updated

**Production Checklist:**

```markdown
## Pre-deployment
- [ ] All code changes committed
- [ ] Environment variables set in Vercel
- [ ] Admin SQL ready to run

## Deployment
- [ ] Push to main branch
- [ ] Vercel deploys successfully
- [ ] Run admin seeding SQL

## Post-deployment Verification
- [ ] Admin can sign in
- [ ] Admin dashboard loads
- [ ] New user signup sends email
- [ ] Email verification works
- [ ] PayPal button appears on pricing
- [ ] (Optional) Test PayPal subscription
```

### Testing Requirements

Manual verification:
1. Review SQL script for correctness
2. Verify documentation is complete and clear
3. Run SQL script in development/staging first if available

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

| Builder | Task | Est. Time |
|---------|------|-----------|
| Builder-1 | Email Verification Enforcement | 2-3 hours |
| Builder-3 | Production Setup & Verification | 1-2 hours |

### Parallel Group 2 (Depends on Builder-1)

| Builder | Task | Est. Time |
|---------|------|-----------|
| Builder-2 | Admin Dashboard | 3-4 hours |

**Note:** Builder-2 can start immediately but should wait for Builder-1's `useAuth` changes before final testing.

---

## Integration Notes

### Shared Files

| File | Touched By | Conflict Risk |
|------|------------|---------------|
| `/hooks/useAuth.ts` | Builder-1 only | LOW |
| `/server/trpc/routers/admin.ts` | Builder-2 only | LOW |
| `/server/trpc/routers/users.ts` | Builder-1 only | LOW |

**No overlapping file changes** - integration should be straightforward.

### Integration Testing Checklist

After all builders complete:

1. **Auth Flow:**
   - Sign up new user -> verification email sent -> click link -> verified -> dashboard access

2. **Admin Flow:**
   - Sign in as admin -> /admin loads -> stats display -> users display -> webhooks display

3. **Non-Admin Flow:**
   - Sign in as regular verified user -> /admin redirects to dashboard -> dashboard works

4. **Unverified Flow:**
   - Sign in as unverified user -> /dashboard redirects to /auth/verify-required

---

## Rollback Plan

If issues arise:

1. **useAuth fix causes issues:** Revert to `emailVerified: true` as quick fix
2. **Admin page errors:** Disable /admin route or add error boundary
3. **Email sending fails:** Check Vercel logs, verify Gmail credentials

---

## Post-Iteration Tasks

After this iteration completes:

1. Run admin seeding SQL in production
2. Execute test PayPal subscription
3. Verify webhook received
4. Document any issues encountered
5. Update master-plan.yaml status
