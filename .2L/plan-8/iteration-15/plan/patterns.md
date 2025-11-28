# Code Patterns & Conventions

## File Structure

```
mirror-of-dreams/
├── app/                          # Next.js App Router pages
│   ├── dashboard/
│   │   └── page.tsx             # Dashboard assembly
│   ├── dreams/
│   │   ├── page.tsx             # Dreams list
│   │   └── [id]/page.tsx        # Dream detail
│   ├── reflection/
│   │   └── page.tsx             # Reflection creation
│   ├── reflections/
│   │   ├── page.tsx             # Reflections list
│   │   └── [id]/page.tsx        # Reflection detail
│   ├── evolution/
│   │   ├── page.tsx             # Evolution reports list
│   │   └── [id]/page.tsx        # Evolution report detail
│   └── visualizations/
│       ├── page.tsx             # Visualizations list
│       └── [id]/page.tsx        # Visualization detail
├── components/
│   ├── shared/
│   │   ├── AppNavigation.tsx    # Main nav with height measurement
│   │   └── DemoBanner.tsx       # Demo user banner
│   ├── dashboard/
│   │   ├── shared/
│   │   │   ├── DashboardCard.tsx
│   │   │   └── DashboardGrid.tsx
│   │   └── cards/               # Individual dashboard cards
│   └── reflection/
│       └── MirrorExperience.tsx # Reflection form
├── hooks/
│   └── useStaggerAnimation.ts   # Stagger animation logic
├── scripts/
│   ├── seed-demo-user.ts        # Demo user data generation
│   └── verify-demo.ts           # Demo data verification
├── src/styles/
│   ├── variables.css            # CSS custom properties
│   ├── globals.css              # Global styles & utilities
│   └── dashboard.css            # Dashboard-specific styles
├── supabase/
│   └── migrations/              # Database schema
└── server/
    └── trpc/
        └── routers/             # API endpoints (not used in seed script)
```

## Naming Conventions

- **Components:** PascalCase (`DashboardCard.tsx`, `MirrorExperience.tsx`)
- **Files:** camelCase (`useStaggerAnimation.ts`, `seed-demo-user.ts`)
- **CSS Modules:** ComponentName.module.css (`DashboardGrid.module.css`)
- **Types:** PascalCase (`DreamData`, `ReflectionTemplate`)
- **Functions:** camelCase (`generateAIResponse()`, `getItemStyles()`)
- **Constants:** SCREAMING_SNAKE_CASE (`DEMO_DREAMS`, `REFLECTION_TEMPLATES`)
- **CSS Variables:** kebab-case with prefix (`--nav-height`, `--demo-banner-height`)
- **CSS Classes:** kebab-case (`.pt-nav`, `.dashboard-grid__item`)

## CSS Variable Patterns

### Defining CSS Variables

**File:** `src/styles/variables.css`

```css
/* Navigation & Header Heights */
--nav-height: clamp(60px, 8vh, 80px);     /* Fallback value, JS overrides */
--demo-banner-height: 44px;                /* Static banner height */
--total-header-height: calc(var(--nav-height) + var(--demo-banner-height));

/* Z-Index Layers */
--z-background: 0;
--z-content: 10;
--z-navigation: 100;
--z-demo-banner: 110;                      /* Above navigation */
--z-modal: 1000;
--z-tooltip: 2000;

/* Spacing */
--space-xs: 0.5rem;
--space-sm: 0.75rem;
--space-md: 1rem;
--space-lg: 1.5rem;
--space-xl: 2rem;
```

**Key points:**
- Group related variables together
- Use CSS calc() for computed values
- Provide fallback values before JavaScript measurement
- Z-index hierarchy documented inline

### Dynamic CSS Variable Measurement

**Pattern:** Measure DOM element and set CSS variable

**File:** `components/shared/AppNavigation.tsx`

```typescript
useEffect(() => {
  const measureNavHeight = () => {
    const nav = document.querySelector('[data-nav-container]');
    if (nav) {
      const height = nav.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    }
  };

  // Measure on mount
  measureNavHeight();

  // Re-measure on resize (debounced)
  let resizeTimer: NodeJS.Timeout;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measureNavHeight, 150);
  };

  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(resizeTimer);
  };
}, [showMobileMenu]); // Re-measure when dependencies change
```

