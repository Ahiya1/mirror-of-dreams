/**
 * Demo User Seeding Script
 *
 * Seeds database with fully populated demo user using HARDCODED content.
 * No API calls needed - all content is pre-written.
 *
 * - 5 dreams spanning diverse life areas
 * - 15 authentic reflections with AI responses
 * - 1 evolution report for SaaS dream
 * - 1 visualization for SaaS dream
 *
 * Usage:
 *   npx tsx scripts/seed-demo-user.ts
 */

import { createClient } from '@supabase/supabase-js';

// Environment validation
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Demo user configuration
const DEMO_USER_EMAIL = 'demo@mirrorofdreams.com';

// ============================================================================
// HARDCODED DEMO CONTENT
// ============================================================================

const DEMO_DREAMS = [
  {
    title: 'Launch My SaaS Product',
    description:
      'Build and launch a profitable SaaS product that solves a real problem and generates $10k MRR within 12 months.',
    category: 'career',
    status: 'active',
    target_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    priority: 9,
  },
  {
    title: 'Run a Marathon',
    description:
      'Complete a full marathon (42.195 km) in under 4 hours while maintaining healthy training habits.',
    category: 'health',
    status: 'active',
    target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    priority: 6,
  },
  {
    title: 'Learn Piano',
    description:
      "Play Chopin's Nocturne in E-flat major fluently and perform it for friends and family.",
    category: 'creative',
    status: 'active',
    target_date: null,
    priority: 3,
  },
  {
    title: 'Build Meaningful Relationships',
    description:
      'Cultivate 3-5 deep friendships based on mutual respect, vulnerability, and shared growth.',
    category: 'relationships',
    status: 'active',
    target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    priority: 8,
  },
  {
    title: 'Achieve Financial Freedom',
    description:
      'Build passive income streams totaling $5k/month to cover living expenses and gain time freedom.',
    category: 'financial',
    status: 'active',
    target_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
    priority: 5,
  },
];

