// api/artifact.js - Sacred Artifact Generation API
// REVOLUTION: GPT-4o Analysis → Canvas Generation → R2 Upload → Database Storage

const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");
const { generateArtifact } = require("../lib/canvas-generators.js");
const { uploadArtifact } = require("../lib/cloudflare.js");

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sacred prompt for GPT-4o analysis
const ARTIFACT_ANALYSIS_PROMPT = `You are analyzing a sacred reflection for artistic visualization. You must respond with EXACTLY this JSON structure, no additional text:

{
  "selectedSentences": [exactly 3 powerful sentences from the AI reflection],
  "colorPalette": {
    "primary": "#hex_color",
    "secondary": "#hex_color", 
    "accent": "#hex_color",
    "background": "#hex_color"
  },
  "layout": "flowing",
  "mood": 8,
  "typography": "elegant"
}

ANALYSIS INSTRUCTIONS:
- Select 3 sentences from the AI reflection that will resonate most deeply with THIS specific person
- Choose sentences that capture their essence, address their doubts, or amplify their commitments
- Pick sentences that work well as standalone art (avoid references like "this" or "that")
- Consider how this person expresses themselves in their original responses

COLOR PALETTE GUIDELINES:
- FUSION tone: Warm golds (#F59E0B), ambers (#D97706), deep blues (#0F0F23)
- GENTLE tone: Soft whites (#FFFFFF), silvers (#E5E7EB), deep cosmic (#0F0F23) 
- INTENSE tone: Royal purples (#8B5CF6), electric violets (#A855F7), cosmic black (#0F0F23)
- Always include a dark background color for contrast

USER'S ORIGINAL RESPONSES:
Dream: "{dream}"
Plan: "{plan}"
Relationship with Dream: "{relationship}"
What They're Willing to Give: "{offering}"

AI REFLECTION CONTENT:
{aiResponse}

TONE: {tone}

Based on how this person thinks and expresses themselves, select 3 sentences that will create the most meaningful visual artifact for them.`;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    const { reflectionId } = req.body;

    if (!reflectionId) {
      return res.status(400).json({
        success: false,
        error: "Reflection ID is required",
      });
    }

    // Get reflection data
    const reflection = await getReflectionData(reflectionId, user.id);

    // Check if artifact already exists
    const existingArtifact = await checkExistingArtifact(reflectionId);
    if (existingArtifact) {
      return res.json({
        success: true,
        artifact: existingArtifact,
        message: "Artifact already exists for this reflection",
      });
    }

    // Create pending artifact record
    const artifactRecord = await createArtifactRecord(reflectionId, user.id);

    try {
      // Step 1: Analyze with GPT-4o
      console.log(`🧠 Analyzing reflection ${reflectionId} with GPT-4o...`);
      const analysis = await analyzeReflectionWithGPT4o(reflection);

      // Step 2: Generate canvas artwork
      console.log(`🎨 Generating ${analysis.tone} artwork...`);
      const canvas = await generateArtifact(analysis);

      // Step 3: Upload to Cloudflare R2
      console.log(`☁️ Uploading artifact to R2...`);
      const buffer = canvas.toBuffer("image/png");
      const fileName = `artifacts/${artifactRecord.id}.png`;
      const uploadResult = await uploadArtifact(buffer, fileName);

      // Step 4: Update database with final details
      const finalArtifact = await finalizeArtifactRecord(artifactRecord.id, {
        imageUrl: uploadResult.url,
        fileSize: uploadResult.size,
        analysis: analysis,
        uploadResult: uploadResult,
      });

      console.log(`✨ Artifact created successfully: ${finalArtifact.id}`);

      return res.json({
        success: true,
        artifact: finalArtifact,
        message: "Sacred artifact created successfully",
      });
    } catch (error) {
      // Mark artifact as failed
      await markArtifactFailed(artifactRecord.id, error.message);
      throw error;
    }
  } catch (error) {
    console.error("🔥 Artifact generation error:", error);

    // Handle authentication errors
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Handle specific errors
    let status = 500;
    let message = "Failed to generate artifact";

    if (error.message.includes("Reflection not found")) {
      status = 404;
      message = "Reflection not found or access denied";
    } else if (error.message.includes("GPT-4o")) {
      status = 503;
      message = "AI analysis service temporarily unavailable";
    } else if (error.message.includes("R2")) {
      status = 503;
      message = "Image storage service temporarily unavailable";
    }

    return res.status(status).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === "development" && {
        details: error.message,
      }),
    });
  }
};

