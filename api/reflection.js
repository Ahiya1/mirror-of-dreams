// api/reflection.js  – Mirror of Truth (multi-tone, creator-aware, premium thinking)
// ---------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

// ─── Anthropic client ───────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Load prompt files synchronously at cold-start ──────────────
const PROMPT_DIR = path.join(process.cwd(), "prompts");

function loadPrompt(file) {
  try {
    return fs.readFileSync(path.join(PROMPT_DIR, file), "utf8");
  } catch (err) {
    console.error(`Prompt load error (${file}):`, err);
    return "";
  }
}

const PROMPTS = {
  gentle: loadPrompt("gentle_clarity.txt"),
  intense: loadPrompt("luminous_intensity.txt"),
  fusion: loadPrompt("sacred_fusion.txt"),
};
const CREATOR_CTX = loadPrompt("creator_context.txt");

// ─── Premium instruction addition ───────────────────────────────
const PREMIUM_INSTRUCTION = `

PREMIUM REFLECTION ENHANCEMENT:
This is a premium reflection experience. You have extended thinking capabilities to provide deeper, more nuanced insights. Please:

1. Take time to deeply analyze what the user has written, looking for subtle patterns, hidden meanings, and unspoken truths
2. Consider the philosophical and psychological dimensions of their responses 
3. Reflect on the relationship between their dream, plan, timeline, current relationship, and offering - what does this constellation reveal?
4. Pay special attention to their language choices, what they emphasize vs. what they minimize
5. Look for signs of their authentic power and where they might be dimming themselves
6. Consider what their dream represents beyond the surface level - what is it really asking of them?
7. Provide insights that go beyond encouragement to true mirror-work - showing them something they couldn't see themselves

This premium reflection should feel notably more insightful, personally accurate, and transformative than a standard reflection. You are working with the full depth of your capabilities.`;

// ─── Prompt utilities ───────────────────────────────────────────
function withCreatorContext(base, ctx) {
  return `${base.trim()}\n\n${ctx.trim()}`;
}

function withPremiumEnhancement(base, isPremium) {
  return isPremium ? `${base.trim()}\n\n${PREMIUM_INSTRUCTION.trim()}` : base;
}

function getMirrorPrompt(
  tone = "fusion",
  isCreator = false,
  isPremium = false
) {
  let base = PROMPTS[tone] || PROMPTS.fusion;

  // Add creator context if needed
  if (isCreator) {
    base = withCreatorContext(base, CREATOR_CTX);
  }

  // Add premium enhancement if needed
  if (isPremium) {
    base = withPremiumEnhancement(base, true);
  }

  return base;
}

// ─── Markdown → sacred HTML formatter (unchanged) ───────────────
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

// ─── Helpers ────────────────────────────────────────────────────
const cleanName = (n) => (!n || /^friend$/i.test(n.trim()) ? "" : n.trim());

// ─── Vercel/Node handler ────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });

  // ── Extract body ──────────────────────────────────────────────
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
  } = req.body || {};

  // Basic validation
  if (!dream || !plan || !hasDate || !relationship || !offering) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields" });
  }

  // Creator reflections are always premium
  const shouldUsePremium = isPremium || isCreator;

  const name = cleanName(userName);
  const intro = name ? `My name is ${name}.\n\n` : "";

  const userPrompt = `${intro}**My dream:** ${dream}

**My plan:** ${plan}

**Have I set a definite date?** ${hasDate}${
    hasDate === "yes" && dreamDate ? ` (Date: ${dreamDate})` : ""
  }

**My relationship with this dream:** ${relationship}

**What I'm willing to give:** ${offering}

Please mirror back what you see, in a flowing reflection I can return to months from now.`;

  // ── Call Anthropic with premium thinking if needed ──────────────
  try {
    if (!process.env.ANTHROPIC_API_KEY)
      throw new Error("ANTHROPIC_API_KEY missing");

    const systemPrompt = getMirrorPrompt(tone, isCreator, shouldUsePremium);

    // Configure request based on premium status
    const requestConfig = {
      model: "claude-sonnet-4-20250514",
      temperature: 0.8,
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
    if (!reflection) throw new Error("Empty response from Claude");

    // Log thinking summary if available (for debugging)
    const thinkingBlock = resp?.content?.find(
      (block) => block.type === "thinking"
    );
    if (thinkingBlock && process.env.NODE_ENV === "development") {
      console.log(
        "Premium thinking applied:",
        thinkingBlock.thinking?.substring(0, 200) + "..."
      );
    }

    return res.status(200).json({
      success: true,
      reflection: toSacredHTML(reflection),
      isPremium: shouldUsePremium,
      userData: {
        userName: name,
        dream,
        plan,
        hasDate,
        dreamDate,
        relationship,
        offering,
        language,
        isAdmin,
        isCreator,
        isPremium: shouldUsePremium,
        tone,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Mirror reflection error:", err);
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
