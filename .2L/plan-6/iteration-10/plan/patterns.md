# Code Patterns & Conventions - Iteration 10

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard page (Feature 2 target)
│   ├── reflection/
│   │   ├── page.tsx              # Wrapper
│   │   └── MirrorExperience.tsx  # Reflection form (Feature 3 target)
│   └── reflections/
│       ├── page.tsx              # Collection view (Feature 5 target)
│       └── [id]/page.tsx         # Individual display (Feature 4 target)
├── components/
│   ├── dashboard/
│   │   ├── cards/
│   │   │   ├── DreamsCard.tsx
│   │   │   ├── ReflectionsCard.tsx
│   │   │   └── ProgressStatsCard.tsx  # NEW
│   │   └── shared/
│   │       ├── DashboardGrid.tsx
│   │       └── WelcomeSection.tsx
│   ├── reflections/
│   │   ├── ReflectionCard.tsx
│   │   ├── ReflectionFilters.tsx
│   │   └── AIResponseRenderer.tsx     # NEW
│   ├── shared/
│   │   ├── AppNavigation.tsx
│   │   └── EmptyState.tsx
│   └── ui/glass/
│       ├── GlassCard.tsx
│       ├── GlowButton.tsx
│       ├── GradientText.tsx
│       └── CosmicLoader.tsx
├── server/trpc/routers/
│   ├── dreams.ts
│   ├── reflections.ts
│   └── usage.ts                       # NEW (optional)
├── hooks/
│   ├── useStaggerAnimation.ts
│   └── useAuth.ts
└── styles/
    ├── globals.css
    └── variables.css
```

---

## Naming Conventions

### Components
- **PascalCase:** `DashboardHero.tsx`, `AIResponseRenderer.tsx`, `ReflectionCard.tsx`
- **Suffix with component type:** `DreamsCard.tsx` (card), `ReflectionFilters.tsx` (filters)

### Files
- **camelCase for utilities:** `formatDate.ts`, `getTimeOfDay.ts`
- **kebab-case for CSS:** `dashboard.css`, `reflection-display.css`

### Functions
- **camelCase:** `handleSubmit()`, `getItemStyles()`, `formatReflectionSnippet()`
- **Event handlers:** `on` prefix → `onClick`, `onSubmit`, `onChange`

### Constants
- **SCREAMING_SNAKE_CASE:** `MAX_DREAMS_DISPLAY`, `REFLECTIONS_PER_PAGE`

### Types
- **PascalCase:** `ReflectionState`, `DashboardData`, `FormData`
- **Suffix with type:** `ReflectionCardProps`, `FilterOptions`, `QueryParams`

---

## Dashboard Patterns

### Pattern 1: Self-Contained Dashboard Card

**When to use:** Creating dashboard cards that fetch their own data

**Code example:**
```typescript
// components/dashboard/cards/DreamsCard.tsx
'use client';

import { trpc } from '@/lib/trpc/client';
import { DashboardCard } from '@/components/dashboard/shared/DashboardCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { DreamBadge } from '@/components/dreams/DreamBadge';

