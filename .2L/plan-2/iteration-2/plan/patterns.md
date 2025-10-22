# Code Patterns & Conventions - Core Pages Redesign

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard page
│   ├── dreams/
│   │   └── page.tsx              # Dreams list page
│   ├── reflection/
│   │   ├── page.tsx              # Reflection wrapper
│   │   ├── MirrorExperience.tsx  # Main reflection flow
│   │   └── output/
│   │       └── page.tsx          # Reflection output
│   └── layout.tsx
├── components/
│   ├── ui/
│   │   └── glass/                # Glass components (from Iteration 1)
│   │       ├── GlassCard.tsx
│   │       ├── GlowButton.tsx
│   │       ├── GradientText.tsx
│   │       ├── GlassDreamCard.tsx  (renamed)
│   │       ├── GlassModal.tsx
│   │       ├── FloatingNav.tsx
│   │       ├── CosmicLoader.tsx
│   │       ├── ProgressOrbs.tsx
│   │       ├── GlowBadge.tsx
│   │       ├── AnimatedBackground.tsx
│   │       └── index.ts          # Barrel export
│   ├── dashboard/
│   │   ├── cards/                # Dashboard card components
│   │   └── shared/               # Shared dashboard components
│   ├── dreams/                   # Dreams page components
│   └── shared/                   # Shared components (CosmicBackground)
├── lib/
│   ├── animations/
│   │   └── variants.ts           # Framer Motion variants
│   └── utils.ts                  # Utility functions (cn, etc.)
├── types/
│   └── glass-components.ts       # Glass component TypeScript types
├── styles/
│   ├── globals.css
│   ├── variables.css             # CSS variables (cosmic theme)
│   ├── dashboard.css             # Dashboard-specific (minimize usage)
│   └── mirror.css                # Reflection-specific (minimize usage)
└── tailwind.config.ts
```

---

## Naming Conventions

**Components:** PascalCase
- `GlassCard.tsx`, `GlowButton.tsx`, `DashboardPage.tsx`

**Props/Variables:** camelCase
- `variant`, `glowColor`, `isOpen`, `currentStep`

**Constants:** SCREAMING_SNAKE_CASE
- `MAX_RETRIES`, `DEFAULT_BLUR_INTENSITY`

**Functions:** camelCase
- `handleClick()`, `calculateProgress()`, `formatDate()`

**Files:**
- Components: PascalCase (`DashboardCard.tsx`)
- Utilities: camelCase (`formatCurrency.ts`)
- Hooks: camelCase with `use` prefix (`useDashboard.ts`)

**CSS Classes:**
- Tailwind utilities preferred
- Custom classes: kebab-case (`dashboard-nav`, `cosmic-loader`)

---

## Import Order Convention

**Standard import order for all components:**

```tsx
// 1. React core
'use client'
import { useState, useEffect } from 'react'

// 2. External libraries (alphabetical)
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, Check } from 'lucide-react'

// 3. Internal components (alphabetical)
import { GlassCard, GlowButton, CosmicLoader } from '@/components/ui/glass'
import { CosmicBackground } from '@/components/shared/CosmicBackground'

// 4. Internal utilities (alphabetical)
import { cn } from '@/lib/utils'
import { cardVariants, buttonVariants } from '@/lib/animations/variants'

// 5. Hooks (alphabetical)
import { useAuth } from '@/hooks/useAuth'
import { useDashboard } from '@/hooks/useDashboard'

// 6. Types (alphabetical)
import type { GlassCardProps, GlowButtonProps } from '@/types/glass-components'

