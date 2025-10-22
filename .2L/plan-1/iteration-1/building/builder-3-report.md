# Builder-3 Report: Next.js 14 Migration + /reflections Route

## Status
SPLIT

## Summary
Task complexity requires subdivision. Created complete Next.js 14 App Router foundation with all routing structure, configuration, and placeholder pages. The /reflections route foundation is in place with clear specifications for full implementation. Ready for sub-builders to complete component migrations and full route implementations.

## Foundation Created

### Files

**Next.js Configuration:**
- `next.config.js` - Next.js configuration with canvas externalization
- `tailwind.config.ts` - Tailwind CSS configuration with cosmic theme colors
- `postcss.config.js` - PostCSS configuration for Tailwind
- `tsconfig.json` - Already created by Builder-1

**Styling:**
- `styles/globals.css` - Global styles with Tailwind imports and cosmic theme
- Preserved cosmic background animations
- Extended Tailwind with cosmic color palette (purple, blue, gold, indigo, pink)
- Custom animations (float, shimmer, pulse-slow)

**Utilities:**
- `lib/utils.ts` - Utility functions (cn, formatDate, timeAgo, truncate)

**App Router Structure:**
- `app/layout.tsx` - Root layout with TRPCProvider (updated by Builder-2) and cosmic background
- `app/page.tsx` - Landing page placeholder (Portal migration pending)
- `app/auth/signin/page.tsx` - Sign in page placeholder
- `app/auth/signup/page.tsx` - Sign up page placeholder
- `app/dashboard/page.tsx` - Dashboard page placeholder
- `app/reflection/page.tsx` - Reflection questionnaire placeholder
- `app/reflection/output/page.tsx` - Reflection output placeholder
- `app/reflections/page.tsx` - **NEW** Reflection list view foundation
- `app/reflections/[id]/page.tsx` - **NEW** Reflection detail view foundation

**Component Types:**
- `components/reflections/types.ts` - TypeScript type definitions for reflection components

**Documentation:**
- `app/README.md` - Comprehensive guide for sub-builders

**Package Configuration:**
- `package.json` - Updated scripts for Next.js (dev, build, start, lint)

### Foundation Description

The foundation provides a complete, working Next.js 14 application that builds successfully with:

1. **App Router Structure**: All required routes created with placeholder pages that clearly document what needs to be migrated
2. **Configuration Complete**: Next.js, Tailwind, PostCSS all configured and tested
3. **Styling System**: Tailwind CSS integrated alongside preserved cosmic theme CSS
4. **Type Safety**: TypeScript types defined for reflection components
5. **Build Verified**: `npm run build` completes successfully with 0 errors
6. **tRPC Integration**: Root layout includes TRPCProvider from Builder-2
7. **Cosmic Theme Preserved**: Background animations and color scheme maintained
8. **Clear Documentation**: README explains what each sub-builder needs to do

All foundation files are complete, tested, and ready for sub-builders to extend.

### Foundation Tests

**Build Test:**
```bash
npm run build
```
Result: ✅ PASSING - All routes compile, 0 TypeScript errors, 10 pages generated

**Routes Verified:**
- ✅ `/` - Landing page loads
- ✅ `/auth/signin` - Sign in page loads
- ✅ `/auth/signup` - Sign up page loads
- ✅ `/dashboard` - Dashboard page loads
- ✅ `/reflection` - Reflection questionnaire loads
- ✅ `/reflection/output` - Reflection output loads
- ✅ `/reflections` - **NEW** Reflection list loads
- ✅ `/reflections/[id]` - **NEW** Reflection detail (dynamic route) loads
- ✅ `/api/trpc/[trpc]` - tRPC API route (from Builder-2)

## Subtasks for Sub-Builders

### Builder-3A: Component Migration (Dashboard + Auth + Reflection Flow)

**Scope:** Migrate existing React components from .jsx to .tsx and integrate into Next.js App Router

**Estimated Complexity:** MEDIUM

**Files to Complete:**

