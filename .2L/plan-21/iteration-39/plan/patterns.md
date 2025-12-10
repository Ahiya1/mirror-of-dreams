# Code Patterns & Conventions

## File Structure

```
mirror-of-dreams/
├── app/
│   └── reflection/
│       ├── MirrorExperience.tsx       # Main component (~400 lines after refactor)
│       └── page.tsx
├── components/
│   └── reflection/
│       ├── views/                     # NEW: Extracted view components
│       │   ├── DreamSelectionView.tsx
│       │   ├── ReflectionFormView.tsx
│       │   └── ReflectionOutputView.tsx
│       ├── mobile/
│       │   └── GazingOverlay.tsx      # Enhanced with variant prop
│       ├── ProgressBar.tsx
│       ├── ReflectionQuestionCard.tsx
│       └── ToneSelectionCard.tsx
├── hooks/
│   ├── useReflectionForm.ts           # NEW: Form state and persistence
│   └── useReflectionViewMode.ts       # NEW: View mode and navigation
└── lib/
    └── reflection/                    # NEW: Shared types and constants
        ├── types.ts
        └── constants.ts
```

## Naming Conventions

- Components: PascalCase (`DreamSelectionView.tsx`)
- Hooks: camelCase with `use` prefix (`useReflectionForm.ts`)
- Types: PascalCase (`FormData`, `ViewMode`)
- Constants: SCREAMING_SNAKE_CASE (`STORAGE_KEY`, `STORAGE_EXPIRY_MS`)
- Files: PascalCase for components, camelCase for utilities

## Hook Extraction Patterns

### useReflectionForm Hook Pattern

**When to use:** Extract form state, validation, and persistence logic

```typescript
// hooks/useReflectionForm.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import type { FormData, Dream } from '@/lib/reflection/types';
import { STORAGE_KEY, STORAGE_EXPIRY_MS } from '@/lib/reflection/constants';

interface UseReflectionFormOptions {
  dreams: Dream[] | undefined;
  initialDreamId?: string;
}

interface UseReflectionFormReturn {
  // Form data
  formData: FormData;
  handleFieldChange: (field: keyof FormData, value: string) => void;

  // Dream selection
  selectedDreamId: string;
  selectedDream: Dream | null;
  handleDreamSelect: (dreamId: string) => void;

  // Tone
  selectedTone: ToneId;
  setSelectedTone: (tone: ToneId) => void;

  // Validation
  validateForm: () => boolean;

  // Reset
  clearForm: () => void;
}

export function useReflectionForm({
  dreams,
  initialDreamId = '',
}: UseReflectionFormOptions): UseReflectionFormReturn {
  const toast = useToast();

  const [selectedDreamId, setSelectedDreamId] = useState<string>(initialDreamId);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneId>('fusion');
  const [formData, setFormData] = useState<FormData>({
    dream: '',
    plan: '',
    relationship: '',
    offering: '',
  });

  // Update selected dream when dreams load or selection changes
  useEffect(() => {
    if (dreams && selectedDreamId) {
      const dream = dreams.find((d) => d.id === selectedDreamId);
      if (dream) {
        setSelectedDream(dream);
      }
    }
  }, [dreams, selectedDreamId]);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { data, timestamp, dreamId: savedDreamId, tone: savedTone } = JSON.parse(saved);
        if (Date.now() - timestamp < STORAGE_EXPIRY_MS) {
          setFormData(data);
          if (savedDreamId) setSelectedDreamId(savedDreamId);
          if (savedTone) setSelectedTone(savedTone);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasContent = Object.values(formData).some((v) => v.trim().length > 0);
    if (hasContent || selectedDreamId) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            data: formData,
            dreamId: selectedDreamId,
            tone: selectedTone,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [formData, selectedDreamId, selectedTone]);

  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDreamSelect = useCallback((dreamId: string) => {
    const dream = dreams?.find((d) => d.id === dreamId);
    setSelectedDream(dream || null);
    setSelectedDreamId(dreamId);
  }, [dreams]);

  const validateForm = useCallback((): boolean => {
    if (!selectedDreamId) {
      toast.warning('Please select a dream');
      return false;
    }
    if (!formData.dream.trim()) {
      toast.warning('Please elaborate on your dream');
      return false;
    }
    if (!formData.plan.trim()) {
      toast.warning('Please describe your plan');
      return false;
    }
    if (!formData.relationship.trim()) {
      toast.warning('Please share your relationship with this dream');
      return false;
    }
    if (!formData.offering.trim()) {
      toast.warning("Please describe what you're willing to give");
      return false;
    }
    return true;
  }, [selectedDreamId, formData, toast]);

  const clearForm = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData({ dream: '', plan: '', relationship: '', offering: '' });
    setSelectedDreamId('');
    setSelectedDream(null);
    setSelectedTone('fusion');
  }, []);

  return {
    formData,
    handleFieldChange,
    selectedDreamId,
    selectedDream,
    handleDreamSelect,
    selectedTone,
    setSelectedTone,
    validateForm,
    clearForm,
  };
}
```

