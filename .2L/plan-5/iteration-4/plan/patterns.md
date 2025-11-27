# Code Patterns & Conventions - Iteration 4

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard with enhanced visual hierarchy
│   ├── dreams/
│   │   └── page.tsx              # Dreams page with updated typography
│   ├── evolution/
│   │   └── page.tsx              # Evolution with loading states
│   ├── visualizations/
│   │   └── page.tsx              # Visualizations with loading states
│   └── reflection/
│       └── output/
│           └── page.tsx          # Reflection output with improved readability
├── components/
│   ├── dashboard/
│   │   ├── cards/
│   │   │   ├── DreamsCard.tsx    # Replace custom spinner with CosmicLoader
│   │   │   ├── ReflectionsCard.tsx  # Replace custom spinner
│   │   │   └── UsageCard.tsx     # Add CosmicLoader
│   │   └── shared/
│   │       ├── WelcomeSection.tsx   # Enhanced greeting
│   │       └── DashboardCard.tsx    # Enhanced hover states
│   ├── shared/
│   │   └── EmptyState.tsx        # Updated with personality
│   └── ui/
│       └── glass/
│           ├── CosmicLoader.tsx  # Existing (no changes)
│           └── GlowButton.tsx    # Use cosmic variant
├── styles/
│   ├── variables.css             # Updated typography variables
│   ├── globals.css               # Add typography utilities
│   ├── dashboard.css             # Update card hover states
│   └── mirror.css                # Replace hardcoded values
└── tailwind.config.ts            # Extend with spacing variables
```

---

## Naming Conventions

### Files
- **Pages:** `page.tsx` (Next.js App Router convention)
- **Components:** PascalCase (`WelcomeSection.tsx`, `DreamsCard.tsx`)
- **Utilities:** camelCase (`formatCurrency.ts`, `cn.ts`)
- **Styles:** kebab-case (`dashboard.css`, `mirror.css`)

### Classes
- **Typography Utilities:** `.text-h1`, `.text-h2`, `.text-body`
- **Spacing Utilities:** Use Tailwind with CSS variables (`gap-xl`, `p-lg`)
- **Component Classes:** BEM-style (`.dashboard-card__title`)

### Variables
- **CSS Custom Properties:** `--text-base`, `--space-xl`, `--leading-relaxed`
- **TypeScript:** camelCase (`isLoading`, `dreamsData`)
- **React State:** descriptive (`showLoading`, `isCreateModalOpen`)

---

## Typography Enforcement Pattern

### 1. Update CSS Variables (variables.css)

**When to use:** Adjusting base typography scale for accessibility and readability

**Code example:**
```css
/* styles/variables.css */

/* ADJUSTMENT 1: Increase --text-xs minimum (accessibility) */
/* Before */
--text-xs: clamp(0.7rem, 1.8vw, 0.85rem);

/* After */
--text-xs: clamp(0.85rem, 1.8vw, 0.9rem);
/* Now meets 14.4px minimum at mobile (320px width) */

/* ADJUSTMENT 2: Fine-tune --text-base for 1.1rem target */
/* Before */
--text-base: clamp(1rem, 2.5vw, 1.2rem);

/* After */
--text-base: clamp(1.05rem, 2.5vw, 1.15rem);
/* Closer to master plan target of 1.1rem body text */

/* ADJUSTMENT 3: Increase body line-height for readability */
/* Before */
--leading-relaxed: 1.625;

/* After */
--leading-relaxed: 1.75;
/* Closer to 1.8 target, improves reading comfort */
```

**Key points:**
- Only adjust 3 variables (minimal change)
- Use clamp() for responsive scaling
- Test at 320px (mobile) and 1920px (desktop) after changes
- No breaking changes (existing references remain valid)

---

### 2. Create Typography Utility Classes (globals.css)

**When to use:** Establishing semantic typography system across all pages

**Code example:**
```css
/* styles/globals.css */

