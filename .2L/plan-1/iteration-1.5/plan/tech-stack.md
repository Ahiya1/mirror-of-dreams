# Technology Stack - Iteration 1.5

## Executive Summary

Iteration 1.5 builds on the **proven foundation from Iteration 1**. We are NOT changing the tech stack - we are completing the UI migration to the existing TypeScript/tRPC/Next.js infrastructure.

**Key Principle:** Use what's already working. Don't introduce new dependencies unless absolutely necessary.

---

## Core Framework

### Decision: Next.js 14 (App Router)

**Already Configured:** ✅ Yes (Iteration 1)

**Version:** Next.js 14.x with React 18

**Rationale:**
1. **Server Components:** Reduce bundle size for dashboard-heavy pages
2. **File-based routing:** Clean migration from React Router paths
3. **Built-in optimizations:** Image optimization, font optimization, code splitting
4. **tRPC integration:** Already proven in Iteration 1 (signin page works)
5. **Production-ready:** Vercel deployment pipeline already configured

**File Structure:**
```
app/
├── page.tsx                    # Landing page (Portal)
├── dashboard/
│   └── page.tsx               # Dashboard
├── reflection/
│   ├── page.tsx               # Questionnaire
│   └── output/
│       └── page.tsx           # Reflection output
└── auth/
    ├── signin/
    │   └── page.tsx           # ✅ Already migrated
    └── signup/
        └── page.tsx           # To migrate
```

**Migration Pattern:**
```tsx
// Old: React Router
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/dashboard');

// New: Next.js App Router
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');
```

**Alternatives Considered:**
- **Remix:** Not chosen (Next.js already working, no need to switch)
- **Create React App:** Not chosen (outdated, no SSR)

---

## Language & Type System

### Decision: TypeScript 5.x (Strict Mode)

**Already Configured:** ✅ Yes (Iteration 1)

**Strict Mode Settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Rationale:**
1. **Type safety:** Catch errors at compile time, not runtime
2. **tRPC synergy:** End-to-end type safety from server to client
3. **Better DX:** IntelliSense autocomplete for all APIs
4. **Refactoring confidence:** Rename/refactor with certainty

**Migration Pattern:**
```tsx
// Old: JavaScript (.jsx)
const UsageCard = ({ data, isLoading, animated = true }) => {
  // Component logic
};

// New: TypeScript (.tsx)
interface UsageCardProps {
  data: UsageData;
  isLoading: boolean;
  animated?: boolean;
}

const UsageCard: React.FC<UsageCardProps> = ({
  data,
  isLoading,
  animated = true
}) => {
  // Component logic
};
```

**Type Definitions Location:**
- Shared types: `types/` directory (already exists)
- Component props: Inline interfaces in component files
- Hook return types: Export from hook files

**Alternatives Considered:**
- **JavaScript + JSDoc:** Not chosen (weak type safety)
- **Flow:** Not chosen (TypeScript is industry standard)

---

## API Layer

### Decision: tRPC v10 (Type-Safe APIs)

**Already Configured:** ✅ Yes (Iteration 1)

**Routers Available:**
```typescript
// server/trpc/routers/_app.ts
export const appRouter = router({
  auth: authRouter,           // ✅ Signin/signup/signout
  reflections: reflectionsRouter, // ✅ List/get reflections
  reflection: reflectionRouter,   // ✅ Create reflection (AI generation)
  users: usersRouter,         // ✅ User profile operations
  evolution: evolutionRouter, // ⚠️  UI only for now (stub data OK)
  artifact: artifactRouter,   // ⚠️  Deferred to Iteration 2
  subscriptions: subscriptionsRouter, // ⚠️ Show tier info only
  admin: adminRouter,         // ⚠️  Not used in Iteration 1.5
});
```

**Rationale:**
1. **End-to-end type safety:** Client knows exact server return types
2. **No API versioning:** Types prevent breaking changes
3. **Zero boilerplate:** No axios config, no manual error handling
4. **Already proven:** Signin page uses tRPC successfully

