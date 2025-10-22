// components/portal/UserMenu.tsx - User dropdown menu

"use client";

import React from "react";
import Link from "next/link";

interface UserConfig {
  name: string;
  avatar: string;
  showEvolution: boolean;
}

interface UserMenuProps {
  userConfig: UserConfig | null;
  isOpen: boolean;
  onToggle: () => void;
  onSignOut: () => void;
  className?: string;
}

/**
 * UserMenu component with dropdown functionality
 */
const UserMenu: React.FC<UserMenuProps> = ({
  userConfig,
  isOpen,
  onToggle,
  onSignOut,
  className = "",
}) => {
  if (!userConfig) {
    return null;
  }

  const handleSignOut = () => {
    onSignOut();
  };

  return (
    <div className={`user-menu ${className}`}>
      <button className="user-button" onClick={onToggle}>
        <span className="user-avatar">{userConfig.avatar}</span>
        <span className="user-name">{userConfig.name}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      <div className={`user-dropdown ${isOpen ? "show" : ""}`}>
        <Link href="/dashboard" className="dropdown-item">
          <span>🏠</span>
          <span>Dashboard</span>
        </Link>
        <Link href="/reflections" className="dropdown-item">
          <span>📚</span>
          <span>My Reflections</span>
        </Link>
        {userConfig.showEvolution && (
          <Link href="/evolution" className="dropdown-item">
            <span>🌱</span>
            <span>Evolution Reports</span>
          </Link>
        )}
        <Link href="/settings" className="dropdown-item">
          <span>⚙️</span>
          <span>Settings</span>
        </Link>
        <div className="dropdown-divider" />
        <button className="dropdown-item" onClick={handleSignOut}>
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>

      <style jsx>{`
        .user-menu {
          position: relative;
          display: block;
        }

        .user-button {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: clamp(0.6rem, 2vh, 0.8rem) clamp(1rem, 3vw, 1.5rem);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 50px;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          font-size: clamp(0.75rem, 2vw, 0.9rem);
          font-weight: 500;
          transition: all 0.3s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }

        .user-button:hover {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          transform: translateY(-2px);
        }

        .user-avatar {
          font-size: var(--text-lg);
        }

        .dropdown-arrow {
          font-size: 0.7rem;
          opacity: 0.7;
          transition: transform 0.3s ease;
        }

        .user-button:hover .dropdown-arrow {
          transform: rotate(180deg);
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 200px;
          background: rgba(15, 15, 35, 0.95);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 0.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          z-index: 200;
        }

        .user-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.8rem 1rem;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.95);
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0.5rem 0;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .user-button {
            padding: 0.6rem 1rem;
            font-size: 0.75rem;
          }

          .user-dropdown {
            min-width: 180px;
          }

          .dropdown-item {
            padding: 0.7rem 0.8rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default UserMenu;
