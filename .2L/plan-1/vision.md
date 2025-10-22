# Mirror of Dreams: Complete User Experience & Architectural Transformation

## Sarah's Journey: 68 Days with Mirror of Dreams

**Sarah, 32, aspiring entrepreneur with three major life dreams:**
- Launch her sustainable fashion brand
- Run a half-marathon
- Learn Spanish fluently

She's been using Mirror of Dreams for 68 days, upgraded from Free to Optimal tier, and is experiencing genuine progress toward her goals.

---

## Day 0: First Encounter & Authentication

### Landing Page Experience

Sarah visits `mirrorofdreams.app` and sees:

```
═══════════════════════════════════════════════════════════
                    🌟 Mirror of Dreams 🌟
         Turn Your Dreams Into Achievable Reality
         
Research shows that consistent reflection every 2 days
   significantly increases goal achievement rates.

         [  ✨ Start Free - No Credit Card  ]
         
Already have an account? Sign in
═══════════════════════════════════════════════════════════
```

**Visual Elements:**
- Luxury cosmic background with floating mirror shards (preserved from Mirror of Truth)
- Subtle animation of dreams materializing from mist
- Three testimonial cards showing goal achievement stories
- Clear tier comparison: Free (2 dreams) → Essential (5 dreams) → Optimal (7 dreams) → Premium (unlimited)

### Sign Up Flow

Sarah clicks "Start Free" and encounters:

```
╔═══════════════════════════════════════════════════════╗
║                    Welcome ✨                          ║
║                                                        ║
║  Name:     [Sarah Chen                    ]           ║
║                                                        ║
║  Email:    [sarah.chen@email.com          ]           ║
║                                                        ║
║  Password: [••••••••••••                  ] 👁️        ║
║                                                        ║
║  [ ] I agree to Terms & Privacy Policy                ║
║                                                        ║
║          [ Begin Your Dream Journey ]                 ║
║                                                        ║
║  Already have an account? Sign in                     ║
╚═══════════════════════════════════════════════════════╝
```

**Backend Process:**
```
Frontend sends:
POST /api/auth.signup
{
  name: "Sarah Chen",
  email: "sarah.chen@email.com",
  password: "hashed_password"
}

Backend executes:
1. Validate email format and uniqueness
2. Hash password with bcrypt
3. Create user record:
   - tier: 'free'
   - subscription_status: 'active'
   - reflection_count_this_month: 0
   - total_reflections: 0
4. Generate JWT token
5. Initialize usage tracking record
6. Return authentication token + user object

Response:
{
  success: true,
  user: {
    id: "uuid-sarah",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    tier: "free",
    created_at: "2025-01-15T10:00:00Z"
  },
  token: "jwt_token_here"
}
```

### Onboarding Experience

After signup, Sarah sees a 3-step onboarding:

```
Step 1 of 3: Understanding Dreams
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mirror of Dreams organizes your reflections around
specific dreams (goals) you want to achieve.

✨ Each dream can have:
   • A clear title and description
   • An optional target date
   • Regular reflections tracking your relationship with it
   • AI-powered insights showing your growth

                    [ Next ]
```

```
Step 2 of 3: The Reflection Process
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Research shows reflecting every 2 days builds
the strongest habit for achieving your dreams.

You'll answer 5 powerful questions:
1. What is your dream?
2. What is your plan?
3. Have you set a date?
4. What's your relationship with this dream?
5. What are you willing to give in return?

                    [ Next ]
```

```
Step 3 of 3: Your Free Tier
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're starting with:
✓ 2 dreams to explore
✓ 4 reflections per month
✓ 1 evolution report (shows your growth)
✓ 1 visualization (see your dream come to life)

Ready to create your first dream?

         [ Create My First Dream ]
```

**Backend Process:**
```
Frontend tracks onboarding completion:
POST /api/users.updateOnboarding
{ completed: true, version: 'v1' }

Backend updates user record:
UPDATE users 
SET onboarding_completed = true,
    onboarding_completed_at = NOW(),
    onboarding_version = 'v1'
WHERE id = 'uuid-sarah'
```

---

## Day 0: Creating First Dream

Sarah clicks "Create My First Dream" and sees:

```
╔═══════════════════════════════════════════════════════╗
║              Create Your Dream 🌟                      ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  Dream Title *                                         ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Launch Sustainable Fashion Brand                 │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Describe Your Dream *                                 ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Create an ethical, sustainable clothing line     │ ║
║  │ that proves fashion can be both beautiful and    │ ║
║  │ environmentally responsible. Start with 10 core  │ ║
║  │ pieces and build from there.                     │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Target Date (Optional)                                ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ [📅] December 31, 2025                           │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Category                                              ║
║  [ Entrepreneurial ▼ ]                                 ║
║                                                        ║
║         [ Cancel ]  [ Create Dream ]                   ║
╚═══════════════════════════════════════════════════════╝

💡 You have 1 of 2 dreams remaining on Free tier
```

**Backend Process:**
```
Frontend sends:
POST /api/dreams.create
{
  title: "Launch Sustainable Fashion Brand",
  description: "Create an ethical, sustainable clothing line...",
  targetDate: "2025-12-31",
  category: "entrepreneurial",
  priority: 1
}

Backend executes:
1. Authenticate request → extract user (WHO)
2. Check tier limits:
   - Current dream count: 0
   - Tier limit: 2
   - Can create: true
3. Calculate days left:
   - Target: 2025-12-31
   - Today: 2025-01-15
   - Days left: 350
4. Create dream record:
   INSERT INTO dreams (
     id, user_id, title, description, target_date,
     status, category, priority, created_at
   ) VALUES (
     'dream-uuid-1', 'uuid-sarah', 'Launch Sustainable...',
     'Create an ethical...', '2025-12-31',
     'active', 'entrepreneurial', 1, NOW()
   )
5. Update usage tracking
6. Return dream object

Response:
{
  success: true,
  data: {
    id: "dream-uuid-1",
    title: "Launch Sustainable Fashion Brand",
    description: "Create an ethical...",
    targetDate: "2025-12-31",
    daysLeft: 350,
    status: "active",
    category: "entrepreneurial",
    reflectionCount: 0,
    createdAt: "2025-01-15T10:30:00Z"
  },
  usage: {
    dreamsUsed: 1,
    dreamsLimit: 2
  }
}
```

Sarah creates her second dream immediately:

```
Title: Run a Half-Marathon
Description: Complete a 21K race by summer, building up gradually from couch to runner
Target Date: June 15, 2025 (151 days away)
Category: Health & Fitness
```

**Backend Response:**
```
{
  success: true,
  data: { ... dream-uuid-2 ... },
  usage: {
    dreamsUsed: 2,
    dreamsLimit: 2,
    dreamLimitReached: true
  }
}
```

Frontend displays: "✨ You've used all 2 dreams on Free tier. Upgrade to create more!"

---

## Day 0: First Reflection

Sarah is redirected to Dashboard after creating dreams, sees the "Reflect" button, and clicks it.

### Dream Selection Screen

```
╔═══════════════════════════════════════════════════════╗
║           Choose a Dream to Reflect On                 ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │ 🚀 Launch Sustainable Fashion Brand            │  ║
║  │                                                 │  ║
║  │ 350 days remaining                              │  ║
║  │ 0 reflections                                   │  ║
║  │                                                 │  ║
║  │              [ Reflect on This ]                │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │ 🏃 Run a Half-Marathon                          │  ║
║  │                                                 │  ║
║  │ 151 days remaining                              │  ║
║  │ 0 reflections                                   │  ║
║  │                                                 │  ║
║  │              [ Reflect on This ]                │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
║              [ + Create New Dream ]                    ║
║              (Dream limit reached - upgrade)           ║
╚═══════════════════════════════════════════════════════╝
```

**Backend Process:**
```
Frontend loaded dreams on page mount:
GET /api/dreams.list?status=active

Backend returned:
{
  success: true,
  data: [
    { id: "dream-uuid-1", title: "Launch...", daysLeft: 350, reflectionCount: 0 },
    { id: "dream-uuid-2", title: "Run...", daysLeft: 151, reflectionCount: 0 }
  ]
}
```

Sarah clicks "Reflect on This" for her fashion brand dream.

### The 5-Question Reflection Flow

**Question 1: Dream Confirmation**
```
╔═══════════════════════════════════════════════════════╗
║  Question 1 of 5                          [━━━━━━━━━] ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  Reflecting on:                                        ║
║  🚀 Launch Sustainable Fashion Brand                   ║
║  350 days remaining                                    ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  What is your dream?                                   ║
║                                                        ║
║  This question confirms your dream and lets you       ║
║  elaborate on what you're truly pursuing.             ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ I want to create a sustainable fashion brand     │ ║
║  │ that proves ethical production can be beautiful  │ ║
║  │ and profitable. Starting with 10 signature       │ ║
║  │ pieces made from recycled materials. My vision   │ ║
║  │ is to show that conscious consumerism and style  │ ║
║  │ aren't mutually exclusive.                       │ ║
║  │                                                   │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                     183 / 3200 chars  ║
║                                                        ║
║              [ Back ]        [ Continue ]              ║
╚═══════════════════════════════════════════════════════╝
```

