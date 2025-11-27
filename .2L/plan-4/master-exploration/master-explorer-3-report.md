# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
User Experience & Integration Points

## Vision Summary
Mirror of Dreams needs to fix its broken reflection AI (400 errors), transform from multi-page to one-page 4-question reflection flow, and strip excessive decoration to deliver genuine substance over style. The core transformation must come from authentic AI insights, not from purple glows.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 6 must-have features
- **User stories/acceptance criteria:** 34+ distinct acceptance criteria
- **Estimated total work:** 14-18 hours

### Complexity Rating
**Overall Complexity: MEDIUM-HIGH**

**Rationale:**
- Fixing critical broken API integration (reflection creation returns 400 errors)
- Major UX flow transformation (multi-page to single-page, 5 questions to 4)
- Data flow changes across multiple integration points (frontend, API, database)
- Requires careful attention to user state management and error handling
- 3 primary user flows with edge cases and error handling requirements

---

## User Flow Analysis

### Flow 1: Complete First Reflection (PRIMARY CRITICAL PATH)

**Current State: BROKEN**
- Multi-step wizard (steps 0-6: dream selection + 5 questions + tone)
- Returns 400 errors when submitting reflection
- Has redundant "hasDate" question (already in dream object)
- Questions are generic, not dream-specific

**Target State:**
1. User sees dashboard → clicks "Reflect Now"
2. Selects dream from list (step 0)
3. ONE-PAGE form with 4 questions (all visible, scrollable)
   - Q1: "What is your dream?" (elaborate on THIS specific dream)
   - Q2: "What is your plan?" (for THIS dream)
   - Q3: "What's your relationship with this dream?" (with THIS dream)
   - Q4: "What are you willing to give?" (for THIS dream)
4. Tone selection at bottom (Fusion default)
5. Single submit: "Gaze into the Mirror"
6. **CRITICAL:** Anthropic API call must succeed (currently fails)
7. AI response displayed (formatted, readable)
8. User sees "1 reflection" on dream card

**Integration Complexity: HIGH**

**Critical Integration Points:**
1. **Frontend → tRPC → Reflection Router**
   - `/app/reflection/MirrorExperience.tsx` → `trpc.reflection.create.useMutation()`
   - Schema: `createReflectionSchema` (needs update to remove hasDate/dreamDate)
   - Payload includes: dreamId, dream, plan, relationship, offering, tone

2. **Reflection Router → Anthropic API**
   - `/server/trpc/routers/reflection.ts` line 108-109
   - Uses `@anthropic-ai/sdk` client
   - Model: `claude-sonnet-4-5-20250929`
   - **CURRENT ISSUE:** Returns 400 errors (likely schema mismatch or API key issue)

3. **AI Response → Database → Frontend**
   - Format response as sacred HTML (`toSacredHTML()` helper)
   - Store in `reflections.ai_response` column
   - Update user usage counters
   - Return to frontend for display

**Edge Cases:**
- No dreams created yet → Show "Create your first dream" prompt
- API fails → Clear error message with retry option
- Network timeout → Loading state with timeout message
- Empty answers → Client-side validation before submission
- Concurrent reflections → Usage limit check in middleware

**Error Handling Requirements:**
- 400 error: "We couldn't generate your reflection. Please try again or contact support."
- 500 error: "Something went wrong on our end. Please try again in a moment."
- Network error: "Connection issue. Check your internet and try again."
- Validation errors: Inline field-level feedback
- Usage limit errors: Clear upgrade prompt

### Flow 2: Create Dream (SUPPORTING FLOW)

**Current State: WORKING**
- Simple modal form with 5 fields
- Validation and tier limits enforced
- Successfully creates dreams in database

**Integration Points:**
1. **Frontend → tRPC → Dreams Router**
   - Modal component → `trpc.dreams.create.useMutation()`
   - Schema: `createDreamSchema` (title, description, targetDate, category, priority)

2. **Tier Limit Validation**
   - `checkDreamLimit()` helper in dreams router
   - Limits: Free=2, Essential=5, Optimal=7, Premium=unlimited
   - Returns 403 FORBIDDEN if limit reached

