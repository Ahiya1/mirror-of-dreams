# Explorer 1 Report: Architecture & Structure for Core Pages

## Executive Summary

The existing Next.js 14 App Router codebase provides a solid foundation for building Profile, Settings, About, and Pricing pages. The architecture follows consistent patterns with tRPC for backend mutations, GlassCard-based UI components, and a mature design system from Plan-6. Key discovery: **tier limits discrepancy** between vision (free=10) and code (free=3) must be resolved before Pricing page implementation.

**Recommendation:** Leverage existing patterns (dashboard/page.tsx, app directory structure, AppNavigation dropdown) and extend tRPC users router with new mutations. All 4 pages can share architectural DNA with dashboard while maintaining unique layouts.

## Discoveries

### App Directory Structure & Routing
- **Pattern:** Next.js 14 App Router with `app/` directory
- **Existing pages:** `/dashboard`, `/dreams`, `/reflection`, `/reflections`, `/evolution`, `/visualizations`, `/auth/signin`, `/auth/signup`
- **Missing pages (404s):** `/profile`, `/settings`, `/about`, `/pricing`
- **Structure convention:**
  - Root pages: `app/page.tsx` (landing), `app/dashboard/page.tsx`
  - Dynamic routes: `app/dreams/[id]/page.tsx`, `app/reflections/[id]/page.tsx`
  - Nested routes: `app/reflection/output/page.tsx`, `app/auth/signin/page.tsx`

**Recommended structure for new pages:**
```
app/
  profile/
    page.tsx              # Profile page (account management)
  settings/
    page.tsx              # Settings page (preferences)
  about/
    page.tsx              # About page (founder story, mission)
  pricing/
    page.tsx              # Pricing page (tier comparison)
```

### Navigation Integration Points
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx`

**Current dropdown structure (lines 271-300):**
- Profile link (line 272): `href="/profile"` - **ALREADY EXISTS** but page is 404
- Settings link (line 276): `href="/settings"` - **ALREADY EXISTS** but page is 404
- Upgrade link (line 280-285): Conditional for non-premium users, links to `/subscription`
- Help link (line 289): `href="/help"` - 404
- Sign Out button (line 293-299): Functional

**Discovery:** Navigation links are **already wired**, just missing page implementations!

**Integration required:**
1. Create `app/profile/page.tsx` - navigation already points to it
2. Create `app/settings/page.tsx` - navigation already points to it
3. Update footer links in `app/page.tsx` (lines 136-159):
   - About link (line 154): `href="/about"` - exists but 404
   - Pricing link (line 137): `href="/pricing"` - exists but 404

**No navigation changes needed** - just create the pages!

### Form Components & UI Primitives

**GlassInput Component:**
- **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassInput.tsx`
- **Features:**
  - Text, email, password, textarea variants
  - Character counter with color states (safe/warning/danger)
  - Password toggle visibility
  - Success/error states with shake animation
  - Label, placeholder, validation error display
  - Framer Motion animations (respects reduced motion)
- **Usage for Profile/Settings:**
  - Name editing: `<GlassInput type="text" value={name} onChange={setName} />`
  - Email change: `<GlassInput type="email" value={email} />`
  - Password change: `<GlassInput type="password" showPasswordToggle />`

