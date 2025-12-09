# Project Vision: Dream Lifecycle Completion & Clarify Agent

**Created:** 2025-12-09
**Plan:** plan-16

---

## Problem Statement

Mirror of Dreams currently assumes users arrive knowing what their dreams are. But the creator himself experiences "dream fog" - a state where aspirations exist but aren't crystallized enough to articulate. This is not a bug; it's a signal that the product is missing a critical layer.

Additionally, dreams in the current system have a flat lifecycle:
- Dreams are created (declared)
- Dreams are reflected upon
- Dreams end via a simple status toggle (achieved/archived/released)

This misses the profound psychological reality of how dreams actually evolve, complete, or release.

**Current pain points:**
- No space for pre-dream exploration ("I don't know my dreams yet")
- Dreams can't evolve in place (change shape while remaining the same dream)
- Achievement is just a toggle, not a celebration
- Release is just a status change, not a ritual of letting go
- No memory continuity in user's journey of becoming

---

## Target Users

**Primary user:** People in transition
- Career changers, life re-evaluators
- Those with many potential paths, struggling to choose
- Creatives with competing visions
- Anyone experiencing "dream fog" - sensing aspirations without being able to name them

**Secondary users:** Committed dreamers
- Users who already know their dreams
- Benefit from evolution tracking and completion ceremonies

---

## Core Value Proposition

Mirror of Dreams becomes a **complete identity companion** - supporting the full journey from fog to clarity to commitment to transformation.

**Key benefits:**
1. Permission to not know yet (Clarify agent)
2. Dreams that evolve without losing continuity
3. Dignified endings (ceremony for achievement and release)
4. Memory that accumulates and informs across time

**Non-promise:** Mirror of Dreams does not promise clarity, success, or resolution. It only promises honesty across time.

---

## Feature Breakdown

### Must-Have (MVP - This Plan)

#### 1. **Clarify Agent**
- Description: A conversational AI agent that helps users sense and articulate what's forming in them, without requiring declaration
- User story: As a user in dream fog, I want a space to explore what's alive in me without pressure to commit, so that I can move toward clarity at my own pace
- **Safety boundary:** Clarify does not replace therapy, diagnosis, or crisis support. If a user expresses crisis-level distress, the agent should gently acknowledge its limits and suggest professional resources.
- Acceptance criteria:
  - [ ] Separate "Clarify" navigation item in app
  - [ ] ChatGPT-style conversation interface
  - [ ] Sessions persist indefinitely (can return to any old session)
  - [ ] Agent has memory of past sessions, reflections, dreams, and patterns
  - [ ] Agent can propose dream creation (function calling) but never pressures
  - [ ] System-managed memory (not agent-initiated tool calls)
  - [ ] Rate limited by tier (Pro: 20 sessions/mo, Unlimited: 30 sessions/mo)
  - [ ] Extended thinking available for Unlimited tier only
  - [ ] Free tier has no access (paid-only feature)

#### 2. **Dream Evolution**
- Description: Allow dreams to transform in place while maintaining identity and history
- User story: As a user whose dream has changed shape, I want to evolve it rather than delete and recreate, so that my journey is preserved
- Acceptance criteria:
  - [ ] "Evolve Dream" action on active dreams
  - [ ] Evolution modal captures: old form, new form, reflection on why
  - [ ] Evolution events stored as history on the dream
  - [ ] Dream ID remains the same (mutation, not replacement)
  - [ ] Evolution history visible in dream detail view
  - [ ] All past reflections remain associated with the dream

#### 3. **Achievement Ceremony**
- Description: Transform dream completion from a toggle into a meaningful recognition of the journey
- User story: As a user who achieved a dream, I want the system to reflect back my journey, so that I feel the weight and meaning of what I accomplished
- Acceptance criteria:
  - [ ] "Mark as Achieved" triggers ceremony flow (not instant toggle)
  - [ ] System auto-generates journey synthesis (first reflection, struggles, breakthroughs, final reflection)
  - [ ] AI generates "who you were" vs "who you became" reflection
  - [ ] User can add closing words (optional)
  - [ ] Ceremony is stored and viewable in dream archive
  - [ ] Achievement ceremony page with beautiful presentation