3. **Database → Response**
   - Creates record in `dreams` table
   - Returns dream object + usage info
   - Frontend updates dashboard immediately

**Integration Complexity: LOW**
- Existing flow works well
- Clear error messages
- Good user feedback

### Flow 3: View Dashboard (CORE ENGAGEMENT)

**Current State: CLUTTERED**
- Too many sections competing for attention
- Confusing stats (100% Used, 0 Limit, infinity symbols)
- Empty states with emojis everywhere
- Generic greeting: "Deep night wisdom, Creator"
- No clear primary action

**Target State:**
1. Clear greeting: "Good evening, [Name]"
2. PRIMARY ACTION: Large "Reflect Now" button (most prominent)
3. Active Dreams section:
   - Simple cards with emoji, title, days left, reflection count
   - Action buttons per card: Reflect, Evolution, Visualize
4. Recent Reflections (last 3):
   - Dream name + timestamp
   - "View All" link
5. Plan section:
   - Simple usage: "8/30 reflections this month"
   - No confusing percentages

**Integration Points:**
1. **Data Fetching (Multiple Parallel Calls)**
   - `trpc.users.me.useQuery()` → User info
   - `trpc.dreams.list.useQuery({ status: 'active', includeStats: true })` → Dreams with reflection counts
   - `trpc.reflections.list.useQuery({ limit: 3, sortBy: 'created_at' })` → Recent reflections
   - `trpc.subscriptions.usage.useQuery()` → Usage stats

2. **State Management**
   - React Query handles caching and updates
   - Dashboard refreshes when new reflection created
   - Real-time updates via `useDashboard()` hook

3. **Navigation Integration**
   - "Reflect Now" → `/reflection`
   - "Reflect" on dream → `/reflection?dreamId={id}`
   - "Evolution" → `/evolution?dreamId={id}` (if 4+ reflections)
   - "Visualize" → `/visualizations?dreamId={id}` (if 4+ reflections)

**Integration Complexity: MEDIUM**
- Multiple data sources to coordinate
- Conditional rendering based on reflection counts
- Navigation state management

---

## API Contract Analysis

### Critical API: `reflection.create`

**Current Implementation Issues:**
```typescript
// Schema expects these fields (types/schemas.ts line 40-50)
createReflectionSchema = z.object({
  dreamId: z.string().uuid(),
  dream: z.string().min(1).max(3200),
  plan: z.string().min(1).max(4000),
  hasDate: z.enum(['yes', 'no']),        // ← TO BE REMOVED
  dreamDate: z.string().nullable(),       // ← TO BE REMOVED
  relationship: z.string().min(1).max(4000),
  offering: z.string().min(1).max(2400),
  tone: z.enum(['gentle', 'intense', 'fusion']).default('fusion'),
  isPremium: z.boolean().default(false),
});
```

**Problem:**
- `hasDate` and `dreamDate` fields are redundant (already in dream object)
- Vision calls for 4 questions, not 5
- Current schema mismatch may be causing 400 errors

**Required Changes:**
1. Remove `hasDate` and `dreamDate` from schema
2. Update router to not expect these fields
3. Update frontend to not send these fields
4. Database migration to remove columns (optional, can be nullable)

### Data Flow Map: Reflection Creation

```
User Input (MirrorExperience.tsx)
  ↓
FormData State (dream, plan, relationship, offering, tone)
  ↓
trpc.reflection.create.useMutation()
  ↓
validation: createReflectionSchema
  ↓
middleware: usageLimitedProcedure
  ├─ Check user tier limits
  ├─ Check monthly usage
  └─ Throw 403 if limit reached
  ↓
reflection.ts router
  ├─ Load prompts (tone-based)
  ├─ Build user prompt from inputs
  ├─ Call Anthropic API (claude-sonnet-4-5)
  │   ├─ Request: system + user messages
  │   ├─ Response: text content
  │   └─ ERROR: 400 (current issue)
  ├─ Format response as sacred HTML
  ├─ Calculate word count + read time
  ├─ Insert into reflections table
  ├─ Update user usage counters
  └─ Check evolution eligibility
  ↓
Return to frontend
  ├─ reflection (formatted HTML)
  ├─ reflectionId (UUID)
  ├─ isPremium (boolean)
  ├─ shouldTriggerEvolution (boolean)
  ├─ wordCount (number)
  └─ estimatedReadTime (number)
  ↓
Frontend displays AI response
  └─ Navigate to /reflection?id={reflectionId}
```

