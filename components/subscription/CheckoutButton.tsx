'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { TierName, BillingPeriod } from '@/lib/utils/constants';

import { GlowButton } from '@/components/ui/glass/GlowButton';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';

interface CheckoutButtonProps {
  tier: Exclude<TierName, 'free'>;
  period: BillingPeriod;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function CheckoutButton({
  tier,
  period,
  className,
  variant = 'primary',
}: CheckoutButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createCheckout = trpc.subscriptions.createCheckout.useMutation({
    onSuccess: (data) => {
      // Open PayPal in a popup window for better UX
      const width = 500;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.approvalUrl,
        'PayPal Checkout',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        // Popup blocked, fall back to redirect
        toast.info('Redirecting to PayPal...');
        window.location.href = data.approvalUrl;
      } else {
        // Monitor popup for completion
        const checkPopup = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkPopup);
              setIsLoading(false);
              // Refresh to check if subscription was activated
              router.refresh();
            }
          } catch {
            // Cross-origin error, popup might be on PayPal domain
          }
        }, 500);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to start checkout');
      setIsLoading(false);
    },
  });

  const handleClick = () => {
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

    setIsLoading(true);
    createCheckout.mutate({ tier, period });
  };

  return (
    <GlowButton variant={variant} onClick={handleClick} disabled={isLoading} className={className}>
      {isLoading ? 'Processing...' : `Start ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
    </GlowButton>
  );
}
