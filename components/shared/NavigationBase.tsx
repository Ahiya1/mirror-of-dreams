/**
 * NavigationBase - Shared base for all navigation variants
 *
 * Extracted from: AppNavigation.tsx
 * Builder: Builder-1 (Iteration 3)
 *
 * Features:
 * - GlassCard container with fixed positioning
 * - Logo with link to homepage/dashboard
 * - Flexible content area (passed as children)
 * - Transparent mode for hero overlap
 */

'use client';

import Link from 'next/link';
import React, { ReactNode } from 'react';

import { GlassCard } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

interface NavigationBaseProps {
  /** Navigation content (links, menus, etc.) */
  children: ReactNode;
  /** Transparent mode for hero section overlap */
  transparent?: boolean;
  /** Home link destination */
  homeHref?: string;
  /** Additional Tailwind classes */
  className?: string;
}

export default function NavigationBase({
  children,
  transparent = false,
  homeHref = '/',
  className,
}: NavigationBaseProps) {
  return (
    <GlassCard
      elevated
      className={cn(
        'fixed left-0 right-0 top-0 z-[100]',
        'rounded-none border-b border-white/10',
        transparent && 'bg-transparent backdrop-blur-sm',
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-2 sm:px-6 sm:py-4">
        {/* Logo */}
        <Link
          href={homeHref}
          className="flex items-center gap-2 text-lg font-normal text-white/90 transition-all hover:-translate-y-0.5 hover:text-white sm:gap-3"
        >
          <span className="text-xl sm:text-2xl">🪞</span>
          <span className="hidden md:inline">Mirror of Dreams</span>
        </Link>

        {/* Navigation Content (passed as children) */}
        {children}
      </div>
    </GlassCard>
  );
}