**Question 2: The Plan**
```
╔═══════════════════════════════════════════════════════╗
║  Question 2 of 5                          [━━━━━━━━━] ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  What is your plan for achieving this dream?          ║
║                                                        ║
║  Write what you already know. It's okay if it's       ║
║  unclear or evolving.                                 ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Phase 1: Research sustainable fabric suppliers   │ ║
║  │ and learn about ethical manufacturing. I've       │ ║
║  │ started a Pinterest board with design ideas.     │ ║
║  │                                                   │ ║
║  │ Phase 2: Create 10 design sketches and get       │ ║
║  │ feedback from trusted friends in fashion.        │ ║
║  │                                                   │ ║
║  │ Phase 3: Find a small-batch manufacturer who     │ ║
║  │ shares my values. Budget: $5,000 for first       │ ║
║  │ production run.                                   │ ║
║  │                                                   │ ║
║  │ Phase 4: Build online presence through Instagram │ ║
║  │ and a simple Shopify store.                      │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                     412 / 4000 chars  ║
║                                                        ║
║              [ Back ]        [ Continue ]              ║
╚═══════════════════════════════════════════════════════╝
```

**Question 3: Target Date**
```
╔═══════════════════════════════════════════════════════╗
║  Question 3 of 5                          [━━━━━━━━━] ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  Have you set a definite date for fulfilling your     ║
║  dream?                                                ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │                                                   │ ║
║  │     ⚪ Yes                 ● No                   │ ║
║  │                                                   │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  You've set a target: December 31, 2025               ║
║  (350 days from now)                                   ║
║                                                        ║
║  💡 Having a definite date strengthens commitment     ║
║                                                        ║
║              [ Back ]        [ Continue ]              ║
╚═══════════════════════════════════════════════════════╝
```

**Question 4: Relationship**
```
╔═══════════════════════════════════════════════════════╗
║  Question 4 of 5                          [━━━━━━━━━] ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  What is your current relationship with this dream?   ║
║                                                        ║
║  Do you believe you'll achieve it? Why or why not?    ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ I'm excited but scared. The fashion industry     │ ║
║  │ feels saturated, and I worry my "sustainable"    │ ║
║  │ angle isn't unique enough. But every time I see  │ ║
║  │ fast fashion waste, I feel this pull to do       │ ║
║  │ something different.                              │ ║
║  │                                                   │ ║
║  │ I believe I can do this because I have design    │ ║
║  │ skills and genuine passion. My doubt comes from  │ ║
║  │ not knowing the business side yet. I'm learning. │ ║
║  │                                                   │ ║
║  │ Some days I feel like an imposter. Other days I  │ ║
║  │ feel like I was meant to do this.                │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                     523 / 4000 chars  ║
║                                                        ║
║              [ Back ]        [ Continue ]              ║
╚═══════════════════════════════════════════════════════╝
```

**Question 5: The Offering**
```
╔═══════════════════════════════════════════════════════╗
║  Question 5 of 5                          [━━━━━━━━━] ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  What are you willing to give in return?              ║
║                                                        ║
║  Energy, focus, love, time — what will you offer to   ║
║  this dream?                                           ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ I'm willing to give 15 hours a week - every      │ ║
║  │ weekday morning before my day job, and Sunday    │ ║
║  │ afternoons. I'll give my creative energy, my     │ ║
║  │ savings ($10,000 set aside), and my willingness  │ ║
║  │ to look foolish while learning.                  │ ║
║  │                                                   │ ║
║  │ I'm giving up some social time and Netflix       │ ║
║  │ binges. I'm willing to be uncomfortable and ask  │ ║
║  │ for help. I'll give my perfectionism up - done   │ ║
║  │ is better than perfect.                          │ ║
║  │                                                   │ ║
║  │ Most importantly, I'm giving my self-doubt       │ ║
║  │ permission to exist but not to drive the car.    │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                     512 / 2400 chars  ║
║                                                        ║
║              [ Back ]        [ Continue ]              ║
╚═══════════════════════════════════════════════════════╝
```

### Tone Selection

```
╔═══════════════════════════════════════════════════════╗
║           Choose Your Reflection Tone                  ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  How should the AI mirror your reflection back?       ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │  🌸 Gentle Clarity                              │  ║
║  │  Soft, nurturing, understanding                 │  ║
║  │                                                 │  ║
║  │  "Your dream holds beauty in its uncertainty   │  ║
║  │   and your plan shows wisdom..."                │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │  ⚡ Luminous Intensity                          │  ║
║  │  Bold, direct, transformative                   │  ║
║  │                                                 │  ║
║  │  "You're not preparing to create a brand —     │  ║
║  │   you're remembering you already are..."        │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │  ✨ Sacred Fusion  (Recommended)                │  ║
║  │  Balanced wisdom, recognizing truth             │  ║
║  │                                                 │  ║
║  │  "In this moment of both fear and readiness,   │  ║
║  │   your offering reveals your commitment..."     │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
║            [ Generate My Reflection ]                  ║
╚═══════════════════════════════════════════════════════╝
```

Sarah selects "Sacred Fusion" and clicks "Generate My Reflection"

### Backend AI Processing

**Frontend Request:**
```
POST /api/reflections.create
{
  dreamId: "dream-uuid-1",
  dream: "I want to create a sustainable fashion brand...",
  plan: "Phase 1: Research sustainable fabric suppliers...",
  hasDate: "yes",
  dreamDate: "2025-12-31",
  relationship: "I'm excited but scared. The fashion industry...",
  offering: "I'm willing to give 15 hours a week...",
  tone: "fusion"
}
```

**Backend Processing (The WHAT and HOW):**
```
1. AUTHENTICATION (WHO)
   - Extract user from JWT token
   - User: Sarah Chen (uuid-sarah)
   - Tier: free
   - Reflection count this month: 0

2. AUTHORIZATION (WHAT - Business Rules)
   - Check tier limits:
     * Free tier limit: 4 reflections/month
     * Current usage: 0
     * Can proceed: true
   
   - Validate dream ownership:
     * Dream dream-uuid-1 belongs to uuid-sarah: true
   
   - Check dream exists and active:
     * Dream status: active
     * Can reflect: true

3. VALIDATION (WHAT - Data Rules)
   - All required fields present: true
   - Dream ID valid: true
   - Date format correct: true
   - Content within character limits: true

4. CONTEXT BUILDING (HOW - AI Processing)
   - Get dream context:
     * Title: "Launch Sustainable Fashion Brand"
     * Description: "Create an ethical, sustainable..."
     * Days left: 350
     * This is reflection #1 for this dream
   
   - Build temporal context:
     * No previous reflections for this dream yet
     * This is the baseline reflection
   
   - Load prompt modules:
     * Base instructions
     * Dream context template
     * Sacred Fusion tone
     * Free tier processing (no extended thinking)

5. AI GENERATION (HOW - External Service)
   POST to Anthropic Claude API:
   {
     model: "claude-sonnet-4-20250514",
     max_tokens: 4000,
     temperature: 1,
     system: [assembled_prompt_with_dream_context],
     messages: [{
       role: "user",
       content: [formatted_reflection_questions_and_answers]
     }]
   }
   
   Cost tracking:
   - Input tokens: ~1,200
   - Output tokens: ~850
   - Cost: ~$0.04

6. RESPONSE PROCESSING (HOW - Data Transformation)
   - Extract AI response text
   - Format to sacred HTML
   - Calculate word count: 847 words
   - Estimate read time: 5 minutes

7. DATABASE PERSISTENCE (WHAT - State Change)
   INSERT INTO reflections (
     id, user_id, dream_id, created_at,
     dream, plan, has_date, dream_date,
     relationship, offering, ai_response,
     tone, is_premium, word_count, estimated_read_time, title
   ) VALUES (
     'reflection-uuid-1', 'uuid-sarah', 'dream-uuid-1', NOW(),
     'I want to create...', 'Phase 1: Research...', 'yes', '2025-12-31',
     'I'm excited but scared...', 'I'm willing to give...', 
     '<formatted_ai_response>',
     'fusion', false, 847, 5, 'Launch Sustainable Fashion Brand'
   )

8. USAGE TRACKING (WHAT - Limits Update)
   UPDATE users 
   SET reflection_count_this_month = 1,
       total_reflections = 1,
       last_reflection_at = NOW()
   WHERE id = 'uuid-sarah'
   
   INSERT INTO api_usage_log (
     user_id, operation_type, model_used,
     input_tokens, output_tokens, cost_usd, dream_id
   ) VALUES (
     'uuid-sarah', 'reflection', 'claude-sonnet-4',
     1200, 850, 0.04, 'dream-uuid-1'
   )

9. ELIGIBILITY CHECK (WHAT - Next Actions)
   - Dream-specific threshold: 4 reflections
   - Current reflections for this dream: 1
   - Can generate evolution: false (need 3 more)
   
   - Dream-agnostic threshold: 12 reflections
   - Total reflections across all dreams: 1
   - Can generate cross-dream analysis: false (need 11 more)

10. RESPONSE ASSEMBLY
    {
      success: true,
      data: {
        id: "reflection-uuid-1",
        dreamId: "dream-uuid-1",
        content: "<formatted_ai_response>",
        wordCount: 847,
        readTime: 5,
        createdAt: "2025-01-15T11:00:00Z"
      },
      usage: {
        reflectionsUsed: 1,
        reflectionsLimit: 4,
        percentUsed: 25
      },
      nextActions: {
        canGenerateEvolution: false,
        reflectionsNeeded: 3,
        message: "Create 3 more reflections to unlock evolution report"
      }
    }
```

