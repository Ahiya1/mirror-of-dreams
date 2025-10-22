# Technology Stack

## Core Framework

**Decision:** Next.js 14.2.0 (App Router)

**Rationale:**
- Already installed and configured in project
- App Router provides optimal bundle splitting with Server/Client components
- Excellent compatibility with Framer Motion (proven in production)
- tRPC integration already established for backend communication
- Fast Refresh supports rapid development of animated components

**Integration Notes:**
- All design system components MUST use 'use client' directive (Framer Motion requires client-side)
- Showcase page uses App Router for testing
- No changes to existing Next.js configuration needed

**Alternatives Considered:**
- Remix: Would require full migration, not justified for frontend-only redesign
- Vite + React: Loses Next.js SSR benefits, would break existing tRPC setup

---

## Styling System

**Decision:** Tailwind CSS 3.4.1 (with custom theme extensions)

**Rationale:**
- Already installed with comprehensive custom configuration
- Utility-first approach perfect for design system consistency
- JIT mode enables unlimited custom values without bloating CSS
- PurgeCSS built-in removes unused styles automatically
- Excellent TypeScript support via tailwind.config.ts
- tailwindcss-animate plugin already installed (1.0.7)

**Extension Strategy:**

**1. Custom Colors (15+ shades):**
```typescript
// Add to tailwind.config.ts theme.extend.colors
mirror: {
  // Backgrounds
  dark: '#0f172a',           // Deep space blue
  midnight: '#1e293b',       // Card backgrounds
  slate: '#334155',          // Secondary backgrounds

  // Primary Colors
  blue: '#3b82f6',           // Electric blue (primary actions)
  purple: '#a855f7',         // Mystic purple (accents)
  violet: '#8b5cf6',         // Violet glow (secondary actions)
  indigo: '#6366f1',         // Indigo highlights
  cyan: '#06b6d4',           // Cyan accents

  // Gradient Colors
  'purple-deep': '#7c3aed',  // Deep purple for gradients
  'blue-deep': '#1e3a8a',    // Deep blue for gradients
  'violet-light': '#c4b5fd', // Light violet for text

  // Semantic Colors
  'success': '#10b981',      // Success states
  'warning': '#f59e0b',      // Warning states
  'error': '#ef4444',        // Error states
  'info': '#3b82f6',         // Info states
}
```

**2. Background Gradients:**
```typescript
// Add to tailwind.config.ts theme.extend.backgroundImage
'gradient-cosmic': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'gradient-primary': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
'gradient-dream': 'radial-gradient(circle at top right, #a855f7, transparent)',
'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
'gradient-glow': 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.3), transparent)',
```

**3. Glass Effect Utilities:**
```typescript
// Add to tailwind.config.ts theme.extend
backdropBlur: {
  'glass-sm': '8px',    // Subtle glass (mobile)
  'glass': '16px',      // Standard glass (desktop)
  'glass-lg': '24px',   // Strong glass (hero sections)
},
backdropSaturate: {
  'glass': '180%',      // Enhanced color saturation
},
```

**4. Glow Shadows:**
```typescript
// Add to tailwind.config.ts theme.extend.boxShadow
'glow-sm': '0 0 10px rgba(139, 92, 246, 0.2)',
'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
'glow-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
'glow-electric': '0 0 30px rgba(59, 130, 246, 0.4)',
'glow-purple': '0 0 25px rgba(168, 85, 247, 0.4)',
'glass-border': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
```

**5. Custom Animations:**
```typescript
// Add to tailwind.config.ts theme.extend
animation: {
  // Keep existing animations
  'float': 'float 6s ease-in-out infinite',
  'shimmer': 'shimmer 2s linear infinite',
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',

  // Add new glass-specific animations
  'glow-pulse': 'glowPulse 3s ease-in-out infinite',
  'float-slow': 'float 8s ease-in-out infinite',
  'rotate-slow': 'rotate 20s linear infinite',
},
keyframes: {
  // Keep existing keyframes
  float: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-20px)' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },

  // Add new keyframes
  glowPulse: {
    '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
    '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
  },
  rotate: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
},
```

