// Mirror of Truth Testing Setup & Usage Guide
// Run this to set up and execute automated testing

require("dotenv").config(); // Load environment variables from .env file

const { createClient } = require("@supabase/supabase-js");

// 1. DATABASE SETUP SCRIPT
async function setupTestUser() {
  console.log("🏗️ Setting up test user in database...");

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Insert Alex Chen test user
    const { data: user, error } = await supabase
      .from("users")
      .upsert(
        {
          email: "alex.chen.test@example.com",
          password_hash:
            "$2b$10$LrI2Igx61dKS3q2vv0onUeISqshD/teT/YZmybwZ24AcUbTAA/Yqa",
          name: "Alex Chen",
          tier: "premium",
          subscription_status: "active",
          email_verified: true,
          created_at: new Date().toISOString(),

          // Reset monthly usage
          reflection_count_this_month: 0,
          total_reflections: 0,
          current_month_year: new Date().toISOString().slice(0, 7),

          // Premium subscription
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(),

          // Test marker
          language: "en",
          timezone: "UTC",
        },
        {
          onConflict: "email",
        }
      )
      .select();

    if (error) {
      console.error("❌ Database setup error:", error);
      return false;
    }

    console.log("✅ Test user setup complete");
    console.log(`User ID: ${user[0]?.id}`);
    return true;
  } catch (error) {
    console.error("❌ Setup failed:", error);
    return false;
  }
}

// 2. MANUAL TESTING FUNCTIONS
async function testSingleReflection(tone = "fusion") {
  console.log(`🧪 Testing single reflection (${tone})`);

  const { MirrorTestingAgent } = require("./mirror-testing-agent");
  const agent = new MirrorTestingAgent();

  try {
    await agent.authenticateTestUser();

    const responses = await agent.generateReflectionResponses(tone, 1);
    console.log("📝 Generated responses:");
    console.log(responses);

    const reflection = await agent.submitReflection(responses, tone);
    console.log("\n🪞 Mirror reflection:");
    console.log(reflection.content);

    const evaluation = await agent.evaluateReflection(
      responses,
      reflection.content,
      tone,
      1
    );
    console.log("\n🔍 Evaluation:");
    console.log(evaluation);

    await agent.submitFeedback(reflection.reflectionId, evaluation);

    return { responses, reflection, evaluation };
  } catch (error) {
    console.error("❌ Single test failed:", error);
  }
}

