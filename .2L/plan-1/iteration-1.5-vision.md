# Iteration 1.5: Complete Mirror of Truth Production Readiness

**Created:** 2025-10-22T03:36:00Z
**Plan:** plan-1
**Type:** Completion iteration (before Mirror of Dreams rebrand)

---

## Problem Statement

Iteration 1 successfully completed the architectural migration (JavaScript → TypeScript/tRPC/Next.js), but **users see placeholder pages** instead of the working Mirror of Truth application. The original Mirror of Truth (in `../mirror-of-truth-online`) has a proven, beautiful UI that users love - we need to migrate it to the new stack.

**Current pain points:**
- Landing page shows "Foundation ready - Portal component migration pending"
- Dashboard shows placeholder text
- Reflection creation (core feature!) shows placeholder
- Users can't actually use the app despite infrastructure working perfectly
- ~34 components in `.jsx` need migration to `.tsx`

---

## Goal

**Make Mirror of Truth fully production-ready** by migrating all user-facing components from the original implementation to the new TypeScript/tRPC/Next.js stack.

**Success = Users can complete the entire core flow:**
1. Visit landing page → See beautiful cosmic portal
2. Click "Reflect Me" → Sign in (already works!)
3. View dashboard → See real data, not placeholders
4. Click "Reflect Now" → Complete 5-question flow
5. View AI response → Beautifully formatted reflection
6. Browse history → See all previous reflections (already works!)
7. Manage profile → Update settings, view usage

---

## Reference Implementation

**Source of Truth:** `../mirror-of-truth-online/src/components/`

This is the original Mirror of Truth with proven UX:
- 34 components total
- Cosmic theme (purple/blue gradients, mirror shards, animations)
- Polished, production-ready UI
- Mobile responsive
- Smooth animations and transitions

**Migration Strategy:**
- Convert `.jsx` → `.tsx` (TypeScript)
- Replace `fetch()` → `trpc` (type-safe API calls)
- Replace React Router → Next.js App Router navigation
- Preserve ALL styling, animations, cosmic effects
- Keep exact same UX (no visual changes)

---

## Core User Flow (Must Work End-to-End)

### Flow 1: New User Journey

**Steps:**
1. User visits `http://localhost:3002`
2. Sees beautiful landing page (Portal component):
   - Cosmic background with floating mirror shards
   - Tagline: "Stop asking what to do. See who you already are."
   - "Start Free" button (leads to signup - if time allows)
   - "Reflect Me" button (leads to signin)
   - Social proof/testimonials (optional)
3. User clicks "Reflect Me"
4. Redirected to `/auth/signin` (already works ✅)
5. Signs in successfully
6. Redirected to `/dashboard`
7. Sees working dashboard:
   - Personalized greeting ("Good morning, [Name]")
   - Usage card (reflections count: X/Y this month)
   - Recent reflections preview (3 cards)
   - "Reflect Now" button prominent
   - Profile menu (top right)
8. User clicks "Reflect Now"
9. Taken to `/reflection` (questionnaire page)
10. Completes 5-question flow:
    - Q1: What is your dream? (textarea, 3200 chars)
    - Q2: What is your plan? (textarea, 4000 chars)
    - Q3: Have you set a date? (radio: Yes/No)
    - Q4: What's your relationship with this dream? (textarea, 4000 chars)
    - Q5: What are you willing to give? (textarea, 2400 chars)
    - Tone selection: Gentle Clarity / Luminous Intensity / Sacred Fusion
11. Clicks "Generate My Reflection"
12. Loading state (cosmic spinner)
13. Redirected to `/reflection/output`
14. Sees beautifully formatted AI reflection
15. Can copy, email, or create new reflection
16. Returns to dashboard
17. Sees new reflection in recent list
18. Can click "View All" → Goes to `/reflections` (already works ✅)

**Edge cases:**
- No reflections yet: Show empty state with "Create first reflection" CTA
- Monthly limit reached: Show upgrade prompt
- Network error: Show retry button
- Invalid input: Show validation errors

**Error handling:**
- API failures: Graceful error messages
- Auth timeout: Redirect to signin with return URL
- Rate limiting: Clear message about limits

