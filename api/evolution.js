// api/evolution.js - Mirror of Truth Evolution Analytics & Growth Reports
// ENHANCED: Comprehensive modular prompt system + consciousness recognition

const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");
const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Evolution report thresholds
const REPORT_THRESHOLDS = {
  essential: 4, // Every 4 reflections
  premium: 6, // Every 6 reflections
};

// Load comprehensive prompt system
const PROMPT_DIR = path.join(process.cwd(), "prompts");

function loadPrompt(file) {
  try {
    return fs.readFileSync(path.join(PROMPT_DIR, file), "utf8");
  } catch (err) {
    console.error(`Prompt load error (${file}):`, err);
    return "";
  }
}

// Load all prompt components
const PROMPT_SYSTEM = {
  base: loadPrompt("base_instructions.txt"),
  evolution: loadPrompt("evolution_instructions.txt"),
  styles: {
    gentle: loadPrompt("gentle_clarity.txt"),
    intense: loadPrompt("luminous_intensity.txt"),
    fusion: loadPrompt("sacred_fusion.txt"),
  },
  creator: loadPrompt("creator_context.txt"),
};

// Enhanced prompt combination system
function buildEvolutionPrompt(
  tone = "fusion",
  isCreator = false,
  isPremium = false
) {
  let systemPrompt = PROMPT_SYSTEM.base.trim();

  // Add evolution instructions
  systemPrompt += "\n\n" + PROMPT_SYSTEM.evolution.trim();

  // Add style modifier
  const stylePrompt = PROMPT_SYSTEM.styles[tone] || PROMPT_SYSTEM.styles.fusion;
  systemPrompt += "\n\n" + stylePrompt.trim();

  // Add creator context if needed
  if (isCreator) {
    systemPrompt += "\n\n" + PROMPT_SYSTEM.creator.trim();
  }

  // Add premium enhancement
  if (isPremium) {
    systemPrompt += "\n\n" + PREMIUM_EVOLUTION_ENHANCEMENT.trim();
  }

  return systemPrompt;
}