**Client Usage Pattern:**
```tsx
'use client';

import { trpc } from '@/lib/trpc';

// Query (GET)
const { data, isLoading, error } = trpc.reflections.list.useQuery();

// Mutation (POST/PUT/DELETE)
const createReflection = trpc.reflection.create.useMutation({
  onSuccess: (data) => {
    router.push(`/reflection/output?id=${data.id}`);
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// Usage
await createReflection.mutateAsync({
  dream: formData.dream,
  plan: formData.plan,
  // ...
});
```

**Server-Side Pattern:**
```typescript
// server/trpc/routers/reflections.ts
export const reflectionsRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx;
      return await getReflectionsByUserId(user.id);
    }),
});
```

**Alternatives Considered:**
- **REST API:** Not chosen (no type safety, more boilerplate)
- **GraphQL:** Not chosen (overkill for this use case)
- **Server Actions (Next.js 14):** Not chosen (tRPC already working)

---

## Database

### Decision: Supabase (PostgreSQL + Auth)

**Already Configured:** ✅ Yes (Iteration 1)

**Connection:** Supabase client library (`server/lib/supabase.ts`)

**Schema:** Already defined in Supabase dashboard (tables: users, reflections, subscriptions, etc.)

**Rationale:**
1. **Already working:** Auth and data storage proven
2. **Managed PostgreSQL:** No server management
3. **Real-time capabilities:** Future enhancement possibility
4. **Row-level security:** Built-in security model

**Usage Pattern:**
```typescript
import { supabase } from '@/server/lib/supabase';

// Query
const { data, error } = await supabase
  .from('reflections')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Insert
const { data, error } = await supabase
  .from('reflections')
  .insert({ user_id, content, tone });
```

**Alternatives Considered:**
- **Prisma:** Not chosen (Supabase already integrated)
- **MongoDB:** Not chosen (relational data model already defined)

---

## Styling Architecture

### Decision: Pure CSS + CSS Modules (Hybrid Approach)

**Strategy:** Keep existing CSS files + convert scoped styles to CSS Modules

**Rationale:**
1. **Proven styles:** 94KB of production-ready CSS from original
2. **Zero modification needed:** Copy CSS files directly
3. **No preprocessors:** No Sass/Less compilation complexity
4. **Next.js native:** CSS Modules supported out of the box

**File Structure:**
```
styles/
├── variables.css      # CSS custom properties (271 lines)
├── animations.css     # 50+ keyframe animations
├── dashboard.css      # Dashboard page styling
├── mirror.css         # Reflection UI styling
├── portal.css         # Landing page styling
└── auth.css           # Authentication styling
```

**Import Strategy:**

**Global Styles (app/layout.tsx):**
```tsx
import '@/styles/variables.css';  // First: CSS variables
import '@/styles/animations.css'; // Second: Animations
```

**Page-Level Styles:**
```tsx
// app/dashboard/page.tsx
import '@/styles/dashboard.css';

// app/reflection/page.tsx
import '@/styles/mirror.css';

// app/page.tsx (Portal)
import '@/styles/portal.css';
```

**Component-Scoped Styles (CSS Modules):**
```tsx
// components/portal/MirrorShards.tsx
import styles from './MirrorShards.module.css';

<div className={styles.mirror}>
  {/* Component JSX */}
</div>
```

**CSS Variables Usage:**
```css
/* Use variables defined in variables.css */
.card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-3xl);
  transition: var(--transition-elegant);
}
```

**Why NOT Tailwind for Cosmic Theme:**
- Cosmic theme uses complex gradients, glass morphism, and 50+ custom animations
- Tailwind can't replicate exact `backdrop-filter: blur(40px) saturate(130%)`
- Custom CSS already production-ready
- No need to rewrite 94KB of perfect CSS

**Tailwind Usage (Optional, for New Components Only):**
```tsx
// OK for simple layouts
<div className="flex items-center gap-4">

// NOT OK for cosmic theme
<div className="bg-purple-500"> {/* ❌ Wrong color, breaks theme */}
```