### Flow 2: Returning User Journey

**Steps:**
1. User visits site
2. Already authenticated (JWT token valid)
3. Automatically redirected to `/dashboard`
4. Sees updated dashboard with new data
5. Can browse reflections, create new ones, manage profile

---

## Feature Breakdown

### Must-Have (Iteration 1.5 MVP)

#### 1. **Landing Page (Portal Component)**
- **Description:** Beautiful first impression when users visit the site
- **User story:** As a visitor, I want to see what Mirror of Truth is and how to start
- **Acceptance criteria:**
  - [ ] Cosmic background renders with animations
  - [ ] Floating mirror shards animation works
  - [ ] Tagline displays correctly
  - [ ] "Reflect Me" button leads to signin
  - [ ] "Start Free" button leads to signup (if time allows, else same as Reflect Me)
  - [ ] Mobile responsive
  - [ ] Smooth fade-in animations
- **Source:** `../mirror-of-truth-online/src/components/portal/Portal.jsx`

#### 2. **Dashboard (Complete)**
- **Description:** User's home base with overview of activity and quick actions
- **User story:** As a user, I want to see my reflection activity and take actions
- **Acceptance criteria:**
  - [ ] Personalized greeting displays (time-aware: "Good morning/afternoon/evening")
  - [ ] Usage card shows accurate reflection count and tier limits
  - [ ] Recent reflections card shows last 3 reflections with previews
  - [ ] "Reflect Now" button prominent and working
  - [ ] "View All Reflections" link works (goes to `/reflections`)
  - [ ] Profile dropdown menu functional (top right)
  - [ ] Cosmic background and theme consistent
  - [ ] All cards load data via tRPC
  - [ ] Loading states for each card
  - [ ] Mobile responsive grid layout
- **Source:** `../mirror-of-truth-online/src/components/dashboard/Dashboard.jsx` + cards

#### 3. **Reflection Creation Flow (Questionnaire)**
- **Description:** 5-question guided reflection process
- **User story:** As a user, I want to create a reflection by answering 5 questions
- **Acceptance criteria:**
  - [ ] Page loads at `/reflection`
  - [ ] Question 1 renders with character count (0/3200)
  - [ ] Question 2 renders with character count (0/4000)
  - [ ] Question 3 shows Yes/No radio buttons
  - [ ] Question 4 renders with character count (0/4000)
  - [ ] Question 5 renders with character count (0/2400)
  - [ ] Progress indicator shows current question (1/5, 2/5, etc.)
  - [ ] "Back" and "Continue" buttons work
  - [ ] Form validation prevents empty submissions
  - [ ] Character limits enforced
  - [ ] Tone selection screen after Q5
  - [ ] Tone cards: Gentle Clarity, Luminous Intensity, Sacred Fusion
  - [ ] "Generate Reflection" submits to tRPC
  - [ ] Loading state during AI generation
  - [ ] Cosmic theme and animations throughout
  - [ ] Mobile responsive
  - [ ] Auto-save progress to localStorage (optional, nice-to-have)
- **Source:** `../mirror-of-truth-online/src/components/mirror/MirrorApp.jsx` + Questionnaire

#### 4. **Reflection Output Display**
- **Description:** Show AI-generated reflection with sacred formatting
- **User story:** As a user, I want to read my AI reflection in a beautiful format
- **Acceptance criteria:**
  - [ ] Page loads at `/reflection/output`
  - [ ] Full reflection displays with sacred HTML formatting
  - [ ] Metadata shows: date, word count, read time, tone
  - [ ] "Copy Text" button works
  - [ ] "Email Myself" button works (or disabled if not implemented)
  - [ ] "New Reflection" button returns to questionnaire
  - [ ] "Back to Dashboard" link works
  - [ ] Cosmic background
  - [ ] Mobile responsive reading experience
  - [ ] Print-friendly layout
- **Source:** `../mirror-of-truth-online/src/components/mirror/Output.jsx`

