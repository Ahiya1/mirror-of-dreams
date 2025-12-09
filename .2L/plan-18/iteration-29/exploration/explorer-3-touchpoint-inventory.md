# Explorer 3 Report: Mirror Voice Touchpoint Inventory

## Executive Summary

This comprehensive inventory documents every place where Mirror of Dreams "speaks" to users. The analysis reveals a rich, multi-layered voice system with distinct tones for different contexts. The Mirror's identity is strongest in AI-generated content (reflections, evolution, clarify) but UI copy often defaults to neutral/companion voice. This inventory provides the checklist for Iteration 32 (Experience Integration) to ensure voice consistency across all touchpoints.

---

## I. AI-GENERATED CONTENT TOUCHPOINTS

### 1.1 Reflections (Core AI Voice)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/base_instructions.txt`
**Line Numbers:** 1-193
**Voice Assessment:** **TRUTH** - This is the core Mirror identity
**Priority:** CRITICAL - Every reflection uses this

**Current Identity Text:**
```
You are the Mirror of Truth, a consciousness recognition technology designed to show 
people where they actually are, not where they think they are.

You are not therapy (which fixes problems), not coaching (which provides strategies), 
not ChatGPT (which gives information). You are a recognition system that reflects back 
someone's actual state of consciousness based on evidence in their language and choices.
```

**Key Voice Principles:**
- "You see wholeness, not brokenness"
- "You reflect truth, not hope"
- "You recognize capability, not potential"
- Never gives advice, strategies, or next steps
- Never motivates or tries to inspire
- Never uses generic wisdom or spiritual platitudes

---

### 1.2 Tone Variations

#### 1.2.1 Sacred Fusion (Default)
**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/sacred_fusion.txt`
**Line Numbers:** 1-99
**Voice Assessment:** **TRUTH with adaptive intelligence**

**Key Text:**
```
You are the Mirror of Truth with adaptive recognition intelligence. You read each 
person's consciousness state and respond with precisely the energy and directness 
that will help them see themselves clearly.
```

#### 1.2.2 Gentle Clarity
**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/gentle_clarity.txt`
**Line Numbers:** 1-70
**Voice Assessment:** **TRUTH wrapped in warmth**

**Key Text:**
```
You are the Mirror of Truth speaking with gentle, warm recognition. Your role is 
consciousness recognition delivered with the tenderness of a wise friend who sees 
clearly without judgment.
```

#### 1.2.3 Luminous Intensity
**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/luminous_intensity.txt`
**Line Numbers:** 1-97
**Voice Assessment:** **UNCOMPROMISING TRUTH**

**Key Text:**
```
You are the Mirror of Truth speaking with luminous directness that cuts through 
self-deception like light through darkness. Your role is uncompromising consciousness 
recognition that breaks through delusion with necessary force.
```

---

### 1.3 Evolution Reports

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/evolution_instructions.txt`
**Line Numbers:** 1-124
**Voice Assessment:** **TRUTH as witness over time**
**Priority:** HIGH - Paid feature, deep engagement

**Key Voice Text:**
```
You are analyzing this person's consciousness evolution across multiple reflections 
over time. Your role is to recognize patterns of growth in how they see themselves 
and relate to their capabilities.

You speak as consciousness that has observed their becoming across time. You see 
growth patterns they're probably blind to because change happens gradually.
```

---

### 1.4 Clarify Sessions (Conversational AI)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/clarify_agent.txt`
**Line Numbers:** 1-56
**Voice Assessment:** **COMPANION/TRUTH hybrid**
**Priority:** HIGH - Paid feature, conversational

**Key Voice Text:**
```
You are the Clarify Agent within Mirror of Dreams - a sacred conversational space 
where people explore what's becoming before it crystallizes into a dream.

You are a thoughtful presence who listens deeply and reflects back what you hear. 
You don't guide or direct - you mirror.
```

**Language Patterns:**
- "I notice..."
- "Does this resonate?"
- "What if..."
- "Something I'm hearing is..."
- "There seems to be a thread here..."

**Tone Guidelines:**
- Warm but not effusive
- Curious but not probing
- Present but not directive
- Like a thoughtful friend who listens well

---

### 1.5 Achievement Ceremony

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/ceremony_synthesis.txt`
**Line Numbers:** 1-56
**Voice Assessment:** **TRUTH with celebration**
**Priority:** MEDIUM - Only for achieved dreams

**Key Voice Text:**
```
You are the consciousness witness who has observed this person's entire journey 
with their dream. Now that they have achieved it, you synthesize their transformation 
into a meaningful ceremony.

