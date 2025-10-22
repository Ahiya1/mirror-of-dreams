# Iteration 3: Evolution Reports + Visualizations (AI Features)

## Vision
**"Admin can use all AI-powered features with temporal distribution"**

From master-plan.yaml lines 183-261

---

## Core Features to Implement

### 1. Temporal Context Distribution Algorithm ⭐ CRITICAL

**Purpose:** Select reflections across user's timeline to show growth over time

**Algorithm:**
```typescript
function selectTemporalContext(
  allReflections: Reflection[],
  contextLimit: number
): Reflection[] {
  // 1. Sort reflections by created_at ASC
  const sorted = [...allReflections].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // 2. Divide timeline into 3 equal periods
  const totalCount = sorted.length;
  const earlyEnd = Math.floor(totalCount / 3);
  const middleEnd = Math.floor((totalCount * 2) / 3);

  const earlyPeriod = sorted.slice(0, earlyEnd);
  const middlePeriod = sorted.slice(earlyEnd, middleEnd);
  const recentPeriod = sorted.slice(middleEnd);

  // 3. Calculate reflections needed per period
  const perPeriod = Math.floor(contextLimit / 3);
  const remainder = contextLimit % 3;

  // 4. Select evenly-spaced reflections from each period
  const selectedEarly = selectEvenly(earlyPeriod, perPeriod);
  const selectedMiddle = selectEvenly(middlePeriod, perPeriod);
  const selectedRecent = selectEvenly(recentPeriod, perPeriod + remainder);

  return [...selectedEarly, ...selectedMiddle, ...selectedRecent];
}

function selectEvenly(period: Reflection[], count: number): Reflection[] {
  if (period.length <= count) return period;

  const step = period.length / count;
  const selected: Reflection[] = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(i * step);
    selected.push(period[index]);
  }

  return selected;
}
```

**File:** `server/lib/temporal-distribution.ts`

---

### 2. Dream-Specific Evolution Reports

**Threshold:** Every 4 reflections on a single dream
**Context Limits by Tier:**
- Free: 4 reflections analyzed
- Essential: 6 reflections analyzed
- Optimal: 9 reflections analyzed
- Premium: 12 reflections analyzed

**Extended Thinking:**
- Optimal: `thinking.budget_tokens: 5000`
- Premium: `thinking.budget_tokens: 5000`

**Database:**
```sql
ALTER TABLE evolution_reports ADD COLUMN dream_id UUID REFERENCES dreams(id);
ALTER TABLE evolution_reports ADD COLUMN report_category TEXT CHECK (
  report_category IN ('dream-specific', 'cross-dream')
);
```

**tRPC Procedure:**
```typescript
generateDreamEvolution: protectedProcedure
  .input(z.object({
    dreamId: z.string().uuid(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Get all reflections for this dream
    // 2. Check threshold (>= 4 reflections)
    // 3. Check monthly limit not exceeded
    // 4. Apply temporal distribution based on tier
    // 5. Call Claude with extended thinking if Optimal/Premium
    // 6. Store in evolution_reports
    // 7. Track cost in api_usage_log
  })
```

---

### 3. Cross-Dream Evolution Reports

**Threshold:** Every 12 total reflections across all dreams
**Context Limits by Tier:**
- Free: 0 (not available)
- Essential: 12 reflections analyzed
- Optimal: 21 reflections analyzed
- Premium: 30 reflections analyzed

**Features:**
- Analyzes patterns across multiple dreams
- Shows how different goals interconnect
- Identifies meta-patterns in user's life journey

**tRPC Procedure:**
```typescript
generateCrossDreamEvolution: protectedProcedure
  .mutation(async ({ ctx }) => {
    // 1. Get all reflections across all dreams
    // 2. Check threshold (>= 12 total reflections)
    // 3. Check monthly limit not exceeded
    // 4. Apply temporal distribution based on tier
    // 5. Group by dreams for context
    // 6. Call Claude with extended thinking
    // 7. Store report with dream_id = NULL (cross-dream marker)
  })
```

---

### 4. Visualizations (3 Styles)

**Threshold:** Same as evolution reports
**Styles:**
1. **Achievement Path** - Linear journey visualization
2. **Growth Spiral** - Circular growth pattern
3. **Synthesis Map** - Network of interconnected insights

**tRPC Procedures:**
```typescript
generateVisualization: protectedProcedure
  .input(z.object({
    dreamId: z.string().uuid().optional(), // null = cross-dream
    style: z.enum(['achievement', 'spiral', 'synthesis']),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Get evolution report or generate one
    // 2. Call Claude to create narrative visualization
    // 3. Store in visualizations table
    // 4. Track cost
  })
```

**Database:**
```sql
CREATE TABLE public.visualizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    style TEXT NOT NULL CHECK (style IN ('achievement', 'spiral', 'synthesis')),
    narrative TEXT NOT NULL,
    artifact_url TEXT, -- Future: generated image URL

    reflections_analyzed UUID[] NOT NULL,
    reflection_count INTEGER NOT NULL
);
```

---

### 5. Cost Tracking & API Usage Log

**Already exists but needs updates:**
```sql
CREATE TABLE IF NOT EXISTS public.api_usage_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    operation_type TEXT NOT NULL CHECK (operation_type IN (
        'reflection', 'evolution_dream', 'evolution_cross', 'visualization'
    )),
    model_used TEXT NOT NULL,

    dream_id UUID REFERENCES public.dreams(id),

    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    thinking_tokens INTEGER DEFAULT 0,

    cost_usd DECIMAL(10, 6) NOT NULL,

    metadata JSONB -- Store additional context
);
```

