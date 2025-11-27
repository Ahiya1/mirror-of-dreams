# Code Patterns & Conventions - Iteration 3

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── page.tsx                    # Landing page (REBUILD)
│   ├── auth/
│   │   ├── signin/page.tsx         # Signin (REFACTOR)
│   │   └── signup/page.tsx         # Signup (REFACTOR)
│   ├── dashboard/page.tsx          # Dashboard (reference for padding)
│   ├── dreams/page.tsx             # Dreams (ADD PADDING)
│   ├── evolution/page.tsx          # Evolution (ADD PADDING)
│   └── visualizations/page.tsx     # Visualizations (ADD PADDING)
├── components/
│   ├── ui/glass/                   # Glass component library
│   │   ├── GlassCard.tsx           # Use as-is
│   │   ├── GlowButton.tsx          # ENHANCE with cosmic variant
│   │   ├── GlassInput.tsx          # ENHANCE with auth support
│   │   ├── CosmicLoader.tsx        # Use as-is
│   │   └── GradientText.tsx        # Use as-is
│   ├── shared/
│   │   ├── CosmicBackground.tsx    # Use for all entry points
│   │   ├── AppNavigation.tsx       # Reference for NavigationBase
│   │   ├── NavigationBase.tsx      # CREATE (extracted from AppNavigation)
│   │   └── LandingNavigation.tsx   # CREATE (extends NavigationBase)
│   ├── auth/
│   │   └── AuthLayout.tsx          # CREATE (shared layout wrapper)
│   └── landing/
│       ├── LandingHero.tsx         # CREATE (hero section)
│       └── LandingFeatureCard.tsx  # CREATE (feature highlight)
├── styles/
│   ├── globals.css                 # Global styles
│   ├── variables.css               # CSS custom properties (add --nav-height)
│   └── portal.css                  # DELETE THIS FILE
└── tailwind.config.ts              # Add nav spacing utility

DELETE:
components/portal/ (entire directory - MirrorShards, Navigation, etc.)
styles/portal.css
```

---

## Naming Conventions

**Components:** PascalCase
- `LandingHero.tsx`, `AuthLayout.tsx`, `GlowButton.tsx`

**Files:** Match component name
- Component: `LandingHero` → File: `LandingHero.tsx`

**Props Interfaces:** `{ComponentName}Props`
- `interface LandingHeroProps { ... }`

**Functions:** camelCase
- `handleSubmit()`, `validateForm()`, `createReflection()`

**Constants:** SCREAMING_SNAKE_CASE
- `MAX_RETRIES`, `DEFAULT_TIMEOUT`, `NAV_HEIGHT`

**CSS Classes:** kebab-case (Tailwind utilities) or camelCase (CSS modules)
- Tailwind: `bg-gradient-to-br`, `text-white/95`
- Custom: `reflection-text`, `cosmic-button`

**Variants:** lowercase strings
- `variant="cosmic"`, `size="lg"`, `type="email"`

---

## Entry Point Page Structure Pattern

### Landing Page Pattern

**File:** `app/page.tsx`

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
      description: 'Your personal mirror analyzes patterns and provides insights into your subconscious.',
    },
    {
      id: 'track-dreams',
      icon: '📖',
      title: 'Track Your Dreams',
      description: 'Organize and revisit your dream journal anytime, anywhere.',
    },
    {
      id: 'visualize-evolution',
      icon: '📈',
      title: 'Visualize Your Evolution',
      description: 'See how your dreams and thoughts evolve over time with interactive charts.',
    },
    {
      id: 'sacred-space',
      icon: '🌙',
      title: 'Sacred Space',
      description: 'Premium experience designed for deep introspection and self-discovery.',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background (consistent with app) */}
      <CosmicBackground animated={true} intensity={1} />

      {/* Navigation */}
      <LandingNavigation />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-8">
          <LandingHero />
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-8">
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

**Key Points:**
- `'use client'` directive for client-side interactivity
- CosmicBackground first (lowest z-index)
- Navigation second (fixed positioning)
- Main content with `relative z-10` (above background)
- Sections use `min-h-screen` or `py-20` for spacing
- Framer Motion for scroll-triggered animations
- Responsive grid for feature cards
- Footer with links

---

### Auth Page Pattern

**File:** `app/auth/signin/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import CosmicBackground from '@/components/shared/CosmicBackground';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Basic validation
    if (!formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    signin.mutate(formData);
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground animated={true} intensity={1} />

      <AuthLayout title="Welcome Back">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <GlassInput
            type="email"
            label="Email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
            placeholder="your@email.com"
            autoComplete="email"
            required
          />

          {/* Password Input */}
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

          {/* Error/Success Message */}
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

          {/* Submit Button */}
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

          {/* Switch to Signup */}
          <p className="text-center text-white/60 text-sm">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 transition-colors">
              Sign up
            </Link>
          </p>
        </form>
      </AuthLayout>
    </div>
  );
}
```

**Key Points:**
- CosmicBackground for consistency with landing
- AuthLayout wrapper handles common layout
- GlassInput for all form fields (type="email", type="password")
- GlowButton with cosmic variant for submit
- CosmicLoader shows during loading state
- Error/success messages with semantic colors
- Link to switch between signin/signup
- Form validation before mutation
- Auto-redirect on success

---

## Glass Component Usage Guidelines

### GlassCard Pattern

**Basic Usage:**
```tsx
import { GlassCard } from '@/components/ui/glass';

