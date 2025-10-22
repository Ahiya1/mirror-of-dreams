# Builder Task Breakdown - Iteration 1.5

**Strategy:** 3 builders working in parallel on separate layers after shared foundation is ready.

**Timeline:** 3-4 days total (8 hours Day 1 foundation, 16-20 hours Days 2-3 parallel work, 4-6 hours Day 3-4 integration/polish)

---

## Overview

**Total Components:** 34 files to migrate

**Builder Distribution:**
- **Builder-1:** Foundation + Portal layer (18 hours)
- **Builder-2:** Dashboard layer (16 hours)
- **Builder-3:** Reflection + Auth layer (14 hours)

**Execution Sequence:**
1. **Day 1 (Sequential):** Builder-1 creates foundation (CSS + hooks)
2. **Day 2-3 (Parallel):** All 3 builders work simultaneously on UI layers
3. **Day 3-4 (Collaborative):** Integration testing, bug fixes, polish

---

## Builder-1: Foundation + Portal Layer

### Scope
Create shared infrastructure, then migrate landing page (Portal) and user menu components.

### Complexity Estimate
**MEDIUM-HIGH**

### Total Time Estimate
**18 hours** (8h foundation + 7.5h portal + 2.5h buffer)

### Success Criteria
- [ ] All 6 CSS files migrated to `styles/` directory
- [ ] All 6 hooks migrated to `hooks/` directory
- [ ] All utility files migrated to `lib/utils/`
- [ ] Landing page loads with cosmic background and mirror shards
- [ ] "Reflect Me" button navigates to signin
- [ ] "Start Free" button navigates to signup
- [ ] User menu shows when authenticated
- [ ] Mobile responsive at 320px, 768px, 1920px
- [ ] All animations work smoothly

---

### Phase 1: Foundation (Day 1 - 8 hours)

**This phase BLOCKS all other builders. Must complete first.**

#### Task 1.1: CSS Migration (2 hours)

**Objective:** Copy all CSS files from original to new codebase

**Files to Create:**
1. `styles/variables.css` - CSS custom properties (copy from `/home/ahiya/mirror-of-truth-online/src/styles/variables.css`)
2. `styles/animations.css` - 50+ keyframe animations
3. `styles/dashboard.css` - Dashboard styling
4. `styles/mirror.css` - Reflection UI styling
5. `styles/portal.css` - Landing page styling
6. `styles/auth.css` - Auth forms styling

**Steps:**
1. Copy each file verbatim from original
2. Update import paths if needed (e.g., `@import "./variables.css"` → `@import "../variables.css"`)
3. Import `variables.css` and `animations.css` in `app/layout.tsx` (first two lines)
4. Verify CSS compiles without errors
5. Test one component (CosmicBackground) to ensure CSS loads

**Testing:**
- [ ] `npm run dev` starts without CSS errors
- [ ] CosmicBackground component renders correctly
- [ ] Browser console shows no CSS warnings

**Checkpoint:** CSS foundation ready for UI components

---

#### Task 1.2: Utility Files Migration (1 hour)

**Objective:** Migrate validation, constants, and helper functions

**Files to Create:**
1. `lib/utils/validation.ts` (from `utils/validation.js`)
2. `lib/utils/constants.ts` (from `utils/constants.js`)
3. `lib/utils/dashboardConstants.ts` (from `utils/dashboardConstants.js`)
4. `lib/utils/greetingGenerator.ts` - ✅ Already migrated, verify gift references removed

**Steps:**
1. Convert each `.js` file to `.ts`
2. Add type annotations to all functions
3. Export constants as `const` with type assertions
4. Replace `module.exports` with ES6 `export`

**Pattern to Follow:**
```typescript
// constants.ts
export const MAX_REFLECTIONS_FREE_TIER = 3;
export const MAX_REFLECTIONS_EXPLORER_TIER = 20;
export const MAX_REFLECTIONS_VISIONARY_TIER = Infinity;

export const CHARACTER_LIMITS = {
  dream: 3200,
  plan: 4000,
  relationship: 4000,
  sacrifice: 2400,
} as const;

export type CharacterLimitKey = keyof typeof CHARACTER_LIMITS;
```

**Testing:**
- [ ] TypeScript compiles without errors
- [ ] Can import and use constants in test component

---

#### Task 1.3: Hooks Migration (4-5 hours)

**Objective:** Migrate all custom React hooks to TypeScript

**CRITICAL:** These hooks block Builder-2 and Builder-3. Complete by end of Day 1.

**Files to Create (Priority Order):**