### useReflectionViewMode Hook Pattern

**When to use:** Extract view mode state and URL synchronization

```typescript
// hooks/useReflectionViewMode.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ViewMode } from '@/lib/reflection/types';

interface UseReflectionViewModeReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  reflectionId: string | null;
  newReflection: { id: string; content: string } | null;
  setNewReflection: (ref: { id: string; content: string } | null) => void;
  resetToQuestionnaire: () => void;
}

export function useReflectionViewMode(): UseReflectionViewModeReturn {
  const searchParams = useSearchParams();
  const reflectionId = searchParams.get('id');

  const initialMode: ViewMode = reflectionId ? 'output' : 'questionnaire';

  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [newReflection, setNewReflection] = useState<{ id: string; content: string } | null>(null);

  // Sync viewMode with URL params
  useEffect(() => {
    if (newReflection) return; // Don't sync if we just created one
    const targetMode: ViewMode = reflectionId ? 'output' : 'questionnaire';
    if (viewMode !== targetMode) {
      setViewMode(targetMode);
    }
  }, [reflectionId, newReflection, viewMode]);

  const resetToQuestionnaire = useCallback(() => {
    setViewMode('questionnaire');
    setNewReflection(null);
    window.history.replaceState(null, '', '/reflection');
  }, []);

  return {
    viewMode,
    setViewMode,
    reflectionId,
    newReflection,
    setNewReflection,
    resetToQuestionnaire,
  };
}
```

## View Component Extraction Patterns

### DreamSelectionView Pattern

**When to use:** Extract dream selection list with empty state

```typescript
// components/reflection/views/DreamSelectionView.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlowButton } from '@/components/ui/glass';
import { cn } from '@/lib/utils';
import type { Dream } from '@/lib/reflection/types';
import { CATEGORY_EMOJI } from '@/lib/reflection/constants';

interface DreamSelectionViewProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dreamId: string) => void;
}

export function DreamSelectionView({
  dreams,
  selectedDreamId,
  onDreamSelect,
}: DreamSelectionViewProps) {
  const router = useRouter();

  return (
    <div className="question-view">
      <h2 className="mb-8 bg-gradient-to-r from-mirror-amethyst via-mirror-amethyst-light to-cosmic-blue bg-clip-text text-center text-2xl font-light text-transparent md:text-3xl">
        Which dream are you reflecting on?
      </h2>

      <div className="dream-selection-list">
        {dreams && dreams.length > 0 ? (
          dreams.map((dream) => {
            const emoji = CATEGORY_EMOJI[dream.category || 'other'] || 'star';
            const isSelected = selectedDreamId === dream.id;

            return (
              <div
                key={dream.id}
                onClick={() => onDreamSelect(dream.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDreamSelect(dream.id);
                  }
                }}
              >
                <GlassCard
                  elevated={isSelected}
                  interactive
                  className={cn(
                    'cursor-pointer transition-all',
                    isSelected && 'border-mirror-amethyst/60'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex-shrink-0 text-4xl">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 text-lg font-medium text-white">
                        {dream.title}
                      </h3>
                      {dream.daysLeft !== null && dream.daysLeft !== undefined && (
                        <p className="text-sm text-mirror-amethyst-light">
                          {dream.daysLeft < 0
                            ? `${Math.abs(dream.daysLeft)}d overdue`
                            : dream.daysLeft === 0
                              ? 'Today!'
                              : `${dream.daysLeft}d left`}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 text-mirror-amethyst"
                      >
                        <Check className="h-6 w-6" />
                      </motion.div>
                    )}
                  </div>
                </GlassCard>
              </div>
            );
          })
        ) : (
          <GlassCard elevated className="text-center">
            <p className="mb-6 text-white/70">No active dreams yet.</p>
            <GlowButton
              variant="primary"
              size="md"
              onClick={() => router.push('/dreams')}
            >
              Create Your First Dream
            </GlowButton>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
```

