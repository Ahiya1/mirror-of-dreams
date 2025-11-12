# Code Patterns & Conventions - Iteration 20

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── dreams/
│   │   └── [id]/
│   │       └── page.tsx           # Dream detail page (ADD evolution/viz buttons)
│   ├── evolution/
│   │   ├── page.tsx               # Evolution list + generation
│   │   └── [id]/
│   │       └── page.tsx           # Evolution detail (ADD markdown rendering)
│   ├── visualizations/
│   │   ├── page.tsx               # Visualization list + generation
│   │   └── [id]/
│   │       └── page.tsx           # Visualization detail (ADD immersive formatting)
│   └── dashboard/
│       └── page.tsx               # Main dashboard (uses cards)
├── components/
│   ├── ui/
│   │   └── glass/
│   │       ├── GlassCard.tsx      # Base glass card component
│   │       ├── GlowButton.tsx     # Button with glow effects
│   │       ├── CosmicLoader.tsx   # Loading spinner
│   │       └── GradientText.tsx   # Gradient text component
│   └── dashboard/
│       └── cards/
│           ├── EvolutionCard.tsx  # Evolution preview card (REBUILD)
│           ├── VisualizationCard.tsx  # NEW - Visualization preview card
│           ├── DreamsCard.tsx     # Dreams list card
│           └── ReflectionsCard.tsx # Recent reflections card
├── lib/
│   ├── trpc.ts                    # tRPC client setup
│   ├── hooks/
│   │   └── useEligibility.ts      # NEW - Shared eligibility logic
│   └── utils.ts                   # Utility functions
└── server/
    └── trpc/
        └── routers/
            ├── evolution.ts       # Evolution backend (COMPLETE)
            ├── visualizations.ts  # Visualizations backend (COMPLETE)
            └── reflections.ts     # Reflections backend

```

## Naming Conventions

- **Components:** PascalCase (`EvolutionCard.tsx`, `CosmicLoader.tsx`)
- **Files (non-components):** camelCase (`useEligibility.ts`, `trpc.ts`)
- **Types:** PascalCase (`EvolutionReport`, `Visualization`, `DreamEligibility`)
- **Functions:** camelCase (`calculateEligibility()`, `formatReportText()`)
- **Constants:** SCREAMING_SNAKE_CASE (`MIN_REFLECTIONS_THRESHOLD`, `GENERATION_TIMEOUT`)
- **CSS Classes:** kebab-case (`dream-detail`, `evolution-card`) OR Tailwind utilities

---

## tRPC Query Patterns

### Pattern: Fetch Data with Loading State

**When to use:** Any component that displays server data

**Code example:**

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

export default function EvolutionReportsPage() {
  const { data: reports, isLoading, error } = trpc.evolution.list.useQuery({
    page: 1,
    limit: 10,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CosmicLoader size="lg" label="Loading evolution reports..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 p-8">
        <p>Failed to load reports: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reports?.items.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
```

**Key points:**
- Always handle `isLoading` state with CosmicLoader
- Always handle `error` state with user-friendly message
- Use optional chaining for data (`reports?.items`)
- TanStack Query caches responses automatically (5 min default)

---

### Pattern: Mutation with Loading State and Redirect

**When to use:** Generate evolution report, create reflection, any long-running operation

**Code example:**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

