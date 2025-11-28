# Project Vision: Mirror of Dreams - Complete Product Transformation

**Created:** 2025-11-28
**Plan:** plan-7
**Current State:** 6.5/10 aesthetics, functional but incomplete
**Target State:** 9/10 - Complete, polished, production-ready sanctuary
**Focus:** Elevate from functional to emotionally resonant and commercially viable

---

## Problem Statement

Mirror of Dreams has achieved technical solidity (9.2/10 from Plan-6) but remains incomplete as a product experience. The user observed: "we improved aesthetics from 4.5 to 6.5, but we are not yet at 9/10."

**Critical gaps preventing commercial readiness:**

### 1. Landing Page Fails to Convert (P0 - BLOCKING)
- Current landing is **generic and uninspiring** - "Your Dreams, Reflected" doesn't convey transformation
- Features section uses placeholder emojis (✨📖📈🌙) instead of demonstrating real value
- No social proof, no testimonials, no credibility signals
- Missing critical pages: About, Pricing tiers explanation, actual use cases
- Copy feels marketing-speak, not authentic or compelling
- **Result:** Visitors don't understand WHY Mirror of Dreams vs journaling/therapy

### 2. Dashboard Shows Empty Screen (P0 - CRITICAL UX)
- User specifically highlighted: "**Dashboard shows an empty screen when really the dashboard is the sacred command center**"
- Despite Plan-6 improvements (7 sections), dashboard **feels empty** without data
- No demo content, no guided tour, no sense of possibility
- New users see: blank dreams cards, zero reflections, empty stats
- **Result:** Users feel lost, don't understand the product's potential

### 3. Missing Essential Pages (P0 - Product Incomplete)
- **Profile page:** Doesn't exist - users can't manage their account
- **Settings page:** Doesn't exist - no preferences, no customization
- **About page:** Returns 404 - no story, no mission, no trust-building
- **Pricing page:** Generic tier info, no real value prop for premium
- **Result:** Product feels unfinished, users can't trust or configure it

### 4. Reflection Experience Not "Beautiful and Welcoming" (P1)
- User stated: "**The place to write your answers doesn't feel as beautiful and welcoming**"
- Despite Plan-6 depth improvements (darker atmosphere, tone cards), form still feels clinical
- Character counters functional but not delightful
- No encouragement, no micro-copy that celebrates the act of reflecting
- Tone selection cards exist but feel like UI, not a sacred choice
- **Result:** Reflection feels like filling a form, not engaging in introspection

### 5. No Demo User to Experience the Product (P0 - BLOCKING)
- User emphasized: "**Most importantly, we don't have a complete populated demo user**"
- **CRITICAL INSIGHT:** You can't feel the product until you use it WITH DATA
- No pre-populated dreams, reflections, evolution reports, visualizations
- Testing/experiencing Mirror of Dreams requires creating all content from scratch
- Stakeholders, investors, early users can't "see" the value immediately
- **Result:** Product evaluation requires 30+ minutes of data entry before value emerges

### 6. Individual Reflection Pages Lack Beauty (P1)
- User noted: "**The reflection page is not that beautiful**"
- Despite markdown rendering (Plan-6), the reading experience doesn't honor depth
- No visual hierarchy beyond basic markdown (h1, h2, lists)
- AI insights not highlighted or emphasized - they blend into paragraphs
- Metadata (date, tone, dream) present but not visually integrated
- **Result:** Past reflections don't feel precious or worth revisiting

---

## Target Users

**Primary user:** Ahiya (creator, daily user, stakeholder)
- Currently at 6.5/10 satisfaction - knows exactly what's missing
- Needs: **Complete product** to feel proud of and share
- Values: Authentic transformation, not surface-level motivation
- Frustrated by: Half-finished features, empty states without demos, missing core pages

**Secondary users:** Early adopters & testers
- Need to **experience the product instantly** via populated demo account
- Expect **complete feature set** (profile, settings, preferences)
- Evaluate products by **first 60 seconds** - empty dashboard = bounce
- Want to understand **ROI on Premium tier** before subscribing

**Tertiary users:** Investors, advisors, potential team members
- Need to **see the vision realized** without manual setup
- Evaluate based on **polish, completeness, market positioning**
- Look for: Clear value prop, strong landing page, complete user experience

---

## Core Value Proposition

**Transform Mirror of Dreams from a functional reflection tool into a COMPLETE, emotionally resonant sanctuary** that users trust immediately, understand instinctively, and experience fully within 60 seconds - regardless of whether they have data.

**The product must feel:**
1. **Complete** - No missing pages, no 404s, no "coming soon" placeholders
2. **Welcoming** - Every interaction celebrates the user's presence and effort
3. **Demonstrable** - Demo account shows the full potential instantly
4. **Sacred** - Reflection experience honors the depth of introspection
5. **Trustworthy** - About page, pricing clarity, profile management build confidence

---

## Feature Breakdown

### Must-Have (Plan-7 MVP)