**CSS Variables Extension:**
Keep existing variables.css, add glass-specific values:
```css
/* styles/variables.css - ADD THESE */
--glass-blur-sm: 8px;
--glass-blur-md: 16px;
--glass-blur-lg: 24px;

--glass-bg-subtle: rgba(255, 255, 255, 0.03);
--glass-bg-medium: rgba(255, 255, 255, 0.05);
--glass-bg-strong: rgba(255, 255, 255, 0.08);

--glass-border: rgba(255, 255, 255, 0.1);
--glass-border-hover: rgba(255, 255, 255, 0.2);

--mirror-transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
--mirror-transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--mirror-transition-slow: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
```

**Alternatives Considered:**
- CSS Modules: Too granular, would lose Tailwind benefits
- Styled Components: Runtime overhead, conflicts with Tailwind
- Vanilla CSS: Too verbose, hard to maintain consistency

---

## Animation Library

**Decision:** Framer Motion 11.15.0 (REQUIRED - NOT INSTALLED)

**Rationale:**
- Industry standard for React animations (proven, stable)
- Excellent TypeScript support (fully typed API)
- Declarative API matches React mental model
- Built-in reduced motion support (accessibility requirement)
- Layout animations (for dream card grids, modals)
- Gesture recognition (drag, hover, tap)
- Physics-based animations (spring, inertia)
- AnimatePresence for enter/exit transitions
- 60KB gzipped (acceptable for animation-heavy redesign)
- Battle-tested with Next.js 14 App Router

**Installation:**
```bash
npm install framer-motion@^11.15.0
```

**Why Version 11.x:**
- Stable, mature release (vs 12.x which has breaking changes)
- Guaranteed React 18.3 compatibility
- Extensive tutorials and documentation available
- Production-proven with Next.js App Router
- Can upgrade to 12.x in future iteration if needed

**Integration Strategy:**

**1. Animation Variants Library (lib/animations/variants.ts):**
```typescript
import type { Variants } from 'framer-motion';

// Card entrance animation
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

// Glow effect animation
export const glowVariants: Variants = {
  initial: { boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)' },
  hover: {
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
    transition: { duration: 0.3 }
  }
};

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Modal overlay animation
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

// Modal content animation
export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: { duration: 0.2 }
  }
};
```

**2. Animation Configuration (lib/animations/config.ts):**
```typescript
// Easing functions
export const easings = {
  easeOut: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.6, 1],
  spring: { type: 'spring', damping: 15, stiffness: 100 },
};

// Duration presets
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.6,
};

// Default transition
export const defaultTransition = {
  duration: durations.normal,
  ease: easings.easeOut,
};
```

**3. Reduced Motion Hook (lib/animations/hooks.ts):**
```typescript
import { useReducedMotion } from 'framer-motion';

export function useAnimationConfig() {
  const prefersReducedMotion = useReducedMotion();

  return {
    shouldAnimate: !prefersReducedMotion,
    variants: prefersReducedMotion ? {} : undefined,
  };
}
```

**Performance Considerations:**
- Use `will-change: transform` only during animations
- Prefer `transform` and `opacity` over layout properties
- Lazy load heavy animations with dynamic imports
- Test on mobile with 4x CPU throttling

**Alternatives Considered:**
- React Spring: More complex API, steeper learning curve
- GSAP: Larger bundle, imperative API doesn't match React patterns
- CSS Animations: Insufficient for complex orchestration
- Framer Motion 12.x: Breaking changes, prefer stable 11.x

---

## Icon Library

**Decision:** Lucide React 0.546.0 (RECOMMENDED)