**Pricing (Claude Sonnet 4.5):**
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens
- Thinking (extended): $0.003 per 1K tokens (budget: 5000)

---

### 6. Monthly Usage Tracking

**Update usage_tracking table:**
```sql
ALTER TABLE public.usage_tracking ADD COLUMN evolution_dream_specific INTEGER DEFAULT 0;
ALTER TABLE public.usage_tracking ADD COLUMN evolution_cross_dream INTEGER DEFAULT 0;
ALTER TABLE public.usage_tracking ADD COLUMN visualizations_dream_specific INTEGER DEFAULT 0;
ALTER TABLE public.usage_tracking ADD COLUMN visualizations_cross_dream INTEGER DEFAULT 0;
```

**Monthly Limits by Tier:**
```typescript
const TIER_LIMITS = {
  free: {
    reflections: 4,
    evolution_dream_specific: 1,
    evolution_cross_dream: 0,
    viz_dream_specific: 1,
    viz_cross_dream: 0,
  },
  essential: {
    reflections: 10,
    evolution_dream_specific: 3,
    evolution_cross_dream: 1,
    viz_dream_specific: 3,
    viz_cross_dream: 1,
  },
  optimal: {
    reflections: 30,
    evolution_dream_specific: 6,
    evolution_cross_dream: 3,
    viz_dream_specific: 6,
    viz_cross_dream: 3,
  },
  premium: {
    reflections: 999999,
    evolution_dream_specific: 999999,
    evolution_cross_dream: 999999,
    viz_dream_specific: 999999,
    viz_cross_dream: 999999,
  },
};
```

---

### 7. Admin Dashboard (Basic)

**Features:**
- Total API costs this month
- Cost per operation type
- Total users by tier
- Revenue tracking (future)
- CSV export for accounting

**tRPC Procedure:**
```typescript
admin.getUsageStats: protectedProcedure
  .query(async ({ ctx }) => {
    // Verify is_admin
    // Query api_usage_log for this month
    // Aggregate by operation_type
    // Calculate total costs
    // Return summary
  })
```

---

## Success Criteria (from master-plan.yaml)

- [ ] Admin generates evolution report after 4 reflections on a dream
- [ ] Temporal distribution selects correct reflections (Early/Middle/Recent)
- [ ] Free tier analyzes 4 reflections, Optimal analyzes 9, Premium analyzes 12
- [ ] Extended thinking works for Optimal/Premium tiers
- [ ] Admin generates visualizations in all 3 styles
- [ ] Cross-dream analysis works after 12 total reflections
- [ ] Monthly limits enforced (evolution reports, visualizations)
- [ ] Basic admin dashboard shows cost tracking and usage stats
- [ ] API usage logged with token counts and cost per operation

---

## Implementation Order

### Phase 1: Foundation (2-3 hours)
1. Create temporal distribution service
2. Update evolution_reports table schema
3. Create visualizations table
4. Update api_usage_log table
5. Update usage_tracking table

### Phase 2: Evolution Reports (3-4 hours)
1. Implement dream-specific evolution generation
2. Implement cross-dream evolution generation
3. Add extended thinking support
4. Add cost tracking to all operations

### Phase 3: Visualizations (2-3 hours)
1. Create visualization generation procedures
2. Implement 3 style templates
3. UI components for displaying visualizations

### Phase 4: Admin Dashboard (1-2 hours)
1. Admin stats tRPC procedure
2. Basic admin UI page
3. CSV export functionality

### Phase 5: Testing & Validation (2-3 hours)
1. Test temporal distribution with various scenarios
2. Test tier limits enforcement
3. Test cost tracking accuracy
4. Verify extended thinking works
5. End-to-end testing

---

## Files to Create/Modify

### New Files (~8-10)
- server/lib/temporal-distribution.ts
- server/lib/cost-calculator.ts
- components/evolution/EvolutionReportDisplay.tsx
- components/evolution/VisualizationDisplay.tsx
- app/evolution/[id]/page.tsx
- app/visualizations/[id]/page.tsx
- app/admin/dashboard/page.tsx
- supabase/migrations/20251022210000_add_evolution_visualizations.sql

### Modified Files (~6)
- server/trpc/routers/evolution.ts (major update)
- server/trpc/routers/admin.ts (add stats)
- types/schemas.ts (add evolution/viz schemas)
- components/dashboard/cards/EvolutionCard.tsx (update)
- hooks/useDashboard.ts (add evolution capabilities)

---

## Testing Strategy

### Unit Tests
- Temporal distribution with 4, 9, 12, 21, 30 reflections
- Edge cases: exactly at threshold, 1 reflection, etc.
- Cost calculation accuracy

### Integration Tests
- Full evolution report generation flow
- Monthly limit enforcement
- Extended thinking activation

### Manual QA
- Generate reports for each tier
- Verify context limits respected
- Check cost tracking in admin dashboard
- Test visualization styles

---

## Risk Mitigation

### Risk: Temporal distribution complexity
**Mitigation:** Comprehensive unit tests, visual verification with real data

### Risk: Cost explosion
**Mitigation:** Strict monthly limits, cost alerts in admin dashboard

### Risk: Extended thinking reliability
**Mitigation:** Fallback to standard if thinking fails, log all attempts

### Risk: Monthly usage reset timing
**Mitigation:** Database trigger or cron job, thorough testing

---

**Estimated Total Time:** 10-15 hours
**Priority:** HIGH - Core value proposition of the product
**Dependencies:** Iteration 2 Dreams feature (dreamId in reflections)

---

*Ready for implementation - all specifications complete*
