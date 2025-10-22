'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import styles from './WelcomeSection.module.css';

interface WelcomeSectionProps {
  dashboardData?: {
    usage?: {
      currentCount?: number;
      limit?: number | string;
      totalReflections?: number;
      canReflect?: boolean;
    };
    evolution?: {
      canGenerateNext?: boolean;
      progress?: {
        needed?: number;
      };
    };
  };
  className?: string;
}

/**
 * Enhanced welcome section with dynamic messaging and smooth animations
 * Migrated from: src/components/dashboard/shared/WelcomeSection.jsx
 */
const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  dashboardData,
  className = '',
}) => {
  const { user } = useAuth();

  /**
   * Get time-based greeting with more personality
   */
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;

    // Early morning (4-6 AM)
    if (hour >= 4 && hour < 6) {
      return 'Early morning wisdom';
    }

    // Morning (6-12 PM)
    if (hour >= 6 && hour < 12) {
      if (isWeekend) {
        return hour < 9 ? 'Peaceful morning' : 'Good morning';
      }
      return hour < 8 ? 'Rise and shine' : 'Good morning';
    }

    // Afternoon (12-17 PM)
    if (hour >= 12 && hour < 17) {
      return hour < 14 ? 'Good afternoon' : 'Afternoon light';
    }

    // Evening (17-21 PM)
    if (hour >= 17 && hour < 21) {
      return isWeekend ? 'Evening calm' : 'Good evening';
    }

    // Night (21-24 PM)
    if (hour >= 21 && hour < 24) {
      return 'Night reflections';
    }

    // Late night/Early morning (0-4 AM)
    return 'Deep night wisdom';
  }, []);

  /**
   * Get personalized welcome message based on user state and activity
   */
  const getWelcomeMessage = useMemo(() => {
    if (!user || !dashboardData) {
      return 'Your journey of consciousness awaits...';
    }

    const usage = dashboardData.usage || {};
    const currentCount = usage.currentCount || 0;
    const limit = usage.limit;
    const totalReflections = usage.totalReflections || 0;
    const tier = (user as any).tier || 'free';
    const isCreator = (user as any).isCreator;
    const evolution = dashboardData.evolution || {};

    // Creator messages
    if (isCreator) {
      if (totalReflections === 0) {
        return 'Welcome to your infinite creative space...';
      }
      return 'Your boundless journey of creation continues...';
    }

    // First-time user messages
    if (totalReflections === 0) {
      const firstTimeMessages: Record<string, string> = {
        free: 'Take your first step into conscious self-discovery...',
        essential: 'Begin your enhanced journey of 5 monthly reflections...',
        premium: 'Embark on your premium path of deep consciousness exploration...',
      };
      return firstTimeMessages[tier] || firstTimeMessages.free;
    }

    // Usage-based messages
    if (limit !== 'unlimited' && typeof limit === 'number') {
      const usagePercent = (currentCount / limit) * 100;

      if (usagePercent === 0) {
        return 'Your monthly reflection journey awaits renewal...';
      }

      if (usagePercent < 20) {
        return `Continue your sacred journey with ${limit - currentCount} reflections remaining...`;
      }

      if (usagePercent < 50) {
        return 'Your consciousness journey deepens with each reflection...';
      }

      if (usagePercent < 80) {
        return "You're weaving beautiful patterns of self-awareness...";
      }

      if (usagePercent < 100) {
        const remaining = limit - currentCount;
        return `Almost at your monthly limit — ${remaining} reflection${remaining === 1 ? '' : 's'} left...`;
      }

      return "You've fully embraced this month's journey of self-discovery...";
    }

    // Evolution-based messages
    if (evolution.canGenerateNext) {
      return 'Your evolution report awaits — ready to reveal your growth patterns...';
    }

    if (evolution.progress && evolution.progress.needed && evolution.progress.needed <= 2) {
      const needed = evolution.progress.needed;
      return `${needed} more reflection${needed === 1 ? '' : 's'} until your next evolution insight...`;
    }

    // General tier-based messages
    const tierMessages: Record<string, string> = {
      free: 'Your monthly sacred space for deep reflection...',
      essential: 'Continue exploring your inner landscape with intention...',
      premium: 'Dive deeper into the mysteries of your consciousness...',
    };

    return tierMessages[tier] || 'Your journey of self-discovery continues...';
  }, [user, dashboardData]);

  /**
   * Get the user's display name
   */
  const getDisplayName = useMemo(() => {
    if (!user) return 'Sacred Soul';

    const isCreator = (user as any).isCreator;
    if (isCreator) return 'Creator';

    // Get first name, fall back to full name, then default
    const firstName = user.name?.split(' ')[0];
    return firstName || user.name || 'Sacred Soul';
  }, [user]);

  /**
   * Get quick actions based on user state
   */
  const getQuickActions = useMemo(() => {
    const actions: Array<{
      type: 'primary' | 'secondary';
      href: string;
      icon: string;
      text: string;
      disabled: boolean;
    }> = [];

    // Primary action - always reflect
    const canReflect = dashboardData?.usage?.canReflect !== false;
    const isCreator = (user as any)?.isCreator;
    const reflectMode = isCreator ? '?mode=creator' : '';

    actions.push({
      type: 'primary',
      href: `/reflection${reflectMode}`,
      icon: '✨',
      text: canReflect ? 'Reflect Now' : 'View Reflections',
      disabled: false,
    });

    // Secondary action - context-dependent
    const tier = (user as any)?.tier || 'free';
    if (tier === 'free') {
      actions.push({
        type: 'secondary',
        href: '/subscription',
        icon: '💎',
        text: 'Upgrade Journey',
        disabled: false,
      });
    } else {
      actions.push({
        type: 'secondary',
        href: '/gifting',
        icon: '🎁',
        text: 'Gift Reflection',
        disabled: false,
      });
    }

    return actions;
  }, [dashboardData, user]);

  return (
    <section className={`${styles.welcomeSection} ${className}`}>
      {/* Background Elements */}
      <div className={styles.welcomeBackground}>
        <div className={`${styles.welcomeGlow} ${styles.welcomeGlowPrimary}`} />
        <div className={`${styles.welcomeGlow} ${styles.welcomeGlowSecondary}`} />
      </div>

      {/* Content */}
      <div className={styles.welcomeContent}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>
            <span className={styles.welcomeGreeting}>{getGreeting},</span>
            <span className={styles.welcomeName}>{getDisplayName}</span>
          </h1>
          <p className={styles.welcomeMessage}>{getWelcomeMessage}</p>
        </div>

        <div className={styles.welcomeActions}>
          {getQuickActions.map((action, index) => (
            <Link
              key={action.type}
              href={action.href}
              className={`${styles.welcomeAction} ${
                styles[`welcomeAction${action.type.charAt(0).toUpperCase() + action.type.slice(1)}`]
              } ${action.disabled ? styles.welcomeActionDisabled : ''}`}
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <span className={styles.welcomeActionIcon}>{action.icon}</span>
              <span className={styles.welcomeActionText}>{action.text}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
