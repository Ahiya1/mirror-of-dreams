'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  HeaderAction,
} from '@/components/dashboard/shared/DashboardCard';
import { CosmicLoader, GlowButton } from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

interface DreamsCardProps {
  animated?: boolean;
  className?: string;
}

/**
 * Active dreams card showing up to 3 active dreams
 */
const DreamsCard: React.FC<DreamsCardProps> = ({ animated = true, className = '' }) => {
  const router = useRouter();

  // Fetch active dreams from tRPC
  const { data: dreams, isLoading, error } = trpc.dreams.list.useQuery({
    status: 'active',
    includeStats: true,
  });

  const { data: limits } = trpc.dreams.getLimits.useQuery();

  const activeDreams = dreams?.slice(0, 3) || [];

  const handleReflectOnDream = (dreamId: string) => {
    router.push(`/reflection?dreamId=${dreamId}`);
  };

  // Category emoji mapping
  const categoryEmoji: Record<string, string> = {
    health: '🏃',
    career: '💼',
    relationships: '❤️',
    financial: '💰',
    personal_growth: '🌱',
    creative: '🎨',
    spiritual: '🙏',
    entrepreneurial: '🚀',
    educational: '📚',
    other: '⭐',
  };

  // Empty state component
  const EmptyState = () => (
    <div className="empty-state">
      <h4>Dream Big</h4>
      <p>Create your first dream and start reflecting.</p>
      <Link href="/dreams" className="cosmic-button cosmic-button--primary">
        <span>Create Dream</span>
      </Link>
    </div>
  );

  // Loading state component
  const LoadingState = () => (
    <div className="loading-dreams">
      <CosmicLoader size="md" label="Loading dreams" />
      <span>Loading your dreams...</span>
    </div>
  );

  return (
    <DashboardCard
      className={`dreams-card ${className}`}
      isLoading={isLoading}
      hasError={!!error}
      animated={animated}
      animationDelay={100}
      hoverable={true}
    >
      <CardHeader>
        <CardTitle>Active Dreams</CardTitle>
        <HeaderAction href="/dreams">
          View All <span>→</span>
        </HeaderAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : activeDreams.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="dreams-list">
            {activeDreams.map((dream: any, index: number) => {
              const emoji = categoryEmoji[dream.category || 'other'] || '⭐';
              const daysLeft = dream.daysLeft;

              return (
                <div
                  key={dream.id}
                  className="dream-item"
                  style={{
                    animationDelay: animated ? `${index * 100}ms` : undefined,
                  }}
                >
                  <Link href={`/dreams/${dream.id}`} className="dream-item__link">
                    <div className="dream-item__icon">{emoji}</div>
                    <div className="dream-item__content">
                      <div className="dream-item__title">{dream.title}</div>
                      <div className="dream-item__meta">
                        {daysLeft !== null && daysLeft !== undefined && (
                          <span className={`dream-item__days ${
                            daysLeft < 0
                              ? 'dream-item__days--overdue'
                              : daysLeft <= 7
                              ? 'dream-item__days--soon'
                              : 'dream-item__days--normal'
                          }`}>
                            {daysLeft < 0
                              ? `${Math.abs(daysLeft)}d overdue`
                              : daysLeft === 0
                              ? 'Today!'
                              : `${daysLeft}d left`}
                          </span>
                        )}
                        <span className="dream-item__reflections">
                          {dream.reflectionCount || 0} reflections
                        </span>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleReflectOnDream(dream.id);
                    }}
                    className="dream-item__cta cosmic-button cosmic-button--sm cosmic-button--cosmic"
                  >
                    Reflect
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Dream limit indicator */}
        {!isLoading && limits && (
          <div className="dream-limit">
            {limits.dreamsUsed} / {limits.dreamsLimit === 999999 ? '∞' : limits.dreamsLimit} dreams
          </div>
        )}
      </CardContent>

      {/* Card-specific styles */}
      <style jsx>{`
        .dreams-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          flex: 1;
          min-height: 150px;
        }

        .dream-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg);
          transition: all 0.2s ease;
          animation: dreamSlideIn 0.4s ease-out forwards;
          opacity: 0;
        }

        @keyframes dreamSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .dream-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(139, 92, 246, 0.3);
        }

        .dream-item__link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex: 1;
          text-decoration: none;
          color: var(--cosmic-text);
          min-width: 0;
        }

        .dream-item__link:hover .dream-item__title {
          color: var(--mirror-purple);
        }

        .dream-item__cta {
          flex-shrink: 0;
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-xs);
          white-space: nowrap;
        }

        .dream-item__icon {
          font-size: 1.75rem;
          flex-shrink: 0;
        }

        .dream-item__content {
          flex: 1;
          min-width: 0;
        }

        .dream-item__title {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--cosmic-text);
          margin-bottom: var(--space-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dream-item__meta {
          display: flex;
          gap: var(--space-3);
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
        }

        .dream-item__days {
          font-weight: var(--font-medium);
        }

        .dream-item__days--overdue {
          color: #ef4444;
        }

        .dream-item__days--soon {
          color: #fbbf24;
        }

        .dream-item__days--normal {
          color: #34d399;
        }

        .dream-item__reflections {
          color: rgba(139, 92, 246, 0.9);
        }

        .dream-limit {
          margin-top: var(--space-3);
          padding-top: var(--space-3);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
          font-weight: var(--font-medium);
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

        .loading-dreams {
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

        .loading-dreams span {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          font-weight: var(--font-light);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .dreams-list {
            gap: var(--space-2);
          }

          .dream-item {
            padding: var(--space-2);
          }

          .dream-item__icon {
            font-size: 1.5rem;
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
          .loading-dreams {
            padding: var(--space-lg) var(--space-sm);
          }

          .empty-state {
            padding: var(--space-md);
            gap: var(--space-3);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .empty-icon,
          .dream-item {
            animation: none !important;
          }
        }
      `}</style>
    </DashboardCard>
  );
};

export default DreamsCard;
