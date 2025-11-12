'use client';

import React from 'react';
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  CardActions,
} from '@/components/dashboard/shared/DashboardCard';
import { trpc } from '@/lib/trpc';

interface EvolutionCardProps {
  animated?: boolean;
  className?: string;
}

/**
 * Evolution card component - Fetches eligibility data independently
 * Full evolution functionality deferred to Iteration 20
 * Refactored: Builder-2 (Iteration 19) - Remove useDashboard dependency
 */
const EvolutionCard: React.FC<EvolutionCardProps> = ({
  animated = true,
  className = '',
}) => {
  // Fetch evolution eligibility directly
  const { data: evolutionData, isLoading } = trpc.evolution.checkEligibility.useQuery();

  // Placeholder progress (will be real data in Iteration 2)
  const progress = {
    current: 0,
    threshold: 4,
    percentage: 0,
  };

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
                  {progress.current} of {progress.threshold}
                </span>
              </div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress.percentage}%`,
                }}
              />
            </div>
          </div>

          {/* Coming Soon Status */}
          <div className="evolution-status evolution-status--coming-soon">
            <div className="status-icon">✨</div>
            <div className="status-content">
              <h5 className="status-title">Coming Soon</h5>
              <p className="status-message">
                Evolution insights will unlock deep patterns in your consciousness journey.
                Create more reflections to prepare for this powerful feature.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardActions>
        <button
          className="cosmic-button cosmic-button--secondary"
          disabled
          title="Evolution reports coming soon"
        >
          <span>🦋</span>
          <span>Generate Report</span>
        </button>
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
          content: '';
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

        .evolution-status {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          border-radius: var(--radius-xl);
          border: 1px solid transparent;
          transition: var(--transition-smooth);
        }

        .evolution-status--coming-soon {
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
