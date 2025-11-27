/**
 * LandingFeatureCard - Feature highlight card
 *
 * Builder: Builder-2 (Iteration 3)
 *
 * Features:
 * - Icon/emoji display
 * - Gradient headline
 * - Description text
 * - Interactive hover effect (from GlassCard)
 * - Accessible structure
 */

'use client';

import { GlassCard } from '@/components/ui/glass';

interface LandingFeatureCardProps {
  /** Emoji icon */
  icon: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
}

export default function LandingFeatureCard({
  icon,
  title,
  description,
}: LandingFeatureCardProps) {
  return (
    <GlassCard interactive className="p-8 text-center h-full">
      {/* Icon */}
      <div className="text-6xl mb-4" aria-hidden="true">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        {title}
      </h3>

      {/* Description */}
      <p className="text-white/70 leading-relaxed">
        {description}
      </p>
    </GlassCard>
  );
}
