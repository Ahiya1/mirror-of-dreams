'use client';

import { useState } from 'react';

import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  GlassModal,
  ProgressOrbs,
  GlowBadge,
  AnimatedBackground,
} from '@/components/ui/glass';

/**
 * Design System Showcase Page
 * Displays all glass components with their variants for testing and validation
 */
export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="bg-mirror-dark relative min-h-screen">
      {/* Animated Background */}
      <AnimatedBackground variant="cosmic" intensity="subtle" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-16 p-8">
        {/* Header */}
        <header className="space-y-4 py-12 text-center">
          <GradientText gradient="cosmic" className="text-5xl font-bold">
            Glass Design System
          </GradientText>
          <p className="mx-auto max-w-2xl text-lg text-white/70">
            A comprehensive collection of glassmorphism components with smooth animations,
            accessibility support, and mystical aesthetics.
          </p>
        </header>

        {/* Glass Cards Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Glass Cards</h2>
          <p className="text-white/70">
            Foundation cards with different variants and glass intensities
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <GlassCard>
              <h3 className="mb-2 text-lg font-semibold text-white">Default Card</h3>
              <p className="text-white/70">Standard glass card with subtle blur and border</p>
            </GlassCard>

            <GlassCard elevated>
              <h3 className="mb-2 text-lg font-semibold text-white">Elevated Card</h3>
              <p className="text-white/70">Card with enhanced shadow and border highlight</p>
            </GlassCard>

            <GlassCard interactive>
              <h3 className="mb-2 text-lg font-semibold text-white">Interactive Card</h3>
              <p className="text-white/70">Card with subtle hover lift effect</p>
            </GlassCard>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Glow Buttons</h2>
          <p className="text-white/70">Interactive buttons with gradient and glow effects</p>

          <div className="space-y-4">
            {/* Primary Buttons */}
            <div className="flex flex-wrap gap-4">
              <GlowButton variant="primary" size="sm">
                Small Primary
              </GlowButton>
              <GlowButton variant="primary" size="md">
                Medium Primary
              </GlowButton>
              <GlowButton variant="primary" size="lg">
                Large Primary
              </GlowButton>
            </div>

            {/* Secondary & Ghost */}
            <div className="flex flex-wrap gap-4">
              <GlowButton variant="secondary">Secondary Button</GlowButton>
              <GlowButton variant="ghost">Ghost Button</GlowButton>
              <GlowButton variant="primary" disabled>
                Disabled
              </GlowButton>
            </div>
          </div>
        </section>

        {/* Gradient Text Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Gradient Text</h2>
          <p className="text-white/70">Text with animated gradient colors</p>
          <div className="space-y-4">
            <GradientText gradient="cosmic" className="block text-4xl font-bold">
              Cosmic Gradient Effect
            </GradientText>
            <GradientText gradient="primary" className="block text-4xl font-bold">
              Primary Gradient Effect
            </GradientText>
            <GradientText gradient="dream" className="block text-4xl font-bold">
              Dream Gradient Effect
            </GradientText>
          </div>
        </section>

        {/* Modal Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Glass Modal</h2>
          <p className="text-white/70">Modal dialog with glass overlay</p>
          <GlowButton variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Modal
          </GlowButton>

          <GlassModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Welcome to the Mirror"
          >
            <p className="mb-4">
              This is a glass modal with animated entrance and backdrop blur effect. The overlay can
              be clicked to close, or use the X button.
            </p>
            <div className="flex gap-3">
              <GlowButton variant="primary" onClick={() => setIsModalOpen(false)}>
                Confirm
              </GlowButton>
              <GlowButton variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </GlowButton>
            </div>
          </GlassModal>
        </section>

        {/* Loaders Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Cosmic Loader</h2>
          <p className="text-white/70">Animated gradient ring loader</p>
          <div className="flex items-center gap-8">
            <div className="space-y-2 text-center">
              <CosmicLoader size="sm" />
              <p className="text-sm text-white/60">Small</p>
            </div>
            <div className="space-y-2 text-center">
              <CosmicLoader size="md" />
              <p className="text-sm text-white/60">Medium</p>
            </div>
            <div className="space-y-2 text-center">
              <CosmicLoader size="lg" />
              <p className="text-sm text-white/60">Large</p>
            </div>
          </div>
        </section>

        {/* Progress Orbs Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Progress Orbs</h2>
          <p className="text-white/70">Multi-step progress indicator</p>
          <div className="space-y-4">
            <ProgressOrbs steps={5} currentStep={currentStep} />
            <div className="flex gap-3">
              <GlowButton
                variant="secondary"
                size="sm"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </GlowButton>
              <GlowButton
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                disabled={currentStep === 4}
              >
                Next
              </GlowButton>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Glow Badges</h2>
          <p className="text-white/70">Status badges with glow effects</p>
          <div className="flex flex-wrap gap-4">
            <GlowBadge variant="success">Success</GlowBadge>
            <GlowBadge variant="warning">Warning</GlowBadge>
            <GlowBadge variant="error">Error</GlowBadge>
            <GlowBadge variant="info">Info</GlowBadge>
            <GlowBadge variant="success">Success</GlowBadge>
            <GlowBadge variant="info">Info</GlowBadge>
          </div>
        </section>
      </div>
    </div>
  );
}
