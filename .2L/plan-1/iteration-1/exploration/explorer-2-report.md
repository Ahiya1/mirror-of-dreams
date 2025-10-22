# Explorer 2 Report: Backend API Migration Analysis

## Executive Summary

The Mirror of Dreams backend currently uses 13 Express-style serverless functions deployed on Vercel. Each endpoint uses an action-based routing pattern with a single handler function. The migration to tRPC will require restructuring these endpoints into typed procedures while preserving the existing authentication system, database operations, and business logic. **CRITICAL: The gifting feature (`api/gifting.js`) must be completely removed as part of this iteration.**

## Discoveries

### Current Express API Inventory

#### 1. **Authentication System** (`api/auth.js`)
- **Pattern**: Action-based routing (`signup`, `signin`, `verify-token`, etc.)
- **Auth Method**: JWT tokens with 30-day expiry
- **Database**: Supabase with bcrypt password hashing
- **Actions**:
  - `signup` - Create new user with email/password
  - `signup-with-subscription` - Create user with active subscription
  - `signin` - Authenticate and return JWT
  - `signout` - Client-side token invalidation
  - `verify-token` - Validate JWT and return user data
  - `get-user` - Retrieve full user profile
  - `update-profile` - Update name/language/timezone
  - `change-password` - Password update with verification
  - `delete-account` - Account deletion with cascade

**Key Dependencies**: Exported `authenticateRequest()` function used by ALL other APIs

#### 2. **Reflection Management** (`api/reflections.js` & `api/reflection.js`)

**`api/reflections.js`** - Database CRUD operations:
- `create` - Store reflection in database (usage limits enforced)
- `get-history` - Paginated reflection list with filters
- `get-reflection` - Single reflection retrieval (increments view count)
- `update-reflection` - Edit title/tags
- `delete-reflection` - Remove reflection
- `check-usage` - Current month usage status
- `search` - Full-text search across reflections
- `submit-feedback` - Rating (1-10) and feedback submission

**`api/reflection.js`** - AI generation endpoint:
- Uses Claude Sonnet 4.5 with modular prompt system
- Premium tier gets extended thinking (5000 tokens)
- Stores reflection after generation
- Updates user usage counters
- Checks evolution report triggers

**Usage Limits**:
- Free: 1 reflection/month
- Essential: 5 reflections/month  
- Premium: 10 reflections/month
- Creator/Admin: Unlimited

#### 3. **Payment Processing** (`api/payment.js`)
- **Complexity**: VERY HIGH - 1829 lines with extensive webhook handling
- **Stripe Integration**:
  - `config` (GET) - Stripe publishable key and price IDs
  - `create-upgrade-checkout` - Legacy Checkout Session (deprecated in favor of Payment Intent)
  - `create-payment-intent` - Create PaymentIntent for in-page payment
  - `confirm-payment` - Manual payment confirmation and subscription creation
- **Webhook Events**:
  - `payment_intent.succeeded` - Primary subscription creation flow
  - `checkout.session.completed` - Legacy flow + gift routing
  - `customer.subscription.updated` - Status updates
  - `customer.subscription.deleted` - Cancellation handling
  - `invoice.payment_succeeded` - Renewal success
  - `invoice.payment_failed` - Payment failure handling
- **Anti-Double-Charge Logic**: Uses trial periods to prevent duplicate charges

#### 4. **Subscription Management** (`api/subscriptions.js`)
- `get-current` - Subscription status and billing info
- `cancel-subscription` - Set cancel_at_period_end in Stripe
- `get-customer-portal` - Generate Stripe billing portal URL
- `reactivate` - Remove cancel_at_period_end flag

#### 5. **Gifting System** (`api/gifting.js`) - **TO DELETE**
- **Status**: ENTIRE FILE MUST BE REMOVED
- **Current Actions**:
  - `create-gift-checkout` - Stripe checkout for gift subscriptions
  - `validate-gift` - Check gift code validity
  - `redeem-gift` - Apply gift to account
  - `get-gift-pricing` - Pricing structure
- **Webhook Handling**: Gift-specific webhook processing
- **Database Tables**: `subscription_gifts` table (may need cleanup)

#### 6. **Evolution Reports** (`api/evolution.js`)
- `generate-report` - Claude analysis of reflection patterns
- `get-reports` - Paginated report history
- `get-report` - Single report retrieval
- `check-eligibility` - Can user generate report?
- **Thresholds**: Essential = every 4 reflections, Premium = every 6