**High Priority (Complete First):**
1. `hooks/useAuth.ts` (from `hooks/useAuth.js`) - 396 lines, 2h
2. `hooks/useDashboard.ts` (from `hooks/useDashboard.js`) - ~300 lines, 1.5h
3. `hooks/usePortalState.ts` (from `portal/hooks/usePortalState.js`) - 274 lines, 2h

**Medium Priority:**
4. `hooks/useBreathingEffect.ts` (from `hooks/useBreathingEffect.jsx`) - 394 lines, 1h
5. `hooks/useStaggerAnimation.ts` (from `hooks/useStaggerAnimation.js`) - 275 lines, 1h
6. `hooks/useAnimatedCounter.ts` (from `hooks/useAnimatedCounter.js`) - ~120 lines, 1h

**Low Priority (Nice to Have):**
7. `hooks/usePersonalizedGreeting.ts` (from `hooks/usePersonalizedGreeting.js`) - ~150 lines, 1h
8. `hooks/useFormPersistence.ts` (from `hooks/useFormPersistence.js`) - ~200 lines, 1h

**Migration Pattern:**
```typescript
// hooks/useAuth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Use tRPC instead of fetch
  const signinMutation = trpc.auth.signin.useMutation({
    onSuccess: (data) => {
      setUser(data.user);
      router.push('/dashboard');
    },
  });

  const signin = useCallback(async (email: string, password: string) => {
    await signinMutation.mutateAsync({ email, password });
  }, [signinMutation]);

  // ... rest of hook logic

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signin,
    signout,
  };
}
```

**Key Changes:**
- Add `'use client'` at top
- Replace `fetch()` with `trpc.*` calls
- Add TypeScript types for all parameters and returns
- Export return type interface
- Keep exact same logic, only add types

**Testing:**
- [ ] Each hook compiles without TypeScript errors
- [ ] `useAuth` returns correct type (test by calling in a component)
- [ ] `useDashboard` fetches data from tRPC (test in console)
- [ ] Animation hooks (`useBreathingEffect`, `useStaggerAnimation`) don't cause errors

**Checkpoint:** All hooks ready for UI components to consume

---

### Phase 2: Portal Layer (Day 2 - 7.5 hours)

**Dependencies:** Phase 1 complete (CSS + hooks ready)

**Can start:** After Hour 8 (Day 1 afternoon or Day 2 morning)

#### Task 2.1: Portal Shared Components (3 hours)

**Files to Create:**
1. `components/portal/MirrorShards.tsx` (from `portal/components/MirrorShards.jsx`) - ~150 lines, 1h
2. `components/portal/ButtonGroup.tsx` (from `portal/components/ButtonGroup.jsx`) - ~100 lines, 45min
3. `components/portal/Taglines.tsx` (from `portal/components/Taglines.jsx`) - ~80 lines, 30min
4. `components/portal/UserMenu.tsx` (from `portal/components/UserMenu.jsx`) - ~80 lines, 30min

**MirrorShards Special Note:**
- Original uses `<style jsx>` - convert to CSS Module
- Create `components/portal/MirrorShards.module.css`
- Extract all styles from `<style jsx>` block to `.module.css`
- Update className usage: `className="mirror"` → `className={styles.mirror}`

**Pattern:**
```typescript
// components/portal/MirrorShards.tsx
'use client';

import React from 'react';
import styles from './MirrorShards.module.css';

const MirrorShards: React.FC = () => {
  const shards = [1, 2, 3, 4, 5]; // 5 mirror shards

  return (
    <div className={styles.mirrorsContainer}>
      {shards.map((shard) => (
        <div
          key={shard}
          className={styles.mirror}
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            animationDelay: `${shard * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
};

export default MirrorShards;
```

**Testing:**
- [ ] MirrorShards renders with floating animation
- [ ] ButtonGroup shows correct buttons based on auth state
- [ ] Taglines rotate correctly
- [ ] UserMenu dropdown works

---

#### Task 2.2: Portal Main Page (4.5 hours)

**Files to Create:**
1. `app/page.tsx` (replace placeholder with Portal)

**This is the landing page - most complex component in Portal layer**

**Pattern:**
```typescript
// app/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePortalState } from '@/hooks/usePortalState';
import { useAuth } from '@/hooks/useAuth';
import CosmicBackground from '@/components/shared/CosmicBackground';
import MirrorShards from '@/components/portal/MirrorShards';
import ButtonGroup from '@/components/portal/ButtonGroup';
import Taglines from '@/components/portal/Taglines';
import UserMenu from '@/components/portal/UserMenu';
import '@/styles/portal.css';