**GlassCard Component:**
- **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassCard.tsx`
- **Variants:**
  - `elevated={true}` - Adds shadow + border highlight
  - `interactive={true}` - Hover lift + glow (for clickable cards)
- **Usage:**
  - Section containers: `<GlassCard elevated>Account Info</GlassCard>`
  - Settings groups: `<GlassCard>Notification Preferences</GlassCard>`

**Missing component:** **GlassSelect / GlassToggle**
- No select/dropdown component found in `/components/ui/glass/`
- **Recommendation:** Create `GlassSelect.tsx` for Settings page (tone selection, notification frequency)
- **Alternative:** Use native `<select>` with GlassInput styling or toggle switches

**Available UI components:**
- `GlowButton` - Primary/secondary CTAs (Save, Cancel, Delete Account)
- `CosmicLoader` - Loading states for async operations
- `Toast` - Success/error notifications via `useToast()` context
- `GlassModal` - Confirmation dialogs (Delete Account, Change Email)
- `EmptyState` - No usage stats / no subscription fallback

### User Type & Auth Patterns

**User Type:**
- **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts`
- **Interface (lines 38-57):**
  ```typescript
  interface User {
    id: string;
    email: string;
    name: string;
    tier: SubscriptionTier; // 'free' | 'essential' | 'premium'
    subscriptionStatus: SubscriptionStatus;
    subscriptionPeriod: 'monthly' | 'yearly' | null;
    reflectionCountThisMonth: number;
    totalReflections: number;
    currentMonthYear: string;
    isCreator: boolean;
    isAdmin: boolean;
    isDemo: boolean;
    language: Language;
    emailVerified: boolean;
    preferences: UserPreferences; // NEW: Settings storage
    createdAt: string;
    lastSignInAt: string;
    updatedAt: string;
  }
  ```

**UserPreferences Type (lines 10-19):**
```typescript
interface UserPreferences {
  notification_email: boolean;
  reflection_reminders: 'off' | 'daily' | 'weekly';
  evolution_email: boolean;
  marketing_emails: boolean;
  default_tone: 'fusion' | 'gentle' | 'intense';
  show_character_counter: boolean;
  reduce_motion_override: boolean | null;
  analytics_opt_in: boolean;
}
```

**Auth Hook:**
- **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useAuth.ts`
- **Returns:**
  - `user: User | null` - Current user object
  - `isLoading: boolean` - Auth check in progress
  - `isAuthenticated: boolean` - User logged in
  - `refreshUser()` - Reload user data after profile update

**Usage pattern in pages:**
```typescript
const { user, isLoading, isAuthenticated } = useAuth();

// Protect page
if (!isAuthenticated && !isLoading) {
  router.push('/auth/signin');
  return null;
}

// Display user data
{user?.name} // "Ahiya"
{user?.email} // "ahiya@example.com"
{user?.tier} // "free"
{user?.preferences.default_tone} // "fusion"
```

### tRPC Router Patterns & Mutations

**Existing routers:**
- **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/users.ts`

**Current mutations (lines 79-103):**
1. `updateProfile` - Updates name, language
   - Input: `updateProfileSchema` (name, language)
   - Returns: Updated user object
2. `getProfile` - Fetches comprehensive user data (lines 36-76)
   - Returns: User profile + metrics (daysSinceJoining, averageReflectionsPerMonth)
3. `getDashboardData` - Dashboard stats (lines 147-197)
4. `getUsageStats` - Detailed usage analytics (lines 106-144)

**Auth router mutations:**
- **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`
- `changePassword` (lines 233-296) - **ALREADY EXISTS**
  - Input: `changePasswordSchema` (currentPassword, newPassword)
  - Validates current password, hashes new one
- `deleteAccount` (lines 299-345) - **ALREADY EXISTS**
  - Input: `deleteAccountSchema` (password, confirmEmail)
  - Verifies email match + password before cascade delete

**Missing mutations needed:**
1. **updatePreferences** - Save user settings (Settings page)
   - Input: `Partial<UserPreferences>`
   - Updates `users.preferences` JSONB column
2. **changeEmail** - Email change with verification (Profile page)
   - Input: `{ newEmail: string }`
   - Triggers verification flow (future: send emails)

**Validation schemas:**
- **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/schemas.ts`
- Existing: `updateProfileSchema` (line 21-24), `changePasswordSchema` (line 26-29), `deleteAccountSchema` (line 31-34)
- **Need to add:**
  - `updatePreferencesSchema` - For Settings page
  - `changeEmailSchema` - For Profile email change

