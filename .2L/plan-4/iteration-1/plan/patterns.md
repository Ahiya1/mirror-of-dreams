# Code Patterns & Conventions - Plan-4 Iteration 1

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc]/
│   │           └── route.ts          # tRPC API handler
│   ├── reflection/
│   │   └── MirrorExperience.tsx      # Main reflection component (BUILDER 2)
│   ├── dashboard/
│   │   └── page.tsx                  # Dashboard (unchanged)
│   └── layout.tsx                    # Root layout
├── components/
│   └── ui/
│       ├── glass/                    # Glass design system
│       │   ├── GlassCard.tsx
│       │   ├── GlowButton.tsx
│       │   ├── GlassInput.tsx
│       │   └── CosmicLoader.tsx
│       └── toast/
│           └── useToast.tsx
├── server/
│   ├── trpc/
│   │   ├── routers/
│   │   │   ├── _app.ts
│   │   │   └── reflection.ts         # Reflection mutation (BUILDER 1)
│   │   ├── context.ts
│   │   └── middleware.ts
│   └── lib/
│       └── prompts.ts                # AI prompt builders
├── types/
│   └── schemas.ts                    # Zod schemas (BUILDER 1)
├── lib/
│   └── utils/
│       └── constants.ts              # App constants
└── supabase/
    └── migrations/                   # Database migrations
```

---

## Naming Conventions

- **Components:** PascalCase (`MirrorExperience.tsx`, `GlassCard.tsx`)
- **Files:** camelCase for utilities (`formatCurrency.ts`, `prompts.ts`)
- **Types:** PascalCase (`Reflection`, `Dream`, `FormData`)
- **Interfaces:** PascalCase with descriptive names (`MirrorExperienceProps`, `CreateReflectionInput`)
- **Functions:** camelCase (`handleSubmit()`, `getAnthropicClient()`)
- **Constants:** SCREAMING_SNAKE_CASE (`QUESTION_LIMITS`, `TIER_LIMITS`)
- **tRPC Routers:** camelCase (`reflection`, `dreams`, `evolution`)
- **tRPC Procedures:** camelCase (`create`, `list`, `getById`)

---

## Schema Patterns

### Zod Schema Definition

**When to use:** Defining input/output validation for tRPC procedures

**File:** `types/schemas.ts`

**Code example:**
```typescript
import { z } from 'zod';

// Reflection creation schema (UPDATED for iteration 1)
export const createReflectionSchema = z.object({
  dreamId: z.string().uuid(),
  dream: z.string().min(1, 'Dream description is required').max(3200),
  plan: z.string().min(1, 'Plan is required').max(4000),
  // REMOVED: hasDate: z.enum(['yes', 'no']),
  // REMOVED: dreamDate: z.string().nullable(),
  relationship: z.string().min(1, 'Relationship is required').max(4000),
  offering: z.string().min(1, 'Offering is required').max(2400),
  tone: z.enum(['gentle', 'intense', 'fusion']).default('fusion'),
  isPremium: z.boolean().default(false),
});

// Type inference from schema
export type CreateReflectionInput = z.infer<typeof createReflectionSchema>;

// Response schema
export const reflectionResponseSchema = z.object({
  id: z.string().uuid(),
  dreamId: z.string().uuid(),
  aiResponse: z.string(),
  tone: z.enum(['gentle', 'intense', 'fusion']),
  createdAt: z.date(),
});

export type ReflectionResponse = z.infer<typeof reflectionResponseSchema>;
```

**Key points:**
- Use `.min()` and `.max()` for string validation with custom messages
- Use `.uuid()` for ID validation
- Use `.enum()` for strict value sets
- Use `.default()` for optional fields with defaults
- Export both schema and inferred type
- Schema names end with `Schema`, type names match domain entity

---

## tRPC API Patterns

### Mutation with Input Validation

**When to use:** Creating/updating data with user input

**File:** `server/trpc/routers/reflection.ts`

**Code example:**
```typescript
import { router } from '../trpc';
import { usageLimitedProcedure } from '../middleware';
import { createReflectionSchema } from '@/types/schemas';
import { TRPCError } from '@trpc/server';
import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

