/**
 * LandingNavigation - Minimal navigation for landing page
 *
 * Builder: Builder-1 (Iteration 3)
 *
 * Features:
 * - Extends NavigationBase
 * - Simple "Sign In" link
 * - Transparent mode for hero overlap
 * - Mobile responsive
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import NavigationBase from './NavigationBase';

import { GlowButton } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

interface LandingNavigationProps {
  /** Transparent mode for hero section overlap */
  transparent?: boolean;
}

export default function LandingNavigation({ transparent = false }: LandingNavigationProps) {
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <NavigationBase transparent={transparent} homeHref="/">
        <div className="flex items-center gap-4">
          {/* Desktop Sign In */}
          <div className="hidden sm:block">
            <GlowButton variant="secondary" size="sm" onClick={() => router.push('/auth/signin')}>
              Sign In
            </GlowButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="bg-white/8 hover:bg-white/12 rounded-lg p-2 transition-all sm:hidden"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </NavigationBase>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 top-[52px] z-[90] sm:top-[72px] sm:hidden"
          >
            <div className="border-b border-white/10 bg-mirror-void-deep/95 p-4 backdrop-blur-lg">
              <Link
                href="/auth/signin"
                className={cn(
                  'block rounded-lg px-4 py-3',
                  'bg-white/5 hover:bg-white/10',
                  'text-center text-white',
                  'transition-all'
                )}
                onClick={() => setShowMobileMenu(false)}
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