export function GenerateEvolutionButton({ dreamId }: { dreamId: string }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = trpc.evolution.generateDreamEvolution.useMutation({
    onSuccess: (data) => {
      setIsGenerating(false);
      router.push(`/evolution/${data.reportId}`);
    },
    onError: (error) => {
      setIsGenerating(false);
      alert(`Failed to generate report: ${error.message}`);
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    generateReport.mutate({ dreamId });
  };

  return (
    <div className="relative">
      {isGenerating ? (
        <div className="flex flex-col items-center space-y-4">
          <CosmicLoader size="lg" label="Generating evolution report..." />
          <p className="text-mirror-indigo text-sm">
            Analyzing your journey across time... (this takes ~30 seconds)
          </p>
          <p className="text-mirror-purple text-xs">
            Don't close this tab
          </p>
        </div>
      ) : (
        <GlowButton
          onClick={handleGenerate}
          className="w-full"
          disabled={generateReport.isLoading}
        >
          Generate Evolution Report
        </GlowButton>
      )}
    </div>
  );
}
```

**Key points:**
- Use local state (`isGenerating`) for loading UI control
- Show CosmicLoader with helpful message during generation
- Redirect to detail page on success
- Show alert on error (consider toast library post-MVP)
- Disable button while loading to prevent double-submit

---

### Pattern: Client-Side Eligibility Calculation

**When to use:** Dream detail page checking if user can generate evolution/visualization

**Code example:**

```typescript
'use client';

import { trpc } from '@/lib/trpc';

const MIN_REFLECTIONS_FOR_EVOLUTION = 4;

export default function DreamDetailPage({ params }: { params: { id: string } }) {
  const { data: dream } = trpc.dreams.get.useQuery({ id: params.id });

  const { data: allReflections } = trpc.reflections.list.useQuery({
    page: 1,
    limit: 100, // Fetch all reflections
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Filter reflections for this specific dream
  const dreamReflections = allReflections?.items?.filter(
    (r) => r.dream_id === params.id
  ) || [];

  const reflectionCount = dreamReflections.length;
  const isEligibleForEvolution = reflectionCount >= MIN_REFLECTIONS_FOR_EVOLUTION;
  const remainingReflections = Math.max(0, MIN_REFLECTIONS_FOR_EVOLUTION - reflectionCount);

  return (
    <div>
      <h1>{dream?.title}</h1>

      {/* Eligibility Status */}
      <div className="mb-6">
        {isEligibleForEvolution ? (
          <div className="text-green-400">
            ✨ You can generate an evolution report!
          </div>
        ) : (
          <div className="text-mirror-indigo">
            You have {reflectionCount} reflections.
            Create {remainingReflections} more to unlock evolution reports.
          </div>
        )}
      </div>

      {/* Generate Button */}
      {isEligibleForEvolution && (
        <GenerateEvolutionButton dreamId={params.id} />
      )}
    </div>
  );
}
```

**Key points:**
- No backend call needed for eligibility (reflections already fetched)
- Filter client-side: `reflections.filter(r => r.dream_id === dreamId)`
- Show clear messaging: "Create X more reflections to unlock"
- Only show generate button when eligible

---

## Markdown Rendering Pattern

### Pattern: Evolution Report with Cosmic Styling

**When to use:** `/app/evolution/[id]/page.tsx` displaying evolution report text

**Code example:**

```typescript
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GradientText } from '@/components/ui/glass/GradientText';

export function EvolutionReportDisplay({ report }: { report: EvolutionReport }) {
  return (
    <GlassCard variant="elevated" className="p-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with gradient text
          h1: ({ node, ...props }) => (
            <GradientText
              gradient="cosmic"
              className="text-4xl font-bold mb-6 mt-8"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <GradientText
              gradient="cosmic"
              className="text-3xl font-bold mb-4 mt-6"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-2xl font-semibold text-mirror-purple mb-3 mt-4"
              {...props}
            />
          ),

          // Emphasis with cosmic colors
          strong: ({ node, ...props }) => (
            <strong className="text-mirror-purple font-semibold" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="text-mirror-indigo italic" {...props} />
          ),

          // Lists with proper spacing
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-2 ml-4 my-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 ml-4 my-4" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-mirror-silver leading-relaxed" {...props} />
          ),

          // Paragraphs with generous spacing
          p: ({ node, ...props }) => (
            <p className="text-mirror-silver leading-relaxed mb-4" {...props} />
          ),

          // Blockquotes (if AI uses them)
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-mirror-purple pl-4 my-4 italic text-mirror-indigo"
              {...props}
            />
          ),
        }}
        className="prose prose-invert prose-purple max-w-none"
      >
        {report.evolution}
      </ReactMarkdown>
    </GlassCard>
  );
}
```

**Key points:**
- Use `react-markdown` with `remark-gfm` plugin for GitHub Flavored Markdown
- Apply GradientText to h1/h2 for cosmic aesthetic
- Use `text-mirror-purple` and `text-mirror-indigo` for semantic emphasis
- Generous spacing: `mb-4` on paragraphs, `my-4` on lists
- Leading-relaxed (1.625 line-height) for readability
- Wrap in GlassCard with elevated variant for depth

**Installation (if not present):**
```bash
npm install react-markdown remark-gfm
```

---

## Immersive Visualization Formatting

### Pattern: Achievement Narrative Display

**When to use:** `/app/visualizations/[id]/page.tsx` displaying achievement narrative

**Code example:**

```typescript
'use client';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GradientText } from '@/components/ui/glass/GradientText';

