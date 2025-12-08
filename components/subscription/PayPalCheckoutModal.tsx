'use client';

import { useState, useCallback } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { trpc } from '@/lib/trpc';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import type { TierName, BillingPeriod } from '@/lib/utils/constants';
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
  const { data: planData, isLoading, error } = trpc.subscriptions.getPlanId.useQuery(
    { tier, period },
    { enabled: isOpen }
  );

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
  const handleApprove = useCallback(async (data: { subscriptionID?: string | null }) => {
    if (!data.subscriptionID) {
      toast.error('Subscription creation failed');
      return;
    }

    setIsActivating(true);
    activateMutation.mutate({ subscriptionId: data.subscriptionID });
  }, [activateMutation, toast]);

  // Handle errors
  const handleError = useCallback((err: Record<string, unknown>) => {
    console.error('PayPal error:', err);
    toast.error('Payment failed. Please try again.');
  }, [toast]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    toast.info('Payment cancelled');
  }, [toast]);

  if (!isOpen) return null;

  const price = period === 'monthly'
    ? TIER_PRICING[tier].monthly
    : TIER_PRICING[tier].yearly;

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <GlassCard className="relative z-10 w-full max-w-md mx-4 p-6" elevated>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          aria-label="Close"
          disabled={isActivating}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </h2>
          <p className="text-white/60">
            ${price}/{period === 'monthly' ? 'month' : 'year'}
          </p>
        </div>

        {/* Content */}
        {isLoading || isActivating || !user ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CosmicLoader size="lg" />
            {isActivating && (
              <p className="text-white/60 text-sm">Activating your subscription...</p>
            )}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error.message || 'Failed to load checkout'}</p>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
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
          <div className="text-center py-8">
            <p className="text-red-400">PayPal is not configured</p>
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-white/40 text-xs mt-4">
          Secure payment powered by PayPal
        </p>
      </GlassCard>
    </div>
  );
}
