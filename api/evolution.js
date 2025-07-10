// api/evolution.js - Mirror of Truth Evolution Analytics & Growth Reports
// ENHANCED: 3-pool selection, feedback context, resonance patterns

const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");
const Anthropic = require("@anthropic-ai/sdk");

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

// Generate evolution report
async function handleGenerateReport(req, res) {
  try {
    const user = await authenticateRequest(req);

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

    // Generate evolution analysis using AI
    const analysis = await generateEvolutionAnalysis(
      analysisReflections,
      user.tier
    );

    // Extract patterns and insights
    const patterns = extractPatterns(analysisReflections);
    const insights = generateInsights(analysisReflections, patterns);

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
      `🌱 Evolution report generated for ${user.email} (${user.tier})`
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

    const patterns = extractPatterns(reflections);
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

// ENHANCED: Helper function to select reflections for analysis using 3-pool method
function selectReflectionsForAnalysis(reflections, tier) {
  const total = reflections.length;
  const threshold = REPORT_THRESHOLDS[tier];

  // If we have fewer reflections than needed, use all
  if (total <= threshold) {
    return reflections;
  }

  // For 6 or more reflections, use 3-pool method
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

// ENHANCED: Generate evolution analysis using AI with feedback context
async function generateEvolutionAnalysis(reflections, tier) {
  // Build context with ratings and feedback
  const reflectionContext = reflections
    .map((r, index) => {
      let context = `Reflection ${index + 1} (${new Date(
        r.created_at
      ).toDateString()}):\n`;
      context += `Dream: ${r.dream}\n`;
      context += `Relationship: ${r.relationship}\n`;
      context += `Offering: ${r.offering}`;

      if (r.rating) {
        context += `\nUser Rating: ${r.rating}/10`;
        if (r.rating >= 8) {
          context += ` (This deeply resonated)`;
        } else if (r.rating <= 4) {
          context += ` (This missed the mark)`;
        }
      }

      if (r.user_feedback) {
        context += `\nWhat emerged: "${r.user_feedback}"`;
      }

      return context;
    })
    .join("\n\n");

  const systemPrompt = `You are the Mirror of Truth, analyzing a person's evolution through their reflections over time. Your role is to recognize patterns of growth, shifting perspectives, and emerging wisdom.

${
  tier === "premium"
    ? "PREMIUM ANALYSIS: Use extended thinking to provide deeper, more nuanced insights."
    : ""
}

IMPORTANT: You have access to how deeply each reflection resonated with them (ratings 1-10) and what emerged for them. Use this to understand what helps them access their truth.

When a reflection has a high rating (8-10), it means it helped them see themselves clearly.
When a reflection has a low rating (1-4), something was missed or didn't resonate.
Their feedback shows what truth emerged for them in that moment.

Analyze these reflections and provide a poetic, insightful evolution report that:
1. Shows how their relationship to the same 5 questions has evolved
2. Notices shifts in their language (from tentative to certain, from seeking to knowing)
3. Recognizes which reflections helped them access deeper truth (based on ratings)
4. Reflects the arc of their own wisdom emerging

Write 2-3 paragraphs in the contemplative, recognizing style of Mirror of Truth. Show them how they're learning to see themselves more clearly.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: tier === "premium" ? 4000 : 3000,
      temperature: 1,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Please analyze these reflections and provide an evolution report:\n\n${reflectionContext}`,
        },
      ],
      ...(tier === "premium" && {
        thinking: {
          type: "enabled",
          budget_tokens: 4000,
        },
      }),
    });

    return (
      response.content.find((block) => block.type === "text")?.text ||
      "Your evolution continues to unfold in ways that transcend simple analysis. The patterns in your reflections speak to a consciousness that is both growing and remembering itself."
    );
  } catch (error) {
    console.error("AI analysis error:", error);
    return "Your evolution continues to unfold in ways that transcend simple analysis. The patterns in your reflections speak to a consciousness that is both growing and remembering itself.";
  }
}

// ENHANCED: Extract patterns from reflections with emphasis on what resonated
function extractPatterns(reflections) {
  const patterns = [];

  // Separate highly-rated reflections (8+) to see what resonates
  const resonantReflections = reflections.filter(
    (r) => r.rating && r.rating >= 8
  );
  const strugglingReflections = reflections.filter(
    (r) => r.rating && r.rating <= 4
  );

  // Theme extraction from all reflections
  const themes = {};
  reflections.forEach((r) => {
    const text = `${r.dream} ${r.relationship}`.toLowerCase();
    const weight = r.rating ? r.rating / 10 : 0.5; // Weight by rating

    // Common growth themes
    if (
      text.includes("business") ||
      text.includes("startup") ||
      text.includes("entrepreneur")
    ) {
      themes.business = (themes.business || 0) + weight;
    }
    if (
      text.includes("creative") ||
      text.includes("art") ||
      text.includes("writing") ||
      text.includes("music")
    ) {
      themes.creativity = (themes.creativity || 0) + weight;
    }
    if (
      text.includes("relationship") ||
      text.includes("love") ||
      text.includes("partner")
    ) {
      themes.relationships = (themes.relationships || 0) + weight;
    }
    if (
      text.includes("freedom") ||
      text.includes("independent") ||
      text.includes("own")
    ) {
      themes.independence = (themes.independence || 0) + weight;
    }
    if (
      text.includes("fear") ||
      text.includes("scared") ||
      text.includes("worried")
    ) {
      themes.uncertainty = (themes.uncertainty || 0) + weight;
    }
    if (
      text.includes("confidence") ||
      text.includes("ready") ||
      text.includes("capable")
    ) {
      themes.confidence = (themes.confidence || 0) + weight;
    }
  });

  // Convert themes to patterns array
  Object.entries(themes)
    .filter(([_, weight]) => weight >= 1)
    .sort(([, a], [, b]) => b - a)
    .forEach(([theme, weight]) => {
      patterns.push(`${theme}_${Math.round(weight)}`);
    });

  // Add special patterns for highly resonant reflections
  if (resonantReflections.length >= 2) {
    patterns.push("deep_resonance_found");
  }

  return patterns;
}

