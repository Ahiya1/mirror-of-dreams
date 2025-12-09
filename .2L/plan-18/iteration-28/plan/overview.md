# 2L Iteration Plan - Codebase Purification

## Project Vision

This iteration focuses on codebase purification - removing dead code, cleaning up technical debt, and improving code quality. Mirror of Dreams has accumulated legacy artifacts from its migration from Vite/React SPA to Next.js 14, along with debug logging, TypeScript `any` types, and security vulnerabilities. This cleanup will reduce the codebase by approximately 30,000 lines of dead code and significantly improve maintainability.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] `/src/` directory completely removed (62 files, ~25,400 lines)
- [ ] All 6 legacy infrastructure files deleted (backend-server.js, dev-proxy.js, vite.config.js, index.html, create-component.js, setup-react.js)
- [ ] All 19 public HTML files and 3 supporting JS files removed
- [ ] All 91 production console statements either removed or converted to structured logging
- [ ] At minimum 15 critical TypeScript `any` types fixed
- [ ] npm audit shows no high/moderate vulnerabilities (safe fixes applied)
- [ ] Hooks consolidated to single `/hooks/` directory with barrel export
- [ ] Glass index.ts updated to remove orphaned component exports (FloatingNav, DreamCard)
- [ ] `npm run build` passes without errors
- [ ] Application routes functional after cleanup

## Iteration Scope

**In Scope:**
- Dead code removal (entire /src/ directory)
- Legacy infrastructure file deletion
- Public HTML/JS legacy file removal
- Console.log cleanup in production code
- TypeScript `any` type fixes (critical 15+)
- npm audit fix (safe fixes only)
- Hook consolidation
- Glass barrel export cleanup

**Out of Scope (Future Iterations):**
- Scripts directory console.logs (appropriate for CLI tools)
- Full export pattern standardization across all components
- vite/nodemailer breaking change upgrades
- Additional barrel exports for remaining component directories
- Remaining 33 lower-priority `any` types

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - Estimated 2-3 hours (4 parallel builders)
4. **Integration** - 15 minutes
5. **Validation** - 30 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~2 hours (4 parallel builders)
- Integration: ~15 minutes
- Validation: ~30 minutes
- Total: ~3 hours

## Risk Assessment

### High Risks

**Accidental deletion of active code**
- Mitigation: Explorer 1 verified all deletions thoroughly with import analysis
- Mitigation: Each builder runs `npm run build` after changes
- Mitigation: Git allows easy rollback if issues found

**Console.log removal breaks error visibility**
- Mitigation: Keep `console.error` statements for critical errors
- Mitigation: Only remove debug/info logs, not error handling

### Medium Risks

**TypeScript any fixes cause type mismatches**
- Mitigation: Focus on `error: unknown` pattern which is straightforward
- Mitigation: Use SDK types for Anthropic API calls
- Mitigation: Run TypeScript compiler to verify changes

**npm audit fix introduces regressions**
- Mitigation: Only apply safe fixes (`npm audit fix` without `--force`)
- Mitigation: Build and test after package updates

### Low Risks

**Hook consolidation breaks imports**
- Mitigation: Limited to 4 import updates
- Mitigation: TypeScript will catch any missed imports

## Integration Strategy

Builders work on independent code areas:

1. **Builder 1** (Dead code) deletes entire directories/files - no overlap with others
2. **Builder 2** (Console.log) modifies production source files but different sections than Builder 3
3. **Builder 3** (TypeScript/Hooks) focuses on type fixes and hook directory restructuring
4. **Builder 4** (npm/Exports) handles package.json, glass index.ts, and minor cleanups

Integration will be straightforward as:
- Builder 1's deletions don't affect code other builders modify
- Builders 2, 3, 4 work on different aspects of existing files
- No new features being added, only cleanup

## Deployment Plan

After all builders complete:

1. Run `npm install` (for any package.json changes)
2. Run `npm run build` to verify TypeScript compilation
3. Run `npm run lint` if configured
4. Manual smoke test of key routes:
   - Landing page
   - Dashboard
   - Reflection flow
   - Dreams page
5. Commit and push to main branch
6. Deploy through existing CI/CD pipeline
