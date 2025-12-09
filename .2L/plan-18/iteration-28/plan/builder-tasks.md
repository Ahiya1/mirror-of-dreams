# Builder Task Breakdown

## Overview

4 primary builders will work in parallel on independent cleanup tasks. Each task is self-contained with minimal dependencies between builders.

## Builder Assignment Strategy

- Builders work on isolated areas of the codebase
- No file conflicts between builders
- Each builder runs build verification after completion
- Order of integration: Builder 1 -> Builder 4 -> Builder 2 -> Builder 3

---

## Builder-1: Dead Code Removal

### Scope

Remove all legacy code from the Vite/React SPA migration. This includes the entire `/src/` directory, legacy infrastructure files, and legacy public HTML files.

### Complexity Estimate

**MEDIUM**

Large volume of deletions but straightforward execution - all files are confirmed dead.

### Success Criteria

- [ ] `/src/` directory completely deleted (62 files, ~25,400 lines)
- [ ] All 6 infrastructure files deleted
- [ ] All legacy public HTML/JS files deleted (22 files)
- [ ] Empty public subdirectories removed
- [ ] `npm run build` passes after deletion
- [ ] No console errors about missing imports

### Files to Delete

**Entire Directory:**
```
/src/                               # 62 files, ~25,400 lines
```

**Infrastructure Files:**
```
/backend-server.js                  # 32 lines
/dev-proxy.js                       # 321 lines
/vite.config.js                     # 32 lines
/index.html                         # 114 lines
/create-component.js                # ~504 lines
/setup-react.js                     # ~779 lines
```

**Public HTML Files:**
```
/public/auth/signin.html
/public/auth/forgot-password.html
/public/auth/reset-password.html
/public/auth/verify-email.html
/public/dashboard/index.html
/public/portal/index.html
/public/profile/index.html
/public/reflections/history.html
/public/reflections/view.html
/public/mirror/questionnaire.html
/public/mirror/output.html
/public/about/index.html
/public/evolution/reports.html
/public/stewardship/admin.html
/public/transition/breathing.html
/public/creator/index.html
/public/commitment/index.html
/public/commitment/register.html
/public/examples/index.html
```

**Public JS Files:**
```
/public/shared/essence.js
/public/transition/breathing.js
/public/stewardship/admin.js
```

**Empty Directories to Remove (after file deletion):**
```
/public/auth/
/public/dashboard/
/public/portal/
/public/profile/
/public/reflections/
/public/mirror/
/public/about/
/public/evolution/
/public/stewardship/
/public/transition/
/public/creator/
/public/commitment/
/public/examples/
/public/shared/
```

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (independent)

### Implementation Notes

1. Start by deleting the `/src/` directory - this is the largest and safest deletion
2. Delete infrastructure files one by one
3. Delete public HTML files by directory
4. Remove empty directories
5. Run `npm run build` to verify no imports were missed
6. Do NOT delete `/public/landing/`, `/public/favicon*`, `/public/apple-touch-icon.png`, or `/public/site.webmanifest`

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Safe Deletion Checklist" pattern before each major deletion
- Use "Directory Deletion Commands" for bulk operations

### Testing Requirements

- Run `npm run build` after completion
- Verify no TypeScript/import errors

---

## Builder-2: Console.log Cleanup

### Scope

Remove debug console.log statements from all production code files. Keep error logging but remove info/debug logs that expose sensitive data or provide no production value.

### Complexity Estimate

**MEDIUM**

91 statements across multiple files requiring judgment on keep vs. remove.

### Success Criteria

- [ ] All debug `console.log()` removed from production code
- [ ] All `console.error()` for critical errors retained
- [ ] No sensitive data (emails, user info) logged
- [ ] `npm run build` passes
- [ ] Scripts directory logs untouched (appropriate for CLI)

### Files to Modify

**Priority 1 - Server Routers (46 statements):**
```
/server/trpc/routers/reflection.ts      # 13 statements
/server/trpc/routers/subscriptions.ts   # 9 statements
/server/trpc/routers/evolution.ts       # Expected ~10 statements
/server/trpc/routers/visualizations.ts  # Expected ~8 statements
/server/trpc/routers/dreams.ts          # Expected ~6 statements
```

