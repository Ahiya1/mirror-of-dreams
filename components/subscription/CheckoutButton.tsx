'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import type { TierName, BillingPeriod } from '@/lib/utils/constants';

interface CheckoutButtonProps {
  tier: Exclude<TierName, 'free'>;
  period: BillingPeriod;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function CheckoutButton({ tier, period, className, variant = 'primary' }: CheckoutButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const createCheckoutMutation = trpc.subscriptions.createCheckout.useMutation({
    onSuccess: (data) => {
      // Redirect to PayPal approval page
      window.location.href = data.approvalUrl;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start checkout. Please try again.');
      setIsCreatingCheckout(false);
    },
  });

  const handleClick = async () => {
    // Require authentication for paid tiers
    if (!isAuthenticated) {
      router.push(`/auth/signup?plan=${tier}&period=${period}`);
      return;
    }

    // Check if already on this tier
    if (user?.tier === tier) {
      toast.info(`You're already on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan.`);
      return;
    }

    // Prevent double-clicks
    if (isCreatingCheckout) {
      return;
    }

    // Create PayPal checkout session
    setIsCreatingCheckout(true);
    createCheckoutMutation.mutate({ tier, period });
  };

  return (
    <GlowButton
      variant={variant}
      onClick={handleClick}
      disabled={isCreatingCheckout}
      className={className}
    >
      {isCreatingCheckout ? 'Redirecting to PayPal...' : `Start ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
    </GlowButton>
  );
}
