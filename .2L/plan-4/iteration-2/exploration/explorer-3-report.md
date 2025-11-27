# Explorer 3 Report: Copy & Content Analysis

## Executive Summary

Mirror of Dreams suffers from pervasive **spiritual marketing speak** that undermines trust and creates false expectations. Across landing, auth, dashboard, and reflection pages, copy promises "consciousness transformation," "sacred journeys," and "deep mystical insights" without delivering substance. The analysis reveals 47 instances of marketing language requiring replacement with clear, honest communication. Vision requirement "Reflect. Understand. Evolve." is not implemented anywhere—instead users see flowery taglines like "Your dreams hold the mirror to who you're becoming."

## Discoveries

### Page-by-Page Copy Audit

#### 1. Landing Page (`app/page.tsx`, `components/portal/`)

**Current Issues:**
- **Loading state:** "Preparing your sacred space..." (line 55)
  - PROBLEM: Empty promise—no "sacred space" is being prepared
  - REPLACE: "Loading..."
  
- **Main tagline (unauthenticated):** "Your dreams hold the mirror to who you're becoming." (line 214)
  - PROBLEM: Poetic but vague—what does this mean?
  - TARGET: "Reflect. Understand. Evolve."
  
- **Sub-tagline:** "Start completely free. 90-second guided setup." (line 215)
  - PROBLEM: "90-second guided setup" is specific but unverified claim
  - REPLACE: "Free to start."

- **Authenticated taglines (creator):** "Dream without limits. Reflect without bounds." (line 224)
  - PROBLEM: Redundant marketing speak
  - REPLACE: "Unlimited reflections."

- **Authenticated taglines (can reflect):** "Which dream calls to you in this moment?" (line 231)
  - PROBLEM: Mystical language ("calls to you")
  - REPLACE: "Which dream will you reflect on?"

- **Authenticated taglines (out of limits):** "Your dreams deserve deeper exploration." (line 238)
  - PROBLEM: Marketing guilt trip
  - REPLACE: "Monthly limit reached."

**Button Text Issues:**
- "Reflect Me" (signup button) - unclear what this means
- "Continue Journey" - generic spiritual language
- "Start Free Forever" with emoji 🌱 - marketing badge
- "Explore Plans" with 💎 emoji - decorative

**Total Issues Found:** 12 instances of marketing speak

---

#### 2. Auth Pages

**Sign-In Page (`app/auth/signin/page.tsx`):**

**Current Issues:**
- **Heading:** "Welcome Back" ✅ (CORRECT - matches vision)
- **Subheading:** "Continue your journey of self-discovery" (line 142)
  - PROBLEM: Generic spiritual tagline
  - REPLACE: Remove entirely or use "Sign in to your account"
  
- **Button text:** "Continue Your Journey" (line 214)
  - PROBLEM: Marketing speak
  - REPLACE: "Sign In"
  
- **Password toggle emojis:** 🙈 and 👁️ (lines 197-198)
  - ASSESSMENT: Functional (aids recognition), KEEP but monitor total emoji count
  
- **Footer text:** "✨ Begin your journey" (line 228)
  - PROBLEM: Emoji + spiritual language
  - REPLACE: "Create account"

**Total Issues Found:** 3 instances

**Sign-Up Page (`app/auth/signup/page.tsx`):**

**Current Issues:**
- **Heading:** "Create Account" ✅ (CORRECT - matches vision)
- **Subheading:** "Start your journey of self-discovery" (line 112)
  - PROBLEM: Generic spiritual tagline (same as sign-in)
  - REPLACE: Remove entirely or use "Get started with Mirror of Dreams"
  
- **"Free Forever" badge:** Lines 113-116
  - PROBLEM: Marketing decoration with emoji ✨
  - REMOVE: Entire badge element (vision explicitly forbids this)
  
- **Submit button:** "Create Free Account" (line 264)
  - PROBLEM: "Free" is marketing emphasis (badge already removed)
  - REPLACE: "Create Account"
  
- **Password strength feedback:** "✓ Perfect!" (line 209)
  - ASSESSMENT: Functional feedback, borderline decorative
  - REPLACE: "✓ Valid" (more neutral)

**Total Issues Found:** 4 instances (including full badge removal)

---

#### 3. Dashboard Page (`app/dashboard/page.tsx`, `components/dashboard/`)