**Key points:**
- Use data attributes for querySelector targeting
- Debounce resize events (150ms standard)
- Clean up listeners in return function
- Re-measure when relevant state changes

### Consuming CSS Variables

**Utility Class Pattern (Preferred):**

**File:** `styles/globals.css`

```css
.pt-nav {
  padding-top: calc(var(--nav-height) + var(--demo-banner-height, 0px));
}
```

**Usage in components:**

```tsx
<div className="pt-nav px-4 sm:px-8 pb-8">
  {/* Content automatically positioned below nav + banner */}
</div>
```

**Inline Style Pattern (When Dynamic):**

```tsx
<GlassCard
  className="fixed top-0 left-0 right-0 z-[100]"
  style={{ top: user?.isDemo ? 'var(--demo-banner-height, 0px)' : '0' }}
>
  {/* Navigation positioned below banner if demo user */}
</GlassCard>
```

**Key points:**
- Prefer utility classes for shared patterns
- Use inline styles when conditional logic needed
- Always provide fallback values: `var(--demo-banner-height, 0px)`
- Fallback ensures non-demo users don't get extra padding

## Animation Patterns

### Stagger Animation Hook

**Pattern:** Animate list items with sequential delays

**File:** `hooks/useStaggerAnimation.ts`

**Core implementation:**

```typescript
export function useStaggerAnimation(
  itemCount: number,
  options: {
    delay?: number;        // Delay between items (default: 100ms)
    duration?: number;     // Animation duration (default: 600ms)
    triggerOnce?: boolean; // Animate only once (default: true)
  } = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const { delay = 100, duration = 600, triggerOnce = true } = options;

  useEffect(() => {
    // Fallback: Force visibility after 2 seconds if IntersectionObserver fails
    const fallbackTimer = setTimeout(() => {
      if (!isVisible && !hasAnimated) {
        console.warn('[useStaggerAnimation] Fallback triggered - forcing visibility');
        setIsVisible(true);
        if (triggerOnce) {
          setHasAnimated(true);
        }
      }
    }, 2000);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            clearTimeout(fallbackTimer);
            setIsVisible(true);
            if (triggerOnce && !hasAnimated) {
              setHasAnimated(true);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.01,      // Trigger at 1% visible
        rootMargin: '100px',  // Start 100px before viewport
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      clearTimeout(fallbackTimer);
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [triggerOnce, hasAnimated]);

  const getItemStyles = (index: number) => {
    const shouldAnimate = triggerOnce ? hasAnimated : isVisible;

    return {
      opacity: shouldAnimate ? 1 : 0,
      transform: shouldAnimate ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity ${duration}ms ease-out ${index * delay}ms,
                   transform ${duration}ms ease-out ${index * delay}ms`,
    };
  };

  return { containerRef, getItemStyles };
}
```

**Usage in pages:**

```tsx
function DashboardPage() {
  const { containerRef, getItemStyles } = useStaggerAnimation(7, {
    delay: 150,
    duration: 800,
    triggerOnce: true,
  });

  return (
    <div ref={containerRef}>
      <div style={getItemStyles(0)}>
        <DashboardHero />
      </div>
      <div style={getItemStyles(1)}>
        <DreamsCard />
      </div>
      {/* ... more items */}
    </div>
  );
}
```

**Key points:**
- 2-second fallback ensures content always becomes visible
- Lower threshold (0.01) triggers animation almost immediately
- Larger rootMargin (100px) starts animation before viewport
- Inline styles override any CSS animations (this is intentional)
- Each item gets progressively longer delay (index * delay)

### DO NOT: Multiple Animation Systems

**Anti-pattern:**

```tsx
// BAD: Component has its own animation that conflicts with parent
function DashboardCard({ animated, animationDelay }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (animated) {
      setTimeout(() => setIsVisible(true), animationDelay);
    }
  }, [animated, animationDelay]);

  // This conflicts with parent's useStaggerAnimation!
  return (
    <div className={isVisible ? 'dashboard-card--visible' : ''}>
      {children}
    </div>
  );
}
```

**GOOD: Let parent handle animation:**

```tsx
// GOOD: Component is stateless, parent controls animation
function DashboardCard({ children }) {
  return (
    <div className="dashboard-card">
      {children}
    </div>
  );
}