#### 4. **Release Ritual**
- Description: Transform dream release from deletion into a ritual of gratitude and letting go
- User story: As a user letting go of a dream, I want to honor what it gave me and close the chapter with dignity, so that I can move forward without unresolved attachment
- Acceptance criteria:
  - [ ] "Release Dream" triggers ritual flow (not instant toggle)
  - [ ] Guided prompts: "What did this dream protect you from?", "What did it give you?", "Why is it no longer alive?", "What gratitude do you have?"
  - [ ] User writes closing words
  - [ ] Ritual is stored and viewable in dream archive
  - [ ] Dream becomes sealed (no more reflections possible)
  - [ ] Release ritual page with appropriate solemnity

#### 5. **Memory Layer for Clarify**
- Description: System-managed memory that accumulates patterns and context across Clarify sessions
- User story: As a returning user, I want the Clarify agent to remember what we've discussed and notice patterns over time, so that each conversation builds on the last
- Acceptance criteria:
  - [ ] All Clarify messages stored in database
  - [ ] Background consolidation job extracts patterns (nightly or on-demand)
  - [ ] Patterns table stores recurring themes, tensions, potential dreams
  - [ ] Session opening injects: recent messages, patterns, active dreams, recent reflections
  - [ ] Agent receives fresh context via system prompt (never calls memory tools itself)
  - [ ] Consolidation uses Claude Haiku for cost efficiency

#### 6. **Updated Rate Limits (All Features)**
- Description: Sustainable rate limits across all AI features with 70% margin target
- Acceptance criteria:
  - [ ] Constants updated with new limits
  - [ ] Clarify limits enforced: Pro 20/mo, Unlimited 30/mo
  - [ ] Evolution report limits: Pro 4/mo, Unlimited 8/mo
  - [ ] Visualization limits: Pro 4/mo, Unlimited 8/mo
  - [ ] Existing reflection limits unchanged (Pro 30/mo, Unlimited 60/mo)
  - [ ] Usage tracking extended to cover Clarify sessions

---

### Should-Have (Post-MVP)

1. **Semantic search across reflections** - Find reflections similar to current conversation topic
2. **Real-time pattern detection** - Surface patterns during conversation, not just nightly
3. **Clarify session summaries** - AI-generated summaries of each session for quick review
4. **Dream lineage visualization** - Visual representation of how dreams evolved over time

### Could-Have (Future)

1. **Cross-dream pattern graph** - Knowledge graph of how themes connect across dreams
2. **Clarify voice mode** - Speak instead of type for more natural exploration
3. **Guided clarification exercises** - Structured prompts for specific clarification needs
4. **Export journey** - PDF/document of entire dream journey

---

## User Flows

### Flow 1: Pre-Dream Clarification (Clarify Agent)

**Entry:**
1. User clicks "Clarify" in navigation
2. Sees list of past sessions (if any) + "New Conversation" button

**New Session:**
1. User clicks "New Conversation"
2. System creates session, builds context (patterns, dreams, reflections)
3. Agent greets with context-aware opening
4. Conversation proceeds naturally
5. User can close browser anytime - session persists

**Returning to Session:**
1. User clicks on past session
2. System rebuilds system prompt with CURRENT patterns/context
3. Session history loads
4. Conversation continues with fresh context

**Dream Declaration (Optional):**
1. During conversation, user expresses something crystallizing
2. Agent offers: "This sounds like a dream forming. Would you like to give it a name?"
3. If yes, agent calls `createDream` function
4. Dream created, user can continue conversation or go to Dreams
5. Session records which dream was born from it

**Edge cases:**
- User at session limit: Show upgrade modal, explain limit
- No patterns yet: Agent works without accumulated memory, still valuable

### Flow 2: Dream Evolution

**Steps:**
1. User views active dream
2. Clicks "Evolve Dream"
3. Modal shows current dream title/description
4. User enters new title/description
5. User writes reflection on why it evolved
6. Submits
7. Dream updates in place, evolution event logged