export function AchievementNarrativeDisplay({
  visualization
}: {
  visualization: Visualization
}) {
  // Highlight "I am..." and "I'm..." phrases with gradient
  const highlightAchievementPhrases = (text: string) => {
    const parts = text.split(/(\b(?:I am|I'm|I've|I have achieved|I stand)\b)/gi);

    return parts.map((part, index) => {
      if (/^(I am|I'm|I've|I have achieved|I stand)$/i.test(part)) {
        return (
          <GradientText key={index} gradient="cosmic" className="font-semibold">
            {part}
          </GradientText>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Split into paragraphs for better formatting
  const paragraphs = visualization.content.split('\n\n');

  return (
    <GlassCard variant="elevated" className="p-10 max-w-4xl mx-auto">
      <div className="space-y-6">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="text-lg md:text-xl text-mirror-silver leading-loose tracking-wide"
            style={{ lineHeight: '1.8' }}
          >
            {highlightAchievementPhrases(paragraph)}
          </p>
        ))}
      </div>

      {/* Immersive gradient glow effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-mirror-purple rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-mirror-indigo rounded-full blur-3xl" />
      </div>
    </GlassCard>
  );
}
```

**Key points:**
- Large text: `text-lg md:text-xl` (18-20px)
- Generous line-height: `leading-loose` (2.0) or `style={{ lineHeight: '1.8' }}`
- Highlight achievement phrases: "I am", "I'm", "I've achieved" with GradientText
- Paragraph spacing: `space-y-6` (24px between paragraphs)
- Letter spacing: `tracking-wide` for immersive feel
- Background glow effect for cosmic atmosphere (low opacity blur)
- Max width for comfortable reading: `max-w-4xl mx-auto`

**Immersive Criteria Checklist:**
- [ ] Text size 18-20px (desktop)
- [ ] Line height 1.8-2.0
- [ ] Gradient highlights on "I am" phrases
- [ ] Background glow effects (optional but recommended)
- [ ] Generous paragraph spacing (6-8 spacing units)
- [ ] Letter tracking wide for gravitas

---

## Glass Component Usage

### Pattern: GlassCard with Variants

**When to use:** Wrap content sections, cards, modal overlays

**Code example:**

```typescript
import { GlassCard } from '@/components/ui/glass/GlassCard';

// Default card (standard glass effect)
<GlassCard className="p-6">
  <h2>Recent Reflections</h2>
  <p>Content here...</p>
</GlassCard>

// Elevated card (stronger glow, breathing animation)
<GlassCard variant="elevated" glowColor="cosmic" className="p-8">
  <h1>Evolution Report</h1>
  <p>Important content with prominence...</p>
</GlassCard>

// Inset card (subtle, background element)
<GlassCard variant="inset" hoverable={false} className="p-4">
  <p>Supporting information...</p>
</GlassCard>

// Non-animated card (for lists)
<GlassCard animated={false} className="p-4">
  <p>List item content...</p>
</GlassCard>
```

**Variants:**
- `default`: Standard glass card, medium blur, subtle glow on hover
- `elevated`: Stronger shadow, breathing animation, prominent glow
- `inset`: Subtle, recessed look, less prominent

**Glow Colors:**
- `purple`: Default purple glow (mirror-purple)
- `blue`: Blue glow (mirror-blue)
- `cosmic`: Multi-color cosmic glow (purple + indigo)
- `electric`: Bright electric glow

**Key points:**
- Always use GlassCard for content containers (not plain divs)
- Use `variant="elevated"` for primary content (reports, visualizations)
- Use `animated={false}` for list items (performance)
- Set `hoverable={false}` for non-interactive cards

---

### Pattern: CosmicLoader for Long Operations

**When to use:** AI generation (30-45s), any operation >2 seconds

**Code example:**

```typescript
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

// During evolution report generation
{isGenerating && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <CosmicLoader size="lg" label="Generating evolution report" />
      <div className="space-y-2">
        <p className="text-mirror-indigo text-lg">
          Analyzing your journey across time...
        </p>
        <p className="text-mirror-purple text-sm">
          This takes ~30 seconds
        </p>
        <p className="text-mirror-silver text-xs">
          Don't close this tab
        </p>
      </div>
    </div>
  </div>
)}

// Simple inline loader
<div className="flex justify-center py-12">
  <CosmicLoader size="md" />
</div>

// Small loader for buttons
<GlowButton disabled>
  <CosmicLoader size="sm" className="mr-2" />
  Generating...
</GlowButton>
```

**Sizes:**
- `sm`: 32px (8rem), for inline/button use
- `md`: 64px (16rem), default for page loading
- `lg`: 96px (24rem), for full-screen modal loading

**Key points:**
- Use full-screen overlay (`fixed inset-0`) for long operations
- Always provide context message ("Analyzing your journey...")
- Include time estimate ("~30 seconds")
- Add "Don't close this tab" warning for operations >10s
- Use `backdrop-blur-sm` for overlay (glass effect)

---

### Pattern: GlowButton with States

**When to use:** Primary actions, generate buttons, submit buttons

**Code example:**

```typescript
import { GlowButton } from '@/components/ui/glass/GlowButton';

// Primary action
<GlowButton onClick={handleGenerate} size="lg">
  Generate Evolution Report
</GlowButton>

// Disabled state
<GlowButton disabled>
  Insufficient Reflections
</GlowButton>

// Loading state
<GlowButton disabled>
  <CosmicLoader size="sm" className="mr-2" />
  Generating...
</GlowButton>

// Secondary action (less prominent)
<GlowButton variant="secondary" onClick={handleCancel}>
  Cancel
</GlowButton>

// Full width
<GlowButton className="w-full" onClick={handleAction}>
  Continue
</GlowButton>

// With icon
<GlowButton onClick={handleReflect}>
  <span className="mr-2">✨</span>
  Reflect Now
</GlowButton>
```

**Key points:**
- Use for primary actions only (don't overuse)
- Always disable during loading (prevent double-submit)
- Show CosmicLoader inside button during async operations
- Full width for mobile-first layouts
- Emojis/icons add personality (align with vision's tone)

---

## Dashboard Card Patterns

### Pattern: EvolutionCard with Real Data

**When to use:** Dashboard evolution preview card

**Code example:**

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GradientText } from '@/components/ui/glass/GradientText';
import { useRouter } from 'next/navigation';

export function EvolutionCard() {
  const router = useRouter();

  // Fetch latest evolution report
  const { data: reports } = trpc.evolution.list.useQuery({
    page: 1,
    limit: 1,
  });

  // Fetch eligibility
  const { data: eligibility } = trpc.evolution.checkEligibility.useQuery();

  const latestReport = reports?.items[0];

  return (
    <GlassCard variant="elevated" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <GradientText gradient="cosmic" className="text-2xl font-bold">
          Evolution Reports
        </GradientText>
      </div>

      {latestReport ? (
        <div className="space-y-4">
          {/* Latest Report Preview */}
          <div
            onClick={() => router.push(`/evolution/${latestReport.id}`)}
            className="cursor-pointer hover:bg-white/5 p-4 rounded-lg transition-colors"
          >
            <p className="text-sm text-mirror-indigo mb-2">
              Latest Report • {new Date(latestReport.created_at).toLocaleDateString()}
            </p>
            <p className="text-mirror-silver text-sm line-clamp-3">
              {latestReport.evolution.substring(0, 200)}...
            </p>
          </div>

          {/* View All Link */}
          <button
            onClick={() => router.push('/evolution')}
            className="text-mirror-purple hover:text-mirror-indigo text-sm transition-colors"
          >
            View all reports →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* No Reports Yet */}
          {eligibility?.eligible ? (
            <div>
              <p className="text-mirror-silver mb-4">
                ✨ You can generate your first evolution report!
              </p>
              <GlowButton
                onClick={() => router.push('/evolution')}
                className="w-full"
              >
                Generate Report
              </GlowButton>
            </div>
          ) : (
            <div>
              <p className="text-mirror-indigo mb-2">
                Create {eligibility?.reason || 'more'} reflections to unlock evolution reports
              </p>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-mirror-purple to-mirror-indigo h-2 rounded-full transition-all"
                  style={{ width: `${eligibility?.progress || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
```

**Key points:**
- Fetch latest report: `trpc.evolution.list.useQuery({ page: 1, limit: 1 })`
- Show preview (first 200 characters) with `line-clamp-3`
- Click preview to view full report
- If no reports, show eligibility status with progress bar
- Generate button links to `/evolution` page
- Use GradientText for card header

---

### Pattern: VisualizationCard (NEW Component)

**When to use:** Dashboard visualization preview card

**Code example:**

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GradientText } from '@/components/ui/glass/GradientText';
import { useRouter } from 'next/navigation';

export function VisualizationCard() {
  const router = useRouter();

  const { data: visualizations } = trpc.visualizations.list.useQuery({
    page: 1,
    limit: 1,
  });

  const latestViz = visualizations?.items[0];

  const styleIcons: Record<string, string> = {
    achievement: '🏔️',
    spiral: '🌀',
    synthesis: '🌌',
  };

  return (
    <GlassCard variant="elevated" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <GradientText gradient="cosmic" className="text-2xl font-bold">
          Visualizations
        </GradientText>
      </div>

      {latestViz ? (
        <div className="space-y-4">
          <div
            onClick={() => router.push(`/visualizations/${latestViz.id}`)}
            className="cursor-pointer hover:bg-white/5 p-4 rounded-lg transition-colors"
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">
                {styleIcons[latestViz.style]}
              </span>
              <p className="text-sm text-mirror-indigo">
                {latestViz.style.charAt(0).toUpperCase() + latestViz.style.slice(1)} Style
              </p>
            </div>
            <p className="text-mirror-silver text-sm line-clamp-3">
              {latestViz.content.substring(0, 150)}...
            </p>
          </div>

          <button
            onClick={() => router.push('/visualizations')}
            className="text-mirror-purple hover:text-mirror-indigo text-sm transition-colors"
          >
            View all visualizations →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-mirror-indigo">
            Generate your first visualization to experience your dream as already achieved.
          </p>
          <GlowButton
            onClick={() => router.push('/visualizations')}
            className="w-full"
          >
            Create Visualization
          </GlowButton>
        </div>
      )}
    </GlassCard>
  );
}
```

**Key points:**
- Similar structure to EvolutionCard (consistency)
- Show style icon (🏔️ / 🌀 / 🌌) for visual distinction
- Preview shorter (150 chars) - visualizations are longer
- No eligibility check needed (same as evolution, 4 reflections)
- Link to `/visualizations` page for generation

---

## Error Handling Patterns

### Pattern: tRPC Error Handling

**When to use:** All mutations and critical queries

**Code example:**

```typescript
import { TRPCClientError } from '@trpc/client';

// In mutation
const generateReport = trpc.evolution.generateDreamEvolution.useMutation({
  onSuccess: (data) => {
    router.push(`/evolution/${data.reportId}`);
  },
  onError: (error) => {
    if (error instanceof TRPCClientError) {
      // Usage limit reached
      if (error.message.includes('limit')) {
        alert('You have reached your monthly limit for evolution reports. Upgrade to Optimal tier for more reports.');
      }
      // Insufficient reflections
      else if (error.message.includes('reflections')) {
        alert('You need at least 4 reflections to generate an evolution report.');
      }
      // Generic error
      else {
        alert(`Failed to generate report: ${error.message}`);
      }
    } else {
      alert('An unexpected error occurred. Please try again.');
    }
  },
});

// In query with error fallback
const { data: dream, error } = trpc.dreams.get.useQuery({ id: params.id });

if (error) {
  return (
    <GlassCard className="p-8 text-center">
      <p className="text-red-400 mb-4">Failed to load dream</p>
      <p className="text-mirror-silver text-sm">{error.message}</p>
      <GlowButton onClick={() => router.back()} className="mt-4">
        Go Back
      </GlowButton>
    </GlassCard>
  );
}
```

**Key points:**
- Check error type: `instanceof TRPCClientError`
- Provide specific messages for known errors (limits, eligibility)
- Generic fallback for unexpected errors
- Always give user an action (button to go back, retry, etc.)
- Consider toast library for better UX (post-MVP)

---

## Import Order Convention

**Standard import order for all components:**

```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

// 3. tRPC and API
import { trpc } from '@/lib/trpc';

// 4. Custom hooks
import { useAuth } from '@/lib/hooks/useAuth';
import { useEligibility } from '@/lib/hooks/useEligibility';

// 5. Components (Glass UI first, then others)
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GradientText } from '@/components/ui/glass/GradientText';
import { DreamCard } from '@/components/dreams/DreamCard';

// 6. Utilities and types
import { cn } from '@/lib/utils';
import type { Dream, EvolutionReport } from '@/types';

// 7. Constants
import { MIN_REFLECTIONS_THRESHOLD } from '@/lib/constants';
```

**Key points:**
- React imports first
- Third-party before local
- tRPC separate from other imports (it's critical)
- Glass components before feature components
- Types imported with `type` keyword
- Constants last

---

## Code Quality Standards

### Standard: Loading States Required

**Description:** Every async operation must show loading state (no blank screens)

**Example:**

```typescript
// GOOD - Shows loader
const { data, isLoading } = trpc.dreams.list.useQuery();

if (isLoading) return <CosmicLoader size="lg" />;

return <DreamsList dreams={data.items} />;

// BAD - Blank screen while loading
const { data } = trpc.dreams.list.useQuery();

return <DreamsList dreams={data?.items} />; // Blank screen until data arrives
```

---

### Standard: Error States Required

**Description:** Every query must handle error state

**Example:**

```typescript
// GOOD - Handles error
const { data, error } = trpc.dreams.get.useQuery({ id });

if (error) {
  return <ErrorCard message={error.message} />;
}

// BAD - No error handling
const { data } = trpc.dreams.get.useQuery({ id });

return <DreamDetail dream={data} />; // Crashes if error occurs
```

---

### Standard: No `any` Types (Except Error Handling)

**Description:** Use TypeScript types, avoid `any`

**Example:**

```typescript
// GOOD - Typed
const dreamReflections = reflections?.items?.filter(
  (r: Reflection) => r.dream_id === dreamId
);

// ACCEPTABLE - Error handling
try {
  await mutation.mutateAsync();
} catch (error: any) {
  // Error type is unknown, `any` acceptable here
  alert(error.message);
}

// BAD - Untyped
const dreamReflections = reflections?.items?.filter(
  (r: any) => r.dream_id === dreamId
);
```

---

## Performance Patterns

### Pattern: Disable Animation for List Items

**When to use:** Lists with >5 items

**Code example:**

```typescript
// GOOD - No animation for list items
{reports.items.map((report) => (
  <GlassCard key={report.id} animated={false} className="p-4">
    <ReportPreview report={report} />
  </GlassCard>
))}

// BAD - Animates every item (janky with many items)
{reports.items.map((report) => (
  <GlassCard key={report.id} className="p-4">
    <ReportPreview report={report} />
  </GlassCard>
))}
```

---

### Pattern: Use Optional Chaining for Nested Data

**When to use:** Accessing nested properties from queries

**Code example:**

```typescript
// GOOD - Safe access
const reflectionCount = reflections?.items?.length ?? 0;
const dreamTitle = dream?.title ?? 'Untitled Dream';

// BAD - Can crash
const reflectionCount = reflections.items.length; // Crashes if null
```

---

## Security Patterns

### Pattern: Never Expose API Keys Client-Side

**Description:** ANTHROPIC_API_KEY only in backend (Vercel environment)

**Code example:**

```typescript
// GOOD - API call in tRPC router (server-side)
// server/trpc/routers/evolution.ts
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Server-side only
});

// BAD - API key in client component
// app/evolution/page.tsx
const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY, // EXPOSED TO CLIENT
});
```

**Key points:**
- All AI calls happen in tRPC routers (server-side)
- Frontend only calls tRPC endpoints (no direct API access)
- Use `NEXT_PUBLIC_` prefix ONLY for public values (Supabase URL is safe)

---

### Pattern: Sanitize User Input (Reflections)

**Description:** Treat user reflections as plain text, not HTML

**Code example:**

```typescript
// GOOD - Displayed as plain text
<p className="whitespace-pre-wrap">{reflection.answer}</p>

// BAD - Allows XSS
<div dangerouslySetInnerHTML={{ __html: reflection.answer }} />
```

**Key points:**
- Never use `dangerouslySetInnerHTML` for user content
- Evolution reports are AI-generated (trusted) but still use markdown parser (safe)
- Reflection answers are plain text only (no markdown allowed from users)

---

## Testing Checklist (Manual)

### Before Marking Iteration Complete:

1. **Evolution Report Generation:**
   - [ ] Create dream with 4 reflections
   - [ ] See "Generate Evolution Report" button on dream detail page
   - [ ] Click button, see CosmicLoader with message
   - [ ] Wait ~30-45 seconds (don't navigate away)
   - [ ] Report displays with formatted markdown (headers, bold, lists)
   - [ ] Markdown uses cosmic colors (purple headers, indigo emphasis)

2. **Visualization Generation:**
   - [ ] Click "Generate Visualization" button on dream detail page
   - [ ] See CosmicLoader with message
   - [ ] Wait ~25-35 seconds
   - [ ] Narrative displays with large text (18-20px)
   - [ ] "I am..." phrases highlighted with gradient
   - [ ] Line height is generous (1.8+)

3. **Dashboard Integration:**
   - [ ] EvolutionCard shows latest report preview (not "Coming Soon")
   - [ ] Click preview, navigates to full report
   - [ ] VisualizationCard shows latest visualization preview
   - [ ] Recent Reflections shows last 3 reflections across dreams
   - [ ] Usage tracking shows reflections count (evolution/viz optional)

4. **Eligibility Checks:**
   - [ ] Dream with 0 reflections shows "Create 4 reflections to unlock"
   - [ ] Dream with 2 reflections shows "Create 2 more reflections to unlock"
   - [ ] Dream with 4 reflections shows "Generate" buttons
   - [ ] Free tier user blocked from evolution (or shows upgrade prompt)
   - [ ] Free tier user can generate 1 visualization per month

5. **Error Handling:**
   - [ ] Try generating 2nd evolution in same month (Free tier) → Error message clear
   - [ ] Try generating with <4 reflections → Error message clear
   - [ ] Navigate away during generation → Confirm "Don't close tab" warning shown
   - [ ] Network error during generation → Error message shown, not blank screen

6. **Console Errors:**
   - [ ] Open browser console (F12)
   - [ ] Complete full Sarah's journey (create dream → 4 reflections → evolution → viz)
   - [ ] Zero red errors in console
   - [ ] Yellow warnings acceptable (React dev mode warnings OK)

---

**Patterns Status:** FINALIZED
**Total Patterns Documented:** 15+ with full code examples
**Ready for:** Builder implementation
**Copy-Paste Ready:** All code examples work as-is
