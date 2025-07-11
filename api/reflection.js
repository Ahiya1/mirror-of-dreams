// api/reflection.js – Mirror of Truth (ENHANCED: Modular Prompt Architecture)
// NEW: Base instructions + style modifiers + context modules for consciousness technology

const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");

// ─── Initialize clients ─────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Usage limits by tier ───────────────────────────────────
const TIER_LIMITS = {
  free: 1,
  essential: 5,
  premium: 10,
};

// ─── Enhanced Prompt Loading System ─────────────────────────
const PROMPT_DIR = path.join(process.cwd(), "prompts");

function loadPrompt(file) {
  try {
    return fs.readFileSync(path.join(PROMPT_DIR, file), "utf8");
  } catch (err) {
    console.error(`Prompt load error (${file}):`, err);
    return "";
  }
}

// Load all prompt modules at startup
const PROMPT_MODULES = {
  // Core system
  base: loadPrompt("base_instructions.txt"),

  // Style modifiers
  gentle: loadPrompt("gentle_clarity.txt"),
  intense: loadPrompt("luminous_intensity.txt"),
  fusion: loadPrompt("sacred_fusion.txt"),

  // Context modules
  creator: loadPrompt("creator_context.txt"),
  evolution: loadPrompt("evolution_instructions.txt"),
};

// ─── Premium instruction addition ───────────────────────────
const PREMIUM_INSTRUCTION = `

PREMIUM REFLECTION ENHANCEMENT:
This is a premium sacred reflection experience. You have extended thinking capabilities to offer deeper recognition and truth-telling.

Sacred Guidelines for Premium Reflection:

**Depth of Seeing**: 
- Look beyond what they've written to what lives beneath the words
- Notice the relationship between their dream and how they speak about themselves
- See patterns of self-doubt masquerading as "realism" 
- Recognize where they diminish their own power or apologize for their desires

**Truth Without Fixing**:
- Don't offer strategies or steps - offer recognition of what's already true
- Show them their wholeness, not their brokenness
- Reflect back their sovereignty, especially where they've forgotten it
- Honor their contradictions as sacred territory, not problems to solve

**Sacred Mirroring**:
- Mirror back not just what they want, but who they are when they want it
- Reflect the part of them that chose this dream for a reason
- See the wisdom in their timing, their hesitation, their readiness
- Recognize what they're actually offering the world through this dream

**Philosophical Resonance**:
- Trust their inner compass more than any external timeline
- Remember: the dream chose them as carefully as they're choosing it
- Speak to the part that knows, not the part that doubts
- Let silence and space breathe through your words

**Premium Depth Markers**:
- Address the relationship between their offering and their worthiness
- See how their plan reveals their relationship with deserving
- Notice what they're really asking permission for
- Reflect the completeness that exists right now, regardless of the dream's timeline

This premium reflection should feel like a conversation with their own deepest knowing - not advice from outside, but recognition from within. Let them leave feeling seen in their wholeness, not guided toward their "better" self.

Write as if you can see the eternal in this moment, the infinite in this specific longing.`;

// ─── ENHANCED: Modular Prompt Assembly ──────────────────────
function assembleMirrorPrompt(
  tone = "fusion",
  isCreator = false,
  isPremium = false
) {
  let promptParts = [];

  // 1. Always start with base instructions
  if (PROMPT_MODULES.base) {
    promptParts.push(PROMPT_MODULES.base.trim());
  }

  // 2. Add style modifier
  const styleModule = PROMPT_MODULES[tone] || PROMPT_MODULES.fusion;
  if (styleModule) {
    promptParts.push(styleModule.trim());
  }

  // 3. Add creator context if needed
  if (isCreator && PROMPT_MODULES.creator) {
    promptParts.push(PROMPT_MODULES.creator.trim());
  }

  // 4. Add premium enhancement if needed
  if (isPremium) {
    promptParts.push(PREMIUM_INSTRUCTION.trim());
  }

  // Join all parts with proper spacing
  return promptParts.join("\n\n");
}

