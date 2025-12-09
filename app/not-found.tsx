// app/not-found.tsx - 404 page with companion voice

import Link from 'next/link';

import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlowButton } from '@/components/ui/glass/GlowButton';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <CosmicBackground />

      <div className="relative z-10 max-w-lg px-6 text-center">
        {/* Warm glow accent */}
        <div className="absolute inset-0 -z-10 opacity-30 blur-3xl">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 via-amber-500/10 to-purple-500/20" />
        </div>

        {/* Icon */}
        <div className="mb-6 text-6xl opacity-80">🌙</div>

        {/* Headline */}
        <h1 className="mb-4 bg-gradient-to-r from-purple-400 via-amber-300/80 to-purple-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
          This path leads elsewhere
        </h1>

        {/* Message */}
        <p className="mb-8 text-lg leading-relaxed text-white/70">
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