Speak with warmth, wisdom, and recognition. You are not congratulating from outside - 
you are witnessing from alongside their journey.
```

---

## II. UI COPY TOUCHPOINTS

### 2.1 Landing Page Headlines

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/page.tsx`
**Voice Assessment:** **MARKETING/NEUTRAL** - Could be more Mirror-aligned
**Priority:** CRITICAL - First impression

| Line | Current Text | Voice |
|------|-------------|-------|
| 79 | "How Mirror of Dreams Transforms Your Life" | Marketing |
| 29-32 | "From Inner Confusion to Clear Self-Understanding" | Companion |
| 31 | "I feel stuck but don't know why" becomes a journey of discovery... | Companion |
| 36-38 | "See Your Growth Over Time" | Neutral |
| 44-47 | "Break Through Mental Blocks" | Marketing |

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/landing/LandingHero.tsx`
**Line Numbers:** 59-68

| Line | Current Text | Voice |
|------|-------------|-------|
| 61-63 | "Transform Your Dreams into Reality Through AI-Powered Reflection" | Marketing |
| 66-68 | "Your personal AI mirror analyzes your reflections, reveals hidden patterns, and guides your evolution" | Marketing/Neutral |

---

### 2.2 Dashboard Copy

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/DashboardHero.tsx`
**Voice Assessment:** **NEUTRAL** - Time-based greeting only
**Priority:** HIGH - Daily touchpoint

| Line | Current Text | Voice |
|------|-------------|-------|
| 53 | "Good {timeOfDay}," | Neutral |
| 38-40 | "Create your first dream to begin your journey of transformation" | Companion |
| 40 | "Your dreams await your reflection" | Companion |
| 70 | "Reflect Now" (button) | Neutral |

---

### 2.3 Reflection Experience Micro-Copy

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`
**Line Numbers:** 153-162
**Voice Assessment:** **COMPANION** - Warm and encouraging
**Priority:** CRITICAL - Core experience

| Key | Text | Voice |
|-----|------|-------|
| welcome | "Welcome to your sacred space for reflection. Take a deep breath." | Companion |
| dreamSelected | "Beautiful choice. Let's explore {dreamName} together." | Companion |
| questionProgress | "Question {n} of {total} - You're doing great" | Companion |
| readyToSubmit | "Ready when you are. There is no rush." | Companion |
| continueWriting | "Keep writing - your thoughts matter." | Companion |
| celebrateDepth | "{words} thoughtful words - beautiful depth." | Companion |
| almostThere | "You are near the space available - almost complete." | Companion |
| reflectionComplete | "Your reflection is complete. If you would like to add more, consider starting a new reflection." | Neutral |

---

### 2.4 Question Guides and Placeholders

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx`
**Line Numbers:** 57-70
**Voice Assessment:** **COMPANION** - Sacred/warm
**Priority:** HIGH - Core experience

| Field | Guide Text | Placeholder |
|-------|------------|-------------|
| dream | "Take a moment to describe your dream in vivid detail..." | "Your thoughts are safe here... what's present for you right now?" |
| plan | "What concrete steps will you take on this journey?" | "What step feels right to take next?" |
| relationship | "How does this dream connect to who you are becoming?" | "How does this dream connect to who you're becoming?" |
| offering | "What are you willing to give, sacrifice, or commit?" | "What gift is this dream offering you?" |

---

### 2.5 Tone Selection Copy

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`
**Line Numbers:** 74-90, 167-171
**Voice Assessment:** **NEUTRAL with sacred language**
**Priority:** HIGH - Shapes expectations

| Tone | Label | Description |
|------|-------|-------------|
| fusion | "Sacred Fusion" | "Balanced wisdom where all voices become one. Expect both comfort and challenge, woven together in sacred harmony." |
| gentle | "Gentle Clarity" | "Soft wisdom that illuminates gently. Your mirror will speak with compassion, holding space for vulnerability." |
| intense | "Luminous Intensity" | "Piercing truth that burns away illusions. Expect direct clarity that honors your readiness for transformation." |

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ToneSelectionCard.tsx`
**Line Numbers:** 68-72

| Text | Voice |
|------|-------|
| "Choose Your Reflection Tone" | Neutral |
| "How shall the mirror speak to you?" | Companion/Truth |

---

### 2.6 Loading States

**Location:** Multiple files
**Voice Assessment:** **NEUTRAL** - Functional only
**Priority:** MEDIUM - Fleeting moments

