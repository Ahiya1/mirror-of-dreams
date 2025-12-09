# Explorer 1 Report: Security Hardening - Authentication & JWT Analysis

## Executive Summary

The current authentication system uses JWT tokens stored in localStorage with Bearer token authentication via Authorization headers. **CRITICAL ISSUE FOUND:** There are **3 different localStorage key names** being used inconsistently (`token`, `authToken`, `mirror_auth_token`), which creates authentication fragmentation. Migration to HTTP-only cookies will consolidate this and improve security against XSS attacks.

## Current Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT AUTHENTICATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐                                                              │
│   │   User       │                                                              │
│   │   Signup     │                                                              │
│   └──────┬───────┘                                                              │
│          │                                                                       │
│          ▼                                                                       │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  POST /api/trpc/auth.signup                                              │  │
│   │  ├─ Validate input (zod: signupSchema)                                   │  │
│   │  ├─ Check existing user                                                  │  │
│   │  ├─ Hash password (bcrypt, 12 rounds)                                    │  │
│   │  ├─ Create user in Supabase                                              │  │
│   │  ├─ Generate JWT (30-day expiry)                                         │  │
│   │  ├─ Send verification email                                              │  │
│   │  └─ Return { user, token }                                               │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│          │                                                                       │
│          ▼                                                                       │
│   ┌────────────────────────────────────────────┐                                │
│   │  CLIENT: localStorage.setItem('authToken', │  ◄── ISSUE: Uses 'authToken'  │
│   │          data.token)                       │                                │
│   │  Redirect to /auth/verify-required         │                                │
│   └────────────────────────────────────────────┘                                │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐                                                              │
│   │   User       │                                                              │
│   │   Signin     │                                                              │
│   └──────┬───────┘                                                              │
│          │                                                                       │
│          ▼                                                                       │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  POST /api/trpc/auth.signin                                              │  │
│   │  ├─ Validate input (zod: signinSchema)                                   │  │
│   │  ├─ Fetch user by email                                                  │  │
│   │  ├─ Verify password (bcrypt)                                             │  │
│   │  ├─ Check/reset monthly counters                                         │  │
│   │  ├─ Generate JWT (30-day expiry)                                         │  │
│   │  └─ Return { user, token }                                               │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│          │                                                                       │
│          ▼                                                                       │
│   ┌────────────────────────────────────────────┐                                │
│   │  CLIENT: localStorage.setItem('token',     │  ◄── ISSUE: Uses 'token'      │
│   │          data.token)                       │                                │
│   │  Redirect to /dashboard                    │                                │
│   └────────────────────────────────────────────┘                                │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐                                                              │
│   │  Subsequent  │                                                              │
│   │  API Calls   │                                                              │
│   └──────┬───────┘                                                              │
│          │                                                                       │
│          ▼                                                                       │
│   ┌────────────────────────────────────────────┐                                │
│   │  TRPCProvider.tsx:                         │                                │
│   │  headers() {                               │                                │
│   │    const token = localStorage.getItem(     │  ◄── Reads 'token' ONLY       │
│   │      'token');                             │                                │
│   │    return token ?                          │                                │
│   │      { Authorization: `Bearer ${token}` }  │                                │
│   │      : {};                                 │                                │
│   │  }                                         │                                │
│   └────────────────────────────────────────────┘                                │
│          │                                                                       │
│          ▼                                                                       │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  server/trpc/context.ts:                                                 │  │
│   │  ├─ Extract token from Authorization header                              │  │
│   │  ├─ jwt.verify(token, JWT_SECRET)                                        │  │
│   │  ├─ Fetch fresh user from database                                       │  │
│   │  ├─ Check/reset monthly counters                                         │  │
│   │  └─ Return { user } context                                              │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐                                                              │
│   │   Demo       │                                                              │
│   │   Login      │                                                              │
│   └──────┬───────┘                                                              │
│          │                                                                       │
│          ▼                                                                       │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  POST /api/trpc/auth.loginDemo                                           │  │
│   │  ├─ Fetch demo user (is_demo = true)                                     │  │
│   │  ├─ Generate JWT (7-day expiry for demo)                                 │  │
│   │  └─ Return { user, token }                                               │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│          │                                                                       │
│          ▼                                                                       │
│   ┌────────────────────────────────────────────────────────────────────────────┐│
│   │  LandingHero.tsx & CLIENT: localStorage.setItem('token', token) ◄─ 'token'││
│   └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Discoveries

### 1. localStorage Token Key Inconsistencies (CRITICAL)

| File | Operation | Key Used | Notes |
|------|-----------|----------|-------|
| `app/auth/signin/page.tsx:38` | setItem | `'token'` | Signin uses 'token' |
| `app/auth/signup/page.tsx:44` | setItem | `'authToken'` | Signup uses 'authToken' (DIFFERENT!) |
| `app/profile/page.tsx:82` | setItem | `'mirror_auth_token'` | Email change uses 'mirror_auth_token' |
| `app/profile/page.tsx:109` | removeItem | `'mirror_auth_token'` | Delete account removes 'mirror_auth_token' |
| `components/providers/TRPCProvider.tsx:32` | getItem | `'token'` | TRPC reads 'token' only |
| `components/landing/LandingHero.tsx:37` | setItem | `'token'` | Demo login uses 'token' |
| `app/clarify/[sessionId]/page.tsx:192` | getItem | `'token'` | Clarify streaming reads 'token' |

