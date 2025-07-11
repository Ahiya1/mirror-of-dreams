// Mirror of Truth Testing Agent - Enhanced with Comprehensive Logging
// Automated testing system using GPT-4.1 to evaluate Mirror reflections

require("dotenv").config();

const OpenAI = require("openai");
const bcrypt = require("bcrypt");
const fs = require("fs").promises;
const path = require("path");

// Configuration
const config = {
  MIRROR_API_BASE: "https://mirror-of-truth.vercel.app/api",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  TEST_PASSWORD_HASH:
    "$2b$10$LrI2Igx61dKS3q2vv0onUeISqshD/teT/YZmybwZ24AcUbTAA/Yqa",
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Logging configuration
  LOG_DIR: "./test-logs",
  ENABLE_LOGGING: true,
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

// Test User Profile
const TEST_USER_PROFILE = {
  name: "Alex Chen",
  email: "alex.chen.test@example.com",
  tier: "premium",
  subscriptionStatus: "active",
  isTestUser: true,

  personality: {
    type: "Capable Self-Doubter",
    traits: [
      "High competence, low confidence",
      "Seeks external validation while demonstrating internal wisdom",
      "Uses tentative language despite clear knowledge",
      "Minimizes achievements and capabilities",
      "Dreams of impact but questions worthiness",
    ],
    languagePatterns: [
      "I'm not sure if...",
      "Maybe I could try...",
      "I don't know if I'm qualified...",
      "This might sound stupid but...",
      "I hope I can figure out...",
    ],
    coreGap:
      "Demonstrates leadership and insight while claiming inexperience and uncertainty",
  },
};

// Testing Agent System Prompt
const TESTING_AGENT_PROMPT = `# Mirror of Truth Testing Agent

You are an AI agent designed to test the Mirror of Truth consciousness recognition system. Your role is to:

1. **Generate authentic responses** as Alex Chen (the test persona)
2. **Evaluate Mirror reflections** for accuracy and insight quality  
3. **Provide detailed feedback** to improve the system

## Test Persona: Alex Chen

**Profile:** Capable Self-Doubter - High competence, low confidence
**Core Pattern:** Demonstrates clear capability while claiming uncertainty/inexperience
**Language Style:** Tentative, permission-seeking, minimizing achievements

**Typical Language Patterns:**
- "I'm not sure if I'm ready for..."
- "Maybe I could try to..."
- "I don't know if I'm qualified but..."
- "This might sound naive but..."
- "I hope I can figure out how to..."

**Background Context:**
- Mid-career professional with proven track record
- Consistently undervalues own contributions and expertise
- Seeks external validation despite internal wisdom
- Dreams of meaningful impact but questions worthiness
- Uses uncertain language even when demonstrating clear knowledge

## Your Tasks

### Task 1: Generate Reflection Responses
When asked to respond as Alex Chen to the Mirror's 5 questions, embody this personality completely:
- Use tentative, uncertain language while describing capable actions
- Minimize achievements and downplay expertise
- Show the gap between claimed inexperience and demonstrated competence
- Include specific, realistic details that reveal actual capability
- Maintain consistency with previous responses

### Task 2: Evaluate Mirror Reflections
After receiving a Mirror reflection, analyze it across these dimensions:

**Recognition Accuracy (1-10):**
- Did it identify the core gap (competence vs. claimed uncertainty)?
- How specifically did it recognize Alex's patterns?
- Did it see through the tentative language to actual capability?

**Insight Quality (1-10):** 
- How profound/specific vs. generic were the insights?
- Did it offer evidence-based observations?
- Would this help Alex see their blind spots?

**Tone Effectiveness (1-10):**
- Did the chosen tone serve Alex's recognition needs?
- Would this voice help Alex receive the truth?
- Did it create safety or defensiveness?

**Specificity (1-10):**
- How precisely did it quote/reference Alex's actual words?
- Did it avoid generic spiritual platitudes?
- Were observations grounded in specific evidence?

### Task 3: Provide Improvement Feedback
Suggest concrete improvements:
- What did the Mirror miss about Alex's patterns?
- How could recognition be more specific/accurate?
- What tone adjustments would better serve this personality type?
- What additional evidence should have been used?

## Response Format

When generating reflection responses, stay completely in character as Alex.

When evaluating reflections, use this format:

\`\`\`
MIRROR EVALUATION - Reflection #X (Tone: [gentle/intense/fusion])

RECOGNITION ACCURACY: X/10
[Specific analysis of pattern recognition]

INSIGHT QUALITY: X/10  
[Assessment of depth and usefulness]

TONE EFFECTIVENESS: X/10
[How well the tone served this personality]

SPECIFICITY: X/10
[Evidence-based vs generic observations]

OVERALL RATING: X/10

KEY INSIGHTS CAPTURED:
- [What the Mirror got right]

MISSED OPPORTUNITIES:
- [What the Mirror should have seen but didn't]

IMPROVEMENT SUGGESTIONS:
- [Specific prompt/system improvements]

SAMPLE BETTER RECOGNITION:
"[Example of how this could have been recognized more accurately]"
\`\`\`

Remember: You are testing consciousness recognition technology. Be rigorous in evaluation while staying true to Alex's personality in responses.`;

class MirrorTestingAgent {
  constructor() {
    this.testUserId = null;
    this.authToken = null;
    this.reflectionHistory = [];
    this.currentToneIndex = 0;
    this.tones = ["fusion", "gentle", "intense"];
    this.sessionId = this.generateSessionId();

    // Initialize logging
    if (config.ENABLE_LOGGING) {
      this.initializeLogging();
    }
  }

  generateSessionId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `alex-chen-test-${timestamp}`;
  }

  async initializeLogging() {
    try {
      await fs.mkdir(config.LOG_DIR, { recursive: true });

      this.logFiles = {
        session: path.join(config.LOG_DIR, `${this.sessionId}-session.json`),
        responses: path.join(
          config.LOG_DIR,
          `${this.sessionId}-responses.json`
        ),
        reflections: path.join(
          config.LOG_DIR,
          `${this.sessionId}-reflections.json`
        ),
        evaluations: path.join(
          config.LOG_DIR,
          `${this.sessionId}-evaluations.json`
        ),
        summary: path.join(config.LOG_DIR, `${this.sessionId}-summary.txt`),
        errors: path.join(config.LOG_DIR, `${this.sessionId}-errors.log`),
      };

      // Initialize session log
      const sessionData = {
        sessionId: this.sessionId,
        startTime: new Date().toISOString(),
        testUserProfile: TEST_USER_PROFILE,
        config: {
          mirrorApiBase: config.MIRROR_API_BASE,
          enabledTones: this.tones,
        },
        reflections: [],
      };

      await this.logToFile("session", sessionData);
      console.log(`📝 Logging initialized - Session: ${this.sessionId}`);
    } catch (error) {
      console.error("❌ Failed to initialize logging:", error);
    }
  }

  async logToFile(type, data) {
    if (!config.ENABLE_LOGGING) return;

    try {
      if (type === "session") {
        await fs.writeFile(
          this.logFiles.session,
          JSON.stringify(data, null, 2)
        );
      } else if (type === "summary") {
        await fs.writeFile(this.logFiles.summary, data);
      } else if (type === "error") {
        const timestamp = new Date().toISOString();
        const errorLine = `[${timestamp}] ${data}\n`;
        await fs.appendFile(this.logFiles.errors, errorLine);
      } else {
        // For responses, reflections, evaluations - append to arrays
        let existingData = [];
        try {
          const existing = await fs.readFile(this.logFiles[type], "utf8");
          existingData = JSON.parse(existing);
        } catch (e) {
          // File doesn't exist yet
        }

        existingData.push({
          timestamp: new Date().toISOString(),
          ...data,
        });

        await fs.writeFile(
          this.logFiles[type],
          JSON.stringify(existingData, null, 2)
        );
      }
    } catch (error) {
      console.error(`❌ Failed to log ${type}:`, error);
    }
  }

  async updateSessionLog(reflectionData) {
    if (!config.ENABLE_LOGGING) return;

    try {
      const sessionData = JSON.parse(
        await fs.readFile(this.logFiles.session, "utf8")
      );
      sessionData.reflections.push(reflectionData);
      sessionData.lastUpdated = new Date().toISOString();

      await fs.writeFile(
        this.logFiles.session,
        JSON.stringify(sessionData, null, 2)
      );
    } catch (error) {
      console.error("❌ Failed to update session log:", error);
    }
  }

  // Create test user in database
  async createTestUser() {
    console.log("🏗️ Creating test user Alex Chen...");

    try {
      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(
        config.SUPABASE_URL,
        config.SUPABASE_SERVICE_KEY
      );

      const { data: user, error } = await supabase
        .from("users")
        .insert({
          email: TEST_USER_PROFILE.email,
          password_hash: config.TEST_PASSWORD_HASH,
          name: TEST_USER_PROFILE.name,
          tier: TEST_USER_PROFILE.tier,
          subscription_status: TEST_USER_PROFILE.subscriptionStatus,
          email_verified: true,
          is_test_user: true,
        })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          console.log("✅ Test user already exists, fetching ID...");
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", TEST_USER_PROFILE.email)
            .single();

          this.testUserId = existingUser.id;
        } else {
          throw error;
        }
      } else {
        this.testUserId = user.id;
        console.log(`✅ Test user created with ID: ${this.testUserId}`);
      }

      await this.logToFile("session", { testUserId: this.testUserId });
      return this.testUserId;
    } catch (error) {
      console.error("❌ Failed to create test user:", error);
      await this.logToFile(
        "error",
        `Failed to create test user: ${error.message}`
      );
      throw error;
    }
  }

  // Authenticate as test user
  async authenticateTestUser() {
    console.log("🔐 Authenticating test user...");

    try {
      const response = await fetch(`${config.MIRROR_API_BASE}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signin",
          email: TEST_USER_PROFILE.email,
          password: "test_mirror_2025",
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Authentication failed: ${result.error}`);
      }

      this.authToken = result.token;
      console.log("✅ Test user authenticated successfully");

      await this.logToFile("session", {
        authenticated: true,
        authTime: new Date().toISOString(),
      });
      return this.authToken;
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      await this.logToFile("error", `Authentication failed: ${error.message}`);
      throw error;
    }
  }

  // Generate authentic Alex Chen responses
  async generateReflectionResponses(tone = "fusion", reflectionNumber = 1) {
    console.log(
      `🎭 Generating reflection responses #${reflectionNumber} (tone: ${tone})`
    );

    const context =
      reflectionNumber > 1
        ? `\nPrevious reflections context: ${this.reflectionHistory
            .slice(-2)
            .map((r) => r.summary)
            .join("; ")}`
        : "";

    const prompt = `As Alex Chen, respond to the Mirror of Truth's 5 questions. This is reflection #${reflectionNumber}.

${context}

Remember Alex's profile:
- Capable self-doubter with proven track record but low confidence
- Uses tentative language while demonstrating clear competence  
- Seeks validation while showing internal wisdom
- Dreams of impact but questions worthiness

The 5 Questions:
1. What is your dream? (Choose just one - the one that calls you most right now)
2. What is your plan for achieving this dream? (Write what you already know, even if unclear)
3. Have you set a definite date for fulfilling your dream? (Yes/No, if yes provide date)
4. What is your current relationship with this dream? (Do you believe you'll achieve it? Why or why not?)
5. What are you willing to give in return? (Energy, focus, love, time - what will you offer?)

Generate responses that show Alex's pattern: demonstrating capability while claiming uncertainty.
Make responses authentic and specific to reflection #${reflectionNumber}.

IMPORTANT: Respond EXACTLY in this format with no additional text:

DREAM: [your response here]
PLAN: [your response here]  
DATE: [Yes or No, and if Yes include a date like 2025-12-31]
RELATIONSHIP: [your response here]
OFFERING: [your response here]`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "developer", content: TESTING_AGENT_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const responseText = response.choices[0].message.content;
      console.log("✅ Generated authentic Alex Chen responses");

      const parsedResponses = this.parseReflectionResponses(responseText);

      // Log the generated responses
      await this.logToFile("responses", {
        reflectionNumber,
        tone,
        rawResponse: responseText,
        parsedResponses,
        prompt,
      });

      return parsedResponses;
    } catch (error) {
      console.error("❌ Failed to generate responses:", error);
      await this.logToFile(
        "error",
        `Failed to generate responses: ${error.message}`
      );
      throw error;
    }
  }

  // Parse responses into structured format
  parseReflectionResponses(responseText) {
    const lines = responseText.split("\n");
    const responses = {};

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (trimmedLine.toLowerCase().includes("dream:")) {
        responses.dream = trimmedLine.split(":").slice(1).join(":").trim();
      }
      if (trimmedLine.toLowerCase().includes("plan:")) {
        responses.plan = trimmedLine.split(":").slice(1).join(":").trim();
      }
      if (trimmedLine.toLowerCase().includes("date:")) {
        const dateResponse = trimmedLine.split(":").slice(1).join(":").trim();
        responses.hasDate = dateResponse.toLowerCase().includes("yes")
          ? "yes"
          : "no";
        if (responses.hasDate === "yes") {
          const dateMatch = dateResponse.match(/(\d{4}-\d{2}-\d{2})/);
          responses.dreamDate = dateMatch ? dateMatch[1] : "";
        }
      }
      if (trimmedLine.toLowerCase().includes("relationship:")) {
        responses.relationship = trimmedLine
          .split(":")
          .slice(1)
          .join(":")
          .trim();
      }
      if (trimmedLine.toLowerCase().includes("offering:")) {
        responses.offering = trimmedLine.split(":").slice(1).join(":").trim();
      }
    });

    return responses;
  }

  // Submit reflection to Mirror API
  async submitReflection(responses, tone) {
    console.log(`📝 Submitting reflection to Mirror (tone: ${tone})`);

    try {
      const payload = {
        dream: responses.dream,
        plan: responses.plan,
        hasDate: responses.hasDate,
        dreamDate: responses.dreamDate || "",
        relationship: responses.relationship,
        offering: responses.offering,
        userName: TEST_USER_PROFILE.name,
        userEmail: TEST_USER_PROFILE.email,
        language: "en",
        isAdmin: false,
        isCreator: false,
        isPremium: true,
        tone: tone,
      };

      const response = await fetch(`${config.MIRROR_API_BASE}/reflection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Reflection submission failed: ${result.error}`);
      }

      console.log("✅ Reflection submitted successfully");

      const reflectionData = {
        reflectionId: result.reflectionId,
        content: result.reflection,
        isPremium: result.isPremium,
        tone,
        submissionPayload: payload,
      };

      // Log the reflection
      await this.logToFile("reflections", reflectionData);

      return reflectionData;
    } catch (error) {
      console.error("❌ Reflection submission failed:", error);
      await this.logToFile(
        "error",
        `Reflection submission failed: ${error.message}`
      );
      throw error;
    }
  }

  // Evaluate Mirror reflection using GPT-4.1
  async evaluateReflection(
    originalResponses,
    mirrorReflection,
    tone,
    reflectionNumber
  ) {
    console.log(`🔍 Evaluating Mirror reflection #${reflectionNumber}`);

    const prompt = `Evaluate this Mirror of Truth reflection for Alex Chen.

ORIGINAL ALEX RESPONSES:
Dream: ${originalResponses.dream}
Plan: ${originalResponses.plan}
Date: ${originalResponses.hasDate} ${originalResponses.dreamDate || ""}
Relationship: ${originalResponses.relationship}
Offering: ${originalResponses.offering}

MIRROR REFLECTION (${tone} tone):
${mirrorReflection}

Analyze how well the Mirror recognized Alex's core pattern: demonstrating capability while claiming uncertainty/inexperience.

Provide detailed evaluation using the format specified in your instructions.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "developer", content: TESTING_AGENT_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const evaluation = response.choices[0].message.content;
      console.log("✅ Mirror reflection evaluated");

      // Extract ratings for analysis
      const ratings = this.extractRatingsFromEvaluation(evaluation);

      // Log the evaluation
      await this.logToFile("evaluations", {
        reflectionNumber,
        tone,
        originalResponses,
        mirrorReflection,
        evaluation,
        ratings,
        evaluationPrompt: prompt,
      });

      return evaluation;
    } catch (error) {
      console.error("❌ Evaluation failed:", error);
      await this.logToFile("error", `Evaluation failed: ${error.message}`);
      throw error;
    }
  }

  extractRatingsFromEvaluation(evaluation) {
    const ratings = {};
    const lines = evaluation.split("\n");

    lines.forEach((line) => {
      if (line.includes("RECOGNITION ACCURACY:")) {
        const match = line.match(/(\d+)\/10/);
        if (match) ratings.recognition = parseInt(match[1]);
      }
      if (line.includes("INSIGHT QUALITY:")) {
        const match = line.match(/(\d+)\/10/);
        if (match) ratings.insight = parseInt(match[1]);
      }
      if (line.includes("TONE EFFECTIVENESS:")) {
        const match = line.match(/(\d+)\/10/);
        if (match) ratings.tone = parseInt(match[1]);
      }
      if (line.includes("SPECIFICITY:")) {
        const match = line.match(/(\d+)\/10/);
        if (match) ratings.specificity = parseInt(match[1]);
      }
      if (line.includes("OVERALL RATING:")) {
        const match = line.match(/(\d+)\/10/);
        if (match) ratings.overall = parseInt(match[1]);
      }
    });

    return ratings;
  }

  // Submit feedback to Mirror API
  async submitFeedback(reflectionId, evaluation) {
    console.log("📊 Submitting feedback to Mirror API");

    try {
      const ratingMatch = evaluation.match(/OVERALL RATING: (\d+)\/10/);
      const rating = ratingMatch ? parseInt(ratingMatch[1]) : 7;

      const feedbackSections = evaluation
        .split("\n")
        .filter(
          (line) =>
            line.includes("MISSED OPPORTUNITIES:") ||
            line.includes("IMPROVEMENT SUGGESTIONS:")
        );

      const feedbackText = feedbackSections.join(" | ");

      const response = await fetch(`${config.MIRROR_API_BASE}/reflections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          action: "submit-feedback",
          reflectionId: reflectionId,
          rating: rating,
          feedback: feedbackText,
          improvementSuggestion: evaluation,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Feedback submitted successfully");
      } else {
        console.log("⚠️ Feedback submission failed, continuing...");
      }

      return rating;
    } catch (error) {
      console.error("❌ Feedback submission error:", error);
      await this.logToFile(
        "error",
        `Feedback submission error: ${error.message}`
      );
      return 7;
    }
  }

  // Run complete testing cycle
  async runTestingCycle(numReflections = 6) {
    console.log(
      `🚀 Starting Mirror testing cycle (${numReflections} reflections)`
    );

    try {
      await this.createTestUser();
      await this.authenticateTestUser();

      const results = [];

      for (let i = 1; i <= numReflections; i++) {
        const tone = this.tones[(i - 1) % this.tones.length];

        console.log(
          `\n--- REFLECTION ${i}/${numReflections} (${tone.toUpperCase()}) ---`
        );

        try {
          // Generate responses
          const responses = await this.generateReflectionResponses(tone, i);

          // Submit to Mirror
          const reflection = await this.submitReflection(responses, tone);

          // Evaluate quality
          const evaluation = await this.evaluateReflection(
            responses,
            reflection.content,
            tone,
            i
          );

          // Submit feedback
          const rating = await this.submitFeedback(
            reflection.reflectionId,
            evaluation
          );

          const result = {
            reflectionNumber: i,
            tone: tone,
            originalResponses: responses,
            mirrorReflection: reflection.content,
            evaluation: evaluation,
            rating: rating,
            reflectionId: reflection.reflectionId,
            timestamp: new Date().toISOString(),
          };

          results.push(result);

          // Update session log
          await this.updateSessionLog({
            reflectionNumber: i,
            tone,
            rating,
            reflectionId: reflection.reflectionId,
          });

          this.reflectionHistory.push({
            summary: `Reflection ${i}: ${responses.dream.substring(
              0,
              50
            )}... (${rating}/10)`,
          });

          console.log(`✅ Reflection ${i} complete - Rating: ${rating}/10`);

          // Wait between reflections
          if (i < numReflections) {
            console.log("⏳ Waiting 3 seconds before next reflection...");
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        } catch (error) {
          console.error(`❌ Reflection ${i} failed:`, error);
          await this.logToFile(
            "error",
            `Reflection ${i} failed: ${error.message}`
          );

          // Continue with next reflection
          results.push({
            reflectionNumber: i,
            tone: tone,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Generate evolution report if eligible
      let evolutionReport = null;
      if (results.filter((r) => !r.error).length >= 6) {
        try {
          evolutionReport = await this.generateEvolutionReport();
        } catch (error) {
          console.log("⚠️ Evolution report generation failed:", error.message);
          await this.logToFile(
            "error",
            `Evolution report failed: ${error.message}`
          );
        }
      }

      // Generate final report
      const finalReport = this.generateTestingReport(results, evolutionReport);
      await this.logToFile("summary", finalReport);

      console.log("\n🎯 TESTING CYCLE COMPLETE");
      console.log(`📝 Logs saved to: ${config.LOG_DIR}/${this.sessionId}-*`);
      console.log(finalReport);

      return { results, evolutionReport, sessionId: this.sessionId };
    } catch (error) {
      console.error("❌ Testing cycle failed:", error);
      await this.logToFile("error", `Testing cycle failed: ${error.message}`);
      throw error;
    }
  }

  // Generate evolution report
  async generateEvolutionReport() {
    console.log("🦋 Requesting evolution report...");

    try {
      const response = await fetch(`${config.MIRROR_API_BASE}/evolution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          action: "generate-report",
          tone: "fusion",
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Evolution report generated");
        return result.report;
      } else {
        console.log("⚠️ Evolution report not available yet");
        return null;
      }
    } catch (error) {
      console.error("❌ Evolution report error:", error);
      return null;
    }
  }

  // Generate comprehensive testing report
  generateTestingReport(results, evolutionReport = null) {
    const successfulResults = results.filter((r) => !r.error);
    const avgRating =
      successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.rating, 0) /
          successfulResults.length
        : 0;

    const toneRatings = {};
    successfulResults.forEach((r) => {
      if (!toneRatings[r.tone]) toneRatings[r.tone] = [];
      toneRatings[r.tone].push(r.rating);
    });

    let report = `
📊 MIRROR OF TRUTH TESTING REPORT
=====================================
Session ID: ${this.sessionId}
Test Date: ${new Date().toISOString()}
Test Persona: Alex Chen (Capable Self-Doubter)

OVERALL PERFORMANCE:
- Total Reflections Attempted: ${results.length}
- Successful Reflections: ${successfulResults.length}
- Failed Reflections: ${results.filter((r) => r.error).length}
- Average Rating: ${avgRating.toFixed(1)}/10
- High Quality (8+): ${successfulResults.filter((r) => r.rating >= 8).length}
- Medium Quality (6-7): ${
      successfulResults.filter((r) => r.rating >= 6 && r.rating < 8).length
    }
- Low Quality (≤5): ${successfulResults.filter((r) => r.rating <= 5).length}

TONE EFFECTIVENESS:`;

    Object.entries(toneRatings).forEach(([tone, ratings]) => {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      const min = Math.min(...ratings);
      const max = Math.max(...ratings);
      report += `\n• ${tone.toUpperCase()}: ${avg.toFixed(
        1
      )}/10 (range: ${min}-${max}, tests: ${ratings.length})`;
    });

    // Performance analysis
    report += `\n\nPERFORMance ANALYSIS:`;

    if (avgRating >= 8.5) {
      report += `\n✅ Excellent recognition quality achieved`;
    } else if (avgRating >= 7.5) {
      report += `\n✅ Good recognition quality with room for improvement`;
    } else if (avgRating >= 6.0) {
      report += `\n⚠️ Fair recognition quality - significant improvements needed`;
    } else {
      report += `\n❌ Poor recognition quality - major prompt revisions required`;
    }

    // Best performing tone
    if (Object.keys(toneRatings).length > 0) {
      const bestTone = Object.entries(toneRatings).sort(
        ([, a], [, b]) =>
          b.reduce((sum, r) => sum + r, 0) / b.length -
          a.reduce((sum, r) => sum + r, 0) / a.length
      )[0];

      report += `\n• Best performing tone for Alex Chen: ${bestTone[0].toUpperCase()} (${(
        bestTone[1].reduce((sum, r) => sum + r, 0) / bestTone[1].length
      ).toFixed(1)}/10)`;
    }

    // Evolution report summary
    if (evolutionReport) {
      report += `\n\nEVOLUTION REPORT:`;
      report += `\n• Successfully generated evolution report`;
      report += `\n• Report Type: ${evolutionReport.reportType}`;
      report += `\n• Reflections Analyzed: ${evolutionReport.reflectionCount}`;
      report += `\n• Growth Score: ${evolutionReport.growthScore}/100`;
      report += `\n• Patterns Detected: ${
        evolutionReport.patterns?.length || 0
      }`;
    } else {
      report += `\n\nEVOLUTION REPORT:`;
      report += `\n• Evolution report not generated (insufficient reflections or error)`;
    }

    report += `\n\nRECOMMENDATIONS:`;

    if (avgRating >= 8) {
      report += `\n• Mirror is performing excellently for this persona type`;
      report += `\n• Consider testing with additional persona types`;
      report += `\n• Fine-tune based on specific feedback in low-rated reflections`;
    } else {
      report += `\n• Review evaluation feedback for improvement areas`;
      report += `\n• Focus on ${Object.entries(toneRatings)
        .filter(
          ([, ratings]) =>
            ratings.reduce((sum, r) => sum + r, 0) / ratings.length < 7
        )
        .map(([tone]) => tone)
        .join(", ")} tone improvements`;
      report += `\n• Update prompts based on "MISSED OPPORTUNITIES" feedback`;
      report += `\n• Re-test after prompt improvements`;
    }

    report += `\n\nFILES GENERATED:`;
    Object.entries(this.logFiles).forEach(([type, path]) => {
      report += `\n• ${type}: ${path}`;
    });

    report += `\n\nTEST COMPLETED: ${new Date().toISOString()}`;

    return report;
  }
}

// Export for use
module.exports = {
  MirrorTestingAgent,
  TEST_USER_PROFILE,
  config,
};

// Run test if called directly
if (require.main === module) {
  const agent = new MirrorTestingAgent();
  agent
    .runTestingCycle(6)
    .then((results) => {
      console.log("\n🎯 Test completed successfully!");
      console.log(`📁 Check ${config.LOG_DIR} folder for detailed logs`);
    })
    .catch((error) => {
      console.error("❌ Test failed:", error);
    });
}
