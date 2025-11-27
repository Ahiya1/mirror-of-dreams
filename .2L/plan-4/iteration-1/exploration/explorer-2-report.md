# Explorer 2 Report: MirrorExperience Component & UX Flow Analysis

## Executive Summary

The MirrorExperience component (781 lines) is a multi-step wizard with complex state management that needs transformation into a simple one-page, 4-question reflection flow. Current implementation uses 7 steps (dream selection + 5 questions + tone) with conditional logic for date questions. The refactoring will remove ~300 lines of step navigation code while preserving all validation logic and UI components. **Key finding**: The date-related questions (steps 3-4) are redundant since dream objects already contain `target_date` and `days_left` fields.

## Discoveries

### Current Multi-Step Architecture

**Step Flow (0-6):**
- **Step 0**: Dream selection (shows all active dreams with `daysLeft` badge)
- **Step 1**: Q1 - "What is your deepest dream?" (3200 char limit)
- **Step 2**: Q2 - "What is your plan to bring it to life?" (4000 char limit)
- **Step 3**: Q3 - "Do you have a timeline in mind?" (YES/NO choice) **← TO BE REMOVED**
- **Step 4**: Q4 - "When do you envision this becoming reality?" (conditional, 500 char) **← TO BE REMOVED**
- **Step 5**: Q5 - "What relationship do you seek with your dream?" (4000 char limit)
- **Step 6**: Q6 - "What are you willing to offer in service of this dream?" (2400 char limit)
- **Step 7**: Tone selection (Gentle/Intense/Fusion)

**State Management:**
```typescript
const [currentStep, setCurrentStep] = useState(dreamIdFromUrl ? 1 : 0);
const [formData, setFormData] = useState<FormData>({
  dream: '',
  plan: '',
  hasDate: '',        // ← TO BE REMOVED
  dreamDate: '',      // ← TO BE REMOVED
  relationship: '',
  offering: '',
});
```

**Navigation Logic:**
- `handleNext()`: Validates current field, increments `currentStep`
- `handleBack()`: Decrements `currentStep`
- Conditional question rendering based on `formData.hasDate === 'yes'`
- Progress tracking via `ProgressOrbs` component (5 orbs)

### Component Architecture Deep Dive

**File Structure:**
```
app/reflection/MirrorExperience.tsx (781 lines)
├── Imports (14 lines)
├── Interface Definitions (15 lines)
├── Component Logic (550 lines)
│   ├── State Management (60 lines)
│   ├── tRPC Queries/Mutations (20 lines)
│   ├── Event Handlers (50 lines)
│   ├── Question Configuration (40 lines)
│   └── Render Logic (380 lines)
└── Embedded Styles (200 lines)
```

**Key Dependencies:**
- `framer-motion`: AnimatePresence, motion (for step transitions)
- `trpc`: `dreams.list`, `reflections.getById`, `reflection.create`
- `useAuth`: User context
- `useToast`: Error/success notifications
- Glass components: `GlassCard`, `GlowButton`, `GlassInput`, `ProgressOrbs`, `CosmicLoader`

**Current Render Flow:**
```tsx
{viewMode === 'questionnaire' ? (
  <GlassCard>
    {currentStep === 0 ? <DreamSelection /> :
     currentStep <= 5 ? <QuestionView /> :
     <ToneSelection />}
  </GlassCard>
) : (
  <ReflectionOutput />
)}
```

### Question Structure Analysis

**Current Questions (with redundancy):**
1. **Q1 (dream)**: Generic "What is your deepest dream?" 
   - **Issue**: Doesn't reference the SPECIFIC dream user selected
   - Limit: 3200 chars (from `QUESTION_LIMITS.dream`)

2. **Q2 (plan)**: Generic "What is your plan to bring it to life?"
   - **Issue**: No dream context
   - Limit: 4000 chars (from `QUESTION_LIMITS.plan`)

3. **Q3 (hasDate)**: "Do you have a timeline in mind?" (YES/NO)
   - **REDUNDANT**: Dream object already has `target_date` field
   - **REMOVE**: This question entirely

4. **Q4 (dreamDate)**: "When do you envision this becoming reality?" (conditional)
   - **REDUNDANT**: Dream object already has `target_date` and `daysLeft`
   - **REMOVE**: This question entirely

5. **Q5 (relationship)**: Generic "What relationship do you seek with your dream?"
   - **Issue**: No dream context
   - Limit: 4000 chars (from `QUESTION_LIMITS.relationship`)

6. **Q6 (offering)**: Generic "What are you willing to offer in service of this dream?"
   - **Issue**: No dream context
   - Limit: 2400 chars (from `QUESTION_LIMITS.sacrifice` - note: typo in constant name)

**Target Questions (contextualized):**
1. **Q1**: "What is THIS dream?" (reference selected dream by name)
2. **Q2**: "What is your plan FOR THIS DREAM?"
3. **Q3**: "What's your relationship WITH THIS DREAM?"
4. **Q4**: "What are you willing to give FOR THIS DREAM?"

### Database Schema Insights

**Reflections Table:**
```sql
CREATE TABLE public.reflections (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    dream_id UUID REFERENCES public.dreams(id), -- Added in dreams migration
    dream TEXT NOT NULL,
    plan TEXT NOT NULL,
    has_date TEXT CHECK (has_date IN ('yes', 'no')), -- ← TO BE REMOVED
    dream_date DATE,                                  -- ← TO BE REMOVED
    relationship TEXT NOT NULL,
    offering TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    tone TEXT DEFAULT 'fusion',
    -- ... metadata fields
);
```

**Dreams Table (for reference):**
```sql
CREATE TABLE public.dreams (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,        -- ← Already captures date info
    days_left INTEGER,       -- ← Computed field
    status TEXT,
    category TEXT,
    -- ... other fields
);
```

**Key Finding**: The `has_date` and `dream_date` columns in `reflections` table are redundant with `dreams.target_date`. User already specified their date when creating the dream.

