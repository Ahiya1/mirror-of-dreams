# Explorer 2 Report: Card Markdown Rendering Implementation

## Executive Summary

The codebase has mature ReactMarkdown integration (v10.1.0) in detail pages but card previews render raw text with substring truncation. The challenge is rendering markdown within CSS line-clamped containers, which conflicts with block-level markdown elements. A custom `MarkdownPreview` component that converts block elements to inline spans is the recommended solution.

---

## Current Card Preview Analysis

### EvolutionCard.tsx (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/EvolutionCard.tsx`)

**Current Implementation (lines 86-88):**
```tsx
<p className="preview-text">
  {latestReport.evolution ? latestReport.evolution.substring(0, 200) + '...' : 'View report'}
</p>
```

**CSS Line-Clamp Styling (lines 235-241):**
```css
.preview-text {
  font-size: var(--text-sm);
  color: var(--cosmic-text);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-3);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

**Mobile Override (line 404):**
```css
.preview-text {
  -webkit-line-clamp: 2;
}
```

**Issues Identified:**
1. Raw markdown syntax visible in preview (e.g., `**bold**`, `## heading`)
2. Uses `substring(0, 200)` which may cut markdown syntax mid-element
3. Line-clamp works but expects inline text, not rendered HTML blocks

---

### VisualizationCard.tsx (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/VisualizationCard.tsx`)

**Current Implementation (lines 81-85):**
```tsx
<p className="preview-text">
  {latestVisualization.narrative
    ? latestVisualization.narrative.substring(0, 150) + '...'
    : 'View visualization'}
</p>
```

**CSS Line-Clamp Styling (lines 199-208):**
- Identical to EvolutionCard pattern
- Uses `-webkit-line-clamp: 3` with mobile override to `2`

**Issues Identified:**
1. Same raw markdown display problem
2. Shorter substring (150 vs 200) may cause more mid-syntax cuts

---

### Evolution List Page (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx`)

**Current Implementation (lines 284-285):**
```tsx
<p className="text-white/70 text-sm line-clamp-2 mb-3">
  {report.analysis?.substring(0, 200)}...
</p>
```

**Issues Identified:**
1. Uses Tailwind `line-clamp-2` (same underlying CSS)
2. Same substring-and-append pattern showing raw markdown

---

### Visualizations List Page (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx`)

**Current Implementation (lines 310-311):**
```tsx
<p className="text-white/70 text-sm line-clamp-3 mb-3">
  {viz.narrative?.substring(0, 150)}...
</p>
```

**Issues Identified:**
1. Uses Tailwind `line-clamp-3`
2. Same raw markdown display problem

---

## Existing ReactMarkdown Patterns

### Pattern 1: AIResponseRenderer (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/AIResponseRenderer.tsx`)

**Full-Featured Implementation:**
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Markdown detection regex (line 20)
const hasMarkdown = /^#{1,3}\s|^\*\s|^-\s|^>\s|```/.test(content);

// Component mapping with cosmic styling
components={{
  h1: ({ node, ...props }) => (
    <GradientText gradient="cosmic" className="block text-4xl font-bold mb-6 mt-8 first:mt-0">
      {props.children}
    </GradientText>
  ),
  h2: ({ node, ...props }) => (
    <GradientText gradient="cosmic" className="block text-3xl font-semibold mb-4 mt-6">
      {props.children}
    </GradientText>
  ),
  // ... full component overrides for all elements
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-amber-400 bg-amber-400/10 px-1 rounded" {...props} />
  ),
  em: ({ node, ...props }) => (
    <em className="text-purple-200 italic" {...props} />
  ),
}}
```

**Key Insights:**
- Uses `remark-gfm` for GitHub Flavored Markdown
- Custom component mapping for cosmic theme styling
- Has fallback for plain text without markdown
- Not suitable for line-clamped contexts (uses block-level elements)

---

### Pattern 2: Evolution Report Detail (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/[id]/page.tsx`)

**Implementation (lines 96-171):**
```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ node, ...props }) => (
      <GradientText gradient="cosmic" className="block text-4xl font-bold mb-6 mt-8 first:mt-0">
        {props.children}
      </GradientText>
    ),
    // Similar full component overrides
    p: ({ node, ...props }) => (
      <p className="text-purple-50 leading-relaxed mb-4 text-base" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside space-y-2 ml-4 my-4 text-purple-100" {...props} />
    ),
  }}
>
  {report.analysis || ''}
</ReactMarkdown>
```

**Key Insights:**
- Full markdown rendering for detail views
- Works because container is scrollable, not line-clamped
- Component overrides maintain cosmic design language

---

### Pattern 3: Visualization Detail (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/[id]/page.tsx`)

**Implementation (lines 116-186):**
- Same pattern as Evolution detail
- Includes markdown detection fallback
- Immersive styling with background glow effects

---

### Pattern 4: ReflectionCard Markdown Stripping (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/ReflectionCard.tsx`)