@layer utilities {
  /* Typography Scale Utilities */
  .text-h1 {
    font-size: var(--text-4xl);      /* 3rem max (48px) */
    font-weight: var(--font-semibold); /* 600 */
    line-height: var(--leading-tight); /* 1.25 */
  }

  .text-h2 {
    font-size: var(--text-2xl);      /* 2rem max (32px) */
    font-weight: var(--font-semibold); /* 600 */
    line-height: var(--leading-tight); /* 1.25 */
  }

  .text-h3 {
    font-size: var(--text-xl);       /* 1.5rem max (24px) */
    font-weight: var(--font-medium);  /* 500 */
    line-height: var(--leading-snug); /* 1.375 */
  }

  .text-body {
    font-size: var(--text-base);     /* 1.1rem target (17.6px) */
    font-weight: var(--font-normal);  /* 400 */
    line-height: var(--leading-relaxed); /* 1.75 */
  }

  .text-small {
    font-size: var(--text-sm);       /* 0.9rem min (14.4px) */
    font-weight: var(--font-normal);  /* 400 */
    line-height: var(--leading-normal); /* 1.5 */
  }

  .text-tiny {
    font-size: var(--text-xs);       /* 0.85rem min (13.6px) - adjusted */
    font-weight: var(--font-normal);  /* 400 */
    line-height: var(--leading-snug); /* 1.375 */
  }
}
```

**Key points:**
- Single class applies size + weight + line-height
- Responsive by default (CSS variables use clamp)
- Semantic naming (h1, h2, body vs arbitrary sizes)
- No breakpoint management needed

---

### 3. Replace Tailwind Typography Classes

**When to use:** Updating pages to use new typography utilities

**Code example:**
```tsx
/* app/dreams/page.tsx */

// BEFORE (Tailwind classes)
<GradientText className="text-3xl sm:text-4xl font-bold mb-2">
  Your Dreams
</GradientText>
<p className="text-white/70 text-base sm:text-lg">
  Track and reflect on your life's aspirations
</p>

// AFTER (Typography utilities)
<GradientText className="text-h1 mb-2">
  Your Dreams
</GradientText>
<p className="text-body text-white/70">
  Track and reflect on your life's aspirations
</p>
```

**Key points:**
- Replace multiple classes with single semantic class
- Remove responsive breakpoints (sm:text-4xl) - handled by clamp()
- Keep utility classes for color/opacity (text-white/70)
- Keep spacing classes (mb-2) - will be updated separately

---

### 4. Refactor Mirror.css Typography

**When to use:** Replacing hardcoded rem values with CSS variables

**Code example:**
```css
/* styles/mirror.css */

/* BEFORE (Hardcoded) */
.matrix-header {
  font-size: 0.95rem;      /* ⚠️ Hardcoded */
  font-weight: 500;
}

.matrix-output {
  font-size: 1rem;         /* ⚠️ Hardcoded */
  line-height: 1.7;
}

.control-button {
  font-size: 0.9rem;       /* ⚠️ Hardcoded */
  font-weight: 500;
}

/* AFTER (CSS Variables) */
.matrix-header {
  font-size: var(--text-sm);      /* Responsive 0.9rem → 1rem */
  font-weight: var(--font-medium); /* 500 */
}

.matrix-output {
  font-size: var(--text-base);    /* Responsive 1.05rem → 1.15rem */
  line-height: var(--leading-relaxed); /* 1.75 */
}

.control-button {
  font-size: var(--text-sm);      /* Responsive */
  font-weight: var(--font-medium); /* 500 */
}
```

**Key points:**
- Replace all hardcoded rem values with CSS variables
- Use semantic variable names (--text-sm, --text-base)
- Maintain existing layout (no visual regressions)
- Test reflection output page after changes

---

## Spacing Consistency Pattern

### 1. Extend Tailwind Config with CSS Variables

**When to use:** Mapping Tailwind spacing classes to responsive CSS variables

**Code example:**
```typescript
/* tailwind.config.ts */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Map CSS spacing variables to Tailwind classes
      spacing: {
        'xs': 'var(--space-xs)',   // clamp(0.5rem, 1vw, 0.75rem) = 8-12px
        'sm': 'var(--space-sm)',   // clamp(0.75rem, 1.5vw, 1rem) = 12-16px
        'md': 'var(--space-md)',   // clamp(1rem, 2.5vw, 1.5rem) = 16-24px
        'lg': 'var(--space-lg)',   // clamp(1.5rem, 3vw, 2rem) = 24-32px
        'xl': 'var(--space-xl)',   // clamp(2rem, 4vw, 3rem) = 32-48px
        '2xl': 'var(--space-2xl)', // clamp(3rem, 6vw, 4rem) = 48-64px
        '3xl': 'var(--space-3xl)', // clamp(4rem, 8vw, 6rem) = 64-96px
      },
      colors: {
        // Existing colors remain unchanged
        'mirror-purple': '#9333ea',
        'mirror-indigo': '#6366f1',
        'mirror-violet': '#8b5cf6',
      },
    },
  },
  plugins: [],
};