**Rationale:**
- 1000+ modern, clean icons (comprehensive coverage)
- Tree-shakeable (only ~1KB per icon imported)
- Fully typed TypeScript support
- Easy to style with Tailwind classes
- No current icon library (using emojis, easy to add)
- Consistent design language
- Active maintenance and regular updates
- Zero runtime overhead (static SVG components)

**Installation:**
```bash
npm install lucide-react@^0.546.0
```

**Usage Pattern:**
```typescript
import { Sparkles, Moon, Star, Calendar, Heart } from 'lucide-react';

// Standard usage with Tailwind
<Sparkles className="w-6 h-6 text-purple-500" />

// Animated with Framer Motion
<motion.div whileHover={{ scale: 1.2, rotate: 15 }}>
  <Star className="w-8 h-8 text-yellow-400" />
</motion.div>

// With custom size and color
<Moon className="w-10 h-10 text-mirror-purple drop-shadow-glow" />
```

**Icon Strategy:**
- Use Lucide for functional UI (menu, close, chevron, search, settings, etc.)
- Create custom SVG components for magical elements (defer to later iteration)
- Store custom icons in components/icons/custom/ (future)

**Bundle Impact:**
- ~1KB gzipped per icon
- Estimate 20 icons used = ~20KB total
- Acceptable overhead for visual polish

**Alternatives Considered:**
- React Icons: Larger bundle, less consistent design
- Heroicons: Fewer icons (only ~300), less comprehensive
- Custom SVGs only: Time-intensive, defer to later iteration
- Font Awesome: Larger bundle, font-based (less performant)

---

## TypeScript Configuration

**Decision:** TypeScript 5.9.3 (Already installed)

