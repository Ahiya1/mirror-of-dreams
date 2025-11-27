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

interface VisualizationCardProps {
  animated?: boolean;
  className?: string;
}

const styleIcons: Record<string, string> = {
  achievement: '🏔️',
  spiral: '🌀',
  synthesis: '🌌',
};

/**
 * Visualization card component - Shows latest visualization preview
 * Iteration 20: New component for dashboard integration
 */
const VisualizationCard: React.FC<VisualizationCardProps> = ({
  animated = true,
  className = '',
}) => {
  const router = useRouter();

  // Fetch latest visualization
  const { data: visualizationsData, isLoading } = trpc.visualizations.list.useQuery({
    page: 1,
    limit: 1,
  });

  const latestVisualization = visualizationsData?.items?.[0];
  const hasVisualizations = (visualizationsData?.total || 0) > 0;

  return (
    <DashboardCard
      className={`visualization-card ${className}`}
      isLoading={isLoading}
      animated={animated}
      animationDelay={400}
      hoverable={true}
    >
      <CardHeader>
        <CardTitle>Visualizations</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="visualization-content">
          {latestVisualization ? (
            /* Show Latest Visualization Preview */
            <div className="visualization-preview">
              <div
                onClick={() => router.push(`/visualizations/${latestVisualization.id}`)}
                className="viz-preview-card"
              >
                <div className="preview-header">
                  <div className="preview-label-group">
                    <span className="preview-icon">
                      {styleIcons[latestVisualization.style] || '🌌'}
                    </span>
                    <span className="preview-label">
                      {latestVisualization.style.charAt(0).toUpperCase() + latestVisualization.style.slice(1)} Style
                    </span>
                  </div>
                  <span className="preview-date">
                    {new Date(latestVisualization.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <p className="preview-text">
                  {latestVisualization.narrative
                    ? latestVisualization.narrative.substring(0, 150) + '...'
                    : 'View visualization'}
                </p>

                <div className="preview-meta">
                  <span className="meta-item">
                    {latestVisualization.reflection_count} reflections
                  </span>
                  {latestVisualization.dreams && (
                    <span className="meta-item meta-item--dream">
                      {latestVisualization.dreams.title}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push('/visualizations')}
                className="view-all-link"
              >
                View all visualizations →
              </button>
            </div>
          ) : (
            /* Show Empty State */
            <div className="visualization-empty-state">
              <div className="viz-status">
                <div className="status-content">
                  <h5 className="status-title">Create Your First Visualization</h5>
                  <p className="status-message">
                    Generate your first visualization to experience your dream as already achieved.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardActions>
        {hasVisualizations ? (
          <button
            className="cosmic-button cosmic-button--secondary"
            onClick={() => router.push('/visualizations')}
          >
            <span>View All</span>
          </button>
        ) : (
          <button
            className="cosmic-button cosmic-button--primary"
            onClick={() => router.push('/visualizations')}
          >
            <span>Create Visualization</span>
          </button>
        )}
      </CardActions>

      {/* Card-specific styles */}
      <style jsx>{`
        .visualization-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          flex: 1;
        }

        .visualization-preview {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .viz-preview-card {
          padding: var(--space-4);
          background: rgba(236, 72, 153, 0.08);
          border: 1px solid rgba(236, 72, 153, 0.15);
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .viz-preview-card:hover {
          background: rgba(236, 72, 153, 0.12);
          border-color: rgba(236, 72, 153, 0.25);
          transform: translateY(-2px);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .preview-label-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .preview-icon {
          font-size: var(--text-lg);
        }

        .preview-label {
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
          text-transform: capitalize;
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
          color: rgba(244, 114, 182, 0.9);
          background: rgba(236, 72, 153, 0.15);
        }

        .view-all-link {
          font-size: var(--text-sm);
          color: rgba(236, 72, 153, 0.9);
          background: none;
          border: none;
          cursor: pointer;
          transition: var(--transition-smooth);
          padding: 0;
          text-align: left;
          font-weight: var(--font-medium);
        }

        .view-all-link:hover {
          color: rgba(244, 114, 182, 1);
        }

        .visualization-empty-state {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .viz-status {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          border-radius: var(--radius-xl);
          background: rgba(236, 72, 153, 0.08);
          border: 1px solid rgba(236, 72, 153, 0.15);
          transition: var(--transition-smooth);
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
          .visualization-content {
            gap: var(--space-md);
          }

          .preview-text {
            -webkit-line-clamp: 2;
          }

          .viz-status {
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

          .preview-label-group {
            gap: var(--space-1);
          }

          .preview-icon {
            font-size: var(--text-base);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .viz-preview-card {
            transition: none !important;
          }
        }
      `}</style>
    </DashboardCard>
  );
};

export default VisualizationCard;
