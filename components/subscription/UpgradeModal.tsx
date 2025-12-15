'use client';

import { Lock, Zap, Infinity, Clock } from 'lucide-react';
import Link from 'next/link';

import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';

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
          title: "You've Filled This Month's Space",
          message:
            "Your reflections are held safe. Come back next month, or expand your space if you'd like to continue.",
        };
      case 'daily_limit':
        return {
          icon: Clock,
          title: 'Rest Until Tomorrow',
          message: resetTime
            ? `You've reflected deeply today. Return after ${resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, or expand your space for more reflections.`
            : "You've reflected deeply today. Return tomorrow, or expand your space for more reflections.",
        };
      case 'feature_locked':
        return {
          icon: Lock,
          title: `When You're Ready for ${featureName || 'More'}`,
          message: `${featureName || 'This experience'} awaits you in Seeker and Devoted spaces. Expand when you feel called.`,
        };
      case 'dream_limit':
        return {
          icon: Zap,
          title: 'Your Dreams Are Full',
          message:
            "You're holding the maximum number of dreams. Complete one to begin another, or expand your space to hold more.",
        };
      default:
        return {
          icon: Lock,
          title: 'Expand Your Space',
          message:
            'When you feel ready for deeper reflections, your expanded space will be waiting.',
        };
    }
  };

  const { icon: Icon, title, message } = getContent();

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Icon and Message */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-lg bg-purple-500/20 p-3">
            <Icon className="h-6 w-6 text-purple-400" />
          </div>
          <p className="pt-2 text-white/80">{message}</p>
        </div>

        {/* Tier Comparison Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Seeker Tier */}
          <div
            className={`rounded-lg border p-4 transition-all ${
              currentTier === 'free'
                ? 'border-white/10 bg-white/5 hover:border-purple-500/50'
                : 'border-white/10 bg-white/5 opacity-50'
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-400" />
              <h4 className="font-semibold text-white">Seeker</h4>
            </div>

            <p className="mb-1 text-2xl font-bold text-white">
              $19
              <span className="text-sm font-normal text-white/60">/mo</span>
            </p>

            <ul className="mb-4 space-y-1.5 text-sm text-white/80">
              <li>• 30 reflections/month</li>
              <li>• Hold 5 dreams at once</li>
              <li>• Journey insights</li>
              <li>• Pattern visualizations</li>
            </ul>

            {currentTier === 'free' && (
              <Link href="/pricing" className="block">
                <GlowButton variant="warm" className="w-full" onClick={onClose}>
                  Become Seeker
                </GlowButton>
              </Link>
            )}
          </div>

          {/* Devoted Tier */}
          <div className="rounded-lg border-2 border-purple-500/30 bg-white/5 p-4 transition-all hover:border-purple-500/50">
            <div className="mb-3 flex items-center gap-2">
              <Infinity className="h-5 w-5 text-purple-400" />
              <h4 className="font-semibold text-white">Devoted</h4>
            </div>

            <p className="mb-1 text-2xl font-bold text-white">
              $39
              <span className="text-sm font-normal text-white/60">/mo</span>
            </p>

            <ul className="mb-4 space-y-1.5 text-sm text-white/80">
              <li>• 60 reflections/month</li>
              <li>• Hold unlimited dreams</li>
              <li>• Deeper reflection time</li>
              <li>• Everything in Seeker</li>
            </ul>

            <Link href="/pricing" className="block">
              <GlowButton variant="warm" className="w-full" onClick={onClose}>
                Become Devoted
              </GlowButton>
            </Link>
          </div>
        </div>

        {/* Annual Pricing Note */}
        <div className="text-center">
          <p className="mb-2 text-sm text-white/60">Save 17% with annual billing</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300"
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