// 7. Styles (last)
import '@/styles/dashboard.css'
```

---

## Pattern 1: Replace Loading Spinner with CosmicLoader

**Current Pattern (All Pages):**

```tsx
// Old inline styled spinner
{isLoading && (
  <div className="loading-container">
    <div className="cosmic-spinner" />
    <p className="loading-text">Loading your dashboard...</p>
    <style jsx>{`
      .cosmic-spinner {
        width: 60px;
        height: 60px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: rgba(251, 191, 36, 0.8);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)}
```

**New Glass Pattern:**

```tsx
import { CosmicLoader } from '@/components/ui/glass'

{isLoading && (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    <CosmicLoader size="lg" />
    <p className="text-white/60 text-sm">Loading your dashboard...</p>
  </div>
)}
```

**Key Points:**
- Use `size` prop: `sm`, `md`, or `lg`
- CosmicLoader has built-in reduced motion support
- Gradient ring automatically matches theme
- No custom CSS required

**Where to Apply:**
- Dashboard: Line 176-177 (page loading)
- Dreams: Line 44-72 (page loading)
- Reflection: Line 6-30 (wrapper loading), Line 991-1047 (output loading)

---

## Pattern 2: Replace Buttons with GlowButton

**Current Pattern (Primary Action Button):**

```tsx
// Old inline styled button
<button
  className="reflect-now-button"
  onClick={handleReflectNow}
  disabled={!canReflect}
>
  <span className="button-icon">✨</span>
  <span className="button-text">Reflect Now</span>
  <style jsx>{`
    .reflect-now-button {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(147, 51, 234, 0.25));
      border: 2px solid rgba(251, 191, 36, 0.4);
      padding: 16px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(251, 191, 36, 0.2);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .reflect-now-button:hover {
      box-shadow: 0 8px 30px rgba(251, 191, 36, 0.4);
      transform: translateY(-2px);
    }
  `}</style>
</button>
```

**New Glass Pattern:**

```tsx
import { GlowButton } from '@/components/ui/glass'

<GlowButton
  variant="primary"
  size="lg"
  onClick={handleReflectNow}
  disabled={!canReflect}
  className="w-full sm:w-auto"
>
  <span className="text-2xl mr-2">✨</span>
  Reflect Now
</GlowButton>
```

**Variant Guide:**
- `primary` - Gradient background, glow on hover (main CTAs)
- `secondary` - Glass effect, border glow (secondary actions)
- `ghost` - Transparent with glow on hover (tertiary actions)

**Size Guide:**
- `sm` - Small buttons (filters, tags) - `px-3 py-1.5 text-sm`
- `md` - Medium buttons (default) - `px-4 py-2 text-base`
- `lg` - Large buttons (primary CTAs) - `px-6 py-3 text-lg`

**Where to Apply:**
- Dashboard: Reflect Now (line 363-376), Refresh (line 278-285), Upgrade buttons
- Dreams: Create Dream (line 87-93), Filter buttons (line 112-136)
- Reflection: Submit (line 853-871), Navigation (line 806-850), Choice buttons (line 779-804)

---

## Pattern 3: Replace Cards with GlassCard

**Current Pattern (Dashboard Cards):**

```tsx
// Old custom card wrapper
<div className="dashboard-card">
  <div className="card-header">
    <h3 className="card-title">
      <span className="card-icon">📊</span>
      Usage Stats
    </h3>
  </div>
  <div className="card-content">
    {/* Content */}
  </div>
  <style jsx>{`
    .dashboard-card {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
    }
    .dashboard-card:hover {
      box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
      transform: translateY(-4px);
    }
  `}</style>
</div>
```

**New Glass Pattern:**

```tsx
import { GlassCard, GradientText } from '@/components/ui/glass'

<GlassCard
  variant="elevated"
  glowColor="purple"
  hoverable={true}
  className="w-full"
>
  <div className="flex justify-between items-center mb-4">
    <GradientText variant="subtitle">
      <span className="mr-2">📊</span>
      Usage Stats
    </GradientText>
  </div>
  <div className="space-y-4">
    {/* Content */}
  </div>
</GlassCard>
```

**Variant Guide:**
- `default` - Standard glass effect (subtle blur, light border)
- `elevated` - Enhanced glass (stronger blur, glow shadow)
- `inset` - Inset glass (darker background, inner shadow)

**Glow Color Guide:**
- `purple` - Purple glow (default, mystical)
- `blue` - Blue glow (calm, informative)
- `gold` - Gold glow (premium, success)
- `cyan` - Cyan glow (active, progress)

**Hoverable Prop:**
- `true` - Elevation on hover (interactive cards)
- `false` - No hover effect (static containers)

**Where to Apply:**
- Dashboard: Navigation wrapper, toast notifications, error banners, card wrappers
- Dreams: Header section, limits banner, empty state, modal content
- Reflection: Mirror frame, tone selection cards, dream selection cards, output display

---

## Pattern 4: Replace Modal with GlassModal

**Current Pattern (CreateDreamModal):**

```tsx
// Old custom modal
{isModalOpen && (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>×</button>
      <h2 className="modal-title">Create New Dream</h2>
      <div className="modal-body">
        {children}
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 1000;
        }
        .modal-content {
          position: relative;
          background: rgba(30, 41, 59, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 32px;
          max-width: 600px;
          margin: auto;
        }
      `}</style>
    </div>
  </div>
)}
```

**New Glass Pattern:**

```tsx
import { GlassModal } from '@/components/ui/glass'

<GlassModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Create New Dream"
  glassIntensity="medium"
>
  <div className="space-y-6">
    {children}
  </div>
</GlassModal>
```

**Props:**
- `isOpen` - Boolean to control visibility
- `onClose` - Function called when close button clicked or overlay clicked
- `title` - Modal title (optional)
- `glassIntensity` - `subtle`, `medium`, or `strong`

**Key Features:**
- AnimatePresence for smooth exit animations
- Dark blur backdrop with fade-in
- Close button with ARIA label
- Click outside to close (stopPropagation handled internally)
- Escape key support (can be added)

**Where to Apply:**
- Dreams: CreateDreamModal wrapper (line 179-183)

---

## Pattern 5: Replace Progress Indicator with ProgressOrbs

**Current Pattern (Reflection Flow):**

```tsx
// Old custom SVG progress ring
<svg className="progress-svg" viewBox="0 0 120 120">
  <circle
    className="progress-background"
    cx="60"
    cy="60"
    r="54"
    fill="none"
    stroke="rgba(255, 255, 255, 0.1)"
    strokeWidth="8"
  />
  <circle
    className="progress-bar"
    cx="60"
    cy="60"
    r="54"
    fill="none"
    stroke="url(#gradient)"
    strokeWidth="8"
    strokeDasharray={`${2 * Math.PI * 54}`}
    strokeDashoffset={`${2 * Math.PI * 54 * (1 - currentStep / 5)}`}
  />
  <text className="progress-text" x="60" y="65" textAnchor="middle">
    {currentStep}/5
  </text>
  <defs>
    <linearGradient id="gradient">
      <stop offset="0%" stopColor="#fbbf24" />
      <stop offset="100%" stopColor="#9333ea" />
    </linearGradient>
  </defs>
  <style jsx>{`
    .progress-svg { width: 120px; height: 120px; }
    .progress-bar { transition: stroke-dashoffset 0.5s ease; }
  `}</style>
</svg>
```

**New Glass Pattern:**

```tsx
import { ProgressOrbs } from '@/components/ui/glass'

<ProgressOrbs
  steps={5}
  currentStep={currentStep - 1}  // 0-indexed (step 1 = index 0)
  className="mb-6"
/>
```

**Props:**
- `steps` - Total number of steps (e.g., 5)
- `currentStep` - Current step index (0-indexed, so step 1 = 0)
- `className` - Additional Tailwind classes

**Key Features:**
- Horizontal row of glowing dots
- Completed steps: Full glow
- Current step: Pulsing glow
- Upcoming steps: Dim glow
- Smooth animation between steps
- Reduced motion support (static dots)

**Where to Apply:**
- Reflection: Replace SVG progress ring (line 695-725)

---

## Pattern 6: Replace Toasts with GlassCard + GlowBadge

**Current Pattern (Dashboard Toast):**

```tsx
// Old custom toast
{showToast && (
  <div className={`dashboard-toast dashboard-toast--${showToast.type}`}>
    <div className="dashboard-toast__content">
      <span className="dashboard-toast__icon">
        {showToast.type === 'success' ? '✅' : '❌'}
      </span>
      <span className="dashboard-toast__message">{showToast.message}</span>
    </div>
    <button className="dashboard-toast__close" onClick={() => setShowToast(null)}>
      ×
    </button>
    <style jsx>{`
      .dashboard-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(30, 41, 59, 0.95);
        backdrop-filter: blur(20px);
        border-left: 4px solid;
        padding: 16px;
        border-radius: 12px;
        z-index: 1000;
      }
      .dashboard-toast--success { border-left-color: #10b981; }
      .dashboard-toast--error { border-left-color: #ef4444; }
    `}</style>
  </div>
)}
```

**New Glass Pattern:**

```tsx
import { GlassCard, GlowBadge } from '@/components/ui/glass'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

