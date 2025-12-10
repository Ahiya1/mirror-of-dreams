# Explorer 2 Report: React.memo Optimization Analysis

## Executive Summary

Analyzed 16 components for React.memo optimization opportunities. **None of the analyzed components currently use React.memo.** High-priority candidates include frequently-rendered list items (ReflectionItem, TierBadge), pure presentational components (GlowButton, ProgressBar, CosmicLoader), and dashboard cards that receive static props. Several components have callback props that will require `useCallback` in their parent components to maximize memoization benefits.

## Components Analyzed

### 1. Reflection Components

#### ReflectionQuestionCard
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ReflectionQuestionCard.tsx`
**Currently Memoized:** No
**Priority:** HIGH

**Props Analysis:**
```typescript
interface ReflectionQuestionCardProps {
  questionNumber: number;        // Primitive - stable
  totalQuestions: number;        // Primitive - stable
  questionText: string;          // Primitive - stable
  guidingText: string;           // Primitive - stable
  placeholder: string;           // Primitive - stable
  value: string;                 // Primitive - changes on input
  onChange: (value: string) => void;  // CALLBACK - needs useCallback
  maxLength: number;             // Primitive - stable
}
```

**Recommendation:** 
- Wrap with `React.memo`
- Parent must wrap `onChange` in `useCallback`
- Custom comparator NOT needed (shallow comparison sufficient)

---

#### ToneSelection
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ToneSelection.tsx`
**Currently Memoized:** No
**Priority:** MEDIUM

**Props Analysis:**
```typescript
interface ToneSelectionProps {
  selectedTone: ToneId;          // Primitive (string) - changes on selection
  onSelect: (tone: ToneId) => void;  // CALLBACK - needs useCallback
  disabled?: boolean;            // Primitive - stable
}
```

**Recommendation:**
- Wrap with `React.memo`
- Parent must wrap `onSelect` in `useCallback`
- Custom comparator NOT needed

---

#### ProgressBar
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ProgressBar.tsx`
**Currently Memoized:** No
**Priority:** HIGH (renders on every step change)

**Props Analysis:**
```typescript
interface ProgressBarProps {
  currentStep: number;           // Primitive - changes per step
  totalSteps: number;            // Primitive - stable
  className?: string;            // Primitive - stable
}
```

**Recommendation:**
- Wrap with `React.memo`
- No callbacks - no `useCallback` needed
- Custom comparator NOT needed

---

### 2. UI Glass Components

#### GlowButton
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlowButton.tsx`
**Currently Memoized:** No
**Priority:** HIGH (used extensively throughout app)

**Props Analysis:**
```typescript
interface GlowButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cosmic' | 'warm' | 'success' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: ReactNode;
  onClick?: () => void;          // CALLBACK - needs useCallback
  disabled?: boolean;
}
```

**Recommendation:**
- Wrap with `React.memo`
- Parents should wrap `onClick` in `useCallback` for optimal performance
- Custom comparator NOT needed

---

#### CosmicLoader
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/CosmicLoader.tsx`
**Currently Memoized:** No
**Priority:** LOW (typically renders during loading states only)

**Props Analysis:**
```typescript
interface CosmicLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}
```

**Recommendation:**
- Wrap with `React.memo`
- No callbacks - no `useCallback` needed
- Custom comparator NOT needed

---

### 3. Dashboard Card Components

#### DashboardCard (Base Component)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/DashboardCard.tsx`
**Currently Memoized:** No
**Priority:** MEDIUM (base component, child cards derive from it)

**Props Analysis:**
```typescript
interface DashboardCardProps {
  children: ReactNode;           // Complex - may change
  className?: string;
  isLoading?: boolean;
  hasError?: boolean;
  onClick?: (e: React.MouseEvent) => void;  // CALLBACK - needs useCallback
  variant?: 'default' | 'premium' | 'creator';
  animated?: boolean;
  animationDelay?: number;
  hoverable?: boolean;
  breathing?: boolean;
}
```

