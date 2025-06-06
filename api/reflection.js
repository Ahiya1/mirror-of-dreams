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
// Enhanced premium instruction for api/reflection.js
// Replace the existing PREMIUM_INSTRUCTION with this:

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
