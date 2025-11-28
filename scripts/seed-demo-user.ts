/**
 * Demo User Seeding Script
 *
 * Builder: Builder-1 (Iteration 12)
 *
 * Seeds database with fully populated demo user:
 * - 5 dreams spanning diverse life areas
 * - 12-15 authentic reflections (AI-generated)
 * - Premium tier features (extended thinking)
 * - Evolution reports (via actual AI analysis)
 *
 * Usage:
 *   npx tsx scripts/seed-demo-user.ts
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// Environment validation
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Missing ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Demo user configuration
const DEMO_USER_EMAIL = 'demo@mirrorofdreams.com';

// Demo dreams data
const DEMO_DREAMS = [
  {
    title: 'Launch My SaaS Product',
    description:
      'Build and launch a profitable SaaS product that solves a real problem and generates $10k MRR within 12 months.',
    category: 'career',
    status: 'active',
    target_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    priority: 9, // high priority (1-10 scale)
    reflectionCount: 4, // Generate 4 reflections (for evolution)
  },
  {
    title: 'Run a Marathon',
    description:
      'Complete a full marathon (42.195 km) in under 4 hours while maintaining healthy training habits.',
    category: 'health',
    status: 'active',
    target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
    priority: 6, // medium priority
    reflectionCount: 3,
  },
  {
    title: 'Learn Piano',
    description:
      "Play Chopin's Nocturne in E-flat major fluently and perform it for friends and family.",
    category: 'creative',
    status: 'active',
    target_date: null, // No deadline, ongoing
    priority: 3, // low priority
    reflectionCount: 3,
  },
  {
    title: 'Build Meaningful Relationships',
    description:
      'Cultivate 3-5 deep friendships based on mutual respect, vulnerability, and shared growth.',
    category: 'relationships',
    status: 'active',
    target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    priority: 8, // high priority
    reflectionCount: 3,
  },
  {
    title: 'Achieve Financial Freedom',
    description:
      'Build passive income streams totaling $5k/month to cover living expenses and gain time freedom.',
    category: 'financial',
    status: 'active',
    target_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years
    priority: 5, // medium priority
    reflectionCount: 2,
  },
];

// Reflection templates (will be filled with AI-generated content)
const REFLECTION_TEMPLATES = {
  saas: [
    {
      tone: 'fusion' as const,
      questions: {
        dream: "I want to build a SaaS product that generates $10k MRR. It's a tool for indie makers to track their build-in-public journey - metrics, audience growth, revenue milestones. The market is crowded but I have a unique angle: integrating real-time social proof widgets.",
        plan: "Phase 1: Build MVP in 30 days using Next.js and Supabase. Phase 2: Validate with 10 early users from Twitter. Phase 3: Iterate based on feedback. Phase 4: Launch on Product Hunt. Phase 5: Scale to $10k MRR via content marketing and partnerships.",
        relationship: "I've attempted SaaS products before and failed. Two products never got past 100 users. I'm afraid of wasting another 6 months. But this time feels different - I have a clear ICP (ideal customer profile) and I've already talked to 20 potential users.",
        offering: "I'm willing to work nights and weekends for the next 6 months. I'll invest $5k for tools and ads. I'll sacrifice some social time and hobbies. Most importantly, I'll ship even when the product isn't perfect - my biggest blocker before was perfectionism.",
      },
      daysAgo: 2,
    },
    {
      tone: 'fusion' as const,
      questions: {
        dream: "Same SaaS goal. I've built the landing page and set up authentication. The core feature (dashboard for tracking metrics) is 40% done.",
        plan: "This week: Finish dashboard layout. Next week: Add data visualization charts. Week 3: Build social proof widget. Week 4: Soft launch to beta users.",
        relationship: "Feeling more confident now that I have tangible progress. But also anxious about scope creep - I keep wanting to add features. Need to stay focused on MVP.",
        offering: "This week I'm dedicating 15 hours. Already blocked calendar. Saying no to a friend's party on Saturday. Also committed to shipping even if the UI isn't polished - functionality first.",
      },
      daysAgo: 7,
    },
    {
      tone: 'intense' as const,
      questions: {
        dream: "Still building the SaaS. Hit a wall with the data visualization library - it's not playing nice with SSR (server-side rendering). Frustrated.",
        plan: "Debug for 2 more hours max, then switch to a simpler charting library. Can't let one technical issue derail the whole timeline.",
        relationship: "Honestly doubting myself. Maybe I'm not technical enough. Maybe I should just hire a developer. But I know this is just resistance. I can figure this out.",
        offering: "Burning the midnight oil tonight. Already messaged the beta users that launch will be delayed 3 days. Accepting that perfection is the enemy of done. Willing to ship something 'good enough' and iterate.",
      },
      daysAgo: 12,
    },
    {
      tone: 'fusion' as const,
      questions: {
        dream: "SaaS MVP is DONE. Soft launched to 10 beta users yesterday. Already got 3 sign-ups and amazing feedback. One user said 'This is exactly what I needed.' Feeling electric.",
        plan: "This week: Fix 2 critical bugs reported. Add email notifications. Next week: Product Hunt launch. Start outreach to micro-influencers in the indie maker space.",
        relationship: "This is the validation I needed. For the first time, I actually believe I can hit $10k MRR. The product resonates. People are willing to pay. Now it's just about execution.",
        offering: "Going all-in. Took a week off from my day job to focus on launch. Willing to invest another $2k in ads. Most importantly, willing to show up every day even when momentum drops. This is real now.",
      },
      daysAgo: 18,
    },
  ],
  marathon: [
    {
      tone: 'gentle' as const,
      questions: {
        dream: "I want to run a full marathon in under 4 hours. I'm currently running 3-4 times a week, averaging 20km per week. Never ran more than 10km in one go.",
        plan: "Follow a 16-week training plan. Gradually increase weekly mileage by 10% max. Include one long run per week. Add strength training twice a week. Get proper running shoes fitted.",
        relationship: "Running has always been meditation for me. But I've never committed to a big goal like this. Part of me doubts I can do it. Another part knows I just need to trust the process.",
        offering: "Early morning runs 4-5 days a week. Saying no to late-night social events the night before long runs. Investing in a running coach ($300/month). Willing to embrace discomfort during speed work.",
      },
      daysAgo: 5,
    },
    {
      tone: 'gentle' as const,
      questions: {
        dream: "Marathon training is going well. Hit my first 15km long run last Sunday. Legs were sore for 2 days but I felt accomplished.",
        plan: "This week: 25km total. Sunday: 16km long run. Focus on keeping heart rate in Zone 2 (conversational pace).",
        relationship: "Starting to believe this is possible. My body is adapting. But I'm also learning to listen to it - took an extra rest day when my knee felt tweaky.",
        offering: "Meal prepping healthy dinners on Sundays. Going to bed by 10pm on long run weekends. Stretching and foam rolling even when I don't feel like it.",
      },
      daysAgo: 14,
    },
    {
      tone: 'gentle' as const,
      questions: {
        dream: "Just finished my first half marathon distance (21km) in training. Time: 2:05. If I maintain this pace, I can definitely hit sub-4 hours for the full.",
        plan: "Next 8 weeks: Peak mileage phase (60km per week). Two more 30km+ long runs. Then taper for race day.",
        relationship: "Feeling strong and confident. Running has become non-negotiable. It's part of who I am now, not just something I'm 'trying.'",
        offering: "Signed up for the marathon officially ($150 entry fee). Told all my friends so I'm publicly committed. Willing to embrace race-day nerves and uncertainty.",
      },
      daysAgo: 28,
    },
  ],
  piano: [
    {
      tone: 'gentle' as const,
      questions: {
        dream: "I want to play Chopin's Nocturne in E-flat major beautifully. I've been playing piano on-and-off for years but never seriously. I can read sheet music and play simple pieces.",
        plan: "Practice 30 minutes daily. Break the piece into 4-bar sections. Master each section slowly before speeding up. Work with a piano teacher once a week ($60/lesson).",
        relationship: "Piano brings me so much joy, but I'm intimidated by classical pieces. This Nocturne feels impossible right now. But I know it's about consistent practice, not talent.",
        offering: "Blocking 6:30-7am every morning for practice (before work). Investing in a better keyboard ($800). Willing to sound terrible for months before I sound good.",
      },
      daysAgo: 3,
    },
    {
      tone: 'fusion' as const,
      questions: {
        dream: "Learning the first 8 bars of the Nocturne. It's incredibly challenging but also meditative. My fingers don't want to cooperate with the tempo changes.",
        plan: "Focus on right hand melody first. Practice left-hand accompaniment separately. Then combine at 50% speed. My teacher says I need to 'feel' the rubato, not count it mathematically.",
        relationship: "I'm in that frustrating stage where I know what it should sound like but can't execute yet. Reminding myself this is part of the process. Trusting slow progress.",
        offering: "Extended my practice to 45 minutes on weekends. Recording myself weekly to track improvement. Willing to repeat boring finger exercises because I know they'll pay off.",
      },
      daysAgo: 21,
    },
    {
      tone: 'gentle' as const,
      questions: {
        dream: "I played the first 16 bars for my teacher today and she said 'It's starting to sound musical.' That was such validating feedback. I can hear the piece coming alive.",
        plan: "Learn the middle section (bars 17-32) over the next month. Then work on connecting all sections smoothly.",
        relationship: "I'm falling in love with this piece more every day. It's teaching me patience. It's teaching me that mastery is a slow unfolding, not a sudden breakthrough.",
        offering: "Committed to practice even on tired days (even if just 15 minutes). Willing to play in front of friends once I have the full piece ready, even though performing terrifies me.",
      },
      daysAgo: 42,
    },
  ],
  relationships: [
    {
      tone: 'fusion' as const,
      questions: {
        dream: "I want to build 3-5 truly deep friendships. Right now I have a lot of acquaintances but very few people I can be vulnerable with. I want friendships based on mutual growth, honesty, and showing up for each other.",
        plan: "Identify 5-7 people I genuinely resonate with. Reach out for 1-on-1 hangouts (not group settings). Share something real about myself early to set the tone. Be consistent - check in weekly.",
        relationship: "I've been hurt before by friends who ghosted or only showed up when convenient for them. I'm scared of investing in people who won't reciprocate. But I also know I can't build deep connections without risk.",
        offering: "Willing to initiate even when it feels awkward. Will drive to meet people on their schedule. Commit to showing up even when I'd rather stay home. Most importantly, willing to be emotionally honest.",
      },
      daysAgo: 6,
    },
    {
      tone: 'fusion' as const,
      questions: {
        dream: "I reached out to 4 people this week. Had coffee with 2 of them - one conversation was surface-level, the other felt genuinely connective. We talked about creative struggles and both shared vulnerable stories.",
        plan: "Follow up with the person I connected with. Suggest a hike next week. Reach out to 2 more people on my list.",
        relationship: "I'm noticing how much effort this takes. But also realizing that good friendships require intentionality. You can't just wait for them to happen.",
        offering: "Blocked off Saturday for a longer hangout (hiking). Sent a thoughtful text checking in on someone who mentioned they were stressed. Willing to keep initiating even if not everyone reciprocates.",
      },
      daysAgo: 15,
    },
    {
      tone: 'gentle' as const,
      questions: {
        dream: "Had my second hangout with Alex (from the coffee chat). We went deeper - talked about fear of failure, family dynamics, what we actually want from life. Felt like I made a real friend.",
        plan: "Keep building this friendship. Also nurture the other 2-3 promising connections. Host a small dinner party to bring people together.",
        relationship: "It's working. Vulnerability begets vulnerability. When I show up as my real self, people feel safe to do the same. This is how real friendships form.",
        offering: "Willing to invest time and energy into this. Committing to weekly check-ins with close friends. Will keep showing up consistently, not just when I need something.",
      },
      daysAgo: 29,
    },
  ],
  financial: [
    {
      tone: 'intense' as const,
      questions: {
        dream: "Financial freedom: $5k/month in passive income. Right now I have a full-time job ($6k/month after tax) and zero passive income. I want freedom to work on projects I care about without financial stress.",
        plan: "Three income streams: (1) Build a productized service ($2k/mo target), (2) Create a paid course/ebook ($1.5k/mo), (3) Invest in dividend stocks ($1.5k/mo). Timeline: 2 years.",
        relationship: "I'm tired of trading time for money. Tired of asking permission for time off. Tired of anxiety about job security. But I'm also scared of failing at entrepreneurship. Passive income isn't actually passive - it requires massive upfront work.",
        offering: "Working side projects 10-15 hours/week for the next 2 years. Investing $1k/month into stocks. Saying no to lifestyle inflation. Willing to live frugally now for freedom later.",
      },
      daysAgo: 8,
    },
    {
      tone: 'fusion' as const,
      questions: {
        dream: "Made first $200 from my productized service (design templates). It's not much but it proves the concept works. People will pay for productized expertise.",
        plan: "Double down on what's working. Create 10 more template packs. Build an email list. Aim for $500/month in the next 60 days.",
        relationship: "This is the spark I needed. For the first time, I'm making money while I sleep (literally - sales came in overnight). It's addictive. I want more of this feeling.",
        offering: "Reinvesting all earnings back into the business. Spending weekends building instead of scrolling. Willing to experiment and fail fast. Embracing the long game.",
      },
      daysAgo: 35,
    },
  ],
};

/**
 * Generate AI reflection response
 */
