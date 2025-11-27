# Builder Task Breakdown - Iteration 3

## Overview

**Total Builders:** 4 primary builders working in coordinated sequence

**Estimated Total Time:** 25-35 hours (4-6 working days with parallel work)

**Builder Specializations:**
- **Builder-1:** Design System Enhancement (foundation work, blocks others)
- **Builder-2:** Landing Page Rebuild (depends on Builder-1)
- **Builder-3:** Auth Pages Unification (depends on Builder-1)
- **Builder-4:** UX Fixes (independent, can run in parallel)

**Critical Path:**
1. Builder-1 completes (8-10 hours) → BLOCKING
2. Builder-2, Builder-3, Builder-4 work in parallel (10-14 hours)
3. Integration and testing (3-4 hours)

---

## Builder-1: Design System Enhancement

### Scope

Enhance existing glass components (GlowButton, GlassInput) with features needed for entry points. Create shared navigation components (NavigationBase, LandingNavigation, AuthLayout). This is **foundation work** that Builder-2 and Builder-3 depend on.

**WHY THIS MATTERS:** Landing page and auth pages need enhanced components with cosmic features (shimmer, lift, glow). Without these enhancements, Builder-2 and Builder-3 cannot proceed. This builder lays the foundation for the entire iteration.

### Complexity Estimate

**MEDIUM-HIGH** (8-10 hours)

**Complexity Factors:**
- Must enhance components WITHOUT breaking 45+ existing usages
- Requires careful TypeScript prop additions (backward compatible)
- Navigation refactoring touches critical shared component
- Testing on 3+ existing pages required after each change

**Recommended Split Strategy:**
If this proves too complex for one builder, split into:
- **Builder-1A (Foundation):** GlowButton + GlassInput enhancements (5-6 hours)
- **Builder-1B (Navigation):** NavigationBase + LandingNavigation + AuthLayout (3-4 hours)

### Success Criteria

- [ ] GlowButton has new `cosmic` variant with shimmer animation, hover lift, glow shadow
- [ ] GlowButton maintains existing `primary`, `secondary`, `ghost` variants (no breaking changes)
- [ ] GlassInput supports `type="email"` and `type="password"`
- [ ] GlassInput has `error` prop (red border + error message below)
- [ ] GlassInput has `showPasswordToggle` prop (integrates PasswordToggle component)
- [ ] GlassInput has validation props (`required`, `minLength`, `autoComplete`)
- [ ] NavigationBase component created (extracted from AppNavigation)
- [ ] LandingNavigation component created (extends NavigationBase)
- [ ] AuthLayout component created (CosmicBackground + centered container)
- [ ] All enhancements tested on 3 existing pages (Dashboard, Dreams, Reflection)
- [ ] TypeScript compilation passes with no errors
- [ ] No visual regressions on existing pages

### Files to Create

**New Components:**
- `components/shared/NavigationBase.tsx` (120-150 lines) - Base navigation structure
- `components/shared/LandingNavigation.tsx` (80-100 lines) - Landing page nav variant
- `components/auth/AuthLayout.tsx` (60-80 lines) - Auth page layout wrapper

**Total New Code:** ~260-330 lines

### Files to Modify

**Component Enhancements:**
- `components/ui/glass/GlowButton.tsx` (61 → ~120 lines) - Add cosmic variant
- `components/ui/glass/GlassInput.tsx` (77 → ~150 lines) - Add auth support

**TypeScript Types:**
- `types/glass-components.ts` - Add new prop interfaces

**Total Modified Code:** ~200 lines of changes

### Dependencies

**Depends on:** NONE (foundation work)

**Blocks:** Builder-2 (Landing Page), Builder-3 (Auth Pages)

### Implementation Notes

**GlowButton Cosmic Variant (ADDITIVE ONLY):**

```tsx
// components/ui/glass/GlowButton.tsx

interface GlowButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cosmic'; // ADD 'cosmic'
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function GlowButton({ variant = 'primary', size = 'md', ...props }: GlowButtonProps) {
  const baseClasses = cn(
    'relative overflow-hidden rounded-lg font-semibold transition-all duration-300',
    'focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  const variantClasses = {
    primary: 'bg-purple-600 text-white hover:opacity-90',
    secondary: 'border border-purple-600 hover:bg-purple-600/10',
    ghost: 'text-gray-300 hover:text-purple-400',
    // NEW COSMIC VARIANT (match signin cosmic-button pattern)
    cosmic: cn(
      'bg-gradient-to-br from-purple-500/15 via-indigo-500/12 to-purple-500/15',
      'border border-purple-500/30',
      'text-purple-200',
      'backdrop-blur-md',
      'hover:from-purple-500/22 hover:via-indigo-500/18 hover:to-purple-500/22',
      'hover:border-purple-500/45',
      'hover:-translate-y-0.5', // Lift effect
      'hover:shadow-[0_12px_35px_rgba(147,51,234,0.2)]', // Glow shadow
      'before:absolute before:inset-0',
      'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
      'before:-translate-x-full before:transition-transform before:duration-600',
      'hover:before:translate-x-full' // Shimmer animation
    ),
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], props.className)}
      {...props}
    />
  );
}
```

