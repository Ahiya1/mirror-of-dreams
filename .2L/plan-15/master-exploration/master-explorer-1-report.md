# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Page-by-Page Visual Audit - Design System Compliance Analysis

## Vision Summary
Transform Mirror of Dreams from a collection of inconsistently styled pages into a cohesive world where every surface, button, and transition feels intentional - achieving 90%+ design system compliance across all pages.

---

## Page-by-Page Compliance Matrix

| Page | Current % | GlassCard | GlowButton | mirror.* Colors | Typography System | Glass-morphism | Key Issues |
|------|-----------|-----------|------------|-----------------|-------------------|----------------|------------|
| **design-system** | 100% | Yes | Yes | Yes | Yes | Yes | Reference page |
| **onboarding** | 95% | Yes | Yes | Yes | Mostly | Yes | Minor: manual gradient text |
| **auth/signin** | 90% | Via AuthLayout | Yes | Yes | Yes | Yes | Good compliance |
| **auth/signup** | 90% | Via AuthLayout | Yes | Yes | Yes | Yes | Good compliance |
| **auth/verify-required** | 90% | Yes | Yes | Yes | Manual | Yes | Good compliance |
| **dashboard** | 85% | Via cards | Mixed | Yes | Manual | Yes | cosmic-button in child cards |
| **dreams** | 85% | Yes | Yes | Mostly | text-h1 used | Yes | Good compliance |
| **dreams/[id]** | 30% | No | Mixed | No | No | No | Heavy inline JSX styling |
| **evolution** | 90% | Yes | Yes | Yes | text-h1/h2 used | Yes | Good compliance |
| **evolution/[id]** | 50% | No | Partial | Hardcoded gradients | Manual | Partial | Non-mirror gradients |
| **visualizations** | 90% | Yes | Yes | Yes | text-h1/h2 used | Yes | Good compliance |
| **visualizations/[id]** | 50% | No | No | Hardcoded gradients | Manual | Partial | Non-mirror gradients |
| **reflections** | 50% | No | No | Hardcoded | Manual text-4xl | Partial | Heavy inline styling |
| **reflections/[id]** | 40% | No | Partial | Hardcoded purple/red | Manual | Partial | Custom cards, inline styles |
| **reflection** | 70% | Partial | Mixed | Partial | Mixed | Yes | cosmic-button in child |
| **reflection/output** | 40% | No | No | Hardcoded | Manual | No | Custom CSS file |
| **profile** | 75% | Yes | Yes | Hardcoded blue/red | Manual text-3xl | Yes | Demo banner, danger zone |
| **settings** | 85% | Yes | Via toggles | Yes | Manual text-3xl | Yes | Custom toggle styling |
| **pricing** | 50% | Via PricingCard | Mixed | Hardcoded green | Manual text-4xl | Partial | Toggle buttons inline |
| **subscription/success** | 10% | No | No | Hardcoded | Manual text-2xl | No | Worst offender |
| **subscription/cancel** | 20% | No | No | No | Manual | No | Minimal page but non-compliant |
| **about** | 60% | Yes | Partial | Manual gradients | Manual | Partial | Custom nav, inline gradients |
| **admin** | 80% | Yes | Partial | Custom tier colors | Manual | Yes | Admin-specific colors ok |
| **test-components** | 95% | Yes | Yes | Yes | Yes | Yes | Test page |

---

## Critical Offenders (Priority 1)

### 1. `/app/subscription/success/page.tsx` - 10% Compliance

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/subscription/success/page.tsx`

**Issues:**
- Line 26: `bg-gradient-to-b from-purple-950/50 to-black` - hardcoded gradient, should use CosmicBackground
- Line 28: `text-green-400` - should use `text-mirror-success`
- Line 29: `text-2xl font-bold` - should use `text-h2` or GradientText
- Line 40-43: Custom loading spinner instead of CosmicLoader
- No GlassCard usage
- No GlowButton usage

**Required Changes:**
- Wrap content in GlassCard
- Use CosmicBackground component
- Replace green icon color with mirror.success
- Use GradientText for heading
- Use CosmicLoader for loading state

### 2. `/app/dreams/[id]/page.tsx` - 30% Compliance

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/[id]/page.tsx`

**Issues:**
- Lines 382-758: Massive inline `<style jsx>` block (~375 lines of CSS)
- Lines 481-507: `.btn-primary` and `.btn-danger` - inline button styles instead of GlowButton
- Lines 150-151: `button` elements with inline classes instead of GlowButton
- Lines 311-340: `.status-btn` - custom button styling
- Lines 451-469: Custom status colors instead of mirror.* tokens
- No GlassCard usage for sections

**Required Changes:**
- Replace all `<style jsx>` with design system components
- Convert all buttons to GlowButton variants
- Use GlassCard for sections
- Replace custom status colors with mirror.* palette

