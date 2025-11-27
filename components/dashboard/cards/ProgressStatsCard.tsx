'use client';

import React from 'react';
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/dashboard/shared/DashboardCard';
import { CosmicLoader } from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

interface ProgressStatsCardProps {
  animated?: boolean;
  className?: string;
}

/**
 * Progress Stats Card
 *
 * Displays monthly reflection count and other progress indicators
 * Self-contained with own tRPC query (parallel loading)
 */
const ProgressStatsCard: React.FC<ProgressStatsCardProps> = ({
  animated = true,
  className = '',
}) => {
  // Fetch user's reflections to calculate stats
  const { data, isLoading, error } = trpc.reflections.list.useQuery({
    page: 1,
    limit: 100, // Get enough to calculate monthly stats
  });

  // Calculate this month's reflections
  const calculateMonthlyStats = () => {
    if (!data?.items) return { thisMonth: 0, total: data?.total || 0 };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = data.items.filter((reflection) => {
      const createdAt = new Date(reflection.createdAt);
      return createdAt >= startOfMonth;
    }).length;

    return {
      thisMonth,
      total: data.total || data.items.length,
    };
  };

  const stats = !isLoading ? calculateMonthlyStats() : { thisMonth: 0, total: 0 };

  // Loading state component
  const LoadingState = () => (
    <div className="loading-stats">
      <CosmicLoader size="md" label="Loading stats" />
      <span>Loading progress...</span>
    </div>
  );

  return (
    <DashboardCard
      className={`progress-stats-card ${className}`}
      isLoading={isLoading}
      hasError={!!error}
      animated={animated}
      animationDelay={300}
      hoverable={false}
    >
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="stats-container">
            {/* Primary stat: This month */}
            <div className="stat-primary">
              <div className="stat-primary__value">
                {stats.thisMonth}
              </div>
              <div className="stat-primary__label">
                reflections this month
              </div>
            </div>

            {/* Secondary stats */}
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-item__value">{stats.total}</div>
                <div className="stat-item__label">Total Reflections</div>
              </div>

              <div className="stat-item">
                <div className="stat-item__value">
                  {stats.thisMonth > 0 ? '🔥' : '💫'}
                </div>
                <div className="stat-item__label">
                  {stats.thisMonth > 0
                    ? `${stats.thisMonth} day${stats.thisMonth > 1 ? 's' : ''} active`
                    : 'Start your streak'}
                </div>
              </div>
            </div>

            {/* Motivational message */}
            {stats.thisMonth === 0 && (
              <div className="motivation-message">
                <p>Begin your reflection journey this month</p>
              </div>
            )}
            {stats.thisMonth > 0 && stats.thisMonth < 5 && (
              <div className="motivation-message">
                <p>Great start! Keep the momentum going</p>
              </div>
            )}
            {stats.thisMonth >= 5 && stats.thisMonth < 10 && (
              <div className="motivation-message">
                <p>Amazing progress! You're building a powerful habit</p>
              </div>
            )}
            {stats.thisMonth >= 10 && (
              <div className="motivation-message motivation-message--special">
                <p>✨ Incredible dedication! You're truly transforming ✨</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Card-specific styles */}
      <style jsx>{`
        .stats-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          flex: 1;
          min-height: 200px;
        }

        .stat-primary {
          text-align: center;
          padding: var(--space-lg) 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stat-primary__value {
          font-size: 4rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: var(--space-sm);
          animation: statPulse 2s ease-in-out infinite;
        }

        @keyframes statPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        .stat-primary__label {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          font-weight: 500;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .stat-item {
          text-align: center;
          padding: var(--space-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }

        .stat-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(139, 92, 246, 0.2);
        }

        .stat-item__value {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--cosmic-text);
          margin-bottom: var(--space-xs);
        }

        .stat-item__label {
          font-size: var(--text-xs);
          color: var(--cosmic-text-secondary);
        }

        .motivation-message {
          text-align: center;
          padding: var(--space-md);
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.1);
          border-radius: var(--radius-lg);
          margin-top: auto;
        }

        .motivation-message p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          font-style: italic;
        }

        .motivation-message--special {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
          border-color: rgba(139, 92, 246, 0.3);
          animation: specialGlow 3s ease-in-out infinite;
        }

        @keyframes specialGlow {
          0%, 100% {
            box-shadow: 0 0 0 rgba(139, 92, 246, 0);
          }
          50% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
          }
        }

        .motivation-message--special p {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
        }

        .loading-stats {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-xl);
          color: var(--cosmic-text-muted);
          text-align: center;
          flex: 1;
          min-height: 200px;
        }

        .loading-stats span {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          font-weight: var(--font-light);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .stat-primary__value {
            font-size: 3rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: var(--space-sm);
          }

          .stat-item {
            padding: var(--space-sm);
          }

          .motivation-message {
            padding: var(--space-sm);
          }

          .motivation-message p {
            font-size: var(--text-xs);
          }
        }

        @media (max-width: 480px) {
          .stat-primary {
            padding: var(--space-md) 0;
          }

          .stat-primary__value {
            font-size: 2.5rem;
          }

          .loading-stats {
            padding: var(--space-lg) var(--space-sm);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .stat-primary__value,
          .motivation-message--special {
            animation: none !important;
          }
        }
      `}</style>
    </DashboardCard>
  );
};

export default ProgressStatsCard;