**tRPC usage pattern in pages:**
```typescript
const updateProfileMutation = trpc.users.updateProfile.useMutation({
  onSuccess: (data) => {
    toast.success('Profile updated successfully');
    refreshUser(); // Reload user data
  },
  onError: (err) => {
    toast.error(err.message);
  },
});

const handleSave = () => {
  updateProfileMutation.mutate({ name: newName });
};
```

### Toast Notification System

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/contexts/ToastContext.tsx`

**Usage:**
```typescript
import { useToast } from '@/contexts/ToastContext';

const toast = useToast();

toast.success('Profile updated successfully', 3000);
toast.error('Failed to update profile', 5000);
toast.warning('Email verification pending');
toast.info('Settings saved automatically');
```

**Features:**
- Auto-dismiss after duration (default 5000ms)
- Positioned bottom-right (z-index 9999)
- Framer Motion slide-in animation
- Multiple toasts stack vertically

**Integration for Profile/Settings:**
- Profile save: Success toast
- Settings toggle: Immediate save + success toast
- Email change: Warning toast about verification
- Password change: Success toast
- Delete account: Error toast if fails, redirect if success

### Tier Limits Analysis - CRITICAL DISCREPANCY

**Vision document states (line 372-376):**
```yaml
Free tier: 10 reflections/month
Premium tier: 50 reflections/month
Pro tier: Unlimited reflections
```

**Code reality - THREE DIFFERENT DEFINITIONS:**

1. **constants.ts (global constants):**
   - **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`
   - Lines 3-7:
     ```typescript
     export const TIER_LIMITS = {
       free: 3,
       essential: 20,
       premium: Infinity,
     }
     ```

2. **users.ts router (dashboard data):**
   - **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/users.ts`
   - Lines 164-168:
     ```typescript
     const TIER_LIMITS = {
       free: 1,
       essential: 5,
       premium: 10,
     };
     ```

3. **Vision document (Pricing page spec):**
   - Free: 10
   - Premium: 50
   - Pro: Unlimited

**CRITICAL CONFLICT:**
- `constants.ts` says free tier = **3 reflections**
- `users.ts` router says free tier = **1 reflection**
- Vision says free tier = **10 reflections**
- Tier names don't match: `essential` vs `premium` vs `pro`

**Impact on Pricing page:**
- Cannot build accurate tier comparison table
- Usage stats in Profile page will be wrong
- Dashboard usage card shows incorrect limits

**RECOMMENDATION:**
1. **Decision needed:** What are the actual tier limits?
   - Suggested: Vision's values (free=10, premium=50, pro=unlimited)
   - Or conservative: constants.ts (free=3, essential=20, premium=unlimited)
2. **Single source of truth:** Use `constants.ts` only, remove hardcoded values from `users.ts`
3. **Tier naming consistency:**
   - Database/types use: `free`, `essential`, `premium`
   - Vision uses: `free`, `premium`, `pro`, `creator`
   - **Align vision with code** OR rename database tiers
4. **Update migration:** If changing limits, update default values

**Blocker status:** MEDIUM - Can build pages with placeholder values, but **must resolve before Pricing page** goes live.

### Database Schema (Preferences Storage)

**Migration file:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251128_iteration_12_demo_infrastructure.sql`

**Schema changes (already applied in Iteration 12):**
1. `users.preferences` - JSONB column (line 12-13)
   - Stores UserPreferences object
   - Default: `'{}'::JSONB`
2. `users.is_demo` - Boolean flag (line 16-17)
   - Identifies demo user
   - Index created for fast lookup (line 20-22)

**Preferences stored as JSONB:**
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

**Settings page mutations:**
- Read: `user.preferences` from `useAuth()`
- Update: `trpc.users.updatePreferences.mutate({ default_tone: 'gentle' })`
- Server updates: `users.preferences = { ...current, ...updates }`

**No additional migrations needed** - preferences column exists!

## Patterns Identified

### Pattern 1: Page Layout - Authenticated App Pages

**Description:** Standard layout for all authenticated pages (dashboard, dreams, reflections)

