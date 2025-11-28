# Builder Task Breakdown - Plan-7 Iteration 14

## Overview

**3 primary builders** will work in parallel on distinct feature areas.

**Estimated total time:** 12-16 hours (parallel execution)

**Integration strategy:** Minimal file overlap, clean handoffs via shared constants.

**Key principle:** Extend existing components, don't rebuild. 80% of code already exists.

---

## Builder-1: Individual Reflection Display Enhancement

### Scope

Enhance the reading experience for individual reflections with visual hierarchy, larger first paragraphs, gold highlighting for key insights, and improved typography.

**Primary files:**
- `/components/reflections/AIResponseRenderer.tsx` (extend markdown components)
- `/app/reflections/[id]/page.tsx` (visual header, actions)
- `/lib/utils.ts` (add date formatting helper)

### Complexity Estimate

**MEDIUM**

The reflection display already works well. This builder polishes typography, adds visual hierarchy, and improves readability. No complex logic, mostly styling and component extensions.

### Success Criteria

- [ ] First paragraph of AI response is 1.25rem (20px), draws reader in
- [ ] All paragraphs have line-height 1.8 (optimal reading)
- [ ] Strong tags (`<strong>`) highlighted with gold background (`bg-amber-400/10`)
- [ ] Dream name in header is large gradient (text-3xl or text-4xl)
- [ ] Date formatted with ordinal suffix ("November 28th, 2025")
- [ ] "Reflect Again" button navigates to reflection form
- [ ] Max-width 720px maintained (already correct)
- [ ] Collapsible user reflections work (already implemented, verify)
- [ ] Mobile responsive (tested on iPhone SE)

### Files to Create

**New utility:**
- `lib/utils/dateFormat.ts` - Ordinal suffix helper

**No new components** - all enhancements to existing files.

### Files to Modify

1. **`/components/reflections/AIResponseRenderer.tsx`** (118 lines)
   - Change `<strong>` color from `text-purple-300` to `text-amber-400` with `bg-amber-400/10 px-1 rounded`
   - Update `<p>` line-height from `leading-relaxed` (1.625) to `leading-[1.8]`
   - Add first-paragraph detection: `first:text-xl first:text-white`
   - Keep all other markdown components unchanged (headings, lists, blockquotes)

2. **`/app/reflections/[id]/page.tsx`** (387 lines)
   - Header section (lines ~170-195):
     - Increase dream name size: `text-3xl md:text-4xl` with cosmic gradient
     - Format date with ordinal suffix: `formatDateWithOrdinal(reflection.createdAt)`
     - Keep tone badge unchanged (already styled)
   - Actions section (lines ~318-344):
     - Add "Reflect Again" button before "Copy Text"
     - Links to `/reflection?dreamId={reflection.dreamId}` (if dreamId available)
   - Verify collapsible `<details>` element still works

3. **`/lib/utils.ts`** (current utilities file)
   - Add `formatDateWithOrdinal()` function
   - Add `getOrdinalSuffix()` helper (1st, 2nd, 3rd, 4th, etc.)

### Dependencies

**Depends on:** None (Builder-1 is independent)