### Form Validation Current State

**Validation Logic:**
- `handleNext()`: Checks if current field is filled before advancing
- Submit validation: Requires `selectedDreamId` to be set
- Character limits enforced via `GlassInput` component's `maxLength` prop
- No client-side validation for minimum lengths (handled by tRPC schema)

**tRPC Schema (createReflectionSchema):**
```typescript
export const createReflectionSchema = z.object({
  dreamId: z.string().uuid(),
  dream: z.string().min(1).max(3200),
  plan: z.string().min(1).max(4000),
  hasDate: z.enum(['yes', 'no']),        // ← TO BE REMOVED
  dreamDate: z.string().nullable(),      // ← TO BE REMOVED
  relationship: z.string().min(1).max(4000),
  offering: z.string().min(1).max(2400),
  tone: z.enum(['gentle', 'intense', 'fusion']).default('fusion'),
  isPremium: z.boolean().default(false),
});
```

**Schema Changes Needed:**
- Remove `hasDate` field (enum validation)
- Remove `dreamDate` field (nullable string)
- Update server-side router to not expect these fields

### Tone Selection Implementation

**Current Implementation:**
- Step 7 (after all questions)
- 3 tone cards in grid layout (`grid-cols-1 sm:grid-cols-3`)
- Each tone: emoji, name, description, conditional glow
- Default: `selectedTone = 'fusion'`
- Cards use `GlassCard` with `glowColor` prop

**Tones:**
1. **Fusion** (⚡): "Sacred Fusion - Balanced wisdom and warmth" (cosmic glow)
2. **Gentle** (🌸): "Gentle Clarity - Compassionate and nurturing" (blue glow)
3. **Intense** (🔥): "Luminous Intensity - Direct and transformative" (purple glow)

**Target Position**: Bottom of one-page layout (after all 4 questions)

## Patterns Identified

### Pattern 1: Step-Based State Machine

**Description:** Component uses `currentStep` integer to drive wizard flow with conditional rendering

**Current Implementation:**
```typescript
const currentQuestion = currentStep > 0 ? questions[currentStep - 1] : null;

{currentStep === 0 ? <DreamSelection /> :
 currentStep <= 5 ? <QuestionView /> :
 <ToneSelection />}
```

**Replacement Pattern:** Single-page scrollable form with all sections visible

**Recommendation:** **REMOVE** step-based logic entirely. Replace with section-based layout.

### Pattern 2: Conditional Question Rendering

**Description:** Questions conditionally shown based on previous answers (`hasDate === 'yes'`)

**Current Implementation:**
```typescript
const questions = [
  { id: 'dream', text: '...', limit: 3200 },
  { id: 'plan', text: '...', limit: 4000 },
  { id: 'hasDate', text: '...', type: 'choice', choices: ['yes', 'no'] },
  ...(formData.hasDate === 'yes' ? [{
    id: 'dreamDate', text: '...', limit: 500
  }] : []),
  { id: 'relationship', text: '...', limit: 4000 },
  { id: 'offering', text: '...', limit: 2400 },
];
```

**Recommendation:** **REMOVE** conditional logic. All 4 questions always visible.

### Pattern 3: Glass Design System Usage

**Description:** Consistent use of glass morphism components throughout

**Components Used:**
- `GlassCard`: Main container with variant="elevated"
- `GlowButton`: Navigation and submit buttons with variant="primary"
- `GlassInput`: Text areas with variant="textarea"
- `ProgressOrbs`: Multi-step progress indicator
- `CosmicLoader`: Loading states

**Recommendation:** **KEEP** glass components but simplify usage (remove ProgressOrbs, simplify button states)

### Pattern 4: Ambient Visual Elements

**Description:** Tone-based background animations (fusion-breath, gentle-star, intense-swirl)

**Current Implementation:**
- 20 floating cosmic particles
- Tone-specific ambient elements (12 gentle stars, 2 fusion orbs, 2 intense swirls)
- Embedded `<style jsx>` with keyframe animations

**Recommendation:** **KEEP** ambient elements but ensure they don't compete with one-page layout

## Complexity Assessment

### High Complexity Areas

#### 1. **Multi-Step Navigation Removal** (Effort: 4-5 hours)
**Why Complex:**
- 7 conditional render branches to flatten
- Step transition animations to remove
- Progress tracking (ProgressOrbs) to eliminate
- Navigation buttons (Back/Continue) to consolidate into single Submit

**Estimated Builder Splits:** None (cohesive refactor)

**Approach:**
1. Remove `currentStep` state variable
2. Remove `handleNext()` and `handleBack()` functions
3. Remove `currentQuestion` derived state
4. Flatten conditional rendering into 4 always-visible sections
5. Remove `ProgressOrbs` component usage
6. Move tone selection to bottom of page (no separate step)

#### 2. **Form Data Structure Simplification** (Effort: 2 hours)
**Why Complex:**
- Remove `hasDate` and `dreamDate` fields from FormData interface
- Update all references to `formData.hasDate` and `formData.dreamDate`
- Update tRPC mutation call to not send removed fields
- Update schema validation (types/schemas.ts)
- Update server router (server/trpc/routers/reflection.ts)

**Estimated Builder Splits:** None (tightly coupled changes)

**Files Affected:**
- `app/reflection/MirrorExperience.tsx` (FormData interface, mutation call)
- `types/schemas.ts` (createReflectionSchema)
- `server/trpc/routers/reflection.ts` (input destructuring, database insert)

#### 3. **Question Contextualization** (Effort: 1-2 hours)
**Why Complex:**
- Need access to selected dream object (not just ID)
- Update question text to reference dream by name
- Ensure dream context visible while answering questions

**Approach:**
1. Fetch selected dream object (already available from `dreams.list` query)
2. Store selected dream object in state (not just ID)
3. Update question text to interpolate dream title: `"What is your plan for ${selectedDream.title}?"`
4. Optionally show dream card/summary at top of form

### Medium Complexity Areas

