# Project Vision: Mirror of Dreams - Design Overhaul (The Polishing)

**Created:** 2025-11-27
**Plan:** plan-5
**Current State:** 4.5/10 design quality
**Target State:** 9/10 polished, cohesive branded product

---

## Problem Statement

Mirror of Dreams is functionally solid but visually clunky and lacks design cohesion. The app feels like a collection of working features rather than a unified, branded product. Users experience friction and confusion due to inconsistent visual language, poor readability, and missing feedback states.

**Current pain points:**
- **Authentication pages look like 2 different products** - Signin uses styled-jsx, Signup uses Tailwind utilities, completely different styling approaches
- **Landing page is disconnected and ugly** - Uses separate portal.css, doesn't match app aesthetic, minimal content, feels cheap
- **No brand cohesion across entry points** - First 3 pages a user sees (landing, signin, signup) have zero consistency
- No loading feedback during reflection creation (users don't know what's happening)
- Dashboard feels empty despite having content (weak visual hierarchy)
- Fixed navigation overlaps page content (layout issue causing content to be hidden)
- Reflection text barely visible (contrast/readability issue)
- Inconsistent spacing, typography, and component styling across pages
- No micro-interactions or delightful feedback moments
- Empty states lack personality and guidance
- Glass morphism feels generic rather than branded
- No smooth page transitions (jarring user experience)
- Design system exists but isn't cohesively applied

---

## Target Users

**Primary user:** Existing Mirror of Dreams users experiencing friction
- Need clear visual feedback during all interactions
- Expect consistent, professional UI across all pages
- Want to feel immersed in the "Mirror of Dreams" brand experience
- Require readable text and accessible design

**Secondary users:** New users evaluating the product
- First impressions matter - design quality signals product quality
- Need intuitive visual hierarchy to understand the app structure
- Expect modern, polished SaaS aesthetics

---

## Core Value Proposition

Transform Mirror of Dreams from a functional tool into a delightful, cohesive branded experience where every interaction feels intentional, polished, and aligned with the cosmic mirror aesthetic.

**Key benefits:**
1. **Confidence through feedback** - Users always know what's happening (loading, success, errors)
2. **Visual clarity** - Strong hierarchy, readable text, consistent spacing make the app easy to use
3. **Brand immersion** - Cohesive cosmic aesthetic creates emotional connection and trust
4. **Professional polish** - Design quality matches the sophistication of the AI-powered features

---

## Feature Breakdown

### Must-Have (MVP Design Overhaul)

#### 1. **Landing Page Transformation**
   - **Description:** Redesign the landing page (app/page.tsx) to be a cohesive, branded hero page that matches the cosmic aesthetic
   - **User story:** As a potential user visiting Mirror of Dreams, I want to see a beautiful, professional landing page so that I trust the product and understand what it offers
   - **Acceptance criteria:**
     - [ ] Remove portal.css and MirrorShards background (replace with CosmicBackground from app)
     - [ ] Redesign hero section with:
       - Compelling headline: "Your Dreams, Reflected" or similar
       - Subheadline explaining the value proposition
       - Large primary CTA: "Start Reflecting" (using GlowButton)
       - Secondary CTA: "Learn More"
     - [ ] Add 3-4 feature highlight sections (glass cards):
       - "AI-Powered Reflections" - Explain the mirror concept
       - "Track Your Dreams" - Show dream management
       - "Visualize Your Evolution" - Show analytics
       - "Sacred Space" - Emphasize the premium experience
     - [ ] Use same navigation component as authenticated pages (AppNavigation or similar)
     - [ ] Add social proof section (testimonials or stats if available)
     - [ ] Responsive design (mobile-first approach)
     - [ ] Smooth scroll-triggered animations (Framer Motion)
     - [ ] Footer with links (About, Privacy, Terms, Contact)
     - [ ] Consistent typography and spacing with rest of app