#### 1. **Landing Page Transformation: From Generic to Compelling**
- **Description:** Rebuild landing page to convert visitors into believers
- **User story:** As a visitor, I want to immediately understand WHY Mirror of Dreams exists and how it transforms lives, so I feel compelled to try it
- **Acceptance criteria:**
  - [ ] **Hero section redesign:**
    - Headline that captures transformation: "Transform Your Dreams into Reality Through AI-Powered Reflection"
    - Subheadline explaining unique value: "Your personal AI mirror analyzes your reflections, reveals hidden patterns, and guides your evolution - one dream at a time"
    - Dual CTAs: "Start Free" (signup) + "See Demo" (pre-populated demo login)
  - [ ] **Real value demonstration (not generic features):**
    - Replace emoji feature cards with 3 concrete use cases:
      - "From Vague Aspiration to Clear Action Plan" - Show how AI transforms dream → plan
      - "See Your Growth Over Time" - Show evolution insights with real example
      - "Break Through Mental Blocks" - Show pattern recognition in action
  - [ ] **Social proof & credibility:**
    - "Built by dreamers, for dreamers" founder story snippet
    - Stats: "X reflections created, Y dreams achieved, Z evolution reports generated"
    - (Future) User testimonials with photos: "This helped me..." quotes
  - [ ] **Screenshots/visuals:**
    - Dashboard screenshot showing populated state (beautiful data)
    - Reflection output screenshot showing formatted AI response
    - Evolution report visualization example
  - [ ] **Footer enhancement:**
    - About page link (active)
    - Pricing link (active)
    - Privacy & Terms (active)
    - Contact/Support
    - Social media links (if applicable)
  - [ ] **Responsive perfection:**
    - Mobile-first design (60% of traffic)
    - All visuals crisp on Retina displays
    - Fast load time (<2s LCP)

#### 2. **Profile Page: Identity & Account Management**
- **Description:** Create comprehensive profile page for user self-service
- **User story:** As a user, I want to view and update my profile information so that I feel in control of my account
- **Acceptance criteria:**
  - [ ] **Account information section:**
    - Display: Name, Email, Member since date
    - Edit name (inline or modal)
    - Change email (with verification flow)
    - Change password (current password required)
  - [ ] **Tier & subscription info:**
    - Current tier displayed prominently (Free, Premium, Pro, Creator)
    - Tier benefits listed (reflections/month, features unlocked)
    - "Upgrade" CTA if not on highest tier
    - Next billing date (if subscribed)
    - Cancel subscription option (with confirmation)
  - [ ] **Usage statistics:**
    - This month: X/Y reflections created
    - Total reflections: Z
    - Active dreams: N
    - Evolution reports generated: M
    - Member for: X days/months/years
  - [ ] **Account actions:**
    - "Download All Data" button (GDPR compliance - future)
    - "Delete Account" button (with scary confirmation modal)
  - [ ] **Visual design:**
    - GlassCard layout consistent with app
    - Form inputs use GlassInput component
    - Successful edits show toast confirmation
    - Errors displayed inline with helpful messages

#### 3. **Settings Page: Preferences & Customization**
- **Description:** Create settings page for user preferences and app configuration
- **User story:** As a user, I want to customize my experience and control my preferences so that Mirror of Dreams works the way I need it to
- **Acceptance criteria:**
  - [ ] **Notification preferences:**
    - Email notifications: On/Off toggle
    - Reflection reminders: Daily/Weekly/Off
    - Evolution report ready: Email notification toggle
    - Marketing emails: Opt-in/opt-out
  - [ ] **Reflection preferences:**
    - Default tone: Gentle/Intense/Fusion (saves for future reflections)
    - Show character counter: Yes/No
    - Auto-save drafts: Yes/No (future feature note)
  - [ ] **Display preferences:**
    - Reduce motion: On/Off (respects prefers-reduced-motion but allows override)
    - Theme: Cosmic Dark (only option for now, "Light mode coming soon" note)
    - Dashboard layout: Grid/List (if multiple options exist)
  - [ ] **Privacy settings:**
    - Profile visibility: Private (only you) / Public (future - if sharing added)
    - Analytics: Allow anonymous usage analytics toggle
  - [ ] **Danger zone:**
    - Clear all reflection drafts (if feature exists)
    - Reset all preferences to default
    - Delete account (redirect to profile)
  - [ ] **Layout:**
    - Tabbed interface or accordion sections for organization
    - Each setting has description explaining what it does
    - Settings save immediately (no "Save" button needed)
    - Toast confirmation on setting change

#### 4. **Demo User Experience: Instant Value Demonstration**
- **Description:** Create fully populated demo account that showcases Mirror of Dreams at its best
- **User story:** As a visitor/stakeholder, I want to instantly experience a populated Mirror of Dreams account so that I understand its full value without manual data entry
- **Acceptance criteria:**
  - [ ] **Demo account creation:**
    - Email: demo@mirrorofdreams.com (or similar)
    - Password: publicly known or "Try Demo" button autologs in
    - User name: "Demo User" or realistic persona "Alex Chen"
    - Tier: Premium (to show all features)
  - [ ] **3-5 Active Dreams with variety:**
    - Dream 1: "Launch My SaaS Product" (entrepreneurial, 45 days left)
    - Dream 2: "Run a Marathon" (health, 120 days left)
    - Dream 3: "Learn Piano" (creative, no end date)
    - Dream 4: "Build Meaningful Relationships" (personal growth, 365 days left)
    - Dream 5: "Achieve Financial Freedom" (financial, 730 days left)
    - Each dream has: title, vivid description, category, target date
  - [ ] **12-15 Reflections across dreams:**
    - At least 4 reflections per dream (to unlock evolution)
    - Varied tones: Gentle, Intense, Fusion (show diversity)
    - Realistic content: actual thoughtful reflections, not lorem ipsum
    - Dates spread over 30-90 days (show temporal evolution)
    - AI responses: high-quality, insightful, formatted beautifully
  - [ ] **Evolution reports generated:**
    - At least 2 evolution reports (one per dream with 4+ reflections)
    - Show temporal analysis, growth patterns, specific quotes
    - Demonstrate the "aha moment" of seeing your evolution
  - [ ] **Visualizations generated:**
    - At least 1-2 achievement narrative visualizations
    - Show user what unlocks after consistent reflection
  - [ ] **Dashboard fully populated:**
    - Active dreams section: 3-5 cards visible
    - Recent reflections: Last 3 showing with snippets
    - Progress stats: "12 reflections this month" (realistic numbers)
    - Evolution insights preview: Latest evolution snippet
    - Visualization preview: Latest visualization
  - [ ] **Data quality:**
    - All content feels authentic (no placeholder text)
    - Reflections demonstrate depth (200-400 words each)
    - AI responses feel genuinely insightful (using real prompts)
    - Dreams represent diverse life areas (career, health, relationships, growth)
  - [ ] **Demo user UX:**
    - Landing page "See Demo" button logs user into demo account
    - Banner at top: "You're viewing a demo account. Create your own to start reflecting."
    - All features functional (can create new reflection, but data resets daily)
    - "Sign Up for Free" CTA visible in demo banner
  - [ ] **Reset mechanism:**
    - Demo account data resets nightly (prevent spam/abuse)
    - OR demo account read-only (can browse but not edit/create)

