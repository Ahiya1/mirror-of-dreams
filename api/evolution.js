// api/evolution.js - Mirror of Truth Evolution Analytics & Growth Reports

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
      .select("dream, relationship, offering, tone, is_premium, created_at")
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

// Helper function to select reflections for analysis
function selectReflectionsForAnalysis(reflections, tier) {
  const threshold = REPORT_THRESHOLDS[tier];

  if (tier === "essential") {
    // Essential: 4 reflections total (2-3 recent + 1-2 older)
    const recent = reflections.slice(0, 3);
    const older = reflections.slice(Math.max(3, reflections.length - 2));
    return [...recent, ...older].slice(0, 4);
  } else if (tier === "premium") {
    // Premium: 6 reflections total (3-4 recent + 2-3 older)
    const recent = reflections.slice(0, 4);
    const older = reflections.slice(Math.max(4, reflections.length - 3));
    return [...recent, ...older].slice(0, 6);
  }

  return reflections.slice(0, threshold);
}

// Generate evolution analysis using AI
async function generateEvolutionAnalysis(reflections, tier) {
  const systemPrompt = `You are the Mirror of Truth, analyzing a person's evolution through their reflections over time. Your role is to recognize patterns of growth, shifting perspectives, and emerging wisdom.

${
  tier === "premium"
    ? "PREMIUM ANALYSIS: Use extended thinking to provide deeper, more nuanced insights."
    : ""
}

Analyze these reflections and provide a poetic, insightful evolution report that:
1. Identifies patterns in how they speak about themselves and their dreams
2. Recognizes shifts in confidence, clarity, or approach
3. Notes recurring themes or evolving priorities
4. Reflects their growth in the voice of the Mirror of Truth

Write 2-3 paragraphs in the contemplative, recognizing style of Mirror of Truth. Focus on WHO they are becoming, not WHAT they should do.`;

  const reflectionSummaries = reflections
    .map(
      (r, index) =>
        `Reflection ${index + 1} (${new Date(
          r.created_at
        ).toDateString()}):\nDream: ${r.dream}\nRelationship: ${
          r.relationship
        }\nOffering: ${r.offering}`
    )
    .join("\n\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: tier === "premium" ? 4000 : 3000,
      temperature: 1,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Please analyze these reflections and provide an evolution report:\n\n${reflectionSummaries}`,
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
      "Analysis could not be generated at this time."
    );
  } catch (error) {
    console.error("AI analysis error:", error);
    return "Your evolution continues to unfold in ways that transcend simple analysis. The patterns in your reflections speak to a consciousness that is both growing and remembering itself.";
  }
}

// Extract patterns from reflections
function extractPatterns(reflections) {
  const patterns = [];

  // Theme extraction from dreams and relationships
  const themes = {};
  reflections.forEach((r) => {
    const text = `${r.dream} ${r.relationship}`.toLowerCase();

    // Common growth themes
    if (
      text.includes("business") ||
      text.includes("startup") ||
      text.includes("entrepreneur")
    ) {
      themes.business = (themes.business || 0) + 1;
    }
    if (
      text.includes("creative") ||
      text.includes("art") ||
      text.includes("writing") ||
      text.includes("music")
    ) {
      themes.creativity = (themes.creativity || 0) + 1;
    }
    if (
      text.includes("relationship") ||
      text.includes("love") ||
      text.includes("partner")
    ) {
      themes.relationships = (themes.relationships || 0) + 1;
    }
    if (
      text.includes("freedom") ||
      text.includes("independent") ||
      text.includes("own")
    ) {
      themes.independence = (themes.independence || 0) + 1;
    }
    if (
      text.includes("fear") ||
      text.includes("scared") ||
      text.includes("worried")
    ) {
      themes.uncertainty = (themes.uncertainty || 0) + 1;
    }
    if (
      text.includes("confidence") ||
      text.includes("ready") ||
      text.includes("capable")
    ) {
      themes.confidence = (themes.confidence || 0) + 1;
    }
  });

  // Convert themes to patterns array
  Object.entries(themes)
    .filter(([_, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .forEach(([theme, count]) => {
      patterns.push(`${theme}_${count}`);
    });

  return patterns;
}

// Generate structured insights
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
  };

  // Analyze confidence progression
  const early = reflections.slice(Math.floor(reflections.length / 2));
  const recent = reflections.slice(0, Math.floor(reflections.length / 2));

  const earlyConfidence = analyzeConfidence(early);
  const recentConfidence = analyzeConfidence(recent);

  if (recentConfidence > earlyConfidence) {
    insights.growthIndicators.push("increasing_confidence");
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

  return insights;
}