export default config;
```

**Key points:**
- Add spacing mapping under theme.extend
- Preserve existing Tailwind spacing (1, 2, 3, 4, etc.) for legacy use
- New spacing classes (xs, sm, md, lg, xl) reference CSS variables
- Responsive by default (clamp values scale automatically)

---

### 2. Replace Hardcoded Spacing in Mirror.css

**When to use:** Refactoring reflection output styling to use responsive spacing

**Code example:**
```css
/* styles/mirror.css */

/* BEFORE (Hardcoded rems) */
.square-mirror-container {
  padding: 2rem;                    /* ⚠️ Hardcoded */
}

.mirror-content {
  gap: 3rem;                        /* ⚠️ Hardcoded */
}

.square-mirror-frame {
  width: clamp(400px, 60vw, 700px);  /* ✅ Already responsive */
  padding: 2.5rem;                   /* ⚠️ Hardcoded */
}

.square-mirror-surface {
  padding: 2rem;                     /* ⚠️ Hardcoded */
}

.mirror-controls {
  gap: 1.5rem;                       /* ⚠️ Hardcoded */
}

/* AFTER (CSS Variables) */
.square-mirror-container {
  padding: var(--space-lg);         /* Responsive 24-32px */
}

.mirror-content {
  gap: var(--space-2xl);            /* Responsive 48-64px */
}

.square-mirror-frame {
  width: clamp(400px, 60vw, 700px);  /* No change */
  padding: var(--space-xl);          /* Responsive 32-48px */
}

.square-mirror-surface {
  padding: var(--space-lg);          /* Responsive 24-32px */
}

.mirror-controls {
  gap: var(--space-lg);              /* Responsive 24-32px */
}
```

**Key points:**
- Replace hardcoded 2rem → var(--space-lg)
- Replace hardcoded 3rem → var(--space-2xl)
- Choose variable that matches intended size
- Test reflection output page thoroughly

---

### 3. Update Page Spacing (Tailwind Classes)

**When to use:** Migrating from hardcoded Tailwind spacing to CSS variable classes

**Code example:**
```tsx
/* app/dreams/page.tsx */

// BEFORE (Hardcoded Tailwind)
<div className="max-w-7xl mx-auto">
  <GlassCard elevated className="mb-6">        {/* mb-6 = 24px */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <GradientText className="text-h1 mb-2">  {/* mb-2 = 8px */}
          Your Dreams
        </GradientText>
      </div>
    </div>
  </GlassCard>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {/* Dream cards */}
  </div>
</div>

// AFTER (CSS Variable Classes)
<div className="max-w-7xl mx-auto">
  <GlassCard elevated className="mb-lg">       {/* mb-lg = 24-32px responsive */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
      <div>
        <GradientText className="text-h1 mb-xs">  {/* mb-xs = 8-12px responsive */}
          Your Dreams
        </GradientText>
      </div>
    </div>
  </GlassCard>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md lg:gap-lg">
    {/* Dream cards */}
  </div>
</div>
```

**Key points:**
- Replace mb-6 → mb-lg (24-32px responsive)
- Replace gap-4 → gap-md (16-24px responsive)
- Remove responsive breakpoints for spacing (sm:gap-6) - handled by clamp()
- Keep layout breakpoints (sm:flex-row, lg:grid-cols-3)

---

### 4. Standardize Card Padding

**When to use:** Ensuring all cards use consistent padding (32-48px responsive)

**Code example:**
```css
/* styles/dashboard.css */

/* BEFORE (Inconsistent) */
.dashboard-card {
  padding: 2rem;  /* 32px fixed */
}

.dreams-card {
  padding: var(--space-xl);  /* 32-48px responsive - CORRECT */
}

.usage-card {
  padding: 1.5rem;  /* 24px fixed - TOO SMALL */
}

/* AFTER (Standardized) */
.dashboard-card {
  padding: var(--space-xl);  /* 32-48px responsive */
}

.dreams-card {
  padding: var(--space-xl);  /* No change - already correct */
}

.usage-card {
  padding: var(--space-xl);  /* Increased to standard */
}
```

**Key points:**
- All cards use var(--space-xl) for padding (32-48px responsive)
- Consistent visual rhythm across dashboard
- Scales appropriately on mobile (smaller padding on small screens)

---

## Loading State Pattern

### 1. Basic tRPC Query with CosmicLoader

**When to use:** Adding loading feedback to any tRPC query

**Code example:**
```tsx
/* app/dreams/page.tsx */

'use client';

import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { trpc } from '@/lib/trpc/client';

export default function DreamsPage() {
  // Extract isLoading from tRPC query
  const { data: dreamsData, isLoading } = trpc.dreams.list.useQuery();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-md">
        <CosmicLoader size="lg" label="Loading your dreams" />
        <p className="text-white/60 text-small">Loading your dreams...</p>
      </div>
    );
  }

  // Render data
  return (
    <div>
      {/* Dreams content */}
    </div>
  );
}
```

**Key points:**
- Extract `isLoading` from tRPC query
- Show CosmicLoader during loading
- Add descriptive text below loader
- Use semantic spacing (gap-md)
- Full-height container (min-h-screen) for page-level loading

---

### 2. Multiple Queries with Combined Loading State

**When to use:** Pages with multiple tRPC queries that should show single loading state

**Code example:**
```tsx
/* app/evolution/page.tsx */

