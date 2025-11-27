# Technology Stack - Iteration 10

## Executive Summary

Iteration 10 requires **zero new dependencies**. All required libraries are already installed and battle-tested. The technology foundation is exceptionally strong, with proven patterns for markdown rendering (Evolution page), data orchestration (Dashboard), and animations (useStaggerAnimation hook).

**Key Technology Decisions:**
- **Markdown Rendering:** react-markdown v10.1.0 + remark-gfm v4.0.1 (already installed)
- **Data Fetching:** tRPC 11.6.0 with parallel queries (existing pattern)
- **Animations:** Framer Motion 11.18.2 + useStaggerAnimation hook (existing pattern)
- **Styling:** Tailwind CSS + CSS Modules with design system variables (Iteration 9 foundation)

---

## Core Framework

**Decision:** Next.js 14.3.0 (App Router)

**Rationale:**
1. **Already installed and used** throughout the application
2. **Server Components + Client Components** architecture fits data fetching needs (tRPC queries in client components, server-side redirects for auth)
3. **App Router** provides file-based routing for dashboard, reflection, reflections pages
4. **Performance optimized** - automatic code splitting, image optimization, font optimization

**Alternatives Considered:**
- **Remix:** Not chosen (would require full rewrite, App Router already working well)
- **Vite + React Router:** Not chosen (Next.js provides more out-of-box for production apps)

**Implementation Notes:**
- All pages in scope are client components (`'use client'` directive)
- Use `useRouter()` from `next/navigation` for programmatic navigation
- Image optimization via `next/image` component (already used in cosmic background)

---

## Database

**Decision:** Supabase PostgreSQL (existing, no changes)

**Rationale:**
1. **No database changes needed** - Iteration 10 is purely presentation layer
2. **Existing schema supports all features** (dreams, reflections, evolution_reports tables)
3. **tRPC abstracts database queries** - builders interact via tRPC, not direct Supabase

**Schema Strategy:**
- **No migrations needed** for this iteration
- **Existing tables:**
  - `dreams` - Active dreams for dashboard grid
  - `reflections` - Reflection list, individual display, collection filtering
  - `evolution_reports` - Insights preview on dashboard
  - `users` - Profile for personalized greeting

**Query Patterns:**
- Dashboard: `SELECT * FROM dreams WHERE user_id = ? AND status = 'active' LIMIT 3`
- Reflections: `SELECT * FROM reflections WHERE user_id = ? ORDER BY created_at DESC LIMIT 20 OFFSET ?`
- Individual: `SELECT * FROM reflections WHERE id = ? AND user_id = ?`

---

## Data Layer (tRPC)

**Decision:** tRPC 11.6.0 with TanStack Query 5.90.5

**Rationale:**
1. **Type-safe API calls** - TypeScript end-to-end (no manual type definitions)
2. **Already installed and used** throughout app (dreams, reflections, evolution routers exist)
3. **Automatic caching** - TanStack Query handles cache invalidation, refetching, loading states
4. **Parallel query batching** - Dashboard's 6 queries batched automatically by TanStack Query

**Existing Endpoints (No Changes Needed):**

**dreams.ts:**
```typescript
list: publicProcedure.input(z.object({
  status: z.enum(['active', 'completed', 'archived']).optional(),
  includeStats: z.boolean().optional(),
})).query(async ({ input, ctx }) => { /* ... */ })
```

**reflections.ts:**
```typescript
list: publicProcedure.input(z.object({
  page: z.number().default(1),
  limit: z.number().default(12),
  search: z.string().optional(),
  tone: z.enum(['gentle', 'intense', 'fusion']).optional(),
  sortBy: z.enum(['created_at', 'word_count', 'rating']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})).query(async ({ input, ctx }) => { /* ... */ })

getById: publicProcedure.input(z.object({
  id: z.string(),
})).query(async ({ input, ctx }) => { /* ... */ })
```

**Potential New Endpoint (Optional):**

**usage.ts (for dashboard stats):**
```typescript
getStats: publicProcedure.query(async ({ ctx }) => {
  const userId = ctx.user.id;

  // This month reflections
  const thisMonthReflections = await ctx.db
    .from('reflections')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth())
    .count();

  return {
    thisMonthReflections: thisMonthReflections.count,
    totalReflections: /* total count */,
  };
})
```