#### 7. **Artifact Generation** (`api/artifact.js`)
- GPT-4o analysis of reflection content
- Canvas-based image generation
- Cloudflare R2 upload
- Database storage of artifact metadata

#### 8. **Communication** (`api/communication.js`)
- Email system using Nodemailer + Gmail
- **Actions**:
  - `send-subscription-confirmation`
  - `send-subscription-gift-invitation` (gift-related)
  - `generate-subscription-gift-receipt` (gift-related)
  - `send-welcome-email`
  - `send-password-reset`
  - `send-account-notification`
- **Note**: Gift-related actions should be removed

#### 9. **Admin Panel** (`api/admin.js`)
- `auth` / `authenticate` - Creator secret key verification
- `GET` - Retrieve all admin data (receipts + gifts)
- `POST` - Add receipt or search receipts
- `PUT` - Update receipt
- `DELETE` - Remove receipt or gift

#### 10. **User Management** (`api/users.js`)
- `get-profile` - Comprehensive user profile
- `update-profile` - Name/language/timezone updates
- `get-usage` - Detailed usage statistics
- `get-dashboard-data` - Complete dashboard in one request
- `upgrade-tier` - Tier upgrade (placeholder)
- `delete-account` - Account deletion

#### 11. **Creator Authentication** (`api/creator-auth.js`)
- Single POST endpoint for creator login
- Validates against `CREATOR_SECRET_KEY`
- Returns hardcoded creator user object

#### 12. **Diagnostics** (`api/diagnostics.js`)
- Development-only endpoint
- Tests Redis, Stripe, Supabase connections
- Checks for stuck webhook sessions

### Missing/Broken Endpoints

#### **CRITICAL MISSING**: Reflection List Endpoint
- **Current Issue**: No dedicated endpoint for viewing all user reflections
- **Workaround**: `get-history` in `api/reflections.js` exists but may need enhancement
- **Fix**: Ensure `get-history` is properly exposed and documented

#### Other Observations:
- `api/reflection.js` vs `api/reflections.js` naming confusion (singular vs plural)
- Some endpoints mix GET query params and POST body params inconsistently
- Error handling patterns vary across files

## Patterns Identified

### Pattern 1: Action-Based Routing

**Description**: Every API file uses a switch statement to route to sub-handlers based on an `action` parameter

**Example**:
```javascript
const { action } = req.method === "GET" ? req.query : req.body;

switch (action) {
  case "create":
    return await handleCreate(req, res);
  case "get-history":
    return await handleGetHistory(req, res);
  // ...
}
```

**tRPC Translation**: Each `action` becomes a separate procedure
```typescript
export const reflectionsRouter = router({
  create: protectedProcedure
    .input(z.object({ dream: z.string(), ... }))
    .mutation(async ({ ctx, input }) => { ... }),
  
  getHistory: protectedProcedure
    .input(z.object({ page: z.number(), ... }))
    .query(async ({ ctx, input }) => { ... }),
});
```

### Pattern 2: Shared Authentication Helper

**Description**: All protected endpoints import and call `authenticateRequest()` from `api/auth.js`

**Current Implementation**:
```javascript
const { authenticateRequest } = require("./auth.js");

async function handleProtectedAction(req, res) {
  const user = await authenticateRequest(req); // Throws on failure
  // ... proceed with user context
}
```

**tRPC Translation**: Use context middleware
```typescript
const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req.headers.authorization?.replace("Bearer ", "");
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
  
  const user = await verifyJWT(token);
  return next({ ctx: { ...ctx, user } });
});
```

### Pattern 3: Manual Request Body Parsing (Webhooks)

**Description**: Webhook endpoints use custom `getRawBody()` function to avoid body parser interference

**Current Implementation**:
```javascript
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => { resolve(data); });
  });
}
```

**tRPC Consideration**: Webhooks should remain as separate Express endpoints, NOT migrated to tRPC

### Pattern 4: Response Formatting

**Description**: All endpoints return consistent response structure
```javascript
return res.json({
  success: true,
  data: {...},
  message: "...",
  debug: { ... } // Development only
});
```

**tRPC Translation**: Return data directly, use TRPCError for failures
```typescript
// Success
return { data: {...}, message: "..." };

// Error
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "...",
});
```

## tRPC Migration Strategy

### Recommended Router Structure

