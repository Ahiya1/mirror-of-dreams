# Code Patterns & Conventions

## File Structure

```
/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/
├── app/
│   ├── dashboard/page.tsx        # Dashboard with inline CSS
│   ├── dreams/page.tsx           # Dreams list page
│   ├── evolution/
│   │   ├── page.tsx              # Evolution list
│   │   └── [id]/page.tsx         # Evolution detail
│   ├── visualizations/
│   │   ├── page.tsx              # Visualizations list
│   │   └── [id]/page.tsx         # Visualization detail
│   ├── profile/page.tsx          # User profile
│   └── reflection/page.tsx       # Reflection page
├── components/
│   ├── shared/
│   │   ├── AppNavigation.tsx     # Top navigation header
│   │   └── MarkdownPreview.tsx   # NEW - Inline markdown for cards
│   ├── dashboard/cards/
│   │   ├── EvolutionCard.tsx     # Dashboard evolution card
│   │   └── VisualizationCard.tsx # Dashboard visualization card
│   └── navigation/
│       └── BottomNavigation.tsx  # Mobile bottom nav
└── styles/
    ├── variables.css             # CSS custom properties
    ├── globals.css               # Global styles, .pt-nav class
    └── dashboard.css             # Dashboard-specific styles
```

## Naming Conventions

- Components: PascalCase (`MarkdownPreview.tsx`)
- CSS Classes: kebab-case (`preview-text`, `dashboard-container`)
- CSS Variables: kebab-case (`--space-sm`, `--nav-height`)
- Props: camelCase (`maxLength`, `className`)

---

## CSS Responsive Patterns

### Pattern 1: Mobile-First Padding

**When to use:** Any container that needs different padding on mobile vs desktop

**Code example:**
```tsx
// Tailwind classes - preferred for most components
<div className="px-4 sm:px-6 lg:px-8">
  {/* 16px mobile, 24px tablet, 32px desktop */}
</div>

// Responsive shorthand for common spacing
<div className="p-4 sm:p-6 lg:p-8">
  {/* All sides: 16px -> 24px -> 32px */}
</div>
```

**Key points:**
- Mobile is default (no prefix)
- `sm:` is 640px+
- `md:` is 768px+
- `lg:` is 1024px+

### Pattern 2: Slim Navigation Padding

**When to use:** Navigation header to achieve < 48px height on mobile

**Code example:**
```tsx
// BEFORE - 48px height
<div className="container mx-auto px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-between">

// AFTER - 44px height
<div className="container mx-auto px-3 sm:px-6 py-1.5 sm:py-3 flex items-center justify-between">
```

**Key points:**
- `py-1.5` = 6px top + 6px bottom = 12px vertical
- With ~32px content height = 44px total
- `px-3` reduces horizontal padding on mobile for tighter feel

### Pattern 3: Dashboard Container Mobile Fix

**When to use:** Dashboard inline CSS for consistent mobile centering

**Code example:**
```css
/* BEFORE - inconsistent on very small screens */
@media (max-width: 768px) {
  .dashboard-container {
    padding: var(--space-md);  /* ~16-24px */
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: var(--space-sm);  /* ~12px - smaller than other pages! */
  }
}

/* AFTER - consistent 16px on all mobile */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;  /* Fixed 16px = px-4 */
  }
}
/* Remove the 480px breakpoint - 1rem applies to all mobile */
```

**Key points:**
- Use fixed `1rem` (16px) instead of `var(--space-sm)`
- Matches `px-4` used on other pages
- Ensures visual consistency across all mobile views

### Pattern 4: Evolution Report Reduced Spacing

**When to use:** Detail pages with excessive top space

**Code example:**
```tsx
// BEFORE - 84px top padding (pt-nav adds 24px buffer)
<div className="min-h-screen ... pt-nav px-4 sm:px-8 pb-8">

// AFTER - Tighter spacing with responsive padding
<div
  className="min-h-screen ... px-4 sm:px-8 pb-8"
  style={{ paddingTop: 'calc(var(--nav-height) + var(--demo-banner-height, 0px) + 0.5rem)' }}
>
```

**Alternative - reduce element spacing:**
```tsx
// Back button: mb-6 -> mb-4
<button className="text-purple-200 hover:text-white mb-4 flex items-center gap-2 transition-colors">

// Header card: p-6 -> p-4 sm:p-6
<div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-white/20">

// Content card: p-8 -> p-4 sm:p-6 lg:p-8
<div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 lg:p-8 border border-white/20">
```

**Key points:**
- `pt-nav` adds 24px buffer (1.5rem) which may be excessive
- Use inline style for precise padding calculation
- Or reduce child element margins/padding instead

---

## MarkdownPreview Component Pattern

### Pattern 5: Inline Markdown for Line-Clamped Containers

**When to use:** Rendering markdown in cards that use CSS line-clamp

**Problem:** CSS line-clamp requires inline content. Block elements (p, h1, ul) break line-clamp.

**Solution:** Convert all block elements to inline spans.

**Code example:**
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

          // Links - render as styled text (no navigation in preview)
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

**Key points:**
- Outer `<span>` wrapper ensures entire component is inline-level
- `<p>` to `<span>` conversion is critical for line-clamp
- Trailing space after paragraph spans ensures natural text flow
- `maxLength` truncates before parsing to limit overhead
- Cosmic color scheme maintained (`text-purple-300`, `text-purple-200`)

### Pattern 6: Using MarkdownPreview in Cards

**When to use:** Replacing raw text substring with formatted preview

