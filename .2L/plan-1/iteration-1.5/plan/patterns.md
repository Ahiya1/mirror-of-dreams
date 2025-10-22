# Code Patterns & Conventions - Iteration 1.5

**PURPOSE:** This is the most important file for builders. Every pattern includes full, working code examples that you can copy and adapt.

**CRITICAL:** Follow these patterns exactly. Deviation causes integration issues and visual regressions.

---

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── layout.tsx              # Root layout (global CSS imports)
│   ├── page.tsx                # Landing page (Portal)
│   ├── dashboard/
│   │   └── page.tsx           # Dashboard
│   ├── reflection/
│   │   ├── page.tsx           # Questionnaire
│   │   └── output/
│   │       └── page.tsx       # Reflection output
│   └── auth/
│       ├── signin/
│       │   └── page.tsx       # ✅ Already migrated
│       └── signup/
│           └── page.tsx       # To migrate
├── components/
│   ├── portal/                # Portal components
│   │   ├── MirrorShards.tsx
│   │   ├── ButtonGroup.tsx
│   │   └── ...
│   ├── dashboard/             # Dashboard components
│   │   ├── cards/
│   │   │   ├── UsageCard.tsx
│   │   │   └── ...
│   │   └── shared/
│   │       ├── DashboardCard.tsx
│   │       └── ...
│   ├── reflection/            # Reflection components
│   │   ├── Questionnaire.tsx
│   │   ├── QuestionStep.tsx
│   │   └── ...
│   └── shared/                # Shared across all pages
│       └── CosmicBackground.tsx  # ✅ Already migrated
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts
│   ├── useDashboard.ts
│   ├── useBreathingEffect.ts
│   └── ...
├── lib/
│   ├── trpc.ts               # tRPC client setup ✅
│   └── utils/                # Utility functions
│       ├── validation.ts
│       └── constants.ts
├── styles/                    # CSS files
│   ├── variables.css         # CSS custom properties
│   ├── animations.css        # Keyframe animations
│   ├── dashboard.css
│   ├── mirror.css
│   ├── portal.css
│   └── auth.css
├── types/                     # TypeScript types ✅
│   ├── index.ts
│   ├── user.ts
│   ├── reflection.ts
│   └── ...
└── server/                    # Backend (tRPC routers) ✅
    └── trpc/
        └── routers/
            ├── _app.ts
            ├── auth.ts
            ├── reflections.ts
            └── ...
```

---

## Naming Conventions

### Files

**Components:** PascalCase with `.tsx` extension
```
UsageCard.tsx
DashboardCard.tsx
MirrorShards.tsx
```

**Hooks:** camelCase starting with `use`, `.ts` extension
```
useAuth.ts
useDashboard.ts
useBreathingEffect.ts
```

**Utilities:** camelCase, `.ts` extension
```
validation.ts
constants.ts
greetingGenerator.ts
```

**CSS Files:** lowercase with hyphens, `.css` extension
```
dashboard.css
mirror.css
variables.css
```

**CSS Modules:** Component name + `.module.css`
```
MirrorShards.module.css
ToneElements.module.css
```

### Variables & Functions

**Constants:** SCREAMING_SNAKE_CASE
```typescript
const MAX_REFLECTIONS_FREE_TIER = 3;
const CHARACTER_LIMIT_DREAM = 3200;
```

**Functions:** camelCase
```typescript
function calculateUsagePercentage(current: number, limit: number): number
function formatReflectionDate(date: Date): string
```

**Components:** PascalCase
```typescript
const UsageCard: React.FC<UsageCardProps> = ({ ... }) => { ... }
const DashboardCard: React.FC<DashboardCardProps> = ({ ... }) => { ... }
```

**Types/Interfaces:** PascalCase
```typescript
interface UsageCardProps { ... }
type ToneName = 'fusion' | 'gentle' | 'intense';
```

---

## Pattern 1: Component Migration (JSX → TSX)

### When to Use
Every component migration from original to new codebase.

### Template

**Original (.jsx):**
```javascript
// src/components/dashboard/cards/UsageCard.jsx
import React from 'react';

