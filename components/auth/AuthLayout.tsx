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

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass';

interface AuthLayoutProps {
  /** Page title */
  title?: string;
  /** Form content */
  children: ReactNode;
}

export default function AuthLayout({ title = 'Welcome', children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md">
        <GlassCard elevated className="p-8 md:p-10">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center justify-center gap-3 mb-8 text-white/90 hover:text-white transition-all hover:-translate-y-0.5"
          >
            <span className="text-4xl">🪞</span>
            <span className="text-2xl font-light">Mirror of Dreams</span>
          </Link>

          {/* Title */}
          {title && (
            <h1 className="text-3xl font-light text-center mb-8 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {title}
            </h1>
          )}

          {/* Form Content */}
          {children}
        </GlassCard>
      </div>
    </div>
  );
}