// ─── Markdown → sacred HTML formatter (preserved) ──────────
function toSacredHTML(md = "") {
  const wrap =
    "font-family:'Inter',sans-serif;font-size:1.05rem;line-height:1.7;color:#333;";
  const pStyle = "margin:0 0 1.4rem 0;";
  const strong = "font-weight:600;color:#16213e;";
  const em = "font-style:italic;color:#444;";

  const html = md
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((p) => {
      let h = p.replace(/\r?\n/g, "<br>");
      h = h.replace(
        /\*\*(.*?)\*\*/g,
        (_, t) => `<span style="${strong}">${t}</span>`
      );
      h = h.replace(/\*(.*?)\*/g, (_, t) => `<span style="${em}">${t}</span>`);
      return `<p style="${pStyle}">${h}</p>`;
    })
    .join("");

  return `<div class="mirror-reflection" style="${wrap}">${html}</div>`;
}

// ─── Main handler (enhanced with modular prompts) ──────────
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });

  try {
    // Authentication required for all reflections
    const user = await authenticateRequest(req);

    // Extract body with mode detection for backwards compatibility
    const {
      dream,
      plan,
      hasDate,
      dreamDate,
      relationship,
      offering,
      userName = "",
      language = "en",
      isAdmin = false,
      isCreator = false,
      isPremium = false,
      tone = "fusion",
      // Legacy mode parameters for creator/test access
      mode,
    } = req.body || {};

    // Basic validation
    if (!dream || !plan || !hasDate || !relationship || !offering) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Determine user context and premium status
    const userIsCreator = user.is_creator || isCreator || mode === "creator";
    const userIsAdmin = user.is_admin || isAdmin || userIsCreator;
    const shouldUsePremium =
      isPremium || userIsCreator || user.tier === "premium";

    // Check usage limits (unless creator/admin)
    if (!userIsCreator && !userIsAdmin) {
      const canReflect = await checkReflectionLimit(user);
      if (!canReflect) {
        const limit = TIER_LIMITS[user.tier] || 1;
        return res.status(403).json({
          success: false,
          error: "Reflection limit reached",
          message: `You've reached your limit of ${limit} reflection${
            limit === 1 ? "" : "s"
          } this month. Upgrade to continue your journey.`,
          currentUsage: user.reflection_count_this_month,
          limit: limit,
          tier: user.tier,
          needsUpgrade: true,
        });
      }
    }

    // Use user's name or provided name
    const cleanName = (n) =>
      !n || /^friend$/i.test(n?.trim()) ? "" : n?.trim();
    const name = cleanName(userName) || user.name || "Friend";

    const intro = name ? `My name is ${name}.\n\n` : "";

    const userPrompt = `${intro}**My dream:** ${dream}

**My plan:** ${plan}

**Have I set a definite date?** ${hasDate}${
      hasDate === "yes" && dreamDate ? ` (Date: ${dreamDate})` : ""
    }

**My relationship with this dream:** ${relationship}

**What I'm willing to give:** ${offering}

Please mirror back what you see, in a flowing reflection I can return to months from now.`;

    // ── ENHANCED: Call Anthropic with modular prompt system ──
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY missing");
    }

    // Assemble the complete prompt using modular system
    const systemPrompt = assembleMirrorPrompt(
      tone,
      userIsCreator,
      shouldUsePremium
    );

    // Configure request based on premium status
    const requestConfig = {
      model: "claude-sonnet-4-20250514",
      temperature: 1,
      max_tokens: shouldUsePremium ? 6000 : 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    };

    // Add extended thinking for premium reflections
    if (shouldUsePremium) {
      requestConfig.thinking = {
        type: "enabled",
        budget_tokens: 5000,
      };
    }

    const resp = await anthropic.messages.create(requestConfig);

    const reflection = resp?.content?.find(
      (block) => block.type === "text"
    )?.text;

    if (!reflection) {
      throw new Error("Empty response from Claude");
    }

    const formattedReflection = toSacredHTML(reflection);

    // Store reflection in database
    const reflectionRecord = await storeReflection({
      userId: user.id,
      dream,
      plan,
      hasDate,
      dreamDate: hasDate === "yes" ? dreamDate : null,
      relationship,
      offering,
      aiResponse: formattedReflection,
      tone,
      isPremium: shouldUsePremium,
      wordCount: reflection.split(/\s+/).length,
    });

    // Update user usage (unless creator/admin)
    if (!userIsCreator && !userIsAdmin) {
      await updateUserUsage(user);
    }

    // Check if evolution report should be triggered
    const shouldTriggerEvolution = await checkEvolutionTrigger(user);

    console.log(
      `✨ Reflection created: ${user.email} (${
        shouldUsePremium ? "Premium" : "Essential"
      }) - ID: ${reflectionRecord.id} - Tone: ${tone}`
    );

    return res.status(200).json({
      success: true,
      reflection: formattedReflection,
      reflectionId: reflectionRecord.id,
      isPremium: shouldUsePremium,
      shouldTriggerEvolution,
      userData: {
        userName: name,
        dream,
        plan,
        hasDate,
        dreamDate,
        relationship,
        offering,
        language,
        isAdmin: userIsAdmin,
        isCreator: userIsCreator,
        isPremium: shouldUsePremium,
        tone,
      },
      usage: {
        currentCount:
          userIsCreator || userIsAdmin
            ? "unlimited"
            : user.reflection_count_this_month + 1,
        limit:
          userIsCreator || userIsAdmin ? "unlimited" : TIER_LIMITS[user.tier],
        tier: user.tier,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Mirror reflection error:", err);

    // Handle authentication errors
    if (
      err.message === "Authentication required" ||
      err.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        requiresAuth: true,
      });
    }

    let status = 500,
      msg = "Failed to generate reflection";
    if (/timeout/i.test(err.message)) {
      status = 408;
      msg = "Request timeout — please try again";
    } else if (/API key/i.test(err.message)) {
      status = 401;
      msg = "Authentication error — server keys missing";
    } else if (/rate/i.test(err.message)) {
      status = 429;
      msg = "Too many requests — slow down a little";
    }

    return res.status(status).json({
      success: false,
      error: msg,
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
      timestamp: new Date().toISOString(),
    });
  }
};