export const reflectionRouter = router({
  create: usageLimitedProcedure
    .input(createReflectionSchema)
    .mutation(async ({ ctx, input }) => {
      console.log('🔍 Reflection.create called');
      console.log('📥 Input received:', JSON.stringify(input, null, 2));
      console.log('👤 User:', ctx.user.email, 'Tier:', ctx.user.tier);

      const {
        dreamId,
        dream,
        plan,
        // REMOVED: hasDate,
        // REMOVED: dreamDate,
        relationship,
        offering,
        tone = 'fusion',
        isPremium: requestedPremium = false,
      } = input;

      try {
        // Validate dream exists and belongs to user
        const { data: dreamRecord, error: dreamError } = await ctx.supabase
          .from('dreams')
          .select('*')
          .eq('id', dreamId)
          .eq('user_id', ctx.user.id)
          .single();

        if (dreamError || !dreamRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Dream not found or does not belong to you',
          });
        }

        // Determine if user gets premium AI
        const isPremium = requestedPremium && (ctx.user.tier === 'premium' || ctx.user.isCreator);

        // Build AI prompt (SIMPLIFIED for 4 questions)
        const intro = isPremium
          ? 'You are a soft, glossy, sharp AI companion that helps people see how they connect to their dreams.'
          : 'You are an AI companion helping people reflect on their dreams.';

        const userPrompt = `${intro}

**My dream:** ${dream}

**My plan:** ${plan}

**My relationship with this dream:** ${relationship}

**What I'm willing to give:** ${offering}

Please mirror back what you see, offering both gentle and sharp insights. Help me understand my relationship with this dream.`;

        console.log('🤖 Calling Anthropic API...');
        console.log('📝 Prompt length:', userPrompt.length, 'characters');

        // Call Anthropic API
        const client = getAnthropicClient();
        const message = await client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: isPremium ? 2048 : 1024,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          ...(isPremium && {
            thinking: {
              type: 'enabled',
              budget_tokens: 1000,
            },
          }),
        });

        // Extract text response
        const aiResponse = message.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('\n\n');

        if (!aiResponse) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate AI response',
          });
        }

        console.log('✅ AI response generated:', aiResponse.length, 'characters');

        // Calculate metadata
        const wordCount = aiResponse.split(/\s+/).length;
        const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

        // Save to database (REMOVED has_date and dream_date)
        const { data: reflectionRecord, error: reflectionError } = await ctx.supabase
          .from('reflections')
          .insert({
            user_id: ctx.user.id,
            dream_id: dreamId,
            dream,
            plan,
            // REMOVED: has_date: hasDate,
            // REMOVED: dream_date: hasDate === 'yes' ? dreamDate : null,
            relationship,
            offering,
            ai_response: aiResponse,
            tone,
            is_premium: isPremium,
            word_count: wordCount,
            estimated_read_time: estimatedReadTime,
          })
          .select()
          .single();

        if (reflectionError) {
          console.error('❌ Database error:', reflectionError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to save reflection',
          });
        }

        console.log('✅ Reflection created:', reflectionRecord.id);

        // Update user's reflection count
        await ctx.supabase.rpc('increment_reflection_count', {
          user_id: ctx.user.id,
        });

        return {
          id: reflectionRecord.id,
          aiResponse,
          tone,
          createdAt: new Date(reflectionRecord.created_at),
        };
      } catch (error) {
        console.error('❌ Reflection creation failed:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }),
});
```

**Key points:**
- Use `usageLimitedProcedure` for operations with tier limits
- Validate input with `.input(schema)`
- Extract input fields with destructuring
- Log at key points for debugging (start, API call, database insert, completion)
- Use `TRPCError` with specific codes (`NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`)
- Return only necessary data (don't leak sensitive fields)
- Update related counters/stats after main operation

---

## Database Patterns

### Supabase Query Pattern

**When to use:** Fetching/inserting data with type safety

**Code example:**
```typescript
import { createClient } from '@supabase/supabase-js';

// Fetch single record with validation
const { data: dream, error } = await supabase
  .from('dreams')
  .select('id, title, description, target_date, days_left, status, category')
  .eq('id', dreamId)
  .eq('user_id', userId) // Always filter by user for security
  .single();

