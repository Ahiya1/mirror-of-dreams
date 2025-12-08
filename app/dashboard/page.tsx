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
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import {
  GlowButton,
  CosmicLoader
} from '@/components/ui/glass';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { BottomNavigation } from '@/components/navigation';
import DashboardHero from '@/components/dashboard/DashboardHero';
import DashboardGrid from '@/components/dashboard/shared/DashboardGrid';
import DreamsCard from '@/components/dashboard/cards/DreamsCard';
import ReflectionsCard from '@/components/dashboard/cards/ReflectionsCard';
import ProgressStatsCard from '@/components/dashboard/cards/ProgressStatsCard';
import EvolutionCard from '@/components/dashboard/cards/EvolutionCard';
import VisualizationCard from '@/components/dashboard/cards/VisualizationCard';
import SubscriptionCard from '@/components/dashboard/cards/SubscriptionCard';
import { UsageWarningBanner } from '@/components/subscription/UsageWarningBanner';
import { TIER_LIMITS } from '@/lib/utils/constants';
import '@/styles/dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshAll } = useDashboard();
  const toast = useToast();

  // UI state
  const [isPageVisible, setIsPageVisible] = useState(false);

  // Stagger animation for hero + grid cards (1 hero + 6 cards = 7 items)
  const { containerRef, getItemStyles } = useStaggerAnimation(7, {
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
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 z-10 relative">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated or to verify-required if not verified (but don't show loading)
  if (!isAuthenticated || (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo)) {
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
                user.reflectionCountThisMonth >= TIER_LIMITS[user.tier] ? 'error' :
                user.reflectionCountThisMonth / TIER_LIMITS[user.tier] >= 0.9 ? 'warning' :
                'info'
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

              <div style={getItemStyles(6)}>
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
          background: var(--cosmic-bg);
          color: var(--cosmic-text);
          transition: opacity 0.6s ease-out;
        }

        .dashboard-main {
          position: relative;
          z-index: var(--z-content);
          padding-top: calc(var(--nav-height) + var(--demo-banner-height, 0px));
          min-height: 100vh;
          /* Bottom padding for mobile bottom nav - 64px nav height + safe area */
          padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
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
            padding: 1rem;  /* 16px - consistent with px-4 on other pages */
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 1rem;  /* Same 16px for consistency */
          }
        }
      `}</style>
    </div>
  );
}
