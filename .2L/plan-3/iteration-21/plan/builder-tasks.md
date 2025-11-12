# Builder Task Breakdown - Iteration 21 (FINAL)

## Overview

2 primary builders will work in parallel on complementary features. Estimated total time: 24-30 hours (2 days with 2 builders working ~12-15 hours each).

## Builder Assignment Strategy

- **Builder-1:** Navigation, Evolution/Visualization Polish, Security (Backend/Frontend mix)
- **Builder-2:** Onboarding, Toast System, Landing Page (Frontend focus)
- Minimal file conflicts expected (different feature domains)
- Integration: Merge Builder-1 first (navigation foundation), then Builder-2 (uses navigation)

---

## Builder-1: Navigation, Evolution Polish & Security

### Scope

Builder-1 owns the foundational infrastructure that all pages depend on:
1. Extract shared navigation component from dashboard
2. Apply navigation to all app pages (Dreams, Evolution, Visualizations, detail pages)
3. Polish Evolution and Visualization display with markdown rendering
4. Add eligibility UI ("You have X/4 reflections")
5. Security updates (npm audit fix)
6. Console.log cleanup

**Why single builder:** Navigation extraction is risky (dashboard dependency), needs careful testing, same person should apply it everywhere for consistency.

### Complexity Estimate

**HIGH** - Navigation extraction is complex and critical. Evolution polish is medium. Security is low but important.

Breakdown:
- Navigation extraction & application: HIGH (6-8 hours)
- Evolution/Visualization polish: MEDIUM (4-6 hours)
- Security & cleanup: LOW (2 hours)
- Total: **12-16 hours**

### Success Criteria

- [ ] AppNavigation component created and extracted from dashboard
- [ ] Navigation appears on all pages (Dashboard, Dreams, Evolution, Visualizations, all detail pages)
- [ ] User can access user menu (Profile, Settings, Upgrade, Sign Out) from any page
- [ ] Active page highlighting works (currentPage prop)
- [ ] Mobile responsive (hamburger menu on small screens)
- [ ] Evolution reports display with markdown formatting (section headers, bold, italic)
- [ ] Visualizations display with immersive styling
- [ ] Eligibility UI shows "You have X/4 reflections, need 4 to generate report"
- [ ] "Generate Evolution Report" button appears on dream detail page when eligible
- [ ] "Generate Visualization" button appears on dream detail page when eligible
- [ ] npm audit shows 0 critical vulnerabilities
- [ ] Zero console.log statements in production code
- [ ] TypeScript compiles with 0 errors
- [ ] Dashboard functionality preserved (no regressions)

### Files to Create

**New Files:**
1. `components/shared/AppNavigation.tsx` - Shared navigation component (350-400 lines)
2. `components/shared/EmptyState.tsx` - Standardized empty state component (80-100 lines)

**Modified Files:**
3. `app/dashboard/page.tsx` - Replace inline nav with AppNavigation (remove lines 184-320, add <AppNavigation />)
4. `app/dreams/page.tsx` - Add AppNavigation at top
5. `app/dreams/[id]/page.tsx` - Add AppNavigation + "Generate" buttons + eligibility UI
6. `app/evolution/page.tsx` - Add AppNavigation + EmptyState
7. `app/evolution/[id]/page.tsx` - Add AppNavigation + markdown rendering
8. `app/visualizations/page.tsx` - Add AppNavigation + EmptyState
9. `app/visualizations/[id]/page.tsx` - Add AppNavigation + immersive styling
10. `app/reflections/page.tsx` - Add AppNavigation (if exists)
11. `app/reflections/[id]/page.tsx` - Add AppNavigation (if exists)
12. `package.json` - Add react-markdown and remark-gfm dependencies
13. `package-lock.json` - Updated after npm install
14. Multiple files - Remove console.log statements (search codebase for console.log)

### Dependencies

**Depends on:** None (Builder-1 starts first)
**Blocks:** Builder-2 (onboarding uses AppNavigation)

### Implementation Notes