'use client';

import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { trpc } from '@/lib/trpc/client';

export default function EvolutionPage() {
  // Multiple tRPC queries
  const { data: dreamsData, isLoading: dreamsLoading } = trpc.dreams.list.useQuery();
  const { data: reportsData, isLoading: reportsLoading } = trpc.evolution.list.useQuery();
  const { data: eligibility, isLoading: eligibilityLoading } = trpc.evolution.checkEligibility.useQuery();

  // Combine loading states
  const isLoading = dreamsLoading || reportsLoading || eligibilityLoading;

  // Show loading state if ANY query is loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-md">
        <CosmicLoader size="lg" label="Loading your evolution reports" />
        <p className="text-white/60 text-small">Loading your evolution reports...</p>
      </div>
    );
  }

  // All data loaded
  return (
    <div>
      {/* Evolution content */}
    </div>
  );
}
```

**Key points:**
- Extract isLoading from ALL queries
- Combine with OR operator (dreamsLoading || reportsLoading || ...)
- Show single loading state for better UX
- Descriptive text matches page context

---

### 3. Loading State with 300ms Minimum Display Time

**When to use:** Preventing flash on fast networks (advanced pattern)

**Code example:**
```tsx
/* app/visualizations/page.tsx */

'use client';

import { useState, useEffect } from 'react';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { trpc } from '@/lib/trpc/client';

export default function VisualizationsPage() {
  const { data: visualizationsData, isLoading } = trpc.visualizations.list.useQuery();
  const [showLoading, setShowLoading] = useState(false);

  // Minimum display time: 300ms
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      // Show loading immediately
      setShowLoading(true);
    } else if (showLoading) {
      // Keep loading visible for at least 300ms after data arrives
      timer = setTimeout(() => {
        setShowLoading(false);
      }, 300);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, showLoading]);

  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-md">
        <CosmicLoader size="lg" label="Loading visualizations" />
        <p className="text-white/60 text-small">Loading visualizations...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Visualizations content */}
    </div>
  );
}
```

**Key points:**
- Use local state (showLoading) separate from query isLoading
- Show loading immediately when query starts
- Keep loading visible for minimum 300ms after data arrives
- Prevents jarring flash on fast networks
- Clean up timer in useEffect return

---

### 4. Replace Custom Spinner with CosmicLoader

**When to use:** Migrating dashboard cards from custom spinners to CosmicLoader

**Code example:**
```tsx
/* components/dashboard/cards/DreamsCard.tsx */

// BEFORE (Custom Spinner)
{isLoading ? (
  <div className="flex items-center justify-center py-8">
    <div className="cosmic-spinner"></div>  {/* Custom CSS spinner */}
    <span className="text-white/60 text-sm ml-3">Loading your dreams...</span>
  </div>
) : (
  /* Dreams content */
)}

// AFTER (CosmicLoader)
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