**Impact:** Users who sign up will have their token stored as `authToken` but the TRPC provider reads `token`. This means **newly signed-up users cannot authenticate** until they sign in again (which stores as `token`).

### 2. JWT Configuration

| Setting | Value | Location |
|---------|-------|----------|
| JWT Secret | `process.env.JWT_SECRET` | Multiple files |
| Standard Expiry | 30 days | `server/trpc/routers/auth.ts:30` |
| Demo Expiry | 7 days | `server/trpc/routers/auth.ts:399` |
| Hashing | bcrypt, 12 rounds | `server/trpc/routers/auth.ts:52` |

### 3. JWT Payload Structure

```typescript
// types/user.ts:67
interface JWTPayload {
  userId: string;
  email: string;
  tier: SubscriptionTier;  // 'free' | 'pro' | 'unlimited'
  isCreator: boolean;
  isAdmin: boolean;
  isDemo?: boolean;
  iat: number;  // issued at
  exp: number;  // expiration
}
```

### 4. Server-Side Token Reading Locations

| File | Method | Purpose |
|------|--------|---------|
| `server/trpc/context.ts:18` | `req.headers.get('authorization')?.replace('Bearer ', '')` | TRPC context creation |
| `app/api/clarify/stream/route.ts:101-102` | `request.headers.get('authorization')?.replace('Bearer ', '')` | SSE streaming endpoint |

### 5. Client-Side Token Operations

| Operation | Files |
|-----------|-------|
| **Token SET on auth success** | signin, signup, demo login, email change |
| **Token READ for API calls** | TRPCProvider, clarify streaming |
| **Token REMOVE on logout** | profile (delete account) only |

### 6. Missing Logout Token Cleanup

The `handleLogout` function in `AppNavigation.tsx:78-81` does NOT clear the localStorage token:

```typescript
const handleLogout = useCallback(() => {
  setShowUserDropdown(false);
  router.push('/auth/signin');
  // NO localStorage.removeItem('token') HERE!
}, [router]);
```

This is a security issue - the token persists after "logout".

## Files That Need Modification for Cookie-Based Auth

### Tier 1: Core Auth Infrastructure (MUST CHANGE)

| File | Current Behavior | Required Change |
|------|------------------|-----------------|
| `/server/trpc/context.ts` | Reads Authorization header | Read token from cookies |
| `/components/providers/TRPCProvider.tsx` | Reads localStorage, sets header | Remove localStorage logic, add `credentials: 'include'` |
| `/server/trpc/routers/auth.ts` | Returns token in response body | Set HTTP-only cookie instead |

### Tier 2: Auth Pages (MUST CHANGE)

| File | Current Behavior | Required Change |
|------|------------------|-----------------|
| `/app/auth/signin/page.tsx` | `localStorage.setItem('token', ...)` | Remove localStorage, server sets cookie |
| `/app/auth/signup/page.tsx` | `localStorage.setItem('authToken', ...)` | Remove localStorage, server sets cookie |
| `/components/landing/LandingHero.tsx` | `localStorage.setItem('token', ...)` | Remove localStorage, server sets cookie |

### Tier 3: API Routes with Direct Token Access (MUST CHANGE)

| File | Current Behavior | Required Change |
|------|------------------|-----------------|
| `/app/api/clarify/stream/route.ts` | Reads Authorization header | Read token from cookies |

### Tier 4: Profile & Account (MUST CHANGE)

| File | Current Behavior | Required Change |
|------|------------------|-----------------|
| `/app/profile/page.tsx` | Sets/removes 'mirror_auth_token' | Remove localStorage, server handles cookies |

### Tier 5: Logout/Signout (NEW FUNCTIONALITY)

| File | Current Behavior | Required Change |
|------|------------------|-----------------|
| `/components/shared/AppNavigation.tsx` | No token cleanup | Call server-side logout to clear cookie |
| `/server/trpc/routers/auth.ts` (signout) | Returns success only | Clear HTTP-only cookie |

### Tier 6: Auth Hook (MAY NEED UPDATES)

| File | Current Behavior | Required Change |
|------|------------------|-----------------|
| `/hooks/useAuth.ts` | Uses trpc.users.getProfile | Verify works with cookie auth |

## Cookie Implementation Recommendations

### 1. Cookie Configuration

```typescript
// Recommended cookie settings for auth token
const COOKIE_OPTIONS = {
  httpOnly: true,        // Prevents XSS access to token
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax',       // CSRF protection while allowing navigation
  path: '/',             // Available on all routes
  maxAge: 60 * 60 * 24 * 30, // 30 days (matches current JWT expiry)
};
```

### 2. Setting Cookie (Server-Side)