const UsageCard = ({ data, isLoading, animated = true }) => {
  if (isLoading) {
    return <div className="usage-card loading">Loading...</div>;
  }

  return (
    <div className="usage-card">
      <h3>Usage</h3>
      <p>{data.current} / {data.limit} reflections</p>
    </div>
  );
};

export default UsageCard;
```

**Migrated (.tsx):**
```typescript
// components/dashboard/cards/UsageCard.tsx
'use client'; // Required for client components in Next.js App Router

import React from 'react';
import { UsageData } from '@/types'; // Import shared types

// Define props interface
interface UsageCardProps {
  data: UsageData;
  isLoading: boolean;
  animated?: boolean; // Optional with default value
}

// Type the component
const UsageCard: React.FC<UsageCardProps> = ({
  data,
  isLoading,
  animated = true, // Default value
}) => {
  // Loading state
  if (isLoading) {
    return <div className="usage-card loading">Loading...</div>;
  }

  // Main render
  return (
    <div className="usage-card">
      <h3>Usage</h3>
      <p>{data.current} / {data.limit} reflections</p>
    </div>
  );
};

export default UsageCard;
```

### Key Points

1. **Add `'use client'`** at top if component uses hooks or interactivity
2. **Import types from `@/types`** (never define types in component files unless props-only)
3. **Define `ComponentNameProps` interface** for all props
4. **Type the component:** `React.FC<ComponentNameProps>`
5. **Remove React import if only JSX** (Next.js 14 auto-imports)
6. **Keep all styling, CSS classes, and logic identical**

---

## Pattern 2: tRPC API Integration

### When to Use
Fetching data from server, creating/updating resources.

### Queries (GET Data)

**Pattern:**
```typescript
'use client';

import { trpc } from '@/lib/trpc';

const DashboardPage = () => {
  // Query hook (auto-refetches, caches, handles loading/error)
  const {
    data,           // Typed data from server
    isLoading,      // Boolean: true during fetch
    error,          // Error object if failed
    refetch,        // Function to manually refetch
  } = trpc.reflections.list.useQuery();

  // Loading state
  if (isLoading) {
    return <div>Loading reflections...</div>;
  }

  // Error state
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Success state (data is typed!)
  return (
    <div>
      {data.map(reflection => (
        <div key={reflection.id}>{reflection.dream}</div>
      ))}
    </div>
  );
};
```

### Mutations (POST/PUT/DELETE Data)

**Pattern:**
```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';