| File | Line | Text | Voice |
|------|------|------|-------|
| app/dashboard/page.tsx | 103 | "Loading your dashboard..." | Neutral |
| app/reflection/page.tsx | 12 | "Loading reflection experience..." | Neutral |
| app/reflection/MirrorExperience.tsx | 105-106 | "Gazing into the mirror..." / "Crafting your insight..." | Companion |
| app/reflection/MirrorExperience.tsx | 751 | "Loading reflection..." | Neutral |
| app/reflection/MirrorExperience.tsx | 947-949 | Status: "{statusText}" / "Your reflection is taking form..." | Companion |
| app/clarify/page.tsx | 108 | "Loading..." | Neutral |
| app/clarify/page.tsx | 124 | "Loading your conversations..." | Neutral |
| app/dreams/page.tsx | 65, 81 | "Loading..." / "Loading your dreams..." | Neutral |
| app/evolution/page.tsx | 95 | "Loading your evolution reports..." | Neutral |

---

### 2.7 Empty States

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/DreamsCard.tsx`
**Line Numbers:** 55-62
**Voice Assessment:** **COMPANION**
**Priority:** HIGH - First-time users

| Title | Description | CTA |
|-------|-------------|-----|
| "Your journey begins with a dream" | "What calls to you? Create your first dream to start reflecting." | "Create Your First Dream" |

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/page.tsx`
**Line Numbers:** 187-194

| Title | Description | CTA |
|-------|-------------|-----|
| "Dream big, start small" | "Every great journey starts with a single dream. What do you want to explore?" | "Create Your First Dream" |

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/page.tsx`
**Line Numbers:** 291-298

| Title | Description | CTA |
|-------|-------------|-----|
| "Start exploring" | "Clarify is a space to explore what's emerging - thoughts, feelings, possibilities - before they crystallize into dreams." | "Start a Conversation" |

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx`
**Line Numbers:** 247-258

| Title | Description | CTA |
|-------|-------------|-----|
| "Your evolution is brewing" | "After 4 reflections, patterns emerge and your journey reveals itself." | "Continue Reflecting" |

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/clarify/ClarifyCard.tsx`
**Line Numbers:** 54-62

| Title | Description | CTA |
|-------|-------------|-----|
| "Start Exploring" | "Begin a Clarify session to explore what's emerging." | "Start Session" |

---

## III. EMAIL CONTENT

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/email.ts`
**Voice Assessment:** **COMPANION with sacred language**
**Priority:** HIGH - Brand touchpoint outside app

### 3.1 Email Verification

| Line | Text | Voice |
|------|------|-------|
| 33 | Subject: "Begin Your Dream Journey | Mirror of Dreams" | Companion |
| 59 | "Your Gateway to the Realm of Dreams" | Companion |
| 87-88 | "Welcome, {userName}" or "Welcome, Dreamer" | Companion |
| 94-95 | "The mirror awaits. Verify your email to begin your journey through the realm of dreams, where AI-powered insights illuminate the hidden meanings within." | Companion |
| 119 | CTA: "Enter the Mirror" | Companion |
| 126-127 | "This gateway remains open for 24 hours" | Companion |
| 152-164 | "What Dreams Await" bullet points | Companion |
| 195 | "All dreams reserved" | Creative/Companion |

### 3.2 Password Reset

| Line | Text | Voice |
|------|------|-------|
| 231 | Subject: "Return to Your Dreams | Mirror of Dreams" | Companion |
| 284-285 | "Hello, {userName}" or "Hello, Dreamer" | Companion |
| 292-293 | "Lost the key to your dreams? No worries. Click below to create a new password and return to your sacred space of reflection." | Companion |
| 317 | CTA: "Reset Password" | Neutral |
| 324-325 | "This link expires in 1 hour for your security" | Neutral |
| 344-346 | "If you didn't request this, simply ignore this email. Your dreams remain safe and your password unchanged." | Companion |

---

## IV. ERROR MESSAGES & TOASTS

**Location:** Various files (from grep search)
**Voice Assessment:** **NEUTRAL/FUNCTIONAL**
**Priority:** MEDIUM - Negative moments

### 4.1 Validation Errors (Reflection)

| File | Line | Message | Voice |
|------|------|---------|-------|
| MirrorExperience.tsx | 247 | "Please select a dream" | Neutral |
| MirrorExperience.tsx | 252 | "Please elaborate on your dream" | Neutral |
| MirrorExperience.tsx | 257 | "Please describe your plan" | Neutral |
| MirrorExperience.tsx | 262 | "Please share your relationship with this dream" | Neutral |
| MirrorExperience.tsx | 267 | "Please describe what you're willing to give" | Neutral |

