'use client';

import React, { ReactNode } from 'react';
import styles from './DashboardGrid.module.css';

interface DashboardGridProps {
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}

/**
 * Dashboard grid with responsive layout
 * Animation handled by individual card components
 * Migrated from: src/components/dashboard/shared/DashboardGrid.jsx
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  isLoading = false,
  className = '',
}) => {
  return (
    <div className={`${styles.dashboardGrid} ${className}`}>
      {children}
    </div>
  );
};

export default DashboardGrid;