**Key Points:**
- ADD `cosmic` to variant union type (no breaking change)
- Keep existing variants unchanged
- Use Tailwind utilities for all styling (no styled-jsx)
- Shimmer animation via ::before pseudo-element
- Hover lift via `-translate-y-0.5`
- Glow shadow via box-shadow
- Gradient background shift on hover

**GlassInput Enhancement (EXTEND PROPS):**

```tsx
// components/ui/glass/GlassInput.tsx

interface GlassInputProps {
  type?: 'text' | 'email' | 'password' | 'textarea'; // ADD email, password
  variant?: 'text' | 'textarea'; // KEEP for backward compatibility
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string; // NEW - show red border + error message
  maxLength?: number;
  showCounter?: boolean;
  showPasswordToggle?: boolean; // NEW - for password type
  required?: boolean; // NEW
  minLength?: number; // NEW
  autoComplete?: string; // NEW
  className?: string;
  rows?: number; // For textarea
}

export function GlassInput({
  type = 'text',
  variant, // Keep for backward compatibility
  value,
  onChange,
  error,
  showPasswordToggle = false,
  ...props
}: GlassInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const actualType = variant === 'textarea' ? 'textarea' : type;
  const inputType = actualType === 'password' && showPassword ? 'text' : actualType;

  const inputClasses = cn(
    'w-full px-4 py-3 rounded-lg',
    'bg-white/5 backdrop-blur-sm',
    'border-2 transition-all duration-300',
    error ? 'border-red-500/50' : 'border-white/10',
    'focus:border-purple-500/60',
    'focus:shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    'focus:scale-[1.01]',
    'text-white placeholder:text-white/40',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  return (
    <div className="space-y-2">
      {props.label && (
        <label className="block text-sm font-medium text-white/70">
          {props.label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {actualType === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            rows={props.rows || 4}
            {...props}
          />
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            {...props}
          />
        )}

        {/* Password Toggle */}
        {actualType === 'password' && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}

        {/* Character Counter */}
        {props.showCounter && props.maxLength && (
          <div className="absolute right-3 bottom-2 text-xs text-white/40">
            {value.length} / {props.maxLength}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
```

**NavigationBase Pattern:**

```tsx
// components/shared/NavigationBase.tsx

interface NavigationBaseProps {
  children: ReactNode; // Nav content (links, menus, etc.)
  transparent?: boolean; // For hero section overlap
  className?: string;
}

export default function NavigationBase({
  children,
  transparent = false,
  className,
}: NavigationBaseProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100]">
      <GlassCard
        elevated
        className={cn(
          'rounded-none',
          transparent && 'bg-transparent backdrop-blur-sm',
          className
        )}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌙</span>
            <span className="text-xl font-bold text-white">Mirror of Dreams</span>
          </Link>

          {/* Nav Content (passed as children) */}
          {children}
        </div>
      </GlassCard>
    </nav>
  );
}
```

### Patterns to Follow

- **Component Enhancement:** Use ADDITIVE props only (no breaking changes)
- **TypeScript:** Strict mode, explicit prop types, union types for variants
- **Styling:** Tailwind utilities only (no styled-jsx)
- **Testing:** Test on 3 existing pages after each change
- **Import Order:** Follow patterns.md convention

### Testing Requirements

**Unit Testing (Manual):**
1. Test GlowButton cosmic variant on landing page mockup
2. Test GlassInput password type with toggle
3. Test GlassInput error state rendering
4. Test NavigationBase with different children

**Integration Testing:**
1. Verify GlowButton primary/secondary/ghost variants still work (Dashboard, Dreams)
2. Verify GlassInput text/textarea variants still work (Reflection form)
3. Verify no TypeScript errors on existing usages
4. Verify no visual regressions (screenshot comparison)

**Coverage target:** 100% of existing component usages tested

### Potential Split Strategy

**If complexity proves too high (>10 hours), split into:**

**Builder-1A: Component Enhancements (5-6 hours)**
- Enhance GlowButton (cosmic variant)
- Enhance GlassInput (email/password/error support)
- Test on existing pages
- Deliverable: Enhanced components ready for use

**Builder-1B: Navigation & Layout (3-4 hours)**
- Create NavigationBase component
- Create LandingNavigation component
- Create AuthLayout component
- Test navigation variants
- Deliverable: Navigation system ready for landing/auth pages

**Dependencies:** Builder-1B can start before Builder-1A completes (no overlap)

---

## Builder-2: Landing Page Rebuild

### Scope