### ReflectionFormView Pattern

**When to use:** Extract the form with all questions and tone selection

```typescript
// components/reflection/views/ReflectionFormView.tsx
'use client';

import React from 'react';
import { ProgressBar } from '@/components/reflection/ProgressBar';
import { ReflectionQuestionCard } from '@/components/reflection/ReflectionQuestionCard';
import { ToneSelectionCard } from '@/components/reflection/ToneSelectionCard';
import { GlowButton, CosmicLoader } from '@/components/ui/glass';
import type { ToneId } from '@/lib/utils/constants';
import type { FormData, Dream } from '@/lib/reflection/types';
import { QUESTIONS } from '@/lib/reflection/constants';
import { REFLECTION_MICRO_COPY } from '@/lib/utils/constants';

interface ReflectionFormViewProps {
  selectedDream: Dream | null;
  formData: FormData;
  onFieldChange: (field: keyof FormData, value: string) => void;
  selectedTone: ToneId;
  onToneSelect: (tone: ToneId) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReflectionFormView({
  selectedDream,
  formData,
  onFieldChange,
  selectedTone,
  onToneSelect,
  onSubmit,
  isSubmitting,
}: ReflectionFormViewProps) {
  return (
    <div className="one-page-form">
      {/* Welcome Message */}
      <div className="mb-6 text-center">
        <p className="text-base font-light italic text-white/80 md:text-lg">
          {REFLECTION_MICRO_COPY.welcome}
        </p>
      </div>

      {/* Dream Context Banner */}
      {selectedDream && (
        <div className="dream-context-banner">
          <h2>Reflecting on: {selectedDream.title}</h2>
          <div className="dream-meta">
            {selectedDream.category && (
              <span className="category-badge">{selectedDream.category}</span>
            )}
            {selectedDream.daysLeft !== null && selectedDream.daysLeft !== undefined && (
              <span className="days-remaining">
                {selectedDream.daysLeft < 0
                  ? `${Math.abs(selectedDream.daysLeft)} days overdue`
                  : selectedDream.daysLeft === 0
                    ? 'Today!'
                    : `${selectedDream.daysLeft} days remaining`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressBar currentStep={1} totalSteps={4} />
      </div>

      {/* All 4 Questions */}
      <div className="questions-container">
        {QUESTIONS.map((question) => (
          <ReflectionQuestionCard
            key={question.id}
            questionNumber={question.number}
            totalQuestions={4}
            questionText={question.text}
            guidingText={question.guide}
            placeholder={question.placeholder}
            value={formData[question.id]}
            onChange={(value) => onFieldChange(question.id, value)}
            maxLength={question.limit}
          />
        ))}
      </div>

      {/* Tone Selection */}
      <div className="mb-8">
        <ToneSelectionCard selectedTone={selectedTone} onSelect={onToneSelect} />
      </div>

      {/* Ready message */}
      <div className="mb-6 text-center">
        <p className="text-sm italic text-white/70">
          {REFLECTION_MICRO_COPY.readyToSubmit}
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <GlowButton
          variant="cosmic"
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="submit-button-breathe min-w-[280px] text-lg font-medium"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-3">
              <CosmicLoader size="sm" />
              Gazing...
            </span>
          ) : (
            <>Gaze into the Mirror</>
          )}
        </GlowButton>
      </div>
    </div>
  );
}
```

### ReflectionOutputView Pattern

**When to use:** Extract reflection display with create new button

