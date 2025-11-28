# 2L Iteration Plan - Mirror of Dreams (Plan-7, Iteration 14)

## Project Vision

Transform the reflection experience from functional to emotionally resonant and sacred. This is the FINAL iteration of Plan-7, elevating Mirror of Dreams from a working app to a 9/10 quality sanctuary for dream reflection.

The focus is **experience polish**: warmth, visual hierarchy, encouragement, and beauty. Every interaction should feel supportive, never clinical. The reflection journey should honor the user's depth and vulnerability.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] Reflection form greets users with warm welcome message
- [ ] Character counter shows "342 thoughtful words" with color progression (white → gold → purple)
- [ ] Tone selection cards have descriptions and hover glow effects
- [ ] AI insights visually stand out with gold background highlighting
- [ ] First paragraph of AI response is larger (1.25rem) to draw reader in
- [ ] Empty states on all 5 pages have warm, actionable copy
- [ ] Reflection collection has date range filter working
- [ ] All micro-copy reviewed for warmth (not clinical)
- [ ] Bundle size increase stays under 30KB total for Plan-7
- [ ] WCAG 2.1 AA accessibility maintained, reduced motion respected
- [ ] Zero console errors or warnings
- [ ] Mobile reading experience optimized (720px max-width, 1.8 line-height)

## MVP Scope

**In Scope:**

1. **Enhanced Reflection Form**
   - Welcoming micro-copy ("Welcome to your sacred space...")
   - Character counter redesign (words instead of characters)
   - Color states: white → gold → purple (NO red warnings)
   - Tone selection enhancement (descriptions + hover glow)
   - Progress encouragement with checkmarks

2. **Individual Reflection Display**
   - Visual header (large dream name, formatted date, tone badge)
   - AI response enhancements (larger first paragraph, gold highlights)
   - Collapsible user reflections (already implemented, verify)
   - Actions: Reflect Again, Copy Text, Delete
   - Reading optimization (720px max-width, 1.8 line-height)

3. **Empty State Redesign**
   - Dashboard empty state (cosmic illustration, warm copy)
   - Dreams page empty state (constellation theme)
   - Reflections page empty state (blank journal theme)
   - Evolution page empty state (progress indicator)
   - Visualizations page empty state (canvas theme)

4. **Reflection Collection Enhancements**
   - Date range filter ("Last 7 days", "Last 30 days", "All time")
   - Tone filter visual pills (glow on selected)
   - Card hover enhancements (verify existing implementation)
   - Sort options (already exist, verify labels)

**Out of Scope (Post-MVP):**

- Dream dropdown filter (requires schema change - blocked)
- Email verification for account changes
- Advanced markdown pattern detection (AI action items, pull quotes)
- Custom SVG illustrations (using CSS art for MVP)
- URL params for shareable filtered views
- Date picker (using dropdown presets instead)

## Development Phases

1. **Exploration** ✅ Complete
2. **Planning** 🔄 Current
3. **Building** ⏳ 12-16 hours (3 parallel builders)
4. **Integration** ⏳ 1-2 hours
5. **Validation** ⏳ 1-2 hours
6. **Deployment** ⏳ Final

## Timeline Estimate

- Exploration: Complete (2 hours)
- Planning: Complete (current phase)
- Building: 12-16 hours (parallel builders)
  - Builder-1 (Reflection Display): 4-6 hours
  - Builder-2 (Reflection Form): 5-7 hours
  - Builder-3 (Collections & Empty States): 3-4 hours
- Integration: 1-2 hours (minimal overlap, clean handoffs)
- Validation: 1-2 hours (manual testing, copy review)
- **Total: ~18-22 hours**

## Risk Assessment

### High Risks

**None identified** - This is a polish iteration with low technical risk. All patterns exist, codebase is 80% ready.

### Medium Risks

**Micro-copy warmth calibration**
- Risk: Copy feels too warm/patronizing or still too clinical
- Impact: User experience doesn't match vision
- Mitigation: Draft all copy in constants file, Ahiya reviews in batch, 2 iteration cycles planned