**Recommendation:**
- Consider memoizing, but children prop makes this less effective
- Better to memoize child components
- If memoizing, need custom comparator to handle children prop

---

#### DreamsCard
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/DreamsCard.tsx`
**Currently Memoized:** No
**Priority:** LOW (has internal tRPC query, will re-render on data changes)

**Props Analysis:**
```typescript
interface DreamsCardProps {
  animated?: boolean;
  className?: string;
}
```

**Note:** This component has internal state (tRPC queries), so memoization provides limited benefit. The component must re-render when data changes.

**Recommendation:**
- Memoization benefit is MINIMAL due to internal queries
- Skip or low-priority

---

#### ReflectionsCard
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/ReflectionsCard.tsx`
**Currently Memoized:** No
**Priority:** LOW (same as DreamsCard - internal tRPC query)

**Recommendation:**
- Skip or low-priority (internal state management)

---

#### ProgressStatsCard
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/ProgressStatsCard.tsx`
**Currently Memoized:** No
**Priority:** LOW (internal tRPC query)

**Recommendation:**
- Skip or low-priority

---

#### EvolutionCard
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/EvolutionCard.tsx`
**Currently Memoized:** No
**Priority:** LOW (internal tRPC query)

**Recommendation:**
- Skip or low-priority

---

#### VisualizationCard
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/VisualizationCard.tsx`
**Currently Memoized:** No
**Priority:** LOW (internal tRPC query)

**Recommendation:**
- Skip or low-priority

---

#### UsageCard
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/UsageCard.tsx`
**Currently Memoized:** No
**Priority:** LOW (internal tRPC query)

**Note:** Already uses `useMemo` for `usageDisplay` calculation.

**Recommendation:**
- Skip or low-priority

---

#### SubscriptionCard
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/SubscriptionCard.tsx`
**Currently Memoized:** No
**Priority:** LOW (uses useAuth hook internally)

**Recommendation:**
- Skip or low-priority

---

### 4. Dashboard Shared Components

#### ReflectionItem
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/ReflectionItem.tsx`
**Currently Memoized:** No
**Priority:** HIGH (rendered in lists, multiple instances)

**Props Analysis:**
```typescript
interface ReflectionItemProps {
  reflection: {                  // OBJECT - needs custom comparator
    id: string | number;
    title?: string | null;
    dream?: string;
    dreams?: { title: string } | null;
    content?: string;
    preview?: string;
    created_at?: string;
    timeAgo?: string;
    tone?: string;
    is_premium?: boolean;
  };
  index?: number;
  animated?: boolean;
  animationDelay?: number;
  onClick?: (reflection: any) => void;  // CALLBACK - needs useCallback
  className?: string;
}
```

**Recommendation:**
- Wrap with `React.memo`
- **NEEDS CUSTOM COMPARATOR** for `reflection` object prop
- Parent should wrap `onClick` in `useCallback`

**Custom Comparator Example:**
```typescript
const areEqual = (prevProps: ReflectionItemProps, nextProps: ReflectionItemProps) => {
  return (
    prevProps.reflection.id === nextProps.reflection.id &&
    prevProps.index === nextProps.index &&
    prevProps.animated === nextProps.animated &&
    prevProps.animationDelay === nextProps.animationDelay &&
    prevProps.className === nextProps.className
    // onClick comparison handled by useCallback reference stability
  );
};
```

---

#### TierBadge
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/TierBadge.tsx`
**Currently Memoized:** No
**Priority:** HIGH (rendered in lists and multiple places)

**Props Analysis:**
```typescript
interface TierBadgeProps {
  tier?: 'free' | 'pro' | 'unlimited' | 'essential' | 'premium' | 'creator';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showGlow?: boolean;
  showIcon?: boolean;
  className?: string;
}
```

**Recommendation:**
- Wrap with `React.memo`
- No callbacks - no `useCallback` needed
- Custom comparator NOT needed (all primitives)

---

#### WelcomeSection
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/WelcomeSection.tsx`
**Currently Memoized:** No
**Priority:** LOW (uses useAuth hook internally, will re-render on auth changes)

