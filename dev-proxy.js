const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

const BACKEND_TARGETS = {
  local: "http://localhost:3000",
  vercel: "https://mirror-of-truth-online.vercel.app",
  railway: "https://mirror-of-truth-backend-production.up.railway.app",
};

const BACKEND_TARGET = BACKEND_TARGETS[process.env.BACKEND_MODE || "local"];

console.log(`🔄 Proxying API calls to: ${BACKEND_TARGET}`);
console.log(`📁 Serving static files from: public/`);
console.log(`🌐 Development server starting on: http://localhost:${PORT}`);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SIMPLE MANUAL PROXY for /api routes (instead of http-proxy-middleware)
app.use("/api", async (req, res) => {
  try {
    // IMPORTANT: req.url is the path AFTER /api, so we need to add /api back
    const fullPath = "/api" + req.url;
    console.log(
      `🔀 Manual proxy: ${req.method} ${fullPath} -> ${BACKEND_TARGET}${fullPath}`
    );

    // Prepare the fetch request with CLEAN headers (this is the fix!)
    const fetchOptions = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Only copy specific safe headers, not all headers
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
        ...(req.headers["user-agent"] && {
          "User-Agent": req.headers["user-agent"],
        }),
      },
    };

    // Add body for POST/PUT requests
    if (req.method === "POST" || req.method === "PUT") {
      fetchOptions.body = JSON.stringify(req.body);
      console.log(`📤 Sending body:`, req.body);
      console.log(`📤 Stringified body:`, fetchOptions.body);
    }

    // Make the request to backend WITH the full /api path
    const response = await fetch(`${BACKEND_TARGET}${fullPath}`, fetchOptions);
    const data = await response.text();

    console.log(
      `📥 Backend response: ${response.status} ${response.statusText}`
    );
    console.log(`📥 Response data:`, data.substring(0, 200));

    // Forward the response
    res.status(response.status);

    // Copy response headers (be selective)
    response.headers.forEach((value, key) => {
      if (
        ![
          "content-length",
          "transfer-encoding",
          "connection",
          "upgrade",
        ].includes(key.toLowerCase())
      ) {
        res.set(key, value);
      }
    });

    // Send the response data
    res.send(data);
  } catch (error) {
    console.error("❌ Manual proxy error:", error.message);
    res.status(500).json({
      error: "Backend proxy error",
      details: error.message,
      target: BACKEND_TARGET,
    });
  }
});

// Test route
app.get("/test-proxy", (req, res) => {
  res.json({
    message: "Proxy server is working",
    backend: BACKEND_TARGET,
    timestamp: new Date().toISOString(),
  });
});

// HTML route handler
const serveHtml = (htmlPath) => (req, res) => {
  const fullPath = path.join(__dirname, "public", htmlPath);
  console.log(`📄 Serving: ${htmlPath}`);
  res.sendFile(fullPath);
};

// HTML routes
app.get("/", serveHtml("portal/index.html"));
app.get("/portal", serveHtml("portal/index.html"));
app.get("/auth", serveHtml("auth/signin.html"));
app.get("/auth/signin", serveHtml("auth/signin.html"));
app.get("/mirror/questionnaire", serveHtml("mirror/questionnaire.html"));
app.get("/mirror/output", serveHtml("mirror/output.html"));
app.get("/dashboard", serveHtml("dashboard/index.html"));
app.get("/reflections/history", serveHtml("reflections/history.html"));
app.get("/reflections/view", serveHtml("reflections/view.html"));
app.get("/subscription", serveHtml("subscription/index.html"));
app.get("/creator", serveHtml("creator/index.html"));
app.get("/stewardship", serveHtml("stewardship/admin.html"));
app.get("/about", serveHtml("about/index.html"));
app.get("/commitment", serveHtml("commitment/index.html"));
app.get("/commitment/register", serveHtml("commitment/register.html"));
app.get("/evolution/reports", serveHtml("evolution/reports.html"));
app.get("/gifting", serveHtml("gifting/index.html"));
app.get("/profile", serveHtml("profile/index.html"));
app.get("/examples", serveHtml("examples/index.html"));
app.get("/transition/breathing", serveHtml("transition/breathing.html"));

// Static files LAST
app.use(
  express.static(path.join(__dirname, "public"), {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html");
      }
    },
  })
);

app.listen(PORT, () => {
  console.log(`\n✨ Mirror of Truth Development Server`);
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`🔗 Backend target: ${BACKEND_TARGET}`);
  console.log(`\n🧪 Test endpoints:`);
  console.log(`   http://localhost:${PORT}/test-proxy (proxy test)`);
  console.log(`   http://localhost:3000/health (backend health - direct)`);
  console.log(
    `   http://localhost:${PORT}/api/health (backend health - via proxy)`
  );
  console.log(`\n💡 To change backend target:`);
  console.log(
    `   npm run dev                           (local backend - default)`
  );
  console.log(`   BACKEND_MODE=vercel npm run dev       (deployed Vercel)`);
  console.log(`   BACKEND_MODE=railway npm run dev      (Railway backend)`);
  console.log(`\n🌐 Visit: http://localhost:${PORT}`);
  console.log(`📊 Static files served from: public/\n`);
});

module.exports = app;