#### 1. **Responsive Layout for One-Page Scrolling** (Effort: 2-3 hours)
**Current Mobile Support:**
- Tailwind breakpoints: `sm:` (640px), `md:` (768px)
- Headers: `text-2xl md:text-3xl`
- Tone grid: `grid-cols-1 sm:grid-cols-3`
- Media query: `@media (max-width: 768px)` for padding adjustments

**New Considerations:**
- 4 textareas stacked vertically (potentially 2000+ px total height)
- Tone selection at bottom (must remain visible/accessible)
- Submit button always accessible (sticky footer or scroll-to-bottom)
- Mobile keyboard covering input (ensure scroll-into-view)

**Recommendation:**
- Use `max-h-[600px] overflow-y-auto` for scrollable container
- Sticky submit button at bottom of viewport (mobile)
- Smooth scroll to focused input on mobile

#### 2. **Validation Strategy Change** (Effort: 1 hour)
**Current:** Step-by-step validation (can't proceed without filling current field)

**Target:** All-at-once validation on submit

**Approach:**
- Remove per-step validation in `handleNext()`
- Add comprehensive validation in `handleSubmit()`:
  ```typescript
  if (!formData.dream.trim()) {
    toast.warning('Please elaborate on your dream');
    return;
  }
  // ... repeat for all 4 questions
  ```
- Optionally add visual indicators for incomplete fields (red border)

### Low Complexity Areas

#### 1. **Tone Selection Repositioning** (Effort: 30 min)
- Move tone selection JSX from step 7 branch to bottom of one-page layout
- No logic changes needed
- Already responsive (`grid-cols-1 sm:grid-cols-3`)

#### 2. **Remove Conditional Date Question** (Effort: 15 min)
- Delete `hasDate` question object from `questions` array
- Delete conditional `dreamDate` question
- No other dependencies

#### 3. **Update Copy to Reference "THIS dream"** (Effort: 15 min)
- Update 4 question texts to reference selected dream
- Simple string interpolation: `"What is your plan for ${selectedDream.title}?"`

## Technology Recommendations

### Primary Stack (No Changes Needed)

**Framework: Next.js 14 App Router**
- **Rationale**: Already in use, App Router patterns established
- **Client Component**: `'use client'` directive present (needed for useState)
- **No changes required**

**tRPC + React Query**
- **Rationale**: Type-safe API already working
- **Queries in use**: `dreams.list`, `reflections.getById`
- **Mutation in use**: `reflection.create`
- **Change needed**: Update `createReflectionSchema` to remove date fields

**Glass Design System**
- **Rationale**: Consistent UI components, well-abstracted
- **Components to keep**: GlassCard, GlowButton, GlassInput, CosmicLoader
- **Component to remove**: ProgressOrbs (no longer needed)

**Framer Motion**
- **Current usage**: AnimatePresence for step transitions, motion.div for animations
- **Target usage**: Remove step transitions, keep smooth page transitions only
- **Restraint principle**: Remove scale/pop animations (per vision.md)

### Supporting Libraries (No Changes)

**Tailwind CSS**
- **Usage**: Responsive breakpoints, utility classes
- **No changes needed** (well-established patterns)

**Lucide React Icons**
- **Current usage**: `Check` icon for selected dream
- **Keep as-is** (minimal icon usage aligns with restraint principle)

## Integration Points

### External Dependencies

#### 1. **tRPC Routers**
**File**: `server/trpc/routers/reflection.ts`

**Current Integration:**
```typescript
export const reflectionRouter = router({
  create: usageLimitedProcedure
    .input(createReflectionSchema)
    .mutation(async ({ ctx, input }) => {
      const { dreamId, dream, plan, hasDate, dreamDate, relationship, offering, tone } = input;
      // ... calls Anthropic API
      // ... saves to database
    })
});
```

**Required Changes:**
1. Update input destructuring (remove `hasDate`, `dreamDate`)
2. Update database insert (remove `has_date`, `dream_date` columns)
3. Update user prompt sent to Claude (remove date mention)

**Impact**: MEDIUM (requires testing API integration)

#### 2. **Database Insert**
**File**: `server/trpc/routers/reflection.ts` (line 133-151)

**Current Code:**
```typescript
await supabase.from('reflections').insert({
  user_id: ctx.user.id,
  dream_id: dreamId,
  dream,
  plan,
  has_date: hasDate,           // ← REMOVE
  dream_date: hasDate === 'yes' ? dreamDate : null,  // ← REMOVE
  relationship,
  offering,
  ai_response: formattedReflection,
  tone,
  // ... metadata
});
```

**Required Changes:**
- Remove `has_date` field
- Remove `dream_date` field
- No other changes needed

#### 3. **Anthropic Claude API Prompt**
**File**: `server/trpc/routers/reflection.ts` (line 76-88)

**Current Prompt:**
```typescript
const userPrompt = `${intro}**My dream:** ${dream}

**My plan:** ${plan}

**Have I set a definite date?** ${hasDate}${
  hasDate === 'yes' && dreamDate ? ` (Date: ${dreamDate})` : ''
}

**My relationship with this dream:** ${relationship}

**What I'm willing to give:** ${offering}

Please mirror back what you see...`;
```

**Required Changes:**
- Remove `**Have I set a definite date?**` line
- **OPTIONALLY**: Add dream context from dream object (title, description, target_date)
- Result: Cleaner prompt focused on 4 questions

### Internal Integrations

#### 1. **Dreams List Query**
**Current Usage:**
```typescript
const { data: dreams } = trpc.dreams.list.useQuery({
  status: 'active',
  includeStats: true,
}, { enabled: viewMode === 'questionnaire' });
```

**Enhancement Needed:**
- Keep query as-is (fetches all active dreams)
- Store **full dream object** in state when selected (not just ID)
- Use dream object for question contextualization

**Implementation:**
```typescript
const [selectedDream, setSelectedDream] = useState<Dream | null>(null);

// In dream selection handler:
const handleDreamSelect = (dreamId: string) => {
  const dream = dreams.find(d => d.id === dreamId);
  setSelectedDream(dream);
  setSelectedDreamId(dreamId);
};
```

#### 2. **Toast Notifications**
**Current Usage:**
- `toast.warning('Please select a dream')`
- `toast.error(`Error: ${error.message}`)`

**Changes Needed:**
- Update validation messages for one-page flow
- Add field-specific validation messages:
  - "Please elaborate on your dream"
  - "Please describe your plan"
  - "Please share your relationship with this dream"
  - "Please describe what you're willing to give"

#### 3. **Form State Management**
**Current Pattern:**
```typescript
const handleFieldChange = (field: keyof FormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

**Changes Needed:**
- Remove `hasDate` and `dreamDate` from FormData interface
- Update field handler to only handle 4 fields: dream, plan, relationship, offering
- Simplified interface:
  ```typescript
  interface FormData {
    dream: string;
    plan: string;
    relationship: string;
    offering: string;
  }
  ```

## Risks & Challenges

### Technical Risks

#### 1. **tRPC Schema Mismatch** (Likelihood: MEDIUM, Impact: HIGH)
**Risk**: If schema changes aren't synchronized between client/server, reflection creation will fail

**Mitigation Strategy:**
1. Update `types/schemas.ts` first (remove fields from schema)
2. Update server router second (remove fields from destructuring/insert)
3. Update client component last (remove fields from mutation call)
4. Test with actual API call before committing
5. Add error logging to catch schema validation errors

**Validation Checklist:**
- [ ] Schema updated in types/schemas.ts
- [ ] Server router updated to not expect removed fields
- [ ] Client mutation call doesn't send removed fields
- [ ] Test reflection creation end-to-end
- [ ] Check Supabase database for correct data insertion

#### 2. **Mobile Scroll Performance** (Likelihood: LOW, Impact: MEDIUM)
**Risk**: Long scrollable form with 4 textareas may cause performance issues on mobile

**Mitigation Strategy:**
1. Use CSS `overflow-y: auto` instead of JavaScript scroll
2. Ensure smooth scrolling with `-webkit-overflow-scrolling: touch`
3. Test on actual mobile devices (not just browser DevTools)
4. Monitor textarea re-render performance (React.memo if needed)
5. Use `rows` prop to limit initial textarea height (expand on focus)

**Performance Checklist:**
- [ ] Test scroll performance on iPhone Safari
- [ ] Test scroll performance on Android Chrome
- [ ] Verify keyboard doesn't cover submit button
- [ ] Ensure smooth scroll to focused input
- [ ] No jank when typing in textareas

#### 3. **AI Prompt Quality Degradation** (Likelihood: LOW, Impact: MEDIUM)
**Risk**: Removing date questions might reduce context for AI reflection

**Mitigation Strategy:**
1. **OPTIONAL**: Add dream object fields to prompt (title, description, target_date)
2. AI already receives 4 rich questions (dream, plan, relationship, offering)
3. Date context is less important than relationship/offering depth
4. Test AI responses with new prompt structure
5. Compare quality before/after changes

**Enhanced Prompt Option:**
```typescript
const userPrompt = `${intro}
**Dream Context:**
- Title: ${selectedDream.title}
- Description: ${selectedDream.description}
${selectedDream.targetDate ? `- Target Date: ${selectedDream.targetDate} (${selectedDream.daysLeft} days left)` : ''}

**My reflection:**

**What this dream means to me:** ${dream}

**My plan:** ${plan}

**My relationship with this dream:** ${relationship}

**What I'm willing to give:** ${offering}

Please mirror back what you see...`;
```

### Complexity Risks

#### 1. **Over-Simplification** (Likelihood: MEDIUM)
**Risk**: Removing step-by-step flow might make form overwhelming (4 questions + tone all at once)

**Mitigation Strategy:**
1. Use visual hierarchy (clear section headers)
2. Add subtle dividers between questions
3. Use smooth scroll to guide user through questions
4. Add progress indicator (e.g., "Question 2 of 4" when focused)
5. Test with actual user (Ahiya) to gather feedback

**UX Enhancements:**
- Numbered questions: "1. What is this dream?" (instead of just question text)
- Visual sections: Each question in its own `GlassCard` (nested within main card)
- Focus states: Highlight active question with glow
- Completion indicators: Checkmark when question filled

#### 2. **Validation Timing** (Likelihood: LOW)
**Risk**: Users might miss validation errors if all shown at once

**Mitigation Strategy:**
1. Show inline validation on blur (not just on submit)
2. Use visual cues (red border, warning icon) for incomplete fields
3. Scroll to first incomplete field on submit attempt
4. Toast message with specific field name: "Please complete: Your Dream"

**Validation Implementation:**
```typescript
const validateForm = () => {
  const errors: string[] = [];
  if (!formData.dream.trim()) errors.push('Your Dream');
  if (!formData.plan.trim()) errors.push('Your Plan');
  if (!formData.relationship.trim()) errors.push('Your Relationship');
  if (!formData.offering.trim()) errors.push('Your Offering');
  
  if (errors.length > 0) {
    toast.warning(`Please complete: ${errors.join(', ')}`);
    return false;
  }
  return true;
};
```

## Recommendations for Planner

### 1. **Prioritize Schema Changes as Foundation** (HIGH PRIORITY)
**Rationale**: Schema must be updated before component changes to avoid runtime errors

**Sequence:**
1. Update `types/schemas.ts` (remove `hasDate`, `dreamDate` from createReflectionSchema)
2. Update `server/trpc/routers/reflection.ts` (remove fields from destructuring, insert, prompt)
3. Test with Postman/curl to verify schema validation works
4. Only then update component

**Why Critical**: tRPC will throw validation errors if client sends fields not in schema

### 2. **Refactor Component in Single Cohesive Pass** (MEDIUM PRIORITY)
**Rationale**: Multi-step removal affects many interconnected parts (state, handlers, render)

**Anti-pattern to Avoid:**
- Incremental step removal (e.g., "first remove step 3, test, then remove step 4")
- Partial flattening (keeping some step logic while removing others)

**Recommended Approach:**
1. Create new component structure skeleton (all 4 questions visible)
2. Copy over form data state and handlers (simplified)
3. Copy over validation logic (updated for all-at-once)
4. Copy over dream selection (move to top of one-page)
5. Copy over tone selection (move to bottom of one-page)
6. Copy over submit logic (simplified)
7. Remove all step-related code in one pass
8. Test complete flow

**Estimated Time**: 4-6 hours (including testing)

### 3. **Enhance Dream Contextualization** (LOW PRIORITY - NICE TO HAVE)
**Rationale**: Questions should reference specific dream for better reflection quality

**Implementation Options:**

**Option A (Minimal)**: Update question text only
```typescript
const questions = [
  { id: 'dream', text: `What is ${selectedDream?.title || 'this dream'}?` },
  { id: 'plan', text: `What is your plan for ${selectedDream?.title || 'this dream'}?` },
  // ... etc
];
```

**Option B (Enhanced)**: Show dream card at top
```tsx
{selectedDream && (
  <GlassCard variant="default" className="mb-6">
    <div className="flex items-center gap-3">
      <span className="text-3xl">{categoryEmoji[selectedDream.category]}</span>
      <div>
        <h3 className="text-lg font-medium">{selectedDream.title}</h3>
        {selectedDream.daysLeft && (
          <p className="text-sm text-white/70">{selectedDream.daysLeft} days left</p>
        )}
      </div>
    </div>
  </GlassCard>
)}
```

**Recommendation**: Start with Option A (simple), add Option B if Ahiya feedback indicates confusion

### 4. **Mobile-First Responsive Testing** (HIGH PRIORITY)
**Rationale**: One-page scrollable form is more mobile-critical than wizard

**Test Scenarios:**
1. **iPhone SE (375px width)**: Smallest common viewport
2. **iPhone 12 Pro (390px width)**: Most common iPhone
3. **iPad (768px width)**: Tablet landscape
4. **Desktop (1440px width)**: Full experience

**Test Actions:**
- Select dream from list (scrolling if many dreams)
- Fill all 4 textareas (check keyboard covering input)
- Select tone (3 cards should stack on mobile)
- Submit (button always accessible)
- Check animations don't cause jank

**Mobile Optimizations:**
```css
/* Ensure scrollable container works on mobile */
.mirror-surface {
  max-height: calc(100vh - 120px); /* Account for header/padding */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Smooth iOS scroll */
}

/* Sticky submit button on mobile */
@media (max-width: 768px) {
  .submit-button-container {
    position: sticky;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    padding: 1rem;
    z-index: 10;
  }
}
```

### 5. **Optional Database Migration** (LOW PRIORITY - DEFER)
**Rationale**: Removing `has_date` and `dream_date` columns is non-breaking (can be nullable)

**Options:**

**Option A (Safe - Recommended)**: Make columns nullable, don't remove
```sql
-- No migration needed
-- Existing columns remain, new reflections won't populate them
-- Old reflections keep historical data
```

**Option B (Clean - Post-MVP)**: Remove columns via migration
```sql
-- Migration: 20251127_remove_reflection_date_fields.sql
ALTER TABLE public.reflections
  DROP COLUMN IF EXISTS has_date,
  DROP COLUMN IF EXISTS dream_date;
```

**Recommendation**: **DEFER** to post-plan-4. Columns being NULL is not harmful, and it preserves historical data.

### 6. **Validation Strategy Decision** (MEDIUM PRIORITY)
**Question for Planner**: Should validation be on-blur (per-field) or on-submit (all-at-once)?

**Option A (On-Submit - Simpler):**
- Validate all fields when "Gaze into the Mirror" clicked
- Show toast with first missing field
- Scroll to first incomplete field

**Option B (On-Blur - Better UX):**
- Validate each field when user tabs away
- Show red border + icon for incomplete fields
- Still validate all on submit (catch edge cases)

**Recommendation**: Start with **Option A** (simpler, aligns with restraint principle), upgrade to **Option B** if Ahiya feedback indicates confusion.

## Resource Map

### Critical Files/Directories

**Primary Refactor:**
- `/app/reflection/MirrorExperience.tsx` (781 lines → ~500 lines after refactor)
  - Remove: Step navigation logic, ProgressOrbs, conditional questions
  - Add: Scrollable one-page layout, dream contextualization
  - Keep: Form state, validation, tRPC mutation, tone selection, styling

**Schema Updates:**
- `/types/schemas.ts` (117 lines)
  - Update: `createReflectionSchema` (remove 2 fields)
  - Lines to change: 40-50 (reflection schema block)

**Server Router:**
- `/server/trpc/routers/reflection.ts` (254 lines)
  - Update: Input destructuring (line 38-48)
  - Update: Database insert (line 133-151)
  - Update: User prompt (line 76-88)
  - Add: Optional dream context to prompt

**UI Components (No Changes - Reference Only):**
- `/components/ui/glass/GlassCard.tsx`
- `/components/ui/glass/GlowButton.tsx`
- `/components/ui/glass/GlassInput.tsx`
- `/components/ui/glass/CosmicLoader.tsx`
- `/components/ui/glass/ProgressOrbs.tsx` (REMOVE from imports)

### Key Dependencies

**tRPC Integration:**
- Query: `trpc.dreams.list` (fetch active dreams for selection)
- Query: `trpc.reflections.getById` (fetch reflection output)
- Mutation: `trpc.reflection.create` (submit reflection)

**Constants:**
- `/lib/utils/constants.ts`
  - `QUESTION_LIMITS`: Character limits for textareas
  - `TONES`: Tone configuration (Gentle/Intense/Fusion)
  - `ToneId` type export

**Hooks:**
- `useAuth`: User authentication state
- `useToast`: Notification system
- `useRouter`, `useSearchParams`: Next.js navigation

**External APIs:**
- Anthropic Claude API (via server router)
- Supabase PostgreSQL (via server router)

### Testing Infrastructure

**Manual Testing Checklist:**
```markdown
## Pre-Refactor (Baseline)
- [ ] Complete reflection with date (YES)
- [ ] Complete reflection without date (NO)
- [ ] Verify reflection saved to database
- [ ] Check AI response quality

## Post-Refactor (Validation)
- [ ] Select dream from list
- [ ] Fill all 4 questions (without date questions)
- [ ] Select tone (Fusion/Gentle/Intense)
- [ ] Submit reflection
- [ ] Verify reflection saved (no has_date/dream_date fields)
- [ ] Check AI response quality (compare to baseline)
- [ ] Test mobile responsive (iPhone/iPad)
- [ ] Test desktop (1440px)
- [ ] Verify no console errors
- [ ] Check network tab (tRPC mutation succeeds)

## Edge Cases
- [ ] Submit with empty fields (validation works)
- [ ] Submit without selecting dream (validation works)
- [ ] Long text in all fields (character limits enforced)
- [ ] Network error handling (timeout, 500 error)
- [ ] Multiple reflections on same dream (verify linking)
```

**Unit Testing (Optional - Post-MVP):**
- `validateForm()` function (all fields required)
- `handleFieldChange()` function (state updates)
- Form submission flow (mocked tRPC mutation)

**Integration Testing (Critical):**
- End-to-end reflection creation (real database)
- tRPC schema validation (client/server sync)
- Anthropic API call (real API or mocked)

## Questions for Planner

### 1. **Should we enhance the AI prompt with dream context?**
**Context**: Currently, the prompt only includes user's answers (dream, plan, relationship, offering). We could add dream object fields (title, description, target_date) for richer context.

**Options:**
- **Option A**: Keep prompt simple (just 4 questions)
- **Option B**: Add dream title and target_date to prompt
- **Option C**: Add full dream object (title, description, target_date, category)

**Recommendation**: **Option B** (title + date) for balance

### 2. **How should we handle dream selection on mobile?**
**Context**: If user has 10+ active dreams, scrollable list might be long

**Options:**
- **Option A**: Scrollable list (current approach, max-height with overflow)
- **Option B**: Dropdown/select menu (more compact)
- **Option C**: Search/filter input (if many dreams)

**Recommendation**: **Option A** (aligns with glass design system), add **Option C** if Ahiya has >10 dreams

### 3. **Should tone selection default to Fusion (current) or require explicit choice?**
**Context**: Currently defaults to Fusion. One-page layout could encourage users to explore all 3 tones.

**Options:**
- **Option A**: Default to Fusion (current behavior, minimize clicks)
- **Option B**: No default (require selection, encourage conscious choice)

**Recommendation**: **Option A** (restraint - don't add friction), show selected tone clearly

### 4. **What level of visual hierarchy between questions?**
**Context**: One-page layout needs clear separation between 4 questions

**Options:**
- **Option A (Minimal)**: Just spacing (mb-8 between textareas)
- **Option B (Medium)**: Numbered labels + spacing
- **Option C (Strong)**: Each question in nested GlassCard with glow on focus

**Recommendation**: **Option B** (clear without excessive decoration)

**Example:**
```tsx
<div className="space-y-8">
  <div>
    <h3 className="text-lg mb-3 text-white/90">1. What is {selectedDream.title}?</h3>
    <GlassInput variant="textarea" ... />
  </div>
  <div>
    <h3 className="text-lg mb-3 text-white/90">2. What is your plan?</h3>
    <GlassInput variant="textarea" ... />
  </div>
  {/* ... */}
</div>
```

### 5. **Should we preserve step-based URL structure (for analytics)?**
**Context**: Currently uses `currentStep` state. One-page removes steps.

**Options:**
- **Option A**: Remove step tracking entirely (simplest)
- **Option B**: Track "activeQuestion" in URL params (e.g., `?q=2`)
- **Option C**: Track scroll position to detect which question is in view

**Recommendation**: **Option A** (aligns with simplification), add analytics in post-MVP

---

## Appendix: Refactoring Step-by-Step Guide

### Phase 1: Schema & Server Updates (2 hours)

**Step 1.1: Update Schema (15 min)**
```typescript
// types/schemas.ts
export const createReflectionSchema = z.object({
  dreamId: z.string().uuid(),
  dream: z.string().min(1).max(3200),
  plan: z.string().min(1).max(4000),
  // REMOVED: hasDate: z.enum(['yes', 'no']),
  // REMOVED: dreamDate: z.string().nullable(),
  relationship: z.string().min(1).max(4000),
  offering: z.string().min(1).max(2400),
  tone: z.enum(['gentle', 'intense', 'fusion']).default('fusion'),
  isPremium: z.boolean().default(false),
});
```

**Step 1.2: Update Server Router Input (15 min)**
```typescript
// server/trpc/routers/reflection.ts (line 38-48)
create: usageLimitedProcedure
  .input(createReflectionSchema)
  .mutation(async ({ ctx, input }) => {
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
    // ... rest of mutation
  })
```

**Step 1.3: Update Database Insert (15 min)**
```typescript
// server/trpc/routers/reflection.ts (line 133-151)
const { data: reflectionRecord, error: reflectionError } = await supabase
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
    ai_response: formattedReflection,
    tone,
    // ... metadata
  })
  .select()
  .single();