Complete rebuild of landing page (app/page.tsx) using enhanced design system components. Remove entire portal system (portal.css, MirrorShards, portal components). Build hero section, 4 feature cards, footer. Implement scroll-triggered animations. Mobile responsive testing.

**WHY THIS MATTERS:** The landing page is the first thing users see. Currently uses isolated portal.css system that looks like a different product. Rebuilding with design system creates cohesive brand experience and builds user trust in the critical first 60 seconds.

### Complexity Estimate

**HIGH** (10-14 hours)

**Complexity Factors:**
- Complete page rebuild (not just styling tweaks)
- Hero section requires compelling copy + dual CTAs
- 4 feature cards with icons, descriptions, animations
- Footer with responsive layout
- Scroll-triggered animations (Framer Motion)
- Mobile responsive (5 viewports: 320px, 390px, 768px, 1024px, 1920px)
- Performance testing (Lighthouse LCP < 2.5s target)
- Delete entire portal system (7 files)

**DO NOT SPLIT** - Landing page must be cohesive. One builder ensures consistent implementation.

### Success Criteria

- [ ] Landing page uses CosmicBackground (not MirrorShards)
- [ ] Hero section has headline, subheadline, 2 CTAs (Start Reflecting + Learn More)
- [ ] 4 feature highlight cards (AI Reflections, Track Dreams, Visualize Evolution, Sacred Space)
- [ ] All cards use GlassCard with interactive prop
- [ ] CTAs use GlowButton with cosmic variant
- [ ] Navigation uses LandingNavigation component
- [ ] Footer has 4 links (About, Privacy, Terms, Contact)
- [ ] Scroll-triggered animations on feature cards (stagger 100ms)
- [ ] Mobile responsive (320px to 1920px+)
- [ ] No horizontal scroll on any viewport
- [ ] Lighthouse Performance 90+
- [ ] Lighthouse Accessibility 90+
- [ ] LCP < 2.5s on Safari (iPhone X or older)
- [ ] portal.css deleted
- [ ] components/portal/ directory deleted (7 files)
- [ ] No imports of MirrorShards or portal components

### Files to Create

**New Components:**
- `components/landing/LandingHero.tsx` (120-150 lines) - Hero section
- `components/landing/LandingFeatureCard.tsx` (80-100 lines) - Feature card

**Total New Code:** ~200-250 lines

### Files to Modify

**Complete Rebuild:**
- `app/page.tsx` (165 → ~250-300 lines) - Landing page

**Total Modified Code:** ~250-300 lines

### Files to DELETE

**Portal System Removal:**
- `styles/portal.css` (155 lines) - DELETE
- `components/portal/MirrorShards.tsx` (180 lines) - DELETE
- `components/portal/Navigation.tsx` - DELETE
- `components/portal/MainContent.tsx` - DELETE
- `components/portal/ButtonGroup.tsx` - DELETE
- `components/portal/UserMenu.tsx` - DELETE
- `components/portal/hooks/usePortalState.ts` - DELETE

**Total Deleted:** ~500+ lines (tech debt cleanup)

### Dependencies

**Depends on:** Builder-1 (BLOCKING - needs LandingNavigation, GlowButton cosmic variant)

**Blocks:** None (Builder-3, Builder-4 can run in parallel)

### Implementation Notes

**Hero Section Pattern (use LandingHero component):**

```tsx
// components/landing/LandingHero.tsx
'use client';

import { motion } from 'framer-motion';
import { GlowButton } from '@/components/ui/glass';
import { useRouter } from 'next/navigation';

export default function LandingHero() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="text-center max-w-4xl mx-auto px-4"
    >
      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Your Dreams, Reflected
        </span>
      </h1>

      {/* Subheadline */}
      <p className="text-xl sm:text-2xl text-white/80 mb-12 leading-relaxed">
        AI-powered reflection journal that helps you understand your subconscious
        and track your dream evolution over time.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <GlowButton
          variant="cosmic"
          size="lg"
          onClick={() => router.push('/auth/signup')}
        >
          Start Reflecting
        </GlowButton>
        <GlowButton
          variant="secondary"
          size="lg"
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Learn More
        </GlowButton>
      </div>
    </motion.div>
  );
}
```

**Feature Card Pattern:**

```tsx
// components/landing/LandingFeatureCard.tsx
'use client';

import { GlassCard } from '@/components/ui/glass';

interface LandingFeatureCardProps {
  icon: string; // Emoji
  title: string;
  description: string;
}

export default function LandingFeatureCard({
  icon,
  title,
  description,
}: LandingFeatureCardProps) {
  return (
    <GlassCard interactive className="p-8 text-center h-full">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        {title}
      </h3>
      <p className="text-white/70 leading-relaxed">
        {description}
      </p>
    </GlassCard>
  );
}
```

**Landing Page Structure (app/page.tsx):**