**Structure:**
```tsx
'use client';

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
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Page content */}
        </div>
      </main>
    </div>
  );
}
```

**Use Case:** Profile, Settings pages (authenticated)
**Recommendation:** Use this exact pattern for consistency

### Pattern 2: Public Marketing Pages

**Description:** Layout for non-authenticated pages (landing, about, pricing)

**Structure (from app/page.tsx):**
```tsx
'use client';

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <CosmicBackground animated={true} intensity={1} />
      <LandingNavigation transparent />
      
      <main className="relative z-10">
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-8">
          {/* Hero content */}
        </section>
        
        <section className="py-20 px-4 sm:px-8">
          {/* Additional sections */}
        </section>
      </main>
      
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 mt-24">
        {/* Footer (shared component from landing) */}
      </footer>
    </div>
  );
}
```

**Use Case:** About, Pricing pages
**Recommendation:** Reuse LandingNavigation + footer from landing page

### Pattern 3: Form with Mutation - Profile Editing

**Description:** tRPC mutation with optimistic UI + toast feedback

**Code example:**
```tsx
const [name, setName] = useState(user?.name || '');
const [isEditing, setIsEditing] = useState(false);
const toast = useToast();
const { refreshUser } = useAuth();

const updateProfileMutation = trpc.users.updateProfile.useMutation({
  onSuccess: () => {
    toast.success('Name updated successfully');
    setIsEditing(false);
    refreshUser(); // Reload user data
  },
  onError: (err) => {
    toast.error(err.message);
  },
});

const handleSave = () => {
  if (name === user?.name) {
    setIsEditing(false);
    return;
  }
  updateProfileMutation.mutate({ name });
};

return (
  <GlassCard elevated>
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm text-white/60">Name</label>
        {isEditing ? (
          <GlassInput
            value={name}
            onChange={setName}
            placeholder="Your name"
          />
        ) : (
          <p className="text-lg text-white">{user?.name}</p>
        )}
      </div>
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <GlowButton onClick={handleSave} disabled={updateProfileMutation.isPending}>
              Save
            </GlowButton>
            <GlowButton variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </GlowButton>
          </>
        ) : (
          <GlowButton variant="secondary" onClick={() => setIsEditing(true)}>
            Edit
          </GlowButton>
        )}
      </div>
    </div>
  </GlassCard>
);
```

**Use Case:** Profile page (name, email editing)
**Recommendation:** Follow this pattern for all editable fields

### Pattern 4: Settings Toggle - Immediate Save

**Description:** Settings that save on change (no "Save" button)

**Code example:**
```tsx
const [preferences, setPreferences] = useState(user?.preferences);
const toast = useToast();

const updatePreferencesMutation = trpc.users.updatePreferences.useMutation({
  onSuccess: () => {
    toast.success('Setting saved', 2000);
    refreshUser();
  },
  onError: (err) => {
    toast.error('Failed to save setting');
  },
});

const handleToggle = (key: keyof UserPreferences, value: any) => {
  const updated = { ...preferences, [key]: value };
  setPreferences(updated);
  updatePreferencesMutation.mutate(updated);
};

return (
  <GlassCard>
    <h3>Notification Preferences</h3>
    
    <div className="flex items-center justify-between py-4 border-b border-white/10">
      <div>
        <p className="text-white">Email Notifications</p>
        <p className="text-sm text-white/60">Receive email updates</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={preferences.notification_email}
          onChange={(e) => handleToggle('notification_email', e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-white/10 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
      </label>
    </div>
    
    {/* Repeat for other settings */}
  </GlassCard>
);
```

**Use Case:** Settings page (all preferences)
**Recommendation:** Immediate save + subtle toast confirmation

### Pattern 5: Dangerous Actions - Confirmation Modal

**Description:** High-risk actions (delete account, change email) require confirmation