{isLoading ? (
  <div className="flex flex-col items-center justify-center py-xl gap-md">
    <CosmicLoader size="md" label="Loading dreams" />
    <p className="text-white/60 text-small">Loading your dreams...</p>
  </div>
) : (
  /* Dreams content */
)}
```

**Key points:**
- Import CosmicLoader component
- Replace custom .cosmic-spinner with <CosmicLoader />
- Use size="md" for card-level loading (not full page)
- Maintain descriptive text
- Update layout to flex-col for vertical stacking

**Remove from CSS:**
```css
/* Remove this from dashboard.css or card-specific styles */
.cosmic-spinner {
  /* DELETE - no longer needed */
}
```

---

## Empty State Enhancement Pattern

### 1. Basic EmptyState with Personality

**When to use:** Replacing generic "No data" messages with encouraging copy

**Code example:**
```tsx
/* app/dreams/page.tsx */

import { EmptyState } from '@/components/shared/EmptyState';

// BEFORE (Generic)
<EmptyState
  icon=""                    {/* No emoji */}
  title="No dreams yet"      {/* Negative framing */}
  description="Create your first dream to start reflecting and growing."
  ctaLabel="Create Your First Dream"
  ctaAction={() => setIsCreateModalOpen(true)}
/>

// AFTER (Personality)
<EmptyState
  icon="✨"                   {/* Visual personality */}
  title="Your Dream Journey Awaits"  {/* Inviting, positive */}
  description="Every great journey begins with a single dream. What will yours be?"  {/* Inspiring */}
  ctaLabel="Create My First Dream"  {/* Personal ownership */}
  ctaAction={() => setIsCreateModalOpen(true)}
/>
```

**Key points:**
- Add emoji to icon prop (visual personality)
- Reframe title positively ("Awaits" not "No X yet")
- Make description inspiring (not just functional)
- Personalize CTA ("My First Dream" not "Your First Dream")

---

### 2. Context-Specific Empty States

**When to use:** Tailoring empty state messaging to page purpose

**Code example:**
```tsx
/* app/evolution/page.tsx */

// Evolution page: Explain data requirement
<EmptyState
  icon="🌱"
  title="Your Growth Story Awaits"
  description="With 12+ reflections, we can reveal the patterns in your transformation. Keep reflecting!"
  ctaLabel="Reflect Now"
  ctaAction={() => router.push('/reflection')}
/>

/* app/visualizations/page.tsx */

// Visualizations page: Emphasize experiential benefit
<EmptyState
  icon="🌌"
  title="See Your Dreams Come Alive"
  description="Visualizations paint your future as if it's already here. Ready to glimpse your destiny?"
  ctaLabel="Create First Visualization"
  ctaAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
/>
```

**Key points:**
- Match icon to page theme (🌱 growth, 🌌 cosmic)
- Explain requirements if applicable (12+ reflections)
- CTAs align with page purpose (Reflect Now vs Create Visualization)
- Descriptions inspire action, not just inform

---

### 3. EmptyState Component Structure (No Changes Needed)

**When to use:** Understanding existing EmptyState implementation

**Code example:**
```tsx
/* components/shared/EmptyState.tsx */

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GradientText } from '@/components/ui/GradientText';

export interface EmptyStateProps {
  icon: string;          // Emoji or icon character
  title: string;         // Headline
  description: string;   // Supporting text
  ctaLabel?: string;     // Optional CTA button text
  ctaAction?: () => void; // Optional CTA handler
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaAction
}: EmptyStateProps) {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <GlassCard elevated className="text-center max-w-md">
        {/* Large emoji icon */}
        <div className="text-6xl mb-md">{icon}</div>

        {/* Gradient headline */}
        <GradientText gradient="cosmic" className="text-h2 mb-md">
          {title}
        </GradientText>

        {/* Description text */}
        <p className="text-body text-white/60 mb-lg leading-relaxed">
          {description}
        </p>

        {/* Optional CTA button */}
        {ctaLabel && ctaAction && (
          <GlowButton
            variant="primary"
            size="lg"
            onClick={ctaAction}
            className="w-full"
          >
            {ctaLabel}
          </GlowButton>
        )}
      </GlassCard>
    </div>
  );
}
```

**Key points:**
- Component unchanged (only usage updated)
- Uses new typography utilities (text-h2, text-body)
- Uses new spacing utilities (mb-md, mb-lg)
- GlassCard provides cosmic aesthetic
- GlowButton provides interactive CTA

---

## Dashboard Enhancement Pattern

### 1. Enhanced WelcomeSection with Personalization

**When to use:** Upgrading dashboard welcome to feel more personal

**Code example:**
```tsx
/* components/dashboard/shared/WelcomeSection.tsx */

'use client';

