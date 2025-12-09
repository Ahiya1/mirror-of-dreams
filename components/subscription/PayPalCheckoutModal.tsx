'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { X } from 'lucide-react';
import { useState, useCallback } from 'react';

import type { TierName, BillingPeriod } from '@/lib/utils/constants';

import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { TIER_PRICING } from '@/lib/utils/constants';

interface PayPalCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: Exclude<TierName, 'free'>;
  period: BillingPeriod;
  onSuccess: () => void;
}

export function PayPalCheckoutModal({
  isOpen,
  onClose,
  tier,
  period,
  onSuccess,
}: PayPalCheckoutModalProps) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [isActivating, setIsActivating] = useState(false);

  // Get plan ID using tRPC
  const {
    data: planData,
    isLoading,
    error,
  } = trpc.subscriptions.getPlanId.useQuery({ tier, period }, { enabled: isOpen });

  // Activate subscription mutation
  const activateMutation = trpc.subscriptions.activateSubscription.useMutation({
    onSuccess: async (data) => {
      toast.success(`Welcome to ${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)}!`);
      await refreshUser();
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to activate subscription');
      setIsActivating(false);
    },
  });

  // Handle successful subscription approval
  const handleApprove = useCallback(
    async (data: { subscriptionID?: string | null }) => {
      if (!data.subscriptionID) {
        toast.error('Subscription creation failed');
        return;
      }

      setIsActivating(true);
      activateMutation.mutate({ subscriptionId: data.subscriptionID });
    },
    [activateMutation, toast]
  );

  // Handle errors
  const handleError = useCallback(
    (err: Record<string, unknown>) => {
      console.error('PayPal error:', err);
      toast.error('Payment failed. Please try again.');
    },
    [toast]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    toast.info('Payment cancelled');
  }, [toast]);

  if (!isOpen) return null;

  const price = period === 'monthly' ? TIER_PRICING[tier].monthly : TIER_PRICING[tier].yearly;

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <GlassCard className="relative z-10 mx-4 w-full max-w-md p-6" elevated>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/60 transition-colors hover:text-white"
          aria-label="Close"
          disabled={isActivating}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">
            Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </h2>
          <p className="text-white/60">
            ${price}/{period === 'monthly' ? 'month' : 'year'}
          </p>
        </div>

        {/* Content */}
        {isLoading || isActivating || !user ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <CosmicLoader size="lg" />
            {isActivating && (
              <p className="text-sm text-white/60">Activating your subscription...</p>
            )}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-mirror-error">{error.message || 'Failed to load checkout'}</p>
            <button onClick={onClose} className="text-white/60 transition-colors hover:text-white">
              Close
            </button>
          </div>
        ) : planData?.planId && clientId && user ? (
          <PayPalScriptProvider
            options={{
              clientId,
              vault: true,
              intent: 'subscription',
              components: 'buttons',
            }}
          >
            <PayPalButtons
              style={{
                shape: 'rect',
                color: 'gold',
                layout: 'vertical',
                label: 'subscribe',
              }}
              createSubscription={(_data, actions) => {
                const baseUrl = window.location.origin;
                return actions.subscription.create({
                  plan_id: planData.planId,
                  custom_id: user.id,
                  application_context: {
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'SUBSCRIBE_NOW',
                    brand_name: 'Mirror of Dreams',
                    return_url: `${baseUrl}/subscription/success`,
                    cancel_url: `${baseUrl}/pricing`,
                  },
                });
              }}
              onApprove={handleApprove}
              onError={handleError}
              onCancel={handleCancel}
            />
          </PayPalScriptProvider>
        ) : (
          <div className="py-8 text-center">
            <p className="text-mirror-error">PayPal is not configured</p>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-white/40">Secure payment powered by PayPal</p>
      </GlassCard>
    </div>
  );
}
