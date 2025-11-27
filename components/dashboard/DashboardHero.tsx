'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { GlowButton } from '@/components/ui/glass';

/**
 * Dashboard Hero Section
 *
 * Features:
 * - Time-based personalized greeting (Good morning/afternoon/evening)
 * - Primary "Reflect Now" CTA (cosmic styling)
 * - Motivational copy based on user state
 * - Disabled state when no active dreams exist
 */

const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
};

export const DashboardHero: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dreams } = trpc.dreams.list.useQuery({ status: 'active' });

  const timeOfDay = getTimeOfDay();
  const firstName = user?.name?.split(' ')[0] || user?.name || 'Dreamer';
  const hasActiveDreams = dreams && dreams.length > 0;

  const getMotivationalCopy = (): string => {
    if (!hasActiveDreams) {
      return "Create your first dream to begin your journey of transformation";
    }
    return "Your dreams await your reflection";
  };

  const handleReflectNow = () => {
    if (hasActiveDreams) {
      router.push('/reflection');
    }
  };

  return (
    <div className="dashboard-hero">
      <div className="dashboard-hero__content">
        <h1 className="dashboard-hero__title">
          <span className="dashboard-hero__greeting">Good {timeOfDay},</span>{' '}
          <span className="dashboard-hero__name">{firstName}</span>
          <span className="dashboard-hero__sparkle">✨</span>
        </h1>

        <p className="dashboard-hero__subtitle">
          {getMotivationalCopy()}
        </p>

        <div className="dashboard-hero__actions">
          <GlowButton
            variant="cosmic"
            size="lg"
            onClick={handleReflectNow}
            disabled={!hasActiveDreams}
            className="dashboard-hero__cta"
          >
            Reflect Now
          </GlowButton>

          {!hasActiveDreams && (
            <p className="dashboard-hero__hint">
              <Link href="/dreams" className="dashboard-hero__hint-link">
                Create a dream
              </Link>{' '}
              to start reflecting
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-hero {
          text-align: center;
          padding: var(--space-3xl) var(--space-lg);
          max-width: 800px;
          margin: 0 auto;
        }

        .dashboard-hero__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xl);
        }

        .dashboard-hero__title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 700;
          line-height: 1.2;
          margin: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(139, 92, 246, 0.9) 50%,
            rgba(168, 85, 247, 0.85) 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: heroGradientShift 8s ease-in-out infinite;
        }

        @keyframes heroGradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .dashboard-hero__greeting {
          display: inline-block;
        }

        .dashboard-hero__name {
          display: inline-block;
          font-weight: 800;
        }

        .dashboard-hero__sparkle {
          display: inline-block;
          animation: sparkleFloat 3s ease-in-out infinite;
        }

        @keyframes sparkleFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(10deg);
          }
        }

        .dashboard-hero__subtitle {
          font-size: var(--text-lg);
          color: var(--cosmic-text-muted);
          margin: 0;
          max-width: 600px;
          line-height: 1.6;
        }

        .dashboard-hero__actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }

        .dashboard-hero__cta {
          min-width: 240px;
        }

        .dashboard-hero__hint {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          margin: 0;
        }

        .dashboard-hero__hint-link {
          color: var(--mirror-purple);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .dashboard-hero__hint-link:hover {
          color: var(--mirror-violet);
          text-decoration: underline;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .dashboard-hero {
            padding: var(--space-2xl) var(--space-md);
          }

          .dashboard-hero__content {
            gap: var(--space-lg);
          }

          .dashboard-hero__title {
            font-size: clamp(1.75rem, 6vw, 2.5rem);
          }

          .dashboard-hero__subtitle {
            font-size: var(--text-base);
          }

          .dashboard-hero__cta {
            min-width: 200px;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .dashboard-hero {
            padding: var(--space-xl) var(--space-sm);
          }

          .dashboard-hero__title {
            font-size: clamp(1.5rem, 7vw, 2rem);
          }

          .dashboard-hero__subtitle {
            font-size: var(--text-sm);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .dashboard-hero__title,
          .dashboard-hero__sparkle {
            animation: none !important;
          }

          .dashboard-hero__title {
            background: var(--cosmic-text);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardHero;