const ReflectionForm = () => {
  const router = useRouter();

  // Mutation hook
  const createReflection = trpc.reflection.create.useMutation({
    // Success handler
    onSuccess: (data) => {
      console.log('Reflection created:', data);
      router.push(`/reflection/output?id=${data.id}`);
    },

    // Error handler
    onError: (error) => {
      console.error('Failed to create reflection:', error);
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = async (formData: ReflectionFormData) => {
    try {
      // Trigger mutation
      await createReflection.mutateAsync({
        dream: formData.dream,
        plan: formData.plan,
        hasDate: formData.hasDate,
        relationship: formData.relationship,
        sacrifice: formData.sacrifice,
        tone: formData.tone,
      });
      // Success callback fires automatically
    } catch (error) {
      // Error callback fires automatically
      // Additional error handling here if needed
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(formData);
    }}>
      {/* Form fields */}
      <button type="submit" disabled={createReflection.isLoading}>
        {createReflection.isLoading ? 'Generating...' : 'Generate Reflection'}
      </button>
    </form>
  );
};
```

### Available tRPC Routers

```typescript
// Reference: server/trpc/routers/_app.ts
trpc.auth.signin.useMutation()          // Sign in
trpc.auth.signup.useMutation()          // Sign up
trpc.auth.signout.useMutation()         // Sign out

trpc.reflections.list.useQuery()        // Get user's reflections
trpc.reflections.get.useQuery({ id })   // Get single reflection

trpc.reflection.create.useMutation()    // Create new reflection (AI generation)

trpc.users.get.useQuery()               // Get current user
trpc.users.update.useMutation()         // Update user profile

trpc.subscriptions.get.useQuery()       // Get subscription tier

trpc.evolution.canGenerate.useQuery()   // Check if can generate evolution report
```

### Key Points

1. **Queries auto-fetch on mount** - No need to call manually
2. **Mutations return promises** - Use `await` or `.then()`
3. **Types are inferred** - No need to specify return types
4. **Error handling** - Use `onError` callback or try/catch
5. **Optimistic updates** - Use `onMutate` for instant UI feedback (advanced)

---

## Pattern 3: Next.js Navigation

### When to Use
Navigating between pages, redirecting after actions.

### Client-Side Navigation

**Pattern:**
```typescript
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

const NavigationExample = () => {
  const router = useRouter();

  // Programmatic navigation
  const handleClick = () => {
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.back();
  };

  const handleReplace = () => {
    router.replace('/auth/signin'); // No back button history
  };

  return (
    <div>
      {/* Preferred: Link component (client-side navigation) */}
      <Link href="/dashboard">Go to Dashboard</Link>

      {/* Programmatic navigation */}
      <button onClick={handleClick}>Navigate to Dashboard</button>
      <button onClick={handleBack}>Go Back</button>
      <button onClick={handleReplace}>Sign In (replace)</button>
    </div>
  );
};
```

### Navigation with Query Params

**Pattern:**
```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const ReflectionOutput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read query param
  const reflectionId = searchParams.get('id');

  // Navigate with query param
  const goToReflection = (id: string) => {
    router.push(`/reflection/output?id=${id}`);
  };

  // Multiple query params
  const goToReflectionWithTone = (id: string, tone: string) => {
    router.push(`/reflection/output?id=${id}&tone=${tone}`);
  };

  return <div>Reflection ID: {reflectionId}</div>;
};
```

### Server-Side Redirect (in Server Components)

**Pattern:**
```typescript
// app/dashboard/page.tsx (Server Component)
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await getUser();

  // Redirect if not authenticated
  if (!user) {
    redirect('/auth/signin');
  }

  return <div>Welcome, {user.name}</div>;
}
```

### Migration from React Router

**Old (React Router):**
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');
navigate('/dashboard', { replace: true });
navigate(-1); // Go back
```

**New (Next.js):**
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
router.replace('/dashboard');
router.back(); // Go back
```

---

## Pattern 4: CSS Import Strategy

### When to Use
Applying styles to components and pages.

### Global CSS (Variables + Animations)

**Location:** `app/layout.tsx` (root layout)

```typescript
// app/layout.tsx
import '@/styles/variables.css';   // First: CSS custom properties
import '@/styles/animations.css';  // Second: Keyframe animations
import './globals.css';            // Third: Global resets

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Page-Level CSS

**Pattern:**
```typescript
// app/dashboard/page.tsx
import '@/styles/dashboard.css'; // Import CSS at top of file

export default function DashboardPage() {
  return (
    <div className="dashboard-container">
      {/* CSS classes from dashboard.css */}
    </div>
  );
}
```

### Component-Scoped CSS (CSS Modules)

**When:** Component has unique styles not shared elsewhere (e.g., MirrorShards animation)

**Pattern:**
```typescript
// components/portal/MirrorShards.tsx
import React from 'react';
import styles from './MirrorShards.module.css';

const MirrorShards: React.FC = () => {
  return (
    <div className={styles.mirrorsContainer}>
      <div className={styles.mirror} />
      <div className={styles.mirror} />
      <div className={styles.mirror} />
    </div>
  );
};

export default MirrorShards;
```

**CSS Module File:**
```css
/* components/portal/MirrorShards.module.css */
.mirrorsContainer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.mirror {
  position: absolute;
  width: 200px;
  height: 200px;
  background: linear-gradient(
    135deg,
    rgba(147, 51, 234, 0.1),
    rgba(59, 130, 246, 0.05)
  );
  backdrop-filter: blur(20px);
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
```

### Using CSS Variables

**Pattern:**
```css
/* Use variables defined in variables.css */
.my-component {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-3xl);
  padding: var(--space-lg);
  transition: var(--transition-elegant);
  box-shadow: var(--shadow-lg);
}

.my-component:hover {
  border-color: var(--cosmic-primary);
  box-shadow: var(--glow-md);
}
```