```
/server/trpc/
├── context.ts          # Request context creation
├── middleware.ts       # Authentication middleware
├── trpc.ts            # tRPC instance configuration
└── routers/
    ├── auth.ts        # Authentication procedures
    ├── reflections.ts # Reflection CRUD
    ├── reflection.ts  # AI generation (keep separate)
    ├── evolution.ts   # Evolution reports
    ├── artifact.ts    # Artifact generation
    ├── payment.ts     # Payment intents (NOT webhooks)
    ├── subscriptions.ts
    ├── users.ts
    ├── admin.ts
    ├── creator.ts
    └── _app.ts        # Root router combining all sub-routers
```

### Authentication Context Setup

**Context Creation** (`context.ts`):
```typescript
import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { verifyJWT } from "@/lib/jwt";

export async function createContext({ req, res }: CreateNextContextOptions) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  let user = null;
  if (token) {
    try {
      user = await verifyJWT(token);
    } catch (e) {
      // Invalid token, keep user null
    }
  }

  return { req, res, user };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

**Protected Procedure** (`middleware.ts`):
```typescript
import { TRPCError } from "@trpc/server";
import { middleware } from "./trpc";

export const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Narrowed type
    },
  });
});
```

### Shared Type Definitions

**Create** `/types/api.ts`:
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  tier: "free" | "essential" | "premium";
  subscription_status: string;
  reflection_count_this_month: number;
  total_reflections: number;
  is_creator: boolean;
  is_admin: boolean;
  language: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  dream: string;
  plan: string;
  has_date: string;
  dream_date: string | null;
  relationship: string;
  offering: string;
  ai_response: string;
  tone: "gentle" | "intense" | "fusion";
  is_premium: boolean;
  title: string;
  word_count: number;
  estimated_read_time: number;
  created_at: string;
}

// ... more shared types
```

### Error Handling Patterns

**Current Express Pattern**:
```javascript
try {
  // operation
} catch (error) {
  if (error.message === "Authentication required") {
    return res.status(401).json({ error: "..." });
  }
  return res.status(500).json({ error: "..." });
}
```

**tRPC Pattern**:
```typescript
import { TRPCError } from "@trpc/server";

// Throw typed errors
if (!input.email) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Email is required",
  });
}

if (!user) {
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message: "Authentication required",
  });
}

// tRPC automatically handles error responses
```

## Endpoints to Delete (Gift Feature)

### Files to Remove Completely

1. **`/api/gifting.js`** (763 lines)
   - All gift checkout creation
   - Gift validation and redemption
   - Gift webhook handling
   - Gift email sending

### Code to Remove from Other Files

2. **`/api/payment.js`**:
   - Lines 1508-1563: `routeToGiftWebhook()` function
   - Lines 1646-1662: `handleGiftCheckoutCompleted()` function
   - Gift routing logic in `handleCheckoutWebhook()`

3. **`/api/communication.js`**:
   - Lines 54-58: `send-subscription-gift-invitation` action
   - Lines 132-172: `handleSubscriptionGiftInvitation()` function
   - Lines 174-204: `handleSubscriptionGiftReceipt()` function
   - Lines 316-344: `handleLegacyGiftInvitation()` function
   - Lines 346-374: `handleLegacyGiftReceipt()` function
   - Lines 556-618: Gift invitation email template
   - Gift receipt template (if exists)

4. **`/api/admin.js`**:
   - Lines 11-13: `removeGift`, `getGiftByCode` imports
   - Lines 149-151: Gift data in response
   - Lines 275-283: Gift deletion logic

5. **Database Cleanup** (Manual):
   - Drop `subscription_gifts` table
   - Remove any gift-related foreign keys
   - Archive existing gift data before deletion

### Migration Order for Gift Removal

1. **Phase 1**: Remove gift creation (no new gifts)
2. **Phase 2**: Archive existing unredeemed gifts
3. **Phase 3**: Remove gift redemption code
4. **Phase 4**: Delete database tables
5. **Phase 5**: Remove email templates and communication handlers

## Endpoints to Add/Fix

### 1. Reflection List Endpoint (ALREADY EXISTS)

**Current**: `api/reflections.js` → `action: "get-history"`

**Verification Needed**:
- Ensure proper pagination
- Verify filter functionality (tone, isPremium, search)
- Test with large datasets

