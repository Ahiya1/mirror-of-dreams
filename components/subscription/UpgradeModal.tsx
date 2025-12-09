'use client';

import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { Lock, Zap, Infinity, Clock } from 'lucide-react';
import Link from 'next/link';

type UpgradeReason = 'monthly_limit' | 'daily_limit' | 'feature_locked' | 'dream_limit';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: UpgradeReason;
  featureName?: string;
  resetTime?: Date;
  currentTier?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  featureName,
  resetTime,
  currentTier = 'free',
}: UpgradeModalProps) {
  const getContent = () => {
    switch (reason) {
      case 'monthly_limit':
        return {
          icon: Infinity,
          title: 'Monthly Reflection Limit Reached',
          message: "You've used all your reflections for this month. Upgrade to continue your journey of transformation.",
        };
      case 'daily_limit':
        return {
          icon: Clock,
          title: 'Daily Reflection Limit Reached',
          message: resetTime
            ? `You've reached your daily reflection limit. Try again after ${resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, or upgrade for more capacity.`
            : "You've reached your daily reflection limit. Try again tomorrow, or upgrade for more capacity.",
        };
      case 'feature_locked':
        return {
          icon: Lock,
          title: `Unlock ${featureName || 'This Feature'}`,
          message: `${featureName || 'This feature'} is available on Pro and Unlimited plans. Upgrade to unlock deeper insights.`,
        };
      case 'dream_limit':
        return {
          icon: Zap,
          title: 'Dream Limit Reached',
          message: "You've reached your active dream limit. Upgrade to track more dreams simultaneously.",
        };
      default:
        return {
          icon: Lock,
          title: 'Upgrade to Continue',
          message: 'Upgrade to unlock more features and deepen your reflection practice.',
        };
    }
  };

  const { icon: Icon, title, message } = getContent();

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Icon and Message */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-lg flex-shrink-0">
            <Icon className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-white/80 pt-2">{message}</p>
        </div>

        {/* Tier Comparison Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pro Tier */}
          <div className={`p-4 rounded-lg border transition-all ${
            currentTier === 'free'
              ? 'bg-white/5 border-white/10 hover:border-purple-500/50'
              : 'bg-white/5 border-white/10 opacity-50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-white">Pro</h4>
            </div>

            <p className="text-2xl font-bold text-white mb-1">
              $19
              <span className="text-sm text-white/60 font-normal">/mo</span>
            </p>

            <ul className="text-sm text-white/80 space-y-1.5 mb-4">
              <li>• 30 reflections/month</li>
              <li>• 1 reflection per day</li>
              <li>• 5 active dreams</li>
              <li>• Evolution reports</li>
              <li>• Visualizations</li>
            </ul>

            {currentTier === 'free' && (
              <Link href="/pricing" className="block">
                <GlowButton variant="primary" className="w-full" onClick={onClose}>
                  Choose Pro
                </GlowButton>
              </Link>
            )}
          </div>

          {/* Unlimited Tier */}
          <div className="p-4 bg-white/5 border-2 border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Infinity className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-white">Unlimited</h4>
            </div>

            <p className="text-2xl font-bold text-white mb-1">
              $39
              <span className="text-sm text-white/60 font-normal">/mo</span>
            </p>

            <ul className="text-sm text-white/80 space-y-1.5 mb-4">
              <li>• 60 reflections/month</li>
              <li>• 2 reflections per day</li>
              <li>• Unlimited dreams</li>
              <li>• Extended thinking AI</li>
              <li>• All Pro features</li>
            </ul>

            <Link href="/pricing" className="block">
              <GlowButton variant="primary" className="w-full" onClick={onClose}>
                Choose Unlimited
              </GlowButton>
            </Link>
          </div>
        </div>

        {/* Annual Pricing Note */}
        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">
            Save 17% with annual billing
          </p>
          <Link
            href="/pricing"
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors inline-flex items-center gap-1"
            onClick={onClose}
          >
            View full pricing comparison
            <span>→</span>
          </Link>
        </div>
      </div>
    </GlassModal>
  );
}
