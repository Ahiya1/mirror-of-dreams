# Code Patterns & Conventions - Iteration 13

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── profile/
│   │   └── page.tsx              # Profile page (NEW)
│   ├── settings/
│   │   └── page.tsx              # Settings page (NEW)
│   ├── about/
│   │   └── page.tsx              # About page (NEW)
│   ├── pricing/
│   │   └── page.tsx              # Pricing page (NEW)
│   ├── dashboard/
│   │   └── page.tsx              # Existing pattern to follow
│   └── page.tsx                  # Landing page (existing)
├── components/
│   ├── ui/
│   │   └── glass/
│   │       ├── GlassCard.tsx     # Reuse for all sections
│   │       ├── GlassInput.tsx    # Reuse for form fields
│   │       ├── GlowButton.tsx    # Reuse for CTAs
│   │       └── GlassModal.tsx    # Reuse for confirmations
│   └── shared/
│       ├── AppNavigation.tsx     # Already has Profile/Settings links
│       ├── CosmicBackground.tsx  # Reuse for all pages
│       └── Toast.tsx             # Reuse for notifications
├── server/
│   └── trpc/
│       ├── routers/
│       │   ├── users.ts          # EXTEND with new mutations
│       │   └── auth.ts           # REUSE existing mutations
│       └── middleware.ts         # ADD notDemo middleware
├── types/
│   ├── schemas.ts                # ADD validation schemas
│   └── user.ts                   # UserPreferences already defined
└── lib/
    └── utils/
        └── constants.ts          # UPDATE tier limits
```

## Naming Conventions

### Files
- **Pages:** `page.tsx` (Next.js App Router convention)
- **Components:** `PascalCase.tsx` (`ProfileForm.tsx`, `SettingsToggle.tsx`)
- **Utilities:** `camelCase.ts` (`formatDate.ts`, `validateEmail.ts`)
- **Types:** `camelCase.ts` (`user.ts`, `schemas.ts`)

### Code
- **Components:** `PascalCase` (`ProfilePage`, `SettingsSection`)
- **Functions:** `camelCase` (`handleSave`, `updatePreferences`)
- **Variables:** `camelCase` (`newEmail`, `isEditing`)
- **Constants:** `SCREAMING_SNAKE_CASE` (`TIER_LIMITS`, `DEFAULT_PREFERENCES`)
- **Types/Interfaces:** `PascalCase` (`User`, `UserPreferences`, `JWTPayload`)

### Database
- **Tables:** `snake_case` (`users`, `reflections`)
- **Columns:** `snake_case` (`password_hash`, `is_demo`, `preferences`)
- **JSONB keys:** `snake_case` (`notification_email`, `default_tone`)

---

## Page Layout Patterns

### Pattern 1: Authenticated App Page Layout

**When to use:** Profile, Settings pages (require authentication)

**Full code example:**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { CosmicLoader } from '@/components/ui/CosmicLoader';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="flex items-center justify-center min-h-screen">
          <CosmicLoader size="lg" />
        </div>
      </div>
    );
  }

  // Not authenticated (redirect in progress)
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      <AppNavigation currentPage="profile" />

      <main className="relative z-10 pt-[var(--nav-height)] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page content goes here */}
          <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

          {/* Content sections */}
        </div>
      </main>
    </div>
  );
}
```

**Key points:**
- Always check authentication first (redirect to signin if not authenticated)
- Show loading state during auth check (prevents flash of wrong content)
- Use `pt-[var(--nav-height)]` to account for fixed navigation
- Max-width container (`max-w-4xl`) for optimal readability
- Responsive padding (`px-4 sm:px-6 lg:px-8`)

---

### Pattern 2: Public Marketing Page Layout

**When to use:** About, Pricing pages (no authentication required)

**Full code example:**

