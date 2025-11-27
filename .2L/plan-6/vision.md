# Project Vision: Mirror of Dreams - The Final Polish (9/10 → 10/10)

**Created:** 2025-11-27
**Plan:** plan-6
**Current State:** 5.8/10 design quality (progress from 4.5)
**Target State:** 10/10 - Production-ready, emotionally resonant, complete experience

---

## Problem Statement

Mirror of Dreams has made significant aesthetic progress (4.5 → 5.8), but critical gaps remain that prevent it from feeling like a complete, polished product. The upper sidebar hides content, the dashboard feels empty despite having a "Reflect Me" button, and individual reflections and the reflection page lack the visual depth and emotional impact they deserve.

**Current pain points:**
- **Upper sidebar (AppNavigation) hides page content** - Layout issue causing text/cards to be obscured behind fixed navigation
- **Dashboard feels barren** - Single "Reflect Me" button doesn't create a sense of home or progress
- **Reflection page lacks depth** - The sacred act of reflection doesn't feel as immersive or special as it should
- **Individual reflections don't shine** - When viewing past reflections, the presentation doesn't honor the depth of content
- **Missing warmth and completion** - App feels functional but not emotionally resonant
- **No visual hierarchy in reflection content** - AI responses are plain text, not formatted to aid understanding
- **Empty states could be more inviting** - Opportunity to create anticipation and guidance
- **Transitions between reflection states** - Moving from form → loading → output could be more fluid

---

## Target Users

**Primary user:** Ahiya (creator, experiencing the product daily)
- Needs the app to feel complete, not in-progress
- Values substance AND beauty (not one over the other)
- Wants reflections to feel sacred and special
- Expects dashboard to show progress and create momentum
- Requires all content to be visible (no navigation overlap)

**Future users:** Individuals pursuing meaningful dreams through reflection
- First impressions matter - needs to feel premium immediately
- Dashboard should motivate action and show progress
- Each reflection should feel like a meaningful conversation
- The entire experience should honor the depth of their inner work

---

## Core Value Proposition

Transform Mirror of Dreams into a **complete, emotionally resonant sanctuary** where every element serves the sacred act of self-reflection—from the first glance at the dashboard to the moment you read your AI mirror's response.

**Key benefits:**
1. **Visual comfort** - Navigation never obscures content, everything breathable and clear
2. **Motivated engagement** - Dashboard creates sense of home, progress, and next steps
3. **Sacred reflection experience** - The reflection page feels immersive and intentional
4. **Honored reflections** - Past reflections displayed with the care they deserve
5. **Emotional resonance** - Every page creates appropriate feeling (calm, inspired, contemplative)

---

## Feature Breakdown

### Must-Have (Plan-6 MVP)

#### 1. **Fix Navigation Overlap Issue**
- **Description:** Upper sidebar (AppNavigation) currently hides page content beneath it; fix z-index, padding, and layout
- **User story:** As a user, I want all page content to be fully visible so that I never have to scroll past hidden text or cards
- **Acceptance criteria:**
  - [ ] AppNavigation z-index and positioning reviewed
  - [ ] All pages have proper top padding to account for fixed nav height
  - [ ] Test on dashboard, reflection page, dreams page, evolution, visualizations
  - [ ] Mobile: hamburger menu doesn't obscure content when open
  - [ ] Scroll behavior smooth and content never hidden
  - [ ] Document proper spacing pattern for future pages
- **Technical details:**
  - File: `components/shared/AppNavigation.tsx`
  - Add: CSS variable `--nav-height` for fixed navbar height
  - Update: All page layouts to use `padding-top: var(--nav-height)`
  - Consider: Sticky vs fixed positioning based on actual UX