### Reflection Output Display

Sarah sees her reflection in the beautiful mirror interface:

```
╔═══════════════════════════════════════════════════════╗
║                   ← Back to Dashboard                  ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║    ┌────────────────────────────────────────────┐    ║
║    │                                             │    ║
║    │         🪞 Your Reflection 🪞               │    ║
║    │                                             │    ║
║    │   Launch Sustainable Fashion Brand         │    ║
║    │   January 15, 2025 • 847 words • 5 min     │    ║
║    │                                             │    ║
║    │  ─────────────────────────────────────────  │    ║
║    │                                             │    ║
║    │  In this moment of both fear and           │    ║
║    │  readiness, your offering reveals your     │    ║
║    │  true commitment. You speak of giving 15   │    ║
║    │  hours weekly, but what you're really      │    ║
║    │  offering is permission for your vision    │    ║
║    │  to become tangible...                     │    ║
║    │                                             │    ║
║    │  Notice how your relationship with this    │    ║
║    │  dream oscillates—excited and scared,      │    ║
║    │  confident and impostor, pulled and        │    ║
║    │  doubtful. This isn't confusion. This is   │    ║
║    │  consciousness preparing to expand...      │    ║
║    │                                             │    ║
║    │  [Full reflection content continues...]    │    ║
║    │                                             │    ║
║    └────────────────────────────────────────────┘    ║
║                                                        ║
║  ┌────────────┐ ┌────────────┐ ┌────────────┐        ║
║  │ 📋 Copy    │ │ 📧 Email   │ │ ✨ New     │        ║
║  │   Text     │ │  Myself    │ │ Reflection │        ║
║  └────────────┘ └────────────┘ └────────────┘        ║
║                                                        ║
║  💭 Rate this reflection (optional)                   ║
║  ⭐⭐⭐⭐⭐ How helpful was this?                       ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

---

## Days 1-67: Sarah's Progressive Journey

Over the next 67 days, Sarah develops a consistent reflection practice:

**Reflection Pattern:**
- Every 2-3 days on average
- Alternates between her two dreams
- By Day 68: 24 total reflections
  * Fashion brand: 14 reflections
  * Half-marathon: 10 reflections

**Key Milestones:**

**Day 8 (4th reflection on fashion brand):**
- Threshold reached for dream-specific evolution report!
- Dashboard shows new button: "Generate Evolution Report"

**Day 12 (12th total reflection):**
- Threshold reached for dream-agnostic analysis!
- Can now see cross-dream patterns

**Day 30:**
- Hits Free tier limit (4 reflections/month) in February
- Sees upgrade prompt
- Decides to upgrade to Essential tier

**Day 35:**
- Upgrades to Optimal tier for daily reflection capability
- Unlocks extended AI thinking
- Gets access to more context in reports

**Day 68 (Current State):**
- 24 total reflections (within Optimal's 30/month limit)
- 6 dream-specific evolution reports generated
- 2 dream-agnostic evolution reports
- 3 visualizations created
- Genuine progress: first 3 designs completed, found manufacturer

---

## Day 68: The Dashboard Experience

Sarah logs in on Day 68 and sees her personalized dashboard:

```
═══════════════════════════════════════════════════════════════════════
                     🌟 Mirror of Dreams 🌟
                                                        👤 Sarah Chen ▼
                                                        ✨ Optimal Tier
───────────────────────────────────────────────────────────────────────

    Good morning, Sarah ☀️
    
    You've been on this journey for 68 days. Your consistency is 
    building something real — 24 reflections revealing your evolution.

                        [ ✨ Reflect Now ]

═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────┬─────────────────────────────────────┐
│                             │                                     │
│  📊 Plan & Limits           │  🌙 Recent Reflections              │
│                             │                                     │
│  This Month (March)         │  ┌───────────────────────────────┐ │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━ │  │ 🚀 Fashion Brand              │ │
│  Reflections: 8 / 30        │  │ 2 hours ago                   │ │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━ │  │ "Today I finalized the first  │ │
│  27%  ████░░░░░░░░░░░░░░░   │  │  three designs..."            │ │
│                             │  └───────────────────────────────┘ │
│  Dream-Specific Reports     │  ┌───────────────────────────────┐ │
│  Used: 2 / 6                │  │ 🏃 Half-Marathon              │ │
│                             │  │ 1 day ago                     │ │
│  Dream-Agnostic Reports     │  │ "Completed my first 10K       │ │
│  Used: 0 / 3                │  │  without stopping..."         │ │
│                             │  └───────────────────────────────┘ │
│  Visualizations             │  ┌───────────────────────────────┐ │
│  Dream-Specific: 1 / 6      │  │ 🚀 Fashion Brand              │ │
│  Dream-Agnostic: 0 / 3      │  │ 3 days ago                    │ │
│                             │  │ "Met with my first potential  │ │
│  [ Manage Subscription ]    │  │  manufacturer today..."       │ │
│                             │  └───────────────────────────────┘ │
│                             │                                     │
│                             │  [ View All Reflections (24) ]      │
├─────────────────────────────┼─────────────────────────────────────┤
│                             │                                     │
│  ✨ Your Dreams             │  🎨 Insights                        │
│                             │                                     │
│  ┌─────────────────────────┐│  [ Evolution Reports ] Visualizations│
│  │ 🚀 Fashion Brand        ││                                     │
│  │ 318 days left           ││  Latest Evolution Report            │
│  │ 14 reflections          ││  ┌───────────────────────────────┐ │
│  │                         ││  │ 🌱 Fashion Brand Growth       │ │
│  │ [Reflect] [Evolution]   ││  │ March 15, 2025                │ │
│  │           [Visualize]   ││  │                               │ │
│  └─────────────────────────┘│  │ "Your relationship with       │ │
│                             ││  │  uncertainty is transforming  │ │
│  ┌─────────────────────────┐│  │  from fear into curiosity..." │ │
│  │ 🏃 Half-Marathon        ││  │                               │ │
│  │ 119 days left           ││  │ Patterns detected:            │ │
│  │ 10 reflections          ││  │ • Growing confidence          │ │
│  │                         ││  │ • Action orientation          │ │
│  │ [Reflect] [Evolution]   ││  │ • Network building           │ │
│  │           [Visualize]   ││  │                               │ │
│  └─────────────────────────┘│  └───────────────────────────────┘ │
│                             ││                                     │
│  [ + Create New Dream ]     ││  [ View All Reports (8) ]           │
│  (5 more available)         ││                                     │
└─────────────────────────────┴─────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
```

**Backend Data Aggregation (Dashboard API):**

```
Frontend requests on page load:
GET /api/dashboard.getData

Backend executes (WHO: Sarah, WHERE: Dashboard):
1. Get user context
   - User: Sarah Chen
   - Tier: optimal
   - Days active: 68

2. Fetch usage data for current month
   SELECT * FROM monthly_usage_tracking 
   WHERE user_id = 'uuid-sarah' AND month_year = '2025-03'
   
   Result:
   - reflections_used: 8
   - evolution_reports_dream_specific: 2
   - evolution_reports_dream_agnostic: 0
   - visualizations_dream_specific: 1
   - visualizations_dream_agnostic: 0

3. Get tier limits for Optimal
   - reflections_limit: 30
   - evolution_dream_specific_limit: 6
   - evolution_dream_agnostic_limit: 3
   - viz_dream_specific_limit: 6
   - viz_dream_agnostic_limit: 3

