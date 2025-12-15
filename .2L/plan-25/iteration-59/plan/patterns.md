# Code Patterns & Conventions

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── clarify/
│   │   ├── page.tsx              # Clarify list page (needs padding fix)
│   │   └── [sessionId]/page.tsx  # REFERENCE: correct padding pattern
│   ├── dreams/page.tsx           # Dreams page (needs padding fix)
│   ├── evolution/page.tsx        # Evolution page (needs padding fix)
│   ├── visualizations/page.tsx   # Visualizations page (needs padding fix)
│   └── dashboard/page.tsx        # Dashboard (already correct)
├── components/
│   ├── dashboard/
│   │   └── shared/
│   │       ├── ReflectionItem.tsx           # Component to fix
│   │       └── __tests__/
│   │           └── ReflectionItem.test.tsx  # Test to update
│   └── reflection/
│       └── mobile/
│           ├── MobileReflectionFlow.tsx     # Overflow fix
│           └── views/
│               └── MobileDreamSelectionView.tsx  # Padding fix
└── test/
    └── helpers/
        └── index.ts              # Test utilities
```

## Bottom Padding Pattern

### When to use
Apply to any page that has bottom navigation (`<BottomNavigation />`) to ensure content is not hidden behind the nav on mobile devices with safe areas (notched iPhones, Android gesture navigation).

### Incorrect Pattern (DO NOT USE)
```tsx
// WRONG: Fixed 80px padding doesn't account for safe area
<div className="... pb-20 ... md:pb-8">
```

### Correct Pattern (USE THIS)
```tsx
// CORRECT: Dynamic padding that accounts for device safe area
<div className="... pb-[calc(80px+env(safe-area-inset-bottom))] ... md:pb-8">
```

### Full Example - Page Container
```tsx
// From /app/clarify/[sessionId]/page.tsx:400 (REFERENCE IMPLEMENTATION)
<div className="px-4 pb-[calc(80px+env(safe-area-inset-bottom))] sm:px-8 md:pb-6">
  {/* Page content here */}
</div>
```

### Pattern Breakdown
| Class | Purpose |
|-------|---------|
| `pb-[calc(80px+env(safe-area-inset-bottom))]` | Mobile: 80px base + device safe area |
| `md:pb-8` or `md:pb-6` | Desktop: Smaller padding (no bottom nav) |

### How env() Works
```css
/* On devices with safe area (e.g., iPhone 14 Pro): */
calc(80px + 34px) = 114px

