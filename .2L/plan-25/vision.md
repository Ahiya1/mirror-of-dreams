# Project Vision: Mobile Experience & Dashboard Bug Fixes

**Created:** 2025-12-15T00:30:00Z
**Plan:** plan-25

---

## Problem Statement

The Mirror of Dreams mobile experience has multiple UX issues that degrade the user experience on phones and tablets. Additionally, a critical bug on the dashboard displays incorrect reflection titles.

**Current pain points:**
- Dashboard reflection cards show the entire first question response as preview text instead of the AI reflection summary
- Visualizations page content is hidden behind the bottom navigation on mobile
- "Create a Dream" button is hidden/clipped during the reflection flow on mobile
- Various mobile layout inconsistencies causing suboptimal UX

---

## Target Users

**Primary user:** Mobile users accessing Mirror of Dreams on phones (iOS/Android)
- Using devices with bottom safe area (notched iPhones, Android gesture navigation)
- Screen widths 320px-480px (primary mobile range)
- Touch-first interaction patterns

**Secondary users:** Tablet users (768px-1024px breakpoint)
- Navigation links disappear with no mobile menu alternative

---

## Core Value Proposition

Fix the broken mobile experience to make Mirror of Dreams feel native and polished on all devices.

**Key benefits:**
1. Users can see all content without it being hidden by navigation
2. Users can create dreams during the reflection flow without UI obstruction
3. Dashboard displays meaningful preview text that helps users identify reflections
4. Consistent, professional mobile experience across all pages

---

## Feature Breakdown

### Must-Have (MVP)

#### 1. **Fix Dashboard Reflection Preview Text (CRITICAL)**
   - **Description:** Change the reflection preview text to show AI response summary instead of the first question response
   - **User story:** As a user, I want to see a meaningful preview of my reflection so that I can identify which reflection to read
   - **Root Cause:** `ReflectionItem.tsx:88` - `getReflectionPreview()` fallback order uses `refl.dream` (first question text) before `content`
   - **File:** `/components/dashboard/shared/ReflectionItem.tsx`
   - **Line:** 88
   - **Current problematic code:**
     ```typescript
     const text = refl.aiResponse || refl.ai_response || refl.dream || refl.content || refl.preview;
     //                                                   ↑↑↑↑↑↑↑↑↑
     //                        PROBLEM: Falls back to the entire dream question response!
     ```
   - **Fix:** Remove `refl.dream` from fallback chain or reorder to: `aiResponse → ai_response → content → preview`
   - **Acceptance criteria:**
     - [ ] Reflection preview shows AI response snippet (first 120 chars)
     - [ ] Never shows the raw first question text as preview
     - [ ] Graceful fallback to "Your reflection content..." if no AI response

#### 2. **Fix Visualizations Page Bottom Padding (Mobile)**
   - **Description:** Content at bottom of visualizations page is hidden behind bottom navigation
   - **User story:** As a mobile user, I want to see all visualizations content without it being cut off
   - **Root Cause:** Page uses `pb-20` (80px) but bottom nav is 64px + safe-area-inset (up to 108px on notched devices)
   - **File:** `/app/visualizations/page.tsx`
   - **Line:** 132
   - **Current problematic code:**
     ```tsx
     <div className="... pb-20 ... md:pb-8">
     ```
   - **Correct pattern from clarify page:**
     ```tsx
     <div className="... pb-[calc(80px+env(safe-area-inset-bottom))] ... md:pb-6">
     ```
   - **Acceptance criteria:**
     - [ ] All visualizations content visible above bottom navigation
     - [ ] Works on notched devices (iPhone X+, Android with gesture nav)
     - [ ] Desktop layout unchanged (md:pb-8 or similar)

