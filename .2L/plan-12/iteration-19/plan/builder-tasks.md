# Builder Task Breakdown

## Overview

**2 primary builders** will work in parallel.
No sub-builders expected - both tasks are LOW-MEDIUM complexity.

## Builder Assignment Strategy

- Builders work on isolated features when possible
- Builder 1 handles CSS layout and spacing changes
- Builder 2 handles markdown rendering component and integration
- Shared files (`evolution/page.tsx`, `visualizations/page.tsx`) have non-overlapping changes

---

## Builder-1: CSS Layout & Navigation

### Scope

Fix mobile centering, slim down navigation header, reduce evolution report spacing, and audit all pages for consistent centering.

### Complexity Estimate

**MEDIUM**

Self-contained CSS changes across multiple files. No complex logic.

### Success Criteria

- [ ] Dashboard content horizontally centered on all mobile widths (375px, 390px, 414px, 428px)
- [ ] Left and right margins equal on dashboard (within 2px)
- [ ] Navigation header height under 48px on mobile (target: 44px)
- [ ] Evolution report content starts within 150px of viewport top
- [ ] All pages (dreams, profile, reflection, evolution, visualizations) pass centering audit

### Files to Create

None.

### Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx` | Line 123 | Change `py-2 sm:py-4` to `py-1.5 sm:py-3` for slimmer mobile header |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/page.tsx` | Lines 232-242 | Change mobile padding from `var(--space-sm)` and `var(--space-md)` to `1rem` |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/[id]/page.tsx` | Lines 45, 52, 58, 95 | Reduce spacing: use tighter top padding, reduce back button margin, add responsive card padding |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/page.tsx` | Line 58 | Audit/verify centering (likely already correct with `px-4`) |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx` | TBD | Audit/verify centering |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/page.tsx` | TBD | Audit/verify centering |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx` | TBD | Audit/verify centering |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx` | TBD | Audit/verify centering |

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (Builder 2 works in parallel)

### Implementation Notes

#### AppNavigation Slimmer Header (Feature 2)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx` line 123

**Before:**
```tsx
<div className="container mx-auto px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
```

**After:**
```tsx
<div className="container mx-auto px-3 sm:px-6 py-1.5 sm:py-3 flex items-center justify-between">
```

**Result:**
- Mobile: py-1.5 = 6px each side = ~44px total height (under 48px target)
- Desktop: py-3 = 12px each side = ~56px total height

**Optional icon size reduction (line 127):**
```tsx
// Before
<span className="text-xl sm:text-2xl animate-glow-pulse">

// After
<span className="text-lg sm:text-2xl animate-glow-pulse">
```

#### Dashboard Mobile Centering (Feature 1)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/page.tsx` lines 232-242

**Before:**
```css
@media (max-width: 768px) {
  .dashboard-container {
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: var(--space-sm);
  }
}
```

**After:**
```css
@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;  /* 16px - consistent with px-4 on other pages */
  }
}

/* Remove or keep the 480px breakpoint but also use 1rem */
@media (max-width: 480px) {
  .dashboard-container {
    padding: 1rem;  /* Same 16px for consistency */
  }
}
```

#### Evolution Report Spacing (Feature 4)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/[id]/page.tsx`

**Option A - Reduce pt-nav buffer (line 45):**
```tsx
// Before
<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-nav px-4 sm:px-8 pb-8">

// After - use inline style for tighter top padding
<div
  className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4 sm:px-8 pb-8"
  style={{ paddingTop: 'calc(var(--nav-height) + var(--demo-banner-height, 0px) + 0.5rem)' }}
>
```

**Option B - Reduce element margins (preferred, less invasive):**
```tsx
// Back button (line 52): mb-6 -> mb-4
<button className="text-purple-200 hover:text-white mb-4 flex items-center gap-2 transition-colors">

// Header card (line 58): p-6 mb-6 -> p-4 sm:p-6 mb-4 sm:mb-6
<div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-white/20">

// Content card (line 95): p-8 -> p-4 sm:p-6 lg:p-8
<div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 lg:p-8 border border-white/20">
```

**Choose Option B** - less risk of breaking other pages that use pt-nav.

#### Centering Audit (Feature 5)

For each page, verify the main container has:
- `mx-auto` for horizontal centering
- Equal left/right padding (typically `px-4 sm:px-6` or `px-4 sm:px-8`)
- No asymmetric transforms or positions

