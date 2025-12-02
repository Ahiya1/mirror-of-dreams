# 2L Iteration Plan - Aesthetic Flawlessness Polish

## Project Vision

Transform the Mirror of Dreams app from a 7.5/10 to a 9/10 aesthetic experience by eliminating subtle alignment, spacing, and content rendering issues that prevent it from feeling completely polished and flawless.

This is a **pure polish pass** focused on perfecting existing design, not adding new capabilities.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] **Visual Balance**: Mobile screenshots show centered content with left and right margins within 2px of each other
- [ ] **Navigation Header Slimness**: Header height on mobile is under 48px (target: 44px with py-1.5)
- [ ] **Markdown Consistency**: 100% of card preview components render basic markdown (bold, italic)
- [ ] **Space Efficiency**: Content starts within first 150px of viewport after header on evolution detail pages
- [ ] **User Perception**: Overall aesthetic score of 9/10 or higher

## MVP Scope

**In Scope:**
- Fix mobile dashboard left-shift (padding consistency)
- Slim down mobile navigation header (reduce padding)
- Add markdown support to visualization/evolution cards
- Reduce empty space in evolution reports
- Fix overall mobile content centering across pages

**Out of Scope (Post-MVP):**
- New features or functionality
- Performance optimization (unless directly related to rendering)
- Backend changes
- Authentication or data changes
- Major layout restructuring
- Collapsible demo banner
- Card hover state polish
- Micro-interactions and animations
- Theme variations
- Accessibility audit

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - Estimated 2 hours (2 parallel builders)
4. **Integration** - Estimated 15 minutes
5. **Validation** - Estimated 15 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~2 hours (parallel builders)
- Integration: ~15 minutes
- Validation: ~15 minutes
- Total: ~2.5 hours

## Risk Assessment

### Low Risks

- **Line-clamp compatibility with markdown**: The MarkdownPreview component converts block elements to inline spans, which should preserve line-clamp behavior. Mitigated by testing.

- **Header height calculation impact**: Reducing nav padding will affect the dynamically calculated `--nav-height` variable. The JavaScript measurement in AppNavigation (lines 86-110) will automatically recalculate.

- **Style consistency**: Changes to one page may look inconsistent with unchanged pages. Mitigated by auditing all pages in Builder 1 scope.

### Very Low Risks

- **Performance**: ReactMarkdown adds processing overhead in card lists. Mitigated by limiting input length via maxLength prop. Already used in detail pages with no issues.

## Integration Strategy

1. **Builder 1 (CSS Layout)** and **Builder 2 (Markdown Preview)** work in parallel on separate file sets
2. Files modified by both builders: `app/evolution/page.tsx` and `app/visualizations/page.tsx`
3. Integration conflict resolution:
   - Builder 1 handles layout/spacing changes
   - Builder 2 handles content rendering changes
   - Both changes are to different lines (CSS classes vs JSX content)
4. Final integration merges both builders' changes with line-level precision

## Deployment Plan

1. Merge both builders' changes to main branch
2. Verify all success criteria via visual testing
3. Test on common mobile widths: 375px, 390px, 414px, 428px
4. Deploy to production via existing CI/CD pipeline

---

**Plan Status:** PLANNED
**Ready for:** Building Phase
