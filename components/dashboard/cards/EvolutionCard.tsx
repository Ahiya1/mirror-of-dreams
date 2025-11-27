'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
 * Evolution card component - Shows latest evolution report preview or eligibility status
 * Iteration 20: Rebuilt with real data integration
 */
const EvolutionCard: React.FC<EvolutionCardProps> = ({
  animated = true,
  className = '',
}) => {
  const router = useRouter();

  // Fetch latest evolution report
  const { data: reportsData, isLoading: reportsLoading } = trpc.evolution.list.useQuery({
    page: 1,
    limit: 1,
  });

  // Fetch eligibility status (simplified - just checking if user has any reports)
  const { data: eligibilityData, isLoading: eligibilityLoading } = trpc.evolution.checkEligibility.useQuery();

  const isLoading = reportsLoading || eligibilityLoading;
  const latestReport = reportsData?.reports?.[0];
  const hasReports = (reportsData?.total || 0) > 0;

  // Calculate progress (rough estimate based on eligibility)
  const progress = {
    current: 0,
    threshold: 4,
    percentage: 0,
  };

  if (eligibilityData && !hasReports) {
    // If no reports yet, show progress toward first report
    // This is a placeholder - ideally would get reflection count per dream
    progress.current = 0;
    progress.percentage = 0;
  }

  return (
    <DashboardCard
      className={`evolution-card ${className}`}
      isLoading={isLoading}
      animated={animated}
      animationDelay={300}
      hoverable={true}
    >
      <CardHeader>
        <CardTitle>Evolution Insights</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="evolution-content">
          {latestReport ? (
            /* Show Latest Report Preview */
            <div className="evolution-report-preview">
              <div
                onClick={() => router.push(`/evolution/${latestReport.id}`)}
                className="report-preview-card"
              >
                <div className="preview-header">
                  <span className="preview-label">Latest Report</span>
                  <span className="preview-date">
                    {new Date(latestReport.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <p className="preview-text">
                  {latestReport.evolution ? latestReport.evolution.substring(0, 200) + '...' : 'View report'}
                </p>

                <div className="preview-meta">
                  <span className="meta-item">
                    {latestReport.reflection_count} reflections analyzed
                  </span>
                  {latestReport.dreams && (
                    <span className="meta-item meta-item--dream">
                      {latestReport.dreams.title}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push('/evolution')}
                className="view-all-link"
              >
                View all reports →
              </button>
            </div>
          ) : (
            /* Show Eligibility Status / Empty State */
            <div className="evolution-empty-state">
              {eligibilityData?.eligible ? (
                <div className="evolution-status evolution-status--eligible">
                  <div className="status-content">
                    <h5 className="status-title">Ready to Generate</h5>
                    <p className="status-message">
                      You can generate your first evolution report based on your reflections.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="evolution-status evolution-status--ineligible">
                  <div className="status-content">
                    <h5 className="status-title">Keep Reflecting</h5>
                    <p className="status-message">
                      {eligibilityData?.reason ||
                        'Create at least 4 reflections on a dream to generate an evolution report.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Progress Bar (if not eligible and we have progress info) */}
              {!eligibilityData?.eligible && (
                <div className="evolution-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progress.percentage}%`,
                      }}
                    />
                  </div>
                  <div className="progress-info">
                    <span className="progress-label">Progress to First Report</span>
                    <span className="progress-count">
                      {progress.current} of {progress.threshold}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardActions>
        {hasReports ? (
          <button
            className="cosmic-button cosmic-button--secondary"
            onClick={() => router.push('/evolution')}
          >
            <span>View Reports</span>
          </button>
        ) : eligibilityData?.eligible ? (
          <button
            className="cosmic-button cosmic-button--primary"
            onClick={() => router.push('/evolution')}
          >
            <span>Generate Report</span>
          </button>
        ) : (
          <button
            className="cosmic-button cosmic-button--secondary"
            onClick={() => router.push('/dreams')}
          >
            <span>Create Reflections</span>
          </button>
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

        .evolution-report-preview {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .report-preview-card {
          padding: var(--space-4);
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .report-preview-card:hover {
          background: rgba(139, 92, 246, 0.12);
          border-color: rgba(139, 92, 246, 0.25);
          transform: translateY(-2px);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .preview-label {
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-medium);
        }

        .preview-date {
          font-size: var(--text-xs);
          color: var(--cosmic-text-secondary);
        }

        .preview-text {
          font-size: var(--text-sm);
          color: var(--cosmic-text);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-3);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .preview-meta {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .meta-item {
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
          padding: var(--space-1) var(--space-2);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
        }

        .meta-item--dream {
          color: rgba(167, 139, 250, 0.9);
          background: rgba(139, 92, 246, 0.15);
        }

        .view-all-link {
          font-size: var(--text-sm);
          color: rgba(139, 92, 246, 0.9);
          background: none;
          border: none;
          cursor: pointer;
          transition: var(--transition-smooth);
          padding: 0;
          text-align: left;
          font-weight: var(--font-medium);
        }

        .view-all-link:hover {
          color: rgba(167, 139, 250, 1);
        }

        .evolution-empty-state {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .evolution-progress {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
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

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-label {
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
          font-weight: var(--font-light);
        }

        .progress-count {
          font-size: var(--text-xs);
          color: var(--cosmic-text);
          font-weight: var(--font-medium);
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

        .evolution-status--eligible {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .evolution-status--ineligible {
          background: rgba(139, 92, 246, 0.08);
          border-color: rgba(139, 92, 246, 0.15);
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

          .preview-text {
            -webkit-line-clamp: 2;
          }

          .evolution-status {
            padding: var(--space-3);
            gap: var(--space-2);
          }

          .status-icon {
            font-size: var(--text-lg);
          }
        }

        @media (max-width: 480px) {
          .preview-meta {
            flex-direction: column;
            gap: var(--space-1);
          }

          .meta-item {
            display: inline-block;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .progress-fill::after {
            animation: none !important;
          }

          .report-preview-card {
            transition: none !important;
          }
        }
      `}</style>
    </DashboardCard>
  );
};

export default EvolutionCard;
