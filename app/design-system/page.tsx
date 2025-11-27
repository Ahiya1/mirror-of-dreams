'use client';

import { useState } from 'react';
import { Sparkles, Moon, Star, Home, Settings } from 'lucide-react';
import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  DreamCard,
  GlassModal,
  FloatingNav,
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
    <div className="min-h-screen bg-mirror-dark relative">
      {/* Animated Background */}
      <AnimatedBackground variant="cosmic" intensity="subtle" />

      <div className="relative z-10 p-8 space-y-16 max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center space-y-4 py-12">
          <GradientText gradient="cosmic" className="text-5xl font-bold">
            Glass Design System
          </GradientText>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard>
              <h3 className="text-lg font-semibold text-white mb-2">Default Card</h3>
              <p className="text-white/70">
                Standard glass card with subtle blur and border
              </p>
            </GlassCard>

            <GlassCard elevated>
              <h3 className="text-lg font-semibold text-white mb-2">Elevated Card</h3>
              <p className="text-white/70">
                Card with enhanced shadow and border highlight
              </p>
            </GlassCard>

            <GlassCard interactive>
              <h3 className="text-lg font-semibold text-white mb-2">Interactive Card</h3>
              <p className="text-white/70">
                Card with subtle hover lift effect
              </p>
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
            <GradientText gradient="cosmic" className="text-4xl font-bold block">
              Cosmic Gradient Effect
            </GradientText>
            <GradientText gradient="primary" className="text-4xl font-bold block">
              Primary Gradient Effect
            </GradientText>
            <GradientText gradient="dream" className="text-4xl font-bold block">
              Dream Gradient Effect
            </GradientText>
          </div>
        </section>

        {/* Dream Cards Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Dream Cards</h2>
          <p className="text-white/70">Specialized cards for dream entries</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DreamCard
              title="The Cosmic Journey"
              content="I found myself floating through a vast expanse of stars, each one whispering secrets of the universe. Colors I'd never seen before painted the void, and time seemed to lose all meaning..."
              date="October 23, 2025"
              tone="Mystical"
              onClick={() => console.log('Dream clicked!')}
            />
            <DreamCard
              title="The Mirror Realm"
              content="Standing before an infinite mirror, I saw not my reflection but countless versions of myself, each one living a different life, making different choices..."
              date="October 22, 2025"
              tone="Profound"
            />
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
              This is a glass modal with animated entrance and backdrop blur effect. The
              overlay can be clicked to close, or use the X button.
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
              <p className="text-white/60 text-sm">Small</p>
            </div>
            <div className="space-y-2 text-center">
              <CosmicLoader size="md" />
              <p className="text-white/60 text-sm">Medium</p>
            </div>
            <div className="space-y-2 text-center">
              <CosmicLoader size="lg" />
              <p className="text-white/60 text-sm">Large</p>
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
            <GlowBadge variant="success">
              Success
            </GlowBadge>
            <GlowBadge variant="info">
              Info
            </GlowBadge>
          </div>
        </section>

        {/* Floating Nav Demo */}
        <section className="space-y-6 pb-32">
          <h2 className="text-3xl font-bold text-white">Floating Navigation</h2>
          <p className="text-white/70">
            Fixed navigation bar at the bottom (scroll to see it in action)
          </p>
        </section>
      </div>

      {/* Floating Navigation */}
      <FloatingNav
        items={[
          { label: 'Home', href: '/', icon: <Home className="w-5 h-5" />, active: false },
          {
            label: 'Design',
            href: '/design-system',
            icon: <Sparkles className="w-5 h-5" />,
            active: true,
          },
          { label: 'Dreams', href: '/dreams', icon: <Moon className="w-5 h-5" /> },
          { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
        ]}
      />
    </div>
  );
}