#### 2. **Dashboard Richness Transformation**
- **Description:** Transform dashboard from sparse single-button to rich, motivating hub
- **User story:** As a user landing on dashboard, I want to see my dreams, recent activity, and feel motivated to take action
- **Acceptance criteria:**
  - [ ] **Hero section:**
    - Personalized greeting based on time of day (Good morning/afternoon/evening, [Name])
    - Motivational micro-copy that changes based on user state (e.g., "Ready for your next reflection?")
    - Primary "Reflect Now" CTA (cosmic button, prominent)
  - [ ] **Active Dreams section:**
    - Grid/list of user's active dreams (if any)
    - Each dream card shows: title, days remaining, reflection count
    - Quick action per dream: "Reflect on this dream"
    - Empty state: "Create your first dream" with inviting copy
  - [ ] **Recent Reflections section:**
    - Last 3 reflections across all dreams
    - Each shows: dream name, snippet of reflection, time ago
    - Click to view full reflection
    - Empty state: "Your reflections will appear here"
  - [ ] **Progress indicators:**
    - This month: X reflections created
    - This week: X dreams worked on
    - Visual: simple progress bar or cosmic orb visualization
  - [ ] **Insights preview** (if evolution reports available):
    - Latest evolution insight snippet
    - CTA to view full report
  - [ ] **Visual hierarchy:**
    - Primary action (Reflect Now) most prominent
    - Dreams and recent activity secondary
    - Stats/progress tertiary
  - [ ] **Responsive design:**
    - Mobile: stacks vertically, maintains visual hierarchy
    - Desktop: 2-column or 3-column grid
- **Technical details:**
  - File: `app/dashboard/page.tsx`
  - Components: DashboardHero, DreamsGrid, RecentReflectionsCard, ProgressStats
  - Data: tRPC queries for dreams, reflections, usage stats
  - Animations: Stagger-in for sections (useStaggerAnimation hook)

#### 3. **Reflection Page Depth & Immersion**
- **Description:** Make the reflection experience feel sacred, focused, and special
- **User story:** As a user creating a reflection, I want the page to guide me into a contemplative state and honor the depth of this practice
- **Acceptance criteria:**
  - [ ] **Visual atmosphere:**
    - Darker, more focused background (reduce cosmic intensity or add vignette)
    - Centered, narrow content area (max-width 800px for readability)
    - Generous spacing between questions
  - [ ] **Form presentation:**
    - Each question introduced with intention (not just label)
    - Example: "Take a moment to describe your dream..." (above the textarea)
    - Character counters subtle but helpful (bottom-right of textarea)
    - Progress indicator: visual steps showing Question 1 of 4, etc.
  - [ ] **Tone selection:**
    - Visual cards for Gentle / Intense / Fusion (not just buttons)
    - Each card describes what that tone means
    - Selected state clearly highlighted
  - [ ] **Submit moment:**
    - "Gaze into the Mirror" button central and prominent
    - Cosmic variant with subtle animation
  - [ ] **Transitions:**
    - Form → Loading: smooth fade with expanding cosmic loader
    - Loading → Output: fade loading out, fade reflection content in
  - [ ] **Mobile experience:**
    - All questions visible on one scrollable page (no pagination)
    - Inputs sized for mobile typing
    - Tone cards stack vertically
- **Technical details:**
  - File: `app/reflection/MirrorExperience.tsx` or similar
  - Styling: New CSS module for reflection-specific atmosphere
  - Components: ReflectionQuestionCard, ToneSelectionCard
  - Animations: framer-motion for smooth state transitions

