# Technology Stack - Iteration 13

## Core Framework

**Decision:** Next.js 14 App Router (existing)

**Rationale:**
- Already in production from Plan-6 (established patterns for page creation)
- App Router simplifies page creation (`app/[route]/page.tsx` convention)
- Server Components reduce bundle size (Profile/Settings pages can be client-only where needed)
- File-based routing eliminates navigation configuration
- TypeScript integration mature

**Alternatives Considered:**
- Remix: Not chosen (migration cost too high, App Router sufficient)
- React Router: Not chosen (already using Next.js)

**Version:** `next@14.2.18` (current production version)

## Backend API Layer

**Decision:** tRPC 11 + Zod validation

**Rationale:**
- End-to-end type safety (schemas define runtime validation + TypeScript types)
- Existing routers (auth, users) extend cleanly with new mutations
- React Query integration provides optimistic updates for Settings page
- Error handling patterns established (TRPCError with descriptive messages)
- Zero API route boilerplate (mutations defined once, types inferred)

**New Mutations Required:**
1. `users.changeEmail` - Email change with password verification + JWT invalidation
2. `users.updatePreferences` - Partial JSONB updates for Settings page

**Existing Mutations Reused:**
1. `auth.changePassword` - Password change (already production-ready)
2. `auth.deleteAccount` - Account deletion (already production-ready)
3. `users.updateProfile` - Name change (already production-ready)
4. `users.getProfile` - Profile data fetching (already production-ready)

**Validation Schema Pattern:**
```typescript
// types/schemas.ts

export const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  currentPassword: z.string(), // Password-protected operation
});

export const updatePreferencesSchema = z.object({
  notification_email: z.boolean().optional(),
  reflection_reminders: z.enum(['off', 'daily', 'weekly']).optional(),
  evolution_email: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  default_tone: z.enum(['fusion', 'gentle', 'intense']).optional(),
  show_character_counter: z.boolean().optional(),
  reduce_motion_override: z.boolean().nullable().optional(),
  analytics_opt_in: z.boolean().optional(),
});
```

**Versions:**
- `@trpc/server@^11.6.0` (current)
- `@trpc/client@^11.6.0` (current)
- `@trpc/react-query@^11.6.0` (current)
- `zod@^3.25.76` (current)

## Database

**Decision:** Supabase PostgreSQL (existing)

**Rationale:**
- JSONB column for preferences (supports partial updates, no schema migrations for new fields)
- Foreign key cascade delete (account deletion automatically deletes reflections)
- Row-level security configured (user data isolation)
- Existing schema complete (iteration 12 added `users.preferences` and `users.is_demo`)

**Schema Usage:**
```sql
-- Users table (existing, no migrations needed)
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL, -- 'free' | 'essential' | 'premium'
  preferences JSONB DEFAULT '{}'::JSONB, -- Added in iteration 12
  is_demo BOOLEAN DEFAULT FALSE, -- Added in iteration 12
  ...
)
```

**Preferences JSONB Structure:**
```json
{
  "notification_email": true,
  "reflection_reminders": "off",
  "evolution_email": true,
  "marketing_emails": false,
  "default_tone": "fusion",
  "show_character_counter": true,
  "reduce_motion_override": null,
  "analytics_opt_in": true
}
```

**Database Operations:**
- **Profile mutations:** Single UPDATE queries (`name`, `email`, `password_hash`)
- **Preferences updates:** JSONB merge (`preferences = preferences || $1::JSONB`)
- **Account deletion:** CASCADE delete via foreign keys

**Version:** `@supabase/supabase-js@^2.50.4` (current)

## Authentication

**Decision:** JWT with jsonwebtoken library + bcrypt password hashing

**Rationale:**
- Stateless authentication (JWT contains user metadata, no database query per request)
- Email change requires JWT re-issuance (old token contains old email)
- Password hashing with bcrypt rounds: 12 (industry standard, ~300ms hash time)
- Existing middleware (`isAuthed`, `protectedProcedure`) extends cleanly

**JWT Payload:**
```typescript
{
  userId: string;
  email: string; // CRITICAL: Email change must issue new token
  tier: SubscriptionTier;
  isCreator: boolean;
  isAdmin: boolean;
  isDemo: boolean;
  iat: number; // Issued at
  exp: number; // Expiry (30 days from issue)
}
```

**Email Change Flow:**
1. Verify current password (bcrypt.compare)
2. Update email in database
3. Sign new JWT with updated email
4. Return new token to client
5. Client replaces token in localStorage

**Security:**
- Password never stored in plaintext (bcrypt hash with salt rounds: 12)
- Password hash never returned to client (excluded from SELECT queries)
- Email change requires password verification (prevents XSS attacks)

**Versions:**
- `jsonwebtoken@^9.0.2` (current)
- `bcryptjs@^3.0.2` (current)

## Frontend UI Components

**Decision:** Reuse existing GlassCard design system from Plan-6

**Rationale:**
- Zero new component development (all UI primitives exist)
- Consistent visual language across all pages
- GlassCard, GlassInput, GlowButton, GlassModal production-ready
- Toast notification system integrated (ToastContext)
- Framer Motion animations respect reduced motion

