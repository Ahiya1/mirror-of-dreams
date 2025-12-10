# Explorer 1 Report: MirrorExperience.tsx Refactoring Analysis

## Executive Summary

MirrorExperience.tsx is a 1504-line monolithic component handling the reflection flow for desktop users. The component contains significant opportunities for extraction into custom hooks and view components. There is substantial code duplication with MobileReflectionFlow.tsx (813 lines), particularly in form data types, constants, and the gazing overlay animation.

## File Analysis

### Total Line Count Verification
- **MirrorExperience.tsx:** 1504 lines (confirmed)
- **MobileReflectionFlow.tsx:** 813 lines
- **Total combined:** 2317 lines with significant overlap

### File Locations
- **MirrorExperience:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx`
- **MobileReflectionFlow:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/MobileReflectionFlow.tsx`

## Hooks Inventory

### All useState Hooks (Lines 107-136)
| State Variable | Line | Purpose | Extraction Target |
|---------------|------|---------|-------------------|
| viewMode | 107 | 'questionnaire' \| 'output' | useReflectionViewMode |
| selectedDreamId | 108 | Dream ID string | useReflectionForm |
| selectedDream | 109 | Dream object \| null | useReflectionForm |
| selectedTone | 110 | ToneId ('fusion') | useReflectionForm |
| isSubmitting | 111 | Boolean submission state | useReflectionForm |
| statusText | 112 | Loading status message | GazingOverlay component |
| mirrorGlow | 113 | Boolean glow effect | GazingOverlay component |
| newReflection | 115 | Created reflection cache | useReflectionViewMode |
| showUpgradeModal | 116 | Modal visibility | Separate concern |
| upgradeData | 117-120 | Limit/reset data | Separate concern |
| formData | 131-136 | Form fields object | useReflectionForm |

### All useEffect Hooks
| Effect | Lines | Purpose | Extraction Target |
|--------|-------|---------|-------------------|
| Auth redirect | 92-100 | Redirect unauthenticated users | Keep in component |
| View mode sync | 186-193 | Sync viewMode with URL params | useReflectionViewMode |
| Dream selection | 196-203 | Update selectedDream when ID changes | useReflectionForm |
| Load saved data | 206-224 | Load from localStorage | useReflectionForm |
| Save form data | 227-246 | Persist to localStorage | useReflectionForm |

### useMemo Hooks
| Memoization | Lines | Purpose | Extraction Target |
|-------------|-------|---------|-------------------|
| gentleStarPositions | 145-151 | Random star positions for gentle tone | Extract to ToneAmbientElements |
| cosmicParticlePositions | 154-160 | Random particle positions | Extract to CosmicParticles |

### Other Hooks Used
| Hook | Line | Source |
|------|------|--------|
| useRouter | 84 | next/navigation |
| useSearchParams | 85 | next/navigation |
| useAuth | 86 | @/hooks/useAuth |
| useToast | 87 | @/contexts/ToastContext |
| useReducedMotion | 88 | framer-motion |
| useIsMobile | 89 | @/hooks |
| trpc.dreams.list.useQuery | 123-129 | @/lib/trpc |
| trpc.reflections.getById.useQuery | 139-142 | @/lib/trpc |
| trpc.reflection.create.useMutation | 162-183 | @/lib/trpc |

## Extractable Custom Hooks

### 1. useReflectionForm (High Priority)
**Lines affected:** 108-110, 131-136, 196-246, 248-256, 258-285, 287-320

**State to include:**
```typescript
interface UseReflectionFormReturn {
  // Form data
  formData: FormData;
  setFormData: (data: FormData) => void;
  handleFieldChange: (field: keyof FormData, value: string) => void;
  
  // Dream selection
  selectedDreamId: string;
  setSelectedDreamId: (id: string) => void;
  selectedDream: Dream | null;
  handleDreamSelect: (dreamId: string) => void;
  
  // Tone
  selectedTone: ToneId;
  setSelectedTone: (tone: ToneId) => void;
  
  // Submission
  isSubmitting: boolean;
  handleSubmit: () => void;
  validateForm: () => boolean;
  
  // Persistence
  clearForm: () => void;
}
```

**Dependencies:**
- dreams data from trpc query
- createReflection mutation
- user data from useAuth
- toast from useToast
- localStorage utilities

### 2. useReflectionViewMode (Medium Priority)
**Lines affected:** 102-106, 107, 186-193, 115

**State to include:**
```typescript
interface UseReflectionViewModeReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  reflectionId: string | null;
  newReflection: { id: string; content: string } | null;
  setNewReflection: (ref: { id: string; content: string } | null) => void;
  resetToQuestionnaire: () => void;
}
```

**Dependencies:**
- useSearchParams for URL reflectionId
- window.history for URL updates

### 3. useReflectionPersistence (Low Priority - Could Merge Into useReflectionForm)
**Lines affected:** 206-246