#### 4. **Individual Reflection Display Enhancement**
- **Description:** When viewing a past reflection, present it with depth, formatting, and visual care
- **User story:** As a user reviewing a past reflection, I want the content to be beautiful, readable, and emotionally impactful
- **Acceptance criteria:**
  - [ ] **Layout:**
    - Centered, narrow reading column (max-width 720px for optimal reading)
    - Generous line-height (1.8) for reflection content
    - Ample white space around sections
  - [ ] **Content hierarchy:**
    - Reflection metadata at top: Dream name, date, tone used
    - User's questions and answers displayed with visual separation
    - AI mirror response most prominent (the core value)
  - [ ] **AI response formatting:**
    - Parse markdown if present (headings, bold, lists)
    - Gradient text for key phrases or section headers
    - Blockquotes styled with cosmic border/accent
    - Proper paragraph spacing
  - [ ] **Typography:**
    - Body text: 18px minimum for readability
    - Headings: clear hierarchy (h1: 32px, h2: 24px, h3: 20px)
    - Font weight: reflection content medium (500), AI response regular (400)
  - [ ] **Visual accents:**
    - Subtle cosmic glow on AI response container
    - Dream name badge at top (purple pill with dream title)
    - Date/time in muted text (text-white/40)
  - [ ] **Actions:**
    - Back button to return to reflections list
    - Optional: Share, Download, Archive buttons (subtle, secondary)
  - [ ] **Animations:**
    - Fade-in on load
    - Smooth scroll to AI response section
- **Technical details:**
  - File: `app/reflections/[id]/page.tsx` (or similar route)
  - Components: ReflectionDisplay, AIResponseRenderer
  - Markdown: Use `react-markdown` for AI response parsing
  - Styling: reflection-display.css module

#### 5. **Reflection Page Collection View**
- **Description:** Page listing all user's reflections, filterable and inviting
- **User story:** As a user, I want to browse all my reflections, filter by dream, and easily access any past reflection
- **Acceptance criteria:**
  - [ ] **Header:**
    - "Your Reflections" title with count
    - Filter dropdown: "All dreams" or specific dream
    - Sort options: Most recent, Oldest, By dream
  - [ ] **Reflection cards:**
    - Card per reflection showing:
      - Dream name (badge)
      - Date and time
      - Snippet of AI response (first 120 characters)
      - Tone indicator (small badge: Gentle/Intense/Fusion)
    - Click card to view full reflection
    - Hover state: lift + glow
  - [ ] **Empty state:**
    - "Your reflection journey begins here" with cosmic illustration
    - CTA: "Create your first reflection"
  - [ ] **Pagination:**
    - If >20 reflections, paginate (20 per page)
    - Simple page numbers or Load More button
  - [ ] **Responsive:**
    - Desktop: 2-3 column grid
    - Mobile: single column list
- **Technical details:**
  - File: `app/reflections/page.tsx`
  - Components: ReflectionCard, ReflectionsFilter
  - Data: tRPC query with filtering and pagination

#### 6. **Enhanced Empty States Across App**
- **Description:** Make every empty state inviting, informative, and branded
- **User story:** As a new user or when I have no data, I want empty states to guide me warmly toward taking action
- **Acceptance criteria:**
  - [ ] **Dashboard empty states:**
    - No dreams: Cosmic illustration + "Create your first dream to begin your journey"
    - No reflections: "Your first reflection awaits" + description of what reflection does
  - [ ] **Dreams page empty:**
    - "Dreams are the seeds of transformation" + "Create your first dream" CTA
  - [ ] **Reflections page empty:**
    - "Reflection is how you water your dreams" + "Reflect now" CTA
  - [ ] **Evolution page empty:**
    - "Evolution insights unlock after 4 reflections" + progress indicator (0/4)
  - [ ] **Visualizations page empty:**
    - "Visualizations appear after 4 reflections on a dream" + gentle encouragement
  - [ ] **Visual consistency:**
    - All empty states use EmptyState component
    - Cosmic emoji or subtle SVG illustration
    - Warm, inviting copy (not demanding or salesy)
    - Single, clear CTA per empty state
- **Technical details:**
  - Component: `components/shared/EmptyState.tsx` (enhance existing)
  - Props: title, description, illustration, ctaText, ctaAction
  - Styling: Consistent across all uses