```typescript
// In auth.ts signin/signup mutations
import { cookies } from 'next/headers';

// After generating JWT
cookies().set('auth_token', token, COOKIE_OPTIONS);
```

### 3. Reading Cookie (Server-Side)

```typescript
// In context.ts
import { cookies } from 'next/headers';

export async function createContext(opts: FetchCreateContextFnOptions) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  // ... rest of verification
}
```

### 4. TRPC Provider Update

```typescript
// Remove localStorage read, add credentials
httpBatchLink({
  url: '/api/trpc',
  transformer: superjson,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: 'include', // Send cookies with requests
    });
  },
}),
```

### 5. Logout Flow

```typescript
// In auth.ts signout mutation
signout: publicProcedure.mutation(async () => {
  const cookieStore = cookies();
  cookieStore.delete('auth_token');
  return { success: true, message: 'Signed out successfully' };
}),
```

## Risk Assessment for Migration

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Existing users have tokens in localStorage** | Users logged in before migration will lose auth | Dual-read approach: check cookie first, fallback to header during transition |
| **SSE endpoint uses Authorization header** | Clarify feature breaks | Update simultaneously with context.ts |
| **Cookie not sent on SSR** | Server-side rendering fails auth | Use `credentials: 'include'` and ensure cookies module compatibility |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Cross-origin requests** | External integrations may fail | Verify SameSite setting, add CORS headers if needed |
| **Mobile browsers** | Different cookie handling | Test on iOS Safari, Android Chrome |
| **Token refresh** | No refresh token mechanism exists | Consider adding refresh tokens (out of scope for this iteration) |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Cookie size** | JWT payload is small (~500 bytes) | No action needed |
| **Developer experience** | Can't easily view token for debugging | Document how to check auth status |

## Implementation Order Recommendation

1. **Phase 1: Server-Side Cookie Setting** (auth.ts mutations)
   - Add cookie setting alongside existing token return
   - Allows backward compatibility

2. **Phase 2: Server-Side Cookie Reading** (context.ts)
   - Read from cookie first, fallback to Authorization header
   - Ensures existing users remain authenticated

3. **Phase 3: Client-Side Cleanup** (TRPCProvider, auth pages)
   - Remove localStorage writes
   - Add `credentials: 'include'`

4. **Phase 4: SSE Endpoint** (clarify/stream/route.ts)
   - Update to read from cookies
   - Test streaming functionality

5. **Phase 5: Logout Implementation** (AppNavigation, auth.ts)
   - Add proper cookie deletion
   - Test logout flow

6. **Phase 6: Remove Fallbacks** (after transition period)
   - Remove Authorization header reading
   - Remove localStorage fallback

## Resource Map

### Critical Files

| Path | Purpose |
|------|---------|
| `/server/trpc/context.ts` | Request context with JWT verification |
| `/server/trpc/routers/auth.ts` | Auth mutations (signin, signup, signout, demo) |
| `/components/providers/TRPCProvider.tsx` | TRPC client with auth header injection |
| `/app/api/clarify/stream/route.ts` | SSE streaming with direct token access |
| `/types/user.ts` | JWT payload type definition |

### Supporting Files

| Path | Purpose |
|------|---------|
| `/hooks/useAuth.ts` | Client-side auth state management |
| `/app/auth/signin/page.tsx` | Sign in page with token storage |
| `/app/auth/signup/page.tsx` | Sign up page with token storage |
| `/components/landing/LandingHero.tsx` | Demo login with token storage |
| `/app/profile/page.tsx` | Profile with email change token update |
| `/components/shared/AppNavigation.tsx` | Logout button (needs token cleanup) |

### Key Dependencies

| Package | Version (check package.json) | Purpose |
|---------|------------------------------|---------|
| `jsonwebtoken` | - | JWT signing/verification |
| `bcryptjs` | - | Password hashing |
| `@trpc/server` | - | Server-side TRPC |
| `@trpc/client` | - | Client-side TRPC |

## Questions for Planner

1. **Transition Period:** How long should we support dual-read (cookie + header) before removing header support?

2. **Token Naming:** Should we use `auth_token` or `mirror_auth_token` as the cookie name? The codebase has used `mirror_auth_token` in profile.tsx.

3. **Demo Users:** Demo tokens have 7-day expiry vs 30 days for regular users. Should demo cookies have shorter expiry?

4. **Refresh Tokens:** Current implementation has no refresh mechanism. Is this in scope for this iteration or future work?

5. **Test Coverage:** Should we add E2E tests for the auth flow migration, or is manual testing sufficient?

## Summary of Key Findings

1. **3 different localStorage keys** are used inconsistently - signup uses `authToken` while everything else uses `token`
2. **Logout does not clear tokens** - security vulnerability
3. **SSE endpoint has direct token access** - needs separate update from TRPC context
4. **No refresh token mechanism** - tokens expire after 30 days with no renewal
5. **JWT payload is lean** - good for cookie size constraints
6. **Server-side reads are consistent** - all use Authorization header pattern, easy to migrate
