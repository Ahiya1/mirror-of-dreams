'use client';

import React from 'react';
import Link from 'next/link';
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  HeaderAction,
} from '@/components/dashboard/shared/DashboardCard';
import { CosmicLoader, GlowButton } from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { CLARIFY_SESSION_LIMITS } from '@/lib/utils/constants';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Sparkles } from 'lucide-react';

interface ClarifyCardProps {
  animated?: boolean;
  className?: string;
}

/**
 * Clarify sessions card for dashboard
 * Only shown to paid users (Pro/Unlimited)
 */
const ClarifyCard: React.FC<ClarifyCardProps> = ({ animated = true, className = '' }) => {
  const { user } = useAuth();

  // Don't render for free tier
  if (!user || (user.tier === 'free' && !user.isCreator && !user.isAdmin)) {
    return null;
  }

  // Fetch limits and recent sessions
  const { data: limits, isLoading: limitsLoading } = trpc.clarify.getLimits.useQuery();
  const { data: sessionsData, isLoading: sessionsLoading } = trpc.clarify.listSessions.useQuery({
    status: 'active',
    limit: 3,
  });

  const isLoading = limitsLoading || sessionsLoading;
  const sessions = sessionsData?.sessions || [];
  const limit = CLARIFY_SESSION_LIMITS[user.tier];

  // Empty state
  const EmptyState = () => (
    <div className="empty-state">
      <Sparkles className="w-8 h-8 text-purple-400/60 mb-2" />
      <h4>Start Exploring</h4>
      <p>Begin a Clarify session to explore what's emerging.</p>
      <Link href="/clarify">
        <GlowButton variant="cosmic" size="sm">Start Session</GlowButton>
      </Link>
    </div>
  );

  return (
    <DashboardCard
      className={`clarify-card ${className}`}
      isLoading={isLoading}
      animated={animated}
      animationDelay={300}
      hoverable={true}
    >
      <CardHeader>
        <CardTitle>
          <MessageCircle className="w-5 h-5 inline-block mr-2 text-purple-400" />
          Clarify Sessions
        </CardTitle>
        <HeaderAction href="/clarify">
          View All <span className="ml-1">-&gt;</span>
        </HeaderAction>
      </CardHeader>

      <CardContent>
        {/* Usage indicator */}
        <div className="usage-bar">
          <div className="usage-text">
            <span className="usage-count">{limits?.sessionsUsed || 0}</span>
            <span className="usage-limit"> / {limit} this month</span>
          </div>
          <div className="usage-progress">
            <div
              className="usage-fill"
              style={{
                width: `${Math.min(100, ((limits?.sessionsUsed || 0) / limit) * 100)}%`
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <CosmicLoader size="sm" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/clarify/${session.id}`}
                className="session-item"
              >
                <div className="session-title">{session.title}</div>
                <div className="session-meta">
                  {session.messageCount} messages
                  <span className="session-dot">.</span>
                  {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <style jsx>{`
        .usage-bar {
          margin-bottom: var(--space-4);
        }

        .usage-text {
          display: flex;
          align-items: baseline;
          margin-bottom: var(--space-2);
        }

        .usage-count {
          font-size: var(--text-2xl);
          font-weight: var(--font-semibold);
          color: var(--cosmic-text);
        }

        .usage-limit {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          margin-left: var(--space-1);
        }

        .usage-progress {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--purple-500), var(--purple-400));
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .session-item {
          display: block;
          padding: var(--space-3);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg);
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .session-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .session-title {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--cosmic-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: var(--space-1);
        }

        .session-meta {
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
        }

        .session-dot {
          margin: 0 var(--space-1);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--space-lg) var(--space-md);
          min-height: 150px;
        }

        .empty-state h4 {
          font-size: var(--text-base);
          color: var(--cosmic-text);
          margin: var(--space-2) 0;
        }

        .empty-state p {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          margin-bottom: var(--space-4);
        }

        .loading-state {
          display: flex;
          justify-content: center;
          padding: var(--space-lg);
        }
      `}</style>
    </DashboardCard>
  );
};

export default ClarifyCard;
