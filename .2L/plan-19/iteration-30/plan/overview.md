# Iteration 30: Security Hardening - Overview

**Created:** 2025-12-10
**Plan:** 19
**Iteration:** 30

---

## Executive Summary

This iteration addresses critical security vulnerabilities in the Mirror of Dreams authentication system and implements comprehensive rate limiting to protect against abuse. The work is divided among 4 builders, each handling a specific domain of the security hardening effort.

### Critical Issues to Address

1. **localStorage Token Fragmentation (CRITICAL)**
   - 3 different localStorage keys being used inconsistently:
     - `signin/page.tsx` uses `'token'`
     - `signup/page.tsx` uses `'authToken'`
     - `profile/page.tsx` uses `'mirror_auth_token'`
   - Result: Users who sign up cannot authenticate until they sign in again

2. **Logout Not Clearing Tokens (CRITICAL)**
   - `AppNavigation.tsx` handleLogout does NOT clear localStorage
   - Token persists after "logout" - security vulnerability

3. **No Rate Limiting (HIGH)**
   - Zero rate limiting on any endpoints
   - Auth endpoints vulnerable to brute-force attacks
   - AI endpoints vulnerable to cost attacks

---

## Goals

1. Migrate JWT tokens from localStorage to HTTP-only cookies
2. Implement rate limiting using Upstash Ratelimit
3. Add security headers via next.config.js
4. Create security tests for auth and rate limiting

---

## Builder Task Distribution

### Builder 1: JWT Cookie Infrastructure
**Scope:** Server-side cookie setting and reading
- Modify `server/trpc/context.ts` - Read token from cookies (with header fallback)
- Modify `server/trpc/routers/auth.ts` - Set HTTP-only cookies on auth success
- Create cookie utility functions for consistent handling

### Builder 2: Client Auth Cleanup
**Scope:** Remove localStorage usage, fix logout
- Modify `components/providers/TRPCProvider.tsx` - Remove localStorage, add credentials: 'include'
- Modify `app/auth/signin/page.tsx` - Remove localStorage.setItem
- Modify `app/auth/signup/page.tsx` - Remove localStorage.setItem
- Modify `app/profile/page.tsx` - Remove all localStorage token operations
- Modify `components/landing/LandingHero.tsx` - Remove localStorage.setItem
- Modify `components/shared/AppNavigation.tsx` - Call signout mutation on logout

### Builder 3: Rate Limiting
**Scope:** Implement rate limiting infrastructure
- Create `server/lib/rate-limiter.ts` - Upstash Ratelimit configuration
- Create `server/lib/api-rate-limit.ts` - Next.js API route helper
- Modify `server/trpc/middleware.ts` - Add rate limit middlewares
- Modify auth router to use rate-limited procedures
- Modify Next.js auth routes to use rate limiting

### Builder 4: Security Headers & Tests
**Scope:** Security headers and comprehensive tests
- Modify `next.config.js` - Add security headers
- Create auth tests for cookie-based authentication
- Create rate limiting tests
- Update `.env.example` with rate limit variables

---

## Dependencies Between Builders

```
Builder 1 (JWT Cookie Infrastructure)
    |
    +---> Builder 2 (Client Auth Cleanup)
              |
              v
         [No blocking dependency]

Builder 3 (Rate Limiting)
    |
    +---> Builder 4 (Security Headers & Tests)

Note: Builders 1-2 and Builders 3-4 can work in parallel
```

### Dependency Details

1. **Builder 2 depends on Builder 1:**
   - Builder 1 must set cookies on auth success before Builder 2 can remove localStorage
   - Builder 2's TRPCProvider changes require Builder 1's context.ts to read cookies

2. **Builder 4 depends on Builder 3:**
   - Builder 4's rate limiting tests require Builder 3's rate limiter to exist

3. **Parallel Tracks:**
   - Track A: Builder 1 -> Builder 2 (Cookie Migration)
   - Track B: Builder 3 -> Builder 4 (Rate Limiting)
   - These tracks are independent and can run in parallel

---

## Success Criteria

### Security

