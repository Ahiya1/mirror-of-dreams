# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
User Experience & Integration Points

## Vision Summary
Transform Mirror of Dreams into a complete identity companion by adding: (1) Clarify Agent for pre-dream exploration via AI chat, (2) Dream Evolution for in-place dream transformation with history, (3) Achievement Ceremony for dignified completion rituals, and (4) Release Ritual for graceful dream closure.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 6 must-have features (Clarify Agent, Dream Evolution, Achievement Ceremony, Release Ritual, Memory Layer, Updated Rate Limits)
- **User stories/acceptance criteria:** 42+ acceptance criteria across all features
- **Estimated total work:** 40-55 hours

### Complexity Rating
**Overall Complexity: COMPLEX**

**Rationale:**
- Multiple new user flows requiring distinct UI/UX patterns (chat interface, multi-step wizards, ceremony pages)
- Real-time streaming chat integration with Claude API (new paradigm for this codebase)
- Session management and persistence across browser sessions
- Navigation system modifications affecting global app architecture
- Mobile-first considerations for all new features

---

## User Flow Analysis

### Flow 1: Clarify Agent - Pre-Dream Exploration

#### Entry Points
1. **New "Clarify" navigation item** - Must be added to both:
   - Desktop: `AppNavigation.tsx` (6 current items + 1 new)
   - Mobile: `BottomNavigation.tsx` (6 current items + 1 new)

#### Session List View (`/clarify`)
**User Journey:**
1. User clicks "Clarify" in navigation
2. System shows list of past sessions (if any) + prominent "New Conversation" CTA
3. Session cards show: title (auto or user-named), last message date, dream_created_id link (if applicable)
4. Filter/sort options: recent first, sessions with dreams

**Integration Points:**
- tRPC router: `clarifyRouter` (new) with `listSessions`, `getSession`, `createSession`, `sendMessage`
- Database: `clarify_sessions`, `clarify_messages` tables
- Auth context: Must verify paid tier (Pro/Unlimited only)

**Mobile Considerations:**
- List view with cards similar to `/reflections` page pattern
- Swipe-to-delete sessions (optional enhancement)
- Pull-to-refresh for session list

#### Active Conversation View (`/clarify/[sessionId]`)
**User Journey:**
1. User selects session or creates new one
2. System builds context (patterns, dreams, reflections)
3. Agent greets with context-aware opening OR loads history
4. User types message, sends via Enter or button
5. Agent responds with streaming text
6. Conversation continues naturally
7. User can close browser anytime - session persists

**Chat Interface Requirements:**
- **Input area:** Fixed bottom, keyboard-aware (like MobileReflectionFlow)
- **Message bubbles:** User right-aligned, Agent left-aligned with avatar/icon
- **Streaming display:** Progressive text reveal as tokens arrive
- **Auto-scroll:** New messages scroll into view
- **Session persistence:** All messages stored in `clarify_messages`

**Integration Points:**
- Streaming API: Must implement SSE or similar for real-time token streaming
- Context injection: System prompt with patterns, dreams, recent reflections
- Function calling: `createDream` tool for dream declaration from conversation
- Rate limiting: Session count per month (Pro: 20, Unlimited: 30)

**Mobile Considerations:**
- Full-screen chat mode (hide bottom nav)
- Keyboard-aware input positioning (existing `useKeyboardHeight` hook)
- Safe area handling for notched devices
- Haptic feedback on send

#### Dream Declaration from Chat
**User Journey:**
1. User expresses crystallizing thought
2. Agent offers: "This sounds like a dream forming. Would you like to give it a name?"
3. If user agrees, agent proposes title
4. Confirmation modal appears with pre-filled dream data
5. Dream created, linked to session via `dream_created_id`
6. Toast notification confirms creation
7. User can continue conversation or navigate to Dreams

**Integration Points:**
- Reuse `CreateDreamModal` component (existing)
- Link new dream to session: `clarify_sessions.dream_created_id`
- Update dreams list if on-screen

---

### Flow 2: Dream Evolution