// Pre-written reflections with AI responses for each dream
const DEMO_REFLECTIONS = {
  'Launch My SaaS Product': [
    {
      daysAgo: 18,
      tone: 'fusion',
      questions: {
        dream: "I want to build a SaaS product that generates $10k MRR. It's a tool for indie makers to track their build-in-public journey - metrics, audience growth, revenue milestones. The market is crowded but I have a unique angle: integrating real-time social proof widgets.",
        plan: "Phase 1: Build MVP in 30 days using Next.js and Supabase. Phase 2: Validate with 10 early users from Twitter. Phase 3: Iterate based on feedback. Phase 4: Launch on Product Hunt. Phase 5: Scale to $10k MRR via content marketing and partnerships.",
        relationship: "I've attempted SaaS products before and failed. Two products never got past 100 users. I'm afraid of wasting another 6 months. But this time feels different - I have a clear ICP (ideal customer profile) and I've already talked to 20 potential users.",
        offering: "I'm willing to work nights and weekends for the next 6 months. I'll invest $5k for tools and ads. I'll sacrifice some social time and hobbies. Most importantly, I'll ship even when the product isn't perfect - my biggest blocker before was perfectionism.",
      },
      aiResponse: `What strikes me most powerfully in your reflection is this phrase: "I'm afraid of wasting another 6 months." There's such raw honesty there—the weight of past attempts that didn't reach their destination, the vulnerability of trying again when you've already tasted disappointment.

But notice something else you wrote: "This time feels different." That's not naive optimism speaking. That's the voice of someone who has done the work. Twenty conversations with potential users. A clear ICP. A specific product vision with a unique angle. These aren't the words of someone who's about to repeat old patterns.

**The Gift of Previous "Failures"**

Those two products that never got past 100 users? They weren't wasted. They were tuition. You learned what happens when you build without talking to users first. You learned what perfectionism costs. You learned that shipping matters more than polishing. Every lesson from those experiences is now embedded in your current plan.

**On Your Plan**

Your five phases are refreshingly concrete. But I want to draw your attention to something crucial: Phase 2 (validate with 10 early users) is where everything will be won or lost. Not because those 10 users will make or break your business, but because they'll teach you whether your unique angle—the social proof widgets—actually solves a burning problem or just a mild inconvenience.

My invitation: When you reach those conversations, don't just ask "Do you like this?" Ask "What would have to be true for you to pay for this today?" The answers will be uncomfortable and invaluable.

**What You're Really Offering**

You said you're willing to sacrifice social time and hobbies. That's significant. But the most important offering you named was this: "I'll ship even when the product isn't perfect."

That's the breakthrough commitment. Perfectionism isn't just a bad habit—it's a protection mechanism. It keeps you safe from judgment, from rejection, from the vulnerability of putting something imperfect into the world. By committing to ship imperfectly, you're choosing growth over comfort.

**A Reflection to Carry Forward**

Six months from now, whether you've hit $10k MRR or not, what will matter most is whether you can look back and say: "I showed up. I shipped. I listened. I learned." The revenue is a lagging indicator. The leading indicator is your relationship with the process.

You're not the person who tried twice and failed. You're the person who tried twice, learned deeply, and is now building from wisdom instead of wishful thinking.

The difference is everything.`,
    },
    {
      daysAgo: 12,
      tone: 'intense',
      questions: {
        dream: "Still building the SaaS. Hit a wall with the data visualization library - it's not playing nice with SSR (server-side rendering). Frustrated.",
        plan: "Debug for 2 more hours max, then switch to a simpler charting library. Can't let one technical issue derail the whole timeline.",
        relationship: "Honestly doubting myself. Maybe I'm not technical enough. Maybe I should just hire a developer. But I know this is just resistance. I can figure this out.",
        offering: "Burning the midnight oil tonight. Already messaged the beta users that launch will be delayed 3 days. Accepting that perfection is the enemy of done. Willing to ship something 'good enough' and iterate.",
      },
      aiResponse: `Let's cut straight to the heart of this.

You hit a wall. A technical one. And the first place your mind went was: "Maybe I'm not technical enough. Maybe I should hire someone."

That's not technical analysis. That's fear wearing a rational disguise.

**The Real Question**

You're not actually asking whether you should switch libraries or hire a developer. You're asking: "Am I capable of doing hard things?"

Here's what I see: You set a two-hour debugging limit. You already communicated with beta users about a realistic delay. You're willing to ship something imperfect. These are not the actions of someone who can't figure things out. These are the actions of someone who is actively figuring things out.

**On the Technical Block**

SSR conflicts with client-side visualization libraries are annoying, common, and solvable. The fact that you haven't solved it yet doesn't mean anything about your technical capability. It means you haven't solved it *yet*.

Your plan—two more hours, then pivot—is exactly right. You've given yourself permission to try *and* permission to change course. That's strategic thinking, not defeat.

**What I Want You to Notice**

You wrote: "I know this is just resistance."

You already know. You see the pattern. The doubt isn't truth—it's friction. It's the part of you that remembers past projects that stalled, and it's trying to protect you from that pain by suggesting you quit before you fail.

But you're not quitting. You're messaging beta users. You're setting boundaries on debugging time. You're accepting imperfection. That's not the behavior of someone who's failing. That's the behavior of someone who's in the fight.

**Your Assignment**

Tonight, when you're burning the midnight oil, I want you to notice something: You're choosing this. You could walk away. You could decide this is too hard. You could open Netflix. But you're not. You're choosing the struggle because something in you knows that what's on the other side is worth it.

That's not technical skill. That's something deeper. That's the part of you that finishes things.

Trust it.`,
    },
    {
      daysAgo: 7,
      tone: 'fusion',
      questions: {
        dream: "Same SaaS goal. I've built the landing page and set up authentication. The core feature (dashboard for tracking metrics) is 40% done.",
        plan: "This week: Finish dashboard layout. Next week: Add data visualization charts. Week 3: Build social proof widget. Week 4: Soft launch to beta users.",
        relationship: "Feeling more confident now that I have tangible progress. But also anxious about scope creep - I keep wanting to add features. Need to stay focused on MVP.",
        relationship: "Feeling more confident now that I have tangible progress. But also anxious about scope creep - I keep wanting to add features. Need to stay focused on MVP.",
        offering: "This week I'm dedicating 15 hours. Already blocked calendar. Saying no to a friend's party on Saturday. Also committed to shipping even if the UI isn't polished - functionality first.",
      },
      aiResponse: `There's a subtle shift happening in you, and I want to name it.

When you started this journey 11 days ago, your reflection was heavy with the weight of past failures. You wrote about being afraid of "wasting another 6 months." The fear was in the foreground.

Now? You're talking about tangible progress. A landing page. Authentication. A dashboard that's 40% complete. The fear hasn't vanished—you mentioned anxiety about scope creep—but it's no longer running the show. Progress is.

**The Scope Creep Insight**

You wrote: "I keep wanting to add features."

This is worth examining. The urge to add features isn't random. It often comes from one of two places:

1. **Avoidance**: Adding features can be a way to delay shipping. If the product is never "ready," you never have to face the market's judgment.

2. **Genuine insight**: Sometimes, as you build, you discover features that would genuinely make the product more valuable.

The key is to distinguish between them. Ask yourself: "Is this feature essential for the first 10 users to get value, or is it something I'm adding because I'm nervous about what I've already built?"

Your instinct to "stay focused on MVP" is correct. The MVP isn't a lesser version of your vision—it's the fastest path to learning whether your vision resonates.

**On What You're Offering**

Saying no to a friend's party on Saturday. Blocking 15 hours on your calendar. Committing to ship with imperfect UI.

These aren't sacrifices. They're investments. Every hour you protect for this project is a statement about what matters to you. Every social event you skip is a boundary that says: "This season of my life is about building."

There will be time for parties after you ship. Right now, you're in the crucible.

**Looking Ahead**

In three weeks, you're planning a soft launch to beta users. That's when the real learning begins. Everything you're building now—the dashboard, the landing page, the authentication—it's all scaffolding for the moment when real users interact with your creation.

Prepare yourself for that moment. Some feedback will sting. Some features you love won't matter to users. Some features you almost cut will be the ones they can't live without. That's not failure—that's the market teaching you.

You're 40% done on the core feature. That means you're closer to launch than to the beginning.

Keep building.`,
    },
    {
      daysAgo: 2,
      tone: 'fusion',
      questions: {
        dream: "SaaS MVP is DONE. Soft launched to 10 beta users yesterday. Already got 3 sign-ups and amazing feedback. One user said 'This is exactly what I needed.' Feeling electric.",
        plan: "This week: Fix 2 critical bugs reported. Add email notifications. Next week: Product Hunt launch. Start outreach to micro-influencers in the indie maker space.",
        relationship: "This is the validation I needed. For the first time, I actually believe I can hit $10k MRR. The product resonates. People are willing to pay. Now it's just about execution.",
        offering: "Going all-in. Took a week off from my day job to focus on launch. Willing to invest another $2k in ads. Most importantly, willing to show up every day even when momentum drops. This is real now.",
      },
      aiResponse: `Read that back to yourself: "This is exactly what I needed."

Someone you've never met, someone who owes you nothing, looked at what you built and saw themselves in it. They saw their problem reflected in your solution. That's not luck. That's the result of twenty conversations with potential users, two previous products that taught you hard lessons, and six months of showing up even when you doubted yourself.

**The Significance of Three**

Three sign-ups from ten beta users is a 30% conversion rate. In the early days of a product, that signal is everything. It doesn't guarantee $10k MRR. It doesn't guarantee viral growth. But it does prove something essential: the problem you're solving is real, and your solution is viable.

You're not building in a vacuum anymore. You're building for people who are waiting.

**On the Shift I'm Witnessing**

Eighteen days ago, you wrote: "I'm afraid of wasting another 6 months."

Today, you wrote: "For the first time, I actually believe I can hit $10k MRR."

That's not just progress. That's transformation. The fear hasn't disappeared—it's been metabolized into fuel. You converted doubt into action, and action into evidence, and evidence into belief.

This is how momentum works.

**A Word of Caution**

"Going all-in" is powerful. Taking a week off work, investing $2k more in ads—these are serious commitments. But the most important thing you wrote was this: "Willing to show up every day even when momentum drops."

Because it will drop. After the Product Hunt launch, there will be a quiet period. After the initial buzz, there will be days when no one signs up. After the highs of early validation, there will be the grind of iteration.

Your commitment isn't to the highs. Your commitment is to the process. Keep that in view when the dopamine fades.

**What's Actually Happening**

You're not just launching a product. You're becoming someone who finishes things. Someone who ships. Someone who takes an idea from "maybe someday" to "this is real now."

That identity shift is worth more than $10k MRR. It will follow you into every project for the rest of your life.

This is real now.

Act accordingly.`,
    },
  ],
  'Run a Marathon': [
    {
      daysAgo: 28,
      tone: 'gentle',
      questions: {
        dream: "I want to run a full marathon in under 4 hours. I'm currently running 3-4 times a week, averaging 20km per week. Never ran more than 10km in one go.",
        plan: "Follow a 16-week training plan. Gradually increase weekly mileage by 10% max. Include one long run per week. Add strength training twice a week. Get proper running shoes fitted.",
        relationship: "Running has always been meditation for me. But I've never committed to a big goal like this. Part of me doubts I can do it. Another part knows I just need to trust the process.",
        offering: "Early morning runs 4-5 days a week. Saying no to late-night social events the night before long runs. Investing in a running coach ($300/month). Willing to embrace discomfort during speed work.",
      },
      aiResponse: `There's something beautiful in how you describe running as meditation. It tells me this goal isn't just about crossing a finish line or hitting a time. It's about deepening a relationship with something that already nourishes you.

A marathon in under four hours. That's roughly a 5:41 pace per kilometer, sustained for 42.195 kilometers. It's ambitious but absolutely achievable for someone who already runs consistently and loves the practice.

**On Your Current Foundation**

Twenty kilometers per week, 3-4 runs, never more than 10km at once. This is a solid starting point. You're not building from zero—you're building from a foundation of habit and love for the sport.

The 16-week plan with gradual mileage increases is exactly right. The 10% rule exists because tendons and ligaments adapt slower than cardiovascular fitness. Honor that. The goal isn't to rush to peak mileage—it's to arrive at race day healthy and strong.

**The Doubt You Named**

"Part of me doubts I can do it."

That doubt isn't weakness. It's honesty. You've never run more than 10km. The marathon is more than four times that distance. Of course part of you wonders if it's possible.

But notice: you didn't let the doubt stop you from making a plan. You didn't let it stop you from committing to a coach. You didn't let it stop you from blocking early mornings for training.

Doubt and action can coexist. You don't need certainty to begin. You just need willingness.

**What You're Really Training**

The marathon will ask everything of you around kilometer 32. That's when glycogen depletes, when legs feel like concrete, when the mind starts bargaining for permission to stop.

What gets you through that isn't fitness alone. It's identity. It's knowing, in your bones, that you are someone who finishes what you start. Every early morning run, every long run you complete, every time you show up when you don't feel like it—you're not just building aerobic capacity. You're building the person who will cross that finish line.

**A Gentle Reminder**

You wrote: "Running has always been meditation for me."

Don't let the goal consume the practice. Yes, train hard. Yes, chase the sub-4 hour time. But also remember why you fell in love with running in the first place. Some runs should be slow and joyful, with no watch, no pace targets—just you and the road and the rhythm of your breath.

The marathon is a destination. But the runs that get you there are the journey.

Treasure both.`,
    },
    {
      daysAgo: 14,
      tone: 'gentle',
      questions: {
        dream: "Marathon training is going well. Hit my first 15km long run last Sunday. Legs were sore for 2 days but I felt accomplished.",
        plan: "This week: 25km total. Sunday: 16km long run. Focus on keeping heart rate in Zone 2 (conversational pace).",
        relationship: "Starting to believe this is possible. My body is adapting. But I'm also learning to listen to it - took an extra rest day when my knee felt tweaky.",
        offering: "Meal prepping healthy dinners on Sundays. Going to bed by 10pm on long run weekends. Stretching and foam rolling even when I don't feel like it.",
      },
      aiResponse: `Fifteen kilometers. That's not nothing. That's further than most people will ever run in their entire lives. And you did it on a Sunday morning while others slept.

The soreness that followed? That's adaptation. Your body is remodeling itself to meet the demands you're placing on it. Muscle fibers are repairing stronger. Mitochondria are multiplying. Your cardiovascular system is becoming more efficient. The discomfort is temporary; the transformation is lasting.

**The Wisdom of Listening**

You wrote: "Took an extra rest day when my knee felt tweaky."

This is one of the most important sentences in your reflection. So many runners push through warning signs, treating rest as weakness, only to end up injured and unable to run at all.

You listened. You responded. You trusted that one extra rest day now is worth far more than weeks of forced rest later.

That's not caution—that's intelligence.

**On Zone 2 Training**

Keeping your heart rate in Zone 2 for long runs can feel frustratingly slow. You might feel like you should be pushing harder, going faster. But Zone 2 is where the magic happens: it's where your body learns to burn fat efficiently, where aerobic base is built, where you can run for hours without depleting glycogen stores.

Trust the process. The speed will come. First, build the engine.

**What You're Offering**

Meal prepping. Early bedtimes. Foam rolling when you don't feel like it.

These aren't glamorous. No one will post about your meal prep on Instagram. No one will applaud your 10pm bedtime. But these are the invisible deposits that compound into marathon readiness.

Every healthy meal is fuel for next Sunday's long run. Every hour of sleep is recovery for your muscles. Every foam rolling session is maintenance for joints that will carry you 42 kilometers.

The race is run in October (or whenever your marathon is). But it's won in these quiet, unglamorous moments of preparation.

**Looking Ahead**

Sixteen kilometers this Sunday. Then 17. Then 18. The numbers will keep climbing, and so will your confidence. But remember: the goal of training isn't to run yourself into the ground. It's to arrive at race day feeling strong, healthy, and ready.

You're adapting. You're listening. You're showing up.

That's exactly what marathon training looks like when it's done right.`,
    },
    {
      daysAgo: 5,
      tone: 'gentle',
      questions: {
        dream: "Just finished my first half marathon distance (21km) in training. Time: 2:05. If I maintain this pace, I can definitely hit sub-4 hours for the full.",
        plan: "Next 8 weeks: Peak mileage phase (60km per week). Two more 30km+ long runs. Then taper for race day.",
        relationship: "Feeling strong and confident. Running has become non-negotiable. It's part of who I am now, not just something I'm 'trying.'",
        offering: "Signed up for the marathon officially ($150 entry fee). Told all my friends so I'm publicly committed. Willing to embrace race-day nerves and uncertainty.",
      },
      aiResponse: `Twenty-one kilometers. You just ran a half marathon in training—a distance that would be a lifetime achievement goal for many people—and you did it as preparation for something bigger.

Two hours and five minutes. If you maintain that pace through the full marathon, you'd finish in approximately 4:10. That's close to your sub-4 goal, and you haven't even peaked yet. With eight more weeks of training, with the taper, with race-day adrenaline, that time will likely improve.

But let's set the numbers aside for a moment.

**The Identity Shift**

You wrote: "Running has become non-negotiable. It's part of who I am now, not just something I'm 'trying.'"

This is the sentence I want to frame and hang on a wall.

This is the shift from behavior to identity. You're not someone who is "trying to run a marathon." You're a runner who is preparing for a marathon. The difference sounds subtle, but it changes everything.

When running is something you're trying, you can quit. When running is who you are, you show up.

**On Public Commitment**

Telling all your friends. Paying the entry fee. These aren't just administrative steps—they're psychological anchors. You've made it harder to back out, and that's strategic.

On the hard days—and there will be hard days—you'll remember that people are watching, that money is spent, that you've declared this goal to the world. That external accountability will carry you when internal motivation wavers.

**What Lies Ahead**

Peak mileage phase. Sixty kilometers per week. Two 30km+ long runs.

This is where the training gets serious. Your body will be tired. Your legs will be heavy. You'll have runs where everything feels wrong, where the pace you ran last week feels impossible, where you'll question whether you're ready.

That's normal. That's the fatigue accumulating before the taper. Trust the plan. Trust the process. Trust that the heaviness will lift when you reduce mileage before race day.

**Race Day Nerves**

You wrote that you're "willing to embrace race-day nerves and uncertainty."

Good. Because they're coming. The night before the marathon, you might not sleep well. The morning of, your stomach might churn. At the start line, surrounded by thousands of runners, you might wonder what you've gotten yourself into.

That's not fear. That's aliveness. That's the recognition that you're about to do something meaningful, something hard, something that matters.

Let the nerves come. Then run anyway.

You've already proven you can do this. Now you just have to show up and collect what you've earned.`,
    },
  ],
  'Learn Piano': [
    {
      daysAgo: 42,
      tone: 'gentle',
      questions: {
        dream: "I want to play Chopin's Nocturne in E-flat major beautifully. I've been playing piano on-and-off for years but never seriously. I can read sheet music and play simple pieces.",
        plan: "Practice 30 minutes daily. Break the piece into 4-bar sections. Master each section slowly before speeding up. Work with a piano teacher once a week ($60/lesson).",
        relationship: "Piano brings me so much joy, but I'm intimidated by classical pieces. This Nocturne feels impossible right now. But I know it's about consistent practice, not talent.",
        offering: "Blocking 6:30-7am every morning for practice (before work). Investing in a better keyboard ($800). Willing to sound terrible for months before I sound good.",
      },
      aiResponse: `Chopin's Nocturne in E-flat major, Op. 9 No. 2. One of the most beloved pieces in the piano repertoire—that singing melody floating over rippling left-hand arpeggios, the delicate ornamentation, the way it seems to breathe and sigh.

You chose well. And you chose something that will challenge you deeply.

**On Impossibility**

You wrote: "This Nocturne feels impossible right now."

Of course it does. Right now, you see the piece as a whole—all the notes, all the dynamics, all the rubato and expression marks—and it feels overwhelming. But you won't learn it as a whole. You'll learn it four bars at a time, one hand at a time, slowly, patiently, until those four bars become as natural as breathing.

Then you'll add four more. And four more. And one day, you'll play the whole piece, and you won't remember when it stopped feeling impossible.

**The Truth About Talent**

You wrote: "I know it's about consistent practice, not talent."

This is one of the most important things you could understand. The mythology of the "gifted pianist" obscures a deeper truth: every great musician was once a beginner who practiced badly, who hit wrong notes, who sounded terrible. The difference is they kept practicing.

Talent might determine how quickly someone learns. But consistency determines whether they learn at all.

**On Your Offering**

6:30am practice sessions. An $800 keyboard. Weekly lessons. These are serious commitments. You're not dabbling—you're investing.

And this: "Willing to sound terrible for months before I sound good."

That willingness is everything. Most people quit not because they lack ability, but because they can't tolerate the gap between what they want to sound like and what they currently sound like. You've named that gap. You've accepted it. You're willing to live in it for as long as it takes.

That's what separates people who learn instruments from people who just own them.

**A Practice Suggestion**

When you work on those 4-bar sections, resist the urge to play at tempo too soon. Practice at half speed, or even slower, until your fingers know the patterns without conscious thought. Then, gradually, increase the tempo.

Speed is a byproduct of accuracy. If you practice slowly and correctly, speed will come. If you practice fast and sloppy, you'll just get better at making mistakes.

**The Deeper Why**

You said piano brings you joy. Hold onto that. Let joy be your compass when the practice feels tedious, when progress feels slow, when you've played the same four bars fifty times and still can't get them right.

You're not learning this piece to prove anything to anyone. You're learning it because something in you longs to create beauty, to express something words can't capture, to sit at a keyboard and make music.

That longing is worth honoring.

Practice tomorrow at 6:30am. And the day after. And the day after that. One day, you'll play this Nocturne, and it will be beautiful.`,
    },
    {
      daysAgo: 21,
      tone: 'fusion',
      questions: {
        dream: "Learning the first 8 bars of the Nocturne. It's incredibly challenging but also meditative. My fingers don't want to cooperate with the tempo changes.",
        plan: "Focus on right hand melody first. Practice left-hand accompaniment separately. Then combine at 50% speed. My teacher says I need to 'feel' the rubato, not count it mathematically.",
        relationship: "I'm in that frustrating stage where I know what it should sound like but can't execute yet. Reminding myself this is part of the process. Trusting slow progress.",
        offering: "Extended my practice to 45 minutes on weekends. Recording myself weekly to track improvement. Willing to repeat boring finger exercises because I know they'll pay off.",
      },
      aiResponse: `Eight bars. In the Nocturne, those first eight bars contain the primary melody, the signature left-hand pattern, and the first glimpse of Chopin's expressive markings. You're not just learning notes—you're learning to speak a new emotional language.

**The Frustration You Named**

"I know what it should sound like but can't execute yet."

This is the exact stage where most people quit. The gap between intention and execution feels unbearable. You can hear the recording in your head—fluid, expressive, effortless—and then you sit at the keys and it sounds halting, mechanical, wrong.

But here's what you might not see: that gap is shrinking. Every day you practice, even when it sounds terrible, the gap closes by some imperceptible amount. You won't notice it day to day. You'll notice it week to week, when you listen to your recordings and hear something that wasn't there before.

**On Rubato**

Your teacher is right: rubato can't be counted. It's breath. It's the slight hesitation before a beautiful phrase, the gentle acceleration toward a climax, the lingering on a note that doesn't want to be rushed.

But here's the paradox: before you can break the rules of tempo, you need to know them. Practice with a metronome first. Get the rhythm precise and mechanical. Only then, gradually, give yourself permission to push and pull the tempo, to let the music breathe.

Rubato without technical foundation is just sloppiness. Rubato built on solid rhythm is art.

**What I'm Witnessing**

You've extended your practice. You're recording yourself. You're doing finger exercises you find boring because you understand their purpose.

This is what serious practice looks like. Not inspiration-driven bursts followed by weeks of neglect. Consistent, humble, patient work. The kind that compounds invisibly until one day you sit down and something clicks.

**A Reframe**

You said your fingers "don't want to cooperate." Consider this: your fingers are learning something they've never done before. The neural pathways that will eventually make this automatic don't exist yet. You're literally building new architecture in your brain.

That takes time. That takes repetition. That takes grace with yourself when the architecture isn't complete.

**The Process Is the Point**

Yes, the goal is to play this Nocturne beautifully. But the process—the morning practice sessions, the slow working through of difficult passages, the gradual revelation of a piece—this is also the point. This is what it feels like to grow.

You're not just learning a piece. You're becoming a pianist.

Keep practicing. The music is waiting for you to catch up to it.`,
    },
    {
      daysAgo: 3,
      tone: 'gentle',
      questions: {
        dream: "I played the first 16 bars for my teacher today and she said 'It's starting to sound musical.' That was such validating feedback. I can hear the piece coming alive.",
        plan: "Learn the middle section (bars 17-32) over the next month. Then work on connecting all sections smoothly.",
        relationship: "I'm falling in love with this piece more every day. It's teaching me patience. It's teaching me that mastery is a slow unfolding, not a sudden breakthrough.",
        offering: "Committed to practice even on tired days (even if just 15 minutes). Willing to play in front of friends once I have the full piece ready, even though performing terrifies me.",
      },
      aiResponse: `"It's starting to sound musical."

From a piano teacher, that phrase carries weight. She's heard countless students work through this piece. She knows the difference between playing notes and making music. And she heard something in those 16 bars that went beyond technical execution—something that sounded like *you*.

**What You're Discovering**

You wrote: "Mastery is a slow unfolding, not a sudden breakthrough."

This insight extends far beyond piano. It's a truth about every meaningful skill, every worthwhile pursuit, every transformation worth having. We live in a culture that celebrates overnight success stories, but behind every "overnight success" are thousands of invisible hours of practice, failure, and incremental improvement.

You're in the slow unfolding right now. And you're learning to love it.

**On Falling in Love**

"I'm falling in love with this piece more every day."

This is perhaps the most important thing you've shared. When you love what you're practicing, practice stops being discipline and starts being devotion. You're not forcing yourself to the piano—you're drawn to it.

That love will carry you through the middle section, through the difficult passages, through the days when your fingers are stiff and nothing sounds right. Love is the most sustainable fuel for mastery.

**The Commitment to Tired Days**

"Even if just 15 minutes."

This is the secret. Not every practice session needs to be a masterwork of focus and productivity. Sometimes, showing up for 15 minutes when you're exhausted matters more than an hour when you're fresh. It reinforces the identity: "I am someone who practices, no matter what."

Those tired-day practices are where the habit becomes unbreakable.

**On Performance**

You mentioned performing for friends, and that it terrifies you. Good. Let it terrify you. Let the terror coexist with the commitment.

Performance isn't about perfection. It's about sharing. It's about letting others witness something you've poured your heart into. They won't hear the wrong notes you're afraid of hitting. They'll hear someone they care about doing something brave and beautiful.

When you're ready—and you'll know when—you'll sit down in front of people who love you, and you'll play. It won't be perfect. It will be yours. And that will be more than enough.

**Looking Forward**

Bars 17-32. The middle section. New challenges await: perhaps a key change, perhaps new ornamental passages, perhaps more complex left-hand work. But you have everything you need: the practice habit, the teacher, the patience, the love for the music.

You're not the same person who sat down 39 days ago intimidated by an "impossible" piece.

You're becoming a pianist.

Keep unfolding.`,
    },
  ],
  'Build Meaningful Relationships': [
    {
      daysAgo: 29,
      tone: 'fusion',
      questions: {
        dream: "I want to build 3-5 truly deep friendships. Right now I have a lot of acquaintances but very few people I can be vulnerable with. I want friendships based on mutual growth, honesty, and showing up for each other.",
        plan: "Identify 5-7 people I genuinely resonate with. Reach out for 1-on-1 hangouts (not group settings). Share something real about myself early to set the tone. Be consistent - check in weekly.",
        relationship: "I've been hurt before by friends who ghosted or only showed up when convenient for them. I'm scared of investing in people who won't reciprocate. But I also know I can't build deep connections without risk.",
        offering: "Willing to initiate even when it feels awkward. Will drive to meet people on their schedule. Commit to showing up even when I'd rather stay home. Most importantly, willing to be emotionally honest.",
      },
      aiResponse: `What strikes me most in your reflection is the clarity of what you're seeking: not more contacts, not a bigger social calendar, but depth. Vulnerability. Mutual growth. People who show up.

That clarity is rare and valuable. Most people drift through relationships without ever articulating what they actually want from them.

**On the Fear of Non-Reciprocation**

You've been hurt. Friends ghosted. People showed up when it was convenient and disappeared when it wasn't. Those experiences leave marks, and it makes sense that you'd approach new connections with caution.

But here's the paradox of deep friendship: it requires risk before it provides safety. You can't know if someone will reciprocate until you've offered something first. You can't know if they'll show up until you've made yourself vulnerable.

This isn't naive. This is the math of meaningful connection. Some people won't reciprocate. Some investments won't pay off. But the ones that do will be worth every awkward initiation, every unreturned text, every one-sided effort that led nowhere.

**On Your Plan**

One-on-one hangouts instead of group settings. This is smart. Groups diffuse attention. One-on-one creates intimacy. It's harder to stay surface-level when it's just two people and there's nowhere to hide.

Sharing something real early. This is the hack most people don't know. Vulnerability is contagious. When you share something honest about yourself—a fear, a struggle, a genuine feeling—you give the other person permission to do the same. You set the tone for the relationship in the first conversation.

**What You're Offering**

Initiating when it's awkward. Driving to them. Showing up when you'd rather stay home. Being emotionally honest.

These are the building blocks of trust. They're also exhausting, which is why most people don't do them, which is why most people have lots of acquaintances and few real friends.

You're choosing the harder path because you understand what's on the other side.

**A Reflection**

The friendships you build over the next year will probably not include everyone on your initial list of 5-7 people. Some won't resonate as much as you hoped. Some will be too busy. Some will want something different from friendship than what you're offering.

That's okay. You're not looking for 5-7 deep friendships. You're looking for 3-5. Quality, not quantity. The process of reaching out to many is how you find the few.

Keep initiating. Keep showing up. Keep being honest.

The friends who match your depth will recognize you.`,
    },
    {
      daysAgo: 15,
      tone: 'fusion',
      questions: {
        dream: "I reached out to 4 people this week. Had coffee with 2 of them - one conversation was surface-level, the other felt genuinely connective. We talked about creative struggles and both shared vulnerable stories.",
        plan: "Follow up with the person I connected with. Suggest a hike next week. Reach out to 2 more people on my list.",
        relationship: "I'm noticing how much effort this takes. But also realizing that good friendships require intentionality. You can't just wait for them to happen.",
        offering: "Blocked off Saturday for a longer hangout (hiking). Sent a thoughtful text checking in on someone who mentioned they were stressed. Willing to keep initiating even if not everyone reciprocates.",
      },
      aiResponse: `Two coffee conversations. One surface-level. One genuinely connective.

That's the nature of this work. Not every attempt at depth will reach depth. Some people aren't ready for it. Some don't want it. Some want it but can't access it. You can't control who resonates—you can only keep showing up and let the resonance reveal itself.

**On the Connective Conversation**

You talked about creative struggles. You both shared vulnerable stories. Something real happened between you.

That conversation didn't happen by accident. It happened because you set the tone. You asked real questions. You shared something first. You created the conditions for depth, and the other person met you there.

That's the signal to follow. A hike next week. More time. More space for the connection to deepen.

**On the Surface-Level Conversation**

Don't dismiss it too quickly. Some people take longer to open up. Some need more trust before they go deep. It might be worth one more coffee before you decide.

But if after two or three hangouts it's still surface-level, that's data. Not everyone is meant to be a close friend. Some people are wonderful humans who simply don't connect with you the way you need. That's not rejection—that's compatibility information.

**The Effort You're Noticing**

"I'm noticing how much effort this takes."

Yes. This is the part no one talks about. Deep friendships are presented as things that just happen—you meet someone, you click, you become close. But that's the Hollywood version.

In reality, friendship requires logistics: scheduling, driving, texting follow-ups, remembering what they shared last time. It requires emotional labor: being present, asking good questions, sharing vulnerably when you'd rather deflect. It requires priority: choosing the hangout over the Netflix night, the check-in text over the scroll.

Most people don't make this effort. Which is why most people's friendships fade after college, when the forced proximity of dorms and dining halls disappears.

You're building intentionally. That's harder. And it works.

**What You're Offering**

A thoughtful text to someone who was stressed. That's small but not small. That's someone knowing they were thought of. That's a deposit in the trust account of a relationship.

These small gestures compound. Over time, they become the foundation of "I know I can count on them."

Keep initiating. Keep following up. Keep offering your attention and care to people who might become your close friends.

The garden is being planted. Flowers don't bloom overnight.`,
    },
    {
      daysAgo: 6,
      tone: 'gentle',
      questions: {
        dream: "Had my second hangout with Alex (from the coffee chat). We went deeper - talked about fear of failure, family dynamics, what we actually want from life. Felt like I made a real friend.",
        plan: "Keep building this friendship. Also nurture the other 2-3 promising connections. Host a small dinner party to bring people together.",
        relationship: "It's working. Vulnerability begets vulnerability. When I show up as my real self, people feel safe to do the same. This is how real friendships form.",
        offering: "Willing to invest time and energy into this. Committing to weekly check-ins with close friends. Will keep showing up consistently, not just when I need something.",
      },
      aiResponse: `"Felt like I made a real friend."

Read that sentence again. Twenty-three days ago, you were scared of investing in people who wouldn't reciprocate. You'd been hurt by friends who ghosted. And now you're sitting with Alex, talking about fear of failure and family dynamics, and something has clicked.

This is what intentionality creates. Not guaranteed outcomes—you can't control who resonates—but increased probability. You reached out. You suggested one-on-one. You shared something real. You followed up. And now there's a friendship taking root.

**The Mechanism You've Discovered**

"Vulnerability begets vulnerability."

This is one of the most important relational truths there is. Most people wait for others to be vulnerable first. They protect themselves, keeping conversations safe and surface, hoping someone else will take the risk.

You took the risk. You showed up as your real self. And in doing so, you gave Alex permission to do the same.

This is how trust is built: not through grand gestures, but through small acts of honesty that accumulate over time. Each vulnerable share is a signal: "I trust you with this piece of me." And when the other person responds in kind, the bond deepens.

**On the Dinner Party Idea**

Bringing people together is a beautiful next step. But be thoughtful about the context. Dinner parties can be wonderful for established friendships, but they can also dissipate the intimacy you're building.

Consider: the deep conversations you've had with Alex happened one-on-one. If you add five other people, the dynamic changes. It becomes more social, less intimate.

Maybe the dinner party is for your broader circle, and you protect the one-on-one time for the friendships you're deepening. Both have value. Just be intentional about which context serves which purpose.

**What You're Offering Now**

Weekly check-ins. Showing up consistently, not just when you need something.

This is the long game. The friendships that last aren't built in intense bursts—they're built in steady, reliable presence. A text every week. A coffee every month. Being there when things are good *and* when things are hard.

You're committing to consistency. That's the commitment that matters most.

**A Moment of Appreciation**

You set out to build meaningful friendships. You faced your fear of rejection. You initiated when it felt awkward. You were vulnerable when it felt risky.

And now you have a real friend in Alex, and 2-3 more promising connections, and a plan for continued cultivation.

This is what it looks like when intentionality meets courage.

Keep going. The relationships you're building will be part of your life for decades.`,
    },
  ],
  'Achieve Financial Freedom': [
    {
      daysAgo: 35,
      tone: 'intense',
      questions: {
        dream: "Financial freedom: $5k/month in passive income. Right now I have a full-time job ($6k/month after tax) and zero passive income. I want freedom to work on projects I care about without financial stress.",
        plan: "Three income streams: (1) Build a productized service ($2k/mo target), (2) Create a paid course/ebook ($1.5k/mo), (3) Invest in dividend stocks ($1.5k/mo). Timeline: 2 years.",
        relationship: "I'm tired of trading time for money. Tired of asking permission for time off. Tired of anxiety about job security. But I'm also scared of failing at entrepreneurship. Passive income isn't actually passive - it requires massive upfront work.",
        offering: "Working side projects 10-15 hours/week for the next 2 years. Investing $1k/month into stocks. Saying no to lifestyle inflation. Willing to live frugally now for freedom later.",
      },
      aiResponse: `Let's be direct with you.

$5k/month in passive income within 2 years is ambitious. Not impossible, but ambitious. And you're right to name the paradox: "passive income isn't actually passive." Every passive income stream requires massive active effort upfront. The "passive" part only comes after the building.

**Your Three Streams**

1. **Productized service at $2k/month**: This is the fastest to revenue but least passive. You're trading productization for scalability. At $2k/month, you're probably doing most of the work yourself. The path to true passivity here is systemization, delegation, or eventually selling the business.

2. **Course/ebook at $1.5k/month**: This can be genuinely passive once created, but the creation is substantial. A course worth paying for takes 100+ hours to build properly. And then there's marketing—an ongoing effort unless you build evergreen funnels.

3. **Dividend stocks at $1.5k/month**: The math here is challenging. To generate $1.5k/month from dividends, you'd need roughly $450k-$600k invested (assuming 3-4% yield). At $1k/month invested, it would take decades to accumulate that much, even with compound growth.

I'm not saying this to discourage you. I'm saying it so your plan matches reality.

**The Deeper Current**

You wrote: "I'm tired of trading time for money. Tired of asking permission for time off. Tired of anxiety about job security."

This is about more than money. This is about autonomy. Control. The ability to structure your life on your terms.

That's a worthy goal. But be careful not to conflate "financial freedom" with "freedom from discomfort." Entrepreneurship isn't less stressful than employment—it's differently stressful. The anxiety about job security gets replaced by anxiety about revenue, customers, market changes.

The real freedom isn't the absence of stress. It's choosing which stresses you want to live with.

**What I'd Recommend**

Focus your energy. Three income streams sounds diversified, but at 10-15 hours a week, you'll spread yourself thin. Pick the one with the highest leverage—probably the productized service—and go deep. Get it to $2k/month first. Then reinvest those earnings and time into stream two.

Sequential focus beats parallel distraction.

**What You're Offering**

Living frugally. Investing consistently. Saying no to lifestyle inflation. Working side projects while maintaining a full-time job.

This is the grind. This is the price of the freedom you want. Two years of nights and weekends while everyone around you enjoys their leisure time.

The question isn't whether you can do this for a week or a month. The question is whether you can do this for two years when the results are invisible, when the passive income hasn't materialized yet, when you wonder if it's all worth it.

That's the real test.

Are you ready for it?`,
    },
    {
      daysAgo: 8,
      tone: 'fusion',
      questions: {
        dream: "Made first $200 from my productized service (design templates). It's not much but it proves the concept works. People will pay for productized expertise.",
        plan: "Double down on what's working. Create 10 more template packs. Build an email list. Aim for $500/month in the next 60 days.",
        relationship: "This is the spark I needed. For the first time, I'm making money while I sleep (literally - sales came in overnight). It's addictive. I want more of this feeling.",
        offering: "Reinvesting all earnings back into the business. Spending weekends building instead of scrolling. Willing to experiment and fail fast. Embracing the long game.",
      },
      aiResponse: `$200.

Twenty-seven days ago, your passive income was $0. Now it's $200. That's not a rounding error—that's proof of concept.

You wrote: "Sales came in overnight."

That's the moment. That's the first taste of leverage. While you were sleeping, someone found your templates, decided they were worth paying for, and clicked "buy." No meeting scheduled. No hours traded. Value exchanged while you were unconscious.

$200 won't pay rent. But $200 is evidence that the machine works. Now it's about scaling the machine.

**On Your Plan**

Ten more template packs. An email list. $500/month in 60 days.

This is exactly right. You've found something that works—design templates—and you're doubling down instead of diversifying too early. That's disciplined thinking.

The email list is crucial. Without it, you're dependent on platform algorithms for discovery. With it, you own the relationship with your customers. You can launch new packs directly to people who've already bought from you. You can test ideas before building them. You can build trust over time.

Invest heavily in the list. It's the asset that compounds.

**The Addiction You're Describing**

"It's addictive. I want more of this feeling."

Good. Let it be addictive. Let that feeling of "money while I sleep" fuel your weekends of template creation. Let it remind you, during the grind, why you're doing this.

But also: be careful that the addiction doesn't lead to shortcuts. The templates that sold did so because they were genuinely valuable. Don't sacrifice quality for quantity. Ten excellent packs will outsell twenty mediocre ones.

**The Long Game**

You wrote: "Embracing the long game."

This is the mindset that wins. $200/month isn't freedom. But $200/month that compounds—through more products, a growing email list, increasing reputation—becomes $500, then $1000, then $2000.

Most people want passive income *now*. They're not willing to spend two years building something that pays off in year three. You're playing a different game.

**What's Changed**

Twenty-seven days ago, you were scared of failing at entrepreneurship. You had zero passive income and a dream that felt distant.

Today, you have proof. Not hope—proof. Evidence that strangers will pay you for value you created once.

That changes everything.

Keep building. The first $200 is the hardest. The next $500 is already on its way.`,
    },
  ],
};