#### 5. **About Page: Story, Mission, Trust**
- **Description:** Create compelling About page that builds trust and explains the "why"
- **User story:** As a visitor, I want to understand who built Mirror of Dreams and why it exists so that I can trust it with my personal reflections
- **Acceptance criteria:**
  - [ ] **Founder story:**
    - Who built this and why (personal narrative)
    - The problem they faced that led to Mirror of Dreams
    - "I built this because..." personal motivation
    - Photo of founder (humanizes the product)
  - [ ] **Mission statement:**
    - Clear articulation: "We believe everyone has dreams worth pursuing..."
    - How Mirror of Dreams is different from journaling/therapy/coaching
    - The role of AI: augmenting self-awareness, not replacing human insight
  - [ ] **Product philosophy:**
    - Why reflection matters (backed by research or personal experience)
    - Why AI is the perfect mirror (non-judgmental, pattern-recognizing, available 24/7)
    - Commitment to privacy & data security
  - [ ] **Team section (if applicable):**
    - Founder + key contributors (if any)
    - Photos, brief bios, why they care about this mission
  - [ ] **Values:**
    - Privacy-first: Your reflections are yours (encryption, no selling data)
    - Substance over flash: Depth over decoration
    - Continuous evolution: Product improves based on user feedback
  - [ ] **Call to action:**
    - "Join thousands using Mirror of Dreams to transform their lives"
    - "Start Your Free Account" button
  - [ ] **Design:**
    - Use CosmicBackground for brand consistency
    - GlassCard sections for each story element
    - Personal photos to build connection
    - Gradient headings for visual hierarchy

#### 6. **Enhanced Reflection Form: Beautiful & Welcoming**
- **Description:** Transform reflection form from functional to delightful and encouraging
- **User story:** As a user creating a reflection, I want the form to celebrate my effort and guide me gently so that I feel supported, not interrogated
- **Acceptance criteria:**
  - [ ] **Welcoming introduction:**
    - Before dream selection: "Welcome to your sacred space for reflection. Take a deep breath."
    - After dream selection: "Beautiful choice. Let's explore [Dream Name] together."
  - [ ] **Question presentation enhancement:**
    - Each question card has:
      - Main question (larger, gradient text)
      - Guiding text (already exists, but enhance with warmth)
      - Example prompt toggle: "Need inspiration? See an example"
      - Placeholder text that's encouraging: "Your thoughts are valuable. There's no wrong answer here."
  - [ ] **Character counter redesign:**
    - Display: "X thoughtful words" instead of "X/Y characters"
    - Color states:
      - 0-50%: Subtle white (encouraging to write more)
      - 50-90%: Gold (celebrating your depth)
      - 90-100%: Gentle purple (almost there!)
      - 100%+: NO red warning - instead: "Your reflection is rich. Consider breaking into multiple reflections if needed."
    - Show word count in addition to character count
  - [ ] **Tone selection enhancement:**
    - Tone cards feel like sacred choices, not UI buttons
    - Each tone has:
      - Icon (existing ✨🌸⚡)
      - Name (Fusion, Gentle, Intense)
      - Description (2-3 sentences explaining the experience)
      - Example output style: "Your mirror will speak with..."
    - Hover state: card lifts + preview glow in tone color
  - [ ] **Encouragement throughout:**
    - Auto-save indicator: "Your words are safe" (instead of just "Saving...")
    - Progress indicator shows: "Question 1 of 4 - You're doing great"
    - After completing each question: Subtle checkmark ✓ appears
  - [ ] **Submit button enhancement:**
    - "Gaze into the Mirror" (already great!)
    - On hover: Cosmic glow intensifies
    - After click: "Preparing your reflection..." → "Crafting your insight..." (existing)
    - Loading state feels sacred, not anxious
  - [ ] **Micro-copy throughout:**
    - Every text element reviewed for warmth vs. clinical tone
    - "Your dream" instead of "Dream"
    - "Share your plan" instead of "What is your plan?"
    - "What are you willing to offer?" already perfect
  - [ ] **Accessibility:**
    - All enhancements respect reduced motion preferences
    - Encouragement text not overwhelming for screen readers
    - Keyboard navigation smooth and celebrated (focus states glow)