#### 3. **Fix Hidden "Create Dream" Button in Mobile Reflection Flow**
   - **Description:** During reflection on mobile, the "Create Your First Dream" button is clipped/hidden
   - **User story:** As a mobile user, I want to create a new dream during reflection so that I can track what I'm reflecting on
   - **Root Cause:** `MobileReflectionFlow.tsx` uses `fixed inset-0 z-50` with `overflow-hidden` on step content, clipping the button
   - **Files:**
     - `/components/reflection/mobile/MobileReflectionFlow.tsx` (lines 173, 188, 201)
     - `/components/reflection/mobile/views/MobileDreamSelectionView.tsx` (lines 48, 92)
   - **Issues:**
     1. Parent container has `overflow-hidden` (line 188)
     2. Motion div with `absolute inset-0` clips content (line 201)
     3. Button inside scrollable area without adequate bottom padding (line 92)
   - **Acceptance criteria:**
     - [ ] "Create Your First Dream" button always visible and tappable
     - [ ] Button not clipped by navigation or parent containers
     - [ ] Scroll behavior allows reaching all content including button

#### 4. **Apply Consistent Bottom Padding Across All Pages**
   - **Description:** Apply the correct bottom padding pattern to all pages with bottom navigation
   - **User story:** As a mobile user, I want consistent scrolling behavior on all pages
   - **Affected Pages:**
     - `/app/visualizations/page.tsx:132`
     - `/app/dreams/page.tsx:108`
     - `/app/evolution/page.tsx:115`
     - `/app/clarify/page.tsx:137`
     - `/app/dashboard/page.tsx`
     - `/app/reflections/page.tsx`
   - **Pattern to apply:**
     ```tsx
     pb-[calc(80px+env(safe-area-inset-bottom))] sm:px-8 md:pb-6
     ```
   - **Acceptance criteria:**
     - [ ] All pages have consistent bottom padding on mobile
     - [ ] No content hidden behind bottom navigation on any page
     - [ ] Pattern matches `/app/clarify/[sessionId]/page.tsx:400` (reference implementation)

### Should-Have (Post-MVP)

1. **Create `pb-nav` utility class** - Add CSS utility to `/styles/globals.css` for consistent bottom nav padding
   - Similar to existing `pt-nav` utility (lines 803-807)
   - Would simplify maintenance across all pages

2. **Fix hardcoded min-heights in dashboard grid** - Causes excessive white space on small phones
   - `/components/dashboard/shared/DashboardGrid.module.css` lines 6, 12
   - `/styles/dashboard.css` lines 517, 534

3. **Increase bottom nav label font size** - Current `text-[10px]` is hard to read
   - `/components/navigation/BottomNavigation.tsx` line 161
   - Recommend `text-[12px]`

4. **Add mobile menu for tablet breakpoint** - Navigation links disappear at 1024px with no alternative
   - `/styles/dashboard.css` lines 1678-1680

### Could-Have (Future)

1. **CSS variables usage** - Use existing `--bottom-nav-total` variable (defined but unused)
   - `/styles/variables.css` lines 329-330

2. **Fix tier description hardcoded width** - `max-width: 280px` cramped on medium phones
   - `/styles/dashboard.css` line 1241

3. **Landscape orientation support** - Mobile modals in landscape mode

---

## User Flows

### Flow 1: Viewing Dashboard Reflections

**Steps:**
1. User opens dashboard on mobile
2. User sees "Recent Reflections" card
3. Each reflection shows: title (dream name), preview (AI response snippet), tone badge
4. User taps reflection to view full content

**Current bug:** Preview shows "I had a dream about..." (question text) instead of AI reflection

**Edge cases:**
- Reflection without AI response: Show "Your reflection content..."
- Reflection without linked dream: Use reflection.title or "Reflection" fallback

### Flow 2: Creating Dream During Reflection (Mobile)

**Steps:**
1. User starts reflection on mobile
2. MobileReflectionFlow renders full-screen
3. User sees dream selection step with list of dreams
4. If no dreams, user sees "Create Your First Dream" button
5. User taps button to navigate to dreams page

**Current bug:** Button is clipped/hidden by overflow-hidden containers

**Edge cases:**
- User with many dreams: Scrollable list should show all dreams + create button
- User with no dreams: Create button must be prominently visible

### Flow 3: Viewing Visualizations on Mobile

