# Code Patterns & Conventions - Plan-7 Iteration 14

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── reflection/
│   │   └── MirrorExperience.tsx        # Main reflection form (Builder-2)
│   ├── reflections/
│   │   ├── page.tsx                    # Collection list (Builder-3)
│   │   └── [id]/
│   │       └── page.tsx                # Individual display (Builder-1)
│   ├── dashboard/page.tsx              # Empty state update (Builder-3)
│   ├── dreams/page.tsx                 # Empty state update (Builder-3)
│   ├── evolution/page.tsx              # Empty state update (Builder-3)
│   └── visualizations/page.tsx         # Empty state update (Builder-3)
├── components/
│   ├── reflections/
│   │   ├── AIResponseRenderer.tsx      # Enhance (Builder-1)
│   │   ├── ReflectionCard.tsx          # Verify (Builder-3)
│   │   └── ReflectionFilters.tsx       # Enhance (Builder-3)
│   ├── reflection/
│   │   ├── ToneSelectionCard.tsx       # Enhance (Builder-2)
│   │   └── ReflectionQuestionCard.tsx  # Add checkmarks (Builder-2)
│   ├── shared/
│   │   ├── EmptyState.tsx              # Already supports illustrations
│   │   └── illustrations/              # New folder (Builder-3)
│   │       ├── CosmicDream.tsx
│   │       ├── Constellation.tsx
│   │       ├── BlankJournal.tsx
│   │       └── CanvasVisual.tsx
│   └── ui/glass/
│       └── GlassInput.tsx              # Extend (Builder-2)
└── lib/
    ├── utils/constants.ts              # Add micro-copy (All builders)
    └── animations/variants.ts          # Update variants (Builder-2)
```

---

## Naming Conventions

- **Components:** PascalCase (`AIResponseRenderer.tsx`, `ToneSelectionCard.tsx`)
- **Files:** camelCase for utilities (`formatDate.ts`, `wordCount.ts`)
- **Types:** PascalCase (`Reflection`, `ToneId`, `ReflectionFilters`)
- **Functions:** camelCase (`countWords()`, `formatDateWithOrdinal()`)
- **Constants:** SCREAMING_SNAKE_CASE (`MICRO_COPY`, `TONE_DESCRIPTIONS`)
- **CSS Classes:** kebab-case via Tailwind (`text-amber-400`, `bg-purple-500/20`)

---

## Micro-Copy Guidelines

### Tone: Warm and Encouraging, Never Clinical

**Principles:**
- Use "you" and "your" (personal, direct)
- Celebrate depth and vulnerability
- Guide, don't command
- Avoid jargon or corporate speak
- Respect the sacred nature of reflection

**Examples:**

**GOOD:**
- "Welcome to your sacred space for reflection. Take a deep breath."
- "Beautiful choice. Let's explore [Dream Name] together."
- "342 thoughtful words - your reflection is rich with depth."

**BAD:**
- "Please complete all required fields."
- "Character limit exceeded."
- "Invalid input."

**Character Counter Progression:**
```typescript
// 0-50%: Encouraging
"Keep writing - your thoughts matter."

// 50-90%: Celebrating
"342 thoughtful words - beautiful depth."

// 90-100%: Almost there
"You're near the space available - almost complete."

// 100%+: Gentle guidance (NO RED, NO "ERROR")
"Your reflection is complete. If you'd like to add more, consider a new reflection."
```

**Tone Selection Descriptions:**
```typescript
{
  fusion: "Balanced wisdom where all voices become one. Expect both comfort and challenge, woven together in sacred harmony.",
  gentle: "Soft wisdom that illuminates gently. Your mirror will speak with compassion, holding space for vulnerability.",
  intense: "Piercing truth that burns away illusions. Expect direct clarity that honors your readiness for transformation."
}
```

**Empty State Copy:**
```typescript
// Dashboard (no dreams)
title: "Your journey begins with a dream"
description: "Every great transformation starts with a single dream. What calls to you?"

// Reflections (no reflections)
title: "Your first reflection awaits"
description: "Reflection is how you water your dreams. Create your first reflection to begin the journey."

// Evolution (locked)
title: "Evolution unlocks after 4 reflections"
description: "Each reflection builds toward deeper insight. Keep reflecting to unlock your evolution report."
```

---

## Word Counting Pattern

### When to Use
Any textarea that needs word count display (reflection form questions).

### Implementation

**Utility Function:**
```typescript
// lib/utils/wordCount.ts
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Format for display
export function formatWordCount(count: number): string {
  if (count === 0) return 'Start writing...';
  if (count === 1) return '1 word';
  return `${count} words`;
}