**Priority 2 - API Routes (25 statements):**
```
/app/api/webhooks/paypal/route.ts       # 19 statements
/app/api/cron/consolidate-patterns/route.ts  # 6 statements
```

**Priority 3 - Server Lib (5 statements):**
```
/server/lib/email.ts                    # 5 statements
```

**Priority 4 - App Pages (15 statements):**
```
/app/**/*.tsx files with console statements
```

**Priority 5 - Components (4 statements):**
```
/components/**/*.tsx files with console statements
```

**DO NOT MODIFY:**
```
/scripts/*                              # CLI output is appropriate
```

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (independent)

### Implementation Notes

1. For each file, search for `console.log`, `console.error`, `console.warn`
2. Apply decision framework:
   - **DELETE:** Debug messages, timing logs, success confirmations
   - **DELETE:** Logs containing user email, personal data, API responses
   - **KEEP:** `console.error()` in catch blocks
   - **KEEP:** `console.warn()` for deprecation warnings
3. For PayPal webhook, keep error cases only (payment is critical)
4. Do not introduce a logging library - just remove unnecessary logs

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Remove Debug Logs, Keep Error Logs" pattern
- Use "Remove Emoji Debug Logs" pattern
- Use "Payment/Webhook Logging" pattern for PayPal

### Testing Requirements

- Run `npm run build` after completion
- Manually verify error handling still logs appropriately

---

## Builder-3: TypeScript Any Fixes + Hook Consolidation

### Scope

Fix critical TypeScript `any` types to improve type safety. Consolidate hooks from `/lib/hooks/` to `/hooks/` with barrel export.

### Complexity Estimate

**MEDIUM-HIGH**

Type fixes require careful attention. Hook consolidation requires import updates.

### Success Criteria

- [ ] All `error: any` replaced with `error: unknown` pattern
- [ ] Anthropic SDK types used where applicable
- [ ] `/lib/hooks/` directory deleted
- [ ] `/hooks/index.ts` barrel export created
- [ ] All hook imports updated to new paths
- [ ] `npm run build` passes with no type errors

### Files to Modify

**TypeScript Any Fixes (15 critical):**

Error type fixes:
```
/server/trpc/routers/reflection.ts      # Line 133: error: any
/components/dreams/CreateDreamModal.tsx # Line 64: err: any
/components/dreams/EvolutionModal.tsx   # Line 100: err: any
/app/dreams/[id]/page.tsx               # Lines 89, 98: error: any
/app/dreams/[id]/ritual/page.tsx        # Line 97: err: any
/app/api/webhooks/paypal/route.ts       # Line 125: error: any
```

Anthropic SDK type fixes:
```
/server/trpc/routers/reflection.ts      # Line 106: requestConfig: any
/server/trpc/routers/visualizations.ts  # Lines 174, 202: requestConfig, thinkingBlock
/server/trpc/routers/evolution.ts       # Lines 152, 365: requestConfig
```

Array callback fixes:
```
/app/reflection/MirrorExperience.tsx    # Lines 188, 240, 569: (d: any)
/app/dreams/page.tsx                    # Line 168: (dream: any)
```

**Hook Consolidation:**

Move from `/lib/hooks/`:
```
/lib/hooks/useScrollDirection.ts        -> /hooks/useScrollDirection.ts
/lib/hooks/useIsMobile.ts               -> /hooks/useIsMobile.ts
/lib/hooks/useKeyboardHeight.ts         -> /hooks/useKeyboardHeight.ts
```

Create:
```
/hooks/index.ts                         # New barrel export
```

Delete:
```
/lib/hooks/                             # Entire directory after move
```

Update imports in:
```
# Files importing from @/lib/hooks/ (search codebase for exact list)
```

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (independent)

### Implementation Notes

**For error: any fixes:**
1. Replace `catch (error: any)` with `catch (error: unknown)`
2. Add type guard: `const message = error instanceof Error ? error.message : 'Unknown error';`
3. Use `message` variable instead of `error.message`

**For Anthropic SDK types:**
1. Import: `import Anthropic from '@anthropic-ai/sdk';`
2. Use `Anthropic.MessageCreateParams` for request config
3. For thinking tokens, create interface extension (see patterns.md)

