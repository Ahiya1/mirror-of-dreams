# Explorer 1 Report: Email Verification System - Current State & Gaps

## Executive Summary

The email verification backend system is COMPLETE and well-implemented. The gap is entirely on the **UI enforcement side**: unverified users can currently access the full application without any blocking. The builder needs to create a verification blocking screen and add email verification checks to protected routes.

## Current Implementation Analysis

### 1. Email Sending Infrastructure (COMPLETE)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/email.ts`

The email system uses nodemailer with Gmail SMTP:

```typescript
// Core configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});
```

**Key Functions:**
- `sendVerificationEmail(email, token, userName?)` - Sends beautiful HTML verification email
- `generateToken()` - Creates 32-byte hex token
- `getVerificationTokenExpiration()` - Returns Date 24 hours from now

**Email Template Features:**
- Professional HTML email with cosmic branding
- Plain text fallback included
- Verification link: `${appUrl}/auth/verify-email?token=${token}`
- 24-hour expiry notice
- Mobile-responsive design

### 2. Signup Flow - Email Sending (COMPLETE)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts` (Lines 98-117)

Signup already sends verification emails:

```typescript
// Lines 98-117 in signup mutation
try {
  const verificationToken = generateToken();
  const expiresAt = getVerificationTokenExpiration();

  // Store verification token
  await supabase.from('email_verification_tokens').insert({
    user_id: newUser.id,
    token: verificationToken,
    expires_at: expiresAt.toISOString(),
  });

  // Send email (fire and forget - don't block signup on email failure)
  sendVerificationEmail(newUser.email, verificationToken, newUser.name).catch(
    (err) => console.error('Failed to send verification email:', err)
  );
} catch (emailError) {
  console.error('Error setting up verification email:', emailError);
}
```

**Note:** Email sending is non-blocking - signup succeeds even if email fails.

### 3. API Routes (COMPLETE)

#### Send Verification Email
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/auth/send-verification/route.ts`

```typescript
POST /api/auth/send-verification
Body: { email?: string, userId?: string }

Response:
- { success: true, message: "Verification email sent successfully" }
- { success: true, alreadyVerified: true, message: "Email is already verified" }
- { success: false, error: "..." }
```

Features:
- Accepts either email or userId
- Prevents email enumeration (always returns success for unknown emails)
- Deletes existing tokens before creating new one
- Cleans up token if email send fails

#### Verify Email Token
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/auth/verify-email/route.ts`

```typescript
POST /api/auth/verify-email
Body: { token: string }

GET /api/auth/verify-email?token=xxx
- Redirects to /auth/verify-email.html?token=xxx

Response:
- { success: true, message: "Email verified successfully!" }
- { success: true, alreadyVerified: true, message: "Email is already verified" }
- { success: false, expired: true, error: "..." }
- { success: false, invalid: true, error: "..." }
```

### 4. Verification UI (COMPLETE)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/public/auth/verify-email.html`

A standalone HTML page that handles token verification:
- Loading state with cosmic animation
- Success state with celebration particles
- Already verified state
- Error state with "Request new link" button
- Uses localStorage to store `pending_verification_email` for resend
- Falls back to prompt() if email not in localStorage

### 5. Database Schema (COMPLETE)

**Migration:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251202000001_email_verification_tokens.sql`

```sql
CREATE TABLE public.email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX idx_email_verification_tokens_token ON token;
CREATE INDEX idx_email_verification_tokens_user_id ON user_id;
CREATE INDEX idx_email_verification_tokens_expires_at ON expires_at;

-- Cleanup function for cron
CREATE FUNCTION cleanup_expired_verification_tokens() ...
```

Users table has:
```sql
email_verified BOOLEAN DEFAULT FALSE
```

### 6. Type System (COMPLETE)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts`

