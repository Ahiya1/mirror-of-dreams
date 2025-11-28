# Builder Task Breakdown - Iteration 13

## Overview

**2 primary builders** will work in parallel with sequential handoff for shared files.

**Total Estimated Effort:** 12-16 hours
- Builder-1: 8-10 hours (Backend + Profile + Settings)
- Builder-2: 4-6 hours (Tier Limits + About + Pricing)

**Builder Execution Order:**
1. Builder-1 starts immediately (backend mutations + Profile/Settings pages)
2. Builder-2 starts after Builder-1 commits mutations (pulls branch, adds About/Pricing)

**Why Sequential for Shared Files:**
- Both touch `server/trpc/routers/users.ts`
- Builder-1 adds mutations (lines 100-200)
- Builder-2 fixes tier limits (lines 164-168)
- Sequential avoids merge conflicts

---

## Builder-1: Backend Mutations + Profile + Settings

### Scope

Backend infrastructure for all profile/settings mutations, plus frontend pages for account management and preferences configuration.

### Complexity Estimate

**MEDIUM-HIGH**

- Backend: 4 hours (2 new mutations + schemas)
- Profile page: 3 hours (multiple editable fields + confirmation modals)
- Settings page: 2 hours (8 preference toggles + immediate save)
- Testing: 1 hour (comprehensive mutation testing)

**Total:** 8-10 hours

### Success Criteria

- [ ] `changeEmail` mutation created (password-protected, JWT invalidation)
- [ ] `updatePreferences` mutation created (partial JSONB updates)
- [ ] `changeEmailSchema` and `updatePreferencesSchema` added to types/schemas.ts
- [ ] `notDemo` middleware created and applied to destructive mutations
- [ ] Profile page loads at `/profile` (no 404)
- [ ] Name editing works (inline edit mode with save/cancel)
- [ ] Email change works (requires password, issues new JWT)
- [ ] Password change works (reuses existing auth.changePassword mutation)
- [ ] Delete account works (requires email confirmation + password)
- [ ] Settings page loads at `/settings` (no 404)
- [ ] All 8 preference toggles save immediately to database
- [ ] Settings page grouped into 4 sections (Notifications, Reflection, Display, Privacy)
- [ ] Demo user cannot change email or delete account (middleware blocks)
- [ ] Demo user banner shown for destructive operations
- [ ] Toast notifications on all mutations (success/error)
- [ ] Mobile responsive (Profile and Settings pages)
- [ ] All mutations tested manually

### Files to Create

**Backend (5 files extended/created):**
```
server/trpc/routers/users.ts
  - ADD changeEmail mutation (lines ~104-160)
  - ADD updatePreferences mutation (lines ~162-200)

server/trpc/middleware.ts
  - ADD notDemo middleware (lines ~54-70)
  - EXPORT writeProcedure (line ~72)

types/schemas.ts
  - ADD changeEmailSchema (lines ~36-40)
  - ADD updatePreferencesSchema (lines ~42-52)
```

**Frontend (2 new pages):**
```
app/profile/page.tsx
  - Profile page component (~300 lines)
  - Sections: Account info, Tier display, Usage stats, Account actions, Danger zone

app/settings/page.tsx
  - Settings page component (~250 lines)
  - Sections: Notifications, Reflection, Display, Privacy
```

### Dependencies

**Depends on:**
- Existing `auth.changePassword` mutation (already exists)
- Existing `auth.deleteAccount` mutation (already exists)
- Existing `users.updateProfile` mutation (already exists)
- Existing `users.getProfile` query (already exists)
- Database schema (preferences column exists from iteration 12)
- GlassCard, GlassInput, GlowButton, GlassModal components (all exist)

**Blocks:**
- Builder-2 (must pull Builder-1 branch before fixing tier limits)
- Integration testing (needs both builders complete)

### Implementation Notes

#### Backend Mutations

**1. changeEmail Mutation (Pattern 3 from patterns.md):**

Location: `server/trpc/routers/users.ts` (add after `updateProfile` mutation)

Key requirements:
- Check email uniqueness (prevent duplicate accounts)
- Verify current password (bcrypt.compare)
- Update email in database (lowercase for consistency)
- Reset `email_verified` to false (prepare for future verification flow)
- Generate new JWT with updated email (invalidate old token)
- Return new token + updated user object