import styles from './WelcomeSection.module.css';

interface WelcomeSectionProps {
  user: { name?: string | null };
  className?: string;
}

// Time-based greeting helper
const getGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good evening';
};

export function WelcomeSection({ user, className = '' }: WelcomeSectionProps) {
  // Extract first name from full name
  const firstName = user?.name?.split(' ')[0] || user?.name || 'there';

  // Get time-based greeting
  const greeting = getGreeting();

  return (
    <section className={`${styles.welcomeSection} ${className}`}>
      <div className={styles.welcomeContent}>
        {/* Personalized greeting */}
        <h1 className={styles.welcomeTitle}>
          {greeting}, {firstName}
        </h1>

        {/* Optional: Add subtitle for extra personality */}
        {/* <p className={styles.welcomeSubtitle}>
          Ready to reflect on your dreams?
        </p> */}
      </div>
    </section>
  );
}
```

**CSS (WelcomeSection.module.css):**
```css
.welcomeSection {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-md));
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
}

.welcomeContent {
  text-align: center;
}

.welcomeTitle {
  font-size: var(--text-3xl);  /* Responsive 1.8rem → 2.5rem */
  font-weight: var(--font-light);
  color: var(--cosmic-text);
  margin: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .welcomeSection {
    padding: var(--space-lg);  /* Reduces to 24-32px */
  }

  .welcomeTitle {
    font-size: var(--text-2xl);  /* Smaller on mobile */
  }
}

@media (max-width: 480px) {
  .welcomeSection {
    padding: var(--space-md);  /* Further reduces to 16-24px */
  }

  .welcomeTitle {
    font-size: var(--text-xl);  /* Even smaller on tiny screens */
  }
}
```

**Key points:**
- getGreeting() function handles time-based logic
- Extract first name from full name
- CSS uses responsive variables (--space-xl, --text-3xl)
- Mobile breakpoints adjust padding and font size
- Optional subtitle for extra personality (commented out - add if desired)

---

### 2. Enhanced "Reflect Now" CTA

**When to use:** Making dashboard CTA the visual hero element

**Code example:**
```tsx
/* app/dashboard/page.tsx */

import { GlowButton } from '@/components/ui/glass/GlowButton';

// BEFORE (Generic purple button)
<button
  onClick={handleReflectNow}
  className="
    px-8 py-4
    text-xl font-medium
    bg-purple-600
    text-white
    rounded-lg
    transition-opacity duration-200
    hover:opacity-90
    active:opacity-85
    disabled:opacity-50 disabled:cursor-not-allowed
    w-full sm:w-auto
    min-w-[280px]
  "
>
  Reflect Now
</button>

// AFTER (Hero CTA with cosmic variant)
<GlowButton
  variant="cosmic"
  size="lg"
  onClick={handleReflectNow}
  className="w-full sm:w-auto min-w-[280px] mb-xl"
>
  ✨ Reflect Now
</GlowButton>
```

**Key points:**
- Use GlowButton component with "cosmic" variant
- Cosmic variant has gradient glow, lift on hover, shimmer effect
- Add emoji (✨) for visual accent
- Maintain responsive sizing (w-full sm:w-auto)
- Add bottom margin (mb-xl) for visual separation from cards

**Cosmic Variant Styling (from GlowButton.tsx):**
```css
/* Already implemented in GlowButton component */
cosmic: cn(
  'bg-gradient-to-br from-purple-500/15 via-indigo-500/12 to-purple-500/15',
  'border border-purple-500/30',
  'text-purple-200',
  'backdrop-blur-md',
  'hover:from-purple-500/22 hover:via-indigo-500/18 hover:to-purple-500/22',
  'hover:border-purple-500/45',
  'hover:-translate-y-0.5',  /* Lift effect */
  'hover:shadow-[0_12px_35px_rgba(147,51,234,0.2)]',  /* Glow */
  /* Shimmer effect on hover */
  'before:absolute before:inset-0',
  'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
  'before:-translate-x-full before:transition-transform',
  'hover:before:translate-x-full',
  'overflow-hidden',
  '[&:hover::before]:duration-500'
)
```

---

### 3. Enhanced Dashboard Card Hover States

**When to use:** Adding polish to dashboard card interactions

**Code example:**
```css
/* styles/dashboard.css */

/* BEFORE (Basic hover) */
.dashboard-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dashboard-card--hovered {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.3);
}