```typescript
'use client';

import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <CosmicBackground animated={true} intensity={1} />

      {/* Simple navigation (no AppNavigation, use minimal header) */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Mirror of Dreams
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-white/80 hover:text-white">
              Sign In
            </Link>
            <GlowButton href="/auth/signup" size="sm">
              Start Free
            </GlowButton>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-16">
        {/* Hero section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              About Mirror of Dreams
            </h1>
            {/* Content */}
          </div>
        </section>

        {/* Additional sections */}
        <section className="py-20 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section content */}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 mt-24 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Footer columns */}
        </div>
      </footer>
    </div>
  );
}
```

**Key points:**
- Use minimal navigation (not full AppNavigation)
- Hero section uses full viewport height (`min-h-screen`)
- Generous spacing (`py-20`, `mt-24`)
- Footer included in page (not separate component for marketing pages)

---

## Backend Mutation Patterns

### Pattern 3: Password-Protected Mutation (Email Change)

**When to use:** Any mutation that modifies sensitive data (email, password)

**Full code example:**

```typescript
// server/trpc/routers/users.ts

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import { changeEmailSchema } from '@/types/schemas';
import { userRowToUser } from '@/types/user';
import type { UserRow, JWTPayload } from '@/types/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export const usersRouter = router({
  // ... existing mutations ...

  changeEmail: protectedProcedure
    .input(changeEmailSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Check if email already in use
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', input.newEmail.toLowerCase())
        .single();

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email already in use',
        });
      }

      // 2. Fetch user with password_hash (never returned to client)
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', ctx.user.id)
        .single();

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // 3. Verify current password
      const passwordValid = await bcrypt.compare(
        input.currentPassword,
        user.password_hash
      );

      if (!passwordValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Current password is incorrect',
        });
      }

      // 4. Update email in database
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          email: input.newEmail.toLowerCase(),
          updated_at: new Date().toISOString(),
          email_verified: false, // Reset verification (future: send email)
        })
        .eq('id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update email',
        });
      }

      // 5. Generate new JWT with updated email (invalidate old token)
      const payload: JWTPayload = {
        userId: updatedUser.id,
        email: updatedUser.email, // NEW EMAIL
        tier: updatedUser.tier,
        isCreator: updatedUser.is_creator || false,
        isAdmin: updatedUser.is_admin || false,
        isDemo: updatedUser.is_demo || false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Fresh 30 days
      };

      const token = jwt.sign(payload, JWT_SECRET);

      // 6. Return new token + updated user
      return {
        user: userRowToUser(updatedUser as UserRow),
        token, // Client MUST replace old token with this
        message: 'Email updated successfully',
      };
    }),
});
```

**Validation schema:**

```typescript
// types/schemas.ts

export const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  currentPassword: z.string(),
});
```

**Frontend integration:**

```typescript
// app/profile/page.tsx

const changeEmailMutation = trpc.users.changeEmail.useMutation({
  onSuccess: (data) => {
    // CRITICAL: Replace old token with new one
    localStorage.setItem('mirror_auth_token', data.token);

    // Update user context
    setUser(data.user);

    toast.success(data.message);
    setIsEditingEmail(false);
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

const handleEmailChange = () => {
  changeEmailMutation.mutate({
    newEmail,
    currentPassword,
  });
};
```

**Key points:**
- Always verify password for sensitive operations
- Check email uniqueness before update
- Issue new JWT token (old token contains stale email)
- Frontend MUST replace token in localStorage
- Lowercase email for consistency

---

### Pattern 4: Partial Update Mutation (Preferences)

**When to use:** Settings page (update only changed fields, not full object)

**Full code example:**

```typescript
// server/trpc/routers/users.ts

import { updatePreferencesSchema } from '@/types/schemas';
import { DEFAULT_PREFERENCES } from '@/types/user';

export const usersRouter = router({
  // ... existing mutations ...

  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch current preferences
      const { data: user } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', ctx.user.id)
        .single();

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // 2. Merge input with existing preferences (partial update)
      const updatedPreferences = {
        ...DEFAULT_PREFERENCES, // Ensure all keys present
        ...(user.preferences || {}), // Existing preferences
        ...input, // New preferences (overwrites existing)
      };

      // 3. Update database (JSONB column)
      const { error } = await supabase
        .from('users')
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update preferences',
        });
      }

      // 4. Return merged preferences
      return {
        preferences: updatedPreferences,
        message: 'Preferences updated',
      };
    }),
});
```