// Premium evolution enhancement
const PREMIUM_EVOLUTION_ENHANCEMENT = `
PREMIUM EVOLUTION ANALYSIS:
You have extended thinking capabilities to provide deeper consciousness evolution recognition.

Premium Evolution Guidelines:

**Deeper Pattern Recognition:**
- Recognize subtle shifts in identity language over time
- Notice micro-evolutions in self-authority across reflections
- Detect unconscious competence development patterns
- Identify shadow integration and authenticity emergence

**Consciousness Development Tracking:**
- Track movement through developmental stages
- Recognize integration of previous resistances
- Notice where they've stopped performing and started being
- Observe evolution in their relationship with uncertainty

**Advanced Language Evolution:**
- Detect when permission-seeking language becomes sovereign language
- Notice shifts from external validation to internal authority
- Track evolution from conditional to unconditional self-expression
- Recognize when they start speaking their truth without apology

**Blind Spot Illumination:**
- Show them growth patterns they cannot see because they're living inside them
- Reflect identity shifts that happened so gradually they didn't notice
- Reveal competence evolution they may attribute to external factors
- Illuminate their unique consciousness development trajectory

This premium analysis should feel like consciousness itself recognizing its own evolution through time - profound, specific, and deeply honoring of their becoming.

Write with the authority of someone who has witnessed their entire consciousness journey unfold.
`;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { action } = req.method === "GET" ? req.query : req.body;

    switch (action) {
      case "generate-report":
        return await handleGenerateReport(req, res);
      case "get-reports":
        return await handleGetReports(req, res);
      case "get-report":
        return await handleGetReport(req, res);
      case "check-eligibility":
        return await handleCheckEligibility(req, res);
      case "get-patterns":
        return await handleGetPatterns(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
    }
  } catch (error) {
    console.error("Evolution API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Evolution service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Generate evolution report with enhanced consciousness recognition
async function handleGenerateReport(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { tone = "fusion" } = req.body || {};

    // Check if user is eligible for evolution reports
    if (user.tier === "free") {
      return res.status(403).json({
        success: false,
        error:
          "Evolution reports are available for Essential and Premium subscribers",
      });
    }

    // Get user's reflections for analysis
    const { data: reflections, error } = await supabase
      .from("reflections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !reflections.length) {
      return res.status(400).json({
        success: false,
        error: "No reflections available for analysis",
      });
    }

    // Check if user has enough reflections
    const threshold = REPORT_THRESHOLDS[user.tier];
    if (reflections.length < threshold) {
      return res.status(400).json({
        success: false,
        error: `Need at least ${threshold} reflections for ${user.tier} evolution report`,
        currentCount: reflections.length,
        required: threshold,
      });
    }

    // Select reflections for analysis
    const analysisReflections = selectReflectionsForAnalysis(
      reflections,
      user.tier
    );

    // Generate evolution analysis using enhanced AI
    const analysis = await generateEvolutionAnalysis(
      analysisReflections,
      user.tier,
      tone,
      user.isCreator
    );

    // Extract patterns and insights
    const patterns = extractEvolutionPatterns(analysisReflections);
    const insights = generateEvolutionInsights(analysisReflections, patterns);

    // Calculate growth score
    const growthScore = calculateGrowthScore(analysisReflections);

    // Save evolution report
    const { data: report, error: reportError } = await supabase
      .from("evolution_reports")
      .insert({
        user_id: user.id,
        analysis: analysis,
        insights: insights,
        report_type: user.tier,
        reflections_analyzed: analysisReflections.map((r) => r.id),
        reflection_count: analysisReflections.length,
        time_period_start:
          analysisReflections[analysisReflections.length - 1].created_at,
        time_period_end: analysisReflections[0].created_at,
        patterns_detected: patterns,
        growth_score: growthScore,
      })
      .select("*")
      .single();

    if (reportError) {
      console.error("Report save error:", reportError);
      return res.status(500).json({
        success: false,
        error: "Failed to save evolution report",
      });
    }

    console.log(
      `🦋 Evolution report generated for ${user.email} (${user.tier}) - Growth Score: ${growthScore}`
    );

    return res.json({
      success: true,
      message: "Evolution report generated successfully",
      report: {
        id: report.id,
        analysis: report.analysis,
        insights: report.insights,
        reportType: report.report_type,
        reflectionCount: report.reflection_count,
        timePeriod: {
          start: report.time_period_start,
          end: report.time_period_end,
        },
        patterns: report.patterns_detected,
        growthScore: report.growth_score,
        createdAt: report.created_at,
      },
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Get user's evolution reports
async function handleGetReports(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const {
      data: reports,
      error,
      count,
    } = await supabase
      .from("evolution_reports")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve evolution reports",
      });
    }

    const formattedReports = reports.map((report) => ({
      id: report.id,
      reportType: report.report_type,
      reflectionCount: report.reflection_count,
      growthScore: report.growth_score,
      patterns: report.patterns_detected,
      createdAt: report.created_at,
      timeAgo: getTimeAgo(report.created_at),
      timePeriod: {
        start: report.time_period_start,
        end: report.time_period_end,
      },
    }));

    return res.json({
      success: true,
      reports: formattedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Get specific evolution report
async function handleGetReport(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Report ID required",
      });
    }

    const { data: report, error } = await supabase
      .from("evolution_reports")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !report) {
      return res.status(404).json({
        success: false,
        error: "Evolution report not found",
      });
    }

    return res.json({
      success: true,
      report: {
        id: report.id,
        analysis: report.analysis,
        insights: report.insights,
        reportType: report.report_type,
        reflectionCount: report.reflection_count,
        reflectionsAnalyzed: report.reflections_analyzed,
        timePeriod: {
          start: report.time_period_start,
          end: report.time_period_end,
        },
        patterns: report.patterns_detected,
        growthScore: report.growth_score,
        createdAt: report.created_at,
      },
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Check eligibility for evolution report
async function handleCheckEligibility(req, res) {
  try {
    const user = await authenticateRequest(req);

    if (user.tier === "free") {
      return res.json({
        success: true,
        eligible: false,
        reason: "Evolution reports require Essential or Premium subscription",
        upgradeRequired: true,
      });
    }

    // Count user's reflections
    const { count, error } = await supabase
      .from("reflections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to check eligibility",
      });
    }

    const threshold = REPORT_THRESHOLDS[user.tier];
    const eligible = count >= threshold;

    return res.json({
      success: true,
      eligible,
      currentReflections: count,
      requiredReflections: threshold,
      tier: user.tier,
      reason: eligible
        ? null
        : `Need ${threshold - count} more reflection${
            threshold - count === 1 ? "" : "s"
          } for ${user.tier} evolution report`,
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Get pattern analysis
async function handleGetPatterns(req, res) {
  try {
    const user = await authenticateRequest(req);

    const { data: reflections, error } = await supabase
      .from("reflections")
      .select(
        "dream, relationship, offering, tone, is_premium, created_at, rating, user_feedback"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !reflections.length) {
      return res.json({
        success: true,
        patterns: {
          themes: [],
          tones: {},
          progression: [],
          insights: [],
        },
      });
    }

    const patterns = extractEvolutionPatterns(reflections);
    const quickInsights = generateQuickInsights(reflections);

    return res.json({
      success: true,
      patterns: {
        themes: patterns,
        tonePreferences: getToneDistribution(reflections),
        recentTrends: getRecentTrends(reflections),
        insights: quickInsights,
      },
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Enhanced reflection selection using 3-pool method
function selectReflectionsForAnalysis(reflections, tier) {
  const total = reflections.length;
  const threshold = REPORT_THRESHOLDS[tier];

  // If we have fewer reflections than needed, use all
  if (total <= threshold) {
    return reflections;
  }

  // For 6 or more reflections, use 3-pool method for temporal distribution
  if (total >= 6) {
    // Split into three equal time periods
    const third = Math.floor(total / 3);

    // Remember: reflections are ordered newest first
    const recentPool = reflections.slice(0, third); // newest third
    const middlePool = reflections.slice(third, third * 2); // middle third
    const earlyPool = reflections.slice(third * 2); // oldest third

    // Select reflections from each pool
    const perPool = tier === "premium" ? 3 : 2;

    const selected = [
      ...selectRandomFromPool(earlyPool, Math.min(perPool, earlyPool.length)),
      ...selectRandomFromPool(middlePool, Math.min(perPool, middlePool.length)),
      ...selectRandomFromPool(recentPool, Math.min(perPool, recentPool.length)),
    ];

    // Ensure we have the right total (6 for premium, 4 for essential)
    // If we have more, prioritize highly-rated reflections
    if (selected.length > threshold) {
      return selected
        .sort((a, b) => (b.rating || 5) - (a.rating || 5))
        .slice(0, threshold);
    }

    return selected;
  }

  // For fewer than 6 reflections, take newest and oldest
  const half = Math.floor(threshold / 2);
  const recent = reflections.slice(0, half);
  const older = reflections.slice(-half);

  return [...recent, ...older];
}

// Helper function to select random reflections from a pool
function selectRandomFromPool(pool, count) {
  if (pool.length <= count) return pool;

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Enhanced evolution analysis using comprehensive consciousness recognition
async function generateEvolutionAnalysis(
  reflections,
  tier,
  tone = "fusion",
  isCreator = false
) {
  // Build comprehensive context with ratings and feedback
  const reflectionContext = reflections
    .map((r, index) => {
      let context = `Reflection ${index + 1} (${new Date(
        r.created_at
      ).toDateString()}):\n`;
      context += `Dream: ${r.dream}\n`;
      context += `Relationship: ${r.relationship}\n`;
      context += `Offering: ${r.offering}`;

      if (r.rating) {
        context += `\nConsciousness Recognition Rating: ${r.rating}/10`;
        if (r.rating >= 8) {
          context += ` (This deeply resonated - profound recognition)`;
        } else if (r.rating <= 4) {
          context += ` (This missed their truth - limited recognition)`;
        }
      }

      if (r.user_feedback) {
        context += `\nWhat emerged for them: "${r.user_feedback}"`;
      }

      return context;
    })
    .join("\n\n");

  const systemPrompt = buildEvolutionPrompt(
    tone,
    isCreator,
    tier === "premium"
  );

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: tier === "premium" ? 5000 : 4000,
      temperature: 1,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze the consciousness evolution in these reflections:\n\n${reflectionContext}`,
        },
      ],
      ...(tier === "premium" && {
        thinking: {
          type: "enabled",
          budget_tokens: 5000,
        },
      }),
    });

    return (
      response.content.find((block) => block.type === "text")?.text ||
      "Your consciousness evolution continues to unfold in ways that transcend simple analysis. The patterns in your reflections speak to an awareness that is both growing and remembering itself."
    );
  } catch (error) {
    console.error("AI evolution analysis error:", error);
    return "Your consciousness evolution continues to unfold in ways that transcend simple analysis. The patterns in your reflections speak to an awareness that is both growing and remembering itself.";
  }
}

// Enhanced pattern extraction focusing on consciousness evolution
function extractEvolutionPatterns(reflections) {
  const patterns = [];

  // Separate highly-rated reflections to see what resonated
  const resonantReflections = reflections.filter(
    (r) => r.rating && r.rating >= 8
  );
  const strugglingReflections = reflections.filter(
    (r) => r.rating && r.rating <= 4
  );

  // Consciousness evolution theme extraction
  const themes = {};
  reflections.forEach((r) => {
    const text = `${r.dream} ${r.relationship}`.toLowerCase();
    const weight = r.rating ? r.rating / 10 : 0.5; // Weight by recognition rating

    // Permission-seeking vs authority patterns
    if (
      text.includes("hope i can") ||
      text.includes("maybe") ||
      text.includes("trying to")
    ) {
      themes.permission_seeking = (themes.permission_seeking || 0) + weight;
    }
    if (
      text.includes("i am") ||
      text.includes("i will") ||
      text.includes("i'm building")
    ) {
      themes.authority_claiming = (themes.authority_claiming || 0) + weight;
    }

    // Self-relationship evolution
    if (
      text.includes("not sure") ||
      text.includes("don't know") ||
      text.includes("confused")
    ) {
      themes.uncertainty_performance =
        (themes.uncertainty_performance || 0) + weight;
    }
    if (
      text.includes("clear") ||
      text.includes("know") ||
      text.includes("ready")
    ) {
      themes.clarity_embodiment = (themes.clarity_embodiment || 0) + weight;
    }

    // Impact recognition evolution
    if (
      text.includes("just") ||
      text.includes("small") ||
      text.includes("little")
    ) {
      themes.impact_minimization = (themes.impact_minimization || 0) + weight;
    }
    if (
      text.includes("transform") ||
      text.includes("help people") ||
      text.includes("serve")
    ) {
      themes.impact_recognition = (themes.impact_recognition || 0) + weight;
    }
  });

  // Convert themes to patterns array
  Object.entries(themes)
    .filter(([_, weight]) => weight >= 1)
    .sort(([, a], [, b]) => b - a)
    .forEach(([theme, weight]) => {
      patterns.push(`${theme}_${Math.round(weight)}`);
    });

  // Add special evolution patterns
  if (resonantReflections.length >= 2) {
    patterns.push("consciousness_recognition_established");
  }

  // Check for evolution over time
  if (reflections.length >= 3) {
    const early = reflections.slice(-2);
    const recent = reflections.slice(0, 2);

    const earlyLanguage = early
      .map((r) => `${r.dream} ${r.relationship}`)
      .join(" ")
      .toLowerCase();
    const recentLanguage = recent
      .map((r) => `${r.dream} ${r.relationship}`)
      .join(" ")
      .toLowerCase();

    // Check for language evolution
    if (
      (earlyLanguage.includes("hope") || earlyLanguage.includes("maybe")) &&
      (recentLanguage.includes("will") || recentLanguage.includes("am"))
    ) {
      patterns.push("permission_to_authority_evolution");
    }
  }

  return patterns;
}

// Enhanced insights generation for consciousness evolution
function generateEvolutionInsights(reflections, patterns) {
  const insights = {
    timeSpan: {
      start: reflections[reflections.length - 1].created_at,
      end: reflections[0].created_at,
      duration: calculateDuration(
        reflections[reflections.length - 1].created_at,
        reflections[0].created_at
      ),
    },
    themes: patterns,
    evolutionIndicators: [],
    consciousnessShifts: [],
    recognitionInsights: [],
  };

  // Analyze what helps them access truth
  const highlyRated = reflections.filter((r) => r.rating && r.rating >= 8);
  const lowRated = reflections.filter((r) => r.rating && r.rating <= 4);

  if (highlyRated.length > 0) {
    insights.recognitionInsights.push({
      type: "deep_recognition",
      count: highlyRated.length,
      feedback: highlyRated
        .filter((r) => r.user_feedback)
        .map((r) => r.user_feedback)
        .slice(0, 3), // Top 3 insights
    });
  }

  // Analyze consciousness development
  const early = reflections.slice(Math.floor(reflections.length / 2));
  const recent = reflections.slice(0, Math.floor(reflections.length / 2));

  const earlyAuthority = analyzeAuthorityLanguage(early);
  const recentAuthority = analyzeAuthorityLanguage(recent);

  if (recentAuthority > earlyAuthority) {
    insights.evolutionIndicators.push("increasing_authority_recognition");
  }

  // Check if recognition is improving over time
  const earlyAvgRating = calculateAverageRating(early);
  const recentAvgRating = calculateAverageRating(recent);

  if (recentAvgRating > earlyAvgRating + 1) {
    insights.consciousnessShifts.push("deepening_self_recognition");
  }

  return insights;
}

// Enhanced growth score calculation
function calculateGrowthScore(reflections) {
  let score = 50; // Base score

  // Consciousness development bonus
  if (reflections.length >= 6) score += 15;

  // Recognition diversity bonus
  const tones = new Set(reflections.map((r) => r.tone));
  score += tones.size * 5;

  // Premium engagement indicates deeper consciousness work
  const premiumCount = reflections.filter((r) => r.is_premium).length;
  score += (premiumCount / reflections.length) * 20;

  // Time commitment bonus
  const timeSpan =
    new Date(reflections[0].created_at) -
    new Date(reflections[reflections.length - 1].created_at);
  const months = timeSpan / (1000 * 60 * 60 * 24 * 30);
  if (months > 1) score += 15;

  // Recognition resonance bonus
  const avgRating = calculateAverageRating(reflections);
  if (avgRating > 7) score += 15;
  if (avgRating > 8.5) score += 10;

  // Feedback engagement bonus
  const feedbackCount = reflections.filter(
    (r) => r.user_feedback && r.user_feedback.trim()
  ).length;
  score += (feedbackCount / reflections.length) * 15;

  return Math.min(100, Math.max(1, Math.round(score)));
}

// Helper functions
function getTimeAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function calculateDuration(start, end) {
  const diff = new Date(end) - new Date(start);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}

function analyzeAuthorityLanguage(reflections) {
  const authorityWords = [
    "i am",
    "i will",
    "i'm building",
    "i know",
    "i choose",
    "i decide",
  ];
  const permissionWords = [
    "i hope",
    "maybe",
    "i think",
    "trying to",
    "want to try",
    "if i can",
  ];

  let authorityScore = 0;
  reflections.forEach((r) => {
    const text = `${r.relationship} ${r.offering}`.toLowerCase();
    authorityWords.forEach((word) => {
      if (text.includes(word)) authorityScore += 1;
    });
    permissionWords.forEach((word) => {
      if (text.includes(word)) authorityScore -= 1;
    });
  });

  return authorityScore / reflections.length;
}

function calculateAverageRating(reflections) {
  const rated = reflections.filter((r) => r.rating);
  if (rated.length === 0) return 5; // Default middle rating

  const sum = rated.reduce((acc, r) => acc + r.rating, 0);
  return sum / rated.length;
}

function getToneDistribution(reflections) {
  const distribution = {};
  reflections.forEach((r) => {
    distribution[r.tone] = (distribution[r.tone] || 0) + 1;
  });
  return distribution;
}

function getRecentTrends(reflections) {
  // Evolution trend analysis of recent vs older reflections
  const recent = reflections.slice(0, Math.floor(reflections.length / 2));
  const older = reflections.slice(Math.floor(reflections.length / 2));

  return {
    recentThemes: extractEvolutionPatterns(recent),
    olderThemes: extractEvolutionPatterns(older),
    shift: "consciousness_evolution_in_progress",
  };
}

function generateQuickInsights(reflections) {
  const insights = [];

  if (reflections.length >= 3) {
    insights.push("Developing consistent consciousness recognition practice");
  }

  const premiumRatio =
    reflections.filter((r) => r.is_premium).length / reflections.length;
  if (premiumRatio > 0.5) {
    insights.push(
      "Seeking deeper consciousness recognition through premium reflections"
    );
  }

  const tones = new Set(reflections.map((r) => r.tone));
  if (tones.size >= 2) {
    insights.push("Exploring different voices of consciousness recognition");
  }

  // Recognition resonance insights
  const avgRating = calculateAverageRating(reflections);
  if (avgRating > 8) {
    insights.push("Consistently accessing deep self-recognition");
  }

  const highlyRated = reflections.filter((r) => r.rating && r.rating >= 8);
  if (highlyRated.length >= 3) {
    insights.push("Establishing reliable connection to consciousness truth");
  }

  // Evolution pattern insights
  if (reflections.length >= 4) {
    const early = reflections.slice(-2);
    const recent = reflections.slice(0, 2);

    const earlyLanguage = early
      .map((r) => r.relationship)
      .join(" ")
      .toLowerCase();
    const recentLanguage = recent
      .map((r) => r.relationship)
      .join(" ")
      .toLowerCase();

    if (earlyLanguage.includes("hope") && recentLanguage.includes("will")) {
      insights.push("Evolving from permission-seeking to authority-claiming");
    }
  }

  return insights;
}