#### Entry Point
- "Evolve Dream" button on dream detail page (`/dreams/[id]`)
- Only visible for `status === 'active'` dreams

#### Evolution Modal Flow
**User Journey:**
1. User views active dream detail page
2. Clicks "Evolve Dream" action button
3. Modal opens showing:
   - Current title/description (read-only, for reference)
   - New title input field
   - New description textarea
   - "Why did this dream evolve?" reflection textarea
4. User fills in evolved form + reflection
5. Submits evolution
6. Dream updates in-place (same ID), evolution event logged
7. Modal closes, dream detail refreshes
8. Toast confirms: "Dream evolved"

**Modal Design:**
- Use existing `GlassModal` component
- Multi-step or single-step (recommend single-step for simplicity)
- Character limits: Title 200, Description 2000, Reflection 1000

**Integration Points:**
- New tRPC mutation: `dreams.evolve`
- New table: `evolution_events` (stores history)
- Dream detail page: Show "Evolution History" section if `evolution_count > 0`
- Existing `dreams.update` logic extended

**Mobile Considerations:**
- Modal becomes full-screen on mobile (existing GlassModal behavior)
- Keyboard-aware scrolling
- Prevent accidental dismissal with form data

#### Evolution History Display
**User Journey:**
1. On dream detail page, if dream has evolutions
2. Show "Evolution History" collapsible section
3. Each entry shows: old title -> new title, date, reflection snippet
4. Click to expand full reflection

**Integration Points:**
- Query `evolution_events` by `dream_id`
- Sort by `created_at` descending (most recent first)

---

### Flow 3: Achievement Ceremony

#### Entry Point
- "Mark as Achieved" button on dream detail page
- Currently exists but triggers instant status change
- New flow: Triggers ceremony instead

#### Ceremony Flow
**User Journey:**
1. User clicks "Mark as Achieved" on active dream
2. System shows loading state: "Preparing your journey synthesis..."
3. System fetches: first reflection, key moments, final reflection
4. AI generates "who you were" vs "who you became" contrast
5. Ceremony page loads with:
   - Journey timeline (first -> now)
   - AI-generated transformation reflection
   - Space for user's closing words (optional)
   - "Confirm Achievement" button
6. User adds closing words (optional)
7. User confirms achievement
8. Dream status -> "achieved", ceremony stored
9. Redirect to `/dreams/[id]/ceremony` (permanent, viewable archive)

**Ceremony Page Design (`/dreams/[id]/ceremony`):**
- Beautiful, celebratory presentation
- Gold/amber color accents (using existing `mirror-gold-*` tokens)
- Sections:
  - "Your Journey" - Timeline from first reflection to achievement
  - "Who You Were" - AI reflection on starting point
  - "Who You Became" - AI reflection on transformation
  - "Your Closing Words" - User's final message
  - "Achieved on [date]" - Timestamp badge
- Shareable? (future consideration)

**Integration Points:**
- New tRPC mutation: `dreams.achieve` (replaces simple status update)
- New table: `achievement_ceremonies`
- AI generation: Use Sonnet 4.5 for ceremony synthesis
- New page: `/dreams/[id]/ceremony`

**Mobile Considerations:**
- Vertical scroll layout
- Large, readable typography
- Full-width sections
- Bottom-anchored "Confirm" button

#### Edge Cases
- **Dream with only 1 reflection:** Simpler ceremony, no "journey" arc, acknowledge single reflection
- **Dream with no reflections:** Minimal ceremony, ask if user wants to add closing words only
- **AI generation fails:** Fallback to manual ceremony (user writes own synthesis)

---

### Flow 4: Release Ritual

#### Entry Point
- "Release Dream" button on dream detail page
- Only for `status === 'active'` dreams
- Distinct from "Archive" (which remains a simple toggle)

#### Ritual Flow
**User Journey:**
1. User clicks "Release Dream" on active dream
2. Ritual page/modal opens with sequential prompts:
   - Step 1: "What did this dream protect you from?"
   - Step 2: "What did it give you, even if you're letting it go?"
   - Step 3: "Why is it no longer alive in you?"
   - Step 4: "What gratitude do you have for this chapter?"
