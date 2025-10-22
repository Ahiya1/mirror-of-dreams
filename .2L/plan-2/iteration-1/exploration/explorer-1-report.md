# Explorer 1 Report: Architecture & Component Structure

## Executive Summary

The Mirror of Dreams codebase is a mature Next.js 14 application with hybrid architecture - mixing new Next.js App Router patterns (app/ directory) with legacy React components (src/ directory). The existing styling leverages Tailwind CSS with extensive custom CSS variables (330+ lines) and animation utilities (755+ lines). The design system foundation requires creating 10 new glassmorphism components organized under `components/ui/glass/`, extending tailwind.config.ts with 15+ colors and gradient utilities, and establishing TypeScript prop interfaces following existing patterns. **Framer Motion is NOT currently installed** and must be added as a dependency.

## Discoveries

### Current Architecture

**Hybrid Directory Structure:**
- **Next.js App Router**: `/app` - Modern SSR pages with tRPC integration
  - Dashboard, Dreams, Reflection, Evolution, Visualizations pages
  - API routes under `/app/api/trpc/`
- **Legacy Components**: `/src/components` - React components (to be deprecated)
  - Auth, Dashboard, Mirror, Portal modules
- **New Components**: `/components` - Modern Next.js components
  - Dashboard cards, Dreams, Portal, Reflection, Reflections components
  - Organized by feature domain (dashboard/, dreams/, portal/, etc.)

**Styling Approach:**
- **Primary**: Tailwind CSS 3.4.1 with custom config
- **Secondary**: CSS Modules for component-specific styles (3 .module.css files)
- **Global**: Extensive CSS custom properties in `styles/variables.css` (330 lines)
- **Animations**: Dedicated `styles/animations.css` (755 lines) with 30+ keyframes
- **Utilities**: `lib/utils.ts` provides `cn()` helper (clsx + tailwind-merge)

**TypeScript Configuration:**
- Paths aliased: `@/*`, `@/components/*`, `@/lib/*`, `@/types/*`, `@/server/*`
- Centralized types in `/types` directory with barrel exports
- Existing component-specific types (e.g., `components/reflections/types.ts`)

### Existing Component Patterns

**DashboardCard Component** (Paradigm Example):
```typescript
// Location: components/dashboard/shared/DashboardCard.tsx
// Pattern: Client component with variant system, animation support, ripple effects
interface DashboardCardProps {
  variant?: 'default' | 'premium' | 'creator';
  animated?: boolean;
  animationDelay?: number;
  hoverable?: boolean;
  breathing?: boolean;
}
```
- Uses inline `<style jsx>` for component-specific styles
- Includes gradient overlays, shimmer effects, loading/error states
- Exports sub-components (CardHeader, CardTitle, CardContent, CardActions)

**DreamCard Component** (Feature-Specific):
```typescript
// Location: components/dreams/DreamCard.tsx
// Pattern: Feature-focused with inline styles, status-based variants
<style jsx>{`
  .dream-card {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
  }
`}</style>
```
- Inline JSX styles for encapsulation
- Status-based color systems (active, achieved, archived, released)
- Category emojis and semantic coloring

**CosmicBackground Component** (Shared Utility):
```typescript
// Location: components/shared/CosmicBackground.tsx
// Pattern: Accessibility-aware, reduced motion support
const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
```
- Media query listeners for `prefers-reduced-motion`
- Conditional animation rendering
- Inline `<style jsx>` with dynamic CSS properties

### Current Tailwind Configuration