#### 2. **Unified Authentication Pages**
   - **Description:** Rebuild signup page to match signin page's polished aesthetic, ensure both use the same component library
   - **User story:** As a new user, I want the signup experience to feel as polished as signin so that I trust the brand and feel excited to create an account
   - **Acceptance criteria:**
     - [ ] Signup page uses same styled-jsx approach as signin (or both refactored to use GlassCard/GlassInput)
     - [ ] Both pages use identical:
       - Background (CosmicBackground component)
       - Card styling (glass morphism, backdrop blur, borders)
       - Input fields (same styling, focus states, animations)
       - Button styling (same cosmic-button or GlowButton)
       - Loading states (same spinner)
       - Error/success messages (same styling)
     - [ ] Both pages have same layout structure:
       - Centered auth card (max-width 480px)
       - Logo/brand at top
       - Form in middle
       - Switch link at bottom ("New user? Sign up" / "Have account? Sign in")
     - [ ] Password toggle uses same PasswordToggle component on both pages
     - [ ] Form validation styling consistent (red borders, error text)
     - [ ] Smooth page transitions when switching between signin/signup
     - [ ] Accessible (focus states, ARIA labels, keyboard navigation)

#### 3. **Brand Consistency Across Entry Points**
   - **Description:** Ensure landing, signin, and signup pages all feel like the same product with shared components and design language
   - **User story:** As a user exploring Mirror of Dreams, I want every page to feel cohesive so that I have confidence in the product quality
   - **Acceptance criteria:**
     - [ ] All three pages (landing, signin, signup) use:
       - Same CosmicBackground component
       - Same color palette (purple/gold cosmic theme)
       - Same typography (font families, sizes, weights from design system)
       - Same glass morphism treatment for cards
       - Same button components (GlowButton or unified cosmic-button)
     - [ ] Navigation consistent:
       - Landing: Minimal nav with logo + "Sign In" link
       - Signin/Signup: Minimal nav with logo + back to home link
       - All use same nav component or variant
     - [ ] Animations consistent:
       - Page load fade-ins (300ms)
       - Button hovers (lift + glow)
       - Input focus (border glow)
     - [ ] Mobile responsive on all three pages (same breakpoints)
     - [ ] Create shared AuthLayout component if helpful
     - [ ] Document the entry-point design system for future pages

#### 4. **Reflection Creation Loading Experience**
   - **Description:** Full-page immersive loading state during reflection creation with progress feedback
   - **User story:** As a user creating a reflection, I want to see beautiful loading feedback so that I feel confident the app is processing my request and know approximately how long it will take
   - **Acceptance criteria:**
     - [x] Loading state appears immediately after form submission
     - [x] Animated cosmic loader with branded visuals (purple glow, particles, breathing effect)
     - [x] Status text updates: "Analyzing your reflection..." → "Crafting your mirror response..." → "Almost there..."
     - [x] Minimum 1.5s display time to avoid flash (even if API responds faster)
     - [x] Smooth transition from loading to output view
     - [x] Prevent form resubmission during loading

#### 5. **Dashboard Visual Hierarchy & Content**
   - **Description:** Transform dashboard from sparse/empty feeling to rich, informative hub with clear visual hierarchy
   - **User story:** As a returning user, I want the dashboard to feel alive and useful so that I'm motivated to engage with my dreams and reflections
   - **Acceptance criteria:**
     - [x] Welcome section enhanced with personalized greeting + motivational micro-copy
     - [x] "Reflect Now" CTA is visually prominent (gradient button, larger, animated glow)
     - [x] Dashboard cards show preview content even when empty (skeleton states or illustrated empty states)
     - [x] Stagger animations refined (smoother, faster - 100ms delays)
     - [x] Visual hierarchy: Hero CTA > Recent Activity > Stats Grid
     - [x] Card hover states enhanced (lift + glow + scale)
     - [x] Consistent padding and spacing using design system variables

#### 6. **Navigation Layout Fix**
   - **Description:** Fix fixed navigation causing content overlap and ensure proper spacing
   - **User story:** As a user navigating the app, I want all content to be visible and not hidden behind the navigation bar
   - **Acceptance criteria:**
     - [x] Navigation bar height calculated and applied as padding to all pages
     - [x] Content never hidden behind fixed nav (test on all pages)
     - [x] Mobile navigation doesn't overlap content when expanded
     - [x] Smooth scroll behavior respects nav height when jumping to anchors
     - [x] Navigation itself is optimized: reduce opacity slightly for non-obtrusive presence

