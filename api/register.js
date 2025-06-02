/* =========================================================================
   FILE: api/register.js          (NEW – public, no-auth endpoint)
   Purpose: accept a client-side registration, then forward it to
            /api/admin-data with the creator secret so that the entry
            appears in the admin panel.
   ========================================================================= */

export default async function handler(req, res) {
  // ── CORS pre-flight ────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST,OPTIONS" // only POST is allowed
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // ── Only POST is supported ────────────────────────────────────────────
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  // ── Basic validation ──────────────────────────────────────────────────
  const { name, email, language = "en" } = req.body || {};
  if (!name || !email) {
    return res
      .status(400)
      .json({ success: false, error: "Name and email are required" });
  }

  try {
    // ── Forward to the secured admin endpoint with the secret key ──────
    const adminRes = await fetch(
      `${
        process.env.INTERNAL_BASE_URL || "http://localhost:3000"
      }/api/admin-data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.CREATOR_SECRET_KEY, // server-side secret
        },
        body: JSON.stringify({
          action: "addRegistration",
          name,
          email,
          language,
          source: "website",
          timestamp: new Date().toISOString(),
        }),
      }
    );

    const result = await adminRes.json();
    if (!result.success) throw new Error(result.error || "Admin insert failed");

    // ── Success – bubble a minimal OK back to the browser ───────────────
    return res.json({ success: true, message: "Registration recorded" });
  } catch (err) {
    console.error("Public register proxy error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Registration failed – try again" });
  }
}
