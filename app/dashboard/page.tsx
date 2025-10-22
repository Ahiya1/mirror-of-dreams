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

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import WelcomeSection from '@/components/dashboard/shared/WelcomeSection';
import DashboardGrid from '@/components/dashboard/shared/DashboardGrid';
import UsageCard from '@/components/dashboard/cards/UsageCard';
import ReflectionsCard from '@/components/dashboard/cards/ReflectionsCard';
import EvolutionCard from '@/components/dashboard/cards/EvolutionCard';
import SubscriptionCard from '@/components/dashboard/cards/SubscriptionCard';
import '@/styles/dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const dashboardData = useDashboard();

  // Stagger animation for grid cards (4 cards, 150ms delay between each)
  const { containerRef, getItemStyles } = useStaggerAnimation(4, {
    delay: 150,
    duration: 800,
    triggerOnce: true,
  });

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
  if (authLoading || dashboardData.isLoading || !isAuthenticated) {
    return (
      <div className="dashboard-container">
        <CosmicBackground />
        <div className="dashboard-content">
          <div className="dashboard-loading">
            <div className="cosmic-spinner" />
            <p className="loading-text">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardData.error) {
    return (
      <div className="dashboard-container">
        <CosmicBackground />
        <div className="dashboard-content">
          <div className="dashboard-error">
            <h2>Unable to load dashboard</h2>
            <p>{dashboardData.error}</p>
            <button
              onClick={() => dashboardData.refetch()}
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <CosmicBackground />

      <div className="dashboard-content">
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

            {/* Card 3: Evolution Card - Fetches own data */}
            <div style={getItemStyles(2)}>
              <EvolutionCard animated={true} />
            </div>

            {/* Card 4: Subscription Card - Fetches own data */}
            <div style={getItemStyles(3)}>
              <SubscriptionCard animated={true} />
            </div>
          </DashboardGrid>
        </div>
      </div>
    </div>
  );
}