```

**Step 1.4: Update AI Prompt (30 min)**
```typescript
// server/trpc/routers/reflection.ts (line 76-88)
const userPrompt = `${intro}**My dream:** ${dream}

**My plan:** ${plan}

**My relationship with this dream:** ${relationship}

**What I'm willing to give:** ${offering}

Please mirror back what you see, in a flowing reflection I can return to months from now.`;
```

**Step 1.5: Test Schema Changes (45 min)**
- Run tRPC server (`npm run dev`)
- Test with curl or Postman:
  ```bash
  curl -X POST http://localhost:3000/api/trpc/reflection.create \
    -H "Content-Type: application/json" \
    -d '{
      "dreamId": "...",
      "dream": "...",
      "plan": "...",
      "relationship": "...",
      "offering": "...",
      "tone": "fusion"
    }'
  ```
- Verify: No validation errors, reflection created in database

### Phase 2: Component Refactoring (4-5 hours)

**Step 2.1: Update FormData Interface (5 min)**
```typescript
// app/reflection/MirrorExperience.tsx (line 16-23)
interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
  // REMOVED: hasDate: string;
  // REMOVED: dreamDate: string;
}
```

**Step 2.2: Simplify State Management (15 min)**
```typescript
// Remove currentStep state
// const [currentStep, setCurrentStep] = useState(dreamIdFromUrl ? 1 : 0);