**Handles:**
- localStorage load on mount
- localStorage save on form changes
- Expiry management (24 hours)

## Extractable View Components

### 1. DreamSelectionView (High Priority)
**Lines:** 587-664

**Description:** Dream selection list with category emojis, days remaining display, and "Create Your First Dream" CTA for empty state.

**Props:**
```typescript
interface DreamSelectionViewProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dreamId: string) => void;
  categoryEmoji: Record<string, string>;
}
```

**Shared with:** MobileReflectionFlow lines 304-367 (similar structure)

### 2. ReflectionFormView (High Priority)
**Lines:** 665-751

**Description:** One-page form with welcome message, dream context banner, progress bar, 4 question cards, tone selection, and submit button.

**Props:**
```typescript
interface ReflectionFormViewProps {
  selectedDream: Dream | null;
  formData: FormData;
  onFieldChange: (field: keyof FormData, value: string) => void;
  selectedTone: ToneId;
  onToneSelect: (tone: ToneId) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}
```

**Already uses:**
- ProgressBar component
- ReflectionQuestionCard component
- ToneSelectionCard component
- GlowButton component

### 3. ReflectionOutputView (Medium Priority)
**Lines:** 757-811

**Description:** Display of completed reflection with AIResponseRenderer and "Create New Reflection" button.

**Props:**
```typescript
interface ReflectionOutputViewProps {
  content: string;
  isLoading: boolean;
  onCreateNew: () => void;
}
```

### 4. GazingOverlay (High Priority - ALREADY EXISTS!)
**Lines:** 814-1001 (in MirrorExperience)

**IMPORTANT:** A simpler GazingOverlay already exists at:
`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/GazingOverlay.tsx`

**Issue:** MirrorExperience has an inline, more complex gazing overlay with:
- Stars animation (50 stars with random positions)
- Floating particles (15 particles)
- Mirror portal with rotating rings
- Status text with animation

**MobileReflectionFlow** also has inline gazing overlay at lines 529-762 (duplicated!)

**Recommendation:** Consolidate into single GazingOverlay component with variants or enhance existing component.

### 5. ToneAmbientElements (Low Priority)
**Lines:** 508-559

**Description:** Background tone-specific ambient animations (fusion-breath, gentle-star, intense-swirl).

**Props:**
```typescript
interface ToneAmbientElementsProps {
  selectedTone: ToneId;
  gentleStarPositions?: StarPosition[];
}
```

### 6. CosmicParticles (Low Priority)
**Lines:** 561-566

**Description:** Floating cosmic particles background animation.

**Props:**
```typescript
interface CosmicParticlesProps {
  particlePositions: ParticlePosition[];
}
```

## Code Duplication Analysis

### Duplicated Between MirrorExperience and MobileReflectionFlow

| Item | MirrorExperience Lines | MobileReflectionFlow Lines | Notes |
|------|------------------------|---------------------------|-------|
| FormData interface | 45-50 | 25-30 | Identical |
| Dream interface | 52-59 | 35-42 | Identical |
| QUESTION_GUIDES/QUESTIONS | 64-77 / 322-355 | 65-98 | Similar, slightly different structure |
| categoryEmoji/CATEGORY_EMOJI | 358-369 | 115-130 | Similar mapping |
| STORAGE_KEY constant | 42 | 111 | Identical |
| STORAGE_EXPIRY_MS | 43 | 112 | Identical |
| localStorage persistence logic | 206-246 | N/A (handled by parent) | Only in MirrorExperience |
| Gazing overlay animation | 814-1001 | 529-762 | Very similar, both inline |
| Status messages | 112, 308-310 | 101-106 | Similar content |

### Shared Constants to Extract

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/reflection/constants.ts`

```typescript
export const STORAGE_KEY = 'MIRROR_REFLECTION_DRAFT';
export const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export const CATEGORY_EMOJI: Record<string, string> = {
  health: '\uD83C\uDFC3',
  career: '\uD83D\uDCBC',
  // ... etc
};

export const STATUS_MESSAGES = [
  'Gazing into the mirror...',
  'Reflecting on your journey...',
  'Crafting your insight...',
  'Weaving wisdom...',
];
```

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/reflection/types.ts`

```typescript
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
```

## CSS/Styles Analysis

### Inline Styles (jsx block)
**Lines:** 1003-1492 (~490 lines of inline CSS!)