**tRPC Translation**:
```typescript
getHistory: protectedProcedure
  .input(z.object({
    page: z.number().default(1),
    limit: z.number().default(20),
    tone: z.enum(["gentle", "intense", "fusion"]).optional(),
    isPremium: z.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.string().default("created_at"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }))
  .query(async ({ ctx, input }) => {
    // Implementation
  })
```

### 2. Missing Bulk Operations

**Recommendation**: Add batch delete for reflections
```typescript
deleteBatch: protectedProcedure
  .input(z.object({
    ids: z.array(z.string()),
  }))
  .mutation(async ({ ctx, input }) => {
    // Delete multiple reflections
  })
```

### 3. Missing Evolution Report Deletion

**Current**: No way to delete evolution reports

**Add**:
```typescript
deleteReport: protectedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Delete evolution report
  })
```

## Type Safety Opportunities

### 1. **Reflection Creation Input Validation**

**Current**: Manual checks scattered across code
```javascript
if (!dream || !plan || !hasDate || !relationship || !offering) {
  return res.status(400).json({ error: "Missing required fields" });
}
```

**tRPC**: Single source of truth
```typescript
const createReflectionInput = z.object({
  dream: z.string().min(1),
  plan: z.string().min(1),
  hasDate: z.enum(["yes", "no"]),
  dreamDate: z.string().nullable(),
  relationship: z.string().min(1),
  offering: z.string().min(1),
  tone: z.enum(["gentle", "intense", "fusion"]).default("fusion"),
  isPremium: z.boolean().default(false),
});
```

### 2. **Subscription Tier Enums**

**Create shared enums**:
```typescript
export enum SubscriptionTier {
  Free = "free",
  Essential = "essential",
  Premium = "premium",
}

export enum SubscriptionStatus {
  Active = "active",
  Canceled = "canceled",
  PastDue = "past_due",
  Trialing = "trialing",
}
```

### 3. **Payment Intent Metadata**

**Current**: Untyped metadata object

**tRPC**:
```typescript
const paymentIntentMetadata = z.object({
  type: z.literal("subscription_upgrade"),
  userId: z.string(),
  email: z.string().email(),
  tier: z.enum(["essential", "premium"]),
  period: z.enum(["monthly", "yearly"]),
  priceId: z.string(),
});
```

### 4. **Evolution Report Themes**

**Current**: String array with magic values

**tRPC**:
```typescript
export enum EvolutionTheme {
  EntrepreneurialVision = "Entrepreneurial Vision",
  CreativeExpression = "Creative Expression",
  ServiceImpact = "Service & Impact",
  ConnectionLove = "Connection & Love",
  FreedomIndependence = "Freedom & Independence",
  GrowthLearning = "Growth & Learning",
  LeadershipAuthority = "Leadership & Authority",
  SpiritualDevelopment = "Spiritual Development",
  AdventureExploration = "Adventure & Exploration",
  SecurityStability = "Security & Stability",
}
```

## Complexity Assessment

### High Complexity Areas (Builder Should Create Sub-Tasks)

#### 1. **Payment Webhook Migration** (Complexity: 10/10)
- 1829 lines of webhook handling logic
- Multiple event types with different flows
- Anti-double-charge trial logic
- Stripe signature verification
- **Recommendation**: Keep webhooks as separate Express endpoints
- **Split Strategy**:
  - Sub-task 1: Extract webhook handlers to `/api/webhooks/stripe.ts`
  - Sub-task 2: Migrate payment intent creation to tRPC
  - Sub-task 3: Migrate subscription management to tRPC
  - Sub-task 4: Test webhook flow end-to-end

#### 2. **Authentication System Migration** (Complexity: 8/10)
- JWT verification used by ALL endpoints
- Password hashing with bcrypt
- Session management
- Multiple auth actions
- **Split Strategy**:
  - Sub-task 1: Create tRPC context with JWT verification
  - Sub-task 2: Create protected procedure middleware
  - Sub-task 3: Migrate auth procedures (signup, signin, etc.)
  - Sub-task 4: Update all dependent routers to use new context

#### 3. **Reflection AI Generation** (Complexity: 7/10)
- Claude Sonnet 4.5 integration
- Modular prompt system (loads from files)
- Premium vs Essential differentiation
- Usage limit enforcement
- **Split Strategy**:
  - Sub-task 1: Migrate prompt loading to shared lib
  - Sub-task 2: Create AI generation procedure
  - Sub-task 3: Migrate usage limit checks to middleware
  - Sub-task 4: Test AI responses

### Medium Complexity Areas

