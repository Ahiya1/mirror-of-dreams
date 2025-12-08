# Explorer 2 Report: Admin Dashboard - Current State & Requirements

## Executive Summary

The project has a comprehensive admin backend system via tRPC with robust authorization. A legacy HTML/JS admin dashboard exists at `/public/stewardship/admin.html` with sophisticated styling and receipt/gift management. The plan-14 vision calls for a new `/admin` route within the Next.js app with proper session-based authentication (not just CREATOR_SECRET_KEY). Admin user seeding can be done via existing script or Supabase SQL, and webhook events are already stored in the `webhook_events` table.

---

## Discoveries

### 1. Existing Admin Backend (tRPC Router)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/admin.ts`

#### Endpoints Available:

| Endpoint | Type | Auth | Description |
|----------|------|------|-------------|
| `authenticate` | mutation | public | Authenticates using `CREATOR_SECRET_KEY` env var |
| `checkAuth` | query | public | Validates key against `CREATOR_SECRET_KEY` |
| `getAllUsers` | query | `creatorProcedure` | Paginated user list with tier filter |
| `getAllReflections` | query | `creatorProcedure` | Paginated reflections with optional userId filter |
| `getStats` | query | `creatorProcedure` | System-wide statistics |
| `getUserByEmail` | query | `creatorProcedure` | Lookup user by email |
| `updateUserTier` | mutation | `creatorProcedure` | Change user subscription tier |
| `getApiUsageStats` | query | `creatorProcedure` | Monthly API usage and costs |

#### Data Returned by `getAllUsers`:

```typescript
{
  items: Array<{
    id: string;
    email: string;
    name: string;
    tier: 'free' | 'pro' | 'unlimited';
    subscription_status: string;
    total_reflections: number;
    reflection_count_this_month: number;
    created_at: string;
    last_sign_in_at: string;
    is_creator: boolean;
    is_admin: boolean;
  }>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

#### Data Returned by `getStats`:

```typescript
{
  users: {
    total: number;
    free: number;
    essential: number;  // Note: tier names may need updating to pro/unlimited
    premium: number;    // Note: tier names may need updating
    active: number;
  };
  reflections: { total: number };
  evolutionReports: { total: number };
  artifacts: { total: number };
}
```

### 2. Admin Authorization System

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`

The `creatorProcedure` checks both `is_creator` and `is_admin` flags:

```typescript
export const isCreatorOrAdmin = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (!ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Creator or admin access required.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**Important:** The current tRPC admin router has TWO authentication methods:
1. `authenticate` / `checkAuth` - Uses `CREATOR_SECRET_KEY` (for legacy admin)
2. `creatorProcedure` - Uses JWT + user flags (`is_creator` || `is_admin`)

For the new admin dashboard, we should use the JWT-based approach since users will already be logged in.

### 3. Legacy Admin UI

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/public/stewardship/admin.html`

This is a standalone HTML page with:

#### Features:
- Secret key authentication (stored in sessionStorage)
- Overview tab with 8 stat cards (revenue, receipts, gifts)
- Receipts management tab with search, filters, CRUD
- Gifts management tab with status tracking
- Modal dialogs for details and creation
- Real-time polling (every 10 seconds)
- CSV export functionality

#### Styling (`admin.css`):
- Glass morphism design (backdrop-filter: blur)
- Dark theme with white/purple gradients
- Responsive grid layout
- Animated particles background
- Professional badge system for statuses

**Note:** This legacy admin serves different purposes (receipts/gifts) than the new admin dashboard (users/webhooks/system metrics).

### 4. Database Schema for Users

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/schema.sql`

Key admin-related columns in `users` table:

```sql
-- Special Users
is_creator BOOLEAN DEFAULT FALSE,
is_admin BOOLEAN DEFAULT FALSE,

-- Subscription Management
tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'unlimited')),
subscription_status TEXT NOT NULL DEFAULT 'active',
```

### 5. Webhook Events Table

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251130000000_paypal_integration.sql`

```sql
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB,
  user_id UUID REFERENCES public.users(id)
);
```

Current webhook events stored:
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `PAYMENT.SALE.COMPLETED`

### 6. Admin User Seeding Script

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/scripts/create-admin-user.js`

Existing script that:
1. Checks if user exists
2. Updates existing user to admin OR creates new admin user
3. Sets: `is_admin: true`, `is_creator: true`, `tier: 'premium'`, `email_verified: true`

**Credentials in script:** `ahiya.butman@gmail.com` / `dream_lake`

---

## Dashboard Requirements Analysis (from Vision)

### M0 (Minimal) Requirements:

| Metric | Source | Backend Ready? |
|--------|--------|----------------|
| Total users count | `admin.getStats()` | YES |
| Admin's own record | `users.getProfile()` + `is_admin` check | YES |
| Last 10 users table | `admin.getAllUsers()` with limit | YES |
| Last 5 payment events | `webhook_events` table | PARTIAL (no endpoint) |

### Recent Users Table Columns (from vision):
- Email
- Signup date (`created_at`)
- Plan/tier
- Last active (`last_sign_in_at`)
- Status (`subscription_status`)

**Current `getAllUsers` returns:** All required columns plus `is_creator`, `is_admin`, `total_reflections`, `reflection_count_this_month`.

### Webhook Events Display

**Missing:** No dedicated endpoint to fetch webhook events. Need to add:

```typescript
// Suggested new endpoint
getWebhookEvents: creatorProcedure
  .input(z.object({
    limit: z.number().default(20),
    eventType: z.string().optional(),
  }))
  .query(async ({ input }) => {
    const { data } = await supabase
      .from('webhook_events')
      .select('*')
      .order('processed_at', { ascending: false })
      .limit(input.limit);
    return data;
  });