**Code example (leveraging GlassModal):**
```tsx
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [confirmEmail, setConfirmEmail] = useState('');
const [password, setPassword] = useState('');
const toast = useToast();
const router = useRouter();

const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
  onSuccess: () => {
    toast.success('Account deleted successfully');
    router.push('/');
  },
  onError: (err) => {
    toast.error(err.message);
  },
});

const handleDeleteAccount = () => {
  deleteAccountMutation.mutate({ confirmEmail, password });
};

return (
  <>
    <GlassCard elevated className="border-red-500/30">
      <h3 className="text-red-400">Danger Zone</h3>
      <p className="text-white/60 mb-4">
        Permanently delete your account and all data. This cannot be undone.
      </p>
      <GlowButton
        variant="secondary"
        onClick={() => setShowDeleteModal(true)}
        className="border-red-500/50 text-red-400"
      >
        Delete Account
      </GlowButton>
    </GlassCard>

    <GlassModal
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      title="Delete Account"
    >
      <p className="text-white/80 mb-4">
        This action cannot be undone. All your reflections, dreams, and data will be permanently deleted.
      </p>
      
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
      
      <div className="flex gap-3 mt-6">
        <GlowButton
          onClick={handleDeleteAccount}
          disabled={deleteAccountMutation.isPending}
          className="bg-red-500 hover:bg-red-600"
        >
          {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Forever'}
        </GlowButton>
        <GlowButton variant="secondary" onClick={() => setShowDeleteModal(false)}>
          Cancel
        </GlowButton>
      </div>
    </GlassModal>
  </>
);
```

**Use Case:** Profile page (Delete Account), Settings (Reset All)
**Recommendation:** Always require confirmation for destructive actions

## Complexity Assessment

### High Complexity Areas

**1. Pricing Page - Tier Limits Resolution (BLOCKER)**
- **Complexity:** Resolve 3 conflicting tier limit definitions
- **Estimated splits:** 1 (requires decision + code alignment)
- **Why complex:** Impacts database, constants, vision document, usage calculations
- **Recommendation:**
  1. Sub-builder creates constants alignment task
  2. Update `constants.ts` to match vision (or vice versa)
  3. Remove hardcoded limits from `users.ts` router
  4. Verify dashboard usage card reflects correct limits
  5. Build Pricing page with final values

**2. Settings Page - Preferences Management**
- **Complexity:** 8+ preference toggles, immediate save, state synchronization
- **Estimated splits:** 1 (Settings page can be built as single unit)
- **Why complex:**
  - Each setting needs: toggle UI, description, onChange handler
  - Backend mutation: `updatePreferences` (merge with existing preferences)
  - State management: Optimistic UI updates
  - Validation: Ensure valid preference values (tone, reminder frequency)
- **Recommendation:**
  - Build `updatePreferences` mutation first
  - Group settings into sections (Notifications, Reflection, Display, Privacy)
  - Use `GlassCard` per section for visual organization

### Medium Complexity Areas

**1. Profile Page - Account Management**
- **Complexity:** Multiple edit modes, email/password change flows
- **Why medium:**
  - Name editing: Inline edit mode with save/cancel
  - Email change: Triggers verification flow (future: send email)
  - Password change: Requires current password validation
  - Usage stats: Fetch from `getProfile` tRPC query
  - Tier display: Show benefits, upgrade CTA
- **Recommendation:**
  - Reuse existing `changePassword` mutation (already built!)
  - Reuse existing `updateProfile` mutation
  - Create new `changeEmail` mutation (validation only for now, email sending future)
  - Display stats from `getProfile` (already returns memberSince, averageReflections)

**2. About Page - Content Integration**
- **Complexity:** Content-heavy, requires founder story + mission from Ahiya
- **Why medium:**
  - Content dependency: Needs text from stakeholder (not code complexity)
  - Image optimization: Founder photo needs WebP conversion
  - Layout design: Balance text/images for emotional impact
- **Recommendation:**
  - Use placeholder content initially: "[Founder story coming soon]"
  - Provide content template to Ahiya: "I built Mirror of Dreams because..."
  - Use existing `CosmicBackground` + `GlassCard` layout
  - Add founder photo via `next/image` with priority loading

