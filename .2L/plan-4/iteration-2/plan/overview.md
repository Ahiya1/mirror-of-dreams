# 2L Iteration Plan - Mirror of Dreams: Restraint & Substance

**Iteration:** 2 (Global Iteration 2)
**Plan:** plan-4
**Created:** 2025-11-27
**Status:** PLANNED

---

## Project Vision

Establish restraint and substance throughout Mirror of Dreams by removing decorative flash and replacing marketing speak with clear, honest communication. Transform the app from appearing spiritual to delivering genuine insight through focused design and authentic language.

**Core Principle:** Beauty must be earned through function, not added through decoration.

---

## Success Criteria

Iteration 2 is successful when:

- [ ] **Dashboard shows ONE clear primary action**
  - "Reflect Now" button is visually dominant (2-3x larger than secondary actions)
  - Greeting is simple time-based: "Good evening, Ahiya" (not "Deep night wisdom, Creator")
  - Usage display is clear: "8/30 reflections this month" (not confusing percentages/infinity symbols)

- [ ] **Maximum 2 emojis per page (decorative)**
  - Dashboard: 0-1 emojis (currently has 1 in "Reflect Now" - to be removed)
  - Auth pages: 0 decorative emojis (password toggles can use SVG icons)
  - Reflection flow: 0 decorative emojis (category icons exempt as functional)
  - Total reduction: 150+ emojis → ~24 functional category/status icons app-wide

- [ ] **NO pop-up or bounce animations**
  - Remove all scale effects from buttons (whileHover, whileTap)
  - Remove continuous breathing/pulsing animations
  - Keep only smooth transitions (200-300ms opacity/position changes)
  - Background atmospheric layers remain (ambient depth, not foreground flash)

- [ ] **Clear, honest copy throughout**
  - Landing page: "Reflect. Understand. Evolve." (not "Your dreams hold the mirror...")
  - Auth pages: "Welcome Back" and "Create Account" (no spiritual taglines)
  - Dashboard: Specific data-driven messages (not mystical greetings)
  - Zero instances of: "sacred," "journey," "consciousness," "unlock," "reveal"

- [ ] **Auth pages have identical styling**
  - "Free Forever" badge removed completely
  - Sign-in and sign-up use same button component
  - Consistent layout, spacing, error handling

- [ ] **Design feels polished, not sterile**
  - Glass effects preserved (functional depth)
  - Background atmospheric layers remain
  - Active states clearly indicated (border/color, not animation)
  - Earned beauty guidelines documented and followed

---

## MVP Scope

### In Scope (Iteration 2)

**Feature 3: Simplified Engaging Dashboard**
- Change greeting from mystical variations to simple "Good [morning/afternoon/evening], [Name]"
- Make "Reflect Now" the most prominent action (large, clear, NO emoji)
- Simplify WelcomeSection from 258 lines → ~50 lines
- Remove competing visual hierarchy (6 cards fighting for attention)
- Display usage simply: "8/30 reflections this month"
- Maximum 1 emoji total on dashboard page

**Feature 4: Remove Decorative Flash**
- Strip 130+ decorative emojis (keep 24 functional category/status icons)
- Remove ALL pop-up/bounce animations (scale effects on hover/tap)
- Remove continuous breathing/pulsing effects from foreground elements
- Simplify glass components (remove decorative glows, keep functional depth)
- Update animation durations: 600ms → 200-300ms for transitions

