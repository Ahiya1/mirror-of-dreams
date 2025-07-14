// api/evolution.js - Mirror of Truth Evolution Analytics & Growth Reports
// SIMPLIFIED: Only text analysis + themes, proper limits, date awareness

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

// Evolution report thresholds - every N reflections (not accumulating)
const REPORT_THRESHOLDS = {
  essential: 4, // Every 4 reflections
  premium: 6, // Every 6 reflections
};

// Load simplified prompt system
const PROMPT_DIR = path.join(process.cwd(), "prompts");

function loadPrompt(file) {
  try {
    return fs.readFileSync(path.join(PROMPT_DIR, file), "utf8");
  } catch (err) {
    console.error(`Prompt load error (${file}):`, err);
    return "";
  }
}

// Load prompt components
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

// Simplified prompt combination
function buildEvolutionPrompt(
  tone = "fusion",
  isCreator = false,
  isPremium = false
) {
  let systemPrompt = PROMPT_SYSTEM.base.trim();
  systemPrompt += "\n\n" + PROMPT_SYSTEM.evolution.trim();

  const stylePrompt = PROMPT_SYSTEM.styles[tone] || PROMPT_SYSTEM.styles.fusion;
  systemPrompt += "\n\n" + stylePrompt.trim();

  if (isCreator) {
    systemPrompt += "\n\n" + PROMPT_SYSTEM.creator.trim();
  }

  if (isPremium) {
    systemPrompt += "\n\n" + PREMIUM_EVOLUTION_ENHANCEMENT.trim();
  }

  return systemPrompt;
}

// Simplified premium enhancement
const PREMIUM_EVOLUTION_ENHANCEMENT = `
PREMIUM EVOLUTION ANALYSIS:
You have extended thinking capabilities to provide deeper consciousness evolution recognition.

Focus on:
- Deeper pattern recognition across time
- More nuanced language evolution tracking
- Subtle identity shifts and consciousness development
- Integration of previous resistances and growth

Write with greater depth and sophistication while maintaining the same essential recognition approach.
`;

