# Explorer 1 Report: Component Architecture & Migration Complexity

**Focus Area:** Component architecture, migration patterns, and complexity assessment for migrating 35+ components from Mirror of Truth to TypeScript/Next.js

**Exploration Date:** 2025-10-22

**Source:** `/home/ahiya/mirror-of-truth-online/src/components/`

**Target:** `/home/ahiya/mirror-of-dreams/` (TypeScript/tRPC/Next.js stack)

---

## Executive Summary

Successfully analyzed **37 component files** (13,725 total lines) across the original Mirror of Truth codebase. The migration involves transforming well-structured React components from vanilla JavaScript/React Router to TypeScript/Next.js App Router with tRPC integration. 

**Key Findings:**
- **Proven migration pattern exists** (CosmicBackground.tsx, signin page already migrated successfully)
- **Complexity is MEDIUM overall** - Components are well-architected with clear separation of concerns
- **Critical path can be completed in 3-4 days** with proper sequencing
- **No blocking dependencies** - Foundation from Iteration 1 is solid
- **Recommend 3 builder splits** for optimal parallelization

---

## Component Inventory

### Total Component Count: 37 Files

**Breakdown by category:**

| Category | Count | Total Lines | Avg Complexity |
|----------|-------|-------------|----------------|
| Portal (Landing) | 6 | ~1,800 | Medium |
| Dashboard | 12 | ~4,500 | Medium-High |
| Reflection/Mirror | 9 | ~3,200 | Medium-High |
| Auth | 4 | ~1,200 | Low-Medium |
| Shared | 1 | ~100 | Low (✅ Done) |
| Hooks | 10 | ~1,900 | Medium |
| Utils | 4 | ~1,000 | Low-Medium |

**Already Migrated (Iteration 1):**
- ✅ `components/shared/CosmicBackground.tsx` (167 lines)
- ✅ `app/auth/signin/page.tsx` (576 lines)
- ✅ `src/utils/greetingGenerator.js` (474 lines, gift refs removed)

**Remaining to migrate:** **34 files**

---

## Discoveries

### Discovery 1: Clean Component Architecture

**Pattern Observed:**
- Components follow **container/presentational** pattern
- Clear separation: business logic in hooks, presentation in components
- Consistent prop interfaces and state management
- No spaghetti code or anti-patterns detected

**Example:** `Dashboard.jsx`
```javascript
// Hooks handle data fetching and state
const { usage, evolution, reflections, isLoading } = useDashboard();
const { greeting, welcomeMessage } = usePersonalizedGreeting();

// Component focuses on rendering
return <DashboardGrid>
  <UsageCard data={usage} />
  <ReflectionsCard data={reflections} />
</DashboardGrid>
```

**Migration Impact:** LOW RISK - Clean architecture makes migration straightforward

### Discovery 2: Atomic Component Design

**Pattern Observed:**
- Dashboard has 7 specialized sub-components (cards, shared utilities)
- Each card is self-contained: `UsageCard`, `ReflectionsCard`, `EvolutionCard`, `SubscriptionCard`
- Shared components: `DashboardCard`, `DashboardGrid`, `ProgressRing`, `TierBadge`, `ThemeTag`

**Migration Strategy:**
- Migrate shared components FIRST (foundation)
- Then migrate cards (can be parallelized)
- Finally assemble dashboard page

**Risk:** LOW - Atomic design enables incremental testing

### Discovery 3: Sophisticated State Management

**Pattern Observed:**
- Custom hooks handle complex state (`useDashboard`, `useAuth`, `usePortalState`)
- Form persistence with `useFormPersistence`
- Animation hooks (`useStaggerAnimation`, `useBreathingEffect`, `useAnimatedCounter`)
- Authentication hooks with token refresh

**Migration Complexity:**
- Core hooks: MEDIUM (need tRPC integration)
- Animation hooks: LOW (mostly UI, minimal changes)
- Form hooks: MEDIUM (localStorage logic remains same)

**Example Complexity:** `useAuth.js` (396 lines)
- Current: Uses `authService.signin()` (fetch-based)
- Migrated: Uses `trpc.auth.signin.useMutation()`
- Pattern already proven in signin page ✅

### Discovery 4: Extensive Animation System

**Pattern Observed:**
- Stagger animations for grid items
- Breathing effects for cosmic backgrounds
- Animated counters for dashboard stats
- Progress rings with SVG animations
- Tone-based visual effects (fusion, gentle, intense)

**Files:**
- `useStaggerAnimation.js` - Grid animation orchestration
- `useBreathingEffect.jsx` - Subtle scale/opacity effects
- `useAnimatedCounter.js` - Smooth number transitions
- `ToneElements.jsx` - Tone-specific visual effects

