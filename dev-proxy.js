const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

const BACKEND_TARGETS = {
  local: "http://localhost:3000",
  vercel: "https://mirror-of-truth-online.vercel.app",
  railway: "https://mirror-of-truth-backend-production.up.railway.app",
};

const BACKEND_TARGET = BACKEND_TARGETS[process.env.BACKEND_MODE || "local"];

// Check if React build exists
const REACT_BUILD_DIR = path.join(__dirname, "dist");
const hasReactBuild = fs.existsSync(REACT_BUILD_DIR);

console.log(`🔄 Proxying API calls to: ${BACKEND_TARGET}`);
console.log(`📁 Serving static files from: public/`);
console.log(`⚛️  React build available: ${hasReactBuild ? "Yes" : "No"}`);
console.log(`🌐 Development server starting on: http://localhost:${PORT}`);

// Request logging middleware
app.use((req, res, next) => {
  const isAPI = req.url.startsWith("/api");
  const isReflection = req.url.startsWith("/reflection");
  const isDashboard = req.url.startsWith("/dashboard");
  const isAuth = req.url.startsWith("/auth");
  const isPortal = req.url === "/" || req.url === "/portal";
  const emoji = isAPI
    ? "🔀"
    : isReflection
    ? "🪞"
    : isDashboard
    ? "📊"
    : isAuth
    ? "🔐"
    : isPortal
    ? "🌟"
    : "📁";
  console.log(`${emoji} ${req.method} ${req.url}`);
  next();
});

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MANUAL PROXY for /api routes
app.use("/api", async (req, res) => {
  try {
    const fullPath = "/api" + req.url;
    console.log(
      `🔀 Manual proxy: ${req.method} ${fullPath} -> ${BACKEND_TARGET}${fullPath}`
    );

    const fetchOptions = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
        ...(req.headers["user-agent"] && {
          "User-Agent": req.headers["user-agent"],
        }),
      },
    };

    if (req.method === "POST" || req.method === "PUT") {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(`${BACKEND_TARGET}${fullPath}`, fetchOptions);
    const data = await response.text();

    console.log(
      `📥 Backend response: ${response.status} ${response.statusText}`
    );

    res.status(response.status);

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

// REACT ROUTES - Enhanced with reflection support
const serveReactApp = (req, res) => {
  if (hasReactBuild) {
    const filePath = path.join(REACT_BUILD_DIR, "index.html");
    if (fs.existsSync(filePath)) {
      console.log(`⚛️  Serving React: index.html`);
      res.sendFile(filePath);
    } else {
      console.log(`⚠️  React file not found, falling back to static`);
      fallbackToStatic(req, res);
    }
  } else {
    console.log(`⚠️  No React build, serving static for: ${req.url}`);
    fallbackToStatic(req, res);
  }
};

const fallbackToStatic = (req, res) => {
  const url = req.url;
  let staticFile;

  if (url === "/" || url === "/portal") {
    staticFile = "portal/index.html";
  } else if (url.includes("dashboard")) {
    staticFile = "dashboard/index.html";
  } else if (
    url.includes("auth") ||
    url.includes("signin") ||
    url.includes("signup")
  ) {
    staticFile = "auth/signin.html";
  } else if (url.includes("reflection")) {
    // Fallback for reflection routes - prefer React but fallback to mirror HTML
    staticFile = "mirror/questionnaire.html";
  } else {
    staticFile = "portal/index.html";
  }

  const fullPath = path.join(__dirname, "public", staticFile);
  console.log(`📁 Fallback static: ${staticFile}`);
  res.sendFile(fullPath);
};

// PORTAL ROUTES - Serve React app for portal
app.get("/", serveReactApp);
app.get("/portal", serveReactApp);

// AUTH ROUTES - Serve React app for all auth pages
app.get("/auth", serveReactApp);
app.get("/auth/", serveReactApp);
app.get("/auth/signin", serveReactApp);
app.get("/auth/signup", serveReactApp);
app.get("/auth/register", serveReactApp);

// REFLECTION ROUTES - All reflection routes serve the React app
app.get("/reflection", serveReactApp);
app.get("/reflection/", serveReactApp);
app.get("/reflection/output", serveReactApp);

// DASHBOARD ROUTES - Serve React app for dashboard
app.get("/dashboard", serveReactApp);

// Legacy redirects for old routes
app.get("/register", (req, res) => {
  res.redirect(301, "/auth/register");
});
app.get("/signin", (req, res) => {
  res.redirect(301, "/auth/signin");
});
app.get("/signup", (req, res) => {
  res.redirect(301, "/auth/signup");
});

// Legacy mirror redirects to reflection
app.get("/mirror", (req, res) => {
  res.redirect(301, "/reflection");
});
app.get("/mirror/questionnaire", (req, res) => {
  res.redirect(301, "/reflection");
});
app.get("/mirror/output", (req, res) => {
  const query = req.url.includes("?") ? req.url.split("?")[1] : "";
  const newUrl = query ? `/reflection/output?${query}` : "/reflection/output";
  res.redirect(301, newUrl);
});

// Test route for development
app.get("/test-proxy", (req, res) => {
  res.json({
    message: "Proxy server is working",
    backend: BACKEND_TARGET,
    reactBuild: hasReactBuild,
    timestamp: new Date().toISOString(),
    routes: {
      portal: "React (/)",
      auth: "React (/auth/*)",
      reflection: "React (/reflection/*)",
      dashboard: "React (/dashboard)",
      static: "Static HTML (others)",
    },
  });
});

// STATIC ROUTES - Remaining routes serve static HTML
const serveHtml = (htmlPath) => (req, res) => {
  const fullPath = path.join(__dirname, "public", htmlPath);
  console.log(`📄 Serving static: ${htmlPath}`);
  res.sendFile(fullPath);
};

// Static HTML routes (non-React pages)
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

// Serve React build assets if available
if (hasReactBuild) {
  app.use(
    "/assets",
    express.static(path.join(REACT_BUILD_DIR, "assets"), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        } else if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript");
        }
      },
    })
  );

  // Serve assets from all React app paths
  const reactPaths = ["/", "/portal", "/reflection", "/dashboard", "/auth"];
  reactPaths.forEach((basePath) => {
    app.use(
      `${basePath}/assets`,
      express.static(path.join(REACT_BUILD_DIR, "assets"), {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".css")) {
            res.setHeader("Content-Type", "text/css");
          } else if (filePath.endsWith(".js")) {
            res.setHeader("Content-Type", "application/javascript");
          }
        },
      })
    );
  });

  console.log(`📦 Serving React assets from: ${REACT_BUILD_DIR}/assets`);
}