<GlassCard>
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-white/70">Card content goes here.</p>
</GlassCard>
```

**With Elevation (for emphasis):**
```tsx
<GlassCard elevated>
  <h3>Important Card</h3>
  <p>This card has stronger border and shadow.</p>
</GlassCard>
```

**Interactive Card (hover lift):**
```tsx
<GlassCard interactive onClick={() => console.log('Clicked!')}>
  <h3>Clickable Card</h3>
  <p>Hovers and lifts on mouse over.</p>
</GlassCard>
```

**Custom Styling:**
```tsx
<GlassCard className="p-8 md:p-12">
  <h3>Custom Padding</h3>
  <p>Override default p-6 with larger padding.</p>
</GlassCard>
```

---

### GlowButton Pattern

**Cosmic Variant (NEW - for entry points):**
```tsx
import { GlowButton } from '@/components/ui/glass';

<GlowButton variant="cosmic" size="lg">
  Start Reflecting
</GlowButton>
```

**Primary Variant (existing):**
```tsx
<GlowButton variant="primary" size="md">
  Save Changes
</GlowButton>
```

**Secondary Variant:**
```tsx
<GlowButton variant="secondary" size="md">
  Learn More
</GlowButton>
```

**With Loading State:**
```tsx
<GlowButton
  variant="cosmic"
  disabled={isLoading}
  className="w-full"
>
  {isLoading ? (
    <span className="flex items-center gap-2">
      <CosmicLoader size="sm" />
      Processing...
    </span>
  ) : (
    'Submit'
  )}
</GlowButton>
```

**Size Variants:**
```tsx
<GlowButton variant="cosmic" size="sm">Small</GlowButton>
<GlowButton variant="cosmic" size="md">Medium</GlowButton>
<GlowButton variant="cosmic" size="lg">Large</GlowButton>
```

---

### GlassInput Pattern

**Text Input:**
```tsx
import { GlassInput } from '@/components/ui/glass';

<GlassInput
  type="text"
  label="Your Name"
  value={name}
  onChange={(value) => setName(value)}
  placeholder="Enter your name"
  required
/>
```

**Email Input:**
```tsx
<GlassInput
  type="email"
  label="Email Address"
  value={email}
  onChange={(value) => setEmail(value)}
  placeholder="your@email.com"
  autoComplete="email"
  required
/>
```

**Password Input (with toggle):**
```tsx
<GlassInput
  type="password"
  label="Password"
  value={password}
  onChange={(value) => setPassword(value)}
  placeholder="Enter password"
  showPasswordToggle
  autoComplete="new-password"
  minLength={6}
  required
/>
```

**With Error State:**
```tsx
<GlassInput
  type="email"
  label="Email"
  value={email}
  onChange={(value) => setEmail(value)}
  error={emailError} // Shows red border + error message below
  required