**Navigation Extraction Steps:**
1. Create `components/shared/AppNavigation.tsx` first
2. Copy dashboard nav code (lines 184-320 from app/dashboard/page.tsx)
3. Extract to component with props: `currentPage`, `onRefresh` (optional)
4. Test AppNavigation in isolation (create test page or temporarily add to dashboard)
5. Replace dashboard inline nav with `<AppNavigation currentPage="dashboard" onRefresh={handleRefreshData} />`
6. Test dashboard thoroughly (user menu, dropdown, nav links, mobile menu)
7. Once dashboard works, apply to other pages (Dreams, Evolution, Visualizations)
8. Each page: Import AppNavigation, add at top of page, pass currentPage prop
9. Test navigation on every page (active state, user menu, signout)

**Evolution/Visualization Polish Steps:**
1. Install dependencies: `npm install react-markdown remark-gfm`
2. Create markdown CSS classes (in globals.css or new markdown.css):
   - Headers (h2, h3): larger text, bold, white color
   - Paragraphs (p): white/80, line-height relaxed
   - Lists (ul, li): white/80, list-disc
   - Strong (strong): bold, white
   - Emphasis (em): italic, purple-300
3. Update `app/evolution/[id]/page.tsx`:
   - Import ReactMarkdown and remarkGfm
   - Wrap report content in `<ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown-content">{content}</ReactMarkdown>`
4. Update `app/visualizations/[id]/page.tsx`:
   - Same markdown rendering
   - Add larger text, future-self perspective emphasis
5. Update `app/dreams/[id]/page.tsx`:
   - Fetch reflection count via tRPC
   - Show eligibility UI: "You have X reflections, need 4 for evolution report"
   - Show "Generate Evolution Report" button if >= 4 reflections
   - Show "Generate Visualization" button if >= 4 reflections
   - Disable buttons if monthly limit reached (check usage tracking)

**Security & Cleanup Steps:**
1. Run `npm audit` to see current vulnerabilities
2. Run `npm audit fix` to auto-update dependencies
3. Test build: `npm run build` (ensure no breaking changes)
4. Test dev server: `npm run dev` (ensure app still works)
5. Search for console.log: `grep -r "console.log" app/ server/ components/ hooks/`
6. Remove or comment out console.log statements
7. Keep console.error for actual errors (server-side only)
8. Add conditional logging if needed: `if (process.env.NODE_ENV === 'development') console.log(...)`
9. Run `npx tsc --noEmit` to verify TypeScript compilation
10. Manual test: Sign in, navigate to all pages, verify no console errors

**Gotchas:**
- Dashboard navigation has complex state (dropdown, mobile menu) - extract carefully
- User menu dropdown closes on outside click - preserve this behavior
- Admin link conditional (user.is_admin) - ensure logic preserved
- Mobile responsive - test on small screens, hamburger menu should work
- Markdown styling - test with real evolution report content (not lorem ipsum)
- npm audit fix might update Next.js - test build thoroughly after update

### Patterns to Follow

Reference patterns from `patterns.md`:
- **Pattern 8:** Shared Navigation Component (full code example provided)
- **Pattern 6:** Glass UI Component Structure (for consistent page layout)
- **Pattern 5:** Supabase Query Pattern (for eligibility checks)
- **Pattern 11:** React Query Caching (for evolution/visualization queries)

### Testing Requirements

**Unit Tests:** None (out of MVP scope)

**Manual Testing Checklist:**
- [ ] Dashboard: Navigation header appears, user menu works, signout works
- [ ] Dreams page: Navigation header appears, active state shows "Dreams"
- [ ] Evolution page: Navigation header appears, active state shows "Evolution"
- [ ] Visualizations page: Navigation header appears
- [ ] User menu: Accessible from all pages, dropdown works, outside click closes
- [ ] Mobile: Hamburger menu opens/closes, nav links work
- [ ] Evolution report: Markdown renders correctly (headers, bold, lists)
- [ ] Visualization: Immersive styling, larger text, future-self emphasis
- [ ] Dream detail: Eligibility UI shows "X/4 reflections"
- [ ] Dream detail: "Generate" buttons appear when eligible
- [ ] npm audit: Shows 0 critical, 0 high vulnerabilities
- [ ] Console: Zero console.log during navigation flow
- [ ] TypeScript: `npx tsc --noEmit` passes
- [ ] Build: `npm run build` succeeds

### Potential Split Strategy

If navigation extraction proves too complex, consider splitting:

**Foundation (Builder-1A):**
- Create AppNavigation component
- Test in isolation
- Replace dashboard nav
- Test dashboard thoroughly