```typescript
// User interface (line 55)
export interface User {
  // ...
  emailVerified: boolean;
  // ...
}

// Database row (line 102)
export interface UserRow {
  // ...
  email_verified: boolean;
  // ...
}

// Transformation (line 130)
emailVerified: row.email_verified,
```

---

## CRITICAL GAP: UI Enforcement

### Current Problem

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useAuth.ts` (Line 99)

```typescript
// BUG: emailVerified is hardcoded to true!
emailVerified: true, // getProfile doesn't return this, default to true
```

This means the frontend NEVER knows if a user is unverified.

### Additional Problems

1. **getProfile doesn't return email_verified**
   - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/users.ts` line 46
   - The query doesn't include `email_verified` in the select

2. **No verification check in protected routes**
   - Dashboard, reflections, settings, etc. only check `isAuthenticated`
   - No check for `emailVerified`

3. **No blocking UI exists**
   - No "Please verify your email" page
   - No redirect logic for unverified users

---

## Recommendations for Builder

### Fix 1: Update getProfile to return email_verified

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/users.ts`

Add `email_verified` to the select query on line 46:
```typescript
.select(`
  id, email, name, tier, subscription_status, subscription_period,
  subscription_started_at, subscription_expires_at,
  reflection_count_this_month, reflections_today, last_reflection_date,
  total_reflections, cancel_at_period_end,
  is_creator, is_admin, is_demo, language, timezone,
  preferences, last_reflection_at, created_at, last_sign_in_at,
  email_verified  // ADD THIS
`)
```

### Fix 2: Update useAuth.ts to use actual email_verified

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useAuth.ts`

Change line 99 from:
```typescript
emailVerified: true, // getProfile doesn't return this, default to true
```

To:
```typescript
emailVerified: userData.email_verified ?? false,
```

### Fix 3: Create Email Verification Required Page

Create new file: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/auth/verify-required/page.tsx`

This page should:
- Display a beautiful "Please verify your email" message
- Show the user's email address
- Provide a "Resend verification email" button
- Show countdown/cooldown after resend (e.g., 60 seconds)
- Link to change email if needed
- Auto-redirect to dashboard when verified

### Fix 4: Add Verification Check to Protected Routes

Update the pattern used in protected pages. Current pattern:

```typescript
// Current: Only checks authentication
useEffect(() => {
  if (!isAuthenticated && !authLoading) {
    router.push('/auth/signin');
  }
}, [isAuthenticated, authLoading, router]);
```

New pattern:

```typescript
// New: Check authentication AND email verification
useEffect(() => {
  if (!authLoading) {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    } else if (!user?.emailVerified && !user?.isCreator && !user?.isAdmin) {
      router.push('/auth/verify-required');
    }
  }
}, [isAuthenticated, authLoading, user, router]);
```

### Pages Requiring Verification Check

High Priority (core functionality):
1. `/dashboard` - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/page.tsx`
2. `/reflection` - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx`
3. `/reflections` - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflections/page.tsx`
4. `/dreams` - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/page.tsx`

Medium Priority:
5. `/profile` - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx`
6. `/settings` - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/settings/page.tsx`
7. `/evolution` - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx`
8. `/visualizations` - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx`

Low Priority (individual item views):
9. `/reflections/[id]`
10. `/dreams/[id]`
11. `/evolution/[id]`
12. `/visualizations/[id]`

**Alternative:** Create a shared hook or HOC for verification check.

---

## Production Verification Checklist

### Gmail SMTP Verification

Environment variables required in Vercel:
```
GMAIL_USER=ahiya.butman@gmail.com
GMAIL_APP_PASSWORD=uurwgcbscdvtrbbi  # App password (NOT regular password)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

To verify Gmail SMTP works:
1. Check Vercel function logs for "Email service ready" (only shows in development)
2. In production, trigger a signup and watch logs for:
   - `Verification email sent to user@example.com`
   - Or error: `Failed to send verification email: ...`

### Test Flow
1. Sign up with new email
2. Check email inbox (and spam folder)
3. Click verification link
4. Verify redirect to success page
5. Sign in should work normally

