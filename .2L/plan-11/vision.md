# Project Vision: Mobile-First Experience Transformation

**Created:** 2025-12-02
**Plan:** plan-11

---

## Problem Statement

Mirror of Dreams currently has a "responsive desktop" experience - it technically works on mobile, but it doesn't feel like it was designed for mobile. Given that **mobile is the primary use case** (similar to ChatGPT), the current experience is unacceptable. Users lying in bed capturing a dream, sitting on the couch doing a reflection, or reviewing their journey on the train deserve an experience that feels native to their device.

**Current pain points:**
- Navigation uses desktop patterns (hamburger menu, top bar) instead of mobile-native patterns
- Dashboard is a vertical list of 6 desktop cards - endless scroll with no prioritization
- Reflection experience is cramped - 4 long-form questions stacked vertically with wasted space
- No touch-optimized interactions (swipe gestures, haptics, bottom sheets)
- Desktop hover effects don't translate - cards feel static on mobile
- Forms don't account for keyboard appearance
- No mobile-native UX patterns (pull-to-refresh, swipe navigation, bottom tabs)

---

## Target Users

**Primary user:** Mobile-first dreamer
- Uses the app primarily on their phone (70%+ of sessions)
- Key moments: Morning in bed (dream capture), quiet evenings (reflection), commute (review)
- Expects modern mobile UX similar to apps like ChatGPT, Headspace, Day One
- Values intimate, focused experiences over feature density

**Secondary users:**
- Desktop power users (planning, deep reflection sessions)
- Tablet users (hybrid experience)

---

## Core Value Proposition

**Transform Mirror of Dreams into a mobile experience that feels thoughtfully curated, not adapted.**

Users should feel "completely at home" on mobile - every interaction should feel intentional and native to a touch device.

**Key benefits:**
1. **Native feel** - Bottom navigation, swipe gestures, and touch-optimized interactions
2. **Focused experience** - Prioritized content that surfaces what matters on small screens
3. **Intimate space** - Full-screen experiences that feel immersive and personal
4. **Quick capture** - Optimized flows for capturing dreams and thoughts on the go

---

## Feature Breakdown

### Must-Have (MVP)

#### 1. **Bottom Navigation Bar**
- Description: Replace hamburger menu with fixed bottom navigation (mobile-native pattern)
- User story: As a mobile user, I want to tap bottom tabs to navigate so that primary actions are always within thumb reach
- Acceptance criteria:
  - [ ] Fixed bottom navigation with 4-5 primary destinations (Home, Dreams, Reflect, Evolution, Profile)
  - [ ] Active state indication with subtle animation
  - [ ] Hidden on scroll down, revealed on scroll up (content-first)
  - [ ] Safe area padding for notched devices
  - [ ] Haptic feedback on tab tap (where supported)
  - [ ] Desktop: Hide bottom nav, keep top navigation

#### 2. **Mobile-Optimized Dashboard**
- Description: Reimagine dashboard for mobile consumption patterns
- User story: As a mobile user, I want a focused dashboard that surfaces what's most important without endless scrolling
- Acceptance criteria:
  - [ ] Hero section: Compact greeting + prominent "Reflect Now" CTA
  - [ ] Quick stats strip: Horizontal scroll of key metrics (reflections this month, dreams, streak)
  - [ ] Primary action cards: Dreams + Reflections only (most important)
  - [ ] Secondary content: Collapsible or accessible via horizontal scroll/tabs
  - [ ] Remove or relocate: Evolution, Visualization, Subscription cards (move to dedicated pages/profile)
  - [ ] Pull-to-refresh functionality
  - [ ] Skeleton loading states for perceived performance

#### 3. **Full-Screen Reflection Experience**
- Description: Transform reflection from cramped form to immersive full-screen flow
- User story: As a user doing a reflection on my phone, I want a focused, step-by-step experience that doesn't feel cramped
- Acceptance criteria:
  - [ ] Full-screen takeover (no visible navigation during reflection)
  - [ ] One question per screen with swipe/tap to advance
  - [ ] Large, comfortable textarea that accounts for keyboard
  - [ ] Progress indicator (dots or subtle bar at top)
  - [ ] Swipe back to previous question
  - [ ] Elegant transitions between questions (slide, fade)
  - [ ] Tone selection as dedicated step (not crammed alongside questions)
  - [ ] "Gazing" loading state: Immersive full-screen animation
  - [ ] Exit confirmation if user has unsaved input