```tsx
'use client';

import { motion } from 'framer-motion';
import CosmicBackground from '@/components/shared/CosmicBackground';
import LandingNavigation from '@/components/shared/LandingNavigation';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatureCard from '@/components/landing/LandingFeatureCard';

export default function LandingPage() {
  const features = [
    {
      id: 'ai-reflections',
      icon: '✨',
      title: 'AI-Powered Reflections',
      description: 'Your personal mirror analyzes patterns and provides insights.',
    },
    // ... 3 more features
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <CosmicBackground animated={true} intensity={1} />
      <LandingNavigation />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center">
          <LandingHero />
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold text-center mb-16"
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Why Mirror of Dreams?
              </span>
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <LandingFeatureCard {...feature} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm">
              © 2025 Mirror of Dreams. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="/about" className="text-white/60 hover:text-white/90 transition-colors">
                About
              </a>
              <a href="/privacy" className="text-white/60 hover:text-white/90 transition-colors">
                Privacy
              </a>
              <a href="/terms" className="text-white/60 hover:text-white/90 transition-colors">
                Terms
              </a>
              <a href="/contact" className="text-white/60 hover:text-white/90 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
```

**Copy Writing Guide:**

**Headline Options:**
1. "Your Dreams, Reflected" (recommended - mysterious, emotional)
2. "Unlock Your Subconscious"
3. "The Mirror That Understands You"

**Subheadline:**
"AI-powered reflection journal that helps you understand your subconscious and track your dream evolution over time."

**Features:**
1. **AI-Powered Reflections** - "Your personal mirror analyzes patterns and provides insights into your subconscious."
2. **Track Your Dreams** - "Organize and revisit your dream journal anytime, anywhere."
3. **Visualize Your Evolution** - "See how your dreams and thoughts evolve over time with interactive charts."
4. **Sacred Space** - "Premium experience designed for deep introspection and self-discovery."

### Patterns to Follow

- **Entry Point Structure:** Follow patterns.md landing page pattern
- **Scroll Animation:** Use Framer Motion `whileInView` with `viewport={{ once: true }}`
- **Responsive Grid:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- **Import Order:** React → Next.js → Framer Motion → Components → Types

### Testing Requirements

**Mobile Responsive (5 viewports):**
- [ ] 320px (iPhone SE portrait): No horizontal scroll, readable text
- [ ] 390px (iPhone 12 portrait): Comfortable layout
- [ ] 768px (iPad portrait): Feature cards 2 columns
- [ ] 1024px (iPad landscape): Feature cards 4 columns
- [ ] 1920px (Desktop): Max-width container, balanced spacing

**Performance (Lighthouse):**
- [ ] Performance: 90+
- [ ] Accessibility: 90+
- [ ] LCP < 2.5s (landing page hero)
- [ ] FID < 100ms (button clicks)
- [ ] CLS < 0.1 (no layout shifts)

**Cross-Browser:**
- [ ] Chrome (desktop + mobile): Works
- [ ] Safari (desktop + mobile): Works, LCP < 2.5s
- [ ] Firefox (desktop): Works

**Cleanup Verification:**
- [ ] `styles/portal.css` deleted (confirm with `ls styles/`)
- [ ] `components/portal/` directory deleted (confirm with `ls components/`)
- [ ] No imports of `MirrorShards` (grep search)
- [ ] Build succeeds (`npm run build`)

---

## Builder-3: Auth Pages Unification

### Scope

Refactor signin and signup pages to use enhanced GlassInput, GlowButton (cosmic variant), and AuthLayout. Ensure both pages are visually identical (same components, same structure). Remove all styled-jsx from signin, replace Tailwind utility inputs in signup with GlassInput components.

**WHY THIS MATTERS:** Signin uses styled-jsx (340+ lines inline CSS), signup uses Tailwind utilities. They look different despite being consecutive user journey steps. Unifying them with design system creates trust and professional polish.

### Complexity Estimate

**MEDIUM** (6-8 hours)

**Complexity Factors:**
- Signin refactoring: Replace 340+ lines of styled-jsx with components
- Signup refactoring: Replace Tailwind inputs with GlassInput
- Both pages must remain functionally identical (validation, error handling, loading)
- Must preserve PasswordToggle integration
- Must preserve auto-focus, autocomplete, keyboard navigation
- Testing across 2 pages with multiple states (loading, error, success)

**Recommended Split Strategy:**
If this proves too complex, split into:
- **Builder-3A:** Signup page refactor (4-5 hours)
- **Builder-3B:** Signin page refactor (2-3 hours)

### Success Criteria