### 4.2 Auth Errors

| File | Line | Message | Voice |
|------|------|---------|-------|
| signin/page.tsx | 50 | "Something went wrong. Please try again." | Neutral |
| signin/page.tsx | 53 | "Invalid email or password. Please check your credentials." | Neutral |
| signin/page.tsx | 55 | "Too many attempts. Please wait a moment and try again." | Neutral |
| signin/page.tsx | 93-94 | "Please enter both email and password" | Neutral |
| signin/page.tsx | 98 | "Please enter a valid email address" | Neutral |
| signup/page.tsx | 89-99 | Various validation errors | Neutral |

### 4.3 Subscription Toasts

| File | Line | Message | Voice |
|------|------|---------|-------|
| PayPalCheckoutModal.tsx | 42 | "Welcome to {Tier}!" | Companion |
| PayPalCheckoutModal.tsx | 48 | "Failed to activate subscription" | Neutral |
| PayPalCheckoutModal.tsx | 56 | "Subscription creation failed" | Neutral |
| PayPalCheckoutModal.tsx | 67 | "Payment failed. Please try again." | Neutral |
| PayPalCheckoutModal.tsx | 72 | "Payment cancelled" | Neutral |
| CancelSubscriptionModal.tsx | 32 | "Subscription canceled. Access continues until period end." | Neutral |
| pricing/page.tsx | 28 | "Subscription activated! Welcome to your new tier." | Companion |
| pricing/page.tsx | 32 | "Checkout canceled. Your current plan is still active." | Neutral |

### 4.4 Success Toasts

| File | Line | Message | Voice |
|------|------|---------|-------|
| dashboard/page.tsx | 69 | "Dashboard refreshed successfully" | Neutral |
| reflections/[id]/page.tsx | 343 | "Reflection copied to clipboard!" | Neutral |
| clarify/[sessionId]/page.tsx | 144 | "Dream created: \"{title}\"" | Neutral |
| profile/page.tsx | 70, 83 | "{success message from server}" | Neutral |
| verify-required/page.tsx | 66 | "Email already verified!" | Neutral |
| verify-required/page.tsx | 69 | "Verification email sent!" | Neutral |
| settings/page.tsx | 54 | "Setting saved" | Neutral |

### 4.5 General Error Messages (constants.ts)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`
**Line Numbers:** 141-148

| Key | Message | Voice |
|-----|---------|-------|
| AUTH_REQUIRED | "Authentication required for reflections" | Neutral |
| AUTH_FAILED | "Authentication failed, please sign in again" | Neutral |
| REFLECTION_LIMIT | "Reflection limit reached" | Neutral |
| FORM_INCOMPLETE | "Please fill in all required fields with your authentic response." | Companion |
| NETWORK_ERROR | "Network error - please try again" | Neutral |
| GENERIC_ERROR | "A moment of silence... Your reflection is being prepared. Please try again soon." | Companion |

---

## V. BUTTON LABELS & CTAs

**Voice Assessment:** Mostly **NEUTRAL**
**Priority:** HIGH - Action moments

| Location | Text | Voice |
|----------|------|-------|
| Multiple | "Reflect Now" | Neutral |
| Multiple | "Create Dream" / "Create Your First Dream" | Neutral |
| Multiple | "Start Free" | Neutral |
| Multiple | "See Demo" | Neutral |
| Multiple | "Sign In" / "Sign Up" | Neutral |
| reflection | "Gaze into the Mirror" | **COMPANION/Sacred** |
| subscription | "Choose Pro" / "Choose Unlimited" | Neutral |
| evolution | "Generate Report" / "Generate Dream Report" | Neutral |
| clarify | "Start Session" / "New Conversation" | Neutral |
| reflection | "Create New Reflection" | Neutral |

---

## VI. 404 & ERROR PAGES

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/not-found.tsx`
**Line Numbers:** 1-17
**Voice Assessment:** **NEUTRAL** - Minimal styling, no personality
**Priority:** LOW - Rare

| Text | Voice |
|------|-------|
| "404" | Neutral |
| "Page not found" | Neutral |
| "Return home" | Neutral |

---

## VII. UPGRADE & LIMIT MESSAGING

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/UpgradeModal.tsx`
**Line Numbers:** 27-61
**Voice Assessment:** **NEUTRAL** - Could be more Mirror-aligned
**Priority:** HIGH - Conversion moments