**Minimal Extension (40 lines):**
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      cosmic: {
        purple: '#8B5CF6',
        blue: '#3B82F6',
        gold: '#F59E0B',
        indigo: '#6366F1',
        pink: '#EC4899',
      },
    },
    animation: {
      'float': 'float 6s ease-in-out infinite',
      'shimmer': 'shimmer 2s linear infinite',
      'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    keyframes: {
      float: {...},
      shimmer: {...},
    },
  },
},
plugins: [require('tailwindcss-animate')],
```

**CSS Variables System (Heavy Usage):**
- `styles/variables.css`: 330 lines defining custom properties
- Color system: `--cosmic-bg`, `--cosmic-text-*`, `--glass-*`, tone colors (fusion, gentle, intense)
- Shadows & glows: `--shadow-xs` through `--shadow-2xl`, `--glow-sm` through `--glow-xl`
- Transitions: `--transition-fast/smooth/slow/elegant`
- Component values: `--card-padding`, `--button-radius`, etc.

### Existing Animation System

**CSS Animations (755 lines in animations.css):**
- **Entrance**: fadeIn, slideInUp/Down/Left/Right, scaleIn, cardEntrance
- **Continuous**: breathe, pulse, float, spin, shimmer, glow
- **Utility Classes**: `.animate-fade-in`, `.animate-card-entrance`, `.animate-pulse-glow`
- **Delays**: `.animate-delay-100` through `.animate-delay-1000`
- **Accessibility**: Full `@media (prefers-reduced-motion: reduce)` support

**No Framer Motion Yet:**
- Package.json does NOT include `framer-motion`
- Current animations are pure CSS
- Vision requires Framer Motion 11.x for complex interactions

## Patterns Identified

### Pattern 1: Component Organization by Feature Domain

**Description:** Components grouped by feature area, not by type

**Structure:**
```
components/
├── dashboard/          # Dashboard-specific
│   ├── cards/         # Sub-feature
│   └── shared/        # Shared within domain
├── dreams/            # Dreams-specific
├── portal/            # Portal-specific
├── reflection/        # Reflection-specific
├── reflections/       # Reflections-specific
├── providers/         # App-level providers
└── shared/            # Cross-domain shared
```

**Recommendation:** **Use this pattern** for new glass components. Create `components/ui/glass/` as a cross-domain UI library.

### Pattern 2: Hybrid Styling Strategy

**Description:** Mix of Tailwind utility classes, CSS modules, and inline JSX styles

**Current Usage:**
- **Tailwind**: Layout, spacing, responsive design
- **CSS Modules**: Component-specific overrides (DashboardGrid.module.css, ReflectionItem.module.css)
- **Inline JSX**: Component-encapsulated styles with dynamic values
- **Global CSS**: Variables, animations, utility classes

**Recommendation:** **Extend this pattern** for glass components:
1. Use Tailwind for spacing, layout, responsive
2. Extend tailwind.config.ts for glass colors, gradients, effects
3. Use inline JSX styles for component-specific glass effects
4. Keep animations in dedicated files or Framer Motion variants

### Pattern 3: TypeScript Props with Variants

**Description:** Strict TypeScript interfaces with variant discrimination

**Example:**
```typescript
interface DashboardCardProps {
  variant?: 'default' | 'premium' | 'creator';
  animated?: boolean;
  animationDelay?: number;
}
```

**Recommendation:** **Apply to all new components**. Example for GlassCard:
```typescript
interface GlassCardProps {
  variant?: 'default' | 'elevated' | 'inset';
  glassIntensity?: 'subtle' | 'medium' | 'strong';
  glowColor?: 'purple' | 'blue' | 'cosmic';
  animated?: boolean;
  children: ReactNode;
}
```

### Pattern 4: Accessibility-First Animation

**Description:** All animations respect `prefers-reduced-motion` and high contrast

**Implementation:**
```typescript
const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  setPrefersReducedMotion(mediaQuery.matches);
}, []);

