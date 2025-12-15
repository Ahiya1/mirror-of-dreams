# Plan 26: Mobile Bug Fixes (Plan-25 Incomplete Issues)

## Vision Statement

Plan-25 addressed some issues but several critical mobile bugs remain unfixed. This plan completes the mobile experience fixes.

## Current State (Screenshots Analysis)

### Screenshot 1 (md27.jpeg) - Landing Page
- Mobile navigation with hamburger menu toggle works but may confuse users
- Not a critical issue - standard mobile nav pattern

### Screenshot 2 (md28.jpeg) - Dashboard
- **CRITICAL**: Bottom navigation is MISSING Visualizations tab entirely
- Shows: Home, Dreams, Clarify, Reflect, Evolution, Profile
- Should also include Visualizations
- Demo banner overlaps with action buttons (cosmetic issue)

### Screenshot 3 (צג26.jpeg) - Reflection Dream Selection
- Dream card text is CUT OFF at right edge (no ellipsis, just clipped)
- Card shows: "Have someone tell me Mirror of Dre..." (should truncate properly)
- Description also cut off: "This dream is about knowing whether wh..."
- No "Create New Dream" button visible when dreams exist

### Screenshot 4 (צ25.jpeg) - Reflection Dream Selection
- One dream card is MISSING its emoji (shows only purple bar on left)
- Text: "Dreams actually helped them" - no emoji visible
- Description cut off at right edge
- Same overflow issue as screenshot 3

## Root Cause Analysis

### Issue 1: Missing Visualizations in Bottom Nav
**File**: `/components/navigation/BottomNavigation.tsx`
**Lines**: 34-47

The nav items array does NOT include Visualizations:
```typescript
const BASE_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dreams', icon: Sparkles, label: 'Dreams' },
];
const CLARIFY_NAV_ITEM: NavItem = { href: '/clarify', icon: MessageSquare, label: 'Clarify' };
const REMAINING_NAV_ITEMS: NavItem[] = [
  { href: '/reflection', icon: Layers, label: 'Reflect' },
  { href: '/evolution', icon: TrendingUp, label: 'Evolution' },
  { href: '/profile', icon: User, label: 'Profile' },
];
// NO Visualizations!
```

**Fix**: Add Visualizations nav item with appropriate icon (Eye or BarChart2 from lucide-react)

### Issue 2: Dream Card Text Overflow
**File**: `/components/reflection/mobile/views/MobileDreamSelectionView.tsx`
**Lines**: 72-76

The text container div has `flex-1` but needs `min-w-0` for flexbox text truncation to work:
```tsx
<div className="flex-1 text-left">  // MISSING min-w-0
  <h3 className="truncate font-medium text-white">{dream.title}</h3>
```

In flexbox, items have `min-width: auto` by default which prevents shrinking below content width. Adding `min-w-0` allows proper truncation.

**Fix**: Add `min-w-0` to the flex-1 text container div

### Issue 3: Missing "Create Dream" Button
**File**: `/components/reflection/mobile/views/MobileDreamSelectionView.tsx`
**Lines**: 48-97

Currently, the "Create Your First Dream" button only shows in the empty state (lines 90-95). When dreams exist, there's no way to create a new dream from within the reflection flow.

**Fix**: Add a "Create New Dream" link/button at the bottom of the dream list, even when dreams exist

### Issue 4: Missing Emoji on Some Dream Cards
**File**: `/components/reflection/mobile/views/MobileDreamSelectionView.tsx`
**Line**: 52

The emoji lookup appears correct:
```tsx
const emoji = CATEGORY_EMOJI[dream.category || 'other'] || CATEGORY_EMOJI.other;
```

However, if `dream.category` is `null` instead of `undefined`, the `||` fallback might not work as expected. Also, some categories might use different naming conventions.

**Fix**:
1. Use nullish coalescing (`??`) instead of logical OR (`||`)
2. Add more robust category fallback
3. Ensure emoji container doesn't get clipped

## Success Criteria

1. **Visualizations in Bottom Nav**: The Visualizations tab appears in mobile bottom navigation
2. **Dream Card Text**: Dream titles and descriptions truncate with ellipsis instead of being cut off
3. **Create Dream Access**: Users can access dream creation from reflection flow even when dreams exist
4. **Emoji Display**: All dream cards show their category emoji correctly

## Iteration Plan

### Iteration 60 (1 iteration - Simple fixes)

**Builder-1: Bottom Navigation Fix**
- Add Visualizations nav item to BottomNavigation.tsx
- Import Eye icon from lucide-react
- Add to REMAINING_NAV_ITEMS or appropriate location
- Consider placement order (between Reflect and Evolution?)

**Builder-2: Dream Card Overflow Fix**
- Add `min-w-0` to flex-1 text container in MobileDreamSelectionView.tsx
- Add `overflow-hidden` to button container if needed
- Ensure emoji container has proper width constraints

**Builder-3: Create Dream & Emoji Fix**
- Add "Create New Dream" link at bottom of dream list
- Fix emoji fallback logic with nullish coalescing
- Ensure emoji span has proper styling

## Files to Modify

1. `/components/navigation/BottomNavigation.tsx` - Add Visualizations nav item
2. `/components/reflection/mobile/views/MobileDreamSelectionView.tsx` - Fix overflow, emoji, and add create button

## Risk Assessment

- **Low Risk**: All changes are isolated to specific components
- **No Breaking Changes**: Only adding functionality and fixing display issues
- **Test Coverage**: Existing tests should pass; may need to add tests for new nav item

## Estimated Complexity

**SIMPLE** - 2 files, straightforward fixes, 1 iteration