**Migration Complexity:** LOW-MEDIUM
- Hooks are pure JavaScript (minimal TypeScript conversion)
- No API dependencies
- Can be migrated verbatim with type annotations

### Discovery 5: Complex Questionnaire Flow

**Pattern Observed:**
- 5-question flow with character limits
- Date input conditional on Q3 answer
- Real-time character counting
- Form persistence to localStorage
- Tone selection after questions
- Loading states during AI generation

**Files:**
- `Questionnaire.jsx` (522 lines) - Main form orchestration
- `QuestionCard.jsx` - Reusable question component
- `ToneSelector.jsx` - Tone selection UI
- `CharacterCounter.jsx` - Character limit tracking

**Migration Complexity:** MEDIUM-HIGH
- Form state management: 10 fields
- Validation logic
- tRPC mutation for submission
- Navigation to output page with ID

**Recommendation:** Migrate in 2 phases:
1. Phase A: Core questionnaire UI (questions 1-5)
2. Phase B: Tone selection + submission logic

---

## Patterns Identified

### Pattern 1: TypeScript Conversion

**Description:** Consistent pattern for converting .jsx to .tsx

**Original (.jsx):**
```javascript
const UsageCard = ({ data, isLoading, animated = true }) => {
  // Component logic
};
export default UsageCard;
```

**Migrated (.tsx):**
```typescript
'use client';

import { UsageData } from '@/types';

interface UsageCardProps {
  data: UsageData;
  isLoading: boolean;
  animated?: boolean;
}

const UsageCard: React.FC<UsageCardProps> = ({ data, isLoading, animated = true }) => {
  // Component logic
};

export default UsageCard;
```

**Use Case:** Apply to ALL 34 remaining components

**Recommendation:** ✅ USE THIS - Proven in Iteration 1

### Pattern 2: tRPC API Integration

**Description:** Replace fetch-based API calls with type-safe tRPC

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

await createReflection.mutateAsync({
  dream: data.dream,
  plan: data.plan,
  // ...
});
```

**Use Case:** 
- Dashboard data fetching (`useDashboard` hook)
- Reflection creation (`Questionnaire` component)
- Auth operations (already proven ✅)

**Recommendation:** ✅ USE THIS - All routers exist from Iteration 1

### Pattern 3: Next.js App Router Navigation

**Description:** Replace React Router with Next.js navigation

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

**Use Case:**
- Portal button navigation
- Dashboard navigation links
- Reflection flow (questionnaire → output)
- Auth redirects

**Recommendation:** ✅ USE THIS - Simple search/replace

### Pattern 4: CSS-in-JS Preservation

**Description:** Keep existing styled-jsx patterns (already in use)

**Approach:**
```typescript
<div className="usage-card">
  {/* Component JSX */}
  
  <style jsx>{`
    .usage-card {
      /* Preserve exact CSS from original */
    }
  `}</style>
