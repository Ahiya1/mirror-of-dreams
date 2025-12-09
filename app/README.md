# Next.js App Router Foundation

This directory contains the Next.js 14 App Router structure for Mirror of Dreams.

## Structure Created

```
app/
├── layout.tsx (ROOT LAYOUT - Complete)
├── page.tsx (Landing page - Needs Portal migration)
├── auth/
│   ├── signin/page.tsx (Placeholder - Needs SigninForm migration)
│   └── signup/page.tsx (Placeholder - Needs SignupForm migration)
├── dashboard/page.tsx (Placeholder - Needs Dashboard migration)
├── reflection/
│   ├── page.tsx (Placeholder - Needs Questionnaire migration)
│   └── output/page.tsx (Placeholder - Needs Output migration)
└── reflections/ ← NEW ROUTE (Missing from original app)
    ├── page.tsx (Foundation - Needs full implementation)
    └── [id]/page.tsx (Foundation - Needs full implementation)
```

## Foundation Complete

- ✅ Next.js configuration (next.config.js)
- ✅ Tailwind CSS configuration (tailwind.config.ts)
- ✅ PostCSS configuration (postcss.config.js)
- ✅ Global styles with cosmic theme (styles/globals.css)
- ✅ Root layout with cosmic background (app/layout.tsx)
- ✅ Utility functions (lib/utils.ts)
- ✅ Directory structure for all routes
- ✅ Type definitions for reflection components (components/reflections/types.ts)
- ✅ package.json scripts updated for Next.js

## Work Remaining for Sub-Builders

### Builder-3A: Component Migration

**Scope:** Migrate existing React components from .jsx to .tsx

**Priority Files:**

1. `app/page.tsx` - Migrate Portal component
2. `app/auth/signin/page.tsx` - Migrate SigninForm
3. `app/auth/signup/page.tsx` - Migrate SignupForm
4. `app/dashboard/page.tsx` - Migrate Dashboard + cards
5. `app/reflection/page.tsx` - Migrate Questionnaire
6. `app/reflection/output/page.tsx` - Migrate Output

**Source Files:**

- `src/components/portal/Portal.jsx`
- `src/components/auth/*.jsx`
- `src/components/dashboard/*.jsx`
- `src/components/mirror/*.jsx`
- `src/components/shared/*.jsx`

**Key Tasks:**

- Convert .jsx to .tsx with proper TypeScript types
- Add 'use client' directive where needed
- Replace React Router with Next.js navigation
- Integrate tRPC calls (when Builder-2 complete)
- Preserve all existing styling and animations
- Test each migrated component

### Builder-3B: /reflections Route Implementation

**Scope:** Complete the NEW /reflections route with full functionality

**Files to Complete:**

1. `app/reflections/page.tsx` - Full list view
2. `app/reflections/[id]/page.tsx` - Full detail view

**Components to Create:**

1. `components/reflections/ReflectionsList.tsx` - Main list component
2. `components/reflections/ReflectionCard.tsx` - Individual card
3. `components/reflections/ReflectionDetail.tsx` - Detail view component
4. `components/reflections/SearchBar.tsx` - Search and filter

**Features Required:**

**List View:**

- Pagination (20 reflections per page)
- Search bar (search dream/plan/relationship content)
- Filters:
  - Tone (gentle, intense, fusion)
  - Premium status
  - Sort by (created date, word count, rating)
  - Sort order (asc/desc)
- Reflection cards showing:
  - Title or first 50 chars of dream
  - Created date
  - Tone badge
  - Premium indicator
  - Word count
  - Preview (first 100 chars)
- Click card → navigate to detail page
- Cosmic theme styling
- Mobile responsive

**Detail View:**

- Full AI reflection response (with markdown rendering)
- Original questionnaire answers
- Metadata display:
  - Created date
  - Tone
  - Word count
  - Estimated read time
  - Premium status
- Feedback form:
  - Rating slider (1-10)
  - Optional text feedback
- Edit controls:
  - Update title
  - Add/remove tags
- Delete button with confirmation dialog
- Back to list button
- Share/export options (optional)

**tRPC Integration:**

- Use `trpc.reflections.getHistory` for list
- Use `trpc.reflections.getById` for detail
- Use `trpc.reflections.update` for edits
- Use `trpc.reflections.delete` for deletion
- Use `trpc.reflections.submitFeedback` for rating

## Integration Notes

- Root layout is complete and ready
- All placeholder pages have consistent structure
- Cosmic background preserved from original design
- Tailwind utilities available alongside existing CSS
- Types from Builder-1 are ready to import
- tRPC procedures from Builder-2/Builder-4 will be integrated during component migration

## Testing

After sub-builders complete:

1. Test all routes load without errors
2. Test navigation between routes
3. Test /reflections pagination
4. Test /reflections search and filtering
5. Test /reflections/[id] displays correctly
6. Test mobile responsiveness
7. Verify cosmic background animations work
