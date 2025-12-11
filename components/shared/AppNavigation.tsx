/**
 * AppNavigation - Shared navigation component for all authenticated app pages
 *
 * Extracted from: app/dashboard/page.tsx (lines 184-320)
 * Builder: Builder-1 (Iteration 21)
 * Refactored: Builder-3 (Iteration 3, Plan 23) - Split into smaller components
 *
 * Features:
 * - Logo with link to dashboard
 * - Desktop nav links (Journey, Dreams, Reflect, Admin)
 * - Mobile responsive (hamburger menu)
 * - User menu dropdown (Profile, Settings, Upgrade, Help, Sign Out)
 * - Active page highlighting
 * - Optional refresh button
 *
 * Sub-components:
 * - UserDropdownMenu: User profile dropdown menu
 * - MobileNavigationMenu: Mobile/tablet navigation drawer
 */

'use client';

import { AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { DemoBanner } from './DemoBanner';
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { UserDropdownMenu } from './UserDropdownMenu';

import { GlassCard, GlowButton } from '@/components/ui/glass';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface AppNavigationProps {
  currentPage:
    | 'dashboard'
    | 'dreams'
    | 'reflection'
    | 'reflections'
    | 'evolution'
    | 'visualizations'
    | 'admin'
    | 'profile'
    | 'settings'
    | 'clarify';
  onRefresh?: () => void;
}

export function AppNavigation({ currentPage, onRefresh }: AppNavigationProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Signout mutation to clear cookie on server
  const signoutMutation = trpc.auth.signout.useMutation();

  /**
   * Handle user dropdown toggle
   */
  const handleUserDropdownToggle = useCallback(() => {
    setShowUserDropdown((prev) => !prev);
  }, []);

  /**
   * Handle user dropdown keyboard navigation
   */
  const handleUserDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleUserDropdownToggle();
      }
      if (e.key === 'Escape') {
        setShowUserDropdown(false);
      }
    },
    [handleUserDropdownToggle]
  );

  /**
   * Handle logout - calls signout mutation to clear cookie
   */
  const handleLogout = useCallback(async () => {
    setShowUserDropdown(false);

    // Call signout mutation to clear cookie
    try {
      await signoutMutation.mutateAsync();
    } catch (e) {
      console.error('Signout error:', e);
    }

    router.push('/auth/signin');
  }, [router, signoutMutation]);

  /**
   * Close user dropdown
   */
  const handleCloseUserDropdown = useCallback(() => {
    setShowUserDropdown(false);
  }, []);

  /**
   * Close mobile menu
   */
  const handleCloseMobileMenu = useCallback(() => {
    setShowMobileMenu(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when changing pages
  useEffect(() => {
    setShowMobileMenu(false);
  }, [currentPage]);

  // Measure navigation height and set CSS variable
  useEffect(() => {
    const measureNavHeight = () => {
      const nav = document.querySelector('[data-nav-container]');
      if (nav) {
        const height = nav.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--nav-height', `${height}px`);
      }
    };

    // Measure on mount
    measureNavHeight();

    // Re-measure on resize (debounced)
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureNavHeight, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [showMobileMenu]); // Re-measure when mobile menu toggles

  return (
    <>
      {/* Demo Banner - appears only for demo users */}
      <DemoBanner />

      <GlassCard
        elevated
        data-nav-container
        className="fixed left-0 right-0 z-[100] rounded-none border-b border-white/10"
        style={{ top: 'var(--demo-banner-height, 0px)' }}
      >
        <div className="container mx-auto flex items-center justify-between px-3 py-1.5 sm:px-6 sm:py-3">
          {/* Left section */}
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-normal text-white/90 transition-all hover:-translate-y-0.5 hover:text-white sm:gap-3"
            >
              <span className="animate-glow-pulse text-xl sm:text-2xl">🪞</span>
              <span className="hidden md:inline">Mirror of Dreams</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden gap-2 lg:flex">
              <Link
                href="/dashboard"
                className={cn(
                  'dashboard-nav-link',
                  currentPage === 'dashboard' && 'dashboard-nav-link--active'
                )}
              >
                <span>🏠</span>
                <span>Journey</span>
              </Link>
              <Link
                href="/dreams"
                className={cn(
                  'dashboard-nav-link',
                  currentPage === 'dreams' && 'dashboard-nav-link--active'
                )}
              >
                <span>✨</span>
                <span>Dreams</span>
              </Link>
              {user?.tier !== 'free' && (
                <Link
                  href="/clarify"
                  className={cn(
                    'dashboard-nav-link',
                    currentPage === 'clarify' && 'dashboard-nav-link--active'
                  )}
                >
                  <span>💬</span>
                  <span>Clarify</span>
                </Link>
              )}
              <Link
                href="/reflection"
                className={cn(
                  'dashboard-nav-link',
                  currentPage === 'reflection' && 'dashboard-nav-link--active'
                )}
              >
                <span>🪞</span>
                <span>Reflect</span>
              </Link>
              <Link
                href="/evolution"
                className={cn(
                  'dashboard-nav-link',
                  currentPage === 'evolution' && 'dashboard-nav-link--active'
                )}
              >
                <span>📊</span>
                <span>Evolution</span>
              </Link>
              <Link
                href="/visualizations"
                className={cn(
                  'dashboard-nav-link',
                  currentPage === 'visualizations' && 'dashboard-nav-link--active'
                )}
              >
                <span>🌌</span>
                <span>Visualizations</span>
              </Link>
              {(user?.isCreator || user?.isAdmin) && (
                <Link
                  href="/admin"
                  className={cn(
                    'dashboard-nav-link',
                    currentPage === 'admin' && 'dashboard-nav-link--active'
                  )}
                >
                  <span>⚡</span>
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Upgrade button for free users */}
            {user?.tier === 'free' && (
              <GlowButton
                variant="primary"
                size="sm"
                onClick={() => router.push('/pricing')}
                className="hidden sm:flex"
              >
                <span className="text-lg">💎</span>
                <span className="hidden md:inline">Upgrade</span>
              </GlowButton>
            )}

            {/* Refresh button (optional) */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh data"
                aria-label="Refresh data"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:bg-white/10"
              >
                <span className="text-lg">🔄</span>
              </button>
            )}

            {/* User menu */}
            <div className="dashboard-nav__user relative" ref={dropdownRef}>
              <button
                onClick={handleUserDropdownToggle}
                onKeyDown={handleUserDropdownKeyDown}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-all hover:bg-white/10 sm:gap-3 sm:px-4 sm:py-2"
                aria-label="User menu"
                aria-expanded={showUserDropdown}
                aria-haspopup="true"
                aria-controls="user-dropdown-menu"
              >
                <span className="text-base sm:text-lg" aria-hidden="true">
                  {user?.tier === 'unlimited' ? '💎' : user?.tier === 'pro' ? '✨' : '👤'}
                </span>
                <span className="hidden text-sm text-white sm:inline">
                  {user?.name?.split(' ')[0] || 'Friend'}
                </span>
              </button>

              {/* User dropdown menu */}
              <AnimatePresence>
                {showUserDropdown && (
                  <UserDropdownMenu
                    user={user}
                    currentPage={currentPage}
                    onSignOut={handleLogout}
                    onClose={handleCloseUserDropdown}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button - Hidden on small mobile (< 768px) where bottom nav is used,
              visible on tablet (768-1024px) where hamburger menu is still needed */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="bg-white/8 hover:bg-white/12 hidden rounded-lg p-2 transition-all md:block lg:hidden"
              aria-label={showMobileMenu ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={showMobileMenu}
              aria-controls="mobile-navigation"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu - Only visible on tablet (768-1024px), not on small mobile where bottom nav is used */}
        <AnimatePresence>
          {showMobileMenu && (
            <MobileNavigationMenu
              user={user}
              currentPage={currentPage}
              isOpen={showMobileMenu}
              onClose={handleCloseMobileMenu}
            />
          )}
        </AnimatePresence>
      </GlassCard>
    </>
  );
}
