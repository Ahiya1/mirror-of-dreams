// src/components/dashboard/cards/EvolutionCard.jsx - Evolution progress and insights

import React, { useState } from "react";
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  CardActions,
} from "../shared/DashboardCard";
import ThemeTag from "../shared/ThemeTag";
import { useAnimatedCounter } from "../../../hooks/useAnimatedCounter";

/**
 * Evolution card component with progress tracking and theme display
 * @param {Object} props - Component props
 * @param {Object} props.data - Evolution data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onGenerateReport - Report generation handler
 * @param {boolean} props.animated - Enable animations
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Evolution card component
 */
const EvolutionCard = ({
  data,
  isLoading,
  onGenerateReport,
  animated = true,
  className = "",
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Format evolution data with fallbacks
  const evolutionData = {
    eligible: data?.eligible || false,
    canGenerateNext: data?.canGenerateNext || false,
    upgradeRequired: data?.upgradeRequired || false,
    tier: data?.tier || "free",
    themes: data?.themes || [],
    progress: {
      current: data?.progress?.current || 0,
      threshold: data?.progress?.threshold || 4,
      needed: data?.progress?.needed || 4,
      percentage: data?.progress?.percentage || 0,
    },
  };

  // Animated counters
  const currentCounter = useAnimatedCounter(evolutionData.progress.current, {
    duration: 1500,
    delay: 300,
  });

  const percentageCounter = useAnimatedCounter(
    evolutionData.progress.percentage,
    {
      duration: 2000,
      delay: 500,
      decimals: 0,
    }
  );

  /**
   * Handle evolution report generation
   */
  const handleGenerateReport = async () => {
    if (isGenerating || !onGenerateReport) return;

    setIsGenerating(true);
    try {
      await onGenerateReport();
    } catch (error) {
      console.error("Failed to generate evolution report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Get evolution status and messaging
   */
  const getEvolutionStatus = () => {
    if (evolutionData.tier === "free") {
      return {
        type: "upgrade",
        title: "Evolution Reports",
        message: "Unlock deep insights into your consciousness patterns",
        actionText: "Unlock Evolution",
        actionHref: "/subscription",
        actionType: "link",
        color: "fusion",
        icon: "💎",
      };
    }

    if (evolutionData.canGenerateNext) {
      return {
        type: "ready",
        title: "Report Ready",
        message: "Your evolution report is ready to be generated",
        actionText: isGenerating ? "Generating..." : "Generate Report",
        actionType: "button",
        color: "success",
        icon: "🦋",
        disabled: isGenerating,
      };
    }

    if (evolutionData.progress.needed <= 2) {
      return {
        type: "close",
        title: "Almost Ready",
        message: `${evolutionData.progress.needed} more reflection${
          evolutionData.progress.needed === 1 ? "" : "s"
        } to unlock your next evolution insight`,
        actionText: "Continue Journey",
        actionHref: "/reflection",
        actionType: "link",
        color: "primary",
        icon: "✨",
      };
    }

    return {
      type: "progress",
      title: "Building Insights",
      message: `Create ${evolutionData.progress.needed} more reflections to unlock evolution patterns`,
      actionText: "Create Reflection",
      actionHref: "/reflection",
      actionType: "link",
      color: "primary",
      icon: "✨",
    };
  };

  const evolutionStatus = getEvolutionStatus();

  return (
    <DashboardCard
      className={`evolution-card ${className}`}
      isLoading={isLoading}
      animated={animated}
      animationDelay={300}
      hoverable={true}
    >
      <CardHeader>
        <CardTitle icon="🦋">Evolution Insights</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="evolution-content">
          {/* Progress Section */}
          <div className="evolution-progress">
            <div className="progress-header">
              <div className="progress-info">
                <span className="progress-label">Progress to Next Report</span>
                <span className="progress-count">
                  {animated
                    ? currentCounter.displayValue
                    : evolutionData.progress.current}{" "}
                  of {evolutionData.progress.threshold}
                </span>
              </div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    animated
                      ? percentageCounter.rawValue
                      : evolutionData.progress.percentage
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Current Themes */}
          {evolutionData.themes.length > 0 && (
            <div className="evolution-themes">
              <h4 className="themes-title">Current Themes</h4>
              <div className="theme-tags">
                {evolutionData.themes.map((theme, index) => (
                  <ThemeTag
                    key={theme.name || index}
                    theme={theme}
                    animated={animated}
                    animationDelay={index * 100}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Evolution Status */}
          <div
            className={`evolution-status evolution-status--${evolutionStatus.type}`}
          >
            <div className="status-icon">{evolutionStatus.icon}</div>
            <div className="status-content">
              <h5 className="status-title">{evolutionStatus.title}</h5>
              <p className="status-message">{evolutionStatus.message}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardActions>
        {evolutionStatus.actionType === "button" ? (
          <button
            className={`cosmic-button cosmic-button--${evolutionStatus.color}`}
            onClick={handleGenerateReport}
            disabled={evolutionStatus.disabled}
          >
            <span>{evolutionStatus.icon}</span>
            <span>{evolutionStatus.actionText}</span>
          </button>
        ) : (
          <a
            href={evolutionStatus.actionHref}
            className={`cosmic-button cosmic-button--${evolutionStatus.color}`}
          >
            <span>{evolutionStatus.icon}</span>
            <span>{evolutionStatus.actionText}</span>
          </a>
        )}
      </CardActions>

      {/* Card-specific styles */}
      <style jsx>{`
        .evolution-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          flex: 1;
        }

        .evolution-progress {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .progress-label {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          font-weight: var(--font-light);
        }

        .progress-count {
          font-size: var(--text-sm);
          color: var(--cosmic-text);
          font-weight: var(--font-medium);
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-full);
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(147, 51, 234, 0.8) 0%,
            rgba(99, 102, 241, 0.6) 50%,
            rgba(59, 130, 246, 0.5) 100%
          );
          border-radius: var(--radius-full);
          transition: width var(--transition-smooth);
          width: 0%;
          position: relative;
        }

        .progress-fill::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: progressShimmer 2s ease-in-out infinite;
        }

        @keyframes progressShimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .evolution-themes {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .themes-title {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          margin: 0;
          font-weight: var(--font-medium);
        }

        .theme-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .evolution-status {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          border-radius: var(--radius-xl);
          border: 1px solid transparent;
          transition: var(--transition-smooth);
        }

        .evolution-status--upgrade {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.15);
        }

        .evolution-status--ready {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .evolution-status--close,
        .evolution-status--progress {
          background: rgba(147, 51, 234, 0.08);
          border-color: rgba(147, 51, 234, 0.15);
        }

        .status-icon {
          font-size: var(--text-xl);
          flex-shrink: 0;
          margin-top: var(--space-1);
        }

        .status-content {
          flex: 1;
        }

        .status-title {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--cosmic-text);
          margin: 0 0 var(--space-1) 0;
          line-height: var(--leading-snug);
        }

        .status-message {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          margin: 0;
          font-weight: var(--font-light);
          line-height: var(--leading-relaxed);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .evolution-content {
            gap: var(--space-md);
          }

          .progress-info {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-1);
          }

          .progress-count {
            align-self: flex-end;
          }

          .theme-tags {
            gap: var(--space-1);
          }

          .evolution-status {
            padding: var(--space-3);
            gap: var(--space-2);
          }

          .status-icon {
            font-size: var(--text-lg);
          }

          .status-title {
            font-size: var(--text-xs);
          }

          .status-message {
            font-size: var(--text-xs);
          }
        }

        @media (max-width: 480px) {
          .evolution-progress {
            gap: var(--space-2);
          }

          .progress-bar {
            height: 6px;
          }

          .evolution-status {
            padding: var(--space-2) var(--space-3);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .progress-fill,
          .progress-fill::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </DashboardCard>
  );
};

export default EvolutionCard;