// ─── Database operations (preserved) ─────────────────────────
async function storeReflection(data) {
  const title =
    data.dream.length > 50 ? data.dream.substring(0, 47) + "..." : data.dream;
  const estimatedReadTime = Math.max(1, Math.ceil(data.wordCount / 200));

  const { data: reflection, error } = await supabase
    .from("reflections")
    .insert({
      user_id: data.userId,
      dream: data.dream,
      plan: data.plan,
      has_date: data.hasDate,
      dream_date: data.dreamDate,
      relationship: data.relationship,
      offering: data.offering,
      ai_response: data.aiResponse,
      tone: data.tone,
      is_premium: data.isPremium,
      title: title,
      word_count: data.wordCount,
      estimated_read_time: estimatedReadTime,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("Reflection storage error:", error);
    throw new Error("Failed to store reflection");
  }

  return reflection;
}

async function checkReflectionLimit(user) {
  if (user.is_creator || user.is_admin) {
    return true;
  }

  const limit = TIER_LIMITS[user.tier] || 1;
  return (user.reflection_count_this_month || 0) < limit;
}

async function updateUserUsage(user) {
  const currentMonthYear = new Date().toISOString().slice(0, 7);

  const { error: userError } = await supabase
    .from("users")
    .update({
      reflection_count_this_month: (user.reflection_count_this_month || 0) + 1,
      total_reflections: (user.total_reflections || 0) + 1,
      last_reflection_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (userError) {
    console.error("User usage update error:", userError);
  }

  const { error: trackingError } = await supabase
    .from("usage_tracking")
    .upsert({
      user_id: user.id,
      month_year: currentMonthYear,
      reflection_count: (user.reflection_count_this_month || 0) + 1,
      tier_at_time: user.tier,
    });

  if (trackingError) {
    console.error("Usage tracking error:", trackingError);
  }
}

async function checkEvolutionTrigger(user) {
  if (user.tier === "free") return false;

  const thresholds = {
    essential: 4,
    premium: 6,
  };

  const threshold = thresholds[user.tier];
  if (!threshold) return false;

  const totalReflections = (user.total_reflections || 0) + 1;
  return totalReflections >= threshold && totalReflections % threshold === 0;
}