Error handling:
- Email already in use → 'Email already in use'
- Wrong password → 'Current password is incorrect'
- Database error → 'Failed to update email'

**2. updatePreferences Mutation (Pattern 4 from patterns.md):**

Location: `server/trpc/routers/users.ts` (add after `changeEmail` mutation)

Key requirements:
- Fetch current preferences from database
- Merge input with DEFAULT_PREFERENCES (backwards compatibility)
- Partial update (only changed fields sent from frontend)
- Update JSONB column in database
- Return merged preferences

Error handling:
- Database error → 'Failed to update preferences'

**3. notDemo Middleware:**

Location: `server/trpc/middleware.ts` (add after `isAuthed` middleware)

Key requirements:
- Check if user.isDemo === true
- Throw FORBIDDEN error for demo users
- Export `writeProcedure` (combines isAuthed + notDemo)

Apply to:
- `changeEmail` mutation (use writeProcedure)
- `auth.deleteAccount` mutation (use writeProcedure)

**4. Validation Schemas:**

Location: `types/schemas.ts` (add after existing schemas)

```typescript
export const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  currentPassword: z.string(),
});

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

#### Profile Page

**Layout Structure:**

```
Profile Page
├── Account Information Section (GlassCard)
│   ├── Name (editable - inline edit mode)
│   ├── Email (display only with "Change Email" button)
│   └── Member Since (display only)
├── Tier & Subscription Section (GlassCard)
│   ├── Current Tier (badge display)
│   ├── Usage Stats (reflections this month / limit)
│   └── Upgrade CTA (if free tier)
├── Account Actions Section (GlassCard)
│   ├── Change Email (opens edit mode, requires password)
│   └── Change Password (opens edit mode, requires current password)
└── Danger Zone Section (GlassCard with red border)
    └── Delete Account (scary button, opens confirmation modal)
```

**Components to Use:**
- `AppNavigation` (already has Profile link)
- `CosmicBackground`
- `GlassCard` (4 cards for sections)
- `GlassInput` (name, email, password fields)
- `GlowButton` (Save, Cancel, Edit, Delete actions)
- `GlassModal` (Delete Account confirmation)
- `Toast` (success/error notifications)
- `CosmicLoader` (loading state during auth check)

**State Management:**
- Name editing: `useState` for isEditingName, newName
- Email editing: `useState` for isEditingEmail, newEmail, currentPassword
- Password editing: `useState` for isEditingPassword, currentPassword, newPassword
- Delete modal: `useState` for showDeleteModal, confirmEmail, password

**Mutations:**
- `trpc.users.updateProfile` (name change)
- `trpc.users.changeEmail` (email change, REMEMBER: replace token in localStorage)
- `trpc.auth.changePassword` (password change)
- `trpc.auth.deleteAccount` (account deletion)

**Critical:** Email change returns new token - must replace in localStorage:
```typescript
onSuccess: (data) => {
  localStorage.setItem('mirror_auth_token', data.token);
  setUser(data.user);
  toast.success(data.message);
}
```

#### Settings Page

**Layout Structure:**

```
Settings Page
├── Notification Preferences (GlassCard)
│   ├── Email Notifications (toggle)
│   ├── Reflection Reminders (dropdown: off/daily/weekly)
│   └── Evolution Email (toggle)
├── Reflection Preferences (GlassCard)
│   ├── Default Tone (dropdown: fusion/gentle/intense)
│   └── Show Character Counter (toggle)
├── Display Preferences (GlassCard)
│   └── Reduce Motion Override (dropdown: null/true/false)
└── Privacy Preferences (GlassCard)
    ├── Analytics Opt-in (toggle)
    └── Marketing Emails (toggle)
