// src/main.jsx - Updated with reflection routing

import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Portal from "./components/portal/Portal";
import MirrorApp from "./components/mirror/MirrorApp";
import Dashboard from "./components/dashboard/Dashboard";
import AuthApp from "./components/auth/AuthApp";
import "./styles/portal.css";
import "./styles/mirror.css";
import "./styles/dashboard.css";
import "./styles/auth.css";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Portal routes - Main landing page */}
        <Route path="/" element={<Portal />} />
        <Route path="/portal" element={<Portal />} />

        {/* Auth routes */}
        <Route path="/auth" element={<AuthApp />} />
        <Route path="/auth/signin" element={<AuthApp />} />
        <Route path="/auth/signup" element={<AuthApp />} />
        <Route path="/auth/register" element={<AuthApp />} />

        {/* Reflection routes (renamed from mirror) */}
        <Route path="/reflection" element={<MirrorApp />} />
        <Route path="/reflection/output" element={<MirrorApp />} />

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Redirect old auth routes */}
        <Route
          path="/register"
          element={<Navigate to="/auth/register" replace />}
        />
        <Route
          path="/signin"
          element={<Navigate to="/auth/signin" replace />}
        />
        <Route
          path="/signup"
          element={<Navigate to="/auth/signup" replace />}
        />

        {/* Redirect legacy mirror routes to reflection */}
        <Route path="/mirror" element={<Navigate to="/reflection" replace />} />
        <Route
          path="/mirror/questionnaire"
          element={<Navigate to="/reflection" replace />}
        />
        <Route
          path="/mirror/output"
          element={<Navigate to="/reflection/output" replace />}
        />
      </Routes>
    </Router>
  );
};

// Initialize React app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Debug info for development
if (window.location.hostname === "localhost") {
  console.log("🪞 Mirror of Truth - React App Initialized");
  console.log("📍 Available routes:");
  console.log("   / (Portal)");
  console.log("   /auth/* (Authentication)");
  console.log("   /reflection (Reflection Questionnaire)");
  console.log("   /reflection/output (Reflection Output)");
  console.log("   /dashboard (Dashboard)");
  console.log("🔄 Legacy redirects:");
  console.log("   /mirror/* → /reflection/*");

  // Expose debug utilities
  window.mirrorDebug = {
    currentRoute: window.location.pathname,
    isPortal:
      window.location.pathname === "/" ||
      window.location.pathname === "/portal",
    isDashboard: window.location.pathname === "/dashboard",
    isReflection: window.location.pathname.startsWith("/reflection"),
    isAuth: window.location.pathname.startsWith("/auth"),
    // Legacy
    isMirror: window.location.pathname.startsWith("/mirror"), // For backward compatibility
  };
}
