# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Security Analysis & Hardening Requirements

## Vision Summary
Transform Mirror of Dreams from a 6.5/10 security rating to a 9/10 production-hardened system by migrating JWT to httpOnly cookies, activating rate limiting, implementing CSRF protection, and replacing environment variable admin authentication with proper RBAC.

---

## Current Security Assessment

### 1. JWT Implementation Analysis

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`

**Current Implementation:**
- JWT tokens are generated using `jsonwebtoken` library
- Secret stored in `JWT_SECRET` environment variable
- Token expiry: 30 days (`JWT_EXPIRY_DAYS = 30`)
- Demo users get 7-day tokens
- Password hashing: bcrypt with cost factor 12

**JWT Payload Structure:**
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  isCreator: boolean;
  isAdmin: boolean;
  isDemo?: boolean;
  iat: number;
  exp: number;
}
```

**Token Verification:**
- Server extracts token from `Authorization: Bearer {token}` header
- Located in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts`
- Fresh user data is fetched from database on each request (good practice)

### 2. JWT Storage Analysis (CRITICAL VULNERABILITY)

**Finding: JWT tokens are stored in localStorage - VULNERABLE TO XSS**

**All locations where JWT is stored:**

| File | Key Used | Line |
|------|----------|------|
| `/components/providers/TRPCProvider.tsx` | `token` | 31 |
| `/app/auth/signin/page.tsx` | `token` | 37 |
| `/app/auth/signup/page.tsx` | `authToken` | 43 |
| `/app/profile/page.tsx` | `mirror_auth_token` | 81, 108 |
| `/components/landing/LandingHero.tsx` | `token` | 36 |
| `/app/clarify/[sessionId]/page.tsx` | `token` | 185 |

**Critical Issues:**
1. **Inconsistent key names** - Three different localStorage keys: `token`, `authToken`, `mirror_auth_token`
2. **XSS vulnerability** - Any XSS attack can read tokens from localStorage
3. **No secure/httpOnly protection** - Tokens accessible via JavaScript

### 3. tRPC Authentication Context

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts`

**Current Flow:**
```
Request -> Extract Bearer token from header -> Verify JWT -> Fetch user from DB -> Set ctx.user
```

**Middleware Chain:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`

| Middleware | Purpose |
|------------|---------|
| `isAuthed` | Requires authenticated user |
| `isCreatorOrAdmin` | Requires creator or admin role |
| `isPremium` | Requires paid tier |
| `checkUsageLimit` | Enforces reflection limits |
| `notDemo` | Blocks demo users from destructive ops |
| `checkClarifyAccess` | Clarify feature access control |
| `checkClarifySessionLimit` | Clarify session limits |

**Exported Procedures:**
- `protectedProcedure` - Requires auth
- `creatorProcedure` - Requires creator/admin
- `premiumProcedure` - Requires auth + premium
- `usageLimitedProcedure` - Auth + not demo + usage check
- `writeProcedure` - Auth + not demo

### 4. Rate Limiting Analysis

**Finding: NO rate limiting exists**

- Searched for `rate.?limit`, `rateLimit`, `RATE_LIMIT` patterns
- No matches found in application code
- No middleware implementing rate limiting
- tRPC routes are unprotected against brute force attacks

**Critical Endpoints Needing Rate Limiting:**

| Endpoint | Risk | Recommended Limit |
|----------|------|-------------------|
| `auth.signin` | Brute force | 5/minute per IP |
| `auth.signup` | Account spam | 3/minute per IP |
| `auth.loginDemo` | Abuse | 10/minute per IP |
| `forgot-password` | Email spam | 3/minute per IP |
| `reset-password` | Brute force | 5/minute per IP |
| `reflection.create` | AI cost abuse | 10/minute per user |
| `clarify/stream` | AI cost abuse | 20/minute per user |
| All write operations | General abuse | 30/minute per user |

### 5. Admin Security Analysis

**Current Implementation:**

**Admin Router:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/admin.ts`

**Two-Layer Authentication:**

1. **User-based:** `creatorProcedure` middleware checks `ctx.user.isCreator` or `ctx.user.isAdmin`
2. **Secret-based:** Separate `admin.authenticate` endpoint accepts `CREATOR_SECRET_KEY` env var

**Environment Variable Auth (Lines 12-29):**
```typescript
authenticate: publicProcedure
  .input(adminCreatorAuthSchema)
  .mutation(async ({ input }) => {
    if (input.creatorSecret === process.env.CREATOR_SECRET_KEY) {
      return { success: true, authenticated: true };
    }
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }),
```