#### 4. **Dream Selection Bottom Sheet**
- Description: Replace dropdown/list with native bottom sheet for dream selection
- User story: As a user starting a reflection, I want to quickly select a dream with a thumb-friendly interface
- Acceptance criteria:
  - [ ] Bottom sheet slides up with list of dreams
  - [ ] Large touch targets (60px+ height per item)
  - [ ] Swipe down to dismiss
  - [ ] Quick "Create Dream" option at bottom
  - [ ] Currently selected dream highlighted

#### 5. **Touch-Optimized Cards & Interactions**
- Description: Replace desktop hover effects with touch-native interactions
- User story: As a mobile user, I want cards and buttons to respond to my taps with satisfying feedback
- Acceptance criteria:
  - [ ] Tap feedback: Scale down slightly on touch, return on release
  - [ ] Replace hover glow with active/pressed states
  - [ ] Swipe actions on list items where appropriate (dreams, reflections)
  - [ ] Larger touch targets (minimum 48px, prefer 56px)
  - [ ] Remove :hover-only effects, ensure all have :active equivalents

#### 6. **Mobile Form Improvements**
- Description: Optimize all forms for mobile input
- User story: As a user filling forms on mobile, I want inputs that don't fight with my keyboard
- Acceptance criteria:
  - [ ] Auto-scroll input into view when keyboard appears
  - [ ] Sticky submit buttons above keyboard when appropriate
  - [ ] Larger input fields (56px height minimum)
  - [ ] Optimized input types (email, tel, etc.)
  - [ ] Clear/dismiss buttons within reach
  - [ ] Form progress saved to prevent data loss

#### 7. **Mobile-Optimized Modals**
- Description: Transform modals to feel native on mobile
- User story: As a mobile user, I want modals that don't feel like desktop popups
- Acceptance criteria:
  - [ ] Full-screen modals on mobile (below 768px)
  - [ ] Slide up animation from bottom
  - [ ] Swipe down to dismiss
  - [ ] Close button in consistent top-right position
  - [ ] Content scrollable within modal

### Should-Have (Post-MVP)

1. **Haptic Feedback System** - Subtle vibrations on key interactions (button taps, transitions, success states)
2. **Gesture Navigation** - Swipe from edge to go back, swipe between dreams
3. **Quick Dream Capture** - Floating action button for rapid dream entry
4. **Offline Mode** - Cache recent reflections for reading offline
5. **Dark Mode Refinement** - Ensure all elements are optimized for OLED screens (true blacks)
6. **Pull-to-Refresh Everywhere** - Consistent refresh pattern across all list views
7. **Widget Consideration** - Design for potential iOS/Android widget display

### Could-Have (Future)

1. **Voice Input** - Dictate reflections instead of typing
2. **Notification Integration** - Morning dream reminder, reflection prompts
3. **Watch App Preview** - Quick dream capture from wrist
4. **Biometric Lock** - FaceID/TouchID for privacy
5. **Share Extensions** - Save content from other apps as dream inspiration

---

## User Flows

### Flow 1: Morning Dream Capture (Primary Mobile Flow)

**Context:** User wakes up, grabs phone, wants to capture dream before it fades

**Steps:**
1. User opens app (already signed in)
2. App shows dashboard with prominent "Reflect Now" CTA
3. User taps "Reflect Now"
4. Bottom sheet slides up with dream selection
5. User taps existing dream OR creates new dream inline
6. Full-screen reflection begins - Question 1 appears
7. User types response, swipes to Question 2
8. (Repeat for Questions 3, 4)
9. Tone selection appears (full screen)
10. User taps "Gaze into Mirror"
11. Full-screen loading animation with encouraging text
12. AI response appears - user reads
13. User taps "Done" - returns to dashboard

**Mobile optimizations:**
- Dream selection uses bottom sheet (thumb-friendly)
- Questions are one-per-screen (no cramped forms)
- Keyboard handling is seamless
- Loading state is immersive (not jarring)
- Return to dashboard is smooth

**Edge cases:**
- No internet: Show cached dreams, queue reflection for later
- App backgrounded during reflection: Save progress, resume on return
- Keyboard covers input: Auto-scroll to keep cursor visible

**Error handling:**
- API failure: Toast notification with retry option
- Session expired: Silent re-auth if possible, otherwise gentle sign-in prompt

### Flow 2: Quick Browse Reflections

**Context:** User on commute, wants to re-read past reflections

**Steps:**
1. User taps "Home" in bottom nav (already there) or navigates from elsewhere
2. Dashboard shows recent reflections card
3. User taps to expand or navigates to full list
4. Scrollable list of reflections with pull-to-refresh
5. User taps a reflection
6. Full-screen reflection view with AI response
7. User swipes right to go back, or taps back button

