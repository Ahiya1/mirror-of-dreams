/**
 * LandingHero - Hero section for landing page
 *
 * Builder: Builder-2 (Iteration 3)
 *
 * Features:
 * - Large headline with gradient text
 * - Compelling subheadline
 * - Dual CTAs (Start Reflecting + Learn More)
 * - Responsive layout (mobile stacks vertically)
 * - Fade-in animation
 */

'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GlowButton } from '@/components/ui/glass';

export default function LandingHero() {
  const router = useRouter();

  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="text-center max-w-4xl mx-auto px-4"
    >
      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Your Dreams, Reflected
        </span>
      </h1>

      {/* Subheadline */}
      <p className="text-xl sm:text-2xl text-white/80 mb-12 leading-relaxed">
        AI-powered reflection journal that helps you understand your subconscious
        and track your dream evolution over time.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <GlowButton
          variant="cosmic"
          size="lg"
          onClick={() => router.push('/auth/signup')}
        >
          Start Reflecting
        </GlowButton>
        <GlowButton
          variant="secondary"
          size="lg"
          onClick={handleLearnMore}
        >
          Learn More
        </GlowButton>
      </div>
    </motion.div>
  );
}
