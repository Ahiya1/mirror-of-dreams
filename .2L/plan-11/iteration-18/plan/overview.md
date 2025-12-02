# 2L Iteration Plan - Touch Polish & Dashboard Optimization

## Project Vision

Complete the mobile-first transformation of Mirror of Dreams by adding polished touch interactions, mobile-optimized modals, and refined dashboard layout. This is the **final iteration** of plan-11, focusing on making every interaction feel native and satisfying on mobile devices.

**Context:** Iterations 16 and 17 established bottom navigation and the full-screen reflection flow. This iteration polishes the remaining touch interactions and optimizes the dashboard experience.

---

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] All GlassCard components have `whileTap={{ scale: 0.98 }}` feedback
- [ ] GlowButton includes haptic feedback on tap
- [ ] DashboardCard hover effects are guarded with `@media (hover: hover)`
- [ ] GlassModal renders full-screen on mobile (< 768px) with slide-up animation
- [ ] GlassModal supports swipe-down-to-dismiss gesture on mobile
- [ ] GlassInput default height increased to 56px minimum
- [ ] Dashboard cards reordered: Dreams and Reflections prominent on mobile
- [ ] No desktop regressions - hover effects and layouts unchanged on desktop

---

## MVP Scope

**In Scope (This Iteration):**

1. **Touch States & Haptics**
   - GlassCard: Add Framer Motion `whileTap` animation
   - GlowButton: Add haptic feedback on tap
   - DashboardCard: Guard hover effects with `@media (hover: hover)`
   - Consistent 48px minimum touch targets

2. **GlassModal Mobile Treatment**
   - Full-screen rendering on mobile (< 768px)
   - Slide-up animation from bottom
   - Swipe-down-to-dismiss gesture
   - Close button always visible and accessible

3. **Form Polish**
   - GlassInput height increased to 56px minimum
   - Label font size increased for mobile readability

4. **Dashboard Mobile Optimization**
   - Dreams and Reflections cards made more prominent
   - Secondary cards (Evolution, Visualization, Subscription) de-emphasized on mobile

**Out of Scope (Deferred):**

- Pull-to-refresh functionality (defer to future iteration)
- Horizontal scroll stats strip (nice-to-have, defer)
- CSS migration from desktop-first to mobile-first (future refactor)
- Auto-scroll input into view on keyboard (complex, defer)
- Form persistence to localStorage (nice-to-have)

---

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current (this document)
3. **Building** - 3 parallel builders (~4-5 hours total)
4. **Integration** - ~15 minutes
5. **Validation** - ~20 minutes
6. **Deployment** - Final

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Exploration | Complete | Explorer 1 & 2 finished |
| Planning | Complete | This plan |
| Building | 4-5 hours | 3 parallel builders |
| Integration | 15 minutes | Minimal overlap expected |
| Validation | 20 minutes | Manual mobile testing |
| **Total** | **~5-6 hours** | Final polish iteration |

---

## Risk Assessment

### Low Risks
- **GlassCard touch enhancement**: Well-established pattern, minimal risk
- **GlassInput height increase**: Simple CSS change
- **Dashboard card reordering**: CSS-only, no logic changes

### Medium Risks
- **GlassModal mobile treatment**: Requires conditional rendering and new gesture handling
- **Hover guard implementation**: Must not break desktop experience

### Mitigations
- Use `useIsMobile()` hook for conditional mobile behavior
- Test on both mobile and desktop after each change
- Use `@media (hover: hover)` consistently in CSS

---

## Integration Strategy

**Minimal Overlap Expected:**

1. **Builder 1** (Touch States) modifies:
   - `GlassCard.tsx` - touch feedback
   - `GlowButton.tsx` - haptic feedback
   - `dashboard.css` - hover guards for DashboardCard

2. **Builder 2** (Modal Mobile) modifies:
   - `GlassModal.tsx` - complete mobile treatment
   - `variants.ts` - new animation variant

3. **Builder 3** (Forms & Dashboard) modifies:
   - `GlassInput.tsx` - height increase
   - `DashboardGrid.module.css` - card priority styling
   - `dashboard.css` - mobile card ordering

**Shared File:** `variants.ts` touched by Builder 2 only.

**Conflict Prevention:**
- Builders work on distinct components
- CSS changes are additive, not destructive
- Dashboard layout changes are CSS-only

---

## Deployment Plan

1. Build completes with all 3 builders
2. Integration merges changes
3. Run `npm run build` to verify no TypeScript errors
4. Manual testing on:
   - iOS Safari (real device preferred)
   - Android Chrome (real device preferred)
   - Desktop Chrome (regression check)
5. Deploy to Vercel via `git push`

---

## Quality Gates

Before marking iteration complete:

- [ ] All touch interactions feel responsive (< 100ms feedback)
- [ ] GlassModal slide-up animation is smooth (60fps)
- [ ] Swipe-to-dismiss gesture works reliably
- [ ] Desktop hover effects unchanged
- [ ] GlassInput is comfortable on mobile (56px+ height)
- [ ] Dashboard is scannable on mobile without excessive scrolling
- [ ] Lighthouse mobile performance score >= 85

---

## Final Iteration Notes

This is the **last iteration of plan-11**. Upon completion:

1. Mirror of Dreams will have a fully mobile-native experience
2. Bottom navigation, full-screen reflection, and polished touch interactions
3. The app will feel "designed for mobile" rather than "adapted to mobile"

Success metric: Users should rate the mobile experience 8/10 or higher for "feels native."