// Parent applies animation styles
<div style={getItemStyles(0)}>
  <DashboardCard>Content</DashboardCard>
</div>
```

## Database Patterns

### Direct Database Insert (Seed Scripts)

**Pattern:** Bypass API layer, write directly to database

**File:** `scripts/seed-demo-user.ts`

**Evolution report insert:**

```typescript
async function createEvolutionReport(
  demoUser: { id: string },
  dream: { id: string; title: string },
  reflections: Array<{ id: string; created_at: string; dream: string; plan: string; relationship: string; offering: string }>
) {
  // Generate evolution analysis using Claude
  const evolutionText = await generateEvolutionReport(dream, reflections);

  // Calculate time period from reflection timestamps
  const timestamps = reflections.map(r => new Date(r.created_at).getTime());
  const time_period_start = new Date(Math.min(...timestamps)).toISOString();
  const time_period_end = new Date(Math.max(...timestamps)).toISOString();

  // Insert directly into database
  const { data, error } = await supabase
    .from('evolution_reports')
    .insert({
      user_id: demoUser.id,
      dream_id: dream.id,

      // CRITICAL: Use 'analysis', NOT 'evolution' (migration column name)
      analysis: evolutionText,

      // Required metadata
      report_type: 'premium',
      report_category: 'dream-specific',
      reflections_analyzed: reflections.map(r => r.id),
      reflection_count: reflections.length,

      // Timestamps
      time_period_start,
      time_period_end,

      // Optional metadata
      patterns_detected: ['fear-to-confidence', 'scope-management', 'technical-growth'],
      growth_score: 78,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating evolution report:', error);
    throw error;
  }

  console.log(`✅ Created evolution report for dream: ${dream.title}`);
  return data;
}
```

**Visualization insert:**

```typescript
async function createVisualization(
  demoUser: { id: string },
  dream: { id: string; title: string },
  reflections: Array<{ id: string; created_at: string; dream: string; plan: string; relationship: string; offering: string }>
) {
  // Generate visualization narrative using Claude
  const narrativeText = await generateVisualization(dream, reflections, 'achievement');

  const { data, error } = await supabase
    .from('visualizations')
    .insert({
      user_id: demoUser.id,
      dream_id: dream.id,

      // Required fields
      style: 'achievement',  // or 'spiral', 'synthesis'
      narrative: narrativeText,

      // Metadata
      reflections_analyzed: reflections.map(r => r.id),
      reflection_count: reflections.length,

      // Optional (future use)
      artifact_url: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating visualization:', error);
    throw error;
  }

  console.log(`✅ Created visualization for dream: ${dream.title}`);
  return data;
}
```

**Key points:**
- Use `analysis` column for evolution reports (NOT `evolution`)
- Calculate time_period_start/end from reflection timestamps
- UUID arrays map directly: `reflections.map(r => r.id)`
- Always use .select().single() to get created record back
- Console.log progress for visibility during seed execution

### AI Content Generation (Seed Scripts)

**Pattern:** Generate high-quality content using Claude with extended thinking

**File:** `scripts/seed-demo-user.ts`

```typescript
async function generateEvolutionReport(
  dream: { title: string; description: string },
  reflections: Array<{ dream: string; plan: string; relationship: string; offering: string; created_at: string }>
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build context from reflections
  const reflectionContext = reflections.map((r, i) => `
    Reflection ${i + 1} (${formatDate(r.created_at)}):
    Q: What's going on with this dream?
    A: ${r.dream}

    Q: What's your plan moving forward?
    A: ${r.plan}

    Q: How does this dream relate to your life?
    A: ${r.relationship}

    Q: What is this dream offering you?
    A: ${r.offering}
  `).join('\n\n---\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    temperature: 1,
    max_tokens: 4000,
    thinking: {
      type: 'enabled',
      budget_tokens: 5000,
    },
    messages: [
      {
        role: 'user',
        content: `You are analyzing a user's journey with their dream: "${dream.title}"

Dream Description: ${dream.description}

The user has created ${reflections.length} reflections over time. Analyze their evolution:

${reflectionContext}

Generate a comprehensive evolution report (800-1200 words) that:
1. Identifies the transformation arc (how their thinking/feeling evolved)
2. Quotes specific phrases from reflections to illustrate patterns
3. Highlights growth moments and challenges overcome
4. Provides insight into what this journey reveals about the user
5. Uses warm, encouraging tone - like a wise mentor reflecting back their growth

Focus on TEMPORAL EVOLUTION - how did they change from first to last reflection?`,
      },
    ],
  });

  // Extract text content from response
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  return textContent.text;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (daysAgo === 0) return 'today';
  if (daysAgo === 1) return 'yesterday';
  return `${daysAgo} days ago`;
}
```

```typescript
async function generateVisualization(
  dream: { title: string; description: string },
  reflections: Array<{ dream: string; plan: string; relationship: string; offering: string }>,
  style: 'achievement' | 'spiral' | 'synthesis'
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const reflectionSummaries = reflections.map((r, i) => `
    Reflection ${i + 1}: ${r.dream.slice(0, 200)}...
  `).join('\n');

  const stylePrompts = {
    achievement: 'Use a mountain climbing metaphor - the journey from base camp to summit, showing linear progress with challenges overcome.',
    spiral: 'Use a spiral staircase metaphor - circular patterns of growth, returning to themes at deeper levels.',
    synthesis: 'Use a weaving metaphor - different threads coming together to create a cohesive whole.',
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    temperature: 1,
    max_tokens: 3000,
    thinking: {
      type: 'enabled',
      budget_tokens: 5000,
    },
    messages: [
      {
        role: 'user',
        content: `Create a visualization narrative for the dream: "${dream.title}"

Dream: ${dream.description}

Reflections summary:
${reflectionSummaries}

Style: ${style}
${stylePrompts[style]}

Generate a poetic, evocative narrative (400-600 words) that:
1. Uses the specified metaphor consistently throughout
2. Paints a visual picture of their journey
3. Captures emotional shifts and key moments
4. Feels inspiring and affirming
5. Helps them SEE their progress in a new way

This is not analysis - it's a creative visualization of their journey.`,
      },
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  return textContent.text;
}
```

**Key points:**
- Use extended thinking (5000 token budget) for deeper analysis
- Temperature 1 for creative, varied output
- Build detailed context from all reflections
- Clear prompts with specific word counts and requirements
- Error handling for missing text content
- Console output for debugging

## Grid Layout Patterns

### Flexible Grid Layout

**Pattern:** Responsive grid that adapts to content count

**File:** `components/dashboard/shared/DashboardGrid.module.css`

```css
.dashboardGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);  /* 2 columns on desktop */
  grid-template-rows: repeat(3, auto);     /* 3 flexible rows = 6 slots */
  gap: var(--space-xl);
  min-height: 600px;
  animation: gridEntrance 0.6s ease-out;
}

/* Mobile: Single column */
@media (max-width: 768px) {
  .dashboardGrid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;  /* Unlimited rows */
  }
}

