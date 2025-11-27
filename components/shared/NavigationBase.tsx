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

import React, { ReactNode } from 'react';
import Link from 'next/link';
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
        'fixed top-0 left-0 right-0 z-[100]',
        'rounded-none border-b border-white/10',
        transparent && 'bg-transparent backdrop-blur-sm',
        className
      )}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={homeHref}
          className="flex items-center gap-3 text-white/90 hover:text-white transition-all hover:-translate-y-0.5 text-lg font-normal"
        >
          <span className="text-2xl">🪞</span>
          <span className="hidden md:inline">Mirror of Dreams</span>
        </Link>

        {/* Navigation Content (passed as children) */}
        {children}
      </div>
    </GlassCard>
  );
}