**Code example:**
```tsx
// BEFORE - raw markdown visible
<p className="preview-text">
  {latestReport.evolution ? latestReport.evolution.substring(0, 200) + '...' : 'View report'}
</p>

// AFTER - formatted markdown preview
import { MarkdownPreview } from '@/components/shared/MarkdownPreview';

<p className="preview-text">
  {latestReport.evolution ? (
    <MarkdownPreview content={latestReport.evolution} maxLength={200} />
  ) : (
    'View report'
  )}
</p>
```

**Key points:**
- Keep existing `preview-text` class with line-clamp CSS
- MarkdownPreview handles truncation via `maxLength`
- No need for trailing `...` - line-clamp handles ellipsis
- Fallback text for empty content

### Pattern 7: Using MarkdownPreview in List Pages

**When to use:** Evolution/Visualization list cards with Tailwind line-clamp

**Code example:**
```tsx
// BEFORE
<p className="text-white/70 text-sm line-clamp-2 mb-3">
  {report.analysis?.substring(0, 200)}...
</p>

// AFTER
import { MarkdownPreview } from '@/components/shared/MarkdownPreview';

<p className="text-white/70 text-sm line-clamp-2 mb-3">
  <MarkdownPreview
    content={report.analysis || ''}
    maxLength={200}
    className="text-white/70"
  />
</p>
```

**Key points:**
- Keep Tailwind `line-clamp-2` or `line-clamp-3` class
- Pass className for color inheritance if needed
- Handle null/undefined content with `|| ''`

---

## Line-Clamp CSS Patterns

### Pattern 8: Line-Clamp with Webkit

**When to use:** Limiting visible text lines with ellipsis

**Code example (inline CSS):**
```css
.preview-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Mobile override - fewer lines */
@media (max-width: 768px) {
  .preview-text {
    -webkit-line-clamp: 2;
  }
}
```

**Code example (Tailwind):**
```tsx
<p className="line-clamp-3 md:line-clamp-4">
  {/* 3 lines on mobile, 4 on desktop */}
</p>
```

**Key points:**
- Requires `-webkit-` prefix (works in all modern browsers)
- Content inside must be inline-level for proper behavior
- Block elements break line-clamp calculation

---

## AppNavigation Height Calculation

### Pattern 9: Dynamic Nav Height Measurement

**When to use:** Understanding how nav height affects layout

**Reference (AppNavigation.tsx lines 86-110):**
```tsx
useEffect(() => {
  const measureHeight = () => {
    const navContainer = document.querySelector('[data-nav-container]');
    if (navContainer) {
      const height = navContainer.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    }
  };

  measureHeight();
  window.addEventListener('resize', measureHeight);
  return () => window.removeEventListener('resize', measureHeight);
}, []);
```

**Key points:**
- Nav height is measured dynamically and set as CSS variable
- Changing padding will automatically update `--nav-height`
- `pt-nav` class uses this variable for spacing
- No manual adjustment needed when changing nav padding

### Pattern 10: pt-nav Utility Class

**Reference (globals.css lines 654-657):**
```css
.pt-nav {
  /* Extra 1.5rem buffer for visual breathing room below fixed nav */
  padding-top: calc(var(--nav-height) + var(--demo-banner-height, 0px) + 1.5rem);
}
```

**When pt-nav is appropriate:**
- Pages with scrolling content that needs generous top spacing
- Pages where the nav doesn't overlap content

**When to use custom padding:**
- Detail pages where content should start closer to nav
- Pages where 1.5rem buffer is excessive

---

## Import Order Convention

```tsx
// 1. React/Next.js imports
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 2. Third-party libraries
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

// 3. Internal components
import { GlassCard } from '@/components/shared/GlassCard';
import { MarkdownPreview } from '@/components/shared/MarkdownPreview';
import { AppNavigation } from '@/components/shared/AppNavigation';

// 4. Utilities and types
import { cn } from '@/lib/utils';
import type { EvolutionReport } from '@/types';

// 5. Styles (if any)
import styles from './Component.module.css';
```

---

## Code Quality Standards

- **Consistent padding values:** Use `1rem` (16px) on mobile, `1.5rem` (24px) on tablet, `2rem` (32px) on desktop
- **Tailwind preferred:** Use Tailwind classes over inline styles when possible
- **Inline styles for calc():** Use inline style for complex CSS calculations
- **No magic numbers:** Use CSS variables or Tailwind classes, not raw pixel values
- **Mobile-first:** Always start with mobile styles, then add breakpoint overrides

---

## Testing Patterns

### Visual Testing Checklist

```markdown
## Mobile Centering Test
- [ ] Dashboard: Content centered at 375px, 390px, 414px, 428px widths
- [ ] Dreams page: Content centered on mobile
- [ ] Evolution page: Content centered on mobile
- [ ] Visualizations page: Content centered on mobile
- [ ] Profile page: Content centered on mobile
- [ ] Reflection page: Content centered on mobile

## Navigation Header Test
- [ ] Header height < 48px on mobile
- [ ] Header doesn't overlap page content
- [ ] "Back to X" links visible below header

## Markdown Preview Test
- [ ] Bold text (**bold**) renders as bold
- [ ] Italic text (*italic*) renders as italic
- [ ] Line-clamp truncates at correct line count
- [ ] No layout shift when markdown renders
- [ ] Empty content shows fallback text

## Evolution Report Spacing Test
- [ ] Content visible within 150px of viewport top (after header)
- [ ] Back button positioned correctly
- [ ] Cards have appropriate padding on mobile
```