// Evolution report for SaaS dream (hardcoded, high-quality content)
const SAAS_EVOLUTION_REPORT = `# Your Journey to Launch: An Evolution Report

## The Arc of Transformation

When you began this journey 18 days ago, you carried the weight of previous attempts. "I've attempted SaaS products before and failed," you wrote. "Two products never got past 100 users. I'm afraid of wasting another 6 months."

That fear was earned. It came from real experience, real disappointment, real investment of time and energy that didn't yield the results you hoped for. And yet, you showed up anyway. You opened this reflection space and named both the dream and the doubt.

That's where transformation begins—not in confidence, but in honest acknowledgment of what you're bringing with you.

## The Early Days: Foundation Despite Fear

Your first reflection revealed someone who had learned from the past. Unlike your previous attempts, you came prepared: a clear ICP (ideal customer profile), twenty conversations with potential users already completed, a specific technical stack, a phased approach.

This wasn't wishful thinking. This was strategy.

You wrote that you were willing to "ship even when the product isn't perfect," naming perfectionism as your biggest blocker before. That self-awareness was critical. You weren't just planning to build a product—you were planning to build yourself into someone who finishes things.

## The Wall: Day 12

Then came the wall. "Hit a wall with the data visualization library—it's not playing nice with SSR. Frustrated."

Every builder knows this moment. The technical problem that doesn't yield to the first solution, or the second. The creeping doubt that whispers: "Maybe you're not technical enough. Maybe you should just hire someone."

But look at what you did with that doubt. You didn't retreat. You set a boundary: "Debug for 2 more hours max, then switch to a simpler library." You communicated with beta users about a realistic delay. You accepted imperfection: "Willing to ship something 'good enough' and iterate."

The wall didn't stop you. It revealed your strategy for getting past walls.

## The Shift: Day 7

By day 7, something had shifted. The landing page was live. Authentication was working. The core feature was 40% complete.

"Feeling more confident now that I have tangible progress," you wrote. But you also noticed a new challenge: scope creep. The urge to add features. The temptation to keep building instead of shipping.

You caught yourself. "Need to stay focused on MVP." That self-correction—in real time, while building—is the mark of someone who has internalized the lessons of previous projects.

## The Validation: Today

And then: "SaaS MVP is DONE. Soft launched to 10 beta users yesterday. Already got 3 sign-ups and amazing feedback. One user said 'This is exactly what I needed.'"

Read that again. "This is exactly what I needed."

Someone who has never met you, who owes you nothing, looked at what you created and saw their problem reflected in your solution. That's not luck. That's the result of those twenty pre-launch conversations, of building what people actually wanted, of shipping despite imperfection.

## The Patterns I See

**Fear transformed into fuel**: Your initial fear of "wasting another 6 months" became the discipline that kept you focused, that made you communicate with users, that stopped you from over-engineering.

**Scope discipline**: You consistently caught yourself wanting to add features and redirected to MVP. This happened not once but repeatedly across your reflections.

**Strategic communication**: When problems arose, you communicated with users. You set expectations. You built trust through transparency.

**Identity evolution**: In your first reflection, you were someone "afraid of wasting time." In your latest, you're someone who believes you "can hit $10k MRR." That's not just mindset—that's evidence-based confidence earned through action.

## What Comes Next

You're taking a week off work for the Product Hunt launch. You're willing to invest more in ads. You're committed to showing up "even when momentum drops."

That last part matters most. The dopamine of early validation will fade. There will be quiet weeks. There will be bugs. There will be users who churn.

Your commitment isn't to the highs. Your commitment is to the process.

## The Person You've Become

Eighteen days ago, you were someone haunted by past attempts. Today, you're someone with a launched product, paying users, and validated demand.

But the real transformation isn't the product or the users. It's you.

You've become someone who ships. Someone who communicates. Someone who catches their own patterns and corrects course. Someone who builds from wisdom instead of wishful thinking.

That identity will follow you into every future project. It's worth more than $10k MRR.

This is real now. You made it real.`;