**Dashboard Main (`app/dashboard/page.tsx`):**

**Current Issues:**
- **Primary CTA:** "✨ Reflect Now" (line 129)
  - PROBLEM: Decorative emoji (sparkles)
  - REPLACE: "Reflect Now" (remove emoji)
  - NOTE: Vision allows max 2 emojis per page—reserve for category icons

**Total Issues Found:** 1 instance (but critical—most prominent button)

**Welcome Section (`components/dashboard/shared/WelcomeSection.tsx`):**

**Current Issues (Lines 39-74):**
- **Greeting options:**
  - "Early morning wisdom" (line 46) - mystical
  - "Rise and shine" (line 54) - casual but acceptable
  - "Peaceful morning" (line 52) - acceptable
  - "Good morning/afternoon/evening" - ✅ CORRECT
  - "Afternoon light" (line 59) - poetic but vague
  - "Evening calm" (line 64) - poetic but vague
  - "Night reflections" (line 69) - acceptable
  - **"Deep night wisdom"** (line 73) - **MYSTICAL MARKETING**
  
**REPLACE ALL with simple time-based:**
- 4-12: "Good morning"
- 12-17: "Good afternoon"
- 17-24: "Good evening"
- 0-4: "Good evening" (not "Deep night wisdom")

**Welcome Messages (Lines 79-156):**
- "Your journey of consciousness awaits..." (line 81) - marketing
- "Welcome to your infinite creative space..." (line 95) - flowery
- "Your boundless journey of creation continues..." (line 97) - excessive
- "Take your first step into conscious self-discovery..." (line 103) - marketing
- "Begin your enhanced journey of 5 monthly reflections..." (line 104) - marketing
- "Embark on your premium path of deep consciousness exploration..." (line 105) - marketing overload
- "Your monthly reflection journey awaits renewal..." (line 115) - poetic
- "Continue your sacred journey with X reflections remaining..." (line 119) - "sacred" is marketing
- "Your consciousness journey deepens with each reflection..." (line 123) - marketing
- "You're weaving beautiful patterns of self-awareness..." (line 127) - flowery
- "Almost at your monthly limit — X reflections left..." (line 132) - acceptable with slight edit
- "You've fully embraced this month's journey of self-discovery..." (line 135) - marketing
- "Your evolution report awaits — ready to reveal your growth patterns..." (line 140) - marketing
- "X more reflections until your next evolution insight..." (line 145) - acceptable
- "Your monthly sacred space for deep reflection..." (line 150) - "sacred" is marketing
- "Continue exploring your inner landscape with intention..." (line 151) - poetic
- "Dive deeper into the mysteries of your consciousness..." (line 152) - marketing overload
- "Your journey of self-discovery continues..." (line 155) - generic

**REPLACE with simple, specific messages:**
- First reflection: "Create your first reflection"
- Has reflections: "You have X reflections this month"
- Out of limit: "Monthly limit reached. X reflections used."
- Can generate evolution: "Evolution report ready to generate"
- Creator: "Unlimited reflections available"

**Button Text:**
- "✨ Reflect Now" (line 192) - remove emoji
- "💎 Upgrade Journey" (line 204) - remove emoji, change "Journey" to "Plan"
- "🎁 Gift Reflection" (line 211) - remove emoji

**Total Issues Found:** 24 instances in WelcomeSection alone

**Reflections Card (`components/dashboard/cards/ReflectionsCard.tsx`):**

**Current Issues:**
- **Empty state heading:** "Your Journey Awaits" (line 36)
  - PROBLEM: Generic spiritual language
  - REPLACE: "No reflections yet"
  
- **Empty state description:** "Create your first reflection to begin seeing yourself clearly." (line 37)
  - PROBLEM: Promise of "seeing yourself clearly" is unverified
  - REPLACE: "Create your first reflection to get started."
  
- **Empty state button:** "✨ Start Reflecting" (line 40)
  - PROBLEM: Decorative emoji
  - REPLACE: "Create Reflection"
  
- **Loading text:** "Loading your journey..." (line 49)
  - PROBLEM: "your journey" is marketing
  - REPLACE: "Loading reflections..."

**Total Issues Found:** 4 instances

**Evolution Card (`components/dashboard/cards/EvolutionCard.tsx`):**