#### 5. **Sign Up Flow**
- **Description:** New users can create accounts
- **User story:** As a visitor, I want to create an account to start reflecting
- **Acceptance criteria:**
  - [ ] Page loads at `/auth/signup`
  - [ ] Form has: name, email, password fields
  - [ ] Password strength indicator
  - [ ] Terms & Privacy checkbox
  - [ ] "Sign Up" button calls `trpc.auth.signup`
  - [ ] Validation errors display inline
  - [ ] Success redirects to dashboard
  - [ ] "Already have account? Sign in" link works
  - [ ] Same cosmic theme as signin page
  - [ ] Mobile responsive
- **Source:** `../mirror-of-truth-online/src/components/auth/AuthApp.jsx` (signup mode)
- **Note:** Signin already works ✅

#### 6. **Profile Management**
- **Description:** User can view and edit their profile
- **User story:** As a user, I want to manage my account settings
- **Acceptance criteria:**
  - [ ] Profile dropdown menu in top right of dashboard
  - [ ] Shows user name and tier badge
  - [ ] "Profile" link goes to profile page
  - [ ] "Sign Out" button works
  - [ ] Profile page shows: name, email, tier, joined date
  - [ ] Can update name
  - [ ] Can change password
  - [ ] Usage statistics visible
  - [ ] Cosmic theme consistent
- **Source:** Dashboard user menu + profile components

---

### Should-Have (If Time Allows)

1. **Evolution Reports Access** - Link from dashboard (UI only, functionality in Iteration 2)
2. **Onboarding Flow** - 3-step intro for new users
3. **Empty States** - Beautiful empty states for zero reflections
4. **Tooltips** - Helpful hints on questionnaire
5. **Keyboard Shortcuts** - Navigation with arrow keys

### Could-Have (Future)

1. **Dark Mode Toggle** - User preference for theme
2. **Export Reflections** - Download as PDF
3. **Search Reflections** - Full-text search in history
4. **Tags/Categories** - Organize reflections by topic

---

## Components to Migrate

### Priority 1: Critical Path (Must Migrate)

From `../mirror-of-truth-online/src/components/`:

**Portal (Landing Page):**
1. `portal/Portal.jsx` → `app/page.tsx`
2. `portal/components/ButtonGroup.jsx` → `components/portal/ButtonGroup.tsx`
3. `portal/components/MirrorShards.jsx` → `components/portal/MirrorShards.tsx`
4. `portal/components/Taglines.jsx` → `components/portal/Taglines.tsx`
5. `portal/components/UserMenu.jsx` → `components/portal/UserMenu.tsx`
6. `portal/hooks/usePortalState.js` → `components/portal/hooks/usePortalState.ts`

**Dashboard:**
7. `dashboard/Dashboard.jsx` → `app/dashboard/page.tsx` ✅ (placeholder exists)
8. `dashboard/cards/UsageCard.jsx` → `components/dashboard/cards/UsageCard.tsx`
9. `dashboard/cards/ReflectionsCard.jsx` → `components/dashboard/cards/ReflectionsCard.tsx`
10. `dashboard/cards/EvolutionCard.jsx` → `components/dashboard/cards/EvolutionCard.tsx`
11. `dashboard/cards/SubscriptionCard.jsx` → `components/dashboard/cards/SubscriptionCard.tsx`
12. `dashboard/shared/WelcomeSection.jsx` → `components/dashboard/shared/WelcomeSection.tsx`
13. `dashboard/shared/DashboardCard.jsx` → `components/dashboard/shared/DashboardCard.tsx`
14. `dashboard/shared/DashboardGrid.jsx` → `components/dashboard/shared/DashboardGrid.tsx`
15. `dashboard/shared/ReflectionItem.jsx` → `components/dashboard/shared/ReflectionItem.tsx`
16. `dashboard/shared/LoadingStates.jsx` → `components/dashboard/shared/LoadingStates.tsx`
17. `dashboard/shared/ProgressRing.jsx` → `components/dashboard/shared/ProgressRing.tsx`
18. `dashboard/shared/TierBadge.jsx` → `components/dashboard/shared/TierBadge.tsx`
19. `dashboard/shared/ThemeTag.jsx` → `components/dashboard/shared/ThemeTag.tsx`