3. User answers each prompt (can be brief)
4. Final step: Optional closing words
5. "Release with Gratitude" confirmation button
6. Dream status -> "released", ritual stored, dream sealed
7. Redirect to `/dreams/[id]/ritual` (permanent, viewable archive)

**Ritual Page Design (`/dreams/[id]/ritual`):**
- Solemn, peaceful presentation
- Softer purple/blue tones (using existing `mirror-amethyst-*` tokens)
- Sections for each answered prompt
- "Released on [date]" - Timestamp badge
- No edit capability (dream is sealed)

**Multi-Step Wizard vs Single Page:**
- **Recommendation:** Multi-step wizard (like MobileReflectionFlow)
- Each prompt gets focused attention
- Progress indicator at top
- Back/Next navigation
- Final review before confirmation

**Integration Points:**
- New tRPC mutation: `dreams.release` (triggers ritual flow)
- New table: `release_rituals`
- New page: `/dreams/[id]/ritual` (archive view)
- Wizard component: New `ReleaseRitualWizard` (modeled on MobileReflectionFlow)

**Mobile Considerations:**
- Full-screen wizard flow
- One prompt per screen
- Large touch targets for navigation
- Swipe gestures for back/forward (optional)

#### Mid-Ritual Abandonment
- Progress saved to localStorage (like MobileReflectionFlow pattern)
- On return, prompt: "You have an unfinished ritual. Continue or discard?"
- 24-hour expiry on saved progress

---

## Navigation Changes

### Desktop Navigation (`AppNavigation.tsx`)

**Current items (left side):**
1. Journey (dashboard)
2. Dreams
3. Reflect
4. Evolution
5. Visualizations
6. Admin (conditional)

**Proposed addition:**
- Add "Clarify" between "Dreams" and "Reflect"
- Icon: Thought bubble or compass emoji
- Position: Logical flow from Dreams (what you have) -> Clarify (exploring) -> Reflect (on specific dream)

**Updated order:**
1. Journey
2. Dreams
3. **Clarify** (new)
4. Reflect
5. Evolution
6. Visualizations
7. Admin (conditional)

**`currentPage` type update:**
```typescript
type CurrentPage = 'dashboard' | 'dreams' | 'clarify' | 'reflection' | ...
```

### Mobile Bottom Navigation (`BottomNavigation.tsx`)

**Current items:**
1. Home
2. Dreams
3. Reflect
4. Evolution
5. Visual
6. Profile

**Challenge:** 6 items is already at capacity for bottom nav (7 would be cramped)

**Options:**
1. **Replace "Visual" with "Clarify"** - Move Visualizations to secondary location
2. **Move to hamburger menu** - Add More(...) tab
3. **Conditional display** - Show Clarify only for paid users (hide Visual for free users)
4. **Floating action button** - Clarify as FAB overlay

**Recommendation:** Option 3 (Conditional display)
- Free users: Show current 6 items
- Paid users: Replace "Visual" tab with "Clarify" (Visualizations accessible from Evolution page or Profile)

**Alternative:** Add "More" tab that opens bottom sheet with secondary items

---

## Integration with Existing Features

### Authentication & Authorization
- Clarify: Paid-only (Pro/Unlimited)
- Check `user.tier` before allowing Clarify access
- Upgrade modal for free users attempting access

### Rate Limiting
- New limits in constants:
  - `CLARIFY_SESSION_LIMITS = { pro: 20, unlimited: 30 }`
- Usage tracking extended to `users` table:
  - `clarify_sessions_this_month`
  - `total_clarify_sessions`
- Rate limit check before session creation
- Show usage in Settings/Profile page

### Existing Modal Patterns
- `GlassModal` - Base modal component (used for Evolution modal)
- `CreateDreamModal` - Dream creation flow (reuse for Clarify dream declaration)
- `UpgradeModal` - Paywall pattern (reuse for Clarify access denial)

### Existing Wizard Patterns
- `MobileReflectionFlow` - Multi-step wizard with swipe navigation
- Reuse pattern for Release Ritual wizard
- Reuse progress indicators (`ProgressOrbs`)