#### 7. **Individual Reflection Display: Sacred Beauty**
- **Description:** Make past reflections feel precious, beautiful, and worth revisiting
- **User story:** As a user viewing a past reflection, I want it to feel like opening a treasure, not reading a log entry
- **Acceptance criteria:**
  - [ ] **Visual header:**
    - Dream name as large gradient heading
    - Date formatted beautifully: "November 28th, 2025 • Evening Reflection"
    - Tone badge: Glowing pill with tone color (Fusion = purple-gold gradient)
    - Subtle cosmic background unique to each reflection (varies by tone)
  - [ ] **AI response enhancement:**
    - First paragraph larger (1.25rem) to draw reader in
    - Key insights highlighted:
      - Questions the AI asks back to user: Italicized + indented
      - Action items: Purple bullet points with glow
      - Patterns identified: Gold highlighted background
    - Pull quotes: AI's most impactful sentences in larger text, centered, with quotation marks
  - [ ] **User's reflections section:**
    - Above AI response: "Your Reflection" heading
    - Q&A format: Question in gradient purple, answer in white/95
    - Collapsed by default: "Show Your Original Reflection" toggle
    - When expanded: Beautiful formatting, easy to read
  - [ ] **Metadata sidebar (desktop) or footer (mobile):**
    - Word count: "342 thoughtful words"
    - Time spent reflecting: "12 minutes" (if tracked)
    - Related evolution: "Part of your [Dream Name] evolution" with link
  - [ ] **Actions:**
    - "Reflect Again" button (creates new reflection for same dream)
    - "Share Insight" button (future - generates shareable image quote)
    - "Download PDF" button (future - GDPR compliance)
    - "Back to Reflections" link (breadcrumb)
  - [ ] **Reading experience:**
    - Max width 720px (optimal line length)
    - Line height 1.8 (maximum readability)
    - Generous margins and padding
    - No distractions (minimal nav, focus on content)
  - [ ] **Emotional resonance:**
    - Page feels like opening a journal, not viewing a database record
    - Tone-specific color accents (Fusion = purple-gold, Gentle = soft blue, Intense = deep purple)
    - Subtle animations: fade-in on load, glow on action buttons

#### 8. **Pricing Page: Clear Value Proposition**
- **Description:** Create transparent pricing page that explains tier value and converts free users to premium
- **User story:** As a user, I want to understand what I get with each tier so that I can make an informed upgrade decision
- **Acceptance criteria:**
  - [ ] **Tier comparison table:**
    - Free tier:
      - 10 reflections/month
      - 3 active dreams
      - Basic AI insights
      - Evolution reports after 4 reflections
      - Community support
      - Price: $0/month
    - Premium tier:
      - 50 reflections/month
      - 10 active dreams
      - Advanced AI insights (deeper analysis)
      - Priority evolution reports
      - Email support
      - Price: $9.99/month or $99/year (save $20)
    - Pro tier:
      - Unlimited reflections
      - Unlimited dreams
      - Premium AI model (Sonnet 4.5 or better)
      - Custom tone creation (future)
      - Priority support
      - Early access to new features
      - Price: $29.99/month or $299/year (save $60)
    - Creator tier:
      - Everything in Pro
      - API access (future)
      - White-label option (future)
      - Dedicated support
      - Price: Contact for pricing
  - [ ] **Feature details:**
    - Each feature has tooltip/explanation
    - "What are Advanced AI insights?" → Popup explaining difference
    - Visual indicators: ✓ Included, ✗ Not included
  - [ ] **Social proof:**
    - "Join 1,000+ users transforming their dreams" (update number)
    - (Future) Testimonial from premium user: "Premium was worth it because..."
  - [ ] **FAQ section:**
    - "Can I change plans anytime?" Yes, upgrade/downgrade monthly
    - "What happens to my data if I downgrade?" All data preserved, just can't create new reflections beyond limit
    - "Do you offer refunds?" 30-day money-back guarantee
    - "Is my data secure?" End-to-end encryption, zero-knowledge architecture (future goal)
  - [ ] **CTA per tier:**
    - Free: "Start Free" (signup)
    - Premium/Pro: "Start 14-Day Free Trial" (no credit card required)
    - Creator: "Contact Sales"
  - [ ] **Design:**
    - GlassCard per tier
    - Recommended tier highlighted (glowing border + "Most Popular" badge)
    - Responsive: stacks vertically on mobile
    - Annual billing toggle shows savings: "Save 17% with annual billing"

#### 9. **Empty State Enhancements: Guided First Steps**
- **Description:** Transform empty states from barren to inviting and educational
- **User story:** As a new user, I want empty states to guide me on what to do next and why it matters
- **Acceptance criteria:**
  - [ ] **Dashboard empty states:**
    - No dreams:
      - Illustration: Cosmic seed/star illustration (SVG)
      - Headline: "Your journey begins with a dream"
      - Copy: "Dreams are the seeds of transformation. Plant your first dream and watch it grow through reflection."
      - CTA: "Create Your First Dream" (large, glowing button)
      - Secondary: "Not sure where to start? Browse dream examples" (link to examples page or modal)
    - No reflections:
      - Illustration: Mirror/reflection waves
      - Headline: "Your first reflection awaits"
      - Copy: "Reflection is how you water your dreams. Each reflection brings clarity, insight, and progress."
      - CTA: "Reflect Now" (disabled if no dreams, with tooltip: "Create a dream first")
  - [ ] **Dreams page empty:**
    - Illustration: Constellation/starfield
    - Headline: "What do you dream of?"
    - Copy: "Your dreams deserve a home. Whether it's a career goal, personal aspiration, or creative project - start here."
    - Examples: "People use Mirror of Dreams to pursue:"
      - 🚀 Launch a business
      - 💪 Transform their health
      - 🎨 Master a creative skill
      - ❤️ Build deeper relationships
      - 🧘 Find inner peace
    - CTA: "Create Dream" button
  - [ ] **Reflections page empty:**
    - Illustration: Blank journal opening
    - Headline: "Your reflection history will appear here"
    - Copy: "Each reflection becomes part of your story. Create your first one to see your evolution unfold."
    - CTA: "Create Reflection" → takes to dream selection
  - [ ] **Evolution page empty:**
    - Illustration: Progress graph/arrow
    - Headline: "Evolution insights unlock after 4 reflections"
    - Progress indicator: "0/4 reflections" (if user has dreams but no reflections)
    - Copy: "Your AI mirror analyzes patterns across your reflections to show how you're growing. Keep reflecting to unlock this powerful insight."
    - CTA: "Reflect Now"
  - [ ] **Visualizations page empty:**
    - Illustration: Canvas/artwork
    - Headline: "Visualizations bring your journey to life"
    - Copy: "After 4 reflections on a dream, generate beautiful visualizations showing your progress and achievements."
    - Progress: "2/4 reflections on 'Run Marathon'" (if user has reflections but not enough)
    - CTA: "Reflect to Unlock Visualizations"
  - [ ] **Design consistency:**
    - All empty states use EmptyState component with enhancements
    - Illustrations: SVG, cosmic theme, purple/gold accents
    - Copy: Warm, encouraging, specific (not generic)
    - Actions: Clear next step, visually prominent