// Simplify formData initialization
const [formData, setFormData] = useState<FormData>({
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
});

// Remove step navigation handlers
// handleNext() - DELETE
// handleBack() - DELETE
```

**Step 2.3: Store Selected Dream Object (10 min)**
```typescript
// Add selected dream state
const [selectedDream, setSelectedDream] = useState<Dream | null>(null);

// Update dream selection handler
const handleDreamSelect = (dreamId: string) => {
  const dream = dreams?.find(d => d.id === dreamId);
  setSelectedDream(dream || null);
  setSelectedDreamId(dreamId);
};
```

**Step 2.4: Update Questions Array (30 min)**
```typescript
// app/reflection/MirrorExperience.tsx
const questions = [
  {
    id: 'dream',
    text: `What is ${selectedDream?.title || 'this dream'}?`,
    placeholder: `Describe ${selectedDream?.title || 'this dream'} in detail...`,
    limit: QUESTION_LIMITS.dream,
  },
  {
    id: 'plan',
    text: `What is your plan for ${selectedDream?.title || 'this dream'}?`,
    placeholder: 'Share the steps you envision taking...',
    limit: QUESTION_LIMITS.plan,
  },
  {
    id: 'relationship',
    text: `What's your relationship with ${selectedDream?.title || 'this dream'}?`,
    placeholder: 'Describe how you relate to this aspiration...',
    limit: QUESTION_LIMITS.relationship,
  },
  {
    id: 'offering',
    text: `What are you willing to give for ${selectedDream?.title || 'this dream'}?`,
    placeholder: 'What will you commit, sacrifice, or offer...',
    limit: QUESTION_LIMITS.sacrifice,
  },
];

