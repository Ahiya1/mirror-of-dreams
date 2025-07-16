// src/components/dashboard/cards/UsageCard.jsx - Usage statistics with animated progress ring

import React, { useMemo } from "react";
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  CardActions,
  HeaderAction,
} from "../shared/DashboardCard";
import ProgressRing from "../shared/ProgressRing";
import { useAnimatedCounter } from "../../../hooks/useAnimatedCounter";

/**
 * Usage card component with animated progress and statistics
 * @param {Object} props - Component props
 * @param {Object} props.data - Usage data
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.animated - Enable animations
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Usage card component
 */
const UsageCard = ({ data, isLoading, animated = true, className = "" }) => {
  // Calculate usage statistics
  const usageStats = useMemo(() => {
    if (!data) {
      return {
        currentCount: 0,
        limit: 1,
        totalReflections: 0,
        percentage: 0,
        canReflect: true,
        tier: "free",
      };
    }

    const currentCount = data.currentCount || 0;
    const limit = data.limit || 1;
    const totalReflections = data.totalReflections || 0;
    const percentage =
      limit === "unlimited" ? 0 : Math.min((currentCount / limit) * 100, 100);

    return {
      currentCount,
      limit,
      totalReflections,
      percentage,
      canReflect: data.canReflect ?? true,
      tier: data.tier || "free",
    };
  }, [data]);

  // Animated counters for smooth number transitions
  const currentCountCounter = useAnimatedCounter(usageStats.currentCount, {
    duration: 1500,
    delay: 200,
  });

  const totalReflectionsCounter = useAnimatedCounter(
    usageStats.totalReflections,
    {
      duration: 2000,
      delay: 400,
    }
  );

  const percentageCounter = useAnimatedCounter(usageStats.percentage, {
    duration: 2000,
    delay: 300,
    decimals: 0,
    formatValue: (value) => `${Math.round(value)}%`,
  });

  // Get usage status and messaging
  const getUsageStatus = useMemo(() => {
    const { percentage, canReflect, currentCount, limit } = usageStats;

    if (limit === "unlimited") {
      return {
        status: "unlimited",
        message: "Unlimited reflections available",
        color: "success",
        actionText: "Reflect Now",
        actionHref: "/reflection",
      };
    }

    if (percentage === 0) {
      return {
        status: "fresh",
        message: "Your monthly journey awaits",
        color: "primary",
        actionText: "Start Journey",
        actionHref: "/reflection",
      };
    }

    if (percentage < 50) {
      return {
        status: "active",
        message: `${limit - currentCount} reflections remaining`,
        color: "primary",
        actionText: "Continue Journey",
        actionHref: "/reflection",
      };
    }

    if (percentage < 80) {
      return {
        status: "moderate",
        message: "Building momentum beautifully",
        color: "warning",
        actionText: "Keep Reflecting",
        actionHref: "/reflection",
      };
    }

    if (percentage < 100) {
      return {
        status: "approaching",
        message: `${limit - currentCount} reflection${
          limit - currentCount === 1 ? "" : "s"
        } left`,
        color: "warning",
        actionText: "Reflect Now",
        actionHref: "/reflection",
      };
    }

    return {
      status: "complete",
      message: "Monthly journey complete",
      color: "success",
      actionText: "View Journey",
      actionHref: "/reflections",
    };
  }, [usageStats]);

  const usageStatus = getUsageStatus;

  return (
    <DashboardCard
      className={`usage-card ${className}`}
      isLoading={isLoading}
      animated={animated}
      animationDelay={100}
      hoverable={true}
    >
      <CardHeader>
        <CardTitle icon="📊">This Month</CardTitle>
        <HeaderAction href="/reflections">
          View All <span>→</span>
        </HeaderAction>
      </CardHeader>

      <CardContent>
        <div className="usage-display">
          {/* Progress Ring */}
          <div className="usage-progress">
            <ProgressRing
              percentage={usageStats.percentage}
              size="lg"
              strokeWidth={6}
              animated={animated}
              color={usageStatus.color}
              showValue={true}
              valueFormatter={percentageCounter.displayValue}
              animationDelay={300}
            />
          </div>

          {/* Usage Statistics */}
          <div className="usage-stats">
            <div className="stat-row">
              <span className="stat-label">Used</span>
              <span className="stat-value">
                {animated
                  ? currentCountCounter.displayValue
                  : usageStats.currentCount}
              </span>
            </div>

            <div className="stat-row">
              <span className="stat-label">Limit</span>
              <span className="stat-value">
                {usageStats.limit === "unlimited" ? "∞" : usageStats.limit}
              </span>
            </div>

            <div className="stat-row">
              <span className="stat-label">Total</span>
              <span className="stat-value">
                {animated
                  ? totalReflectionsCounter.displayValue
                  : usageStats.totalReflections}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Status */}
        <div className={`usage-status usage-status--${usageStatus.status}`}>
          <p className="usage-message">{usageStatus.message}</p>
        </div>
      </CardContent>

      <CardActions>
        <a
          href={usageStatus.actionHref}
          className={`cosmic-button cosmic-button--${usageStatus.color}`}
          disabled={!usageStats.canReflect}
        >
          <span>✨</span>
          <span>{usageStatus.actionText}</span>
        </a>
      </CardActions>

      {/* Card-specific styles */}
      <style jsx>{`
        .usage-display {
          display: flex;
          align-items: center;
          gap: var(--space-xl);
          margin-bottom: var(--space-lg);
        }

        .usage-progress {
          flex-shrink: 0;
        }

        .usage-stats {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          font-weight: var(--font-light);
        }

        .stat-value {
          font-size: var(--text-base);
          font-weight: var(--font-medium);
          color: var(--cosmic-text);
          min-width: 60px;
          text-align: right;
        }

        .usage-status {
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-xl);
          border: 1px solid transparent;
          transition: var(--transition-smooth);
        }

        .usage-status--fresh,
        .usage-status--active {
          background: rgba(147, 51, 234, 0.08);
          border-color: rgba(147, 51, 234, 0.15);
        }

        .usage-status--moderate,
        .usage-status--approaching {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.15);
        }

        .usage-status--complete,
        .usage-status--unlimited {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .usage-message {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          margin: 0;
          text-align: center;
          font-weight: var(--font-light);
          line-height: var(--leading-relaxed);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .usage-display {
            flex-direction: column;
            text-align: center;
            gap: var(--space-lg);
          }

          .usage-stats {
            align-items: center;
            max-width: 200px;
          }

          .stat-row {
            justify-content: center;
            gap: var(--space-md);
          }

          .stat-value {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .usage-display {
            gap: var(--space-md);
          }

          .usage-status {
            padding: var(--space-2) var(--space-3);
          }

          .usage-message {
            font-size: var(--text-xs);
          }
        }
      `}</style>
    </DashboardCard>
  );
};

export default UsageCard;
