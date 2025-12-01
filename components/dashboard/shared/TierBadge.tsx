'use client';

import React from 'react';

interface TierBadgeProps {
  tier?: 'free' | 'pro' | 'unlimited' | 'essential' | 'premium' | 'creator';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showGlow?: boolean;
  showIcon?: boolean;
  className?: string;
}

/**
 * Tier badge component with glow effects and animations
 * Migrated from: src/components/dashboard/shared/TierBadge.jsx
 */
const TierBadge: React.FC<TierBadgeProps> = ({
  tier = 'free',
  size = 'md',
  animated = true,
  showGlow = false,
  showIcon = true,
  className = '',
}) => {
  // Tier configurations
  const tierConfigs = {
    free: {
      name: 'Free',
      icon: '👤',
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.9)',
      glow: 'rgba(255, 255, 255, 0.15)',
    },
    pro: {
      name: 'Pro',
      icon: '✨',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))',
      border: 'rgba(16, 185, 129, 0.3)',
      color: 'rgba(110, 231, 183, 0.9)',
      glow: 'rgba(16, 185, 129, 0.3)',
    },
    unlimited: {
      name: 'Unlimited',
      icon: '💎',
      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.15))',
      border: 'rgba(147, 51, 234, 0.3)',
      color: 'rgba(196, 181, 253, 0.9)',
      glow: 'rgba(147, 51, 234, 0.4)',
    },
    // Legacy tiers (for backward compatibility)
    essential: {
      name: 'Essential',
      icon: '✨',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))',
      border: 'rgba(16, 185, 129, 0.3)',
      color: 'rgba(110, 231, 183, 0.9)',
      glow: 'rgba(16, 185, 129, 0.3)',
    },
    premium: {
      name: 'Premium',
      icon: '💎',
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.15))',
      border: 'rgba(245, 158, 11, 0.3)',
      color: 'rgba(251, 191, 36, 0.9)',
      glow: 'rgba(245, 158, 11, 0.4)',
    },
    creator: {
      name: 'Creator',
      icon: '🌟',
      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.15))',
      border: 'rgba(147, 51, 234, 0.3)',
      color: 'rgba(196, 181, 253, 0.9)',
      glow: 'rgba(147, 51, 234, 0.4)',
    },
  };

  const config = tierConfigs[tier];

  // Size configurations
  const sizeConfigs = {
    sm: {
      padding: 'var(--space-1) var(--space-2)',
      fontSize: '10px',
      iconSize: '12px',
      borderRadius: 'var(--radius-lg)',
    },
    md: {
      padding: 'var(--space-2) var(--space-4)',
      fontSize: 'var(--text-xs)',
      iconSize: 'var(--text-sm)',
      borderRadius: 'var(--radius-xl)',
    },
    lg: {
      padding: 'var(--space-3) var(--space-5)',
      fontSize: 'var(--text-sm)',
      iconSize: 'var(--text-base)',
      borderRadius: 'var(--radius-2xl)',
    },
    xl: {
      padding: 'var(--space-4) var(--space-6)',
      fontSize: 'var(--text-base)',
      iconSize: 'var(--text-lg)',
      borderRadius: 'var(--radius-3xl)',
    },
  };

  const sizeConfig = sizeConfigs[size];

  return (
    <div
      className={`tier-badge tier-badge--${tier} tier-badge--${size} ${
        showGlow ? 'tier-badge--glow' : ''
      } ${className}`}
      style={{
        padding: sizeConfig.padding,
        background: config.background,
        border: `1px solid ${config.border}`,
        borderRadius: sizeConfig.borderRadius,
        color: config.color,
        fontSize: sizeConfig.fontSize,
      }}
    >
      {showIcon && (
        <span className="tier-icon" style={{ fontSize: sizeConfig.iconSize }}>
          {config.icon}
        </span>
      )}
      <span className="tier-name">{config.name}</span>
      {showGlow && <div className="tier-glow" style={{ borderRadius: sizeConfig.borderRadius }} />}
    </div>
  );
};

export default TierBadge;