/>
```

**Textarea Variant:**
```tsx
<GlassInput
  variant="textarea"
  label="Description"
  value={description}
  onChange={(value) => setDescription(value)}
  placeholder="Describe your dream..."
  rows={4}
  maxLength={500}
  showCounter
/>
```

**With Character Counter:**
```tsx
<GlassInput
  type="text"
  value={text}
  onChange={(value) => setText(value)}
  maxLength={100}
  showCounter
/>
```

---

### CosmicLoader Pattern

**Full-Page Loading:**
```tsx
import { CosmicLoader } from '@/components/ui/glass';

<div className="min-h-screen flex items-center justify-center">
  <div className="flex flex-col items-center gap-6">
    <CosmicLoader size="lg" />
    <p className="text-white/70 text-lg">Loading your dreams...</p>
  </div>
</div>
```

**Inline Button Loading:**
```tsx
<button disabled={isLoading}>
  {isLoading ? (
    <span className="flex items-center gap-2">
      <CosmicLoader size="sm" />
      Processing...
    </span>
  ) : (
    'Submit'
  )}
</button>
```

**Card Loading State:**
```tsx
<GlassCard>
  {isLoading ? (
    <div className="py-12 flex justify-center">
      <CosmicLoader size="md" label="Loading content" />
    </div>
  ) : (
    <div>{/* Actual content */}</div>
  )}
</GlassCard>
```

**Size Variants:**
- `sm`: 32px (inline, buttons)
- `md`: 64px (cards, sections)
- `lg`: 96px (full-page, hero)

---

## Responsive Design Patterns

### Mobile-First Breakpoints

**Tailwind Breakpoints (use consistently):**
```tsx
<div className="
  px-4           /* Mobile: 16px padding */
  sm:px-6        /* Small (640px+): 24px */
  md:px-8        /* Medium (768px+): 32px */
  lg:px-12       /* Large (1024px+): 48px */
  xl:px-16       /* Extra large (1280px+): 64px */
">
  {/* Content */}
</div>
```

**Typography Scaling:**
```tsx
<h1 className="
  text-3xl       /* Mobile: 1.875rem (30px) */
  sm:text-4xl    /* Small: 2.25rem (36px) */
  md:text-5xl    /* Medium: 3rem (48px) */
  lg:text-6xl    /* Large: 3.75rem (60px) */
  font-bold
">
  Headline
</h1>
```

**Grid Responsive:**
```tsx
<div className="
  grid
  grid-cols-1      /* Mobile: single column */
  md:grid-cols-2   /* Medium: 2 columns */
  lg:grid-cols-4   /* Large: 4 columns */
  gap-6
">
  {items.map((item) => (
    <div key={item.id}>{item.content}</div>
  ))}
</div>
```

**Hide/Show by Breakpoint:**
```tsx
{/* Show on mobile, hide on desktop */}
<div className="block lg:hidden">
  <MobileMenu />
</div>

{/* Hide on mobile, show on desktop */}
<div className="hidden lg:block">
  <DesktopNav />
</div>
```

---

## Loading State Pattern

### Reflection Creation Loading Overlay

**File:** `app/reflection/MirrorExperience.tsx`

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CosmicLoader } from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

export default function MirrorExperience() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('Gazing into the mirror...');

  const createReflection = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      // Keep overlay visible during transition
      setStatusText('Reflection complete!');
      setTimeout(() => {
        router.push(`/reflection/output?id=${data.reflectionId}`);
      }, 1000);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsSubmitting(false); // Hide overlay on error
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setStatusText('Gazing into the mirror...');

    // Update status text after 3 seconds
    setTimeout(() => {
      setStatusText('Crafting your reflection...');
    }, 3000);

    createReflection.mutate({
      dreamId,
      answers,
      tone,
    });
  };

  return (
    <div className="relative min-h-screen">
      {/* Main Content */}
      <div className="questionnaire">
        {/* Form fields */}
        <button onClick={handleSubmit}>Submit Reflection</button>
      </div>

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
    </div>
  );
}
```