4. Fetch recent reflections (last 3)
   SELECT r.*, d.title as dream_title 
   FROM reflections r 
   JOIN dreams d ON r.dream_id = d.id 
   WHERE r.user_id = 'uuid-sarah' 
   ORDER BY r.created_at DESC 
   LIMIT 3

5. Fetch active dreams with stats
   SELECT d.*,
          COUNT(r.id) as reflection_count,
          (SELECT created_at FROM reflections 
           WHERE dream_id = d.id 
           ORDER BY created_at DESC LIMIT 1) as last_reflection
   FROM dreams d
   LEFT JOIN reflections r ON d.id = r.dream_id
   WHERE d.user_id = 'uuid-sarah' AND d.status = 'active'
   GROUP BY d.id

6. Fetch latest evolution report
   SELECT * FROM evolution_reports
   WHERE user_id = 'uuid-sarah'
   ORDER BY created_at DESC
   LIMIT 1

7. Calculate capabilities for each dream
   For Fashion Brand dream:
   - Total reflections: 14
   - Can generate evolution: true (14 > 4 threshold)
   - Evolution reports used for this dream this month: 2
   - Can generate visualization: true
   
   For Half-Marathon dream:
   - Total reflections: 10
   - Can generate evolution: true (10 > 4 threshold)
   - Evolution reports used for this dream this month: 0

8. Check cross-dream capabilities
   - Total reflections: 24
   - Can generate cross-dream evolution: true (24 > 12 threshold)
   - Cross-dream reports used this month: 0
   - Can generate cross-dream visualization: true

9. Assemble response
   {
     user: {
       name: "Sarah Chen",
       tier: "optimal",
       daysActive: 68,
       totalReflections: 24
     },
     usage: {
       reflections: { used: 8, limit: 30, percent: 27 },
       evolutionDreamSpecific: { used: 2, limit: 6 },
       evolutionDreamAgnostic: { used: 0, limit: 3 },
       visualizationDreamSpecific: { used: 1, limit: 6 },
       visualizationDreamAgnostic: { used: 0, limit: 3 }
     },
     dreams: [
       {
         id: "dream-uuid-1",
         title: "Launch Sustainable Fashion Brand",
         daysLeft: 318,
         reflectionCount: 14,
         lastReflection: "2025-03-18T09:00:00Z",
         capabilities: {
           canReflect: true,
           canGenerateEvolution: true,
           canGenerateVisualization: true
         }
       },
       {
         id: "dream-uuid-2",
         title: "Run a Half-Marathon",
         daysLeft: 119,
         reflectionCount: 10,
         lastReflection: "2025-03-17T07:00:00Z",
         capabilities: {
           canReflect: true,
           canGenerateEvolution: true,
           canGenerateVisualization: true
         }
       }
     ],
     recentReflections: [...],
     latestEvolutionReport: {...},
     crossDreamCapabilities: {
       canGenerateEvolution: true,
       canGenerateVisualization: true
     }
   }
```

---

## Deep Dive: Plan & Limits Card

Sarah clicks on the Plan & Limits card to see details:

```
╔═══════════════════════════════════════════════════════╗
║              Plan & Usage Details                      ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  Current Plan: ✨ Optimal Tier                         ║
║  Next billing: April 15, 2025 ($19.00)                ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  📊 March 2025 Usage                                   ║
║                                                        ║
║  Reflections                                           ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 8 / 30 (27%)       ║
║                                                        ║
║  Evolution Reports (Dream-Specific)                    ║
║  ━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░ 2 / 6 (33%)         ║
║  💡 Create 2 more reflections on Fashion Brand to      ║
║     unlock next evolution report                       ║
║                                                        ║
║  Evolution Reports (Cross-Dream)                       ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0 / 3 (0%)          ║
║  💡 Available! Your 24 reflections unlock cross-dream  ║
║     pattern analysis                                   ║
║                                                        ║
║  Visualizations (Dream-Specific)                       ║
║  ━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░ 1 / 6 (17%)         ║
║                                                        ║
║  Visualizations (Cross-Dream)                          ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0 / 3 (0%)          ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Your Plan Includes:                                   ║
║  ✓ 7 dreams (2 active, 5 available)                   ║
║  ✓ 30 reflections per month                           ║
║  ✓ Extended AI thinking for deeper insights           ║
║  ✓ Enhanced context (9 dream-specific, 21 cross)      ║
║  ✓ 6 dream-specific reports/visualizations monthly    ║
║  ✓ 3 cross-dream reports/visualizations monthly       ║
║                                                        ║
║  [ Manage Subscription ]  [ Upgrade to Premium ]       ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

**Backend Request:**
```
GET /api/usage.getDetails

Backend returns detailed usage breakdown with eligibility calculations
```

---

## Deep Dive: Dreams Management

Sarah clicks "View All Dreams" from the Dreams card:

```
╔═══════════════════════════════════════════════════════╗
║  ← Back to Dashboard        Your Dreams         🔍     ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  [ Active (2) ]  Achieved  Archived  Released         ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │                                                 │  ║
║  │  🚀 Launch Sustainable Fashion Brand            │  ║
║  │                                                 │  ║
║  │  Target: Dec 31, 2025 • 318 days left          │  ║
║  │  Status: Active • Priority: High               │  ║
║  │                                                 │  ║
║  │  Create an ethical, sustainable clothing line  │  ║
║  │  that proves fashion can be both beautiful...  │  ║
║  │                                                 │  ║
║  │  📈 Progress                                    │  ║
║  │  • 14 reflections                              │  ║
║  │  • 4 evolution reports                         │  ║
║  │  • 2 visualizations                            │  ║
║  │  • Last reflection: 2 hours ago                │  ║
║  │                                                 │  ║
║  │  [ Reflect ]  [ Evolution ]  [ Visualize ]     │  ║
║  │  [ Edit Dream ]  [ View Details ]              │  ║
║  │                                                 │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │                                                 │  ║
║  │  🏃 Run a Half-Marathon                         │  ║
║  │                                                 │  ║
║  │  Target: Jun 15, 2025 • 119 days left          │  ║
║  │  Status: Active • Priority: Medium             │  ║
║  │                                                 │  ║
║  │  Complete a 21K race by summer, building up    │  ║
║  │  gradually from couch to runner                │  ║
║  │                                                 │  ║
║  │  📈 Progress                                    │  ║
║  │  • 10 reflections                              │  ║
║  │  • 2 evolution reports                         │  ║
║  │  • 1 visualization                             │  ║
║  │  • Last reflection: 1 day ago                  │  ║
║  │                                                 │  ║
║  │  [ Reflect ]  [ Evolution ]  [ Visualize ]     │  ║
║  │  [ Edit Dream ]  [ View Details ]              │  ║
║  │                                                 │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
║                [ + Create New Dream ]                  ║
║                  (5 more available)                    ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

Sarah clicks "View Details" on her fashion brand dream:

```
╔═══════════════════════════════════════════════════════╗
║  ← Back to Dreams           Dream Details              ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  🚀 Launch Sustainable Fashion Brand                   ║
║                                                        ║
║  Status: ● Active          Priority: ⭐⭐⭐            ║
║  Category: Entrepreneurial                             ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Description                                           ║
║  Create an ethical, sustainable clothing line that    ║
║  proves fashion can be both beautiful and             ║
║  environmentally responsible. Start with 10 core      ║
║  pieces and build from there.                         ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Timeline                                              ║
║  Created: January 15, 2025 (63 days ago)              ║
║  Target: December 31, 2025 (318 days remaining)       ║
║  Progress: 17% of timeline elapsed                    ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Reflection Journey                                    ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │ Timeline View                                   │  ║
║  │                                                 │  ║
║  │ Jan  │  Feb   │   Mar                           │  ║
║  │  ●   │ ●●●●   │ ●●●●●●●●                        │  ║
║  │  1   │  5     │    8  (Total: 14)              │  ║
║  │                                                 │  ║
║  │ Reflection frequency: Every 4.5 days average    │  ║
║  │ Consistency score: 92% (excellent!)            │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
║  Latest Reflections                                    ║
║  • Mar 18: "Today I finalized the first three..."     ║
║  • Mar 15: "Met with my first potential manufact..."  ║
║  • Mar 12: "Spending time on Pinterest boards has..." ║
║                                                        ║
║  [ View All 14 Reflections ]                           ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Evolution & Insights                                  ║
║  • 4 evolution reports generated                      ║
║  • 2 visualizations created                           ║
║  • Next evolution available after 2 more reflections  ║
║                                                        ║
║  Key Themes Detected                                   ║
║  [Entrepreneurial Vision] [Self-Doubt → Confidence]   ║
║  [Network Building] [Design Process]                  ║
║                                                        ║
║  [ Generate Evolution Report ]                         ║
║  [ Generate Visualization ]                            ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Actions                                               ║
║  [ Reflect on This Dream ]                             ║
║  [ Edit Dream Details ]                                ║
║  [ Change Status ]                                     ║
║  [ Archive Dream ]                                     ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