### Low Complexity Areas

**1. Pricing Page - UI Only (After Tier Limits Fixed)**
- **Complexity:** Static page, no backend logic
- **Implementation:**
  - 3-column tier comparison table (Free, Premium, Pro)
  - Feature checkmarks (✓ / ✗)
  - FAQ accordion section
  - CTAs per tier (Sign Up, Start Trial, Contact Sales)
- **Recommendation:**
  - Build after tier limits resolved
  - Use `GlassCard` for each tier column
  - Highlight "Most Popular" tier with glowing border
  - FAQ can be static <details> elements or useState accordion

**2. Navigation Updates**
- **Complexity:** Links already exist, just need pages
- **Implementation:** Create pages, test navigation flow
- **Recommendation:** No changes needed to AppNavigation component!

## Integration Points

### External Integrations

**1. tRPC Backend Integration**
- **Current routers:** `auth`, `users`, `reflections`, `dreams`, `evolution`, `visualizations`
- **New mutations needed:**
  - `users.updatePreferences` - Settings page
  - `auth.changeEmail` - Profile page (or move to `users` router)
- **Pattern:** Extend existing routers, follow mutation schema conventions

**2. Supabase Database**
- **Tables touched:**
  - `users` - Read/write for profile, preferences
  - No new tables needed
- **Columns used:**
  - `preferences` (JSONB) - Already exists
  - `email`, `name`, `tier`, `subscription_status`, `reflection_count_this_month`, `total_reflections`

### Internal Integrations

**1. AppNavigation ↔ New Pages**
- **Current state:** Links exist, pages missing
- **Integration:** Create pages at expected routes
- **Testing:** Click Profile/Settings in dropdown, verify pages load

**2. useAuth Hook ↔ Profile/Settings**
- **Data flow:**
  - Profile reads: `user.name`, `user.email`, `user.tier`, `user.reflectionCountThisMonth`
  - Settings reads: `user.preferences`
  - Both call: `refreshUser()` after mutations
- **Integration:** Standard hook usage, no changes needed

**3. Toast System ↔ All Pages**
- **Usage:** Import `useToast()`, call on success/error
- **Integration:** Already wrapped in root layout via `ToastProvider`

**4. Landing Page Footer ↔ About/Pricing**
- **Current:** Footer links to `/about` and `/pricing` (404s)
- **Integration:** Create pages, links work automatically
- **Consistency:** Reuse footer component from landing page

## Risks & Challenges

### Technical Risks

**1. Tier Limits Discrepancy (HIGH RISK - BLOCKER)**
- **Impact:** Pricing page cannot be built without resolved limits
- **Mitigation:**
  1. Escalate to stakeholder: Which limits are correct?
  2. Update `constants.ts` as single source of truth
  3. Refactor `users.ts` router to import from constants
  4. Document decision in migration file

**2. Email Verification Flow (MEDIUM RISK)**
- **Challenge:** Email change triggers verification (emails not implemented)
- **Mitigation:**
  - Phase 1: Validate email format, update database (no email sent)
  - Phase 2: Add "Email verification pending" banner
  - Future: Implement email sending via Resend/SendGrid

**3. Preferences State Sync (LOW RISK)**
- **Challenge:** Settings page needs optimistic updates + server sync
- **Mitigation:**
  - Use local state for immediate UI feedback
  - Show loading spinner on mutation
  - Revert on error, toast notification

### Complexity Risks

**1. Settings Page Scope Creep**
- **Risk:** 8+ preferences = feature bloat
- **Likelihood:** LOW (scope well-defined in vision)
- **Mitigation:**
  - Start with 5 core preferences (vision lines 169-183)
  - Add advanced settings later (Danger Zone, etc.)