### Conditional Classes

**Pattern:**
```typescript
const Card = ({ isLoading, isError }: CardProps) => {
  // Method 1: Template literal
  const className = `dashboard-card ${isLoading ? 'loading' : ''} ${isError ? 'error' : ''}`;

  // Method 2: Array join
  const classNames = [
    'dashboard-card',
    isLoading && 'loading',
    isError && 'error',
  ].filter(Boolean).join(' ');

  return <div className={className}>{/* ... */}</div>;
};
```

---

## Pattern 5: Animation Patterns

### CSS-Only Animations

**When:** Simple, stateless animations (fade in, slide up, pulse)

**Pattern:**
```tsx
// Use utility classes from animations.css
<div className="animate-fade-in">
  Content fades in
</div>

<div className="animate-slide-up animate-delay-200">
  Content slides up after 200ms
</div>

<div className="animate-breathe">
  Card breathes (subtle scale pulse)
</div>
```

**Available Animation Classes:**
```css
/* Entrance animations */
.animate-fade-in
.animate-slide-up
.animate-slide-down
.animate-slide-left
.animate-slide-right
.animate-scale-in
.animate-card-entrance

/* Continuous animations */
.animate-breathe
.animate-pulse
.animate-float
.animate-cosmic-spin

/* Delays */
.animate-delay-100  /* 100ms delay */
.animate-delay-200  /* 200ms delay */
.animate-delay-300  /* 300ms delay */
.animate-delay-500  /* 500ms delay */
```

### Breathing Effect Hook

**When:** Component needs dynamic "alive" animation

**Pattern:**
```typescript
'use client';

import { useBreathingEffect } from '@/hooks/useBreathingEffect';

const Card = () => {
  const breathing = useBreathingEffect('card'); // Use preset

  return (
    <div
      style={{
        animation: breathing.animation,
        animationPlayState: breathing.animationPlayState,
      }}
    >
      Card content
    </div>
  );
};
```

**Presets:**
```typescript
useBreathingEffect('card')       // 4s, 1.5% scale, pause on hover
useBreathingEffect('background') // 8s, 1% scale, always running
useBreathingEffect('focus')      // 3s, 3% scale, pause on hover
useBreathingEffect('meditation') // 6s, 2% scale, always running
useBreathingEffect('active')     // 2s, 2.5% scale, pause on hover
```

**Custom Options:**
```typescript
const breathing = useBreathingEffect(4000, {
  intensity: 0.02,      // 2% scale change (0.98 to 1.02)
  opacityChange: 0.1,   // 10% opacity change
  pauseOnHover: true,   // Pause when user hovers
});
```

### Stagger Animation Hook

**When:** List or grid items should animate in sequence

**Pattern:**
```typescript
'use client';

import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';

const DashboardGrid = ({ cards }: { cards: CardData[] }) => {
  const { containerRef, getItemStyles } = useStaggerAnimation(cards.length, {
    delay: 100,        // 100ms between items
    duration: 600,     // 600ms animation duration
    triggerOnce: true, // Animate only on first scroll into view
  });

  return (
    <div ref={containerRef} className="dashboard-grid">
      {cards.map((card, index) => (
        <div key={card.id} style={getItemStyles(index)}>
          <Card data={card} />
        </div>
      ))}
    </div>
  );
};
```

### Animated Counter Hook

**When:** Numbers should count up smoothly

**Pattern:**
```typescript
'use client';

import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

const UsageCard = ({ current, limit }: UsageCardProps) => {
  const animatedCurrent = useAnimatedCounter(current, {
    duration: 1000,           // 1 second count-up
    easing: 'easeOutQuart',   // Smooth easing
  });

  return (
    <div className="usage-card">
      <h3>Reflections</h3>
      <p>{Math.round(animatedCurrent)} / {limit}</p>
    </div>
  );
};
```

---

## Pattern 6: Form Handling

### Controlled Form with Validation