**Application (Builder-1B):**
- Apply navigation to all other pages
- Evolution/Visualization polish
- Security updates

**Estimated Split:** 8 hours (1A) + 6 hours (1B) = 14 hours total

**Recommendation:** Start as single builder. If navigation extraction takes >6 hours, consider split.

---

## Builder-2: Onboarding, Toast System & Landing Polish

### Scope

Builder-2 owns the first-time user experience and error handling:
1. Create 3-step onboarding flow
2. Database migration (onboarding_completed flag)
3. tRPC endpoint (users.completeOnboarding)
4. Update signup redirect logic
5. Extract toast notification system from dashboard
6. Replace all alert() calls with toast notifications
7. Minor landing page polish (onboarding CTA messaging)

**Why single builder:** Onboarding and toast system are isolated features with clear boundaries. Landing page polish is minor.

### Complexity Estimate

**MEDIUM-HIGH** - Onboarding wizard is moderately complex. Toast extraction is straightforward. Database migration is low risk.

Breakdown:
- Onboarding flow (page, migration, tRPC endpoint): MEDIUM-HIGH (7-9 hours)
- Toast system extraction: MEDIUM (2-3 hours)
- Landing page polish: LOW (1 hour)
- Total: **10-13 hours**

### Success Criteria

- [ ] 3-step onboarding page exists at /app/onboarding/page.tsx
- [ ] Step 1: "Welcome to Mirror of Dreams" - Consciousness companion explanation
- [ ] Step 2: "How Reflections Work" - 5-question flow, AI insights
- [ ] Step 3: "Your Free Tier" - 2 dreams, 4 reflections/month limits
- [ ] ProgressOrbs shows 1/3, 2/3, 3/3 correctly
- [ ] "Skip" button works and completes onboarding
- [ ] "Next" button advances to next step
- [ ] "Continue to Dashboard" button completes onboarding and redirects
- [ ] Database migration adds onboarding_completed column
- [ ] tRPC endpoint users.completeOnboarding works
- [ ] Signup redirects to /onboarding for new users (not admin/creator)
- [ ] Signin skips onboarding for returning users
- [ ] Admin users skip onboarding automatically (is_admin OR is_creator)
- [ ] Toast notification system extracted to ToastProvider + useToast hook
- [ ] All alert() calls replaced with toast.success() / toast.error()
- [ ] Toast auto-dismisses after 5 seconds, manual dismiss with X button
- [ ] Landing page tagline mentions "90-second guided setup" or similar
- [ ] TypeScript compiles with 0 errors
- [ ] Browser console has 0 errors during onboarding flow

### Files to Create

**New Files:**
1. `app/onboarding/page.tsx` - 3-step onboarding wizard (300-400 lines)
2. `supabase/migrations/20251113_add_onboarding_flag.sql` - Add onboarding_completed column (40 lines)
3. `contexts/ToastContext.tsx` - Toast provider and context (80-100 lines)
4. `components/shared/Toast.tsx` - Toast notification component (100-120 lines)
5. `hooks/useToast.ts` - Toast hook (30-40 lines)

**Modified Files:**
6. `server/trpc/routers/users.ts` - Add completeOnboarding endpoint (30 lines added)
7. `server/trpc/routers/auth.ts` - Include onboarding_completed in signup response (5 lines added)
8. `app/auth/signup/page.tsx` - Update redirect logic (check onboarding_completed flag)
9. `app/layout.tsx` - Wrap app with ToastProvider
10. `app/evolution/page.tsx` - Replace alert() with toast.error()
11. `app/visualizations/page.tsx` - Replace alert() with toast.error()
12. `app/dashboard/page.tsx` - Extract toast state to ToastContext (simplify component)
13. `components/portal/hooks/usePortalState.ts` - Update landing page tagline (2 lines changed)

### Dependencies

**Depends on:** Builder-1 (uses AppNavigation in onboarding - optional, can stub if needed)
**Blocks:** None

### Implementation Notes

**Onboarding Flow Steps:**
1. Write onboarding content FIRST (before building UI):
   - Step 1 content: "This is not a productivity tool. This is a consciousness companion. Your dreams hold the mirror to who you're becoming."
   - Step 2 content: List 5 questions, explain "After 4 reflections, your Mirror reveals patterns"
   - Step 3 content: Free tier limits (2 dreams, 4 reflections/month, 1 report, 1 viz)