**2. About Page Content Delay**
- **Risk:** Waiting for founder story blocks iteration
- **Likelihood:** MEDIUM (content dependency)
- **Mitigation:**
  - Build page with placeholder content
  - Mark as "NEEDS_CONTENT" in PR
  - Ahiya fills in real story before production deploy

## Recommendations for Planner

### 1. Resolve Tier Limits IMMEDIATELY (CRITICAL PATH)
**Recommendation:** Escalate to Ahiya before planning builders.

**Decision needed:**
- Align vision (free=10, premium=50, pro=unlimited) OR
- Align to code (free=3, essential=20, premium=unlimited)

**Action:**
- Update `constants.ts` with final values
- Remove hardcoded limits from `users.ts`
- Document in migration comment

**Why critical:** Pricing page blocks on this, Profile usage stats incorrect without it.

### 2. Split Into 2 Builders - Sequential Dependencies

**Builder-1: Backend + Profile/Settings (Estimated 8-10 hours)**
- Create `updatePreferences` mutation + schema
- Create `changeEmail` mutation + schema
- Build Profile page (account info, edit name, change password, usage stats)
- Build Settings page (8 preferences, toggle UI, immediate save)
- Test mutations, verify toast notifications

**Builder-2: About/Pricing Pages (Estimated 4-6 hours, BLOCKS ON CONTENT)**
- Build About page layout (placeholder content)
- Build Pricing page (tier table, FAQ)
- Integrate footer component from landing
- Test navigation links
- **HANDOFF:** Ahiya provides founder story, mission text

**Why sequential:** Builder-2 can start while Builder-1 finishes backend, but About page needs content before "done."

### 3. Leverage Existing Patterns Aggressively
**Recommendation:** Don't reinvent - copy from dashboard/reflections pages.

**Reuse:**
- Page layout structure (CosmicBackground, AppNavigation, padding)
- tRPC mutation patterns (onSuccess, onError, toast)
- GlassCard/GlassInput components (zero custom components needed)
- Loading states (CosmicLoader)

**Why:** Plan-6 established mature patterns. Builder velocity > novelty.

### 4. Content Preparation Parallel-Track
**Recommendation:** While builders code, Ahiya writes content.

**Content needed:**
- About page:
  - Founder story (200-300 words)
  - Mission statement (50-100 words)
  - Product philosophy (100-150 words)
  - Values (3-5 bullet points)
- Pricing page:
  - Feature explanations for tier tooltips
  - FAQ answers (3-5 questions)
- Settings page:
  - Preference descriptions (already in vision, confirm wording)

**Template provided:** Give Ahiya markdown template with placeholders.

### 5. Testing Strategy - Profile/Settings Priority
**Recommendation:** Profile/Settings are high-value, About/Pricing are marketing.

**Test coverage:**
- Profile: Edit name, change password, delete account flow
- Settings: Toggle each preference, verify save, check `user.preferences` in DB
- About: Verify links work, content renders, responsive layout
- Pricing: Verify tier values match constants, CTAs link correctly

**QA focus:** Profile/Settings (user-facing bugs hurt trust), About/Pricing (polish phase).

## Resource Map

### Critical Files/Directories

**Page creation (new files):**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx` - Profile page
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/settings/page.tsx` - Settings page
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/about/page.tsx` - About page
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/pricing/page.tsx` - Pricing page

**Backend extensions:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/users.ts` - Add `updatePreferences` mutation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts` - Add `changeEmail` mutation (or move to users)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/schemas.ts` - Add validation schemas

**Component reuse (NO new components needed):**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassCard.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassInput.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlowButton.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassModal.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/CosmicBackground.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx` (no changes)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/Toast.tsx`

**Constants to update:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` - Fix TIER_LIMITS

**Existing hooks/contexts:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useAuth.ts` - `useAuth()` for user data
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/contexts/ToastContext.tsx` - `useToast()` for notifications