**Authentication Pages:**
- `app/auth/signin/page.tsx` - Migrate `src/components/auth/SigninForm.jsx`
- `app/auth/signup/page.tsx` - Migrate `src/components/auth/SignupForm.jsx`

**Dashboard:**
- `app/dashboard/page.tsx` - Migrate `src/components/dashboard/Dashboard.jsx`
- `components/dashboard/cards/*.tsx` - Convert all dashboard cards to TypeScript
- `components/dashboard/shared/*.tsx` - Convert shared dashboard components

**Reflection Flow:**
- `app/reflection/page.tsx` - Migrate `src/components/mirror/Questionnaire.jsx`
- `app/reflection/output/page.tsx` - Migrate `src/components/mirror/Output.jsx`
- `components/mirror/*.tsx` - Convert mirror components to TypeScript

**Landing Page:**
- `app/page.tsx` - Migrate `src/components/portal/Portal.jsx`
- `components/portal/*.tsx` - Convert portal components to TypeScript

**Shared Components:**
- `components/shared/*.tsx` - Convert shared components (CosmicBackground, etc.)

**Foundation usage:**
- Uses Next.js App Router file-based routing
- Uses `'use client'` directive for client components
- Uses `useRouter` from `next/navigation` (not React Router)
- Uses types from `@/types` (Builder-1)
- Calls tRPC procedures from Builder-2/Builder-4
- Preserves all existing CSS and animations
- Uses Tailwind utilities where beneficial

**Success criteria:**
- [ ] All .jsx files converted to .tsx
- [ ] TypeScript strict mode - 0 errors
- [ ] All components render without runtime errors
- [ ] Navigation works (Next.js Link/router)
- [ ] Authentication flow functional with tRPC
- [ ] Reflection creation flow works
- [ ] Dashboard displays user data correctly
- [ ] Cosmic theme preserved exactly
- [ ] Mobile responsive

**Implementation guidance:**

1. **Start with shared components** (no dependencies):
   - `components/shared/CosmicBackground.tsx`
   - Convert to TypeScript, test independently

2. **Then authentication**:
   - Convert `SigninForm.jsx` → `app/auth/signin/page.tsx`
   - Replace `fetch` calls with `trpc.auth.signin.useMutation()`
   - Replace React Router navigation with `useRouter` from `next/navigation`
   - Test sign in flow

3. **Then dashboard**:
   - Convert card components first (leaf nodes)
   - Then convert Dashboard.jsx
   - Use `trpc.users.getDashboardData.useQuery()` for data fetching
   - Test dashboard loads with user data

4. **Then reflection flow**:
   - Convert Questionnaire first
   - Convert Output second
   - Use `trpc.reflection.create.useMutation()` for reflection creation
   - Test full flow: questionnaire → AI generation → output display

5. **Finally landing page**:
   - Convert Portal component
   - Test navigation to all routes

**Key Patterns:**

```typescript
// Client component pattern
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const signinMutation = trpc.auth.signin.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    },
  });

  // ... rest of component
}
```

### Builder-3B: /reflections Route Implementation (NEW Feature)

**Scope:** Complete the NEW /reflections route with full list view, detail view, and all interactive features

**Estimated Complexity:** MEDIUM

**Files to Complete:**

**Route Pages:**
- `app/reflections/page.tsx` - Full list view with pagination, search, filters
- `app/reflections/[id]/page.tsx` - Full detail view with metadata, feedback, edit controls

**Components:**
- `components/reflections/ReflectionsList.tsx` - Main list component
- `components/reflections/ReflectionCard.tsx` - Individual reflection card
- `components/reflections/ReflectionDetail.tsx` - Detail view component
- `components/reflections/SearchBar.tsx` - Search and filter component
- `components/reflections/Pagination.tsx` - Pagination controls
- `components/reflections/FeedbackForm.tsx` - Rating and feedback form
- `components/reflections/DeleteConfirmDialog.tsx` - Delete confirmation

