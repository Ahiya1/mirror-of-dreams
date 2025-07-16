// src/components/dashboard/shared/DashboardCard.jsx - Enhanced glass morphism base component

import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * Enhanced dashboard card with luxury glass morphism effects
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.hasError - Error state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.variant - Card variant (default, premium, creator)
 * @param {boolean} props.animated - Enable entrance animation
 * @param {number} props.animationDelay - Animation delay in ms
 * @param {boolean} props.hoverable - Enable hover effects
 * @param {boolean} props.breathing - Enable breathing animation
 * @returns {JSX.Element} - Dashboard card component
 */
const DashboardCard = ({
  children,
  className = "",
  isLoading = false,
  hasError = false,
  onClick,
  variant = "default",
  animated = true,
  animationDelay = 0,
  hoverable = true,
  breathing = false,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

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
  const handleClick = (e) => {
    if (onClick) {
      // Add ripple effect
      const card = cardRef.current;
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Create ripple element
        const ripple = document.createElement("div");
        ripple.className = "dashboard-card-ripple";
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
    "dashboard-card",
    `dashboard-card--${variant}`,
    className,
    isVisible && animated ? "dashboard-card--visible" : "",
    isHovered ? "dashboard-card--hovered" : "",
    isLoading ? "dashboard-card--loading" : "",
    hasError ? "dashboard-card--error" : "",
    onClick ? "dashboard-card--clickable" : "",
    breathing ? "dashboard-card--breathing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        animationDelay: animated ? `${animationDelay}ms` : undefined,
      }}
      {...props}
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
    </div>
  );
};

/**
 * Card header component
 */
export const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`dashboard-card__header ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Card title component
 */
export const CardTitle = ({ children, icon, className = "", ...props }) => (
  <h3 className={`dashboard-card__title ${className}`} {...props}>
    {icon && <span className="dashboard-card__title-icon">{icon}</span>}
    <span className="dashboard-card__title-text">{children}</span>
  </h3>
);

/**
 * Card content component
 */
export const CardContent = ({ children, className = "", ...props }) => (
  <div className={`dashboard-card__content-inner ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Card actions component
 */
export const CardActions = ({ children, className = "", ...props }) => (
  <div className={`dashboard-card__actions ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Header action component (for top-right actions)
 */
export const HeaderAction = ({
  children,
  onClick,
  href,
  className = "",
  ...props
}) => {
  const Component = href ? "a" : "button";

  return (
    <Component
      className={`dashboard-card__header-action ${className}`}
      onClick={onClick}
      href={href}
      {...props}
    >
      {children}
    </Component>
  );
};

// PropTypes
DashboardCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  hasError: PropTypes.bool,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["default", "premium", "creator"]),
  animated: PropTypes.bool,
  animationDelay: PropTypes.number,
  hoverable: PropTypes.bool,
  breathing: PropTypes.bool,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  className: PropTypes.string,
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardActions.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

HeaderAction.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  href: PropTypes.string,
  className: PropTypes.string,
};

export default DashboardCard;