export default function PortalPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    tagline,
    showReflectButton,
    showStartFreeButton,
    handleReflectClick,
    handleStartFreeClick,
  } = usePortalState(user);

  return (
    <div className="portal">
      <CosmicBackground />
      <MirrorShards />

      {isAuthenticated && <UserMenu user={user} />}

      <div className="portal-content">
        <h1 className="portal-title">Mirror of Truth</h1>
        <Taglines currentTagline={tagline} />

        <ButtonGroup
          showReflect={showReflectButton}
          showStartFree={showStartFreeButton}
          onReflectClick={handleReflectClick}
          onStartFreeClick={handleStartFreeClick}
        />
      </div>
    </div>
  );
}
```

**Implementation Notes:**
- Use `usePortalState()` hook for button logic
- Use `useAuth()` for user state
- Buttons navigate using `router.push()`
- Preserve exact CSS classes from original
- Test authenticated vs unauthenticated states

**Testing:**
- [ ] Landing page loads with cosmic background
- [ ] Mirror shards animate smoothly
- [ ] Tagline displays correctly
- [ ] "Reflect Me" button → navigates to `/auth/signin`
- [ ] "Start Free" button → navigates to `/auth/signup`
- [ ] User menu shows when authenticated
- [ ] Mobile responsive (test 320px, 768px, 1920px)

**Checkpoint:** Portal layer complete, landing page production-ready

---

### Dependencies
**Depends on:** None (creates foundation for others)

**Blocks:** Builder-2, Builder-3 (both depend on hooks and CSS)

### Potential Split Strategy
If Phase 1 proves too complex, consider splitting:

**Foundation (Primary Builder-1):**
- CSS files (2h)
- Utility files (1h)
- Core hooks: useAuth, useDashboard (3.5h)

**Sub-builder 1A (If needed):**
- Animation hooks: useBreathingEffect, useStaggerAnimation, useAnimatedCounter (3h)
- Portal shared components (3h)

**Sub-builder 1B (If needed):**
- Portal main page (4.5h)

**Estimated Split:** Only if foundation takes >10 hours

---

## Builder-2: Dashboard Layer

### Scope
Migrate complete dashboard experience with 7 cards + shared components.

### Complexity Estimate
**HIGH** (Most components, most complexity)

### Total Time Estimate
**16 hours** (3h shared, 8h cards, 3h main dashboard, 2h buffer)

### Success Criteria
- [ ] Dashboard loads with personalized greeting
- [ ] Usage card shows accurate reflection count and tier limits
- [ ] Recent reflections card displays last 3 reflections
- [ ] Evolution card shows UI placeholder (functionality in Iteration 2)
- [ ] Subscription card shows current tier
- [ ] "Reflect Now" button navigates to questionnaire
- [ ] "View All Reflections" link works
- [ ] Dashboard navigation with user dropdown functional
- [ ] All cards animate with stagger effect
- [ ] Mobile responsive: Grid collapses to single column at 1024px

---

### Phase 1: Shared Dashboard Components (Day 2 - 3 hours)

**Dependencies:** Builder-1 Phase 1 complete (CSS + hooks ready)

**Files to Create:**
1. `components/dashboard/shared/DashboardCard.tsx` - Base card wrapper, 1h
2. `components/dashboard/shared/DashboardGrid.tsx` - Grid layout, 1h
3. `components/dashboard/shared/WelcomeSection.tsx` - Greeting section, 30min
4. `components/dashboard/shared/ProgressRing.tsx` - SVG progress ring, 1h
5. `components/dashboard/shared/TierBadge.tsx` - Tier badge component, 30min
6. `components/dashboard/shared/ThemeTag.tsx` - Theme tag component, 30min
7. `components/dashboard/shared/ReflectionItem.tsx` - Reflection list item, 45min
8. `components/dashboard/shared/LoadingStates.tsx` - Skeleton loaders, 45min

**DashboardCard Pattern (Most Important):**
```typescript
// components/dashboard/shared/DashboardCard.tsx
'use client';

import React, { ReactNode } from 'react';
import { useBreathingEffect } from '@/hooks/useBreathingEffect';

interface DashboardCardProps {
  title?: string;
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
  animated?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  children,
  isLoading = false,
  className = '',
  animated = true,
}) => {
  const breathing = useBreathingEffect('card');

  const cardClassName = [
    'dashboard-card',
    isLoading && 'loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClassName}
      style={animated ? {
        animation: breathing.animation,
        animationPlayState: breathing.animationPlayState,
      } : {}}
    >
      {title && <h3 className="dashboard-card__title">{title}</h3>}
      <div className="dashboard-card__content">{children}</div>
    </div>
  );
};