- [ ] Signin page uses AuthLayout wrapper
- [ ] Signin page uses GlassInput for all inputs (email, password)
- [ ] Signin page uses GlowButton (cosmic variant) for submit
- [ ] Signin page removes ALL styled-jsx (0 lines of inline CSS)
- [ ] Signup page uses AuthLayout wrapper
- [ ] Signup page uses GlassInput for all inputs (name, email, password, confirm password)
- [ ] Signup page uses GlowButton (cosmic variant) for submit
- [ ] Both pages visually identical (screenshot comparison)
- [ ] Both pages use CosmicBackground
- [ ] Both pages have same error/success message styling
- [ ] Both pages have same loading states (CosmicLoader in button)
- [ ] Password toggle works on both pages
- [ ] Form validation works on both pages
- [ ] Auto-focus email input on signin (800ms delay preserved)
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Mobile responsive (320px to 1920px+)
- [ ] Lighthouse Accessibility 90+ on both pages

### Files to Create

**No new files** - uses components from Builder-1

### Files to Modify

**Complete Refactors:**
- `app/auth/signin/page.tsx` (571 → ~200 lines) - Remove styled-jsx, use components
- `app/auth/signup/page.tsx` (283 → ~220 lines) - Replace Tailwind with components

**Total Modified Code:** ~420 lines

### Dependencies

**Depends on:** Builder-1 (BLOCKING - needs AuthLayout, GlassInput, GlowButton cosmic)

**Blocks:** None (Builder-2, Builder-4 can run in parallel)

### Implementation Notes

**Signin Page Pattern:**

```tsx
// app/auth/signin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import AuthLayout from '@/components/auth/AuthLayout';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import Link from 'next/link';

export default function SigninPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const signin = trpc.auth.signin.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Welcome back! Redirecting...' });
      setTimeout(() => router.push('/dashboard'), 1000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  // Auto-focus email input (preserve existing behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById('email-input')?.focus();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    signin.mutate(formData);
  };

  return (
    <AuthLayout title="Welcome Back">
      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassInput
          id="email-input"
          type="email"
          label="Email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          placeholder="your@email.com"
          autoComplete="email"
          required
        />

        <GlassInput
          type="password"
          label="Password"
          value={formData.password}
          onChange={(value) => setFormData({ ...formData, password: value })}
          placeholder="Enter your password"
          autoComplete="current-password"
          showPasswordToggle
          required
        />

        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'error'
                ? 'bg-red-500/10 border-red-500/50 text-red-200'
                : 'bg-green-500/10 border-green-500/50 text-green-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <GlowButton
          variant="cosmic"
          size="lg"
          type="submit"
          disabled={signin.isLoading}
          className="w-full"
        >
          {signin.isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <CosmicLoader size="sm" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </GlowButton>

        <p className="text-center text-white/60 text-sm">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 transition-colors">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
```

**Key Changes from Current Signin:**
- Remove ALL styled-jsx (340+ lines)
- Use AuthLayout wrapper (handles CosmicBackground + container)
- Use GlassInput for email/password (replace styled input elements)
- Use GlowButton cosmic variant (replace cosmic-button styled element)
- Keep auto-focus behavior (useEffect with 800ms delay)
- Keep error/success message handling
- Keep form validation logic
- Keep mutation flow (same tRPC call)

**Signup Page Pattern (similar to signin):**

```tsx
// app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import AuthLayout from '@/components/auth/AuthLayout';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signup = trpc.auth.signup.useMutation({
    onSuccess: (data) => {
      const redirectPath = data.onboardingCompleted ? '/dashboard' : '/onboarding';
      router.push(redirectPath);
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    signup.mutate(formData);
  };

  return (
    <AuthLayout title="Create Your Account">
      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassInput
          type="text"
          label="Name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="Your name"
          error={errors.name}
          required
        />

        <GlassInput
          type="email"
          label="Email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          placeholder="your@email.com"
          autoComplete="email"
          error={errors.email}
          required
        />

        <GlassInput
          type="password"
          label="Password"
          value={formData.password}
          onChange={(value) => setFormData({ ...formData, password: value })}
          placeholder="Create password"
          autoComplete="new-password"
          showPasswordToggle
          minLength={6}
          error={errors.password}
          required
        />

        <GlassInput
          type="password"
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
          placeholder="Confirm password"
          autoComplete="new-password"
          showPasswordToggle
          error={errors.confirmPassword}
          required
        />

        {errors.general && (
          <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/50 text-red-200">
            {errors.general}
          </div>
        )}

        <GlowButton
          variant="cosmic"
          size="lg"
          type="submit"
          disabled={signup.isLoading}
          className="w-full"
        >
          {signup.isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <CosmicLoader size="sm" />
              Creating account...
            </span>
          ) : (
            'Create Free Account'
          )}
        </GlowButton>

        <p className="text-center text-white/60 text-sm">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300 transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
```

### Patterns to Follow

- **Auth Page Structure:** Follow patterns.md auth page pattern
- **Form Validation:** Validate before mutation, show inline errors
- **Error Handling:** Map API errors to user-friendly messages
- **Loading States:** CosmicLoader inside button during submission
- **Import Order:** React → Next.js → tRPC → Components

