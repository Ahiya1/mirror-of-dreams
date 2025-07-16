// components/shared/CosmicBackground.jsx - Enhanced cosmic background component

import React, { useEffect, useState } from "react";

/**
 * Enhanced cosmic background with dynamic effects and accessibility support
 * @param {Object} props - Component props
 * @param {boolean} props.animated - Whether to enable animations
 * @param {number} props.intensity - Animation intensity (0-1)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Cosmic background component
 */
const CosmicBackground = ({
  animated = true,
  intensity = 1,
  className = "",
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

  // Disable animations if user prefers reduced motion
  const shouldAnimate = animated && !prefersReducedMotion;

  const backgroundStyle = {
    "--animation-play-state": shouldAnimate ? "running" : "paused",
    "--animation-intensity": intensity,
  };

  return (
    <div
      className={`cosmic-background ${className}`}
      style={backgroundStyle}
      aria-hidden="true"
    >
      {/* Primary cosmic gradient layer */}
      <div className="cosmic-gradient" />

      {/* Starfield layer */}
      <div className="starfield" />

      {/* Additional atmospheric layers for enhanced depth */}
      {shouldAnimate && (
        <>
          <div
            className="cosmic-nebula"
            style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(
                  ellipse at 10% 20%,
                  rgba(147, 51, 234, ${0.02 * intensity}) 0%,
                  transparent 50%
                ),
                radial-gradient(
                  ellipse at 90% 80%,
                  rgba(59, 130, 246, ${0.02 * intensity}) 0%,
                  transparent 50%
                ),
                radial-gradient(
                  ellipse at 50% 10%,
                  rgba(251, 191, 36, ${0.01 * intensity}) 0%,
                  transparent 60%
                )
              `,
              animation: shouldAnimate
                ? "nebulaFlow 120s ease-in-out infinite"
                : "none",
              opacity: intensity,
            }}
          />

          <div
            className="cosmic-particles"
            style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(circle at 25% 25%, rgba(255, 255, 255, ${
                  0.1 * intensity
                }) 0 1px, transparent 2px),
                radial-gradient(circle at 75% 75%, rgba(255, 255, 255, ${
                  0.08 * intensity
                }) 0 1px, transparent 2px),
                radial-gradient(circle at 50% 90%, rgba(255, 255, 255, ${
                  0.06 * intensity
                }) 0 1px, transparent 2px)
              `,
              backgroundSize: "400px 400px, 600px 600px, 800px 800px",
              animation: shouldAnimate
                ? "particleDrift 200s linear infinite"
                : "none",
              opacity: intensity * 0.6,
            }}
          />
        </>
      )}

      {/* Inline styles for additional animations */}
      <style jsx>{`
        @keyframes nebulaFlow {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            opacity: ${intensity * 0.8};
          }
          25% {
            transform: scale(1.1) rotate(90deg);
            opacity: ${intensity};
          }
          50% {
            transform: scale(0.9) rotate(180deg);
            opacity: ${intensity * 0.6};
          }
          75% {
            transform: scale(1.05) rotate(270deg);
            opacity: ${intensity * 0.9};
          }
        }

        @keyframes particleDrift {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            transform: translate(-50px, -50px) rotate(360deg);
          }
        }

        .cosmic-background {
          animation-play-state: var(--animation-play-state, running);
        }

        .cosmic-gradient {
          animation-play-state: var(--animation-play-state, running);
        }

        .starfield {
          animation-play-state: var(--animation-play-state, running);
        }
      `}</style>
    </div>
  );
};

export default CosmicBackground;
