// src/components/portal/components/MirrorShards.jsx - Floating mirror animations

import React, { useState } from "react";

/**
 * MirrorShards component with floating sacred geometry mirrors
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Mirror shards component
 */
const MirrorShards = ({ className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);

  const mirrors = [
    {
      style: {
        "--rotation": "3deg",
        top: "12%",
        left: "15%",
        clipPath: "polygon(20% 0%, 80% 10%, 100% 85%, 35% 100%, 0% 70%)",
        animationDelay: "0s",
      },
    },
    {
      style: {
        "--rotation": "-6deg",
        top: "20%",
        right: "12%",
        clipPath: "polygon(50% 0%, 90% 50%, 50% 100%, 10% 50%)",
        animationDelay: "2s",
      },
    },
    {
      style: {
        "--rotation": "8deg",
        top: "45%",
        left: "8%",
        clipPath: "polygon(25% 0%, 100% 38%, 75% 100%, 0% 62%)",
        animationDelay: "4s",
      },
    },
    {
      style: {
        "--rotation": "-4deg",
        top: "65%",
        right: "15%",
        width: "clamp(30px, 6vw, 60px)",
        height: "clamp(30px, 6vw, 60px)",
        clipPath: "polygon(30% 0%, 85% 0%, 100% 70%, 45% 100%, 0% 65%)",
        animationDelay: "6s",
      },
    },
    {
      style: {
        "--rotation": "12deg",
        bottom: "15%",
        left: "30%",
        clipPath: "polygon(15% 0%, 100% 25%, 85% 100%, 0% 75%)",
        animationDelay: "8s",
      },
    },
  ];

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={`mirrors-container ${className} ${isHovered ? "hover" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {mirrors.map((mirror, index) => (
        <div key={index} className="mirror" style={mirror.style} />
      ))}

      <style jsx>{`
        .mirrors-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .mirror {
          position: absolute;
          width: clamp(25px, 5vw, 50px);
          height: clamp(25px, 5vw, 50px);
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          animation: float 12s ease-in-out infinite;
          transition: all 0.4s ease;
        }

        .mirror::after {
          content: "";
          position: absolute;
          inset: -10%;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.3) 0%,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 100%
          );
          animation: shimmer 15s linear infinite;
          mix-blend-mode: overlay;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(var(--rotation, 0deg));
            opacity: 0.6;
          }
          25% {
            transform: translateY(-12px)
              rotate(calc(var(--rotation, 0deg) + 2deg));
            opacity: 0.8;
          }
          50% {
            transform: translateY(-6px)
              rotate(calc(var(--rotation, 0deg) - 1deg));
            opacity: 1;
          }
          75% {
            transform: translateY(-9px)
              rotate(calc(var(--rotation, 0deg) + 1deg));
            opacity: 0.7;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(-100%);
          }
          100% {
            transform: translateX(100%) translateY(100%);
          }
        }

        /* Mirror hover effects */
        @media (hover: hover) {
          .mirrors-container.hover .mirror {
            animation-play-state: paused;
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 15px 45px rgba(255, 255, 255, 0.1);
            transform: scale(1.1) rotate(var(--rotation, 0deg));
          }

          .mirrors-container.hover .mirror::after {
            animation-play-state: paused;
            opacity: 0.6;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .mirror,
          .mirror::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MirrorShards;