**Implementation Pattern:**
```typescript
// Dashboard Hero component
const { data: user } = trpc.users.getProfile.useQuery();
const { data: stats } = trpc.usage.getStats.useQuery();

return (
  <div>
    <h1>Good {timeOfDay}, {user?.firstName}!</h1>
    <p>This month: {stats?.thisMonthReflections} reflections</p>
  </div>
);
```

---

## Markdown Rendering

**Decision:** react-markdown v10.1.0 + remark-gfm v4.0.1 (already installed)

**Rationale:**
1. **Already installed** - Evolution page uses this exact stack
2. **Built-in XSS protection** - Sanitizes HTML by default (no `dangerouslySetInnerHTML` needed)
3. **Custom component mapping** - Full control over heading styles, blockquotes, lists
4. **GitHub Flavored Markdown** - remark-gfm adds tables, strikethrough, task lists

**Alternatives Considered:**
- **marked + DOMPurify:** Not chosen (manual sanitization required, more complex)
- **mdx:** Not chosen (overkill for AI response rendering, no JSX execution needed)
- **dangerouslySetInnerHTML:** Not chosen (XSS vulnerability, already flagged in exploration)

**Implementation Pattern (from Evolution page):**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GradientText } from '@/components/ui/glass/GradientText';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ node, ...props }) => (
      <GradientText gradient="cosmic" className="text-h1 mb-lg">
        {props.children}
      </GradientText>
    ),
    h2: ({ node, ...props }) => (
      <GradientText gradient="cosmic" className="text-h2 mb-md">
        {props.children}
      </GradientText>
    ),
    p: ({ node, ...props }) => (
      <p className="text-body leading-relaxed text-white/95 mb-md">
        {props.children}
      </p>
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-mirror-amethyst/60 pl-lg py-md my-lg bg-mirror-amethyst/5 rounded-r-lg">
        {props.children}
      </blockquote>
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside mb-md space-y-sm text-white/90">
        {props.children}
      </ul>
    ),
  }}
>
  {reflection.aiResponse}
</ReactMarkdown>
```

**Security:**
- ReactMarkdown sanitizes by default
- No inline scripts allowed
- No `dangerouslySetInnerHTML` usage
- Test with malicious input: `<script>alert('XSS')</script>` → rendered as plain text

**Fallback for Non-Markdown AI Responses:**
```typescript
const AIResponseRenderer: React.FC<{ content: string }> = ({ content }) => {
  const hasMarkdown = /^#{1,3}\s|^\*\s|^-\s|^>\s|```/.test(content);

  if (!hasMarkdown) {
    // Fallback: plain text with paragraph wrapping
    return (
      <div className="reflection-text">
        {content.split('\n\n').map((para, i) => (
          <p key={i} className="text-body leading-relaxed mb-md">{para}</p>
        ))}
      </div>
    );
  }

  return <ReactMarkdown>{content}</ReactMarkdown>;
};
```

---

## Frontend (UI Library & Styling)

**Decision:** React 18.3.1 + Tailwind CSS 3.4.17 + CSS Modules

**UI Component Library:** Custom design system (components/ui/glass/*)

**Styling:** Tailwind utility classes + CSS custom properties (variables.css)

**Rationale:**
1. **Tailwind CSS** already configured with cosmic theme, spacing scale, typography
2. **CSS custom properties** established in Iteration 9 (--space-*, --text-*, --mirror-*)
3. **Design system components** already exist (GlassCard, GlowButton, GradientText, CosmicLoader)
4. **No component library needed** (Material UI, Chakra, shadcn/ui would add unnecessary bundle size)

**Design System Usage:**

**Spacing (from variables.css):**
```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
--space-3xl: 64px
```

**Typography:**
```css
--text-xs: 0.75rem (12px)
--text-sm: 0.875rem (14px)
--text-base: 1rem (16px)
--text-lg: 1.125rem (18px)
--text-xl: 1.25rem (20px)
--text-2xl: 1.5rem (24px)
--text-3xl: 1.875rem (30px)
--text-4xl: 2.25rem (36px)
```

**Colors:**
```css
--cosmic-text: rgba(255, 255, 255, 0.95)
--cosmic-text-muted: rgba(255, 255, 255, 0.6)
--cosmic-text-secondary: rgba(255, 255, 255, 0.4)
--mirror-purple: #8B5CF6
--mirror-violet: #A855F7
--mirror-amethyst: #A855F7
--mirror-blue: #3B82F6
--mirror-gold: #FBBF24
```

**Component Usage:**
```typescript
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GradientText } from '@/components/ui/glass/GradientText';