**Key Points:**
- AnimatePresence for smooth fade in/out
- Absolute positioning with `inset-0` for full coverage
- High z-index (z-50) to overlay content
- Backdrop blur for depth
- Animated status text (breathing opacity)
- Multiple status messages (3s delay)
- Error recovery (hide overlay on error)
- Minimum display time via setTimeout

---

## Navigation Padding Pattern

### Add Padding to All Pages Using AppNavigation

**Pattern (for Dreams, Evolution, Visualizations pages):**

**BEFORE:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-4 sm:p-8">
  <AppNavigation currentPage="dreams" />
  <div className="max-w-7xl mx-auto">
    {/* Page content */}
  </div>
</div>
```

**AFTER:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-4 sm:px-8 pb-8">
  <AppNavigation currentPage="dreams" />
  <div className="max-w-7xl mx-auto">
    {/* Page content */}
  </div>
</div>
```

**Changes:**
1. Replace `p-4 sm:p-8` with `pt-nav px-4 sm:px-8 pb-8`
2. `pt-nav` uses custom Tailwind spacing (80px)
3. Horizontal padding remains responsive
4. Bottom padding explicit (pb-8)

**Tailwind Config Addition:**
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

**Result:**
- Content starts 80px below top (clears fixed navigation)
- Works on all viewports (mobile, tablet, desktop)
- Consistent across all pages

---

## Error State Handling

### Form Validation Pattern

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.email) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Invalid email format';
  }

  if (!formData.password) {
    newErrors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return; // Stop if validation fails
  }

  // Proceed with mutation
  mutation.mutate(formData);
};

// In JSX:
<GlassInput
  type="email"
  label="Email"
  value={formData.email}
  onChange={(value) => setFormData({ ...formData, email: value })}
  error={errors.email}
  required
/>
```

**Key Points:**
- Validate before mutation
- Store errors in state object
- Pass error string to GlassInput
- Clear errors on successful submit
- Show inline error messages

---

### API Error Handling Pattern

```tsx
const mutation = trpc.auth.signin.useMutation({
  onSuccess: (data) => {
    toast.success('Signed in successfully!');
    router.push('/dashboard');
  },
  onError: (error) => {
    // Map API errors to user-friendly messages
    let message = 'Something went wrong. Please try again.';

    if (error.message.includes('Invalid credentials')) {
      message = 'Incorrect email or password. Please try again.';
    } else if (error.message.includes('Rate limit')) {
      message = 'Too many attempts. Please wait a moment and try again.';
    } else if (error.message.includes('Network')) {
      message = 'Unable to connect. Please check your internet connection.';
    }

    setMessage({ type: 'error', text: message });
  },
});
```

**Key Points:**
- Map technical errors to user-friendly messages
- Handle specific error cases (credentials, rate limit, network)
- Show error in UI (toast or inline message)
- Don't expose internal error details to users

---

## Import Order Convention

**Standard Import Order (for all components):**

```tsx
// 1. React core
import { useState, useEffect, useRef } from 'react';

// 2. Next.js modules
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// 3. Third-party libraries
import { motion, AnimatePresence } from 'framer-motion';

// 4. tRPC/API
import { trpc } from '@/lib/trpc';

// 5. Shared components
import CosmicBackground from '@/components/shared/CosmicBackground';
import AppNavigation from '@/components/shared/AppNavigation';

// 6. UI components
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

// 7. Local components (same directory)
import LandingHero from './LandingHero';
import LandingFeatureCard from './LandingFeatureCard';

// 8. Types
import type { Dream, Reflection } from '@/types/schemas';

// 9. Utilities
import { cn } from '@/lib/utils';

// 10. Styles (if any)
import styles from './Component.module.css';
```

**Rationale:**
- React/Next.js first (framework essentials)
- External libraries second (dependencies)
- Internal modules third (project code)
- Types and utilities last (helpers)
- Blank line between groups for readability

---

## Code Quality Standards

### TypeScript Strict Mode

**All components MUST have explicit types:**

```tsx
// ✅ CORRECT
interface LandingHeroProps {
  title?: string;
  subtitle?: string;
  primaryCTA?: string;
  secondaryCTA?: string;
}