### Testing Requirements

**Functional Testing:**
- [ ] Signin form validates (email format, required fields)
- [ ] Signin authenticates user and redirects to dashboard
- [ ] Signin shows error for invalid credentials
- [ ] Signup form validates (password length, confirmation match)
- [ ] Signup creates user and redirects to onboarding or dashboard
- [ ] Signup shows field-specific errors (inline below inputs)
- [ ] Password toggle works on both pages
- [ ] Auto-focus works on signin email input (800ms delay)
- [ ] Keyboard navigation works (Tab through fields, Enter to submit)

**Visual Consistency:**
- [ ] Screenshot comparison: signin vs signup (should be identical structure)
- [ ] Both pages use same background (CosmicBackground)
- [ ] Both pages use same container (AuthLayout with centered 480px card)
- [ ] Both pages use same input styling (GlassInput)
- [ ] Both pages use same button styling (GlowButton cosmic)
- [ ] Both pages use same error message styling

**Mobile Responsive:**
- [ ] 320px: Forms readable, no horizontal scroll
- [ ] 768px: Comfortable layout, touch targets adequate
- [ ] Form inputs focus without keyboard covering fields

**Accessibility:**
- [ ] Lighthouse Accessibility 90+ on both pages
- [ ] All form inputs have labels
- [ ] Error messages announced by screen readers
- [ ] Focus indicators visible on all interactive elements

---

## Builder-4: UX Fixes (Navigation, Loading, Readability)

### Scope

Three independent UX fixes: (1) Add navigation padding to 6 pages, (2) Add reflection creation loading overlay, (3) Verify reflection text readability. All fixes are isolated, low-risk changes.

**WHY THIS MATTERS:** Navigation currently overlaps content on 6 pages (users can't see top content). Reflection creation has no loading feedback during 3-5 second AI processing (users uncertain if submission worked). These are blocking UX issues that frustrate existing users.

### Complexity Estimate

**LOW-MEDIUM** (4-5 hours)

**Complexity Factors:**
- Navigation fix: Simple (1 line change per page × 6 pages)
- Loading overlay: Medium (state management + animation)
- Readability: None (already compliant per Explorer 2)
- Testing: Systematic (6 pages + reflection flow + mobile)

**DO NOT SPLIT** - All fixes are quick, one builder can handle efficiently.

### Success Criteria

- [ ] tailwind.config.ts has `nav: '80px'` spacing utility
- [ ] Dreams page has `pt-nav` padding (not overlapped by navigation)
- [ ] Evolution page has `pt-nav` padding
- [ ] Visualizations page has `pt-nav` padding
- [ ] dreams/[id] page has `pt-nav` padding
- [ ] evolution/[id] page has `pt-nav` padding
- [ ] visualizations/[id] page has `pt-nav` padding
- [ ] Reflection creation shows full-page loading overlay with CosmicLoader
- [ ] Loading overlay has animated status text ("Gazing into the mirror...")
- [ ] Loading overlay has minimum 500ms display time (prevent flash)
- [ ] Loading overlay hides on error (error recovery)
- [ ] Reflection output text verified compliant (white/95, line-height 1.8, 1.1rem)
- [ ] All pages tested on mobile (320px, 768px, 1024px)
- [ ] No regression on navigation behavior (fixed positioning works)

### Files to Create

**No new files** - modifications only

### Files to Modify

**Tailwind Config:**
- `tailwind.config.ts` (add nav spacing)

**Page Padding Fixes (6 pages):**
- `app/dreams/page.tsx` (1 line change)
- `app/evolution/page.tsx` (1 line change)
- `app/visualizations/page.tsx` (1 line change)
- `app/dreams/[id]/page.tsx` (1 line change)
- `app/evolution/[id]/page.tsx` (1 line change)
- `app/visualizations/[id]/page.tsx` (1 line change)

**Reflection Loading:**
- `app/reflection/MirrorExperience.tsx` (~20 lines added)

**Total Modified Code:** ~30-40 lines

### Dependencies

**Depends on:** NONE (independent UX fixes)

**Blocks:** None (can run in parallel with Builder-2, Builder-3)

### Implementation Notes

**Tailwind Config Change:**

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      spacing: {
        'nav': '80px', // Navigation bar height
      },
    },
  },
};
```

**Page Padding Fix Pattern (repeat for all 6 pages):**

```tsx
// BEFORE (e.g., app/dreams/page.tsx line 56):
<div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-4 sm:p-8">

// AFTER:
<div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-4 sm:px-8 pb-8">
```

**Reflection Loading Overlay (add to MirrorExperience.tsx):**

```tsx
// app/reflection/MirrorExperience.tsx