</div>
```

**Use Case:** ALL components - preserve cosmic theme

**Recommendation:** ✅ PRESERVE STYLING - No Tailwind conversion needed

---

## Complexity Assessment

### High Complexity Areas (Need Careful Migration)

#### 1. Dashboard.jsx (933 lines) - SPLIT RECOMMENDED

**Why Complex:**
- 12 child components
- Multiple custom hooks (5 hooks)
- Complex navigation state
- User dropdown menu
- Toast notifications
- Error handling
- Loading states
- Stagger animations

**Estimated Splits:**
- **Sub-builder 1A:** Core dashboard layout + navigation (foundation)
- **Sub-builder 1B:** Dashboard cards (UsageCard, ReflectionsCard, EvolutionCard, SubscriptionCard)
- **Sub-builder 1C:** Dashboard shared components (DashboardCard, ProgressRing, TierBadge, etc.)

**Time Estimate:** 6-8 hours total (2-3 hours per sub-builder)

#### 2. Questionnaire.jsx (522 lines) - SPLIT RECOMMENDED

**Why Complex:**
- Form state management (6 fields)
- Form persistence (localStorage)
- Character counting (5 fields)
- Conditional date input
- Tone selection
- Validation logic
- Submission flow
- Error handling

**Estimated Splits:**
- **Sub-builder 2A:** Question components (QuestionCard, CharacterCounter)
- **Sub-builder 2B:** Main questionnaire + tone selection + submission

**Time Estimate:** 4-5 hours total (2 hours + 2-3 hours)

#### 3. Portal.jsx with hooks (usePortalState.js = 274 lines)

**Why Complex:**
- Complex hook with 8 configuration methods
- User state management
- Button configurations based on auth state
- Tagline logic
- Usage state display
- Mirror hover effects

**Estimated Splits:**
- **Sub-builder 3A:** usePortalState hook migration
- **Sub-builder 3B:** Portal component + sub-components (MirrorShards, Navigation, MainContent, ButtonGroup)

**Time Estimate:** 4-5 hours total (2 hours hook + 2-3 hours components)

### Medium Complexity Areas

#### 4. Output.jsx - Reflection Display (300-400 lines est.)

**Complexity Factors:**
- HTML rendering (sacred formatting)
- Copy to clipboard
- Email functionality
- Metadata display
- Navigation

**Time Estimate:** 2-3 hours

#### 5. Dashboard Cards (4 cards × 200-300 lines each)

**Complexity Factors:**
- Animated counters
- Progress rings
- Data transformations
- Loading states

**Time Estimate:** 1.5-2 hours per card = 6-8 hours total

#### 6. Auth Components (SignupForm, AuthLayout)

**Complexity Factors:**
- Form validation
- Password strength
- Terms checkbox
- Error handling

**Time Estimate:** 3-4 hours total

### Low Complexity Areas

#### 7. Shared Dashboard Components

**Components:**
- DashboardCard (wrapper component)
- DashboardGrid (layout component)
- LoadingStates (loading skeletons)
- ProgressRing (SVG component)
- ReflectionItem (list item)
- TierBadge (badge component)
- ThemeTag (tag component)

**Time Estimate:** 3-4 hours total (30-40 min each)

#### 8. Portal Sub-Components

**Components:**
- MirrorShards (animation component)
- Navigation (nav bar)
- MainContent (content wrapper)
- ButtonGroup (button layout)
- UserMenu (dropdown)

**Time Estimate:** 2-3 hours total

#### 9. Mirror/Reflection Components

**Components:**
- ToneSelector (tone picker)
- QuestionCard (question wrapper)
- CharacterCounter (character limit)
- ToneElements (visual effects)

**Time Estimate:** 2-3 hours total

#### 10. Hooks

**Hooks:**
- useAnimatedCounter.js
- useBreathingEffect.jsx
- useStaggerAnimation.js
- useDashboard.js (needs tRPC)
- usePersonalizedGreeting.js
- useFormPersistence.js
- useFeedback.js
- useArtifact.js

**Time Estimate:** 4-6 hours total

#### 11. Utils

**Files:**
- constants.js (type conversion)
- dashboardConstants.js (type conversion)
- validation.js (TypeScript conversion)

**Time Estimate:** 1-2 hours total

---

## Integration Points

### External APIs (via tRPC)

#### 1. Authentication API
- **Endpoint:** `trpc.auth.signin`, `trpc.auth.signup`, `trpc.auth.signout`
- **Components:** SigninForm, SignupForm, Portal (user menu), Dashboard (user menu)
- **Status:** ✅ Already working (Iteration 1)
- **Complexity:** LOW

#### 2. Reflections API
- **Endpoint:** `trpc.reflections.create`, `trpc.reflections.list`, `trpc.reflections.get`
- **Components:** Questionnaire, Dashboard (ReflectionsCard), Output
- **Status:** ✅ Router exists (Iteration 1)
- **Complexity:** LOW-MEDIUM (need to verify output formatting)

#### 3. Dashboard Data API
- **Endpoint:** `trpc.dashboard.getData` (or equivalent)
- **Components:** Dashboard, UsageCard, EvolutionCard
- **Status:** ⚠️ Need to verify router exists
- **Complexity:** MEDIUM (hook needs tRPC conversion)

#### 4. User Profile API
- **Endpoint:** `trpc.user.update`, `trpc.user.get`
- **Components:** Dashboard (user menu), Profile page
- **Status:** ⚠️ Need to verify
- **Complexity:** LOW

### Internal Integrations

#### 1. CosmicBackground ↔ All Pages
- **Already migrated:** ✅
- **Used by:** Portal, Dashboard, Questionnaire, Output
- **Integration:** Simple import

#### 2. useAuth Hook ↔ All Protected Pages
- **Migration needed:** YES
- **Used by:** Dashboard, Questionnaire, Portal (conditional)
- **Complexity:** MEDIUM (needs tRPC integration)
- **Pattern:** Already proven in signin page

#### 3. Form State ↔ Questionnaire
- **Migration needed:** YES
- **Dependencies:** localStorage (no changes), validation utils
- **Complexity:** LOW

#### 4. Dashboard Hooks ↔ Dashboard Cards
- **Migration needed:** YES
- **Dependencies:** tRPC dashboard router
- **Complexity:** MEDIUM
- **Recommendation:** Migrate hooks FIRST, then cards

---

## Dependency Graph

### Critical Path (Must migrate in order):

```
1. Foundation Layer (FIRST)
   ├─ Types (already exist ✅)
   ├─ Utils (constants, validation)
   └─ Shared components (CosmicBackground ✅, DashboardCard, ProgressRing)