```typescript
// components/reflection/views/ReflectionOutputView.tsx
'use client';

import React from 'react';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import { GlassCard, GlowButton, CosmicLoader } from '@/components/ui/glass';

interface ReflectionOutputViewProps {
  content: string;
  isLoading: boolean;
  onCreateNew: () => void;
}

export function ReflectionOutputView({
  content,
  isLoading,
  onCreateNew,
}: ReflectionOutputViewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <CosmicLoader size="lg" />
        <p className="text-lg text-white/70">Loading reflection...</p>
      </div>
    );
  }

  return (
    <GlassCard elevated className="reflection-card">
      <div className="mirror-surface">
        <div className="reflection-content">
          <h1 className="text-h1 mb-8 bg-gradient-to-r from-[#fbbf24] to-[#9333ea] bg-clip-text text-center font-semibold text-transparent">
            Your Reflection
          </h1>
          <div className="reflection-text">
            <AIResponseRenderer content={content} />
          </div>
          <div className="mt-8 flex justify-center">
            <GlowButton variant="primary" size="lg" onClick={onCreateNew}>
              Create New Reflection
            </GlowButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
```

## Shared Types Pattern

```typescript
// lib/reflection/types.ts
import type { ToneId } from '@/lib/utils/constants';

export interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

export interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}

export type ViewMode = 'questionnaire' | 'output';

export interface ReflectionQuestion {
  id: keyof FormData;
  number: number;
  text: string;
  guide: string;
  placeholder: string;
  limit: number;
}
```

## Shared Constants Pattern

```typescript
// lib/reflection/constants.ts
import type { ReflectionQuestion, FormData } from './types';
import { QUESTION_LIMITS } from '@/lib/utils/constants';

// LocalStorage persistence
export const STORAGE_KEY = 'MIRROR_REFLECTION_DRAFT';
export const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Category emoji mapping
export const CATEGORY_EMOJI: Record<string, string> = {
  health: '\uD83C\uDFC3',
  career: '\uD83D\uDCBC',
  relationships: '\u2764\uFE0F',
  financial: '\uD83D\uDCB0',
  personal_growth: '\uD83C\uDF31',
  creative: '\uD83C\uDFA8',
  spiritual: '\uD83D\uDE4F',
  entrepreneurial: '\uD83D\uDE80',
  educational: '\uD83D\uDCDA',
  other: '\u2B50',
};

// Guiding text for each question
const QUESTION_GUIDES = {
  dream: 'Take a moment to describe your dream in vivid detail...',
  plan: 'What concrete steps will you take on this journey?',
  relationship: 'How does this dream connect to who you are becoming?',
  offering: 'What are you willing to give, sacrifice, or commit?',
};

// Warm placeholder text
const WARM_PLACEHOLDERS = {
  dream: "Your thoughts are safe here... what's present for you right now?",
  plan: 'What step feels right to take next?',
  relationship: "How does this dream connect to who you're becoming?",
  offering: 'What gift is this dream offering you?',
};

export const QUESTIONS: ReflectionQuestion[] = [
  {
    id: 'dream',
    number: 1,
    text: 'What is your dream?',
    guide: QUESTION_GUIDES.dream,
    placeholder: WARM_PLACEHOLDERS.dream,
    limit: QUESTION_LIMITS.dream,
  },
  {
    id: 'plan',
    number: 2,
    text: 'What is your plan to bring it to life?',
    guide: QUESTION_GUIDES.plan,
    placeholder: WARM_PLACEHOLDERS.plan,
    limit: QUESTION_LIMITS.plan,
  },
  {
    id: 'relationship',
    number: 3,
    text: 'What is your relationship with this dream?',
    guide: QUESTION_GUIDES.relationship,
    placeholder: WARM_PLACEHOLDERS.relationship,
    limit: QUESTION_LIMITS.relationship,
  },
  {
    id: 'offering',
    number: 4,
    text: 'What are you willing to offer in service of this dream?',
    guide: QUESTION_GUIDES.offering,
    placeholder: WARM_PLACEHOLDERS.offering,
    limit: QUESTION_LIMITS.sacrifice,
  },
];

// Status messages for gazing overlay
export const GAZING_STATUS_MESSAGES = [
  'Gazing into the mirror...',
  'Reflecting on your journey...',
  'Crafting your insight...',
  'Weaving wisdom...',
];
```