2. Create `app/onboarding/page.tsx`:
   - Use useState for step counter (0, 1, 2)
   - Create steps array: `{ title, content, visual: emoji }`
   - Use ProgressOrbs component (already exists)
   - AnimatePresence with mode="wait" for smooth transitions
   - GlowButton for "Skip" (variant="ghost") and "Next" (variant="primary")
3. Create database migration:
   - Add onboarding_completed BOOLEAN DEFAULT FALSE
   - Add onboarding_completed_at TIMESTAMP WITH TIME ZONE
   - Update admin users: SET onboarding_completed = TRUE WHERE is_admin = TRUE
   - Create index on onboarding_completed column
4. Add tRPC endpoint:
   - server/trpc/routers/users.ts
   - completeOnboarding: protectedProcedure.mutation()
   - Update onboarding_completed = true, onboarding_completed_at = now()
   - Return success + updated user object
5. Update auth flow:
   - server/trpc/routers/auth.ts: Include onboarding_completed in signup response
   - app/auth/signup/page.tsx: Check onboarding_completed flag, redirect to /onboarding or /dashboard
6. Test onboarding flow:
   - Create new user → See onboarding
   - Complete 3 steps → Redirect to dashboard
   - Sign out → Sign in → Skip onboarding (go straight to dashboard)
   - Create admin user → Skip onboarding automatically

**Toast System Extraction Steps:**
1. Create ToastContext.tsx:
   - Use React Context + useState for toast messages
   - showToast function: adds toast to array
   - dismissToast function: removes toast from array
   - Auto-dismiss with setTimeout (5 seconds default)
2. Create Toast.tsx component:
   - Props: type, message, onDismiss
   - Icons: CheckCircle (success), XCircle (error), AlertTriangle (warning), Info (info)
   - Colors: green (success), red (error), yellow (warning), blue (info)
   - Framer Motion for entrance/exit animations
   - X button for manual dismiss
3. Create useToast hook:
   - Returns: { success, error, warning, info } functions
   - Each function calls context.showToast with appropriate type
4. Wrap app with ToastProvider:
   - app/layout.tsx: Add <ToastProvider> wrapper
5. Replace alert() calls:
   - Search codebase: `grep -r "alert(" app/ server/`
   - Replace with: `toast.error('message')` or `toast.success('message')`
   - Evolution page: Replace alert(error.message) with toast.error(error.message)
   - Visualizations page: Same replacement
   - Auth pages: Check for alert() usage, replace if exists
6. Extract dashboard toast:
   - Remove showToast state from dashboard
   - Use useToast hook instead
   - Simplify component (less state management)

**Landing Page Polish Steps:**
1. Update tagline:
   - File: components/portal/hooks/usePortalState.ts
   - Current: "Start completely free. Begin your journey."
   - New: "Start completely free. 90-second guided setup." (or similar)
2. Optional: Add onboarding preview (only if time permits)
   - Show 3-step preview on landing page
   - Visual: 3 dots or 3 cards showing steps
   - Low priority, can skip if time-constrained

**Gotchas:**
- Onboarding content must convey "consciousness companion" concept clearly
- Admin users should skip onboarding (is_admin OR is_creator check)
- Toast context must be at app root (layout.tsx) for all pages to access
- Replace alert() carefully - ensure error messages still make sense in toast format
- Test onboarding multiple times (complete flow, skip flow, admin skip)
- Database migration must be idempotent (use IF NOT EXISTS)

### Patterns to Follow

Reference patterns from `patterns.md`:
- **Pattern 7:** Onboarding Multi-Step Wizard (full code example provided)
- **Pattern 10:** Toast Notification System (ToastContext, Toast component, useToast hook)
- **Pattern 3:** Client-Side tRPC Call (for completeOnboarding mutation)
- **Pattern 4:** Supabase Migration (for onboarding_completed column)

### Testing Requirements

**Unit Tests:** None (out of MVP scope)