```

**Components to Use:**
- `AppNavigation` (already has Settings link)
- `CosmicBackground`
- `GlassCard` (4 cards for sections)
- Native `<input type="checkbox">` with custom toggle styling
- Native `<select>` with GlassInput styling

**State Management:**
- Single `useState(user?.preferences)` for local preferences
- Update on toggle, send to mutation immediately

**Mutation:**
- `trpc.users.updatePreferences` (all toggles use same mutation)

**Pattern (Pattern 7 from patterns.md):**
```typescript
const handleToggle = (key: keyof UserPreferences, value: any) => {
  const updated = { ...preferences!, [key]: value };
  setPreferences(updated); // Optimistic update
  updatePreferencesMutation.mutate({ [key]: value }); // Save to DB
};
```

**Toast Behavior:**
- Brief toast on save (2 second duration)
- Don't annoy user with toast on every toggle
- Consider silent save with checkmark icon animation

### Patterns to Follow

**From patterns.md:**
- **Pattern 1:** Authenticated App Page Layout (Profile and Settings pages)
- **Pattern 3:** Password-Protected Mutation (changeEmail)
- **Pattern 4:** Partial Update Mutation (updatePreferences)
- **Pattern 5:** Demo User Protection Middleware (notDemo)
- **Pattern 6:** Editable Field with Inline Edit Mode (Profile name/email)
- **Pattern 7:** Settings Toggle (Immediate Save) (all Settings toggles)
- **Pattern 8:** Dangerous Action Confirmation Modal (Delete Account)

### Testing Requirements

**Backend Mutations (30 minutes):**
- [ ] changeEmail with correct password → success, new JWT issued
- [ ] changeEmail with wrong password → error "Current password is incorrect"
- [ ] changeEmail to existing email → error "Email already in use"
- [ ] changeEmail as demo user → error "Demo accounts cannot modify data"
- [ ] updatePreferences (toggle notification_email) → preferences saved in DB
- [ ] updatePreferences (change default_tone) → preferences saved in DB
- [ ] updatePreferences with invalid value → Zod validation error

**Profile Page (20 minutes):**
- [ ] Name edit → Save → Toast success → Name updated in header
- [ ] Name edit → Cancel → Name reverts to original
- [ ] Email change → Password required → New JWT issued → Email updated
- [ ] Email change → Wrong password → Error toast
- [ ] Password change → Correct current password → Success toast
- [ ] Password change → Wrong current password → Error toast
- [ ] Delete account → Email confirmation + password → Account deleted, redirect to home
- [ ] Delete account as demo user → Button disabled, banner shown

**Settings Page (15 minutes):**
- [ ] Toggle notification_email → Toast confirmation → Reload page → Setting persisted
- [ ] Change default_tone dropdown → Toast confirmation → Setting saved
- [ ] Change reflection_reminders dropdown → Toast confirmation → Setting saved
- [ ] All 8 toggles tested individually

**Total Testing Time:** ~1 hour

### Potential Split Strategy

**IF Builder-1 exceeds 6 hours on backend/Profile:**

Split into:

**Builder-1A (Foundation - 6 hours):**
- Backend mutations (changeEmail, updatePreferences)
- Validation schemas
- notDemo middleware
- Profile page complete

**Builder-1B (Settings - 2 hours):**
- Settings page (8 preference toggles)
- Grouped sections
- Testing

**Recommendation:** Avoid split unless necessary. Backend + Profile + Settings are tightly coupled.

---

## Builder-2: Tier Limits Fix + About + Pricing

### Scope

Resolve tier limits discrepancy across codebase, then build About and Pricing marketing pages.

### Complexity Estimate

**MEDIUM**

- Tier limits fix: 1 hour (update constants, refactor users router)
- About page: 1.5 hours (layout + placeholder content)
- Pricing page: 2 hours (tier comparison table + FAQ)
- Testing: 30 minutes (verify tier limits correct, responsive layout)

**Total:** 4-6 hours

### Success Criteria

- [ ] Tier limits aligned across all files (constants.ts, users.ts, pricing page)
- [ ] TIER_LIMITS constant updated (free=10, essential=50, premium=Infinity)
- [ ] users.ts router imports TIER_LIMITS from constants (no hardcoded values)
- [ ] About page loads at `/about` (no 404)
- [ ] About page has placeholder content (marked "NEEDS_CONTENT")
- [ ] About page layout responsive (mobile, tablet, desktop)
- [ ] Pricing page loads at `/pricing` (no 404)
- [ ] Pricing page displays correct tier limits (matches constants.ts)
- [ ] Pricing page has 3-tier comparison table (Free, Premium, Pro)
- [ ] Pricing page has FAQ section (5-7 questions)
- [ ] All navigation links work (landing footer → About, Pricing)
- [ ] Mobile responsive (About and Pricing pages)

### Files to Create

**Backend (2 files modified):**
```
lib/utils/constants.ts
  - UPDATE TIER_LIMITS (lines 3-7)
  - Change free: 3 → 10
  - Change essential: 20 → 50
  - Change premium: Infinity (no change)

