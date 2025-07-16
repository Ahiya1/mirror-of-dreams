// src/components/dashboard/Dashboard.jsx - Main dashboard container

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuth } from "../../hooks/useAuth";
import CosmicBackground from "../shared/CosmicBackground";
import DashboardCard from "./shared/DashboardCard";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardActions,
  HeaderAction,
} from "./shared/DashboardCard";

/**
 * Main dashboard component with luxury cosmic design
 * @returns {JSX.Element} - Dashboard component
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    usage,
    evolution,
    reflections,
    insights,
    isLoading,
    error,
    isGeneratingReport,
    generateEvolutionReport,
    refreshData,
    clearError,
    greeting,
    welcomeMessage,
    stats,
    permissions,
    nextActions,
  } = useDashboard();

  const [showToast, setShowToast] = useState(null);

  // Check for creator mode
  const isCreatorMode = searchParams.get("mode") === "creator";

  // Redirect if not authenticated (but wait for auth to initialize)
  useEffect(() => {
    // Debug authentication state
    if (process.env.NODE_ENV === "development") {
      console.log("Dashboard auth state:", {
        isAuthenticated,
        user: user?.email,
        isLoading: authLoading,
        isCreatorMode,
      });
    }

    // Don't redirect if in creator mode
    if (isCreatorMode) {
      return;
    }

    if (!authLoading && !isAuthenticated) {
      navigate("/auth/signin?returnTo=/dashboard");
    }
  }, [authLoading, isAuthenticated, navigate, user, isCreatorMode]);

  // Handle evolution report generation
  const handleGenerateEvolution = async () => {
    try {
      const report = await generateEvolutionReport();
      if (report) {
        setShowToast({
          type: "success",
          message: "Evolution report generated successfully!",
        });
      }
    } catch (error) {
      setShowToast({
        type: "error",
        message: "Failed to generate evolution report",
      });
    }
  };

  // Handle error clearing
  const handleClearError = () => {
    clearError();
    setShowToast(null);
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <CosmicBackground animated={true} />
        <div className="dashboard-loading__content">
          <div className="cosmic-spinner" />
          <p>Preparing your sacred space...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !isLoading) {
    return (
      <div className="dashboard-error">
        <CosmicBackground animated={true} />
        <div className="dashboard-error__content">
          <div className="dashboard-error__icon">⚠️</div>
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
          <button
            className="cosmic-button cosmic-button--primary"
            onClick={refreshData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Cosmic background */}
      <CosmicBackground animated={true} intensity={0.8} />

      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav__left">
          <a href="/" className="dashboard-nav__logo">
            <span className="dashboard-nav__logo-icon">🪞</span>
            <span className="dashboard-nav__logo-text">Mirror of Truth</span>
          </a>
        </div>

        <div className="dashboard-nav__right">
          {!isCreatorMode && user?.tier === "free" && (
            <a href="/subscription" className="dashboard-nav__upgrade">
              <span>💎</span>
              <span>Upgrade</span>
            </a>
          )}

          <div className="dashboard-nav__user">
            <button className="dashboard-nav__user-btn">
              <span className="dashboard-nav__avatar">
                {isCreatorMode
                  ? "🌟"
                  : user?.tier === "premium"
                  ? "💎"
                  : user?.tier === "essential"
                  ? "✨"
                  : "👤"}
              </span>
              <span className="dashboard-nav__name">
                {isCreatorMode
                  ? "Creator"
                  : user?.name?.split(" ")[0] || "Friend"}
              </span>
              <span className="dashboard-nav__dropdown">▼</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Welcome section */}
          <section className="dashboard-welcome">
            <div className="dashboard-welcome__content">
              <h1 className="dashboard-welcome__title">
                <span className="dashboard-welcome__greeting">{greeting},</span>
                <span className="dashboard-welcome__name">
                  {isCreatorMode
                    ? "Creator"
                    : user?.name?.split(" ")[0] || "Sacred Soul"}
                </span>
              </h1>
              <p className="dashboard-welcome__subtitle">{welcomeMessage}</p>
            </div>

            <div className="dashboard-welcome__actions">
              <a
                href="/reflection"
                className="cosmic-button cosmic-button--primary"
              >
                <span>✨</span>
                <span>Reflect Now</span>
              </a>
              <a
                href="/gifting"
                className="cosmic-button cosmic-button--secondary"
              >
                <span>🎁</span>
                <span>Gift Reflection</span>
              </a>
            </div>
          </section>

          {/* Dashboard grid */}
          <div className="dashboard-grid">
            {/* Usage card */}
            <DashboardCard
              variant="default"
              animated={true}
              animationDelay={100}
              isLoading={isLoading}
              className="dashboard-card--usage"
            >
              <CardHeader>
                <CardTitle icon="📊">This Month</CardTitle>
                <HeaderAction href="/reflections">View All →</HeaderAction>
              </CardHeader>

              <CardContent>
                <div className="usage-display">
                  <div className="usage-progress">
                    <div className="progress-ring">
                      <div className="progress-value">
                        {usage
                          ? Math.round((usage.currentCount / usage.limit) * 100)
                          : 0}
                        %
                      </div>
                    </div>
                  </div>

                  <div className="usage-stats">
                    <div className="stat-row">
                      <span className="stat-label">Used</span>
                      <span className="stat-value">
                        {usage?.currentCount || 0}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Limit</span>
                      <span className="stat-value">
                        {usage?.limit === "unlimited" ? "∞" : usage?.limit || 1}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Total</span>
                      <span className="stat-value">
                        {stats.totalReflections}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </DashboardCard>

            {/* Recent reflections card */}
            <DashboardCard
              variant="default"
              animated={true}
              animationDelay={200}
              isLoading={isLoading}
              className="dashboard-card--reflections"
            >
              <CardHeader>
                <CardTitle icon="🌙">Recent Reflections</CardTitle>
                <HeaderAction href="/reflections">View All →</HeaderAction>
              </CardHeader>

              <CardContent>
                {reflections?.length ? (
                  <div className="reflections-list">
                    {reflections.slice(0, 3).map((reflection, index) => (
                      <div
                        key={reflection.id}
                        className="reflection-item"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="reflection-header">
                          <div className="reflection-title">
                            {reflection.title || "Sacred Reflection"}
                          </div>
                          <div className="reflection-time">
                            {reflection.timeAgo || "Recently"}
                          </div>
                        </div>
                        <div className="reflection-preview">
                          {reflection.dream?.substring(0, 60) ||
                            "Your reflection content..."}
                          {reflection.dream?.length > 60 ? "..." : ""}
                        </div>
                        <div className="reflection-meta">
                          <span
                            className={`reflection-tone ${
                              reflection.tone || "fusion"
                            }`}
                          >
                            {reflection.tone || "Fusion"}
                          </span>
                          {reflection.is_premium && (
                            <span className="reflection-premium">Premium</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🪞</div>
                    <h4>Your Journey Awaits</h4>
                    <p>
                      Create your first reflection to begin seeing yourself
                      clearly.
                    </p>
                    <a
                      href="/reflection"
                      className="cosmic-button cosmic-button--primary"
                    >
                      <span>✨</span>
                      <span>Start Reflecting</span>
                    </a>
                  </div>
                )}
              </CardContent>
            </DashboardCard>

            {/* Evolution card */}
            <DashboardCard
              variant="default"
              animated={true}
              animationDelay={300}
              isLoading={isLoading}
              className="dashboard-card--evolution"
            >
              <CardHeader>
                <CardTitle icon="🦋">Evolution Insights</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="evolution-content">
                  <div className="evolution-progress">
                    <div className="progress-info">
                      <span className="progress-label">
                        Progress to Next Report
                      </span>
                      <span className="progress-count">
                        {evolution?.progress?.current || 0} of{" "}
                        {evolution?.progress?.threshold || 4}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${evolution?.progress?.percentage || 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {evolution?.themes?.length > 0 && (
                    <div className="evolution-themes">
                      <h4>Current Themes</h4>
                      <div className="theme-tags">
                        {evolution.themes.map((theme, index) => (
                          <div key={index} className="theme-tag">
                            <span className="theme-icon">{theme.icon}</span>
                            <span className="theme-name">{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <CardActions>
                    {evolution?.canGenerateNext ? (
                      <button
                        className="cosmic-button cosmic-button--evolution"
                        onClick={handleGenerateEvolution}
                        disabled={isGeneratingReport}
                      >
                        <span>🦋</span>
                        <span>
                          {isGeneratingReport
                            ? "Generating..."
                            : "Generate Report"}
                        </span>
                      </button>
                    ) : (
                      <a
                        href="/reflection"
                        className="cosmic-button cosmic-button--secondary"
                      >
                        <span>✨</span>
                        <span>
                          Continue Journey ({evolution?.progress?.needed || 0}{" "}
                          more)
                        </span>
                      </a>
                    )}
                  </CardActions>
                </div>
              </CardContent>
            </DashboardCard>

            {/* Subscription card */}
            <DashboardCard
              variant="default"
              animated={true}
              animationDelay={400}
              isLoading={isLoading}
              className="dashboard-card--subscription"
            >
              <CardHeader>
                <CardTitle icon="💎">Your Plan</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="subscription-content">
                  <div className="tier-display">
                    <div
                      className={`tier-badge tier-badge--${
                        user?.tier || "free"
                      }`}
                    >
                      {user?.tier?.charAt(0).toUpperCase() +
                        user?.tier?.slice(1) || "Free"}
                    </div>
                    <div className="tier-description">
                      {user?.tier === "free" &&
                        "1 reflection per month to explore your consciousness"}
                      {user?.tier === "essential" &&
                        "5 reflections monthly + Evolution Reports"}
                      {user?.tier === "premium" &&
                        "10 reflections monthly + Advanced Insights"}
                    </div>
                  </div>

                  <CardActions>
                    {user?.tier === "free" ? (
                      <a
                        href="/subscription"
                        className="cosmic-button cosmic-button--upgrade"
                      >
                        <span>✨</span>
                        <span>Upgrade Journey</span>
                      </a>
                    ) : (
                      <a
                        href="/subscription"
                        className="cosmic-button cosmic-button--secondary"
                      >
                        <span>⚙️</span>
                        <span>Manage Plan</span>
                      </a>
                    )}
                  </CardActions>
                </div>
              </CardContent>
            </DashboardCard>
          </div>
        </div>
      </main>

      {/* Toast notifications */}
      {showToast && (
        <div className={`dashboard-toast dashboard-toast--${showToast.type}`}>
          <div className="dashboard-toast__content">
            <span className="dashboard-toast__icon">
              {showToast.type === "success" ? "✅" : "❌"}
            </span>
            <span className="dashboard-toast__message">
              {showToast.message}
            </span>
          </div>
          <button
            className="dashboard-toast__close"
            onClick={() => setShowToast(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="dashboard-error-banner">
          <div className="dashboard-error-banner__content">
            <span className="dashboard-error-banner__icon">⚠️</span>
            <span className="dashboard-error-banner__message">{error}</span>
          </div>
          <button
            className="dashboard-error-banner__close"
            onClick={handleClearError}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