// Serve static files from public directory LAST
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
  console.log(`\n⚛️  React Experience:`);
  console.log(`   http://localhost:${PORT}/ (Portal - React)`);
  console.log(`   http://localhost:${PORT}/portal (Portal - React)`);
  console.log(`   http://localhost:${PORT}/auth/signin (Auth - React)`);
  console.log(`   http://localhost:${PORT}/auth/signup (Auth - React)`);
  console.log(`   http://localhost:${PORT}/reflection (Reflection - React)`);
  console.log(`   http://localhost:${PORT}/reflection/output (Output - React)`);
  console.log(`   http://localhost:${PORT}/dashboard (Dashboard - React)`);
  console.log(`\n📄 Static HTML (Remaining):`);
  console.log(`   http://localhost:${PORT}/about (About page)`);
  console.log(`   http://localhost:${PORT}/subscription (Subscription)`);
  console.log(`   http://localhost:${PORT}/examples (Examples)`);
  console.log(`\n🔄 Legacy Redirects:`);
  console.log(`   /mirror/* → /reflection/*`);
  console.log(`   /register → /auth/register`);
  console.log(`   /signin → /auth/signin`);
  console.log(`\n💡 Commands:`);
  console.log(`   npm run dev                  (this server - static + React)`);
  console.log(`   npm run dev:react           (React dev server on :3002)`);
  console.log(`   npm run build               (build React for production)`);
  console.log(`\n🌐 Visit: http://localhost:${PORT}`);
  console.log(`🪞 Reflection experience now served via React!\n`);
});

module.exports = app;