**Foundation usage:**
- Extends type definitions in `components/reflections/types.ts`
- Uses `trpc.reflections.getHistory` for list data
- Uses `trpc.reflections.getById` for detail data
- Uses `trpc.reflections.update` for edits
- Uses `trpc.reflections.delete` for deletion
- Uses `trpc.reflections.submitFeedback` for ratings
- Follows cosmic theme from `tailwind.config.ts`
- Uses utility functions from `lib/utils.ts`

**Success criteria:**
- [ ] List view displays paginated reflections (20 per page)
- [ ] Search works (searches dream/plan/relationship fields)
- [ ] Filters work (tone, premium status)
- [ ] Sort works (created date, word count, rating)
- [ ] Pagination controls work correctly
- [ ] Reflection cards show all required information
- [ ] Click card navigates to detail page
- [ ] Detail view displays full reflection content
- [ ] Detail view shows all metadata
- [ ] Feedback form submits ratings successfully
- [ ] Edit title/tags functionality works
- [ ] Delete with confirmation works
- [ ] Back button returns to list
- [ ] Cosmic theme maintained
- [ ] Mobile responsive

**Implementation guidance:**

**1. List View (`app/reflections/page.tsx`):**

```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { ReflectionsList } from '@/components/reflections/ReflectionsList';
import { SearchBar } from '@/components/reflections/SearchBar';

export default function ReflectionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const { data, isLoading } = trpc.reflections.getHistory.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    ...filters,
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-cosmic-purple">
          Your Reflections
        </h1>

        <SearchBar
          value={search}
          onChange={setSearch}
          onFilter={setFilters}
        />

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <ReflectionsList
            reflections={data?.items || []}
            currentPage={page}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
```

**2. Detail View (`app/reflections/[id]/page.tsx`):**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { ReflectionDetail } from '@/components/reflections/ReflectionDetail';

interface Props {
  params: { id: string };
}