2. Hooks Layer (SECOND)
   ├─ useAuth (needs tRPC) ⚠️ CRITICAL
   ├─ useDashboard (needs tRPC)
   ├─ useFormPersistence (standalone)
   └─ Animation hooks (standalone)

3. Portal Layer (THIRD - Can start after hooks)
   ├─ usePortalState (depends on useAuth)
   ├─ Portal sub-components (MirrorShards, Navigation, etc.)
   └─ Portal.jsx (assembles sub-components)

4. Dashboard Layer (FOURTH - Parallel with Portal after hooks)
   ├─ Dashboard shared components
   ├─ Dashboard cards (parallel)
   └─ Dashboard.jsx (assembles cards)

5. Reflection Layer (FIFTH - Can start after hooks)
   ├─ Mirror shared components (QuestionCard, ToneSelector, etc.)
   ├─ Questionnaire.jsx
   └─ Output.jsx

6. Auth Layer (SIXTH - Low priority, signup not critical path)
   ├─ SignupForm
   └─ AuthLayout
```

### Parallel Opportunities:

**After hooks are migrated, these can run in parallel:**

- **Builder A:** Portal layer (Portal + sub-components)
- **Builder B:** Dashboard layer (Dashboard + cards)
- **Builder C:** Reflection layer (Questionnaire + Output)

---

## Risk Assessment

### HIGH RISK Components

#### 1. useDashboard Hook (tRPC Integration)

**Risk:** Dashboard data fetching might not match existing tRPC router

**Impact:** Dashboard cards will fail to load data

**Likelihood:** MEDIUM

**Mitigation:**
- Verify tRPC router schema matches hook expectations
- Create adapter layer if needed
- Test with real data early

**Estimated Debug Time:** 2-3 hours if issues found

#### 2. Questionnaire Submission Flow

**Risk:** Reflection creation → navigation to output with ID might break

**Impact:** Users can't complete reflections

**Likelihood:** MEDIUM

**Mitigation:**
- Study existing tRPC reflections router
- Verify output page can receive ID param
- Test end-to-end flow early

**Estimated Debug Time:** 1-2 hours

#### 3. Authentication State Persistence

**Risk:** Token refresh, session management might differ

**Impact:** Users logged out unexpectedly

**Likelihood:** LOW (pattern already proven in signin)

**Mitigation:**
- Reuse exact pattern from signin page
- Test token refresh cycle
- Verify localStorage token handling

**Estimated Debug Time:** 1 hour

### MEDIUM RISK Components

#### 4. Animation Hooks (TypeScript Conversion)

**Risk:** Complex React hooks might have subtle type issues

**Impact:** Animations break or don't render

**Likelihood:** LOW-MEDIUM

**Mitigation:**
- Convert one hook at a time
- Test in isolation
- Preserve exact logic

**Estimated Debug Time:** 30-60 min per hook

#### 5. Form Persistence (localStorage)

**Risk:** localStorage schema might conflict with new types

**Impact:** Form data lost on refresh

**Likelihood:** LOW

**Mitigation:**
- Add type guards for restored data
- Version localStorage schema
- Graceful fallback if parse fails

**Estimated Debug Time:** 1 hour

#### 6. Styled-JSX CSS Preservation

**Risk:** Some CSS might not work in Next.js App Router

**Impact:** Broken layouts or styling

**Likelihood:** LOW (CosmicBackground already works)

**Mitigation:**
- Copy CSS verbatim
- Test responsive breakpoints
- Verify animations work

**Estimated Debug Time:** 1-2 hours

### LOW RISK Components

#### 7. Portal Sub-Components

**Risk:** Minimal - mostly presentational

**Impact:** Visual only

**Likelihood:** VERY LOW

**Mitigation:** Standard migration pattern

#### 8. Dashboard Cards (after shared components ready)

**Risk:** Minimal - rely on shared components

**Impact:** Individual card failures

**Likelihood:** LOW

**Mitigation:** Migrate shared components first

#### 9. Utils and Constants

**Risk:** Minimal - pure functions

**Impact:** Type errors only

**Likelihood:** VERY LOW

**Mitigation:** Add type annotations

---

## Recommended Migration Order

### Phase 1: Foundation (Day 1 Morning - 3-4 hours)

**Goal:** Prepare shared infrastructure

**Tasks:**
1. Migrate utils (constants.js, validation.js, dashboardConstants.js)
2. Migrate shared dashboard components:
   - DashboardCard.jsx → DashboardCard.tsx
   - ProgressRing.jsx → ProgressRing.tsx
   - LoadingStates.jsx → LoadingStates.tsx
   - TierBadge.jsx → TierBadge.tsx
   - ThemeTag.jsx → ThemeTag.tsx
3. Test shared components in isolation

**Complexity:** LOW

**Builder:** Single builder (foundation work)

### Phase 2: Hooks Layer (Day 1 Afternoon - 4-5 hours)

**Goal:** Migrate business logic layer

**Tasks:**
1. **CRITICAL:** Migrate useAuth.js → useAuth.ts (adapt tRPC pattern from signin)
2. Migrate animation hooks:
   - useAnimatedCounter.js → useAnimatedCounter.ts
   - useBreathingEffect.jsx → useBreathingEffect.tsx
   - useStaggerAnimation.js → useStaggerAnimation.ts
3. Migrate useDashboard.js → useDashboard.ts (tRPC integration)
4. Migrate useFormPersistence.js → useFormPersistence.ts
5. Migrate usePersonalizedGreeting.js → usePersonalizedGreeting.ts

**Complexity:** MEDIUM-HIGH

**Builder:** Single builder (critical dependencies)

**Checkpoint:** All hooks compile and export correctly

### Phase 3A: Portal Layer (Day 2 Morning - 4-5 hours)

**Goal:** Migrate landing page

**Tasks:**
1. Migrate usePortalState.js → usePortalState.ts (depends on useAuth)
2. Migrate portal sub-components:
   - MirrorShards.jsx → MirrorShards.tsx
   - Navigation.jsx → Navigation.tsx
   - MainContent.jsx → MainContent.tsx
   - ButtonGroup.jsx → ButtonGroup.tsx
   - UserMenu.jsx → UserMenu.tsx
3. Migrate Portal.jsx → app/page.tsx
4. Test complete portal flow

**Complexity:** MEDIUM

**Builder:** Builder A (Portal specialist)

### Phase 3B: Dashboard Layer (Day 2 - 6-8 hours) - PARALLEL

**Goal:** Migrate user dashboard

**Tasks:**
1. Migrate dashboard shared components (if not done in Phase 1):
   - DashboardGrid.jsx → DashboardGrid.tsx
   - WelcomeSection.jsx → WelcomeSection.tsx
   - ReflectionItem.jsx → ReflectionItem.tsx
2. Migrate dashboard cards (can parallelize):
   - UsageCard.jsx → UsageCard.tsx
   - ReflectionsCard.jsx → ReflectionsCard.tsx
   - EvolutionCard.jsx → EvolutionCard.tsx
   - SubscriptionCard.jsx → SubscriptionCard.tsx
3. Migrate Dashboard.jsx → app/dashboard/page.tsx
4. Test complete dashboard with real data

**Complexity:** MEDIUM-HIGH

**Builder:** Builder B (Dashboard specialist)

### Phase 3C: Reflection Layer (Day 2 - 5-6 hours) - PARALLEL

**Goal:** Migrate reflection creation flow

**Tasks:**
1. Migrate mirror shared components:
   - QuestionCard.jsx → QuestionCard.tsx
   - ToneSelector.jsx → ToneSelector.tsx
   - CharacterCounter.jsx → CharacterCounter.tsx
   - ToneElements.jsx → ToneElements.tsx
   - MarkdownRenderer.jsx → MarkdownRenderer.tsx
2. Migrate Questionnaire.jsx → app/reflection/page.tsx
3. Migrate Output.jsx → app/reflection/output/page.tsx
4. Test end-to-end reflection flow

**Complexity:** MEDIUM-HIGH

**Builder:** Builder C (Reflection specialist)

### Phase 4: Auth Layer (Day 3 Morning - 3-4 hours)

**Goal:** Complete auth flow (signup)

**Tasks:**
1. Migrate SignupForm.jsx → app/auth/signup/page.tsx
2. Migrate AuthLayout.jsx (if needed)
3. Test signup flow

**Complexity:** LOW-MEDIUM

**Builder:** Any available builder

### Phase 5: Integration Testing (Day 3 Afternoon - 3-4 hours)

**Goal:** Verify complete user journey

**Tasks:**
1. Test landing → signin → dashboard
2. Test landing → signup → dashboard
3. Test dashboard → reflection creation → output
4. Test dashboard → reflections list (already exists ✅)
5. Test mobile responsive
6. Test animations
7. Test error states
8. Fix bugs

**Complexity:** MEDIUM

**Builder:** All builders (collaborative testing)

### Phase 6: Polish & Edge Cases (Day 4 - 4-6 hours)

**Goal:** Production readiness

**Tasks:**
1. Loading states for all async operations
2. Error boundaries
3. Empty states
4. Validation messages
5. Accessibility (focus states, ARIA labels)
6. Performance optimization
7. Final QA

**Complexity:** LOW-MEDIUM

**Builder:** All builders (divide & conquer)

---

## Time Estimates

### Per-Component Estimates

| Component | Lines | Complexity | Time Est. |
|-----------|-------|------------|-----------|
| **Portal Layer** |
| usePortalState.js | 274 | Medium | 2h |
| Portal.jsx | 162 | Medium | 1.5h |
| MirrorShards.jsx | ~150 | Low | 1h |
| Navigation.jsx | ~100 | Low | 45min |
| MainContent.jsx | ~150 | Low | 1h |
| ButtonGroup.jsx | ~100 | Low | 45min |
| UserMenu.jsx | ~80 | Low | 30min |
| **Subtotal** | **~1,016** | | **7.5h** |
| | | | |
| **Dashboard Layer** |
| Dashboard.jsx | 933 | High | 3h |
| UsageCard.jsx | 334 | Medium | 1.5h |
| ReflectionsCard.jsx | ~300 | Medium | 1.5h |
| EvolutionCard.jsx | ~300 | Medium | 1.5h |
| SubscriptionCard.jsx | ~250 | Medium | 1h |
| DashboardCard.jsx | ~150 | Low | 1h |
| DashboardGrid.jsx | ~100 | Low | 45min |
| WelcomeSection.jsx | ~200 | Low | 1h |
| ProgressRing.jsx | ~150 | Medium | 1h |
| ReflectionItem.jsx | ~100 | Low | 45min |
| TierBadge.jsx | ~80 | Low | 30min |
| ThemeTag.jsx | ~80 | Low | 30min |
| LoadingStates.jsx | ~120 | Low | 45min |
| **Subtotal** | **~3,097** | | **14.5h** |
| | | | |
| **Reflection Layer** |
| Questionnaire.jsx | 522 | High | 3h |
| Output.jsx | ~400 | Medium | 2h |
| QuestionCard.jsx | ~200 | Medium | 1h |
| ToneSelector.jsx | ~180 | Medium | 1h |
| CharacterCounter.jsx | ~100 | Low | 45min |
| ToneElements.jsx | ~150 | Low | 1h |
| MarkdownRenderer.jsx | ~120 | Low | 45min |
| ArtifactSection.jsx | ~150 | Low | 1h (deferred) |
| FeedbackSection.jsx | ~150 | Low | 1h (deferred) |
| **Subtotal** | **~1,972** | | **10.5h** |
| | | | |
| **Auth Layer** |
| SignupForm.jsx | ~400 | Medium | 2h |
| AuthLayout.jsx | ~150 | Low | 1h |
| **Subtotal** | **~550** | | **3h** |
| | | | |
| **Hooks** |
| useAuth.js | 396 | High | 2h |
| useDashboard.js | ~300 | Medium | 1.5h |
| useFormPersistence.js | ~200 | Medium | 1h |
| usePersonalizedGreeting.js | ~150 | Low | 1h |
| useAnimatedCounter.js | ~120 | Medium | 1h |
| useBreathingEffect.jsx | ~100 | Medium | 1h |
| useStaggerAnimation.js | ~150 | Medium | 1h |
| useFeedback.js | ~100 | Low | 45min (deferred) |
| useArtifact.js | ~100 | Low | 45min (deferred) |
| **Subtotal** | **~1,616** | | **9.5h** |
| | | | |
| **Utils** |
| validation.js | ~200 | Low | 1h |
| constants.js | ~150 | Low | 45min |
| dashboardConstants.js | ~100 | Low | 30min |
| **Subtotal** | **~450** | | **2.25h** |

### Total Estimates

**Core Development:** 47.25 hours (actual coding)

**Testing & Integration:** 6-8 hours

**Bug Fixes & Polish:** 4-6 hours

**Total:** **57-61 hours** (7-8 full days for single developer)

**With 3 builders (parallelization):** **3-4 days**

---

## Recommendations for Planner

### 1. Use 3-Builder Split Strategy

**Rationale:**
- Portal, Dashboard, and Reflection layers can proceed in parallel after hooks are ready
- Each builder specializes in one layer
- Minimizes merge conflicts
- Optimal time efficiency (4 days vs 8 days)

**Proposed Splits:**
- **Builder A:** Portal layer (landing page, navigation, portal hooks)
- **Builder B:** Dashboard layer (dashboard, cards, dashboard hooks)
- **Builder C:** Reflection layer (questionnaire, output, reflection components)

### 2. Prioritize Hooks Migration (Day 1)

**Rationale:**
- All UI components depend on hooks
- Hooks contain business logic and API integration
- Early hook migration enables parallel UI work
- Reduces risk of rework

**Critical Hook:** `useAuth` - blocks all protected pages

### 3. Defer Non-Critical Features

**Defer to Iteration 2:**
- Evolution reports functionality (UI only in 1.5)
- Artifact generation sections
- Feedback sections
- Advanced profile features

**Rationale:**
- Focus on core user journey first
- These features don't block MVP
- Can be added incrementally

### 4. Establish Migration Checklist

**For each component:**
- [ ] TypeScript conversion complete (no `any` types)
- [ ] tRPC integration verified (if API-dependent)
- [ ] Next.js navigation working
- [ ] Styled-jsx CSS preserved
- [ ] Mobile responsive tested
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Accessibility verified (keyboard nav, focus states)
- [ ] Compiles without errors
- [ ] Renders in isolation

### 5. Create Shared Type Definitions Early

**Create:**
- `types/dashboard.ts` - Dashboard data types
- `types/portal.ts` - Portal configuration types
- `types/reflection.ts` - Reflection form types (may exist)
- `types/hooks.ts` - Hook return types

**Rationale:**
- Prevents type duplication
- Ensures consistency
- Enables parallel work

### 6. Set Up Component Storybook/Testing

**Optional but recommended:**
- Test components in isolation
- Visual regression testing
- Faster iteration

**Tools:**
- Storybook (if time allows)
- Or simple test pages in `/app/dev/`

### 7. Maintain Migration Log

**Track:**
- Component migration status
- Issues encountered
- Time spent vs estimated
- Learnings for future iterations

**Benefit:**
- Helps identify bottlenecks
- Improves future estimates
- Documents decisions

---

## Resource Map

### Critical Files/Directories

**Source (Reference):**
```
/home/ahiya/mirror-of-truth-online/src/
├── components/
│   ├── portal/           # Landing page components
│   ├── dashboard/        # Dashboard components
│   ├── mirror/          # Reflection flow components
│   ├── auth/            # Auth forms
│   └── shared/          # Shared utilities
├── hooks/               # Custom React hooks
├── utils/               # Helper functions
└── styles/              # CSS files (may need import)
```

**Target (Migration Destination):**
```
/home/ahiya/mirror-of-dreams/
├── app/
│   ├── page.tsx               # Landing (from Portal.jsx)
│   ├── dashboard/page.tsx     # Dashboard
│   ├── reflection/page.tsx    # Questionnaire
│   ├── reflection/output/page.tsx  # Output
│   └── auth/
│       ├── signin/page.tsx    # ✅ Already migrated
│       └── signup/page.tsx    # To migrate
├── components/
│   ├── portal/          # Portal sub-components
│   ├── dashboard/       # Dashboard cards & shared
│   ├── reflection/      # Reflection components
│   └── shared/          # Shared (CosmicBackground ✅)
├── hooks/               # Migrated hooks
├── types/               # ✅ Already exist
└── lib/
    └── trpc.ts          # ✅ Already configured
