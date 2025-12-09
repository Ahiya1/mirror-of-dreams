/**
 * AppNavigation - Shared navigation component for all authenticated app pages
 *
 * Extracted from: app/dashboard/page.tsx (lines 184-320)
 * Builder: Builder-1 (Iteration 21)
 *
 * Features:
 * - Logo with link to dashboard
 * - Desktop nav links (Journey, Dreams, Reflect, Admin)
 * - Mobile responsive (hamburger menu)
 * - User menu dropdown (Profile, Settings, Upgrade, Help, Sign Out)
 * - Active page highlighting
 * - Optional refresh button
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { DemoBanner } from './DemoBanner';

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
                        <div className="text-xs text-white/60">
                          {user?.email || 'user@example.com'}
                        </div>
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
                          onClick={handleLogout}
                          className="dashboard-dropdown-item w-full text-left text-mirror-error/90 hover:bg-mirror-error/10"
                        >
                          <span>🚪</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
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
                    'rounded-lg px-4 py-3 transition-all duration-300',
                    currentPage === 'dashboard'
                      ? 'bg-white/12 font-medium text-white'
                      : 'bg-white/4 hover:bg-white/8 text-white/70 hover:text-white'
                  )}
                >
                  <span className="mr-2">🏠</span>
                  Journey
                </Link>
                <Link
                  href="/dreams"
                  className={cn(
                    'rounded-lg px-4 py-3 transition-all duration-300',
                    currentPage === 'dreams'
                      ? 'bg-white/12 font-medium text-white'
                      : 'bg-white/4 hover:bg-white/8 text-white/70 hover:text-white'
                  )}
                >
                  <span className="mr-2">✨</span>
                  Dreams
                </Link>
                {user?.tier !== 'free' && (
                  <Link
                    href="/clarify"
                    className={cn(
                      'rounded-lg px-4 py-3 transition-all duration-300',
                      currentPage === 'clarify'
                        ? 'bg-white/12 font-medium text-white'
                        : 'bg-white/4 hover:bg-white/8 text-white/70 hover:text-white'
                    )}
                  >
                    <span className="mr-2">💬</span>
                    Clarify
                  </Link>
                )}
                <Link
                  href="/reflection"
                  className={cn(
                    'rounded-lg px-4 py-3 transition-all duration-300',
                    currentPage === 'reflection'
                      ? 'bg-white/12 font-medium text-white'
                      : 'bg-white/4 hover:bg-white/8 text-white/70 hover:text-white'
                  )}
                >
                  <span className="mr-2">🪞</span>
                  Reflect
                </Link>
                <Link
                  href="/evolution"
                  className={cn(
                    'rounded-lg px-4 py-3 transition-all duration-300',
                    currentPage === 'evolution'
                      ? 'bg-white/12 font-medium text-white'
                      : 'bg-white/4 hover:bg-white/8 text-white/70 hover:text-white'
                  )}
                >
                  <span className="mr-2">📊</span>
                  Evolution
                </Link>
                <Link
                  href="/visualizations"
                  className={cn(
                    'rounded-lg px-4 py-3 transition-all duration-300',
                    currentPage === 'visualizations'
                      ? 'bg-white/12 font-medium text-white'
                      : 'bg-white/4 hover:bg-white/8 text-white/70 hover:text-white'
                  )}
                >
                  <span className="mr-2">🌌</span>
                  Visualizations
                </Link>
                {(user?.isCreator || user?.isAdmin) && (
                  <Link
                    href="/admin"
                    className={cn(
                      'rounded-lg px-4 py-3 transition-all duration-300',
                      currentPage === 'admin'
                        ? 'bg-white/12 font-medium text-white'
                        : 'bg-white/4 hover:bg-white/8 text-white/70 hover:text-white'
                    )}
                  >
                    <span className="mr-2">⚡</span>
                    Admin
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Navigation styles */}
        <style jsx global>{`
          .dashboard-nav-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 9999px;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 300;
            transition: all 0.3s ease;
            white-space: nowrap;
          }

          .dashboard-nav-link:hover,
          .dashboard-nav-link--active {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.9);
            transform: translateY(-1px);
          }

          .dashboard-dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            background: transparent;
            border: none;
            border-radius: 0.5rem;
            color: rgba(255, 255, 255, 0.9);
            text-decoration: none;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            text-align: left;
          }

          .dashboard-dropdown-item:hover {
            background: rgba(255, 255, 255, 0.08);
          }
        `}</style>
      </GlassCard>
    </>
  );
}