// Get word count state for color
export function getWordCountState(count: number, maxChars: number): 'low' | 'mid' | 'high' {
  const estimatedWords = maxChars / 5; // Average word length
  const percentage = count / estimatedWords;

  if (percentage < 0.5) return 'low';   // 0-50%: white/70
  if (percentage < 0.9) return 'mid';   // 50-90%: gold
  return 'high';                        // 90-100%: purple
}
```

**GlassInput Extension:**
```typescript
// components/ui/glass/GlassInput.tsx

interface GlassInputProps {
  // ... existing props
  counterMode?: 'characters' | 'words'; // NEW
  counterFormat?: (count: number, max: number) => string; // NEW
}

export function GlassInput({
  // ... existing props
  counterMode = 'characters', // Default: backward compatible
  counterFormat,
}: GlassInputProps) {
  // Word count calculation
  const displayCount = counterMode === 'words'
    ? countWords(value)
    : value.length;

  // Color state (updated for purple instead of red)
  const getCounterColorState = () => {
    if (!maxLength) return 'safe';

    const maxCount = counterMode === 'words' ? maxLength / 5 : maxLength;
    const percentage = displayCount / maxCount;

    if (percentage > 0.9) return 'high';      // Purple (not danger)
    if (percentage > 0.5) return 'warning';   // Gold
    return 'safe';                            // White
  };

  // Display format
  const counterText = counterFormat
    ? counterFormat(displayCount, maxLength)
    : counterMode === 'words'
      ? formatWordCount(displayCount)
      : `${displayCount} / ${maxLength}`;

  return (
    // ... existing structure
    {showCounter && maxLength && actualType === 'textarea' && (
      <motion.div
        className="absolute bottom-3 right-3 text-xs pointer-events-none font-medium"
        variants={prefersReducedMotion ? undefined : wordCounterVariants}
        initial={prefersReducedMotion ? false : 'safe'}
        animate={prefersReducedMotion ? false : getCounterColorState()}
        aria-live="polite"
        aria-atomic="true"
      >
        {counterText}
      </motion.div>
    )}
  );
}
```

**Updated Framer Motion Variants:**
```typescript
// lib/animations/variants.ts

export const wordCounterVariants: Variants = {
  safe: {
    color: 'rgba(255, 255, 255, 0.7)',
    transition: { duration: 0.3 }
  },
  warning: {
    color: '#fbbf24', // Gold
    transition: { duration: 0.3 }
  },
  high: {
    color: '#a855f7', // Purple (not red!)
    transition: { duration: 0.3 }
  },
};
```

**Usage in Reflection Form:**
```typescript
<GlassInput
  variant="textarea"
  value={formData.dream}
  onChange={(value) => setFormData(prev => ({ ...prev, dream: value }))}
  maxLength={QUESTION_LIMITS.dream}
  showCounter={true}
  counterMode="words"
  counterFormat={(count) => {
    if (count === 0) return 'Your dream awaits...';
    if (count === 1) return '1 thoughtful word';
    return `${count} thoughtful words`;
  }}
/>
```

---

## AI Response Enhancement Pattern

### When to Use
Individual reflection display page (AI insights rendering).

### Implementation

**AIResponseRenderer Extension:**
```typescript
// components/reflections/AIResponseRenderer.tsx