**Existing Stripping Pattern (lines 28-34):**
```tsx
const snippet = reflection.aiResponse
  .replace(/^#{1,3}\s+.*$/gm, '') // Remove markdown headings
  .replace(/\*\*/g, '') // Remove markdown bold
  .replace(/\*/g, '') // Remove markdown italic
  .replace(/\n\n/g, ' ') // Replace double newlines with space
  .trim()
  .substring(0, 120) + '...';
```

**Key Insights:**
- This is a working pattern for stripping markdown to plain text
- Uses regex replacement to remove syntax
- Results in clean preview text
- **However**, this loses all formatting benefits

---

## MarkdownPreview Component Design

### The Problem

CSS `line-clamp` works via:
```css
display: -webkit-box;
-webkit-line-clamp: 3;
-webkit-box-orient: vertical;
overflow: hidden;
```

This requires **inline** content flow. Block-level elements (`<p>`, `<h1>`, `<ul>`) break line-clamp behavior because:
1. Each block starts a new line
2. Margins add unexpected spacing
3. Overflow calculation becomes unpredictable

### Recommended Solution: MarkdownPreview Component

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/MarkdownPreview.tsx`

**Design Rationale:**
1. Render inline markdown elements (bold, italic, code) for visual polish
2. Convert block elements to inline spans to preserve line-clamp
3. Strip complex elements (lists, blockquotes, code blocks) entirely
4. Limit input length to prevent performance issues

**Proposed Implementation:**

```tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  maxLength?: number;
  className?: string;
}

/**
 * MarkdownPreview - Render markdown in line-clamped contexts
 * 
 * Converts block elements to inline spans so CSS line-clamp works.
 * Supports: bold, italic, inline code, links
 * Strips: headings, lists, blockquotes, code blocks, images
 */
export function MarkdownPreview({
  content,
  maxLength = 200,
  className = '',
}: MarkdownPreviewProps) {
  // Truncate content before parsing to limit processing
  const truncated = content?.substring(0, maxLength) || '';
  
  return (
    <span className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Convert all block elements to inline spans
          p: ({ children }) => <span>{children} </span>,
          
          // Preserve inline formatting with cosmic styling
          strong: ({ children }) => (
            <strong className="font-semibold text-purple-300">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-purple-200">{children}</em>
          ),
          
          // Inline code - subtle highlight
          code: ({ children }) => (
            <code className="text-xs bg-purple-900/30 px-1 rounded">{children}</code>
          ),
          
          // Links - render as text only (no navigation in preview)
          a: ({ children }) => <span className="text-purple-300">{children}</span>,
          
          // Strip block elements entirely
          h1: () => null,
          h2: () => null,
          h3: () => null,
          h4: () => null,
          h5: () => null,
          h6: () => null,
          ul: () => null,
          ol: () => null,
          li: () => null,
          blockquote: () => null,
          pre: () => null,
          hr: () => null,
          img: () => null,
          table: () => null,
          thead: () => null,
          tbody: () => null,
          tr: () => null,
          th: () => null,
          td: () => null,
        }}
      >
        {truncated}
      </ReactMarkdown>
    </span>
  );
}
```

### Key Design Decisions

1. **Outer `<span>` wrapper**: Ensures entire component is inline-level
2. **`<p>` to `<span>` conversion**: Critical for line-clamp compatibility
3. **Trailing space after paragraph spans**: Ensures text flows naturally when multiple paragraphs concatenate
4. **Null returns for block elements**: Prevents layout breakage
5. **maxLength before parsing**: Limits markdown processing overhead
6. **Cosmic color scheme**: Maintains design consistency (`text-purple-300`, `text-purple-200`)

---

## Implementation Plan

### Phase 1: Create MarkdownPreview Component

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/MarkdownPreview.tsx`

**Tasks:**
1. Create component with props interface
2. Implement inline-only ReactMarkdown rendering
3. Add cosmic theme color classes
4. Export from component index if pattern exists

**Estimated Time:** 30 minutes

---

### Phase 2: Update Dashboard Cards

**Files to Modify:**

1. **EvolutionCard.tsx** (line 86-88)
   - Import MarkdownPreview
   - Replace raw text substring with MarkdownPreview component
   - Keep existing CSS line-clamp styling

   ```tsx
   // Before
   <p className="preview-text">
     {latestReport.evolution ? latestReport.evolution.substring(0, 200) + '...' : 'View report'}
   </p>
   
   // After
   <p className="preview-text">
     {latestReport.evolution ? (
       <MarkdownPreview content={latestReport.evolution} maxLength={200} />
     ) : 'View report'}
   </p>
   ```

2. **VisualizationCard.tsx** (lines 81-85)
   - Same pattern as EvolutionCard
   - Use maxLength={150} to match current substring length

**Estimated Time:** 30 minutes

---

### Phase 3: Update List Pages

**Files to Modify:**