#### 10. **Reflection Collection Enhancements**
- **Description:** Make browsing past reflections beautiful and functional
- **User story:** As a user with many reflections, I want to browse, filter, and rediscover my reflections easily
- **Acceptance criteria:**
  - [ ] **Filters enhancement:**
    - Dream filter: "All dreams" dropdown with dream names
    - Tone filter: Visual pills (Fusion, Gentle, Intense) with glow on selected
    - Date range: "Last 7 days", "Last 30 days", "Last 90 days", "All time"
    - Sort: "Most recent", "Oldest first", "Longest reflections", "Most insightful" (if rating exists)
  - [ ] **Reflection cards:**
    - Visual design:
      - GlassCard with hover lift + glow
      - Dream badge at top (pill with dream color)
      - Date + time: "3 days ago • Evening"
      - Tone indicator: Small badge (Fusion ✨, Gentle 🌸, Intense ⚡)
      - AI response snippet: First 120 characters with "..." ellipsis
      - Word count: "342 words"
    - Hover state:
      - Card lifts 4px
      - Purple glow intensifies
      - "Read more" appears at bottom
  - [ ] **Pagination:**
    - 20 reflections per page (as per Plan-6)
    - Page numbers at bottom: 1 2 3 ... 8 9 (with current page highlighted)
    - "Previous" / "Next" buttons with disabled states
    - OR infinite scroll with "Load More" button (better UX, needs testing)
  - [ ] **Search functionality (future enhancement noted):**
    - Search bar at top: "Search your reflections..."
    - Full-text search across user answers and AI responses
    - Results highlight matching text
    - Empty state if no matches: "No reflections match '[query]'"

---

### Should-Have (Post-MVP)

1. **Onboarding Flow** - Interactive tutorial for new users (3-step wizard)
2. **Reflection Drafts** - Auto-save incomplete reflections, resume later
3. **Rich Text Editor** - Formatting options (bold, italic, lists) in reflection answers
4. **Reflection Templates** - Pre-written question sets for specific dream types
5. **Analytics Dashboard** - Reflection frequency graphs, word count trends, mood tracking
6. **Export All Data** - Download all reflections as PDF or JSON (GDPR compliance)
7. **API for Premium Users** - Programmatic access to reflection data
8. **Mobile App** - React Native app for iOS/Android (offline reflection)
9. **Collaborative Dreams** - Share dreams with accountability partners (privacy-controlled)
10. **Reflection Reminders** - Email/push notifications to maintain habit

### Could-Have (Future Vision)

1. **Voice Reflections** - Record spoken reflections, AI transcribes + analyzes
2. **AI Chat Mode** - Conversational reflection instead of form-based
3. **Community Features** - Anonymous sharing of insights (opt-in)
4. **Dream Marketplace** - Curated dream templates from coaches/experts
5. **Integration** - Sync with Notion, Obsidian, Roam Research
6. **Reflection Streaks** - Gamification of daily practice (tasteful, not pushy)
7. **Custom Tones** - Train AI on your preferred reflection style
8. **Multi-language Support** - Reflect in any language

---

## User Flows

### Flow 1: New Visitor → Demo Experience → Signup (Primary Conversion)

**Steps:**
1. User visits mirrorofdreams.com
2. **New landing page loads:**
   - Headline: "Transform Your Dreams into Reality Through AI-Powered Reflection"
   - Subheadline explains unique value
   - Two CTAs visible: "Start Free" + "See Demo"
3. User curious but skeptical, clicks **"See Demo"**
4. **Auto-logged into demo account (Alex Chen):**
   - Banner at top: "You're viewing a demo account. Sign up to create your own reflections."
   - Dashboard fully populated:
     - 5 active dreams showing with reflection counts
     - Recent 3 reflections with AI response snippets
     - Progress: "12 reflections this month"
     - Evolution insight preview: "You've grown from uncertainty to clarity on 'Launch SaaS Product'"
5. User clicks on **"Launch SaaS Product" dream card**
6. **Dreams detail page shows:**
   - 4 reflections for this dream
   - Evolution report available (link glows)
   - "Reflect on this dream" CTA
7. User clicks **one of the reflections**
8. **Individual reflection page:**
   - Beautiful header: Dream name, date, tone
   - User's 4 reflection answers (collapsed)
   - AI response: **Insightful, well-formatted, highlights key patterns**
   - User reads and thinks: "Wow, this is actually helpful"
9. User clicks **"Reflect Again"** (curious to try)
10. **Redirected to login:**
    - "The demo account is view-only. Create your free account to start reflecting."
    - Email/password form
    - "Sign Up Free" button
11. User signs up, redirected to **onboarding or dashboard**
12. **Empty dashboard** (their own account):
    - "Your journey begins with a dream" empty state
    - "Create Your First Dream" CTA prominent
13. User creates dream, then creates first reflection
14. **Sees their first AI insight:**
    - Realizes the value, becomes engaged user

**Why this matters:**
- Demo account removes all friction to understanding value
- User experiences the product at its best before committing
- Conversion happens after belief, not before
- **Most important flow for commercial success**

**Edge cases:**
- Demo account data resets daily (prevent abuse)
- If user already has account: "See Demo" logs them out first, then logs into demo
- Demo account has banner: "Try creating content, but it won't save. Sign up to keep your reflections."

### Flow 2: Existing User Returns → Sees Full Dashboard → Reflects