export function AIResponseRenderer({ content }: AIResponseRendererProps) {
  const hasMarkdown = /^#{1,3}\s|^\*\s|^-\s|^>\s|```/.test(content);

  if (!hasMarkdown) {
    return (
      <div className="max-w-[720px] mx-auto space-y-4">
        {content.split('\n\n').map((para, i) => (
          <p
            key={i}
            className={cn(
              "leading-[1.8] text-white/95",
              i === 0 ? "text-xl" : "text-lg" // First paragraph larger
            )}
          >
            {para}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // First paragraph detection via CSS
          p: ({ node, ...props }) => (
            <p className="text-lg leading-[1.8] text-white/95 mb-4 first:text-xl first:text-white" {...props} />
          ),

          // Gold highlights for key insights (change from purple)
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-amber-400 bg-amber-400/10 px-1 rounded" {...props} />
          ),

          // Questions italicized + indented
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-purple-400/60 pl-6 py-3 my-6 bg-purple-500/5 rounded-r-lg italic"
              {...props}
            >
              <div className="text-white/90">{props.children}</div>
            </blockquote>
          ),

          // Headings (unchanged, already gradient)
          h1: ({ node, ...props }) => (
            <GradientText gradient="cosmic" className="block text-4xl font-bold mb-6 mt-8 first:mt-0">
              {props.children}
            </GradientText>
          ),

          // Lists (unchanged)
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-white/90 ml-4" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

**Key Changes:**
1. First paragraph: `first:text-xl first:text-white` (larger, brighter)
2. Line-height: `leading-[1.8]` (was `leading-relaxed` = 1.625)
3. Strong tags: Gold with background highlight (was purple)
4. Max-width: Already 720px (perfect, no change)

---

## Tone Selection Enhancement Pattern

### When to Use
Reflection form tone selection step.

### Implementation

**ToneSelectionCard Extension:**
```typescript
// components/reflection/ToneSelectionCard.tsx

interface ToneSelectionCardProps {
  tone: ToneId;
  selected: boolean;
  onSelect: () => void;
  description?: string; // NEW
}

export function ToneSelectionCard({
  tone,
  selected,
  onSelect,
  description
}: ToneSelectionCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Tone color mapping
  const toneColors = {
    fusion: {
      glow: 'rgba(251, 191, 36, 0.3)', // Gold
      border: 'border-amber-400/30',
      bg: 'bg-amber-400/10',
    },
    gentle: {
      glow: 'rgba(59, 130, 246, 0.3)', // Blue
      border: 'border-blue-400/30',
      bg: 'bg-blue-400/10',
    },
    intense: {
      glow: 'rgba(168, 85, 247, 0.3)', // Purple
      border: 'border-purple-400/30',
      bg: 'bg-purple-400/10',
    },
  };

  const colors = toneColors[tone];

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'relative p-6 rounded-xl border-2 transition-all duration-300',
        'backdrop-blur-sm text-left w-full',
        selected
          ? `${colors.border} ${colors.bg}`
          : 'border-white/10 bg-white/5 hover:border-white/20'
      )}
      whileHover={prefersReducedMotion ? undefined : {
        boxShadow: `0 0 30px ${colors.glow}`,
        y: -2,
      }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
    >
      {/* Tone icon and label */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{getToneIcon(tone)}</span>
        <h3 className="text-lg font-medium text-white">
          {getToneLabel(tone)}
        </h3>
        {selected && (
          <span className="ml-auto text-green-400">✓</span>
        )}
      </div>

      {/* Description (new) */}
      {description && (
        <p className="text-sm text-white/70 leading-relaxed mt-2">
          {description}
        </p>
      )}
    </motion.button>
  );
}
```

**Usage:**
```typescript
<ToneSelectionCard
  tone="fusion"
  selected={selectedTone === 'fusion'}
  onSelect={() => setSelectedTone('fusion')}
  description={TONE_DESCRIPTIONS.fusion}
/>
```

**Constants:**
```typescript
// lib/utils/constants.ts

export const TONE_DESCRIPTIONS = {
  fusion: "Balanced wisdom where all voices become one. Expect both comfort and challenge, woven together in sacred harmony.",
  gentle: "Soft wisdom that illuminates gently. Your mirror will speak with compassion, holding space for vulnerability.",
  intense: "Piercing truth that burns away illusions. Expect direct clarity that honors your readiness for transformation."
} as const;
```

---

## Empty State Illustration Pattern

### When to Use
Any page with empty state (dashboard, dreams, reflections, evolution, visualizations).

### Implementation

**CSS Art Approach (Fast, Consistent):**
```typescript
// components/shared/illustrations/CosmicDream.tsx

export function CosmicDream() {
  return (
    <div className="relative w-32 h-32 mx-auto" aria-hidden="true">
      {/* Outer glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-mirror-amethyst/30 to-mirror-purple/10 rounded-full blur-2xl animate-pulse" />

      {/* Inner orb */}
      <div className="absolute inset-4 bg-gradient-to-br from-mirror-gold-ambient to-transparent rounded-full" />

      {/* Center icon */}
      <span className="absolute inset-0 flex items-center justify-center text-5xl">
        ✨
      </span>
    </div>
  );
}
```

```typescript
// components/shared/illustrations/Constellation.tsx

export function Constellation() {
  return (
    <div className="relative w-40 h-40 mx-auto" aria-hidden="true">
      {/* Stars positioned absolutely */}
      <div className="absolute top-4 left-8 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
      <div className="absolute top-12 right-6 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse delay-100" />
      <div className="absolute bottom-8 left-12 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200" />
      <div className="absolute bottom-6 right-10 w-1 h-1 bg-purple-300 rounded-full animate-pulse delay-300" />

      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 160 160">
        <line x1="32" y1="16" x2="120" y2="48" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" />
        <line x1="120" y1="48" x2="48" y2="96" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" />
        <line x1="48" y1="96" x2="120" y2="120" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" />
      </svg>

      {/* Center constellation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl">🌟</span>
      </div>
    </div>
  );
}
```

**Usage:**
```typescript
// app/dashboard/page.tsx

import { EmptyState } from '@/components/shared/EmptyState';
import { CosmicDream } from '@/components/shared/illustrations/CosmicDream';

// Inside component, when dreams.length === 0
<EmptyState
  illustration={<CosmicDream />}
  title="Your journey begins with a dream"
  description="Every great transformation starts with a single dream. What calls to you?"
  ctaLabel="Create Your First Dream"
  ctaAction={() => router.push('/dreams')}
/>
```

---

## Date Range Filter Pattern

### When to Use
Reflection collection filters.

### Implementation

```typescript
// components/reflections/ReflectionFilters.tsx

type DateRangeOption = 'all' | '7days' | '30days' | '90days';

interface ReflectionFiltersProps {
  // ... existing props
  dateRange: DateRangeOption;
  onDateRangeChange: (range: DateRangeOption) => void;
}

export function ReflectionFilters({ dateRange, onDateRangeChange, ... }: ReflectionFiltersProps) {
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
  ];

  return (
    <div className="space-y-4">
      {/* Date range filter */}
      <div>
        <label className="text-sm text-white/70 font-medium block mb-2">
          Time Period
        </label>
        <div className="flex flex-wrap gap-2">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onDateRangeChange(option.value as DateRangeOption)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                dateRange === option.value
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* ... other filters */}
    </div>
  );
}
```

**Date Range Calculation:**
```typescript
// lib/utils/dateRange.ts

export function getDateRangeFilter(range: DateRangeOption): Date | undefined {
  if (range === 'all') return undefined;

  const now = new Date();
  const daysAgo = {
    '7days': 7,
    '30days': 30,
    '90days': 90,
  }[range];

  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  return cutoffDate;
}
```

**tRPC Query Usage:**
```typescript
const { data } = trpc.reflections.list.useQuery({
  page,
  limit: 20,
  createdAfter: getDateRangeFilter(dateRange),
});
```

---

## Reduced Motion Pattern

### When to Use
All animations and transitions.

### Implementation

```typescript
import { useReducedMotion } from 'framer-motion';

export function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      // Only apply variants if motion is enabled
      variants={prefersReducedMotion ? undefined : cardVariants}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate={prefersReducedMotion ? false : 'visible'}
      whileHover={prefersReducedMotion ? undefined : 'hover'}
    >
      {/* Content */}
    </motion.div>
  );
}
```

**Fallback for CSS Animations:**
```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-ping {
    animation: none;
  }
}
```

---

## Import Order Convention

```typescript
// 1. React and Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { motion, useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// 3. Internal utilities and types
import { cn } from '@/lib/utils';
import { countWords } from '@/lib/utils/wordCount';
import type { Reflection, ToneId } from '@/types';

// 4. Components (shared → specific)
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';

// 5. Constants and data
import { TONE_DESCRIPTIONS, MICRO_COPY } from '@/lib/utils/constants';

// 6. Styles (if any)
import styles from './MyComponent.module.css';
```

---

## Code Quality Standards

1. **TypeScript strict mode:** All components fully typed, no `any`
2. **Accessibility:** All interactive elements keyboard-accessible, ARIA where needed
3. **Reduced motion:** All animations respect `prefers-reduced-motion`
4. **Error handling:** Graceful fallbacks for edge cases
5. **Comments:** Explain "why", not "what" (code should be self-documenting)

**Example:**
```typescript
// GOOD: Explains rationale
// Use word count instead of characters to celebrate depth, not limit expression
const wordCount = countWords(value);

// BAD: States the obvious
// Count the words in the value
const wordCount = countWords(value);
```

---

## Performance Patterns

### Lazy Load Non-Critical Components
```typescript
import dynamic from 'next/dynamic';

const AIResponseRenderer = dynamic(
  () => import('@/components/reflections/AIResponseRenderer').then(mod => mod.AIResponseRenderer),
  { ssr: true } // Keep SSR for SEO
);
```

### Memoize Expensive Calculations
```typescript
import { useMemo } from 'react';

const wordCount = useMemo(() => countWords(value), [value]);
```

### Debounce Filter Changes
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value: string) => setSearch(value),
  300
);
```

---

## Security Patterns

### Always Use ReactMarkdown (Never dangerouslySetInnerHTML)
```typescript
// GOOD: XSS-safe
<ReactMarkdown>{aiResponse}</ReactMarkdown>

// BAD: XSS risk
<div dangerouslySetInnerHTML={{ __html: aiResponse }} />
```

### Validate All User Input
```typescript
// Character limits enforced
<GlassInput maxLength={QUESTION_LIMITS.dream} />

// Backend validates again (defense in depth)
```

---

This patterns document provides copy-pasteable, working code for all major operations in iteration 14. Builders should use these patterns exactly as shown for consistency.