#### 7. **Micro-Interactions & Animations**
- **Description:** Add subtle, delightful interactions that make the app feel alive
- **User story:** As a user, I want interactions to feel smooth and responsive so the app feels premium
- **Acceptance criteria:**
  - [ ] **Reflection form:**
    - Textarea focus: subtle glow border animation
    - Character counter: color shifts as approaching limit (white → gold → red)
    - Submit button hover: lift + glow (already exists, ensure consistent)
  - [ ] **Dashboard cards:**
    - Dream cards: hover lift + purple glow
    - Reflection cards: hover lift + purple glow
    - Click: subtle scale-down (0.98) then scale back to 1
  - [ ] **Navigation:**
    - Active page: underline or glow indicator
    - Hover: smooth color transition (200ms)
  - [ ] **Page transitions:**
    - All pages: fade-in on mount (300ms)
    - Route changes: crossfade (150ms out, 300ms in)
  - [ ] **Loading states:**
    - CosmicLoader appears with fade-in
    - Minimum display time: 500ms (prevents flash for fast loads)
  - [ ] **Reduced motion:**
    - Respect `prefers-reduced-motion` media query
    - Disable all animations except opacity fades
- **Technical details:**
  - Hook: `useReducedMotion()` to respect user preferences
  - Animations: framer-motion variants for consistency
  - File: `lib/animations/variants.ts` (add new variants)

#### 8. **Typography & Readability Polish**
- **Description:** Ensure all text is beautiful, readable, and hierarchical
- **User story:** As a user, I want text to be easy to read and visually organized
- **Acceptance criteria:**
  - [ ] **Headings:**
    - h1: 3rem (48px), font-bold, gradient-text-cosmic
    - h2: 2rem (32px), font-semibold
    - h3: 1.5rem (24px), font-medium
  - [ ] **Body text:**
    - Base: 1.125rem (18px), line-height 1.8
    - Small: 0.875rem (14px), line-height 1.6
    - Tiny: 0.75rem (12px), line-height 1.5
  - [ ] **Contrast:**
    - White text on dark: 95% opacity minimum (WCAG AA)
    - Muted text: 60% opacity for secondary info
    - Very muted: 40% opacity for tertiary info
  - [ ] **Reading width:**
    - Reflection content: max 720px (optimal line length)
    - Dashboard cards: max 1200px container
    - Navigation: full width
  - [ ] **Responsive:**
    - Mobile: reduce base font to 16px, headings scale down 20%
- **Technical details:**
  - File: `styles/globals.css` (update typography utilities)
  - CSS variables: `--text-base`, `--text-lg`, etc.
  - Component: TextFormatter for reflection content

#### 9. **Color & Semantic Meaning**
- **Description:** Use color intentionally to convey meaning and guide attention
- **User story:** As a user, I want colors to help me understand state and importance
- **Acceptance criteria:**
  - [ ] **Purple/Amethyst (primary):**
    - Primary actions: Reflect Now, Create Dream
    - Active states: selected tone, active page
    - Emphasis: dream badges, key headings
  - [ ] **Gold:**
    - Success moments: reflection created, dream achieved
    - Positive stats: reflections this month
    - Highlights: gradient accents
  - [ ] **Blue:**
    - Information: help text, guidance
    - Calm actions: view more, learn about
  - [ ] **Red:**
    - Errors: form validation, API failures
    - Warnings: approaching limits
  - [ ] **White/Gray:**
    - Body text: 95% white
    - Secondary: 60% white
    - Borders/dividers: 20% white
  - [ ] **Audit:**
    - All colors from semantic palette (no arbitrary Tailwind colors)
    - Consistent usage across all pages
- **Technical details:**
  - File: `styles/variables.css` (mirror.* palette)
  - Document: Color usage guide in design system