**Validation schema:**

```typescript
// types/schemas.ts

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

**Frontend integration (immediate save):**

```typescript
// app/settings/page.tsx

const [preferences, setPreferences] = useState(user?.preferences);

const updatePreferencesMutation = trpc.users.updatePreferences.useMutation({
  onSuccess: (data) => {
    // Update local user context
    setUser(prev => ({ ...prev!, preferences: data.preferences }));

    // Brief toast (don't annoy user on every toggle)
    toast.success('Setting saved', { duration: 2000 });
  },
  onError: (error) => {
    toast.error('Failed to save setting');
    // Revert optimistic update
    setPreferences(user?.preferences);
  },
});

// Toggle handler (immediate save, no "Save" button)
const handleToggle = (key: keyof UserPreferences, value: any) => {
  // Optimistic update
  const updated = { ...preferences!, [key]: value };
  setPreferences(updated);

  // Save to database
  updatePreferencesMutation.mutate({ [key]: value });
};

// Example usage
<input
  type="checkbox"
  checked={preferences?.notification_email}
  onChange={(e) => handleToggle('notification_email', e.target.checked)}
/>
```

**Key points:**
- Merge with DEFAULT_PREFERENCES (backwards compatibility)
- Only send changed fields (partial update)
- Optimistic UI update (immediate feedback)
- Brief toast confirmation (don't annoy user)

---

### Pattern 5: Demo User Protection Middleware

**When to use:** Protect destructive operations from demo account

**Full code example:**

```typescript
// server/trpc/middleware.ts

import { middleware } from './trpc';
import { TRPCError } from '@trpc/server';

// Existing middleware
export const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in.',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// NEW: Demo user protection middleware
export const notDemo = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  if (ctx.user.isDemo) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Demo accounts cannot modify data. Sign up to save changes.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Export procedures
export const protectedProcedure = publicProcedure.use(isAuthed);
export const writeProcedure = publicProcedure.use(isAuthed).use(notDemo);
```

**Apply to mutations:**

```typescript
// server/trpc/routers/users.ts

import { writeProcedure } from '../middleware';

export const usersRouter = router({
  // Destructive operations use writeProcedure (blocks demo user)
  changeEmail: writeProcedure.input(changeEmailSchema).mutation(...),

  // Read operations use protectedProcedure (allow demo user)
  getProfile: protectedProcedure.query(...),

  // Preference updates allow demo user (resets nightly)
  updatePreferences: protectedProcedure.input(updatePreferencesSchema).mutation(...),
});
```

**Frontend handling:**

```typescript
// app/profile/page.tsx

{user?.isDemo && (
  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
    <p className="text-blue-400 text-sm">
      You're viewing the demo account. Sign up to modify your profile.
    </p>
  </div>
)}

<GlowButton
  onClick={handleChangeEmail}
  disabled={user?.isDemo || changeEmailMutation.isPending}
>
  Update Email
</GlowButton>
```

**Key points:**
- Middleware throws FORBIDDEN error for demo users
- Frontend disables buttons for demo users (better UX than error)
- Show banner explaining limitation
- Allow non-destructive operations (preferences update OK)

---

## Frontend Component Patterns

### Pattern 6: Editable Field with Inline Edit Mode

**When to use:** Profile page (name, email fields)

**Full code example:**

```typescript
// app/profile/page.tsx

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';