**Alternatives Considered:**
- **Tailwind-only:** Not chosen (can't replicate cosmic theme)
- **Styled-components:** Not chosen (runtime overhead, SSR complexity)
- **Emotion:** Not chosen (same issues as styled-components)
- **CSS-in-JS:** Not chosen (pure CSS already works)

---

## Animation System

### Decision: Custom Hooks + Pure CSS Animations

**Core Hooks to Migrate:**

**1. useBreathingEffect (394 lines)**
```typescript
// hooks/useBreathingEffect.ts
const breathing = useBreathingEffect(4000, {
  intensity: 0.02,     // 2% scale change
  opacityChange: 0.1,  // 10% opacity change
  pauseOnHover: true,
});

// Presets available:
// - 'card': 4s, 1.5% scale, pause on hover
// - 'background': 8s, 1% scale, always running
// - 'focus': 3s, 3% scale, pause on hover
```

**2. useStaggerAnimation (275 lines)**
```typescript
// hooks/useStaggerAnimation.ts
const { containerRef, getItemStyles } = useStaggerAnimation(4, {
  delay: 100,        // 100ms between items
  duration: 600,     // 600ms animation
  triggerOnce: true, // Animate once on scroll into view
});
```

**3. useAnimatedCounter**
```typescript
// hooks/useAnimatedCounter.ts
const count = useAnimatedCounter(targetValue, {
  duration: 1000,
  easing: 'easeOutQuart',
});
```

**Rationale:**
1. **Proven in production:** Original uses these hooks successfully
2. **Performance optimized:** IntersectionObserver, cleanup on unmount
3. **Accessibility:** Respects `prefers-reduced-motion`
4. **No library needed:** Custom code, zero dependencies

**CSS Animations (50+ defined in animations.css):**
```css
/* Entrance animations */
@keyframes fadeIn { /* ... */ }
@keyframes slideInUp { /* ... */ }
@keyframes cardEntrance { /* ... */ }

/* Continuous animations */
@keyframes breathe { /* ... */ }
@keyframes pulse { /* ... */ }
@keyframes float { /* ... */ }

/* Cosmic animations */
@keyframes cosmicShift { /* 120s gradient rotation */ }
@keyframes starfieldDrift { /* 300s star movement */ }
@keyframes mirrorShimmer { /* 8s diagonal shine */ }
```

**Usage:**
```tsx
<div className="animate-fade-in animate-delay-200">
  {/* Content fades in after 200ms */}
</div>
```

**Alternatives Considered:**
- **Framer Motion:** Not chosen (custom hooks already work, no need to rewrite)
- **React Spring:** Not chosen (same reason)
- **GSAP:** Not chosen (overkill, adds bundle size)

---

## State Management

### Decision: React Hooks + tRPC Cache (No Global State Library)

**Rationale:**
1. **Server state handled by tRPC:** Automatic caching, refetching, optimistic updates
2. **Local state in components:** `useState`, `useReducer` for UI state
3. **Shared state via hooks:** Custom hooks for complex logic
4. **No prop drilling:** Component composition prevents deep nesting

**Pattern:**
```tsx
// Server state: tRPC handles caching
const { data: reflections } = trpc.reflections.list.useQuery();

// Local UI state: useState
const [isModalOpen, setIsModalOpen] = useState(false);

// Complex form state: Custom hook
const {
  formData,
  handleChange,
  validate,
  submit,
} = useReflectionForm();
```

**Custom Hooks for Business Logic:**
- `useAuth()` - Auth state, signin/signout
- `useDashboard()` - Dashboard data aggregation
- `usePortalState()` - Portal configuration
- `useFormPersistence()` - LocalStorage form backup

**Alternatives Considered:**
- **Redux:** Not chosen (overkill, tRPC handles server state)
- **Zustand:** Not chosen (not needed for this scope)
- **Jotai/Recoil:** Not chosen (same reason)
- **React Context:** Used sparingly (tRPC provider, auth provider)

---

## Form Handling

### Decision: Controlled Components + Custom Validation

**Rationale:**
1. **Simple forms:** Signup (4 fields), Questionnaire (5 fields)
2. **Custom validation logic:** Character limits, tone selection
3. **Real-time feedback:** Character counters update on every keystroke
4. **Form persistence:** LocalStorage backup (prevents data loss on refresh)

**Pattern:**
```tsx
const [formData, setFormData] = useState({
  dream: '',
  plan: '',
  hasDate: false,
  relationship: '',
  sacrifice: '',
});

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Save to localStorage
  localStorage.setItem('reflection-draft', JSON.stringify(formData));
};

const validate = (): boolean => {
  if (formData.dream.length === 0) {
    setError('Please answer the first question');
    return false;
  }
  // ... more validation
  return true;
};
```

**Character Counter Component:**
```tsx
<CharacterCounter
  current={formData.dream.length}
  max={3200}
  warning={2800} // Turn yellow at 2800
/>
```

**Alternatives Considered:**
- **React Hook Form:** Not chosen (simple forms, no need for library)
- **Formik:** Not chosen (same reason)
- **Zod validation:** Not chosen (custom validation sufficient)

---

## Testing Strategy

### Decision: Manual Testing (Visual QA)

**Rationale:**
1. **Time constraint:** 3-4 day iteration, automated testing setup takes time
2. **Visual-heavy app:** Cosmic theme, animations, glass morphism
3. **Low component count:** 34 components manageable for manual QA
4. **Proven original:** Reference implementation exists for comparison

**Testing Approach:**

**1. Visual Regression (Manual):**
- Side-by-side screenshots: Original vs Migrated
- Test at 3 breakpoints: 320px (mobile), 768px (tablet), 1920px (desktop)
- Compare: Colors, spacing, animations, hover states

**2. Functional Testing:**
- Complete user journey: Landing → Signin → Dashboard → Reflection → Output
- Test all navigation links
- Test all forms (validation, error states, success states)
- Test all API calls (loading states, error handling)

**3. Browser Testing:**
- Chrome (primary)
- Safari (macOS and iOS)
- Firefox
- Chrome Android

**4. Accessibility Testing:**
- Lighthouse audit (target: 100 accessibility score)
- Keyboard navigation (tab through all interactive elements)
- Screen reader (VoiceOver on macOS)
- Reduced motion preference (disable animations)

**Test Cases Document:**
```markdown
## Landing Page
- [ ] Cosmic background renders
- [ ] Mirror shards float smoothly
- [ ] "Reflect Me" button navigates to signin
- [ ] Mobile layout stacks correctly

## Dashboard
- [ ] Usage card shows correct data
- [ ] Recent reflections load
- [ ] "Reflect Now" button works
- [ ] Cards animate with stagger effect

## Reflection Creation
- [ ] Character counters update in real-time
- [ ] Form validates correctly
- [ ] Tone selection works
- [ ] Submission navigates to output

## Reflection Output
- [ ] AI reflection displays
- [ ] Copy button works
- [ ] Navigation back to dashboard works
```

**Future Enhancements (Iteration 2+):**
- Playwright E2E tests
- Vitest unit tests for hooks
- Chromatic visual regression (automated)

**Alternatives Considered:**
- **Jest + React Testing Library:** Not chosen (time constraint)
- **Playwright E2E:** Not chosen (defer to Iteration 2)
- **Cypress:** Not chosen (same reason)

---

## Build & Deploy

### Decision: Vercel (Next.js Optimized)

**Already Configured:** ✅ Yes (Iteration 1)

**Build Command:** `npm run build`

**Output:** Next.js static generation + server components

**Deployment Trigger:** Git push to `main` branch (auto-deploy)

**Environment Variables:**
```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=xxx (for AI reflection generation)
```

**Rationale:**
1. **Zero config:** Vercel detects Next.js automatically
2. **Edge optimization:** Automatic edge caching
3. **Preview deployments:** Every PR gets preview URL
4. **Monitoring:** Built-in analytics and error tracking

**Alternatives Considered:**
- **Netlify:** Not chosen (Vercel better for Next.js)
- **AWS Amplify:** Not chosen (more complex setup)
- **Docker + VPS:** Not chosen (managed service preferred)

---

## Development Tools

### Code Quality

**ESLint:** ✅ Already configured
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

**Prettier:** ✅ Already configured
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2
}
```

**TypeScript Compiler:** Strict mode enabled

**Pre-commit Hooks (Optional):**
- Husky + lint-staged (defer if time constrained)

### Development Server

**Command:** `npm run dev`

**Port:** 3002 (configured in package.json)

**Hot Reload:** Next.js Fast Refresh (instant component updates)

---

## Performance Optimizations

### Bundle Size Optimization

**1. Code Splitting (Automatic):**
- Next.js splits each route automatically
- Dynamic imports for heavy components

**2. Image Optimization:**
```tsx
import Image from 'next/image';