**Current Issues:**
- **Eligible heading:** "Ready to Generate" (line 116) - ✅ acceptable
- **Eligible message:** "You can generate your first evolution report! Evolution reports reveal deep patterns in your consciousness journey." (lines 118-119)
  - PROBLEM: "deep patterns in your consciousness journey" is marketing
  - REPLACE: "You can generate your first evolution report based on your reflections."
  
- **Ineligible heading:** "Keep Reflecting" (line 127) - ✅ acceptable
- **Ineligible message:** "Create at least 4 reflections on a dream to unlock evolution reports. Each reflection adds depth to your journey." (lines 129-130)
  - PROBLEM: "adds depth to your journey" is marketing
  - REPLACE: "Create at least 4 reflections on a dream to generate an evolution report."
  
- **Button text:** "🦋 View Reports" (line 167) - decorative emoji
- **Button text:** "✨ Generate Report" (line 175) - decorative emoji
- **Button text:** "📝 Create Reflections" (line 183) - functional emoji (notebook), borderline acceptable

**Total Issues Found:** 4 instances

---

#### 4. Reflection Experience (`app/reflection/MirrorExperience.tsx`)

**Current Issues:**

**Dream Selection:**
- **Heading:** "Which dream are you reflecting on?" (line 280)
  - ASSESSMENT: ✅ Clear and direct
  
**Empty Dreams State:**
- **Text:** "No active dreams yet." (line 343) - ✅ acceptable
- **Button:** "Create Your First Dream" (line 349) - ✅ acceptable

**Question Placeholders:**
- Q1: "Describe the vision that calls to your soul..." (line 158)
  - PROBLEM: "calls to your soul" is mystical
  - REPLACE: "Describe your dream in detail..."
  
- Q2: "Share the steps you envision taking..." (line 165)
  - ASSESSMENT: ✅ acceptable
  
- Q3: "Describe how you want to relate to this aspiration..." (line 172)
  - PROBLEM: "aspiration" is somewhat flowery
  - REPLACE: "Describe your relationship with this dream..."
  
- Q4: "What will you give, sacrifice, or commit..." (line 179)
  - ASSESSMENT: ✅ acceptable (direct language)

**Tone Selection:**
- **Heading:** "Choose Your Reflection Tone" (line 403) - ✅ acceptable
- **Subheading:** "How shall the mirror speak to you?" (line 405)
  - PROBLEM: Poetic but vague ("the mirror speak")
  - REPLACE: "Select the tone for your AI reflection."

**Tone Descriptions:**
- "Sacred Fusion" - "Balanced wisdom and warmth" (line 409)
  - PROBLEM: "Sacred" and "wisdom" are marketing
  - REPLACE: "Fusion" - "Balanced and thoughtful"
  
- "Gentle Clarity" - "Compassionate and nurturing" (line 410)
  - ASSESSMENT: ✅ acceptable
  
- "Luminous Intensity" - "Direct and transformative" (line 411)
  - PROBLEM: "Luminous" and "transformative" are marketing
  - REPLACE: "Intense" - "Direct and challenging"

**Submit Button:**
- "🪞 Gaze into the Mirror" (line 471)
  - PROBLEM: Mystical language + decorative emoji
  - REPLACE: "Submit Reflection"

**Output View:**
- **Heading:** "Your Reflection" (line 499) - ✅ acceptable
- **Button:** "✨ Create New Reflection" (line 523)
  - PROBLEM: Decorative emoji
  - REPLACE: "Create New Reflection"
  
**Loading States:**
- "Revealing your reflection..." (line 487)
  - PROBLEM: Mystical ("revealing")
  - REPLACE: "Loading reflection..."

**Total Issues Found:** 10 instances

---

## Copy Guidelines for Consistency

### Core Principles (from Vision)

1. **Be Direct:** Say what you mean. No metaphors that require interpretation.
2. **Be Honest:** Only promise what you deliver. No "transformation" unless it actually transforms.
3. **Be Specific:** "8 reflections this month" not "weaving patterns of self-awareness."
4. **Be Respectful:** Users are intelligent. Don't condescend with mystical language.

### Forbidden Words & Phrases