### Streaming Integration
- Current codebase: No existing streaming implementation
- Evolution/Reflection: Uses standard request-response pattern
- **New requirement:** Clarify chat needs streaming responses
- Options:
  1. tRPC streaming (complex setup)
  2. Direct API endpoint with SSE
  3. WebSocket (overkill for this use case)
- **Recommendation:** SSE endpoint at `/api/clarify/stream`

---

## Data Flow Patterns

### Clarify Session Context Building
```
User opens session
    |
    v
Build system prompt:
    +-- User's active dreams (title, description)
    +-- Recent reflections (last 5)
    +-- Extracted patterns (from clarify_patterns)
    +-- Session history (if returning)
    |
    v
Inject into Claude system prompt
    |
    v
Stream response to client
```

### Dream Evolution Data Flow
```
User clicks "Evolve"
    |
    v
Modal opens with current dream data
    |
    v
User submits new title/desc/reflection
    |
    v
API call: dreams.evolve
    |
    +-- Create evolution_event record
    +-- Update dream record (title, description)
    +-- Increment evolution_count
    |
    v
Invalidate dream query
    |
    v
Refresh UI
```

### Achievement Ceremony Data Flow
```
User clicks "Mark as Achieved"
    |
    v
Loading state: "Preparing journey..."
    |
    v
Fetch ceremony data:
    +-- All reflections for dream
    +-- First and last reflection
    +-- Dream metadata
    |
    v
AI generation:
    +-- Synthesize journey
    +-- Generate "who you were" / "who you became"
    |
    v
Display ceremony preview
    |
    v
User adds closing words (optional)
    |
    v
Confirm achievement
    |
    v
Create achievement_ceremony record
Update dream status to "achieved"
    |
    v
Redirect to ceremony archive page
```

---

## Mobile Considerations Summary

### Screen Types by Feature

| Feature | Mobile Pattern | Hide Bottom Nav |
|---------|---------------|-----------------|
| Clarify Session List | Standard list page | No |
| Clarify Chat | Full-screen chat | Yes |
| Evolution Modal | Full-screen modal | Yes (modal overlay) |
| Achievement Ceremony | Full-screen page | No |
| Release Ritual Wizard | Full-screen wizard | Yes |

### Keyboard Handling
- Clarify chat: Use `useKeyboardHeight` hook for input positioning
- Release ritual: Each prompt step is keyboard-aware
- Evolution modal: GlassModal already handles this

### Safe Area
- All new screens must respect `env(safe-area-inset-*)` for notched devices
- Bottom inputs need `pb-safe` class

### Haptic Feedback
- Send message in Clarify: `haptic('light')`
- Navigation in wizards: `haptic('light')`
- Confirm achievement/release: `haptic('success')` or `haptic('medium')`

---

## API Contracts

### New tRPC Routes

#### `clarifyRouter`
```typescript
// Sessions
clarify.listSessions() -> ClarifySession[]
clarify.getSession({ sessionId }) -> ClarifySession & { messages: ClarifyMessage[] }
clarify.createSession() -> ClarifySession

// Messages (non-streaming - use SSE endpoint for streaming)
clarify.sendMessage({ sessionId, content }) -> { messageId }

// Patterns
clarify.getPatterns() -> ClarifyPattern[]
```

#### `dreamsRouter` (extended)
```typescript
dreams.evolve({ id, newTitle, newDescription, reflection }) -> Dream
dreams.achieve({ id, closingWords? }) -> AchievementCeremony
dreams.release({ id, ritual: ReleaseRitualInput }) -> ReleaseRitual
```

### New API Endpoints

#### `/api/clarify/stream` (SSE)
```
POST /api/clarify/stream
Body: { sessionId, content }
Response: text/event-stream
  data: {"type": "token", "content": "..."}
  data: {"type": "done", "messageId": "..."}
  data: {"type": "function_call", "name": "createDream", "args": {...}}
```

---

## Risk Assessment (UX-Specific)

### High Risks

