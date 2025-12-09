/**
 * AuthLayout - Shared layout wrapper for signin/signup pages
 *
 * Builder: Builder-1 (Iteration 3)
 *
 * Features:
 * - CosmicBackground for consistency
 * - Centered container (max-width 480px)
 * - Consistent padding and responsive spacing
 * - Logo and title
 */

'use client';

import Link from 'next/link';
import React, { ReactNode } from 'react';

import { GlassCard } from '@/components/ui/glass';

interface AuthLayoutProps {
  /** Page title */
  title?: string;
  /** Page subtitle */
  subtitle?: string;
  /** Form content */
  children: ReactNode;
}

export default function AuthLayout({ title = 'Welcome', subtitle, children }: AuthLayoutProps) {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <GlassCard elevated className="p-8 md:p-10">
          {/* Logo */}
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-3 text-white/90 transition-all hover:-translate-y-0.5 hover:text-white"
          >
            <span className="text-4xl">🪞</span>
            <span className="text-2xl font-light">Mirror of Dreams</span>
          </Link>

          {/* Title */}
          {title && (
            <h1 className="mb-2 bg-gradient-to-r from-purple-400 via-amber-300/80 to-purple-400 bg-clip-text text-center text-3xl font-light text-transparent">
              {title}
            </h1>
          )}

          {/* Subtitle */}
          {subtitle && <p className="mb-8 text-center text-lg text-white/60">{subtitle}</p>}

          {/* Spacer if no subtitle */}
          {!subtitle && title && <div className="mb-6" />}

          {/* Form Content */}
          {children}
        </GlassCard>
      </div>
    </div>
  );
}
