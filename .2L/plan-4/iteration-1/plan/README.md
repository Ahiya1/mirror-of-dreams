# Plan-4 Iteration 1: Development Plan

**Status:** READY FOR EXECUTION
**Created:** 2025-11-27
**Plan:** plan-4
**Iteration:** 1 (Global Iteration 1)
**Focus:** Fix Broken Core + One-Page Reflection Flow

---

## Quick Navigation

### 📋 [Overview](./overview.md)
High-level project plan with vision, success criteria, scope, timeline, and risk assessment.

**Key Sections:**
- Success Criteria (4 measurable criteria)
- MVP Scope (what's in/out)
- Timeline Estimate (12-14 hours total)
- Risk Assessment (high/medium/low risks)
- Integration Strategy (sequential builder execution)

### 🛠️ [Tech Stack](./tech-stack.md)
Comprehensive technology decisions with rationale for every choice.

**Key Sections:**
- Core Framework (Next.js 14 App Router)
- Database (Supabase PostgreSQL)
- API Layer (tRPC + Zod)
- Frontend (React 18 + Glass Design System)
- External Integrations (Anthropic Claude API)
- Environment Variables (required keys)

### 📝 [Patterns](./patterns.md)
**MOST IMPORTANT FILE FOR BUILDERS**

Copy-pasteable code patterns for every common operation.

**Key Sections:**
- Zod Schema Patterns (with full examples)
- tRPC API Patterns (mutation with validation)
- Database Patterns (Supabase queries)
- Frontend Patterns (React component structure)
- Form Handling (validation, state management)
- Error Handling (API errors, user feedback)
- Import Order Convention
- Logging Convention

### 👷 [Builder Tasks](./builder-tasks.md)
Detailed task breakdown for 3 sequential builders.

**Builders:**
1. **Builder-1:** Fix Reflection API & Update Schema (4-5 hours)
2. **Builder-2:** Transform MirrorExperience Component (4-5 hours)
3. **Builder-3:** Integration & Comprehensive Testing (1-2 hours)

**Each builder task includes:**
- Scope and objectives
- Complexity estimate
- Success criteria
- Files to create/modify
- Dependencies
- Implementation notes
- Testing requirements
- Patterns to follow
- Potential split strategy

---

## Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│  BUILDER 1: Fix Reflection API & Update Schema         │
│  - Debug 400 error (root cause: schema mismatch)        │
│  - Update types/schemas.ts (remove hasDate/dreamDate)   │
│  - Update reflection router mutation                    │
│  - Simplify AI prompt to 4 questions                    │
│  - Add comprehensive logging                            │
│  - Test Anthropic API integration                       │
│  Duration: 4-5 hours                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  BUILDER 2: Transform MirrorExperience Component       │
│  - Remove multi-step wizard (7 steps → 1 page)          │
│  - Display all 4 questions simultaneously               │
│  - Update question text (reference dream by name)       │
│  - Move tone selection to bottom                        │
│  - Update form validation (all-at-once)                 │
│  - Ensure mobile responsiveness                         │
│  Duration: 4-5 hours                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  BUILDER 3: Integration & Comprehensive Testing        │
│  - Merge Builder 1 & 2 branches                         │
│  - Execute manual testing checklist (18 scenarios)      │
│  - Test mobile responsiveness (3+ device sizes)         │
│  - Verify database records correct                      │
│  - Document issues (if any)                             │
│  - Mark iteration COMPLETE                              │
│  Duration: 1-2 hours                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
                   DEPLOYMENT READY
```

---

## Key Decisions Summary

### Architecture
- **No framework changes** - Build on existing Next.js 14 foundation
- **Sequential builder execution** - Prevents merge conflicts
- **Schema-first approach** - Update types before code

### UX Transformation
- **7-step wizard → 1-page form** - Simplified, contemplative experience
- **5 questions → 4 questions** - Remove redundant date questions
- **Generic text → Dream-specific** - Questions reference selected dream

### Technical Changes
- **Remove fields:** `hasDate`, `dreamDate` from schema
- **Update mutation:** Handle 4-question format
- **Simplify prompt:** AI receives 4 rich questions (no date)
- **Add logging:** Comprehensive debugging at all layers

### Quality Standards
- **100% success rate** - Reflection creation must never fail
- **Mobile-first** - Test on 375px, 390px, 768px, 1440px
- **Type safety** - No `any`, explicit interfaces
- **User-friendly errors** - Clear messages, no stack traces

---

## Success Metrics

| Metric | Target | Test Method |
|--------|--------|-------------|
| Reflection creation success rate | 100% | Create 5 reflections, 0 errors |
| One-page visibility | All 4 questions visible | No clicking "Next" required |
| Mobile scroll performance | Smooth on iPhone SE | Manual device testing |
| AI response quality | References user's answers | Compare 3+ reflections |
| Schema consistency | No field mismatches | tRPC validates successfully |
| Test coverage | 18/18 scenarios passed | Manual testing checklist |

---

## Risk Mitigation

### High Risks
1. **Root cause assumption incomplete** → Allocated 2-hour debugging buffer
2. **Component refactor introduces regressions** → Incremental testing during refactor
3. **Mobile scroll performance issues** → Use standard CSS patterns, test on real devices

### Medium Risks
1. **tRPC schema synchronization** → Update types/schemas.ts FIRST, then code
2. **AI prompt quality degradation** → Enhanced prompt with dream context

### Low Risks
1. **Validation timing** → Clear error messages, scroll to first error

---

## Files Modified by This Iteration

| File | Builder | Change Type | Lines Changed |
|------|---------|-------------|---------------|
| `types/schemas.ts` | 1 | Modify | ~10 (remove 2 fields) |
| `server/trpc/routers/reflection.ts` | 1 | Modify | ~50 (simplify mutation) |
| `app/reflection/MirrorExperience.tsx` | 2 | Refactor | ~400 (remove wizard) |

**No new files created** - All changes to existing codebase.

**No database migration required** - Columns remain nullable (historical data preserved).

---

## Next Steps

### For Orchestrator
1. ✅ Planning complete
2. ⏳ Spawn Builder 1 (API Fix)
3. ⏳ Wait for Builder 1 completion
4. ⏳ Spawn Builder 2 (Component Refactor)
5. ⏳ Wait for Builder 2 completion
6. ⏳ Spawn Builder 3 (Integration Testing)
7. ⏳ Mark iteration COMPLETE

### For Builders
1. Read **all 4 plan files** before starting
2. Reference `patterns.md` for code examples
3. Follow sequential execution order (1 → 2 → 3)
4. Commit to designated branches
5. Create handoff notes for next builder
6. Test incrementally (don't wait until end)

---

## Plan Quality Checklist

- [x] All 4 files created in `.2L/plan-4/iteration-1/plan/`
- [x] Tech stack has clear rationale for every choice
- [x] Every major operation has a code pattern with full example
- [x] Builder tasks have clear boundaries and ownership
- [x] Dependencies between builders identified and documented
- [x] Complexity estimates provided for each builder
- [x] Split strategies provided for HIGH complexity tasks
- [x] Testing requirements specified (manual checklist with 18+ scenarios)
- [x] Integration strategy clear (sequential, file ownership)
- [x] All patterns have working code examples (no pseudocode)
- [x] Success criteria are measurable and specific

---

**Plan Status:** COMPREHENSIVE AND READY
**Confidence Level:** HIGH (built on 2 thorough explorer reports)
**Estimated Success Probability:** 85% (known risks, clear mitigation)
**Next Phase:** Building (Builder 1 starts)

---

*Created by: 2L Planner Agent*
*Plan-4: Restraint. Substance. Transformation.*
