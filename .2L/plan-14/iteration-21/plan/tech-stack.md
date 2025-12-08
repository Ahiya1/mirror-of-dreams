# Technology Stack - Iteration 21

## Core Framework

**Decision:** Next.js 14 with App Router (existing)

All work in this iteration uses the existing Next.js setup. No new framework decisions required.

## Email System

**Decision:** Gmail SMTP via Nodemailer (existing)

**Configuration:**
```typescript
// server/lib/email.ts
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});
```

**Environment Variables:**
```
GMAIL_USER=ahiya.butman@gmail.com
GMAIL_APP_PASSWORD=uurwgcbscdvtrbbi  # App password (NOT regular password)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Key Functions (already implemented):**
- `sendVerificationEmail(email, token, userName?)` - Sends HTML verification email
- `generateToken()` - Creates 32-byte hex token
- `getVerificationTokenExpiration()` - Returns Date 24 hours from now

**API Endpoints (already implemented):**
- `POST /api/auth/send-verification` - Sends or resends verification email
- `POST /api/auth/verify-email` - Verifies token and marks user verified
- `GET /api/auth/verify-email?token=xxx` - Redirects to verification page

## Database

**Decision:** Supabase PostgreSQL (existing)

**Relevant Tables:**

```sql
-- Users table (relevant columns)
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_creator BOOLEAN DEFAULT FALSE,
  tier TEXT CHECK (tier IN ('free', 'pro', 'unlimited')),
  ...
)

-- Verification tokens
email_verification_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)

-- Webhook events (PayPal)
webhook_events (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE,
  event_type TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  payload JSONB,
  user_id UUID REFERENCES users(id)
)
```

## API Layer

**Decision:** tRPC with existing router structure

**Admin Router:** `/server/trpc/routers/admin.ts`

**Existing Endpoints:**
| Endpoint | Auth | Description |
|----------|------|-------------|
| `getStats` | `creatorProcedure` | System-wide statistics |
| `getAllUsers` | `creatorProcedure` | Paginated user list |
| `getAllReflections` | `creatorProcedure` | Paginated reflections |
| `getUserByEmail` | `creatorProcedure` | Lookup user by email |
| `updateUserTier` | `creatorProcedure` | Change user tier |
| `getApiUsageStats` | `creatorProcedure` | Monthly API usage |

**New Endpoint to Add:**
```typescript
// getWebhookEvents - Fetch recent PayPal webhook events
getWebhookEvents: creatorProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(20),
    eventType: z.string().optional(),
  }))
  .query(async ({ input }) => {
    // Query webhook_events table
  });
```

**Users Router:** `/server/trpc/routers/users.ts`

**Required Change:** Add `email_verified` to `getProfile` select query (line 46).

## Authorization

**Decision:** JWT-based auth with `creatorProcedure` middleware

**Middleware Chain:**
```typescript
// server/trpc/middleware.ts
export const isCreatorOrAdmin = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (!ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const creatorProcedure = publicProcedure.use(isCreatorOrAdmin);
```

**Admin Access:** User must have `is_admin=true` OR `is_creator=true` in database.

## Frontend UI

**Decision:** Existing cosmic glass design system

**Component Library:**
- `GlassCard` - Glass-morphism container
- `GlowButton` - Enhanced button with variants (primary, cosmic, success, danger)
- `CosmicLoader` - Loading spinner
- `GradientText` - Gradient text styling
- `GlowBadge` - Status badges

**Import Pattern:**
```typescript
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText,
  GlowBadge,
} from '@/components/ui/glass';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { AppNavigation } from '@/components/shared/AppNavigation';
```

**Styling Patterns:**
```typescript
// Page background
className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark"

// Glass card
className="backdrop-blur-crystal bg-gradient-to-br from-white/8 via-transparent to-purple-500/3 border border-white/10 rounded-xl p-6"

// Gradient text
className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"

// Subtle text
className="text-white/70"  // Secondary text
className="text-white/50"  // Tertiary text
className="text-emerald-400"  // Success/highlight
```

## Supabase CLI

**Decision:** Use for production admin seeding

**Commands:**
```bash
# Link to production project
supabase link --project-ref <project-id>

# Run migration
supabase db push

# Run SQL directly
supabase db execute --sql "UPDATE users SET is_admin = true WHERE email = 'ahiya.butman@gmail.com'"
```

**Alternative:** Supabase Dashboard > SQL Editor (no CLI needed)

## Environment Variables Summary

| Variable | Purpose | Required For |
|----------|---------|--------------|
| `GMAIL_USER` | Gmail sender address | Email verification |
| `GMAIL_APP_PASSWORD` | Gmail app password | Email verification |
| `NEXT_PUBLIC_APP_URL` | Application URL | Email links |
| `JWT_SECRET` | JWT signing | All authentication |
| `SUPABASE_URL` | Supabase project URL | Database |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Client queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | Server queries |
| `PAYPAL_CLIENT_ID` | PayPal client ID | Payments |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | Payments |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID | Webhook verification |

## Testing Strategy

**Manual Testing Checklist:**

1. **Email Verification Flow:**
   - Sign up with new email
   - Check inbox (and spam)
   - Click verification link
   - Verify redirect to success page
   - Sign in and access dashboard

2. **Admin Dashboard:**
   - Sign in as admin user
   - Navigate to /admin
   - Verify stats display
   - Verify users table populates
   - Verify webhook events display

3. **PayPal Integration:**
   - Execute test subscription
   - Verify webhook received
   - Verify tier update in database
   - Verify webhook event in admin

## Performance Considerations

- **Admin dashboard:** Paginate users (default 10-20 per page)
- **Webhook events:** Limit to last 20-50 events
- **No caching needed:** Admin dashboard is infrequently accessed

## Security Considerations

- **Admin route:** Check `isAdmin` on both client (redirect) and server (`creatorProcedure`)
- **Email enumeration:** Verification resend always returns success (doesn't reveal if email exists)
- **Verification bypass:** Only `isCreator`, `isAdmin`, and `isDemo` users skip verification
- **Token expiry:** Verification tokens expire in 24 hours
