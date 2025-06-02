/*/* =========================================================================
   FILE: api/register.js      (Public endpoint → proxies to /api/admin-data)
   Updated: 2025‑06‑03 – use query‑param auth (bypasses Vercel auth strip)
   ========================================================================= */

   export default async function handler(req, res) {(req, res) {
    /*───────────────────────────────────────────────────────────
      CORS & Pre‑flight
    ───────────────────────────────────────────────────────────*/
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
  
    if (req.method !== "POST")
      return res.status(405).json({ success: false, error: "Method not allowed" });
  
    /*───────────────────────────────────────────────────────────
      Basic validation – name + email are required
    ───────────────────────────────────────────────────────────*/
    const { name, email, language = "en" } = req.body || {};
    if (!name || !email)
      return res.status(400).json({ success: false, error: "Name and email are required" });
  
    /*───────────────────────────────────────────────────────────
      Resolve the base URL that points back to *this* deployment
      – INTERNAL_BASE_URL      (manual override)
      – https://${VERCEL_URL}  (Vercel sets this at runtime)
      – req.headers.host       (works for most other hosts)
    ───────────────────────────────────────────────────────────*/
    const proto = (req.headers["x-forwarded-proto"] ?? "https").split(",")[0];
    const hostHeader = req.headers["x-forwarded-host"] ?? req.headers.host;
    const baseURL = process.env.INTERNAL_BASE_URL
      ?? (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
      ?? (hostHeader && `${proto}://${hostHeader}`)
      ?? "http://localhost:3000";
  
      const host = req.headers["x-forwarded-host"] || req.headers.host;
    const protocol = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
    const adminURL = `${protocol}://${host}/api/admin-data?key=${encodeURIComponent(process.env.CREATOR_SECRET_KEY || "")}`;
  
    try {
      /*─────────────────────────────────────────────────────────
        Forward the registration with the creator key (server‑side)
      ─────────────────────────────────────────────────────────*/
      const adminRes = await fetch(adminURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addRegistration",
          name,
          email,
          language,
          source: "website",
          timestamp: new Date().toISOString(),
        }),
      });
  
      /*─────────────────────────────────────────────────────────
        Handle JSON or non‑JSON responses gracefully
      ─────────────────────────────────────────────────────────*/
      let forwarded;
      const ct = adminRes.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        forwarded = await adminRes.json();
      } else {
        const text = await adminRes.text();
        throw new Error(`Upstream non‑JSON (${adminRes.status}): ${text.slice(0,120)}`);
      }
  
      if (!forwarded.success) throw new Error(forwarded.error || "Admin insert failed");
  
      return res.json({ success: true, message: "Registration recorded" });
    } catch (err) {
      console.error("Public register proxy error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
  