'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { PayPalCheckoutModal } from './PayPalCheckoutModal';
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    // Open the PayPal checkout modal
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    // Refresh the page to show updated tier
    router.refresh();
  };

  return (
    <>
      <GlowButton
        variant={variant}
        onClick={handleClick}
        className={className}
      >
        Start {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </GlowButton>

      <PayPalCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tier={tier}
        period={period}
        onSuccess={handleSuccess}
      />
    </>
  );
}