const shouldAnimate = animated && !prefersReducedMotion;
```

**Recommendation:** **Mandatory for all new components**. Framer Motion has built-in support via `useReducedMotion()` hook.

## Complexity Assessment

### High Complexity Areas

**1. Tailwind Config Extension (3-4 hours)**
- **Why Complex**: Must add 15+ colors without breaking existing `cosmic.*` palette
- **Challenge**: Gradient utilities require custom plugin or `backgroundImage` object
- **Challenge**: Glass effects (`backdrop-blur`, custom shadows) need careful naming to avoid conflicts
- **Estimated Splits**: NO SPLIT - Single coherent config file

**2. Component Library Architecture (4-5 hours)**
- **Why Complex**: 10 components with interdependencies (GlassModal uses GlassCard)
- **Challenge**: Export strategy must support tree-shaking
- **Challenge**: Shared prop interfaces (e.g., all components need `GlassBaseProps`)
- **Estimated Splits**: POSSIBLE SPLIT - Could divide into 2 sub-builders:
  - Sub-builder A: Base components (GlassCard, GlowButton, GradientText)
  - Sub-builder B: Complex components (GlassModal, FloatingNav, ProgressOrbs)

**3. Animation Variants with Framer Motion (3-4 hours)**
- **Why Complex**: Transition from CSS to Framer Motion for 6+ components
- **Challenge**: Must maintain existing CSS animations for backward compatibility
- **Challenge**: Define reusable motion variants (slide, fade, scale, glow pulse)
- **Estimated Splits**: NO SPLIT - Animation system should be unified

### Medium Complexity Areas

**1. TypeScript Type Definitions (2 hours)**
- Create `types/glass-components.ts` with shared interfaces
- Export from `types/index.ts` barrel
- Component-specific prop interfaces

**2. CSS Custom Properties Addition (1-2 hours)**
- Extend `styles/variables.css` with glass-specific values
- Add gradient definitions
- Add glow shadow definitions

**3. Utility Functions (1 hour)**
- Create `lib/animations.ts` for Framer Motion variants
- Extend `lib/utils.ts` with glass-specific helpers

### Low Complexity Areas

**1. Directory Creation**
- `components/ui/glass/` structure setup
- Export barrel files

**2. Component Placeholders**
- Stub files for all 10 components
- Basic TypeScript scaffolding

**3. Documentation**
- Component usage examples
- Prop interface documentation

## Technology Recommendations

### Primary Stack (Already Established)

**Framework: Next.js 14**
- **Rationale**: Already in use, App Router for SSR, tRPC integration
- **Glass System Fit**: Client components for interactive glass effects

**Styling: Tailwind CSS 3.4.1**
- **Rationale**: Existing extensive configuration, utility-first approach
- **Extension Strategy**: 
  - Add custom colors via `theme.extend.colors`
  - Add gradients via `theme.extend.backgroundImage`
  - Add glass utilities via custom plugin or JIT arbitrary values

**TypeScript: 5.9.3**
- **Rationale**: Strict mode enabled, path aliases configured
- **Type Strategy**: Centralized types in `/types/glass-components.ts`

### Supporting Libraries (To Be Added)

**Framer Motion: 11.x (REQUIRED - NOT INSTALLED)**
- **Purpose**: Complex animations for GlassModal, CosmicLoader, ProgressOrbs
- **Installation**: `npm install framer-motion@^11.0.0`
- **Why Needed**: 
  - CSS animations insufficient for physics-based effects (spring, inertia)
  - Layout animations for modals and navigation
  - Gesture recognition (drag, hover, tap)
  - AnimatePresence for enter/exit transitions
- **Integration Point**: Create `lib/animations.ts` with reusable variants:
  ```typescript
  export const glassCardVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
  };
  ```

**Lucide React (OPTIONAL - Recommended)**
- **Purpose**: Clean, modern icons for components
- **Rationale**: Currently using emojis (🪞✨🏔️), Lucide provides professional alternatives
- **Installation**: `npm install lucide-react`
- **Usage Example**: `<Sparkles className="w-5 h-5" />` instead of ✨

### Font Recommendations (Vision Requirement)

**Primary: Inter (via Google Fonts)**
- **Purpose**: Headings and body text
- **Implementation**: Already using system fonts, add Inter for polish
- **Next.js Integration**:
  ```typescript
  // app/layout.tsx
  import { Inter } from 'next/font/google';
  const inter = Inter({ subsets: ['latin'] });
  ```

**Accent: Playfair Display (Optional)**
- **Purpose**: Magical quotes, special headings
- **Usage**: Limited to reflection outputs, dream titles

## Integration Points

### Tailwind Config ↔ Glass Components

**How They Connect:**
1. Tailwind config defines color palette (`mirror-dark`, `mirror-purple`, etc.)
2. Components use via className: `bg-mirror-dark border-mirror-purple/30`
3. CSS variables bridge gap: Tailwind generates from `theme.extend.colors`

**Implementation:**
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'mirror-dark': '#0f172a',
      'mirror-blue': '#3b82f6',
      'mirror-purple': '#a855f7',
      'mirror-violet': '#8b5cf6',
      'mirror-indigo': '#6366f1',
      'mirror-cyan': '#06b6d4',
      // 10+ more shades
    },
    backgroundImage: {
      'gradient-cosmic': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'gradient-dream': 'radial-gradient(circle at top right, #a855f7, transparent)',
    },
    backdropBlur: {
      'glass': '16px',
    },
    boxShadow: {
      'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
      'glow-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
    },
  },
}
```

### Framer Motion ↔ Component Animation

**How They Connect:**
1. Create `lib/animations.ts` with shared motion variants
2. Components import and apply variants
3. AnimatePresence wraps conditional renders (modals, toasts)

**Implementation:**
```typescript
// lib/animations.ts
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

// components/ui/glass/GlassCard.tsx
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

export const GlassCard = ({ children }) => (
  <motion.div variants={fadeInUp} initial="initial" animate="animate">
    {children}
  </motion.div>
);
```

### Types ↔ Components

