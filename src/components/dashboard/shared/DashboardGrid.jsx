// src/components/dashboard/sections/DashboardGrid.jsx - 2x2 responsive grid with stagger animations

import React from "react";
import { useStaggerAnimation } from "../../../hooks/useStaggerAnimation";
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  CardActions,
  HeaderAction,
} from "../shared/DashboardCard";
import UsageCard from "../cards/UsageCard";
import ReflectionsCard from "../cards/ReflectionsCard";
import EvolutionCard from "../cards/EvolutionCard";
import SubscriptionCard from "../cards/SubscriptionCard";

/**
 * Dashboard grid with coordinated stagger animations and responsive layout
 * @param {Object} props - Component props
 * @param {Object} props.dashboardData - Dashboard data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onGenerateEvolution - Evolution report generation handler
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Dashboard grid component
 */
const DashboardGrid = ({
  dashboardData,
  isLoading,
  onGenerateEvolution,
  className = "",
}) => {
  const cardCount = 4;
  const staggerAnimation = useStaggerAnimation(cardCount, {
    delay: 150, // 150ms between each card
    duration: 800, // Animation duration
    threshold: 0.2, // Start animation when 20% visible
    enabled: !isLoading, // Only animate when not loading
  });

  /**
   * Handle card-specific loading states
   */
  const getCardLoadingState = (cardIndex) => {
    if (isLoading) return true;
    return !staggerAnimation.isItemAnimated(cardIndex);
  };

  return (
    <div
      ref={staggerAnimation.containerRef}
      className={`dashboard-grid ${className}`}
    >
      {/* Usage Card */}
      <div
        className={`grid-item ${staggerAnimation.getItemClasses(0)}`}
        style={staggerAnimation.getItemStyles(0)}
      >
        <UsageCard
          data={dashboardData?.usage}
          isLoading={getCardLoadingState(0)}
          animated={true}
        />
      </div>

      {/* Recent Reflections Card */}
      <div
        className={`grid-item ${staggerAnimation.getItemClasses(1)}`}
        style={staggerAnimation.getItemStyles(1)}
      >
        <ReflectionsCard
          data={dashboardData?.reflections}
          isLoading={getCardLoadingState(1)}
          animated={true}
        />
      </div>

      {/* Evolution Insights Card */}
      <div
        className={`grid-item ${staggerAnimation.getItemClasses(2)}`}
        style={staggerAnimation.getItemStyles(2)}
      >
        <EvolutionCard
          data={dashboardData?.evolution}
          isLoading={getCardLoadingState(2)}
          onGenerateReport={onGenerateEvolution}
          animated={true}
        />
      </div>

      {/* Subscription Card */}
      <div
        className={`grid-item ${staggerAnimation.getItemClasses(3)}`}
        style={staggerAnimation.getItemStyles(3)}
      >
        <SubscriptionCard isLoading={getCardLoadingState(3)} animated={true} />
      </div>

      {/* Grid Styles */}
      <style jsx>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: var(--space-xl);
          min-height: 600px;
          animation: gridEntrance 0.6s ease-out;
        }

        .grid-item {
          position: relative;
          min-height: 280px;
        }

        .grid-item.stagger-item--visible {
          animation: cardFloat 0.8s ease-out;
        }

        /* Grid entrance animation */
        @keyframes gridEntrance {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Individual card float animation */
        @keyframes cardFloat {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          60% {
            opacity: 0.8;
            transform: translateY(-5px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Hover enhancement for grid items */
        .grid-item:hover {
          z-index: 2;
        }

        /* Mobile responsive - single column */
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            grid-template-rows: repeat(4, auto);
            gap: var(--space-lg);
            min-height: auto;
          }

          .grid-item {
            min-height: 200px;
          }
        }

        /* Small mobile adjustments */
        @media (max-width: 768px) {
          .dashboard-grid {
            gap: var(--space-md);
          }

          .grid-item {
            min-height: 180px;
          }
        }

        /* Extra small mobile */
        @media (max-width: 480px) {
          .dashboard-grid {
            gap: var(--space-sm);
          }

          .grid-item {
            min-height: 160px;
          }
        }

        /* Landscape tablet optimization */
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: var(--space-lg);
          }
        }

        /* Large desktop - maintain aspect ratio */
        @media (min-width: 1400px) {
          .dashboard-grid {
            max-width: 1200px;
            margin: 0 auto;
          }
        }

        /* Ultra-wide displays */
        @media (min-width: 1800px) {
          .dashboard-grid {
            max-width: 1400px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .dashboard-grid,
          .grid-item,
          .stagger-item--visible {
            animation: none !important;
          }

          .grid-item {
            opacity: 1 !important;
            transform: none !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .dashboard-grid {
            gap: calc(var(--space-xl) + 4px);
          }

          .grid-item {
            outline: 1px solid currentColor;
            border-radius: var(--radius-lg);
          }
        }

        /* Print optimization */
        @media print {
          .dashboard-grid {
            display: block;
            gap: 0;
          }

          .grid-item {
            break-inside: avoid;
            margin-bottom: 20px;
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardGrid;