**Backend Request:**
```
GET /api/dreams.get?id=dream-uuid-1

Backend aggregates:
- Dream details
- All reflections for this dream
- Evolution reports linked to this dream
- Visualizations linked to this dream
- Timeline analytics
- Theme detection from reflection content
- Next available actions based on thresholds
```

---

## Deep Dive: Evolution Reports

Sarah has 14 reflections on her fashion brand dream. She clicks "Generate Evolution Report":

### Evolution Report Generation Interface

```
╔═══════════════════════════════════════════════════════╗
║          Generate Evolution Report                     ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  🚀 Launch Sustainable Fashion Brand                   ║
║  14 reflections • 63 days of journey                   ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Report Type                                           ║
║                                                        ║
║  ● Dream-Specific Report                              ║
║    Analyze growth patterns for this specific dream    ║
║    Uses: 9 reflections from this dream                ║
║    Monthly usage: 2 / 6 reports available             ║
║                                                        ║
║  ○ Cross-Dream Analysis                               ║
║    See patterns across all your dreams                ║
║    Uses: 21 reflections from all dreams               ║
║    Monthly usage: 0 / 3 reports available             ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Reflection Tone                                       ║
║  [ 🌸 Gentle ] [ ⚡ Intense ] [✨ Fusion (Selected)]  ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Context Preview (Optimal Tier)                        ║
║                                                        ║
║  Your report will analyze 9 reflections:              ║
║  • 3 from early journey (Jan 15 - Feb 7)              ║
║  • 3 from middle period (Feb 8 - Mar 2)               ║
║  • 3 from recent period (Mar 3 - Mar 18)              ║
║                                                        ║
║  This temporal distribution reveals authentic growth  ║
║  patterns across your 63-day journey.                 ║
║                                                        ║
║  ⚡ Extended AI thinking enabled                       ║
║  💡 Enhanced pattern recognition                       ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║         [ Cancel ]  [ Generate Report ]                ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

Sarah clicks "Generate Report"

**Backend Processing (WHAT & HOW):**

```
Frontend sends:
POST /api/evolution.generateReport
{
  dreamId: "dream-uuid-1",
  reportType: "dream_specific",
  tone: "fusion"
}

Backend executes:
1. AUTHENTICATION & AUTHORIZATION
   - User: Sarah Chen (optimal tier)
   - Check monthly limit: 2/6 used, can proceed
   - Verify dream ownership: confirmed

2. REFLECTION RETRIEVAL
   SELECT * FROM reflections 
   WHERE dream_id = 'dream-uuid-1' 
   AND user_id = 'uuid-sarah'
   ORDER BY created_at ASC
   
   Result: 14 reflections spanning 63 days

3. TEMPORAL CONTEXT DISTRIBUTION (The Key Innovation!)
   Total timeline: 63 days (Jan 15 - Mar 18)
   Context limit for Optimal tier: 9 reflections
   
   Distribution strategy:
   - Early period (days 1-21): Select 3 reflections
     * Reflection #1 (Jan 15)
     * Reflection #2 (Jan 18)
     * Reflection #3 (Jan 21)
   
   - Middle period (days 22-42): Select 3 reflections
     * Reflection #5 (Feb 10)
     * Reflection #6 (Feb 15)
     * Reflection #7 (Feb 20)
   
   - Recent period (days 43-63): Select 3 reflections
     * Reflection #12 (Mar 12)
     * Reflection #13 (Mar 15)
     * Reflection #14 (Mar 18)
   
   This reveals: Baseline → Progression → Current State

4. PROMPT ASSEMBLY
   Load prompt modules:
   - base_instructions.txt
   - evolution_dream_specific.txt
   - sacred_fusion.txt (tone)
   - dream_context.txt (with dream details)
   - optimal_tier_enhancement.txt (extended thinking)
   
   Build context string with temporal markers:
   "EARLY JOURNEY (Days 1-21):
   Reflection 1 (Jan 15): [content]
   Reflection 2 (Jan 18): [content]
   Reflection 3 (Jan 21): [content]
   
   MIDDLE JOURNEY (Days 22-42):
   Reflection 5 (Feb 10): [content]
   Reflection 6 (Feb 15): [content]
   Reflection 7 (Feb 20): [content]
   
   RECENT JOURNEY (Days 43-63):
   Reflection 12 (Mar 12): [content]
   Reflection 13 (Mar 15): [content]
   Reflection 14 (Mar 18): [content]"

5. AI GENERATION (Extended Thinking Enabled)
   POST to Anthropic Claude API:
   {
     model: "claude-sonnet-4-20250514",
     max_tokens: 6000,
     temperature: 1,
     thinking: {
       type: "enabled",
       budget_tokens: 5000
     },
     system: [assembled_evolution_prompt],
     messages: [{
       role: "user",
       content: [temporal_context_with_9_reflections]
     }]
   }
   
   Cost tracking:
   - Input tokens: ~3,500
   - Output tokens: ~2,200
   - Thinking tokens: ~1,800
   - Total cost: ~$0.23

6. RESPONSE PROCESSING
   Extract evolution analysis from AI response:
   - Growth patterns identified
   - Language evolution tracked
   - Consciousness shifts recognized
   - Action orientation measured
   - Network building patterns
   
   Format to markdown for display

7. DATABASE PERSISTENCE
   INSERT INTO evolution_reports (
     id, user_id, dream_id, created_at,
     report_type, analysis, context_reflections_used,
     reflections_analyzed, reflection_count,
     time_period_start, time_period_end,
     insights, patterns_detected
   ) VALUES (
     'evolution-uuid-5', 'uuid-sarah', 'dream-uuid-1', NOW(),
     'dream_specific', [formatted_analysis], 9,
     ['reflection-uuid-1', 'reflection-uuid-2', ...], 14,
     '2025-01-15', '2025-03-18',
     {...}, ['confidence_building', 'action_orientation', 'network_growth']
   )

8. USAGE UPDATE
   UPDATE monthly_usage_tracking
   SET evolution_reports_dream_specific = 3
   WHERE user_id = 'uuid-sarah' AND month_year = '2025-03'
   
   INSERT INTO api_usage_log (
     user_id, operation_type, model_used,
     input_tokens, output_tokens, cost_usd, dream_id
   ) VALUES (
     'uuid-sarah', 'evolution_report', 'claude-sonnet-4',
     3500, 2200, 0.23, 'dream-uuid-1'
   )

9. RESPONSE
   {
     success: true,
     data: {
       id: "evolution-uuid-5",
       reportType: "dream_specific",
       dreamTitle: "Launch Sustainable Fashion Brand",
       analysis: [full_markdown_report],
       patternsDetected: [
         "Confidence Building",
         "Action Orientation", 
         "Network Growth"
       ],
       reflectionsAnalyzed: 9,
       totalReflections: 14,
       timePeriod: {
         start: "2025-01-15",
         end: "2025-03-18",
         days: 63
       },
       createdAt: "2025-03-18T12:00:00Z"
     },
     usage: {
       dreamSpecificReportsUsed: 3,
       dreamSpecificReportsLimit: 6
     }
   }