### 3. `/app/reflections/page.tsx` - 50% Compliance

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflections/page.tsx`

**Issues:**
- Line 58-61, 82-85: Custom SVG spinner instead of CosmicLoader
- Line 99-118: Hardcoded `border-red-500/20`, `bg-red-900/10`, `text-red-300`, `text-red-400`
- Line 111: `bg-red-600` button instead of GlowButton with variant="danger"
- Line 134: `text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400` - manual typography
- Lines 145-150: Inline button styling instead of GlowButton
- Lines 233-279: Pagination buttons with inline styles

**Required Changes:**
- Replace SVG spinners with CosmicLoader
- Replace error colors with mirror.error
- Convert buttons to GlowButton
- Use text-h1 or GradientText for page title

### 4. `/app/reflections/[id]/page.tsx` - 40% Compliance

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflections/[id]/page.tsx`

**Issues:**
- Line 90-93: Custom SVG spinner instead of CosmicLoader
- Lines 107-128: Hardcoded red error colors
- Line 224: Hardcoded `border-purple-500/30 bg-gradient-to-br from-purple-500/10`
- Lines 281-358: Stats/Actions cards not using GlassCard
- Lines 349-355: Delete button with `bg-red-900/20` instead of GlowButton variant="danger"
- Lines 361-395: Delete confirmation modal not using GlassModal

**Required Changes:**
- Use CosmicLoader for loading
- Replace red colors with mirror.error
- Use GlassCard for content sections
- Convert buttons to GlowButton
- Use GlassModal for delete confirmation

---

## Medium Priority Issues (Priority 2)

### 5. `/app/pricing/page.tsx` - 50% Compliance

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/pricing/page.tsx`

**Issues:**
- Line 139: `text-4xl sm:text-5xl font-bold` - manual typography
- Lines 149-170: Toggle buttons with inline styling instead of design system
- Line 168: `text-green-400` - should use mirror.success
- Lines 290-295: Custom loading spinner instead of CosmicLoader

**Required Changes:**
- Use text-h1 or GradientText for title
- Create toggle component using design system or use existing
- Replace green with mirror.success
- Use CosmicLoader

### 6. `/app/profile/page.tsx` - 75% Compliance

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx`

**Issues:**
- Lines 224-228: `bg-blue-500/10 border-blue-500/30 text-blue-400` - demo banner
- Line 220: `text-3xl font-bold` - should use text-h1
- Lines 410-428: Danger zone with `text-red-400`, `border-red-500/50`, `hover:bg-red-500/10`
- Lines 443-452: Warning section with hardcoded red colors
- Line 477: `bg-red-500 hover:bg-red-600` on delete button

**Required Changes:**
- Replace blue with mirror.info for demo banner
- Replace red with mirror.error for danger zone
- Use text-h1 for page title
- Use GlowButton variant="danger" for delete actions

### 7. `/app/evolution/[id]/page.tsx` - 50% Compliance

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/[id]/page.tsx`

**Issues:**
- Lines 25, 38, 45: `bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900` - non-mirror gradient
- Line 58: `bg-white/10 backdrop-blur-md` - manual glass effect instead of GlassCard
- Line 95: Same manual glass card styling
- Line 175: `bg-white/10 backdrop-blur-md` - manual
- Line 188: Inline button styling instead of GlowButton

**Required Changes:**
- Replace background with CosmicBackground or mirror gradient tokens
- Use GlassCard for all card sections
- Convert button to GlowButton

### 8. `/app/visualizations/[id]/page.tsx` - 50% Compliance

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/[id]/page.tsx`

**Issues:**
- Lines 43, 56, 68: Same non-mirror gradient background
- Lines 81, 107, 205: Manual `bg-white/10 backdrop-blur-md` instead of GlassCard
- Line 73-77: Back button with inline styling instead of GlowButton

**Required Changes:**
- Replace background with CosmicBackground
- Use GlassCard for all sections
- Convert back button to GlowButton

---

## Component-Level Issues (Priority 3)

### Dashboard Cards Using cosmic-button

**Files with cosmic-button class (needs conversion to GlowButton):**

1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/EvolutionCard.tsx`
   - Lines 165, 172, 179: `cosmic-button cosmic-button--secondary/primary`

2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/VisualizationCard.tsx`
   - Lines 128, 135: `cosmic-button cosmic-button--secondary/primary`

3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/UsageCard.tsx`
   - Line 78: `cosmic-button cosmic-button--primary`

4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/ReflectionsCard.tsx`
   - Line 38: `cosmic-button cosmic-button--primary`

5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/SubscriptionCard.tsx`
   - Line 247: Dynamic `cosmic-button cosmic-button--${color}`

6. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/DreamsCard.tsx`
   - Lines 59, 140: `cosmic-button cosmic-button--primary/sm/cosmic`

7. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/QuestionStep.tsx`
   - Lines 71-72: `cosmic-button` with dynamic variant

8. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ToneSelection.tsx`
   - Lines 55-56: `cosmic-button` with dynamic variant

---

## Hardcoded Color Patterns Summary