export default DashboardCard;
```

**Testing:**
- [ ] DashboardCard renders with glass morphism effect
- [ ] Breathing animation works
- [ ] ProgressRing animates correctly (test with different percentages)
- [ ] Loading states show skeleton UI

---

### Phase 2: Dashboard Cards (Day 2-3 - 8 hours)

**Dependencies:** Phase 1 complete (shared components ready)

**Files to Create (Can parallelize within this phase):**

1. **UsageCard.tsx** (1.5h - Priority 1)
   - Shows reflection count vs limit
   - Displays tier name
   - Progress ring for usage percentage
   - "Upgrade" button if near limit

```typescript
// components/dashboard/cards/UsageCard.tsx
'use client';

import React from 'react';
import { trpc } from '@/lib/trpc';
import DashboardCard from '@/components/dashboard/shared/DashboardCard';
import ProgressRing from '@/components/dashboard/shared/ProgressRing';
import TierBadge from '@/components/dashboard/shared/TierBadge';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

const UsageCard: React.FC = () => {
  const { data, isLoading } = trpc.subscriptions.getUsage.useQuery();

  const animatedCount = useAnimatedCounter(data?.current || 0, {
    duration: 1000,
  });

  if (isLoading) {
    return <DashboardCard title="Usage" isLoading />;
  }

  const percentage = (data.current / data.limit) * 100;

  return (
    <DashboardCard title="Usage">
      <div className="usage-display">
        <ProgressRing percentage={percentage} />
        <div className="usage-stats">
          <p className="usage-count">
            {Math.round(animatedCount)} / {data.limit}
          </p>
          <p className="usage-label">Reflections this month</p>
          <TierBadge tier={data.tier} />
        </div>
      </div>
    </DashboardCard>
  );
};

export default UsageCard;
```

2. **ReflectionsCard.tsx** (1.5h - Priority 1)
   - Lists 3 most recent reflections
   - Click to view full reflection
   - "View All" link to reflections page

3. **EvolutionCard.tsx** (1.5h - Priority 2)
   - Shows evolution status (UI only)
   - "Generate Evolution Report" button (disabled for now)
   - Note: Functionality deferred to Iteration 2

4. **SubscriptionCard.tsx** (1h - Priority 3)
   - Shows current tier
   - Displays tier benefits
   - No payment flow (deferred to Iteration 4)

**Testing:**
- [ ] UsageCard displays correct numbers
- [ ] Progress ring animates smoothly
- [ ] ReflectionsCard shows 3 recent reflections
- [ ] Click on reflection navigates to detail page
- [ ] EvolutionCard shows UI (button disabled)
- [ ] SubscriptionCard displays tier info

---

### Phase 3: Main Dashboard Page (Day 3 - 3 hours)

**Dependencies:** Phase 1 + Phase 2 complete (all cards ready)

**File to Create:**
1. `app/dashboard/page.tsx` (replace placeholder)

**Pattern:**
```typescript
// app/dashboard/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import WelcomeSection from '@/components/dashboard/shared/WelcomeSection';
import DashboardGrid from '@/components/dashboard/shared/DashboardGrid';
import UsageCard from '@/components/dashboard/cards/UsageCard';
import ReflectionsCard from '@/components/dashboard/cards/ReflectionsCard';
import EvolutionCard from '@/components/dashboard/cards/EvolutionCard';
import SubscriptionCard from '@/components/dashboard/cards/SubscriptionCard';
import '@/styles/dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { usage, reflections, isLoading } = useDashboard();

  const { containerRef, getItemStyles } = useStaggerAnimation(4, {
    delay: 100,
    duration: 600,
  });

  const handleReflectNow = () => {
    router.push('/reflection');
  };

  return (
    <div className="dashboard-container">
      <CosmicBackground />

      <div className="dashboard-nav">
        {/* Navigation with user dropdown */}
      </div>

      <WelcomeSection user={user} />

      <button className="reflect-now-button" onClick={handleReflectNow}>
        Reflect Now
      </button>

      <DashboardGrid ref={containerRef}>
        <div style={getItemStyles(0)}>
          <UsageCard />
        </div>
        <div style={getItemStyles(1)}>
          <ReflectionsCard />
        </div>
        <div style={getItemStyles(2)}>
          <EvolutionCard />
        </div>
        <div style={getItemStyles(3)}>
          <SubscriptionCard />
        </div>
      </DashboardGrid>
    </div>
  );
}
```

**Implementation Notes:**
- Use `useDashboard()` hook to fetch all dashboard data
- Use `useStaggerAnimation()` for grid entrance
- Navigation bar: logo, links, user dropdown
- "Reflect Now" button prominent above cards
- Grid: 2x2 on desktop, 1x4 on mobile (CSS handles this)

**Testing:**
- [ ] Dashboard loads with personalized greeting
- [ ] All 4 cards render correctly
- [ ] Cards animate in with stagger effect
- [ ] "Reflect Now" button navigates to `/reflection`
- [ ] Navigation links work
- [ ] User dropdown shows profile menu
- [ ] Mobile: Grid collapses to single column
- [ ] No console errors

**Checkpoint:** Dashboard layer complete, all cards functional

---

### Dependencies
**Depends on:** Builder-1 Phase 1 (CSS + hooks)

**Blocks:** None (parallel with Builder-3)

### Potential Split Strategy
If dashboard proves too complex:

**Primary Builder-2:**
- Shared components (3h)
- UsageCard + ReflectionsCard (3h)
- Main dashboard page (3h)

**Sub-builder 2A:**
- EvolutionCard (1.5h)
- SubscriptionCard (1h)
- Dashboard navigation (2h)

---

## Builder-3: Reflection Flow + Auth

### Scope
Migrate reflection creation (questionnaire), reflection output display, and signup flow.

### Complexity Estimate
**MEDIUM-HIGH**

### Total Time Estimate
**14 hours** (6h questionnaire, 2h output, 3h signup, 3h buffer)

### Success Criteria
- [ ] Questionnaire loads with 5 questions
- [ ] Character counters work in real-time
- [ ] Progress indicator shows current question (1/5, 2/5, etc.)
- [ ] Form validates before submission
- [ ] Tone selection works (3 options)
- [ ] Reflection submits to tRPC successfully
- [ ] Loading state during AI generation
- [ ] Output page displays formatted reflection
- [ ] "Copy Text" button works
- [ ] "New Reflection" and "Back to Dashboard" navigation works
- [ ] Signup flow creates new accounts
- [ ] Mobile responsive

---

### Phase 1: Reflection Shared Components (Day 2 - 3 hours)

**Dependencies:** Builder-1 Phase 1 complete (CSS + hooks ready)

**Files to Create:**
1. `components/reflection/QuestionStep.tsx` - Single question component, 1h
2. `components/reflection/CharacterCounter.tsx` - Live character count, 30min
3. `components/reflection/ProgressIndicator.tsx` - Question progress (1/5, 2/5), 30min
4. `components/reflection/ToneSelection.tsx` - Tone picker UI, 1h

**QuestionStep Pattern:**
```typescript
// components/reflection/QuestionStep.tsx
'use client';

