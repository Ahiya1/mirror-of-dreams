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
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GlowBadge,
  GradientText
} from '@/components/ui/glass';
import CosmicBackground from '@/components/shared/CosmicBackground';
import WelcomeSection from '@/components/dashboard/shared/WelcomeSection';
import DashboardGrid from '@/components/dashboard/shared/DashboardGrid';
import UsageCard from '@/components/dashboard/cards/UsageCard';
import ReflectionsCard from '@/components/dashboard/cards/ReflectionsCard';
import DreamsCard from '@/components/dashboard/cards/DreamsCard';
import EvolutionCard from '@/components/dashboard/cards/EvolutionCard';
import SubscriptionCard from '@/components/dashboard/cards/SubscriptionCard';
import { cn } from '@/lib/utils';
import '@/styles/dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshAll } = useDashboard();

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
  const handleRefreshData = useCallback(() => {
    try {
      refreshAll();
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
  }, [refreshAll]);

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
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle navigation to reflection page
  const handleReflectNow = () => {
    router.push('/reflection');
  };

  // Loading state - show skeleton while auth loads
  if (authLoading) {
    return (
      <div className="dashboard" style={{ opacity: isPageVisible ? 1 : 0 }}>
        <CosmicBackground />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 z-10 relative">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated (but don't show loading)
  if (!isAuthenticated) {
    return null; // Let the useEffect handle the redirect
  }

  return (
    <div className="dashboard" style={{ opacity: isPageVisible ? 1 : 0 }}>
      <CosmicBackground />

      {/* Navigation */}
      <GlassCard
        variant="elevated"
        glassIntensity="strong"
        hoverable={false}
        className="fixed top-0 left-0 right-0 z-[100] rounded-none border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 text-white/90 hover:text-white transition-all hover:-translate-y-0.5 text-lg font-normal">
              <span className="text-2xl animate-glow-pulse">🪞</span>
              <span className="hidden md:inline">Mirror of Dreams</span>
            </Link>

            <div className="hidden lg:flex gap-2">
              <Link href="/dashboard" className="dashboard-nav-link dashboard-nav-link--active">
                <span>🏠</span>
                <span>Journey</span>
              </Link>
              <Link href="/dreams" className="dashboard-nav-link">
                <span>✨</span>
                <span>Dreams</span>
              </Link>
              <Link href="/reflection" className="dashboard-nav-link">
                <span>🪞</span>
                <span>Reflect</span>
              </Link>
              {(user?.isCreator || user?.isAdmin) && (
                <Link href="/admin" className="dashboard-nav-link">
                  <span>⚡</span>
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Upgrade button for free users */}
            {user?.tier === 'free' && (
              <GlowButton
                variant="primary"
                size="sm"
                onClick={() => router.push('/subscription')}
                className="hidden sm:flex"
              >
                <span className="text-lg">💎</span>
                <span className="hidden md:inline">Upgrade</span>
              </GlowButton>
            )}

            {/* Refresh button */}
            <button
              onClick={handleRefreshData}
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
              className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all"
            >
              <span className="text-lg">🔄</span>
            </button>

            {/* User menu */}
            <div className="relative dashboard-nav__user">
              <button
                onClick={handleUserDropdownToggle}
                className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all"
              >
                <span className="text-lg">
                  {user?.tier === 'premium' ? '💎' : user?.tier === 'essential' ? '✨' : '👤'}
                </span>
                <span className="hidden sm:inline text-sm text-white">
                  {user?.name?.split(' ')[0] || 'Friend'}
                </span>
              </button>

              {/* User dropdown menu */}
              <AnimatePresence>
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GlassCard
                      variant="elevated"
                      className="absolute top-[calc(100%+8px)] right-0 min-w-[240px] overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 py-4 border-b border-white/10">
                        <div className="text-sm font-medium text-white">
                          {user?.name || 'User'}
                        </div>
                        <div className="text-xs text-white/60">
                          {user?.email || 'user@example.com'}
                        </div>
                      </div>

                      {/* Menu sections */}
                      <div className="p-2 border-b border-white/10">
                        <Link href="/profile" className="dashboard-dropdown-item">
                          <span>👤</span>
                          <span>Profile</span>
                        </Link>
                        <Link href="/settings" className="dashboard-dropdown-item">
                          <span>⚙️</span>
                          <span>Settings</span>
                        </Link>
                        {user?.tier !== 'premium' && (
                          <Link href="/subscription" className="dashboard-dropdown-item">
                            <span>💎</span>
                            <span>Upgrade</span>
                          </Link>
                        )}
                      </div>

                      <div className="p-2">
                        <Link href="/help" className="dashboard-dropdown-item">
                          <span>❓</span>
                          <span>Help & Support</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="dashboard-dropdown-item text-red-400/90 hover:bg-red-500/10 w-full text-left"
                        >
                          <span>🚪</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Personalized Welcome Section */}
          <WelcomeSection />

        {/* Quick Action: Reflect Now Button */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <GlowButton
            variant="primary"
            size="lg"
            onClick={handleReflectNow}
            className="w-full sm:w-auto"
          >
            <span className="text-2xl">✨</span>
            Reflect Now
          </GlowButton>
        </div>

        {/* Dashboard Grid with Stagger Animation */}
        <div ref={containerRef} className="dashboard-grid-container">
          <DashboardGrid isLoading={false}>
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
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-[1000] min-w-[320px] max-w-md"
          >
            <GlassCard variant="elevated" className="flex items-center gap-3">
              <GlowBadge variant={showToast.type}>
                {showToast.type === 'success' && '✅'}
                {showToast.type === 'error' && '❌'}
                {showToast.type === 'warning' && '⚠️'}
                {showToast.type === 'info' && 'ℹ️'}
              </GlowBadge>
              <span className="flex-1 text-sm text-white/90">
                {showToast.message}
              </span>
              <button
                onClick={handleDismissToast}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Minimal custom styles for dashboard nav links and dropdown items */}
      <style jsx global>{`
        .dashboard {
          position: relative;
          min-height: 100vh;
          background: var(--cosmic-bg);
          color: var(--cosmic-text);
          transition: opacity 0.6s ease-out;
        }

        .dashboard-nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 300;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .dashboard-nav-link:hover,
        .dashboard-nav-link--active {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .dashboard-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 0.5rem;
          color: var(--cosmic-text);
          text-decoration: none;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          text-align: left;
        }

        .dashboard-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
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
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-xl);
          min-height: 500px;
        }

        .dashboard-grid__item {
          position: relative;
          min-height: 280px;
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
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: var(--space-md);
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: var(--space-sm);
          }
        }
      `}</style>
    </div>
  );
}