server/trpc/routers/users.ts
  - IMPORT { TIER_LIMITS } from '@/lib/utils/constants'
  - DELETE hardcoded TIER_LIMITS (lines 164-168)
  - USE imported TIER_LIMITS in getDashboardData (line 170)
```

**Frontend (2 new pages):**
```
app/about/page.tsx
  - About page component (~250 lines)
  - Sections: Hero, Founder story, Mission, Values, CTA

app/pricing/page.tsx
  - Pricing page component (~350 lines)
  - Sections: Hero, Tier comparison cards, FAQ
```

### Dependencies

**Depends on:**
- Builder-1 completion (must pull branch with mutations)
- Vision document tier limits (free=10, premium=50, pro=unlimited)
- GlassCard, GlowButton, CosmicBackground components (all exist)
- Content from Ahiya (founder story, mission statement) - use placeholders

**Blocks:**
- Content integration (Ahiya provides real content after page layout complete)

### Implementation Notes

#### Tier Limits Fix (CRITICAL - DO FIRST)

**DECISION (from overview.md):** Use vision document values:
- Free tier: 10 reflections/month (was 3 in constants.ts, 1 in users.ts)
- Premium tier: 50 reflections/month (was 20 in constants.ts as "essential", 5 in users.ts)
- Pro tier: Unlimited reflections (was Infinity in constants.ts as "premium", 10 in users.ts)

**Step 1: Update constants.ts**

Location: `lib/utils/constants.ts` (lines 3-7)

```typescript
// BEFORE
export const TIER_LIMITS = {
  free: 3,
  essential: 20,
  premium: Infinity,
} as const;

// AFTER
export const TIER_LIMITS = {
  free: 10,
  essential: 50,
  premium: Infinity,
} as const;
```

**Step 2: Refactor users.ts router**

Location: `server/trpc/routers/users.ts`

Add import at top:
```typescript
import { TIER_LIMITS } from '@/lib/utils/constants';
```

Delete hardcoded TIER_LIMITS (lines 164-168):
```typescript
// DELETE THIS
const TIER_LIMITS = {
  free: 1,
  essential: 5,
  premium: 10,
};
```

Use imported constant (line 170):
```typescript
// No changes needed - already uses TIER_LIMITS[ctx.user.tier]
```

**Step 3: Verify in Pricing Page**

Import TIER_LIMITS:
```typescript
import { TIER_LIMITS } from '@/lib/utils/constants';
```

Use in tier descriptions:
```typescript
{ name: `${TIER_LIMITS.free} reflections per month`, included: true }
```

**Testing:**
- [ ] Dashboard usage card shows "X / 10" for free tier
- [ ] Pricing page shows "10 reflections per month" for Free tier
- [ ] Pricing page shows "50 reflections per month" for Premium tier

#### About Page

**Layout Structure:**

```
About Page
├── Hero Section (full viewport height)
│   ├── Title: "About Mirror of Dreams"
│   └── Subtitle: One-sentence mission
├── Founder Story Section (GlassCard)
│   ├── Founder Photo (optional, if provided by Ahiya)
│   ├── Story Heading: "Why I Built Mirror of Dreams"
│   └── Story Content: [PLACEHOLDER - 250-350 words]
├── Mission Section (GlassCard)
│   ├── Heading: "Our Mission"
│   └── Content: [PLACEHOLDER - 50-100 words]
├── Product Philosophy Section (GlassCard)
│   ├── Heading: "Why Reflection + AI?"
│   └── Content: [PLACEHOLDER - 100-150 words]
├── Values Section (GlassCard)
│   ├── Heading: "Our Values"
│   └── List: Privacy-first, Substance over flash, Continuous evolution
└── CTA Section
    └── "Start Your Free Account" button → /auth/signup
