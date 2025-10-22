// components/portal/MainContent.tsx - Central portal content

"use client";

import React from "react";
import Link from "next/link";
import ButtonGroup from "./ButtonGroup";

interface ReflectConfig {
  text: string;
  href: string;
}

interface SecondaryButton {
  href: string;
  className: string;
  icon: string;
  text: string;
}

interface Taglines {
  main: string;
  sub: string;
}

interface UsageConfig {
  text: string;
  percentage: number;
  className: string;
}

interface MainContentProps {
  reflectConfig: ReflectConfig;
  secondaryButtons: SecondaryButton[];
  taglines: Taglines;
  usageConfig: UsageConfig | null;
  isAuthenticated: boolean;
  onReflectHover?: (isHovered: boolean) => void;
  className?: string;
}

/**
 * MainContent component with title, buttons, taglines, and user-specific content
 */
const MainContent: React.FC<MainContentProps> = ({
  reflectConfig,
  secondaryButtons,
  taglines,
  usageConfig,
  isAuthenticated,
  onReflectHover,
  className = "",
}) => {
  return (
    <main className={`main-content ${className}`}>
      <section className="center-container">
        <h1 className="title">The Mirror of Truth</h1>

        {/* Button Group */}
        <ButtonGroup
          reflectConfig={reflectConfig}
          secondaryButtons={secondaryButtons}
          onReflectHover={onReflectHover}
        />

        {/* Taglines */}
        <div className="taglines">
          <p
            className="tagline"
            dangerouslySetInnerHTML={{ __html: taglines.main }}
          />
          <p
            className="sub-tagline"
            dangerouslySetInnerHTML={{ __html: taglines.sub }}
          />
        </div>

        {/* Usage Status (for authenticated users) */}
        {usageConfig && (
          <div className="usage-status show">
            <div className="usage-text">{usageConfig.text}</div>
            <div className="usage-bar">
              <div
                className={`usage-fill ${usageConfig.className}`}
                style={{ width: `${usageConfig.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Sign In Prompt (for non-authenticated users) */}
        {!isAuthenticated && (
          <div className="sign-in-prompt">
            <p className="prompt-text">
              Already have an account?{" "}
              <Link href="/auth/signin" className="sign-in-link">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </section>

      <style jsx>{`
        .main-content {
          position: relative;
          z-index: 10;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1rem, 5vh, 3rem) clamp(1rem, 5vw, 2rem);
        }

        .center-container {
          text-align: center;
          max-width: 90vw;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .title {
          font-size: clamp(2rem, 6vw, 3.5rem);
          font-weight: 300;
          margin-bottom: clamp(1rem, 3vh, 2rem);
          line-height: 1.2;
          opacity: 0.95;
          letter-spacing: -0.02em;
        }

        /* Taglines */
        .taglines {
          margin-top: clamp(1rem, 3vh, 2rem);
          max-width: 500px;
          width: 100%;
        }

        .tagline {
          font-size: clamp(0.85rem, 2.2vw, 1.1rem);
          opacity: 0.8;
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: clamp(0.5rem, 1vh, 1rem);
          letter-spacing: 0.3px;
        }

        .tagline :global(strong) {
          color: rgba(16, 185, 129, 0.9);
          font-weight: 500;
        }

        .sub-tagline {
          font-size: clamp(0.8rem, 2vw, 1rem);
          opacity: 0.6;
          font-weight: 300;
          line-height: 1.5;
          margin: 0;
        }

        .sub-tagline :global(strong) {
          color: rgba(16, 185, 129, 0.9);
          font-weight: 500;
        }

        /* Usage status for authenticated users */
        .usage-status {
          margin-top: clamp(1rem, 2vh, 1.5rem);
          padding: clamp(0.8rem, 2vh, 1rem) clamp(1rem, 3vw, 1.5rem);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          max-width: 300px;
          width: 100%;
          display: none;
        }

        .usage-status.show {
          display: block;
        }

        .usage-text {
          font-size: clamp(0.75rem, 2vw, 0.9rem);
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.8rem;
          text-align: center;
        }

        .usage-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 2px;
          transition: width 0.8s ease;
          width: 0%;
        }

        .usage-fill.warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .usage-fill.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        /* Sign-in prompt */
        .sign-in-prompt {
          margin-top: clamp(1rem, 2vh, 1.5rem);
          opacity: 0;
          animation: fadeIn 0.8s ease 1.5s forwards;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        .prompt-text {
          font-size: clamp(0.8rem, 2vw, 0.95rem);
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .sign-in-link {
          color: #10b981;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        }

        .sign-in-link:hover {
          color: #6ee7b7;
          border-bottom-color: rgba(16, 185, 129, 0.6);
        }

        /* Mobile optimizations */
        @media (max-width: 480px) {
          .center-container {
            max-width: 95vw;
          }
        }

        /* Ultra small screens */
        @media (max-height: 600px) {
          .title {
            margin-bottom: 1rem;
          }

          .taglines {
            margin-top: 1rem;
          }
        }

        /* Landscape mobile */
        @media (max-height: 500px) and (orientation: landscape) {
          .main-content {
            padding: 1rem;
          }

          .center-container {
            gap: 0.5rem;
          }

          .title {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
          }

          .taglines {
            margin-top: 0.5rem;
          }

          .tagline,
          .sub-tagline {
            font-size: 0.8rem;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .sign-in-prompt {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
};

export default MainContent;
