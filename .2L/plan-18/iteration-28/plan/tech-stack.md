# Technology Stack

## Overview

This is a cleanup iteration. No new technologies are being introduced. This document serves as reference for the existing stack being cleaned.

## Core Framework

**Current:** Next.js 14 with App Router

The application was migrated from Vite/React SPA to Next.js. This iteration removes the legacy Vite infrastructure.

**Files being removed:**
- `vite.config.js` - Legacy Vite configuration
- `index.html` - Legacy Vite entry point
- `/src/` directory - Entire legacy React SPA codebase

## Database

**Current:** PostgreSQL with Prisma ORM

No changes to database layer in this iteration.

## Authentication

**Current:** Custom auth implementation

No changes to authentication in this iteration.

## API Layer

**Current:** tRPC for type-safe API calls

Console.log cleanup will affect tRPC routers but not change their functionality.

## Frontend

**Current:**
- React 18 (via Next.js)
- Tailwind CSS for styling
- Custom Glass design system in `/components/ui/glass/`

**Cleanup actions:**
- Remove orphaned glass components from barrel export (FloatingNav, DreamCard)
- Consolidate hooks to single directory

## External Integrations

### Anthropic Claude API
- Used for AI reflections and evolution reports
- TypeScript `any` types being replaced with proper SDK types

### PayPal
- Subscription payment processing
- Console.log statements being cleaned up in webhook handler

### Email (Nodemailer)
- Password reset, verification emails
- Vulnerability fix deferred (breaking change)

## Development Tools

### Package Manager
- npm

### Type Checking
- TypeScript (strict mode)
- `any` types being systematically replaced

### Build
- Next.js build (`next build`)

## Dependencies Being Removed

After legacy infrastructure deletion, these devDependencies can be removed:

```json
{
  "@vitejs/plugin-react": "^4.6.0",
  "express": "^4.18.2",
  "http-proxy-middleware": "^2.0.6",
  "vite": "^4.5.14"
}
```

## Package Scripts Being Removed

```json
{
  "dev:old": "node dev-proxy.js",
  "dev:react": "vite",
  "dev:backend": "node backend-server.js"
}
```

## npm Security Vulnerabilities

### Vulnerabilities to Fix This Iteration (Safe Fixes)

| Package | Severity | Fix Command |
|---------|----------|-------------|
| glob | HIGH | `npm audit fix` |
| jws | HIGH | `npm audit fix` |
| mdast-util-to-hast | MODERATE | `npm audit fix` |

### Vulnerabilities Deferred (Breaking Changes)

| Package | Severity | Reason for Deferral |
|---------|----------|-------------------|
| esbuild | MODERATE | Requires vite@7.x upgrade |
| vite | MODERATE | Breaking changes |
| nodemailer | MODERATE | Requires testing |

## Environment Variables

No changes to environment variables in this iteration.

## Performance Considerations

After dead code removal:
- Repository size reduced by ~30,000 lines
- No runtime performance impact (dead code was never loaded)
- Build times may marginally improve due to fewer files to process