**Steps:**
1. User signs in with email/password
2. **Dashboard loads (populated):**
   - Greeting: "Good evening, Ahiya!"
   - Active dreams: 3 cards showing
   - Recent reflections: Last 3 with snippets
   - Progress: "8 reflections this month"
   - Evolution insight preview (if available)
3. User sees one dream needs attention: "Build Meaningful Relationships - 0 reflections in 14 days"
4. Clicks **"Reflect on this dream"**
5. **Reflection page loads:**
   - Dream pre-selected
   - Welcoming text: "Beautiful choice. Let's explore Build Meaningful Relationships together."
   - 4 questions visible, encouraging placeholder text
6. User fills all 4 questions
7. Selects **Fusion tone** (sees description: "Your mirror will blend gentle encouragement with direct truth")
8. Clicks **"Gaze into the Mirror"**
9. **Loading state:**
   - Cosmic loader with breathing animation
   - "Gazing into the mirror..." → "Crafting your insight..."
   - Feels sacred, not anxious
10. **AI response appears:**
    - Beautifully formatted
    - Key insights highlighted
    - Patterns identified in gold
11. User reads, feels seen, saved
12. Returns to dashboard
13. **Dashboard updated:**
    - Recent reflections now shows new one at top
    - Dream card: "Build Meaningful Relationships - 1 reflection today"
    - Feels sense of progress

**Edge cases:**
- User starts reflection but doesn't finish: Auto-save draft (future)
- User's tier limit reached: Upgrade modal appears
- API timeout: Clear error with retry button

### Flow 3: Free User Hits Limit → Understands Value → Upgrades

**Steps:**
1. Free user creates their 10th reflection of the month
2. Reflection submits successfully
3. **Returns to dashboard, sees banner:**
   - "You've used all 10 free reflections this month! 🎉"
   - "Upgrade to Premium for 50 reflections/month and deeper insights."
   - "Upgrade Now" button + "Learn More" link
4. User clicks **"Learn More"**
5. **Redirected to Pricing page:**
   - Sees tier comparison table
   - Free (current): 10/month, limited
   - Premium: 50/month, advanced AI, $9.99/month
   - Pro: Unlimited, premium model, $29.99/month
6. User reads FAQ: "What are Advanced AI insights?"
7. **Understands value:**
   - Deeper pattern recognition
   - More actionable advice
   - Priority evolution reports
8. User clicks **"Start 14-Day Free Trial"** on Premium
9. **Redirected to checkout:**
   - Enter payment info (Stripe)
   - "You won't be charged until trial ends"
10. Payment processed, user upgraded
11. **Returns to dashboard:**
    - Banner: "Welcome to Premium! You now have 50 reflections/month."
    - Tier badge updated: "Premium ✨"
12. User creates 11th reflection (previously blocked)
13. **Notices AI response is richer:**
    - More detailed analysis
    - Specific action items
    - References to past reflections
14. User feels upgrade was worth it

**Edge cases:**
- User cancels during checkout: Returns to dashboard, remains free
- Payment fails: Clear error, retry options
- User downgrades later: Data preserved, just can't create new reflections beyond limit

### Flow 4: User Manages Account via Profile & Settings

**Steps:**
1. User clicks profile icon in navigation
2. **Profile page loads:**
   - Account info: Name, Email, Member since
   - Tier: Premium ✨
   - Usage: 32/50 reflections this month
3. User wants to change email
4. Clicks **"Change Email"**
5. **Modal appears:**
   - Current email shown (read-only)
   - New email input
   - "We'll send verification to both emails" note
6. User enters new email, submits
7. **Verification emails sent:**
   - Toast: "Verification emails sent. Check your inbox."
   - Email change pending until verified
8. User checks email, clicks verify link
9. **Email updated:**
   - Next login requires new email
10. User clicks **"Settings" in navigation**
11. **Settings page loads:**
    - Notification preferences section
    - Reflection preferences section
    - Display preferences section
12. User toggles **"Reflection reminders: Daily"**
13. **Setting saves immediately:**
    - Toast: "You'll now receive daily reflection reminders at 7pm"
14. User toggles **"Reduce motion: On"**
15. **Page updates:**
    - Animations stop
    - Static transitions only
16. User satisfied, returns to dashboard

**Edge cases:**
- Email already in use: "This email is already registered" error
- User clicks "Delete Account": Scary confirmation modal with password required
- Settings fail to save: Retry button + error message

---

## Data Model Overview

**No significant data model changes required** - This is primarily UI/UX/content creation.

**Key entities remain:**
1. **users** - Add: `preferences` JSONB column for settings storage
2. **dreams** - No changes
3. **reflections** - No changes
4. **evolution_reports** - No changes
5. **visualizations** - No changes

**New additions (minor):**
1. **demo_user** - Special user account with `is_demo: true` flag
2. **user_preferences** - Could be separate table or JSONB column on users
   - notification_email: boolean
   - reflection_reminders: 'daily' | 'weekly' | 'off'
   - default_tone: 'fusion' | 'gentle' | 'intense'
   - reduce_motion_override: boolean | null (null = respect browser)

---

## Technical Requirements