**How They Connect:**
1. Shared base interfaces in `types/glass-components.ts`
2. Component-specific extensions
3. Exported via `types/index.ts` barrel

**Implementation:**
```typescript
// types/glass-components.ts
export interface GlassBaseProps {
  className?: string;
  glassIntensity?: 'subtle' | 'medium' | 'strong';
  glowColor?: 'purple' | 'blue' | 'cosmic';
}

export interface GlassCardProps extends GlassBaseProps {
  variant?: 'default' | 'elevated' | 'inset';
  hoverable?: boolean;
  children: ReactNode;
}

// types/index.ts
export * from './glass-components';
```

### Global Styles ↔ Component Styles

**Current Pattern:**
- `styles/variables.css` defines CSS custom properties
- `styles/animations.css` defines keyframes
- Components use via `var(--cosmic-text)` or animation classes

**Recommendation for Glass System:**
- **Keep existing**: Don't migrate CSS variables to Tailwind
- **Extend variables.css**: Add `--glass-blur`, `--glass-border`, `--glass-glow`
- **Hybrid approach**: Use Tailwind for layout, CSS vars for effects
  ```css
  /* styles/variables.css - ADD THESE */
  --glass-blur-subtle: 8px;
  --glass-blur-medium: 16px;
  --glass-blur-strong: 24px;
  
  --glass-bg-subtle: rgba(255, 255, 255, 0.03);
  --glass-bg-medium: rgba(255, 255, 255, 0.05);
  --glass-bg-strong: rgba(255, 255, 255, 0.08);
  ```

## Risks & Challenges

### Technical Risks

**Risk 1: Tailwind Config Bloat**
- **Impact**: Adding 15+ colors + gradients increases build time
- **Mitigation**: Use Tailwind JIT mode (already enabled), lazy load variants
- **Probability**: LOW - Tailwind 3.x handles large configs efficiently

**Risk 2: Framer Motion Bundle Size**
- **Impact**: Framer Motion adds ~40KB gzipped to client bundle
- **Mitigation**: Tree-shake unused features, lazy load heavy components (CosmicLoader)
- **Probability**: MEDIUM - Acceptable tradeoff for animation quality
- **Verification**: Run `npm run build` and check bundle size report

**Risk 3: Browser Compatibility (backdrop-filter)**
- **Impact**: `backdrop-filter: blur()` not supported in older browsers (<2020)
- **Mitigation**: Feature detection + fallback solid backgrounds
- **Probability**: LOW - Target modern browsers (Chrome 90+, Safari 14+, Firefox 88+)
- **Code Example**:
  ```typescript
  const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
  className={supportsBackdropFilter ? 'backdrop-blur-glass' : 'bg-mirror-dark/90'}
  ```

**Risk 4: CSS Custom Property Conflicts**
- **Impact**: New `--glass-*` variables conflict with existing `--glass-*` in variables.css
- **Mitigation**: Audit existing variables before adding new ones
- **Probability**: MEDIUM - variables.css already has `--glass-bg`, `--glass-border`
- **Resolution**: Namespace new variables as `--glass-effect-*` or `--mirror-glass-*`

### Complexity Risks

**Risk 1: Component Interdependencies**
- **Impact**: GlassModal depends on GlassCard, creates build order issues
- **Mitigation**: Design components as composable primitives, avoid circular deps
- **Split Strategy**: If builder gets stuck, split into:
  - Phase 1: Primitives (GlassCard, GlowButton, GradientText)
  - Phase 2: Composites (GlassModal, FloatingNav, ProgressOrbs)

**Risk 2: Animation Performance on Mobile**
- **Impact**: Multiple blur effects + Framer Motion slow on low-end devices
- **Mitigation**: Reduce blur intensity on mobile, use `will-change` property
- **Testing**: Test on iPhone 12 / Pixel 5 equivalent
- **Code Example**:
  ```typescript
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const blurIntensity = isMobile ? 'subtle' : 'medium';
  ```

**Risk 3: TypeScript Strict Mode Compliance**
- **Impact**: Existing code uses strict mode, new components must too
- **Mitigation**: Enable `strict: true` in tsconfig, use proper typing
- **Probability**: LOW - Team already follows strict typing patterns

## Recommendations for Planner

### 1. Dependency Installation Strategy

**Install Framer Motion First** (Before any component work):
```bash
npm install framer-motion@^11.0.0
```

**Reason**: Components will import from `framer-motion`, must be available immediately