## React.memo Patterns

### Simple Memoization (No Custom Comparator)

**When to use:** Components with primitive props or callback props that will be wrapped in useCallback

```typescript
// Before
export function GlowButton({ variant, size, onClick, disabled, children }: GlowButtonProps) {
  // ...
}

// After
import { memo } from 'react';

export const GlowButton = memo(function GlowButton({
  variant,
  size,
  onClick,
  disabled,
  children,
}: GlowButtonProps) {
  // ... same implementation
});
```

### Memoization with Custom Comparator

**When to use:** Components with object props where shallow comparison would fail

```typescript
// components/dashboard/shared/ReflectionItem.tsx
import React, { memo, useState } from 'react';

interface ReflectionItemProps {
  reflection: {
    id: string | number;
    title?: string | null;
    // ... other fields
  };
  index?: number;
  animated?: boolean;
  animationDelay?: number;
  onClick?: (reflection: any) => void;
  className?: string;
}

// Custom comparator for object props
function areReflectionItemPropsEqual(
  prevProps: ReflectionItemProps,
  nextProps: ReflectionItemProps
): boolean {
  return (
    prevProps.reflection.id === nextProps.reflection.id &&
    prevProps.index === nextProps.index &&
    prevProps.animated === nextProps.animated &&
    prevProps.animationDelay === nextProps.animationDelay &&
    prevProps.className === nextProps.className &&
    prevProps.onClick === nextProps.onClick
  );
}

const ReflectionItem = memo(function ReflectionItem({
  reflection,
  index = 0,
  animated = true,
  animationDelay = 0,
  onClick,
  className = '',
}: ReflectionItemProps) {
  // ... same implementation
}, areReflectionItemPropsEqual);

export default ReflectionItem;
```

### Parent Component useCallback Pattern

**When to use:** Parent components that pass callbacks to memoized children

```typescript
// In MirrorExperience.tsx or any parent
import { useCallback } from 'react';

function ParentComponent() {
  const [formData, setFormData] = useState<FormData>({ ... });

  // Wrap callbacks in useCallback for memoization to work
  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []); // Empty deps because setFormData is stable

  const handleToneSelect = useCallback((tone: ToneId) => {
    setSelectedTone(tone);
  }, []);

  return (
    <>
      <ReflectionQuestionCard
        onChange={handleFieldChange}  // Stable reference
        // ...
      />
      <ToneSelection
        onSelect={handleToneSelect}  // Stable reference
        // ...
      />
    </>
  );
}
```

## GazingOverlay Enhancement Pattern

**When to use:** Support both simple (mobile) and elaborate (desktop) variants