### text-blue-* occurrences (should be mirror.info)
- `/app/profile/page.tsx:225` - `text-blue-400`
- `/components/reflections/ReflectionCard.tsx:20` - `text-blue-300`
- `/components/reflections/ReflectionFilters.tsx:182` - `bg-blue-500`
- `/components/subscription/UsageWarningBanner.tsx:47-49` - blue variants

### text-red-* occurrences (should be mirror.error)
- `/app/profile/page.tsx:411,418,444,447` - red danger zone
- `/app/reflections/page.tsx:105,106` - error text
- `/app/reflections/[id]/page.tsx:109,113,114,349,366` - error/danger
- `/app/admin/page.tsx:82,347` - error states
- `/components/reflection/ToneBadge.tsx:19-20` - intense tone (acceptable?)

### text-green-* occurrences (should be mirror.success)
- `/app/pricing/page.tsx:168` - `text-green-400` save percentage
- `/app/subscription/success/page.tsx:28` - `text-green-400` checkmark
- `/components/subscription/PricingCard.tsx:77,108` - `text-green-400`
- `/app/reflection/MirrorExperience.tsx:333,337,341` - `text-green-400` check icons

---

## Typography Non-Compliance Summary

### Manual text-4xl/5xl/6xl (should use text-h1, text-h2, GradientText)

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| `/app/pricing/page.tsx` | 139 | `text-4xl sm:text-5xl font-bold` | `text-h1` or GradientText |
| `/app/reflections/page.tsx` | 134 | `text-4xl font-bold` | `text-h1` or GradientText |
| `/app/about/page.tsx` | 79 | `text-4xl sm:text-5xl lg:text-6xl` | `text-h1` |
| `/app/page.tsx` | 76 | `text-4xl sm:text-5xl` | `text-h1` (section heading) |
| `/app/reflection/MirrorExperience.tsx` | 686 | `text-4xl md:text-5xl` | GradientText |
| `/app/auth/verify-required/page.tsx` | 111 | `text-6xl mb-6` (emoji) | Acceptable |
| `/app/onboarding/page.tsx` | 130 | `text-6xl mb-4` (emoji) | Acceptable |

---

## Glass-morphism Missing (Need GlassCard)

Pages not using GlassCard for card-like sections:

1. **dreams/[id]** - All sections use inline styled divs
2. **reflections/[id]** - Stats card, Actions card, Delete modal
3. **evolution/[id]** - Header card, Content card, Visualization button card
4. **visualizations/[id]** - Header, Content, Metadata cards
5. **subscription/success** - Main content area
6. **reflection/output** - Mirror frame sections

---

## Reference: Compliant Pages

Use these as templates for fixing non-compliant pages:

1. **`/app/onboarding/page.tsx`** - 95% compliance
   - Proper GlassCard, GlowButton, ProgressOrbs usage
   - GradientText for headings
   - mirror.* color tokens

2. **`/app/design-system/page.tsx`** - 100% compliance
   - Canonical reference for every pattern
   - All glass components demonstrated

3. **`/app/dreams/page.tsx`** - 85% compliance
   - Proper GlassCard, GlowButton, GradientText
   - text-h1 usage
   - EmptyState component

4. **`/app/evolution/page.tsx`** - 90% compliance
   - GlassCard throughout
   - GlowButton for all buttons
   - text-h1/h2 usage

---

## Recommendations Summary

### Iteration Breakdown Suggestion

**Iteration 1: Critical Pages (Estimated: 4-6 hours)**
- subscription/success - Complete redesign
- dreams/[id] - Remove inline styles, add design system components
- reflections/page.tsx - Replace inline styles

**Iteration 2: Medium Priority Pages (Estimated: 3-4 hours)**
- reflections/[id] - Redesign with GlassCard/GlowButton
- pricing/page.tsx - Toggle and typography fixes
- profile/page.tsx - Color token replacements

**Iteration 3: Detail Pages (Estimated: 3-4 hours)**
- evolution/[id] - Background and card fixes
- visualizations/[id] - Background and card fixes
- about/page.tsx - Navigation and card standardization

**Iteration 4: Component Cleanup (Estimated: 2-3 hours)**
- Replace all cosmic-button with GlowButton in dashboard cards
- Update reflection components (QuestionStep, ToneSelection)

---

## Success Metrics

After completion, running these greps should return zero matches (excluding design system files):

```bash
# Hardcoded colors (should be 0 outside design system)
grep -r "text-blue-" --include="*.tsx" app/ components/
grep -r "text-red-" --include="*.tsx" app/ components/
grep -r "text-green-" --include="*.tsx" app/ components/

# Manual typography (should be 0)
grep -r "text-4xl sm:text-5xl" --include="*.tsx" app/
grep -r "text-5xl" --include="*.tsx" app/

# Legacy button class (should be 0)
grep -r "cosmic-button" --include="*.tsx" components/
```

---

*Exploration completed: 2025-12-09*
*This report informs master planning decisions*