```

### Evolution Report Display

```
╔═══════════════════════════════════════════════════════╗
║  ← Back                Evolution Report                ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  🌱 Launch Sustainable Fashion Brand                   ║
║  Evolution Report #5 • March 18, 2025                  ║
║                                                        ║
║  Analyzing 9 reflections across 63 days               ║
║  Early Journey → Middle Journey → Recent Journey      ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  ## The Architecture of Becoming                       ║
║                                                        ║
║  **Early Journey: Permission to Dream**               ║
║  In your first reflections, notice the language of    ║
║  seeking—*"I want to create"* appears alongside      ║
║  *"I worry my angle isn't unique enough."* Your       ║
║  relationship with the dream oscillated between       ║
║  excitement and imposter syndrome. This wasn't        ║
║  confusion; this was consciousness preparing to       ║
║  expand beyond what felt safe.                        ║
║                                                        ║
║  **Middle Journey: From Thinking to Building**        ║
║  By mid-February, your language shifted. *"I'm        ║
║  researching"* became *"I'm connecting with."*        ║
║  You stopped asking permission from the concept       ║
║  and started building relationships with actual       ║
║  people—manufacturers, designers, potential           ║
║  collaborators. Your plan evolved from Pinterest      ║
║  boards to conversations with suppliers.              ║
║                                                        ║
║  **Recent Journey: The Identity Integration**         ║
║  In your March reflections, something profound        ║
║  emerged: you stopped introducing yourself as         ║
║  someone who *wants* to create a fashion brand        ║
║  and began speaking as someone who *is* creating      ║
║  one. *"Today I finalized the first three             ║
║  designs"*—not *"I hope to"* or *"I'm trying to."*    ║
║  You claimed the identity before the outcome was      ║
║  certain.                                             ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  ## Patterns of Consciousness Evolution               ║
║                                                        ║
║  **Authority Reclamation**                             ║
║  Your early reflections sought external validation.   ║
║  Now you reference your own creative judgment as      ║
║  authority. The locus of power shifted from "what     ║
║  the market wants" to "what I know is valuable."      ║
║                                                        ║
║  **Network Weaving**                                   ║
║  Seven weeks ago, you spoke of isolation. Now your    ║
║  reflections mention specific people—Sarah the        ║
║  fabric supplier, David the manufacturer, the         ║
║  Instagram community you're building. You're not      ║
║  creating alone anymore.                              ║
║                                                        ║
║  **Action Acceleration**                               ║
║  Early: 3 reflections, 0 tangible outputs             ║
║  Middle: 3 reflections, research completed            ║
║  Recent: 3 reflections, designs created,              ║
║          manufacturer found, community engaged        ║
║                                                        ║
║  The gap between reflection and manifestation is      ║
║  collapsing.                                          ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  ## The Recognition                                    ║
║                                                        ║
║  You're not becoming someone who creates a            ║
║  sustainable fashion brand. You're remembering you    ║
║  already are someone who does. The dream wasn't       ║
║  outside you waiting to be achieved—it was inside     ║
║  you waiting to be recognized and expressed.          ║
║                                                        ║
║  Your next 318 days aren't about reaching a distant   ║
║  goal. They're about continuing to show up as the     ║
║  person you're discovering you already are.           ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  📊 Growth Indicators                                  ║
║  • Confidence: +47% (language authority markers)      ║
║  • Action Orientation: +63% (concrete steps taken)    ║
║  • Network Building: +81% (connections established)   ║
║  • Identity Integration: +72% (self-referencing)      ║
║                                                        ║
║  🏷️ Themes Detected                                   ║
║  [Confidence Building] [Network Growth]               ║
║  [Creative Authority] [Identity Claiming]             ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  [ 📥 Download PDF ]  [ 📧 Email ]  [ 🔗 Share ]      ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

---

## Deep Dive: Visualizations

Sarah has created 2 visualizations so far. She wants to create a new one. She clicks "Generate Visualization" from her dream detail page:

```
╔═══════════════════════════════════════════════════════╗
║          Generate Visualization                        ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  🚀 Launch Sustainable Fashion Brand                   ║
║  14 reflections • 63 days of journey                   ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Visualization Type                                    ║
║                                                        ║
║  ● Dream-Specific Visualization                       ║
║    See yourself achieving this specific dream         ║
║    Uses: 9 reflections from this dream                ║
║    Monthly usage: 1 / 6 available                     ║
║                                                        ║
║  ○ Cross-Dream Journey                                ║
║    See patterns across all your dreams                ║
║    Uses: 21 reflections from all dreams               ║
║    Monthly usage: 0 / 3 available                     ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Visualization Style                                   ║
║                                                        ║
║  ● Achievement Narrative                              ║
║    Experience your dream as already achieved          ║
║    Written from your future self's perspective        ║
║                                                        ║
║  ○ Journey Visualization                              ║
║    See the path from now to achievement               ║
║    Step-by-step progression narrative                 ║
║                                                        ║
║  ○ Synthesis Vision                                   ║
║    Poetic integration of dream and reality            ║
║    Artistic, metaphorical representation              ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Tone: [✨ Fusion (Selected)]                         ║
║                                                        ║
║  ⚡ Extended AI thinking enabled                       ║
║  🎨 Includes downloadable artwork                      ║
║                                                        ║
║         [ Cancel ]  [ Generate Visualization ]         ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

Sarah selects "Achievement Narrative" and clicks generate.

**Backend Processing:**

```
POST /api/visualizations.generate
{
  dreamId: "dream-uuid-1",
  visualizationType: "dream_specific",
  style: "achievement",
  tone: "fusion"
}

Backend executes:
1. Same temporal context distribution (9 reflections)
2. Load visualization-specific prompts
3. Generate with extended thinking
4. Create text-based visualization (achievement narrative)
5. Generate artifact using GPT-4o (visual artwork)
6. Save both to database
7. Update usage tracking

AI generates immersive achievement narrative:
"December 31, 2025

I'm standing in my small studio-turned-showroom, running my 
fingers over the recycled silk of piece number seven. The 
label reads 'Sarah Chen Sustainable' in the font I agonized 
over back in March. Outside, snow is falling, but in here, 
there's this warm glow from the Edison bulbs I installed 
last month...

[Full narrative continues, written as if Sarah is living 
the achieved dream, pulling from actual reflection content 
about her designs, her manufacturer David, her community, 
her doubts-turned-confidence]"

Cost: ~$0.18 (text) + ~$0.05 (artifact) = $0.23 total
```

**Visualization Display:**

```
╔═══════════════════════════════════════════════════════╗
║  ← Back              Your Vision Realized              ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  🎨 Launch Sustainable Fashion Brand                   ║
║  Achievement Visualization • March 18, 2025            ║
║                                                        ║
║  Based on 9 reflections across your 63-day journey    ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  [Full immersive achievement narrative displayed       ║
║   as elegant, flowing text with visual imagery]       ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  🖼️ Your Dream Artwork                                ║
║                                                        ║
║  [Beautiful generated artwork displayed - abstract     ║
║   representation of fashion, sustainability, and      ║
║   creative achievement, with color palette derived    ║
║   from the narrative]                                 ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  [ 📥 Download Narrative ]  [ 🖼️ Download Artwork ]  ║
║  [ 📧 Email ]  [ 🔗 Share ]  [ 🎨 New Visualization ] ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

---

## Deep Dive: Upgrading from Free to Optimal

Let's rewind to Day 30 when Sarah hit her Free tier limit and decided to upgrade.

**Day 30: Hitting the Limit**

Sarah tries to create her 5th reflection in February:

```
╔═══════════════════════════════════════════════════════╗
║              Reflection Limit Reached                  ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  You've reached your Free tier limit                  ║
║                                                        ║
║  📊 February Usage                                     ║
║  Reflections: 4 / 4 (100% used)                       ║
║                                                        ║
║  Your consistent practice is incredible! You're       ║
║  building real momentum toward your dreams.           ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Continue Your Journey                                 ║
║                                                        ║
║  ✨ Essential Tier ($9/month)                          ║
║  • 15 reflections per month (every 2 days)            ║
║  • 5 dreams maximum                                   ║
║  • 3 dream-specific reports monthly                   ║
║  • 1 cross-dream analysis monthly                     ║
║  • Enhanced context (6 dream, 12 cross)               ║
║                                                        ║
║  💎 Optimal Tier ($19/month) — Recommended            ║
║  • 30 reflections per month (daily practice!)         ║
║  • 7 dreams maximum                                   ║
║  • 6 dream-specific reports monthly                   ║
║  • 3 cross-dream analyses monthly                     ║
║  • Extended AI thinking                               ║
║  • Enhanced context (9 dream, 21 cross)               ║
║                                                        ║
║  [ Maybe Later ]  [ Upgrade to Essential ]            ║
║                   [ Upgrade to Optimal ]               ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

**Backend Process:**
```
Frontend attempted:
POST /api/reflections.create
{ dreamId: "dream-uuid-1", ... }

Backend validated:
1. User tier: free
2. Monthly limit: 4 reflections
3. Current usage: 4 reflections
4. Can proceed: false