// ═══════════════ DATABASE OPERATIONS ═══════════════

async function getReflectionData(reflectionId, userId) {
  const { data: reflection, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("id", reflectionId)
    .eq("user_id", userId)
    .single();

  if (error || !reflection) {
    throw new Error("Reflection not found or access denied");
  }

  return reflection;
}

async function checkExistingArtifact(reflectionId) {
  const { data: artifact } = await supabase
    .from("reflection_artifacts")
    .select("*")
    .eq("reflection_id", reflectionId)
    .eq("generation_status", "completed")
    .single();

  return artifact;
}

async function createArtifactRecord(reflectionId, userId) {
  const { data: artifact, error } = await supabase
    .from("reflection_artifacts")
    .insert({
      reflection_id: reflectionId,
      user_id: userId,
      generation_status: "pending",
      image_url: "", // Will update after generation
      selected_sentences: [],
      color_palette: {},
      style_config: {},
      tone: "fusion", // Default, will update
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create artifact record:", error);
    throw new Error("Failed to initialize artifact generation");
  }

  return artifact;
}

async function finalizeArtifactRecord(artifactId, data) {
  const { data: artifact, error } = await supabase
    .from("reflection_artifacts")
    .update({
      image_url: data.imageUrl,
      file_size: data.fileSize,
      selected_sentences: data.analysis.selectedSentences,
      color_palette: data.analysis.colorPalette,
      style_config: {
        layout: data.analysis.layout,
        mood: data.analysis.mood,
        typography: data.analysis.typography,
      },
      tone: data.analysis.tone,
      generation_status: "completed",
    })
    .eq("id", artifactId)
    .select()
    .single();

  if (error) {
    console.error("Failed to finalize artifact record:", error);
    throw new Error("Failed to save artifact details");
  }

  return artifact;
}

async function markArtifactFailed(artifactId, errorMessage) {
  await supabase
    .from("reflection_artifacts")
    .update({
      generation_status: "failed",
    })
    .eq("id", artifactId);
}

// ═══════════════ GPT-4O ANALYSIS ═══════════════

async function analyzeReflectionWithGPT4o(reflection) {
  try {
    // Prepare the prompt with reflection data
    const prompt = ARTIFACT_ANALYSIS_PROMPT.replace("{dream}", reflection.dream)
      .replace("{plan}", reflection.plan)
      .replace("{relationship}", reflection.relationship)
      .replace("{offering}", reflection.offering)
      .replace("{aiResponse}", stripHtml(reflection.ai_response))
      .replace("{tone}", reflection.tone);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a sacred art analyst who creates visual artifacts from spiritual reflections. You always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content;
    const analysis = JSON.parse(responseText);

    // Validate required fields
    if (
      !analysis.selectedSentences ||
      !Array.isArray(analysis.selectedSentences) ||
      analysis.selectedSentences.length !== 3
    ) {
      throw new Error("Invalid selectedSentences format");
    }

    if (
      !analysis.colorPalette ||
      !analysis.colorPalette.primary ||
      !analysis.colorPalette.background
    ) {
      throw new Error("Invalid colorPalette format");
    }

    // Add tone from reflection if not provided
    analysis.tone = reflection.tone;

    console.log(`🧠 GPT-4o analysis complete:`, {
      sentences: analysis.selectedSentences.length,
      tone: analysis.tone,
      primaryColor: analysis.colorPalette.primary,
    });

    return analysis;
  } catch (error) {
    console.error("GPT-4o analysis failed:", error);

    if (error.message.includes("JSON")) {
      throw new Error("GPT-4o returned invalid analysis format");
    }

    throw new Error(`GPT-4o analysis failed: ${error.message}`);
  }
}

// ═══════════════ UTILITIES ═══════════════

function stripHtml(html) {
  if (!html) return "";

  // Remove HTML tags but preserve line breaks
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// Development testing endpoint
if (process.env.NODE_ENV === "development") {
  module.exports.testAnalysis = analyzeReflectionWithGPT4o;
  module.exports.testCanvas = generateArtifact;
}