#### 7. **Reflection Text Readability**
   - **Description:** Ensure all reflection text is highly readable with proper contrast and typography
   - **User story:** As a user reading my reflection output, I want the text to be easy to read so that I can focus on the content, not strain to see it
   - **Acceptance criteria:**
     - [x] Reflection body text: white with 95% opacity on dark background (WCAG AA compliance)
     - [x] Headings use gradient text (purple-to-gold) for visual interest
     - [x] Strong tags use gradient or higher contrast color
     - [x] Line height increased to 1.8 for readability
     - [x] Font size: minimum 1.1rem (18px equivalent) for body text
     - [x] Proper text hierarchy: h1 (3rem) > h2 (2rem) > h3 (1.5rem) > body (1.1rem)

#### 8. **Consistent Loading States**
   - **Description:** Unified loading experience across all async operations using CosmicLoader
   - **User story:** As a user, I want consistent visual feedback when the app is loading data so that I understand the app's state
   - **Acceptance criteria:**
     - [x] All tRPC queries use CosmicLoader component during loading
     - [x] Loader centered with descriptive text ("Loading dreams...", "Fetching reflections...")
     - [x] Minimum display time (300ms) to prevent flash
     - [x] Loader size appropriate for context (sm for cards, lg for full page)
     - [x] Skeleton loaders for list items (fade in when data arrives)

#### 9. **Enhanced Empty States**
   - **Description:** Branded, helpful empty states with clear CTAs and personality
   - **User story:** As a new user or user with no data, I want empty states to guide me on what to do next and feel aligned with the brand
   - **Acceptance criteria:**
     - [x] All empty states use EmptyState component with:
       - Branded icon (cosmic emoji or SVG illustration)
       - Encouraging headline (e.g., "Your journey begins here")
       - Clear description of what this section will contain
       - Primary CTA button to create first item
     - [x] Empty states for: Dreams, Reflections, Evolution Reports, Visualizations
     - [x] Consistent spacing and visual treatment
     - [x] Optional: subtle animation (floating, pulse) for visual interest

#### 10. **Micro-Interactions & Button Polish**
   - **Description:** Add satisfying feedback to all interactive elements
   - **User story:** As a user, I want buttons and interactive elements to feel responsive and delightful so that the app feels polished
   - **Acceptance criteria:**
     - [x] All GlowButton components have:
       - Smooth hover state (scale 1.02, glow intensifies, translate-y lift)
       - Active/pressed state (scale 0.98)
       - Focus ring for keyboard navigation
       - Loading state with spinner (prevents double-click)
       - Disabled state with reduced opacity
     - [x] Card hover states: lift + glow + border highlight
     - [x] Link hover states: color shift + underline
     - [x] Input focus states: glow + border highlight
     - [x] Transitions: 200-300ms cubic-bezier for smoothness

#### 11. **Typography System Enforcement**
   - **Description:** Apply typography hierarchy consistently across all pages
   - **User story:** As a user, I want text to be visually organized so that I can quickly scan and understand content
   - **Acceptance criteria:**
     - [x] All headings use design system font sizes (text-4xl, text-3xl, text-2xl, text-xl)
     - [x] All body text uses --text-base or --text-lg
     - [x] Font weights applied semantically:
       - h1: font-bold (700)
       - h2: font-semibold (600)
       - h3: font-medium (500)
       - body: font-normal (400)
       - labels: font-medium (500)
     - [x] Line heights:
       - Headings: leading-tight (1.25)
       - Body: leading-relaxed (1.625)
     - [x] Consistent use of gradient text for emphasis (gradient-text-cosmic class)

#### 12. **Color Usage Guidelines & Semantic Meaning**
   - **Description:** Establish clear color semantics and apply consistently
   - **User story:** As a user, I want colors to have meaning so that I can quickly understand status and importance
   - **Acceptance criteria:**
     - [x] Purple/Amethyst: Primary brand color, used for primary actions and brand moments
     - [x] Gold: Success, achievement, highlights (completed reflections, upgrades)
     - [x] Blue: Information, calm secondary actions
     - [x] Red: Errors, destructive actions (delete, cancel subscription)
     - [x] Green: Success confirmations (reflection created, dream achieved)
     - [x] White: Neutral text and secondary elements
     - [x] Document color usage in design system
     - [x] Audit all components for semantic color usage

#### 13. **Page Transition Animations**
   - **Description:** Smooth fade-in animations on page load and route changes
   - **User story:** As a user navigating between pages, I want smooth transitions so that the app feels cohesive and polished
   - **Acceptance criteria:**
     - [x] All pages fade in on mount (300ms ease-out)
     - [x] Page content staggers in (header → hero → content grid)
     - [x] Route changes have exit/enter animations (Framer Motion page transitions)
     - [x] Scroll position preserved/restored appropriately
     - [x] Respect prefers-reduced-motion for accessibility