export default function LandingHero({
  title = 'Your Dreams, Reflected',
  subtitle = 'AI-powered reflection journal for self-discovery',
  primaryCTA = 'Start Reflecting',
  secondaryCTA = 'Learn More',
}: LandingHeroProps) {
  // ...
}

// ❌ INCORRECT (no types)
export default function LandingHero({ title, subtitle }) {
  // ...
}
```

**Event Handlers:**

```tsx
// ✅ CORRECT
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};
```

---

### Component Structure Convention

**Standard Component Template:**

```tsx
'use client'; // Only if using hooks/interactivity

import { useState } from 'react';
import { cn } from '@/lib/utils';

// 1. Props interface
interface ComponentNameProps {
  // Required props first
  id: string;
  title: string;

  // Optional props second
  description?: string;
  className?: string;

  // Callbacks last
  onClick?: () => void;
  onChange?: (value: string) => void;
}

// 2. Component definition
export default function ComponentName({
  id,
  title,
  description,
  className,
  onClick,
  onChange,
}: ComponentNameProps) {
  // 3. Hooks (useState, useEffect, custom hooks)
  const [isActive, setIsActive] = useState(false);

  // 4. Derived state/computed values
  const displayTitle = title.toUpperCase();

  // 5. Event handlers
  const handleClick = () => {
    setIsActive(true);
    onClick?.();
  };

  // 6. Effects (if any)
  useEffect(() => {
    // ...
  }, []);

  // 7. Render
  return (
    <div
      className={cn(
        'base-classes',
        isActive && 'active-classes',
        className
      )}
      onClick={handleClick}
    >
      <h3>{displayTitle}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
```

**Order:**
1. Props interface
2. Component definition
3. Hooks
4. Derived state
5. Event handlers
6. Effects
7. Render (return)

---

## Performance Patterns

### Lazy Loading Images

```tsx
import Image from 'next/image';

<Image
  src="/hero-image.jpg"
  alt="Mirror of Dreams Hero"
  width={1200}
  height={600}
  priority // For hero images (above fold)
  className="rounded-xl"
/>

<Image
  src="/feature-icon.png"
  alt="Feature icon"
  width={64}
  height={64}
  loading="lazy" // For below-fold images
  className="w-16 h-16"
/>
```

---

### Memoization Pattern

```tsx
import { useMemo, useCallback } from 'react';

// Memoize expensive computations
const sortedDreams = useMemo(() => {
  return dreams.sort((a, b) => b.createdAt - a.createdAt);
}, [dreams]);

// Memoize callbacks passed to children
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

---

### Debounced Input Pattern

```tsx
import { useState, useEffect } from 'react';

const [searchTerm, setSearchTerm] = useState('');
const [debouncedTerm, setDebouncedTerm] = useState('');

// Debounce search term
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedTerm(searchTerm);
  }, 300);

  return () => clearTimeout(timer);
}, [searchTerm]);

// Use debouncedTerm for API calls
useEffect(() => {
  if (debouncedTerm) {
    searchAPI(debouncedTerm);
  }
}, [debouncedTerm]);

<input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search dreams..."
/>
```

---

## Security Patterns

### Safe HTML Rendering

```tsx
// ❌ DANGEROUS (XSS risk if user input)
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE (trusted AI response only)
<div dangerouslySetInnerHTML={{ __html: reflection.aiResponse }} />

// ✅ SAFEST (escape user input)
<div>{userInput}</div>
```

---

### Form Security

```tsx
<form onSubmit={handleSubmit}>
  {/* CSRF protection (NextAuth handles automatically) */}

  <input
    type="email"
    autoComplete="email" // Browser autofill security
    required
  />

  <input
    type="password"
    autoComplete="current-password"
    minLength={6} // Client-side validation
    required
  />

  <button type="submit" disabled={isSubmitting}>
    {/* Prevent double-submit */}
    Submit
  </button>
</form>
```

---

**Patterns Complete**
**Total Patterns:** 15 major patterns with full code examples
**Coverage:** Entry points, components, forms, loading, navigation, errors, imports, performance, security
**Ready for:** Builder implementation (copy-paste patterns directly)

---

*These patterns ensure consistency, maintainability, and best practices across all iteration 3 code.*