// REMOVED: hasDate question
// REMOVED: conditional dreamDate question
```

**Step 2.5: Refactor Render Logic (2-3 hours)**
```tsx
// app/reflection/MirrorExperience.tsx (line 240-500)
{viewMode === 'questionnaire' ? (
  <div className="questionnaire-container">
    <GlassCard
      variant="elevated"
      glassIntensity="strong"
      className="p-12 rounded-[30px]"
      animated={false}
    >
      <div className="mirror-surface">
        {!selectedDreamId ? (
          /* Dream Selection */
          <div className="dream-selection">
            <div className="flex justify-center mb-6">
              <div className="text-5xl">✨</div>
            </div>
            <h2 className="text-center mb-8 text-2xl md:text-3xl font-light bg-gradient-to-r from-mirror-purple via-mirror-violet to-mirror-blue bg-clip-text text-transparent">
              Which dream are you reflecting on?
            </h2>
            <div className="dream-selection-list">
              {dreams?.map(dream => (
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
                  >
                    {/* Dream card content */}
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* One-Page Reflection Form */
          <div className="one-page-form">
            {/* Optional: Show selected dream summary */}
            {selectedDream && (
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setSelectedDreamId('')}
                  className="text-white/70 hover:text-white"
                >
                  ← Change Dream
                </button>
                <span className="text-2xl">{categoryEmoji[selectedDream.category]}</span>
                <div>
                  <h3 className="font-medium">{selectedDream.title}</h3>
                  {selectedDream.daysLeft && (
                    <p className="text-sm text-white/70">{selectedDream.daysLeft} days left</p>
                  )}
                </div>
              </div>
            )}

            {/* All 4 Questions */}
            <div className="space-y-8 mb-8 max-h-[600px] overflow-y-auto">
              {questions.map((question, index) => (
                <div key={question.id}>
                  <h3 className="text-lg mb-3 text-white/90">
                    {index + 1}. {question.text}
                  </h3>
                  <GlassInput
                    variant="textarea"
                    value={formData[question.id as keyof FormData]}
                    onChange={(value) => handleFieldChange(question.id as keyof FormData, value)}
                    placeholder={question.placeholder}
                    maxLength={question.limit}
                    showCounter={true}
                    rows={6}
                  />
                </div>
              ))}
            </div>

            {/* Tone Selection */}
            <div className="tone-selection mb-8">
              <h3 className="text-lg mb-4 text-white/90">Choose Your Reflection Tone</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'fusion' as ToneId, name: 'Sacred Fusion', desc: 'Balanced wisdom', emoji: '⚡', glowColor: 'cosmic' as const },
                  { id: 'gentle' as ToneId, name: 'Gentle Clarity', desc: 'Compassionate', emoji: '🌸', glowColor: 'blue' as const },
                  { id: 'intense' as ToneId, name: 'Luminous Intensity', desc: 'Direct', emoji: '🔥', glowColor: 'purple' as const },
                ].map(tone => (
                  <div
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <GlassCard
                      variant={selectedTone === tone.id ? 'elevated' : 'default'}
                      glowColor={selectedTone === tone.id ? tone.glowColor : undefined}
                      hoverable
                      className="cursor-pointer text-center"
                    >
                      <div className="space-y-2 py-3">
                        <div className="text-4xl">{tone.emoji}</div>
                        <h4 className="text-md font-medium">{tone.name}</h4>
                        <p className="text-sm text-white/60">{tone.desc}</p>
                      </div>
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
      </div>
    </GlassCard>
  </div>
) : (
  /* Reflection Output - No Changes */
  <div className="output-container">
    {/* ... existing output view ... */}
  </div>
)}
```

**Step 2.6: Update Submit Handler (15 min)**
```typescript
const handleSubmit = () => {
  if (!selectedDreamId) {
    toast.warning('Please select a dream');
    return;
  }
  
  // Validate all fields
  if (!formData.dream.trim()) {
    toast.warning('Please elaborate on your dream');
    return;
  }
  if (!formData.plan.trim()) {
    toast.warning('Please describe your plan');
    return;
  }
  if (!formData.relationship.trim()) {
    toast.warning('Please share your relationship with this dream');
    return;
  }
  if (!formData.offering.trim()) {
    toast.warning('Please describe what you\'re willing to give');
    return;
  }

  setIsSubmitting(true);
  createReflection.mutate({
    dreamId: selectedDreamId,
    dream: formData.dream,
    plan: formData.plan,
    // REMOVED: hasDate: formData.hasDate as 'yes' | 'no',
    // REMOVED: dreamDate: formData.dreamDate || null,
    relationship: formData.relationship,
    offering: formData.offering,
    tone: selectedTone,
  });
};
```

**Step 2.7: Remove ProgressOrbs Import (5 min)**
```typescript
// app/reflection/MirrorExperience.tsx (line 11)
import { GlassCard, GlowButton, CosmicLoader, GlassInput } from '@/components/ui/glass';
// REMOVED: ProgressOrbs
```

**Step 2.8: Update Styles (30 min)**
```jsx
<style jsx>{`
  .mirror-experience {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    perspective: 1000px;
  }

  .questionnaire-container,
  .output-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 800px;
    padding: var(--space-xl);
  }

  .mirror-surface {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 20px;
    padding: var(--space-2xl);
    min-height: 500px;
  }

  .one-page-form {
    width: 100%;
    animation: fade-in 0.6s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dream-selection-list {
    max-width: 600px;
    margin: var(--space-xl) auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-height: 400px;
    overflow-y: auto;
    padding: var(--space-2);
  }

  @media (max-width: 768px) {
    .mirror-surface {
      padding: var(--space-lg);
    }
    
    .one-page-form {
      max-height: calc(100vh - 200px);
    }
  }

  /* ... keep all ambient animation styles (fusion-breath, gentle-star, intense-swirl, cosmic-particles) ... */
`}</style>
```

### Phase 3: Testing & Validation (1-2 hours)

**Step 3.1: Manual Testing**
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `/reflection`
- [ ] Select a dream from list
- [ ] Verify all 4 questions visible
- [ ] Fill all textareas (check character counters)
- [ ] Select each tone (verify visual feedback)
- [ ] Submit reflection
- [ ] Verify success (redirects to output view)
- [ ] Check database (reflection saved without has_date/dream_date)
- [ ] Read AI response (verify quality)

**Step 3.2: Mobile Testing**
- [ ] Open Chrome DevTools → Device Toolbar
- [ ] Test iPhone SE (375px)
- [ ] Test iPhone 12 Pro (390px)
- [ ] Test iPad (768px)
- [ ] Verify scrolling works smoothly
- [ ] Verify tone cards stack on mobile
- [ ] Verify submit button accessible

**Step 3.3: Edge Case Testing**
- [ ] Try to submit with empty fields (validation works)
- [ ] Try to submit without selecting dream (validation works)
- [ ] Fill all fields with maximum characters (no errors)
- [ ] Test with special characters in text (no encoding issues)
- [ ] Test tone selection (all 3 tones work)

**Step 3.4: Regression Testing**
- [ ] Reflection output view still works (view past reflection)
- [ ] Dream list fetching works (shows all active dreams)
- [ ] Toast notifications work (errors and warnings)
- [ ] Navigation works (back to dashboard after viewing)
- [ ] Cosmic background animations work
- [ ] Tone-based ambient elements work

### Phase 4: Polish & Optimization (1 hour)

**Step 4.1: Accessibility**
- [ ] Add ARIA labels to buttons
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader (optional)
- [ ] Ensure focus states visible

**Step 4.2: Performance**
- [ ] Check React DevTools (no unnecessary re-renders)
- [ ] Verify textarea typing is smooth (no lag)
- [ ] Check network tab (only necessary queries)

**Step 4.3: Error Handling**
- [ ] Test network timeout (slow 3G)
- [ ] Test API error (500 response)
- [ ] Test validation error (schema mismatch)
- [ ] Verify all errors show user-friendly messages

---

## Summary

**Total Effort Estimate: 8-12 hours**
- Phase 1 (Schema & Server): 2 hours
- Phase 2 (Component Refactor): 4-5 hours
- Phase 3 (Testing): 1-2 hours
- Phase 4 (Polish): 1 hour

**Lines of Code Impact:**
- **Removed**: ~300 lines (step navigation, conditional questions, ProgressOrbs)
- **Added**: ~150 lines (one-page layout, dream contextualization)
- **Net Change**: -150 lines (781 → ~630 lines)

**Risk Level**: **MEDIUM**
- Schema changes require careful synchronization
- Multi-step → one-page is major UX change
- Mobile testing critical for success

**Success Criteria:**
- ✅ All 4 questions visible on one scrollable page
- ✅ Questions reference specific dream by name
- ✅ No date-related questions (Q3/Q4 removed)
- ✅ Tone selection at bottom of page
- ✅ Single submit button: "Gaze into the Mirror"
- ✅ Reflection creation succeeds (no 400 errors)
- ✅ Mobile-responsive (smooth scrolling on iPhone/iPad)
- ✅ No schema validation errors
- ✅ AI response quality maintained or improved

---

**Report Status:** COMPLETE
**Ready for:** Builder handoff (Iteration 1 - Plan-4)
**Focus Area:** MirrorExperience Component & UX Flow Transformation
**Date:** 2025-11-27
