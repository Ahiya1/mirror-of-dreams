# Mirror of Dreams - Multi-Session Execution Plan (1.5L)

## Overview
This plan breaks down the implementation of both visions into sequential, manageable sessions. Each session will be executed by a single agent, produce a report, and move to the next.

**Vision Goals:**
- **Plan 1**: Complete user experience with all features (auth, dreams, reflections, evolution, visualizations, subscriptions)
- **Plan 2**: Beautiful, magical UI with glassmorphism, gradients, and animations

**Current State Assessment:**
✅ Next.js 14 app structure exists
✅ tRPC backend with all main routers (auth, dreams, reflections, evolution, visualizations, subscriptions)
✅ Supabase integration
✅ Basic pages exist for all main features
✅ Some UI components (GlassCard, GlowButton, AnimatedBackground)
✅ Framer Motion installed
✅ Tailwind configured

🔧 Needs Work:
- Complete backend implementation for all vision features
- Full frontend redesign with magical UI
- Missing features: onboarding, tier limits enforcement, temporal context distribution
- Dashboard needs full rebuild
- Reflection flow needs enhancement
- Evolution & visualization generation logic
- Subscription management UI

---

## Session Breakdown (Sequential Execution)

### SESSION 1: Design System Foundation
**Goal:** Establish the complete UI foundation for magical interface

**Tasks:**
1. Update `tailwind.config.ts` with full mystical color palette and custom utilities
2. Create all reusable components:
   - `<GlassCard>` - Enhanced with variants
   - `<GlowButton>` - All button variants
   - `<CosmicLoader>` - Beautiful loading states
   - `<DreamCard>` - Dream display with glow effects
   - `<GradientText>` - Animated gradient text
   - `<GlassModal>` - Enhanced modal system
   - `<FloatingNav>` - Glass navigation
   - `<ProgressOrbs>` - Multi-step indicators
   - `<GlowBadge>` - Status badges
   - `<AnimatedBackground>` - Cosmic backgrounds
3. Create animation variants library in `lib/animations.ts`
4. Set up global CSS for glass effects and gradients in `styles/globals.css`
5. Test all components in `/design-system` page

**Deliverables:**
- Updated Tailwind config
- 10 reusable UI components
- Animation library
- Design system documentation
- Working demo page

**Report:** `SESSION-1-REPORT.md`

---

### SESSION 2: Authentication & Onboarding
**Goal:** Complete auth flow with beautiful onboarding experience

**Tasks:**
1. **Backend:**
   - Enhance `server/trpc/routers/auth.ts` with signup/signin logic
   - Add onboarding tracking to user model
   - Implement JWT token generation and validation
   - Add tier initialization on signup

2. **Frontend:**
   - Redesign `/auth/signin/page.tsx` with glass UI
   - Redesign `/auth/signup/page.tsx` with glass UI
   - Create 3-step onboarding flow component
   - Implement onboarding completion tracking
   - Add password strength indicator
   - Add loading states with cosmic loader

**Deliverables:**
- Working signup/signin with validation
- Beautiful onboarding (3 steps)
- JWT authentication
- User tier initialization
- Auth state management

**Report:** `SESSION-2-REPORT.md`

---

### SESSION 3: Dreams Management System
**Goal:** Complete dream CRUD with magical UI

**Tasks:**
1. **Backend (`server/trpc/routers/dreams.ts`):**
   - `create` - with tier limit checks
   - `list` - with filtering by status
   - `get` - with full details and stats
   - `update` - edit dream details
   - `updateStatus` - change status (active/achieved/archived)
   - `delete` - soft delete
   - Add days_left calculation
   - Add reflection count aggregation

2. **Frontend:**
   - Redesign `/dreams/page.tsx` with masonry grid
   - Enhance `<DreamCard>` with hover effects, gradient borders
   - Redesign `<CreateDreamModal>` with multi-step form
   - Build `/dreams/[id]/page.tsx` detail view
   - Add category selection with icons
   - Add date picker with visual feedback
   - Implement dream status badges with glow

**Deliverables:**
- Full dream CRUD operations
- Beautiful dreams list page
- Enhanced create modal
- Dream detail page with analytics
- Tier limit enforcement

**Report:** `SESSION-3-REPORT.md`

---

### SESSION 4: Reflection Flow Enhancement
**Goal:** Beautiful 5-question reflection experience with AI generation

**Tasks:**
1. **Backend (`server/trpc/routers/reflection.ts`):**
   - `create` - with tier limit checks
   - Implement AI prompt assembly (from `server/lib/prompts.ts`)
   - Add tone selection (gentle/intense/fusion)
   - Implement extended thinking for premium tiers
   - Add cost calculation and tracking
   - Save reflection with metadata

2. **Frontend:**
   - Redesign `/reflection/page.tsx` with progress orbs
   - Enhance `<QuestionStep>` with glass inputs and focus glow
   - Redesign `<ToneSelection>` with visual cards
   - Build dream selection screen with visual cards (not dropdown)
   - Add cosmic loading animation during AI generation
   - Redesign `/reflection/output/page.tsx` with gradient text
   - Add character counters with visual feedback
   - Implement smooth step transitions