```

---

## Admin User Seeding Options

### Option 1: Use Existing Script (Local)
```bash
cd /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams
node scripts/create-admin-user.js
```
**Requires:** `.env.local` with `SUPABASE_SERVICE_ROLE_KEY`

### Option 2: SQL Migration (Production via Supabase CLI)

Create idempotent migration:

```sql
-- Create/update admin user
DO $$
DECLARE
  admin_email TEXT := 'ahiya.butman@gmail.com';
  admin_hash TEXT := '$2b$12$...'; -- bcrypt hash of 'dream_lake'
BEGIN
  INSERT INTO public.users (
    email, password_hash, name, tier,
    subscription_status, is_admin, is_creator, email_verified
  ) VALUES (
    admin_email, admin_hash, 'Ahiya Butman', 'unlimited',
    'active', true, true, true
  )
  ON CONFLICT (email) DO UPDATE SET
    is_admin = true,
    is_creator = true,
    tier = 'unlimited',
    email_verified = true,
    updated_at = NOW();
END $$;
```

### Option 3: Supabase Dashboard (Production)
1. Go to Supabase Dashboard > SQL Editor
2. Run the SQL above
3. No CLI needed

### Supabase CLI Production Commands:
```bash
# Link to production project
supabase link --project-ref <project-id>

# Run migration
supabase db push

# Or run SQL directly
supabase db execute --sql "UPDATE users SET is_admin = true WHERE email = 'ahiya.butman@gmail.com'"
```

---

## Recommendations for Planner

### 1. Authentication Strategy for New Admin Dashboard

**Recommended:** Use existing JWT-based auth with `creatorProcedure`.

- User logs in normally via `/auth/signin`
- Admin checks `user.isAdmin` on client-side to show/hide admin link
- All admin API calls use existing `creatorProcedure` middleware
- No need for separate `CREATOR_SECRET_KEY` authentication

### 2. Required Backend Changes

**Add one new endpoint:**
```typescript
// In admin.ts
getWebhookEvents: creatorProcedure.input(...).query(...)
```

**Update `getStats`:**
- Fix tier name references (`essential` -> `pro`, `premium` -> `unlimited`)
- Add revenue calculations if needed

### 3. Admin Route Protection

```typescript
// app/admin/page.tsx
export default function AdminPage() {
  const { user } = useAuth();
  
  if (!user?.isAdmin) {
    redirect('/'); // or notFound()
  }
  
  return <AdminDashboard />;
}
```

### 4. Reuse Legacy Styling

The `/public/stewardship/admin.css` has excellent glass-morphism styling. Consider:
- Extracting shared CSS variables
- Converting to Tailwind classes
- Using same color palette and effects

### 5. Production Admin Seeding

**Recommended approach:**
1. Generate bcrypt hash for password locally
2. Run SQL via Supabase Dashboard
3. Verify admin can log in

---

## Complexity Assessment

### Low Complexity
- Admin route protection (existing middleware)
- Recent users table (existing endpoint)
- Admin seeding (existing script/SQL)

### Medium Complexity
- Dashboard UI (new React component)
- Stats display (existing endpoint, minor updates)
- Webhook events display (new endpoint needed)

### High Complexity
None identified - all backend infrastructure exists.

---

## Risks & Challenges

### 1. Tier Name Mismatch
**Risk:** `getStats` uses old tier names (`essential`/`premium`)
**Mitigation:** Update to `pro`/`unlimited` in admin router

### 2. No Production User Exists
**Risk:** Admin user not seeded in production
**Mitigation:** Create SQL migration or use Supabase Dashboard

### 3. Legacy Admin Still Uses CREATOR_SECRET_KEY
**Risk:** Two different auth systems could cause confusion
**Mitigation:** Document which system is for what, consider deprecating legacy admin

---

## Resource Map

### Critical Files for Admin Dashboard

| File | Purpose |
|------|---------|
| `/server/trpc/routers/admin.ts` | Admin API endpoints |
| `/server/trpc/middleware.ts` | `creatorProcedure` authorization |
| `/types/user.ts` | User type with `isAdmin`, `isCreator` |
| `/types/schemas.ts` | `adminCreatorAuthSchema` |
| `/server/trpc/context.ts` | JWT verification and user loading |
| `/lib/schema.sql` | Database schema reference |
| `/public/stewardship/admin.css` | Reference styling |
| `/app/api/webhooks/paypal/route.ts` | Webhook handler (logs to `webhook_events`) |
| `/scripts/create-admin-user.js` | Admin seeding script |

### Environment Variables Needed

| Variable | Purpose |
|----------|---------|
| `CREATOR_SECRET_KEY` | Legacy admin auth (optional for new admin) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin seeding script |
| `JWT_SECRET` | User authentication |

---

## Questions for Planner

1. Should the new `/admin` route completely replace the legacy `/stewardship/admin.html`, or should both coexist?

2. Should we add an Events logging table (beyond webhook_events) for operational events like `user_signed_up`, `email_confirmation_sent`?

3. Should admin be able to impersonate users for debugging (future scope)?

4. Is `dream_lake` the actual production password, or should a secure password be generated?

---

**Report Generated:** 2025-12-08
**Explorer:** 2
**Focus Area:** Admin Dashboard - Current State & Requirements
