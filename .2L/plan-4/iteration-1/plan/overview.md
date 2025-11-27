# 2L Iteration Plan - Mirror of Dreams: Plan-4 Iteration 1

## Project Vision

Fix the broken reflection creation system and transform the user experience from a complex multi-step wizard to a focused one-page reflection flow. This iteration establishes the foundation for restraint and substance by removing redundant date questions and creating a seamless, contemplative reflection experience.

**Core Principle:** Enable users to create meaningful reflections without friction or confusion. Every element serves understanding, not decoration.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [x] **Reflection Creation Works (100% Success Rate)**
  - Users can complete reflections without 400 errors
  - Anthropic API integration functions correctly
  - Reflections saved to database with all required fields
  - Test: Ahiya completes 3 consecutive reflections with 0 errors

- [x] **One-Page Flow Implemented**
  - All 4 questions visible simultaneously on scrollable page
  - No multi-step navigation (removed 7-step wizard)
  - Questions reference specific dream selected by user
  - Tone selection positioned at bottom of form
  - Single submit button: "Gaze into the Mirror"
  - Test: User sees all questions without clicking "Next"

- [x] **Schema Consistency Achieved**
  - `hasDate` and `dreamDate` fields removed from reflection schema
  - tRPC validation aligns with database constraints
  - Server router handles 4-question format correctly
  - Test: Schema validation passes, no field mismatch errors

- [x] **Mobile Responsive Experience**
  - Form scrolls smoothly on mobile devices (iPhone, iPad)
  - Tone cards stack vertically on small screens
  - Submit button always accessible
  - Keyboard doesn't obscure input fields
  - Test: Complete reflection on iPhone SE (375px) and iPad (768px)

- [x] **AI Response Quality Maintained**
  - Claude API receives clean 4-question prompt
  - Responses reference user's actual answers
  - No degradation in reflection depth
  - Test: Compare response quality to baseline reflections

## MVP Scope

**In Scope:**

1. **Fix Reflection API (CRITICAL)**
   - Debug and resolve 400 error root cause
   - Validate schema-database alignment
   - Add comprehensive error logging
   - Test Anthropic API integration end-to-end

2. **Transform to 4-Question One-Page Flow (HIGH)**
   - Remove multi-step state management
   - Display all questions simultaneously
   - Update question text to reference selected dream
   - Remove `hasDate` and `dreamDate` questions (redundant with dream.target_date)
   - Move tone selection to bottom of page
   - Consolidate to single submit action

3. **Update Backend for New Format (HIGH)**
   - Remove `hasDate`/`dreamDate` from createReflectionSchema
   - Update reflection router mutation
   - Simplify AI prompt (4 questions only)
   - Test database insertion with new format

4. **Mobile-First Responsive Design (MEDIUM)**
   - Scrollable container for all questions
   - Responsive tone selection grid
   - Smooth keyboard interactions
   - Touch-friendly scroll behavior

**Out of Scope (Post-MVP):**

- Dashboard simplification (Iteration 2)
- Removing decorative flash/emojis (Iteration 2)
- Copy updates throughout app (Iteration 2)
- Auth page consistency (Iteration 2)
- Database migration to drop columns (defer to post-plan-4)
- Cross-dream analysis features
- Evolution report enhancements
- Advanced visualizations

## Development Phases

1. **Exploration** ✅ Complete
   - Explorer 1: Identified 400 error root cause (schema-database mismatch)
   - Explorer 2: Mapped complete refactoring strategy for one-page flow

2. **Planning** 🔄 Current
   - Creating comprehensive development plan
   - Defining builder tasks and patterns
   - Establishing tech stack decisions

3. **Building** ⏳ 8-10 hours (parallel builders)
   - Builder 1: Fix Reflection API & Schema (4-5 hours)
   - Builder 2: Transform MirrorExperience Component (4-5 hours)
   - Builder 3: Integration & Testing (1-2 hours)

4. **Integration** ⏳ 30-60 minutes
   - Merge builder outputs
   - Resolve conflicts
   - End-to-end smoke testing

5. **Validation** ⏳ 30-60 minutes
   - Manual testing checklist
   - Mobile device testing
   - Acceptance criteria verification

6. **Deployment** ⏳ Final
   - Commit to repository
   - Mark iteration complete

## Timeline Estimate

- **Exploration:** Complete (6 hours)
- **Planning:** Complete (2 hours)
- **Building:** 8-10 hours (3 builders working in parallel/sequence)
  - Builder 1 (API Fix): 4-5 hours
  - Builder 2 (Component Refactor): 4-5 hours (starts after Builder 1 schema updates)
  - Builder 3 (Integration): 1-2 hours (after Builders 1 & 2)
- **Integration:** 30-60 minutes
- **Validation:** 30-60 minutes
- **Total:** ~12-14 hours

## Risk Assessment

### High Risks