**Optional (Iteration 2)**: Add Lucide React for icons
```bash
npm install lucide-react
```

### 2. File Organization Structure

**Recommended Structure:**
```
components/ui/glass/
├── index.ts                    # Barrel export
├── GlassCard.tsx               # Base card component
├── GlowButton.tsx              # Button variants
├── CosmicLoader.tsx            # Animated loader
├── DreamCard.tsx               # Dream-specific card (extends GlassCard)
├── GradientText.tsx            # Text with gradient
├── GlassModal.tsx              # Modal overlay (uses GlassCard)
├── FloatingNav.tsx             # Navigation bar
├── ProgressOrbs.tsx            # Multi-step indicator
├── GlowBadge.tsx               # Status badges
└── AnimatedBackground.tsx      # Gradient background

lib/
├── animations.ts               # Framer Motion variants
└── glass-utils.ts              # Glass-specific utilities (optional)

types/
└── glass-components.ts         # TypeScript interfaces

styles/
└── variables.css               # EXTEND with --glass-* vars
```

**Export Strategy (components/ui/glass/index.ts):**
```typescript
// Named exports for tree-shaking
export { GlassCard } from './GlassCard';
export { GlowButton } from './GlowButton';
export { CosmicLoader } from './CosmicLoader';
// ... etc

// Type exports
export type { GlassCardProps, GlowButtonProps } from '@/types/glass-components';
```

### 3. Tailwind Config Extension Approach

**Extend, Don't Replace:**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      // KEEP existing cosmic colors
      colors: {
        cosmic: { /* existing */ },
        // ADD new mirror colors
        mirror: {
          dark: '#0f172a',
          midnight: '#1e293b',
          blue: '#3b82f6',
          purple: '#a855f7',
          violet: '#8b5cf6',
          indigo: '#6366f1',
          cyan: '#06b6d4',
          // ... 8 more shades
        },
      },
      // ADD gradients
      backgroundImage: {
        'gradient-cosmic': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-dream': 'radial-gradient(circle at top right, #a855f7, transparent)',
      },
      // ADD glass utilities
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
      },
      // KEEP existing animations
      animation: { /* existing + new */ },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### 4. Builder Work Allocation

**Single Builder Approach (Recommended):**
- One builder handles all 10 components + config
- **Duration**: 8-12 hours
- **Risk**: Might feel overwhelming, but maintains consistency

**Split Builder Approach (If Complexity High):**
- **Builder A** (5-7 hours):
  - Tailwind config extension
  - CSS variables addition
  - Animation variants file
  - Base components: GlassCard, GlowButton, GradientText, GlowBadge
  
- **Builder B** (4-6 hours):
  - Complex components: GlassModal, FloatingNav, ProgressOrbs, CosmicLoader
  - AnimatedBackground, DreamCard
  - Depends on Builder A's primitives

**Recommendation**: **Start with single builder**. Only split if builder requests it after 4 hours.

### 5. Testing & Validation Strategy

**Component Showcase Page** (Build First):
```typescript
// app/design-system/page.tsx
export default function DesignSystemShowcase() {
  return (
    <div className="p-8 space-y-8">
      <section>
        <h2>Glass Cards</h2>
        <GlassCard variant="default">Default</GlassCard>
        <GlassCard variant="elevated">Elevated</GlassCard>
      </section>
      {/* ... all 10 components */}
    </div>
  );
}
```

**Performance Benchmarks**:
- Lighthouse score >90 (Vision requirement)
- FPS during animations: 60fps on desktop, 30fps minimum on mobile
- Paint times <100ms for component render

**Browser Compatibility**:
- Chrome 90+ (backdrop-filter support)
- Safari 14+ (backdrop-filter support)
- Firefox 88+ (backdrop-filter support)

### 6. Accessibility Requirements

**Mandatory for All Components**:
1. **Reduced Motion**: `useReducedMotion()` from Framer Motion
2. **Keyboard Navigation**: `tabIndex`, `onKeyDown` handlers
3. **ARIA Labels**: `aria-label`, `aria-describedby` where needed
4. **Contrast Ratios**: WCAG AA (4.5:1 for text, 3:1 for UI)
5. **Focus Indicators**: Visible outline on `:focus-visible`

**Code Template**:
```typescript
import { useReducedMotion } from 'framer-motion';

export const GlassCard = ({ animated = true, ...props }) => {
  const shouldReduceMotion = useReducedMotion();
  const enableAnimations = animated && !shouldReduceMotion;
  
  return (
    <motion.div
      animate={enableAnimations ? 'animate' : false}
      // ...
    />
  );
};
```

