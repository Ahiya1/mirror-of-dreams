'use client';

import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { useToast } from '@/contexts/ToastContext';
import { trpc } from '@/lib/trpc';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: {
    tier: string;
    period: string;
    expiresAt?: string;
  };
  onSuccess?: () => void;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const toast = useToast();
  const [confirmChecked, setConfirmChecked] = useState(false);

  const cancelMutation = trpc.subscriptions.cancel.useMutation({
    onSuccess: () => {
      toast.success('Subscription canceled. Access continues until period end.');
      setConfirmChecked(false);
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });

  const handleCancel = () => {
    if (!confirmChecked) {
      toast.error('Please confirm you understand the cancellation');
      return;
    }

    cancelMutation.mutate();
  };

  const handleClose = () => {
    if (!cancelMutation.isPending) {
      setConfirmChecked(false);
      onClose();
    }
  };

  const tierName = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1);
  const expiryDate = subscription.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'the end of your billing period';

  return (
    <GlassModal isOpen={isOpen} onClose={handleClose} title="Cancel Subscription">
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-mirror-warning/30 bg-mirror-warning/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-mirror-warning" />
          <div className="text-sm text-white/80">
            <p className="mb-2 font-semibold text-white">Are you sure you want to cancel?</p>
            <p>
              Your {tierName} {subscription.period} subscription will be canceled, but you'll retain
              access until {expiryDate}.
            </p>
          </div>
        </div>

        {/* What You'll Lose */}
        <div className="space-y-2 text-sm text-white/80">
          <p className="font-semibold text-white">What you'll lose:</p>
          <ul className="ml-2 list-inside list-disc space-y-1">
            {subscription.tier === 'pro' && (
              <>
                <li>30 reflections per month (back to 2)</li>
                <li>1 daily reflection limit</li>
                <li>5 active dreams (back to 2)</li>
                <li>Evolution reports</li>
                <li>Visualizations</li>
                <li>Advanced AI model</li>
              </>
            )}
            {subscription.tier === 'unlimited' && (
              <>
                <li>60 reflections per month (back to 2)</li>
                <li>2 daily reflections limit</li>
                <li>Extended thinking AI mode</li>
                <li>Unlimited dreams (back to 2)</li>
                <li>Evolution reports</li>
                <li>Visualizations</li>
              </>
            )}
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <label className="group flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer rounded border-white/30 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-sm text-white/80 transition-colors group-hover:text-white">
            I understand I will lose access to {tierName} features at the end of my billing period
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <GlowButton
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={cancelMutation.isPending}
          >
            Keep Subscription
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={handleCancel}
            className="flex-1 border-red-500/50 bg-red-500/20 hover:bg-red-500/30"
            disabled={!confirmChecked || cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Canceling...' : 'Cancel Subscription'}
          </GlowButton>
        </div>
      </div>
    </GlassModal>
  );
}
