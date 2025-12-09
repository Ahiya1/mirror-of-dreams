// app/not-found.tsx - 404 page with companion voice

import Link from 'next/link';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlowButton } from '@/components/ui/glass/GlowButton';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <CosmicBackground />

      <div className="text-center relative z-10 px-6 max-w-lg">
        {/* Warm glow accent */}
        <div className="absolute inset-0 -z-10 blur-3xl opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-amber-500/10 to-purple-500/20 rounded-full" />
        </div>

        {/* Icon */}
        <div className="text-6xl mb-6 opacity-80">🌙</div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-amber-300/80 to-purple-400 bg-clip-text text-transparent">
          This path leads elsewhere
        </h1>

        {/* Message */}
        <p className="text-lg text-white/70 mb-8 leading-relaxed">
          We wandered somewhere unexpected.
          <br />
          Let me guide you back.
        </p>

        {/* CTA */}
        <Link href="/">
          <GlowButton variant="warm" size="lg">
            Return Home
          </GlowButton>
        </Link>
      </div>
    </div>
  );
}
