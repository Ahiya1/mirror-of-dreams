# Vision: Mirror of Dreams Technical Hardening

## Overview

Transform Mirror of Dreams from a 7.2/10 "good with notable gaps" codebase to a production-hardened 9+/10 system ready for scale. This plan addresses critical technical debt identified in comprehensive code review, with priority focus on testing, security, error handling, and DevOps.

## Current State Assessment

| Category        | Current | Target | Priority |
|-----------------|---------|--------|----------|
| Architecture    | 8/10    | 8.5/10 | Low      |
| Type Safety     | 8.5/10  | 9/10   | Low      |
| Code Quality    | 7/10    | 8.5/10 | Medium   |
| Testing         | 2/10    | 8/10   | CRITICAL |
| Security        | 6.5/10  | 9/10   | HIGH     |
| Error Handling  | 6/10    | 8.5/10 | HIGH     |
| Performance     | 7/10    | 8/10   | Medium   |
| Maintainability | 7.5/10  | 8.5/10 | Medium   |
| Scalability     | 6.5/10  | 8/10   | Medium   |
| DevOps          | 5/10    | 8.5/10 | HIGH     |

## Critical Priority 1: Testing Suite (2/10 → 8/10)

The complete absence of tests is the biggest technical debt. Must establish:

### Unit Tests
- Business logic in `/lib/` (tier calculations, usage tracking, dream processing)
- Utility functions and helpers
- Zod schema validation
- Custom hooks

### Integration Tests
- All tRPC routers (auth, dreams, reflections, subscriptions, admin)
- Database operations with test fixtures
- AI service integration mocks

### E2E Tests
- Critical user flows: registration, login, dream creation, reflection viewing
- Payment flows (subscription upgrade/downgrade)
- Admin dashboard functionality

### Testing Infrastructure
- Jest configuration with TypeScript
- React Testing Library for components
- Playwright or Cypress for E2E
- Test database setup/teardown
- CI integration for test runs

## Critical Priority 2: Security Hardening (6.5/10 → 9/10)

### JWT Migration to httpOnly Cookies
- Move JWT storage from localStorage to httpOnly cookies
- Implement proper cookie security flags (Secure, SameSite)
- Update auth flow for cookie-based authentication
- Handle token refresh via cookies

### Rate Limiting Enforcement
- Activate existing rate limit configuration
- Add rate limiting middleware to all API routes
- Implement per-user and per-IP limits
- Add rate limit headers to responses

### CSRF Protection
- Implement CSRF tokens for state-changing operations
- Add CSRF middleware to tRPC context

### Admin Security
- Replace env var admin key with proper RBAC
- Add admin role to user schema
- Implement admin-only middleware

## Critical Priority 3: Error Handling & Monitoring (6/10 → 8.5/10)

### Error Monitoring
- Integrate Sentry for error tracking
- Add source maps for production debugging
- Configure error grouping and alerts
- Add performance monitoring

### Consistent Error Boundaries
- Create global error boundary component
- Add route-level error boundaries
- Implement graceful degradation for AI failures

### Retry Logic
- Add retry mechanism for AI API calls
- Implement exponential backoff
- Add circuit breaker pattern for external services

### Centralized Logging
- Structured logging format
- Log levels (debug, info, warn, error)
- Request ID tracking

## Critical Priority 4: CI/CD Pipeline (5/10 → 8.5/10)

### GitHub Actions Workflow
- Automated testing on PR
- TypeScript compilation check
- Lint and format verification
- Build verification
- Database migration checks

### Staging Environment
- Vercel preview deployments
- Separate staging database
- Environment-specific configuration

### Deployment Pipeline
- Automated deployment on merge to main
- Rollback capability
- Health checks post-deployment

## Medium Priority: Code Quality (7/10 → 8.5/10)

### ESLint Configuration
- Custom rules for project patterns
- Stricter TypeScript rules
- Import ordering
- No unused variables

### Prettier Configuration
- Consistent code formatting
- Pre-commit hooks with Husky
- Format on save configuration

### Error Handling Consistency
- Standardize error handling across routers
- Create error utility functions
- Document error patterns

## Medium Priority: Performance (7/10 → 8/10)

### Code Splitting
- Route-based code splitting
- Dynamic imports for heavy components
- Lazy loading for non-critical features

### Bundle Optimization
- Analyze bundle with webpack-bundle-analyzer
- Tree-shake Framer Motion
- Optimize image loading

### Database Optimization
- Add strategic indexes
- Review N+1 query patterns
- Implement query batching

## Medium Priority: Scalability (6.5/10 → 8/10)

### Database Indexing
- Index frequently queried columns
- Add composite indexes for complex queries
- Document indexing strategy

### Queue System for AI
- Implement job queue for AI calls
- Add retry and dead letter queues
- Rate limit AI requests

## Success Criteria

1. Test coverage > 70% for business logic
2. All tRPC routers have integration tests
3. E2E tests for 5 critical user flows
4. JWT moved to httpOnly cookies
5. Rate limiting active on all endpoints
6. Sentry integrated with error alerts
7. CI/CD pipeline running on all PRs
8. Build time < 3 minutes
9. No console errors in production
10. Lighthouse performance score > 90

## Implementation Approach

This is a large-scale infrastructure improvement requiring multiple focused iterations:

1. **Foundation**: Testing infrastructure, Jest/Vitest setup, first unit tests
2. **Security**: JWT cookie migration, CSRF, rate limiting activation
3. **Quality**: CI/CD pipeline, ESLint/Prettier, error monitoring (Sentry)
4. **Testing Expansion**: Integration tests, E2E tests, coverage targets
5. **Performance & Scale**: Database optimization, code splitting, queues

---

*Auto-generated from code review findings*
*Plan ID: plan-19*
*Created: 2024-12-10*