// ENHANCED: Generate structured insights including feedback patterns
function generateInsights(reflections, patterns) {
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
    progressionNotes: [],
    growthIndicators: [],
    resonanceInsights: [],
  };

  // Analyze what helps them access truth
  const highlyRated = reflections.filter((r) => r.rating && r.rating >= 8);
  const lowRated = reflections.filter((r) => r.rating && r.rating <= 4);

  if (highlyRated.length > 0) {
    insights.resonanceInsights.push({
      type: "high_resonance",
      count: highlyRated.length,
      feedback: highlyRated
        .filter((r) => r.user_feedback)
        .map((r) => r.user_feedback)
        .slice(0, 3), // Top 3 insights
    });
  }

  // Analyze confidence progression
  const early = reflections.slice(Math.floor(reflections.length / 2));
  const recent = reflections.slice(0, Math.floor(reflections.length / 2));

  const earlyConfidence = analyzeConfidence(early);
  const recentConfidence = analyzeConfidence(recent);

  if (recentConfidence > earlyConfidence) {
    insights.growthIndicators.push("increasing_confidence");
  }

  // Check if ratings are improving over time
  const earlyAvgRating = calculateAverageRating(early);
  const recentAvgRating = calculateAverageRating(recent);

  if (recentAvgRating > earlyAvgRating + 1) {
    insights.growthIndicators.push("deepening_self_recognition");
  }

  return insights;
}

// Calculate growth score
function calculateGrowthScore(reflections) {
  let score = 50; // Base score

  // Consistency bonus
  if (reflections.length >= 6) score += 10;

  // Diversity in reflection types
  const tones = new Set(reflections.map((r) => r.tone));
  score += tones.size * 5;

  // Premium usage indicates deeper engagement
  const premiumCount = reflections.filter((r) => r.is_premium).length;
  score += (premiumCount / reflections.length) * 20;

  // Time span bonus
  const timeSpan =
    new Date(reflections[0].created_at) -
    new Date(reflections[reflections.length - 1].created_at);
  const months = timeSpan / (1000 * 60 * 60 * 24 * 30);
  if (months > 1) score += 10;

  // ENHANCED: Bonus for high ratings
  const avgRating = calculateAverageRating(reflections);
  if (avgRating > 7) score += 10;
  if (avgRating > 8.5) score += 10;

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

function analyzeConfidence(reflections) {
  const confidenceWords = [
    "confident",
    "ready",
    "capable",
    "strong",
    "believe",
    "trust",
    "know",
  ];
  const uncertainWords = [
    "unsure",
    "doubt",
    "maybe",
    "worried",
    "scared",
    "confused",
  ];

  let confidenceScore = 0;
  reflections.forEach((r) => {
    const text = `${r.relationship} ${r.offering}`.toLowerCase();
    confidenceWords.forEach((word) => {
      if (text.includes(word)) confidenceScore += 1;
    });
    uncertainWords.forEach((word) => {
      if (text.includes(word)) confidenceScore -= 1;
    });
  });

  return confidenceScore / reflections.length;
}

// NEW: Helper function to calculate average rating
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
  // Simple trend analysis of recent vs older reflections
  const recent = reflections.slice(0, Math.floor(reflections.length / 2));
  const older = reflections.slice(Math.floor(reflections.length / 2));

  return {
    recentThemes: extractPatterns(recent),
    olderThemes: extractPatterns(older),
    shift: "evolution_in_progress",
  };
}

function generateQuickInsights(reflections) {
  const insights = [];

  if (reflections.length >= 3) {
    insights.push("Building a meaningful practice of self-reflection");
  }

  const premiumRatio =
    reflections.filter((r) => r.is_premium).length / reflections.length;
  if (premiumRatio > 0.5) {
    insights.push("Seeking deeper insights through premium reflections");
  }

  const tones = new Set(reflections.map((r) => r.tone));
  if (tones.size >= 2) {
    insights.push("Exploring different voices of reflection");
  }

  // ENHANCED: Add insights based on ratings
  const avgRating = calculateAverageRating(reflections);
  if (avgRating > 8) {
    insights.push("Finding deep resonance with your reflections");
  }

  const highlyRated = reflections.filter((r) => r.rating && r.rating >= 8);
  if (highlyRated.length >= 3) {
    insights.push("Consistently accessing deeper truth");
  }

  return insights;
}
