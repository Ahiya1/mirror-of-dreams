# Mirror of Dreams: Essence Vision

**Created:** 2025-11-12
**Plan:** plan-3
**Focus:** Turn the magical core into a working, cohesive product

---

## The Essence

Mirror of Dreams is a **soft, glossy, sharp AI companion** that helps you see how you connect to your dreams and helps you connect to them better.

You reflect. The mirror shows you patterns. You visualize. You evolve.

**This is not a productivity tool. This is a consciousness companion.**

---

## The Core Experience Loop

```
Create Dream → Reflect → See Dashboard → Generate Insights → Visualize → Evolve
     ↑                                                                      ↓
     └──────────────────── Return with new awareness ─────────────────────┘
```

### What Users Experience

1. **They name their dream** - "Launch Sustainable Fashion Brand"
2. **They reflect regularly** - Every few days, answer 5 deep questions
3. **They see their journey** - Dashboard shows growth visually
4. **They generate evolution** - After 4 reflections, AI reveals patterns
5. **They visualize achievement** - See the dream as already realized
6. **They transform** - The relationship with the dream evolves

---

## The Feeling

### Soft
- Gentle, nurturing, understanding tone
- No judgment, only recognition
- "Your relationship with uncertainty is transforming from fear into curiosity"

### Glossy
- Beautiful cosmic glass aesthetics
- Polished, premium UI
- Smooth animations that evoke wonder
- Mirror shards, floating elements, ethereal glow

### Sharp
- Precise insights that cut through self-deception
- Authentic pattern recognition
- "You're not preparing to create—you're remembering you already are"

### Companion
- Feels alive, not mechanical
- Knows your journey
- Reflects truth with compassion
- Always available, never pushy

---

## MVP Features (Priority Order)

### 1. Authentication & Onboarding
**Must Have:**
- Sign up with email/password
- Sign in with email/password
- 3-step onboarding explaining dreams, reflections, and free tier
- Admin user with is_admin and is_creator flags

**Success:**
- User can create account in <30 seconds
- Onboarding feels magical, not tedious
- Admin can access all features

---

### 2. Dreams Management
**Must Have:**
- Create dream: title, description, optional target date, category
- View all dreams in dashboard
- Dream cards show: title, days left, reflection count
- Simple status: active/achieved/archived
- Edit dream details
- Archive/unarchive dreams

**Success:**
- Creating a dream feels intentional and special
- Dashboard shows all dreams at a glance
- Each dream card is beautiful and informative

**Out of Scope for MVP:**
- Dream sharing
- Dream templates
- Complex filtering
- Dream analytics beyond reflection count

---

### 3. The 5-Question Reflection Flow
**Must Have:**
- Step-by-step form with 5 questions:
  1. What is your dream?
  2. What is your plan?
  3. Have you set a date?
  4. What's your relationship with this dream?
  5. What are you willing to give in return?
- Tone selection: Sacred Fusion (only tone in MVP)
- AI generates reflection using Claude Sonnet 4
- Beautiful display of AI response
- Save reflection to database linked to dream
- Usage tracking (count against tier limits)

**Success:**
- Flow feels sacred and intentional, not transactional
- AI responses feel personal and insightful
- User wants to read their reflection multiple times

**Out of Scope for MVP:**
- Multiple tones (Gentle/Intense)
- Editing past reflections
- Reflection templates
- Voice input

---

### 4. Dashboard (Central Hub)
**Must Have:**
- Greeting with user name and days active
- "Reflect Now" prominent button
- **Your Dreams** section:
  - Cards for each active dream
  - Shows: title, days left, reflection count
  - Quick actions: Reflect, Evolution, Visualize
  - Add new dream button
- **Recent Reflections** section:
  - Last 3 reflections across all dreams
  - Preview of content
  - Link to full reflection
- **Plan & Limits** section:
  - Current tier (Free/Optimal)
  - This month's usage:
    - Reflections: X / Y
    - Evolution reports: X / Y
    - Visualizations: X / Y
  - Progress bars showing usage
  - Upgrade button if on Free tier
- **Insights** section:
  - Latest evolution report preview
  - Link to view all reports

**Success:**
- Dashboard feels like home
- Everything important is visible without scrolling
- One-click access to core actions
- User understands their progress and limits

**Out of Scope for MVP:**
- Complex analytics
- Activity feed
- Notifications
- Calendar view
- Goal tracking beyond reflections

---

### 5. Evolution Reports (Dream-Specific Only)
**Must Have:**
- Generate after 4+ reflections on a dream
- Fixed threshold: 4 reflections (same for all tiers)
- Context quality varies by tier:
  - Free: 4 reflections analyzed
  - Optimal: 9 reflections analyzed
- Temporal distribution (1/3 early, 1/3 middle, 1/3 recent)
- AI analyzes growth patterns with extended thinking (Optimal tier)
- Beautiful markdown display with:
  - Growth patterns identified
  - Language evolution
  - Consciousness shifts
  - Action orientation changes
  - Key insights