**Admin Page Protection:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/admin/page.tsx`
- Client-side check only: redirects if `!user?.isAdmin && !user?.isCreator`
- No server-side route protection

**Database Schema:**
- `is_admin BOOLEAN DEFAULT FALSE`
- `is_creator BOOLEAN DEFAULT FALSE`
- No roles table, no permissions table

### 6. CSRF Protection Analysis

**Finding: NO CSRF protection exists**

- Searched for `csrf`, `CSRF`, `xsrf`, `XSRF` patterns
- No matches found
- State-changing operations (POST/PUT/DELETE) are unprotected
- tRPC mutations are vulnerable to CSRF attacks

**Mitigating Factor:** JWT in Authorization header (not cookies) provides some protection since browsers don't automatically send custom headers. However, this breaks when migrating to cookies.

### 7. Other Security Observations

**Good Practices Found:**
- Password reset prevents email enumeration (always returns success)
- Password reset tokens are invalidated after use
- Old tokens cleaned up when new reset requested
- bcrypt with cost factor 12 for passwords
- Password strength requirements enforced
- PayPal webhook signature verification

**Security Headers:** None configured in `next.config.js`

**Missing Security Headers:**
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- Referrer-Policy

---

## JWT Cookie Migration Analysis

### Current Token Flow

```
1. User authenticates -> Server generates JWT
2. JWT returned in response body -> Client stores in localStorage
3. Client requests -> Reads from localStorage -> Adds Authorization header
4. Server reads Authorization header -> Verifies JWT
```

### Required Changes for httpOnly Cookies

**Server-Side Changes:**

1. **Auth Router (`/server/trpc/routers/auth.ts`):**
   - Replace `return { token }` with `Set-Cookie` header
   - Cookie flags: `httpOnly`, `secure`, `sameSite: 'strict'`, `path: '/'`
   - Max-age: 30 days (matching current JWT expiry)

2. **Context (`/server/trpc/context.ts`):**
   - Extract token from cookies instead of Authorization header
   - Parse `req.cookies.get('auth_token')`

3. **Clarify Stream (`/app/api/clarify/stream/route.ts`):**
   - Read token from cookies instead of Authorization header
   - Currently reads: `request.headers.get('authorization')`

4. **Signout Endpoint:**
   - Must clear cookie with `Set-Cookie` and max-age=0

**Client-Side Changes:**

| File | Changes Required |
|------|------------------|
| `TRPCProvider.tsx` | Remove localStorage read, remove Authorization header |
| `signin/page.tsx` | Remove localStorage.setItem |
| `signup/page.tsx` | Remove localStorage.setItem |
| `profile/page.tsx` | Remove localStorage operations |
| `LandingHero.tsx` | Remove localStorage.setItem |
| `clarify/[sessionId]/page.tsx` | Remove localStorage.getItem, rely on cookies |

**Token Refresh Strategy:**

Since httpOnly cookies cannot be read by JavaScript:
1. Add `/api/auth/refresh` endpoint
2. Endpoint reads cookie, validates, issues new cookie if close to expiry
3. Call refresh on app mount and periodically
4. Silent refresh before operations (optional)

**Auth State Management:**

Since client cannot read token:
1. Add `/api/auth/me` endpoint (or use existing `verifyToken`)
2. Store user info (not token) in React state/context
3. Rely on cookie being sent automatically with requests
4. Check auth status via API call, not token presence

### Migration Risk Assessment

**Risk Level: MEDIUM-HIGH**

**Risks:**
1. **Session invalidation** - All existing sessions will be logged out
2. **Cross-subdomain issues** - If multiple subdomains, need careful cookie domain config
3. **CORS complexity** - credentials: 'include' required for cross-origin
4. **SSR considerations** - Next.js server components need cookie forwarding
5. **Backward compatibility** - During rollout, both methods may coexist

**Mitigations:**
1. Announce maintenance window for session reset
2. Test thoroughly in staging with production-like setup
3. Implement graceful fallback during migration
4. Clear rollback plan if issues arise

---

## Rate Limiting Implementation Plan

### Recommended Approach

**Library:** `rate-limiter-flexible` with Redis backend (or in-memory for MVP)

### Configuration by Endpoint Type

```typescript
// High-security endpoints (auth)
const authLimiter = {
  points: 5,       // 5 attempts
  duration: 60,    // per 60 seconds
  blockDuration: 300, // block for 5 min after limit
};

// Write operations
const writeLimiter = {
  points: 30,
  duration: 60,
  keyPrefix: 'write',
};

// AI operations (expensive)
const aiLimiter = {
  points: 10,
  duration: 60,
  keyPrefix: 'ai',
};