**Manual Testing Checklist:**
- [ ] Onboarding Step 1: Moon emoji appears, title correct, content correct
- [ ] Onboarding Step 2: Stars emoji, ProgressOrbs shows 2/3
- [ ] Onboarding Step 3: Seedling emoji, ProgressOrbs shows 3/3
- [ ] "Skip" button: Immediately redirects to dashboard, sets flag in DB
- [ ] "Next" button: Advances to next step, final step shows "Continue to Dashboard"
- [ ] "Continue to Dashboard": Redirects, sets onboarding_completed = true
- [ ] New user signup: Redirects to /onboarding
- [ ] Returning user signin: Skips onboarding, goes to /dashboard
- [ ] Admin user signup: Skips onboarding automatically
- [ ] Database check: onboarding_completed = true after completion
- [ ] Toast success: Green, CheckCircle icon, auto-dismisses in 5s
- [ ] Toast error: Red, XCircle icon, auto-dismisses in 5s
- [ ] Toast manual dismiss: X button works
- [ ] All pages: No alert() dialogs (all replaced with toasts)
- [ ] Landing page: Tagline mentions onboarding or guided setup
- [ ] TypeScript: `npx tsc --noEmit` passes
- [ ] Console: Zero errors during onboarding + toast usage

### Potential Split Strategy

If onboarding proves too complex, consider splitting:

**Foundation (Builder-2A):**
- Database migration
- tRPC endpoint
- Signup redirect logic
- Basic onboarding page (static, no animations)

**Polish (Builder-2B):**
- Onboarding animations (AnimatePresence, Framer Motion)
- Toast system extraction
- Landing page polish

**Estimated Split:** 6 hours (2A) + 5 hours (2B) = 11 hours total

**Recommendation:** Start as single builder. Only split if onboarding content writing takes excessive time (>2 hours).

---

## Builder Execution Order

### Parallel Group 1 (Day 1, Hours 0-8)

**Builder-1:**
- Create AppNavigation component (extract from dashboard)
- Test AppNavigation in isolation
- Replace dashboard inline nav with AppNavigation
- Test dashboard thoroughly

**Builder-2:**
- Write onboarding content (all 3 steps)
- Create database migration
- Add tRPC endpoint
- Create basic onboarding page (static, no animations yet)

### Parallel Group 2 (Day 1, Hours 8-12)

**Builder-1:**
- Apply AppNavigation to Dreams, Evolution, Visualizations pages
- Test navigation on all pages
- Install react-markdown + remark-gfm

**Builder-2:**
- Add animations to onboarding page (AnimatePresence, Framer Motion)
- Update signup redirect logic
- Test onboarding flow end-to-end

### Parallel Group 3 (Day 2, Hours 12-18)

**Builder-1:**
- Polish Evolution/Visualization markdown rendering
- Add eligibility UI to dream detail page
- Create EmptyState component

**Builder-2:**
- Create ToastContext + Toast component
- Create useToast hook
- Wrap app with ToastProvider

### Parallel Group 4 (Day 2, Hours 18-24)

**Builder-1:**
- npm audit fix
- Console.log cleanup
- TypeScript compilation check
- Final testing

**Builder-2:**
- Replace all alert() with toast
- Landing page tagline update
- Final testing

---

## Integration Notes

### Merge Strategy

1. **Builder-1 merges first** (hours 24-25):
   - AppNavigation is foundation for Builder-2's onboarding
   - Evolution/Visualization polish is independent
   - Security updates are critical

2. **Builder-2 merges second** (hours 25-26):
   - Onboarding uses AppNavigation (if Builder-1 complete)
   - Toast system is independent
   - Landing page polish is independent

3. **Conflict Resolution** (if needed):
   - Both builders touch app/dashboard/page.tsx:
     - Builder-1: Replaces inline nav with AppNavigation
     - Builder-2: Extracts toast state to ToastContext
     - Resolution: Merge Builder-1 changes first, then Builder-2 applies toast extraction to updated file
   - Both builders touch app/layout.tsx:
     - Builder-1: No changes (AppNavigation not at layout level)
     - Builder-2: Adds ToastProvider wrapper
     - No conflict expected

### Shared Dependencies

**File:** `components/ui/glass/ProgressOrbs.tsx`
- Builder-1: Does NOT modify (uses as-is)
- Builder-2: Uses for onboarding step indicator
- No conflict

**File:** `app/dashboard/page.tsx`
- Builder-1: Replaces inline nav (lines 184-320) with `<AppNavigation currentPage="dashboard" onRefresh={handleRefreshData} />`
- Builder-2: Extracts toast state (lines 51-56) to ToastContext, uses `useToast` hook
- Conflict Potential: MEDIUM
- Resolution: Builder-1 merges first (navigation), Builder-2 applies toast extraction to updated file