**Component Usage:**

**Profile Page:**
- `GlassCard` (sections for account info, tier display, danger zone)
- `GlassInput` (name edit, email edit, password change fields)
- `GlowButton` (Save, Cancel, Delete Account actions)
- `GlassModal` (Delete Account confirmation dialog)
- `Toast` (success/error notifications)

**Settings Page:**
- `GlassCard` (preference sections)
- Native `<input type="checkbox">` with custom styling (toggle switches)
- Native `<select>` with GlassInput styling (reflection reminders dropdown)
- `Toast` (brief confirmation on save)

**About Page:**
- `CosmicBackground` (animated starfield)
- `GlassCard` (founder story, mission, values sections)
- `GlowButton` (CTA: "Start Your Free Account")
- `next/image` (founder photo optimization)

**Pricing Page:**
- `GlassCard` (tier comparison cards)
- `GlowButton` (CTAs per tier)
- Native `<details>` (FAQ accordion, no JavaScript needed)

**No New Dependencies Required** - All components exist in `/components/ui/glass/` and `/components/shared/`

## Styling

**Decision:** Tailwind CSS (existing)

**Rationale:**
- Established utility classes for glassmorphism effects
- Responsive design utilities (mobile-first)
- Dark theme variables configured
- Framer Motion integration for animations

**Key Patterns:**
```tsx
// Glassmorphism
className="bg-white/5 backdrop-blur-xl border border-white/10"

// Responsive spacing
className="px-4 sm:px-6 lg:px-8"

// Cosmic gradients
className="bg-gradient-to-br from-purple-500/20 to-blue-500/20"

// Interactive states
className="hover:bg-white/10 active:scale-95 transition-all"
```

**Version:** `tailwindcss@^3.4.17` (current)

## State Management

**Decision:** React Query (via tRPC) + React Context (useAuth)

**Rationale:**
- React Query handles server state (automatic caching, revalidation)
- Optimistic updates for Settings page (immediate UI feedback)
- useAuth hook provides user data across components
- No global state library needed (Zustand, Redux overkill for this scope)

**State Patterns:**

**Profile Page:**
```tsx
const { user, refreshUser } = useAuth();
const updateProfile = trpc.users.updateProfile.useMutation({
  onSuccess: () => {
    toast.success('Profile updated');
    refreshUser(); // Reload user data
  },
});
```

**Settings Page:**
```tsx
const updatePreferences = trpc.users.updatePreferences.useMutation({
  onSuccess: (data) => {
    setUser(prev => ({ ...prev, preferences: data.preferences }));
    toast.success('Setting saved', { duration: 2000 });
  },
});
```

**Versions:**
- `@tanstack/react-query@^5.62.16` (current)

## External Integrations

### None Required for This Iteration

**Email Verification (Deferred to Post-MVP):**
- Resend or SendGrid integration deferred per master-plan.yaml line 135
- Email change updates database only (no verification email sent)
- `email_verified` flag reset to false on email change (prepare for future verification)

**Subscription Management (Deferred):**
- Stripe integration deferred to payment iteration
- Pricing page shows pricing only (no checkout flow)

**Analytics (Optional):**
- User can opt in/out via Settings page (`analytics_opt_in` preference)
- Implementation deferred (no analytics SDK in this iteration)

## Development Tools

### Testing

**Framework:** Manual testing (existing pattern from Plan-6)

**Coverage Target:** 100% mutation path coverage
- Profile: Test all mutations (name change, email change, password change, delete account)
- Settings: Test all preference toggles (8 preferences)
- About: Visual regression testing (layout, responsive)
- Pricing: Data accuracy testing (tier limits match constants)

**Testing Approach:**
```
Manual Test Suite (45-60 minutes):

Profile Page:
- [ ] Change name → verify toast + database update
- [ ] Change email → verify password required + new JWT issued
- [ ] Change email to existing email → verify error "Email already in use"
- [ ] Change password → verify current password required
- [ ] Change password with wrong current password → verify error
- [ ] Delete account → verify email confirmation + password required
- [ ] Delete account → verify reflections cascade deleted

Settings Page:
- [ ] Toggle each preference → verify immediate save
- [ ] Reload page → verify preferences persisted
- [ ] Change default tone → verify dropdown saves
- [ ] Change reflection reminders → verify dropdown saves

About Page:
- [ ] Verify layout responsive (mobile, tablet, desktop)
- [ ] Verify founder photo loads (if provided)
- [ ] Verify CTA links to signup

Pricing Page:
- [ ] Verify tier limits match constants (free=10, premium=50, pro=unlimited)
- [ ] Verify feature matrix accurate
- [ ] Verify FAQ accordion works
```

### Code Quality

**Linter:** ESLint (existing configuration)

**Formatter:** Prettier (existing configuration)

**Type Checking:** TypeScript strict mode

**Pre-commit Hooks:** None (manual checks sufficient for iteration scope)

### Build & Deploy

**Build Tool:** Next.js build system

**Deployment Target:** Vercel (existing)

**CI/CD:** GitHub Actions (existing)

