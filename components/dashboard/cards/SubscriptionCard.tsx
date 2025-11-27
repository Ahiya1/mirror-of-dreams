'use client';

import React from 'react';
import Link from 'next/link';
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  CardActions,
} from '@/components/dashboard/shared/DashboardCard';
import TierBadge from '@/components/dashboard/shared/TierBadge';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionCardProps {
  isLoading?: boolean;
  animated?: boolean;
  className?: string;
}

interface TierInfo {
  name: string;
  description: string;
  benefits: string[];
  color: string;
  nextTier: string | null;
}

interface SubscriptionAction {
  type: 'upgrade' | 'manage';
  text: string;
  href: string;
  icon: string;
  color: string;
}

/**
 * Subscription card component with tier display and upgrade actions
 * Migrated from: src/components/dashboard/cards/SubscriptionCard.jsx
 */
const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  isLoading = false,
  animated = true,
  className = '',
}) => {
  const { user } = useAuth();

  // User data with fallbacks
  const userData = {
    tier: (user?.tier || 'free') as 'free' | 'essential' | 'premium' | 'creator',
    subscriptionStatus: user?.subscriptionStatus || 'active',
    isCreator: user?.isCreator || false,
  };

  /**
   * Get tier information and benefits
   */
  const getTierInfo = (): TierInfo => {
    const tierInfo: Record<string, TierInfo> = {
      free: {
        name: 'Free',
        description: '1 reflection per month to get started',
        benefits: [
          '1 monthly reflection',
          'Basic mirror experience',
          'Community access',
        ],
        color: 'default',
        nextTier: 'essential',
      },
      essential: {
        name: 'Essential',
        description: '5 reflections monthly + Evolution Reports to track growth',
        benefits: [
          '5 monthly reflections',
          'Evolution reports',
          'Pattern insights',
          'Priority support',
        ],
        color: 'success',
        nextTier: 'premium',
      },
      premium: {
        name: 'Premium',
        description: '10 reflections monthly + Advanced Evolution Insights',
        benefits: [
          '10 monthly reflections',
          'Advanced evolution analytics',
          'Deep pattern analysis',
          'Premium themes',
          'Early access features',
        ],
        color: 'fusion',
        nextTier: 'creator',
      },
      creator: {
        name: 'Creator',
        description: 'Unlimited reflections and full access to all features',
        benefits: [
          'Unlimited reflections',
          'Creator dashboard',
          'Advanced analytics',
          'All premium features',
          'Direct support',
        ],
        color: 'intense',
        nextTier: null,
      },
    };

    return tierInfo[userData.tier] || tierInfo.free;
  };

  const tierInfo = getTierInfo();

  /**
   * Get subscription action based on current tier
   */
  const getSubscriptionAction = (): SubscriptionAction => {
    if (userData.isCreator) {
      return {
        type: 'manage',
        text: 'Creator Dashboard',
        href: '/creator',
        icon: '',
        color: 'intense',
      };
    }

    if (userData.tier === 'free') {
      return {
        type: 'upgrade',
        text: 'Upgrade Plan',
        href: '/subscription',
        icon: '',
        color: 'primary',
      };
    }

    if (userData.tier === 'essential') {
      return {
        type: 'upgrade',
        text: 'Upgrade to Premium',
        href: '/subscription?tier=premium',
        icon: '',
        color: 'fusion',
      };
    }

    if (userData.tier === 'premium') {
      return {
        type: 'upgrade',
        text: 'Become Creator',
        href: '/subscription?tier=creator',
        icon: '',
        color: 'intense',
      };
    }

    return {
      type: 'manage',
      text: 'Manage Plan',
      href: '/subscription',
      icon: '',
      color: 'secondary',
    };
  };

  const subscriptionAction = getSubscriptionAction();

  /**
   * Get upgrade benefits for current tier
   */
  const getUpgradeBenefits = (): string[] => {
    if (!tierInfo.nextTier) return [];

    const allTierInfo: Record<string, TierInfo> = {
      free: getTierInfo(),
      essential: getTierInfo(),
      premium: getTierInfo(),
      creator: getTierInfo(),
    };

    const nextTierInfo = allTierInfo[tierInfo.nextTier];
    if (!nextTierInfo) return [];

    // Return benefits that are new in the next tier
    return nextTierInfo.benefits.slice(tierInfo.benefits.length);
  };

  const upgradeBenefits = getUpgradeBenefits();

  return (
    <DashboardCard
      className={`subscription-card ${className}`}
      isLoading={isLoading}
      animated={animated}
      animationDelay={400}
      hoverable={true}
    >
      <CardHeader>
        <CardTitle>Your Plan</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="subscription-content">
          {/* Current Tier Display */}
          <div className="tier-display">
            <TierBadge
              tier={userData.tier}
              size="lg"
              animated={animated}
              showGlow={true}
            />

            <div className="tier-description">{tierInfo.description}</div>
          </div>

          {/* Current Benefits */}
          <div className="benefits-section">
            <h5 className="benefits-title">Current Benefits</h5>
            <div className="benefits-list">
              {tierInfo.benefits.map((benefit, index) => (
                <div
                  key={benefit}
                  className="benefit-item"
                  style={{
                    animationDelay: animated ? `${(index + 1) * 100}ms` : '0ms',
                  }}
                >
                  <span className="benefit-icon">✓</span>
                  <span className="benefit-text">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Preview */}
          {upgradeBenefits.length > 0 && (
            <div className="upgrade-preview">
              <h5 className="upgrade-title">
                Available with {tierInfo.nextTier === 'creator' ? 'Creator' : 'Premium'}
              </h5>
              <div className="upgrade-benefits">
                {upgradeBenefits.slice(0, 3).map((benefit, index) => (
                  <div
                    key={benefit}
                    className="upgrade-benefit"
                    style={{
                      animationDelay: animated ? `${(index + 4) * 100}ms` : '0ms',
                    }}
                  >
                    <span className="upgrade-icon">+</span>
                    <span className="upgrade-text">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardActions>
        <Link
          href={subscriptionAction.href}
          className={`cosmic-button cosmic-button--${subscriptionAction.color}`}
        >
          {subscriptionAction.icon && <span>{subscriptionAction.icon}</span>}
          <span>{subscriptionAction.text}</span>
        </Link>
      </CardActions>

      {/* Card-specific styles */}
      <style jsx>{`
        .subscription-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          flex: 1;
        }

        .tier-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-4);
          padding: var(--space-lg) 0;
        }

        .tier-description {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          line-height: var(--leading-relaxed);
          text-align: center;
          max-width: 280px;
          font-weight: var(--font-light);
        }

        .benefits-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .benefits-title {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          margin: 0;
          font-weight: var(--font-medium);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
        }

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          opacity: 0;
          transform: translateX(-10px);
          animation: ${animated ? 'benefitSlide 0.5s ease-out forwards' : 'none'};
        }

        @keyframes benefitSlide {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .benefit-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: rgba(16, 185, 129, 0.2);
          color: rgba(110, 231, 183, 0.9);
          border-radius: 50%;
          font-size: 10px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .benefit-text {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          font-weight: var(--font-light);
          line-height: var(--leading-snug);
        }

        .upgrade-preview {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          padding: var(--space-4);
          background: rgba(147, 51, 234, 0.05);
          border: 1px solid rgba(147, 51, 234, 0.1);
          border-radius: var(--radius-xl);
        }

        .upgrade-title {
          font-size: var(--text-sm);
          color: var(--cosmic-text);
          margin: 0;
          font-weight: var(--font-medium);
          text-align: center;
        }

        .upgrade-benefits {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .upgrade-benefit {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          opacity: 0;
          transform: translateX(-10px);
          animation: ${animated ? 'upgradeSlide 0.5s ease-out forwards' : 'none'};
        }

        @keyframes upgradeSlide {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .upgrade-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: rgba(147, 51, 234, 0.2);
          color: rgba(196, 181, 253, 0.9);
          border-radius: 50%;
          font-size: 12px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .upgrade-text {
          font-size: var(--text-sm);
          color: var(--cosmic-text);
          font-weight: var(--font-normal);
          line-height: var(--leading-snug);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .subscription-content {
            gap: var(--space-md);
          }

          .tier-display {
            padding: var(--space-md) 0;
            gap: var(--space-3);
          }

          .tier-description {
            font-size: var(--text-xs);
            max-width: 240px;
          }

          .benefits-title,
          .upgrade-title {
            font-size: var(--text-xs);
          }

          .benefit-text,
          .upgrade-text {
            font-size: var(--text-xs);
          }

          .upgrade-preview {
            padding: var(--space-3);
          }
        }

        @media (max-width: 480px) {
          .tier-display {
            padding: var(--space-sm) 0;
          }

          .benefits-section,
          .upgrade-preview {
            gap: var(--space-2);
          }

          .benefit-item,
          .upgrade-benefit {
            gap: var(--space-2);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .benefit-item,
          .upgrade-benefit {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </DashboardCard>
  );
};

export default SubscriptionCard;
