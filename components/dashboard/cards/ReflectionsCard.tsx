'use client';

import React from 'react';
import Link from 'next/link';
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  HeaderAction,
} from '@/components/dashboard/shared/DashboardCard';
import ReflectionItem from '@/components/dashboard/shared/ReflectionItem';
import { CosmicLoader } from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

interface ReflectionsCardProps {
  animated?: boolean;
  className?: string;
}

/**
 * Recent reflections card with staggered animations
 * Migrated from: src/components/dashboard/cards/ReflectionsCard.jsx
 */
const ReflectionsCard: React.FC<ReflectionsCardProps> = ({ animated = true, className = '' }) => {
  // Fetch recent reflections from tRPC
  const { data, isLoading, error } = trpc.reflections.list.useQuery({
    page: 1,
    limit: 3, // Only show 3 most recent
  });

  const reflections = data?.items || [];

  // Empty state component
  const EmptyState = () => (
    <div className="empty-state">
      <h4>No Reflections Yet</h4>
      <p>Create your first reflection to get started.</p>
      <Link href="/reflection" className="cosmic-button cosmic-button--primary">
        <span>Start Reflecting</span>
      </Link>
    </div>
  );

  // Loading state component
  const LoadingState = () => (
    <div className="loading-reflections">
      <CosmicLoader size="md" label="Loading reflections" />
      <span>Loading reflections...</span>
    </div>
  );

  return (
    <DashboardCard
      className={`reflections-card ${className}`}
      isLoading={isLoading}
      hasError={!!error}
      animated={animated}
      animationDelay={200}
      hoverable={true}
    >
      <CardHeader>
        <CardTitle>Recent Reflections</CardTitle>
        <HeaderAction href="/reflections">
          View All <span>→</span>
        </HeaderAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : reflections.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="reflections-list">
            {reflections.slice(0, 3).map((reflection, index) => (
              <ReflectionItem
                key={reflection.id || index}
                reflection={reflection}
                index={index}
                animated={animated}
                animationDelay={index * 100}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Card-specific styles */}
      <style jsx>{`
        .reflections-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          flex: 1;
          min-height: 200px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--space-xl) var(--space-lg);
          gap: var(--space-4);
          flex: 1;
          min-height: 200px;
        }

        .empty-icon {
          font-size: 3rem;
          opacity: 0.6;
          animation: emptyFloat 3s ease-in-out infinite;
          margin-bottom: var(--space-2);
        }

        @keyframes emptyFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .empty-state h4 {
          font-size: var(--text-lg);
          font-weight: var(--font-normal);
          margin: 0;
          color: var(--cosmic-text);
          line-height: var(--leading-tight);
        }

        .empty-state p {
          font-size: var(--text-sm);
          margin: 0;
          color: var(--cosmic-text-muted);
          line-height: var(--leading-relaxed);
          max-width: 280px;
        }

        .loading-reflections {
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

        .loading-reflections span {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          font-weight: var(--font-light);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .reflections-list {
            gap: var(--space-3);
          }

          .empty-state {
            padding: var(--space-lg) var(--space-md);
          }

          .empty-icon {
            font-size: 2.5rem;
          }

          .empty-state h4 {
            font-size: var(--text-base);
          }

          .empty-state p {
            font-size: var(--text-xs);
          }
        }

        @media (max-width: 480px) {
          .loading-reflections {
            padding: var(--space-lg) var(--space-sm);
          }

          .empty-state {
            padding: var(--space-md);
            gap: var(--space-3);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .empty-icon {
            animation: none !important;
          }
        }
      `}</style>
    </DashboardCard>
  );
};

export default ReflectionsCard;