#### 14. **Spacing & Layout Consistency**
   - **Description:** Apply design system spacing variables consistently across all components
   - **User story:** As a user, I want the app to feel organized and breathable so that it's pleasant to use
   - **Acceptance criteria:**
     - [x] All components use CSS custom properties for spacing (--space-sm, --space-md, --space-lg, etc.)
     - [x] Consistent padding within cards: --space-xl (32px)
     - [x] Consistent gap between elements:
       - Tight groups: --space-2 (8px)
       - Related elements: --space-4 (16px)
       - Sections: --space-8 (32px)
       - Major sections: --space-12 (48px)
     - [x] Maximum content width enforced: 1200px (--container-max-width)
     - [x] Mobile spacing scales down appropriately

#### 15. **Focus States & Accessibility**
   - **Description:** Ensure all interactive elements have clear focus indicators
   - **User story:** As a keyboard user, I want to see where my focus is so that I can navigate the app effectively
   - **Acceptance criteria:**
     - [x] All buttons have visible focus ring (2px white outline, 2px offset)
     - [x] All links have focus indicator
     - [x] All form inputs have focus glow effect
     - [x] All cards with onClick have focus state
     - [x] Focus order is logical (top to bottom, left to right)
     - [x] Skip-to-content link for keyboard users
     - [x] ARIA labels on all interactive elements

---

### Should-Have (Post-MVP)

1. **Branded Illustrations** - Custom SVG illustrations for empty states (cosmic mirror, stars, dreams)
2. **Advanced Animations** - Parallax effects, scroll-triggered animations, particle systems
3. **Dark/Light Mode Toggle** - User preference for cosmic dark (current) vs ethereal light theme
4. **Custom Cursor** - Branded cursor with interactive states (hover, click)
5. **Sound Design** - Subtle audio feedback for key interactions (optional, user-controlled)
6. **Glassmorphism Customization** - User can adjust blur intensity, transparency
7. **Onboarding Animations** - Welcome tour with animated explanations of features
8. **Seasonal Themes** - Subtle theme variations for holidays/seasons (winter stars, spring blooms)

### Could-Have (Future)

1. **3D Elements** - Three.js cosmic background with interactive 3D objects
2. **AI-Generated Visuals** - Generate unique artwork for each reflection
3. **Motion Design Library** - Reusable animation presets for developers
4. **Component Playground** - Interactive design system documentation

---

## User Flows

### Flow 1: First-Time User Journey (Landing → Signup → Dashboard)

**Steps:**
1. User visits mirrorofdreams.com (landing page)
2. **Landing page loads** with:
   - Smooth fade-in animation (300ms)
   - Cosmic background with subtle particles
   - Hero section: "Your Dreams, Reflected" headline
   - Clear value proposition subheading
   - Large "Start Reflecting" CTA (GlowButton with glow effect)
   - 4 feature highlight cards (glass morphism) explaining the product
3. User scrolls down to read features (scroll-triggered animations)
4. User clicks "Start Reflecting" CTA
5. **Redirects to /auth/signup**
6. Signup page loads with same cosmic aesthetic:
   - Same background as landing
   - Same glass card styling
   - Consistent form inputs with focus glow
   - Smooth validation feedback
7. User fills out form (name, email, password, confirm password)
8. User clicks "Create Free Account" button
9. **Button shows loading state** (spinner + "Creating...")
10. Success! Redirect to /onboarding or /dashboard
11. **Dashboard loads** with:
    - Welcome message: "Welcome, [Name]! ✨"
    - Prominent "Reflect Now" CTA
    - Dashboard cards with beautiful empty states
    - Consistent spacing, typography, animations

**Why this matters:**
- This is the **entire first impression** - from discovery to first use
- If landing page looks cheap, user bounces
- If signup looks different from signin, user feels uncertain
- If dashboard feels empty/broken, user churns immediately
- **Cohesion = Trust = Retention**

**Edge cases:**
- **Mobile user:** All 3 pages must be fully responsive, no horizontal scroll
- **Slow connection:** Loading states prevent confusion
- **Validation error:** Clear, helpful error messages (red highlight + text)

### Flow 2: Create Reflection with Loading Feedback

