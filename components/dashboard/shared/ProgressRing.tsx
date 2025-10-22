'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface ProgressRingProps {
  percentage?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  animated?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  valueFormatter?: string | number | ((p: number) => string);
  animationDelay?: number;
  breathing?: boolean;
  className?: string;
}

/**
 * Animated circular progress ring with customizable styling
 * Migrated from: src/components/dashboard/shared/ProgressRing.jsx
 */
const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage = 0,
  size = 'md',
  strokeWidth = 4,
  animated = true,
  color = 'primary',
  showValue = false,
  valueFormatter = null,
  animationDelay = 0,
  breathing = false,
  className = '',
}) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Size configurations
  const sizeConfig = useMemo(() => {
    const configs = {
      sm: { radius: 30, viewBox: 80, fontSize: '12px' },
      md: { radius: 40, viewBox: 100, fontSize: '14px' },
      lg: { radius: 50, viewBox: 120, fontSize: '16px' },
      xl: { radius: 60, viewBox: 140, fontSize: '18px' },
    };
    return configs[size] || configs.md;
  }, [size]);

  // Color configurations
  const colorConfig = useMemo(() => {
    const configs = {
      primary: {
        stroke: 'rgba(147, 51, 234, 0.8)',
        background: 'rgba(255, 255, 255, 0.08)',
        glow: 'rgba(147, 51, 234, 0.3)',
        text: 'rgba(196, 181, 253, 0.9)',
      },
      success: {
        stroke: 'rgba(16, 185, 129, 0.8)',
        background: 'rgba(255, 255, 255, 0.08)',
        glow: 'rgba(16, 185, 129, 0.3)',
        text: 'rgba(110, 231, 183, 0.9)',
      },
      warning: {
        stroke: 'rgba(245, 158, 11, 0.8)',
        background: 'rgba(255, 255, 255, 0.08)',
        glow: 'rgba(245, 158, 11, 0.3)',
        text: 'rgba(251, 191, 36, 0.9)',
      },
      error: {
        stroke: 'rgba(239, 68, 68, 0.8)',
        background: 'rgba(255, 255, 255, 0.08)',
        glow: 'rgba(239, 68, 68, 0.3)',
        text: 'rgba(248, 113, 113, 0.9)',
      },
    };
    return configs[color] || configs.primary;
  }, [color]);

  // Calculate SVG path properties
  const { radius, viewBox } = sizeConfig;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;

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

  // Animate percentage change
  useEffect(() => {
    if (!isVisible) return;

    const targetPercentage = Math.min(Math.max(percentage, 0), 100);

    if (!animated) {
      setDisplayPercentage(targetPercentage);
      return;
    }

    const duration = 2000; // 2 seconds
    const steps = 60; // 60 FPS
    const stepDuration = duration / steps;
    const stepValue = (targetPercentage - displayPercentage) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setDisplayPercentage((prev) => {
        const newValue = prev + stepValue;
        if (currentStep >= steps) {
          clearInterval(timer);
          return targetPercentage;
        }
        return newValue;
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [percentage, animated, isVisible, displayPercentage]);

  // Format display value
  const getDisplayValue = () => {
    if (valueFormatter) {
      if (typeof valueFormatter === 'function') {
        return valueFormatter(displayPercentage);
      }
      return valueFormatter;
    }
    return `${Math.round(displayPercentage)}%`;
  };

  return (
    <div
      className={`progress-ring progress-ring--${size} progress-ring--${color} ${className} ${
        breathing ? 'progress-ring--breathing' : ''
      }`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.9)',
        transition: animated ? 'all 0.6s ease-out' : 'none',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={viewBox}
        height={viewBox}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      >
        {/* Background circle */}
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.background}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />

        {/* Progress circle */}
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: animated ? 'stroke-dashoffset 2s ease-out' : 'none',
            filter: `drop-shadow(0 0 8px ${colorConfig.glow})`,
          }}
          transform={`rotate(-90 ${viewBox / 2} ${viewBox / 2})`}
        />
      </svg>

      {/* Center value display */}
      {showValue && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: sizeConfig.fontSize,
            color: colorConfig.text,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1,
            pointerEvents: 'none',
            textShadow: `0 0 10px ${colorConfig.text}`,
          }}
        >
          {getDisplayValue()}
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