**Deliverables:**
- Beautiful 5-question flow
- AI-powered reflection generation
- Tone selection with previews
- Cosmic loading states
- Output display with gradient formatting
- Usage tracking

**Report:** `SESSION-4-REPORT.md`

---

### SESSION 5: Reflections List & Management
**Goal:** View and manage all reflections with beautiful UI

**Tasks:**
1. **Backend (`server/trpc/routers/reflections.ts`):**
   - `list` - paginated, filterable by dream
   - `get` - single reflection detail
   - `delete` - soft delete
   - Add search functionality
   - Add sorting options

2. **Frontend:**
   - Redesign `/reflections/page.tsx` with timeline view
   - Build `/reflections/[id]/page.tsx` detail view
   - Add filter by dream dropdown
   - Add date range filters
   - Implement search
   - Add export functionality (PDF/text)
   - Create reflection card component with glass effect

**Deliverables:**
- Reflections list with filters
- Individual reflection detail page
- Search and sort functionality
- Export options
- Beautiful timeline view

**Report:** `SESSION-5-REPORT.md`

---

### SESSION 6: Evolution Reports System
**Goal:** Temporal context distribution and evolution report generation

**Tasks:**
1. **Backend:**
   - Enhance `server/lib/temporal-distribution.ts` with the 1/3-1/3-1/3 algorithm
   - Implement `server/trpc/routers/evolution.ts`:
     - `generateReport` - dream-specific and cross-dream
     - `checkEligibility` - verify thresholds (4 for dream, 12 for cross)
     - `list` - get all reports
     - `get` - single report detail
   - Add tier-based context limits (free: 4/0, essential: 6/12, optimal: 9/21, premium: 12/30)
   - Implement extended thinking for optimal/premium
   - Add monthly limit tracking
   - Implement AI prompt for evolution analysis

2. **Frontend:**
   - Redesign `/evolution/page.tsx` with report cards
   - Build `/evolution/[id]/page.tsx` detail view
   - Create report generation modal with preview
   - Add eligibility indicators on dashboard
   - Implement pattern detection display
   - Add download/share functionality
   - Show temporal distribution visualization

**Deliverables:**
- Temporal context distribution working
- Dream-specific evolution reports
- Cross-dream analysis
- Beautiful report display
- Eligibility tracking
- Monthly limits enforcement

**Report:** `SESSION-6-REPORT.md`

---

### SESSION 7: Visualizations System
**Goal:** Achievement narratives and visual artifacts

**Tasks:**
1. **Backend (`server/trpc/routers/visualizations.ts`):**
   - `generate` - dream-specific and cross-dream
   - `list` - get all visualizations
   - `get` - single visualization detail
   - Implement visualization styles (achievement/journey/synthesis)
   - Add artifact generation (using GPT-4o or similar)
   - Add temporal context distribution (same as evolution)
   - Track monthly limits

2. **Frontend:**
   - Redesign `/visualizations/page.tsx` with visual cards
   - Build `/visualizations/[id]/page.tsx` display
   - Create style selection interface with large icons
   - Build visualization display with full-width container
   - Add background gradient matching visualization
   - Implement download for narrative and artwork

**Deliverables:**
- Visualization generation (3 styles)
- Artifact creation
- Beautiful display pages
- Download functionality
- Monthly limits

**Report:** `SESSION-7-REPORT.md`

---

### SESSION 8: Dashboard Redesign
**Goal:** Central hub showing everything at a glance

**Tasks:**
1. **Backend:**
   - Create `server/trpc/routers/dashboard.ts`:
     - `getData` - aggregate all dashboard info
     - Current month usage
     - Active dreams with capabilities
     - Recent reflections
     - Latest evolution report
     - Cross-dream capabilities

2. **Frontend:**
   - Complete redesign of `/dashboard/page.tsx`
   - Hero section with gradient greeting
   - Animated stats cards (dreams count, reflections count)
   - Glass "Reflect Now" CTA with pulsing glow
   - Recent reflections timeline
   - Usage card with progress rings
   - Dreams card with quick actions
   - Evolution insights preview
   - Subscription card
   - Visual hierarchy with grid layout

**Deliverables:**
- Aggregated dashboard data
- Beautiful hero section
- Animated stats
- Usage visualization
- Quick actions
- Activity timeline

**Report:** `SESSION-8-REPORT.md`

---

### SESSION 9: Subscription & Tier Management
**Goal:** Stripe integration and tier upgrade flow

**Tasks:**
1. **Backend:**
   - Enhance `server/trpc/routers/subscriptions.ts`:
     - `createCheckoutSession` - Stripe checkout
     - `upgrade` - tier upgrade
     - `downgrade` - tier downgrade
     - `cancel` - subscription cancellation
     - `getUsage` - current usage details
   - Implement Stripe webhook handler (`app/api/webhooks/stripe/route.ts`)
   - Add tier limit enforcement across all routers
   - Implement usage tracking increments
   - Add monthly reset logic