Response:
{
  success: false,
  error: "Monthly reflection limit reached",
  errorCode: "LIMIT_REACHED",
  usage: {
    reflectionsUsed: 4,
    reflectionsLimit: 4,
    percentUsed: 100
  },
  upgradeOptions: {
    essential: { price: 9, reflections: 15, ... },
    optimal: { price: 19, reflections: 30, ... },
    premium: { price: 39, reflections: 45, ... }
  }
}
```

Sarah clicks "Upgrade to Optimal":

```
╔═══════════════════════════════════════════════════════╗
║            Upgrade to Optimal Tier                     ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  💎 Optimal: Dream Mastery                             ║
║  $19 per month                                         ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  What You'll Get                                       ║
║                                                        ║
║  ✓ 30 reflections per month (daily practice)          ║
║    Currently: 4 reflections                           ║
║    Gain: +26 reflections monthly                      ║
║                                                        ║
║  ✓ 7 dreams maximum                                   ║
║    Currently: 2 dreams                                ║
║    Gain: +5 dream slots                               ║
║                                                        ║
║  ✓ Extended AI thinking                               ║
║    Deeper insights with AI reasoning process          ║
║                                                        ║
║  ✓ Enhanced context                                   ║
║    • 9 reflections for dream-specific analysis        ║
║      (vs 4 on Free tier)                              ║
║    • 21 reflections for cross-dream patterns          ║
║      (vs 0 on Free tier)                              ║
║                                                        ║
║  ✓ 6 dream-specific reports monthly                   ║
║    Currently: 1 per month                             ║
║                                                        ║
║  ✓ 3 cross-dream analyses monthly                     ║
║    Currently: 0 (not available)                       ║
║                                                        ║
║  ✓ 6 dream-specific visualizations monthly            ║
║    Currently: 1 per month                             ║
║                                                        ║
║  ✓ 3 cross-dream visualizations monthly               ║
║    Currently: 0 (not available)                       ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Billing                                               ║
║  $19.00 / month                                        ║
║  Billed monthly • Cancel anytime                       ║
║  First charge: Today                                   ║
║  Next billing: March 15, 2025                          ║
║                                                        ║
║  ─────────────────────────────────────────────────────║
║                                                        ║
║  Payment Method                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Card Number: [4532 1234 5678 9010          ]    │ ║
║  │ Expiry: [12/27]  CVV: [123]                     │ ║
║  │ Name: [Sarah Chen                          ]    │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  [ ] Save payment method                              ║
║                                                        ║
║         [ Cancel ]  [ Upgrade to Optimal ]             ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

Sarah enters payment details and clicks "Upgrade to Optimal"

**Backend Processing:**
```
POST /api/subscription.upgrade
{
  targetTier: "optimal",
  paymentMethod: {
    cardNumber: "4532123456789010",
    expiry: "12/27",
    cvv: "123",
    name: "Sarah Chen"
  }
}

Backend executes:
1. Create Stripe customer
   stripe.customers.create({
     email: "sarah.chen@email.com",
     name: "Sarah Chen",
     metadata: { user_id: "uuid-sarah" }
   })

2. Attach payment method
   stripe.paymentMethods.attach(payment_method_id, {
     customer: customer_id
   })

3. Create subscription
   stripe.subscriptions.create({
     customer: customer_id,
     items: [{ price: "price_optimal_monthly" }],
     metadata: {
       user_id: "uuid-sarah",
       tier: "optimal"
     }
   })

4. Update user record
   UPDATE users SET
     tier = 'optimal',
     subscription_status = 'active',
     subscription_id = stripe_subscription_id,
     stripe_customer_id = stripe_customer_id,
     subscription_started_at = NOW(),
     subscription_expires_at = NOW() + INTERVAL '1 month',
     reflection_count_this_month = 0
   WHERE id = 'uuid-sarah'

5. Reset monthly usage for new tier
   INSERT INTO monthly_usage_tracking (
     user_id, month_year, tier_at_time,
     reflections_used, dreams_count
   ) VALUES (
     'uuid-sarah', '2025-02', 'optimal',
     0, 2
   )

6. Grant immediate access
   - Reset reflection count for February
   - User can now create 30 reflections this month
   - All premium features unlocked

Response:
{
  success: true,
  message: "Welcome to Optimal tier!",
  subscription: {
    tier: "optimal",
    status: "active",
    nextBilling: "2025-03-15",
    amount: 19.00
  },
  newLimits: {
    reflections: 30,
    dreams: 7,
    evolutionDreamSpecific: 6,
    evolutionDreamAgnostic: 3,
    visualizationDreamSpecific: 6,
    visualizationDreamAgnostic: 3
  },
  unlockedFeatures: [
    "Extended AI thinking",
    "Enhanced context (9/21 reflections)",
    "Cross-dream analysis",
    "5 additional dream slots"
  ]
}
```

**Success Screen:**

```
╔═══════════════════════════════════════════════════════╗
║           Welcome to Optimal Tier! 🎉                  ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  Your upgrade is complete!                             ║
║                                                        ║
║  You now have access to:                               ║
║  ✓ 30 monthly reflections (daily practice)            ║
║  ✓ 7 dream slots (5 more available)                   ║
║  ✓ Extended AI thinking                               ║
║  ✓ Enhanced context analysis                          ║
║  ✓ Cross-dream pattern recognition                    ║
║                                                        ║
║  Your February reflection limit has been reset.       ║
║  Continue your journey with 30 reflections available! ║
║                                                        ║
║           [ Continue to Dashboard ]                    ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

---

## Complete Architectural Flow Summary

### The WHO/WHERE/WHAT/HOW Pattern in Action

**Example: Creating a Reflection**

```
FRONTEND (WHO + WHERE):
- WHO: Sarah Chen (authenticated, optimal tier)
- WHERE: Reflection page, fashion brand dream selected
- ACTION: Submit reflection answers

POST /api/reflections.create
{
  dreamId: "dream-uuid-1",
  dream: "...",
  plan: "...",
  relationship: "...",
  offering: "...",
  tone: "fusion"
}

BACKEND (WHAT + HOW):
- WHAT: Business rules
  * Optimal tier: 30 reflections/month limit
  * Current usage: 8 reflections
  * Can create: true
  * Cost budget: within limits

- HOW: Execution
  1. Authenticate JWT token → Get user
  2. Validate dream ownership
  3. Check tier limits
  4. Build AI context with dream info
  5. Call Anthropic API with extended thinking
  6. Process response
  7. Save to database
  8. Update usage tracking
  9. Calculate next available actions
  10. Return reflection + usage state

Response includes:
- Reflection content
- Current usage stats
- Next available actions (based on thresholds)
- Upgrade prompts (if approaching limits)
```

**Example: Dashboard Load**

```
FRONTEND (WHO + WHERE):
- WHO: Sarah Chen
- WHERE: Dashboard page
- ACTION: Load dashboard data

GET /api/dashboard.getData

BACKEND (WHAT + HOW):
- WHAT: Aggregate all relevant user data
  * Current month usage
  * Active dreams with stats
  * Recent reflections
  * Latest evolution report
  * Available actions for each dream

- HOW: Parallel data fetching
  1. User context query
  2. Usage tracking query
  3. Dreams + reflection counts query
  4. Recent reflections query
  5. Evolution reports query
  6. Calculate capabilities per dream
  7. Calculate cross-dream capabilities
  8. Assemble single response object

All business logic (thresholds, limits, eligibility) 
calculated by backend, frontend just displays results
```

### Fixed Thresholds + Tiered Context (The Innovation)

**The Problem Solved:**
- Old approach: Higher tiers wait longer for reports (bad UX)
- New approach: Same wait time, better quality

**Implementation:**

```
THRESHOLDS (Same for Everyone):
- Dream-specific: Every 4 reflections
- Dream-agnostic: Every 12 reflections

CONTEXT QUALITY (Varies by Tier):
Free:     4 dream-specific,  0 dream-agnostic
Essential: 6 dream-specific, 12 dream-agnostic
Optimal:   9 dream-specific, 21 dream-agnostic  
Premium:  12 dream-specific, 30 dream-agnostic

TEMPORAL DISTRIBUTION (Always 1/3 each period):
- 1/3 from early reflections (baseline)
- 1/3 from middle reflections (progression)
- 1/3 from recent reflections (current state)

Example for Optimal user with 14 reflections:
- Total timeline: 63 days
- Context: 9 reflections needed
- Early (days 1-21): reflections #1, #2, #3
- Middle (days 22-42): reflections #5, #6, #7
- Recent (days 43-63): reflections #12, #13, #14

This shows authentic growth over time!
```

### TypeScript + RPC Architecture Benefits

**Type Safety Example:**

```typescript
// Shared types ensure contract between frontend/backend
interface CreateReflectionRequest {
  dreamId: string;
  dream: string;
  plan: string;
  hasDate: 'yes' | 'no';
  dreamDate?: string;
  relationship: string;
  offering: string;
  tone: ToneType;
}

interface CreateReflectionResponse {
  success: true;
  data: Reflection;
  usage: UsageStats;
  nextActions: AvailableActions;
}

// Frontend call is fully typed
const response = await api.post<CreateReflectionResponse>(
  '/api/reflections.create',
  reflectionData
);

// TypeScript guarantees response.data is a Reflection
// Autocomplete works, typos caught at compile time
```

**RPC Clarity:**

```typescript
// Clear, action-oriented endpoints
POST /api/dreams.create
GET  /api/dreams.list
POST /api/dreams.updateStatus

POST /api/evolution.generateReport
GET  /api/evolution.checkEligibility

POST /api/visualizations.generate
GET  /api/visualizations.list