<AnimatePresence>
  {showToast && (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 right-6 z-[1000]"
    >
      <GlassCard
        variant="elevated"
        className="flex items-center gap-3 min-w-[300px] max-w-md"
      >
        <GlowBadge variant={showToast.type}>
          {showToast.type === 'success' ? '✅' : '❌'}
        </GlowBadge>
        <span className="flex-1 text-sm text-white/90">
          {showToast.message}
        </span>
        <button
          onClick={() => setShowToast(null)}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </GlassCard>
    </motion.div>
  )}
</AnimatePresence>
```

**GlowBadge Variants:**
- `success` - Green glow (✅ checkmarks, completed states)
- `warning` - Orange glow (⚠️ warnings, limits)
- `error` - Red glow (❌ errors, failures)
- `info` - Blue glow (ℹ️ information, tips)

**Key Points:**
- Use AnimatePresence for exit animations
- Fixed positioning with proper z-index
- Close button with ARIA label
- Auto-dismiss with setTimeout (optional)

**Where to Apply:**
- Dashboard: Toast notifications (line 411-434)

---

## Pattern 7: Replace Gradient Text with GradientText Component

**Current Pattern (Page Titles):**

```tsx
// Old inline styled gradient text
<h1 className="page-title">
  Your Dreams
  <style jsx>{`
    .page-title {
      font-size: 3rem;
      font-weight: 700;
      background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `}</style>
</h1>
```

**New Glass Pattern:**

```tsx
import { GradientText } from '@/components/ui/glass'

<GradientText variant="hero" className="mb-2">
  Your Dreams
</GradientText>
```

**Variant Guide:**
- `hero` - Large gradient text (3xl-5xl, page titles)
- `title` - Medium gradient text (2xl-3xl, section titles)
- `subtitle` - Small gradient text (lg-xl, card titles)
- `accent` - Inline gradient text (base-lg, highlights)

**Animated Option:**

```tsx
<GradientText variant="hero" animated={true}>
  Mirror of Dreams
</GradientText>
```

**Where to Apply:**
- Dashboard: User greeting, card titles
- Dreams: Page title, section headers
- Reflection: Question text, output title

---

## Pattern 8: Navigation Glass Wrapper

**Current Pattern (Dashboard Navigation):**

```tsx
// Old custom navigation
<nav className="dashboard-nav">
  <div className="nav-content">
    {/* Navigation items */}
  </div>
  <style jsx>{`
    .dashboard-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(15, 15, 35, 0.85);
      backdrop-filter: blur(30px) saturate(120%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 16px 24px;
      z-index: 100;
    }
  `}</style>
</nav>
```

**New Glass Pattern:**

```tsx
import { GlassCard } from '@/components/ui/glass'

<GlassCard
  variant="elevated"
  glassIntensity="strong"
  hoverable={false}
  className="fixed top-0 left-0 right-0 z-[100] rounded-none border-b border-white/10"
>
  <div className="container mx-auto px-6 py-4">
    {/* Navigation items */}
  </div>
</GlassCard>
```

**Key Points:**
- `rounded-none` removes card border radius for edge-to-edge nav
- `fixed` positioning with `z-[100]`
- `glassIntensity="strong"` for prominent glass effect
- `hoverable={false}` to disable hover elevation

**Where to Apply:**
- Dashboard: Navigation bar (line 230-353)

---

## Pattern 9: Choice Buttons (Binary Selection)

**Current Pattern (Reflection Yes/No):**

```tsx
// Old custom choice buttons
<div className="choice-container">
  <button
    className={`choice-button ${selectedChoice === 'yes' ? 'selected' : ''}`}
    onClick={() => handleChoice('yes')}
  >
    Yes
  </button>
  <button
    className={`choice-button ${selectedChoice === 'no' ? 'selected' : ''}`}
    onClick={() => handleChoice('no')}
  >
    No
  </button>
  <style jsx>{`
    .choice-button {
      flex: 1;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
    }
    .choice-button.selected {
      background: rgba(251, 191, 36, 0.2);
      border-color: rgba(251, 191, 36, 0.6);
      box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
    }
  `}</style>
</div>
```

**New Glass Pattern:**

```tsx
import { GlowButton } from '@/components/ui/glass'