**Points of Failure:**
1. **Schema validation** (hasDate/dreamDate mismatch)
2. **Anthropic API call** (400 error - likely schema or auth issue)
3. **Database insertion** (foreign key constraints, nullability)
4. **User context** (auth token, tier verification)

---

## Data Flow Patterns

### Pattern 1: Dream-Centric Reflection Flow

**Concept:** All reflections MUST be linked to a specific dream

**Database Relationship:**
```sql
reflections.dream_id → dreams.id (ON DELETE SET NULL)
```

**Implications:**
- User must have at least one dream before reflecting
- Reflection questions reference "THIS dream" (the selected one)
- Dream object contains target_date (no need for separate date question)
- Orphaned reflections (dream_id = NULL) possible if dream deleted

**Integration Point:**
- Dream selection happens at step 0 of reflection flow
- `selectedDreamId` state maintained throughout flow
- Passed to API as `dreamId` parameter

### Pattern 2: Multi-Step to Single-Page Transformation

**Current (Multi-Step):**
```
Step 0: Select Dream
Step 1: Question 1 (dream)
Step 2: Question 2 (plan)
Step 3: Question 3 (hasDate) ← YES/NO choice
Step 4: Question 4 (dreamDate) ← Conditional, only if hasDate='yes'
Step 5: Question 5 (relationship)
Step 6: Question 6 (offering)
Step 7: Tone Selection
Submit: "Gaze into the Mirror"
```

**Target (Single-Page):**
```
Step 0: Select Dream (unchanged)
Step 1: ALL 4 questions + tone on ONE page (scroll to view)
  ├─ Q1: What is your dream? (textarea)
  ├─ Q2: What is your plan? (textarea)
  ├─ Q3: What's your relationship with this dream? (textarea)
  ├─ Q4: What are you willing to give? (textarea)
  └─ Tone: [Gentle] [Intense] [●Fusion] (radio buttons)
Submit: "Gaze into the Mirror"
```

**UX Changes Required:**
1. Remove step-by-step navigation (ProgressOrbs, handleNext/handleBack)
2. Display all 4 textareas simultaneously
3. Allow scrolling to view all questions
4. Single submit button at bottom
5. Validation on submit (check all fields filled)

**Integration Complexity: MEDIUM**
- Component refactor (remove multi-step logic)
- State management simpler (all fields in one view)
- Form validation more straightforward
- Better for contemplation (see all questions together)

### Pattern 3: Real-Time Usage Tracking

**Flow:**
```
User submits reflection
  ↓
middleware: usageLimitedProcedure checks limits BEFORE processing
  ├─ Check user.tier
  ├─ Check user.reflection_count_this_month
  ├─ Compare against tier limits (Free=1, Essential=5, Optimal=10, Premium=30)
  └─ Throw 403 if limit exceeded
  ↓
Reflection created successfully
  ↓
Update user counters in database
  ├─ reflection_count_this_month++
  ├─ total_reflections++
  └─ last_reflection_at = NOW()
  ↓
Frontend receives success response
  ↓
Dashboard auto-refreshes (React Query invalidation)
  └─ Shows updated usage: "9/30 reflections this month"
```

**Integration Points:**
- Middleware enforces limits BEFORE expensive AI call
- Database updates happen in transaction
- Frontend reflects changes immediately via cache invalidation

---

## Authentication & Session Management

### Auth Flow

**Sign In:**
```
User submits email + password
  ↓
auth.signin mutation
  ├─ Verify password with bcrypt
  ├─ Check monthly usage reset needed
  ├─ Update last_sign_in_at
  └─ Generate JWT token (30-day expiry)
  ↓
Store token in localStorage
  ↓
Redirect to dashboard (or onboarding if new user)
```