#### 4. **Reflection CRUD Operations** (Complexity: 6/10)
- Straightforward database operations
- Pagination and filtering
- View count tracking
- Feedback submission

#### 5. **Evolution Report System** (Complexity: 6/10)
- Claude analysis integration
- Eligibility calculation
- Report history management

#### 6. **Artifact Generation** (Complexity: 5/10)
- GPT-4o analysis
- Canvas generation
- R2 upload
- Well-isolated functionality

### Low Complexity Areas

#### 7. **User Profile Management** (Complexity: 3/10)
- Simple CRUD operations
- Profile updates
- Dashboard data aggregation

#### 8. **Subscription Status Queries** (Complexity: 3/10)
- Read-only operations
- Billing portal URL generation

#### 9. **Admin Panel** (Complexity: 4/10)
- Creator auth check
- Data retrieval
- Gift removal as part of cleanup

## Risks & Challenges

### Technical Risks

#### Risk 1: Breaking Changes in Frontend

**Impact**: HIGH - All frontend API calls will need updates

**Mitigation**:
1. Create tRPC client wrapper to maintain similar API surface
2. Update all API calls in phases (auth first, then reflections, etc.)
3. Use TypeScript to catch type mismatches
4. Keep old Express endpoints running during migration for rollback

#### Risk 2: Webhook Handling

**Impact**: CRITICAL - Payment webhooks must continue working

**Mitigation**:
1. **DO NOT migrate webhooks to tRPC**
2. Keep webhooks as separate Express endpoints
3. Only migrate client-facing payment operations
4. Test webhook flow thoroughly before deployment

#### Risk 3: Authentication Token Validation

**Impact**: MEDIUM - All protected endpoints depend on auth

**Mitigation**:
1. Reuse existing JWT verification logic
2. Test token validation extensively
3. Ensure error messages match existing behavior
4. Keep auth secret key configuration identical

### Complexity Risks

#### Risk 1: Gift Feature Removal Cascade

**Likelihood**: HIGH - Gift code is referenced in multiple files

**Impact**: MEDIUM - May break admin panel or email sending

**Mitigation**:
1. Search codebase for all "gift" references
2. Create comprehensive deletion checklist
3. Archive gift data before deletion
4. Test admin panel after gift removal

#### Risk 2: Database Schema Changes

**Likelihood**: MEDIUM - May need to add/remove columns

**Impact**: MEDIUM - Could break existing data

**Mitigation**:
1. Use Supabase migrations for schema changes
2. Test migrations in development first
3. Create rollback migrations
4. Document all schema changes

#### Risk 3: Type Definition Synchronization

**Likelihood**: MEDIUM - Frontend and backend types can drift

**Impact**: LOW - TypeScript will catch most issues

**Mitigation**:
1. Use tRPC's automatic type inference
2. Generate types for frontend consumption
3. Use monorepo structure to share types
4. Set up strict TypeScript checking

## Recommendations for Planner

### 1. Keep Webhooks Separate from tRPC

**Rationale**: Webhook endpoints require raw body access for signature verification. tRPC's built-in body parsing interferes with this. Stripe webhooks are server-to-server and don't benefit from tRPC's type safety on the client.

**Implementation**:
- Create `/api/webhooks/stripe.ts` for all webhook handling
- Migrate only client-facing payment operations to tRPC (`create-payment-intent`, `get-config`)
- Keep webhook logic in Express-style serverless function

### 2. Migrate in Dependency Order

**Phase 1**: Authentication (foundation for all other endpoints)
- Create tRPC context with JWT verification
- Create protected procedure middleware
- Test authentication flow

**Phase 2**: Core Functionality (reflections and users)
- Migrate reflection CRUD
- Migrate user management
- Test reflection creation and retrieval

**Phase 3**: Advanced Features
- Migrate evolution reports
- Migrate artifact generation
- Migrate payment operations (non-webhook)

**Phase 4**: Administration
- Migrate admin panel
- Migrate creator auth
- Remove gift feature completely

### 3. Create Comprehensive Type Library

**Before migration starts**:
```
/types/
├── user.ts          # User, AuthSession, etc.
├── reflection.ts    # Reflection, ReflectionCreate, etc.
├── evolution.ts     # EvolutionReport, Theme, etc.
├── subscription.ts  # Tier, Status, Period, etc.
├── payment.ts       # PaymentIntent, Subscription, etc.
└── index.ts         # Re-export all types
```

