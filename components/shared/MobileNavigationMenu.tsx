/**
 * MobileNavigationMenu - Mobile/tablet navigation menu component
 *
 * Extracted from: AppNavigation.tsx (lines 366-469)
 * Builder: Builder-3 (Iteration 3, Plan 23)
 *
 * Features:
 * - Animated mobile menu (tablet breakpoint 768-1024px)
 * - All navigation links with active state
 * - Conditional links based on user tier and role
 * - Framer Motion animations
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import { cn } from '@/lib/utils';

interface MobileNavigationMenuProps {
  user: {
    tier?: 'free' | 'pro' | 'unlimited';
    isCreator?: boolean;
    isAdmin?: boolean;
  } | null;
  currentPage: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigationMenu({ user, currentPage }: MobileNavigationMenuProps) {
  const linkBaseClass = 'rounded-lg px-4 py-3 transition-all duration-300';
  const activeLinkClass = 'bg-white/12 font-medium text-white';
  const inactiveLinkClass = 'bg-white/4 hover:bg-white/8 text-white/70 hover:text-white';

  return (
    <motion.nav
      id="mobile-navigation"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 hidden border-t border-white/10 px-6 pb-4 pt-4 md:block lg:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className={cn(
            linkBaseClass,
            currentPage === 'dashboard' ? activeLinkClass : inactiveLinkClass
          )}
        >
          <span className="mr-2">🏠</span>
          Journey
        </Link>
        <Link
          href="/dreams"
          className={cn(
            linkBaseClass,
            currentPage === 'dreams' ? activeLinkClass : inactiveLinkClass
          )}
        >
          <span className="mr-2">✨</span>
          Dreams
        </Link>
        {user?.tier !== 'free' && (
          <Link
            href="/clarify"
            className={cn(
              linkBaseClass,
              currentPage === 'clarify' ? activeLinkClass : inactiveLinkClass
            )}
          >
            <span className="mr-2">💬</span>
            Clarify
          </Link>
        )}
        <Link
          href="/reflection"
          className={cn(
            linkBaseClass,
            currentPage === 'reflection' ? activeLinkClass : inactiveLinkClass
          )}
        >
          <span className="mr-2">🪞</span>
          Reflect
        </Link>
        <Link
          href="/evolution"
          className={cn(
            linkBaseClass,
            currentPage === 'evolution' ? activeLinkClass : inactiveLinkClass
          )}
        >
          <span className="mr-2">📊</span>
          Evolution
        </Link>
        <Link
          href="/visualizations"
          className={cn(
            linkBaseClass,
            currentPage === 'visualizations' ? activeLinkClass : inactiveLinkClass
          )}
        >
          <span className="mr-2">🌌</span>
          Visualizations
        </Link>
        {(user?.isCreator || user?.isAdmin) && (
          <Link
            href="/admin"
            className={cn(
              linkBaseClass,
              currentPage === 'admin' ? activeLinkClass : inactiveLinkClass
            )}
          >
            <span className="mr-2">⚡</span>
            Admin
          </Link>
        )}
      </div>
    </motion.nav>
  );
}