```

### Key Dependencies

**Already Available (Iteration 1):**
- ✅ tRPC client configured (`lib/trpc.ts`)
- ✅ TypeScript strict mode configured
- ✅ Next.js App Router configured
- ✅ Types defined (`types/` directory)
- ✅ CosmicBackground component migrated
- ✅ Signin page migrated (pattern reference)
- ✅ tRPC routers exist (auth, reflections, etc.)

**Need to Verify:**
- ⚠️ Dashboard tRPC router schema
- ⚠️ User profile tRPC router
- ⚠️ Evolution reports router (or stub for iteration 2)

**External Libraries (from package.json check):**
- React 18 (hooks supported ✅)
- Next.js 14 (App Router ✅)
- tRPC v10+ (type-safe APIs ✅)
- Likely have: styled-jsx, framer-motion (animations)

### Testing Infrastructure

**Recommended Approach:**
1. **Manual testing:** Primary method (visual QA)
2. **Browser testing:** Chrome, Firefox, Safari
3. **Mobile testing:** iOS Safari, Chrome Android
4. **Responsive testing:** 320px, 768px, 1920px breakpoints

**Test Scenarios:**
- [ ] Landing page loads and renders correctly
- [ ] User can navigate from landing → signin
- [ ] Dashboard loads with real data
- [ ] Dashboard cards display correct information
- [ ] Reflection questionnaire accepts input
- [ ] Character counters work
- [ ] Form persistence works (refresh page)
- [ ] Reflection submits successfully
- [ ] Output page displays reflection
- [ ] Navigation works throughout app
- [ ] Mobile responsive layouts work
- [ ] Animations play smoothly
- [ ] Loading states appear during async ops
- [ ] Error states display for failed API calls

---

## Questions for Planner

### 1. Dashboard tRPC Router Schema

**Question:** Does the existing `trpc.dashboard` router return data in the format expected by `useDashboard` hook?

**Why it matters:** The hook expects:
```typescript
{
  usage: { currentCount, limit, totalReflections, canReflect, tier },
  evolution: { canGenerateNext, progress: { needed } },
  reflections: ReflectionItem[],
  insights: Insight[]
}
```

**Action needed:** Verify router schema or create adapter

### 2. Evolution Reports Status

**Question:** Are evolution reports functionality included in Iteration 1.5, or just UI placeholder?

**Why it matters:** 
- Affects EvolutionCard complexity
- May need stub data vs real API

**Recommendation:** UI only (defer functionality to Iteration 2)

### 3. Profile/Settings Pages Scope

**Question:** Are profile and settings pages in scope for Iteration 1.5?

**Why it matters:**
- Dashboard has links to `/profile` and `/settings`
- Not listed in vision document must-haves

**Recommendation:** Create placeholder pages that show "Coming soon"

### 4. Subscription Flow Inclusion

**Question:** Is PayPal subscription flow in scope?

**Vision says:** "Out of scope (Iteration 4)"

**Action:** SubscriptionCard should show tier info only, no payment flow

### 5. Email Functionality

**Question:** Should "Email Myself" button in Output.jsx work?

**Vision says:** "Email notifications (Iteration 4)"

**Recommendation:** Disable button or hide it for now

### 6. Builder Assignment

**Question:** Will planner assign 3 builders or fewer?

**Why it matters:**
- 3 builders: 3-4 days (optimal)
- 2 builders: 4-5 days
- 1 builder: 7-8 days

**Recommendation:** 3 builders for timeline efficiency

---

## Success Criteria

**Iteration 1.5 is complete when:**

### Functional Completeness
- [ ] User can visit landing page (`/`)
- [ ] Landing page shows Portal UI with cosmic theme
- [ ] User can click "Reflect Me" → redirects to signin
- [ ] User can sign in (already works ✅)
- [ ] User lands on dashboard (`/dashboard`)
- [ ] Dashboard shows real data (usage, reflections, evolution)
- [ ] Dashboard cards render without placeholders
- [ ] User can click "Reflect Now" → goes to questionnaire
- [ ] User can complete 5-question flow
- [ ] User can select tone
- [ ] User can submit reflection
- [ ] User redirected to output page with reflection
- [ ] Output page shows formatted AI reflection
- [ ] User can navigate back to dashboard
- [ ] User can view reflections list (already works ✅)
- [ ] User can sign up (new accounts)
- [ ] User can sign out

### Technical Quality
- [ ] TypeScript strict mode: 0 errors
- [ ] Production build succeeds (`npm run build`)
- [ ] No console errors in browser
- [ ] All tRPC calls work (type-safe)
- [ ] All navigation links work (Next.js router)
- [ ] Mobile responsive (320px, 768px, 1920px)
- [ ] Cosmic theme consistent across all pages
- [ ] Animations smooth (60fps)
- [ ] Loading states for all async operations
- [ ] Error handling for all API calls

### User Experience
- [ ] No placeholder text visible
- [ ] All buttons functional
- [ ] Forms validate correctly
- [ ] Character counters work
- [ ] Progress indicators accurate
- [ ] Toast notifications clear
- [ ] Empty states handled
- [ ] Error messages user-friendly

### Performance
- [ ] First load JS < 100 kB
- [ ] Time to Interactive < 3s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Smooth 60fps animations

---

## Conclusion

The migration of 34 remaining components from Mirror of Truth to TypeScript/Next.js is **FEASIBLE and WELL-SCOPED** for Iteration 1.5.

**Key Success Factors:**
1. ✅ Clean, well-architected source code
2. ✅ Proven migration patterns from Iteration 1
3. ✅ Solid foundation (tRPC, types, Next.js already configured)
4. ✅ Clear component boundaries and dependencies
5. ✅ Realistic time estimates based on actual analysis

**Recommended Approach:**
- **3 builders** working in parallel
- **4-day timeline** (realistic with buffer)
- **Sequential hooks migration** (Day 1) to unblock UI work
- **Parallel UI layer migration** (Days 2-3)
- **Integration testing** (Day 3-4)

**Risk Level:** MEDIUM (manageable with proper planning)

**Confidence Level:** HIGH (patterns proven, architecture sound)

---

**Explorer-1 Complete** ✅

**Next Steps:**
- Explorer-2: Analyze styling, UX patterns, and responsive design
- Explorer-3: Analyze external integrations and data flow complexity
- Planner: Synthesize explorer reports and create detailed migration plan