**Reflection Creation:**
20. `mirror/MirrorApp.jsx` → `app/reflection/page.tsx` ✅ (placeholder exists)
21. `mirror/Questionnaire.jsx` → `components/reflection/Questionnaire.tsx`
22. `mirror/QuestionStep.jsx` → `components/reflection/QuestionStep.tsx`
23. `mirror/ToneSelection.jsx` → `components/reflection/ToneSelection.tsx`
24. `mirror/Output.jsx` → `app/reflection/output/page.tsx` ✅ (placeholder exists)
25. `mirror/components/ProgressIndicator.jsx` → `components/reflection/ProgressIndicator.tsx`
26. `mirror/components/CharacterCounter.jsx` → `components/reflection/CharacterCounter.tsx`

**Auth:**
27. `auth/AuthApp.jsx` → `app/auth/signup/page.tsx` (signup mode)
   - Signin already done ✅

**Shared:**
28. `shared/CosmicBackground.jsx` → `components/shared/CosmicBackground.tsx` ✅ (already done!)

### Priority 2: Supporting Components

**Hooks:**
29. `hooks/useDashboard.js` → `hooks/useDashboard.ts`
30. `hooks/usePersonalizedGreeting.js` → `hooks/usePersonalizedGreeting.ts`
31. `hooks/useAuth.js` → `hooks/useAuth.ts`
32. `hooks/useStaggerAnimation.js` → `hooks/useStaggerAnimation.ts`
33. `hooks/useBreathingEffect.jsx` → `hooks/useBreathingEffect.ts`
34. `hooks/useAnimatedCounter.js` → `hooks/useAnimatedCounter.ts`

**Utilities:**
35. `utils/greetingGenerator.js` → `utils/greetingGenerator.ts` (gift references already removed ✅)

**Total:** ~35 components/files to migrate

---

## Migration Patterns

### TypeScript Conversion Pattern

**Original (.jsx):**
```jsx
// src/components/dashboard/cards/UsageCard.jsx
import React from 'react';

const UsageCard = ({ usage, isLoading }) => {
  // Component logic
};

export default UsageCard;
```

**Migrated (.tsx):**
```tsx
// components/dashboard/cards/UsageCard.tsx
'use client';

import React from 'react';
import { UsageData } from '@/types';

interface UsageCardProps {
  usage: UsageData;
  isLoading: boolean;
}

const UsageCard: React.FC<UsageCardProps> = ({ usage, isLoading }) => {
  // Component logic
};

export default UsageCard;
```

### API Integration Pattern

**Original (fetch):**
```javascript
const response = await fetch('/api/reflections', {
  method: 'POST',
  body: JSON.stringify({ action: 'create', data }),
});
const result = await response.json();
```

**Migrated (tRPC):**
```typescript
const createReflection = trpc.reflections.create.useMutation();

// Usage
await createReflection.mutateAsync({
  dream: data.dream,
  plan: data.plan,
  // ...
});
```

### Navigation Pattern

**Original (React Router):**
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');
```

**Migrated (Next.js):**
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
```

### Styling Pattern

**Keep existing CSS:**
- Import CSS files from `src/styles/` in components
- No Tailwind conversion (cosmic theme already works)
- Preserve all animations and effects
- Keep mobile responsive styles

---

## Data Model (Already Exists)

**From Iteration 1:** All types defined in `types/` directory

**Key types to use:**
- `User` - User account data
- `Reflection` - Reflection data
- `AuthUser` - Authenticated user context
- `UsageData` - Monthly usage tracking
- `TierName` - Subscription tier

---

## Technical Requirements

**Must use:**
- ✅ TypeScript strict mode (already configured)
- ✅ tRPC for all API calls (already set up)
- ✅ Next.js App Router (already configured)
- ✅ React 18 with hooks
- ✅ Types from `types/` directory

**Must preserve:**
- ✅ Cosmic theme (purple/blue gradients)
- ✅ Mirror shards animations
- ✅ Sacred HTML formatting for reflections
- ✅ Mobile responsive design
- ✅ Loading states and error handling
- ✅ Character counters and validation

**Must NOT:**
- ❌ Change any visual design
- ❌ Modify UX flows
- ❌ Skip animations or effects
- ❌ Break mobile responsiveness