**Must support:**
- Existing Next.js 14 App Router architecture (no changes)
- Existing tRPC API (add profile/settings mutations)
- Existing Supabase PostgreSQL (minor schema additions)
- Existing Framer Motion (respect reduced motion)
- React Markdown (already in place from Plan-6)
- Existing design system (extend, don't replace)

**New dependencies (minimal):**
- None required - all features achievable with existing stack

**Constraints:**
- No breaking changes to existing features
- Backward compatible with existing user data
- Performance budget maintained: LCP <2.5s, FID <100ms
- Bundle size: Keep increase under 30KB total

**Preferences:**
- Reuse existing components (GlassCard, GlowButton, EmptyState)
- Extend variants.ts for new animations
- Use CSS custom properties from variables.css
- Follow patterns established in Plan-6

---

## Success Criteria

**The Plan-7 MVP is successful when:**

1. **Landing Page Converts: 8/10**
   - Metric: Visitor → Demo click rate >30%
   - Metric: Demo → Signup conversion >15%
   - Target: Clear value proposition, compelling copy, working demo access
   - Measurement: Analytics tracking on CTAs

2. **Demo User Shows Full Value: 10/10**
   - Metric: Demo account has 5 dreams, 12+ reflections, 2 evolution reports
   - Target: Stakeholder can experience product in <2 minutes
   - Measurement: Manual review of demo account content quality

3. **Profile & Settings Pages Complete: 9/10**
   - Metric: All account management functions accessible
   - Target: Users can edit profile, change settings, see usage stats
   - Measurement: Manual testing of all profile/settings features

4. **Reflection Experience Welcoming: 8/10**
   - Metric: Micro-copy reviewed for warmth, encouragement added
   - Target: Users report feeling "supported" not "interrogated"
   - Measurement: User feedback surveys

5. **Individual Reflections Beautiful: 9/10**
   - Metric: AI insights highlighted, visual hierarchy clear
   - Target: Users revisit past reflections (measured by views)
   - Measurement: Analytics on reflection detail page visits

6. **Empty States Guide Action: 9/10**
   - Metric: Every empty state has clear CTA and warm copy
   - Target: <5 second time-to-understand-next-action
   - Measurement: User testing observations

7. **About Page Builds Trust: 8/10**
   - Metric: Visitor time-on-page >45 seconds
   - Target: Clear founder story, mission, values
   - Measurement: Analytics + qualitative feedback

8. **Pricing Page Clarifies Value: 8/10**
   - Metric: Free → Premium upgrade rate >5%
   - Target: Transparent pricing, clear tier differences
   - Measurement: Stripe dashboard conversion funnel

9. **Product Feels Complete: 9/10**
   - Metric: Zero 404 pages, all navigation links work
   - Target: No "coming soon" placeholders, all pages functional
   - Measurement: Manual site audit

10. **Overall Product Quality: 9/10**
    - Metric: Stakeholder (Ahiya) satisfaction score
    - Target: "I'm proud to show this to anyone"
    - Measurement: Subjective assessment after full testing

---

## Out of Scope (For Plan-7)

**Explicitly not included in this plan:**

- Mobile native apps (iOS/Android) - Web-only for now
- API access for developers - Premium feature for later
- White-label options - Creator tier feature for later
- Advanced analytics dashboard - Post-MVP
- Reflection drafts auto-save - Nice-to-have, not critical
- Voice reflection recording - Future innovation
- Community/sharing features - Social features come later
- Multi-language support - English-only for MVP
- Custom AI tone training - Advanced feature
- Integration with third-party tools (Notion, etc.) - Post-MVP
- Email notification system - Backend infrastructure needed
- Payment handling - Use existing Stripe setup (minimal changes)

**Why:** Plan-7 is about **completing the core product experience** - all pages functional, demo account showing value, empty states guiding users. Advanced features come after product-market fit is validated.

---

## Assumptions

1. Existing authentication system works (Supabase Auth)
2. Stripe integration functional for payment handling
3. Demo account can be created manually or via seed script
4. About page content will be provided by Ahiya (founder story)
5. Pricing tiers already defined in database schema
6. Email sending infrastructure exists (for verification, reminders)
7. Analytics already integrated (Google Analytics or PostHog)
8. Design system from Plan-6 is solid foundation
9. Users access primarily via desktop/laptop (mobile responsive but not primary)
10. Budget allows for 2-3 weeks of focused development

---

## Open Questions

1. **Demo account reset frequency:** Nightly reset or read-only? (Recommendation: Read-only to prevent abuse)
2. **About page: Single founder or team?** (Recommendation: Honest answer - if solo, say so)
3. **Pricing: Exact tier limits?** (Recommendation: Review current schema, ensure alignment)
4. **Profile photo upload:** Include in Plan-7 or later? (Recommendation: Later - not critical for completeness)
5. **Settings: How many preferences?** (Recommendation: Start minimal - 5-6 settings, expand based on feedback)
6. **Empty states: Custom illustrations or use existing cosmic theme?** (Recommendation: Cosmic theme for consistency, custom SVG later)
7. **Reflection form: How much encouragement is too much?** (Recommendation: Test with Ahiya, iterate based on feel)

---

## Implementation Strategy

### Phase 1: Demo User & Landing Page (Days 1-4)
**Priority:** P0 - Highest value, enables evaluation

1. **Create demo user account:**
   - Seed script: 5 dreams, 12-15 reflections (high quality)
   - Generate evolution reports (run AI on demo data)
   - Generate visualizations
   - Test demo login flow
2. **Rebuild landing page:**
   - New hero section (headline, subheadline, dual CTAs)
   - Replace feature cards with real value stories
   - Add screenshots/visuals of populated dashboard
   - Footer with working links
   - Mobile responsive testing
3. **Test demo flow:**
   - Landing → See Demo → Explore → Sign Up
   - Verify all demo content displays beautifully
   - Ensure auto-login works smoothly

**Why first:** Demo user is the single most important feature for stakeholder validation and user conversion. Landing page is the gateway.

### Phase 2: Profile & Settings Pages (Days 4-7)
**Priority:** P0 - Core product completeness

1. **Build Profile page:**
   - Account info section (display + edit)
   - Tier & subscription info
   - Usage statistics
   - Account actions (change email/password, delete account)
2. **Build Settings page:**
   - Notification preferences
   - Reflection preferences
   - Display preferences (reduce motion override)
   - Privacy settings
3. **Backend mutations:**
   - updateUserProfile
   - changeEmail (with verification)
   - changePassword
   - updatePreferences
   - deleteAccount
4. **Navigation links:**
   - Add Profile link to nav dropdown
   - Add Settings link to nav dropdown

**Why second:** Users need self-service account management. These pages are table stakes for any complete product.

### Phase 3: About & Pricing Pages (Days 7-9)
**Priority:** P1 - Trust & conversion

1. **Create About page:**
   - Founder story (content from Ahiya)
   - Mission statement
   - Product philosophy
   - Values
   - Call to action
2. **Create Pricing page:**
   - Tier comparison table
   - Feature explanations (tooltips)
   - FAQ section
   - CTA per tier
   - Annual billing toggle
3. **Update footer links:**
   - About, Pricing links now active
   - Privacy & Terms (if pages exist)

**Why third:** About page builds trust, Pricing page drives conversion. Both essential for commercial viability but lower priority than core UX.

### Phase 4: Reflection Form Enhancements (Days 9-12)
**Priority:** P1 - Experience quality

1. **Add welcoming micro-copy:**
   - Introduction before dream selection
   - Encouragement after dream selection
   - Guiding text enhancements
2. **Redesign character counter:**
   - Word count display
   - Color states (white → gold → purple)
   - Encouraging messages
3. **Enhance tone selection:**
   - Add descriptions to each tone card
   - Improve hover states
   - Example output style preview
4. **Progress indicator enhancement:**
   - "You're doing great" encouragement
   - Checkmarks after completing questions
5. **Test for warmth:**
   - Review all copy with Ahiya
   - Ensure balance: supportive but not overwhelming

**Why fourth:** Reflection form is the core interaction. Make it beautiful and encouraging.

### Phase 5: Individual Reflection & Collection Enhancements (Days 12-15)
**Priority:** P1 - Experience depth

1. **Enhance individual reflection display:**
   - Visual header (dream, date, tone)
   - AI response highlighting (key insights, pull quotes)
   - User reflections section (collapsible)
   - Metadata sidebar/footer
   - Actions (Reflect Again, Share, Download)
2. **Enhance reflections collection:**
   - Improve filters (dream, tone, date range)
   - Redesign reflection cards (hover states, visual hierarchy)
   - Pagination or infinite scroll
3. **Test reading experience:**
   - Verify typography perfect (line height, width, spacing)
   - Ensure AI insights stand out
   - Mobile responsiveness

**Why fifth:** Revisiting past reflections is critical for seeing growth. Make it beautiful.

### Phase 6: Empty State Redesign (Days 15-17)
**Priority:** P1 - Onboarding experience

1. **Redesign all empty states:**
   - Dashboard (no dreams, no reflections)
   - Dreams page
   - Reflections page
   - Evolution page
   - Visualizations page
2. **Add illustrations:**
   - Cosmic-themed SVG or subtle animations
   - Consistent visual language
3. **Write warm copy:**
   - Specific, actionable, encouraging
   - No generic "No items found" messages
4. **Test guidance:**
   - New user flow: do empty states guide clearly?
   - Time to first action: <30 seconds

**Why sixth:** Empty states are the first-time user experience. They must guide and invite.

### Phase 7: QA & Polish (Days 17-20)
**Priority:** P0 - Ship confidence

1. **Comprehensive testing:**
   - All user flows end-to-end
   - Profile & settings mutations
   - Demo account experience
   - Mobile responsiveness
   - Cross-browser (Chrome, Firefox, Safari, Edge)
2. **Copy review:**
   - All new pages reviewed for tone, clarity
   - No marketing speak, no fluff
   - Consistent voice throughout
3. **Accessibility audit:**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader testing
4. **Performance check:**
   - Lighthouse audits (all pages >90)
   - Bundle size verify (<30KB increase)
   - LCP <2.5s on all pages
5. **Bug fixes:**
   - Address all P0/P1 bugs found in testing
   - Polish visual inconsistencies
6. **Stakeholder review:**
   - Ahiya tests complete product
   - Feedback incorporated
   - Final sign-off

**Why last:** Ensure everything works perfectly before calling it complete.

### Estimated Timeline
- **Total:** ~3 weeks (20 working days)
- **Phase 1 (Demo & Landing):** 4 days
- **Phase 2 (Profile & Settings):** 3 days
- **Phase 3 (About & Pricing):** 2 days
- **Phase 4 (Reflection Form):** 3 days
- **Phase 5 (Reflection Display):** 3 days
- **Phase 6 (Empty States):** 2 days
- **Phase 7 (QA & Polish):** 3 days

---

## Next Steps

- [ ] Review vision with Ahiya (stakeholder approval)
- [ ] Gather content for About page (founder story, mission)
- [ ] Finalize pricing tier limits (confirm with schema)
- [ ] Create demo user seed script (5 dreams, 12-15 reflections)
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning & Execution
**Focus:** Completion. Demonstration. Commercial viability.

---

## Design Philosophy

> "Mirror of Dreams must feel COMPLETE - not almost there, not 80% done, not 'we'll add that later.' Every visitor, every stakeholder, every user should experience a product that stands on its own, demonstrates its value immediately, and earns trust through substance and beauty. The demo user is our best salesperson. The About page is our heart. The empty states are our welcome mat. No detail is too small when transformation is the promise."

**Guiding principles:**
1. **Demo-first:** If a feature can't be demonstrated via demo user, defer it
2. **Complete over perfect:** 9/10 complete beats 10/10 incomplete
3. **Substance AND style:** Beautiful UX that delivers genuine insight
4. **Trust through transparency:** About page, Pricing page, honest copy
5. **Guide, don't assume:** Empty states teach, micro-copy encourages
6. **Honor the user:** Profile management, settings control = respect

---

**This vision transforms Mirror of Dreams from a functional tool (6.5/10) into a complete, trustworthy, demonstrable sanctuary (9/10) - ready for users, stakeholders, and the world.**