**Feature 5: Clear, Honest Copy**
- Landing page: "Reflect. Understand. Evolve." (vision's exact tagline)
- Replace 47 instances of marketing speak across 8 files
- Remove: "sacred," "journey," "consciousness," "transformation," "unlock"
- Use direct language: "reflections" not "journey," "understand" not "unlock wisdom"
- Update all button text to be action-oriented (no decorative emojis)

**Feature 6: Simplified Auth Pages**
- Remove "Free Forever" badge completely (sign-up page)
- Make sign-in and sign-up pages identical in structure/styling
- Change button text: "Sign In" and "Create Account" (not "Continue Your Journey")
- Remove spiritual subheadings or replace with simple functional text
- Use SVG icons for password toggle instead of emojis

### Out of Scope (Post-Iteration 2)

- Evolution/Visualization card redesign (can hide if time limited)
- Animation A/B testing framework
- Voice & tone documentation (recommend for post-MVP)
- Internationalization/translations
- About page content (still 404)
- Example reflections page

**Why:** Iteration 2 focuses on establishing restraint patterns and removing decorative flash. Advanced features can build on this foundation.

---

## Development Phases

1. **Exploration** - COMPLETE
2. **Planning** - CURRENT (this document)
3. **Building** - 8-12 hours (3-4 parallel builders or sequential phases)
4. **Integration** - 30 minutes (visual review across all pages)
5. **Validation** - 30 minutes (emoji count, copy audit, animation check)
6. **Deployment** - Local testing only

---

## Timeline Estimate

**Total Iteration Time:** 8-12 hours

**Breakdown:**
- **Builder 1: Dashboard Simplification** - 3-4 hours
  - WelcomeSection simplification (258 → 50 lines): 2-3 hours
  - Usage display simplification: 1 hour
  - Make "Reflect Now" primary action: 30 minutes

- **Builder 2: Remove Flash (Emojis + Animations)** - 4-6 hours
  - Emoji removal (130+ decorative): 2-3 hours
  - Animation cleanup (remove scale, breathing): 2-3 hours
  - Glass component simplification: 1 hour

- **Builder 3: Clear Copy Throughout** - 2-3 hours
  - Landing page copy updates: 30 minutes
  - Auth pages (remove badge, fix copy): 30 minutes
  - Dashboard copy (WelcomeSection messages): 1 hour
  - Reflection flow copy: 30 minutes

- **Builder 4: Auth Pages + Integration** - 1-2 hours
  - Auth page consistency: 1 hour
  - Integration testing: 30 minutes
  - Validation checklist: 30 minutes

**Alternative:** 2 builders with sequential phases (10-14 hours total)

**Integration:** 30 minutes (visual review, emoji count validation)

**Validation:** 30 minutes (checklist verification, user flow testing)

---

## Risk Assessment

### High Risks

**Risk: Over-Correction to Sterile Design**
- Impact: HIGH - App loses warmth and becomes cold/corporate
- Likelihood: MEDIUM
- Mitigation:
  - Establish "earned beauty" guidelines BEFORE removing decorations
  - Keep glass effects (functional depth)
  - Preserve background atmospheric layers (ambient depth)
  - Test with Ahiya after each major simplification
  - Use soft language without mysticism ("continue" not "consciousness deepens")

**Risk: Breaking Existing Animations/Layouts**
- Impact: MEDIUM - Page transitions or component layouts could break
- Likelihood: LOW
- Mitigation:
  - Test dashboard grid without stagger or with reduced duration
  - Verify modal dialogs work without scale animation
  - Check responsive breakpoints after copy changes (shorter text)
  - Keep CSS transition fallbacks for removed Framer Motion effects

### Medium Risks

**Risk: Inconsistent Implementation (Missing Instances)**
- Impact: MEDIUM - Some marketing speak or emojis left behind
- Likelihood: HIGH (47 copy instances, 150+ emojis)
- Mitigation:
  - Use grep to find all instances of forbidden words after changes
  - Create validation checklist from explorer reports
  - Visual review of every page
  - Builder checks off each file after completion

**Risk: Emoji Removal Reduces Scannability**
- Impact: LOW - Users can't quickly identify dream types
- Likelihood: LOW
- Mitigation:
  - Keep functional category icons (10 types: health, career, etc.)
  - Keep status icons (4 types: active, completed, archived, paused)
  - Only remove decorative emojis (buttons, headers, badges)

### Low Risks

**Risk: User Confusion from Abrupt Change**
- Impact: LOW - Only one user (Ahiya) currently testing
- Likelihood: LOW
- Mitigation: Not applicable for single-user environment

---

## Integration Strategy

### Component-Level Integration

**Glass Components (Foundation):**
1. Update `GlassCard`, `GlowButton`, `GlowBadge` first (Builder 2)
2. These components used in 30+ locations
3. Changes propagate automatically to all pages
4. Test component library in isolation before page-level changes

**Page-Level Integration:**
1. Dashboard updates use simplified glass components
2. Auth pages use updated button styles
3. Reflection flow uses updated components
4. Consistent visual language emerges naturally

### Copy Integration

**Systematic Approach:**
1. Landing page first (first impression)
2. Auth pages second (entry points)
3. Dashboard third (main experience)
4. Reflection flow fourth (core interaction)
5. Dashboard cards last (supporting elements)

**Validation:**
- Grep for forbidden words after each file change
- Visual review of each page after completion
- Final sweep across all pages

### Animation Integration

**Framer Motion → CSS Transition:**
1. Update `lib/animations/variants.ts` (remove scale)
2. Update glass components (remove whileHover/whileTap)
3. Update pages to use CSS hover states
4. Delete decorative CSS animations (`breathe`, `float`, `bob`)
5. Test all page transitions and interactions

---

## Deployment Plan

**Environment:** Local development only (Supabase on port 54331)

**Deployment Steps:**
1. Builders complete work in parallel or sequentially
2. Integration builder validates all changes
3. Run validation checklist
4. Visual review with Ahiya
5. Commit to Git (iteration 2 complete)

**Testing Strategy:**
- Manual visual review (primary method)
- Emoji count validation (grep + manual count)
- Copy audit (search for forbidden words)
- Animation check (no scale/bounce/breathing visible)
- Full user flow test (sign in → dashboard → reflect → view)

**Success Validation:**
- Dashboard has 0-1 emojis (not 30+)
- No pop-up animations on any button
- Landing page says "Reflect. Understand. Evolve."
- Greeting is "Good evening, Ahiya" (not mystical)
- "Free Forever" badge is gone
- Auth pages look identical

---

## Notes

**Explorer Consensus:**
- All 3 explorers agree: Remove decorative flash, establish restraint, clarify copy
- Explorer 1 focus: Dashboard simplification (6 cards → clear hierarchy)
- Explorer 2 focus: Animation/emoji removal (150+ emojis, 67 Framer Motion files)
- Explorer 3 focus: Copy clarity (47 marketing speak instances)

**Iteration 1 Dependency:**
- Iteration 2 assumes Iteration 1 delivered working reflection creation
- If reflection flow still broken, prioritize fix before design cleanup

**Post-Iteration 2:**
- Document earned beauty guidelines for future development
- Consider voice & tone style guide
- Plan evolution/visualization card improvements
- Evaluate need for animation performance testing

---

**Plan Status:** READY FOR BUILDER ASSIGNMENT
**Next Step:** Assign builders based on `builder-tasks.md`
**Validation:** Use checklists in explorer reports + this overview