## Resource Map

### Critical Files/Directories

**Configuration:**
- `/tailwind.config.ts` - Extend with mirror colors, gradients, glass utilities
- `/tsconfig.json` - Path aliases already configured, no changes needed
- `/package.json` - Add `framer-motion@^11.0.0` to dependencies

**Styles:**
- `/styles/variables.css` - EXTEND with `--glass-*` custom properties
- `/styles/animations.css` - Reference for existing patterns, keep as-is
- `/styles/globals.css` - No changes needed

**Components (New):**
- `/components/ui/glass/` - CREATE directory, 10 new components + barrel export
- `/lib/animations.ts` - CREATE Framer Motion variants file
- `/types/glass-components.ts` - CREATE TypeScript interfaces

**Components (Reference):**
- `/components/dashboard/shared/DashboardCard.tsx` - Component pattern example
- `/components/shared/CosmicBackground.tsx` - Accessibility pattern example
- `/components/dreams/DreamCard.tsx` - Inline style pattern example

**Pages (Testing):**
- `/app/design-system/page.tsx` - CREATE showcase page for testing

### Key Dependencies

**Existing (Already Installed):**
- `next@^14.2.0` - Framework
- `react@^18.3.1` - UI library
- `tailwindcss@^3.4.1` - Styling
- `tailwindcss-animate@^1.0.7` - Animation utilities
- `clsx@^2.1.0` - Class name utility
- `tailwind-merge@^2.2.1` - Tailwind class merging

**To Be Added (Iteration 19):**
- `framer-motion@^11.0.0` - **REQUIRED** for animations
- `lucide-react` - **OPTIONAL** for icons (recommended Iteration 20)

### Testing Infrastructure

**Existing:**
- No formal testing setup (placeholder: `"test": "echo 'Tests would go here'"`)

**Recommended for Iteration 19:**
- **Manual Testing**: Showcase page at `/design-system`
- **Visual Testing**: Compare against Vision design mockups
- **Performance Testing**: Chrome DevTools Lighthouse audit
- **Accessibility Testing**: axe DevTools browser extension

**Future (Iteration 20+):**
- Vitest + Testing Library for unit tests
- Playwright for E2E tests
- Chromatic for visual regression

## Questions for Planner

**Q1: Single vs Split Builder?**
- Should we assign 1 builder for all 10 components, or split into 2 builders (primitives vs composites)?
- **Explorer Recommendation**: Start with 1 builder, split only if requested after 4 hours.

**Q2: Lucide React Icons in Iteration 19?**
- Vision mentions "Lucide React for icons (optional)", but currently using emojis.
- **Explorer Recommendation**: Defer to Iteration 20. Emojis sufficient for MVP.

**Q3: Font Loading Priority?**
- Should we add Inter font in Iteration 19 or defer?
- **Explorer Recommendation**: Defer to Iteration 20. System fonts acceptable for foundation.

**Q4: CSS Variables vs Tailwind for Glass Effects?**
- Should glass blur/background be in variables.css or Tailwind config?
- **Explorer Recommendation**: Tailwind config for consistency with modern approach. Only add CSS vars if Tailwind limitations found.

**Q5: Component Showcase Page Required?**
- Should builder create `/app/design-system/page.tsx` for testing?
- **Explorer Recommendation**: YES - Essential for QA and visual validation. Include in scope.

**Q6: Performance Budget?**
- What's acceptable bundle size increase for Framer Motion (~40KB gzipped)?
- **Explorer Recommendation**: Acceptable if Lighthouse >90 maintained. Monitor closely.

**Q7: Mobile-First or Desktop-First?**
- Which breakpoint to prioritize for glass effects?
- **Explorer Recommendation**: Desktop-first with mobile optimizations (reduced blur). Most users on desktop for "reflection" experience.

---

**End of Report**

**Next Steps for Planner:**
1. Review recommendations and answer questions
2. Assign builder(s) based on complexity assessment
3. Ensure Framer Motion installation in builder instructions
4. Provide vision.md and this report to builder(s)
5. Set success criteria: All 10 components built, showcase page functional, Lighthouse >90

**Builder Handoff Checklist:**
- [ ] Vision.md provided
- [ ] This exploration report provided
- [ ] Framer Motion installation command included
- [ ] Tailwind config extension template provided
- [ ] TypeScript interface examples provided
- [ ] Accessibility requirements emphasized
- [ ] Performance benchmarks defined
- [ ] Showcase page specification included
