// src/components/dashboard/Dashboard.jsx - Complete luxury cosmic dashboard

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuth } from "../../hooks/useAuth";
import { usePersonalizedGreeting } from "../../hooks/usePersonalizedGreeting";
import { useStaggerAnimation } from "../../hooks/useStaggerAnimation";
import { useBreathingEffect } from "../../hooks/useBreathingEffect";
import CosmicBackground from "../shared/CosmicBackground";
import WelcomeSection from "./shared/WelcomeSection";
import DashboardGrid from "./shared/DashboardGrid";
import UsageCard from "./cards/UsageCard";
import ReflectionsCard from "./cards/ReflectionsCard";
import EvolutionCard from "./cards/EvolutionCard";
import SubscriptionCard from "./cards/SubscriptionCard";
import { LoadingOverlay } from "./shared/LoadingStates";

/**
 * Main dashboard component with luxury cosmic design and complete functionality
 * @returns {JSX.Element} - Complete dashboard component
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Dashboard data and state
  const {
    usage,
    evolution,
    reflections,
    insights,
    isLoading: dashboardLoading,
    error: dashboardError,
    isGeneratingReport,
    generateEvolutionReport,
    refreshData,
    clearError,
    hasData,
    hasError,
    isEmpty,
  } = useDashboard();

  // Personalized greeting and messaging
  const {
    greeting,
    displayName,
    welcomeMessage,
    callToActions,
    specialContext,
    refreshGreeting,
  } = usePersonalizedGreeting({ usage, evolution, reflections });

  // UI state
  const [showToast, setShowToast] = useState(null);
  const [isPageVisible, setIsPageVisible] = useState(false);

  // Check for creator mode
  const isCreatorMode = searchParams.get("mode") === "creator";

  // Breathing effect for cosmic background
  const backgroundBreathing = useBreathingEffect({
    duration: 6000,
    intensity: 0.02,
    enabled: !isCreatorMode, // Disable for creator mode
    autoStart: true,
  });

  // Stagger animation for grid cards
  const gridStagger = useStaggerAnimation(4, {
    delay: 150,
    duration: 800,
    enabled: true,
  });

  /**
   * Handle evolution report generation
   */
  const handleGenerateEvolution = useCallback(
    async (tone = "fusion") => {
      try {
        const report = await generateEvolutionReport(tone);
        if (report) {
          setShowToast({
            type: "success",
            message: "Evolution report generated successfully!",
            duration: 5000,
          });

          // Navigate to the new report after a short delay
          setTimeout(() => {
            navigate(`/evolution?report=${report.id}`);
          }, 2000);
        }
      } catch (error) {
        console.error("Failed to generate evolution report:", error);
        setShowToast({
          type: "error",
          message: "Failed to generate evolution report. Please try again.",
          duration: 7000,
        });
      }
    },
    [generateEvolutionReport, navigate]
  );

  /**
   * Handle error clearing and toast dismissal
   */
  const handleClearError = useCallback(() => {
    clearError();
    setShowToast(null);
  }, [clearError]);

  /**
   * Handle data refresh
   */
  const handleRefreshData = useCallback(async () => {
    try {
      await refreshData();
      refreshGreeting();
      setShowToast({
        type: "success",
        message: "Dashboard refreshed successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to refresh dashboard:", error);
      setShowToast({
        type: "error",
        message: "Failed to refresh dashboard data",
        duration: 5000,
      });
    }
  }, [refreshData, refreshGreeting]);

  /**
   * Handle toast dismissal
   */
  const handleDismissToast = useCallback(() => {
    setShowToast(null);
  }, []);

  // Page visibility effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Redirect if not authenticated (but wait for auth to initialize)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Dashboard auth state:", {
        isAuthenticated,
        user: user?.email,
        isLoading: authLoading,
        isCreatorMode,
      });
    }

    // Don't redirect if in creator mode or still loading
    if (isCreatorMode || authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth/signin?returnTo=/dashboard");
    }
  }, [authLoading, isAuthenticated, navigate, isCreatorMode]);

  // Handle dashboard errors
  useEffect(() => {
    if (dashboardError && !dashboardLoading) {
      setShowToast({
        type: "error",
        message: dashboardError,
        duration: 7000,
      });
    }
  }, [dashboardError, dashboardLoading]);

  // Auto-refresh data on focus
  useEffect(() => {
    const handleFocus = () => {
      if (hasData && !dashboardLoading) {
        handleRefreshData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [hasData, dashboardLoading, handleRefreshData]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="dashboard">
        <CosmicBackground animated={true} intensity={0.6} />
        <LoadingOverlay show={true} message="Preparing your sacred space..." />
      </div>
    );
  }

  // Show error state if dashboard failed to load
  if (hasError && !dashboardLoading && !hasData) {
    return (
      <div className="dashboard">
        <CosmicBackground animated={true} intensity={0.6} />

        <div className="dashboard-error">
          <div className="dashboard-error__content">
            <div className="dashboard-error__icon">⚠️</div>
            <h2>Unable to load dashboard</h2>
            <p>{dashboardError}</p>
            <div className="dashboard-error__actions">
              <button
                className="cosmic-button cosmic-button--primary"
                onClick={handleRefreshData}
              >
                <span>🔄</span>
                <span>Try Again</span>
              </button>
              <button
                className="cosmic-button cosmic-button--secondary"
                onClick={() => navigate("/reflection")}
              >
                <span>✨</span>
                <span>Create Reflection</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ opacity: isPageVisible ? 1 : 0 }}>
      {/* Cosmic background with breathing effect */}
      <div
        style={backgroundBreathing.transformStyles}
        {...(backgroundBreathing.onMouseEnter && {
          onMouseEnter: backgroundBreathing.onMouseEnter,
        })}
        {...(backgroundBreathing.onMouseLeave && {
          onMouseLeave: backgroundBreathing.onMouseLeave,
        })}
      >
        <CosmicBackground
          animated={true}
          intensity={isCreatorMode ? 1.0 : 0.8}
          variant={isCreatorMode ? "creator" : "default"}
        />
      </div>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav__left">
          <a href="/" className="dashboard-nav__logo">
            <span className="dashboard-nav__logo-icon">🪞</span>
            <span className="dashboard-nav__logo-text">Mirror of Truth</span>
          </a>

          <div className="dashboard-nav__links">
            <a
              href="/dashboard"
              className="dashboard-nav__link dashboard-nav__link--active"
            >
              <span>🏠</span>
              <span>Journey</span>
            </a>
            <a
              href={isCreatorMode ? "/reflection?mode=creator" : "/reflection"}
              className="dashboard-nav__link"
            >
              <span>✨</span>
              <span>Reflect</span>
            </a>
            {(user?.isCreator || user?.isAdmin) && (
              <a href="/admin" className="dashboard-nav__link">
                <span>⚡</span>
                <span>Admin</span>
              </a>
            )}
          </div>
        </div>

        <div className="dashboard-nav__right">
          {/* Upgrade button for free users */}
          {!isCreatorMode && user?.tier === "free" && (
            <a href="/subscription" className="dashboard-nav__upgrade">
              <span>💎</span>
              <span>Upgrade</span>
            </a>
          )}

          {/* Refresh button */}
          <button
            className="dashboard-nav__refresh"
            onClick={handleRefreshData}
            disabled={dashboardLoading}
            title="Refresh dashboard"
          >
            <span className={dashboardLoading ? "animate-spin" : ""}>🔄</span>
          </button>

          {/* User menu */}
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

            {/* User dropdown menu would go here */}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Welcome section */}
          <WelcomeSection
            greeting={greeting}
            displayName={displayName}
            welcomeMessage={welcomeMessage}
            callToActions={callToActions}
            specialContext={specialContext}
            isCreatorMode={isCreatorMode}
            animated={true}
          />

          {/* Dashboard grid */}
          <div ref={gridStagger.containerRef} className="dashboard-grid">
            {/* Usage card */}
            <div
              className={`dashboard-grid__item ${gridStagger.getItemClasses(
                0
              )}`}
              style={gridStagger.getItemStyles(0)}
            >
              <UsageCard
                data={usage}
                isLoading={dashboardLoading && !hasData}
                animated={true}
              />
            </div>

            {/* Recent reflections card */}
            <div
              className={`dashboard-grid__item ${gridStagger.getItemClasses(
                1
              )}`}
              style={gridStagger.getItemStyles(1)}
            >
              <ReflectionsCard
                data={reflections}
                isLoading={dashboardLoading && !hasData}
                animated={true}
              />
            </div>

            {/* Evolution insights card */}
            <div
              className={`dashboard-grid__item ${gridStagger.getItemClasses(
                2
              )}`}
              style={gridStagger.getItemStyles(2)}
            >
              <EvolutionCard
                data={evolution}
                isLoading={dashboardLoading && !hasData}
                onGenerateReport={handleGenerateEvolution}
                isGenerating={isGeneratingReport}
                animated={true}
              />
            </div>

            {/* Subscription card */}
            <div
              className={`dashboard-grid__item ${gridStagger.getItemClasses(
                3
              )}`}
              style={gridStagger.getItemStyles(3)}
            >
              <SubscriptionCard
                isLoading={dashboardLoading && !hasData}
                animated={true}
              />
            </div>
          </div>

          {/* Insights section (if available) */}
          {insights?.length > 0 && (
            <section className="dashboard-insights">
              <h3 className="dashboard-insights__title">Your Insights</h3>
              <div className="dashboard-insights__grid">
                {insights.map((insight, index) => (
                  <div
                    key={insight.type || index}
                    className="dashboard-insight"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="dashboard-insight__icon">
                      {insight.icon}
                    </div>
                    <div className="dashboard-insight__content">
                      <h4 className="dashboard-insight__title">
                        {insight.title}
                      </h4>
                      <p className="dashboard-insight__message">
                        {insight.message}
                      </p>
                      {insight.action && (
                        <a
                          href={insight.actionUrl}
                          className="dashboard-insight__action"
                        >
                          {insight.action}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Loading overlay for specific actions */}
      <LoadingOverlay
        show={isGeneratingReport}
        message="Generating your evolution report..."
      />

      {/* Toast notifications */}
      {showToast && (
        <div className={`dashboard-toast dashboard-toast--${showToast.type}`}>
          <div className="dashboard-toast__content">
            <span className="dashboard-toast__icon">
              {showToast.type === "success"
                ? "✅"
                : showToast.type === "error"
                ? "❌"
                : showToast.type === "warning"
                ? "⚠️"
                : "ℹ️"}
            </span>
            <span className="dashboard-toast__message">
              {showToast.message}
            </span>
          </div>
          <button
            className="dashboard-toast__close"
            onClick={handleDismissToast}
          >
            ×
          </button>
        </div>
      )}

      {/* Error banner for non-critical errors */}
      {dashboardError && hasData && (
        <div className="dashboard-error-banner">
          <div className="dashboard-error-banner__content">
            <span className="dashboard-error-banner__icon">⚠️</span>
            <span className="dashboard-error-banner__message">
              Some data may be outdated. Last refresh failed.
            </span>
          </div>
          <button
            className="dashboard-error-banner__action"
            onClick={handleRefreshData}
          >
            Retry
          </button>
          <button
            className="dashboard-error-banner__close"
            onClick={handleClearError}
          >
            ×
          </button>
        </div>
      )}

      {/* Component styles */}
      <style jsx>{`
        .dashboard {
          position: relative;
          min-height: 100vh;
          background: var(--cosmic-bg);
          color: var(--cosmic-text);
          transition: opacity 0.6s ease-out;
        }

        .dashboard-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: var(--z-navigation);
          height: clamp(60px, 8vh, 80px);
          background: rgba(15, 15, 35, 0.85);
          backdrop-filter: blur(30px) saturate(120%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-lg);
        }

        .dashboard-nav__left {
          display: flex;
          align-items: center;
          gap: var(--space-xl);
        }

        .dashboard-nav__logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          text-decoration: none;
          color: var(--cosmic-text);
          font-size: var(--text-lg);
          font-weight: var(--font-normal);
          transition: var(--transition-smooth);
        }

        .dashboard-nav__logo:hover {
          color: rgba(255, 255, 255, 1);
          transform: translateY(-1px);
        }

        .dashboard-nav__logo-icon {
          font-size: var(--text-xl);
          animation: glow 4s ease-in-out infinite;
        }

        .dashboard-nav__links {
          display: flex;
          gap: var(--space-2);
        }

        .dashboard-nav__link {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-full);
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: var(--text-sm);
          font-weight: var(--font-light);
          transition: var(--transition-smooth);
          white-space: nowrap;
        }

        .dashboard-nav__link:hover,
        .dashboard-nav__link--active {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .dashboard-nav__right {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .dashboard-nav__upgrade {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: var(--fusion-bg);
          border: 1px solid var(--fusion-border);
          border-radius: var(--radius-full);
          color: var(--fusion-primary);
          text-decoration: none;
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          transition: var(--transition-smooth);
        }

        .dashboard-nav__upgrade:hover {
          background: var(--fusion-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px var(--fusion-glow);
        }

        .dashboard-nav__refresh {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50%;
          color: var(--cosmic-text-muted);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .dashboard-nav__refresh:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--cosmic-text);
        }

        .dashboard-nav__refresh:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dashboard-nav__user-btn {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-4);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-full);
          color: var(--cosmic-text);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .dashboard-nav__user-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .dashboard-nav__avatar {
          font-size: var(--text-lg);
        }

        .dashboard-nav__dropdown {
          font-size: var(--text-xs);
          opacity: 0.7;
        }

        .dashboard-main {
          position: relative;
          z-index: var(--z-content);
          padding-top: clamp(60px, 8vh, 80px);
          min-height: 100vh;
        }

        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: var(--space-xl);
          min-height: 500px;
        }

        .dashboard-grid__item {
          position: relative;
          min-height: 280px;
        }

        .dashboard-insights {
          margin-top: var(--space-xl);
        }

        .dashboard-insights__title {
          font-size: var(--text-lg);
          font-weight: var(--font-normal);
          color: var(--cosmic-text);
          margin-bottom: var(--space-lg);
          text-align: center;
        }

        .dashboard-insights__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-lg);
        }

        .dashboard-insight {
          padding: var(--space-lg);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          animation: slideInUp 0.6s ease-out;
          animation-fill-mode: both;
        }

        .dashboard-insight__icon {
          font-size: var(--text-xl);
          flex-shrink: 0;
        }

        .dashboard-insight__content {
          flex: 1;
        }

        .dashboard-insight__title {
          font-size: var(--text-base);
          font-weight: var(--font-medium);
          color: var(--cosmic-text);
          margin-bottom: var(--space-2);
        }

        .dashboard-insight__message {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          margin-bottom: var(--space-3);
          line-height: var(--leading-relaxed);
        }

        .dashboard-insight__action {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: var(--glass-hover-bg);
          border: 1px solid var(--glass-hover-border);
          border-radius: var(--radius-lg);
          color: var(--cosmic-text);
          text-decoration: none;
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          transition: var(--transition-smooth);
        }

        .dashboard-insight__action:hover {
          background: var(--glass-active-bg);
          transform: translateY(-1px);
        }

        .dashboard-error {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-modal);
          padding: var(--space-xl);
        }

        .dashboard-error__content {
          max-width: 500px;
          text-align: center;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-3xl);
          padding: var(--space-2xl);
        }

        .dashboard-error__icon {
          font-size: 4rem;
          margin-bottom: var(--space-lg);
          opacity: 0.8;
        }

        .dashboard-error__content h2 {
          font-size: var(--text-xl);
          font-weight: var(--font-normal);
          color: var(--cosmic-text);
          margin-bottom: var(--space-md);
        }

        .dashboard-error__content p {
          font-size: var(--text-base);
          color: var(--cosmic-text-secondary);
          margin-bottom: var(--space-xl);
          line-height: var(--leading-relaxed);
        }

        .dashboard-error__actions {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
        }

        /* Mobile responsive */
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            grid-template-rows: repeat(4, minmax(200px, auto));
          }

          .dashboard-nav__links {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: var(--space-md);
          }

          .dashboard-nav {
            padding: 0 var(--space-md);
          }

          .dashboard-nav__logo-text,
          .dashboard-nav__name {
            display: none;
          }

          .dashboard-insights__grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: var(--space-sm);
          }

          .dashboard-nav__upgrade span:last-child {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