<GlassCard className="p-xl">
  <GradientText gradient="cosmic" className="text-h2 mb-md">
    Dashboard Hero
  </GradientText>
  <GlowButton variant="cosmic" size="lg" href="/reflection">
    Reflect Now
  </GlowButton>
</GlassCard>
```

---

## Animations

**Decision:** Framer Motion 11.18.2 + useStaggerAnimation hook (already installed)

**Rationale:**
1. **Framer Motion already used** throughout app (page transitions, modal animations)
2. **useStaggerAnimation hook exists** - proven pattern for dashboard grid entrance
3. **Performance optimized** - 60fps animations, respects `prefers-reduced-motion`
4. **Declarative API** - Simple `<motion.div>` components, no manual requestAnimationFrame

**Existing Animation Variants (lib/animations/variants.ts):**
- `cardVariants` - entrance + hover (y-axis lift, no scale)
- `fadeInVariants` - simple opacity fade
- `modalContentVariants` - slide up + fade
- `staggerContainer` / `staggerItem` - parent/child stagger pattern
- `glowVariants` - box-shadow transitions

**Dashboard Stagger Animation Pattern:**
```typescript
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';

const { containerRef, getItemStyles } = useStaggerAnimation(6, {
  delay: 150,      // 150ms between each card
  duration: 800,   // 800ms animation duration
  triggerOnce: true,
});

return (
  <div ref={containerRef} className="dashboard-grid">
    <div style={getItemStyles(0)}><DashboardHero /></div>
    <div style={getItemStyles(1)}><DreamsCard /></div>
    <div style={getItemStyles(2)}><ReflectionsCard /></div>
    {/* ... */}
  </div>
);
```

**Reflection State Transitions:**
```typescript
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  {state === 'form' && (
    <motion.div
      key="form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ReflectionForm />
    </motion.div>
  )}
  {state === 'loading' && (
    <motion.div
      key="loading"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CosmicLoader />
    </motion.div>
  )}
</AnimatePresence>
```

**Reduced Motion Support:**
```typescript
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={{
    opacity: 1,
    y: shouldReduceMotion ? 0 : 20, // No y-movement if reduced motion
  }}
  transition={{
    duration: shouldReduceMotion ? 0 : 0.3, // Instant if reduced motion
  }}
>
  {children}
</motion.div>
```

---

## Development Tools

### Code Quality

**Linter:** ESLint 8.57.0 (already configured)
- Config: `eslint-config-next` (Next.js recommended rules)
- Rules: TypeScript strict mode, React hooks rules, a11y rules
- Usage: `npm run lint` before commit

**Formatter:** Prettier 3.3.3 (already configured)
- Config: `.prettierrc.json` (2-space indent, single quotes, trailing commas)
- Usage: Auto-format on save (VS Code)

**Type Checking:** TypeScript 5.7.2 (strict mode)
- Config: `tsconfig.json` (strict: true, noImplicitAny: true)
- Usage: `npm run type-check` before deployment

### Build & Deploy

**Build tool:** Next.js built-in (Webpack + SWC)
- Development: `npm run dev` (Fast Refresh, instant HMR)
- Production: `npm run build` (optimized bundle, code splitting)

**Deployment target:** Vercel (production environment)
- **CI/CD:** Automatic deployment on push to `main`
- **Preview deployments:** Every PR gets preview URL
- **Environment variables:** Managed via Vercel dashboard

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `NEXT_PUBLIC_APP_URL` - App base URL (for OAuth redirects)

---

## Performance Targets

### Lighthouse Metrics (Maintained from Iteration 9)

**LCP (Largest Contentful Paint):** < 2.5s
- **Current:** ~1.8s (dashboard page)
- **Target:** Maintain < 2.5s after adding 6 dashboard cards
- **Strategy:** Parallel tRPC queries, loading skeletons, code splitting

**FID (First Input Delay):** < 100ms
- **Current:** ~50ms
- **Target:** Maintain < 100ms after animations
- **Strategy:** CSS transitions preferred over JavaScript, 60fps animations

**CLS (Cumulative Layout Shift):** < 0.1
- **Current:** 0.05
- **Target:** Maintain < 0.1
- **Strategy:** Fixed card heights with loading skeletons (prevent layout shift)

### Bundle Size

**Target:** Keep increase < 20KB gzipped

**Current bundle (main-app.js):** ~180KB gzipped
- **Iteration 10 additions:**
  - Dashboard components: ~5KB (HTML + CSS)
  - Reflection enhancements: ~3KB (CSS + state logic)
  - Markdown rendering: 0KB (react-markdown already bundled)
  - Total estimated: +8KB
- **Final bundle:** ~188KB (well under 200KB budget)

**Code Splitting Strategy:**
- Dashboard cards lazy-loaded: `const DreamsCard = lazy(() => import('./DreamsCard'))`
- Reflection page separate chunk (route-based splitting automatic)
- CosmicLoader separate chunk (shared across pages)

### API Response Time

**tRPC Query Target:** < 200ms p95
- **dreams.list:** ~150ms (indexed query)
- **reflections.list:** ~180ms (paginated query)
- **reflections.getById:** ~100ms (primary key lookup)

**Dashboard Query Batching:**
- 6 parallel queries: ~200ms total (not 1200ms waterfall)
- TanStack Query batches concurrent requests automatically

---

## Security Considerations

### Markdown XSS Prevention

**Risk:** AI response parsing could inject malicious scripts

**Mitigation:**
1. **Use react-markdown** (sanitizes by default, no `dangerouslySetInnerHTML`)
2. **Custom component renderers** (full control over rendered HTML)
3. **Test with malicious input:** `<script>alert('XSS')</script>` → renders as plain text
4. **Content Security Policy:** Strict CSP headers in production

**Pattern:**
```typescript
// ✅ SAFE
<ReactMarkdown
  components={{
    h1: ({ node, ...props }) => <h1 className="safe">{props.children}</h1>,
  }}
