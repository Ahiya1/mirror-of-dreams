# Iteration 33: Performance & Polish - Overview

## Executive Summary

This iteration focuses on performance optimizations identified during exploration: fixing the N+1 query pattern in `dreams.list`, implementing lazy loading for modals, and optimizing React Query cache configuration. These changes will improve dashboard load times and reduce initial bundle size.

## Scope

### In Scope
1. **N+1 Query Fix** - Batch reflection stats queries in `dreams.list`
2. **Lazy Loading** - Dynamic imports for CreateDreamModal, EvolutionModal, UpgradeModal
3. **Cache Configuration** - Add gcTime, optimize staleTime per query type

### Out of Scope
- PayPalCheckoutModal lazy loading (component exists but is not currently imported/used anywhere)
- Dashboard data aggregation endpoint (future optimization)
- WebSocket/real-time updates
- Performance monitoring infrastructure

## Builder Distribution

### Builder 1: N+1 Query Fix + Cache Optimization
- Fix N+1 pattern in `server/trpc/routers/dreams.ts`
- Optimize `TRPCProvider.tsx` cache configuration
- Add query-specific staleTime configurations

### Builder 2: Lazy Loading + Final Cleanup
- Lazy load CreateDreamModal in `app/dreams/page.tsx`
- Lazy load EvolutionModal in `app/dreams/[id]/page.tsx`
- Lazy load UpgradeModal in `app/reflection/MirrorExperience.tsx`
- Add modal loading states (skeleton placeholders)

## Success Criteria

### Performance Metrics
- [ ] Dashboard with 5 dreams loads with 2 queries instead of 11 (N+1 fix)
- [ ] Modal chunk loads only when user opens modal
- [ ] No TypeScript errors
- [ ] All existing tests pass

### Code Quality
- [ ] Cache configuration is documented with reasoning
- [ ] Lazy loading follows Next.js dynamic import patterns
- [ ] N+1 fix handles edge cases (no reflections, deleted dreams)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| N+1 fix returns incorrect stats | Low | High | Compare results before/after |
| Lazy loading delays modal appearance | Low | Medium | Add loading state with skeleton |
| Cache config causes stale data | Medium | Medium | Test subscription tier changes |

## Dependencies

- No external dependencies
- No database migrations required
- No new packages needed

## Timeline

**Estimated effort:** 2-3 hours total
- Builder 1: 1.5-2 hours (N+1 + cache)
- Builder 2: 1-1.5 hours (lazy loading)

Both builders can work in parallel.

## Files to Modify

### Builder 1
- `server/trpc/routers/dreams.ts` - N+1 fix
- `components/providers/TRPCProvider.tsx` - Cache configuration

### Builder 2
- `app/dreams/page.tsx` - CreateDreamModal lazy load
- `app/dreams/[id]/page.tsx` - EvolutionModal lazy load
- `app/reflection/MirrorExperience.tsx` - UpgradeModal lazy load

## Integration Notes

- Builders work on different files (no conflicts expected)
- Both changes are independent - can be merged in any order
- Test N+1 fix first as it affects more critical paths

## Post-Integration Verification

1. Load dashboard with multiple dreams - verify single stats query
2. Open each modal type - verify lazy loading works
3. Test subscription upgrade flow - verify cache invalidation
4. Run TypeScript compiler - verify no errors
