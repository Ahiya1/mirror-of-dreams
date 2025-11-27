'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cardPressVariants } from '@/lib/animations/variants';

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  hasError?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'default' | 'premium' | 'creator';
  animated?: boolean;
  animationDelay?: number;
  hoverable?: boolean;
  breathing?: boolean;
}

/**
 * Enhanced dashboard card with luxury glass morphism effects
 * Migrated from: src/components/dashboard/shared/DashboardCard.jsx
 */
const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  className = '',
  isLoading = false,
  hasError = false,
  onClick,
  variant = 'default',
  animated = true,
  animationDelay = 0,
  hoverable = true,
  breathing = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Animation entrance effect
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, animationDelay);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animated, animationDelay]);

  // Handle mouse interactions
  const handleMouseEnter = () => {
    if (hoverable) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (hoverable) {
      setIsHovered(false);
    }
  };

  // Handle click with ripple effect
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      // Add ripple effect
      const card = cardRef.current;
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Create ripple element
        const ripple = document.createElement('div');
        ripple.className = 'dashboard-card-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        card.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
          if (card.contains(ripple)) {
            card.removeChild(ripple);
          }
        }, 600);
      }

      onClick(e);
    }
  };

  // Build CSS classes
  const cardClasses = [
    'dashboard-card',
    `dashboard-card--${variant}`,
    className,
    isVisible && animated ? 'dashboard-card--visible' : '',
    isHovered ? 'dashboard-card--hovered' : '',
    isLoading ? 'dashboard-card--loading' : '',
    hasError ? 'dashboard-card--error' : '',
    onClick ? 'dashboard-card--clickable' : '',
    breathing ? 'dashboard-card--breathing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      ref={cardRef}
      className={cardClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        animationDelay: animated ? `${animationDelay}ms` : undefined,
      }}
      // Apply card press animation (respects reduced motion)
      variants={prefersReducedMotion || !onClick ? undefined : cardPressVariants}
      initial={prefersReducedMotion || !onClick ? false : 'rest'}
      whileTap={prefersReducedMotion || !onClick ? undefined : 'tap'}
    >
      {/* Background gradient overlay */}
      <div className="dashboard-card__gradient" />

      {/* Shimmer effect */}
      <div className="dashboard-card__shimmer" />

      {/* Content */}
      <div className="dashboard-card__content">{children}</div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="dashboard-card__loading">
          <div className="dashboard-card__spinner" />
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="dashboard-card__error">
          <div className="dashboard-card__error-icon">⚠️</div>
          <div className="dashboard-card__error-text">Unable to load data</div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Card header component
 */
export const CardHeader: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`dashboard-card__header ${className}`}>
    {children}
  </div>
);

/**
 * Card title component
 */
export const CardTitle: React.FC<{ children: ReactNode; icon?: ReactNode; className?: string }> = ({
  children,
  icon,
  className = '',
}) => (
  <h3 className={`dashboard-card__title ${className}`}>
    {icon && <span className="dashboard-card__title-icon">{icon}</span>}
    <span className="dashboard-card__title-text">{children}</span>
  </h3>
);

/**
 * Card content component
 */
export const CardContent: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`dashboard-card__content-inner ${className}`}>
    {children}
  </div>
);

/**
 * Card actions component
 */
export const CardActions: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`dashboard-card__actions ${className}`}>
    {children}
  </div>
);

/**
 * Header action component (for top-right actions)
 */
export const HeaderAction: React.FC<{
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}> = ({ children, onClick, href, className = '' }) => {
  const Component = href ? 'a' : 'button';

  return (
    <Component
      className={`dashboard-card__header-action ${className}`}
      onClick={onClick}
      href={href}
    >
      {children}
    </Component>
  );
};

export default DashboardCard;