**Session Persistence:**
```
App loads
  ↓
Check localStorage for authToken
  ↓
If found: auth.verifyToken query
  ├─ Decode JWT
  ├─ Fetch user from database
  └─ Return user object + tier info
  ↓
Set global auth context
  ├─ useAuth() hook provides user everywhere
  └─ protectedProcedure middleware enforces auth on API calls
```

**Integration Points:**
- JWT stored client-side (localStorage)
- Every tRPC call includes token in headers
- Server middleware (`createContext`) validates token
- User object available in `ctx.user` for all protected procedures

### User Context Propagation

**Pattern:**
```
localStorage.authToken
  ↓
HTTP Headers: Authorization: Bearer {token}
  ↓
tRPC Context Creation (server/trpc/context.ts)
  ├─ Extract token from headers
  ├─ Verify with JWT_SECRET
  ├─ Fetch user from database
  └─ Attach to ctx.user
  ↓
Available in all procedures: ctx.user
  ├─ ctx.user.id
  ├─ ctx.user.tier
  ├─ ctx.user.isCreator
  ├─ ctx.user.reflectionCountThisMonth
  └─ etc.
```

---

## Form Handling & Validation

### Client-Side Validation

**Reflection Form:**
```typescript
// Before submission
validate() {
  if (!selectedDreamId) return "Please select a dream";
  if (!formData.dream.trim()) return "Question 1 required";
  if (!formData.plan.trim()) return "Question 2 required";
  if (!formData.relationship.trim()) return "Question 3 required";
  if (!formData.offering.trim()) return "Question 4 required";
  if (formData.dream.length > 3200) return "Question 1 too long";
  // ... etc
  return null; // Valid
}
```

**Dream Creation Form:**
```typescript
validate() {
  if (!title.trim()) return "Title required";
  if (title.length > 200) return "Title too long (max 200)";
  if (description.length > 2000) return "Description too long (max 2000)";
  if (targetDate && !isValidDate(targetDate)) return "Invalid date";
  return null; // Valid
}
```

### Server-Side Validation

**Zod Schema Validation:**
```typescript
// Happens automatically in tRPC procedures
input(createReflectionSchema) // ← Validates before procedure runs
  ↓
If invalid: throws TRPCError with BAD_REQUEST
  ↓
Frontend receives error in mutation.onError()
  ↓
Display user-friendly error message
```

**Business Logic Validation:**
```typescript
// In procedure
if (tier === 'free' && reflectionCountThisMonth >= 1) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Monthly limit reached. Upgrade to create more reflections.'
  });
}
```

---

## Error Handling Strategy

### Error Types & User Feedback

**1. Validation Errors (400 BAD_REQUEST)**
- **Cause:** Invalid input (missing fields, wrong format, length violations)
- **User sees:** Inline field-level error messages
- **Example:** "Password must be at least 6 characters"
- **Recovery:** Fix input and resubmit

**2. Authentication Errors (401 UNAUTHORIZED)**
- **Cause:** Invalid or expired token, wrong credentials
- **User sees:** "Please sign in to continue"
- **Example:** "Invalid email or password"
- **Recovery:** Redirect to /auth/signin

**3. Authorization Errors (403 FORBIDDEN)**
- **Cause:** Usage limits, tier restrictions
- **User sees:** Clear upgrade prompt
- **Example:** "Monthly limit reached (1/1 reflections). Upgrade to Premium for 30/month."
- **Recovery:** Upgrade tier or wait for monthly reset

**4. Not Found Errors (404 NOT_FOUND)**
- **Cause:** Requested resource doesn't exist or doesn't belong to user
- **User sees:** "Not found" message with navigation back
- **Example:** "Dream not found"
- **Recovery:** Navigate back to dashboard

**5. Server Errors (500 INTERNAL_SERVER_ERROR)**
- **Cause:** Database issues, API failures, unexpected exceptions
- **User sees:** Generic error with support contact
- **Example:** "Something went wrong. Please try again or contact support."
- **Recovery:** Retry or contact support

### Critical Error: Reflection API 400