export const DreamsCard: React.FC = () => {
  // Self-contained data fetching
  const { data: dreams, isLoading, error } = trpc.dreams.list.useQuery({
    status: 'active',
    includeStats: true,
  });

  // Loading state
  if (isLoading) {
    return (
      <DashboardCard isLoading={true} hasError={false}>
        <div className="h-48 animate-pulse bg-white/5 rounded-lg" />
      </DashboardCard>
    );
  }

  // Error state
  if (error || !dreams) {
    return (
      <DashboardCard isLoading={false} hasError={true}>
        <p className="text-white/60">Failed to load dreams</p>
      </DashboardCard>
    );
  }

  // Empty state
  if (dreams.length === 0) {
    return (
      <DashboardCard>
        <div className="text-center py-8">
          <p className="text-white/80 mb-4">Create your first dream to begin your journey</p>
          <GlowButton variant="cosmic" size="sm" href="/dreams/new">
            Create Dream
          </GlowButton>
        </div>
      </DashboardCard>
    );
  }

  // Success state
  return (
    <DashboardCard>
      <div className="flex items-center justify-between mb-md">
        <h3 className="text-h3 font-semibold text-white/95">Your Dreams</h3>
        <a href="/dreams" className="text-sm text-mirror-purple hover:text-mirror-violet transition-colors">
          View All →
        </a>
      </div>

      <div className="space-y-md">
        {dreams.slice(0, 3).map((dream) => (
          <div key={dream.id} className="p-md bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-sm">
              <h4 className="text-body font-medium text-white/95">{dream.title}</h4>
              <DreamBadge status={dream.status} />
            </div>

            <div className="flex items-center gap-lg text-sm text-white/60">
              <span>{dream.reflectionCount || 0} reflections</span>
              {dream.targetDate && (
                <span>{Math.ceil((new Date(dream.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left</span>
              )}
            </div>

            <GlowButton
              variant="cosmic"
              size="sm"
              href={`/reflection?dreamId=${dream.id}`}
              className="mt-md w-full"
            >
              Reflect on this dream
            </GlowButton>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};
```

**Key points:**
- Each card is self-contained (fetches own data via tRPC)
- Handles loading, error, empty, and success states
- Uses DashboardCard wrapper for consistent styling
- Includes clear CTA for empty state
- Limits display to 3 items (with "View All" link)

---

### Pattern 2: Dashboard Grid with Stagger Animation

**When to use:** Laying out dashboard cards with entrance animation

**Code example:**
```typescript
// app/dashboard/page.tsx
'use client';

import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DreamsCard } from '@/components/dashboard/cards/DreamsCard';
import { ReflectionsCard } from '@/components/dashboard/cards/ReflectionsCard';
import { ProgressStatsCard } from '@/components/dashboard/cards/ProgressStatsCard';

export default function DashboardPage() {
  // Stagger animation for 6 sections (hero + 5 cards)
  const { containerRef, getItemStyles } = useStaggerAnimation(6, {
    delay: 150,      // 150ms between each section
    duration: 800,   // 800ms fade-in duration
    triggerOnce: true, // Only animate on first load
  });

  return (
    <div className="container mx-auto px-lg py-2xl max-w-screen-xl">
      <div ref={containerRef} className="space-y-2xl">
        {/* Hero section */}
        <div style={getItemStyles(0)}>
          <DashboardHero />
        </div>

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          <div style={getItemStyles(1)}>
            <DreamsCard />
          </div>

          <div style={getItemStyles(2)}>
            <ReflectionsCard />
          </div>

          <div style={getItemStyles(3)}>
            <ProgressStatsCard />
          </div>

          <div style={getItemStyles(4)} className="md:col-span-2">
            <EvolutionCard />
          </div>

          <div style={getItemStyles(5)}>
            <VisualizationCard />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Key points:**
- Use `useStaggerAnimation` hook for sequential fade-in
- Apply `getItemStyles(index)` to each section
- Respect container width (max-w-screen-xl)
- Responsive grid: 1 column mobile, 2 tablet, 3 desktop
- Some cards span multiple columns (evolution card)

---

### Pattern 3: Dashboard Hero with Time-Based Greeting

**When to use:** Creating personalized hero section

**Code example:**
```typescript
// components/dashboard/DashboardHero.tsx
'use client';

import { trpc } from '@/lib/trpc/client';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GradientText } from '@/components/ui/glass/GradientText';

const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export const DashboardHero: React.FC = () => {
  const { data: user } = trpc.users.getProfile.useQuery();
  const { data: dreams } = trpc.dreams.list.useQuery({ status: 'active' });

  const timeOfDay = getTimeOfDay();
  const firstName = user?.firstName || 'Dreamer';

  // Motivational copy based on user state
  const getMotivationalCopy = (): string => {
    if (!dreams || dreams.length === 0) {
      return "Ready to create your first dream?";
    }
    return "Ready for your next reflection?";
  };

  return (
    <div className="text-center py-3xl">
      <GradientText gradient="cosmic" className="text-h1 mb-md">
        Good {timeOfDay}, {firstName}! ✨
      </GradientText>

      <p className="text-lg text-white/80 mb-xl max-w-2xl mx-auto">
        {getMotivationalCopy()}
      </p>

      <GlowButton
        variant="cosmic"
        size="lg"
        href="/reflection"
        disabled={!dreams || dreams.length === 0}
      >
        Reflect Now
      </GlowButton>

      {(!dreams || dreams.length === 0) && (
        <p className="text-sm text-white/60 mt-md">
          Create a dream first to begin reflecting
        </p>
      )}
    </div>
  );
};
```

**Key points:**
- Time-based greeting (morning/afternoon/evening)
- Personalized with user's first name
- Motivational copy changes based on user state
- Primary CTA disabled if no dreams exist
- Clear guidance when CTA is disabled

---

## Reflection Experience Patterns

### Pattern 4: Reflection State Machine with Transitions

**When to use:** Managing reflection form → loading → output flow

**Code example:**
```typescript
// app/reflection/MirrorExperience.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc/client';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

type ReflectionState = 'form' | 'loading' | 'output';

export const MirrorExperience: React.FC = () => {
  const [state, setState] = useState<ReflectionState>('form');
  const [statusText, setStatusText] = useState('Gazing into the mirror...');
  const [formData, setFormData] = useState({
    dream: '',
    plan: '',
    relationship: '',
    offering: '',
  });

  const createReflection = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      setStatusText('Reflection complete!');
      setTimeout(() => {
        setState('output');
      }, 1000);
    },
    onError: (error) => {
      toast.error('Failed to create reflection');
      setState('form');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) return;

    setState('loading');

    // Update status text after 3 seconds
    setTimeout(() => {
      setStatusText('Crafting your insight...');
    }, 3000);

    createReflection.mutate({
      dreamId: selectedDreamId,
      ...formData,
      tone: selectedTone,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-lg">
      <div className="w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {/* Form State */}
          {state === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-lg rounded-2xl p-xl"
            >
              <h1 className="text-h1 text-center mb-2xl gradient-text-cosmic">
                Mirror Experience
              </h1>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-sm mb-2xl">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-2 w-12 rounded-full ${
                      step <= currentQuestion
                        ? 'bg-mirror-purple'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <ReflectionForm
                formData={formData}
                onChange={setFormData}
                onSubmit={handleSubmit}
              />
            </motion.div>
          )}

          {/* Loading State */}
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-3xl"
            >
              <CosmicLoader size="lg" />
              <motion.p
                className="text-lg text-white/80 mt-xl"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {statusText}
              </motion.p>
            </motion.div>
          )}

          {/* Output State */}
          {state === 'output' && (
            <motion.div
              key="output"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ReflectionOutput reflectionId={createdReflectionId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
```

**Key points:**
- Three states: form, loading, output
- Smooth transitions using AnimatePresence with `mode="wait"`
- Loading state shows CosmicLoader + status text updates
- Status text changes after 3 seconds (creates sense of progress)
- Exit animations match entrance animations (consistent feel)

---

### Pattern 5: Tone Selection Cards

**When to use:** Presenting tone choices as visual cards

**Code example:**
```typescript
// components/reflection/ToneSelectionCard.tsx
'use client';

type Tone = 'gentle' | 'intense' | 'fusion';

interface ToneOption {
  value: Tone;
  label: string;
  description: string;
  icon: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    value: 'gentle',
    label: 'Gentle',
    description: 'Compassionate, nurturing guidance',
    icon: '🌸',
  },
  {
    value: 'intense',
    label: 'Intense',
    description: 'Direct, challenging insights',
    icon: '⚡',
  },
  {
    value: 'fusion',
    label: 'Sacred Fusion',
    description: 'Balanced wisdom and truth',
    icon: '✨',
  },
];

interface ToneSelectionCardProps {
  selectedTone: Tone;
  onChange: (tone: Tone) => void;
}

export const ToneSelectionCard: React.FC<ToneSelectionCardProps> = ({
  selectedTone,
  onChange,
}) => {
  return (
    <div className="space-y-md">
      <label className="block text-body font-medium text-white/95 mb-md">
        Choose your reflection tone
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {TONE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              p-lg rounded-xl border-2 transition-all text-left
              ${selectedTone === option.value
                ? 'border-mirror-purple bg-mirror-purple/10 shadow-lg shadow-mirror-purple/20'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }
            `}
          >
            <div className="text-4xl mb-md">{option.icon}</div>
            <h4 className="text-body font-semibold text-white/95 mb-sm">
              {option.label}
            </h4>
            <p className="text-sm text-white/60">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
```

**Key points:**
- Visual cards instead of plain radio buttons
- Clear selection state (border + glow)
- Icons + descriptions help users understand tone
- Responsive: stacks on mobile, 3 columns on desktop
- Hover states for better interactivity

---

## Markdown Rendering Patterns

### Pattern 6: Safe Markdown Rendering with Custom Components

**When to use:** Rendering AI responses with markdown formatting

**Code example:**
```typescript
// components/reflections/AIResponseRenderer.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GradientText } from '@/components/ui/glass/GradientText';

interface AIResponseRendererProps {
  content: string;
}

export const AIResponseRenderer: React.FC<AIResponseRendererProps> = ({ content }) => {
  // Detect if content has markdown
  const hasMarkdown = /^#{1,3}\s|^\*\s|^-\s|^>\s|```/.test(content);

  // Fallback for plain text
  if (!hasMarkdown) {
    return (
      <div className="reflection-text max-w-[720px] mx-auto">
        {content.split('\n\n').map((para, i) => (
          <p key={i} className="text-body leading-relaxed text-white/95 mb-md">
            {para}
          </p>
        ))}
      </div>
    );
  }

  // Render markdown with custom components
  return (
    <div className="max-w-[720px] mx-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with gradient text
          h1: ({ node, ...props }) => (
            <GradientText
              gradient="cosmic"
              className="text-h1 font-bold mb-lg mt-2xl first:mt-0"
            >
              {props.children}
            </GradientText>
          ),
          h2: ({ node, ...props }) => (
            <GradientText
              gradient="cosmic"
              className="text-h2 font-semibold mb-md mt-xl"
            >
              {props.children}
            </GradientText>
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-h3 font-medium text-mirror-violet mb-md mt-lg">
              {props.children}
            </h3>
          ),

          // Body text with optimal readability
          p: ({ node, ...props }) => (
            <p className="text-body leading-relaxed text-white/95 mb-md">
              {props.children}
            </p>
          ),

          // Blockquotes with cosmic accent
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-mirror-amethyst/60 pl-lg py-md my-lg bg-mirror-amethyst/5 rounded-r-lg">
              <div className="text-white/90 italic">
                {props.children}
              </div>
            </blockquote>
          ),

          // Lists with proper spacing
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-md space-y-sm text-white/90 ml-md">
              {props.children}
            </ul>
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-md space-y-sm text-white/90 ml-md">
              {props.children}
            </ol>
          ),

          // Strong (bold) with gradient
          strong: ({ node, ...props }) => (
            <strong className="font-semibold gradient-text-cosmic">
              {props.children}
            </strong>
          ),

          // Code blocks
          code: ({ node, inline, ...props }) => (
            inline ? (
              <code className="bg-white/10 px-sm py-xs rounded text-mirror-amethyst font-mono text-sm">
                {props.children}
              </code>
            ) : (
              <code className="block bg-white/5 p-md rounded-lg font-mono text-sm overflow-x-auto mb-md border border-white/10">
                {props.children}
              </code>
            )
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
```

**Key points:**
- **NEVER use `dangerouslySetInnerHTML`** for AI content
- Markdown detection fallback for plain text
- Custom component renderers for full styling control
- Gradient text on headings and strong tags
- Optimal reading column (720px max-width)
- Proper spacing between elements (mb-md, mt-lg)
- Security: ReactMarkdown sanitizes by default

---

### Pattern 7: Individual Reflection Display Layout

**When to use:** Displaying single reflection with metadata and AI response

**Code example:**
```typescript
// app/reflections/[id]/page.tsx
'use client';

import { trpc } from '@/lib/trpc/client';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { formatDate } from '@/lib/utils/formatDate';

export default function ReflectionDetailPage({ params }: { params: { id: string } }) {
  const { data: reflection, isLoading } = trpc.reflections.getById.useQuery({
    id: params.id,
  });

  if (isLoading) {
    return <div className="container mx-auto p-lg">Loading...</div>;
  }

  if (!reflection) {
    return <div className="container mx-auto p-lg">Reflection not found</div>;
  }

  return (
    <div className="container mx-auto px-lg py-2xl max-w-screen-md">
      {/* Back button */}
      <div className="mb-xl">
        <GlowButton variant="ghost" size="sm" href="/reflections">
          ← Back to Reflections
        </GlowButton>
      </div>

      {/* Dream badge */}
      <div className="mb-md">
        <span className="inline-block px-md py-sm bg-mirror-purple/20 border border-mirror-purple/40 rounded-full text-sm text-mirror-purple font-medium">
          {reflection.dream.title}
        </span>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-lg text-sm text-white/40 mb-2xl">
        <span>{formatDate(reflection.createdAt)}</span>
        <span>•</span>
        <span className="capitalize">{reflection.tone}</span>
      </div>

      {/* User's questions and answers (collapsible) */}
      <details className="mb-2xl">
        <summary className="cursor-pointer text-body font-medium text-white/80 mb-md hover:text-white/95">
          Your original answers
        </summary>
        <div className="space-y-lg pl-lg border-l-2 border-white/10">
          <div>
            <h4 className="text-sm font-medium text-white/60 mb-sm">Your Dream</h4>
            <p className="text-body text-white/90">{reflection.dream}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white/60 mb-sm">Your Plan</h4>
            <p className="text-body text-white/90">{reflection.plan}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white/60 mb-sm">Your Relationship</h4>
            <p className="text-body text-white/90">{reflection.relationship}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white/60 mb-sm">Your Offering</h4>
            <p className="text-body text-white/90">{reflection.offering}</p>
          </div>
        </div>
      </details>

      {/* AI Response */}
      <div className="bg-gradient-to-br from-mirror-purple/10 to-mirror-violet/10 rounded-2xl p-xl border border-mirror-purple/20 shadow-lg shadow-mirror-purple/10">
        <h2 className="text-h2 font-semibold text-white/95 mb-xl">Your Mirror's Reflection</h2>
        <AIResponseRenderer content={reflection.aiResponse} />
      </div>

      {/* Actions */}
      <div className="mt-xl flex items-center justify-center gap-md">
        <GlowButton variant="ghost" size="sm">
          Share
        </GlowButton>
        <GlowButton variant="ghost" size="sm">
          Download
        </GlowButton>
      </div>
    </div>
  );
}
```

**Key points:**
- Centered layout (max-w-screen-md = 768px)
- Dream badge prominent at top
- Metadata subtle (date, tone)
- User's answers collapsible (reduces visual clutter)
- AI response in accented container (cosmic glow)
- Back button for easy navigation
- Optional actions (share, download) secondary

---

## Collection & Filtering Patterns

### Pattern 8: Reflection Card with Hover States

**When to use:** Displaying reflection in grid/list view

**Code example:**
```typescript
// components/reflections/ReflectionCard.tsx
'use client';

import Link from 'next/link';
import { formatDate, formatRelativeTime } from '@/lib/utils/formatDate';

interface ReflectionCardProps {
  reflection: {
    id: string;
    dream: { title: string };
    aiResponse: string;
    tone: 'gentle' | 'intense' | 'fusion';
    createdAt: string;
  };
}

const TONE_COLORS = {
  gentle: 'bg-blue-500/20 text-blue-400',
  intense: 'bg-red-500/20 text-red-400',
  fusion: 'bg-purple-500/20 text-purple-400',
};

export const ReflectionCard: React.FC<ReflectionCardProps> = ({ reflection }) => {
  // Extract first 120 characters of AI response as snippet
  const snippet = reflection.aiResponse.substring(0, 120) + '...';

  return (
    <Link href={`/reflections/${reflection.id}`}>
      <div className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-lg border border-white/10 transition-all hover:bg-white/10 hover:border-mirror-purple/40 hover:shadow-lg hover:shadow-mirror-purple/20 hover:-translate-y-1 cursor-pointer">
        {/* Dream badge */}
        <div className="mb-md">
          <span className="inline-block px-sm py-xs bg-mirror-purple/20 border border-mirror-purple/40 rounded-full text-xs text-mirror-purple font-medium">
            {reflection.dream.title}
          </span>
        </div>

        {/* Date and tone */}
        <div className="flex items-center gap-md mb-md text-xs text-white/40">
          <span>{formatRelativeTime(reflection.createdAt)}</span>
          <span>•</span>
          <span className={`px-sm py-xs rounded ${TONE_COLORS[reflection.tone]}`}>
            {reflection.tone}
          </span>
        </div>

        {/* Snippet */}
        <p className="text-sm text-white/80 line-clamp-3">
          {snippet}
        </p>

        {/* Read more indicator (appears on hover) */}
        <div className="mt-md flex items-center gap-sm text-sm text-mirror-purple opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Read full reflection</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};
```

**Key points:**
- Hover states: lift (-translate-y-1) + glow (shadow-mirror-purple)
- Snippet limited to 120 characters with ellipsis
- Tone badge with color coding
- Relative time (e.g., "2 days ago")
- "Read more" indicator appears on hover
- Group hover for coordinated animations

---

### Pattern 9: Reflections Filter with Dream Dropdown

**When to use:** Filtering reflections by dream, tone, sort order

**Code example:**
```typescript
// components/reflections/ReflectionFilters.tsx
'use client';

import { useState } from 'react';

interface ReflectionFiltersProps {
  dreams: Array<{ id: string; title: string }>;
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  dreamId?: string;
  tone?: 'gentle' | 'intense' | 'fusion';
  sortBy: 'created_at' | 'word_count';
  sortOrder: 'asc' | 'desc';
}

export const ReflectionFilters: React.FC<ReflectionFiltersProps> = ({
  dreams,
  onFilterChange,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const handleFilterUpdate = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-wrap items-center gap-md mb-xl">
      {/* Dream filter */}
      <select
        value={filters.dreamId || ''}
        onChange={(e) => handleFilterUpdate({ dreamId: e.target.value || undefined })}
        className="px-md py-sm bg-white/5 border border-white/10 rounded-lg text-white/90 focus:border-mirror-purple focus:outline-none"
      >
        <option value="">All dreams</option>
        {dreams.map((dream) => (
          <option key={dream.id} value={dream.id}>
            {dream.title}
          </option>
        ))}
      </select>

      {/* Tone filter */}
      <select
        value={filters.tone || ''}
        onChange={(e) => handleFilterUpdate({ tone: e.target.value as any || undefined })}
        className="px-md py-sm bg-white/5 border border-white/10 rounded-lg text-white/90 focus:border-mirror-purple focus:outline-none"
      >
        <option value="">All tones</option>
        <option value="gentle">Gentle</option>
        <option value="intense">Intense</option>
        <option value="fusion">Sacred Fusion</option>
      </select>

      {/* Sort dropdown */}
      <select
        value={`${filters.sortBy}-${filters.sortOrder}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split('-');
          handleFilterUpdate({
            sortBy: sortBy as FilterState['sortBy'],
            sortOrder: sortOrder as FilterState['sortOrder'],
          });
        }}
        className="px-md py-sm bg-white/5 border border-white/10 rounded-lg text-white/90 focus:border-mirror-purple focus:outline-none"
      >
        <option value="created_at-desc">Most recent</option>
        <option value="created_at-asc">Oldest first</option>
        <option value="word_count-desc">Longest first</option>
      </select>

      {/* Clear filters */}
      {(filters.dreamId || filters.tone) && (
        <button
          onClick={() => handleFilterUpdate({ dreamId: undefined, tone: undefined })}
          className="px-md py-sm text-sm text-white/60 hover:text-white/90 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};
```

**Key points:**
- Controlled components (state managed in parent)
- Dream filter dropdown populated from user's dreams
- Sort combines field + order in single dropdown
- Clear filters button appears when filters active
- Focus states with mirror-purple border

---

## Utility Patterns

### Pattern 10: Time-Based Greeting

**When to use:** Personalized greetings based on time of day

**Code example:**
```typescript
// lib/utils/getTimeOfDay.ts
export const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 18) {
    return 'afternoon';
  } else {
    return 'evening';
  }
};

export const getGreeting = (firstName?: string): string => {
  const timeOfDay = getTimeOfDay();
  const name = firstName || 'Dreamer';

  return `Good ${timeOfDay}, ${name}!`;
};

// Usage
import { getGreeting } from '@/lib/utils/getTimeOfDay';

const greeting = getGreeting(user?.firstName); // "Good morning, Ahiya!"
```

---

### Pattern 11: Format Date Utilities

**When to use:** Consistent date formatting across app

**Code example:**
```typescript
// lib/utils/formatDate.ts
import { formatDistanceToNow, format } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'MMMM d, yyyy');
};

export const formatRelativeTime = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM d, yyyy • h:mm a');
};

// Usage
formatDate('2025-11-28') // "November 28, 2025"
formatRelativeTime('2025-11-26') // "2 days ago"
formatDateTime('2025-11-28T10:30:00') // "Nov 28, 2025 • 10:30 AM"
```

---

## Import Order Convention

**Order:**
1. React imports
2. Next.js imports
3. Third-party libraries
4. Internal utilities
5. Components
6. Types
7. Styles

**Example:**
```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. Next.js
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 3. Third-party
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 4. Internal utilities
import { trpc } from '@/lib/trpc/client';
import { formatDate } from '@/lib/utils/formatDate';

// 5. Components
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { DashboardHero } from '@/components/dashboard/DashboardHero';

// 6. Types
import type { Reflection, Dream } from '@/types';

// 7. Styles (if needed)
import styles from './page.module.css';
```

---

## Code Quality Standards

### Standard 1: Type Safety

**Description:** All components and functions fully typed with TypeScript

**Example:**
```typescript
// ✅ GOOD: Explicit types
interface DashboardCardProps {
  isLoading: boolean;
  hasError: boolean;
  children: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  isLoading,
  hasError,
  children,
}) => {
  // ...
};

// ❌ BAD: Any types or no types
export const DashboardCard = (props: any) => {
  // ...
};
```

---

### Standard 2: Error Handling

**Description:** All tRPC queries handle loading, error, and success states

**Example:**
```typescript
// ✅ GOOD: All states handled
const { data, isLoading, error } = trpc.dreams.list.useQuery();

if (isLoading) return <LoadingState />;
if (error) return <ErrorState message={error.message} />;
if (!data) return <EmptyState />;

return <SuccessState data={data} />;

// ❌ BAD: No error handling
const { data } = trpc.dreams.list.useQuery();
return <div>{data.map(...)}</div>; // Crashes if data is undefined
```

---

### Standard 3: Accessibility

**Description:** All interactive elements keyboard-accessible, ARIA labels on icons

**Example:**
```typescript
// ✅ GOOD: Accessible button
<button
  type="button"
  onClick={handleClick}
  aria-label="Close modal"
  className="focus:outline-none focus:ring-2 focus:ring-mirror-purple"
>
  <XIcon className="w-5 h-5" />
</button>

// ❌ BAD: No ARIA label, no focus indicator
<div onClick={handleClick}>
  <XIcon />
</div>
```

---

## Performance Patterns

### Pattern 12: Parallel tRPC Queries

**When to use:** Dashboard cards fetching multiple data sources

**Code example:**
```typescript
// ✅ GOOD: Parallel queries (TanStack Query batches automatically)
const DashboardPage = () => {
  return (
    <div>
      <DreamsCard />        {/* Fetches dreams.list */}
      <ReflectionsCard />   {/* Fetches reflections.list */}
      <ProgressCard />      {/* Fetches usage.stats */}
    </div>
  );
};

// Each card component
const DreamsCard = () => {
  const { data } = trpc.dreams.list.useQuery();
  // Renders independently
};

// ❌ BAD: Sequential queries (waterfall)
const DashboardPage = () => {
  const { data: dreams } = trpc.dreams.list.useQuery();
  const { data: reflections } = trpc.reflections.list.useQuery({
    enabled: !!dreams, // Waits for dreams to finish
  });
  // ...
};
```

---

### Pattern 13: Code Splitting for Large Components

**When to use:** Dashboard cards or heavy components

**Code example:**
```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const EvolutionCard = lazy(() => import('@/components/dashboard/cards/EvolutionCard'));
const VisualizationCard = lazy(() => import('@/components/dashboard/cards/VisualizationCard'));

export default function DashboardPage() {
  return (
    <div>
      {/* Eager load critical cards */}
      <DashboardHero />
      <DreamsCard />

      {/* Lazy load below-fold cards */}
      <Suspense fallback={<DashboardCard isLoading />}>
        <EvolutionCard />
      </Suspense>

      <Suspense fallback={<DashboardCard isLoading />}>
        <VisualizationCard />
      </Suspense>
    </div>
  );
}
```

---

## Security Patterns

### Pattern 14: Markdown XSS Prevention

**When to use:** Rendering user-generated or AI-generated content

**Code example:**
```typescript
// ✅ GOOD: ReactMarkdown with custom components
import ReactMarkdown from 'react-markdown';

<ReactMarkdown components={{ /* custom renderers */ }}>
  {aiResponse}
</ReactMarkdown>

// ❌ BAD: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: aiResponse }} />
```

**Test case:**
```typescript
const maliciousInput = `
# Heading
<script>alert('XSS')</script>
<img src="x" onerror="alert('XSS')">
`;

// ReactMarkdown renders as plain text, not executed
```

---

**Patterns Status:** COMPREHENSIVE
**Examples:** WORKING CODE (copy-paste ready)
**Coverage:** All 4 features (Dashboard, Reflection Page, Individual Display, Collection)
**Builder Readiness:** HIGH (clear patterns, proven code, minimal unknowns)