```

**Placeholder Content (use this):**

```typescript
const PLACEHOLDER_CONTENT = {
  founderStory: `[FOUNDER STORY - 250-350 words]

This section will contain Ahiya's personal narrative about why Mirror of Dreams was created. The story should include:
- The personal experience that led to this product
- The transformation Ahiya hopes to enable for users
- The vision for reflection as a practice

CONTENT STATUS: Pending from Ahiya
`,
  mission: `[MISSION STATEMENT - 50-100 words]

We believe everyone has dreams worth pursuing and the wisdom to achieve them. Mirror of Dreams provides a sacred space for reflection, powered by AI that listens without judgment and recognizes patterns we might miss.

CONTENT STATUS: Pending from Ahiya
`,
  philosophy: `[PRODUCT PHILOSOPHY - 100-150 words]

Why combine human reflection with AI? Because...
[Explanation of the approach, what makes it unique]

CONTENT STATUS: Pending from Ahiya
`,
  values: [
    {
      title: 'Privacy-First',
      description: 'Your reflections are sacred and private. We never share your data.',
    },
    {
      title: 'Substance Over Flash',
      description: 'Beautiful design serves depth, not distraction.',
    },
    {
      title: 'Continuous Evolution',
      description: 'We grow alongside your reflection practice.',
    },
  ],
};
```

**Components to Use:**
- Simple navigation (not AppNavigation - marketing page)
- `CosmicBackground` with animation
- `GlassCard` (4 cards for sections)
- `GlowButton` (CTA)
- `next/image` (founder photo, if provided)

**Mark as NEEDS_CONTENT:**
Add comment at top of file:
```typescript
/**
 * About Page - Mirror of Dreams
 *
 * CONTENT STATUS: Placeholder content used
 * TODO: Replace placeholder content with Ahiya's founder story, mission, philosophy
 * See PLACEHOLDER_CONTENT object for sections needing real content
 */
```

#### Pricing Page

**Layout Structure (Pattern 9 from patterns.md):**

```
Pricing Page
├── Hero Section
│   ├── Title: "Choose Your Path"
│   └── Subtitle: "Start free and upgrade as your reflection practice deepens"
├── Tier Comparison Cards (3 columns)
│   ├── Free Tier Card (GlassCard)
│   ├── Premium Tier Card (GlassCard with "Most Popular" badge)
│   └── Pro Tier Card (GlassCard)
└── FAQ Section (details/summary accordion)
    ├── "Can I change plans later?"
    ├── "What happens if I exceed my reflection limit?"
    ├── "Is my data secure?"
    ├── "What's your refund policy?"
    └── "Do you offer annual billing?"