/* On devices without safe area: */
calc(80px + 0px) = 80px
```

---

## ReflectionItem Preview Pattern

### When to use
When displaying a preview snippet from reflection data on dashboard cards or lists.

### Incorrect Fallback Order (BUG)
```typescript
// WRONG: refl.dream contains question text, NOT the AI response
const text = refl.aiResponse || refl.ai_response || refl.dream || refl.content || refl.preview;
//                                                   ^^^^^^^^^ BAD: shows user's question text
```

### Correct Fallback Order (FIX)
```typescript
// CORRECT: Skip refl.dream entirely - it's the question, not the reflection
const text = refl.aiResponse || refl.ai_response || refl.content || refl.preview;
```

### Full Function Pattern
```typescript
function getReflectionPreview(refl: ReflectionData): string {
  // Priority: AI response > content > preview
  // IMPORTANT: Do NOT include refl.dream - it contains question text!
  const text = refl.aiResponse || refl.ai_response || refl.content || refl.preview;

  if (!text) return 'Your reflection content...';

  // Use 120 chars for preview
  const maxLength = 120;
  // Strip any markdown/HTML for clean preview
  const cleanText = text
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/[#*_]/g, '')     // Remove markdown
    .trim();

  return cleanText.length > maxLength
    ? cleanText.substring(0, maxLength) + '...'
    : cleanText;
}
```

### Field Clarification
| Field | Contains | Use for Preview? |
|-------|----------|------------------|
| `aiResponse` | AI-generated reflection text | YES (primary) |
| `ai_response` | AI-generated reflection text (snake_case) | YES (fallback) |
| `content` | Reflection content | YES (fallback) |
| `preview` | Pre-generated preview | YES (fallback) |
| `dream` | User's QUESTION TEXT response | NO - DO NOT USE |

---

## Mobile Overflow Pattern

### When to use
When a mobile full-screen component needs scrollable content that must be fully visible.

### Problematic Pattern
```tsx
// WRONG: overflow-hidden clips content including buttons
<div className="relative flex-1 overflow-hidden">
  <motion.div className="absolute inset-0">
    {/* Content with buttons gets clipped */}
  </motion.div>
</div>
```

### Correct Pattern
```tsx
// CORRECT: overflow-y-auto allows scrolling to all content
<div className="relative flex-1 overflow-y-auto">
  <motion.div className="absolute inset-0">
    {/* Content is fully scrollable */}
  </motion.div>
</div>
```

### Additional Padding for Scrollable Areas
```tsx
// Add bottom padding to scrollable content area for button clearance
<div className="flex-1 space-y-3 overflow-y-auto pb-20">
  {/* Dreams list or empty state with button */}
</div>
```

---

## Testing Patterns

### Test File Naming Convention
- Unit tests: `{Component}.test.tsx` in `__tests__/` directory adjacent to component
- Example: `components/dashboard/shared/__tests__/ReflectionItem.test.tsx`

### Test Structure Pattern
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ReflectionItem from '../ReflectionItem';

// Mock factory function with defaults
const createMockReflection = (overrides = {}) => ({
  id: 'reflection-1',
  title: 'Test Reflection',
  content: 'Default content...',
  created_at: new Date().toISOString(),
  tone: 'fusion',
  is_premium: false,
  dreams: { title: 'Test Dream' },
  ...overrides,
});

describe('ReflectionItem', () => {
  describe('rendering', () => {
    it('should render reflection title', () => {
      const reflection = createMockReflection();
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('Test Dream')).toBeInTheDocument();
    });
  });

  describe('preview text', () => {
    it('should prioritize aiResponse for preview', () => {
      const reflection = createMockReflection({
        aiResponse: 'AI generated content',
        content: 'Regular content',
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('AI generated content')).toBeInTheDocument();
    });

    // UPDATED TEST: dream field should NOT be used for preview
    it('should NOT use dream field for preview (shows fallback instead)', () => {
      const reflection = createMockReflection({
        content: undefined,
        dream: 'Dream content here',  // This is question text
        aiResponse: undefined,
        ai_response: undefined,
        preview: undefined,
      });
      render(<ReflectionItem reflection={reflection} />);

      // Expect fallback text, NOT the dream field value
      expect(screen.getByText('Your reflection content...')).toBeInTheDocument();
    });
  });
});
```

### Mock Factory Pattern
```typescript
// Create factory with sensible defaults and override capability
const createMockReflection = (overrides: Partial<ReflectionData> = {}): ReflectionData => ({
  id: 'reflection-1',
  title: 'Test Reflection',
  content: 'Default reflection content for testing',
  created_at: new Date().toISOString(),
  tone: 'fusion',
  is_premium: false,
  dreams: { title: 'Test Dream' },
  aiResponse: undefined,
  ai_response: undefined,
  dream: undefined,
  preview: undefined,
  ...overrides,
});
```

### Test Commands
```bash
# Run all tests
npm run test:run

# Run specific component test
npm run test -- components/dashboard/shared/__tests__/ReflectionItem.test.tsx

# Run tests in watch mode
npm run test

# Run with coverage
npm run test:coverage
```

---

## Error Handling Patterns

### Graceful Fallback Pattern
```typescript
// Always provide a fallback for missing data
const text = refl.aiResponse || refl.ai_response || refl.content || refl.preview;
if (!text) return 'Your reflection content...';  // User-friendly fallback
```

### Safe Optional Chaining
```typescript
// Use optional chaining for potentially undefined nested objects
const displayTitle = reflection.dreams?.title || reflection.title || 'Reflection';
```

---

## Import Order Convention

Follow this order for imports:

```typescript
// 1. React and Next.js
'use client';
import React, { useState, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 2. External libraries (framer-motion, lucide-react, etc.)
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

// 3. Types (with 'type' keyword)
import type { Dream } from '@/lib/reflection/types';

// 4. Internal components
import { GlowButton } from '@/components/ui/glass';

// 5. Internal utilities and constants
import { cn } from '@/lib/utils';
import { CATEGORY_EMOJI } from '@/lib/reflection/constants';

// 6. Styles (CSS modules)
import styles from './ReflectionItem.module.css';
```

---

## Code Quality Standards

### TypeScript
- All components must have proper TypeScript interfaces
- Use `Partial<T>` for optional override objects in tests
- Avoid `any` type - use proper typing

### Tailwind CSS
- Use responsive modifiers for mobile-first design: `md:`, `sm:`
- Use arbitrary values for custom calculations: `pb-[calc(...)]`
- Keep class order consistent: layout > spacing > colors > effects

### Component Memoization
```typescript
// Use memo with custom comparator for list items
const ReflectionItem = memo(function ReflectionItem(props) {
  // Component implementation
}, areReflectionItemPropsEqual);
```