import React from 'react';
import CharacterCounter from './CharacterCounter';

interface QuestionStepProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  error?: string;
  type?: 'textarea' | 'radio';
  options?: string[]; // For radio type
}

const QuestionStep: React.FC<QuestionStepProps> = ({
  question,
  value,
  onChange,
  maxLength,
  error,
  type = 'textarea',
  options,
}) => {
  if (type === 'radio' && options) {
    return (
      <div className="question-step">
        <h2 className="question-text">{question}</h2>
        <div className="radio-group">
          {options.map((option) => (
            <label key={option} className="radio-label">
              <input
                type="radio"
                name="question"
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
              />
              {option}
            </label>
          ))}
        </div>
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  }

  return (
    <div className="question-step">
      <h2 className="question-text">{question}</h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className={error ? 'error' : ''}
        rows={8}
      />
      {error && <span className="error-message">{error}</span>}
      <CharacterCounter current={value.length} max={maxLength} />
    </div>
  );
};

export default QuestionStep;
```

**ToneSelection Pattern:**
```typescript
// components/reflection/ToneSelection.tsx
'use client';

import React from 'react';
import { ToneName } from '@/types';

interface ToneSelectionProps {
  selectedTone: ToneName;
  onSelect: (tone: ToneName) => void;
}

const TONES = [
  {
    name: 'gentle' as ToneName,
    title: 'Gentle Clarity',
    description: 'Soft, nurturing guidance',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  {
    name: 'intense' as ToneName,
    title: 'Luminous Intensity',
    description: 'Direct, powerful truth',
    color: 'rgba(147, 51, 234, 0.95)',
  },
  {
    name: 'fusion' as ToneName,
    title: 'Sacred Fusion',
    description: 'Balanced, harmonious wisdom',
    color: 'rgba(251, 191, 36, 0.95)',
  },
];

const ToneSelection: React.FC<ToneSelectionProps> = ({ selectedTone, onSelect }) => {
  return (
    <div className="tone-selection">
      <h2>Select Your Tone</h2>
      <div className="tone-cards">
        {TONES.map((tone) => (
          <button
            key={tone.name}
            className={`tone-card ${selectedTone === tone.name ? 'selected' : ''}`}
            onClick={() => onSelect(tone.name)}
            style={{ borderColor: tone.color }}
          >
            <h3>{tone.title}</h3>
            <p>{tone.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ToneSelection;
```

**Testing:**
- [ ] QuestionStep renders correctly for textarea and radio
- [ ] CharacterCounter updates in real-time
- [ ] ProgressIndicator shows correct step (1/5, 2/5, etc.)
- [ ] ToneSelection highlights selected tone

---

### Phase 2: Questionnaire Page (Day 2-3 - 6 hours)

**Dependencies:** Phase 1 complete (shared components ready)

**File to Create:**
1. `app/reflection/page.tsx` (replace placeholder)

**This is the most complex form in the app - 5 questions + tone + validation + submission**

**Pattern:**
```typescript
// app/reflection/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import CosmicBackground from '@/components/shared/CosmicBackground';
import QuestionStep from '@/components/reflection/QuestionStep';
import ToneSelection from '@/components/reflection/ToneSelection';
import ProgressIndicator from '@/components/reflection/ProgressIndicator';
import { ToneName } from '@/types';
import '@/styles/mirror.css';

interface FormData {
  dream: string;
  plan: string;
  hasDate: boolean;
  relationship: string;
  sacrifice: string;
  tone: ToneName;
}

export default function ReflectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1-5 for questions, 6 for tone
  const [formData, setFormData] = useState<FormData>({
    dream: '',
    plan: '',
    hasDate: false,
    relationship: '',
    sacrifice: '',
    tone: 'gentle',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createReflection = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      router.push(`/reflection/output?id=${data.id}`);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 && !formData.dream.trim()) {
      newErrors.dream = 'Please share your dream';
    }
    if (step === 2 && !formData.plan.trim()) {
      newErrors.plan = 'Please share your plan';
    }
    if (step === 4 && !formData.relationship.trim()) {
      newErrors.relationship = 'Please share your relationship with this dream';
    }
    if (step === 5 && !formData.sacrifice.trim()) {
      newErrors.sacrifice = 'Please share what you are willing to give';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    await createReflection.mutateAsync(formData);
  };

  return (
    <div className="reflection-container">
      <CosmicBackground />

      <div className="reflection-content">
        {step <= 5 && <ProgressIndicator current={step} total={5} />}

        {step === 1 && (
          <QuestionStep
            question="What is your dream?"
            value={formData.dream}
            onChange={(v) => handleChange('dream', v)}
            maxLength={3200}
            error={errors.dream}
          />
        )}

        {step === 2 && (
          <QuestionStep
            question="What is your plan?"
            value={formData.plan}
            onChange={(v) => handleChange('plan', v)}
            maxLength={4000}
            error={errors.plan}
          />
        )}

        {step === 3 && (
          <QuestionStep
            question="Have you set a date?"
            value={formData.hasDate ? 'Yes' : 'No'}
            onChange={(v) => handleChange('hasDate', v === 'Yes')}
            maxLength={10}
            type="radio"
            options={['Yes', 'No']}
          />
        )}

        {step === 4 && (
          <QuestionStep
            question="What is your relationship with this dream?"
            value={formData.relationship}
            onChange={(v) => handleChange('relationship', v)}
            maxLength={4000}
            error={errors.relationship}
          />
        )}

        {step === 5 && (
          <QuestionStep
            question="What are you willing to give?"
            value={formData.sacrifice}
            onChange={(v) => handleChange('sacrifice', v)}
            maxLength={2400}
            error={errors.sacrifice}
          />
        )}

        {step === 6 && (
          <ToneSelection
            selectedTone={formData.tone}
            onSelect={(tone) => handleChange('tone', tone)}
          />
        )}

        <div className="reflection-navigation">
          {step > 1 && <button onClick={handleBack}>Back</button>}

          {step < 6 && <button onClick={handleNext}>Continue</button>}

          {step === 6 && (
            <button
              onClick={handleSubmit}
              disabled={createReflection.isLoading}
            >
              {createReflection.isLoading ? 'Generating...' : 'Generate Reflection'}
            </button>
          )}
        </div>

        {createReflection.isLoading && (
          <div className="loading-overlay">
            <div className="cosmic-spinner" />
            <p>Creating your reflection...</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Implementation Notes:**
- 6 steps total: 5 questions + tone selection
- Step state controls which question shows
- Validation on each step before proceeding
- Final submission triggers tRPC mutation
- Loading overlay during AI generation
- Navigate to output page on success

**Testing:**
- [ ] All 5 questions render correctly
- [ ] Character counters work
- [ ] Validation prevents empty answers
- [ ] "Back" and "Continue" buttons work
- [ ] Tone selection shows 3 options
- [ ] Form submits to tRPC
- [ ] Loading state shows during generation
- [ ] Navigates to output page on success

---

### Phase 3: Reflection Output Page (Day 3 - 2 hours)

**Dependencies:** Phase 2 complete (can test with existing reflections)

**File to Create:**
1. `app/reflection/output/page.tsx` (replace placeholder)

**Pattern:**
```typescript
// app/reflection/output/page.tsx
'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import CosmicBackground from '@/components/shared/CosmicBackground';
import '@/styles/mirror.css';

export default function ReflectionOutputPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reflectionId = searchParams.get('id');

  const { data, isLoading, error } = trpc.reflections.get.useQuery(
    { id: reflectionId || '' },
    { enabled: !!reflectionId }
  );

  const handleCopy = () => {
    if (data?.content) {
      navigator.clipboard.writeText(data.content);
      alert('Reflection copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="reflection-output">
        <CosmicBackground />
        <div className="loading-state">
          <div className="cosmic-spinner" />
          <p>Loading reflection...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="reflection-output">
        <CosmicBackground />
        <div className="error-state">
          <h2>Failed to load reflection</h2>
          <button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reflection-output">
      <CosmicBackground />

      <div className="reflection-content">
        <div className="reflection-metadata">
          <span>{new Date(data.createdAt).toLocaleDateString()}</span>
          <span>{data.tone}</span>
          <span>{data.wordCount} words</span>
        </div>

        <div className="reflection-text">
          {data.content}
        </div>

        <div className="reflection-actions">
          <button onClick={handleCopy}>Copy Text</button>
          <button onClick={() => router.push('/reflection')}>
            New Reflection
          </button>
          <button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Output page loads with reflection
- [ ] Metadata displays correctly (date, tone, word count)
- [ ] Reflection text displays with formatting
- [ ] "Copy Text" button works
- [ ] "New Reflection" navigates to questionnaire
- [ ] "Back to Dashboard" navigates to dashboard
- [ ] Error state shows if reflection not found

---

### Phase 4: Signup Flow (Day 3 - 3 hours)

**Dependencies:** None (can work in parallel with reflection flow)

**File to Create:**
1. `app/auth/signup/page.tsx` (currently doesn't exist)

**Pattern:**
```typescript
// app/auth/signup/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import CosmicBackground from '@/components/shared/CosmicBackground';
import '@/styles/auth.css';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await signupMutation.mutateAsync({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="auth-page">
      <CosmicBackground />

      <div className="auth-container">
        <h1>Create Account</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="form-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
              />
              I agree to the Terms of Service and Privacy Policy
            </label>
            {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}
          </div>

          {errors.submit && <div className="error-banner">{errors.submit}</div>}

          <button type="submit" disabled={signupMutation.isLoading}>
            {signupMutation.isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/auth/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Signup form renders correctly
- [ ] All fields validate properly
- [ ] Password strength indicator works (if added)
- [ ] Terms checkbox required
- [ ] Password confirmation matches
- [ ] Successful signup redirects to dashboard
- [ ] Error messages display for failed signup
- [ ] "Sign in" link works

**Checkpoint:** Reflection flow + signup complete

---

### Dependencies
**Depends on:** Builder-1 Phase 1 (CSS + hooks)

**Blocks:** None (parallel with Builder-2)

### Potential Split Strategy
If reflection flow proves too complex:

**Primary Builder-3:**
- Reflection shared components (3h)
- Questionnaire page (6h)

**Sub-builder 3A:**
- Reflection output page (2h)
- Signup flow (3h)

---

## Integration & Testing (Day 3-4 - All Builders)

### Collaborative Testing Phase (6 hours total)

**After all builders complete their layers:**

#### Integration Checklist (2 hours)

**End-to-End Flow Testing:**
- [ ] Landing page → Signin → Dashboard → Reflection → Output → Dashboard (complete loop)
- [ ] Landing page → Signup → Dashboard (new user flow)
- [ ] Dashboard → View All Reflections (already works, verify integration)
- [ ] All navigation links work
- [ ] All buttons functional

**Cross-Component Integration:**
- [ ] CosmicBackground renders on all pages
- [ ] Animations work consistently
- [ ] Loading states appear correctly
- [ ] Error handling works across all pages

**Visual Regression:**
- [ ] Compare screenshots to original at 3 breakpoints (320px, 768px, 1920px)
- [ ] Verify cosmic theme colors accurate
- [ ] Check all animations smooth (60fps)
- [ ] Test on real devices

#### Bug Fixes (2-3 hours)

**Common Issues to Check:**
- TypeScript errors in production build
- CSS import order causing visual issues
- tRPC type mismatches
- Navigation bugs (wrong redirects)
- Mobile responsive breakage
- Animation performance issues

#### Polish (1-2 hours)

**Final Touches:**
- Loading state timing (minimum 500ms to prevent flash)
- Error message copy (user-friendly, not technical)
- Empty states (beautiful, actionable)
- Accessibility (keyboard nav, ARIA labels)
- Performance (Lighthouse audit)

---

## Final Deployment Checklist

**Before marking iteration complete:**

### Build Verification
- [ ] `npx tsc --noEmit` - 0 TypeScript errors
- [ ] `npm run build` - Succeeds without errors
- [ ] Build size < 500KB first load JS
- [ ] No console warnings in production mode

### Functional Testing
- [ ] Complete user journey works (landing → dashboard → reflection → output)
- [ ] Signup creates new accounts
- [ ] Signin works for existing users
- [ ] All forms validate correctly
- [ ] All navigation works

### Visual Testing
- [ ] Cosmic theme consistent across all pages
- [ ] Animations smooth (no jank)
- [ ] Mobile responsive (320px, 768px, 1920px)
- [ ] Glass morphism effects render correctly
- [ ] Loading states appear for all async operations

### Performance Testing
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility = 100
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s

### Browser Testing
- [ ] Chrome (latest)
- [ ] Safari (macOS and iOS)
- [ ] Firefox (latest)
- [ ] Chrome Android

---

## Builder Communication Protocol

### Daily Standup (Async)

**Each builder reports:**
1. What I completed yesterday
2. What I'm working on today
3. Any blockers or questions

**Example:**
```
Builder-2 Update (Day 2):
✅ Completed: DashboardCard, ProgressRing, TierBadge
🔄 In Progress: UsageCard (50% done)
⏳ Next: ReflectionsCard
🚧 Blocker: Need to verify tRPC router schema for usage data
```

### Handoff Documents

**Builder-1 → Builder-2, Builder-3:**
After completing foundation (Day 1), create handoff document:

```markdown
## Foundation Handoff (Builder-1 → Builder-2, Builder-3)

**Completed:**
- ✅ All 6 CSS files migrated to `styles/`
- ✅ All hooks migrated to `hooks/`
- ✅ All utils migrated to `lib/utils/`

**Usage:**
- Import CSS: `import '@/styles/dashboard.css'`
- Import hooks: `import { useDashboard } from '@/hooks/useDashboard'`
- Import utils: `import { MAX_REFLECTIONS_FREE_TIER } from '@/lib/utils/constants'`

**Known Issues:**
- None

**Notes:**
- `useBreathingEffect()` has 5 presets: 'card', 'background', 'focus', 'meditation', 'active'
- All tRPC routers verified working
- CSS variables available in `variables.css`
```

### Conflict Resolution

**If two builders need to modify the same file:**
1. Communicate in advance
2. One builder completes their changes first
3. Second builder pulls latest and merges
4. Test integration immediately

**Shared files that may conflict:**
- `types/` directory (if adding new types)
- `app/layout.tsx` (if adding global CSS imports)
- `components/shared/` (if creating new shared components)

---

## Success Metrics

**Iteration 1.5 is complete when ALL builders verify:**

### Functional Completeness (100%)
- [ ] All 34 components migrated
- [ ] All 4 page flows work (landing, dashboard, reflection, auth)
- [ ] All navigation functional
- [ ] All forms submit correctly
- [ ] All data loads from tRPC

### Technical Quality (100%)
- [ ] TypeScript: 0 errors (strict mode)
- [ ] Build: Succeeds (`npm run build`)
- [ ] No console errors
- [ ] All imports resolve correctly

### User Experience (100%)
- [ ] No placeholder text visible
- [ ] All buttons work
- [ ] All animations smooth
- [ ] Mobile responsive
- [ ] Cosmic theme preserved

### Performance (90%+)
- [ ] Lighthouse Performance > 90
- [ ] First Load JS < 100 kB
- [ ] Time to Interactive < 3s

---

**End of Builder Tasks Document**

**Next Step:** Builders execute tasks in parallel after planning approval.