**Character counter breaking changes**
- Risk: Modifying GlassInput affects other forms (auth, settings)
- Impact: Regression in existing features
- Mitigation: Add word counter as optional prop with backward compatibility, test all GlassInput usages

### Low Risks

**Empty state illustration time**
- Risk: SVG creation takes longer than estimated
- Impact: Builder-3 delayed
- Mitigation: Use CSS art (gradients + shapes) for MVP, upgrade to custom SVGs later

**AI insight highlighting fragility**
- Risk: Pattern detection doesn't work for all AI responses
- Impact: Highlights inconsistent
- Mitigation: Start simple (all `<strong>` tags = gold), refine based on real data, graceful fallback

## Integration Strategy

### Builder Isolation
- **Builder-1**: Individual reflection display (AIResponseRenderer, reflection detail page)
- **Builder-2**: Reflection form (MirrorExperience, GlassInput, ToneSelectionCard)
- **Builder-3**: Collections & empty states (ReflectionFilters, EmptyState, all empty state pages)

**Zero file overlap** - Each builder works in different components/pages.

### Integration Points

1. **GlassInput changes** (Builder-2)
   - Add optional props: `counterMode`, `counterFormat`, `counterColorStates`
   - Default behavior unchanged (backward compatible)
   - Builder-2 tests with auth forms, settings forms before completion
   - Integration: Builder-1 and Builder-3 unaffected

2. **AIResponseRenderer enhancements** (Builder-1)
   - Extend custom markdown components
   - Change `<strong>` color from purple to gold
   - Add first-paragraph detection
   - Integration: Only used in individual reflection pages, no conflicts

3. **EmptyState component** (Builder-3)
   - Already has `illustration` prop from Plan-6
   - Just adds new SVG/CSS art illustrations
   - Updates usage in 5 pages with new copy
   - Integration: Each page isolated, no conflicts

### Shared Constants

All micro-copy and tone data goes in `/lib/utils/constants.ts`:
- Micro-copy messages (form welcome, encouragement)
- Tone descriptions (extended from existing TONES)
- Empty state copy for each page
- Character counter labels

**Pattern**: Single source of truth, easy to review/update.

### Handoff Flow

1. Builders work in parallel (12-16 hours)
2. Each builder creates pull request with checklist
3. Integration phase: Merge all 3 PRs, test together
4. Validation: Ahiya reviews all micro-copy in one pass
5. Refinement: Adjust based on feedback
6. Deployment: Ship as cohesive experience

## Deployment Plan

### Pre-Deployment Checklist

- [ ] All 3 builders completed and merged
- [ ] Manual testing on all affected pages:
  - Reflection form (desktop + mobile)
  - Individual reflection display (various AI responses)
  - Reflections collection (filters working)
  - Dashboard, Dreams, Evolution, Visualizations (empty states)
- [ ] Micro-copy reviewed and approved by Ahiya
- [ ] Bundle size measured (must be <30KB increase from Plan-6 baseline)
- [ ] Accessibility audit (keyboard navigation, screen reader, reduced motion)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (iPhone SE, iPad)

### Deployment Steps

1. Merge all builder branches to `main`
2. Run production build: `npm run build`
3. Verify bundle size in output
4. Deploy to Vercel production
5. Smoke test in production:
   - Demo user reflection flow (form → submit → view)
   - Reflection collection filters
   - Empty states on fresh account
6. Monitor for errors (Vercel logs, browser console)

### Rollback Plan

If critical issues found:
- Revert to previous Plan-7 Iteration 13 deployment
- All changes are UI-only (no database migrations)
- Safe to rollback instantly

### Success Metrics

Post-deployment validation (within 24 hours):
- Zero console errors in production
- Lighthouse score maintained (>90)
- Bundle size within budget
- User feedback: "Feels more welcoming"

## Notes

- This is a **polish iteration**, not a feature build
- 80% of code already exists and works
- Focus on refinement, warmth, visual hierarchy
- No database changes, all frontend enhancements
- Safe iteration with high impact on user experience
