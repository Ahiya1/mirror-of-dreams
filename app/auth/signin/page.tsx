// app/auth/signin/page.tsx - Sign in page (unified with design system)

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import CosmicBackground from '@/components/shared/CosmicBackground';
import AuthLayout from '@/components/auth/AuthLayout';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

/**
 * Signin page - unified with design system
 *
 * Features:
 * - CosmicBackground for brand consistency
 * - AuthLayout wrapper for centered card
 * - GlassInput components for form fields
 * - GlowButton cosmic variant for submit
 * - Preserved auto-focus behavior (800ms delay)
 * - Preserved validation and error handling
 */
export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const signinMutation = trpc.auth.signin.useMutation({
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem('token', data.token);

      // Show success message
      setMessage({ text: 'Welcome back! Redirecting...', type: 'success' });

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    },
    onError: (error) => {
      console.error('Signin error:', error);

      let errorMessage = 'Something went wrong. Please try again.';

      if (error.message.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message.includes('Too many')) {
        errorMessage = 'Too many attempts. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({ text: errorMessage, type: 'error' });

      // Clear error after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    },
  });

  // Auto-focus email input with delay for smooth animation (preserved behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      const emailInput = document.getElementById('signin-email');
      if (emailInput) {
        emailInput.focus();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signinMutation.isPending) return;

    const { email, password } = formData;

    // Validation
    if (!email || !password) {
      setMessage({ text: 'Please enter both email and password', type: 'error' });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }

    // Submit via tRPC
    signinMutation.mutate({
      email: email.toLowerCase().trim(),
      password: password,
    });
  };

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="min-h-screen relative">
      {/* Cosmic Background */}
      <CosmicBackground animated={true} intensity={1} />

      {/* Auth Layout */}
      <AuthLayout title="Welcome Back">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <GlassInput
            id="signin-email"
            type="email"
            label="Your email"
            value={formData.email}
            onChange={(value) => {
              setFormData({ ...formData, email: value });
              // Clear messages when user types
              if (message) setMessage(null);
            }}
            placeholder="Enter your email address"
            autoComplete="email"
            required
          />

          {/* Password Input */}
          <GlassInput
            type="password"
            label="Your password"
            value={formData.password}
            onChange={(value) => {
              setFormData({ ...formData, password: value });
              // Clear messages when user types
              if (message) setMessage(null);
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            showPasswordToggle
            required
          />

          {/* Error/Success Message */}
          {message && (
            <div
              className={`p-4 rounded-lg border backdrop-blur-md ${
                message.type === 'error'
                  ? 'bg-red-500/10 border-red-500/50 text-red-200'
                  : 'bg-green-500/10 border-green-500/50 text-green-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <GlowButton
            variant="cosmic"
            size="lg"
            type="submit"
            disabled={signinMutation.isPending}
            className="w-full"
          >
            {signinMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <CosmicLoader size="sm" />
                Signing you in...
              </span>
            ) : (
              'Sign In'
            )}
          </GlowButton>

          {/* Switch to Signup */}
          <div className="text-center space-y-2">
            <p className="text-white/60 text-sm">New to Mirror of Dreams?</p>
            <Link
              href="/auth/signup"
              className="inline-block text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
            >
              Create account
            </Link>
          </div>
        </form>
      </AuthLayout>
    </div>
  );
}