<Image
  src="/mirror-shard.png"
  alt="Mirror shard"
  width={300}
  height={300}
  priority // For above-the-fold images
/>
```

**3. Font Optimization:**
```tsx
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
```

### Runtime Optimizations

**1. Reduce Animation Complexity on Mobile:**
```css
@media (max-width: 768px) {
  .starfield { display: none; } /* Remove most expensive animation */
  .cosmic-gradient { animation-duration: 180s; } /* Slow down */
}
```

**2. Respect Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**3. Lazy Load Non-Critical Components:**
```tsx
import dynamic from 'next/dynamic';

const ToneElements = dynamic(() => import('@/components/ToneElements'), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});
```

---

## Browser Compatibility

### Target Browsers

**Primary (Must Work):**
- Chrome/Edge: Latest (Chromium)
- Safari: Latest (macOS, iOS)

**Secondary (Should Work):**
- Firefox: Latest
- Chrome Android: Latest

**Fallbacks:**
```css
/* Backdrop-filter not supported in older browsers */
@supports not (backdrop-filter: blur()) {
  .dashboard-card {
    background: rgba(15, 15, 35, 0.95); /* Opaque fallback */
  }
}
```

---

## Security Considerations

**1. Authentication:**
- Supabase JWT tokens (httpOnly cookies)
- Token refresh handled automatically
- Protected routes via middleware

**2. API Security:**
- tRPC procedures have `protectedProcedure` wrapper
- User ID from session, not client input
- Input validation on server-side

**3. Environment Variables:**
- Never commit `.env` to git
- Use `.env.example` for documentation
- Vercel environment variables for production

**4. XSS Prevention:**
- React escapes all rendered values automatically
- Reflection output: Sanitize AI-generated HTML (if any)

---

## Dependencies Overview

### Core Dependencies (Already Installed)

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "@trpc/client": "^10.x",
    "@trpc/server": "^10.x",
    "@trpc/react-query": "^10.x",
    "@tanstack/react-query": "^4.x",
    "@supabase/supabase-js": "^2.x",
    "typescript": "5.x"
  },
  "devDependencies": {
    "@types/react": "18.x",
    "@types/node": "20.x",
    "eslint": "8.x",
    "eslint-config-next": "14.x"
  }
}
```

### New Dependencies (None Needed!)

**Rationale:** Everything required is already installed from Iteration 1.

---

## Summary

**Tech Stack is LOCKED.** Iteration 1.5 completes the UI migration using the proven foundation from Iteration 1.

**Key Technologies:**
- Next.js 14 (App Router)
- TypeScript 5 (Strict Mode)
- tRPC v10 (Type-Safe APIs)
- React 18 (Hooks)
- Supabase (Database + Auth)
- Pure CSS + CSS Modules (Styling)
- Custom Hooks (Animations)
- Vercel (Deployment)

**No New Dependencies Required.**

**Migration Complexity: MEDIUM** (well-defined patterns, proven foundation)

**Confidence Level: HIGH** (everything already working, just completing UI)