**Dreams page** (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/page.tsx` line 58):
```tsx
<div className="min-h-screen ... pt-nav px-4 sm:px-8 pb-20 md:pb-8">
```
Uses `px-4` on mobile - should be correct.

**Profile, Reflection, Evolution list, Visualizations list:**
Same pattern - verify symmetric padding and `mx-auto` on containers.

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Pattern 2: Slim Navigation Padding** for AppNavigation
- Use **Pattern 3: Dashboard Container Mobile Fix** for dashboard
- Use **Pattern 4: Evolution Report Reduced Spacing** for evolution detail

### Testing Requirements

- Visual test on mobile widths: 375px, 390px, 414px, 428px
- Verify header height with browser dev tools (should be ~44px)
- Verify content centering by measuring left/right margins
- Test evolution report - content should appear within 150px of viewport top

### Estimated Time

**1.5 hours**

---

## Builder-2: Markdown Preview Support

### Scope

Create reusable MarkdownPreview component for line-clamped contexts. Integrate into dashboard cards and list pages.

### Complexity Estimate

**MEDIUM**

One new component + updates to 4 existing files.

### Success Criteria

- [ ] MarkdownPreview component created and renders inline markdown
- [ ] Bold text (**bold**) renders as bold in card previews
- [ ] Italic text (*italic*) renders as italic in card previews
- [ ] Line-clamp still works correctly (2-3 lines)
- [ ] No layout breakage from markdown rendering
- [ ] EvolutionCard shows formatted preview
- [ ] VisualizationCard shows formatted preview
- [ ] Evolution list page shows formatted previews
- [ ] Visualizations list page shows formatted previews

### Files to Create

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/MarkdownPreview.tsx` | Reusable inline markdown component for line-clamped contexts |

### Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/EvolutionCard.tsx` | Lines 86-88 | Replace substring with MarkdownPreview |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/VisualizationCard.tsx` | Lines 81-85 | Replace substring with MarkdownPreview |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx` | Lines 284-285 | Replace substring with MarkdownPreview |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx` | Lines 310-311 | Replace substring with MarkdownPreview |

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (Builder 1 works in parallel)

### Implementation Notes

#### MarkdownPreview Component (NEW)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/MarkdownPreview.tsx`

Create the complete component as shown in **Pattern 5** in `patterns.md`.

Key implementation points:
1. Use `'use client'` directive
2. Import ReactMarkdown and remarkGfm (existing packages)
3. Convert block elements to inline spans
4. Strip complex elements (lists, blockquotes, etc.)
5. Use cosmic color scheme for inline formatting

#### EvolutionCard Update

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/EvolutionCard.tsx` lines 86-88

**Before:**
```tsx
<p className="preview-text">
  {latestReport.evolution ? latestReport.evolution.substring(0, 200) + '...' : 'View report'}
</p>
```

**After:**
```tsx
import { MarkdownPreview } from '@/components/shared/MarkdownPreview';

// ... in render

<p className="preview-text">
  {latestReport.evolution ? (
    <MarkdownPreview content={latestReport.evolution} maxLength={200} />
  ) : (
    'View report'
  )}
</p>
```

Keep existing `.preview-text` CSS with line-clamp (lines 235-241).

#### VisualizationCard Update

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/VisualizationCard.tsx` lines 81-85

**Before:**
```tsx
<p className="preview-text">
  {latestVisualization.narrative
    ? latestVisualization.narrative.substring(0, 150) + '...'
    : 'View visualization'}
</p>
```

**After:**
```tsx
import { MarkdownPreview } from '@/components/shared/MarkdownPreview';

// ... in render

<p className="preview-text">
  {latestVisualization.narrative ? (
    <MarkdownPreview content={latestVisualization.narrative} maxLength={150} />
  ) : (
    'View visualization'
  )}
</p>
```

#### Evolution List Page Update

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx` lines 284-285

**Before:**
```tsx
<p className="text-white/70 text-sm line-clamp-2 mb-3">
  {report.analysis?.substring(0, 200)}...
</p>
```

**After:**
```tsx
import { MarkdownPreview } from '@/components/shared/MarkdownPreview';

// ... in render

<p className="text-white/70 text-sm line-clamp-2 mb-3">
  <MarkdownPreview
    content={report.analysis || ''}
    maxLength={200}
    className="text-white/70"
  />
</p>
```

#### Visualizations List Page Update

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx` lines 310-311

**Before:**
```tsx
<p className="text-white/70 text-sm line-clamp-3 mb-3">
  {viz.narrative?.substring(0, 150)}...
</p>
```

**After:**
```tsx
import { MarkdownPreview } from '@/components/shared/MarkdownPreview';

// ... in render

<p className="text-white/70 text-sm line-clamp-3 mb-3">
  <MarkdownPreview
    content={viz.narrative || ''}
    maxLength={150}
    className="text-white/70"
  />
</p>
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Pattern 5: Inline Markdown for Line-Clamped Containers** for component
- Use **Pattern 6: Using MarkdownPreview in Cards** for dashboard cards
- Use **Pattern 7: Using MarkdownPreview in List Pages** for list pages

### Testing Requirements

- Test bold rendering: Content with `**bold**` shows bold text
- Test italic rendering: Content with `*italic*` shows italic text
- Test mixed formatting: `**bold** and *italic*` renders correctly
- Test line-clamp: Text truncates at 2-3 lines as expected
- Test mobile: line-clamp-2 on mobile works
- Test empty content: Fallback text displays properly
- Test long content: No performance issues

### Estimated Time

**1.5 hours**

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

- **Builder-1**: CSS Layout & Navigation
- **Builder-2**: Markdown Preview Support

Both builders can start immediately and work in parallel.

### Integration Notes

**Shared files that both builders touch:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx`

**Conflict resolution:**
- Builder 1 only audits centering (likely no changes if already correct)
- Builder 2 modifies content rendering (lines 284-285 and 310-311)
- Changes are to different aspects - no overlapping lines expected
- If Builder 1 needs to change container classes, those are on different lines than the preview text

**Integration merge order:**
1. Merge Builder 1 changes first (CSS/layout)
2. Merge Builder 2 changes second (component + integrations)
3. Final visual verification

---

## Summary

| Builder | Feature(s) | Files | Complexity | Estimated Time |
|---------|------------|-------|------------|----------------|
| Builder-1 | 1, 2, 4, 5 | 8 files modified | MEDIUM | 1.5 hours |
| Builder-2 | 3 | 1 file created, 4 files modified | MEDIUM | 1.5 hours |

**Total parallel time:** ~1.5 hours
**Integration time:** ~15 minutes
**Total estimated:** ~2 hours