#### 1. Chat Streaming Complexity
- **Risk:** Streaming implementation is new to this codebase
- **Impact:** Could delay Clarify feature significantly
- **Mitigation:**
  - Start with non-streaming fallback (full response display)
  - Implement streaming as enhancement
  - Test SSE thoroughly on mobile browsers

#### 2. Navigation Overcrowding
- **Risk:** Adding Clarify breaks mobile navigation balance
- **Impact:** Poor UX on mobile, cramped touch targets
- **Mitigation:**
  - Conditional navigation based on tier
  - Consider "More" menu for secondary features
  - User testing on various device sizes

### Medium Risks

#### 3. Ceremony/Ritual Page Performance
- **Risk:** AI generation for ceremony takes 30-45 seconds
- **Impact:** User might abandon or think it's broken
- **Mitigation:**
  - Clear progress indicators
  - Engaging loading animations
  - "Don't close this tab" messaging

#### 4. Session Context Token Limits
- **Risk:** Long-running users accumulate too much context
- **Impact:** Context exceeds Claude's limits, causes errors
- **Mitigation:**
  - Implement context summarization
  - Limit injected patterns/reflections count
  - Background consolidation for old messages

### Low Risks

#### 5. localStorage Persistence Conflicts
- **Risk:** Multiple tabs cause state conflicts
- **Impact:** Lost wizard progress or duplicate data
- **Mitigation:**
  - Use session-specific keys
  - Implement conflict detection

---

## Integration Recommendations

### 1. Component Reusability
- **GlassModal:** Use for Evolution modal
- **MobileReflectionFlow pattern:** Clone/adapt for Release Ritual
- **ProgressOrbs:** Reuse for all multi-step flows
- **CosmicLoader:** Use for all AI generation loading states
- **Toast system:** Use for confirmations across all features

### 2. Design Consistency
- **Chat bubbles:** Match existing `GlassCard` aesthetic with `backdrop-blur`
- **Ceremony pages:** Use `GradientText` for headings, `mirror-gold-*` accents
- **Ritual pages:** Use `mirror-amethyst-*` palette, softer tones
- **Typography:** Follow existing `text-h1`, `text-body` classes

### 3. State Management
- **Session state:** React Query + tRPC for server state
- **Wizard state:** Local component state + localStorage backup
- **Context:** Extend existing `useAuth` hook for tier checking

### 4. Feature Flags (Optional)
- Consider feature flags for gradual rollout:
  - `FEATURE_CLARIFY_ENABLED`
  - `FEATURE_EVOLUTION_ENABLED`
  - `FEATURE_CEREMONIES_ENABLED`

---

## Recommended Iteration Phases (UX Perspective)

### Phase 1: Foundation UI
- Navigation updates (add Clarify item)
- GlassModal enhancements if needed
- Base chat interface components
- Rate limit UI components

### Phase 2: Dream Lifecycle (Evolution, Ceremony, Release)
- Evolution modal and history display
- Achievement ceremony flow and page
- Release ritual wizard and page
- Dream detail page updates

### Phase 3: Clarify Agent
- Session list page
- Chat interface with streaming
- Context building system
- Dream declaration from chat

**Rationale:** Dream lifecycle features are more self-contained and can ship independently. Clarify is more complex due to streaming and should come after the foundation is proven.

---

## Notes & Observations

1. **Existing mobile patterns are excellent** - MobileReflectionFlow is well-designed and should be the template for Release Ritual wizard.

2. **Design system is comprehensive** - The `mirror-*` color palette and glass morphism utilities are well-established. New features should follow these patterns strictly.

3. **tRPC infrastructure is solid** - Extending the router system for new features should be straightforward.

4. **No existing streaming** - This is the biggest integration challenge. Need to decide on SSE vs tRPC streaming vs alternative approaches.

5. **Session persistence model** - The vision specifies sessions persist "indefinitely." Need to consider database growth and implement archival/deletion policies.

6. **Ceremony/Ritual permanence** - These are meant to be permanent records. Consider implications for GDPR/data deletion requests.

---

*Exploration completed: 2025-12-09*
*This report informs master planning decisions*
