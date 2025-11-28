/**
 * Demo Banner Component
 *
 * Builder: Builder-1 (Iteration 12)
 *
 * Conditional warning banner for demo users.
 * Appears at top of all pages when user.isDemo === true.
 * Encourages sign-up with clear CTA.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GlowButton } from '@/components/ui/glass/GlowButton';

export function DemoBanner() {
  const router = useRouter();
  const { user } = useAuth();

  // Only show for demo users
  if (!user?.isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b border-amber-500/30 px-4 sm:px-6 py-3 relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 text-sm text-amber-200 text-center sm:text-left">
          <span className="text-xl sm:text-2xl flex-shrink-0" aria-label="Demo indicator">
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
