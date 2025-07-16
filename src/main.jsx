// src/main.jsx - Updated with portal routing support

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

        {/* Mirror routes */}
        <Route path="/mirror" element={<MirrorApp />} />
        <Route path="/mirror/questionnaire" element={<MirrorApp />} />
        <Route path="/mirror/output" element={<MirrorApp />} />

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Redirect old routes to new structure */}
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
  console.log("   /mirror/* (Mirror Experience)");
  console.log("   /dashboard (Dashboard)");

  // Expose debug utilities
  window.mirrorDebug = {
    currentRoute: window.location.pathname,
    isPortal:
      window.location.pathname === "/" ||
      window.location.pathname === "/portal",
    isDashboard: window.location.pathname === "/dashboard",
    isMirror: window.location.pathname.startsWith("/mirror"),
    isAuth: window.location.pathname.startsWith("/auth"),
  };
}