#### 10. **Spacing & Layout System**
- **Description:** Consistent spacing creates visual rhythm and polish
- **User story:** As a user, I want the app to feel organized and breathable
- **Acceptance criteria:**
  - [ ] **Spacing scale:**
    - xs: 4px (tight elements)
    - sm: 8px (related items)
    - md: 16px (component padding)
    - lg: 24px (section spacing)
    - xl: 32px (card padding)
    - 2xl: 48px (major section breaks)
    - 3xl: 64px (page section spacing)
  - [ ] **Application:**
    - Cards: padding xl (32px)
    - Section gaps: 2xl (48px)
    - Grid gaps: lg (24px)
    - Form field gaps: md (16px)
  - [ ] **Responsive:**
    - Mobile: reduce by 25% (xl → 24px, 2xl → 36px)
  - [ ] **Container widths:**
    - Dashboard: max 1200px
    - Reflection form: max 800px
    - Reflection display: max 720px
- **Technical details:**
  - CSS variables: `--space-xs` through `--space-3xl`
  - Tailwind config: map to spacing scale

---

### Should-Have (Post-MVP)

1. **Reflection Analytics** - Show patterns over time (most reflected-on dream, reflection frequency graph)
2. **Dream Templates** - Pre-written dream categories to help users get started
3. **Reflection Reminders** - Gentle notifications to reflect (email or in-app)
4. **Export Reflections** - Download as PDF or markdown
5. **Reflection Search** - Full-text search across all reflections
6. **Tags/Categories** - User-defined tags for reflections
7. **Reflection Streaks** - Gamification of consistent reflection practice
8. **Custom Backgrounds** - User can choose cosmic intensity or background style

### Could-Have (Future)

1. **Voice Input** - Record voice reflections, transcribe to text
2. **Collaborative Dreams** - Share dreams with accountability partners
3. **Reflection Prompts Library** - Alternative question sets beyond the 4 core questions
4. **Insights Dashboard** - Advanced analytics and pattern recognition across all reflections
5. **Mobile Native App** - iOS and Android apps with offline reflection

---

## User Flows

### Flow 1: New User First Experience (Dashboard → Dream → Reflection)

**Steps:**
1. User signs in, lands on dashboard
2. **Dashboard:**
   - Sees personalized greeting: "Good morning, Ahiya! ✨"
   - Sees "Your Dreams" section with empty state: "Create your first dream to begin your journey"
   - Sees prominent "Reflect Now" button (disabled until dream created)
   - Sees "Recent Reflections" empty state: "Your reflections will appear here"
3. User clicks "Create your first dream" in empty state
4. **Dream creation modal/page:**
   - Fills out: Title, Description, Target Date (optional), Category
   - Clicks "Create Dream"
5. **Redirects back to dashboard:**
   - Now sees their dream card in "Your Dreams" section
   - Dream card shows: title, days remaining, 0 reflections
   - "Reflect Now" button is now enabled (glowing)
6. User clicks "Reflect Now"
7. **Reflection page:**
   - Darker, focused atmosphere
   - Sees progress: "Question 1 of 4"
   - Reads guiding text: "Take a moment to describe your dream..."
   - Fills all 4 questions (scrolls, all visible)
   - Selects tone: Sacred Fusion (card highlights)
   - Clicks "Gaze into the Mirror"
8. **Loading state:**
   - Form fades out
   - Cosmic loader expands with breathing animation
   - Status text: "Your mirror is reflecting..." → "Crafting your insight..."
   - Minimum 2 seconds (feels intentional, not rushed)
9. **Reflection output:**
   - Loading fades out
   - Reflection content fades in
   - Beautiful formatting: metadata, questions/answers, AI response with markdown
   - User reads, feels seen
10. **Returns to dashboard:**
    - Now sees "Recent Reflections" with their first reflection
    - Dream card shows: "1 reflection"
    - Feels sense of progress and home

**Why this matters:**
- This is the **complete onboarding experience**
- Dashboard must feel like home, not empty
- Reflection must feel sacred, not transactional
- Output must honor the depth of their sharing

**Edge cases:**
- **No dream created yet:** Dashboard guides toward dream creation, Reflect Now disabled
- **Loading timeout:** After 30s, show "Taking longer than usual..." with option to cancel
- **API error:** Clear error message, offer to retry, preserve user's input