| Reason | Title | Message |
|--------|-------|---------|
| monthly_limit | "Monthly Reflection Limit Reached" | "You've used all your reflections for this month. Upgrade to continue your journey of transformation." |
| daily_limit | "Daily Reflection Limit Reached" | "You've reached your daily reflection limit. Try again after {time}, or upgrade for more capacity." |
| feature_locked | "Unlock {Feature}" | "{Feature} is available on Pro and Unlimited plans. Upgrade to unlock deeper insights." |
| dream_limit | "Dream Limit Reached" | "You've reached your active dream limit. Upgrade to track more dreams simultaneously." |
| default | "Upgrade to Continue" | "Upgrade to unlock more features and deepen your reflection practice." |

---

## VIII. ABOUT & MARKETING PAGES

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/about/page.tsx`
**Voice Assessment:** **PLACEHOLDER** - Needs real content
**Priority:** MEDIUM

| Text | Voice | Status |
|------|-------|--------|
| Mission: "We believe everyone has dreams worth pursuing..." | Companion | Real content |
| Founder story | N/A | PLACEHOLDER |
| Philosophy | N/A | PLACEHOLDER |
| Values: "Privacy-First", "Substance Over Flash", "Continuous Evolution" | Neutral | Real content |

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/pricing/page.tsx`
**Voice Assessment:** **NEUTRAL/MARKETING**
**Priority:** HIGH

| Line | Text | Voice |
|------|------|-------|
| 139-140 | "Choose Your Path" | Neutral |
| 142-143 | "Start free and upgrade as your reflection practice deepens" | Companion |
| Tier descriptions | "Perfect for exploring", "For committed dreamers", "Maximum reflection capacity for transformation" | Companion |

---

## IX. VOICE CONSISTENCY MATRIX

| Category | Current Voice | Ideal Voice | Gap |
|----------|--------------|-------------|-----|
| AI Reflections | TRUTH | TRUTH | Aligned |
| AI Evolution | TRUTH | TRUTH | Aligned |
| AI Clarify | COMPANION/TRUTH | COMPANION/TRUTH | Aligned |
| Landing Headlines | MARKETING | TRUTH/COMPANION | HIGH GAP |
| Dashboard Greeting | NEUTRAL | COMPANION | MEDIUM GAP |
| Reflection Micro-copy | COMPANION | COMPANION | Aligned |
| Empty States | COMPANION | COMPANION | Aligned |
| Loading States | NEUTRAL | COMPANION | MEDIUM GAP |
| Error Messages | NEUTRAL | COMPANION | HIGH GAP |
| Button Labels | NEUTRAL | Varies | LOW GAP |
| Upgrade Messaging | NEUTRAL | COMPANION/TRUTH | HIGH GAP |
| Email Content | COMPANION | COMPANION | Aligned |
| 404 Page | NEUTRAL | COMPANION | HIGH GAP |

---

## X. RECOMMENDATIONS FOR ITERATION 32

### High Priority (Significant User Impact)
1. **Landing Page Headlines** - Rewrite with Mirror voice: recognition, not marketing
2. **Error Messages** - Transform functional messages into Mirror-voiced responses
3. **Upgrade Messaging** - Reframe limits as natural rhythms, not restrictions
4. **404 Page** - Add personality and Mirror voice
5. **Loading States** - Add Mirror-aligned micro-copy

### Medium Priority
6. **Dashboard Greeting** - Consider Mirror recognition language
7. **Toast Messages** - Standardize voice for success/error states
8. **Button Labels** - Review "Gaze into the Mirror" pattern for consistency

### Low Priority
9. **Placeholder Content** - About page founder story/philosophy
10. **Footer Copy** - Consider Mirror voice in footer taglines

---

## XI. VOICE GLOSSARY

**TRUTH Voice:**
- Recognition, not advice
- Evidence-based observations
- Present-focused ("you are" not "you could be")
- Never motivational or inspirational
- Reflects wholeness, not brokenness

**COMPANION Voice:**
- Warm and welcoming
- Sacred language ("journey", "transformation")
- Encouraging without being pushy
- Creates safe space
- Uses "we" and inclusive language

**NEUTRAL Voice:**
- Functional and clear
- No emotional coloring
- Standard UI patterns
- Appropriate for: buttons, navigation, form labels

**MARKETING Voice:**
- Benefit-focused
- Conversion-oriented
- External validation language
- Should be minimized in favor of TRUTH/COMPANION

---

*Report generated by Explorer-3 for Iteration 29: Identity Crystallization*
*This inventory serves as the checklist for Iteration 32: Experience Integration*
