/**
 * UserDropdownMenu - User dropdown menu component for navigation
 *
 * Extracted from: AppNavigation.tsx (lines 286-344)
 * Builder: Builder-3 (Iteration 3, Plan 23)
 *
 * Features:
 * - User info display (name, email)
 * - Profile, Settings, Upgrade links
 * - Help & Support link
 * - Sign Out button
 * - Animated entrance/exit via Framer Motion
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import { GlassCard } from '@/components/ui/glass';

interface UserDropdownMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    tier?: 'free' | 'pro' | 'unlimited';
  } | null;
  currentPage: string;
  onSignOut: () => void;
  onClose: () => void;
}

export function UserDropdownMenu({ user, onSignOut }: UserDropdownMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      id="user-dropdown-menu"
      role="menu"
      aria-label="User menu options"
    >
      <GlassCard
        elevated
        className="absolute right-0 top-[calc(100%+8px)] min-w-[240px] overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-white/10 px-4 py-4">
          <div className="text-sm font-medium text-white">{user?.name || 'User'}</div>
          <div className="text-xs text-white/60">{user?.email || 'user@example.com'}</div>
        </div>

        {/* Menu sections */}
        <div className="border-b border-white/10 p-2">
          <Link href="/profile" className="dashboard-dropdown-item">
            <span>👤</span>
            <span>Profile</span>
          </Link>
          <Link href="/settings" className="dashboard-dropdown-item">
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
          {user?.tier !== 'unlimited' && (
            <Link href="/pricing" className="dashboard-dropdown-item">
              <span>💎</span>
              <span>Upgrade</span>
            </Link>
          )}
        </div>

        <div className="p-2">
          <Link href="/help" className="dashboard-dropdown-item">
            <span>❓</span>
            <span>Help & Support</span>
          </Link>
          <button
            onClick={onSignOut}
            className="dashboard-dropdown-item w-full text-left text-mirror-error/90 hover:bg-mirror-error/10"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