**Mobile optimizations:**
- Reflections list is swipeable
- Each reflection preview is scannable (title, date, tone badge)
- Full reflection view uses all screen space
- Swipe-to-go-back works throughout

### Flow 3: Creating a New Dream

**Context:** User has new life goal, wants to add it

**Steps:**
1. User taps "Dreams" in bottom nav
2. Dreams list appears with "+" floating action button
3. User taps "+"
4. Full-screen dream creation form slides up
5. User fills: Title (required), Description, Category (picker), Target Date (date picker)
6. User taps "Create Dream"
7. Success toast, new dream appears in list
8. User can immediately tap to start reflection

**Mobile optimizations:**
- Floating action button for quick access
- Full-screen form (not cramped modal)
- Native pickers for category and date
- Keyboard-aware input positioning

---

## Data Model Overview

No changes to existing data model required. This is purely a frontend/UX transformation.

**Affected components:**
- Navigation system (add bottom nav, modify top nav)
- Dashboard page (reorganize cards, add mobile view)
- Reflection experience (step-by-step flow)
- All modals (full-screen on mobile)
- Card components (touch interactions)
- Form components (keyboard handling)

---

## Technical Requirements

**Must support:**
- iOS Safari (primary mobile browser)
- Android Chrome (secondary mobile browser)
- Progressive Web App manifest (for home screen installation)
- Safe area handling (notched devices)
- Touch events (tap, swipe, long-press)
- Reduced motion preferences (accessibility)

**Constraints:**
- Must maintain desktop experience quality (don't break what works)
- Must use existing design system (cosmic glass theme)
- Changes should be CSS/component-level, not data model changes
- Performance: No additional JS bundle weight > 15KB gzipped

**Preferences:**
- Use Framer Motion for animations (already in use)
- Mobile-first CSS (min-width breakpoints)
- Component composition over prop overload
- Test on real devices, not just Chrome DevTools

---

## Success Criteria

**The MVP is successful when:**

1. **Mobile feels native**
   - Metric: User testing feedback
   - Target: 8/10+ rating for "feels like it was designed for mobile"

2. **Core flows are thumb-friendly**
   - Metric: All primary actions reachable without stretching
   - Target: 100% of bottom nav items and 90% of primary CTAs in thumb zone

3. **Reflection completion rate maintained or improved**
   - Metric: % of started reflections that are completed
   - Target: >= current rate (measure before/after)

4. **Load time and performance maintained**
   - Metric: Lighthouse mobile score
   - Target: >= 85 performance score

5. **Desktop experience unchanged**
   - Metric: Visual regression testing
   - Target: 0 unintended desktop regressions

---

## Out of Scope

**Explicitly not included in MVP:**
- Native iOS/Android app (this is PWA optimization)
- Voice input for reflections
- Offline-first architecture (basic caching only)
- Push notifications
- Biometric authentication
- Watch app or widgets

**Why:** Focus on making the web experience feel native first. Native app considerations come after web is perfected.

---

## Assumptions

1. Users have modern smartphones (iOS 14+, Android 10+)
2. Users have reliable internet (offline is edge case, not primary)
3. Touch interactions can be added without breaking desktop experience
4. Framer Motion can handle all animation requirements
5. Bottom navigation pattern is acceptable for this app type

---

## Open Questions

1. Should the bottom nav include a "quick add" center button (common pattern)?
2. How to handle tablet (landscape) - bottom nav or side nav?
3. Should reflection AI response be scrollable or paginated on mobile?
4. Do we need a dedicated "Home" tab or is Dashboard sufficient?

---

## Implementation Strategy

### Phase 1: Foundation (Bottom Nav + Dashboard)
- Add bottom navigation component
- Mobile-optimize dashboard layout
- Hide/show nav appropriately per viewport

### Phase 2: Reflection Flow
- Full-screen step-by-step reflection
- Dream selection bottom sheet
- Keyboard handling improvements

### Phase 3: Polish
- Touch interactions throughout
- Modal full-screen treatment
- Form improvements
- Gesture support (swipe back, etc.)

---

## Visual Direction

**Keep:**
- Cosmic glass aesthetic
- Purple/amethyst color palette
- Breathing animations (subtle)
- Gradient text treatments

**Adapt:**
- Cards: Less padding, more content density
- Navigation: Bottom-fixed, pill-shaped active indicator
- Modals: Full-screen slide-up sheets
- Buttons: Larger, more pronounced tap states
- Spacing: Tighter on mobile, use fluid spacing aggressively

**Add:**
- Bottom sheet component
- Step indicator component (dots)
- Floating action button
- Swipe gesture handlers
- Safe area awareness

---

## Next Steps

- [ ] Review and refine this vision
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
