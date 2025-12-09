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
          title: "You've Filled This Month's Space",
          message: "Your reflections are held safe. Come back next month, or expand your space if you'd like to continue.",
        };
      case 'daily_limit':
        return {
          icon: Clock,
          title: 'Rest Until Tomorrow',
          message: resetTime
            ? `You've reflected deeply today. Return after ${resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, or expand your space for more conversations.`
            : "You've reflected deeply today. Return tomorrow, or expand your space for more conversations.",
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
          message: "You're holding the maximum number of dreams. Complete one to begin another, or expand your space to hold more.",
        };
      default:
        return {
          icon: Lock,
          title: 'Expand Your Space',
          message: 'When you feel ready for deeper conversations, your expanded space will be waiting.',
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
          {/* Seeker Tier */}
          <div className={`p-4 rounded-lg border transition-all ${
            currentTier === 'free'
              ? 'bg-white/5 border-white/10 hover:border-purple-500/50'
              : 'bg-white/5 border-white/10 opacity-50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-white">Seeker</h4>
            </div>

            <p className="text-2xl font-bold text-white mb-1">
              $19
              <span className="text-sm text-white/60 font-normal">/mo</span>
            </p>

            <ul className="text-sm text-white/80 space-y-1.5 mb-4">
              <li>• 30 conversations/month</li>
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
          <div className="p-4 bg-white/5 border-2 border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Infinity className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-white">Devoted</h4>
            </div>

            <p className="text-2xl font-bold text-white mb-1">
              $39
              <span className="text-sm text-white/60 font-normal">/mo</span>
            </p>

            <ul className="text-sm text-white/80 space-y-1.5 mb-4">
              <li>• 60 conversations/month</li>
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