- Monthly limits:
  - Free: 1 report/month
  - Optimal: 6 reports/month
- Save report to database
- View all past reports for a dream

**Success:**
- Report feels revelatory, not generic
- User recognizes themselves in the analysis
- Patterns detected feel authentic
- Report is shareable/downloadable

**Out of Scope for MVP:**
- Cross-dream (dream-agnostic) reports
- Custom report parameters
- Report editing
- PDF export (just markdown for now)

---

### 6. Visualizations (Dream-Specific Only)
**Must Have:**
- Generate after 4+ reflections on a dream
- Achievement narrative style (experience dream as achieved)
- Written from future-self perspective
- AI uses same temporal context as evolution reports
- Beautiful display of narrative
- Monthly limits:
  - Free: 1 visualization/month
  - Optimal: 6 visualizations/month
- Save to database
- View all past visualizations

**Success:**
- Visualization feels immersive and real
- User can "feel" the achieved dream
- Narrative pulls from actual reflection content
- It's emotionally moving

**Out of Scope for MVP:**
- Journey style visualizations
- Synthesis style visualizations
- Cross-dream visualizations
- AI-generated artwork (image generation)
- Audio versions

---

### 7. Tier System (Simple)
**Must Have:**
- Two tiers only: Free and Optimal
- Free tier:
  - 2 dreams
  - 4 reflections/month
  - 1 evolution report/month
  - 1 visualization/month
  - Context: 4 reflections for reports
  - No extended AI thinking
- Optimal tier ($19/month):
  - 7 dreams
  - 30 reflections/month
  - 6 evolution reports/month
  - 6 visualizations/month
  - Context: 9 reflections for reports
  - Extended AI thinking enabled
- Usage tracking resets monthly
- Clear upgrade prompts when limits reached
- Tier limits enforced on all actions

**Success:**
- Free tier gives real value, not just a teaser
- Optimal tier feels worth $19/month
- Upgrade path is clear and compelling
- No confusion about limits

**Out of Scope for MVP:**
- Essential tier
- Premium tier
- Annual billing
- Subscription management UI
- Payment integration (Stripe)
- Actual billing (just tier simulation for now)

---

### 8. Cosmic Glass UI
**Must Have:**
- Use existing glass components:
  - GlassCard
  - GlowButton
  - GradientText
  - AnimatedBackground
  - CosmicLoader
  - ProgressOrbs
- Consistent aesthetic throughout
- Dark theme with glass morphism
- Floating mirror shard elements
- Smooth transitions and animations
- Responsive design (desktop focus, mobile acceptable)

**Success:**
- Every page feels magical
- UI is cohesive and polished
- Loading states are beautiful, not jarring
- Interactions feel smooth and delightful

**Out of Scope for MVP:**
- Light theme
- Custom themes
- Mobile-specific optimizations
- Accessibility beyond basics

---

## The One Perfect User Journey

**Sarah's Journey (This MUST work perfectly):**

### Day 0: Discovery & Setup (15 minutes)
1. Sarah visits mirrorofdreams.app
2. Sees beautiful landing page with cosmic aesthetic
3. Clicks "Start Free"
4. Signs up in 20 seconds (name, email, password)
5. Completes 3-step onboarding (90 seconds)
6. Creates first dream: "Launch Sustainable Fashion Brand"
   - Fills title, description, target date (Dec 31, 2025)
   - Sees it appear in dashboard
7. Clicks "Reflect Now"
8. Completes 5-question reflection
9. Sees beautiful AI response (Sacred Fusion tone)
10. Returns to dashboard, sees her dream with "1 reflection"

### Day 2: Building Rhythm (5 minutes)
1. Sarah returns, sees dashboard greeting: "Welcome back, Sarah"
2. Clicks "Reflect" on fashion brand dream
3. Completes second reflection
4. Notices: "2 more reflections to unlock evolution report"

### Day 4: Third Reflection (5 minutes)
1. Returns, reflects again
2. Sees: "1 more reflection to unlock evolution report"

### Day 6: Breakthrough Moment (15 minutes)
1. Completes 4th reflection
2. Dashboard shows: "✨ Evolution Report Available!"
3. Clicks "Generate Evolution Report"
4. Waits 30 seconds (beautiful loading state)
5. Reads 5-minute report analyzing her 4 reflections:
   - "Your language shifted from 'I want to' to 'I am'"
   - "Notice how your relationship with fear evolved"
   - Specific patterns from her actual reflections
6. Feels seen and understood
7. Clicks "Generate Visualization"
8. Reads achievement narrative: "December 31, 2025: I'm standing in my studio..."
9. Feels the dream as real
10. **This is the magic moment—she's hooked**

### Day 8: Tier Decision (2 minutes)
1. Tries to create 5th reflection in first month
2. Sees: "You've reached Free tier limit (4/4 reflections)"
3. Sees Optimal tier benefits
4. Decides to upgrade (or continues with Free)

---

## Technical Requirements