**Steps:**
1. User navigates to /reflection page
2. User selects a dream from the list (dream cards appear with stagger animation)
3. User fills out 4 questions (character counters update, validation indicators appear)
4. User selects tone (cards highlight on selection with glow effect)
5. User clicks "Submit Reflection" button
6. **NEW:** Full-page loading overlay appears with:
   - Cosmic background with animated particles
   - Large CosmicLoader (spinning gradient ring)
   - Status text: "Analyzing your reflection..."
   - Progress bar (if API supports progress, otherwise indeterminate pulse)
7. After 2-3 seconds, status text updates: "Crafting your mirror response..."
8. Loading overlay fades out, reflection output fades in
9. User sees their reflection with smooth scroll to top

**Edge cases:**
- **Slow network:** Loading state persists, no timeout (show "Taking longer than usual..." after 10s)
- **API error:** Loading state clears, error toast appears with retry button
- **User navigates away during loading:** Cancel pending request, clear loading state

**Error handling:**
- **Network error:** "Unable to connect. Please check your internet and try again."
- **Server error:** "Something went wrong on our end. Please try again."
- **Validation error:** Highlight invalid fields, show specific error messages

### Flow 3: Dashboard First Visit (Empty State)

**Steps:**
1. New user lands on /dashboard after signup
2. Page fades in (300ms)
3. Welcome section appears: "Welcome, [Name]!"
4. "Reflect Now" CTA pulses gently with golden glow
5. Dashboard cards stagger in (100ms delay each):
   - **Usage Card:** Shows "0 / 50 reflections this month" with encouraging copy
   - **Reflections Card:** Beautiful empty state with illustration, "Your first reflection awaits"
   - **Dreams Card:** Empty state with "Plant your first dream" CTA
   - **Evolution Card:** Empty state with "Unlock insights as you reflect"
   - **Visualization Card:** Empty state with preview of what visualizations look like
   - **Subscription Card:** Shows current tier with upgrade CTA if free
6. User hovers over cards (lift + glow effect)
7. User clicks "Create Dream" or "Reflect Now"

**Edge cases:**
- **User has data:** Cards show content previews instead of empty states
- **Slow data load:** Skeleton loaders appear in cards until data arrives

### Flow 4: Navigation & Layout

**Steps:**
1. User on any authenticated page
2. Fixed navigation at top shows logo, nav links, user menu
3. Page content starts below navigation with proper padding
4. User scrolls down - navigation remains fixed, content scrolls smoothly
5. User clicks different nav link
6. Current page fades out (150ms), new page fades in (300ms)
7. Scroll position resets to top
8. Active nav link highlights with glow

**Edge cases:**
- **Mobile:** Hamburger menu expands without covering content
- **Small screens:** Navigation condenses, logo may hide on scroll for more space
- **Keyboard navigation:** User can tab through nav links, focus ring visible

---

## Data Model Overview

**No data model changes required** - This is purely a UI/UX overhaul. All existing data structures remain the same.

**Key entities remain:**
1. **User** - No changes
2. **Dream** - No changes
3. **Reflection** - No changes
4. **Evolution Report** - No changes
5. **Visualization** - No changes

---

## Technical Requirements

**Must support:**
- Existing Next.js 14 app router architecture
- Existing Tailwind CSS + CSS modules setup
- Existing Framer Motion for animations
- Existing tRPC for data fetching
- Existing design system (variables.css, tailwind.config.ts)
- WCAG 2.1 AA accessibility compliance
- Responsive design (mobile, tablet, desktop)
- Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

**Constraints:**
- No major architectural changes
- No new dependencies unless absolutely necessary
- All changes must be backward compatible with existing components
- Performance budget: Largest Contentful Paint (LCP) < 2.5s, First Input Delay (FID) < 100ms

