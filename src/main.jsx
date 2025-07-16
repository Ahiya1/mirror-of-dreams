// src/main.jsx - Updated with auth routing support

import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MirrorApp from "./components/mirror/MirrorApp";
import Dashboard from "./components/dashboard/Dashboard";
import AuthApp from "./components/auth/AuthApp";
import "./styles/mirror.css";
import "./styles/dashboard.css";
import "./styles/auth.css";

const App = () => {
  return (
    <Router>
      <Routes>
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

        {/* Default redirect */}
        <Route
          path="/"
          element={<Navigate to="/mirror/questionnaire" replace />}
        />
      </Routes>
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
