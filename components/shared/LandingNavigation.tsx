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

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => router.push('/auth/signin')}
            >
              Sign In
            </GlowButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="sm:hidden p-2 rounded-lg bg-white/8 hover:bg-white/12 transition-all"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
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
            className="fixed top-[72px] left-0 right-0 z-[90] sm:hidden"
          >
            <div className="bg-mirror-void-deep/95 backdrop-blur-lg border-b border-white/10 p-4">
              <Link
                href="/auth/signin"
                className={cn(
                  'block px-4 py-3 rounded-lg',
                  'bg-white/5 hover:bg-white/10',
                  'text-white text-center',
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
