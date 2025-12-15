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

import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';

import ClarifyCard from '@/components/clarify/ClarifyCard';
import DreamsCard from '@/components/dashboard/cards/DreamsCard';
import EvolutionCard from '@/components/dashboard/cards/EvolutionCard';
import ProgressStatsCard from '@/components/dashboard/cards/ProgressStatsCard';
import ReflectionsCard from '@/components/dashboard/cards/ReflectionsCard';
import SubscriptionCard from '@/components/dashboard/cards/SubscriptionCard';
import VisualizationCard from '@/components/dashboard/cards/VisualizationCard';
import DashboardHero from '@/components/dashboard/DashboardHero';
import DashboardGrid from '@/components/dashboard/shared/DashboardGrid';
import { BottomNavigation } from '@/components/navigation';
import { AppNavigation } from '@/components/shared/AppNavigation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { UsageWarningBanner } from '@/components/subscription/UsageWarningBanner';
import { GlowButton, CosmicLoader } from '@/components/ui/glass';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import { TIER_LIMITS } from '@/lib/utils/constants';
import '@/styles/dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshAll } = useDashboard();
  const toast = useToast();

  // UI state
  const [isPageVisible, setIsPageVisible] = useState(false);

  // Stagger animation for hero + grid cards (1 hero + 6-7 cards depending on tier)
  // Paid users have ClarifyCard (7 cards), free users have 6 cards
  const isPaidUser = user && (user.tier !== 'free' || user.isCreator || user.isAdmin);
  const itemCount = isPaidUser ? 8 : 7;
  const { containerRef, getItemStyles } = useStaggerAnimation(itemCount, {
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
      toast.success('Dashboard refreshed successfully', 3000);
    } catch (error) {
      toast.error('Failed to refresh dashboard data', 5000);
    }
  }, [refreshAll, toast]);

  // Page visibility effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Redirect to signin if not authenticated, or to verify-required if not verified
  React.useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo) {
        router.push('/auth/verify-required');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Loading state - show skeleton while auth loads
  if (authLoading) {
    return (
      <div className="dashboard" style={{ opacity: isPageVisible ? 1 : 0 }}>
        <CosmicBackground />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-sm text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated or to verify-required if not verified (but don't show loading)
  if (
    !isAuthenticated ||
    (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo)
  ) {
    return null; // Let the useEffect handle the redirect
  }

  return (
    <div className="dashboard" style={{ opacity: isPageVisible ? 1 : 0 }}>
      <CosmicBackground />

      {/* Navigation */}
      <AppNavigation currentPage="dashboard" onRefresh={handleRefreshData} />

      {/* Main content */}
      <main className="dashboard-main">
        <div className="dashboard-container" ref={containerRef}>
          {/* Hero Section - Primary focus with personalized greeting + CTA */}
          <div style={getItemStyles(0)}>
            <DashboardHero />
          </div>

          {/* Usage Warning Banner */}
          {user && (
            <UsageWarningBanner
              tier={user.tier}
              used={user.reflectionCountThisMonth}
              variant={
                user.reflectionCountThisMonth >= TIER_LIMITS[user.tier]
                  ? 'error'
                  : user.reflectionCountThisMonth / TIER_LIMITS[user.tier] >= 0.9
                    ? 'warning'
                    : 'info'
              }
            />
          )}

          {/* Dashboard Grid - Secondary focus with card sections */}
          <div className="dashboard-grid-container">
            <DashboardGrid isLoading={false}>
              {/* Primary Cards: Dreams & Reflections (most important user data) */}
              <div style={getItemStyles(1)}>
                <DreamsCard animated={true} />
              </div>

              <div style={getItemStyles(2)}>
                <ReflectionsCard animated={true} />
              </div>

              {/* Secondary Cards: Progress & Evolution (insights) */}
              <div style={getItemStyles(3)}>
                <ProgressStatsCard animated={true} />
              </div>

              <div style={getItemStyles(4)}>
                <EvolutionCard animated={true} />
              </div>

              {/* Tertiary Cards: Visualizations & Subscription */}
              <div style={getItemStyles(5)}>
                <VisualizationCard animated={true} />
              </div>

              {/* Clarify Card - paid users only */}
              {isPaidUser && (
                <div style={getItemStyles(6)}>
                  <ClarifyCard animated={true} />
                </div>
              )}

              <div style={getItemStyles(isPaidUser ? 7 : 6)}>
                <SubscriptionCard animated={true} />
              </div>
            </DashboardGrid>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - visible only on mobile (< 768px) */}
      <BottomNavigation />

      {/* Minimal custom styles for dashboard layout */}
      <style jsx global>{`
        .dashboard {
          position: relative;
          min-height: 100vh;
          /* No solid background - let CosmicBackground show through */
          color: var(--cosmic-text);
          transition: opacity 0.6s ease-out;
          overflow-x: hidden;
          max-width: 100vw;
        }

        .dashboard-main {
          position: relative;
          z-index: var(--z-content);
          padding-top: calc(var(--nav-height) + var(--demo-banner-height, 0px));
          min-height: 100vh;
          /* Bottom padding for mobile bottom nav - 64px nav height + safe area */
          padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
          overflow-x: hidden;
        }

        /* Remove bottom padding on tablet and desktop where bottom nav is hidden */
        @media (min-width: 768px) {
          .dashboard-main {
            padding-bottom: 0;
          }
        }

        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          overflow-x: hidden;
        }

        .dashboard-grid-container {
          max-width: 100%;
          overflow: hidden;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-xl);
          min-height: 500px;
          max-width: 100%;
          overflow: hidden;
        }

        .dashboard-grid__item {
          position: relative;
          min-height: 280px;
          max-width: 100%;
          overflow: hidden;
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
            grid-template-rows: repeat(auto-fill, minmax(120px, auto));
          }

          .dashboard-grid__item {
            min-height: 120px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
            gap: var(--space-lg);
            max-width: 100vw;
            box-sizing: border-box;
          }

          .dashboard-grid {
            gap: var(--space-md);
            min-height: auto;
          }

          .dashboard-grid__item {
            min-height: auto;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 0.75rem;
            gap: var(--space-md);
          }

          .dashboard-grid {
            gap: var(--space-sm);
          }
        }
      `}</style>
    </div>
  );
}