1. **app/evolution/page.tsx** (lines 284-285)
   
   ```tsx
   // Before
   <p className="text-white/70 text-sm line-clamp-2 mb-3">
     {report.analysis?.substring(0, 200)}...
   </p>
   
   // After
   <p className="text-white/70 text-sm line-clamp-2 mb-3">
     <MarkdownPreview 
       content={report.analysis || ''} 
       maxLength={200}
       className="text-white/70"
     />
   </p>
   ```

2. **app/visualizations/page.tsx** (lines 310-311)
   - Same pattern with maxLength={150}
   - Use line-clamp-3 as currently set

**Estimated Time:** 30 minutes

---

### Phase 4: Testing & Validation

**Test Cases:**

1. **Bold text rendering**: Content with `**bold**` should show bold text
2. **Italic text rendering**: Content with `*italic*` should show italic text
3. **Mixed formatting**: `**bold** and *italic*` renders correctly
4. **Line-clamp behavior**: Text truncates at 2-3 lines as expected
5. **No layout breakage**: Cards maintain consistent height
6. **Mobile responsiveness**: Line-clamp-2 on mobile works
7. **Empty/null content**: Fallback text displays properly
8. **Long markdown content**: No performance issues

**Estimated Time:** 30 minutes

---

## Files to Modify

### New Files

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/MarkdownPreview.tsx` | Reusable markdown preview component |

### Files Requiring Changes

| File | Location | Change Description |
|------|----------|-------------------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/EvolutionCard.tsx` | Lines 86-88 | Replace substring with MarkdownPreview |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/VisualizationCard.tsx` | Lines 81-85 | Replace substring with MarkdownPreview |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx` | Lines 284-285 | Replace substring with MarkdownPreview |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx` | Lines 310-311 | Replace substring with MarkdownPreview |

### Files for Reference (No Changes)

| File | Reason |
|------|--------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/AIResponseRenderer.tsx` | Full markdown pattern reference |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/[id]/page.tsx` | Detail page markdown pattern |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/ReflectionCard.tsx` | Markdown stripping pattern reference |

---

## Complexity Assessment

### Low Complexity
- **MarkdownPreview component creation**: Well-defined scope, clear pattern to follow
- **Card component updates**: Simple import and replace pattern
- **List page updates**: Same pattern as card updates

### Potential Edge Cases
1. **Markdown in middle of word**: `test**bold**test` - ReactMarkdown handles this
2. **Incomplete markdown syntax**: Content cut at `**bol` - May leave visible asterisks
3. **Nested formatting**: `**bold and *italic***` - ReactMarkdown handles correctly
4. **Special characters**: `<` and `>` - ReactMarkdown escapes by default

### Mitigation for Edge Cases
- Cut at word boundaries when possible (not implemented in current substring approach either)
- ReactMarkdown's sanitization handles most edge cases
- Visual testing will catch remaining issues

---

## Technology Recommendations

### Use Existing Dependencies (No New Packages)

```json
{
  "react-markdown": "^10.1.0",  // Already installed
  "remark-gfm": "^4.0.1"        // Already installed
}
```

### Do NOT Use
- `remark-strip-markdown` - Would require new dependency and loses formatting benefits
- `dangerouslySetInnerHTML` - Security concerns, prefer ReactMarkdown
- Custom regex stripping - Less maintainable than ReactMarkdown approach

---

## Risks & Challenges

### Low Risk: Line-Clamp Compatibility
- **Risk**: Rendered markdown may not line-clamp properly
- **Mitigation**: Convert all block elements to inline spans
- **Testing**: Verify with various content lengths

### Low Risk: Performance
- **Risk**: ReactMarkdown adds processing overhead in card lists
- **Mitigation**: Limit input length via maxLength prop
- **Actual Impact**: Negligible - already used in detail pages

### Very Low Risk: Style Conflicts
- **Risk**: MarkdownPreview styles conflict with card styles
- **Mitigation**: Use semantic class names, inherit parent colors where possible

---

## Recommendations for Planner

1. **Single builder task**: This feature is self-contained and estimated at 2 hours total

2. **Implementation order**:
   - Create MarkdownPreview component first (foundation)
   - Update dashboard cards (EvolutionCard, VisualizationCard)
   - Update list pages (evolution/page.tsx, visualizations/page.tsx)
   - Test all changes together

3. **Testing focus**: 
   - Verify line-clamp works with rendered markdown
   - Check mobile view (reduced line count)
   - Test with actual content from database

4. **No backend changes required**: This is purely a frontend rendering improvement

---

## Questions for Planner

1. Should the MarkdownPreview component be exported from a shared index file, or imported directly?

2. Is there a preference for handling content cut mid-markdown-syntax (e.g., `**bol...`)?

3. Should we add the trailing `...` ellipsis inside the component or leave it to the CSS line-clamp?

---

*Exploration completed: 2025-12-02*
*This report informs builder implementation decisions*