**NEVER use:**
- "Sacred" (unless literally religious)
- "Journey" (use "reflections" or "progress")
- "Consciousness" / "soul" / "mystical" (too vague)
- "Transform" / "transformation" (unless proven)
- "Unlock" / "reveal" (gamification marketing)
- "Deep wisdom" / "inner landscape" (flowery)
- "Embrace" / "embark" (marketing verbs)
- "Calls to you" / "speaks to you" (mystical passivity)
- "Weaving patterns" (poetic nonsense)

**USE instead:**
- "Reflections" (not "journey")
- "Progress" (not "evolution of consciousness")
- "Understand" (not "unlock deep wisdom")
- "Create" (not "embark on")
- "See" (not "reveal" or "uncover")

### Emoji Rules (Max 2 Per Page)

**Functional Emojis (ALLOWED if under limit):**
- Category icons for dreams (🏃 health, 💼 career, etc.)
- Password visibility toggle (👁️, 🙈)
- Navigation icons (🏠 for home)

**Decorative Emojis (REMOVE):**
- Sparkles (✨) on buttons
- Gems (💎) as marketing decoration
- Plants (🌱) as metaphors
- All emoji in button labels (unless functional like category)

**Current Emoji Count Per Page:**
- Landing: ~6 emojis (OVER LIMIT)
- Sign-in: 3 emojis (1 OVER LIMIT)
- Sign-up: 5+ emojis including badge (WAY OVER LIMIT)
- Dashboard: 10+ emojis (WAY OVER LIMIT)
- Reflection: 8+ emojis (WAY OVER LIMIT)

### Button Text Standards

**Pattern:** `[Action] [Object]`

**Good Examples:**
- "Sign In" (not "Continue Your Journey")
- "Create Account" (not "Begin Your Journey")
- "Reflect Now" (not "✨ Gaze into the Mirror")
- "View Reports" (not "🦋 View Reports")
- "Create Reflection" (not "✨ Start Reflecting")

**Bad Examples:**
- "Upgrade Journey" → "Upgrade Plan"
- "Gift Reflection" → "Send Gift"
- "Explore Plans" → "View Plans"

---

## Files to Modify (Priority Order)

### CRITICAL (Iteration 2 - Must Fix)

1. **`components/portal/hooks/usePortalState.ts`** (Lines 214-247)
   - Replace all taglines with vision-aligned copy
   - Line 214: "Reflect. Understand. Evolve." (main tagline)
   - Line 215: "Free to start." (sub-tagline)
   - Remove all "journey," "sacred," "consciousness" language

2. **`app/auth/signup/page.tsx`** (Lines 110-116)
   - **REMOVE ENTIRE "Free Forever" badge** (vision explicitly forbids)
   - Line 112: Change subheading to "Get started" or remove
   - Line 264: Change button to "Create Account"

3. **`app/auth/signin/page.tsx`** (Lines 142, 214, 228)
   - Line 142: Remove subheading or change to "Sign in to your account"
   - Line 214: Change button to "Sign In"
   - Line 228: Change to "Create account" (remove emoji)

4. **`components/dashboard/shared/WelcomeSection.tsx`** (Lines 39-156)
   - Simplify ALL greetings to "Good [morning/afternoon/evening]"
   - Replace ALL welcome messages with specific, data-driven copy
   - Remove "journey," "sacred," "consciousness," "wisdom" throughout

5. **`app/dashboard/page.tsx`** (Line 129)
   - Remove ✨ emoji from "Reflect Now" button (most prominent CTA)

6. **`app/reflection/MirrorExperience.tsx`** (Multiple lines)
   - Line 158: "Describe your dream in detail..."
   - Line 405: "Select the tone for your AI reflection."
   - Line 409: "Fusion" - "Balanced and thoughtful"
   - Line 411: "Intense" - "Direct and challenging"
   - Line 471: "Submit Reflection"
   - Line 523: "Create New Reflection"
   - Line 487: "Loading reflection..."

### HIGH PRIORITY (Iteration 2 - Should Fix)

7. **`components/dashboard/cards/ReflectionsCard.tsx`** (Lines 36-49)
   - Line 36: "No reflections yet"
   - Line 37: "Create your first reflection to get started."
   - Line 40: "Create Reflection"
   - Line 49: "Loading reflections..."

8. **`components/dashboard/cards/EvolutionCard.tsx`** (Lines 118-130)
   - Line 118-119: "...based on your reflections."
   - Line 129-130: "...to generate an evolution report."
   - Remove decorative emojis from buttons

### MEDIUM PRIORITY (Post Iteration 2)