/* Tablet: Single column */
@media (min-width: 769px) and (max-width: 1024px) {
  .dashboardGrid {
    grid-template-columns: 1fr;
  }
}

/* Desktop: 2 columns, 3 rows */
@media (min-width: 1025px) {
  .dashboardGrid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, auto);
  }
}
```

**Key points:**
- Use `auto` for flexible row heights (not fixed `1fr`)
- Mobile-first responsive breakpoints
- Gap using CSS variables for consistency
- Grid entrance animation for polish

## Page Layout Patterns

### Authenticated Page Layout

**Pattern:** Consistent padding accounting for navigation AND demo banner

**Standard pattern (10 pages):**

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-4 sm:px-8 pb-8">
      {/* Content here */}
    </div>
  );
}
```

**Key points:**
- Always use `.pt-nav` utility class for top padding
- This automatically accounts for both navigation AND demo banner
- Consistent px (horizontal) and pb (bottom) padding
- Background gradients for cosmic atmosphere

### Conditional Demo Banner Positioning

**Pattern:** Navigation positioned below demo banner when present

**File:** `components/shared/AppNavigation.tsx`

```tsx
<>
  {/* Demo Banner - appears only for demo users */}
  <DemoBanner />

  <GlassCard
    elevated
    data-nav-container
    className="fixed top-0 left-0 right-0 z-[100] rounded-none border-b border-white/10"
    style={{ top: user?.isDemo ? 'var(--demo-banner-height, 0px)' : '0' }}
  >
    {/* Navigation content */}
  </GlassCard>
</>
```

