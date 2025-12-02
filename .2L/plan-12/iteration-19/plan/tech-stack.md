# Technology Stack

## Overview

This iteration uses **existing dependencies only**. No new packages are introduced.

## Core Framework

**Decision:** Next.js (existing)

**Rationale:**
- Already in use for the Mirror of Dreams app
- No changes needed to core framework

## Markdown Rendering

**Decision:** ReactMarkdown v10.1.0 (existing)

**Rationale:**
- Already installed and used in detail pages
- Mature integration with remark-gfm plugin
- Custom component overrides allow cosmic theme styling
- No new dependency required

**Package Location:**
```json
{
  "react-markdown": "^10.1.0",
  "remark-gfm": "^4.0.1"
}
```

**Implementation Notes:**
- Used extensively in `AIResponseRenderer.tsx`
- Used in `app/evolution/[id]/page.tsx` for detail views
- Used in `app/visualizations/[id]/page.tsx` for detail views
- New `MarkdownPreview` component will reuse same package

## CSS Framework

**Decision:** Tailwind CSS (existing)

**Rationale:**
- Already in use throughout the application
- Provides responsive utilities (`sm:`, `md:`, `lg:`)
- Line-clamp utilities available (`line-clamp-2`, `line-clamp-3`)
- Padding utilities consistent across pages (`px-4`, `py-2`, etc.)

**Key Utilities Used:**
- `py-1.5`, `py-2`, `py-3`, `py-4` - vertical padding
- `px-3`, `px-4`, `px-6`, `px-8` - horizontal padding
- `line-clamp-2`, `line-clamp-3` - text truncation
- `sm:`, `md:`, `lg:` - responsive breakpoints

## CSS Variables System

**Decision:** Custom CSS Variables (existing)

**Rationale:**
- Already defined in `/styles/variables.css`
- Used for responsive spacing scale
- Provides design consistency

**Key Variables:**
```css
/* Responsive spacing scale using clamp() */
--space-xs: clamp(0.5rem, 1vw, 0.75rem);    /* 8-12px */
--space-sm: clamp(0.75rem, 1.5vw, 1rem);    /* 12-16px */
--space-md: clamp(1rem, 2.5vw, 1.5rem);     /* 16-24px */
--space-lg: clamp(1.5rem, 3vw, 2rem);       /* 24-32px */
--space-xl: clamp(2rem, 4vw, 3rem);         /* 32-48px */

/* Navigation */
--nav-height: 60px;  /* Dynamically set via JS */
--demo-banner-height: 0px;  /* Set when banner active */
--bottom-nav-height: 64px;
```

**Implementation Notes:**
- Dashboard uses `--space-sm` on mobile which resolves to ~12px
- This is inconsistent with `px-4` (16px) used elsewhere
- Fix: Use `1rem` (16px) explicitly for dashboard mobile padding

## Styling Approach

**Decision:** Inline CSS + Tailwind Classes (existing pattern)

**Rationale:**
- Dashboard page uses inline `<style>` tags
- Most components use Tailwind utility classes
- Maintain existing patterns, don't introduce new approaches

**Pattern Examples:**
- Dashboard: `<style jsx>` for component-specific CSS
- AppNavigation: Tailwind classes (`py-2 sm:py-4`)
- Evolution pages: Mix of Tailwind and inline styles

## Environment Variables

No new environment variables required for this iteration.

## Dependencies Overview

**Used (No Changes):**
- `react-markdown@^10.1.0` - Markdown rendering
- `remark-gfm@^4.0.1` - GitHub Flavored Markdown support
- `tailwindcss` - Utility CSS framework

**NOT Used (Explicitly Avoided):**
- `remark-strip-markdown` - Would require new dependency
- `marked` - Not needed, ReactMarkdown handles everything
- Any new packages - This is a CSS/component polish only

## Performance Targets

- No new bundle size increase (reusing existing packages)
- Line-clamped markdown renders in < 16ms per card
- No layout shift from markdown rendering

## Security Considerations

- ReactMarkdown sanitizes HTML by default
- No `dangerouslySetInnerHTML` usage
- User-generated content rendered safely through ReactMarkdown

---

**Tech Stack Status:** CONFIRMED
**New Dependencies:** None