**Current Issue:**
- `trpc.reflection.create.useMutation()` returns 400 errors
- Prevents users from completing reflections
- Breaks primary user flow

**Likely Causes:**
1. Schema mismatch (hasDate/dreamDate fields)
2. Anthropic API key invalid or missing
3. Request format incorrect
4. Middleware blocking request

**Debugging Strategy:**
1. Check console logs for detailed error message
2. Verify ANTHROPIC_API_KEY environment variable
3. Test schema validation independently
4. Add debug logging to reflection router
5. Test Anthropic API call in isolation

---

## Responsive Design Considerations

### Mobile Breakpoints

**Current Implementation:**
```css
/* Dashboard */
@media (max-width: 1200px) {
  .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .dashboard-container { padding: var(--space-md); }
}
```

**Reflection Form:**
```css
/* MirrorExperience.tsx has responsive styles */
.mirror-surface {
  padding: var(--space-2xl); /* Adjusts based on viewport */
}
@media (max-width: 768px) {
  .mirror-surface { padding: var(--space-lg); }
}
```

### Mobile UX Challenges

**One-Page Reflection Form:**
- **Challenge:** 4 textareas + tone selection on small screen
- **Solution:** Vertical scroll, generous spacing, sticky submit button
- **Integration:** CSS scroll-snap or smooth scrolling for better UX

**Dream Selection:**
- **Challenge:** List of dreams with emoji, title, stats in compact space
- **Solution:** Vertical stacking, touch-friendly tap targets (min 44px)

**Dashboard Cards:**
- **Challenge:** 6 cards on mobile (too much scrolling)
- **Solution:** Already implemented single-column layout at 1024px breakpoint

---

## Accessibility Requirements

### Keyboard Navigation

**Current State:**
- Dream selection cards have `onKeyDown` handlers (Enter/Space)
- Tone selection cards have keyboard support
- Form inputs are keyboard-navigable

**Gaps:**
- Missing focus indicators on some interactive elements
- Tab order may not be logical in multi-step flow
- No skip-to-content link

**Required for Plan-4:**
- Ensure all interactive elements keyboard-accessible
- Logical tab order in single-page reflection form
- Clear focus indicators (visible outline)
- Screen reader announcements for form errors

### Screen Reader Support

**Current State:**
- Semantic HTML (buttons, inputs, labels)
- `role="button"` on clickable divs
- `tabIndex={0}` for keyboard access

**Gaps:**
- Missing ARIA labels on some buttons
- Loading states not announced
- Error messages may not be associated with inputs

**Required for Plan-4:**
- `aria-label` on icon-only buttons
- `aria-live` regions for loading/error states
- `aria-describedby` for error messages linked to inputs
- `aria-required` on required fields

### Color Contrast