9. Other dashboard cards (UsageCard, DreamsCard, etc.)
10. Navigation components
11. Error messages and toast notifications

---

## Before/After Copy Recommendations

### Landing Page

| Element | BEFORE (Current) | AFTER (Vision-Aligned) |
|---------|------------------|------------------------|
| **Main tagline** | "Your dreams hold the mirror to who you're becoming." | "Reflect. Understand. Evolve." |
| **Sub-tagline** | "Start completely free. 90-second guided setup." | "Free to start." |
| **Loading text** | "Preparing your sacred space..." | "Loading..." |
| **Button (unauthenticated)** | "Reflect Me" | "Start Reflecting" |
| **Button (authenticated)** | "Continue Journey" | "Reflect Now" |
| **Secondary button** | "🌱 Start Free Forever" | "Create Account" |

### Auth Pages

| Element | BEFORE (Current) | AFTER (Vision-Aligned) |
|---------|------------------|------------------------|
| **Sign-in subheading** | "Continue your journey of self-discovery" | [Remove] or "Sign in to your account" |
| **Sign-in button** | "Continue Your Journey" | "Sign In" |
| **Sign-up subheading** | "Start your journey of self-discovery" | [Remove] or "Get started" |
| **"Free Forever" badge** | Entire badge with ✨ | [REMOVE COMPLETELY] |
| **Sign-up button** | "Create Free Account" | "Create Account" |
| **Footer link** | "✨ Begin your journey" | "Create account" |

### Dashboard

| Element | BEFORE (Current) | AFTER (Vision-Aligned) |
|---------|------------------|------------------------|
| **Greeting (night)** | "Deep night wisdom, Creator" | "Good evening, Ahiya" |
| **Welcome (first time)** | "Take your first step into conscious self-discovery..." | "Create your first reflection" |
| **Welcome (active)** | "Your consciousness journey deepens..." | "You have 8 reflections this month" |
| **Welcome (out of limit)** | "You've fully embraced this month's journey..." | "Monthly limit reached. 30 reflections used." |
| **Primary button** | "✨ Reflect Now" | "Reflect Now" |
| **Upgrade button** | "💎 Upgrade Journey" | "Upgrade Plan" |

### Reflection Page

| Element | BEFORE (Current) | AFTER (Vision-Aligned) |
|---------|------------------|------------------------|
| **Q1 placeholder** | "Describe the vision that calls to your soul..." | "Describe your dream in detail..." |
| **Q3 placeholder** | "Describe how you want to relate to this aspiration..." | "Describe your relationship with this dream..." |
| **Tone selection heading** | "How shall the mirror speak to you?" | "Select the tone for your AI reflection." |
| **Tone 1 name** | "Sacred Fusion" | "Fusion" |
| **Tone 1 description** | "Balanced wisdom and warmth" | "Balanced and thoughtful" |
| **Tone 3 name** | "Luminous Intensity" | "Intense" |
| **Tone 3 description** | "Direct and transformative" | "Direct and challenging" |
| **Submit button** | "🪞 Gaze into the Mirror" | "Submit Reflection" |
| **Output button** | "✨ Create New Reflection" | "Create New Reflection" |
| **Loading text** | "Revealing your reflection..." | "Loading reflection..." |

### Dashboard Cards

| Card | Element | BEFORE | AFTER |
|------|---------|--------|-------|
| **Reflections** | Empty heading | "Your Journey Awaits" | "No reflections yet" |
| **Reflections** | Empty description | "...begin seeing yourself clearly" | "...to get started" |
| **Reflections** | Empty button | "✨ Start Reflecting" | "Create Reflection" |
| **Reflections** | Loading | "Loading your journey..." | "Loading reflections..." |
| **Evolution** | Eligible message | "...deep patterns in your consciousness journey" | "...based on your reflections" |
| **Evolution** | Ineligible message | "Each reflection adds depth to your journey" | "...to generate an evolution report" |

---

## Complexity Assessment

### Copy Changes Complexity: MEDIUM

**Reasoning:**
- **Number of files:** 8 files require changes (critical + high priority)
- **Lines of code:** ~50 specific line changes across components
- **Scope:** Mostly string replacements (low risk)
- **Testing:** Visual review required (no unit tests for copy)
- **Risk:** Medium—wrong copy could confuse users

