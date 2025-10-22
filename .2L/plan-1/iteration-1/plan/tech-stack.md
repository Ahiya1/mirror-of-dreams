# Technology Stack - Iteration 1

## Core Framework

**Decision:** Next.js 14.2.0+ (App Router)

**Rationale:**
1. **Server Components by default**: Reduces bundle size for dashboard-heavy application with lots of data fetching
2. **tRPC integration is mature**: Well-documented patterns with Next.js API routes
3. **File-based routing**: Easier to understand than React Router config for team scaling
4. **Built-in API routes**: Eliminates need for separate Express server (except webhooks)
5. **Vercel deployment optimized**: Already using Vercel, Next.js has best DX there
6. **TypeScript-first**: Official TypeScript support with excellent type inference
7. **React 18 compatible**: Already using React 18.3.1, no version conflicts

**Alternatives Considered:**
- **Remix**: Excellent framework but tRPC integration less mature, steeper learning curve
- **Vite + React Router (keep current)**: Doesn't solve backend type safety, still need separate Express server
- **Create React App**: Deprecated, not recommended for new projects

**Migration Notes:**
- Migrate from React Router 6.30.1 to Next.js App Router
- Proxy configuration (`/api/*` in vite.config.js) becomes unnecessary
- Static assets in `public/` directory remain in same location
- Environment variables: Prefix client-side vars with `NEXT_PUBLIC_`

---

## TypeScript Configuration

**Decision:** TypeScript 5.3.0+ with strict mode enabled

**Rationale:**
1. **Type safety across stack**: Catch errors at compile time, not runtime
2. **tRPC requires TypeScript**: Full type inference only works with TS
3. **Better developer experience**: IntelliSense, autocomplete, refactoring tools
4. **Industry standard**: 90%+ of new Next.js projects use TypeScript
5. **No runtime overhead**: Compiles to JavaScript, no performance cost