// Visualization for SaaS dream (hardcoded, high-quality content)
const SAAS_VISUALIZATION = `# The Mountain You're Climbing

Picture yourself at base camp eighteen days ago. The summit is obscured by clouds—$10k MRR feels theoretical, distant, more dream than destination. Your pack is heavy with the weight of previous attempts: two products that never found their footing, months of effort that dissipated like morning mist.

But you're not a novice anymore. Those failed expeditions taught you about the terrain. You know now that the path to the summit isn't a straight line. You know that weather changes. You know that the mountain demands respect.

So you pack differently this time. Twenty conversations with potential users—that's your topographic map. A clear ICP—that's your compass. A commitment to ship imperfectly—that's the knowledge that you can't wait for perfect conditions.

---

**The First Ascent**

You start climbing. The landing page goes live—your first permanent camp, a stake in the ground that says "I'm here, I'm building, this is real." Authentication works—another hundred meters gained. The dashboard takes shape—40% complete, then 60%, then done.

Each day, you wake before dawn and climb. Some days the path is clear. Other days, you hit rock faces that seem impassable: the data visualization library that fights you, the SSR conflicts that eat hours. You consider turning back. "Maybe I should hire someone," whispers the altitude.

But you don't turn back. You set a limit—two more hours—and then you adapt. You find another route. The summit doesn't care how you get there.

---

**The Ridge**

And then you're on the ridge. MVP complete. The clouds part for a moment, and you see it: beta users signing up. Three of ten. Thirty percent conversion. Someone says, "This is exactly what I needed."

That's when you realize: you're going to make it.

Not because the rest will be easy. The summit is still above you. Product Hunt launch. Scaling. Customer support. The thousand small decisions that separate a $200 month from a $10k month.

But you're on the ridge now. The impossible has become improbable has become possible. The weight of past failures feels lighter up here. They weren't failures—they were training expeditions.

---

**The Summit Approach**

You're taking a week off for the final push. Gear is checked. Route is planned. You know there will be storms—a launch that underperforms, a bug at the worst moment, the long quiet after the initial spike.

But you also know something else now. You know you're the kind of person who climbs. Who adapts. Who ships. Who communicates. Who keeps moving when the path isn't clear.

The summit isn't guaranteed. But you're no longer at base camp wondering if you should attempt it.

You're on the mountain. You're climbing.

And the view from up here? It's already worth the journey.`;

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedDemoUser() {
  console.log('🌱 Starting demo user seeding (hardcoded content - no API calls)...\n');

  try {
    // 1. Fetch demo user
    console.log('📥 Fetching demo user...');
    const { data: demoUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', DEMO_USER_EMAIL)
      .single();

    if (userError || !demoUser) {
      console.error('❌ Demo user not found. Create user first via auth or migration.');
      process.exit(1);
    }

    console.log(`✅ Demo user found: ${demoUser.email} (ID: ${demoUser.id})\n`);

    // 2. Delete existing demo data
    console.log('🧹 Cleaning existing demo data...');
    await supabase.from('reflections').delete().eq('user_id', demoUser.id);
    await supabase.from('evolution_reports').delete().eq('user_id', demoUser.id);
    await supabase.from('visualizations').delete().eq('user_id', demoUser.id);
    await supabase.from('dreams').delete().eq('user_id', demoUser.id);
    console.log('✅ Cleaned existing data\n');

    // 3. Create dreams
    console.log('✨ Creating demo dreams...');
    const createdDreams: { id: string; title: string; description: string; category: string; target_date: string | null }[] = [];

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

      createdDreams.push(dream);
      console.log(`   ✅ ${dreamData.title}`);
    }

    console.log(`✅ Created ${createdDreams.length} dreams\n`);

    // 4. Create reflections with hardcoded AI responses
    console.log('🪞 Creating demo reflections...\n');
    let totalReflections = 0;
    const saasReflectionIds: string[] = [];

    for (const dream of createdDreams) {
      const reflections = DEMO_REFLECTIONS[dream.title as keyof typeof DEMO_REFLECTIONS];
      if (!reflections) {
        console.warn(`   ⚠️  No reflections defined for: ${dream.title}`);
        continue;
      }

      console.log(`📖 Dream: ${dream.title} (${reflections.length} reflections)`);

      for (const reflection of reflections) {
        const createdDate = new Date(Date.now() - reflection.daysAgo * 24 * 60 * 60 * 1000);

        const { data: createdReflection, error: reflectionError } = await supabase
          .from('reflections')
          .insert({
            user_id: demoUser.id,
            dream_id: dream.id,
            dream: reflection.questions.dream,
            plan: reflection.questions.plan,
            has_date: dream.target_date ? 'yes' : 'no',
            dream_date: dream.target_date || null,
            relationship: reflection.questions.relationship,
            offering: reflection.questions.offering,
            ai_response: reflection.aiResponse,
            tone: reflection.tone,
            is_premium: true,
            word_count: reflection.aiResponse.split(/\s+/).length,
            created_at: createdDate.toISOString(),
            updated_at: createdDate.toISOString(),
          })
          .select('id, created_at')
          .single();

        if (reflectionError) {
          console.error(`   ❌ Failed to insert reflection:`, reflectionError);
          throw reflectionError;
        }

        if (dream.title === 'Launch My SaaS Product') {
          saasReflectionIds.push(createdReflection.id);
        }

        console.log(`   ✅ Reflection (${reflection.daysAgo} days ago, ${reflection.aiResponse.split(/\s+/).length} words)`);
        totalReflections++;
      }

      console.log('');
    }

    console.log(`✅ Created ${totalReflections} reflections\n`);

    // 5. Create evolution report for SaaS dream
    console.log('📊 Creating evolution report...');
    const saasDream = createdDreams.find((d) => d.title === 'Launch My SaaS Product');

    if (saasDream && saasReflectionIds.length > 0) {
      const { error: evolutionError } = await supabase.from('evolution_reports').insert({
        user_id: demoUser.id,
        dream_id: saasDream.id,
        evolution: SAAS_EVOLUTION_REPORT,
        report_category: 'dream-specific',
        reflections_analyzed: saasReflectionIds,
        reflection_count: saasReflectionIds.length,
      });

      if (evolutionError) {
        console.error('❌ Failed to create evolution report:', evolutionError);
      } else {
        console.log('✅ Evolution report created (1,200 words)\n');
      }
    }

    // 6. Create visualization for SaaS dream
    console.log('🎨 Creating visualization...');

    if (saasDream && saasReflectionIds.length > 0) {
      const { error: vizError } = await supabase.from('visualizations').insert({
        user_id: demoUser.id,
        dream_id: saasDream.id,
        narrative: SAAS_VISUALIZATION,
        style: 'achievement',
        reflections_analyzed: saasReflectionIds,
        reflection_count: saasReflectionIds.length,
      });

      if (vizError) {
        console.error('❌ Failed to create visualization:', vizError);
      } else {
        console.log('✅ Visualization created (550 words)\n');
      }
    }

    // 7. Update user stats
    console.log('📊 Updating user stats...');
    await supabase
      .from('users')
      .update({
        total_reflections: totalReflections,
        reflection_count_this_month: totalReflections,
        updated_at: new Date().toISOString(),
      })
      .eq('id', demoUser.id);

    console.log('✅ User stats updated\n');

    // Done!
    console.log('🎉 Demo user seeding complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   • Demo user: ${DEMO_USER_EMAIL}`);
    console.log(`   • Dreams created: ${createdDreams.length}`);
    console.log(`   • Reflections created: ${totalReflections}`);
    console.log(`   • Evolution reports: 1`);
    console.log(`   • Visualizations: 1`);
    console.log(`\n✨ Demo account is ready for testing!\n`);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDemoUser();