**File:** `server/trpc/routers/users.ts`
- Builder-1: Does NOT modify
- Builder-2: Adds completeOnboarding endpoint
- No conflict

### Integration Testing Checklist

After both builders merge:

- [ ] Sarah's Journey Day 0: Landing → Signup → Onboarding → Dashboard works
- [ ] Navigation appears on all pages (dashboard, dreams, evolution, visualizations)
- [ ] User menu accessible from all pages, signout works
- [ ] Toast notifications work across all pages (no alert() dialogs)
- [ ] Evolution/Visualization markdown renders correctly
- [ ] Eligibility UI shows on dream detail page
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] npm audit clean: 0 critical, 0 high vulnerabilities
- [ ] Console errors: 0 during complete user flow

---

## Timeline Summary

| Phase | Time | Activities |
|-------|------|------------|
| **Day 1, Morning (0-4 hours)** | 4h | Builder-1: AppNavigation extraction<br>Builder-2: Onboarding content + migration |
| **Day 1, Afternoon (4-8 hours)** | 4h | Builder-1: Dashboard nav replacement<br>Builder-2: Basic onboarding page |
| **Day 1, Evening (8-12 hours)** | 4h | Builder-1: Apply nav to other pages<br>Builder-2: Onboarding animations |
| **Day 2, Morning (12-16 hours)** | 4h | Builder-1: Evolution polish + eligibility<br>Builder-2: Toast system creation |
| **Day 2, Afternoon (16-20 hours)** | 4h | Builder-1: EmptyState + security<br>Builder-2: Toast extraction + alert() replacement |
| **Day 2, Evening (20-24 hours)** | 4h | Builder-1: Final testing<br>Builder-2: Landing polish + final testing |
| **Integration (24-26 hours)** | 2h | Merge both builders, resolve conflicts, test combined features |
| **Validation (26-29 hours)** | 3h | Sarah's Journey end-to-end, TypeScript check, build test |
| **Deployment (29-30 hours)** | 1h | Deploy to Vercel, production smoke test |

**Total Estimated Time:** 30 hours (2 days, 2 builders)

---

## Final Validation Checklist

Before marking Iteration 21 COMPLETE, verify:

### Technical Criteria
- [ ] TypeScript compiles: `npx tsc --noEmit` (0 errors)
- [ ] Production build succeeds: `npm run build` (0 errors)
- [ ] npm audit clean: 0 critical, 0 high vulnerabilities
- [ ] Console.log cleanup: `grep -r "console.log" app/ server/` (0 results in production code)
- [ ] All environment variables documented in .env.example

### User Experience Criteria
- [ ] Sarah's Journey Day 0-8 works perfectly (manual test)
- [ ] Onboarding explains product clearly in 90 seconds
- [ ] Navigation consistent across all pages
- [ ] Loading states use CosmicLoader everywhere
- [ ] Error messages use toast notifications (no alert() dialogs)
- [ ] Evolution reports display with markdown formatting
- [ ] Visualizations display with immersive styling
- [ ] Admin user (ahiya.butman@gmail.com) can access all features

### The Magic is Real
- [ ] First-time user understands "consciousness companion" concept after onboarding
- [ ] User completes 4 reflections and sees "Evolution Report Available" notification
- [ ] Evolution report feels personal and insightful (not generic)
- [ ] Visualization evokes emotional response (immersive, future-self perspective)
- [ ] Navigation feels natural (user never feels lost)
- [ ] Every transition is smooth (no jarring loading states or errors)

---

## Post-Iteration 21 Next Steps

**This is the FINAL iteration for MVP.** After completion:

1. **Deploy to Production** (Vercel)
2. **Create Production Admin User** (scripts/create-admin-user.js)
3. **Monitor Production** (watch for errors, user signups)
4. **Celebrate MVP Complete!** The essence is working and magical.

**Post-MVP Backlog** (NOT in plan-3):
- Stripe payment integration
- Email notifications
- Cross-dream analysis
- Multiple reflection tones
- Social features
- Mobile app
- Advanced analytics

---

**Document Status:** COMPLETE
**Iteration:** 21 (Plan plan-3, FINAL)
**Created:** 2025-11-13
**Ready for:** Builder execution