### Flow 2: Returning User Engagement (Dashboard → Browse → Reflect)

**Steps:**
1. User signs in, lands on dashboard
2. **Dashboard:**
   - Greeting: "Good evening, Ahiya! ✨"
   - Progress: "This month: 12 reflections, 3 dreams"
   - Active dreams: 3 dream cards visible
   - Recent reflections: Last 3 reflections showing snippets
   - Sees latest evolution insight preview
3. User browses recent reflections
4. Clicks on a reflection card to view full reflection
5. **Individual reflection page:**
   - Centered, beautiful layout
   - Dream name badge at top
   - Metadata: June 15, 2025 • Sacred Fusion
   - User's questions and answers
   - AI response formatted with markdown, gradient headings
   - Reads, reflects, feels connection to that moment
6. Clicks "Back to Reflections"
7. **Reflections page:**
   - All reflections listed (filtered by "All dreams")
   - Changes filter to specific dream
   - Sees only reflections for that dream
   - Clicks "Reflect on this dream" button
8. **Returns to reflection page:**
   - Pre-filled with selected dream
   - Goes through reflection flow
   - Creates new reflection
9. **Dashboard updated:**
   - Dream card now shows "13 reflections"
   - Recent reflections shows new one at top
   - Progress stats updated

**Edge cases:**
- **No reflections yet:** Reflections page shows inviting empty state
- **Many reflections:** Pagination at bottom (20 per page)
- **Filter by dream:** Only shows reflections for that dream

### Flow 3: Experiencing Evolution (4th Reflection → Evolution Report)

**Steps:**
1. User completes 4th reflection on a dream
2. **Reflection output:**
   - After AI response, special message appears:
   - "✨ You've unlocked Evolution Insights for [Dream Name]!"
   - CTA: "View Your Evolution"
3. User clicks "View Your Evolution"
4. **Evolution page:**
   - Shows loading state (generating report)
   - Report appears: temporal analysis, growth patterns, specific quotes
   - User reads, feels seen and understood
   - Sense of progress and validation
5. **Dashboard updated:**
   - Insights preview shows snippet of evolution report
   - Dream card shows "Evolution available" badge

**Edge cases:**
- **Not enough reflections:** Evolution page shows progress (2/4 reflections)
- **Multiple dreams:** Can generate evolution for each dream independently

---

## Data Model Overview

**No data model changes required** - This is purely UI/UX enhancement.

**Key entities remain:**
1. **User** - No changes
2. **Dream** - No changes
3. **Reflection** - No changes (presentation layer only)
4. **Evolution Report** - No changes
5. **Visualization** - No changes

---

## Technical Requirements