<div className="grid grid-cols-2 gap-4">
  <GlowButton
    variant={selectedChoice === 'yes' ? 'primary' : 'secondary'}
    size="lg"
    onClick={() => handleChoice('yes')}
    className="w-full"
  >
    Yes
  </GlowButton>
  <GlowButton
    variant={selectedChoice === 'no' ? 'primary' : 'secondary'}
    size="lg"
    onClick={() => handleChoice('no')}
    className="w-full"
  >
    No
  </GlowButton>
</div>
```

**Key Points:**
- Selected state uses `primary` variant (glow)
- Unselected state uses `secondary` variant (subtle)
- Grid layout for equal width buttons
- Large size for touch-friendly targets

**Where to Apply:**
- Reflection: Yes/No choice buttons (line 779-804)

---

## Pattern 10: Visual Selection Cards

**Current Pattern (Dream Selection):**

```tsx
// Old inline styled selection cards
{dreams.map((dream) => (
  <button
    key={dream.id}
    className={`dream-selection-item ${selectedDreamId === dream.id ? 'selected' : ''}`}
    onClick={() => setSelectedDreamId(dream.id)}
  >
    <span className="dream-emoji">{dream.emoji}</span>
    <div className="dream-info">
      <div className="dream-title">{dream.title}</div>
      <div className="dream-meta">{dream.category}</div>
    </div>
    {selectedDreamId === dream.id && <span className="check-icon">✓</span>}
    <style jsx>{`
      .dream-selection-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
      }
      .dream-selection-item.selected {
        background: rgba(139, 92, 246, 0.15);
        border-color: rgba(139, 92, 246, 0.5);
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
      }
    `}</style>
  </button>
))}
```

**New Glass Pattern:**

```tsx
import { GlassCard, GradientText } from '@/components/ui/glass'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

<div className="space-y-3">
  {dreams.map((dream) => {
    const isSelected = selectedDreamId === dream.id

    return (
      <GlassCard
        key={dream.id}
        variant={isSelected ? 'elevated' : 'default'}
        glowColor={isSelected ? 'purple' : undefined}
        hoverable
        className={cn(
          'cursor-pointer transition-all',
          isSelected && 'border-mirror-purple/60'
        )}
        onClick={() => setSelectedDreamId(dream.id)}
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{dream.emoji}</span>
          <div className="flex-1">
            <GradientText variant="subtitle">{dream.title}</GradientText>
            <p className="text-sm text-white/60 mt-1">{dream.category}</p>
          </div>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-mirror-purple"
            >
              <Check className="h-6 w-6" />
            </motion.div>
          )}
        </div>
      </GlassCard>
    )
  })}
</div>
```

**Key Points:**
- Selected card gets `elevated` variant + purple glow
- Checkmark animates in with scale
- Cursor pointer for hover feedback
- GradientText for dream title
- Accessible (button semantics via onClick on card)

**Where to Apply:**
- Reflection: Dream selection list (line 1061-1085)
- Reflection: Tone selection cards (line 893-916)

---

## Pattern 11: Glassmorphic Input Fields

**Current Pattern (Reflection Textarea):**

```tsx
// Old inline styled textarea
<textarea
  className="reflection-textarea"
  value={formData.dream}
  onChange={(e) => setFormData({ ...formData, dream: e.target.value })}
  placeholder="Describe your deepest dream..."
  maxLength={2000}
/>
<div className="char-counter">{formData.dream.length} / 2000</div>
<style jsx>{`
  .reflection-textarea {
    width: 100%;
    min-height: 150px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: white;
    resize: vertical;
  }
  .reflection-textarea:focus {
    border-color: rgba(251, 191, 36, 0.5);
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
    outline: none;
  }
`}</style>
```

**New Glass Pattern (Reusable Component):**

Create a new shared component: `/components/ui/glass/GlassInput.tsx`

```tsx
'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

interface GlassInputProps {
  variant?: 'text' | 'textarea'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  showCounter?: boolean
  label?: string
  className?: string
}