**Current Design:**
- Deep navy background (#0a0e27)
- White/light gray text (rgba(255,255,255,0.95))
- Purple accents (mirror-purple, mirror-violet)

**Compliance:**
- High contrast ratios (likely WCAG AAA compliant)
- No reliance on color alone for meaning
- Clear visual hierarchy

---

## State Management Patterns

### Local Component State (useState)

**MirrorExperience.tsx:**
```typescript
const [viewMode, setViewMode] = useState<'questionnaire' | 'output'>('questionnaire');
const [currentStep, setCurrentStep] = useState(0); // ← TO BE REMOVED in single-page version
const [selectedDreamId, setSelectedDreamId] = useState<string>('');
const [selectedTone, setSelectedTone] = useState<ToneId>('fusion');
const [formData, setFormData] = useState<FormData>({
  dream: '',
  plan: '',
  hasDate: '',      // ← TO BE REMOVED
  dreamDate: '',    // ← TO BE REMOVED
  relationship: '',
  offering: '',
});
```

**Dashboard:**
```typescript
const [isPageVisible, setIsPageVisible] = useState(false); // Fade-in animation
```

### Server State (React Query via tRPC)

**Pattern:**
```typescript
// Automatic caching, refetching, and invalidation
const { data: dreams } = trpc.dreams.list.useQuery({ status: 'active' });
const { data: user } = trpc.auth.me.useQuery();
const createReflection = trpc.reflection.create.useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries(['reflections']);
    queryClient.invalidateQueries(['users']);
  }
});
```

**Benefits:**
- Automatic cache management
- Optimistic updates
- Background refetching
- Error retry logic

### Global Context (useAuth)

**Pattern:**
```typescript
// Provides user info throughout app
const { user, isAuthenticated, isLoading } = useAuth();

// Implementation (likely uses React Context + tRPC query)
export function useAuth() {
  const { data, isLoading } = trpc.auth.me.useQuery();
  return {
    user: data?.user,
    isAuthenticated: !!data?.user,
    isLoading,
  };
}
```

---

## Navigation & Routing

### App Router Structure

```
app/
├─ page.tsx                    → Landing page (public)
├─ auth/
│  ├─ signin/page.tsx         → Sign in (public)
│  └─ signup/page.tsx         → Sign up (public)
├─ onboarding/page.tsx        → First-time user setup (protected)
├─ dashboard/page.tsx         → Main hub (protected)
├─ reflection/
│  ├─ page.tsx                → Wrapper (protected)
│  ├─ MirrorExperience.tsx    → Questionnaire + output (protected)
│  └─ output/page.tsx         → View existing reflection (protected)
├─ dreams/
│  ├─ page.tsx                → Dreams list (protected)
│  └─ [id]/page.tsx           → Dream detail (protected)
├─ reflections/
│  ├─ page.tsx                → Reflections list (protected)
│  └─ [id]/page.tsx           → Reflection detail (protected)
├─ evolution/
│  ├─ page.tsx                → Evolution reports list (protected)
│  └─ [id]/page.tsx           → Evolution report detail (protected)
└─ visualizations/
   ├─ page.tsx                → Visualizations list (protected)
   └─ [id]/page.tsx           → Visualization detail (protected)
```

### Protected Route Pattern

```typescript
// In page.tsx
export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <CosmicLoader />;
  if (!isAuthenticated) return null; // Will redirect

  return <Dashboard />;
}
```

### Query Parameters

**Reflection Flow:**
- `/reflection` → New reflection (dream selection)
- `/reflection?dreamId={uuid}` → Pre-select dream
- `/reflection?id={uuid}` → View existing reflection output

**Dream-Specific Actions:**
- `/evolution?dreamId={uuid}` → Generate evolution for specific dream
- `/visualizations?dreamId={uuid}` → Generate visualization for specific dream

---

## Performance Considerations

### API Call Optimization

**Problem:** Multiple sequential API calls slow down reflection creation

**Current Flow:**
```
1. User submits form
2. Frontend → tRPC → Reflection Router
3. Reflection Router → Load prompts (file read)
4. Reflection Router → Anthropic API (2-5 seconds)
5. Reflection Router → Database insert
6. Reflection Router → Update user counters
7. Reflection Router → Check evolution eligibility
8. Response → Frontend
Total: 3-7 seconds
```

**Optimization Opportunities:**
- Cache prompts in memory (avoid repeated file reads)
- Parallel database operations (insert + update user)
- Async evolution check (don't block response)
- Stream AI response to frontend (progressive rendering)

### Database Query Optimization

**Dreams List with Stats:**
```typescript
// Current: N+1 queries (1 for dreams + N for reflection counts)
const dreams = await supabase.from('dreams').select('*').eq('user_id', userId);
for (const dream of dreams) {
  const { count } = await supabase.from('reflections')
    .select('*', { count: 'exact' })
    .eq('dream_id', dream.id);
  dream.reflectionCount = count;
}

// Better: Single query with JOIN and aggregation
SELECT d.*, COUNT(r.id) as reflection_count, MAX(r.created_at) as last_reflection
FROM dreams d
LEFT JOIN reflections r ON d.id = r.dream_id
WHERE d.user_id = ?
GROUP BY d.id;
```

**Already Implemented:**
- `dreams.reflection_count` column (cached count)
- Trigger updates count on reflection insert/delete
- Reduces queries but may have staleness

### Frontend Caching

**React Query Default Behavior:**
- Cache time: 5 minutes (default)
- Stale time: 0 (always refetch on mount)
- Refetch on window focus: Yes

**Optimization:**
```typescript
// Dreams rarely change, cache longer
trpc.dreams.list.useQuery({ status: 'active' }, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// User profile changes infrequently
trpc.auth.me.useQuery(undefined, {
  staleTime: 10 * 60 * 1000,
});
```

---

## Integration Complexity Assessment

### High Complexity Integrations

**1. Reflection AI Generation (CRITICAL)**
- **Complexity:** HIGH
- **Reason:** Multi-step flow with external API dependency
- **Risk:** Currently broken (400 errors)
- **Dependencies:**
  - Schema validation (frontend → backend)
  - Anthropic API (network, authentication, rate limits)
  - Database transaction (insert reflection + update user)
  - Error propagation (API → router → frontend)

**2. One-Page Form Transformation**
- **Complexity:** MEDIUM-HIGH
- **Reason:** Major UX pattern change affecting state management
- **Changes Required:**
  - Remove multi-step navigation logic
  - Refactor form layout (all questions visible)
  - Update validation (single submit vs. per-step)
  - Adjust responsive design for mobile scrolling
  - Test keyboard navigation and accessibility

**3. Dashboard Data Aggregation**
- **Complexity:** MEDIUM
- **Reason:** Multiple data sources with computed fields
- **Integration Points:**
  - User profile (tier, usage)
  - Dreams list (with reflection counts, days left)
  - Recent reflections (joined with dream names)
  - Evolution/visualization eligibility (requires count checks)

### Medium Complexity Integrations

**4. Dream Creation Flow**
- **Complexity:** MEDIUM
- **Reason:** Tier limits enforcement, validation
- **Works Well:** Existing implementation solid
- **Changes:** Minimal (just UI cleanup for Plan-4)

**5. Authentication & Session**
- **Complexity:** MEDIUM
- **Reason:** JWT management, token refresh, context propagation
- **Works Well:** Existing implementation solid
- **Changes:** None needed for Plan-4

### Low Complexity Integrations

**6. Navigation & Routing**
- **Complexity:** LOW
- **Reason:** Next.js App Router handles most complexity
- **Works Well:** Clean route structure
- **Changes:** None needed for Plan-4

---

## Recommendations for Master Plan

### 1. Fix Reflection API First (URGENT)
**Priority: CRITICAL**

The broken reflection creation is a showstopper. No other features matter if users can't create reflections.

**Action Items:**
- Debug 400 error source (schema vs. API key vs. payload)
- Add detailed error logging to reflection router
- Test Anthropic API call in isolation
- Verify ANTHROPIC_API_KEY environment variable
- Update schema to remove hasDate/dreamDate fields

**Estimated Time:** 2-3 hours

### 2. Transform to One-Page Reflection Flow
**Priority: HIGH**

Single-page flow is central to the vision of "restraint and focus." Multi-step wizard is too fragmented.

**Action Items:**
- Remove step navigation logic from MirrorExperience.tsx
- Display all 4 textareas simultaneously (vertical layout)
- Move tone selection to bottom of form
- Single submit button: "Gaze into the Mirror"
- Update schema and types to reflect 4 questions
- Test mobile scrolling and keyboard navigation

**Estimated Time:** 3-4 hours

### 3. Simplify Dashboard for Clarity
**Priority: HIGH**

Dashboard is the first impression after auth. It must guide users clearly.

**Action Items:**
- Simplify greeting (remove mystical language)
- Make "Reflect Now" the dominant action
- Simplify dream cards (remove excessive decoration)
- Show recent reflections for narrative continuity
- Remove confusing usage stats (simplify to "X/Y this month")

**Estimated Time:** 2-3 hours

### 4. Strip Decorative Flash Throughout
**Priority: MEDIUM**

Excessive emojis and gradients distract from substance.

**Action Items:**
- Audit all pages for emoji usage (max 2 per page)
- Remove pop-up/bounce animations
- Simplify button styles (no decorative gradients)
- Update copy to be direct and clear
- Test that removal doesn't break functionality

**Estimated Time:** 2-3 hours

### 5. Test End-to-End User Flows
**Priority: VALIDATION**

Ensure all integration points work together seamlessly.

**Test Cases:**
- Complete first reflection (dream selection → form → AI response → dashboard update)
- Create dream → immediately reflect on it
- Reach usage limit → see upgrade prompt
- Sign out → sign in → see previous reflections
- Mobile view → all features accessible

**Estimated Time:** 2-3 hours

---

## Technology Stack Integration

### Frontend Stack

**Next.js 14 App Router**
- Server components for initial render
- Client components for interactivity
- Built-in routing and layouts

**React + TypeScript**
- Type-safe component props
- IntelliSense for better DX
- Catch errors at compile-time

**tRPC + React Query**
- End-to-end type safety
- Automatic request deduplication
- Optimistic updates
- Cache management

**Framer Motion**
- Animations (TO BE REDUCED per vision)
- Page transitions (200-300ms smooth only)
- NO decorative pop-ups or bounces

### Backend Stack

**Next.js API Routes**
- `/app/api/trpc/[trpc]/route.ts` handles all tRPC requests
- Server-side only (not exposed to client)

**tRPC Routers**
- Type-safe API definition
- Middleware for auth and usage limits
- Zod schema validation

**Supabase PostgreSQL**
- Local instance (port 54321)
- Row Level Security (RLS) enabled
- Automatic timestamps and triggers

**Anthropic Claude API**
- Model: claude-sonnet-4-5-20250929
- Extended thinking for premium tier
- Temperature: 1 (creative responses)

### Integration Layer

**tRPC Context Creation**
```typescript
// server/trpc/context.ts
export async function createContext({ req }) {
  const token = extractTokenFromHeaders(req.headers);
  const user = token ? await verifyTokenAndFetchUser(token) : null;
  return { user, req };
}
```

**Middleware Chain**
```typescript
publicProcedure          → No auth required
  ↓
protectedProcedure       → Requires auth (ctx.user must exist)
  ↓
usageLimitedProcedure    → Requires auth + enforces usage limits
```

---

## Notes & Observations

### Strengths of Current Architecture

1. **Type Safety:** End-to-end TypeScript with tRPC eliminates API contract errors
2. **Database Design:** Clean schema with proper relationships and constraints
3. **Authentication:** Solid JWT-based auth with proper token validation
4. **Caching:** React Query handles complex cache scenarios automatically
5. **Tier System:** Well-designed limits enforcement at database + middleware level

### Weaknesses to Address

1. **Broken Core Flow:** Reflection creation returns 400 errors (CRITICAL)
2. **UX Complexity:** Multi-step wizard is too fragmented (contradicts vision)
3. **Schema Redundancy:** hasDate/dreamDate fields duplicate dream object data
4. **Visual Clutter:** Too many emojis, animations, and decorative elements
5. **Dashboard Confusion:** Competing sections, unclear primary action

### Integration Risks

1. **Anthropic API Dependency:** Single point of failure if API down or rate-limited
2. **Schema Migration:** Removing hasDate/dreamDate requires careful migration
3. **State Management:** Single-page form may require new validation approach
4. **Mobile UX:** 4 textareas + tone on small screen needs careful testing
5. **Performance:** AI generation takes 3-7 seconds (user needs feedback)

### Unique Insights

**Dream-Centric Architecture:**
The decision to make dreams first-class entities (not just tags on reflections) is architecturally sound. It enables:
- Dream-specific evolution reports
- Timeline tracking (days_left)
- Reflection count per dream
- Status transitions (active → achieved → released)

This supports the vision of "helping you see how you connect to your dreams."

**Reflection as Artifact:**
Storing AI responses as formatted HTML (not just plain text) shows thoughtfulness:
- Preserves formatting for future viewing
- Consistent styling across app
- Easy to display without re-processing

**Tone Selection:**
Offering 3 distinct tones (gentle, intense, fusion) with different AI prompts shows depth:
- Allows user to choose relationship with mirror
- Premium tier can access extended thinking
- Tone affects both content and delivery

---

*Exploration completed: 2025-11-27*
*This report informs master planning decisions*