**Must support:**
- Existing Next.js 14 App Router architecture
- Existing tRPC API (no backend changes)
- Existing design system (extend, don't replace)
- Framer Motion for animations
- React Markdown for reflection content formatting
- WCAG 2.1 AA accessibility (maintained)
- Responsive design (mobile-first)
- Modern browsers (Chrome, Firefox, Safari, Edge)

**Constraints:**
- No breaking changes to existing features
- No new dependencies if possible (exception: react-markdown if not already present)
- Performance budget: LCP < 2.5s, FID < 100ms (maintained)
- Build size: Keep bundle increase under 20KB

**Preferences:**
- Extend existing components (GlassCard, GlowButton, etc.)
- Reuse animation variants from `lib/animations/variants.ts`
- Use CSS custom properties for all new values
- Keep components focused and composable
- Document all new patterns in patterns.md

---

## Success Criteria

**The final polish is successful when:**

1. **Navigation Never Hides Content: 10/10**
   - Metric: All pages have proper padding, no content obscured
   - Target: 100% - Zero reports of hidden content on any page
   - Measurement: Manual testing on all pages at various screen sizes

2. **Dashboard Feels Complete: 9/10**
   - Metric: Dashboard shows dreams, recent activity, progress, and clear next action
   - Target: User says "I know what to do and where I am" immediately
   - Measurement: User testing, qualitative feedback

3. **Reflection Experience is Sacred: 10/10**
   - Metric: Reflection page creates contemplative atmosphere, guides user, honors their input
   - Target: User reports feeling focused and that the process matters
   - Measurement: User feedback, session time on reflection page (target: 5+ minutes)

4. **Individual Reflections Shine: 9/10**
   - Metric: Past reflections are beautiful, readable, and emotionally impactful
   - Target: User re-reads past reflections and feels connection
   - Measurement: Reflection view rates, time on page

5. **Empty States Guide Action: 8/10**
   - Metric: All empty states are inviting and clear about next steps
   - Target: Users create their first dream/reflection without confusion
   - Measurement: Conversion rate from empty state to action

6. **Micro-Interactions Feel Premium: 9/10**
   - Metric: All interactions smooth, responsive, and delightful
   - Target: 60fps animations, <200ms perceived response time
   - Measurement: Performance profiling, user perception

7. **Typography is Beautiful: 9/10**
   - Metric: All text is readable, hierarchical, and visually pleasing
   - Target: WCAG AA contrast, optimal line lengths, clear hierarchy
   - Measurement: Automated contrast checks, manual review

8. **Overall Product Quality: 10/10**
   - Metric: Holistic assessment of polish, completeness, emotional resonance
   - Target: Product feels finished, not in-progress
   - Measurement: User feedback, stakeholder review

---

## Out of Scope

**Explicitly not included in this polish:**

- New features (Dreams, Reflections, Evolution already exist)
- Backend changes (purely frontend polish)
- Database migrations
- Email templates
- Marketing pages beyond landing
- Admin dashboard
- Mobile native apps
- SEO optimization (separate effort)
- A/B testing infrastructure
- Analytics beyond basic tracking
- Payment/subscription changes
- Third-party integrations

**Why:** This is focused polish to reach 10/10. Feature development is separate.

---

## Assumptions

1. Existing component library (GlassCard, GlowButton, etc.) is solid and extensible
2. Current navigation structure (AppNavigation) is correct, just needs layout fixes
3. tRPC queries for dreams, reflections, etc. already work and return needed data
4. Users primarily access on desktop/laptop (mobile is functional but not primary)
5. Cosmic purple/gold theme is final brand direction
6. Accessibility remains a priority (WCAG 2.1 AA maintained)
7. Budget allows for 1-2 weeks of focused polish work

---

## Open Questions

1. **Should dashboard show analytics graphs or keep simple stats?** (Recommendation: Simple stats for now, graphs in post-MVP)
2. **Do we want reflection reminders in MVP?** (Recommendation: No, focus on in-app experience)
3. **Should reflections have edit capability?** (Recommendation: No, preserve integrity of moment)
4. **What tone for evolution page empty state - encouraging or patient?** (Recommendation: Patient - "Your evolution story unfolds after 4 reflections")
5. **Should we add reflection export (PDF/markdown)?** (Recommendation: Post-MVP, gauge user demand)

---

## Implementation Strategy

### Phase 1: Fix Blocking Issues (Days 1-2)
**Priority: P0 - Immediate**
**Features:** 1 (Navigation overlap)

1. **Fix navigation layout:**
   - Add `--nav-height` CSS variable
   - Update all pages to use proper top padding
   - Test on all pages, all screen sizes
   - Document pattern for future pages

**Why first:** This is blocking users from seeing content. Must be fixed immediately.

### Phase 2: Dashboard Richness (Days 2-4)
**Priority: P0 - Core experience**
**Features:** 2 (Dashboard transformation), 6 (Enhanced empty states)

1. **Dashboard sections:**
   - Hero section with greeting + primary CTA
   - Active Dreams grid with cards
   - Recent Reflections section
   - Progress stats
   - All empty states inviting and clear
2. **Data integration:**
   - tRPC queries for dreams, reflections, stats
   - Loading states for each section
3. **Responsive layout:**
   - Mobile-first grid
   - Stagger animations

**Why second:** Dashboard is home. If it feels empty, users won't engage. After nav is fixed, make dashboard compelling.

### Phase 3: Reflection Experience Depth (Days 4-7)
**Priority: P1 - Sacred centerpiece**
**Features:** 3 (Reflection page depth), 4 (Individual reflection display), 5 (Reflection collection view)

1. **Reflection page:**
   - Visual atmosphere (darker, focused)
   - Form presentation with guidance
   - Tone selection cards
   - Smooth transitions (form → loading → output)
2. **Individual reflection display:**
   - Beautiful layout, markdown formatting
   - Typography and readability
   - Visual accents
3. **Reflections collection:**
   - List all reflections
   - Filter by dream
   - Reflection cards with snippets

**Why third:** With dashboard motivating action, ensure the action (reflecting) is profound and beautiful.

### Phase 4: Systematic Polish (Days 7-10)
**Priority: P1 - Finishing touches**
**Features:** 7 (Micro-interactions), 8 (Typography), 9 (Color), 10 (Spacing)

1. **Micro-interactions:**
   - Form interactions (focus glow, character counter)
   - Card hovers and clicks
   - Page transitions
   - Reduced motion support
2. **Typography system:**
   - Heading hierarchy
   - Body text readability
   - Responsive scaling
3. **Color semantics:**
   - Audit all color usage
   - Ensure semantic consistency
4. **Spacing consistency:**
   - Apply spacing scale everywhere
   - Responsive spacing adjustments

**Why fourth:** With core experiences solid, systematic polish makes everything feel cohesive and premium.

### Phase 5: QA & Validation (Days 10-12)
**Priority: P0 - Ship confidence**

1. **Comprehensive testing:**
   - All user flows end-to-end
   - Accessibility audit (keyboard, screen reader)
   - Cross-browser testing
   - Mobile responsiveness
   - Performance profiling
2. **Bug fixes:**
   - Address any issues found in testing
   - Edge case handling
3. **Polish refinements:**
   - Final animation timing adjustments
   - Copy editing
   - Visual consistency review

**Why last:** Ensure everything works perfectly before calling it complete.

### Estimated Timeline
- **Total:** ~2 weeks (12 working days)
- **Phase 1 (Fix Nav):** 2 days
- **Phase 2 (Dashboard):** 2 days
- **Phase 3 (Reflection):** 3 days
- **Phase 4 (Polish):** 3 days
- **Phase 5 (QA):** 2 days

---

## Next Steps

- [ ] Review and refine this vision
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

**Alternatively:**
- [ ] Prioritize features with stakeholder (Ahiya)
- [ ] Create design mockups for dashboard and reflection page
- [ ] Begin implementation in sprints

---

**Vision Status:** VISIONED
**Ready for:** Master Planning & Execution
**Focus:** Completion. Depth. Emotional resonance. The app feels finished, not in-progress.

---

## Design Philosophy

> "Mirror of Dreams is not just functional—it's a sanctuary. Every element serves the sacred act of self-reflection. The dashboard welcomes you home. The reflection page creates space for depth. Each past reflection is honored as a moment of insight. This is where technology and introspection meet with grace."

**Guiding principles:**
1. **Complete over in-progress** - No element feels placeholder or unfinished
2. **Sacred over transactional** - Reflection is honored, not rushed
3. **Home over dashboard** - The landing place feels like belonging
4. **Depth over decoration** - Visual beauty serves emotional resonance
5. **Guidance over assumption** - Empty states and micro-copy guide without demanding
6. **Resonance over perfection** - User feels emotionally connected, not just impressed

---

**This vision transforms Mirror of Dreams from good (5.8/10) to exceptional (10/10) - a complete, emotionally resonant sanctuary for self-reflection.**