function EditableNameField() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);

  const updateProfileMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Name updated successfully');
      setIsEditing(false);
      refreshUser(); // Reload user data
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    // No change, just exit edit mode
    if (name === user?.name) {
      setIsEditing(false);
      return;
    }

    // Validate
    if (name.trim().length === 0) {
      toast.error('Name cannot be empty');
      return;
    }

    // Save
    updateProfileMutation.mutate({ name: name.trim() });
  };

  const handleCancel = () => {
    setName(user?.name || ''); // Reset to original value
    setIsEditing(false);
  };

  return (
    <GlassCard elevated>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="text-sm text-white/60 block mb-1">Name</label>
          {isEditing ? (
            <GlassInput
              value={name}
              onChange={setName}
              placeholder="Your name"
              autoFocus
            />
          ) : (
            <p className="text-lg text-white">{user?.name}</p>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          {isEditing ? (
            <>
              <GlowButton
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                size="sm"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
              </GlowButton>
              <GlowButton
                variant="secondary"
                onClick={handleCancel}
                disabled={updateProfileMutation.isPending}
                size="sm"
              >
                Cancel
              </GlowButton>
            </>
          ) : (
            <GlowButton
              variant="secondary"
              onClick={() => setIsEditing(true)}
              size="sm"
              disabled={user?.isDemo}
            >
              Edit
            </GlowButton>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
```

**Key points:**
- Two modes: Display mode (show value) and Edit mode (show input)
- Cancel button resets to original value
- Save button validates before mutation
- Disable edit for demo users
- Show loading state during mutation

---

### Pattern 7: Settings Toggle (Immediate Save)

**When to use:** Settings page (all preference toggles)

**Full code example:**

```typescript
// app/settings/page.tsx

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import type { UserPreferences } from '@/types/user';

function SettingsPage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [preferences, setPreferences] = useState(user?.preferences);

  const updatePreferencesMutation = trpc.users.updatePreferences.useMutation({
    onSuccess: (data) => {
      setUser(prev => ({ ...prev!, preferences: data.preferences }));
      toast.success('Setting saved', { duration: 2000 });
    },
    onError: (error) => {
      toast.error('Failed to save setting');
      // Revert optimistic update
      setPreferences(user?.preferences);
    },
  });

  const handleToggle = (key: keyof UserPreferences, value: any) => {
    // Optimistic update
    const updated = { ...preferences!, [key]: value };
    setPreferences(updated);

    // Save to database
    updatePreferencesMutation.mutate({ [key]: value });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {/* Notification Preferences */}
      <GlassCard elevated className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Notification Preferences
        </h2>

        <SettingRow
          label="Email Notifications"
          description="Receive email updates about your reflections"
          checked={preferences?.notification_email ?? true}
          onChange={(checked) => handleToggle('notification_email', checked)}
          disabled={updatePreferencesMutation.isPending}
        />

        <SettingRow
          label="Reflection Reminders"
          description="How often to send reflection reminders"
          type="select"
          value={preferences?.reflection_reminders ?? 'off'}
          onChange={(value) => handleToggle('reflection_reminders', value)}
          options={[
            { value: 'off', label: 'Off' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
          ]}
          disabled={updatePreferencesMutation.isPending}
        />

        <SettingRow
          label="Evolution Reports"
          description="Receive emails when evolution reports are ready"
          checked={preferences?.evolution_email ?? true}
          onChange={(checked) => handleToggle('evolution_email', checked)}
          disabled={updatePreferencesMutation.isPending}
        />
      </GlassCard>

      {/* Reflection Preferences */}
      <GlassCard elevated className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Reflection Preferences
        </h2>

        <SettingRow
          label="Default Tone"
          description="Your preferred reflection tone"
          type="select"
          value={preferences?.default_tone ?? 'fusion'}
          onChange={(value) => handleToggle('default_tone', value)}
          options={[
            { value: 'fusion', label: 'Sacred Fusion' },
            { value: 'gentle', label: 'Gentle Clarity' },
            { value: 'intense', label: 'Luminous Intensity' },
          ]}
          disabled={updatePreferencesMutation.isPending}
        />

        <SettingRow
          label="Show Character Counter"
          description="Display character counter while writing reflections"
          checked={preferences?.show_character_counter ?? true}
          onChange={(checked) => handleToggle('show_character_counter', checked)}
          disabled={updatePreferencesMutation.isPending}
        />
      </GlassCard>

      {/* Display Preferences */}
      <GlassCard elevated className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Display Preferences
        </h2>

        <SettingRow
          label="Reduce Motion"
          description="Override browser preference for animations"
          type="tristate"
          value={preferences?.reduce_motion_override}
          onChange={(value) => handleToggle('reduce_motion_override', value)}
          options={[
            { value: null, label: 'Respect Browser' },
            { value: true, label: 'Reduce Motion' },
            { value: false, label: 'Full Animation' },
          ]}
          disabled={updatePreferencesMutation.isPending}
        />
      </GlassCard>

      {/* Privacy Preferences */}
      <GlassCard elevated>
        <h2 className="text-xl font-semibold text-white mb-4">
          Privacy & Data
        </h2>

        <SettingRow
          label="Analytics"
          description="Help improve Mirror of Dreams by sharing usage data"
          checked={preferences?.analytics_opt_in ?? true}
          onChange={(checked) => handleToggle('analytics_opt_in', checked)}
          disabled={updatePreferencesMutation.isPending}
        />

        <SettingRow
          label="Marketing Emails"
          description="Receive product updates and tips"
          checked={preferences?.marketing_emails ?? false}
          onChange={(checked) => handleToggle('marketing_emails', checked)}
          disabled={updatePreferencesMutation.isPending}
        />
      </GlassCard>
    </div>
  );
}

// Reusable setting row component
interface SettingRowProps {
  label: string;
  description: string;
  checked?: boolean;
  onChange: (value: any) => void;
  disabled?: boolean;
  type?: 'toggle' | 'select' | 'tristate';
  value?: any;
  options?: Array<{ value: any; label: string }>;
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  type = 'toggle',
  value,
  options = [],
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
      <div className="flex-1">
        <p className="text-white font-medium">{label}</p>
        <p className="text-sm text-white/60 mt-1">{description}</p>
      </div>

      {type === 'toggle' && (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
        </label>
      )}

      {type === 'select' && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-900">
              {option.label}
            </option>
          ))}
        </select>
      )}

      {type === 'tristate' && (
        <select
          value={value === null ? 'null' : value.toString()}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === 'null' ? null : val === 'true');
          }}
          disabled={disabled}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map((option) => (
            <option
              key={option.value === null ? 'null' : option.value.toString()}
              value={option.value === null ? 'null' : option.value.toString()}
              className="bg-gray-900"
            >
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default SettingsPage;
```

**Key points:**
- Save immediately on change (no Save button)
- Optimistic UI update (instant feedback)
- Revert on error (maintain data integrity)
- Reusable SettingRow component
- Support toggle, select, and tristate (nullable boolean)

---

### Pattern 8: Dangerous Action Confirmation Modal

**When to use:** Delete account, reset data (destructive operations)

**Full code example:**

```typescript
// app/profile/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GlassModal } from '@/components/ui/glass/GlassModal';

function DangerZone() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success('Account deleted successfully');
      // Clear token
      localStorage.removeItem('mirror_auth_token');
      // Redirect to homepage
      router.push('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeleteAccount = () => {
    // Validation
    if (confirmEmail.toLowerCase() !== user?.email.toLowerCase()) {
      toast.error('Email confirmation does not match');
      return;
    }

    if (!password) {
      toast.error('Password is required');
      return;
    }

    // Execute deletion
    deleteAccountMutation.mutate({
      confirmEmail,
      password,
    });
  };

  const handleCancel = () => {
    setShowDeleteModal(false);
    setConfirmEmail('');
    setPassword('');
  };

  return (
    <>
      <GlassCard elevated className="border-red-500/30">
        <h2 className="text-xl font-semibold text-red-400 mb-2">
          Danger Zone
        </h2>
        <p className="text-white/60 mb-4">
          Permanently delete your account and all data. This action cannot be undone.
        </p>
        <GlowButton
          variant="secondary"
          onClick={() => setShowDeleteModal(true)}
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          disabled={user?.isDemo}
        >
          Delete Account
        </GlowButton>
        {user?.isDemo && (
          <p className="text-sm text-white/40 mt-2">
            Demo accounts cannot be deleted. Sign up for a real account.
          </p>
        )}
      </GlassCard>

      <GlassModal
        isOpen={showDeleteModal}
        onClose={handleCancel}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            This action cannot be undone. All your reflections, dreams, and data
            will be permanently deleted.
          </p>

          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">
              <strong>Warning:</strong> You will lose access to:
            </p>
            <ul className="list-disc list-inside text-red-400/80 text-sm mt-2 space-y-1">
              <li>All reflections and dreams</li>
              <li>Evolution reports and insights</li>
              <li>Subscription benefits</li>
              <li>Account history</li>
            </ul>
          </div>

          <GlassInput
            type="email"
            label="Confirm your email"
            value={confirmEmail}
            onChange={setConfirmEmail}
            placeholder={user?.email}
          />

          <GlassInput
            type="password"
            label="Enter your password"
            value={password}
            onChange={setPassword}
            showPasswordToggle
          />

          <div className="flex gap-3 pt-4">
            <GlowButton
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Forever'}
            </GlowButton>
            <GlowButton
              variant="secondary"
              onClick={handleCancel}
              disabled={deleteAccountMutation.isPending}
            >
              Cancel
            </GlowButton>
          </div>
        </div>
      </GlassModal>
    </>
  );
}
```

**Key points:**
- Scary visual design (red border, red text)
- Confirmation modal with email + password verification
- List consequences of action
- Disable for demo users
- Clear token and redirect on success

---

## Pricing Page Patterns

### Pattern 9: Tier Comparison Table

**When to use:** Pricing page (feature comparison)

**Full code example:**

```typescript
// app/pricing/page.tsx

'use client';

import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { Check, X } from 'lucide-react';
import { TIER_LIMITS } from '@/lib/utils/constants';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for exploring Mirror of Dreams',
      cta: 'Start Free',
      ctaLink: '/auth/signup',
      popular: false,
      features: [
        { name: `${TIER_LIMITS.free} reflections per month`, included: true },
        { name: '3 active dreams', included: true },
        { name: 'Basic AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: false },
        { name: 'Visualizations', included: false },
        { name: 'Advanced AI model', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: 'per month',
      description: 'For committed dreamers and deep reflection',
      cta: 'Start Premium',
      ctaLink: '/auth/signup?plan=premium',
      popular: true,
      features: [
        { name: `${TIER_LIMITS.essential} reflections per month`, included: true },
        { name: '10 active dreams', included: true },
        { name: 'Advanced AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: true },
        { name: 'Visualizations', included: true },
        { name: 'Advanced AI model', included: true },
        { name: 'Priority support', included: true },
      ],
    },
    {
      name: 'Pro',
      price: '$29.99',
      period: 'per month',
      description: 'Unlimited reflection for transformation',
      cta: 'Start Pro',
      ctaLink: '/auth/signup?plan=pro',
      popular: false,
      features: [
        { name: 'Unlimited reflections', included: true },
        { name: 'Unlimited dreams', included: true },
        { name: 'Premium AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: true },
        { name: 'Visualizations', included: true },
        { name: 'Advanced AI model', included: true },
        { name: 'Priority support', included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen relative">
      <CosmicBackground animated intensity={1} />

      {/* Navigation (simple) */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Mirror of Dreams
          </a>
          <div className="flex items-center gap-4">
            <a href="/auth/signin" className="text-white/80 hover:text-white">
              Sign In
            </a>
            <GlowButton href="/auth/signup" size="sm">
              Start Free
            </GlowButton>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Choose Your Path
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Start free and upgrade as your reflection practice deepens
            </p>
          </div>

          {/* Tier Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
            {tiers.map((tier) => (
              <GlassCard
                key={tier.name}
                elevated
                interactive={tier.popular}
                className={`relative ${
                  tier.popular
                    ? 'border-2 border-purple-500/50 shadow-lg shadow-purple-500/20'
                    : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    {tier.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {tier.price}
                    </span>
                    <span className="text-white/60 ml-2">{tier.period}</span>
                  </div>

                  <GlowButton
                    href={tier.ctaLink}
                    className="w-full mb-6"
                    variant={tier.popular ? 'primary' : 'secondary'}
                  >
                    {tier.cta}
                  </GlowButton>

                  <div className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            feature.included ? 'text-white' : 'text-white/40'
                          }
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-4 border border-white/10">
                  <span className="text-white font-medium">
                    Can I change plans later?
                  </span>
                  <span className="text-white/60 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="p-4 text-white/80">
                  Yes! You can upgrade or downgrade at any time. When upgrading,
                  new features are available immediately. When downgrading,
                  changes take effect at the end of your current billing period.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-4 border border-white/10">
                  <span className="text-white font-medium">
                    What happens if I exceed my reflection limit?
                  </span>
                  <span className="text-white/60 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="p-4 text-white/80">
                  When you reach your monthly limit, you'll be prompted to upgrade.
                  Your existing reflections remain accessible, but you won't be
                  able to create new ones until next month or after upgrading.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-4 border border-white/10">
                  <span className="text-white font-medium">
                    Is my data secure?
                  </span>
                  <span className="text-white/60 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="p-4 text-white/80">
                  Absolutely. All data is encrypted in transit and at rest. We
                  never share your reflections with third parties. Your dreams
                  are sacred and private.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-4 border border-white/10">
                  <span className="text-white font-medium">
                    What's your refund policy?
                  </span>
                  <span className="text-white/60 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="p-4 text-white/80">
                  We offer a 14-day money-back guarantee. If you're not satisfied
                  with Premium or Pro within 14 days of purchase, contact support
                  for a full refund.
                </div>
              </details>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Key points:**
- Import TIER_LIMITS from constants (single source of truth)
- Highlight popular tier (border glow)
- Use lucide-react icons (Check, X)
- Native `<details>` for FAQ (no JavaScript needed)
- Responsive grid (1 column mobile, 3 columns desktop)

---

## Import Order Convention

**Standard import order (enforced by ESLint):**

```typescript
// 1. React and Next.js imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// 2. External libraries (alphabetical)
import { Check, X } from 'lucide-react';
import { z } from 'zod';

// 3. Internal utilities and libs (@ alias)
import { trpc } from '@/lib/trpc/client';
import { TIER_LIMITS } from '@/lib/utils/constants';

// 4. Hooks and contexts
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

// 5. Components (UI first, then shared)
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';

// 6. Types
import type { User, UserPreferences } from '@/types/user';
```

## Code Quality Standards

**ESLint Rules (existing configuration):**
- No unused variables
- Prefer const over let
- No console.log in production
- Consistent return types

**TypeScript Strict Mode:**
- No implicit any
- Strict null checks
- No unused locals

**Accessibility:**
- All interactive elements keyboard accessible
- Semantic HTML (button, nav, main, section)
- ARIA labels for icon-only buttons
- Focus states visible

**Performance:**
- Lazy-load heavy components (use dynamic import)
- Optimize images with next/image
- Minimize bundle size (tree-shaking)

---

## Summary

**Key Principles:**
1. **Reuse aggressively** - All UI components exist, no new development needed
2. **Follow existing patterns** - Profile/Settings mirror dashboard structure
3. **Type safety** - Zod schemas validate + generate TypeScript types
4. **Immediate feedback** - Toast notifications on all mutations
5. **Demo protection** - Middleware blocks destructive operations
6. **Mobile-first** - All pages responsive by default
7. **Security** - Password-protection on sensitive mutations

**Builder Guidance:**
- Copy-paste these patterns (they're production-ready)
- Don't invent new components (use GlassCard, GlassInput, etc.)
- Follow import order convention (ESLint enforced)
- Test all mutations manually before committing
- Verify mobile responsive on all pages