**Breakdown:**
- **Simple changes (30 instances):** Direct string replacement
  - Example: "Continue Your Journey" → "Sign In"
  - Time: 5-10 seconds per change
  
- **Moderate changes (15 instances):** Conditional logic update
  - Example: Welcome messages in WelcomeSection.tsx
  - Time: 2-3 minutes per change
  
- **Complex changes (2 instances):** Component removal
  - Example: "Free Forever" badge removal (lines 113-116)
  - Time: 5-10 minutes per change

**Estimated Time:**
- Simple changes: 30 × 10 sec = 5 minutes
- Moderate changes: 15 × 2.5 min = 37.5 minutes
- Complex changes: 2 × 7.5 min = 15 minutes
- **Total: ~60 minutes of pure editing**
- **Testing & review: 30 minutes**
- **Total with buffer: 2 hours**

### Impact: HIGH

**User Trust:**
- Current marketing speak creates false expectations
- Users feel manipulated by "sacred journey" language
- Clear copy builds trust through honesty

**Consistency:**
- Vision document specifies exact copy ("Reflect. Understand. Evolve.")
- Current implementation ignores vision completely
- Fix establishes clear pattern for future development

**Brand Positioning:**
- Current: Spiritual self-help app (compete with Headspace, Calm)
- Target: Honest reflection tool (unique positioning)
- Copy change is critical to brand differentiation

---

## Risks & Challenges

### Risk 1: Over-Correction to Sterile

**Description:** Removing all personality could make app feel cold and robotic

**Likelihood:** Medium

**Mitigation:**
- Keep functional warmth: "Good evening" not "18:32:15 UTC"
- Preserve specific context: "You have 8 reflections this month" not "COUNT: 8"
- Allow one personality element per page (vision allows 2 emojis)

### Risk 2: Inconsistent Implementation

**Description:** Some components may be missed, creating jarring inconsistency

**Likelihood:** High (47 instances identified)

**Mitigation:**
- Use grep to find all instances of forbidden words
- Create checklist from this report
- Visual review of every page after changes

### Risk 3: Copy Changes Break Layouts

**Description:** Shorter text might affect component spacing/alignment

**Likelihood:** Low (most components use flexbox)

**Mitigation:**
- Test responsive breakpoints after changes
- Focus on mobile (longest button text most likely to wrap)

### Risk 4: User Confusion from Abrupt Change

**Description:** Existing users (Ahiya as creator) might notice sudden shift

**Likelihood:** Low (only one user currently)

**Mitigation:**
- Not applicable for single-user testing environment
- For future launch, add changelog or announcement

---

## Recommendations for Planner

### 1. Treat Copy Changes as Separate Sub-Task

**Why:** Copy audit revealed 47 instances across 8 files—this deserves dedicated focus

**Suggestion:** 
- Sub-builder A: Design changes (emojis, animations, gradients)
- Sub-builder B: Copy changes (all text updates)
- Prevents conflicts and ensures systematic completion

### 2. Create Copy Validation Checklist

**Why:** Easy to miss instances when changing 47 strings

**Suggestion:**
- Generate checklist from this report (one item per file)
- Builder checks off each file after completion
- Final review against forbidden words list

### 3. Establish "Earned Beauty" Guidelines Before Starting

**Why:** Vision says "restraint" but doesn't define what's "earned"

**Suggestion:**
- Define which emojis are functional (category icons, password toggle)
- Define which gradients are functional (active state, focus)
- Document in design system before implementation

### 4. Prioritize Landing Page First

**Why:** First impression—if copy is off here, users never get to dashboard

**Suggestion:**
- Landing page copy changes → Test → Dashboard → Test → Reflection

### 5. Consider Copy A/B Testing Framework

**Why:** "Clear" is subjective—data would validate choices

**Suggestion:**
- Out of scope for iteration 2, but consider for future
- Track completion rates before/after copy changes
- Example: Does "Submit Reflection" convert better than "Gaze into the Mirror"?

### 6. Document "Voice & Tone" Guidelines

**Why:** Without guidelines, future features will drift back to marketing speak

**Suggestion:**
- Create `VOICE_AND_TONE.md` in project root
- Include this report's "Forbidden Words" and "Button Text Standards"
- Reference in contribution guidelines

---

## Questions for Planner

