# Code Patterns & Conventions - Iteration 21

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── admin/
│   │   └── page.tsx           # NEW: Admin dashboard
│   ├── auth/
│   │   ├── verify-required/
│   │   │   └── page.tsx       # NEW: Verification blocking page
│   │   ├── signin/
│   │   └── signup/
│   ├── dashboard/
│   ├── reflections/
│   └── ...
├── components/
│   └── ui/
│       └── glass/             # Reusable glass components
├── hooks/
│   └── useAuth.ts             # MODIFY: Fix email_verified
├── server/
│   └── trpc/
│       └── routers/
│           ├── admin.ts       # MODIFY: Add getWebhookEvents
│           └── users.ts       # MODIFY: Add email_verified to select
├── scripts/
│   └── seed-admin.sql         # NEW: Admin seeding SQL
└── supabase/
    └── migrations/
```

## Naming Conventions

- Components: PascalCase (`AdminDashboard.tsx`)
- Pages: `page.tsx` in kebab-case folders (`verify-required/page.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Types: PascalCase (`WebhookEvent`)
- Functions: camelCase (`handleResend()`)
- Constants: SCREAMING_SNAKE_CASE (`RESEND_COOLDOWN_SECONDS`)

---

## Email Verification Check Pattern

### Pattern: useAuth Fix (Builder 1)

**File:** `/hooks/useAuth.ts`

**Before (line 99):**
```typescript
emailVerified: true, // getProfile doesn't return this, default to true
```

**After:**
```typescript
emailVerified: userData.email_verified ?? false,
```

### Pattern: getProfile Query Update (Builder 1)

**File:** `/server/trpc/routers/users.ts`

**Before (lines 44-51):**
```typescript
.select(
  `
  id, email, name, tier, subscription_status, subscription_period,
  subscription_started_at, subscription_expires_at,
  reflection_count_this_month, reflections_today, last_reflection_date,
  total_reflections, cancel_at_period_end,
  is_creator, is_admin, is_demo, language, timezone,
  preferences, last_reflection_at, created_at, last_sign_in_at
  `
)
```

**After:**
```typescript
.select(
  `
  id, email, name, tier, subscription_status, subscription_period,
  subscription_started_at, subscription_expires_at,
  reflection_count_this_month, reflections_today, last_reflection_date,
  total_reflections, cancel_at_period_end,
  is_creator, is_admin, is_demo, language, timezone,
  preferences, last_reflection_at, created_at, last_sign_in_at,
  email_verified
  `
)
```

---

## Protected Route Verification Pattern

### Pattern: Email Verification Check in Protected Pages (Builder 1)

**Use this pattern in all protected pages that should require email verification.**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Authentication and verification check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        // Not logged in - redirect to signin
        router.push('/auth/signin');
      } else if (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo) {
        // Logged in but not verified (and not a special user) - redirect to verification
        router.push('/auth/verify-required');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Show nothing while checking auth (prevents flash)
  if (authLoading) {
    return <LoadingState />;
  }

  // Show nothing while redirecting
  if (!isAuthenticated || (!user?.emailVerified && !user?.isCreator && !user?.isAdmin && !user?.isDemo)) {
    return null;
  }

  // Render page content
  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

### Pattern: Bypass Logic for Special Users

```typescript
// Special users bypass email verification:
// - Creators (is_creator = true)
// - Admins (is_admin = true)
// - Demo users (is_demo = true)

const requiresVerification = !user.emailVerified
  && !user.isCreator
  && !user.isAdmin
  && !user.isDemo;

if (requiresVerification) {
  router.push('/auth/verify-required');
}
```

---

## Verification Required Page Pattern

### Pattern: Complete Verify Required Page (Builder 1)

**File:** `/app/auth/verify-required/page.tsx`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlowButton, CosmicLoader } from '@/components/ui/glass';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { useToast } from '@/contexts/ToastContext';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyRequiredPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, signout, refreshUser } = useAuth();
  const toast = useToast();

  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Redirect if already verified or not authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user?.emailVerified || user?.isCreator || user?.isAdmin || user?.isDemo) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Poll for verification status (every 5 seconds)
  useEffect(() => {
    if (!user || user.emailVerified) return;

    const interval = setInterval(async () => {
      await refreshUser();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, refreshUser]);

  // Handle resend
  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isResending || !user) return;

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.alreadyVerified) {
          toast.success('Email already verified!');
          router.push('/dashboard');
        } else {
          toast.success('Verification email sent!');
          setCooldown(RESEND_COOLDOWN_SECONDS);
        }
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  }, [cooldown, isResending, user, router, toast]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    await signout();
    router.push('/auth/signin');
  }, [signout, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="flex items-center justify-center min-h-screen">
          <CosmicLoader size="lg" />
        </div>
      </div>
    );
  }

  // Don't render if not in correct state
  if (!isAuthenticated || !user || user.emailVerified || user.isCreator || user.isAdmin || user.isDemo) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      <div className="flex items-center justify-center min-h-screen px-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          {/* Email Icon */}
          <div className="text-6xl mb-6">
            <span role="img" aria-label="email">📧</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-white mb-2">
            Verify Your Email
          </h1>

          {/* Message */}
          <p className="text-white/70 mb-4">
            We sent a verification link to
          </p>
          <p className="text-emerald-400 font-medium mb-6">
            {user.email}
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
            disabled={cooldown > 0 || isResending}
            className="w-full"
          >
            {isResending
              ? 'Sending...'
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend Verification Email'}
          </GlowButton>

          {/* Sign Out Link */}
          <button
            onClick={handleSignOut}
            className="mt-6 text-white/50 text-sm hover:text-white/70 transition-colors"
          >
            Sign out and use a different email
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
```

---

## Admin Dashboard Patterns

### Pattern: Admin Page with Authorization (Builder 2)

**File:** `/app/admin/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { GlassCard, CosmicLoader, GradientText } from '@/components/ui/glass';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { AppNavigation } from '@/components/shared/AppNavigation';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Admin authorization check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (!user?.isAdmin && !user?.isCreator) {
        router.push('/dashboard'); // Redirect non-admins
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Fetch admin data
  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery(
    undefined,
    { enabled: !!user?.isAdmin || !!user?.isCreator }
  );

  const { data: usersData, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery(
    { page: 1, limit: 10 },
    { enabled: !!user?.isAdmin || !!user?.isCreator }
  );

  const { data: webhookEvents, isLoading: webhooksLoading } = trpc.admin.getWebhookEvents.useQuery(
    { limit: 10 },
    { enabled: !!user?.isAdmin || !!user?.isCreator }
  );

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="flex items-center justify-center min-h-screen">
          <CosmicLoader size="lg" />
        </div>
      </div>
    );
  }

  // Guard: Not admin
  if (!user?.isAdmin && !user?.isCreator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <CosmicBackground />
      <AppNavigation currentPage="admin" />

      <main className="max-w-6xl mx-auto pt-nav px-4 sm:px-8 pb-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <GradientText>Admin Dashboard</GradientText>
          </h1>
          <p className="text-white/60">
            System overview and management
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Stats cards here */}
        </div>

        {/* Users Table */}
        <GlassCard className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Users</h2>
          {/* Table content */}
        </GlassCard>

        {/* Webhook Events */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-white mb-4">Recent Webhook Events</h2>
          {/* Events table */}
        </GlassCard>
      </main>
    </div>
  );
}
```

### Pattern: Stats Card Component

```typescript
interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-white/50 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </GlassCard>
  );
}
```

### Pattern: Admin Data Table

```typescript
interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

function AdminTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
}: {
  data: T[];
  columns: TableColumn<T>[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <CosmicLoader size="md" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="text-left py-3 px-4 text-white/50 font-medium text-sm"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
              {columns.map((col) => (
                <td key={String(col.key)} className="py-3 px-4 text-white/80 text-sm">
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## tRPC Endpoint Pattern

### Pattern: getWebhookEvents Endpoint (Builder 2)

**File:** `/server/trpc/routers/admin.ts`

```typescript
// Add to existing admin router
getWebhookEvents: creatorProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).default(20),
      eventType: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const { limit, eventType } = input;

    let query = supabase
      .from('webhook_events')
      .select('id, event_id, event_type, processed_at, payload, user_id')
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch webhook events',
      });
    }

    return {
      items: data || [],
      total: data?.length || 0,
    };
  }),
```

---

## Toast Notification Pattern

### Pattern: Using Toast Context

```typescript
import { useToast } from '@/contexts/ToastContext';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation successful!');
  };

  const handleError = () => {
    toast.error('Something went wrong');
  };

  const handleInfo = () => {
    toast.info('Here is some information');
  };
}
```

---

## Import Order Convention

```typescript
// 1. React imports
import { useState, useEffect, useCallback } from 'react';

// 2. Next.js imports
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 3. Third-party imports
import { z } from 'zod';

// 4. Internal imports - lib/utils
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// 5. Internal imports - components
import { GlassCard, GlowButton, CosmicLoader } from '@/components/ui/glass';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { AppNavigation } from '@/components/shared/AppNavigation';

// 6. Internal imports - hooks
import { useAuth } from '@/hooks/useAuth';

// 7. Internal imports - contexts
import { useToast } from '@/contexts/ToastContext';

// 8. Internal imports - types
import type { User } from '@/types';

// 9. Styles (if any)
import '@/styles/dashboard.css';
```

---

## Error Handling Pattern

### Pattern: API Error Handling

```typescript
try {
  const response = await fetch('/api/auth/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id }),
  });

  const result = await response.json();

  if (result.success) {
    toast.success('Email sent!');
  } else {
    toast.error(result.error || 'Operation failed');
  }
} catch (error) {
  console.error('API error:', error);
  toast.error('Something went wrong. Please try again.');
}
```

### Pattern: tRPC Error Handling

```typescript
const { data, isLoading, error } = trpc.admin.getStats.useQuery();

if (error) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-900/10 p-6">
      <p className="text-red-400">{error.message}</p>
    </div>
  );
}
```

---

## Date/Time Formatting Pattern

```typescript
// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date with time
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Relative time (e.g., "2 hours ago")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}
```

---

## Badge/Status Styling Pattern

```typescript
// Tier badge colors
const tierColors: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  pro: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  unlimited: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

// Subscription status colors
const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

// Badge component
function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const colorClass = tierColors[variant] || statusColors[variant] || 'bg-gray-500/20 text-gray-300';
  return (
    <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', colorClass)}>
      {children}
    </span>
  );
}
```