export function GlassInput({
  variant = 'text',
  value,
  onChange,
  placeholder,
  maxLength,
  showCounter = false,
  label,
  className,
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const baseClasses = cn(
    'w-full px-4 py-3 rounded-xl',
    'bg-white/5 backdrop-blur-glass-sm',
    'border-2 transition-all duration-300',
    'text-white placeholder:text-white/40',
    'focus:outline-none',
    isFocused
      ? 'border-mirror-purple/60 shadow-glow'
      : 'border-white/10',
    className
  )

  const Component = variant === 'textarea' ? 'textarea' : 'input'

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm text-white/70 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <Component
          className={baseClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          {...(variant === 'textarea' && {
            rows: 5,
            style: { resize: 'vertical' }
          })}
        />
        {showCounter && maxLength && (
          <div className="absolute bottom-3 right-3 text-xs text-white/40">
            {value.length} / {maxLength}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Usage:**

```tsx
import { GlassInput } from '@/components/ui/glass'

<GlassInput
  variant="textarea"
  value={formData.dream}
  onChange={(value) => setFormData({ ...formData, dream: value })}
  placeholder="Describe your deepest dream..."
  maxLength={2000}
  showCounter={true}
  label="What is your deepest dream?"
/>
```

**Key Features:**
- Glass background with focus glow
- Character counter (optional)
- Auto-resize for textarea
- Purple glow on focus
- Reduced motion support (transitions can be disabled)

**Where to Apply:**
- Reflection: All question inputs (5 questions)
- Dreams: CreateDreamModal form fields

---

## Pattern 12: Error Banner with Glass Styling

**Current Pattern (Dashboard Error):**

```tsx
// Old error banner
{error && (
  <div className="error-banner">
    <span className="error-icon">⚠️</span>
    <span className="error-message">{error}</span>
    <button className="error-dismiss" onClick={() => setError(null)}>×</button>
    <style jsx>{`
      .error-banner {
        background: rgba(239, 68, 68, 0.1);
        border-left: 4px solid #ef4444;
        padding: 16px;
        border-radius: 8px;
      }
    `}</style>
  </div>
)}
```

**New Glass Pattern:**

```tsx
import { GlassCard, GlowBadge } from '@/components/ui/glass'
import { X, AlertTriangle } from 'lucide-react'

{error && (
  <GlassCard
    variant="elevated"
    className="border-l-4 border-red-500/60"
  >
    <div className="flex items-start gap-3">
      <GlowBadge variant="error">
        <AlertTriangle className="h-4 w-4" />
      </GlowBadge>
      <div className="flex-1">
        <p className="text-sm text-white/90">{error}</p>
      </div>
      <button
        onClick={() => setError(null)}
        className="text-white/60 hover:text-white transition-colors"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </GlassCard>
)}
```

**Where to Apply:**
- Dashboard: Error banner (line 437-457)

---

## Animation Integration Patterns

### Pattern 13: Disable Glass Animations Where Custom Animations Exist

**Problem:** Dashboard cards use custom stagger animation hook

**Solution:**

```tsx
import { GlassCard } from '@/components/ui/glass'

// Dashboard cards with existing stagger animation
<GlassCard
  animated={false}  // Disable built-in entrance animation
  variant="elevated"
  hoverable={true}
>
  {/* Card content */}
</GlassCard>
```

**Key Point:** When page has custom animation system, disable glass component animations with `animated={false}` prop

---

### Pattern 14: Page-Level Stagger Animation

**Current Pattern (Dashboard):**

```tsx
// Existing stagger animation hook
const { itemRefs, isItemVisible } = useStaggerAnimation(5, { delay: 150, duration: 800 })

// Applied to cards
<div ref={itemRefs[0]} className={isItemVisible[0] ? 'visible' : 'hidden'}>
  <UsageCard />
</div>
```

**Preservation Strategy:**

```tsx
// Keep existing stagger logic
const { itemRefs, isItemVisible } = useStaggerAnimation(5, { delay: 150, duration: 800 })

// Apply to GlassCard wrapper
<div ref={itemRefs[0]} className={isItemVisible[0] ? 'visible' : 'hidden'}>
  <GlassCard animated={false} variant="elevated" hoverable>
    <UsageCard />
  </GlassCard>
</div>
```

**Where to Apply:**
- Dashboard: All 5 dashboard cards (preserve existing stagger system)

---

## Responsive Design Patterns

### Pattern 15: Mobile-First Responsive Buttons

```tsx
import { GlowButton } from '@/components/ui/glass'

<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <GlowButton
    variant="ghost"
    size="md"
    onClick={handleBack}
    className="w-full sm:w-auto"
  >
    ← Back
  </GlowButton>
  <GlowButton
    variant="primary"
    size="md"
    onClick={handleNext}
    className="w-full sm:w-auto"
  >
    Continue →
  </GlowButton>
</div>
```

**Key Points:**
- Full width on mobile (`w-full`)
- Auto width on desktop (`sm:w-auto`)
- Flex column on mobile, row on desktop
- Consistent gap spacing

---

### Pattern 16: Responsive Grid Layouts

```tsx
// Dreams grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {dreams.map((dream) => (
    <GlassDreamCard key={dream.id} dream={dream} />
  ))}
</div>

// Dashboard cards grid
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

**Breakpoints:**
- `sm`: 640px (mobile landscape, small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)

---

## Z-Index Layering Convention

**Documented z-index scale:**

```tsx
// Global z-index variables (use in components)
const Z_INDEX = {
  BACKGROUND: 0,        // CosmicBackground
  CONTENT: 10,          // Page content
  STICKY: 50,           // Sticky headers
  NAVIGATION: 100,      // Fixed navigation
  DROPDOWN: 200,        // Dropdown menus
  TOAST: 500,           // Toast notifications
  MODAL_BACKDROP: 900,  // Modal overlays
  MODAL_CONTENT: 1000,  // Modal content
}

// Usage in Tailwind
<div className="z-[100]">  // Navigation
<div className="z-[1000]"> // Modal
```

**Standard Layers:**
- 0: Background effects (CosmicBackground)
- 10: Normal page content
- 100: Fixed navigation
- 500: Toast notifications
- 1000: Modals

---

## Accessibility Patterns

### Pattern 17: Reduced Motion Support

**All glass components automatically support reduced motion:**

```tsx
// Glass components check for prefers-reduced-motion
// No extra code needed - it's built-in

<GlowButton variant="primary">
  Click Me
</GlowButton>
// ^ Will have static styling if user prefers reduced motion
```

**Test:**
1. Enable "Reduce Motion" in OS settings
2. Reload page
3. Verify animations disabled (buttons static, no entrance animations)

---

### Pattern 18: Keyboard Navigation

```tsx
import { GlassCard } from '@/components/ui/glass'

// Clickable card needs keyboard support
<GlassCard
  variant="default"
  hoverable
  className="cursor-pointer"
  onClick={() => handleClick()}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
  tabIndex={0}
  role="button"
  aria-label="Select dream"
>
  {/* Card content */}
</GlassCard>
```

**Key Points:**
- Add `tabIndex={0}` for keyboard focus
- Handle Enter and Space keys
- Add `role="button"` for semantics
- Add `aria-label` for screen readers

---

## Testing Checklist Pattern

**Visual Regression Testing:**

```markdown
## Component: [Name]
## Page: [Dashboard/Dreams/Reflection]

### Before Changes
- [ ] Screenshot captured: `before-[component-name].png`
- [ ] Functionality documented

### After Changes
- [ ] Screenshot captured: `after-[component-name].png`
- [ ] Side-by-side comparison shows identical/improved appearance
- [ ] Functionality unchanged (tested manually)
- [ ] Keyboard navigation works (Tab through)
- [ ] Mobile responsive (tested at 480px, 768px, 1024px)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Reduced motion tested (toggle OS setting)

### Performance (if applicable)
- [ ] Bundle size change: [no change / +X KB / -X KB]
- [ ] Lighthouse score: [score]
- [ ] Animation frame rate: [60fps / smooth]
```

---

## Code Quality Standards

### Pattern 19: Type-Safe Component Usage

```tsx
// Always import types
import type { GlassCardProps, GlowButtonProps } from '@/types/glass-components'

// Use TypeScript for props
interface PageProps {
  initialData?: DashboardData
}

// Type-safe component usage
const glowColor: GlassCardProps['glowColor'] = 'purple'

<GlassCard
  variant="elevated"
  glowColor={glowColor}
  hoverable={true}
>
  {/* Content */}
</GlassCard>
```

---

### Pattern 20: Utility Class Merging

```tsx
import { cn } from '@/lib/utils'

// Merge Tailwind classes conditionally
<GlassCard
  variant="default"
  className={cn(
    'transition-all',
    isActive && 'border-mirror-purple/60',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
>
  {/* Content */}
</GlassCard>
```

**Key Points:**
- Use `cn()` utility for conditional class merging
- Later classes override earlier classes (Tailwind merge logic)
- Keeps component props clean

---

**These patterns provide copy-pasteable code for all common operations. Builders should reference this file extensively and adapt patterns to their specific use cases.**