**Edge cases:**
- User cancels mid-flow: Nothing saved
- Very long evolution reflection: Character limit applied

### Flow 3: Achievement Ceremony

**Steps:**
1. User clicks "Mark as Achieved" on active dream
2. System shows "Preparing your journey synthesis..."
3. System fetches first reflection, key moments, final reflection
4. AI generates "who you were" / "who you became" contrast
5. User sees journey synthesis presented beautifully
6. User can add optional closing words
7. User confirms achievement
8. Dream status changes to "achieved", ceremony stored

**Edge cases:**
- Dream has only 1 reflection: Simpler ceremony, no "journey" arc
- AI generation fails: Fallback to manual ceremony (user writes their own synthesis)

### Flow 4: Release Ritual

**Steps:**
1. User clicks "Release Dream" on active dream
2. System presents ritual prompts one by one:
   - "What did this dream protect you from?"
   - "What did it give you, even if you're letting it go?"
   - "Why is it no longer alive in you?"
   - "What gratitude do you have for this chapter?"
3. User answers each (can be brief)
4. User writes optional closing words
5. User confirms release
6. Dream status changes to "released", ritual stored, dream sealed

**Edge cases:**
- User abandons mid-ritual: Progress saved, can resume
- User changes mind: Can cancel before final confirmation

---

## Data Model Overview

### New Entities

#### **clarify_sessions**
- id, user_id, title (auto or user-named)
- created_at, last_message_at
- dream_created_id (if a dream was born from this session)

#### **clarify_messages**
- id, session_id, role (user/assistant), content
- created_at
- consolidated (boolean - has this been processed by consolidation job?)

#### **clarify_patterns**
- id, user_id
- pattern_type (recurring_theme, tension, potential_dream, identity_signal)
- content (text description of pattern)
- strength (1-10, how strong/recurring)
- source_message_ids (array of message IDs this was extracted from)
- first_seen_at, last_seen_at
- created_at, updated_at