```

**Tier Comparison Data:**

```typescript
import { TIER_LIMITS } from '@/lib/utils/constants';

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
    popular: true, // Highlight this tier
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
```

**FAQ Content:**

```typescript
const faqs = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes! You can upgrade or downgrade at any time. When upgrading, new features are available immediately. When downgrading, changes take effect at the end of your current billing period.',
  },
  {
    question: 'What happens if I exceed my reflection limit?',
    answer: 'When you reach your monthly limit, you\'ll be prompted to upgrade. Your existing reflections remain accessible, but you won\'t be able to create new ones until next month or after upgrading.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. All data is encrypted in transit and at rest. We never share your reflections with third parties. Your dreams are sacred and private.',
  },
  {
    question: 'What\'s your refund policy?',
    answer: 'We offer a 14-day money-back guarantee. If you\'re not satisfied with Premium or Pro within 14 days of purchase, contact support for a full refund.',
  },
  {
    question: 'Do you offer annual billing?',
    answer: 'Yes! Annual billing saves 17% compared to monthly. You can switch to annual billing from your account settings after signing up.',
  },
];
```

**Components to Use:**
- Simple navigation (not AppNavigation)
- `CosmicBackground` with animation
- `GlassCard` (3 cards for tiers)
- `GlowButton` (CTAs)
- Native `<details>` for FAQ (no JavaScript needed)
- lucide-react icons: `Check` and `X` for feature matrix

**Highlight Popular Tier:**
```typescript
className={`relative ${
  tier.popular
    ? 'border-2 border-purple-500/50 shadow-lg shadow-purple-500/20'
    : ''
}`}
```

### Patterns to Follow

**From patterns.md:**
- **Pattern 2:** Public Marketing Page Layout (About and Pricing pages)
- **Pattern 9:** Tier Comparison Table (Pricing page)

### Testing Requirements

**Tier Limits (15 minutes):**
- [ ] Dashboard shows correct limits (free tier: X / 10)
- [ ] Pricing page Free tier shows "10 reflections per month"
- [ ] Pricing page Premium tier shows "50 reflections per month"
- [ ] Pricing page Pro tier shows "Unlimited reflections"
- [ ] No hardcoded tier limits in users.ts router

**About Page (10 minutes):**
- [ ] Page loads at /about (no 404)
- [ ] Layout responsive (mobile, tablet, desktop)
- [ ] All sections render
- [ ] CTA button links to /auth/signup
- [ ] Placeholder content clearly marked

**Pricing Page (10 minutes):**
- [ ] Page loads at /pricing (no 404)
- [ ] 3 tier cards display correctly
- [ ] Premium tier highlighted (border glow)
- [ ] Feature checkmarks/X icons display
- [ ] FAQ accordion works (native details/summary)
- [ ] Layout responsive (3 columns desktop, 1 column mobile)
- [ ] CTA buttons link correctly

**Total Testing Time:** ~30 minutes

### Potential Split Strategy

**NOT NEEDED** - Total estimated time is 4-6 hours (well within single builder capacity)

---

## Builder Execution Order

### Phase 1: Builder-1 Foundation (Hours 0-6)

**Builder-1 starts immediately:**
1. Create backend mutations (changeEmail, updatePreferences)
2. Create validation schemas
3. Create notDemo middleware
4. Test mutations manually (Postman or tRPC DevTools)
5. Commit to feature branch: `iteration-13-builder-1`

**Checkpoint:** Backend mutations complete and tested

### Phase 2: Builder-1 Frontend (Hours 6-10)

**Builder-1 continues:**
1. Create Profile page
2. Create Settings page
3. Test all mutations from frontend
4. Verify mobile responsive
5. Commit to feature branch: `iteration-13-builder-1`
6. **Signal Builder-2:** Backend complete, safe to pull branch

**Checkpoint:** Profile and Settings pages complete

### Phase 3: Builder-2 Parallel Start (Hours 6-10)

**Builder-2 starts after Builder-1 commits backend:**
1. Pull Builder-1 branch: `iteration-13-builder-1`
2. Fix tier limits (constants.ts, users.ts)
3. Create About page (placeholder content)
4. Create Pricing page (use TIER_LIMITS constant)
5. Test tier limits display
6. Commit to feature branch: `iteration-13-builder-2`

**Checkpoint:** About and Pricing pages complete, tier limits fixed

### Phase 4: Integration (Hours 10-11)

**Integration Validator (or Builder-1):**
1. Merge `iteration-13-builder-1` → main
2. Merge `iteration-13-builder-2` → main (resolve any conflicts)
3. Test all four pages load (Profile, Settings, About, Pricing)
4. Test navigation links (no 404s)
5. Test mutations (Profile, Settings)
6. Verify tier limits correct (Dashboard, Pricing page)
7. Verify mobile responsive (all pages)

**Checkpoint:** All pages integrated, no conflicts

### Phase 5: Validation (Hours 11-12)

**Comprehensive Testing:**
- Run full test suite (see Testing Requirements above)
- Check demo user protection (email change blocked)
- Verify toast notifications work
- Test edge cases (wrong password, duplicate email)
- Lighthouse audit (performance <2.5s LCP, bundle size <+15KB)

**Checkpoint:** All tests pass, ready for deployment

---

## Integration Notes

### Shared Files (Potential Conflicts)

**File:** `server/trpc/routers/users.ts`
- Builder-1 adds mutations at end of router (lines ~104-200)
- Builder-2 removes hardcoded TIER_LIMITS (lines 164-168), adds import

**Resolution Strategy:**
- Builder-1 commits first (mutations added)
- Builder-2 pulls Builder-1 branch before starting
- Builder-2 modifies getDashboardData function (remove hardcoded limits)
- No conflict (different sections of file)

**File:** `types/schemas.ts`
- Builder-1 adds schemas (lines ~36-52)
- Builder-2 only imports, doesn't modify

**Resolution:** No conflict

### Content Handoff Process

**About Page Content:**
1. Builder-2 creates layout with placeholder content
2. Builder-2 marks file with "NEEDS_CONTENT" comment
3. Builder-2 provides template to Ahiya (see placeholder content above)
4. Ahiya writes content (parallel to testing/deployment)
5. Ahiya commits content directly to About page (no code changes needed)

**Timeline:**
- Builder-2 completes About page: Hour 8
- Ahiya writes content: Hours 8-11 (parallel)
- Content integrated: Hour 11 (before final deployment)

---

## Success Metrics

**Code Quality:**
- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors
- [ ] All imports ordered correctly (see patterns.md)
- [ ] No console.log statements

**Functionality:**
- [ ] All 4 pages load (no 404s)
- [ ] All mutations work (6 total: changeEmail, updatePreferences, updateProfile, changePassword, deleteAccount)
- [ ] Demo user protection works (email change blocked)
- [ ] Toast notifications on all actions

**Performance:**
- [ ] Bundle size increase <15KB total
- [ ] All pages LCP <2.5s (Lighthouse)
- [ ] Mobile responsive (all pages)

**Testing:**
- [ ] All manual tests pass (see Testing Requirements)
- [ ] Edge cases handled (wrong password, duplicate email, etc.)
- [ ] Mobile tested on real device (not just DevTools)

**Content:**
- [ ] About page marked "NEEDS_CONTENT" (if placeholder used)
- [ ] Pricing page tier limits match constants.ts
- [ ] All copy reviewed for clarity

---

## Risk Mitigation

**Risk:** Builder-1 exceeds time estimate (backend complex)
**Mitigation:** Builder-1 can skip Settings page, hand off to Builder-2 (see split strategy)

**Risk:** Tier limits conflict between builders
**Mitigation:** Builder-2 starts AFTER Builder-1 commits backend (sequential)

**Risk:** About page content delays deployment
**Mitigation:** Deploy with placeholder content, integrate real content post-deployment

**Risk:** Email change JWT invalidation broken
**Mitigation:** Test thoroughly, verify token replaced in localStorage (critical path testing)

**Risk:** Demo user protection not working
**Mitigation:** Test demo user separately, verify middleware blocks mutations

---

## Final Checklist (Before Deployment)

### Builder-1 Checklist
- [ ] Backend mutations created (changeEmail, updatePreferences)
- [ ] Validation schemas created
- [ ] notDemo middleware created and applied
- [ ] Profile page complete (all mutations work)
- [ ] Settings page complete (all toggles work)
- [ ] Mobile responsive tested
- [ ] Demo user protection tested
- [ ] Toast notifications tested
- [ ] Branch committed: `iteration-13-builder-1`

### Builder-2 Checklist
- [ ] Tier limits fixed (constants.ts updated)
- [ ] users.ts router refactored (imports constants)
- [ ] About page created (placeholder or real content)
- [ ] Pricing page created (tier limits correct)
- [ ] Mobile responsive tested
- [ ] Navigation links tested (footer → About, Pricing)
- [ ] Branch committed: `iteration-13-builder-2`

### Integration Checklist
- [ ] Both branches merged to main
- [ ] No merge conflicts
- [ ] All 4 pages load (no 404s)
- [ ] All mutations tested from frontend
- [ ] Tier limits display correctly (Dashboard, Pricing)
- [ ] Mobile responsive verified
- [ ] Lighthouse audit passed (<2.5s LCP)
- [ ] Bundle size checked (<+15KB)
- [ ] Demo user protection verified
- [ ] Content status confirmed (About page)

---

## Post-Deployment Tasks

**Immediate (Hour 0-1):**
- [ ] Monitor error logs (Sentry/Vercel)
- [ ] Test all mutations in production
- [ ] Verify tier limits correct in production
- [ ] Test demo user protection in production

**Short-term (Days 1-7):**
- [ ] Integrate real About page content (if placeholder used)
- [ ] Monitor user feedback on Settings page
- [ ] Track profile mutation usage (analytics)
- [ ] Monitor bundle size impact

**Long-term (Weeks 1-4):**
- [ ] Implement email verification (post-MVP)
- [ ] Add activity log / audit trail
- [ ] Consider soft delete with recovery period
- [ ] Monitor tier limit impact on conversions

---

**Iteration 13 Builder Tasks Complete**

**Total Estimated Effort:** 12-16 hours (2 builders)
**Critical Path:** Backend mutations (Builder-1) → Tier limits fix (Builder-2)
**Success Metric:** Zero 404s on navigation links, all mutations functional