**Pattern:**
```typescript
'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';

interface FormData {
  dream: string;
  plan: string;
  hasDate: boolean;
  relationship: string;
  sacrifice: string;
  tone: 'fusion' | 'gentle' | 'intense';
}

const ReflectionForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    dream: '',
    plan: '',
    hasDate: false,
    relationship: '',
    sacrifice: '',
    tone: 'gentle',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // tRPC mutation
  const createReflection = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      router.push(`/reflection/output?id=${data.id}`);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  // Handle field change
  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dream.trim()) {
      newErrors.dream = 'Please share your dream';
    }
    if (formData.dream.length > 3200) {
      newErrors.dream = 'Dream must be 3200 characters or less';
    }

    if (!formData.plan.trim()) {
      newErrors.plan = 'Please share your plan';
    }

    // ... more validation

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await createReflection.mutateAsync(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Dream field */}
      <div className="form-field">
        <label htmlFor="dream">What is your dream?</label>
        <textarea
          id="dream"
          value={formData.dream}
          onChange={(e) => handleChange('dream', e.target.value)}
          maxLength={3200}
          className={errors.dream ? 'error' : ''}
        />
        {errors.dream && <span className="error-message">{errors.dream}</span>}
        <CharacterCounter current={formData.dream.length} max={3200} />
      </div>

      {/* Plan field */}
      <div className="form-field">
        <label htmlFor="plan">What is your plan?</label>
        <textarea
          id="plan"
          value={formData.plan}
          onChange={(e) => handleChange('plan', e.target.value)}
          maxLength={4000}
          className={errors.plan ? 'error' : ''}
        />
        {errors.plan && <span className="error-message">{errors.plan}</span>}
        <CharacterCounter current={formData.plan.length} max={4000} />
      </div>

      {/* Radio buttons */}
      <div className="form-field">
        <label>Have you set a date?</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="hasDate"
              checked={formData.hasDate === true}
              onChange={() => handleChange('hasDate', true)}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="hasDate"
              checked={formData.hasDate === false}
              onChange={() => handleChange('hasDate', false)}
            />
            No
          </label>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" disabled={createReflection.isLoading}>
        {createReflection.isLoading ? 'Generating...' : 'Generate Reflection'}
      </button>

      {errors.submit && <div className="error-banner">{errors.submit}</div>}
    </form>
  );
};

export default ReflectionForm;
```

### Character Counter Component

**Pattern:**
```typescript
// components/shared/CharacterCounter.tsx
'use client';

import React from 'react';

interface CharacterCounterProps {
  current: number;
  max: number;
  warning?: number; // Optional: turn yellow at this threshold
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max,
  warning = max * 0.85, // Default: 85% of max
}) => {
  const percentage = (current / max) * 100;
  const isWarning = current >= warning;
  const isError = current >= max;

  const className = [
    'character-counter',
    isError && 'error',
    isWarning && !isError && 'warning',
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <span className="count">{current}</span>
      <span className="separator">/</span>
      <span className="max">{max}</span>
    </div>
  );
};

export default CharacterCounter;
```

---

## Pattern 7: Error Handling

### API Error Handling

**Pattern:**
```typescript
'use client';

import { trpc } from '@/lib/trpc';

const DataComponent = () => {
  const { data, isLoading, error, refetch } = trpc.reflections.list.useQuery();

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="cosmic-spinner" />
        <p>Loading reflections...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-state">
        <h3>Failed to load reflections</h3>
        <p>{error.message}</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <p>No reflections yet</p>
        <button onClick={() => router.push('/reflection')}>
          Create Your First Reflection
        </button>
      </div>
    );
  }

  // Success state
  return (
    <div>
      {data.map(reflection => (
        <div key={reflection.id}>{reflection.dream}</div>
      ))}
    </div>
  );
};
```

### Form Validation Errors

