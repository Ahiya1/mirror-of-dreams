# Code Patterns & Conventions - Iteration 3

This is the **most important file** for builders. Every pattern includes full, working code examples that you can copy and adapt.

---

## Table of Contents

1. [File Structure](#file-structure)
2. [Naming Conventions](#naming-conventions)
3. [Glass Component Usage Patterns](#glass-component-usage-patterns)
4. [Page Migration Patterns](#page-migration-patterns)
5. [Page Transition Patterns](#page-transition-patterns)
6. [Micro-Interaction Patterns](#micro-interaction-patterns)
7. [Accessibility Patterns](#accessibility-patterns)
8. [Animation Patterns](#animation-patterns)
9. [Error Handling Patterns](#error-handling-patterns)
10. [Import Order Convention](#import-order-convention)

---

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── dashboard/page.tsx          # ✓ Migrated (Iteration 2)
│   ├── dreams/page.tsx              # ✓ Migrated (Iteration 2)
│   ├── reflection/page.tsx          # ✓ Migrated (Iteration 2)
│   ├── evolution/page.tsx           # ← MIGRATION TARGET (Builder-1)
│   ├── visualizations/page.tsx      # ← MIGRATION TARGET (Builder-1)
│   ├── template.tsx                 # ← NEW FILE (Builder-2)
│   └── layout.tsx                   # Existing
├── components/
│   ├── ui/
│   │   └── glass/                   # All 10+ glass components
│   │       ├── index.ts             # Barrel export
│   │       ├── GlassCard.tsx        # ← ENHANCE (Builder-2)
│   │       ├── GlowButton.tsx       # ← ENHANCE (Builder-2)
│   │       ├── CosmicLoader.tsx     # ← ENHANCE (Builder-2)
│   │       └── [other components]
│   └── [domain-specific components]
├── lib/
│   ├── animations/
│   │   └── variants.ts              # Framer Motion variants
│   └── utils.ts                     # cn() utility
├── types/
│   └── glass-components.ts          # TypeScript interfaces
└── styles/
    ├── globals.css                  # Base styles
    ├── animations.css               # Keyframe animations
    └── variables.css                # CSS custom properties
```

---

## Naming Conventions

### Files
- **Components:** PascalCase (`GlassCard.tsx`, `CosmicLoader.tsx`)
- **Pages:** lowercase with route structure (`page.tsx`)
- **Utilities:** camelCase (`variants.ts`, `utils.ts`)
- **Types:** kebab-case (`glass-components.ts`)

### React Components
- **Function components:** PascalCase (`function EvolutionPage() {}`)
- **Custom hooks:** camelCase with `use` prefix (`useReducedMotion()`)
- **Event handlers:** camelCase with `handle` prefix (`handleGenerateReport()`)

### Variables & Functions
- **Variables:** camelCase (`isLoading`, `userDreams`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_RETRIES`, `API_TIMEOUT`)
- **Functions:** camelCase (`fetchReports()`, `generateVisualization()`)

### CSS Classes (Tailwind)
- Use `cn()` utility for conditional classes
- Group related classes together
- Order: layout → sizing → styling → effects → responsive

---

## Glass Component Usage Patterns

### Pattern 1: GlassCard for Containers

**When to use:** Any content container (report cards, visualization cards, control panels)

**Basic Usage:**
```tsx
import { GlassCard } from '@/components/ui/glass';

// Simple card (default variant, medium blur, purple glow)
<GlassCard>
  <h3 className="text-xl font-bold text-white mb-2">Dream Evolution Report</h3>
  <p className="text-white/70">Generated on {date}</p>
</GlassCard>
```

**With Variants:**
```tsx
// Elevated variant (stronger glass effect, more glow)
<GlassCard variant="elevated" glowColor="cosmic">
  <h3>Important Content</h3>
</GlassCard>

// Inset variant (lighter background, for images/visualizations)
<GlassCard variant="inset" glassIntensity="subtle">
  <img src={visualization.imageUrl} alt="Visualization" />
</GlassCard>
```

**With Hover Effects:**
```tsx
// Hoverable card (lifts on hover, expands glow)
<GlassCard
  hoverable={true}
  glowColor="blue"
  className="cursor-pointer"
  onClick={() => handleViewReport(report.id)}
>
  <GradientText gradient="cosmic">{report.title}</GradientText>
  <p className="text-white/70 mt-2">{report.description}</p>
</GlassCard>
```

**Full Example (Evolution Report Card):**
```tsx
<GlassCard
  variant="elevated"
  glowColor="purple"
  hoverable={true}
  className="cursor-pointer"
  onClick={() => router.push(`/evolution/${report.id}`)}
>
  <div className="flex items-start justify-between mb-4">
    <GradientText gradient="cosmic" className="text-xl font-bold">
      {report.title}
    </GradientText>
    <GlowBadge variant="info" glowing={true}>
      {report.reportType}
    </GlowBadge>
  </div>

  <p className="text-white/70 mb-4">
    {report.summary}
  </p>

  <div className="flex items-center justify-between">
    <span className="text-sm text-white/50">
      Generated {formatDate(report.createdAt)}
    </span>
    <GlowButton variant="ghost" size="sm">
      View Details
    </GlowButton>
  </div>
</GlassCard>
```

---

### Pattern 2: GlowButton for Actions

**When to use:** All buttons (primary actions, secondary actions, ghost links)

**Primary Button (Generate Report, Submit):**
```tsx
<GlowButton
  variant="primary"
  size="lg"
  onClick={handleGenerateReport}
  disabled={isGenerating || !selectedDream}
>
  {isGenerating ? 'Generating...' : 'Generate Evolution Report'}
</GlowButton>
```

**Secondary Button (Dream Selection, Filter):**
```tsx
<GlowButton
  variant="secondary"
  size="md"
  onClick={() => setSelectedDream(dream.id)}
  className={cn(
    selectedDream === dream.id && 'border-mirror-purple shadow-glow'
  )}
>
  {dream.title}
</GlowButton>
```

**Ghost Button (View Details, Learn More):**
```tsx
<GlowButton
  variant="ghost"
  size="sm"
  onClick={() => handleViewDetails(item.id)}
>
  View Details
</GlowButton>
```

**Full Example (Generation Controls):**
```tsx
<GlassCard variant="elevated">
  <GradientText gradient="cosmic" className="text-2xl font-bold mb-6">
    Generate Evolution Report
  </GradientText>

  {/* Dream Selection */}
  <div className="mb-6">
    <label className="block text-white/80 mb-3 font-medium">
      Select Dream
    </label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {dreams.map((dream) => (
        <GlowButton
          key={dream.id}
          variant="secondary"
          size="md"
          onClick={() => setSelectedDream(dream.id)}
          className={cn(
            'text-left justify-start',
            selectedDream === dream.id && 'border-mirror-purple shadow-glow'
          )}
        >
          <span className="truncate">{dream.title}</span>
        </GlowButton>
      ))}
    </div>
  </div>

  {/* Generate Button */}
  <GlowButton
    variant="primary"
    size="lg"
    onClick={handleGenerateReport}
    disabled={!selectedDream || isGenerating}
    className="w-full"
  >
    {isGenerating ? (
      <span className="flex items-center gap-2">
        <CosmicLoader size="sm" />
        Generating Report...
      </span>
    ) : (
      'Generate Evolution Report'
    )}
  </GlowButton>
</GlassCard>
```

---

### Pattern 3: CosmicLoader for Loading States

**When to use:** All loading states (page loading, data fetching, async operations)

**Page-Level Loading:**
```tsx
'use client';

import { CosmicLoader } from '@/components/ui/glass';

export default function EvolutionPage() {
  const { data: reports, isLoading } = trpc.evolution.getReports.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading your evolution reports...</p>
        </div>
      </div>
    );
  }

  // Rest of page...
}
```

**Inline Loading (Inside Card):**
```tsx
<GlassCard variant="elevated">
  {isGenerating ? (
    <div className="flex flex-col items-center py-8 gap-4">
      <CosmicLoader size="md" />
      <p className="text-white/60">Generating your visualization...</p>
    </div>
  ) : (
    <div>
      {/* Content */}
    </div>
  )}
</GlassCard>
```

**Button with Loader:**
```tsx
<GlowButton
  variant="primary"
  onClick={handleGenerate}
  disabled={isGenerating}
>
  {isGenerating ? (
    <span className="flex items-center gap-2">
      <CosmicLoader size="sm" />
      Generating...
    </span>
  ) : (
    'Generate Report'
  )}
</GlowButton>
```

---

### Pattern 4: GradientText for Headings

**When to use:** All page titles, section headers, important text

**Page Title:**
```tsx
<GradientText
  gradient="cosmic"
  className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8"
>
  Evolution Reports
</GradientText>
```

**Section Header:**
```tsx
<GradientText gradient="primary" className="text-2xl font-bold mb-4">
  Generate New Report
</GradientText>
```

**Card Title:**
```tsx
<GradientText gradient="cosmic" className="text-xl font-bold">
  {report.title}
</GradientText>
```

**Available Gradients:**
- `cosmic`: Purple to blue (default, most magical)
- `primary`: Purple gradient (elegant)
- `dream`: Radial purple (dreamy)

---

### Pattern 5: GlowBadge for Status Indicators

**When to use:** Report types, status indicators, tags

**Report Type Badge:**
```tsx
<GlowBadge variant="info" glowing={true}>
  Dream Evolution
</GlowBadge>

<GlowBadge variant="success" glowing={false}>
  Temporal Distribution
</GlowBadge>
```

**Tier Warning Badge:**
```tsx
<GlowBadge variant="warning" glowing={true}>
  Requires Premium Tier
</GlowBadge>
```

**Status Badge:**
```tsx
<GlowBadge
  variant={report.status === 'complete' ? 'success' : 'info'}
  glowing={report.status === 'generating'}
>
  {report.status}
</GlowBadge>
```

**Available Variants:**
- `info`: Blue (default, informational)
- `success`: Green (completed, positive)
- `warning`: Yellow (caution, upgrade needed)
- `error`: Red (errors, critical)

---

## Page Migration Patterns

### Pattern 6: Evolution Page Migration

**Before (Basic Tailwind):**
```tsx
export default function EvolutionPage() {
  const { data, isLoading } = trpc.evolution.getReports.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-4xl text-white mb-8">Evolution Reports</h1>

      {/* Generation controls */}
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl mb-8">
        <select>...</select>
        <button onClick={handleGenerate}>Generate</button>
      </div>

      {/* Report list */}
      <div className="grid gap-6">
        {data.reports.map(report => (
          <div key={report.id} className="bg-white/10 p-6 rounded-xl">
            <h3>{report.title}</h3>
            <p>{report.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**After (Glass Components):**
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText,
  GlowBadge
} from '@/components/ui/glass';
import { cn } from '@/lib/utils';

export default function EvolutionPage() {
  const router = useRouter();
  const [selectedDream, setSelectedDream] = useState<string | null>(null);

  const { data: dreams } = trpc.dreams.list.useQuery();
  const { data: reports, isLoading } = trpc.evolution.getReports.useQuery();
  const generateMutation = trpc.evolution.generate.useMutation();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading your evolution reports...</p>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!selectedDream) return;

    await generateMutation.mutateAsync({
      dreamId: selectedDream,
      reportType: 'dream_evolution'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <GradientText gradient="cosmic" className="text-3xl sm:text-4xl font-bold mb-8">
          Evolution Reports
        </GradientText>

        {/* Generation Controls */}
        <GlassCard variant="elevated" className="mb-8">
          <GradientText gradient="primary" className="text-2xl font-bold mb-6">
            Generate New Report
          </GradientText>

          {/* Dream Selection */}
          <div className="mb-6">
            <label className="block text-white/80 mb-3 font-medium">
              Select Dream
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dreams?.map((dream) => (
                <GlowButton
                  key={dream.id}
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedDream(dream.id)}
                  className={cn(
                    'text-left justify-start',
                    selectedDream === dream.id && 'border-mirror-purple shadow-glow'
                  )}
                >
                  <span className="truncate">{dream.title}</span>
                </GlowButton>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <GlowButton
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={!selectedDream || generateMutation.isLoading}
            className="w-full"
          >
            {generateMutation.isLoading ? (
              <span className="flex items-center gap-2">
                <CosmicLoader size="sm" />
                Generating Report...
              </span>
            ) : (
              'Generate Evolution Report'
            )}
          </GlowButton>
        </GlassCard>

        {/* Report List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports?.map((report) => (
            <GlassCard
              key={report.id}
              variant="elevated"
              hoverable={true}
              glowColor="purple"
              className="cursor-pointer"
              onClick={() => router.push(`/evolution/${report.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <GradientText gradient="cosmic" className="text-xl font-bold">
                  {report.title}
                </GradientText>
                <GlowBadge variant="info" glowing={true}>
                  {report.reportType}
                </GlowBadge>
              </div>

              <p className="text-white/70 mb-4">
                {report.summary}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">
                  Generated {new Date(report.createdAt).toLocaleDateString()}
                </span>
                <GlowButton variant="ghost" size="sm">
                  View Details
                </GlowButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Key Changes:**
1. Replace `<div>Loading...</div>` with `<CosmicLoader>`
2. Replace `<h1>` with `<GradientText>`
3. Replace `bg-white/10 backdrop-blur-md` containers with `<GlassCard>`
4. Replace `<button>` with `<GlowButton>`
5. Add `<GlowBadge>` for status indicators
6. Add hover effects to cards (`hoverable={true}`)
7. Maintain all tRPC query/mutation logic

---

### Pattern 7: Visualizations Page Migration

**After (Glass Components):**
```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText
} from '@/components/ui/glass';
import { cn } from '@/lib/utils';

const visualizationStyles = [
  { id: 'achievement', name: 'Achievement Spiral', icon: '🏔️' },
  { id: 'spiral', name: 'Dream Spiral', icon: '🌀' },
  { id: 'synthesis', name: 'Cosmic Synthesis', icon: '🌌' },
];

export default function VisualizationsPage() {
  const [selectedDream, setSelectedDream] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('achievement');

  const { data: dreams } = trpc.dreams.list.useQuery();
  const { data: visualizations, isLoading } = trpc.visualizations.list.useQuery();
  const generateMutation = trpc.visualizations.generate.useMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading visualizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <GradientText gradient="cosmic" className="text-3xl sm:text-4xl font-bold mb-8">
          Dream Visualizations
        </GradientText>

        {/* Generation Controls */}
        <GlassCard variant="elevated" className="mb-8">
          {/* Style Selection */}
          <GradientText gradient="primary" className="text-2xl font-bold mb-6">
            Select Visualization Style
          </GradientText>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {visualizationStyles.map((style) => (
              <GlassCard
                key={style.id}
                variant={selectedStyle === style.id ? 'elevated' : 'default'}
                hoverable={true}
                glowColor="purple"
                className={cn(
                  'cursor-pointer text-center',
                  selectedStyle === style.id && 'border-mirror-purple shadow-glow-lg'
                )}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div className="text-4xl mb-3">{style.icon}</div>
                <GradientText
                  gradient={selectedStyle === style.id ? 'cosmic' : 'primary'}
                  className="text-lg font-bold"
                >
                  {style.name}
                </GradientText>
              </GlassCard>
            ))}
          </div>

          {/* Dream Selection */}
          <div className="mb-6">
            <label className="block text-white/80 mb-3 font-medium">
              Select Dream
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dreams?.map((dream) => (
                <GlowButton
                  key={dream.id}
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedDream(dream.id)}
                  className={cn(
                    'text-left justify-start',
                    selectedDream === dream.id && 'border-mirror-purple shadow-glow'
                  )}
                >
                  <span className="truncate">{dream.title}</span>
                </GlowButton>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <GlowButton
            variant="primary"
            size="lg"
            onClick={() => generateMutation.mutate({ dreamId: selectedDream!, style: selectedStyle })}
            disabled={!selectedDream || generateMutation.isLoading}
            className="w-full"
          >
            {generateMutation.isLoading ? (
              <span className="flex items-center gap-2">
                <CosmicLoader size="sm" />
                Generating Visualization...
              </span>
            ) : (
              'Generate Visualization'
            )}
          </GlowButton>
        </GlassCard>

        {/* Visualization List */}
        <div className="grid grid-cols-1 gap-6">
          {visualizations?.map((viz) => (
            <GlassCard
              key={viz.id}
              variant="inset"
              glassIntensity="subtle"
            >
              <GradientText gradient="cosmic" className="text-2xl font-bold mb-4">
                {viz.title}
              </GradientText>

              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 text-lg leading-relaxed">
                  {viz.narrative}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Key Differences from Evolution:**
- Style selection cards use `GlassCard` with visual styling
- Active style gets `variant="elevated"` and `border-mirror-purple`
- Visualization display uses `variant="inset"` (lighter background for content)
- Same pattern for dream selection and generation

---

## Page Transition Patterns

### Pattern 8: Global Page Transitions

**File:** `/app/template.tsx` (NEW FILE - Builder-2)

**Purpose:** Apply fade + slide transitions to all page navigations

**Full Implementation:**
```tsx
'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * Global page transition template
 *
 * Applies to all pages via Next.js App Router template.tsx pattern
 * - Fade + slide animation on page changes
 * - Respects prefers-reduced-motion
 * - Uses AnimatePresence for smooth exit animations
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Key Points:**
- Use `usePathname()` as key for AnimatePresence
- Always check `useReducedMotion()` first
- Use `mode="wait"` to prevent animation overlap
- Keep duration short (0.3s) for snappy feel
- Use opacity + transform only (GPU-accelerated)

**Testing:**
```tsx
// Test reduced motion
// Chrome DevTools: Cmd+Shift+P → "Emulate CSS prefers-reduced-motion"
// Verify: Pages change instantly, no animation
```

---

## Micro-Interaction Patterns

### Pattern 9: Enhanced Hover Effects

**Card Hover (Already in GlassCard):**
```tsx
// GlassCard with hover
<GlassCard hoverable={true} glowColor="purple">
  {/* Content */}
</GlassCard>

// Effect: Card lifts 4px, glow expands
// Animation: cardVariants hover state (y: -4, scale: 1.02)
```

**Button Active State:**
```tsx
// Add whileTap to GlowButton for active state feedback
<motion.button
  whileHover={!disabled && !prefersReducedMotion ? { scale: 1.02 } : undefined}
  whileTap={!disabled && !prefersReducedMotion ? { scale: 0.98 } : undefined}
  // ... rest of button
>
```

**Filter Button Active State (Dreams Page Pattern):**
```tsx
<GlowButton
  variant="secondary"
  size="sm"
  onClick={() => setFilter(filter.id)}
  className={cn(
    filter.id === activeFilter && 'border-mirror-purple shadow-glow scale-[1.02]'
  )}
>
  {filter.label}
</GlowButton>
```

---

### Pattern 10: Focus Animations

**Input Focus (GlassInput Pattern):**
```tsx
'use client';

import { cn } from '@/lib/utils';

export function GlassInput({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        // Base styles
        'w-full px-4 py-3 rounded-lg',
        'bg-white/5 backdrop-blur-glass border border-white/10',
        'text-white placeholder:text-white/40',
        // Focus styles
        'focus:outline-none',
        'focus:border-mirror-purple/60',
        'focus:shadow-glow',
        // Transition
        'transition-all duration-300',
        // Custom
        className
      )}
      {...props}
    />
  );
}
```

**Enhanced Focus Animation (NEW - Builder-2):**
```tsx
// Add subtle scale on focus
'focus:scale-[1.01]'

// Full className:
className={cn(
  'w-full px-4 py-3 rounded-lg',
  'bg-white/5 backdrop-blur-glass border border-white/10',
  'text-white placeholder:text-white/40',
  'focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow focus:scale-[1.01]',
  'transition-all duration-300',
  className
)}
```

---

## Accessibility Patterns

### Pattern 11: ARIA Labels for Loaders

**CosmicLoader Enhancement (Builder-2):**

**Before:**
```tsx
export function CosmicLoader({ size = 'md' }: CosmicLoaderProps) {
  return (
    <div className="flex items-center justify-center">
      {/* Loader animation */}
    </div>
  );
}
```

**After:**
```tsx
export function CosmicLoader({
  size = 'md',
  label = 'Loading content'
}: CosmicLoaderProps) {
  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-label={label}
    >
      {/* Loader animation */}
      <span className="sr-only">{label}</span>
    </div>
  );
}
```

**Usage:**
```tsx
// Custom loading message
<CosmicLoader size="lg" label="Loading your evolution reports" />

// Default message
<CosmicLoader size="md" />
```

---

### Pattern 12: Icon Button ARIA Labels

**Before:**
```tsx
<button onClick={handleClose}>
  <X className="w-6 h-6" />
</button>
```

**After:**
```tsx
<button
  onClick={handleClose}
  aria-label="Close modal"
>
  <X className="w-6 h-6" />
</button>
```

**GlowButton with Icon Only:**
```tsx
<GlowButton
  variant="ghost"
  size="sm"
  onClick={handleRefresh}
  aria-label="Refresh data"
>
  <RefreshCw className="w-4 h-4" />
</GlowButton>
```

---

### Pattern 13: Skip to Content Link

**app/layout.tsx Enhancement (Builder-2):**

**Add before main content:**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Skip to main content link (hidden until focused) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-mirror-purple focus:text-white focus:rounded-lg focus:shadow-glow"
        >
          Skip to main content
        </a>

        {/* Navigation */}
        <nav>{/* ... */}</nav>

        {/* Main content */}
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
```

**CSS for sr-only:**
```css
/* Already in globals.css, but for reference: */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

### Pattern 14: Keyboard Navigation

**Ensure Tab Order:**
```tsx
// Use semantic HTML elements (button, a, input)
// They're automatically focusable and in tab order

// ✓ Good: Semantic button
<GlowButton onClick={handleClick}>
  Click Me
</GlowButton>

// ✗ Bad: div as button
<div onClick={handleClick}>
  Click Me
</div>

// If you must use div, add tabIndex and role
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
  role="button"
  aria-label="Action button"
>
  Click Me
</div>
```

**Modal Keyboard Support:**
```tsx
// Escape key closes modal (already in GlassModal)
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (isOpen) {
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }
}, [isOpen, onClose]);
```

---

## Animation Patterns

### Pattern 15: Using Framer Motion Variants

**Import Existing Variants:**
```tsx
import { cardVariants, staggerContainer, staggerItem } from '@/lib/animations/variants';
```

**Card Entrance Animation:**
```tsx
<motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  whileHover="hover"
>
  {/* Content */}
</motion.div>
```

**Stagger List Animation:**
```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  animate="show"
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={staggerItem}
    >
      <GlassCard>{item.title}</GlassCard>
    </motion.div>
  ))}
</motion.div>
```

**Respect Reduced Motion:**
```tsx
import { useReducedMotion } from 'framer-motion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={!prefersReducedMotion ? cardVariants : undefined}
      initial={!prefersReducedMotion ? 'hidden' : false}
      animate={!prefersReducedMotion ? 'visible' : false}
    >
      {/* Content */}
    </motion.div>
  );
}
```

---

## Error Handling Patterns

### Pattern 16: Error State Display

**With GlassCard + GlowBadge:**
```tsx
{error && (
  <GlassCard
    variant="default"
    glowColor="electric"
    className="mb-6 border-l-4 border-red-500"
  >
    <div className="flex items-center gap-3">
      <GlowBadge variant="error" glowing={true}>
        <AlertTriangle className="w-4 h-4" />
      </GlowBadge>
      <div className="flex-1">
        <p className="text-white/90 font-medium">Error</p>
        <p className="text-white/70 text-sm">{error.message}</p>
      </div>
      <GlowButton
        size="sm"
        variant="ghost"
        onClick={() => setError(null)}
      >
        Dismiss
      </GlowButton>
    </div>
  </GlassCard>
)}
```

**Tier Upgrade Warning:**
```tsx
{user?.tier === 'free' && (
  <GlassCard
    variant="elevated"
    glowColor="purple"
    className="border-l-4 border-yellow-500 mb-6"
  >
    <div className="flex items-center gap-3">
      <GlowBadge variant="warning" glowing={true}>
        <Sparkles className="w-4 h-4" />
      </GlowBadge>
      <div className="flex-1">
        <p className="text-white/90 font-medium">Upgrade to Premium</p>
        <p className="text-white/70 text-sm">
          Unlock unlimited evolution reports and advanced visualizations
        </p>
      </div>
      <GlowButton
        variant="primary"
        size="sm"
        onClick={() => router.push('/subscription')}
      >
        Upgrade
      </GlowButton>
    </div>
  </GlassCard>
)}
```

---

## Import Order Convention

**Standard Import Order:**
```tsx
// 1. React & Next.js core
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 2. Third-party libraries
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, AlertTriangle, Sparkles } from 'lucide-react';

// 3. Internal utilities & hooks
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// 4. Glass components
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText,
  GlowBadge
} from '@/components/ui/glass';

// 5. Domain components
import { DreamCard } from '@/components/dreams/DreamCard';

// 6. Animation variants
import { cardVariants, staggerContainer } from '@/lib/animations/variants';

// 7. Types
import type { Dream, Report } from '@/types';

// 8. Styles (last)
import '@/styles/custom.css';
```

---

## Code Quality Standards

### TypeScript Strict Mode

**Always specify types:**
```tsx
// ✓ Good
const [selectedDream, setSelectedDream] = useState<string | null>(null);
const handleGenerate = async (): Promise<void> => { /* ... */ };

// ✗ Bad
const [selectedDream, setSelectedDream] = useState(null);
const handleGenerate = async () => { /* ... */ };
```

### Consistent Naming

**Event Handlers:**
```tsx
// ✓ Good
const handleGenerateReport = () => { /* ... */ };
const handleDreamSelect = (id: string) => { /* ... */ };

// ✗ Bad
const generate = () => { /* ... */ };
const onDreamClick = (id: string) => { /* ... */ };
```

### Responsive Design

**Always use responsive classes:**
```tsx
// ✓ Good
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

// ✗ Bad
<div className="grid grid-cols-3 gap-6">
```

---

## Performance Patterns

### Pattern 17: Conditional Rendering

**Avoid unnecessary renders:**
```tsx
// ✓ Good: Early return
if (isLoading) {
  return <CosmicLoader size="lg" />;
}

// ✗ Bad: Conditional inside JSX
return (
  <div>
    {isLoading ? <CosmicLoader size="lg" /> : (
      <div>{/* Large component tree */}</div>
    )}
  </div>
);
```

### Pattern 18: Memoization

**Use useCallback for event handlers passed to children:**
```tsx
const handleDreamSelect = useCallback((dreamId: string) => {
  setSelectedDream(dreamId);
}, []);
```

**Use useMemo for expensive computations:**
```tsx
const filteredReports = useMemo(() => {
  return reports.filter(r => r.status === 'complete');
}, [reports]);
```

---

## Summary

**Most Important Patterns for This Iteration:**

1. **GlassCard** - Replace all `bg-white/10 backdrop-blur-md` containers
2. **GlowButton** - Replace all `<button>` elements
3. **CosmicLoader** - Replace all loading states
4. **GradientText** - Replace all `<h1>`, `<h2>` headings
5. **Page Transitions** - Use template.tsx with AnimatePresence
6. **ARIA Labels** - Add to all loaders and icon buttons
7. **Reduced Motion** - Always check `useReducedMotion()`

**Copy-Paste Ready:**
- All code examples are production-ready
- No pseudocode - real implementations
- Preserve existing logic (tRPC queries, state management)
- Focus on visual migration, not functional changes

**Result:** Consistent, accessible, performant glass design system across all pages.