/* AFTER (Enhanced hover) */
.dashboard-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.dashboard-card--hovered {
  transform: translateY(-4px) scale(1.01);  /* Lift + subtle grow */
  box-shadow: 0 20px 64px rgba(139, 92, 246, 0.4);  /* Larger glow */
  border-color: rgba(139, 92, 246, 0.3);  /* Purple border on hover */
  backdrop-filter: blur(50px) saturate(140%);  /* Intensify glass effect */
}
```

**Key points:**
- Add subtle scale (1.01) for "breathing" effect
- Increase shadow on hover (larger glow)
- Change border color to purple (visual feedback)
- Intensify backdrop-filter (glass effect enhancement)
- All GPU-accelerated (transform, opacity, filter)

---

## Import Order Convention

**Standard Import Order:**

```tsx
/* Example: app/dreams/page.tsx */

// 1. React/Next.js core
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { motion } from 'framer-motion';

// 3. Internal utilities
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';

// 4. Components (UI library first, then shared, then page-specific)
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { DreamCard } from '@/components/dreams/DreamCard';

// 5. Types
import type { Dream } from '@/types/schemas';

// 6. Styles (if any)
import styles from './page.module.css';
```

**Key points:**
- Group imports by type (React, external, internal, components, types, styles)
- Use path aliases (@/ for src root)
- UI library components before shared components
- Types imported separately with `type` keyword

---

## Code Quality Standards

### 1. TypeScript Strict Mode
- All components use TypeScript
- Define interfaces for all props
- Use type imports (`import type { ... }`)
- No `any` types (use `unknown` if truly unknown)

### 2. Component Structure
- Functional components with hooks
- Export named functions (not default)
- Props interface defined above component
- Helper functions defined outside component (or in utils)

### 3. Accessibility
- All buttons have proper type attribute
- All images have alt text
- All form inputs have labels
- All interactive elements have focus states
- Loading states use role="status" and aria-label

### 4. Performance
- Use CSS variables for all themeable values
- GPU-accelerated animations only (transform, opacity)
- Debounce user input handlers
- Memoize expensive computations
- Lazy load heavy components

---

## Testing Pattern

### Manual QA Checklist

**Typography Testing:**
- [ ] All headings use .text-h1, .text-h2, .text-h3
- [ ] All body text uses .text-body or .text-small
- [ ] No text smaller than 0.85rem (13.6px)
- [ ] Font weights correct (600 for headings, 400 for body)
- [ ] Line heights comfortable (1.75 for body)
- [ ] Mobile typography readable at 320px width

**Spacing Testing:**
- [ ] All cards use var(--space-xl) padding (32-48px)
- [ ] Section spacing consistent (var(--space-8) or var(--space-12))
- [ ] Element gaps use responsive variables (gap-md, gap-lg)
- [ ] Mobile layouts not cramped (test at 320px, 768px)
- [ ] No horizontal scroll on mobile

**Loading State Testing:**
- [ ] All tRPC queries show CosmicLoader when loading
- [ ] Loading text is descriptive and contextual
- [ ] No custom spinners remain (all replaced with CosmicLoader)
- [ ] 300ms minimum display time prevents flash
- [ ] Test on 3G throttle (slow network scenario)

**Empty State Testing:**
- [ ] All empty states have emojis
- [ ] Headlines are encouraging (not negative)
- [ ] Descriptions are inspiring
- [ ] CTAs are personalized
- [ ] Test personality level (8/10 target)

**Dashboard Testing:**
- [ ] WelcomeSection shows personalized greeting
- [ ] Time-based greeting works (morning/afternoon/evening)
- [ ] "Reflect Now" CTA is visually dominant
- [ ] Dashboard cards have enhanced hover states
- [ ] Stagger animations are smooth (150ms delays)

**Cross-Browser Testing:**
- [ ] Chrome (latest) - Primary browser
- [ ] Safari (latest + iOS 14+) - Critical for backdrop-filter
- [ ] Firefox (latest) - Secondary browser
- [ ] Mobile Safari (iPhone SE, iPhone 12) - Mobile testing

**Lighthouse Audit:**
- [ ] Performance score: 90+ (no regression)
- [ ] Accessibility score: 95+ (improved)
- [ ] Best Practices score: 90+
- [ ] SEO score: 90+

---

*These patterns provide copy-pasteable code examples for all iteration 4 work. Follow them exactly to ensure consistency and quality.*
