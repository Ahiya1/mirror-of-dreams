/**
 * Dashboard Page - Main User Hub
 *
 * Migrated from: src/components/dashboard/Dashboard.jsx
 * Builder: Builder-2C (Dashboard Page Assembly)
 *
 * This is the complete dashboard page that assembles all components:
 * - WelcomeSection (personalized greeting)
 * - DashboardGrid (responsive 2x2 grid)
 * - UsageCard (monthly usage stats) - Fetches own data via tRPC
 * - ReflectionsCard (recent 3 reflections) - Fetches own data via tRPC
 * - EvolutionCard (evolution report UI) - Fetches own data via tRPC
 * - SubscriptionCard (tier info & upgrade CTA) - Placeholder until Builder-2B completes
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import WelcomeSection from '@/components/dashboard/shared/WelcomeSection';
import DashboardGrid from '@/components/dashboard/shared/DashboardGrid';
import UsageCard from '@/components/dashboard/cards/UsageCard';
import ReflectionsCard from '@/components/dashboard/cards/ReflectionsCard';
import DreamsCard from '@/components/dashboard/cards/DreamsCard';
import EvolutionCard from '@/components/dashboard/cards/EvolutionCard';
import SubscriptionCard from '@/components/dashboard/cards/SubscriptionCard';
import '@/styles/dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const dashboardData = useDashboard();

  // UI state
  const [showToast, setShowToast] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  } | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(false);

  // Stagger animation for grid cards (5 cards, 150ms delay between each)
  const { containerRef, getItemStyles } = useStaggerAnimation(5, {
    delay: 150,
    duration: 800,
    triggerOnce: true,
  });

  /**
   * Handle data refresh
   */
  const handleRefreshData = useCallback(async () => {
    try {
      await dashboardData.refetch();
      setShowToast({
        type: 'success',
        message: 'Dashboard refreshed successfully',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      setShowToast({
        type: 'error',
        message: 'Failed to refresh dashboard data',
        duration: 5000,
      });
    }
  }, [dashboardData]);

  /**
   * Handle toast dismissal
   */
  const handleDismissToast = useCallback(() => {
    setShowToast(null);
  }, []);

  /**
   * Handle user dropdown toggle
   */
  const handleUserDropdownToggle = useCallback(() => {
    setShowUserDropdown((prev) => !prev);
  }, []);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(() => {
    setShowUserDropdown(false);
    router.push('/auth/signin');
  }, [router]);

  /**
   * Handle error clearing
   */
  const handleClearError = useCallback(() => {
    setShowToast(null);
  }, []);

  // Page visibility effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserDropdown && !target.closest('.dashboard-nav__user')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  // Auto-dismiss toast
  useEffect(() => {
    if (showToast && showToast.duration) {
      const timer = setTimeout(() => {
        setShowToast(null);
      }, showToast.duration);

      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Redirect to signin if not authenticated (after auth check completes)
  React.useEffect(() => {
    if (!isAuthenticated && !authLoading && !dashboardData.isLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, dashboardData.isLoading, router]);

  // Handle navigation to reflection page
  const handleReflectNow = () => {
    router.push('/reflection');
  };

  // Adapt dashboardData to WelcomeSection interface
  const welcomeSectionData = React.useMemo(() => {
    if (!dashboardData.usage) return undefined;

    return {
      usage: {
        currentCount: dashboardData.usage.current,
        limit: dashboardData.usage.limit,
        totalReflections: dashboardData.usage.current, // Same as current for now
        canReflect: dashboardData.usage.canReflect,
      },
      evolution: {
        canGenerateNext: dashboardData.evolutionStatus?.canGenerate,
        progress: {
          needed: 0, // Placeholder
        },
      },
    };
  }, [dashboardData]);

  // Loading state - show skeleton while data loads
  if (authLoading || dashboardData.isLoading) {
    return (
      <div className="dashboard" style={{ opacity: isPageVisible ? 1 : 0 }}>
        <CosmicBackground />
        <div className="dashboard-loading">
          <div className="cosmic-spinner" />
          <p className="loading-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated (but don't show loading)
  if (!isAuthenticated) {
    return null; // Let the useEffect handle the redirect
  }

  // Check if we have a critical error with no data
  const hasData = !!(dashboardData.usage || dashboardData.reflections || dashboardData.evolutionStatus);
  const hasCriticalError = dashboardData.error && !dashboardData.isLoading && !hasData;

  // Error state (only if no data available)
  if (hasCriticalError) {
    return (
      <div className="dashboard" style={{ opacity: isPageVisible ? 1 : 0 }}>
        <CosmicBackground />

        <div className="dashboard-error">
          <div className="dashboard-error__content">
            <div className="dashboard-error__icon">⚠️</div>
            <h2>Unable to load dashboard</h2>
            <p>{dashboardData.error}</p>
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
                onClick={() => router.push('/reflection')}
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
      <CosmicBackground />

      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav__left">
          <Link href="/" className="dashboard-nav__logo">
            <span className="dashboard-nav__logo-icon">🪞</span>
            <span className="dashboard-nav__logo-text">Mirror of Dreams</span>
          </Link>

          <div className="dashboard-nav__links">
            <Link
              href="/dashboard"
              className="dashboard-nav__link dashboard-nav__link--active"
            >
              <span>🏠</span>
              <span>Journey</span>
            </Link>
            <Link
              href="/dreams"
              className="dashboard-nav__link"
            >
              <span>✨</span>
              <span>Dreams</span>
            </Link>
            <Link
              href="/reflection"
              className="dashboard-nav__link"
            >
              <span>🪞</span>
              <span>Reflect</span>
            </Link>
            {(user?.isCreator || user?.isAdmin) && (
              <Link href="/admin" className="dashboard-nav__link">
                <span>⚡</span>
                <span>Admin</span>
              </Link>
            )}
          </div>
        </div>

        <div className="dashboard-nav__right">
          {/* Upgrade button for free users */}
          {user?.tier === 'free' && (
            <Link href="/subscription" className="dashboard-nav__upgrade">
              <span>💎</span>
              <span>Upgrade</span>
            </Link>
          )}

          {/* Refresh button */}
          <button
            className="dashboard-nav__refresh"
            onClick={handleRefreshData}
            disabled={dashboardData.isLoading}
            title="Refresh dashboard"
          >
            <span className={dashboardData.isLoading ? 'animate-spin' : ''}>🔄</span>
          </button>

          {/* User menu */}
          <div className="dashboard-nav__user">
            <button
              className="dashboard-nav__user-btn"
              onClick={handleUserDropdownToggle}
            >
              <span className="dashboard-nav__avatar">
                {user?.tier === 'premium'
                  ? '💎'
                  : user?.tier === 'essential'
                  ? '✨'
                  : '👤'}
              </span>
              <span className="dashboard-nav__name">
                {user?.name?.split(' ')[0] || 'Friend'}
              </span>
            </button>

            {/* User dropdown menu */}
            {showUserDropdown && (
              <div className="dashboard-nav__dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <span className="dropdown-user-name">
                      {user?.name || 'User'}
                    </span>
                    <span className="dropdown-user-email">
                      {user?.email || 'user@example.com'}
                    </span>
                  </div>
                </div>

                <div className="dropdown-section">
                  <Link href="/profile" className="dropdown-item">
                    <span>👤</span>
                    <span>Profile</span>
                  </Link>
                  <Link href="/settings" className="dropdown-item">
                    <span>⚙️</span>
                    <span>Settings</span>
                  </Link>
                  {user?.tier !== 'premium' && (
                    <Link href="/subscription" className="dropdown-item">
                      <span>💎</span>
                      <span>Upgrade</span>
                    </Link>
                  )}
                </div>

                <div className="dropdown-section">
                  <Link href="/help" className="dropdown-item">
                    <span>❓</span>
                    <span>Help & Support</span>
                  </Link>
                  <button
                    className="dropdown-item dropdown-item--logout"
                    onClick={handleLogout}
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Personalized Welcome Section */}
          <WelcomeSection dashboardData={welcomeSectionData} />

        {/* Quick Action: Reflect Now Button */}
        <div className="quick-actions">
          <button
            className="reflect-now-button"
            onClick={handleReflectNow}
            disabled={!dashboardData.usage?.canReflect}
          >
            <span className="button-icon">✨</span>
            <span className="button-text">Reflect Now</span>
          </button>
          {!dashboardData.usage?.canReflect && (
            <p className="action-hint">
              Upgrade to Premium for unlimited reflections
            </p>
          )}
        </div>

        {/* Dashboard Grid with Stagger Animation */}
        <div ref={containerRef} className="dashboard-grid-container">
          <DashboardGrid isLoading={dashboardData.isLoading}>
            {/* Card 1: Usage Card - Fetches own data */}
            <div style={getItemStyles(0)}>
              <UsageCard animated={true} />
            </div>

            {/* Card 2: Reflections Card - Fetches own data */}
            <div style={getItemStyles(1)}>
              <ReflectionsCard animated={true} />
            </div>

            {/* Card 3: Dreams Card - Fetches own data */}
            <div style={getItemStyles(2)}>
              <DreamsCard animated={true} />
            </div>

            {/* Card 4: Evolution Card - Fetches own data */}
            <div style={getItemStyles(3)}>
              <EvolutionCard animated={true} />
            </div>

            {/* Card 5: Subscription Card - Fetches own data */}
            <div style={getItemStyles(4)}>
              <SubscriptionCard animated={true} />
            </div>
          </DashboardGrid>
        </div>
        </div>
      </main>

      {/* Toast notifications */}
      {showToast && (
        <div className={`dashboard-toast dashboard-toast--${showToast.type}`}>
          <div className="dashboard-toast__content">
            <span className="dashboard-toast__icon">
              {showToast.type === 'success'
                ? '✅'
                : showToast.type === 'error'
                ? '❌'
                : showToast.type === 'warning'
                ? '⚠️'
                : 'ℹ️'}
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
      {dashboardData.error && hasData && (
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

        .dashboard-loading {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-lg);
          z-index: var(--z-content);
        }

        .cosmic-spinner {
          width: 60px;
          height: 60px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: rgba(251, 191, 36, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: var(--text-lg);
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

        .dashboard-nav__user {
          position: relative;
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

        .dashboard-nav__name {
          font-size: var(--text-sm);
        }

        .dashboard-nav__dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 240px;
          background: rgba(15, 15, 35, 0.95);
          backdrop-filter: blur(30px) saturate(120%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-xl);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: var(--space-4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .dropdown-user-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .dropdown-user-name {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--cosmic-text);
        }

        .dropdown-user-email {
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
        }

        .dropdown-section {
          padding: var(--space-2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .dropdown-section:last-child {
          border-bottom: none;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: transparent;
          border: none;
          border-radius: var(--radius-lg);
          color: var(--cosmic-text);
          text-decoration: none;
          font-size: var(--text-sm);
          cursor: pointer;
          transition: var(--transition-smooth);
          width: 100%;
          text-align: left;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .dropdown-item--logout {
          color: rgba(255, 100, 100, 0.9);
        }

        .dropdown-item--logout:hover {
          background: rgba(255, 100, 100, 0.1);
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

        .quick-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .reflect-now-button {
          padding: var(--space-lg) var(--space-2xl);
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(147, 51, 234, 0.25));
          border: 2px solid rgba(251, 191, 36, 0.4);
          border-radius: var(--radius-full);
          color: rgba(251, 191, 36, 1);
          font-size: var(--text-lg);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: var(--space-3);
          box-shadow: 0 4px 20px rgba(251, 191, 36, 0.2);
        }

        .reflect-now-button:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.35), rgba(147, 51, 234, 0.35));
          border-color: rgba(251, 191, 36, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(251, 191, 36, 0.4);
        }

        .reflect-now-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .button-icon {
          font-size: var(--text-xl);
        }

        .button-text {
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .action-hint {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          font-style: italic;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-xl);
          min-height: 500px;
        }

        .dashboard-grid__item {
          position: relative;
          min-height: 280px;
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

        .cosmic-button {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: var(--transition-smooth);
          border: 1px solid;
        }

        .cosmic-button--primary {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
          color: var(--cosmic-text);
        }

        .cosmic-button--primary:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
        }

        .cosmic-button--secondary {
          background: var(--fusion-bg);
          border-color: var(--fusion-border);
          color: var(--fusion-primary);
        }

        .cosmic-button--secondary:hover {
          background: var(--fusion-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px var(--fusion-glow);
        }

        .dashboard-toast {
          position: fixed;
          bottom: var(--space-xl);
          right: var(--space-xl);
          z-index: var(--z-toast);
          min-width: 320px;
          max-width: 480px;
          background: rgba(15, 15, 35, 0.95);
          backdrop-filter: blur(30px) saturate(120%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          animation: slideInUp 0.3s ease-out;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dashboard-toast--success {
          border-left: 3px solid #4ade80;
        }

        .dashboard-toast--error {
          border-left: 3px solid #ef4444;
        }

        .dashboard-toast--warning {
          border-left: 3px solid #fbbf24;
        }

        .dashboard-toast--info {
          border-left: 3px solid #60a5fa;
        }

        .dashboard-toast__content {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex: 1;
        }

        .dashboard-toast__icon {
          font-size: var(--text-lg);
          flex-shrink: 0;
        }

        .dashboard-toast__message {
          font-size: var(--text-sm);
          color: var(--cosmic-text);
          line-height: var(--leading-relaxed);
        }

        .dashboard-toast__close {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          border: none;
          border-radius: 50%;
          color: var(--cosmic-text-muted);
          font-size: var(--text-lg);
          cursor: pointer;
          transition: var(--transition-smooth);
          flex-shrink: 0;
        }

        .dashboard-toast__close:hover {
          background: rgba(255, 255, 255, 0.12);
          color: var(--cosmic-text);
        }

        .dashboard-error-banner {
          position: fixed;
          top: clamp(60px, 8vh, 80px);
          left: 50%;
          transform: translateX(-50%);
          z-index: var(--z-notification);
          min-width: 320px;
          max-width: 600px;
          background: rgba(251, 191, 36, 0.15);
          backdrop-filter: blur(30px) saturate(120%);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          animation: slideDown 0.3s ease-out;
          margin-top: var(--space-4);
        }

        .dashboard-error-banner__content {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex: 1;
        }

        .dashboard-error-banner__icon {
          font-size: var(--text-lg);
          flex-shrink: 0;
        }

        .dashboard-error-banner__message {
          font-size: var(--text-sm);
          color: var(--cosmic-text);
          line-height: var(--leading-relaxed);
        }

        .dashboard-error-banner__action {
          padding: var(--space-2) var(--space-4);
          background: rgba(251, 191, 36, 0.2);
          border: 1px solid rgba(251, 191, 36, 0.4);
          border-radius: var(--radius-lg);
          color: var(--cosmic-text);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .dashboard-error-banner__action:hover {
          background: rgba(251, 191, 36, 0.3);
        }

        .dashboard-error-banner__close {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          border: none;
          border-radius: 50%;
          color: var(--cosmic-text-muted);
          font-size: var(--text-lg);
          cursor: pointer;
          transition: var(--transition-smooth);
          flex-shrink: 0;
        }

        .dashboard-error-banner__close:hover {
          background: rgba(255, 255, 255, 0.12);
          color: var(--cosmic-text);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* Mobile responsive */
        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            grid-template-rows: repeat(5, minmax(200px, auto));
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

          .dashboard-toast {
            left: var(--space-md);
            right: var(--space-md);
            min-width: auto;
          }

          .dashboard-error-banner {
            left: var(--space-md);
            right: var(--space-md);
            transform: none;
            min-width: auto;
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
}