**Benefits**:
- Single source of truth for all types
- Shared between frontend and backend
- Easy to maintain and update
- Prevents type drift

### 4. Implement Gradual Migration Strategy

**DO NOT**: Delete Express endpoints immediately after tRPC migration

**DO**:
1. Create tRPC procedures alongside existing endpoints
2. Update frontend to use tRPC one module at a time
3. Monitor both endpoints in production
4. Remove Express endpoints only after confirmed stability
5. Keep rollback plan ready

### 5. Use Zod for Runtime Validation

**Current Problem**: Manual validation scattered across files
```javascript
if (!email || !password || !name) {
  return res.status(400).json({ error: "..." });
}
if (password.length < 6) {
  return res.status(400).json({ error: "..." });
}
```

**tRPC Solution**: Single validation definition
```typescript
const signupInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  tier: z.enum(["free", "essential", "premium"]).default("free"),
  language: z.enum(["en", "he"]).default("en"),
});
```

**Benefits**:
- Validation logic in one place
- Type inference from schema
- Consistent error messages
- Client-side validation possible

### 6. Document Gift Removal Dependencies

**Create detailed checklist**:
- [ ] Remove `/api/gifting.js`
- [ ] Remove gift routing from `/api/payment.js`
- [ ] Remove gift emails from `/api/communication.js`
- [ ] Remove gift functions from `/api/admin.js`
- [ ] Archive unredeemed gifts from database
- [ ] Drop `subscription_gifts` table
- [ ] Update frontend to remove gift UI
- [ ] Remove gift-related environment variables
- [ ] Update documentation

### 7. Preserve Request ID Logging Pattern

**Current**: Every request gets a unique ID for debugging
```javascript
const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
console.log(`🔍 [${requestId}] Action: ${action}`);
```

**tRPC Implementation**: Use middleware
```typescript
const requestLogger = middleware(({ ctx, next, path, type }) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const start = Date.now();
  
  console.log(`[${requestId}] ${type} ${path} - START`);
  
  return next({
    ctx: { ...ctx, requestId }
  }).then((result) => {
    console.log(`[${requestId}] ${type} ${path} - SUCCESS (${Date.now() - start}ms)`);
    return result;
  }).catch((error) => {
    console.error(`[${requestId}] ${type} ${path} - ERROR: ${error.message}`);
    throw error;
  });
});
```

## Resource Map

### Critical Files/Directories

**API Endpoints** (All need migration):
- `/api/auth.js` - Authentication (migrate first)
- `/api/reflections.js` - Reflection CRUD
- `/api/reflection.js` - AI generation
- `/api/payment.js` - Payment operations (keep webhooks separate)
- `/api/subscriptions.js` - Subscription management
- `/api/evolution.js` - Evolution reports
- `/api/artifact.js` - Artifact generation
- `/api/users.js` - User management
- `/api/admin.js` - Admin operations
- `/api/creator-auth.js` - Creator authentication
- `/api/communication.js` - Email sending

**To Delete**:
- `/api/gifting.js` - Complete removal

**Shared Libraries** (May need updates):
- `/lib/storage.js` - Receipt/gift storage (referenced by admin.js)
- `/lib/canvas-generators.js` - Artifact canvas generation
- `/lib/cloudflare.js` - R2 uploads

**Prompt System** (Used by AI endpoints):
- `/prompts/base_instructions.txt`
- `/prompts/gentle_clarity.txt`
- `/prompts/luminous_intensity.txt`
- `/prompts/sacred_fusion.txt`
- `/prompts/creator_context.txt`
- `/prompts/evolution_instructions.txt`

### Key Dependencies

**Runtime Dependencies**:
- `@trpc/server` - NOT YET INSTALLED - Must add to package.json
- `@trpc/client` - NOT YET INSTALLED - Frontend client
- `@trpc/next` - NOT YET INSTALLED - Next.js adapter (if using Next.js)
- `zod` - NOT YET INSTALLED - Schema validation
- `@supabase/supabase-js` - Database client (already installed)
- `jsonwebtoken` - JWT handling (already installed)
- `bcryptjs` - Password hashing (already installed)
- `stripe` - Payment processing (already installed)
- `@anthropic-ai/sdk` - Claude API (already installed)
- `openai` - GPT-4o API (already installed)

**Development Dependencies**:
- TypeScript - For type safety
- ts-node - For running TypeScript
- @types/node - Node.js types
- @types/jsonwebtoken - JWT types