// General read operations
const readLimiter = {
  points: 100,
  duration: 60,
  keyPrefix: 'read',
};
```

### Implementation Locations

1. **tRPC Middleware** - Create `rateLimitMiddleware.ts`
2. **API Routes** - Wrap standalone routes with limiter
3. **Response Headers** - Add `X-RateLimit-*` headers

### Key Strategy

- **Unauthenticated:** IP-based limiting
- **Authenticated:** User ID-based limiting (more lenient)
- **Admin:** No limits or very high limits

---

## Admin Security Recommendations

### Phase 1: Consolidate Existing

1. Remove `CREATOR_SECRET_KEY` environment variable auth
2. Keep only user-based `isAdmin`/`isCreator` checks
3. All admin operations must go through authenticated user context

### Phase 2: RBAC Implementation

**New Database Schema:**

```sql
-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,  -- e.g., 'users', 'reflections', 'admin'
    action TEXT NOT NULL     -- e.g., 'read', 'write', 'delete'
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- User-Role mapping
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
```

**Default Roles:**
- `super_admin` - Full access
- `admin` - User management, read analytics
- `support` - Read user data, no modifications
- `user` - Standard user access

**Migration from Boolean Flags:**
```sql
-- Create roles
INSERT INTO roles (name) VALUES ('super_admin'), ('admin'), ('user');

-- Migrate existing admins
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.is_admin = true AND r.name = 'super_admin';

-- Migrate existing creators
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.is_creator = true AND r.name = 'admin';
```

---

## Complexity Assessment

### JWT Cookie Migration

**Complexity: HIGH**
- Touches 7+ files across frontend and backend
- Requires session invalidation
- Changes fundamental auth flow
- Testing complexity: need to verify all auth paths
- Estimated time: 4-6 hours

### Rate Limiting

**Complexity: MEDIUM**
- New middleware to create
- Configuration decisions needed
- Redis setup if production-grade
- Estimated time: 2-3 hours (in-memory) or 4-5 hours (Redis)

### CSRF Protection

**Complexity: MEDIUM**
- Only needed after cookie migration
- Must integrate with tRPC flow
- Token generation and validation logic
- Estimated time: 2-3 hours

### Admin RBAC

**Complexity: HIGH**
- Database schema changes
- Data migration needed
- Middleware updates
- Admin UI updates possible
- Estimated time: 6-8 hours for full RBAC

---

## Recommended Iteration Split

### Recommendation: MULTI-ITERATION (2-3 iterations)

### Suggested Approach

**Iteration 1: Foundation Security (Critical)**
- **Focus:** JWT Cookie Migration + Rate Limiting
- **Risk:** HIGH (auth flow change)
- **Duration:** 6-8 hours
- **Success Criteria:**
  - JWT stored in httpOnly secure cookies
  - All localStorage token storage removed
  - Rate limiting active on auth endpoints
  - Existing users must re-authenticate

**Iteration 2: Protection Layer**
- **Focus:** CSRF Protection + Security Headers + Admin Consolidation
- **Risk:** MEDIUM
- **Duration:** 4-5 hours
- **Dependencies:** Requires Iteration 1 (CSRF needs cookies)
- **Success Criteria:**
  - CSRF tokens on all mutations
  - Security headers configured
  - CREATOR_SECRET_KEY auth removed

**Iteration 3 (Optional): Full RBAC**
- **Focus:** Complete role-based access control
- **Risk:** MEDIUM
- **Duration:** 6-8 hours
- **Dependencies:** Can wait until needed
- **Success Criteria:**
  - Roles and permissions tables
  - User-role assignments
  - Permission-based middleware
  - Boolean flags deprecated

---

## Dependency Graph

```
JWT Cookie Migration (Iteration 1)
|
+-- Client-side changes (TRPCProvider, auth pages)
|   |
|   +-- Remove localStorage operations
|   +-- Update auth state management
|
+-- Server-side changes (context, auth router)
|   |
|   +-- Cookie set/read logic
|   +-- Token refresh endpoint
|
+-- CSRF Protection (Iteration 2)
    |
    +-- Depends on: Cookie-based auth
    +-- Token generation middleware
    +-- Client header integration

Rate Limiting (Iteration 1)
|
+-- No dependencies, can run parallel
+-- New middleware
+-- Configuration per endpoint type

Admin Security (Iteration 2-3)
|
+-- Remove env var auth (Iteration 2)
+-- Full RBAC (Iteration 3, optional)
    |
    +-- Database migrations
    +-- Data migration
    +-- Middleware updates
