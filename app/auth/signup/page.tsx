// app/auth/signup/page.tsx - Sign up page (unified with design system)

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import AuthLayout from '@/components/auth/AuthLayout';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { trpc } from '@/lib/trpc';

/**
 * Signup page - unified with design system
 *
 * Features:
 * - CosmicBackground for brand consistency
 * - AuthLayout wrapper for centered card
 * - GlassInput components for form fields
 * - GlowButton cosmic variant for submit
 * - Field-level validation with inline errors
 * - Password strength indicator
 * - Preserved routing logic (onboarding/dashboard)
 */
export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      // Token is now set as HTTP-only cookie by server
      // No localStorage needed

      setMessage({
        text: 'Account created! Please check your email to verify your account.',
        type: 'success',
      });
      setTimeout(() => {
        // Always redirect to verify-required page after signup
        // User must verify email before accessing the app
        router.push('/auth/verify-required');
      }, 1500);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
      setMessage({ text: error.message, type: 'error' });
    },
  });

  /**
   * Handle input changes and clear errors
   */
  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Clear general message
    if (message) {
      setMessage(null);
    }
  };

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  /**
   * Validate form before submission
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    signupMutation.mutate({
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    });
  };

  return (
    <div className="relative min-h-screen">
      {/* Cosmic Background */}
      <CosmicBackground animated={true} intensity={1} />

      {/* Auth Layout */}
      <AuthLayout title="Begin Your Journey" subtitle="A companion awaits">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <GlassInput
            id="name"
            type="text"
            label="Your name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            placeholder="Enter your full name"
            autoComplete="name"
            error={errors.name}
            required
          />

          {/* Email Input */}
          <GlassInput
            id="email"
            type="email"
            label="Your email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            placeholder="Enter your email address"
            autoComplete="email"
            error={errors.email}
            required
          />

          {/* Password Input */}
          <div>
            <GlassInput
              id="password"
              type="password"
              label="Choose a password"
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              placeholder="Create a secure password"
              autoComplete="new-password"
              showPasswordToggle
              minLength={6}
              error={errors.password}
              required
            />
            {/* Password Strength Indicator */}
            <div className="mt-2 text-xs text-white/40">
              {formData.password.length === 0
                ? '6+ characters required'
                : formData.password.length >= 6
                  ? '✓ Valid password length'
                  : `${6 - formData.password.length} more character${6 - formData.password.length > 1 ? 's' : ''} needed`}
            </div>
          </div>

          {/* Confirm Password Input */}
          <GlassInput
            id="confirmPassword"
            type="password"
            label="Confirm password"
            value={formData.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm your password"
            autoComplete="new-password"
            showPasswordToggle
            error={errors.confirmPassword}
            required
          />

          {/* Error/Success Message */}
          {message && (
            <div className={message.type === 'error' ? 'status-box-error' : 'status-box-success'}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <GlowButton
            variant="warm"
            size="lg"
            type="submit"
            disabled={signupMutation.isPending}
            className="w-full"
          >
            {signupMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <CosmicLoader size="sm" />
                Preparing your space...
              </span>
            ) : (
              'Create Your Space'
            )}
          </GlowButton>

          {/* Switch to Signin */}
          <div className="space-y-2 text-center">
            <p className="text-sm text-white/60">Already have a space?</p>
            <Link
              href="/auth/signin"
              className="inline-block text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
            >
              Welcome back
            </Link>
          </div>
        </form>
      </AuthLayout>
    </div>
  );
}