**tsconfig.json Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./types/*"],
      "@/server/*": ["./server/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Strict Mode Settings:**
- `strict: true` - Enables all strict type checking options
- `noUncheckedIndexedAccess: true` - Safer array/object access (add after initial migration)
- `noImplicitAny: true` - No implicit 'any' types allowed
- `strictNullChecks: true` - Null and undefined must be handled explicitly

**Migration Strategy:**
- Start with `strict: true` from day one
- Use `any` sparingly for complex Claude API responses (can refine later)
- Convert components incrementally: shared → dashboard → mirror → auth → portal

---

## Backend Framework

**Decision:** tRPC 10.45.0+ with Next.js API Routes

**Rationale:**
1. **End-to-end type safety**: Frontend knows exact shape of backend responses
2. **No code generation**: Types inferred automatically, no build step needed
3. **Automatic API documentation**: Types serve as documentation
4. **React Query integration**: Built-in caching, refetching, optimistic updates
5. **Better DX than REST**: No manual fetch calls, autocomplete everywhere
6. **Zod validation**: Runtime validation matches TypeScript types

**tRPC Setup:**
```typescript
// server/trpc/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**Why NOT GraphQL:**
- Overkill for this project size (13 endpoints)
- Requires separate schema definition
- More complexity than needed
- tRPC simpler for TypeScript projects

**Why NOT REST:**
- No automatic type safety
- Manual fetch calls everywhere
- Type definitions drift from implementation
- More boilerplate code

**Webhook Handling:**
- Stripe webhooks remain as separate Express endpoint (NOT tRPC)
- Reason: Webhooks need raw body for signature verification
- File: `/app/api/webhooks/stripe/route.ts` (Next.js route handler with bodyParser disabled)

---

## Database

**Decision:** Supabase PostgreSQL (existing) with Supabase JS Client 2.50.4

**Rationale:**
1. **Already in production**: No migration needed, preserve existing data
2. **PostgreSQL features**: Full SQL support, JSONB, row-level security
3. **Real-time subscriptions**: Available if needed in future
4. **Generous free tier**: Suitable for early stage
5. **Vercel integration**: Easy to connect from Next.js

**Schema Strategy:**
- Keep existing schema IDENTICAL except gift table deletion
- No ORM (use Supabase client directly)
- Consider Drizzle ORM in future iterations for type safety

**Schema Changes (Iteration 1):**
```sql
-- ONLY CHANGE: Remove gifting feature

-- Step 1: Backup data
-- Manual export of subscription_gifts table to CSV

-- Step 2: Drop table
DROP TABLE IF EXISTS public.subscription_gifts CASCADE;

-- Step 3: Remove functions (if any reference gifts)
-- Verify no functions reference subscription_gifts

-- No other schema changes
```

**Row-Level Security:**
- Keep RLS policies enabled
- Service role key bypasses RLS (current pattern)
- Future: Implement proper RLS policies per user

**Connection Pattern:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Alternatives Considered:**
- **Drizzle ORM**: Better type safety but adds migration complexity
- **Prisma**: Heavy, slow on serverless, RLS difficult
- **Raw SQL**: More control but loses Supabase features

---

## Authentication

**Decision:** Custom JWT with jsonwebtoken 9.0.2 (existing)

**Rationale:**
1. **Already working**: Proven authentication system in production
2. **No external dependencies**: Full control over auth logic
3. **30-day sessions**: Good UX, less frequent logins
4. **bcrypt password hashing**: Industry standard, secure

**Implementation:**
```typescript
// server/trpc/context.ts
import jwt from 'jsonwebtoken';

export async function createContext({ req, res }: CreateNextContextOptions) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  let user = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      // Fetch fresh user data from Supabase
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();
      user = data;
    } catch (e) {
      // Invalid token, user stays null
    }
  }

  return { req, res, user };
}
```

**Protected Procedure Pattern:**
```typescript
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**Alternatives Considered:**
- **NextAuth.js**: Overkill for email/password only, adds complexity
- **Clerk**: Paid service, vendor lock-in
- **Supabase Auth**: Good option but requires migration of existing users

**Migration Notes:**
- Keep JWT_SECRET identical to existing
- Reuse bcrypt hashing logic (12 rounds)
- Maintain 30-day expiry
- Token stored in localStorage (client-side)

---

## API Validation

**Decision:** Zod 3.22.0+ for runtime validation

**Rationale:**
1. **tRPC integration**: tRPC uses Zod schemas for input validation
2. **Type inference**: TypeScript types inferred from Zod schemas
3. **Runtime safety**: Validates data at runtime, catches invalid inputs
4. **Better error messages**: Descriptive validation errors
5. **Single source of truth**: Schema defines both types and validation

**Example Schema:**
```typescript
// server/trpc/routers/reflections.ts
import { z } from 'zod';

const createReflectionInput = z.object({
  dreamId: z.string().uuid(),
  dream: z.string().min(1).max(3200),
  plan: z.string().min(1).max(4000),
  hasDate: z.enum(['yes', 'no']),
  dreamDate: z.string().nullable(),
  relationship: z.string().min(1).max(4000),
  offering: z.string().min(1).max(2400),
  tone: z.enum(['gentle', 'intense', 'fusion']).default('fusion'),
  isPremium: z.boolean().default(false),
});

export const reflectionsRouter = router({
  create: protectedProcedure
    .input(createReflectionInput)
    .mutation(async ({ ctx, input }) => {
      // input is fully typed and validated
    }),
});
```

**Shared Validation Schemas:**
- Location: `/types/schemas.ts`
- Reusable across multiple routers
- Validation errors automatically formatted by tRPC

---

## Frontend

**Decision:** React 18.3.1 (existing) with Next.js App Router

**UI Component Library:** shadcn/ui (copy-paste components)

**Rationale for shadcn/ui:**
1. **No dependency bloat**: Components copied into codebase, not npm package
2. **Full customization**: Own the code, modify as needed
3. **Tailwind-based**: Consistent with modern Next.js apps
4. **TypeScript-first**: All components fully typed
5. **Accessible**: ARIA compliant, keyboard navigation
6. **Matches cosmic aesthetic**: Easy to customize for Mirror of Dreams theme

**Key Components to Use:**
- Button (replace existing custom buttons)
- Card (dashboard cards)
- Dialog (modals)
- Form (with React Hook Form integration)
- Toast (notifications)
- Dropdown Menu (user menu)
- Tabs (reflection history filters)

**Styling:** Tailwind CSS 3.4.0+

**Rationale:**
1. **Next.js standard**: Most Next.js apps use Tailwind
2. **Utility-first**: Faster development than CSS Modules
3. **Purge unused styles**: Small production bundle
4. **Design system**: Consistent spacing, colors, typography
5. **Responsive design**: Built-in breakpoint utilities

**Tailwind Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Preserve cosmic theme colors
        cosmic: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          gold: '#F59E0B',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

**Migration Strategy:**
- Keep existing CSS files initially
- Convert to Tailwind component-by-component
- Preserve animations and cosmic background
- Use `clsx` for conditional classes

**State Management:** React Query (via tRPC)

**Rationale:**
1. **Built into tRPC**: No additional setup needed
2. **Automatic caching**: Reduces API calls
3. **Optimistic updates**: Better UX for mutations
4. **Refetching on focus**: Data always fresh
5. **Loading/error states**: Built-in

---

## External Integrations

### Anthropic Claude API

**Purpose:** AI reflection generation
**Library:** @anthropic-ai/sdk 0.52.0 (existing)
**Implementation:**
- Keep modular prompt system (prompts/ directory)
- Model: claude-sonnet-4-20250514 (current model)
- Premium tier: Extended thinking enabled (5000 budget tokens)
- Free/Essential tier: Standard response

**Code Pattern:**
```typescript
// server/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateReflection(input: {
  systemPrompt: string;
  userPrompt: string;
  isPremium: boolean;
}) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: input.isPremium ? 6000 : 4000,
    temperature: 1,
    system: input.systemPrompt,
    messages: [{ role: 'user', content: input.userPrompt }],
    ...(input.isPremium && {
      thinking: {
        type: 'enabled',
        budget_tokens: 5000,
      },
    }),
  });

  return response.content[0].text;
}
```

### Stripe API

**Purpose:** Payment processing and subscription management
**Library:** stripe 18.3.0 (existing)
**Implementation:**
- Client: Payment intent creation, checkout sessions
- Webhooks: Remain as Express endpoint (NOT tRPC)

**Webhook Endpoint:**
```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const body = await req.text(); // Raw body for signature
  const signature = req.headers.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle payment
        break;
      case 'customer.subscription.updated':
        // Update subscription
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for webhook signature verification
  },
};
```

### Supabase API

**Purpose:** Database operations
**Library:** @supabase/supabase-js 2.50.4 (existing)
**Implementation:**
- Server-side only: Use service role key
- All database queries go through Supabase client
- RLS bypassed with service role (current pattern)

### Nodemailer (Gmail)

**Purpose:** Email notifications
**Library:** nodemailer 6.10.1 (existing)
**Implementation:**
- Subscription confirmations
- Welcome emails
- Password reset
- Keep existing email templates

### Upstash Redis

**Purpose:** Rate limiting and caching (if used)
**Library:** @upstash/redis 1.35.0 (existing)
**Implementation:**
- Keep if currently used
- HTTP-based, works well with serverless

---

## Development Tools

### Testing

**Framework:** Vitest (defer to post-iteration 1)

**Coverage target:** 70%+ for critical paths

**Strategy:**
- Unit tests for tRPC procedures
- Integration tests for auth flow
- E2E tests for reflection creation

**Note:** Basic testing only in Iteration 1, comprehensive testing in Iteration 4

### Code Quality

**Linter:** ESLint 8.x with Next.js config

**Configuration:**
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

**Formatter:** Prettier 3.x

**Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Type Checking:** TypeScript compiler (tsc)

**Pre-commit hooks:** (optional, defer to Iteration 4)

### Build & Deploy

**Build tool:** Next.js built-in (uses Turbopack in dev, Webpack in production)

**Deployment target:** Vercel (already using)

**CI/CD:** Vercel automatic deployments on git push

**Build Command:**
```bash
npm run build
# Runs: next build
```

**Environment Setup:**
```bash
# Development
npm run dev
# Runs: next dev

# Production
npm start
# Runs: next start
```

---

## Environment Variables

### Required Environment Variables

**Database:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Authentication:**
```
JWT_SECRET=your-jwt-secret-keep-same-as-current
```

**AI:**
```
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

**Email:**
```
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

**Payments:**
```
STRIPE_SECRET_KEY=sk_live_your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

**Infrastructure:**
```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

**Business (if used):**
```
BUSINESS_NUMBER=your-business-number
BUSINESS_NAME=your-business-name
BIT_PHONE=your-phone
```

**Migration Notes:**
- Change all `VITE_` prefixes to `NEXT_PUBLIC_` for client-side variables
- Server-side variables have no prefix
- Next.js only exposes `NEXT_PUBLIC_*` to browser
- Update `.env.example` with new naming

---

## Dependencies Overview

### To Install (New)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "@trpc/server": "^10.45.0",
    "@trpc/client": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@trpc/next": "^10.45.0",
    "@tanstack/react-query": "^5.24.0",
    "zod": "^3.22.4",
    "tailwindcss": "^3.4.1",
    "tailwindcss-animate": "^1.0.7",
    "clsx": "^2.1.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.0",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "eslint-config-next": "^14.2.0"
  }
}
```

### To Remove

```json
{
  "dependencies": {
    "react-router-dom": "^6.30.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "vite": "^4.5.14",
    "@vitejs/plugin-react": "^4.6.0",
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6"
  }
}
```

### To Keep (Existing)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@anthropic-ai/sdk": "^0.52.0",
    "@supabase/supabase-js": "^2.50.4",
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2",
    "stripe": "^18.3.0",
    "nodemailer": "^6.10.1",
    "@upstash/redis": "^1.35.0"
  }
}
```

---

## Performance Targets

**First Contentful Paint:** < 1.5s
**Time to Interactive:** < 2.5s
**Bundle Size:** < 200KB (gzipped, initial load)
**API Response Time:** < 500ms (p95, excluding AI generation)

**Strategies:**
- Next.js automatic code splitting
- Server Components reduce client bundle
- React Query caching reduces API calls
- Vercel Edge Network (CDN)

---

## Security Considerations

**Authentication:**
- JWT tokens in Authorization header (NOT cookies yet)
- bcrypt password hashing (12 rounds)
- Token expiry enforced (30 days)

**API Security:**
- tRPC context checks auth on every protected procedure
- Input validation with Zod schemas
- Rate limiting (defer to Iteration 4)

**Database Security:**
- Service role key server-side only
- Never expose service role key to client
- RLS policies enabled (bypassed with service role)

**Environment Variables:**
- Never commit .env to git
- Use Vercel environment variables for production
- Separate keys for development/staging/production

**Stripe Webhooks:**
- Signature verification on every webhook
- Use raw body for signature validation
- Idempotency to prevent duplicate processing

**CORS:**
- Next.js API routes default to same-origin
- No CORS needed for tRPC (same domain)
- Stripe webhooks allow Stripe's IPs only