```typescript
// components/reflection/mobile/GazingOverlay.tsx
'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

const STATUS_MESSAGES = [
  'Gazing into the mirror...',
  'Reflecting on your journey...',
  'Crafting your insight...',
  'Weaving wisdom...',
];

interface GazingOverlayProps {
  isVisible: boolean;
  variant?: 'simple' | 'elaborate';  // NEW: variant prop
  statusText?: string;               // NEW: optional custom status
}

export function GazingOverlay({
  isVisible,
  variant = 'simple',
  statusText: customStatusText,
}: GazingOverlayProps) {
  const [statusIndex, setStatusIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Generate star positions only once for elaborate variant
  const starPositions = useMemo(() => {
    if (variant !== 'elaborate') return [];
    return Array.from({ length: 50 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
    }));
  }, [variant]);

  // Generate particle positions only once for elaborate variant
  const particlePositions = useMemo(() => {
    if (variant !== 'elaborate') return [];
    return Array.from({ length: 15 }, () => ({
      left: `${20 + Math.random() * 60}%`,
      top: `${20 + Math.random() * 60}%`,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 3,
    }));
  }, [variant]);

  // Cycle through status messages
  useEffect(() => {
    if (!isVisible || customStatusText) {
      setStatusIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible, customStatusText]);

  const statusText = customStatusText || STATUS_MESSAGES[statusIndex];

  if (variant === 'simple') {
    // Simple variant (current mobile implementation)
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-mirror-void-deep/98 backdrop-blur-xl"
          >
            <motion.div
              animate={prefersReducedMotion ? undefined : { scale: [1, 1.05, 1] }}
              transition={prefersReducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CosmicLoader size="lg" label="Creating your reflection" />
            </motion.div>
            <p className="mt-8 text-xl font-light text-white/90">{statusText}</p>
            <p className="mt-2 text-sm text-white/50">This may take a few moments</p>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Elaborate variant (desktop mirror portal)
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
          className="gazing-overlay"
        >
          {/* Deep space background with stars */}
          <div className="gazing-cosmos">
            {starPositions.map((star, i) => (
              <motion.div
                key={`star-${i}`}
                className="gazing-star"
                style={{
                  left: star.left,
                  top: star.top,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                }}
                animate={prefersReducedMotion ? undefined : {
                  opacity: [0.2, 0.8, 0.2],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: star.duration,
                  repeat: Infinity,
                  delay: star.delay,
                }}
              />
            ))}

            {/* Floating light particles */}
            {particlePositions.map((particle, i) => (
              <motion.div
                key={`particle-${i}`}
                className="gazing-particle"
                style={{ left: particle.left, top: particle.top }}
                animate={prefersReducedMotion ? undefined : {
                  x: [0, (Math.random() - 0.5) * 100, 0],
                  y: [0, -50 - Math.random() * 50, 0],
                  opacity: [0, 0.6, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Central mirror portal */}
          <div className="gazing-center">
            <motion.div
              className="mirror-ring mirror-ring-outer"
              animate={prefersReducedMotion ? undefined : { rotate: 360, scale: [1, 1.05, 1] }}
              transition={{
                rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
            <motion.div
              className="mirror-ring mirror-ring-middle"
              animate={prefersReducedMotion ? undefined : { rotate: -360, scale: [1.05, 1, 1.05] }}
              transition={{
                rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
            <motion.div
              className="mirror-portal"
              animate={prefersReducedMotion ? undefined : { scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="mirror-surface-effect" />
              <motion.div
                className="mirror-reflection-inner"
                animate={prefersReducedMotion ? undefined : {
                  opacity: [0.3, 0.6, 0.3],
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="mirror-glow-center"
                animate={prefersReducedMotion ? undefined : {
                  opacity: [0.4, 0.8, 0.4],
                  scale: [0.8, 1.1, 0.8],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          {/* Status text */}
          <motion.div
            className="gazing-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.p
              className="gazing-status"
              animate={prefersReducedMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {statusText}
            </motion.p>
            <p className="gazing-subtitle">Your reflection is taking form...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Import Order Convention

```typescript
// 1. React and React-related imports
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';

// 2. External library imports
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';

// 3. Type imports (separate from value imports)
import type { ToneId } from '@/lib/utils/constants';

// 4. Internal component imports
import { GlassCard, GlowButton, CosmicLoader } from '@/components/ui/glass';
import { ProgressBar } from '@/components/reflection/ProgressBar';

// 5. Internal hook imports
import { useReflectionForm } from '@/hooks/useReflectionForm';
import { useReflectionViewMode } from '@/hooks/useReflectionViewMode';

// 6. Internal utility/type imports
import { cn } from '@/lib/utils';
import type { FormData, Dream } from '@/lib/reflection/types';
import { QUESTIONS, CATEGORY_EMOJI } from '@/lib/reflection/constants';
```

## Code Quality Standards

- **No functional changes**: Refactoring must preserve exact behavior
- **Type safety**: All extracted code must be fully typed
- **Export consistency**: Use named exports for hooks and view components
- **Naming**: Use function declarations with memo, not arrow functions assigned to const
- **Testing**: Existing tests must continue to pass without modification

## Testing Strategy

For this refactoring iteration, we rely on existing tests:

1. **No new tests required** - functional behavior unchanged
2. **Run existing test suite** to verify no regressions
3. **Manual smoke test** of reflection flow:
   - Create new reflection (desktop)
   - Create new reflection (mobile)
   - View existing reflection
   - Test localStorage persistence