// vs confusing REST
POST /api/dreams          // Create? Or something else?
POST /api/evolution       // What does this do?
```

---

## Complete Technical Architecture

### Backend Services Layer

```typescript
// dreamService.ts - Business logic
export const dreamService = {
  async create(userId: string, dreamData: CreateDreamInput): Promise<Dream> {
    // Check tier limits
    const user = await userModel.get(userId);
    const dreamCount = await dreamModel.countByUser(userId);
    const tierLimit = TIER_LIMITS[user.tier].dreams;
    
    if (tierLimit !== null && dreamCount >= tierLimit) {
      throw new TierLimitError('Dream limit reached');
    }
    
    // Calculate days left if target date provided
    const daysLeft = dreamData.targetDate 
      ? calculateDaysLeft(dreamData.targetDate)
      : null;
    
    // Create dream
    return await dreamModel.create({
      ...dreamData,
      userId,
      daysLeft,
      status: 'active'
    });
  },
  
  async getWithCapabilities(dreamId: string, userId: string) {
    const dream = await dreamModel.get(dreamId);
    const reflections = await reflectionModel.countByDream(dreamId);
    const user = await userModel.get(userId);
    const usage = await usageModel.getCurrentMonth(userId);
    
    return {
      ...dream,
      reflectionCount: reflections,
      capabilities: {
        canReflect: usage.reflections < TIER_LIMITS[user.tier].reflections,
        canGenerateEvolution: reflections >= EVOLUTION_THRESHOLD_DREAM_SPECIFIC,
        canGenerateVisualization: reflections >= VIZ_THRESHOLD_DREAM_SPECIFIC
      }
    };
  }
};

// evolutionService.ts
export const evolutionService = {
  async generateReport(
    userId: string, 
    request: GenerateReportRequest
  ): Promise<EvolutionReport> {
    // Get user and tier
    const user = await userModel.get(userId);
    
    // Check monthly limits
    const usage = await usageModel.getCurrentMonth(userId);
    const limit = request.reportType === 'dream_specific'
      ? TIER_LIMITS[user.tier].evolutionReports.dreamSpecific
      : TIER_LIMITS[user.tier].evolutionReports.dreamAgnostic;
    
    if (usage.evolutionReports[request.reportType] >= limit) {
      throw new UsageLimitError('Monthly evolution report limit reached');
    }
    
    // Get reflections
    const reflections = request.dreamId
      ? await reflectionModel.getByDream(request.dreamId)
      : await reflectionModel.getByUser(userId);
    
    // Temporal context distribution
    const contextReflections = await contextService.distributeTemporally(
      reflections,
      TIER_LIMITS[user.tier].context[request.reportType]
    );
    
    // Generate with AI
    const analysis = await aiService.generateEvolutionReport(
      contextReflections,
      {
        tone: request.tone,
        extendedThinking: user.tier === 'optimal' || user.tier === 'premium',
        dreamContext: request.dreamId ? await dreamModel.get(request.dreamId) : null
      }
    );
    
    // Save and return
    return await evolutionModel.create({
      userId,
      dreamId: request.dreamId,
      reportType: request.reportType,
      analysis,
      contextReflectionsUsed: contextReflections.length,
      reflectionsAnalyzed: contextReflections.map(r => r.id)
    });
  }
};

// contextService.ts - Temporal distribution logic
export const contextService = {
  distributeTemporally(
    reflections: Reflection[],
    contextLimit: number
  ): Reflection[] {
    if (reflections.length <= contextLimit) {
      return reflections;
    }
    
    // Sort by date
    const sorted = reflections.sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
    
    // Divide into three equal periods
    const perPeriod = Math.floor(contextLimit / 3);
    const remainder = contextLimit % 3;
    
    const totalTime = sorted[sorted.length - 1].createdAt.getTime() 
                    - sorted[0].createdAt.getTime();
    const periodDuration = totalTime / 3;
    
    // Select reflections from each period
    const earlyPeriod = this.selectFromPeriod(
      sorted, 
      0, 
      periodDuration, 
      perPeriod + (remainder > 0 ? 1 : 0)
    );
    
    const middlePeriod = this.selectFromPeriod(
      sorted,
      periodDuration,
      periodDuration * 2,
      perPeriod + (remainder > 1 ? 1 : 0)
    );
    
    const recentPeriod = this.selectFromPeriod(
      sorted,
      periodDuration * 2,
      totalTime,
      perPeriod
    );
    
    return [...earlyPeriod, ...middlePeriod, ...recentPeriod];
  }
};
```

### Database Schema (Complete)

```sql
-- Users with tier tracking
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  tier text NOT NULL DEFAULT 'free' 
    CHECK (tier IN ('free', 'essential', 'optimal', 'premium')),
  subscription_status text DEFAULT 'active',
  subscription_id text,
  stripe_customer_id text,
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  reflection_count_this_month int DEFAULT 0,
  total_reflections int DEFAULT 0,
  is_creator boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Dreams as first-class entities
CREATE TABLE dreams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  target_date date,
  days_left int GENERATED ALWAYS AS (
    target_date - CURRENT_DATE
  ) STORED,
  status text DEFAULT 'active' 
    CHECK (status IN ('active', 'achieved', 'archived', 'released')),
  category text,
  priority int DEFAULT 1,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  achieved_at timestamptz,
  archived_at timestamptz
);

CREATE INDEX idx_dreams_user_status ON dreams(user_id, status);
CREATE INDEX idx_dreams_target_date ON dreams(target_date) WHERE target_date IS NOT NULL;

-- Reflections (dream-linked)
CREATE TABLE reflections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dream_id uuid NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  dream text NOT NULL,
  plan text NOT NULL,
  has_date text NOT NULL CHECK (has_date IN ('yes', 'no')),
  dream_date date,
  relationship text NOT NULL,
  offering text NOT NULL,
  ai_response text NOT NULL,
  tone text DEFAULT 'fusion' CHECK (tone IN ('gentle', 'intense', 'fusion')),
  is_premium boolean DEFAULT false,
  word_count int,
  estimated_read_time int,
  title text
);

CREATE INDEX idx_reflections_user ON reflections(user_id);
CREATE INDEX idx_reflections_dream ON reflections(dream_id);
CREATE INDEX idx_reflections_created ON reflections(created_at DESC);

-- Evolution reports (dream-specific or cross-dream)
CREATE TABLE evolution_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dream_id uuid REFERENCES dreams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  report_type text NOT NULL CHECK (report_type IN ('dream_specific', 'dream_agnostic')),
  analysis text NOT NULL,
  context_reflections_used int NOT NULL,
  reflections_analyzed uuid[] NOT NULL,
  reflection_count int NOT NULL,
  time_period_start timestamptz NOT NULL,
  time_period_end timestamptz NOT NULL,
  insights jsonb,
  patterns_detected text[]
);

CREATE INDEX idx_evolution_user ON evolution_reports(user_id);
CREATE INDEX idx_evolution_dream ON evolution_reports(dream_id) WHERE dream_id IS NOT NULL;

-- Visualizations
CREATE TABLE visualizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dream_id uuid REFERENCES dreams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  visualization_type text NOT NULL CHECK (visualization_type IN ('dream_specific', 'dream_agnostic')),
  style text NOT NULL CHECK (style IN ('achievement', 'journey', 'synthesis')),
  generated_content text NOT NULL,
  artifact_url text,
  context_reflections_used int NOT NULL,
  reflection_ids uuid[] NOT NULL,
  model_used text NOT NULL,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10,4)
);

CREATE INDEX idx_viz_user ON visualizations(user_id);
CREATE INDEX idx_viz_dream ON visualizations(dream_id) WHERE dream_id IS NOT NULL;

-- Monthly usage tracking
CREATE TABLE monthly_usage_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- '2025-03'
  tier_at_time text NOT NULL,
  reflections_used int DEFAULT 0,
  dreams_count int DEFAULT 0,
  evolution_reports_dream_specific int DEFAULT 0,
  evolution_reports_dream_agnostic int DEFAULT 0,
  visualizations_dream_specific int DEFAULT 0,
  visualizations_dream_agnostic int DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

CREATE INDEX idx_usage_user_month ON monthly_usage_tracking(user_id, month_year);

-- API cost tracking
CREATE TABLE api_usage_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type text NOT NULL, -- 'reflection', 'evolution_report', 'visualization'
  model_used text NOT NULL,
  dream_id uuid REFERENCES dreams(id) ON DELETE SET NULL,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10,4),
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX idx_api_log_user ON api_usage_log(user_id);
CREATE INDEX idx_api_log_created ON api_usage_log(created_at DESC);
CREATE INDEX idx_api_log_operation ON api_usage_log(operation_type);
```

---

This comprehensive blueprint captures Sarah's complete 68-day journey through Mirror of Dreams, demonstrating every aspect of the user experience, backend processing, WHO/WHERE/WHAT/HOW pattern, fixed thresholds with tiered context, TypeScript + RPC architecture, and the complete technical implementation.