module.exports = async function handler(req, res) {
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

// Generate simplified evolution report
async function handleGenerateReport(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { tone = "fusion" } = req.body || {};

    if (user.tier === "free") {
      return res.status(403).json({
        success: false,
        error:
          "Evolution reports are available for Essential and Premium subscribers",
      });
    }

    // Check if user can generate a report
    const canGenerate = await checkCanGenerateReport(user);
    if (!canGenerate.eligible) {
      return res.status(400).json({
        success: false,
        error: canGenerate.reason,
        needed: canGenerate.needed,
      });
    }

    // Get user's reflections for analysis
    const { data: reflections, error } = await supabase
      .from("reflections")
      .select("id, dream, relationship, offering, created_at, tone, is_premium")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !reflections.length) {
      return res.status(400).json({
        success: false,
        error: "No reflections available for analysis",
      });
    }

    // Select most recent N reflections based on tier
    const threshold = REPORT_THRESHOLDS[user.tier];
    const analysisReflections = reflections.slice(0, threshold);

    // Generate simplified evolution analysis
    const analysis = await generateSimplifiedEvolutionAnalysis(
      analysisReflections,
      user.tier,
      tone,
      user.isCreator
    );

    // Extract simple themes
    const themes = extractSimpleThemes(analysisReflections);

    // Save evolution report
    const { data: report, error: reportError } = await supabase
      .from("evolution_reports")
      .insert({
        user_id: user.id,
        analysis: analysis,
        insights: { themes }, // Simplified - only themes
        report_type: user.tier,
        reflections_analyzed: analysisReflections.map((r) => r.id),
        reflection_count: analysisReflections.length,
        time_period_start:
          analysisReflections[analysisReflections.length - 1].created_at,
        time_period_end: analysisReflections[0].created_at,
        patterns_detected: themes, // Simplified
        growth_score: null, // Removed growth score
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
      `🦋 Evolution report generated for ${user.email} (${user.tier})`
    );

    return res.json({
      success: true,
      message: "Evolution report generated successfully",
      report: {
        id: report.id,
        analysis: report.analysis,
        themes: themes,
        reportType: report.report_type,
        reflectionCount: report.reflection_count,
        timePeriod: {
          start: report.time_period_start,
          end: report.time_period_end,
        },
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

// Check if user can generate a report (every N reflections)
async function checkCanGenerateReport(user) {
  const threshold = REPORT_THRESHOLDS[user.tier];
  if (!threshold) {
    return { eligible: false, reason: "Invalid tier" };
  }

  // Count total reflections
  const { count: totalReflections, error } = await supabase
    .from("reflections")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    return { eligible: false, reason: "Error checking reflections" };
  }

  // Check how many reports have been generated
  const { count: reportCount, error: reportError } = await supabase
    .from("evolution_reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (reportError) {
    return { eligible: false, reason: "Error checking reports" };
  }

  // Calculate if eligible: total reflections should be >= (reports + 1) * threshold
  const nextReportAt = (reportCount + 1) * threshold;
  const eligible = totalReflections >= nextReportAt;

  return {
    eligible,
    reason: eligible
      ? null
      : `Need ${nextReportAt - totalReflections} more reflections`,
    needed: eligible ? 0 : nextReportAt - totalReflections,
    totalReflections,
    reportCount,
    nextReportAt,
  };
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
      themes: report.patterns_detected || [],
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
        themes: report.patterns_detected || [],
        reportType: report.report_type,
        reflectionCount: report.reflection_count,
        reflectionsAnalyzed: report.reflections_analyzed,
        timePeriod: {
          start: report.time_period_start,
          end: report.time_period_end,
        },
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

    const canGenerate = await checkCanGenerateReport(user);

    return res.json({
      success: true,
      eligible: canGenerate.eligible,
      reason: canGenerate.reason,
      currentReflections: canGenerate.totalReflections,
      requiredReflections: canGenerate.nextReportAt,
      needed: canGenerate.needed,
      tier: user.tier,
      reportCount: canGenerate.reportCount,
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

// Simplified evolution analysis
async function generateSimplifiedEvolutionAnalysis(
  reflections,
  tier,
  tone = "fusion",
  isCreator = false
) {
  // Build reflection context with dates
  const reflectionContext = reflections
    .map((r, index) => {
      const date = new Date(r.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let context = `Reflection ${index + 1} (${date}):\n`;
      context += `Dream: ${r.dream}\n`;
      context += `Relationship: ${r.relationship}\n`;
      context += `Offering: ${r.offering}`;
      return context;
    })
    .join("\n\n");

  const systemPrompt = buildEvolutionPrompt(
    tone,
    isCreator,
    tier === "premium"
  );

  // Add specific instruction for simplified analysis
  const analysisPrompt = `${systemPrompt}

SIMPLIFIED EVOLUTION ANALYSIS:
Analyze the consciousness evolution in these reflections with focus on:
1. Core patterns in how they relate to their dreams and capabilities
2. Language evolution from permission-seeking to authority-claiming
3. Identity shifts and growing self-recognition
4. Key themes that emerge across their journey

Provide a flowing, insightful analysis without complex metrics or scores. Focus on the human story of becoming.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: tier === "premium" ? 4000 : 3000,
      temperature: 1,
      system: analysisPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze the consciousness evolution in these reflections:\n\n${reflectionContext}`,
        },
      ],
      ...(tier === "premium" && {
        thinking: {
          type: "enabled",
          budget_tokens: 2000,
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

// Extract simple themes
function extractSimpleThemes(reflections) {
  const themes = [];
  const dreamTexts = reflections
    .map((r) => `${r.dream} ${r.relationship}`.toLowerCase())
    .join(" ");

  // Simple theme detection
  if (
    dreamTexts.includes("business") ||
    dreamTexts.includes("entrepreneur") ||
    dreamTexts.includes("company")
  ) {
    themes.push("Entrepreneurial Vision");
  }
  if (
    dreamTexts.includes("creative") ||
    dreamTexts.includes("art") ||
    dreamTexts.includes("write") ||
    dreamTexts.includes("create")
  ) {
    themes.push("Creative Expression");
  }
  if (
    dreamTexts.includes("help") ||
    dreamTexts.includes("serve") ||
    dreamTexts.includes("impact")
  ) {
    themes.push("Service & Impact");
  }
  if (
    dreamTexts.includes("relationship") ||
    dreamTexts.includes("love") ||
    dreamTexts.includes("family")
  ) {
    themes.push("Connection & Love");
  }
  if (
    dreamTexts.includes("freedom") ||
    dreamTexts.includes("independent") ||
    dreamTexts.includes("own")
  ) {
    themes.push("Freedom & Independence");
  }
  if (
    dreamTexts.includes("learn") ||
    dreamTexts.includes("grow") ||
    dreamTexts.includes("develop")
  ) {
    themes.push("Growth & Learning");
  }

  return themes.length > 0 ? themes : ["Personal Development"];
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