**Pattern:**
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = (): boolean => {
  const newErrors: Record<string, string> = {};

  // Field validation
  if (!formData.email.includes('@')) {
    newErrors.email = 'Please enter a valid email';
  }

  if (formData.password.length < 8) {
    newErrors.password = 'Password must be at least 8 characters';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// In JSX
{errors.email && (
  <span className="field-error">{errors.email}</span>
)}
```

### Global Error Boundary (React 18)

**Pattern:**
```typescript
// components/ErrorBoundary.tsx
'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## Pattern 8: Loading States

### Skeleton Loading

**Pattern:**
```typescript
const SkeletonCard = () => (
  <div className="dashboard-card skeleton">
    <div className="skeleton-title" />
    <div className="skeleton-text" />
    <div className="skeleton-text short" />
  </div>
);

const DashboardPage = () => {
  const { data, isLoading } = trpc.dashboard.getData.useQuery();

  if (isLoading) {
    return (
      <div className="dashboard-grid">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return <div>{/* Real content */}</div>;
};
```

**CSS for Skeleton:**
```css
.dashboard-card.skeleton {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.1)
  );
  animation: loadingPulse 3s ease-in-out infinite;
}

.skeleton-title {
  width: 60%;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.skeleton-text {
  width: 100%;
  height: 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-text.short {
  width: 70%;
}

@keyframes loadingPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Spinner Loading

**Pattern:**
```typescript
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="cosmic-spinner" />
    <p className="loading-text">Loading...</p>
  </div>
);
```

**CSS:**
```css
.cosmic-spinner {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(147, 51, 234, 0.2);
  border-top-color: rgba(147, 51, 234, 0.8);
  border-radius: 50%;
  animation: cosmicSpin 1s linear infinite;
}

@keyframes cosmicSpin {
  to { transform: rotate(360deg); }
}
```

---

## Pattern 9: TypeScript Type Usage

### Import Shared Types

**Pattern:**
```typescript
import {
  User,
  Reflection,
  UsageData,
  TierName,
  ToneName,
} from '@/types';

interface ComponentProps {
  user: User;
  reflections: Reflection[];
  usage: UsageData;
}
```

### Define Component Props

**Pattern:**
```typescript
// Simple props
interface CardProps {
  title: string;
  description: string;
  isActive?: boolean; // Optional
}

// Complex props with union types
interface ToneCardProps {
  tone: 'fusion' | 'gentle' | 'intense';
  isSelected: boolean;
  onClick: (tone: ToneName) => void;
}

// Props with children
interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

// Props extending HTML attributes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}
```

### Type Function Returns

**Pattern:**
```typescript
function calculateUsage(current: number, limit: number): number {
  return (current / limit) * 100;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

async function fetchReflection(id: string): Promise<Reflection> {
  const { data } = await supabase
    .from('reflections')
    .select('*')
    .eq('id', id)
    .single();

  return data as Reflection;
}
```

---

## Pattern 10: Custom Hooks

### Hook with State

**Pattern:**
```typescript
// hooks/useToggle.ts
import { useState, useCallback } from 'react';

export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  return [value, toggle];
}

// Usage
const [isOpen, toggleOpen] = useToggle(false);
```

### Hook with tRPC

**Pattern:**
```typescript
// hooks/useDashboard.ts
'use client';

import { trpc } from '@/lib/trpc';

export function useDashboard() {
  const {
    data: usage,
    isLoading: isLoadingUsage,
  } = trpc.subscriptions.getUsage.useQuery();

  const {
    data: reflections,
    isLoading: isLoadingReflections,
  } = trpc.reflections.list.useQuery();

  return {
    usage,
    reflections,
    isLoading: isLoadingUsage || isLoadingReflections,
  };
}

// Usage
const { usage, reflections, isLoading } = useDashboard();
```

---

## Pattern 11: Responsive Design

### Breakpoint Usage

**CSS:**
```css
/* Mobile-first approach */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: Single column */
  gap: var(--space-lg);
}

@media (min-width: 768px) {
  /* Tablet: Still single column but wider */
  .dashboard-grid {
    max-width: 600px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  /* Desktop: 2x2 grid */
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
    max-width: 1200px;
  }
}
```

### Touch Target Sizing

**CSS:**
```css
/* Ensure touch targets are at least 48px */
@media (hover: none) and (pointer: coarse) {
  .button {
    min-height: 48px;
    padding: 1rem 1.5rem;
  }

  .control-button {
    min-height: 60px; /* WCAG AAA */
  }
}
```

---

## Import Order Convention

**Standard order:**
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Next.js imports
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// 3. External libraries
import { trpc } from '@/lib/trpc';

// 4. Internal types
import { User, Reflection } from '@/types';

// 5. Internal components
import DashboardCard from '@/components/dashboard/shared/DashboardCard';
import UsageCard from '@/components/dashboard/cards/UsageCard';

// 6. Internal hooks
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';

// 7. Internal utilities
import { formatDate } from '@/lib/utils/dates';

// 8. CSS imports (last)
import '@/styles/dashboard.css';
import styles from './Component.module.css';
```