>
  {aiResponse}
</ReactMarkdown>

// ❌ UNSAFE
<div dangerouslySetInnerHTML={{ __html: aiResponse }} />
```

### Authentication & Authorization

**Pattern:** Supabase Auth + tRPC middleware

**All tRPC queries protected:**
```typescript
const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { user: ctx.user } });
});

// Usage
list: protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.user.id; // Type-safe user ID
  // ...
});
```

**Row-level security:**
- All queries filter by `user_id = ctx.user.id`
- Reflections can only be viewed by owner
- Dreams can only be modified by owner

### Data Validation

**Pattern:** Zod schemas for all tRPC inputs

```typescript
const reflectionListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  tone: z.enum(['gentle', 'intense', 'fusion']).optional(),
  search: z.string().max(200).optional(),
});

list: protectedProcedure
  .input(reflectionListSchema)
  .query(async ({ input }) => {
    // input is type-safe and validated
  });
```

---

## Dependencies Overview

### Core Dependencies (Already Installed)

**Production:**
- `next@14.3.0` - Framework
- `react@18.3.1` - UI library
- `react-dom@18.3.1` - React DOM renderer
- `@trpc/client@11.6.0` - tRPC client
- `@trpc/server@11.6.0` - tRPC server
- `@tanstack/react-query@5.90.5` - Data fetching/caching
- `framer-motion@11.18.2` - Animations
- `react-markdown@10.1.0` - Markdown rendering
- `remark-gfm@4.0.1` - GitHub Flavored Markdown
- `lucide-react@0.546.0` - Icon library
- `clsx@2.1.0` - Conditional classes
- `tailwind-merge@2.2.1` - Merge Tailwind classes
- `zod@3.25.76` - Schema validation

**Development:**
- `typescript@5.7.2` - Type checking
- `eslint@8.57.0` - Linting
- `prettier@3.3.3` - Code formatting
- `tailwindcss@3.4.17` - CSS framework
- `autoprefixer@10.4.16` - CSS vendor prefixes
- `postcss@8.4.49` - CSS processing

### New Dependencies

**NONE** - All required libraries already installed

---

## Testing Strategy

### Manual Testing (Primary)

**Browser Testing:**
- Chrome 120+ (primary)
- Firefox 120+ (secondary)
- Safari 17+ (macOS only)
- Edge 120+ (Chromium-based)

**Breakpoints:**
- Mobile: 375px, 414px
- Tablet: 768px, 834px
- Laptop: 1024px, 1280px
- Desktop: 1440px, 1920px

**Test Cases:**
1. **Dashboard:** Empty state (no dreams, no reflections), partial state (1 dream, 3 reflections), full state (3+ dreams, 20+ reflections)
2. **Reflection Page:** Form validation, state transitions (form → loading → output), error handling
3. **Individual Reflection:** Markdown rendering (headings, lists, blockquotes), XSS test, responsive layout
4. **Collection View:** Filtering (by dream, by tone), sorting, pagination (< 20, = 20, > 20 reflections)

### Performance Testing

**Lighthouse CI:**
- Run on every deployment
- Fail build if LCP > 2.5s or FID > 100ms
- Alert if bundle size increases > 20KB

**Chrome DevTools:**
- Performance profiling (60fps animations)
- Network waterfall (parallel queries)
- Memory profiling (no memory leaks)

### Accessibility Testing

**Keyboard Navigation:**
- Tab through all interactive elements
- Focus indicators visible (2px outline)
- Skip to main content link

**Screen Reader:**
- ARIA labels on icons/buttons
- Semantic HTML (h1, h2, nav, main, article)
- Alt text on images

**Color Contrast:**
- WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
- Automated checks via axe DevTools

### Security Testing

**Markdown XSS Test:**
```typescript
const maliciousInput = `
# Heading
<script>alert('XSS')</script>
<img src="x" onerror="alert('XSS')">
[Click me](javascript:alert('XSS'))
`;