**Blocks:** None (other builders don't need these changes)

### Implementation Notes

1. **First paragraph detection:** Use CSS `:first-child` or `first:` Tailwind class. ReactMarkdown renders paragraphs as direct children, so this works reliably.

2. **Gold highlighting rationale:** Strong tags in AI responses indicate key insights. Gold (amber-400) stands out against purple theme without being jarring. Background highlight makes them scannable.

3. **Ordinal suffix algorithm:**
   ```typescript
   function getOrdinalSuffix(day: number): string {
     if (day > 3 && day < 21) return 'th'; // 11th, 12th, 13th
     switch (day % 10) {
       case 1: return 'st';
       case 2: return 'nd';
       case 3: return 'rd';
       default: return 'th';
     }
   }
   ```

4. **"Reflect Again" button:** Check if `reflection.dreamId` exists in data. If not, navigate to `/reflection` without query param (user selects dream manually).

5. **Mobile testing:** Verify 720px max-width works on small screens (iPhone SE = 375px). Typography should scale down gracefully.

### Patterns to Follow

Reference `patterns.md`:
- **AI Response Enhancement Pattern** (complete code example)
- **Date Formatting Pattern** (ordinal suffix)
- **Reduced Motion Pattern** (if adding any animations)

### Testing Requirements

**Manual testing:**
- [ ] View 3-5 different reflections with varied AI response formats
- [ ] Verify first paragraph is larger and brighter
- [ ] Check gold highlights on strong tags
- [ ] Test "Reflect Again" button navigation
- [ ] Verify date formatting ("28th" not "28")
- [ ] Test on mobile (responsive layout)
- [ ] Keyboard navigation (tab through actions)
- [ ] Reduced motion (no animations added, verify existing respect it)

**Edge cases:**
- AI response with no markdown (plain text fallback)
- AI response with no strong tags (no highlights, graceful)
- Very long dream name (ellipsis or wrap)
- Missing dreamId (Reflect Again navigates to form root)

### Potential Split Strategy

**Not needed** - Complexity is MEDIUM, manageable by one builder in 4-6 hours.

If builder gets blocked, could split:
- **Foundation:** AIResponseRenderer enhancements (3 hours)
- **Polish:** Header and actions (1-2 hours)

---

## Builder-2: Reflection Form Enhancement (Micro-Copy & Character Counter)

### Scope

Transform the reflection form from functional to welcoming. Add warm micro-copy, redesign character counter to show words instead of characters with color progression (white → gold → purple), and enhance tone selection cards with descriptions and hover glow.

**Primary files:**
- `/components/ui/glass/GlassInput.tsx` (extend with word counter)
- `/app/reflection/MirrorExperience.tsx` (add micro-copy, use new counter)
- `/components/reflection/ToneSelectionCard.tsx` (add descriptions, hover glow)
- `/lib/utils/constants.ts` (add micro-copy and tone descriptions)
- `/lib/animations/variants.ts` (update counter color variants)

### Complexity Estimate

**MEDIUM-HIGH**

This builder modifies a core shared component (GlassInput) used across the app. Backward compatibility is critical. Micro-copy requires iteration and review. Highest complexity of the 3 builders, but still manageable.

### Success Criteria

- [ ] GlassInput supports word counting mode without breaking existing usages
- [ ] Character counter shows "342 thoughtful words" format
- [ ] Color progression: white (0-50%) → gold (50-90%) → purple (90-100%)
- [ ] NO red "danger" state (removed)
- [ ] Reflection form welcome message: "Welcome to your sacred space..."
- [ ] After dream selection: "Beautiful choice. Let's explore [Dream Name]..."
- [ ] Tone cards show 2-3 sentence descriptions
- [ ] Tone cards glow on hover (fusion=gold, gentle=blue, intense=purple)
- [ ] All micro-copy reviewed by Ahiya for warmth
- [ ] All existing forms (auth, settings) still work correctly
- [ ] Reduced motion respected (hover glows disabled)

### Files to Create

**New utilities:**
- `lib/utils/wordCount.ts` - Word counting logic
- `lib/utils/microCopy.ts` - All micro-copy constants (optional, could go in constants.ts)

### Files to Modify

1. **`/components/ui/glass/GlassInput.tsx`** (191 lines) - **CRITICAL: BACKWARD COMPATIBILITY**
   - Add new optional props:
     - `counterMode?: 'characters' | 'words'` (default: 'characters')
     - `counterFormat?: (count: number, max: number) => string`
   - Modify counter logic to support word counting
   - Update color states (remove red danger, use purple for high)
   - Add `aria-live="polite"` for accessibility
   - Test with all existing usages before completion

2. **`/app/reflection/MirrorExperience.tsx`** (860 lines)
   - Add welcome message after dream selection (line ~310)
   - Update all GlassInput usages to use `counterMode="words"`
   - Add custom `counterFormat` for encouraging messages
   - No changes to form logic, just presentation

3. **`/components/reflection/ToneSelectionCard.tsx`** (156 lines)
   - Add `description` prop (string)
   - Add hover glow effect using Framer Motion
   - Color mapping: fusion=gold, gentle=blue, intense=purple
   - Respect reduced motion (no hover effects if disabled)

4. **`/lib/utils/constants.ts`** (86 lines)
   - Add `MICRO_COPY` object with all form messages
   - Add `TONE_DESCRIPTIONS` object (extend existing TONES)

5. **`/lib/animations/variants.ts`** (332 lines)
   - Rename `characterCounterVariants` to `wordCounterVariants`
   - Update `danger` state to use purple (`#a855f7`) instead of red
   - Add `toneHoverVariants` for tone card glow

6. **`/lib/utils/wordCount.ts`** (new file)
   - `countWords(text: string): number`
   - `formatWordCount(count: number): string`
   - `getWordCountState(count: number, maxChars: number): 'low' | 'mid' | 'high'`

### Dependencies

**Depends on:** None (Builder-2 is independent)

**Blocks:** None (but must test GlassInput backward compatibility before merging)

### Implementation Notes

1. **GlassInput backward compatibility:** All new props must be optional with sensible defaults. Existing forms (auth, settings, profile) use `counterMode="characters"` by default.

2. **Word counting algorithm:**
   ```typescript
   function countWords(text: string): number {
     if (!text.trim()) return 0;
     return text.trim().split(/\s+/).filter(Boolean).length;
   }
   ```
   Handles empty strings, multiple spaces, line breaks correctly.

3. **Micro-copy tone:** Draft all copy in constants first, then Ahiya reviews in one batch. Two iteration cycles expected (draft → feedback → final).

4. **Tone card glow colors:**
   - Fusion: `rgba(251, 191, 36, 0.3)` (gold)
   - Gentle: `rgba(59, 130, 246, 0.3)` (blue)
   - Intense: `rgba(168, 85, 247, 0.3)` (purple)

5. **Testing all GlassInput usages:** Before marking complete, manually test:
   - Auth forms (sign in, sign up)
   - Profile page (name, email, password fields)
   - Settings page (if any text inputs)
   - Reflection form (all 4 question fields)

### Patterns to Follow

Reference `patterns.md`:
- **Word Counting Pattern** (complete GlassInput implementation)
- **Micro-Copy Guidelines** (tone and examples)
- **Tone Selection Enhancement Pattern** (hover glow code)
- **Reduced Motion Pattern** (disable animations)

### Testing Requirements

**Manual testing:**
- [ ] Reflection form shows word counter with encouraging messages
- [ ] Character counter color progression: white → gold → purple
- [ ] Tone cards glow on hover (correct colors per tone)
- [ ] Auth forms still work (sign in, sign up)
- [ ] Profile page still works (name change, email change)
- [ ] Settings page still works (if text inputs exist)
- [ ] Reduced motion: Hover glows disabled
- [ ] Keyboard navigation: Tab through tone cards, Enter to select
- [ ] Screen reader: Counter updates announced

**Edge cases:**
- Empty text: 0 words (not undefined or error)
- Very long text: 1000+ words (counter still visible)
- Single word: "1 word" (not "1 words")
- Multiple spaces: "hello    world" = 2 words
- Non-English text: Document behavior (word counting may not work for CJK)

**Backward compatibility checklist:**
- [ ] Sign in form: Character counter still works (if used)
- [ ] Sign up form: Password length counter still works
- [ ] Profile name field: No counter shown (correct)
- [ ] Reflection form: Word counter shown (new behavior)

### Potential Split Strategy

If complexity proves too high, split into:

**Foundation (Builder-2A):** GlassInput word counter extension (4 hours)
- Add word counting props and logic
- Update variants
- Test backward compatibility
- Files: `GlassInput.tsx`, `wordCount.ts`, `variants.ts`

**Polish (Builder-2B):** Micro-copy and tone enhancements (2-3 hours)
- Add welcome messages to reflection form
- Enhance tone selection cards
- Add micro-copy constants
- Files: `MirrorExperience.tsx`, `ToneSelectionCard.tsx`, `constants.ts`

---

## Builder-3: Empty States & Collection Enhancements

### Scope

Redesign empty states across 5 pages with cosmic-themed illustrations and warm copy. Add date range filter to reflection collection. Verify card hover effects and sort options.

**Primary files:**
- `/components/shared/EmptyState.tsx` (already supports illustrations, just verify)
- `/components/shared/illustrations/*` (create 4-5 new illustration components)
- `/components/reflections/ReflectionFilters.tsx` (add date range filter)
- `/components/reflections/ReflectionCard.tsx` (verify hover, minimal changes)
- All empty state pages: dashboard, dreams, reflections, evolution, visualizations

### Complexity Estimate

**LOW-MEDIUM**

EmptyState component already has illustration prop from Plan-6. This builder creates simple CSS art illustrations (gradients + emojis) and updates copy on 5 pages. Date range filter is straightforward (dropdown, no complex date picker). Lowest complexity of the 3 builders.

### Success Criteria

- [ ] Dashboard empty state has cosmic dream illustration + warm copy
- [ ] Dreams page empty state has constellation illustration + examples
- [ ] Reflections page empty state has blank journal illustration + CTA
- [ ] Evolution page empty state has progress indicator (already exists, verify)
- [ ] Visualizations page empty state has canvas illustration + unlock message
- [ ] Date range filter on reflections page works (Last 7 days, 30 days, 90 days, All time)
- [ ] Reflection cards have hover lift (already exist, verify working)
- [ ] Sort options labeled correctly (Most Recent, Oldest First, Longest Reflections)
- [ ] All empty states have clear CTAs (buttons navigate correctly)
- [ ] Mobile responsive (illustrations scale down)

### Files to Create

**New illustration components:**
- `components/shared/illustrations/CosmicDream.tsx` (dashboard)
- `components/shared/illustrations/Constellation.tsx` (dreams)
- `components/shared/illustrations/BlankJournal.tsx` (reflections)
- `components/shared/illustrations/CanvasVisual.tsx` (visualizations)

**New utility:**
- `lib/utils/dateRange.ts` - Date range calculation helper

### Files to Modify

1. **`/components/reflections/ReflectionFilters.tsx`** (243 lines)
   - Add date range filter UI (button pills)
   - Add `dateRange` prop and `onDateRangeChange` callback
   - Keep all existing filters (search, tone, premium, sort)

2. **`/app/dashboard/page.tsx`**
   - Update empty state when `dreams.length === 0`
   - Add `<CosmicDream />` illustration
   - Update copy: "Your journey begins with a dream"

3. **`/app/dreams/page.tsx`**
   - Update empty state (line ~158-169)
   - Add `<Constellation />` illustration
   - Update copy with dream examples

4. **`/app/reflections/page.tsx`**
   - Update empty state (line ~158-169)
   - Add `<BlankJournal />` illustration
   - Add date range filter state and pass to ReflectionFilters
   - Update tRPC query to include date range

5. **`/app/evolution/page.tsx`**
   - Verify empty state shows progress indicator (already implemented)
   - Update copy if needed (warm, not clinical)

6. **`/app/visualizations/page.tsx`**
   - Update empty state
   - Add `<CanvasVisual />` illustration
   - Update copy: unlock message

7. **`/components/reflections/ReflectionCard.tsx`** (151 lines)
   - Verify hover lift works (`hover:-translate-y-0.5`)
   - No changes needed (already has GlassCard interactive)

### Dependencies

**Depends on:** None (Builder-3 is independent)

**Blocks:** None (other builders don't need these changes)

### Implementation Notes

1. **Illustration approach:** Use CSS art (gradients, shapes, emojis) for MVP. Faster than custom SVGs, consistent with cosmic theme. Can upgrade to SVGs later if needed.

2. **CSS art pattern:**
   - Outer glow: Radial gradient with blur
   - Inner orb: Gradient with transparency
   - Center icon: Emoji (✨, 🌟, 📔, 🎨)
   - Animation: Subtle pulse (respect reduced motion)

3. **Date range calculation:**
   ```typescript
   function getDateRangeFilter(range: '7days' | '30days' | '90days' | 'all'): Date | undefined {
     if (range === 'all') return undefined;
     const daysAgo = { '7days': 7, '30days': 30, '90days': 90 }[range];
     const cutoff = new Date();
     cutoff.setDate(cutoff.getDate() - daysAgo);
     return cutoff;
   }
   ```

4. **Empty state copy principles:**
   - Title: Short, aspirational (not "No dreams found")
   - Description: Warm, actionable (not "Click here to...")
   - CTA: Clear verb ("Create Your First Dream" not "Get Started")

5. **Mobile illustrations:** Max-width on illustrations (w-32 or w-40) so they don't overwhelm small screens.

### Patterns to Follow

Reference `patterns.md`:
- **Empty State Illustration Pattern** (CSS art examples)
- **Date Range Filter Pattern** (complete filter code)
- **Micro-Copy Guidelines** (empty state copy tone)
- **Reduced Motion Pattern** (pulse animations)

### Testing Requirements

**Manual testing:**
- [ ] View dashboard with no dreams (empty state visible)
- [ ] View dreams page with no dreams (empty state visible)
- [ ] View reflections page with no reflections (empty state visible)
- [ ] View evolution page with <4 reflections (locked message)
- [ ] View visualizations page with <4 reflections (locked message)
- [ ] Test date range filter (Last 7 days filters correctly)
- [ ] Verify reflection cards have hover lift
- [ ] Check sort dropdown labels match plan
- [ ] Test CTAs (buttons navigate to correct pages)
- [ ] Mobile: Illustrations scale down nicely

**Edge cases:**
- Empty state with very long description (wraps correctly)
- Multiple empty states on same page (spacing correct)
- Reduced motion: Pulse animations disabled
- Dark mode: Illustrations visible (contrast sufficient)

### Potential Split Strategy

**Not needed** - Complexity is LOW-MEDIUM, manageable by one builder in 3-4 hours.

If builder wants to parallelize:
- **Illustrations (3A):** Create all 4 CSS art components (1.5 hours)
- **Empty States (3B):** Update all 5 pages with new copy and illustrations (1.5 hours)
- **Filters (3C):** Add date range filter to reflections (1 hour)

All can be done sequentially by one builder.

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

**All 3 builders can start immediately and work in parallel:**

- **Builder-1:** Individual reflection display
- **Builder-2:** Reflection form enhancements
- **Builder-3:** Empty states & collection

**Zero file overlap** - Each builder works in different files.

**Shared constants:** All builders add to `/lib/utils/constants.ts`, but different keys (no conflicts).

### Integration Notes

**Merge order:** Any order is fine, no dependencies.

**Potential conflict areas:**
- `/lib/utils/constants.ts` - All builders may add constants. Merge carefully, no duplicate keys expected.
- No other shared files.

**Integration phase (1-2 hours):**
1. Merge all 3 builder branches
2. Resolve any minor conflicts (constants.ts only)
3. Test end-to-end flow:
   - Reflection form → Submit → View individual → Back to collection
4. Verify empty states on all pages
5. Check bundle size (must be <30KB increase)

**Validation phase (1-2 hours):**
1. Ahiya reviews all micro-copy in one pass
2. Adjust based on feedback (warmth calibration)
3. Final mobile testing
4. Accessibility audit (keyboard navigation, screen reader, reduced motion)

---

## Success Metrics

**Iteration 14 is complete when:**

- [ ] All 3 builders merged without breaking existing features
- [ ] Reflection form feels welcoming (Ahiya approval)
- [ ] Individual reflections visually beautiful (gold highlights, larger first paragraph)
- [ ] Empty states guide action (clear CTAs, warm copy)
- [ ] Date range filter works on reflections collection
- [ ] Bundle size increase <30KB total for Plan-7
- [ ] Zero console errors or warnings
- [ ] WCAG 2.1 AA maintained
- [ ] Reduced motion respected
- [ ] Mobile responsive on iPhone SE and iPad

**Post-merge checklist:**

- [ ] Manual testing on all affected pages (desktop + mobile)
- [ ] Keyboard navigation (tab through all interactive elements)
- [ ] Screen reader spot check (VoiceOver or NVDA)
- [ ] Reduced motion toggle (animations disable)
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] Bundle size measurement (npm run build output)
- [ ] Lighthouse audit (maintain >90 performance)

---

## Notes for All Builders

1. **Read patterns.md first** - Contains copy-pasteable code for every pattern
2. **Extend, don't rebuild** - 80% of code exists, leverage it
3. **Test backward compatibility** - Especially Builder-2 (GlassInput changes)
4. **Respect reduced motion** - All animations must respect `prefers-reduced-motion`
5. **Mobile-first** - Test on small screens (iPhone SE = 375px)
6. **Accessibility** - Keyboard navigation, ARIA labels, semantic HTML
7. **Micro-copy warmth** - Draft in constants, Ahiya reviews in batch
8. **Bundle size** - Monitor impact, lazy-load if needed

**Communication:**
- Update constants.ts carefully (potential merge conflict point)
- Document any deviations from plan in PR description
- Flag blockers immediately (don't spin for hours)

**Definition of Done:**
- Code merged to main
- Manual testing complete (checklist in PR)
- No console errors or warnings
- Micro-copy reviewed by Ahiya (if applicable)
- Bundle size measured and within budget

---

This iteration transforms Mirror of Dreams from functional to emotionally resonant. Focus on warmth, beauty, and honoring the user's reflection journey.