### Vercel Logs Location
- Vercel Dashboard -> Project -> Deployments -> [deployment] -> Functions tab
- Filter by `/api/auth/send-verification` or search for "verification"

---

## UI Design Recommendations

### Verify Required Page Design

Follow the existing cosmic design system. Example structure:

```tsx
<div className="min-h-screen relative">
  <CosmicBackground />
  <div className="flex items-center justify-center min-h-screen px-4">
    <GlassCard className="max-w-md w-full p-8 text-center">
      {/* Icon */}
      <div className="text-6xl mb-6">📧</div>
      
      {/* Title */}
      <h1 className="text-2xl font-semibold text-white mb-2">
        Verify Your Email
      </h1>
      
      {/* Message */}
      <p className="text-white/70 mb-4">
        We sent a verification link to
      </p>
      <p className="text-emerald-400 font-medium mb-6">
        {user?.email}
      </p>
      
      {/* Instructions */}
      <p className="text-white/50 text-sm mb-8">
        Check your inbox (and spam folder) for the verification email.
        Click the link to verify your account.
      </p>
      
      {/* Resend Button */}
      <GlowButton
        variant="cosmic"
        onClick={handleResend}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
      </GlowButton>
      
      {/* Sign Out Link */}
      <button
        onClick={handleSignOut}
        className="mt-4 text-white/50 text-sm hover:text-white/70"
      >
        Sign out and use a different email
      </button>
    </GlassCard>
  </div>
</div>
```

### Resend Functionality

```typescript
const [cooldown, setCooldown] = useState(0);
const [isResending, setIsResending] = useState(false);

const handleResend = async () => {
  if (cooldown > 0 || isResending) return;
  
  setIsResending(true);
  try {
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      toast.success('Verification email sent!');
      setCooldown(60); // 60 second cooldown
    } else if (result.alreadyVerified) {
      router.push('/dashboard');
    } else {
      toast.error(result.error || 'Failed to send email');
    }
  } catch (error) {
    toast.error('Something went wrong');
  } finally {
    setIsResending(false);
  }
};

// Cooldown timer
useEffect(() => {
  if (cooldown > 0) {
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }
}, [cooldown]);
```

---

## Risk Assessment

### Low Risk
- Backend is complete and tested
- Email template is production-ready
- Token system is secure

### Medium Risk
- Gmail may have sending limits (500/day for personal accounts)
- Emails might go to spam initially
- User frustration if email doesn't arrive

### Mitigation
- Use app password (already configured)
- Consider adding DKIM/SPF to domain for better deliverability
- Provide clear "check spam" instructions
- Add "use different email" option

---

## Files to Modify (Summary)

| File | Change Required |
|------|-----------------|
| `server/trpc/routers/users.ts` | Add `email_verified` to getProfile select |
| `hooks/useAuth.ts` | Use actual email_verified value |
| `app/auth/verify-required/page.tsx` | CREATE: New verification required page |
| `app/dashboard/page.tsx` | Add email verification check |
| `app/reflection/MirrorExperience.tsx` | Add email verification check |
| `app/reflections/page.tsx` | Add email verification check |
| `app/dreams/page.tsx` | Add email verification check |
| `app/profile/page.tsx` | Add email verification check |
| `app/settings/page.tsx` | Add email verification check |
| `app/evolution/page.tsx` | Add email verification check |
| `app/visualizations/page.tsx` | Add email verification check |

---

## Questions for Planner

1. Should creators/admins bypass email verification? (Recommendation: Yes)
2. Should demo users bypass email verification? (Recommendation: Yes)
3. What's the cooldown between resend attempts? (Recommendation: 60 seconds)
4. Should we show a banner on dashboard instead of full blocking? (Recommendation: Full blocking for new users)
5. Should OAuth users (future) need email verification? (Recommendation: No, OAuth emails are pre-verified)