**Preferences:**
- Use existing component library (ui/glass/*) and extend where needed
- Reuse existing animations (lib/animations/variants.ts)
- Maintain existing naming conventions
- Keep components small and focused (single responsibility)
- Use CSS custom properties for all themeable values
- Prefer CSS transitions over JavaScript animations where possible

---

## Success Criteria

**The design overhaul is successful when:**

1. **Entry Points Feel Like One Product: 10/10**
   - Metric: Landing, signin, and signup pages all use same design system, components, and brand language
   - Target: 100% - No visual inconsistency across entry points
   - Measurement: Manual review checklist:
     - [x] All 3 pages use CosmicBackground
     - [x] All 3 pages use same button components (GlowButton or cosmic-button)
     - [x] All 3 pages use same typography (fonts, sizes, weights)
     - [x] All 3 pages use same input styling (glass, focus states)
     - [x] All 3 pages use same color palette (purple/gold cosmic)
     - [x] Navigation consistent across pages

2. **Visual Cohesion Score: 9/10**
   - Metric: Design audit checklist (all components follow design system, consistent spacing, typography, colors)
   - Target: 90%+ checklist items passing
   - Measurement: Manual review against design system guidelines

3. **No Missing Feedback States**
   - Metric: Every async operation has loading/success/error states
   - Target: 100% coverage
   - Measurement: Audit all tRPC queries, form submissions, route changes

4. **Readability Improvements**
   - Metric: WCAG contrast ratio on all text
   - Target: AA compliance (4.5:1 for body text, 3:1 for large text)
   - Measurement: Automated contrast checker (WebAIM, Lighthouse)

5. **User Delight Moments**
   - Metric: Smooth animations, satisfying micro-interactions
   - Target: All buttons have hover/active states, all page transitions smooth
   - Measurement: Manual testing, user feedback

6. **Accessibility Compliance**
   - Metric: Lighthouse accessibility score
   - Target: 95+ (up from current)
   - Measurement: Automated Lighthouse audit

7. **Performance Maintained**
   - Metric: Lighthouse performance score
   - Target: 90+ (no regression from current)
   - Measurement: Automated Lighthouse audit

8. **Mobile Experience**
   - Metric: All features usable on mobile, no horizontal scroll, readable text
   - Target: 100% feature parity on mobile
   - Measurement: Manual testing on iPhone SE, iPhone 12, Android (Pixel)

---

## Out of Scope

**Explicitly not included in this design overhaul:**

- New features or functionality (dreams, reflections, evolution already exist)
- Backend/API changes (purely frontend polish)
- Database schema changes
- Authentication flow changes (unless visual polish only)
- Payment/subscription flow logic (unless visual polish only)
- Email templates
- Marketing pages (landing page, about, pricing)
- Admin dashboard visuals (separate project)
- Mobile native apps (web only)
- SEO optimization (separate effort)
- Performance optimization beyond maintaining current levels

**Why:** This is a focused design polish effort. Feature development and backend improvements are separate initiatives.

---

## Assumptions

1. Existing design system (variables.css, tailwind.config.ts) is solid foundation
2. Users primarily use modern browsers with good CSS support
3. Current component architecture (ui/glass/*) is extensible
4. Performance is currently acceptable and won't regress
5. The cosmic purple/gold theme is the desired brand direction
6. Accessibility is a priority (not a nice-to-have)
7. Budget allows for 2-3 weeks of focused design polish work (updated for entry point redesign)

---

## Open Questions

1. **Should we add skip-to-content link for keyboard users?** (Recommendation: Yes, for accessibility)
2. **Do we want custom SVG illustrations for empty states or use emoji?** (Recommendation: Start with emoji, upgrade to SVG in post-MVP)
3. **Should we implement a design system documentation page (/design-system)?** (Recommendation: Yes, helpful for future development)
4. **Do we want to add analytics tracking for design improvements?** (Recommendation: Yes, track user engagement with new interactive elements)
5. **Should we create a style guide PDF for external designers/developers?** (Recommendation: Post-MVP)
6. **What copy should the landing page hero use?** (Recommendation: "Your Dreams, Reflected" or user preference)
7. **Should landing page have video demo or static screenshots?** (Recommendation: Static for MVP, video post-launch)

---

## Implementation Strategy

### Phase 0: Entry Points (First Impressions - CRITICAL)
**Priority:** P0 - **HIGHEST** - These are the first pages users see!
**Features:** 1, 2, 3 (Landing Page, Unified Auth, Brand Consistency)
- **Week 1, Days 1-3:**
  - Redesign landing page (app/page.tsx) with proper hero, features, CTA
  - Rebuild signup page to match signin aesthetic
  - Create shared AuthLayout component
  - Ensure all 3 pages use CosmicBackground, GlassCard, GlowButton
  - Add proper navigation to landing page
  - Test on mobile, tablet, desktop
- **Why first:** First impressions determine if users trust the product. A beautiful landing page and consistent auth flow are non-negotiable for brand perception.

### Phase 1: Core UX Fixes (Critical Functionality)
**Priority:** P0 - Blocking user experience
**Features:** 4, 6, 7 (Loading states, Navigation, Readability)
- **Week 1, Days 4-5:**
  - Fix navigation overlap issue (all authenticated pages)
  - Fix reflection text readability (contrast, typography)
  - Add loading state for reflection creation with progress feedback
  - Ensure all pages have proper spacing below fixed nav
- **Why second:** These are the most painful UX issues for existing users. Once users get past the landing/auth, these problems block their ability to use the app effectively.

### Phase 2: Visual Consistency (Systematic Cleanup)
**Priority:** P1 - Core experience foundation
**Features:** 8, 9, 11, 14 (Loading states, Empty states, Typography, Spacing)
- **Week 2, Days 1-3:**
  - Enforce typography system across all pages (audit + fix)
  - Apply consistent spacing using design system variables
  - Unify loading states (CosmicLoader everywhere)
  - Enhance empty states (EmptyState component with personality)
- **Why third:** With entry points polished and critical UX fixed, now systematically clean up the entire app to feel cohesive.

### Phase 3: Dashboard & Key Journeys
**Priority:** P1 - High-engagement pages
**Features:** 5 (Dashboard transformation)
- **Week 2, Days 4-5:**
  - Welcome section enhancement (personalized greeting)
  - Dashboard card content previews and visual hierarchy
  - "Reflect Now" CTA prominence
  - Empty state personality for dashboard cards
- **Why fourth:** Dashboard is where users land after auth. Make it feel alive and motivating.

### Phase 4: Delight Layer (Polish & Micro-interactions)
**Priority:** P2 - User satisfaction and delight
**Features:** 10, 12, 13 (Micro-interactions, Color semantics, Page transitions)
- **Week 3, Days 1-2:**
  - Button hover/active states (all GlowButton components)
  - Card hover effects (lift + glow + border)
  - Page transition animations (route changes)
  - Stagger animations refinement (dashboard, lists)
  - Color semantic usage audit
- **Why fifth:** With functionality and consistency in place, add the delight layer that makes the app feel premium.

### Phase 5: Accessibility & Performance (Non-negotiable)
**Priority:** P1 - Compliance and quality
**Features:** 15 (Focus states & accessibility)
- **Week 3, Day 3:**
  - Focus states on all interactive elements
  - ARIA labels audit (all buttons, links, forms)
  - Contrast ratio verification (WCAG AA)
  - Performance testing (Lighthouse audit, ensure no regression)
  - Keyboard navigation testing
- **Why last (but P1):** Accessibility is crucial but builds on top of the visual design. Once all components are in place, ensure they're all accessible.

### Estimated Timeline
- **Total:** ~3 weeks (15 working days)
- **Phase 0 (Entry):** 3 days
- **Phase 1 (Core UX):** 2 days
- **Phase 2 (Consistency):** 3 days
- **Phase 3 (Dashboard):** 2 days
- **Phase 4 (Delight):** 2 days
- **Phase 5 (A11y):** 1 day
- **Buffer:** 2 days for QA, fixes, polish

---

## Next Steps

- [x] Review and refine this vision (You're reading it!)
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

**Alternatively:**
- [ ] Create GitHub issues for each must-have feature
- [ ] Prioritize with stakeholders
- [ ] Create design mockups/prototypes for validation
- [ ] Begin implementation in sprints

---

**Vision Status:** VISIONED
**Ready for:** Master Planning & Execution

---

## Design Philosophy

> "Mirror of Dreams should feel like a sacred space where technology and introspection meet. Every pixel serves the user's journey. Every animation has a purpose. Every color choice carries meaning. We're not building software—we're crafting an experience that honors the user's dreams."

**Guiding principles:**
1. **Clarity over cleverness** - Beautiful, but never confusing
2. **Consistency breeds trust** - Same patterns, same outcomes
3. **Delight in the details** - Micro-interactions matter
4. **Accessibility is design** - Inclusive by default
5. **Performance is UX** - Fast is beautiful
6. **First impressions are everything** - Landing, signin, signup define brand perception

---

**This vision transforms Mirror of Dreams from a 4.5/10 design into a 9/10 polished, cohesive branded product that users trust and enjoy.**
