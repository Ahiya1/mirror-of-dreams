# Project Vision: Clarify Agent Enhancement & Bug Fixes

**Created:** 2025-12-09T15:45:00Z
**Plan:** plan-17

---

## Problem Statement

The Clarify Agent, a core feature of Mirror of Dreams, has critical bugs and missing functionality that degrade the user experience:

1. **createDream tool is broken** - The AI claims to create dreams but nothing actually happens (tool not wired to Claude API)
2. **Tier limit bug** - Users see "0/0 Dreams" due to tier name mismatch between code modules
3. **No feedback on dream creation** - When dreams are created from Clarify, users get no visual confirmation
4. **No streaming** - AI responses load all at once, feeling sluggish compared to modern chat experiences
5. **Clarify not explained in onboarding** - New users don't know about this paid feature
6. **Can't re-enter onboarding** - Users who skipped can't revisit it
7. **Demo user has no Clarify conversations** - Demo showcasing is incomplete

**Current pain points:**
- Users are confused when the AI says "I've created this dream" but nothing appears in Dreams tab
- The 0/0 dreams display makes the app look broken for unlimited tier users
- Waiting for full AI responses feels dated
- Paid feature (Clarify) is hidden from new users during onboarding

---

## Target Users

**Primary user:** Existing Mirror of Dreams users
- Users on paid tiers who use Clarify for dream exploration
- New users going through onboarding
- Demo users showcasing the product

**Secondary users:**
- Administrators demoing the product to potential users

---

## Core Value Proposition

Transform the Clarify Agent from a buggy, incomplete feature into a polished, responsive, and properly integrated conversation experience.

**Key benefits:**
1. Dreams created in Clarify actually appear in the Dreams tab
2. Real-time streaming responses for modern chat UX
3. Clear feedback when the AI takes actions
4. Better feature discovery through improved onboarding

---

## Feature Breakdown

### Must-Have (MVP)

1. **Fix Tier Name Mismatch (Bug Fix)**
   - Description: Align tier names between `dreams.ts` TIER_LIMITS and the rest of the codebase
   - User story: As an unlimited tier user, I want to see my correct dream limits so I know how many dreams I can create
   - Acceptance criteria:
     - [ ] `dreams.ts` TIER_LIMITS uses `free`, `pro`, `unlimited` (not `essential`, `optimal`, `premium`)
     - [ ] Users on `unlimited` tier see "X / ∞" not "0 / 0"
     - [ ] All tier-based limit checks work correctly

2. **Implement createDream Tool Properly**
   - Description: Wire up the createDream tool to Claude's tool_use API so dreams are actually created
   - User story: As a user exploring in Clarify, when the AI offers to create a dream and I agree, I want the dream to actually appear in my Dreams list
   - Acceptance criteria:
     - [ ] Claude API call includes `tools` parameter with createDream tool definition
     - [ ] When Claude returns tool_use block, execute dream creation via dreams router
     - [ ] Store tool_use result in clarify_messages.tool_use column
     - [ ] Link clarify_session to created dream via dream_id foreign key
     - [ ] Return confirmation to Claude so it can acknowledge the creation

3. **Dream Creation Banner/Toast**
   - Description: Show visual feedback when a dream is created from Clarify
   - User story: As a user, when the AI creates a dream for me, I want clear confirmation with a link to view it
   - Acceptance criteria:
     - [ ] Toast notification appears: "Dream created: [title]"
     - [ ] Toast includes "View Dream" link that navigates to the dream
     - [ ] Toast auto-dismisses after 5 seconds or on click
     - [ ] Toast styling matches cosmic glass design system

4. **Streaming AI Responses**
   - Description: Stream Claude responses token-by-token using Server-Sent Events
   - User story: As a user chatting with the Clarify Agent, I want to see the response appear in real-time so the conversation feels natural
   - Acceptance criteria:
     - [ ] New streaming endpoint using SSE (Server-Sent Events)
     - [ ] Frontend displays tokens as they arrive
     - [ ] Typing indicator while streaming
     - [ ] Graceful handling of stream interruption/errors
     - [ ] Tool use still works with streaming (handle tool_use blocks)
     - [ ] Final message saved to database after stream completes

5. **Add Clarify to Onboarding**
   - Description: Add a 4th step to onboarding explaining the Clarify Agent
   - User story: As a new user, I want to learn about Clarify during onboarding so I know what's available when I upgrade
   - Acceptance criteria:
     - [ ] New step 4 (or insert as step 2) explaining Clarify
     - [ ] Explains it as "exploration space before commitment"
     - [ ] Mentions it's a paid feature (Pro/Unlimited)
     - [ ] Visual emoji: 💬 or 🔮
     - [ ] Progress orbs updated for 4 steps

6. **Re-enter Onboarding Button**
   - Description: Add ability to restart onboarding from profile/settings
   - User story: As a user who skipped onboarding, I want to be able to go through it again to learn about features
   - Acceptance criteria:
     - [ ] "View Onboarding" or "Restart Tutorial" button in profile page
     - [ ] Clicking navigates to /onboarding
     - [ ] Onboarding works even if already completed (doesn't block)
     - [ ] Completion updates timestamp but doesn't break anything

7. **Demo User Clarify Conversations**
   - Description: Seed the demo user with example Clarify sessions
   - User story: As someone viewing the demo, I want to see example Clarify conversations to understand how the feature works
   - Acceptance criteria:
     - [ ] 2-3 pre-seeded Clarify sessions for demo user
     - [ ] Session 1: Exploration that doesn't lead to a dream (showing that's okay)
     - [ ] Session 2: Exploration that crystallizes into a dream (with tool_use showing dream creation)
     - [ ] Sessions have realistic timestamps and message counts
     - [ ] Migration script to insert demo data