**Steps:**
1. User taps "Visualizations" in bottom navigation
2. Page loads with cosmic visualization content
3. User scrolls to see all content
4. Bottom navigation remains fixed at bottom

**Current bug:** Last ~28px of content hidden behind bottom navigation

---

## Data Model Overview

**Key entities relevant to bug fixes:**

1. **Reflection**
   - Fields: `id`, `dream` (question text - NOT the title!), `aiResponse` (actual reflection), `dreams` (joined)
   - Relationships: Belongs to Dream via `dream_id`
   - **Critical:** `reflection.dream` is the QUESTION TEXT, `reflection.dreams?.title` is the DREAM NAME

2. **Dream**
   - Fields: `id`, `title` (display name), `description`
   - Relationships: Has many Reflections

---

## Technical Requirements

**Must support:**
- iOS Safari (iPhone 12+, iPhone X with notch)
- Android Chrome (Pixel, Samsung with gesture navigation)
- Screen widths: 320px - 480px (mobile), 768px - 1024px (tablet)
- Safe area insets via `env(safe-area-inset-bottom)`

**Constraints:**
- Must not break desktop layouts
- Must maintain existing animation/transition behavior
- Must preserve Tailwind CSS conventions

**Preferences:**
- Use existing CSS variable `--bottom-nav-total` where possible
- Follow pattern established in `/app/clarify/[sessionId]/page.tsx:400`
- Keep changes minimal and focused

---

## Success Criteria

**The MVP is successful when:**

1. **Dashboard Preview Fix**
   - Metric: Visual inspection of reflection cards
   - Target: All reflection previews show AI response text, never question text

2. **Bottom Padding Fix**
   - Metric: Visual inspection on iPhone 14 Pro (notched) and standard Android
   - Target: Zero content hidden behind bottom navigation on any page

3. **Create Dream Button Fix**
   - Metric: Manual testing of reflection flow on mobile
   - Target: Button always visible and tappable when no dreams exist

4. **Regression Prevention**
   - Metric: Existing tests pass, desktop layout unchanged
   - Target: Zero visual regressions on desktop

---

## Out of Scope

**Explicitly not included in MVP:**
- Adding new mobile menu component for tablet breakpoint
- Refactoring dashboard grid min-heights
- Increasing bottom nav font size
- Creating new CSS utility classes
- Performance optimizations
- New features or functionality

**Why:** Focus on critical bug fixes only. Polish items can be addressed in future plans.

---

## Assumptions

1. The existing `pt-nav` pattern for top navigation works correctly
2. `env(safe-area-inset-bottom)` is supported in target browsers
3. The `/app/clarify/[sessionId]/page.tsx:400` pattern is the correct reference implementation
4. Changes to individual page padding won't conflict with shared layout components

---

## Open Questions

1. Should we create a shared `pb-nav` utility class now, or just apply inline fixes to each page?
2. Is there a central layout component that could apply bottom padding globally?
3. Should the "Create Dream" button in mobile reflection use a different pattern (e.g., sticky button)?

---

## Files to Modify

| File | Issue | Priority |
|------|-------|----------|
| `/components/dashboard/shared/ReflectionItem.tsx:88` | Preview shows question text | CRITICAL |
| `/app/visualizations/page.tsx:132` | Bottom padding insufficient | HIGH |
| `/components/reflection/mobile/MobileReflectionFlow.tsx:188` | overflow-hidden clips button | HIGH |
| `/components/reflection/mobile/views/MobileDreamSelectionView.tsx:48,92` | Button not visible | HIGH |
| `/app/dreams/page.tsx:108` | Bottom padding insufficient | MEDIUM |
| `/app/evolution/page.tsx:115` | Bottom padding insufficient | MEDIUM |
| `/app/clarify/page.tsx:137` | Bottom padding insufficient | MEDIUM |
| `/app/dashboard/page.tsx` | Bottom padding check | MEDIUM |
| `/app/reflections/page.tsx` | Bottom padding check | MEDIUM |

---

## Next Steps

- [ ] Review and refine this vision
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
