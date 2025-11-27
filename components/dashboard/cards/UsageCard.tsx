'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  CardActions,
  HeaderAction,
} from '@/components/dashboard/shared/DashboardCard';
import { trpc } from '@/lib/trpc';

interface UsageCardProps {
  animated?: boolean;
  className?: string;
}

/**
 * Simple usage card showing monthly reflection count
 * Simplified from complex progress ring to clear text display
 */
const UsageCard: React.FC<UsageCardProps> = ({ animated = true, className = '' }) => {
  // Fetch usage data from tRPC
  const { data, isLoading, error } = trpc.reflections.checkUsage.useQuery();

  // Calculate usage display
  const usageDisplay = useMemo(() => {
    if (!data) {
      return {
        currentCount: 0,
        limit: 1,
        displayLimit: '1',
        canReflect: true,
      };
    }

    const currentCount = data.used || 0;
    const isUnlimited = data.limit >= 999999;
    const displayLimit = isUnlimited ? '∞' : data.limit.toString();

    return {
      currentCount,
      limit: data.limit,
      displayLimit,
      canReflect: data.canReflect ?? true,
    };
  }, [data]);

  return (
    <DashboardCard
      className={`usage-card ${className}`}
      isLoading={isLoading}
      hasError={!!error}
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
        {/* Simple usage display - no progress ring */}
        <div className="usage-display">
          <p className="usage-text">
            {usageDisplay.currentCount} / {usageDisplay.displayLimit} reflections this month
          </p>
        </div>
      </CardContent>

      <CardActions>
        <Link
          href="/reflection"
          className="cosmic-button cosmic-button--primary"
        >
          <span>Create Reflection</span>
        </Link>
      </CardActions>

      {/* Card-specific styles */}
      <style jsx>{`
        .usage-display {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl) var(--space-lg);
        }

        .usage-text {
          font-size: var(--text-2xl);
          font-weight: var(--font-light);
          color: var(--cosmic-text);
          margin: 0;
          text-align: center;
          line-height: var(--leading-relaxed);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .usage-text {
            font-size: var(--text-xl);
          }
        }

        @media (max-width: 480px) {
          .usage-display {
            padding: var(--space-lg) var(--space-md);
          }

          .usage-text {
            font-size: var(--text-lg);
          }
        }
      `}</style>
    </DashboardCard>
  );
};

export default UsageCard;