---

### Should-Have (Post-MVP)

1. **Clarify Card on Dashboard for Free Users (Teaser)**
   - Show a locked/teaser version of ClarifyCard to free users
   - Encourage upgrade with "Unlock Clarify - Explore before you commit"

2. **Session Title Auto-Generation**
   - Use Claude to generate meaningful session titles based on conversation content
   - Currently all sessions start as "New Clarify Session"

3. **Typing Indicator Enhancement**
   - Show "Mirror is reflecting..." with subtle animation while AI is generating

---

### Could-Have (Future)

1. **Voice Input for Clarify**
   - Allow users to speak their thoughts instead of typing

2. **Session Summarization**
   - Auto-generate a summary when archiving a session

3. **Pattern Visualization in Clarify**
   - Show extracted patterns visually within the chat interface

---

## User Flows

### Flow 1: Dream Creation from Clarify (Fixed)

**Steps:**
1. User opens Clarify and starts exploring a thought
2. User types messages, AI responds with streaming text
3. Something crystallizes - AI asks "Would you like me to create this as a dream?"
4. User confirms: "Yes, please create it"
5. AI uses createDream tool (visible in response)
6. Toast appears: "Dream created: [title]" with "View Dream" link
7. AI confirms: "I've created '[title]' as a dream for you to track"
8. User can continue chatting or click to view the dream

**Edge cases:**
- User declines dream creation: AI gracefully continues conversation
- Dream creation fails (limit reached): AI explains the limitation, suggests upgrading
- Network error during creation: Show error toast, allow retry

**Error handling:**
- Tool execution failure: Display error toast, AI acknowledges the issue
- Streaming interruption: Show "Connection lost" message, offer retry

### Flow 2: New User Onboarding with Clarify

**Steps:**
1. User signs up and lands on /onboarding
2. Step 1: Welcome to Mirror of Dreams
3. Step 2: How Reflections Work
4. Step 3: About Clarify (NEW)
5. Step 4: Your Free Tier
6. User clicks "Continue to Dashboard"
7. User arrives at dashboard, sees ClarifyCard if paid tier

### Flow 3: Re-entering Onboarding

**Steps:**
1. User navigates to Profile page
2. User clicks "View Tutorial" button
3. User is taken to /onboarding
4. User can go through all steps again
5. Completing updates onboarding_completed_at timestamp

---

## Data Model Overview

**Key entities affected:**

1. **clarify_messages** (existing)
   - Fields: id, session_id, role, content, token_count, tool_use
   - Change: tool_use column will now actually be populated with createDream results

2. **clarify_sessions** (existing)
   - Fields: id, user_id, title, status, dream_id, message_count, last_message_at
   - Change: dream_id will be populated when dream is created from session

3. **dreams** (existing)
   - No schema changes needed
   - New dreams will be created via the tool

4. **Demo data** (new seed data)
   - Insert demo clarify_sessions
   - Insert demo clarify_messages with realistic conversations

---

## Technical Requirements

**Must support:**
- Claude API tool_use with createDream tool definition
- Server-Sent Events (SSE) for streaming responses
- Toast notification system (may already exist via glass components)
- Database transactions for dream creation + message update atomicity

**Constraints:**
- Must work with existing tRPC architecture
- Streaming endpoint may need to be a raw Next.js API route (tRPC doesn't natively support SSE)
- Tool execution must happen server-side, not client-side

**Preferences:**
- Use existing CosmicLoader/animation components for typing indicator
- Follow existing code patterns in clarify.ts router
- Keep streaming implementation simple (no complex reconnection logic for MVP)

---

## Success Criteria

**The MVP is successful when:**

1. **Dreams are actually created from Clarify**
   - Metric: Dream appears in Dreams tab after AI creates it
   - Target: 100% success rate when AI uses createDream tool

2. **No more 0/0 display bug**
   - Metric: Unlimited tier users see correct limit display
   - Target: All tiers show correct X / Y or X / ∞ format

3. **Streaming feels responsive**
   - Metric: First token appears within 500ms of sending message
   - Target: Perceived latency < 1 second

4. **Users learn about Clarify**
   - Metric: Clarify step appears in onboarding
   - Target: 100% of new users see Clarify explanation

5. **Demo showcases Clarify**
   - Metric: Demo user has seeded conversations
   - Target: 2+ realistic sessions visible in demo

---

## Out of Scope

**Explicitly not included in MVP:**
- Voice input
- Session summarization
- Multi-turn tool use (only createDream for now)
- Pattern visualization in chat
- Session sharing or export
- Message editing or deletion

**Why:** Focus on fixing core bugs and adding streaming first. Additional features can come in future iterations once the foundation is solid.

---

## Assumptions

1. Toast notification component exists or can be quickly added (check glass components)
2. SSE streaming can work alongside tRPC (may need separate endpoint)
3. Claude API tool_use is reliable and well-documented
4. Demo user ID is stable and won't change
5. Onboarding page can handle being visited multiple times without issues

---

## Open Questions

1. Should streaming use a separate API route or can we extend tRPC?
2. Is there an existing toast/notification component in the design system?
3. What's the demo user's exact ID in the database for seeding data?
4. Should the Clarify onboarding step mention pricing or just feature description?

---

## Next Steps

- [ ] Review and refine this vision
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