#### **evolution_events**
- id, dream_id
- old_title, old_description
- new_title, new_description
- reflection (user's words on why it evolved)
- created_at

#### **achievement_ceremonies**
- id, dream_id
- journey_synthesis (JSON: first_reflection, struggles, breakthroughs, final_reflection)
- who_you_were (AI-generated)
- who_you_became (AI-generated)
- user_closing_words (optional)
- created_at

#### **release_rituals**
- id, dream_id
- what_it_protected_you_from (text)
- what_it_gave_you (text)
- why_no_longer_alive (text)
- gratitude_statement (text)
- closing_words (optional)
- created_at

### Modified Entities

#### **dreams** (additions)
- evolution_count (computed from evolution_events)
- has_ceremony (boolean)
- has_ritual (boolean)
- pre_session_id (if born from Clarify session)

#### **users** (additions)
- clarify_sessions_this_month (int)
- total_clarify_sessions (int)

---

## Technical Requirements

**Must support:**
- Real-time chat interface (streaming responses)
- Background job execution (Supabase Edge Functions or cron)
- System prompt injection with accumulated context
- Function calling for dream creation from Clarify
- Rate limit enforcement for new Clarify feature

**Constraints:**
- Must work within Supabase (no additional services)
- Must maintain 70% margin on AI costs
- Must not break existing reflection/evolution/visualization flows

**Preferences:**
- Use Claude Sonnet 4.5 for Clarify conversations
- Use Claude Haiku 4.5 for consolidation (cost efficiency)
- Streaming responses for better UX
- Mobile-first design for Clarify interface

**Clarify Agent Posture (System Prompt Constraints):**
- The agent must never claim authority over the user's life
- The agent must never diagnose, prescribe, or predict outcomes
- The agent must never pressure toward dream declaration
- The agent holds space, reflects patterns, and offers questions
- The agent is a mirror, not a guide - it reflects, it does not lead
- If patterns are surfaced, they are offered as observations, not truths
- Language must remain invitational: "I notice...", "Does this resonate?", "What if..."

---

## Success Criteria

**The MVP is successful when:**

1. **Clarify Agent works end-to-end**
   - Metric: User can have multi-turn conversation, return to old sessions, and optionally create dreams
   - Target: Full flow functional with memory persistence

2. **Dream lifecycle feels complete**
   - Metric: User feedback on evolution, achievement, release flows
   - Target: Users report feeling "seen" and "honored" in completion ceremonies

3. **Memory provides value**
   - Metric: Agent references past patterns in conversation
   - Target: Returning users notice continuity and pattern recognition

4. **Costs stay within budget**
   - Metric: Average cost per user per month
   - Target: Under $6 for Pro, under $13 for Unlimited

---

## Pricing & Limits (Locked)

### Tier Pricing (Updated in PayPal)
| Tier | Monthly | Yearly |
|------|---------|--------|
| Free | $0 | - |
| Pro | $19 | $190 |
| Unlimited | $39 | $390 |

### Feature Limits
| Feature | Free | Pro | Unlimited |
|---------|------|-----|-----------|
| Reflections | 2/mo | 30/mo | 60/mo |
| Daily Reflections | - | 1/day | 2/day |
| Dreams | 2 | 5 | Unlimited |
| Evolution Reports | - | 4/mo | 8/mo |
| Visualizations | - | 4/mo | 8/mo |
| **Clarify Sessions** | - | **20/mo** | **30/mo** |
| Extended Thinking | - | - | Yes |

### Cost Breakdown (Per User/Month at Limit)
| Feature | Pro Cost | Unlimited Cost |
|---------|----------|----------------|
| Reflections | $0.90 | $3.00 |
| Evolution | $0.32 | $0.80 |
| Visualizations | $0.32 | $0.80 |
| Clarify Sessions | $2.80 | $4.20 |
| Consolidation | $0.20 | $0.30 |
| Infra Buffer | $1.50 | $2.00 |
| **Total** | **~$6.00** | **~$11.00** |
| **Price** | $19 | $39 |
| **Margin** | **68%** | **72%** |

---

## Out of Scope

**Explicitly not included in this plan:**
- Voice input for Clarify
- Cross-dream knowledge graph
- PDF export of journey
- Real-time pattern detection (nightly consolidation only)
- Semantic search across reflections (RAG)

**Why:** These are valuable but not essential for the core lifecycle completion. They can be added after the foundation is solid.

---

## Assumptions

1. Claude Sonnet 4.5 pricing remains stable (~$3/$15 per 1M tokens)
2. Supabase Edge Functions can handle nightly consolidation jobs
3. Users will find value in returning to old Clarify sessions
4. 10 message exchanges is a reasonable average session length
5. Nightly consolidation provides sufficient pattern freshness

---

## Open Questions

1. Should Clarify session titles be auto-generated or user-named?
2. What's the right threshold for pattern detection (how many mentions = pattern)?
3. Should achievement/release ceremonies be skippable or always required?
4. How to handle dreams with no reflections in achievement ceremony?

---

## Philosophical Foundation

**The Dream Lifecycle:**

```
PRE (Signal State)
│   Clarify Agent
│   Non-demanding exploration
│   Patterns accumulate
│
├── [Declaration: "I name this"]
↓
DREAM (Active)
│   Named, planned, reflected upon
│   Evolution possible (same ID, new form)
│
├── [Terminal State]
↓
┌─────────────┬─────────────┬─────────────┐
│  ACHIEVED   │  RELEASED   │  ARCHIVED   │
│  Ceremony:  │  Ritual:    │  Toggle:    │
│  Journey    │  Gratitude  │  Simple     │
│  synthesis  │  & closure  │  pause      │
└─────────────┴─────────────┴─────────────┘
```

**Core Doctrine:**
> "Mirror of Dreams only begins when a Dream is declared, but it allows a person to arrive there slowly, without lying about readiness."

**Clarify Agent Contract:**
- You do not need to know yet
- But once you declare, it matters
- And once you transform, it is remembered

---

## Next Steps

- [ ] Review and refine this vision
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
