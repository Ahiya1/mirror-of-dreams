// src/components/dashboard/sections/WelcomeSection.jsx - Enhanced welcome with dynamic messaging

import React, { useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";

/**
 * Enhanced welcome section with dynamic messaging and smooth animations
 * @param {Object} props - Component props
 * @param {Object} props.dashboardData - Dashboard data object
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Welcome section component
 */
const WelcomeSection = ({ dashboardData, className = "" }) => {
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
      return "Early morning wisdom";
    }

    // Morning (6-12 PM)
    if (hour >= 6 && hour < 12) {
      if (isWeekend) {
        return hour < 9 ? "Peaceful morning" : "Good morning";
      }
      return hour < 8 ? "Rise and shine" : "Good morning";
    }

    // Afternoon (12-17 PM)
    if (hour >= 12 && hour < 17) {
      return hour < 14 ? "Good afternoon" : "Afternoon light";
    }

    // Evening (17-21 PM)
    if (hour >= 17 && hour < 21) {
      return isWeekend ? "Evening calm" : "Good evening";
    }

    // Night (21-24 PM)
    if (hour >= 21 && hour < 24) {
      return "Night reflections";
    }

    // Late night/Early morning (0-4 AM)
    return "Deep night wisdom";
  }, []);

  /**
   * Get personalized welcome message based on user state and activity
   */
  const getWelcomeMessage = useMemo(() => {
    if (!user || !dashboardData) {
      return "Your journey of consciousness awaits...";
    }

    const usage = dashboardData.usage || {};
    const currentCount = usage.currentCount || 0;
    const limit = usage.limit;
    const totalReflections = usage.totalReflections || 0;
    const tier = user.tier || "free";
    const isCreator = user.isCreator;
    const evolution = dashboardData.evolution || {};

    // Creator messages
    if (isCreator) {
      if (totalReflections === 0) {
        return "Welcome to your infinite creative space...";
      }
      return "Your boundless journey of creation continues...";
    }

    // First-time user messages
    if (totalReflections === 0) {
      const firstTimeMessages = {
        free: "Take your first step into conscious self-discovery...",
        essential: "Begin your enhanced journey of 5 monthly reflections...",
        premium:
          "Embark on your premium path of deep consciousness exploration...",
      };
      return firstTimeMessages[tier] || firstTimeMessages.free;
    }

    // Usage-based messages
    if (limit !== "unlimited") {
      const usagePercent = (currentCount / limit) * 100;

      if (usagePercent === 0) {
        return "Your monthly reflection journey awaits renewal...";
      }

      if (usagePercent < 20) {
        return `Continue your sacred journey with ${
          limit - currentCount
        } reflections remaining...`;
      }

      if (usagePercent < 50) {
        return "Your consciousness journey deepens with each reflection...";
      }

      if (usagePercent < 80) {
        return "You're weaving beautiful patterns of self-awareness...";
      }

      if (usagePercent < 100) {
        return `Almost at your monthly limit — ${
          limit - currentCount
        } reflection${limit - currentCount === 1 ? "" : "s"} left...`;
      }

      return "You've fully embraced this month's journey of self-discovery...";
    }

    // Evolution-based messages
    if (evolution.canGenerateNext) {
      return "Your evolution report awaits — ready to reveal your growth patterns...";
    }

    if (evolution.progress?.needed <= 2) {
      return `${evolution.progress.needed} more reflection${
        evolution.progress.needed === 1 ? "" : "s"
      } until your next evolution insight...`;
    }

    // General tier-based messages
    const tierMessages = {
      free: "Your monthly sacred space for deep reflection...",
      essential: "Continue exploring your inner landscape with intention...",
      premium: "Dive deeper into the mysteries of your consciousness...",
    };

    return tierMessages[tier] || "Your journey of self-discovery continues...";
  }, [user, dashboardData]);

  /**
   * Get the user's display name
   */
  const getDisplayName = useMemo(() => {
    if (!user) return "Sacred Soul";

    if (user.isCreator) return "Creator";

    // Get first name, fall back to full name, then default
    const firstName = user.name?.split(" ")[0];
    return firstName || user.name || "Sacred Soul";
  }, [user]);

  /**
   * Get quick actions based on user state
   */
  const getQuickActions = useMemo(() => {
    const actions = [];

    // Primary action - always reflect
    const canReflect = dashboardData?.usage?.canReflect !== false;
    const reflectMode = user?.isCreator ? "?mode=creator" : "";

    actions.push({
      type: "primary",
      href: `/reflection${reflectMode}`,
      icon: "✨",
      text: canReflect ? "Reflect Now" : "View Reflections",
      disabled: false,
    });

    // Secondary action - context-dependent
    if (user?.tier === "free") {
      actions.push({
        type: "secondary",
        href: "/subscription",
        icon: "💎",
        text: "Upgrade Journey",
        disabled: false,
      });
    } else {
      actions.push({
        type: "secondary",
        href: "/gifting",
        icon: "🎁",
        text: "Gift Reflection",
        disabled: false,
      });
    }

    return actions;
  }, [dashboardData, user]);

  return (
    <section className={`welcome-section ${className}`}>
      {/* Background Elements */}
      <div className="welcome-background">
        <div className="welcome-glow welcome-glow--primary" />
        <div className="welcome-glow welcome-glow--secondary" />
      </div>

      {/* Content */}
      <div className="welcome-content">
        <div className="welcome-text">
          <h1 className="welcome-title">
            <span className="welcome-greeting">{getGreeting},</span>
            <span className="welcome-name">{getDisplayName}</span>
          </h1>
          <p className="welcome-message">{getWelcomeMessage}</p>
        </div>

        <div className="welcome-actions">
          {getQuickActions.map((action, index) => (
            <a
              key={action.type}
              href={action.href}
              className={`welcome-action welcome-action--${action.type} ${
                action.disabled ? "welcome-action--disabled" : ""
              }`}
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <span className="welcome-action__icon">{action.icon}</span>
              <span className="welcome-action__text">{action.text}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Enhanced Styles */}
      <style jsx>{`
        .welcome-section {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-xl) var(--space-2xl);
          background: var(--glass-bg);
          backdrop-filter: blur(40px) saturate(130%);
          border: 1px solid var(--glass-border);
          border-radius: var(--card-radius);
          margin-bottom: var(--space-xl);
          overflow: hidden;
          animation: welcomeEntrance 0.8s ease-out;
          min-height: 120px;
        }

        .welcome-background {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .welcome-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.6;
          animation: breatheGlow 4s ease-in-out infinite;
        }

        .welcome-glow--primary {
          width: 300px;
          height: 300px;
          background: radial-gradient(
            circle,
            rgba(147, 51, 234, 0.15) 0%,
            rgba(147, 51, 234, 0.05) 50%,
            transparent 100%
          );
          top: -150px;
          left: -100px;
        }

        .welcome-glow--secondary {
          width: 250px;
          height: 250px;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.1) 0%,
            rgba(59, 130, 246, 0.03) 50%,
            transparent 100%
          );
          bottom: -125px;
          right: -75px;
          animation-delay: 2s;
        }

        .welcome-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: var(--space-xl);
        }

        .welcome-text {
          flex: 1;
          max-width: 60%;
        }

        .welcome-title {
          font-size: var(--text-2xl);
          font-weight: var(--font-light);
          margin: 0 0 var(--space-md) 0;
          line-height: var(--leading-tight);
        }

        .welcome-greeting {
          display: block;
          font-size: var(--text-lg);
          color: var(--cosmic-text-secondary);
          font-weight: var(--font-light);
          margin-bottom: var(--space-1);
          opacity: 0;
          animation: slideInLeft 0.6s ease-out 0.2s forwards;
        }

        .welcome-name {
          background: linear-gradient(
            135deg,
            var(--cosmic-text) 0%,
            rgba(147, 51, 234, 0.9) 50%,
            rgba(59, 130, 246, 0.8) 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: block;
          opacity: 0;
          animation: slideInLeft 0.6s ease-out 0.4s forwards;
        }

        .welcome-message {
          font-size: var(--text-base);
          color: var(--cosmic-text-secondary);
          margin: 0;
          line-height: var(--leading-relaxed);
          font-weight: var(--font-light);
          opacity: 0;
          animation: slideInLeft 0.6s ease-out 0.6s forwards;
        }

        .welcome-actions {
          display: flex;
          gap: var(--space-md);
          flex-shrink: 0;
        }

        .welcome-action {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-lg);
          border-radius: var(--radius-xl);
          text-decoration: none;
          font-size: var(--text-base);
          font-weight: var(--font-medium);
          transition: var(--transition-smooth);
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: slideInRight 0.6s ease-out forwards;
          min-width: 160px;
          justify-content: center;
        }

        .welcome-action::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          );
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .welcome-action:hover::before {
          transform: translateX(100%);
        }

        .welcome-action--primary {
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.2),
            rgba(99, 102, 241, 0.15)
          );
          border: 1px solid rgba(147, 51, 234, 0.3);
          color: rgba(196, 181, 253, 0.95);
        }

        .welcome-action--primary:hover {
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.3),
            rgba(99, 102, 241, 0.2)
          );
          border-color: rgba(147, 51, 234, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(147, 51, 234, 0.2);
        }

        .welcome-action--secondary {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--cosmic-text-secondary);
        }

        .welcome-action--secondary:hover {
          background: var(--glass-hover-bg);
          border-color: var(--glass-hover-border);
          color: var(--cosmic-text);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .welcome-action--disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }

        .welcome-action__icon {
          font-size: var(--text-lg);
          line-height: 1;
        }

        .welcome-action__text {
          font-weight: var(--font-medium);
          letter-spacing: 0.3px;
        }

        @keyframes welcomeEntrance {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes breatheGlow {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .welcome-section {
            flex-direction: column;
            text-align: center;
            gap: var(--space-lg);
            padding: var(--space-lg);
          }

          .welcome-content {
            flex-direction: column;
            gap: var(--space-lg);
          }

          .welcome-text {
            max-width: 100%;
          }

          .welcome-title {
            font-size: var(--text-xl);
          }

          .welcome-actions {
            flex-direction: column;
            width: 100%;
            max-width: 300px;
          }

          .welcome-action {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .welcome-section {
            padding: var(--space-md);
          }

          .welcome-title {
            font-size: var(--text-lg);
          }

          .welcome-message {
            font-size: var(--text-sm);
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .welcome-section,
          .welcome-greeting,
          .welcome-name,
          .welcome-message,
          .welcome-action {
            animation: none;
            opacity: 1;
          }

          .welcome-glow {
            animation: none;
          }

          .welcome-action::before {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};

export default WelcomeSection;
