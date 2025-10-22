'use client';

import React, { ReactNode } from 'react';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import styles from './DashboardGrid.module.css';

interface DashboardGridProps {
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}

/**
 * Dashboard grid with coordinated stagger animations and responsive layout
 * Migrated from: src/components/dashboard/shared/DashboardGrid.jsx
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  isLoading = false,
  className = '',
}) => {
  const cardCount = 4;
  const { containerRef, getItemStyles } = useStaggerAnimation(cardCount, {
    delay: 150, // 150ms between each card
    duration: 800, // Animation duration
    triggerOnce: !isLoading, // Only animate when not loading
  });

  return (
    <div ref={containerRef} className={`${styles.dashboardGrid} ${className}`}>
      {children}
    </div>
  );
};

export default DashboardGrid;
