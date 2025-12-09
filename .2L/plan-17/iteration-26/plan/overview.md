# 2L Iteration Plan - Clarify Core Fixes & Streaming

## Project Vision

Transform the Clarify Agent from a broken feature into a fully functional, real-time chat experience. This iteration fixes critical bugs preventing dream creation and adds modern streaming responses for a polished UX.

**Iteration:** 26 (Plan 17, Iteration 1)
**Focus:** Core Fixes & Streaming Implementation

---

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] Tier limit display shows correct values (pro=5, unlimited=infinity, not 0/0)
- [ ] When Claude uses createDream tool, dream appears in Dreams tab within 2 seconds
- [ ] AI responses stream token-by-token with first token appearing within 500ms
- [ ] Toast notification appears when dream is created with "View Dream" action button
- [ ] Typing indicator shows "Mirror is reflecting..." during streaming
- [ ] Tool use works mid-stream (dream created, then streaming continues with confirmation)

---

## MVP Scope

**In Scope:**

1. Fix tier name mismatch in `/server/trpc/routers/dreams.ts`
2. Implement createDream tool with Claude API tool_use
3. Create SSE streaming endpoint `/app/api/clarify/stream/route.ts`
4. Update Clarify chat UI for streaming display
5. Enhance Toast component with action button support
6. Add dream creation toast notification with "View Dream" link

**Out of Scope (Post-MVP / Iteration 27):**

- Clarify step in onboarding flow
- Re-enter onboarding button in profile
- Demo user Clarify conversation seeding
- Streaming preference toggle in settings
- Session title auto-generation

---

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - ~8 hours (3 parallel builders)
4. **Integration** - ~30 minutes
5. **Validation** - ~30 minutes
6. **Deployment** - Final

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Exploration | Complete | 2 explorers analyzed codebase |
| Planning | Complete | This document |
| Building | 6-8 hours | 3 builders working in parallel |
| Integration | 30 min | Merge builder outputs, resolve conflicts |
| Validation | 30 min | End-to-end testing |
| **Total** | **~9 hours** | |

---

## Risk Assessment

### High Risks

**Streaming + Tool Use Interaction**
- Risk: When Claude returns tool_use mid-stream, handling complexity increases significantly
- Mitigation: Buffer text content, execute tool after text block completes, send tool_use_result event separately
- Fallback: Keep non-streaming sendMessage mutation as fallback if streaming fails

### Medium Risks

**SSE Connection Drops**
- Risk: User loses connection mid-response, message not saved
- Mitigation: Save message only after stream completes; implement retry with non-streaming fallback
- Acceptance: MVP does not require automatic reconnection

**EventSource vs Fetch API**
- Risk: EventSource only supports GET; we need POST for message content
- Mitigation: Use Fetch API with ReadableStream response instead of EventSource
- Decision: POST endpoint with streaming response

### Low Risks

**Backwards Compatibility with Legacy Tiers**
- Risk: Users with `essential` or `premium` in database may break
- Mitigation: Admin router already handles tier mapping; fix in dreams.ts handles new lookups
- Note: Legacy data exists but admin provides compatibility layer

---

## Integration Strategy

### Builder Dependencies

```
Builder-1 (Backend) -----> Tier fix: independent
                    -----> createDream tool: independent (sets up infrastructure)

Builder-2 (Streaming) ---> Depends on Builder-1's tool definition pattern
                    -----> Uses same executeCreateDreamTool helper

Builder-3 (Frontend) ----> Depends on Builder-2's SSE event format
                    -----> Depends on Toast enhancement (can be done first)
```

### Merge Order

1. Builder-1 commits first (tier fix + tool infrastructure)
2. Builder-2 commits second (streaming endpoint uses tool infrastructure)
3. Builder-3 commits last (frontend consumes streaming endpoint)

### Shared Files

| File | Builders | Coordination |
|------|----------|--------------|
| `/server/trpc/routers/clarify.ts` | Builder-1, Builder-2 | Builder-1 adds tool, Builder-2 references but uses new file |
| `/types/clarify.ts` | Potentially Builder-2 | May add streaming event types |
| `/contexts/ToastContext.tsx` | Builder-3 only | No conflict |

### Conflict Prevention

- Builder-2 creates new file `/app/api/clarify/stream/route.ts` (no conflict)
- Builder-1 modifies `/server/trpc/routers/clarify.ts` (adds tools param + handling)
- Builder-3 modifies `/app/clarify/[sessionId]/page.tsx` (adds streaming state)
- Toast files modified only by Builder-3

---

## Deployment Plan

1. **Database:** No migrations needed - tool_use and dream_id columns already exist
2. **Environment:** No new environment variables required
3. **Build:** Standard Next.js build
4. **Rollback:** Keep non-streaming sendMessage mutation functional as fallback

### Feature Flags (Optional)

Consider adding a simple streaming toggle:
- `ENABLE_CLARIFY_STREAMING=true` in .env
- Frontend checks flag and uses streaming or fallback accordingly
- Not required for MVP but helps with gradual rollout

---

## Verification Checklist

After all builders complete:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Manual test: Send message in Clarify, see streaming response
- [ ] Manual test: Trigger dream creation, see toast with "View Dream" link
- [ ] Manual test: Click "View Dream", navigate to correct dream
- [ ] Manual test: Verify dream appears in Dreams tab
- [ ] Manual test: Check unlimited tier user sees correct dream limits

---

## Next Steps

1. Review tech-stack.md for technology decisions
2. Review patterns.md for code patterns (critical for builders)
3. Review builder-tasks.md for detailed task assignments
4. Begin building phase with 3 parallel builders