2. **Frontend:**
   - Create subscription management page
   - Build tier comparison cards
   - Implement upgrade flow with payment modal
   - Add usage details modal (from Plan & Limits card)
   - Show upgrade prompts when limits reached
   - Build subscription success/cancel pages

**Deliverables:**
- Stripe integration
- Tier upgrades/downgrades
- Usage tracking across all features
- Limit enforcement
- Beautiful upgrade prompts
- Subscription management UI

**Report:** `SESSION-9-REPORT.md`

---

### SESSION 10: Polish, Animations & Performance
**Goal:** Add all micro-interactions and optimize

**Tasks:**
1. **Animations:**
   - Add all hover effects (scale, glow, lift)
   - Implement page transitions with Framer Motion
   - Add loading state animations
   - Implement scroll reveal animations
   - Add success/error toast notifications with cosmic theme
   - Parallax background effects

2. **Performance:**
   - Optimize images (next/image)
   - Code splitting for heavy components
   - Lazy load modals
   - Optimize Tailwind (purge unused)
   - Run Lighthouse audit
   - Fix performance issues

3. **Responsive:**
   - Mobile layouts for all pages
   - Touch-friendly interactions
   - Mobile navigation
   - Responsive grid adjustments

4. **Testing:**
   - Cross-browser testing
   - Mobile testing
   - User flow testing
   - Visual regression checks

**Deliverables:**
- Smooth animations everywhere
- Page transitions
- Optimized performance (Lighthouse >90)
- Mobile responsive
- Cross-browser compatible

**Report:** `SESSION-10-REPORT.md`

---

### SESSION 11: Admin Panel & Analytics
**Goal:** Admin features for monitoring and management

**Tasks:**
1. **Backend (`server/trpc/routers/admin.ts`):**
   - `getStats` - platform-wide statistics
   - `getUsers` - user list with filters
   - `getUserDetail` - full user info with usage
   - `getApiUsage` - cost tracking
   - `updateUserTier` - manual tier changes

2. **Frontend:**
   - Create `/admin` route (protected)
   - Build stats dashboard
   - User management table
   - API usage charts
   - Cost analytics

**Deliverables:**
- Admin routes
- Platform statistics
- User management
- Cost tracking dashboard

**Report:** `SESSION-11-REPORT.md`

---

### SESSION 12: Final Integration & Launch Prep
**Goal:** Connect everything, final testing, deployment

**Tasks:**
1. **Integration:**
   - Test complete user journey (signup → dream → reflect → evolve → visualize)
   - Verify tier limits across all features
   - Test subscription upgrades/downgrades
   - Verify all auth flows
   - Test all CRUD operations

2. **Documentation:**
   - API documentation
   - User guide
   - Admin guide
   - Deployment guide

3. **Deployment:**
   - Environment setup (production)
   - Database migrations
   - Stripe production keys
   - Deploy to Vercel
   - Test in production

4. **Launch:**
   - Create landing page content
   - Set up monitoring
   - Prepare support materials

**Deliverables:**
- Fully integrated system
- Complete documentation
- Production deployment
- Launch materials

**Report:** `SESSION-12-REPORT.md`

---

## Execution Protocol

**For each session:**
1. Agent reads this plan and the specific session requirements
2. Agent implements all tasks for that session
3. Agent tests the implementation
4. Agent writes a detailed report in `.sessions/SESSION-X-REPORT.md`
5. Agent confirms completion
6. Move to next session

**Report Template:**
```markdown
# Session X Report: [Title]

## Completed Tasks
- [x] Task 1
- [x] Task 2
...

## Implementation Details
[Technical details of what was built]

## Files Changed
- file1.ts
- file2.tsx
...

## Testing Notes
[What was tested and results]

## Known Issues
[Any issues or limitations]

## Next Session Handoff
[What the next session needs to know]
```

**Progress Tracking:**
- All reports saved in `.sessions/` directory
- Current session number tracked
- Completion checklist maintained

---

## Success Metrics

**Functional:**
- [ ] All auth flows working
- [ ] Dreams CRUD complete
- [ ] Reflections working with AI
- [ ] Evolution reports generating correctly
- [ ] Visualizations creating narratives + artifacts
- [ ] Dashboard aggregating all data
- [ ] Subscriptions with Stripe working
- [ ] Tier limits enforced everywhere
- [ ] Admin panel functional

**Visual:**
- [ ] All pages use glass effects consistently
- [ ] Gradients and glows render beautifully
- [ ] Animations smooth at 60fps
- [ ] Mobile responsive
- [ ] Lighthouse score >90

**User Experience:**
- [ ] Complete user journey smooth
- [ ] Loading states friendly
- [ ] Error states helpful
- [ ] Success states delightful
- [ ] Overall "magical" feeling achieved

---

**Estimated Timeline:** 12 sessions (sequential execution)
**Complexity:** HIGH (comprehensive full-stack implementation)
**Risk Level:** LOW (clear plan, existing foundation)

Ready to start Session 1!
