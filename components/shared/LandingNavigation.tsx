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

import { useRouter } from 'next/navigation';

import NavigationBase from './NavigationBase';

import { GlowButton } from '@/components/ui/glass';

interface LandingNavigationProps {
  /** Transparent mode for hero section overlap */
  transparent?: boolean;
}

export default function LandingNavigation({ transparent = false }: LandingNavigationProps) {
  const router = useRouter();

  return (
    <NavigationBase transparent={transparent} homeHref="/">
      {/* Sign In button - visible on all screen sizes */}
      <GlowButton variant="secondary" size="sm" onClick={() => router.push('/auth/signin')}>
        Sign In
      </GlowButton>
    </NavigationBase>
  );
}