**Rationale:**
- Strict mode enabled (existing project standard)
- Path aliases configured (@/*, @/components/*, @/lib/*, @/types/*)
- Framer Motion has excellent built-in types
- Lucide React fully typed
- No additional @types packages needed

**Type Strategy:**

**1. Shared Interfaces (types/glass-components.ts):**
```typescript
import { ReactNode } from 'react';
import { Variants } from 'framer-motion';

// Base props for all glass components
export interface GlassBaseProps {
  className?: string;
  glassIntensity?: 'subtle' | 'medium' | 'strong';
  glowColor?: 'purple' | 'blue' | 'cosmic' | 'electric';
  animated?: boolean;
}

// Glass card props
export interface GlassCardProps extends GlassBaseProps {
  variant?: 'default' | 'elevated' | 'inset';
  hoverable?: boolean;
  children: ReactNode;
}

// Glow button props
export interface GlowButtonProps extends GlassBaseProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}

// Gradient text props
export interface GradientTextProps {
  gradient?: 'cosmic' | 'primary' | 'dream';
  className?: string;
  children: ReactNode;
}

// Glass modal props
export interface GlassModalProps extends GlassBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

// Progress orbs props
export interface ProgressOrbsProps {
  steps: number;
  currentStep: number;
  className?: string;
}

// Glow badge props
export interface GlowBadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  glowing?: boolean;
  className?: string;
  children: ReactNode;
}
```

**2. Export Strategy (types/index.ts):**
```typescript
// Add to existing types/index.ts
export * from './glass-components';
```

**No Configuration Changes Needed:**
- tsconfig.json already properly configured
- Paths work with new component locations
- Strict mode enforced

---

## Development Tools

### Testing Framework

**Decision:** Manual testing with Chrome DevTools (this iteration)

**Rationale:**
- Fastest time to value (no test setup overhead)
- Performance tab ideal for animation testing
- Lighthouse built-in for performance audits
- Component showcase page enables visual testing
- Automated tests deferred to Iteration 20+

**Testing Strategy:**
- Performance: Chrome DevTools Performance tab (record 6s, check FPS)
- Accessibility: Keyboard navigation, screen reader (manual)
- Browser Testing: Chrome, Safari, Firefox (manual)
- Mobile: Chrome DevTools device emulation + CPU throttling

**Future Testing (Iteration 20+):**
- Playwright for E2E visual regression
- Jest + Testing Library for unit tests
- Chromatic for visual regression

### Code Quality

**Decision:** Existing ESLint + TypeScript strict mode

**Linter:** ESLint (already configured)
- Keep existing config
- No changes needed

**Formatter:** Prettier (inferred from code patterns)
- Keep existing config
- No changes needed

**Type Checking:** TypeScript strict mode
- Already enabled
- Catch type errors at compile time

**No Additional Tools:**
- Don't add new linters/formatters mid-iteration
- Use existing project standards

### Build & Deploy

**Build Tool:** Next.js built-in compiler (SWC)
- Already configured
- Fast, modern compilation
- No webpack config changes needed

**Deployment Target:** Existing deployment pipeline
- No changes required
- Components deploy with existing app

**CI/CD:** Not specified (use existing if present)
- No new CI/CD setup this iteration
- Bundle size monitoring deferred to Iteration 20+

---

## Environment Variables

**No New Environment Variables Required**

All dependencies are client-side libraries that don't need API keys or server configuration.

Existing .env setup remains unchanged.

---

## Dependencies Overview

### Existing Dependencies (No Changes)
- `next@^14.2.0` - Framework
- `react@^18.3.1` - UI library
- `react-dom@^18.3.1` - DOM renderer
- `tailwindcss@^3.4.1` - Styling
- `tailwindcss-animate@^1.0.7` - Animation utilities
- `typescript@^5.9.3` - Type system
- `clsx@^2.1.0` - Class name utility
- `tailwind-merge@^2.2.1` - Tailwind class merging

### New Dependencies (To Install)
```json
{
  "dependencies": {
    "framer-motion": "^11.15.0",
    "lucide-react": "^0.546.0"
  }
}
```

**Installation Command:**
```bash
npm install framer-motion@^11.15.0 lucide-react@^0.546.0
```

**Bundle Impact:**
- Framer Motion: ~60KB gzipped
- Lucide React: ~20KB gzipped (for ~20 icons)
- Total: ~80KB additional client bundle
- Acceptable for animation-heavy design system

---

## Performance Targets

**Desktop (Chrome/Safari/Firefox):**
- First Contentful Paint: < 1.0s
- Time to Interactive: < 2.0s
- Animation Frame Rate: 60fps (no exceptions)
- Paint Times: < 100ms per component
- Lighthouse Performance: > 90

**Mobile (4x CPU Throttling):**
- First Contentful Paint: < 2.0s
- Time to Interactive: < 3.0s
- Animation Frame Rate: > 30fps minimum
- Paint Times: < 200ms per component
- Lighthouse Performance: > 80

**Bundle Size:**
- Main bundle: < 200KB gzipped
- Design system components: < 50KB gzipped
- Total first load: < 500KB gzipped

**Glass Effect Budget:**
- Maximum 3-4 simultaneous backdrop-filter elements
- Reduce blur on mobile (8px vs 16px desktop)
- Fallback solid backgrounds for unsupported browsers

---

## Security Considerations

**Client-Side Only:**
- All new dependencies are client-side UI libraries
- No server-side code changes
- No new API endpoints
- No authentication/authorization changes

**XSS Prevention:**
- Use React's built-in escaping (no dangerouslySetInnerHTML)
- Sanitize user input in existing flow (no changes)

**Dependency Security:**
- Framer Motion: Widely used, well-maintained, no known vulnerabilities
- Lucide React: Simple SVG components, no security concerns
- Regular npm audit recommended

**Content Security Policy:**
- No inline script changes (CSP unaffected)
- CSS-in-JS via Tailwind (already allowed)
- Framer Motion uses inline styles (may need CSP adjustment if strict)

**No Elevated Security Risks:**
This iteration is purely UI/UX enhancements with trusted, popular libraries.