**For hook consolidation:**
1. Copy files (don't move yet)
2. Create `/hooks/index.ts`
3. Update all imports
4. Verify build passes
5. Delete `/lib/hooks/`

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Replace error: any with unknown" pattern
- Use "Anthropic SDK Type Fixes" pattern
- Use "Extended Thinking Token Access" pattern
- Use "Hook Consolidation Pattern"

### Testing Requirements

- Run `npx tsc --noEmit` frequently during type fixes
- Run `npm run build` after completion
- Verify no TypeScript errors

---

## Builder-4: npm Audit Fix + Export Cleanup + Glass Index Update

### Scope

Run safe npm audit fixes, clean up package.json legacy scripts/dependencies, update glass component barrel export, and clean up orphaned glass components.

### Complexity Estimate

**LOW**

Straightforward commands and file edits with minimal risk.

### Success Criteria

- [ ] `npm audit fix` run (safe fixes only)
- [ ] npm audit shows reduced vulnerabilities (glob, jws, mdast-util-to-hast fixed)
- [ ] Legacy scripts removed from package.json
- [ ] Legacy devDependencies uninstalled
- [ ] Glass index.ts updated (FloatingNav, DreamCard exports removed)
- [ ] Orphaned glass component files deleted
- [ ] `/app/design-system/page.tsx` updated to remove orphaned component imports
- [ ] `npm run build` passes

### Files to Modify

**Package.json:**
```
/package.json
- Remove scripts: dev:old, dev:react, dev:backend
- After uninstall, verify dependencies removed
```

**Glass Components:**
```
/components/ui/glass/index.ts           # Remove FloatingNav, DreamCard exports
/components/ui/glass/FloatingNav.tsx    # DELETE file
/components/ui/glass/DreamCard.tsx      # DELETE file
/app/design-system/page.tsx             # Update to remove imports
```

### Dependencies

**Depends on:** Builder 1 should complete first (to remove vite.config.js before uninstalling vite)
**Blocks:** Nothing

### Implementation Notes

**npm audit fix:**
```bash
npm audit fix
# DO NOT use --force (breaking changes)
```

**Package.json cleanup:**
```bash
# After Builder 1 deletes infrastructure files:
npm uninstall @vitejs/plugin-react express http-proxy-middleware vite
```

Then manually edit package.json to remove legacy scripts.

**Glass cleanup:**
1. Update `/components/ui/glass/index.ts` to remove exports
2. Delete `/components/ui/glass/FloatingNav.tsx`
3. Delete `/components/ui/glass/DreamCard.tsx`
4. Update `/app/design-system/page.tsx` to:
   - Remove imports for FloatingNav and DreamCard
   - Remove JSX usage of these components

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Glass Index.ts Update Pattern"
- Use "Package.json Cleanup Pattern"

### Testing Requirements

- Run `npm audit` to verify reduced vulnerabilities
- Run `npm run build` after all changes
- Verify design-system page still loads (minus removed components)

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)
- **Builder-1:** Dead Code Removal
- **Builder-2:** Console.log Cleanup
- **Builder-3:** TypeScript Any Fixes + Hook Consolidation

### Parallel Group 2 (After Builder-1)
- **Builder-4:** npm Audit Fix + Export Cleanup + Glass Index Update
  - Wait for Builder-1 to delete vite.config.js before uninstalling vite

### Integration Notes

**No conflict areas** - each builder works on independent code:
- Builder 1: Deletes legacy code (not touched by others)
- Builder 2: Modifies console statements in production code
- Builder 3: Modifies types and hook structure
- Builder 4: Modifies package.json and glass exports

**Final verification after all builders:**
1. `npm install` (ensure lock file is consistent)
2. `npm run build`
3. Smoke test key routes

---

## Summary Statistics

| Builder | Files Modified | Lines Changed | Estimated Time |
|---------|----------------|---------------|----------------|
| Builder-1 | 90+ deleted | ~30,000 deleted | 30 min |
| Builder-2 | 10-15 files | ~91 lines removed | 45 min |
| Builder-3 | 15-20 files | ~100 lines changed | 60 min |
| Builder-4 | 4-5 files | ~30 lines changed | 20 min |

**Total parallel time: ~60 minutes** (limited by Builder-3)