---

## Code Quality Standards

### No `any` Types

❌ **Bad:**
```typescript
function processData(data: any) {
  return data.map((item: any) => item.id);
}
```

✅ **Good:**
```typescript
function processData(data: Reflection[]) {
  return data.map((item) => item.id);
}
```

### Explicit Return Types for Complex Functions

❌ **Bad:**
```typescript
function calculateUsage(current, limit) {
  return { percentage: (current / limit) * 100, canReflect: current < limit };
}
```

✅ **Good:**
```typescript
interface UsageResult {
  percentage: number;
  canReflect: boolean;
}

function calculateUsage(current: number, limit: number): UsageResult {
  return {
    percentage: (current / limit) * 100,
    canReflect: current < limit,
  };
}
```

### Avoid Nested Ternaries

❌ **Bad:**
```typescript
const status = isLoading ? 'Loading...' : error ? 'Error' : data ? 'Success' : 'No data';
```

✅ **Good:**
```typescript
let status: string;
if (isLoading) {
  status = 'Loading...';
} else if (error) {
  status = 'Error';
} else if (data) {
  status = 'Success';
} else {
  status = 'No data';
}
```

---

## Performance Patterns

### Memoization

**Pattern:**
```typescript
import { useMemo } from 'react';

const ExpensiveComponent = ({ data }: { data: Reflection[] }) => {
  // Expensive calculation
  const sortedData = useMemo(() => {
    return data.sort((a, b) => b.createdAt - a.createdAt);
  }, [data]);

  return <div>{/* Render sortedData */}</div>;
};
```

### Lazy Loading

**Pattern:**
```typescript
import dynamic from 'next/dynamic';

// Lazy load non-critical component
const ToneElements = dynamic(() => import('@/components/ToneElements'), {
  ssr: false, // Don't render on server
  loading: () => <div>Loading...</div>,
});
```

---

## Security Patterns

### Sanitize User Input (if rendering HTML)

**Pattern:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

const ReflectionOutput = ({ html }: { html: string }) => {
  const sanitized = DOMPurify.sanitize(html);

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

### Never Trust Client Data

**Pattern:**
```typescript
// ❌ Bad: Trusting client-provided user ID
const deleteReflection = async (userId: string, reflectionId: string) => {
  await supabase.from('reflections').delete().eq('id', reflectionId);
};

// ✅ Good: Getting user ID from session
const deleteReflection = async (reflectionId: string, ctx: Context) => {
  const { user } = ctx; // From authenticated session
  await supabase
    .from('reflections')
    .delete()
    .eq('id', reflectionId)
    .eq('user_id', user.id); // Ensure user owns reflection
};
```

---

## Summary Checklist

Before submitting a component migration, verify:

- [ ] `'use client'` directive added if component uses hooks/interactivity
- [ ] All imports use `@/` alias (not relative paths like `../../../`)
- [ ] Props interface defined with PascalCase `ComponentNameProps`
- [ ] Component typed: `React.FC<ComponentNameProps>`
- [ ] TypeScript strict mode: No `any` types, all params typed
- [ ] tRPC used for all API calls (not fetch)
- [ ] Navigation uses `useRouter()` from `next/navigation` (not React Router)
- [ ] CSS imported correctly (global in layout, page-level in pages, scoped as CSS Modules)
- [ ] Loading states for all async operations
- [ ] Error handling for all API calls
- [ ] Accessibility: ARIA labels, keyboard navigation, focus states
- [ ] Mobile responsive: Test at 320px, 768px, 1920px
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No console errors or TypeScript errors

**When in doubt, refer to existing migrated components:**
- `components/shared/CosmicBackground.tsx` ✅
- `app/auth/signin/page.tsx` ✅