### Testing Infrastructure

**Recommended Testing Strategy**:

1. **Unit Tests** (Jest + ts-jest):
   - Test individual procedures in isolation
   - Mock Supabase client
   - Mock AI APIs
   - Test validation schemas

2. **Integration Tests**:
   - Test full request/response flow
   - Test authentication context
   - Test database operations
   - Test error handling

3. **E2E Tests** (if available):
   - Test complete user flows
   - Test payment processing
   - Test reflection creation
   - Test evolution report generation

**Testing Priority**:
1. Authentication procedures (CRITICAL)
2. Reflection creation (CRITICAL)
3. Payment operations (HIGH)
4. Webhook handling (HIGH)
5. Evolution reports (MEDIUM)
6. Admin operations (LOW)

## Questions for Planner

### 1. Frontend Framework Decision

**Question**: What frontend framework is being used? React with custom client, Next.js, or something else?

**Why**: The tRPC adapter depends on the framework:
- Next.js: Use `@trpc/next`
- React (Vite): Use `@trpc/client` with React Query
- Vanilla: Use `@trpc/client` directly

**Impact**: Determines client setup and API route structure

### 2. Monorepo vs Separate Repos

**Question**: Should frontend and backend types live in the same repository?

**Why**: tRPC works best with shared types. Options:
- Monorepo: Types automatically shared (recommended)
- Separate repos: Need to publish type package or use git submodules

**Impact**: Affects type synchronization strategy

### 3. Migration Timeline

**Question**: Can we do gradual migration or must it be all-at-once?

**Why**: 
- Gradual: Safer, but maintains dual systems temporarily
- All-at-once: Faster, but higher risk

**Recommendation**: Gradual migration with rollback plan

### 4. Database Schema Changes

**Question**: Can we modify the database schema during migration?

**Why**: Some optimizations might require schema changes:
- Adding indexes for new query patterns
- Renaming columns for consistency
- Adding composite keys

**Impact**: Affects migration complexity and rollback strategy

### 5. Error Logging and Monitoring

**Question**: What error tracking system is in place? Sentry, LogRocket, etc.?

**Why**: Need to ensure tRPC errors are properly captured and reported

**Impact**: May need custom error formatting middleware

### 6. API Versioning Strategy

**Question**: Should we version the API during migration?

**Why**: 
- Version 1: Legacy Express endpoints
- Version 2: New tRPC endpoints

**Impact**: Determines URL structure and client configuration

### 7. Development Environment

**Question**: How are local development environments set up?

**Why**: Need to ensure tRPC works locally with:
- Local database
- Mock Stripe webhooks
- AI API keys

**Impact**: May need updates to dev scripts and documentation

## Implementation Checklist

### Pre-Migration Setup

- [ ] Install tRPC dependencies (`@trpc/server`, `@trpc/client`, `zod`)
- [ ] Install TypeScript if not already present
- [ ] Create `/server/trpc/` directory structure
- [ ] Set up TypeScript configuration
- [ ] Create shared types directory (`/types/`)

### Phase 1: Foundation (Authentication)

- [ ] Create tRPC instance configuration
- [ ] Create context with JWT verification
- [ ] Create protected procedure middleware
- [ ] Migrate auth router (signup, signin, etc.)
- [ ] Update frontend auth client
- [ ] Test authentication flow end-to-end

### Phase 2: Core Features

- [ ] Migrate reflections router
- [ ] Migrate reflection AI generation
- [ ] Migrate users router
- [ ] Update frontend API calls
- [ ] Test reflection creation and retrieval

### Phase 3: Advanced Features

- [ ] Migrate evolution router
- [ ] Migrate artifact router
- [ ] Migrate payment router (non-webhook operations)
- [ ] Migrate subscriptions router
- [ ] Test all advanced features

### Phase 4: Administration & Cleanup

- [ ] Migrate admin router
- [ ] Migrate creator auth
- [ ] Remove all gift-related code
- [ ] Drop gift database tables
- [ ] Update documentation
- [ ] Remove old Express endpoints

### Post-Migration Validation

- [ ] All API calls use tRPC
- [ ] Type safety verified
- [ ] Error handling tested
- [ ] Webhooks still working
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Rollback plan documented

---

**Explorer-2 Sign-off**: Backend API structure fully analyzed. Ready for tRPC migration planning. Gift feature removal dependencies documented. Type safety opportunities identified.