**Recommendation:** Extract to CSS module:
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.module.css`

**Major style sections:**
1. `.reflection-experience` - Container layout (1004-1018)
2. `.reflection-vignette` - Vignette overlay (1020-1027)
3. `.tone-elements` - Tone animations (1029-1128)
4. `.cosmic-particles` - Particle animations (1130-1161)
5. `.questionnaire-container` / `.output-container` (1163-1171)
6. `.reflection-card` / `.mirror-surface` (1173-1234)
7. `.dream-selection-list` (1264-1284)
8. `.gazing-overlay` and related (1297-1466)
9. Media queries (1276-1284, 1286-1295, 1467-1491)

## State Dependencies Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MirrorExperience Component                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 useReflectionForm Hook                    │   │
│  │                                                          │   │
│  │  States:                                                 │   │
│  │  - formData ─────────────┐                              │   │
│  │  - selectedDreamId ──────┼── Updates together           │   │
│  │  - selectedDream ────────┤                              │   │
│  │  - selectedTone ─────────┘                              │   │
│  │  - isSubmitting                                         │   │
│  │                                                          │   │
│  │  Dependencies:                                           │   │
│  │  - dreams (trpc query) ───> selectedDream lookup        │   │
│  │  - createReflection mutation                            │   │
│  │  - user (useAuth) ───> limit checking                   │   │
│  │  - toast (useToast) ───> validation errors              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               useReflectionViewMode Hook                  │   │
│  │                                                          │   │
│  │  States:                                                 │   │
│  │  - viewMode ─────────────────> Derived from reflectionId│   │
│  │  - newReflection ────────────> Set after mutation       │   │
│  │                                                          │   │
│  │  Dependencies:                                           │   │
│  │  - searchParams (reflectionId)                          │   │
│  │  - router (navigation)                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    View Components                        │   │
│  │                                                          │   │
│  │  viewMode === 'questionnaire':                          │   │
│  │    - !selectedDreamId: DreamSelectionView               │   │
│  │    -  selectedDreamId: ReflectionFormView               │   │
│  │                                                          │   │
│  │  viewMode === 'output':                                 │   │
│  │    - ReflectionOutputView                               │   │
│  │                                                          │   │
│  │  isSubmitting === true:                                 │   │
│  │    - GazingOverlay                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Ambient Elements                        │   │
│  │                                                          │   │
│  │  - ToneAmbientElements (depends on selectedTone)        │   │
│  │  - CosmicParticles (static positions)                   │   │
│  │  - CosmicBackground                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Refactoring Recommendations

### Phase 1: Extract Types and Constants (Low Risk)
1. Create `/lib/reflection/types.ts` with shared interfaces
2. Create `/lib/reflection/constants.ts` with shared constants
3. Update both MirrorExperience and MobileReflectionFlow to import

### Phase 2: Extract Custom Hooks (Medium Risk)
1. Create `useReflectionForm` hook in `/hooks/useReflectionForm.ts`
2. Create `useReflectionViewMode` hook in `/hooks/useReflectionViewMode.ts`
3. Gradually migrate state and effects

### Phase 3: Consolidate GazingOverlay (Medium Risk)
1. Enhance existing `/components/reflection/mobile/GazingOverlay.tsx`
2. Add mirror portal animation support
3. Update MirrorExperience to use component instead of inline
4. Update MobileReflectionFlow to use component instead of inline

### Phase 4: Extract View Components (Low Risk)
1. Create `DreamSelectionView` component
2. Create `ReflectionFormView` component
3. Create `ReflectionOutputView` component

### Phase 5: Extract CSS to Module (Low Risk)
1. Create `MirrorExperience.module.css`
2. Move inline styles
3. Update className references

## Estimated Line Reduction

| Extraction | Lines Saved | New Files Created |
|------------|-------------|-------------------|
| Types/Constants | ~60 | 2 |
| useReflectionForm | ~150 | 1 |
| useReflectionViewMode | ~30 | 1 |
| GazingOverlay consolidation | ~380 | 0 (enhance existing) |
| View components | ~200 | 3 |
| CSS Module | ~490 | 1 |

**Expected Final Size:** ~300-400 lines (from 1504)

## Questions for Planner

1. Should we prioritize hook extraction or component extraction first?
2. Is there a preference for co-locating reflection-specific hooks in `/app/reflection/hooks/` vs `/hooks/`?
3. Should MobileReflectionFlow be refactored to use the same extracted components, or keep them separate for mobile-specific optimizations?
4. The gazing overlay in MirrorExperience is more elaborate than the existing GazingOverlay component. Should we enhance the existing component or keep both?

## Risk Assessment

| Change | Risk Level | Rationale |
|--------|------------|-----------|
| Extract types/constants | Low | No behavior change |
| Extract useReflectionForm | Medium | Complex state interdependencies |
| Extract useReflectionViewMode | Low | Simple state |
| Consolidate GazingOverlay | Medium | Animation timing sensitive |
| Extract view components | Low | Presentational only |
| Extract CSS | Low | Style changes easy to verify |

## Testing Recommendations

1. **Unit tests for hooks:** Test state transitions and localStorage persistence
2. **Visual regression tests:** For gazing overlay animations
3. **Integration tests:** Full reflection submission flow
4. **Mobile/desktop parity tests:** Ensure both flows work identically

---

*Generated by Explorer-1 for Iteration 39 refactoring analysis*