export default function ReflectionDetailPage({ params }: Props) {
  const router = useRouter();
  const { data, isLoading } = trpc.reflections.getById.useQuery({
    id: params.id
  });

  const deleteMutation = trpc.reflections.delete.useMutation({
    onSuccess: () => {
      router.push('/reflections');
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Reflection not found</div>;

  return (
    <ReflectionDetail
      reflection={data}
      onDelete={() => deleteMutation.mutate({ id: params.id })}
      onBack={() => router.push('/reflections')}
    />
  );
}
```

**3. ReflectionCard Component:**

```typescript
interface ReflectionCardProps {
  reflection: Reflection;
  onClick: () => void;
}

export function ReflectionCard({ reflection, onClick }: ReflectionCardProps) {
  return (
    <div
      onClick={onClick}
      className="border border-cosmic-purple/30 rounded-lg p-6 hover:bg-cosmic-purple/5 cursor-pointer transition-all"
    >
      <h3 className="text-xl font-semibold mb-2 text-cosmic-gold">
        {reflection.title || truncate(reflection.dream, 50)}
      </h3>
      <p className="text-gray-400 mb-4 line-clamp-2">
        {truncate(reflection.dream, 100)}
      </p>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">
          {formatDate(reflection.createdAt)}
        </span>
        <span className="capitalize text-cosmic-blue">
          {reflection.tone} tone
        </span>
        {reflection.isPremium && (
          <span className="px-2 py-1 bg-cosmic-purple/20 text-cosmic-purple rounded">
            Premium
          </span>
        )}
        <span className="text-gray-500">
          {reflection.wordCount} words
        </span>
      </div>
    </div>
  );
}
```

**4. Search and Filter:**

Implement filters for:
- Tone selector (dropdown: gentle, intense, fusion)
- Premium toggle
- Sort by selector (created date, word count, rating)
- Sort order toggle (asc/desc)

**5. Feedback Form:**

- Rating slider (1-10) using range input
- Optional text feedback (textarea)
- Submit button calling `trpc.reflections.submitFeedback.useMutation()`

**6. Styling:**

- Use cosmic theme colors consistently
- Maintain gradient backgrounds
- Preserve animations (hover effects, transitions)
- Ensure mobile responsive (use Tailwind responsive utilities)
- Match existing dashboard card styling for consistency

## Patterns Followed

**Next.js App Router Patterns:**
- File-based routing in `app/` directory
- Server Components by default (placeholders are server components)
- Client Components marked with `'use client'` directive
- Dynamic routes with `[id]` syntax
- Root layout with global providers

**TypeScript Patterns:**
- Strict mode enabled (via tsconfig.json from Builder-1)
- Interface definitions for component props
- Type imports from `@/types` (Builder-1)
- Proper typing for Next.js page props

**Styling Patterns:**
- Tailwind CSS utility-first approach
- Custom cosmic theme colors in tailwind.config.ts
- Global CSS for complex animations
- `cn()` utility for conditional classes
- Preserved existing CSS alongside Tailwind

**Code Organization:**
- Routes in `app/` directory
- Reusable components in `components/` directory
- Utilities in `lib/` directory
- Types in `types/` directory (Builder-1)
- Clear separation of concerns

## Integration Notes

### Foundation Integration

The foundation is in `/home/ahiya/mirror-of-dreams/app/` and related directories.

Sub-builders should:
- **Read `app/README.md`** for detailed guidance
- Import types from `@/types` (Builder-1)
- Import tRPC client from `@/lib/trpc` (Builder-2)
- Use utility functions from `@/lib/utils`
- Follow cosmic theme defined in `tailwind.config.ts`
- Preserve global styles in `styles/globals.css`
- Add 'use client' directive for client components
- Use Next.js navigation (`useRouter` from `next/navigation`)

### Final Integration

When all sub-builders complete, the integrator should:

1. **Verify all routes work:**
   - Test navigation from landing page to all routes
   - Verify authentication flow
   - Test reflection creation and viewing
   - Test /reflections list and detail pages

2. **Verify tRPC integration:**
   - Ensure all tRPC calls work correctly
   - Check error handling
   - Verify loading states

3. **Test styling:**
   - Check cosmic background renders
   - Verify animations work
   - Test responsive design on mobile
   - Ensure consistent theme across all pages

4. **Build and deploy:**
   ```bash
   npm run build
   # Should complete with 0 errors

   npm start
   # Test locally

   # Deploy to Vercel
   vercel deploy
   ```

5. **Post-deployment checks:**
   - Test all routes in production
   - Verify tRPC endpoints work
   - Check console for errors
   - Test on multiple devices

## Why Split Was Necessary

**Original Task Scope:**
- Install Next.js dependencies ✅ (DONE)
- Create Next.js configuration ✅ (DONE)
- Migrate to App Router structure ✅ (FOUNDATION DONE)
- Add /reflections route ✅ (FOUNDATION DONE)
- Migrate 33+ .jsx components to .tsx ⏳ (PENDING - Builder-3A)
- Preserve styling ✅ (FOUNDATION DONE)

**Reasons for Split:**

1. **Component Migration Volume**: 33+ .jsx files to convert to .tsx is substantial work (2+ hours alone)
   - Each component needs TypeScript types
   - Each needs 'use client' directive evaluation
   - Each needs tRPC integration
   - Each needs testing

2. **NEW Feature Complexity**: /reflections route requires:
   - Complete list view with pagination, search, filters
   - Complete detail view with metadata, feedback, editing
   - 6+ new components to build from scratch
   - tRPC integration for all CRUD operations
   - This is a full feature, not just a migration

3. **Different Skill Sets**:
   - Builder-3A: Component migration (converting existing JSX to TSX)
   - Builder-3B: New feature implementation (building /reflections from scratch)

4. **Parallel Work Opportunity**:
   - Builder-3A can work on component migrations
   - Builder-3B can work on /reflections route
   - Both can work simultaneously after foundation complete

5. **Quality Assurance**:
   - Splitting allows focused testing of each area
   - Component migrations can be tested individually
   - /reflections route can be tested as a complete feature
   - Reduces risk of bugs from rushing large scope

**Foundation Accomplishments:**
- Next.js setup complete and tested (builds successfully)
- All route structure in place
- Configuration complete
- Styling system ready
- Clear documentation for sub-builders
- Type definitions ready
- Build verified working

## Sub-builder Coordination

**Dependencies:**
- Builder-3A and Builder-3B can work in **parallel** - no dependencies between them
- Both depend on Builder-2 (tRPC setup) being complete for full integration
- Both depend on Builder-4 (API migration) for some tRPC procedures

**Shared Files:**
- `app/layout.tsx` - Owned by Builder-3 foundation (DO NOT MODIFY)
- `styles/globals.css` - Can be extended by either builder if needed
- `tailwind.config.ts` - Can be extended by either builder if needed
- `lib/utils.ts` - Can be extended by either builder if needed

**Integration Order:**
1. Builder-3A completes component migrations
2. Builder-3B completes /reflections route
3. Test together - verify navigation from dashboard to /reflections works
4. Verify cosmic theme consistent across all pages
5. Full integration testing

## Deliverables Summary

### ✅ COMPLETE (Foundation)

1. **Next.js Configuration:**
   - `next.config.js` with canvas handling
   - `tailwind.config.ts` with cosmic theme
   - `postcss.config.js`
   - `package.json` scripts updated

2. **Styling System:**
   - `styles/globals.css` with Tailwind + cosmic theme
   - Cosmic background preserved
   - Custom animations defined

3. **App Router Structure:**
   - Root layout with TRPCProvider
   - All 10 routes created with placeholders
   - Dynamic route for /reflections/[id]

4. **Utilities & Types:**
   - `lib/utils.ts` with helper functions
   - `components/reflections/types.ts` with component types

5. **Documentation:**
   - `app/README.md` with comprehensive sub-builder guide

6. **Build Verification:**
   - ✅ `npm run build` successful
   - ✅ 0 TypeScript errors
   - ✅ 10 pages generated
   - ✅ All routes accessible

### ⏳ PENDING (Sub-Builders)

**Builder-3A:**
- 33+ component migrations from .jsx to .tsx
- tRPC integration for all components
- Authentication flow migration
- Dashboard migration
- Reflection flow migration
- Landing page migration

**Builder-3B:**
- /reflections list page implementation
- /reflections/[id] detail page implementation
- 6+ new components for reflection viewing
- Search, filter, pagination functionality
- Feedback and edit functionality

## Testing Notes

**Foundation Testing Completed:**
```bash
# Clean build test
rm -rf .next
npm run build

# Result: ✅ SUCCESS
# - 10 pages generated
# - 0 TypeScript errors
# - 0 build warnings
# - All routes compile successfully
```

**Routes Available:**
- http://localhost:3000/ (Landing - placeholder)
- http://localhost:3000/auth/signin (Sign in - placeholder)
- http://localhost:3000/auth/signup (Sign up - placeholder)
- http://localhost:3000/dashboard (Dashboard - placeholder)
- http://localhost:3000/reflection (Questionnaire - placeholder)
- http://localhost:3000/reflection/output (Output - placeholder)
- http://localhost:3000/reflections (List view - foundation ready)
- http://localhost:3000/reflections/[any-uuid] (Detail view - foundation ready)

**Sub-Builder Testing Requirements:**

**Builder-3A should test:**
- Each migrated component renders correctly
- Navigation works with Next.js router
- tRPC calls succeed
- Authentication flow works end-to-end
- Reflection creation flow works end-to-end
- Styling preserved exactly

**Builder-3B should test:**
- /reflections list displays correctly
- Pagination works (page 1, 2, 3, etc.)
- Search filters reflections
- Filters apply correctly
- Sort changes order
- Click card navigates to detail
- Detail page displays full reflection
- Feedback form submits successfully
- Edit title/tags works
- Delete with confirmation works
- Back button returns to list
- Mobile responsive design

**Integration Testing (After Both Sub-Builders):**
- Navigate from dashboard to /reflections
- Create reflection, then view in /reflections list
- Full user flow: sign in → dashboard → create reflection → view in list → view detail
- Test on mobile devices
- Test on different browsers
- Verify no console errors