**Environment Variables:**
```bash
# Required (already configured)
DATABASE_URL=postgresql://...
JWT_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# No new environment variables needed
```

## Dependencies Overview

### Production Dependencies (Existing - No New Installs)

```json
{
  "next": "^14.2.18",
  "@trpc/server": "^11.6.0",
  "@trpc/client": "^11.6.0",
  "@trpc/react-query": "^11.6.0",
  "@tanstack/react-query": "^5.62.16",
  "@supabase/supabase-js": "^2.50.4",
  "bcryptjs": "^3.0.2",
  "jsonwebtoken": "^9.0.2",
  "zod": "^3.25.76",
  "framer-motion": "^11.15.7",
  "tailwindcss": "^3.4.17",
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

### Development Dependencies (Existing)

```json
{
  "typescript": "^5.7.3",
  "eslint": "^8.57.1",
  "prettier": "^3.4.2",
  "@types/react": "^19.0.10",
  "@types/node": "^22.10.2",
  "@types/bcryptjs": "^2.4.6",
  "@types/jsonwebtoken": "^9.0.7"
}
```

### New Dependencies Required

**NONE** - All features achievable with existing stack

## Performance Targets

### Bundle Size Budget

**Baseline (Plan-6):** ~180KB total bundle (gzipped)

**Iteration 13 Budget:** +15KB maximum increase
- Profile page: ~4KB (form components reused)
- Settings page: ~3KB (toggle logic minimal)
- About page: ~2KB (static content, no complex logic)
- Pricing page: ~4KB (comparison table, FAQ accordion)
- Backend mutations: ~2KB (Zod schemas)

**Total:** ~195KB (8.3% increase, well within acceptable range)

### Core Web Vitals

**Targets (all four new pages):**
- **LCP (Largest Contentful Paint):** <2.5s
- **FID (First Input Delay):** <100ms
- **CLS (Cumulative Layout Shift):** <0.1

**Optimization Strategies:**
- Lazy-load non-critical components (FAQ accordion, modal dialogs)
- Optimize images with next/image (WebP format, priority loading for hero images)
- Reuse cached CosmicBackground component (already optimized in Plan-6)
- Minimize client-side JavaScript (use native HTML elements where possible)

### Database Performance

**Query Targets:**
- Profile mutations: <200ms (single UPDATE query)
- Preferences update: <150ms (JSONB partial update)
- Profile data fetch: <100ms (existing `getProfile` query, already optimized)

**Optimization:**
- No N+1 queries (single query per mutation)
- JSONB indexed (automatic in PostgreSQL)
- Connection pooling via Supabase (existing configuration)

## Security Patterns

### Password-Protected Operations

**Pattern:** All sensitive mutations require password verification

```typescript
// Email change mutation
const { data: user } = await supabase
  .from('users')
  .select('password_hash')
  .eq('id', ctx.user.id)
  .single();

const passwordValid = await bcrypt.compare(input.currentPassword, user.password_hash);

if (!passwordValid) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Current password is incorrect',
  });
}
```

**Applied to:**
- Email change
- Account deletion

### Input Validation

**Pattern:** Zod schemas validate at runtime + provide TypeScript types

```typescript
// Email validation
z.string().email('Invalid email address')

// Enum validation (no arbitrary values)
z.enum(['off', 'daily', 'weekly'])

// Nullable with type safety
z.boolean().nullable().optional()
```

### Demo User Protection

**Pattern:** `notDemo` middleware blocks destructive operations

```typescript
// middleware.ts
export const notDemo = middleware(({ ctx, next }) => {
  if (ctx.user.isDemo) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Demo accounts cannot modify data. Sign up to save changes.',
    });
  }
  return next({ ctx });
});

// Applied to mutations
changeEmail: publicProcedure.use(isAuthed).use(notDemo).input(...).mutation(...),
```

### JWT Token Invalidation

**Pattern:** Email change issues new token (old token contains stale email)

```typescript
// After email update
const payload: JWTPayload = {
  userId: user.id,
  email: updatedEmail, // NEW EMAIL
  tier: user.tier,
  // ... other claims
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Fresh 30 days
};

const newToken = jwt.sign(payload, JWT_SECRET);

return { user, token: newToken, message: 'Email updated' };
```

**Frontend handling:**
```typescript
onSuccess: (data) => {
  localStorage.setItem('mirror_auth_token', data.token);
  setUser(data.user);
}
```

## Technology Decisions Summary

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | Next.js 14 App Router | File-based routing, existing patterns |
| **API Layer** | tRPC 11 + Zod | Type safety, existing routers |
| **Database** | Supabase PostgreSQL | JSONB preferences, schema complete |
| **Auth** | JWT + bcrypt | Stateless, password hashing mature |
| **UI Components** | GlassCard system | Reuse Plan-6 design system |
| **Styling** | Tailwind CSS | Utility classes, responsive |
| **State** | React Query + useAuth | Server state + user context |
| **Testing** | Manual | Comprehensive mutation coverage |
| **Deployment** | Vercel | Existing CI/CD pipeline |

**Key Principle:** Reuse existing infrastructure aggressively. Zero new dependencies, maximum velocity.
