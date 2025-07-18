import React, { useEffect, useState } from "react";

/**
 * Compact auth layout optimized for no-scroll signup experience
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle
 * @param {boolean} props.showBackButton - Whether to show back button
 * @param {string} props.backUrl - URL for back button
 * @returns {JSX.Element} - Auth layout component
 */
const AuthLayout = ({
  children,
  title,
  subtitle,
  showBackButton = true,
  backUrl = "/portal",
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="auth-screen">
      {/* Cosmic Presence - Floating Particles */}
      <div className="cosmic-presence">
        {!prefersReducedMotion && (
          <>
            <div className="presence-particle" data-particle="1" />
            <div className="presence-particle" data-particle="2" />
            <div className="presence-particle" data-particle="3" />
          </>
        )}
      </div>

      {/* Main Auth Container */}
      <div className="auth-container">
        {/* Back Navigation */}
        {showBackButton && (
          <div className="back-navigation">
            <a href={backUrl} className="back-link">
              <span className="back-arrow">←</span>
              <span>Return to Portal</span>
            </a>
          </div>
        )}

        {/* Auth Content Section */}
        <div className="auth-content-section">
          {/* Header */}
          <div className="auth-header">
            <div className="mirror-icon">🪞</div>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </div>

          {/* Form Content */}
          <div className="auth-form-container">{children}</div>
        </div>
      </div>

      {/* Inline Styles for Cosmic Effects */}
      <style jsx>{`
        .auth-screen {
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            #0f0f23 0%,
            #1a1a2e 25%,
            #16213e 50%,
            #0f0f23 100%
          );
          color: #fff;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          position: fixed;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-screen::before {
          content: "";
          position: fixed;
          inset: 0;
          background: radial-gradient(
              circle at 20% 30%,
              rgba(147, 51, 234, 0.04) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(59, 130, 246, 0.03) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 50% 50%,
              rgba(16, 185, 129, 0.02) 0%,
              transparent 50%
            );
          z-index: 1;
          animation: ${prefersReducedMotion
            ? "none"
            : "gentleShift 45s ease-in-out infinite"};
        }

        @keyframes gentleShift {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.7;
          }
          33% {
            transform: scale(1.05) rotate(120deg);
            opacity: 0.9;
          }
          66% {
            transform: scale(0.95) rotate(240deg);
            opacity: 0.6;
          }
        }

        .cosmic-presence {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          overflow: hidden;
        }

        .presence-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: gentleDrift 25s linear infinite;
        }

        .presence-particle[data-particle="1"] {
          left: 15%;
          animation-delay: 0s;
          background: rgba(147, 51, 234, 0.4);
        }

        .presence-particle[data-particle="2"] {
          left: 50%;
          animation-delay: 8s;
          background: rgba(59, 130, 246, 0.3);
        }

        .presence-particle[data-particle="3"] {
          left: 85%;
          animation-delay: 16s;
          background: rgba(16, 185, 129, 0.35);
        }

        @keyframes gentleDrift {
          0% {
            transform: translateY(100vh) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-10vh) scale(1);
            opacity: 0;
          }
        }

        .auth-container {
          position: relative;
          z-index: 10;
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(0.4rem, 1vh, 0.6rem) clamp(1rem, 3vw, 2rem);
          gap: clamp(0.3rem, 0.6vh, 0.5rem);
          overflow: hidden;
        }

        .back-navigation {
          position: absolute;
          top: clamp(0.8rem, 2vh, 1.2rem);
          left: clamp(1rem, 3vw, 2rem);
          z-index: 20;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: clamp(0.25rem, 0.6vw, 0.4rem);
          padding: clamp(0.4rem, 0.8vh, 0.6rem) clamp(0.8rem, 1.8vw, 1rem);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px) saturate(120%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-size: clamp(0.65rem, 1.3vw, 0.75rem);
          font-weight: 300;
          transition: all 0.4s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .back-link::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(255, 255, 255, 0.08),
            transparent
          );
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .back-link:hover::before {
          transform: translateX(100%);
        }

        .back-link:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 30px rgba(255, 255, 255, 0.08);
        }

        .back-arrow {
          font-size: clamp(0.7rem, 1.4vw, 0.9rem);
          transition: transform 0.3s ease;
        }

        .back-link:hover .back-arrow {
          transform: translateX(-3px);
        }

        .auth-content-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: clamp(340px, 38vw, 420px);
          gap: clamp(0.4rem, 0.8vh, 0.6rem);
          position: relative;
          height: auto;
        }

        .auth-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(0.2rem, 0.4vh, 0.3rem);
          margin-bottom: clamp(0.2rem, 0.4vh, 0.3rem);
        }

        .mirror-icon {
          font-size: clamp(1.4rem, 3vw, 1.8rem);
          margin-bottom: clamp(0.05rem, 0.1vh, 0.1rem);
          display: block;
          animation: ${prefersReducedMotion
            ? "none"
            : "iconPulse 6s ease-in-out infinite"};
          filter: drop-shadow(0 0 15px rgba(147, 51, 234, 0.3));
        }

        @keyframes iconPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        .auth-title {
          font-size: clamp(1.2rem, 2.6vw, 1.6rem);
          font-weight: 300;
          margin-bottom: clamp(0.05rem, 0.1vh, 0.1rem);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(147, 51, 234, 0.8) 50%,
            rgba(255, 255, 255, 0.9) 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          letter-spacing: 0.5px;
          line-height: 1.1;
        }

        .auth-subtitle {
          font-size: clamp(0.7rem, 1.4vw, 0.85rem);
          color: rgba(255, 255, 255, 0.7);
          font-weight: 300;
          line-height: 1.2;
          letter-spacing: 0.3px;
        }

        .auth-form-container {
          width: 100%;
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .auth-container {
            padding: clamp(0.3rem, 0.8vh, 0.5rem) clamp(0.8rem, 2vw, 1.2rem);
            gap: clamp(0.25rem, 0.5vh, 0.4rem);
          }

          .auth-content-section {
            max-width: 92vw;
            gap: clamp(0.3rem, 0.6vh, 0.5rem);
          }

          .back-navigation {
            top: clamp(0.5rem, 1.2vh, 0.8rem);
            left: clamp(0.8rem, 2vw, 1.2rem);
          }
        }

        @media (max-height: 700px) {
          .auth-container {
            gap: clamp(0.2rem, 0.4vh, 0.3rem);
          }

          .auth-content-section {
            gap: clamp(0.25rem, 0.5vh, 0.4rem);
          }

          .auth-header {
            gap: clamp(0.15rem, 0.3vh, 0.25rem);
            margin-bottom: clamp(0.1rem, 0.2vh, 0.2rem);
          }

          .mirror-icon {
            font-size: clamp(1.2rem, 2.5vw, 1.5rem);
          }
        }

        @media (max-width: 480px) {
          .auth-container {
            padding: clamp(0.25rem, 0.6vh, 0.4rem) clamp(0.6rem, 1.5vw, 1rem);
          }

          .auth-content-section {
            max-width: 95vw;
          }

          .back-link {
            padding: clamp(0.3rem, 0.6vh, 0.5rem) clamp(0.6rem, 1.5vw, 0.8rem);
          }
        }

        @media (max-height: 600px) {
          .auth-container {
            gap: clamp(0.15rem, 0.3vh, 0.25rem);
          }

          .auth-header {
            gap: clamp(0.1rem, 0.2vh, 0.15rem);
            margin-bottom: clamp(0.05rem, 0.1vh, 0.1rem);
          }
        }

        @media (max-height: 500px) and (orientation: landscape) {
          .auth-container {
            padding: clamp(0.2rem, 0.4vh, 0.3rem) clamp(0.6rem, 1.5vw, 1rem);
            gap: clamp(0.1rem, 0.2vh, 0.15rem);
          }

          .auth-header {
            gap: clamp(0.05rem, 0.1vh, 0.1rem);
            margin-bottom: clamp(0.05rem, 0.1vh, 0.05rem);
          }

          .mirror-icon {
            font-size: clamp(1rem, 2vw, 1.3rem);
            margin-bottom: clamp(0.02rem, 0.05vh, 0.05rem);
          }

          .auth-title {
            font-size: clamp(1rem, 2.2vw, 1.3rem);
            margin-bottom: clamp(0.02rem, 0.05vh, 0.05rem);
          }

          .auth-subtitle {
            font-size: clamp(0.6rem, 1.2vw, 0.75rem);
          }

          .back-navigation {
            top: clamp(0.3rem, 0.8vh, 0.5rem);
            left: clamp(0.5rem, 1.2vw, 0.8rem);
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .auth-screen::before,
          .mirror-icon,
          .presence-particle {
            animation: none !important;
          }
        }

        /* Focus indicators */
        .back-link:focus-visible {
          outline: 2px solid rgba(147, 51, 234, 0.6);
          outline-offset: 2px;
        }

        /* iOS safe area handling */
        @supports (-webkit-touch-callout: none) {
          .auth-container {
            padding-top: max(
              clamp(0.4rem, 1vh, 0.6rem),
              env(safe-area-inset-top)
            );
            padding-left: max(
              clamp(1rem, 3vw, 2rem),
              env(safe-area-inset-left)
            );
            padding-right: max(
              clamp(1rem, 3vw, 2rem),
              env(safe-area-inset-right)
            );
            padding-bottom: max(
              clamp(0.4rem, 1vh, 0.6rem),
              env(safe-area-inset-bottom)
            );
          }

          .back-navigation {
            top: max(
              clamp(0.8rem, 2vh, 1.2rem),
              env(safe-area-inset-top) + 0.5rem
            );
            left: max(
              clamp(1rem, 3vw, 2rem),
              env(safe-area-inset-left) + 0.5rem
            );
          }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