1. **Should we preserve ANY personality in copy?**
   - Example: "Good evening" vs "Evening" vs "18:32"
   - Recommendation: Keep natural greetings, remove mysticism

2. **What's the emoji budget per component?**
   - Vision says "max 2 per page" but dashboard has 6 cards
   - Is it 2 total or 2 per card?
   - Recommendation: 2 total per page (strict interpretation)

3. **How do we handle AI-generated reflection output?**
   - If AI says "sacred journey" in its response, do we filter it?
   - Or only control user-facing interface copy?
   - Recommendation: Interface only (AI can be poetic, UI should be direct)

4. **Should button text be title case or sentence case?**
   - "Sign In" vs "Sign in"
   - Current app is inconsistent
   - Recommendation: Title case for buttons, sentence case for body

5. **Do we need translations/i18n consideration?**
   - "Reflect. Understand. Evolve." is very English-centric
   - Out of scope for iteration 2?
   - Recommendation: Defer to post-MVP, but structure strings for future i18n

---

## Resource Map

### Critical Files for Copy Changes

**Must modify (CRITICAL):**
1. `/components/portal/hooks/usePortalState.ts` - Landing page taglines (lines 214-247)
2. `/app/auth/signup/page.tsx` - Remove "Free Forever" badge, fix button text
3. `/app/auth/signin/page.tsx` - Fix subheading and button text
4. `/components/dashboard/shared/WelcomeSection.tsx` - Replace all 24 marketing messages
5. `/app/dashboard/page.tsx` - Remove emoji from primary CTA
6. `/app/reflection/MirrorExperience.tsx` - Fix placeholders, tone descriptions, buttons

**Should modify (HIGH):**
7. `/components/dashboard/cards/ReflectionsCard.tsx` - Fix empty state copy
8. `/components/dashboard/cards/EvolutionCard.tsx` - Fix eligibility messages

### Search Patterns for Validation

**After copy changes, grep for these to ensure nothing missed:**

```bash
# Forbidden words
rg -i "sacred|consciousness|journey|mystical|unlock|reveal|embrace|embark|weaving|calls to you" --type tsx

# Decorative emojis in buttons
rg "✨|💎|🌱|🦋" --type tsx

# Marketing phrases
rg "self-discovery|inner landscape|deep wisdom|transformation" --type tsx

# Check emoji count per file
rg -o "[\u{1F000}-\u{1F9FF}]" app/dashboard/page.tsx | wc -l
```

### Testing Checklist

**Visual review after changes:**
- [ ] Landing page (unauthenticated): Tagline is "Reflect. Understand. Evolve."
- [ ] Landing page (authenticated): No mystical greetings
- [ ] Sign-in page: No "journey" language, button says "Sign In"
- [ ] Sign-up page: NO "Free Forever" badge visible
- [ ] Dashboard greeting: "Good [time], [Name]" format only
- [ ] Dashboard welcome: Specific data ("8 reflections") not flowery
- [ ] Dashboard primary button: "Reflect Now" with NO emoji
- [ ] Reflection questions: No "calls to your soul" language
- [ ] Reflection submit: "Submit Reflection" not "Gaze into the Mirror"
- [ ] Evolution card: No "consciousness journey" language
- [ ] Total emoji count: Max 2 per page (verify each page)

---

## Summary Statistics

**Total Marketing Speak Instances:** 47
- Landing page: 12 instances
- Sign-in page: 3 instances
- Sign-up page: 4 instances (including badge removal)
- Dashboard main: 1 instance (critical button)
- Welcome section: 24 instances
- Reflections card: 4 instances
- Evolution card: 4 instances
- Reflection page: 10 instances

**Files Requiring Changes:** 8 critical files, 10+ total

**Estimated Implementation Time:** 2 hours (editing + testing)

**Priority:** HIGH - Copy undermines entire user experience

**Complexity:** MEDIUM - Many instances but mostly simple string replacements

**Impact:** HIGH - Builds trust, aligns with vision, establishes brand differentiation

---

**Explorer 3 Assessment:** Mirror of Dreams copy requires systematic overhaul. Current marketing speak creates false expectations and undermines trust. Vision's "Reflect. Understand. Evolve." is not implemented anywhere. Recommend dedicated sub-builder for copy changes with validation checklist to ensure all 47 instances are addressed.

**Status:** COMPLETE
**Next Step:** Planner synthesis and builder assignment
