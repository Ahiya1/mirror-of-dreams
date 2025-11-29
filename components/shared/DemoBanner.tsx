/**
 * Demo Banner Component
 *
 * Builder: Builder-1 (Iteration 12)
 *
 * Conditional warning banner for demo users.
 * Appears at top of all pages when user.isDemo === true.
 * Encourages sign-up with clear CTA.
 * Dynamically sets --demo-banner-height CSS variable.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GlowButton } from '@/components/ui/glass/GlowButton';

export function DemoBanner() {
  const router = useRouter();
  const { user } = useAuth();
  const bannerRef = useRef<HTMLDivElement>(null);

  // Measure banner height and set CSS variable
  useEffect(() => {
    const measureHeight = () => {
      if (bannerRef.current && user?.isDemo) {
        const height = bannerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--demo-banner-height', `${height}px`);
      } else {
        document.documentElement.style.setProperty('--demo-banner-height', '0px');
      }
    };

    measureHeight();

    // Re-measure on resize
    window.addEventListener('resize', measureHeight);
    return () => {
      window.removeEventListener('resize', measureHeight);
      // Reset to 0 when component unmounts
      document.documentElement.style.setProperty('--demo-banner-height', '0px');
    };
  }, [user?.isDemo]);

  // Only show for demo users
  if (!user?.isDemo) return null;

  return (
    <div
      ref={bannerRef}
      className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b border-amber-500/30 px-4 sm:px-6 py-2 sm:py-3 fixed top-0 left-0 right-0 z-[110]"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 text-sm text-amber-200 text-center sm:text-left">
          <span className="text-lg sm:text-2xl flex-shrink-0" aria-label="Demo indicator">
            👁️
          </span>
          <span className="leading-tight">
            You're viewing a demo account. Create your own to start reflecting and save your progress.
          </span>
        </div>
        <GlowButton
          variant="primary"
          size="sm"
          onClick={() => router.push('/auth/signup')}
          className="whitespace-nowrap flex-shrink-0"
        >
          Sign Up for Free
        </GlowButton>
      </div>
    </div>
  );
}