```

---

## Risk Assessment

### High Risks

1. **JWT Migration Session Disruption**
   - **Impact:** All users logged out immediately
   - **Mitigation:** Announce maintenance, clear communication
   - **Recommendation:** Tackle in Iteration 1, accept the disruption

2. **Auth Flow Regression**
   - **Impact:** Users unable to authenticate
   - **Mitigation:** Extensive testing in staging, rollback plan ready
   - **Recommendation:** Have feature flag to revert to localStorage if needed

### Medium Risks

1. **Rate Limiting False Positives**
   - **Impact:** Legitimate users blocked
   - **Mitigation:** Start with generous limits, monitor, adjust
   - **Recommendation:** Log all rate limit hits for analysis

2. **CSRF Token Mismatch**
   - **Impact:** Form submissions fail
   - **Mitigation:** Clear error messages, token refresh on 403
   - **Recommendation:** Test all mutation flows

### Low Risks

1. **Security Header Compatibility**
   - **Impact:** Minor browser compatibility issues
   - **Mitigation:** Use well-tested header values
   - **Recommendation:** Progressive enhancement

---

## Integration Considerations

### Cross-Phase Integration Points

1. **Cookie + CSRF Dependency**
   - CSRF protection only makes sense after cookies are implemented
   - Must be in same or later iteration

2. **Rate Limiting + Monitoring**
   - Rate limit data should feed into Sentry/monitoring (Plan 19 Priority 3)
   - Coordinate with error monitoring setup

3. **Admin RBAC + Testing**
   - RBAC changes need integration tests (Plan 19 Priority 1)
   - May want to defer full RBAC until testing infrastructure exists

### Potential Integration Challenges

1. **tRPC + Cookies**
   - Need to ensure cookie credentials are properly forwarded
   - `credentials: 'include'` in tRPC client config

2. **SSR + Cookies**
   - Server components need cookie access via Next.js cookies() API
   - May need middleware for protected server components

3. **Streaming API + Cookies**
   - `/api/clarify/stream` uses raw fetch, needs credentials option

---

## Recommendations for Master Plan

1. **Prioritize JWT Migration First**
   - This is the highest-impact security improvement
   - Accept the user disruption cost
   - Implement rate limiting in same iteration for defense-in-depth

2. **Defer Full RBAC**
   - Current boolean flags work fine for now
   - Only implement RBAC if you need granular permissions
   - Focus consolidation efforts on removing CREATOR_SECRET_KEY

3. **Add Security Headers Early**
   - Low effort, high value
   - Can be done in any iteration
   - Consider adding in Iteration 2 with CSRF

4. **Coordinate with Testing Infrastructure**
   - Security changes need solid test coverage
   - Consider sequencing security work after basic test setup

5. **Prepare User Communication**
   - Users will be logged out after JWT migration
   - Prepare email/in-app notification
   - Consider timing (off-peak hours)

---

## Technology Recommendations

### Libraries to Add

| Library | Purpose | Why |
|---------|---------|-----|
| `rate-limiter-flexible` | Rate limiting | Flexible, multiple backends |
| `csurf` or `csrf-csrf` | CSRF tokens | Well-tested, maintained |
| `next-secure-headers` | Security headers | Next.js optimized |

### Configuration Changes

**next.config.js additions:**
```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ];
}
```

---

## Files Requiring Changes Summary

### Iteration 1: JWT + Rate Limiting

| File | Change Type |
|------|-------------|
| `/server/trpc/context.ts` | Cookie reading |
| `/server/trpc/routers/auth.ts` | Cookie setting |
| `/components/providers/TRPCProvider.tsx` | Remove localStorage |
| `/app/auth/signin/page.tsx` | Remove localStorage |
| `/app/auth/signup/page.tsx` | Remove localStorage |
| `/app/profile/page.tsx` | Remove localStorage |
| `/components/landing/LandingHero.tsx` | Remove localStorage |
| `/app/clarify/[sessionId]/page.tsx` | Use cookie credentials |
| `/app/api/clarify/stream/route.ts` | Cookie reading |
| `/server/trpc/middleware.ts` (new) | Rate limit middleware |
| `/app/api/auth/refresh/route.ts` (new) | Token refresh |

### Iteration 2: CSRF + Headers + Admin

| File | Change Type |
|------|-------------|
| `/next.config.js` | Security headers |
| `/server/trpc/middleware.ts` | CSRF middleware |
| `/components/providers/TRPCProvider.tsx` | CSRF header |
| `/server/trpc/routers/admin.ts` | Remove secret auth |
| Various API routes | CSRF validation |

---

## Notes & Observations

1. **Token Key Inconsistency** - Three different localStorage keys exist (`token`, `authToken`, `mirror_auth_token`). This should be consolidated regardless of security hardening.

2. **Demo User Security** - Demo users are well-protected with `notDemo` middleware, but demo login has no rate limiting, making it a potential abuse vector.

3. **PayPal Webhook Security** - Well implemented with signature verification and idempotency checks. No changes needed.

4. **Email Enumeration Prevention** - Forgot password correctly prevents enumeration. Good existing practice.

5. **Password Requirements** - Reset password has requirements (8+ chars, uppercase, lowercase, number) but signup only requires 6 chars. Should standardize.

---

*Exploration completed: 2025-12-10*
*This report informs master planning decisions for Plan 19: Technical Hardening*