**Database (no migrations needed):**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251128_iteration_12_demo_infrastructure.sql` - Preferences column exists

### Key Dependencies

**1. Next.js 14 App Router**
- Why needed: Routing, server components, layouts
- How used: Page creation at `app/[route]/page.tsx`

**2. tRPC**
- Why needed: Type-safe API for mutations
- How used: Extend `users` router with new mutations

**3. Framer Motion**
- Why needed: Animations (already in GlassCard, GlassInput)
- How used: Inherit from existing components, no new animations

**4. Zod**
- Why needed: Validation schemas for tRPC inputs
- How used: Create `updatePreferencesSchema`, `changeEmailSchema`

**5. Supabase Client**
- Why needed: Database read/write for profile/settings
- How used: Import from `@/server/lib/supabase` in mutations

### Testing Infrastructure

**1. Manual Testing Approach (Existing)**
- **Tool:** Browser DevTools, manual clicks
- **Rationale:** Established pattern from previous iterations

**2. tRPC DevTools (Optional)**
- **Tool:** Browser extension for inspecting tRPC calls
- **Rationale:** Debug mutations, verify payloads

**3. Lighthouse Audits**
- **Tool:** Chrome DevTools > Lighthouse
- **Rationale:** Verify performance budget (<30KB increase, LCP <2.5s)

**4. Responsive Testing**
- **Tool:** Browser DevTools device emulation
- **Rationale:** All pages must work mobile-first (60% traffic)

## Questions for Planner

### Critical Decision Points

**1. Tier Limits - Which values are correct?**
- Vision says: free=10, premium=50, pro=unlimited
- Code says: free=3, essential=20, premium=infinity
- Dashboard router says: free=1, essential=5, premium=10
- **Recommendation:** Use vision values (free=10, premium=50, pro=unlimited) for competitive positioning

**2. Tier naming - Align vision to code or vice versa?**
- Database tiers: `free`, `essential`, `premium`
- Vision tiers: `free`, `premium`, `pro`, `creator`
- **Recommendation:** Keep database naming (`free`, `essential`, `premium`), update vision to match

**3. Email verification flow - Build or defer?**
- Profile page has "Change Email" feature
- Should it send verification emails or just update DB?
- **Recommendation:** Phase 1 = DB update only, Phase 2 (future) = email verification

**4. Settings page - How many preferences for MVP?**
- Vision lists 8+ preferences (notifications, reflection, display, privacy)
- Should all be built in Iteration 13 or phased?
- **Recommendation:** Build all 8 (relatively simple toggles, high user value)

### Builder Task Allocation

**5. Should Profile/Settings be one builder or split?**
- Profile = account management (editable fields, stats, danger zone)
- Settings = preferences (toggles, immediate save)
- **Recommendation:** Same builder (shared patterns, similar complexity)

**6. Should About/Pricing be one builder or split?**
- About = content-heavy, static layout
- Pricing = tier comparison, FAQ
- **Recommendation:** Same builder (both marketing pages, low complexity)

### Content Dependencies

**7. About page - What's the content handoff process?**
- Builder creates layout with placeholders
- Ahiya provides founder story, mission, values
- Who integrates final content?
- **Recommendation:** Builder creates template, Ahiya fills in, builder reviews + merges

**8. Pricing page - Are tier benefits finalized?**
- Free: 10 reflections, 3 dreams, basic AI
- Premium: 50 reflections, 10 dreams, advanced AI
- Pro: Unlimited, premium model, early access
- **Recommendation:** Verify with Ahiya before coding (affects feature tooltips)

### Implementation Details

**9. GlassSelect component - Build or use native <select>?**
- Settings page needs dropdown for "Reflection reminders" (daily/weekly/off)
- No existing GlassSelect component
- **Recommendation:** Use native `<select>` with GlassInput styling OR build simple GlassSelect (30 min)

**10. Delete Account - Cascade delete or soft delete?**
- Current: Cascade delete (foreign keys delete reflections)
- Should we soft-delete (mark `deleted_at` instead)?
- **Recommendation:** Keep cascade delete (simpler, GDPR-compliant "right to be forgotten")