### Database
- Supabase PostgreSQL
- Tables needed:
  - users (with tier, is_admin, is_creator flags)
  - dreams (with target_date, days_left, category, status)
  - reflections (linked to dream_id)
  - evolution_reports (linked to dream_id, report_type)
  - visualizations (linked to dream_id)
  - monthly_usage_tracking (per user, per month)
- Row Level Security for user data isolation
- Admin can see all data

### Backend (tRPC API)
- TypeScript with tRPC for type-safe RPC
- Routes:
  - auth.signup, auth.signin
  - dreams.create, dreams.list, dreams.update
  - reflections.create, reflections.list
  - evolution.generate, evolution.list
  - visualizations.generate, visualizations.list
  - usage.getCurrent
- Business logic:
  - Tier limit checking
  - Usage tracking
  - Temporal context distribution
  - Threshold eligibility checks
- AI integration:
  - Anthropic Claude Sonnet 4 API
  - Extended thinking for Optimal tier
  - Token usage tracking

### Frontend (Next.js)
- TypeScript + React
- Pages:
  - / (landing)
  - /signup, /signin
  - /onboarding
  - /dashboard (main hub)
  - /reflect/[dreamId]
  - /dreams/[dreamId]
  - /evolution/[reportId]
  - /visualizations/[vizId]
- State management: Zustand (simple)
- API calls: tRPC client
- Forms: React Hook Form + Zod
- UI: Existing glass components + Tailwind

### Deployment
- Vercel for Next.js app
- Supabase cloud for database
- Environment variables for API keys

---

## Success Criteria

### The MVP is complete when:

1. **Sarah's journey works perfectly end-to-end**
   - She can sign up, onboard, create dream, reflect 4 times, generate evolution & visualization
   - Every step feels magical, not utilitarian
   - The AI responses feel personal and insightful

2. **The dashboard is the central hub**
   - Everything important is visible
   - One-click access to core actions
   - Usage limits are clear
   - It feels like home, not a menu

3. **The UI is cohesive and magical**
   - Cosmic glass aesthetic throughout
   - Smooth animations
   - Loading states are beautiful
   - No jarring transitions
   - Feels premium on Free tier

4. **Admin user works**
   - ahiya.butman@gmail.com can sign in
   - Has access to admin features (if any)
   - Can create dreams, reflect, generate reports

5. **Technical quality**
   - TypeScript compilation passes
   - No console errors
   - All core flows tested
   - Deployable to Vercel
   - Database migrations work

6. **The magic is real**
   - A first-time user feels wonder
   - Evolution reports reveal genuine insights
   - Visualizations are emotionally moving
   - Users want to return and reflect again

---

## Explicitly Out of Scope

**Not building in MVP:**
- ❌ Cross-dream (dream-agnostic) analysis
- ❌ Multiple tones (Gentle/Intense)
- ❌ Stripe payment integration
- ❌ Subscription management
- ❌ Admin panel UI
- ❌ Social features (sharing, community)
- ❌ Mobile app
- ❌ Email notifications
- ❌ Calendar integrations
- ❌ Dream templates
- ❌ Reflection editing
- ❌ Complex analytics
- ❌ AI-generated image artwork
- ❌ Journey/Synthesis visualization styles
- ❌ Essential/Premium tiers
- ❌ PDF export
- ❌ Dark/light theme toggle

**Why:** These are all valuable, but they're not the essence. The essence is:
- Create dream → Reflect → See growth → Visualize → Evolve

Get that loop perfect. Make it magical. Then expand.

---

## Current State Assessment

Based on plan-1's progress (3 iterations complete), we likely have:
- ✅ Database schema
- ✅ Basic tRPC setup
- ✅ Some auth flow
- ✅ UI components (glass aesthetic)
- ⚠️ Dreams CRUD might be partial
- ⚠️ Reflection flow might be incomplete
- ⚠️ Dashboard might not be cohesive
- ❌ Evolution reports might not work end-to-end
- ❌ Visualizations might not work
- ❌ Admin user doesn't exist yet

**Plan-3 Mission:** Make it work end-to-end. Make it cohesive. Make it magical.

---

## Open Questions for Implementation

1. **What's actually working right now?**
   - Does auth work end-to-end?
   - Can users create dreams and reflect?
   - Is the AI integration functional?

2. **What needs fixing?**
   - Broken flows?
   - Incomplete features?
   - UI inconsistencies?

3. **What's missing entirely?**
   - Evolution report generation?
   - Visualization generation?
   - Usage tracking?

**2L will explore and discover this during planning phase.**

---

## Next Steps

1. ✅ Vision complete (this document)
2. ⏭️ Create admin user (ahiya.butman@gmail.com / dream_lake)
3. ⏭️ Run `/2l-mvp` to execute plan-3
4. ⏭️ 2L will:
   - Explore current state
   - Plan iterations to close gaps
   - Build/fix/integrate
   - Validate end-to-end
   - Deliver working, cohesive product

---

**Vision Status:** VISIONED
**Ready for:** `/2l-mvp` execution
**Focus:** Essence over completeness, magic over features
**Goal:** One perfect user journey that works end-to-end