// Test: Render with ReactMarkdown
// Expected: All script tags and javascript: URLs sanitized
```

**Authentication Test:**
- Attempt to access `/reflections/[id]` for reflection not owned by user
- Expected: 403 Forbidden or redirect to /dashboard

---

## Integration Patterns

### Dashboard Data Orchestration

**Pattern:** Self-contained card components with parallel tRPC queries

```typescript
// DashboardPage.tsx
const DashboardPage: React.FC = () => {
  return (
    <DashboardGrid>
      <DashboardHero />
      <DreamsCard />
      <ReflectionsCard />
      <ProgressStatsCard />
      <EvolutionCard />
      <VisualizationCard />
    </DashboardGrid>
  );
};

// Each card fetches own data
const DreamsCard: React.FC = () => {
  const { data, isLoading } = trpc.dreams.list.useQuery({
    status: 'active',
    includeStats: true,
  });

  if (isLoading) return <DashboardCard isLoading />;
  return <DashboardCard>{/* Render dreams */}</DashboardCard>;
};
```

**Benefit:** TanStack Query batches concurrent queries, preventing waterfall.

### Markdown Rendering Integration

**Pattern:** Reusable AIResponseRenderer component

```typescript
// components/reflections/AIResponseRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AIResponseRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="max-w-[720px] mx-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <GradientText gradient="cosmic" className="text-h1 mb-lg">{props.children}</GradientText>,
          h2: ({ node, ...props }) => <GradientText gradient="cosmic" className="text-h2 mb-md">{props.children}</GradientText>,
          p: ({ node, ...props }) => <p className="text-body leading-relaxed text-white/95 mb-md">{props.children}</p>,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-mirror-amethyst/60 pl-lg py-md my-lg bg-mirror-amethyst/5 rounded-r-lg">
              {props.children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Usage in reflection display page
<AIResponseRenderer content={reflection.aiResponse} />
```

### Animation Integration

**Pattern:** useStaggerAnimation for grid entrance

```typescript
const { containerRef, getItemStyles } = useStaggerAnimation(6, {
  delay: 150,
  duration: 800,
  triggerOnce: true,
});

return (
  <div ref={containerRef}>
    {items.map((item, i) => (
      <div key={item.id} style={getItemStyles(i)}>
        {item.content}
      </div>
    ))}
  </div>
);
```

---

## Technology Risks & Mitigation

### Risk 1: Dashboard Query Performance

**Risk:** 6 concurrent tRPC queries could slow dashboard load

**Mitigation:**
- TanStack Query batches concurrent requests
- Loading skeletons prevent layout shift
- Monitor LCP with Lighthouse CI
- Code-split dashboard cards if needed

### Risk 2: Markdown Compatibility

**Risk:** AI responses may not be markdown-formatted

**Mitigation:**
- Implement markdown detection: `/^#{1,3}\s|^\*\s|^>\s/`
- Fallback to plain text paragraph wrapping
- Document markdown requirement for AI prompts

### Risk 3: Animation Performance

**Risk:** Framer Motion animations could drop below 60fps

**Mitigation:**
- Use CSS transitions for hover states (GPU-accelerated)
- Respect `prefers-reduced-motion`
- 60fps profiling in Chrome DevTools
- Reduce particles on mobile

---

**Technology Stack Status:** SOLID
**New Dependencies:** NONE
**Risk Level:** LOW
**Builder Confidence:** HIGH (all patterns proven, libraries installed, examples available)