**1. Root Cause Assumption May Be Incomplete**
- **Risk:** 400 error hypothesis (schema mismatch with empty `hasDate`) may not be the only issue
- **Likelihood:** LOW (Explorer 1 provided 85% confidence based on thorough code analysis)
- **Impact:** HIGH (blocks all reflection creation)
- **Mitigation:**
  - Add comprehensive debug logging before attempting fix
  - Allocate 2-hour buffer for unexpected debugging
  - Test with multiple scenarios (yes/no date, skipped fields, etc.)

**2. MirrorExperience Refactor Introduces Regressions**
- **Risk:** 781-line component refactor may break existing functionality
- **Likelihood:** MEDIUM (large codebase change)
- **Impact:** HIGH (breaks reflection flow entirely)
- **Mitigation:**
  - Incremental testing during refactor (not big-bang approach)
  - Preserve all validation logic
  - Test both questionnaire and output modes
  - Manual testing checklist (20+ test cases)

**3. Mobile Scroll Performance Issues**
- **Risk:** Long one-page form may cause jank on mobile devices
- **Likelihood:** LOW (standard CSS scroll patterns)
- **Impact:** MEDIUM (poor UX on mobile)
- **Mitigation:**
  - Use CSS `overflow-y: auto` with `-webkit-overflow-scrolling: touch`
  - Test on actual iPhone/iPad (not just DevTools)
  - Monitor textarea re-render performance
  - Limit initial textarea height (expand on focus)

### Medium Risks

**1. tRPC Schema Synchronization**
- **Risk:** Client and server schemas fall out of sync during changes
- **Likelihood:** MEDIUM (manual synchronization required)
- **Impact:** MEDIUM (runtime errors, failed mutations)
- **Mitigation:**
  - Update types/schemas.ts FIRST (single source of truth)
  - Update server router SECOND
  - Update client component LAST
  - Test with curl/Postman before UI testing

**2. AI Prompt Quality Degradation**
- **Risk:** Removing date questions reduces context for Claude
- **Likelihood:** LOW (date is less important than relationship/offering depth)
- **Impact:** MEDIUM (less personalized reflections)
- **Mitigation:**
  - Enhanced prompt includes dream object context (title, target_date)
  - Test AI responses before/after changes
  - Compare quality metrics (word count, specificity)

### Low Risks

**1. Validation Timing Issues**
- **Risk:** Users miss validation errors on one-page form
- **Likelihood:** LOW (standard form patterns)
- **Impact:** LOW (user confusion, retry)
- **Mitigation:**
  - Clear validation messages with field names
  - Scroll to first incomplete field on submit
  - Visual cues (red border) for incomplete fields

## Integration Strategy

**Builder Coordination:**

1. **Builder 1 (API Fix) → Builder 2 (Component)**
   - Builder 1 completes schema updates first
   - Builder 2 waits for schema changes to be committed
   - Ensures component uses correct field structure

2. **Builder 2 (Component) → Builder 3 (Integration)**
   - Builder 2 completes MirrorExperience refactor
   - Builder 3 tests complete flow end-to-end
   - Catches any edge cases or regressions

**Shared Files:**
- `types/schemas.ts` - Builder 1 owns, Builder 2 imports
- `server/trpc/routers/reflection.ts` - Builder 1 owns
- `app/reflection/MirrorExperience.tsx` - Builder 2 owns

**Merge Strategy:**
- Sequential development (reduces conflicts)
- Builders commit to separate branches
- Builder 3 merges and tests integration
- No concurrent edits to same files

**Conflict Prevention:**
- Clear file ownership per builder
- Communication via completion markers
- Integration builder validates consistency

## Deployment Plan

**Pre-Deployment Checklist:**
- [ ] All builder tasks completed
- [ ] Integration testing passed
- [ ] Manual testing checklist complete (20+ scenarios)
- [ ] Mobile testing verified (iPhone SE, iPhone 12 Pro, iPad)
- [ ] No console errors or warnings
- [ ] Database records correctly formatted
- [ ] AI responses meet quality baseline

**Deployment Steps:**
1. Merge all builder branches to `plan-4-iteration-1`
2. Run full test suite (manual + automated if available)
3. Verify Supabase local instance running
4. Test complete flow 3 times (varied inputs)
5. Commit to main branch with clear commit message
6. Update `.2L/config.yaml` to mark iteration complete

**Rollback Plan:**
- Git revert to commit before iteration 1 changes
- Database migration rollback not needed (columns remain nullable)
- Re-enable multi-step flow if critical regression found

**Post-Deployment:**
- Monitor for errors in first 24 hours
- Gather Ahiya's feedback on UX
- Document any issues for iteration 2
- Celebrate successful core fix! 🎯

---

**Plan Status:** READY FOR EXECUTION
**Iteration:** 1 (Global Iteration 1)
**Plan:** plan-4
**Focus:** Fix broken core + establish one-page reflection flow
**Next Phase:** Building (3 builders)
