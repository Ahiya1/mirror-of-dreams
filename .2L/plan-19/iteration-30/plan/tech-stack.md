# Iteration 30: Security Hardening - Tech Stack

**Created:** 2025-12-10
**Plan:** 19
**Iteration:** 30

---

## Existing Dependencies (Already Installed)

### Redis Client
```json
"@upstash/redis": "^1.35.0"
```
- Already installed in package.json
- Used for: Session storage, receipts
- Will be extended for: Rate limiting

### JWT
```json
"jsonwebtoken": "^9.0.2"
```
- Already installed
- Used for: Token generation and verification
- No changes needed

### Password Hashing
```json
"bcryptjs": "^3.0.2"
```
- Already installed
- Used for: Password hashing (12 rounds)
- No changes needed

---

## New Dependencies Required

### Upstash Ratelimit

**Package:** `@upstash/ratelimit`
**Version:** `^2.0.0` (latest stable)

**Installation:**
```bash
npm install @upstash/ratelimit
```

**Purpose:**
- Serverless-compatible rate limiting
- Works with existing @upstash/redis
- Sliding window algorithm
- Automatic cleanup (no TTL management)

**Features Used:**
- `Ratelimit.slidingWindow()` - Smooth rate limiting
- Multiple limiters with different prefixes
- Analytics support
- Edge-compatible

**Documentation:** https://upstash.com/docs/oss/sdks/ts/ratelimit/overview

---

## Next.js Cookies API

**Package:** Built-in to Next.js 14
**Module:** `next/headers`

**Usage:**
```typescript
import { cookies } from 'next/headers';

// In Server Components and Route Handlers
const cookieStore = await cookies();
cookieStore.set('name', 'value', options);
cookieStore.get('name');
cookieStore.delete('name');
```

**Note:** In Next.js 14, `cookies()` now returns a Promise and must be awaited.

---

## Environment Variables

### Required for Rate Limiting

```bash
# Already in .env.example - reuse existing
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

### Optional Feature Flags

```bash
# Add to .env.example
RATE_LIMIT_ENABLED=true
RATE_LIMIT_AUTH=5      # Auth endpoint limit per minute
RATE_LIMIT_AI=10       # AI endpoint limit per minute
RATE_LIMIT_WRITE=30    # Write endpoint limit per minute
```

---

## Cookie Configuration

### Production Settings
```typescript
{
  httpOnly: true,      // Cannot be accessed by JavaScript
  secure: true,        // HTTPS only
  sameSite: 'lax',     // CSRF protection
  path: '/',           // Available on all routes
  maxAge: 2592000,     // 30 days in seconds
}
```

### Development Settings
```typescript
{
  httpOnly: true,
  secure: false,       // Allow HTTP in dev
  sameSite: 'lax',
  path: '/',
  maxAge: 2592000,
}
```

---

## Security Headers

### Built-in Next.js Support

No additional packages needed. Configure in `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

---

## Rate Limit Tiers

### Tier 1: Auth Protection (5/min per IP)
**Endpoints:**
- `auth.signup`
- `auth.signin`
- `auth.loginDemo`
- `admin.authenticate`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/send-verification`

**Rationale:** Brute-force protection. 5 attempts per minute per IP is generous for legitimate users but blocks rapid-fire attacks.

### Tier 2: AI Protection (10/min per user)
**Endpoints:**
- `reflection.create`
- `clarify.createSession`
- `clarify.sendMessage`
- `/api/clarify/stream`
- `evolution.generateDreamEvolution`
- `evolution.generateCrossDreamEvolution`
- `lifecycle.achieve`

**Rationale:** Cost protection. AI calls are expensive; 10/min prevents abuse while allowing heavy legitimate use.

### Tier 3: Write Protection (30/min per user)
**Endpoints:**
- `dreams.create`
- `dreams.update`
- `dreams.delete`
- `reflections.update`
- `reflections.delete`
- `lifecycle.evolve`
- `lifecycle.release`

**Rationale:** Spam protection. 30/min is generous for any reasonable workflow.

### Tier 4: Global Protection (100/min per IP)
**Endpoints:** All

**Rationale:** DDoS protection. Catches any endpoint not covered by specific limits.

---

## File Structure

```
server/
  lib/
    cookies.ts          # Cookie configuration and helpers (NEW)
    rate-limiter.ts     # Rate limiter configuration (NEW)
    api-rate-limit.ts   # API route rate limit helper (NEW)
    supabase.ts         # Existing - no changes
    email.ts            # Existing - no changes
  trpc/
    context.ts          # Modified - add cookie reading
    middleware.ts       # Modified - add rate limit middlewares
    routers/
      auth.ts           # Modified - add cookie setting
      ...

tests/
  auth-cookies.test.ts      # NEW
  rate-limiting.test.ts     # NEW
```

---

## Browser Support

### Cookie SameSite Support
- Chrome: Full support (all versions)
- Firefox: Full support (all versions)
- Safari: Full support (all versions)
- Edge: Full support (all versions)

### Credentials Include Support
- All modern browsers support `credentials: 'include'`
- Required for cookie-based auth in CORS scenarios

---

## Performance Considerations

### Rate Limiter Latency
- Upstash Redis REST API: ~1-5ms per request
- Negligible impact on request latency
- Sliding window computed server-side

### Cookie Size
- JWT payload is small (~500-800 bytes)
- Well under 4KB browser limit
- No performance impact

### Memory Usage
- Rate limiter is stateless (uses Redis)
- No memory accumulation
- Scales horizontally

---

## Fallback Strategies

### Rate Limiter Fallback
```typescript
try {
  const { success } = await limiter.limit(identifier);
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
} catch (e) {
  if (e instanceof TRPCError) throw e;
  // Redis unavailable - allow request (graceful degradation)
  console.error('Rate limiter unavailable:', e);
}
```

### Cookie Fallback (Transition Period)
```typescript
// Read cookie first, fallback to header
const cookieToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
const token = cookieToken || headerToken;
```

---

## Testing Infrastructure

### Vitest (Already Configured)
```json
"vitest": "^2.1.0",
"happy-dom": "^15.11.0"
```

### Test Utilities Needed
- Mock Redis for rate limit tests
- Mock cookies for auth tests
- Test helpers for setting up auth state

---

## Security Audit Checklist

- [x] HTTP-only cookies (prevents XSS token theft)
- [x] Secure flag in production (HTTPS only)
- [x] SameSite=Lax (CSRF protection)
- [x] Rate limiting on auth endpoints
- [x] Rate limiting on expensive endpoints
- [x] Security headers configured
- [ ] CSP header (future iteration - requires audit)
- [ ] CORS configuration (verify current setup)