// 1. Add state (near line 53)
const [isSubmitting, setIsSubmitting] = useState(false);
const [statusText, setStatusText] = useState('Gazing into the mirror...');

// 2. Update mutation callbacks (lines 75-87)
const createReflection = trpc.reflection.create.useMutation({
  onSuccess: (data) => {
    setStatusText('Reflection complete!');
    setMirrorGlow(true);
    setTimeout(() => {
      router.push(`/reflection/output?id=${data.reflectionId}`);
    }, 1000);
  },
  onError: (error) => {
    toast.error(`Error: ${error.message}`);
    setIsSubmitting(false); // Hide overlay on error
  },
});

// 3. Update handleSubmit (line 142)
const handleSubmit = () => {
  if (!validateForm()) return;

  setIsSubmitting(true);
  setStatusText('Gazing into the mirror...');

  // Update status text after 3 seconds
  setTimeout(() => {
    setStatusText('Crafting your reflection...');
  }, 3000);

  createReflection.mutate({ dreamId, answers, tone });
};

// 4. Add overlay component (before line 258)
{/* Loading Overlay */}
<AnimatePresence>
  {isSubmitting && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-mirror-void-deep/95 backdrop-blur-lg"
    >
      <CosmicLoader size="lg" />
      <motion.div
        className="text-center space-y-2"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-white/90 text-xl font-light">
          {statusText}
        </p>
        <p className="text-white/60 text-sm">
          This may take a few moments
        </p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Readability Verification (NO CODE CHANGES):**

Per Explorer 2 report, reflection text already meets all requirements:
- Text color: `rgba(255, 255, 255, 0.95)` ✅
- Line height: `1.8` ✅
- Font size: `clamp(1.1rem, 3vw, 1.4rem)` ✅
- Contrast ratio: 18.5:1 (exceeds WCAG AA 4.5:1) ✅

**Verification steps only:**
1. Open reflection output page
2. Inspect text styles in DevTools
3. Run contrast checker (Chrome DevTools or WebAIM)
4. Test mobile readability (320px viewport)
5. Document compliance in testing notes

### Patterns to Follow

- **Navigation Padding:** Use `pt-nav` utility consistently
- **Loading Overlay:** Use AnimatePresence for smooth transitions
- **State Management:** Clear loading state on error recovery
- **Testing:** Systematic testing across all modified pages

### Testing Requirements

**Navigation Padding (6 pages):**
- [ ] Dreams: Content visible, no overlap
- [ ] Evolution: Content visible, no overlap
- [ ] Visualizations: Content visible, no overlap
- [ ] dreams/[id]: Content visible, no overlap
- [ ] evolution/[id]: Content visible, no overlap
- [ ] visualizations/[id]: Content visible, no overlap
- [ ] Mobile (320px, 768px, 1024px): Navigation doesn't overlap on any page
- [ ] Scroll behavior: Navigation stays fixed, content scrolls smoothly

**Reflection Loading Overlay:**
- [ ] Fast network: Minimum 500ms display (no flash)
- [ ] Slow network: Overlay persists, status text animates
- [ ] Network error: Overlay hides, error toast shows
- [ ] Validation error: Overlay doesn't show (pre-submit validation)
- [ ] Success flow: Overlay → status text update → redirect
- [ ] Mobile: Overlay covers viewport, text readable

**Reflection Text Readability:**
- [ ] Contrast ratio ≥ 4.5:1 (Chrome DevTools color picker)
- [ ] Font size ≥ 1.1rem (inspect computed styles)
- [ ] Line height = 1.8 (inspect CSS)
- [ ] Mobile: Text comfortable without zoom (320px viewport)

---

## Builder Execution Order

### Phase 1: Foundation (BLOCKING)

**Builder-1: Design System Enhancement** (8-10 hours)
- Start: Immediately
- Dependencies: None
- Blocks: Builder-2, Builder-3
- Output: Enhanced components (GlowButton cosmic, GlassInput auth, NavigationBase, LandingNavigation, AuthLayout)

**Checkpoint:** Builder-1 completes → commit to main → Builder-2 and Builder-3 can start

---

### Phase 2: Parallel Work (After Builder-1)

**Builder-2: Landing Page Rebuild** (10-14 hours)
- Start: After Builder-1 completes
- Dependencies: Builder-1
- Parallel with: Builder-3, Builder-4
- Output: Redesigned landing page, deleted portal system

**Builder-3: Auth Pages Unification** (6-8 hours)
- Start: After Builder-1 completes
- Dependencies: Builder-1
- Parallel with: Builder-2, Builder-4
- Output: Unified signin/signup pages using design system

**Builder-4: UX Fixes** (4-5 hours)
- Start: Immediately (independent)
- Dependencies: None
- Parallel with: All others
- Output: Navigation padding fixed, reflection loading overlay, readability verified

**Checkpoint:** All 3 builders complete → merge to integration branch

---

### Phase 3: Integration & Testing (3-4 hours)

**Integration Tasks:**
1. Merge all builder branches to `plan-5/iteration-3/integrated`
2. Resolve any merge conflicts (minimal - different files)
3. Test all 3 entry points together (landing → signup → signin)
4. Cross-page navigation testing (landing → auth → dashboard)
5. Mobile responsive testing (5 viewports)
6. Lighthouse audits (Performance 90+, Accessibility 90+)
7. Bug fixes based on integration testing

**Final Checkpoint:** Integration testing passes → merge to main → deploy

---

## Integration Notes

### Potential Conflicts

**Shared Files (Coordination Required):**

1. **tailwind.config.ts**
   - Builder-1: May add utilities for components
   - Builder-4: Adds `nav: '80px'` spacing
   - **Resolution:** Builder-4 waits for Builder-1 to commit, then adds nav spacing

**No Other Conflicts Expected:**
- Builder-2 works on `app/page.tsx` + creates landing components (isolated)
- Builder-3 works on `app/auth/*` pages (isolated)
- Builder-4 works on existing pages (minimal changes, different lines)

### Shared Components Usage

**Components Builder-2 and Builder-3 both use:**
- GlowButton (cosmic variant) - from Builder-1
- GlassInput (enhanced) - from Builder-1
- CosmicBackground (existing, no changes)
- CosmicLoader (existing, no changes)

**Navigation Components:**
- Builder-2 uses LandingNavigation (from Builder-1)
- Builder-3 uses AuthLayout (from Builder-1)
- Builder-4 doesn't touch navigation components

**Integration Point:** Builder-1 must complete and commit before Builder-2/Builder-3 can use enhanced components.

### Testing Coordination

**Each Builder Tests:**
- **Builder-1:** Enhanced components on 3 existing pages (Dashboard, Dreams, Reflection)
- **Builder-2:** Landing page (hero, features, footer, mobile, performance)
- **Builder-3:** Signin + Signup (functionality, visual consistency, mobile)
- **Builder-4:** 6 pages (navigation padding), reflection flow (loading overlay)

**Integration Testing (All Builders Complete):**
- Landing → Signup → Onboarding → Dashboard (full user journey)
- Landing → Signin → Dashboard (returning user journey)
- All pages mobile responsive (consistent experience)
- Lighthouse audits on all entry points (landing, signin, signup)
- Cross-browser testing (Chrome, Safari, Firefox)

---

## Final Deliverables

### Code Deliverables

**New Components (Builder-1):**
- NavigationBase
- LandingNavigation
- AuthLayout

**New Landing Components (Builder-2):**
- LandingHero
- LandingFeatureCard

**Enhanced Components (Builder-1):**
- GlowButton (cosmic variant added)
- GlassInput (email/password/error support added)

**Rebuilt Pages (Builder-2, Builder-3):**
- Landing page (complete rebuild)
- Signin page (refactored to use components)
- Signup page (refactored to use components)

**Fixed Pages (Builder-4):**
- Dreams (navigation padding)
- Evolution (navigation padding)
- Visualizations (navigation padding)
- dreams/[id] (navigation padding)
- evolution/[id] (navigation padding)
- visualizations/[id] (navigation padding)
- MirrorExperience (loading overlay)

**Deleted Code:**
- styles/portal.css (155 lines)
- components/portal/ directory (7 files, ~500+ lines)

**Net Code Change:**
- Added: ~700-800 lines (new components, refactored pages)
- Deleted: ~1000+ lines (portal system, styled-jsx)
- **Net:** ~200-300 lines reduction (cleaner codebase)

### Testing Deliverables

**Lighthouse Reports:**
- Landing page: Performance 90+, Accessibility 90+, LCP < 2.5s
- Signin page: Accessibility 90+
- Signup page: Accessibility 90+

**Mobile Testing Evidence:**
- Screenshots of all 3 entry points at 320px, 768px, 1024px
- No horizontal scroll confirmed

**Cross-Browser Testing:**
- Chrome (desktop + mobile): Pass
- Safari (desktop + mobile): Pass, LCP < 2.5s confirmed
- Firefox (desktop): Pass

**Functional Testing:**
- Signin flow: Authenticates and redirects
- Signup flow: Creates user and redirects to onboarding
- Reflection creation: Shows loading overlay, redirects to output
- Navigation padding: No content overlap on any page

---

**Builder Tasks Complete**
**Total Builders:** 4 (coordinated, parallel where possible)
**Total Estimated Time:** 25-35 hours (4-6 working days)
**Critical Path:** Builder-1 → (Builder-2 + Builder-3 + Builder-4) → Integration
**Ready for Execution:** YES (all tasks scoped, dependencies clear, patterns documented)

---

*These builder tasks transform Mirror of Dreams from a visually fragmented product into a cohesive, branded experience where every entry point feels like the same polished product.*
