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
import WelcomeSection from '@/components/dashboard/shared/WelcomeSection';
import DashboardGrid from '@/components/dashboard/shared/DashboardGrid';
import UsageCard from '@/components/dashboard/cards/UsageCard';
import ReflectionsCard from '@/components/dashboard/cards/ReflectionsCard';
import DreamsCard from '@/components/dashboard/cards/DreamsCard';
import EvolutionCard from '@/components/dashboard/cards/EvolutionCard';
import VisualizationCard from '@/components/dashboard/cards/VisualizationCard';
import SubscriptionCard from '@/components/dashboard/cards/SubscriptionCard';
import '@/styles/dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshAll } = useDashboard();
  const toast = useToast();

  // UI state
  const [isPageVisible, setIsPageVisible] = useState(false);

  // Stagger animation for grid cards (6 cards, 150ms delay between each)
  const { containerRef, getItemStyles } = useStaggerAnimation(6, {
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
      <AppNavigation currentPage="dashboard" onRefresh={handleRefreshData} />

      {/* Main content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Personalized Welcome Section */}
          <WelcomeSection />

        {/* Quick Action: Reflect Now Button - PRIMARY ACTION */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <button
            onClick={handleReflectNow}
            className="
              px-8 py-4
              text-xl font-medium
              bg-purple-600
              text-white
              rounded-lg
              transition-opacity duration-200
              hover:opacity-90
              active:opacity-85
              disabled:opacity-50 disabled:cursor-not-allowed
              w-full sm:w-auto
              min-w-[280px]
            "
          >
            Reflect Now
          </button>
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

            {/* Card 5: Visualization Card - Fetches own data */}
            <div style={getItemStyles(4)}>
              <VisualizationCard animated={true} />
            </div>

            {/* Card 6: Subscription Card - Fetches own data */}
            <div style={getItemStyles(5)}>
              <SubscriptionCard animated={true} />
            </div>
          </DashboardGrid>
        </div>
        </div>
      </main>

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
