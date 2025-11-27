'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './WelcomeSection.module.css';

interface WelcomeSectionProps {
  className?: string;
}

/**
 * Simple welcome section with time-based greeting
 * Simplified from 258 lines to ~50 lines for restraint
 */
const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  className = '',
}) => {
  const { user } = useAuth();

  /**
   * Simple time-based greeting
   */
  const getGreeting = (): string => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good evening';
  };

  /**
   * Get first name only
   */
  const firstName = user?.name?.split(' ')[0] || user?.name || 'there';

  return (
    <section className={`${styles.welcomeSection} ${className}`}>
      <div className={styles.welcomeContent}>
        <h1 className={styles.welcomeTitle}>
          {getGreeting()}, {firstName}
        </h1>
      </div>
    </section>
  );
};

export default WelcomeSection;