**Recommendation:**
- Skip or low-priority

---

#### DashboardHero
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/DashboardHero.tsx`
**Currently Memoized:** No
**Priority:** LOW (uses useAuth and tRPC hooks internally)

**Recommendation:**
- Skip or low-priority

---

## Summary: Components to Memoize

### HIGH Priority (Implement First)

| Component | File | Custom Comparator | useCallback Needed |
|-----------|------|-------------------|-------------------|
| GlowButton | `components/ui/glass/GlowButton.tsx` | No | Yes (`onClick`) |
| ReflectionQuestionCard | `components/reflection/ReflectionQuestionCard.tsx` | No | Yes (`onChange`) |
| ProgressBar | `components/reflection/ProgressBar.tsx` | No | No |
| ReflectionItem | `components/dashboard/shared/ReflectionItem.tsx` | **Yes** | Yes (`onClick`) |
| TierBadge | `components/dashboard/shared/TierBadge.tsx` | No | No |

### MEDIUM Priority

| Component | File | Custom Comparator | useCallback Needed |
|-----------|------|-------------------|-------------------|
| ToneSelection | `components/reflection/ToneSelection.tsx` | No | Yes (`onSelect`) |
| DashboardCard | `components/dashboard/shared/DashboardCard.tsx` | Optional | Yes (`onClick`) |

### LOW Priority (Skip for Now)

| Component | Reason |
|-----------|--------|
| DreamsCard | Internal tRPC queries |
| ReflectionsCard | Internal tRPC queries |
| ProgressStatsCard | Internal tRPC queries |
| EvolutionCard | Internal tRPC queries |
| VisualizationCard | Internal tRPC queries |
| UsageCard | Internal tRPC queries |
| SubscriptionCard | Internal useAuth hook |
| WelcomeSection | Internal useAuth hook |
| DashboardHero | Internal hooks |
| CosmicLoader | Rarely re-renders |

---

## Components Already Memoized

**None** - No components in the analyzed set currently use React.memo.

---

## Implementation Notes

### Pattern for Simple Memoization
```typescript
import React, { memo } from 'react';

// Before
export const Component: React.FC<Props> = (props) => { ... };

// After
export const Component: React.FC<Props> = memo((props) => { ... });
```

### Pattern for Custom Comparator
```typescript
import React, { memo } from 'react';

const areEqual = (prevProps: Props, nextProps: Props) => {
  return prevProps.id === nextProps.id && /* ... */;
};

export const Component: React.FC<Props> = memo((props) => { ... }, areEqual);
```

### Parent Component useCallback Pattern
```typescript
const ParentComponent = () => {
  const handleChange = useCallback((value: string) => {
    setValue(value);
  }, []); // Empty deps if setValue is from useState

  return <MemoizedChild onChange={handleChange} />;
};
```

---

## Risks & Considerations

1. **Over-memoization**: Memoizing components with frequently-changing props provides no benefit and adds overhead
2. **Children prop**: Components receiving `children` as props benefit less from memoization unless using custom comparators
3. **Hook dependencies**: Components with internal hooks (useAuth, tRPC queries) will re-render regardless of memoization when hook data changes
4. **useCallback discipline**: Memoization only works if callback props are wrapped in useCallback at call sites

---

## Recommendations for Builder

1. **Start with HIGH priority components** - they provide the most performance benefit
2. **Add useCallback in parent components** when implementing memo for components with callbacks
3. **Test with React DevTools Profiler** to verify memoization is working
4. **Skip dashboard cards with internal queries** - they gain minimal benefit from memo
5. **Use named exports** for memoized components to preserve debugging in DevTools:
   ```typescript
   const ReflectionItem = memo(function ReflectionItem(props) { ... });
   ```