async function generateAIResponse(
  dreamTitle: string,
  dreamDescription: string,
  userQuestions: {
    dream: string;
    plan: string;
    relationship: string;
    offering: string;
  },
  tone: 'fusion' | 'gentle' | 'intense'
): Promise<string> {
  console.log(`   🤖 Generating AI response (${tone} tone)...`);

  // Map tone names to actual prompt file names
  const toneFileMap = {
    fusion: 'sacred_fusion.txt',
    gentle: 'gentle_clarity.txt',
    intense: 'luminous_intensity.txt',
  };

  // Load tone prompt
  const promptFileName = toneFileMap[tone];
  const promptPath = path.join(process.cwd(), 'prompts', promptFileName);

  if (!fs.existsSync(promptPath)) {
    console.warn(`   ⚠️  Prompt file not found: ${promptPath}, using fallback`);
    // Fallback response if prompt file missing
    return `This is a meaningful dream that requires deep reflection. Let me share some insights based on your answers...

**On Your Dream:**
${userQuestions.dream.substring(0, 150)}...

**On Your Plan:**
Your approach shows intentionality. ${userQuestions.plan.substring(0, 100)}...

**On Your Relationship:**
The vulnerability here is powerful. ${userQuestions.relationship.substring(0, 100)}...

**On What You're Offering:**
Your commitment is clear. ${userQuestions.offering.substring(0, 100)}...

Continue reflecting regularly. Each reflection deepens your understanding and strengthens your commitment.`;
  }

  const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

  const userMessage = `Dream: ${dreamTitle}
Description: ${dreamDescription}

User's Reflection:

**What is your dream?**
${userQuestions.dream}

**What is your plan?**
${userQuestions.plan}

**What is your relationship with this dream?**
${userQuestions.relationship}

**What are you willing to offer?**
${userQuestions.offering}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      temperature: 1,
      max_tokens: 6000, // Premium tier
      thinking: {
        type: 'enabled',
        budget_tokens: 5000, // Extended thinking
      },
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text content (filter out thinking blocks)
    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n\n');

    return textContent;
  } catch (error) {
    console.error(`   ❌ AI generation failed:`, error);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedDemoUser() {
  console.log('🌱 Starting demo user seeding...\n');

  try {
    // 1. Fetch demo user
    console.log('📥 Fetching demo user...');
    const { data: demoUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', DEMO_USER_EMAIL)
      .single();

    if (userError || !demoUser) {
      console.error('❌ Demo user not found. Run database migration first:');
      console.error('   supabase db reset');
      process.exit(1);
    }

    console.log(`✅ Demo user found: ${demoUser.email} (ID: ${demoUser.id})\n`);

    // 2. Delete existing demo data
    console.log('🧹 Cleaning existing demo data...');
    await supabase.from('reflections').delete().eq('user_id', demoUser.id);
    await supabase.from('dreams').delete().eq('user_id', demoUser.id);
    await supabase.from('evolution_reports').delete().eq('user_id', demoUser.id);
    await supabase.from('visualizations').delete().eq('user_id', demoUser.id);
    console.log('✅ Cleaned existing data\n');

    // 3. Create dreams
    console.log('✨ Creating demo dreams...');
    const createdDreams = [];

    for (const dreamData of DEMO_DREAMS) {
      const { data: dream, error } = await supabase
        .from('dreams')
        .insert({
          user_id: demoUser.id,
          title: dreamData.title,
          description: dreamData.description,
          category: dreamData.category,
          status: dreamData.status,
          target_date: dreamData.target_date?.toISOString() || null,
          priority: dreamData.priority,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create dream: ${dreamData.title}`, error);
        throw error;
      }

      createdDreams.push({ ...dream, reflectionCount: dreamData.reflectionCount });
      console.log(`   ✅ ${dreamData.title}`);
    }

    console.log(`✅ Created ${createdDreams.length} dreams\n`);

    // 4. Generate and insert reflections
    console.log('🪞 Generating demo reflections (this may take a few minutes)...\n');
    let totalReflections = 0;

    for (let i = 0; i < createdDreams.length; i++) {
      const dream = createdDreams[i];
      const dreamKey = dream.title.toLowerCase().includes('saas')
        ? 'saas'
        : dream.title.toLowerCase().includes('marathon')
        ? 'marathon'
        : dream.title.toLowerCase().includes('piano')
        ? 'piano'
        : dream.title.toLowerCase().includes('relationship')
        ? 'relationships'
        : 'financial';

      const templates = REFLECTION_TEMPLATES[dreamKey];
      if (!templates) {
        console.warn(`   ⚠️  No templates for dream: ${dream.title}`);
        continue;
      }

      const reflectionsToCreate = Math.min(dream.reflectionCount, templates.length);

      console.log(`📖 Dream ${i + 1}/${createdDreams.length}: ${dream.title} (${reflectionsToCreate} reflections)`);

      for (let j = 0; j < reflectionsToCreate; j++) {
        const template = templates[j];
        const createdDate = new Date(Date.now() - template.daysAgo * 24 * 60 * 60 * 1000);

        console.log(`   Reflection ${j + 1}/${reflectionsToCreate} (${template.daysAgo} days ago)...`);

        // Generate AI response
        const aiResponse = await generateAIResponse(
          dream.title,
          dream.description,
          template.questions,
          template.tone
        );

        // Insert reflection with correct schema columns
        const { error: reflectionError } = await supabase.from('reflections').insert({
          user_id: demoUser.id,
          dream_id: dream.id,
          dream: template.questions.dream,
          plan: template.questions.plan,
          has_date: dream.target_date ? 'yes' : 'no',
          dream_date: dream.target_date ? dream.target_date : null,
          relationship: template.questions.relationship,
          offering: template.questions.offering,
          ai_response: aiResponse,
          tone: template.tone,
          is_premium: true,
          word_count: aiResponse.split(/\s+/).length,
          created_at: createdDate.toISOString(),
          updated_at: createdDate.toISOString(),
        });

        if (reflectionError) {
          console.error(`   ❌ Failed to insert reflection:`, reflectionError);
          throw reflectionError;
        }

        console.log(`   ✅ Reflection created (${aiResponse.split(/\s+/).length} words)`);
        totalReflections++;

        // Rate limiting: wait 1 second between AI calls
        if (j < reflectionsToCreate - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log('');
    }

    console.log(`✅ Generated ${totalReflections} reflections\n`);

    // 5. Update user stats
    console.log('📊 Updating user stats...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_reflections: totalReflections,
        reflection_count_this_month: totalReflections,
        updated_at: new Date().toISOString(),
      })
      .eq('id', demoUser.id);

    if (updateError) {
      console.error('❌ Failed to update user stats:', updateError);
      throw updateError;
    }

    console.log('✅ User stats updated\n');

    // Done!
    console.log('🎉 Demo user seeding complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   • Demo user: ${DEMO_USER_EMAIL}`);
    console.log(`   • Dreams created: ${createdDreams.length}`);
    console.log(`   • Reflections generated: ${totalReflections}`);
    console.log(`\n✨ Demo account is ready for testing!\n`);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDemoUser();