// 3. TONE COMPARISON TEST
async function compareTones() {
  console.log("🎭 Comparing all three tones...");

  const { MirrorTestingAgent } = require("./mirror-testing-agent");
  const agent = new MirrorTestingAgent();

  await agent.authenticateTestUser();

  const tones = ["gentle", "intense", "fusion"];
  const results = {};

  for (const tone of tones) {
    console.log(`\n--- Testing ${tone.toUpperCase()} tone ---`);

    const responses = await agent.generateReflectionResponses(tone, 1);
    const reflection = await agent.submitReflection(responses, tone);
    const evaluation = await agent.evaluateReflection(
      responses,
      reflection.content,
      tone,
      1
    );
    const rating = await agent.submitFeedback(
      reflection.reflectionId,
      evaluation
    );

    results[tone] = {
      rating,
      evaluation: evaluation.split("\n")[2], // Overall rating line
      reflection: reflection.content.substring(0, 200) + "...",
    };

    console.log(`${tone}: ${rating}/10`);

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log("\n📊 TONE COMPARISON RESULTS:");
  Object.entries(results).forEach(([tone, result]) => {
    console.log(`${tone.toUpperCase()}: ${result.rating}/10`);
  });

  const bestTone = Object.entries(results).sort(
    ([, a], [, b]) => b.rating - a.rating
  )[0][0];

  console.log(`\n🏆 Best performing tone: ${bestTone.toUpperCase()}`);

  return results;
}

// 4. INCREMENTAL TESTING (Build up 6 reflections gradually)
async function incrementalTesting() {
  console.log("📈 Running incremental testing (6 reflections)...");

  const { MirrorTestingAgent } = require("./mirror-testing-agent");
  const agent = new MirrorTestingAgent();

  await agent.authenticateTestUser();

  const results = [];
  const tones = ["fusion", "gentle", "intense", "fusion", "gentle", "intense"];

  for (let i = 1; i <= 6; i++) {
    console.log(`\n--- REFLECTION ${i}/6 (${tones[i - 1]}) ---`);

    const responses = await agent.generateReflectionResponses(tones[i - 1], i);
    const reflection = await agent.submitReflection(responses, tones[i - 1]);
    const evaluation = await agent.evaluateReflection(
      responses,
      reflection.content,
      tones[i - 1],
      i
    );
    const rating = await agent.submitFeedback(
      reflection.reflectionId,
      evaluation
    );

    results.push({
      number: i,
      tone: tones[i - 1],
      rating,
      evaluation,
    });

    console.log(`✅ Reflection ${i} complete: ${rating}/10`);

    // Check for evolution report eligibility after 6 reflections
    if (i === 6) {
      console.log("\n🦋 Attempting to generate evolution report...");
      const evolutionReport = await agent.generateEvolutionReport();
      if (evolutionReport) {
        console.log("✅ Evolution report generated successfully");
        results.evolutionReport = evolutionReport;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Generate summary
  const avgRating =
    results.reduce((sum, r) => sum + r.rating, 0) / results.length;
  console.log(
    `\n📊 TESTING COMPLETE - Average Rating: ${avgRating.toFixed(1)}/10`
  );

  return results;
}

// 5. PROMPT IMPROVEMENT WORKFLOW
async function promptImprovementWorkflow() {
  console.log("🔧 Running prompt improvement workflow...");

  // Test current prompts
  console.log("Phase 1: Testing current prompts...");
  const baselineResults = await compareTones();

  console.log("\nPhase 2: Analyzing weaknesses...");
  const lowRatingTones = Object.entries(baselineResults)
    .filter(([tone, result]) => result.rating < 7)
    .map(([tone]) => tone);

  if (lowRatingTones.length > 0) {
    console.log(`⚠️ Tones needing improvement: ${lowRatingTones.join(", ")}`);
    console.log("\n📝 Next steps:");
    console.log("1. Review evaluation feedback for specific improvement areas");
    console.log(
      "2. Update prompts in your evolution.js and base_instructions.txt"
    );
    console.log("3. Re-run tests to validate improvements");
  } else {
    console.log(
      "✅ All tones performing well! Consider testing with different personas."
    );
  }

  return baselineResults;
}

// 6. USAGE EXAMPLES
const USAGE_EXAMPLES = `
🚀 MIRROR TESTING USAGE GUIDE
==============================

Setup (run once):
\`\`\`javascript
node -e "require('./testing-setup').setupTestUser()"
\`\`\`

Quick single test:
\`\`\`javascript
node -e "require('./testing-setup').testSingleReflection('fusion')"
\`\`\`

Compare all tones:
\`\`\`javascript
node -e "require('./testing-setup').compareTones()"
\`\`\`

Full testing cycle (6 reflections + evolution):
\`\`\`javascript
node -e "require('./testing-setup').incrementalTesting()"
\`\`\`

Prompt improvement workflow:
\`\`\`javascript
node -e "require('./testing-setup').promptImprovementWorkflow()"
\`\`\`

Environment Variables (.env file):
OPENAI_API_KEY=sk-your-openai-key-here
SUPABASE_URL=https://your-project.supabase.co  
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

Test User Credentials:
- Email: alex.chen.test@example.com
- Password: test_mirror_2025
- Tier: Premium
`;

// 7. CLEAN UP FUNCTION
async function cleanupTestData() {
  console.log("🧹 Cleaning up test data...");

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get test user ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", "alex.chen.test@example.com")
      .single();

    if (user) {
      // Delete all test reflections
      await supabase.from("reflections").delete().eq("user_id", user.id);

      // Delete evolution reports
      await supabase.from("evolution_reports").delete().eq("user_id", user.id);

      // Reset user stats
      await supabase
        .from("users")
        .update({
          reflection_count_this_month: 0,
          total_reflections: 0,
        })
        .eq("id", user.id);

      console.log("✅ Test data cleaned up");
    }
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

module.exports = {
  setupTestUser,
  testSingleReflection,
  compareTones,
  incrementalTesting,
  promptImprovementWorkflow,
  cleanupTestData,
  USAGE_EXAMPLES,
};

// Print usage if run directly
if (require.main === module) {
  console.log(USAGE_EXAMPLES);
}