- [ ] No tokens stored in localStorage after migration
- [ ] Logout clears authentication cookie
- [ ] Auth endpoints protected by rate limiting (5/min per IP)
- [ ] AI endpoints protected by rate limiting (10/min per user)
- [ ] Security headers prevent XSS, clickjacking, MIME sniffing

### Functionality

- [ ] Users can sign up and are immediately authenticated
- [ ] Users can sign in and access protected routes
- [ ] Demo login works correctly
- [ ] Logout properly terminates session
- [ ] SSE streaming (Clarify) works with cookie auth

### Testing

- [ ] Auth flow tests pass with cookie-based auth
- [ ] Rate limiting tests verify limits work
- [ ] No TypeScript errors
- [ ] Existing tests still pass

---

## Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing users have tokens in localStorage | Users lose auth after migration | Dual-read: check cookie first, fallback to header during transition |
| SSE endpoint uses Authorization header | Clarify feature breaks | Builder 1 updates stream route alongside context.ts |
| Rate limiter Redis unavailable | All requests blocked | Graceful fallback: allow request if Redis fails |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cookie not sent on SSR | Server-side rendering fails auth | Use credentials: 'include' and verify Next.js cookie handling |
| Cross-origin requests | External integrations may fail | Verify SameSite setting, add CORS headers if needed |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cookie size | JWT payload is small (~500 bytes) | No action needed |
| Rate limit too aggressive | Legitimate users blocked | Conservative limits, skip for creator/admin |

---

## Transition Strategy

### Phase 1: Server-Side Cookie Setting (Builder 1)
- Add cookie setting alongside existing token return
- Allows backward compatibility during transition

### Phase 2: Server-Side Cookie Reading (Builder 1)
- Read from cookie first, fallback to Authorization header
- Ensures existing users remain authenticated

### Phase 3: Client-Side Cleanup (Builder 2)
- Remove localStorage writes
- Add credentials: 'include' to fetch
- Update logout to call signout mutation

### Phase 4: Rate Limiting (Builder 3)
- Create rate limiter infrastructure
- Apply to auth endpoints first (highest priority)
- Apply to AI endpoints second

### Phase 5: Security Headers & Tests (Builder 4)
- Add security headers to next.config.js
- Create comprehensive tests
- Document security measures

---

## Files Summary

### Created Files
- `/server/lib/rate-limiter.ts` (Builder 3)
- `/server/lib/api-rate-limit.ts` (Builder 3)
- `/server/lib/cookies.ts` (Builder 1)
- `/tests/auth-cookies.test.ts` (Builder 4)
- `/tests/rate-limiting.test.ts` (Builder 4)

### Modified Files
- `/server/trpc/context.ts` (Builder 1)
- `/server/trpc/routers/auth.ts` (Builder 1)
- `/app/api/clarify/stream/route.ts` (Builder 1)
- `/components/providers/TRPCProvider.tsx` (Builder 2)
- `/app/auth/signin/page.tsx` (Builder 2)
- `/app/auth/signup/page.tsx` (Builder 2)
- `/app/profile/page.tsx` (Builder 2)
- `/components/landing/LandingHero.tsx` (Builder 2)
- `/components/shared/AppNavigation.tsx` (Builder 2)
- `/server/trpc/middleware.ts` (Builder 3)
- `/app/api/auth/forgot-password/route.ts` (Builder 3)
- `/app/api/auth/reset-password/route.ts` (Builder 3)
- `/app/api/auth/send-verification/route.ts` (Builder 3)
- `/next.config.js` (Builder 4)
- `/.env.example` (Builder 4)

---

## Notes for Integration

1. **Cookie Name:** Use `auth_token` as the canonical cookie name
2. **Demo Users:** Cookie expiry should match JWT expiry (7 days for demo, 30 days for regular)
3. **Transition Period:** Keep header fallback for 1 release cycle, then remove
4. **Testing:** Manual testing required for mobile browsers (iOS Safari, Android Chrome)

---

**Plan Status:** Ready for builders
**Estimated Effort:** 4-6 hours total across all builders