---

## Success Criteria

**The iteration is complete when:**

### 1. **End-to-End Flow Works**
- [ ] User can visit landing page and see beautiful Portal UI
- [ ] User can sign in (already works ✅)
- [ ] User can view dashboard with real data
- [ ] User can create a reflection through 5-question flow
- [ ] User can view AI-generated reflection
- [ ] User can browse reflection history (already works ✅)
- [ ] User can manage profile

### 2. **Quality Standards Met**
- [ ] TypeScript compilation: 0 errors (strict mode)
- [ ] Production build succeeds
- [ ] All pages render without placeholders
- [ ] Mobile responsive (test on 320px, 768px, 1920px)
- [ ] Loading states for all async operations
- [ ] Error handling for all API calls
- [ ] Cosmic theme consistent across all pages

### 3. **Performance Targets**
- [ ] First load JS < 100 kB
- [ ] Time to Interactive < 3s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Smooth 60fps animations

### 4. **Browser Compatibility**
- [ ] Works in Chrome/Edge (primary)
- [ ] Works in Firefox
- [ ] Works in Safari (iOS and macOS)
- [ ] Responsive on mobile (iOS Safari, Chrome Android)

---

## Out of Scope (Deferred to Iteration 2)

**Not included in this iteration:**
- Dreams feature (Iteration 2)
- Mirror of Dreams rebrand (Iteration 2)
- Evolution reports functionality (Iteration 2)
- Artifact/visualization generation (Iteration 2)
- PayPal subscription flow (Iteration 4)
- Email notifications (Iteration 4)
- Admin dashboard (Iteration 3)
- Claude Sonnet 4.5 migration (Iteration 2)

**Why:** Focus on completing Mirror of Truth core flow first. Once this works perfectly, we can add Dreams layer and rebrand.

---

## Risk Assessment

### HIGH RISK
**35 components to migrate in one iteration**
- **Mitigation:** Use proven pattern from Builder-3A (already migrated CosmicBackground and signin)
- **Mitigation:** Prioritize critical path (landing → dashboard → reflection)
- **Mitigation:** Can split into sub-builders if needed

### MEDIUM RISK
**Preserving exact styling and animations**
- **Mitigation:** Copy CSS files directly, don't modify
- **Mitigation:** Test each component visually as we migrate
- **Mitigation:** Use original as reference (side-by-side comparison)

### LOW RISK
**tRPC integration**
- **Mitigation:** Already proven pattern from Iteration 1
- **Mitigation:** All routers already exist and work
- **Mitigation:** Types ensure correctness at compile time

---

## Timeline Estimate

**Based on Builder-3A experience:**
- Builder-3A migrated 2 components in 2 hours (with full implementation)
- ~35 components total
- **Optimistic:** 2-3 days (if components are simple)
- **Realistic:** 3-4 days (with testing and polish)
- **Pessimistic:** 5-6 days (if complex interactions discovered)

**Recommended approach:**
- Day 1: Landing page + Dashboard (10 components)
- Day 2: Reflection flow (10 components)
- Day 3: Polish, testing, bug fixes
- Day 4: Buffer for edge cases

---

## Success Metrics

**Deployment readiness:**
1. **User can complete full flow:** 100% (all steps work)
2. **No placeholders visible:** 100% (all pages have real UI)
3. **TypeScript errors:** 0
4. **Build warnings:** 0
5. **Mobile responsive:** 100% (all breakpoints work)
6. **Loading states:** 100% (all async ops have loaders)
7. **Error handling:** 100% (all API failures handled gracefully)

---

## Next Steps

After completion of Iteration 1.5:

- [ ] Manual testing of full user journey
- [ ] Deploy to staging environment
- [ ] User acceptance testing (you test it!)
- [ ] Production deployment
- [ ] **Then:** Begin Iteration 2 (Dreams + Mirror of Dreams rebrand)

---

**Iteration Status:** READY FOR PLANNING
**Complexity:** MEDIUM-HIGH (many components, but proven patterns)
**Ready for:** `/2l-mvp` (auto-plan and execute)
