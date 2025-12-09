/**
 * Test page for Builder-1 components
 * Testing: GlowButton cosmic variant, GlassInput enhancements, new layouts
 */

'use client';

import { useState } from 'react';

import AuthLayout from '@/components/auth/AuthLayout';
import CosmicBackground from '@/components/shared/CosmicBackground';
import LandingNavigation from '@/components/shared/LandingNavigation';
import NavigationBase from '@/components/shared/NavigationBase';
import { GlassCard } from '@/components/ui/glass';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';

export default function TestComponentsPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [text, setText] = useState('');
  const [textarea, setTextarea] = useState('');
  const [emailError, setEmailError] = useState('');

  return (
    <div className="relative min-h-screen">
      <CosmicBackground animated={true} intensity={1} />
      <LandingNavigation />

      <div className="relative z-10 px-4 pb-12 pt-24">
        <div className="mx-auto max-w-6xl space-y-12">
          {/* GlowButton Variants */}
          <GlassCard elevated className="p-8">
            <h2 className="mb-6 text-2xl font-semibold text-white">GlowButton Variants</h2>
            <div className="flex flex-wrap gap-4">
              <GlowButton variant="primary" size="sm">
                Primary Small
              </GlowButton>
              <GlowButton variant="primary" size="md">
                Primary Medium
              </GlowButton>
              <GlowButton variant="primary" size="lg">
                Primary Large
              </GlowButton>
              <GlowButton variant="secondary" size="md">
                Secondary
              </GlowButton>
              <GlowButton variant="ghost" size="md">
                Ghost
              </GlowButton>
              <GlowButton variant="cosmic" size="md">
                Cosmic NEW
              </GlowButton>
              <GlowButton variant="cosmic" size="lg">
                Cosmic Large
              </GlowButton>
            </div>
          </GlassCard>

          {/* GlassInput Enhancements */}
          <GlassCard elevated className="p-8">
            <h2 className="mb-6 text-2xl font-semibold text-white">GlassInput Enhancements</h2>
            <div className="max-w-md space-y-6">
              <GlassInput
                type="text"
                label="Text Input"
                value={text}
                onChange={setText}
                placeholder="Enter text"
              />

              <GlassInput
                type="email"
                label="Email Input (NEW)"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setEmailError(value && !value.includes('@') ? 'Invalid email' : '');
                }}
                placeholder="your@email.com"
                autoComplete="email"
                error={emailError}
                required
              />

              <GlassInput
                type="password"
                label="Password with Toggle (NEW)"
                value={password}
                onChange={setPassword}
                placeholder="Enter password"
                showPasswordToggle
                autoComplete="new-password"
                minLength={6}
                required
              />

              <GlassInput
                variant="textarea"
                label="Textarea (Existing)"
                value={textarea}
                onChange={setTextarea}
                placeholder="Enter description..."
                rows={4}
                maxLength={200}
                showCounter
              />
            </div>
          </GlassCard>

          {/* AuthLayout Preview */}
          <GlassCard elevated className="p-8">
            <h2 className="mb-6 text-2xl font-semibold text-white">AuthLayout Preview</h2>
            <p className="mb-4 text-white/70">
              AuthLayout component renders full-page centered card. See /auth/signin for live
              example.
            </p>
            <div className="rounded-lg border border-white/10 bg-white/5 p-8">
              <div className="mx-auto max-w-md">
                <AuthLayout title="Test Auth Layout">
                  <p className="text-center text-white/70">Form content goes here</p>
                </AuthLayout>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