if (error || !dream) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Dream not found',
  });
}

// Fetch multiple records with filters
const { data: reflections, error: reflectionsError } = await supabase
  .from('reflections')
  .select('id, dream_id, ai_response, tone, created_at')
  .eq('user_id', userId)
  .eq('dream_id', dreamId)
  .order('created_at', { ascending: false })
  .limit(10);

if (reflectionsError) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to fetch reflections',
  });
}

// Insert single record
const { data: reflection, error: insertError } = await supabase
  .from('reflections')
  .insert({
    user_id: userId,
    dream_id: dreamId,
    dream: formData.dream,
    plan: formData.plan,
    relationship: formData.relationship,
    offering: formData.offering,
    ai_response: aiResponse,
    tone: selectedTone,
  })
  .select()
  .single();

if (insertError) {
  console.error('Database error:', insertError);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to save reflection',
  });
}

// Update record
const { error: updateError } = await supabase
  .from('dreams')
  .update({ status: 'completed' })
  .eq('id', dreamId)
  .eq('user_id', userId); // Always validate ownership

if (updateError) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to update dream',
  });
}
```

**Key points:**
- Always use `.eq('user_id', userId)` to prevent unauthorized access
- Use `.single()` when expecting exactly one result
- Use `.select()` after `.insert()` to get created record
- Check `error` before using `data`
- Use specific error messages
- Use `.order()` for sorting (e.g., `created_at DESC`)
- Use `.limit()` to prevent large result sets

---

## Frontend Patterns

### React Component Structure

**When to use:** Building stateful UI components

**File:** `app/reflection/MirrorExperience.tsx`

**Code example:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast/useToast';
import { GlassCard, GlowButton, GlassInput, CosmicLoader } from '@/components/ui/glass';
import type { ToneId } from '@/lib/utils/constants';

interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

interface Dream {
  id: string;
  title: string;
  description: string;
  targetDate: string | null;
  daysLeft: number | null;
  category: string;
}

export default function MirrorExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  // URL params
  const dreamIdFromUrl = searchParams.get('dreamId');
  const reflectionIdFromUrl = searchParams.get('id');

  // View mode
  const [viewMode, setViewMode] = useState<'questionnaire' | 'output'>(
    reflectionIdFromUrl ? 'output' : 'questionnaire'
  );

  // Form state
  const [formData, setFormData] = useState<FormData>({
    dream: '',
    plan: '',
    relationship: '',
    offering: '',
  });

  // Selection state
  const [selectedDreamId, setSelectedDreamId] = useState(dreamIdFromUrl || '');
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneId>('fusion');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // tRPC queries
  const { data: dreams, isLoading: dreamsLoading } = trpc.dreams.list.useQuery(
    { status: 'active', includeStats: true },
    { enabled: viewMode === 'questionnaire' }
  );

  const { data: reflection, isLoading: reflectionLoading } = trpc.reflections.getById.useQuery(
    { id: reflectionIdFromUrl! },
    { enabled: !!reflectionIdFromUrl && viewMode === 'output' }
  );

  // tRPC mutation
  const createReflection = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      console.log('✅ Reflection created successfully:', data.id);
      toast.success('Your reflection has been created');

      // Navigate to output view
      router.push(`/reflection?id=${data.id}`);
      setViewMode('output');
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('❌ Reflection creation failed:', error);
      toast.error(`Error: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Update selected dream when list loads
  useEffect(() => {
    if (dreams && selectedDreamId) {
      const dream = dreams.find((d) => d.id === selectedDreamId);
      setSelectedDream(dream || null);
    }
  }, [dreams, selectedDreamId]);

  // Handlers
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDreamSelect = (dreamId: string) => {
    const dream = dreams?.find((d) => d.id === dreamId);
    setSelectedDream(dream || null);
    setSelectedDreamId(dreamId);
  };

  const validateForm = (): boolean => {
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
      toast.warning('Please describe what you\'re willing to give');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    createReflection.mutate({
      dreamId: selectedDreamId,
      dream: formData.dream,
      plan: formData.plan,
      relationship: formData.relationship,
      offering: formData.offering,
      tone: selectedTone,
    });
  };

  // Render logic
  if (dreamsLoading || reflectionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CosmicLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="mirror-experience">
      {viewMode === 'questionnaire' ? (
        <div className="questionnaire-container">
          <GlassCard variant="elevated" className="p-12">
            {!selectedDreamId ? (
              // Dream Selection
              <div className="dream-selection">
                <h2 className="text-center mb-8 text-2xl md:text-3xl">
                  Which dream are you reflecting on?
                </h2>
                <div className="space-y-4">
                  {dreams?.map((dream) => (
                    <div
                      key={dream.id}
                      onClick={() => handleDreamSelect(dream.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <GlassCard
                        variant={selectedDreamId === dream.id ? 'elevated' : 'default'}
                        glowColor={selectedDreamId === dream.id ? 'purple' : undefined}
                        hoverable
                        className="cursor-pointer p-4"
                      >
                        <h3 className="font-medium">{dream.title}</h3>
                        {dream.daysLeft && (
                          <p className="text-sm text-white/70">{dream.daysLeft} days left</p>
                        )}
                      </GlassCard>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // One-Page Reflection Form
              <div className="one-page-form">
                {/* All 4 Questions */}
                <div className="space-y-8 mb-8">
                  <div>
                    <h3 className="text-lg mb-3">1. What is {selectedDream?.title || 'this dream'}?</h3>
                    <GlassInput
                      variant="textarea"
                      value={formData.dream}
                      onChange={(value) => handleFieldChange('dream', value)}
                      placeholder="Describe this dream in detail..."
                      maxLength={3200}
                      showCounter
                      rows={6}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg mb-3">2. What is your plan?</h3>
                    <GlassInput
                      variant="textarea"
                      value={formData.plan}
                      onChange={(value) => handleFieldChange('plan', value)}
                      placeholder="Share the steps you envision taking..."
                      maxLength={4000}
                      showCounter
                      rows={6}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg mb-3">3. What's your relationship with this dream?</h3>
                    <GlassInput
                      variant="textarea"
                      value={formData.relationship}
                      onChange={(value) => handleFieldChange('relationship', value)}
                      placeholder="Describe how you relate to this aspiration..."
                      maxLength={4000}
                      showCounter
                      rows={6}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg mb-3">4. What are you willing to give?</h3>
                    <GlassInput
                      variant="textarea"
                      value={formData.offering}
                      onChange={(value) => handleFieldChange('offering', value)}
                      placeholder="What will you commit, sacrifice, or offer..."
                      maxLength={2400}
                      showCounter
                      rows={6}
                    />
                  </div>
                </div>

                {/* Tone Selection */}
                <div className="mb-8">
                  <h3 className="text-lg mb-4">Choose Your Reflection Tone</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'fusion' as ToneId, name: 'Sacred Fusion', emoji: '⚡' },
                      { id: 'gentle' as ToneId, name: 'Gentle Clarity', emoji: '🌸' },
                      { id: 'intense' as ToneId, name: 'Luminous Intensity', emoji: '🔥' },
                    ].map((tone) => (
                      <div
                        key={tone.id}
                        onClick={() => setSelectedTone(tone.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <GlassCard
                          variant={selectedTone === tone.id ? 'elevated' : 'default'}
                          glowColor={selectedTone === tone.id ? 'purple' : undefined}
                          hoverable
                          className="cursor-pointer text-center p-4"
                        >
                          <div className="text-4xl mb-2">{tone.emoji}</div>
                          <h4 className="font-medium">{tone.name}</h4>
                        </GlassCard>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <GlowButton
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-w-[250px]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <CosmicLoader size="sm" />
                        Creating...
                      </span>
                    ) : (
                      'Gaze into the Mirror'
                    )}
                  </GlowButton>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      ) : (
        // Reflection Output (unchanged)
        <div className="output-container">
          {reflection && (
            <GlassCard variant="elevated" className="p-12">
              <div className="prose prose-invert max-w-none">
                {reflection.aiResponse}
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
```

**Key points:**
- Use `'use client'` directive for stateful components
- Define interfaces at top for props and state types
- Group state variables by purpose (form, selection, UI)
- Use tRPC hooks for data fetching (`useQuery`, `useMutation`)
- Validate before mutation (client-side + server-side)
- Show loading states (`CosmicLoader`)
- Handle errors gracefully (toast notifications)
- Use semantic HTML (`role="button"` for clickable divs)

---

## Form Handling Pattern

**When to use:** Managing form input with validation

**Code example:**
```typescript
interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

const [formData, setFormData] = useState<FormData>({
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
});

const handleFieldChange = (field: keyof FormData, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};

const validateForm = (): boolean => {
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
    toast.warning('Please describe what you\'re willing to give');
    return false;
  }
  return true;
};

// In JSX
<GlassInput
  variant="textarea"
  value={formData.dream}
  onChange={(value) => handleFieldChange('dream', value)}
  placeholder="Describe this dream in detail..."
  maxLength={3200}
  showCounter
  rows={6}
/>
```

**Key points:**
- Single state object for related fields
- Generic change handler with field parameter
- Validation returns boolean (true = valid)
- Show specific error messages
- Use `.trim()` to check for empty strings

---

## Error Handling Patterns

### API Error Handling

**Code example:**
```typescript
// In tRPC mutation
const createReflection = trpc.reflection.create.useMutation({
  onSuccess: (data) => {
    console.log('✅ Reflection created:', data.id);
    toast.success('Your reflection has been created');
    router.push(`/reflection?id=${data.id}`);
    setIsSubmitting(false);
  },
  onError: (error) => {
    console.error('❌ Reflection creation failed:', error);

    // Show user-friendly message
    const message = error.message || 'Failed to create reflection. Please try again.';
    toast.error(message);

    setIsSubmitting(false);
  },
});

// In server-side code
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);

  if (error instanceof TRPCError) {
    throw error; // Already formatted
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : 'Unknown error occurred',
  });
}
```

**Key points:**
- Always handle `onError` in mutations
- Log errors with context (operation name, user ID)
- Show user-friendly messages (don't leak stack traces)
- Reset loading states in error handlers
- Use specific error codes (`NOT_FOUND`, `BAD_REQUEST`, etc.)

---

## Utility Patterns

### Character Limit Constants

**File:** `lib/utils/constants.ts`

**Code example:**
```typescript
export const QUESTION_LIMITS = {
  dream: 3200,
  plan: 4000,
  relationship: 4000,
  sacrifice: 2400, // Note: "sacrifice" for historical reasons, means "offering"
} as const;

export const TIER_LIMITS = {
  free: 1,
  essential: 5,
  premium: 10,
} as const;

export type ToneId = 'gentle' | 'intense' | 'fusion';

export const TONES: Record<ToneId, { name: string; description: string; emoji: string }> = {
  gentle: {
    name: 'Gentle Clarity',
    description: 'Compassionate and nurturing',
    emoji: '🌸',
  },
  intense: {
    name: 'Luminous Intensity',
    description: 'Direct and transformative',
    emoji: '🔥',
  },
  fusion: {
    name: 'Sacred Fusion',
    description: 'Balanced wisdom and warmth',
    emoji: '⚡',
  },
};
```

**Key points:**
- Use `as const` for immutable constants
- Export both values and types
- Group related constants together
- Use descriptive names

---

## Import Order Convention

**Standard order for all files:**

```typescript
// 1. External dependencies (React, Next.js, libraries)
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// 2. tRPC and API utilities
import { trpc } from '@/lib/trpc';
import { TRPCError } from '@trpc/server';

// 3. Type imports
import type { CreateReflectionInput } from '@/types/schemas';
import type { ToneId } from '@/lib/utils/constants';

// 4. Component imports
import { GlassCard, GlowButton, GlassInput } from '@/components/ui/glass';
import { useToast } from '@/components/ui/toast/useToast';

// 5. Hooks and utilities
import { useAuth } from '@/hooks/useAuth';
import { QUESTION_LIMITS, TONES } from '@/lib/utils/constants';

// 6. Local imports (relative paths)
import { buildReflectionPrompt } from './prompts';
```

**Key points:**
- External dependencies first
- Type imports separate (use `import type`)
- Component imports grouped
- Local imports last
- Alphabetize within each group
- Use `@/` alias for absolute imports

---

## Code Quality Standards

### TypeScript Strictness

**All TypeScript must:**
- Use explicit types for function parameters
- Avoid `any` (use `unknown` if type truly unknown)
- Define interfaces for complex objects
- Use type inference for obvious cases (e.g., `const x = 'string'`)
- Export types from schemas (use `z.infer<typeof schema>`)

**Example:**
```typescript
// Good
interface Dream {
  id: string;
  title: string;
  targetDate: string | null;
}

function processDream(dream: Dream): string {
  return dream.title;
}

// Bad
function processDream(dream: any) {
  return dream.title;
}
```

### Logging Convention

**Development logging:**
```typescript
console.log('🔍 Debug:', variable);      // Debug info
console.log('📥 Input:', input);         // Input received
console.log('✅ Success:', result);       // Success
console.error('❌ Error:', error);        // Error
console.log('🤖 API Call:', params);     // External API
console.log('💾 Database:', query);      // Database operation
```

**Key points:**
- Use emojis for quick visual scanning
- Include context (operation name, user ID)
- Log at key decision points
- Remove or conditionalize logs for production

### Validation Best Practices

1. **Validate on both client and server** (never trust client)
2. **Use Zod schemas** for consistent validation
3. **Provide specific error messages** (not just "Validation failed")
4. **Validate ownership** (always check `user_id` matches)
5. **Validate required relationships** (e.g., dream exists before creating reflection)

---

## Performance Patterns

### Lazy API Client Initialization

**When to use:** External APIs (Anthropic, Supabase) in serverless functions

**Code example:**
```typescript
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

// Usage
const client = getAnthropicClient();
const response = await client.messages.create({ ... });
```

**Key points:**
- Create client on first use (not at module load)
- Cache client for subsequent calls
- Validate env vars with clear error messages
- Pattern works for any external service client

---

## Security Patterns

### User Ownership Validation

**Always validate ownership for sensitive operations:**

```typescript
// Fetch with user validation
const { data: dream, error } = await supabase
  .from('dreams')
  .select('*')
  .eq('id', dreamId)
  .eq('user_id', ctx.user.id) // ← CRITICAL: Validate ownership
  .single();

if (error || !dream) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Dream not found or does not belong to you',
  });
}

// Update with user validation
const { error: updateError } = await supabase
  .from('dreams')
  .update({ status: 'completed' })
  .eq('id', dreamId)
  .eq('user_id', ctx.user.id); // ← CRITICAL: Prevent unauthorized updates
```

**Key points:**
- **NEVER** skip `.eq('user_id', ctx.user.id)`
- Check ownership before read, update, delete
- Return generic "not found" (don't leak existence of other users' data)
- Use row-level security as second layer (database policies)

---

## Testing Patterns

### Manual Testing Checklist Format

**For each feature, create checklist with:**

```markdown
## Test: Reflection Creation (Happy Path)

**Setup:**
- [ ] Supabase running: `npx supabase status`
- [ ] Dev server running: `npm run dev`
- [ ] Logged in as: ahiya.butman@gmail.com

**Steps:**
1. [ ] Navigate to /reflection
2. [ ] Select dream "Test Dream"
3. [ ] Fill Q1 (dream): "Testing the new one-page flow"
4. [ ] Fill Q2 (plan): "Complete all 4 questions smoothly"
5. [ ] Fill Q3 (relationship): "Excited to see this working"
6. [ ] Fill Q4 (offering): "My time and attention"
7. [ ] Select tone: Fusion
8. [ ] Click "Gaze into the Mirror"

**Expected Results:**
- [ ] No console errors
- [ ] Network request succeeds (200 status)
- [ ] Redirected to /reflection?id=[uuid]
- [ ] AI response displayed
- [ ] Database record created (check Supabase Studio)
- [ ] Response includes references to user's answers

**Edge Cases:**
- [ ] Try submitting with empty dream field → validation error shown
- [ ] Try submitting without selecting dream → validation error shown
- [ ] Fill all fields with max characters → no errors, submission works
```

**Key points:**
- Include setup steps (environment, auth)
- Number all steps
- Define expected results clearly
- Test edge cases separately
- Mark each item as complete during testing

---

**Patterns Status:** COMPREHENSIVE
**Ready For:** Builder Implementation
**Next:** Builder Task Breakdown