**Demo banner component:**

```tsx
// File: components/shared/DemoBanner.tsx
export default function DemoBanner() {
  const { user } = useUser();

  if (!user?.isDemo) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b border-amber-500/30 px-4 sm:px-6 py-3 z-[110]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Banner content */}
      </div>
    </div>
  );
}
```

**Key points:**
- Banner uses z-[110] (ABOVE navigation's z-[100])
- Banner is `fixed top-0` to stay at top of viewport
- Navigation uses dynamic `top` style when demo user
- Early return null if not demo user (conditional rendering)

## Reflection Flow Patterns

### Dream Context Display

**Pattern:** Show which dream user is reflecting on

**File:** `components/reflection/MirrorExperience.tsx`

```tsx
export default function MirrorExperience() {
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const searchParams = useSearchParams();

  // Pre-select dream from URL parameter
  useEffect(() => {
    const dreamId = searchParams.get('dreamId');
    if (dreamId && dreams) {
      const dream = dreams.find(d => d.id === dreamId);
      if (dream) {
        setSelectedDream(dream);
      }
    }
  }, [searchParams, dreams]);

  return (
    <div className="reflection-container">
      {/* Dream context banner - shown BEFORE questions */}
      {selectedDream && (
        <div className="dream-context-banner mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20">
          <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
            Reflecting on: {selectedDream.title}
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-sm">
              {selectedDream.category}
            </span>
            {selectedDream.target_date && (
              <span className="text-purple-300/70 text-sm">
                {daysRemaining(selectedDream.target_date)} days remaining
              </span>
            )}
          </div>
        </div>
      )}

      {/* If no dream selected, show dropdown */}
      {!selectedDream && (
        <div className="dream-selection mb-8">
          <label className="block text-lg text-purple-200 mb-4">
            Which dream would you like to reflect on?
          </label>
          <select
            onChange={(e) => {
              const dream = dreams?.find(d => d.id === e.target.value);
              if (dream) setSelectedDream(dream);
            }}
            className="w-full p-4 rounded-xl bg-purple-900/30 border border-purple-500/20 text-purple-100"
          >
            <option value="">Select a dream...</option>
            {dreams?.map(dream => (
              <option key={dream.id} value={dream.id}>
                {dream.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Rest of reflection form */}
    </div>
  );
}
```

**Key points:**
- Check URL params for pre-selected dream (`?dreamId=xxx`)
- Show dream context banner BEFORE form questions
- Use gradient styling consistent with app theme
- Provide dream selection dropdown if not pre-selected

## Import Order Convention

**Standard order for all files:**

```typescript
// 1. React/Next.js core
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 2. Third-party libraries
import { Anthropic } from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// 3. Internal hooks
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import { useUser } from '@/hooks/useUser';

// 4. Internal components
import { DashboardCard } from '@/components/dashboard/shared/DashboardCard';
import { DashboardGrid } from '@/components/dashboard/shared/DashboardGrid';

// 5. Internal utilities
import { formatDate } from '@/lib/utils';

// 6. Types
import type { Dream, Reflection } from '@/types';

// 7. CSS (last)
import styles from './Component.module.css';
import './global-styles.css';
```

## Code Quality Standards

- **No console.log in production code** - Use only in seed scripts for progress tracking
- **Always handle errors** - Try/catch for async operations, error states for components
- **Type everything** - No `any` types except when absolutely necessary
- **Clean up effects** - Return cleanup function from useEffect
- **Semantic HTML** - Use proper heading hierarchy (h1 → h2 → h3)
- **Accessible** - ARIA labels, alt text, keyboard navigation
- **Mobile-first** - Design for mobile, enhance for desktop

---

**Patterns Status:** COMPREHENSIVE
**Ready for:** Builder Implementation
**Focus:** Copy these patterns exactly - they're proven to work
