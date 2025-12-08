'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlowButton, CosmicLoader } from '@/components/ui/glass';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { useToast } from '@/contexts/ToastContext';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyRequiredPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, signout, refreshUser } = useAuth();
  const toast = useToast();

  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Redirect if already verified or not authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user?.emailVerified || user?.isCreator || user?.isAdmin || user?.isDemo) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Poll for verification status (every 5 seconds)
  useEffect(() => {
    if (!user || user.emailVerified) return;

    const interval = setInterval(async () => {
      await refreshUser();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, refreshUser]);

  // Handle resend
  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isResending || !user) return;

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.alreadyVerified) {
          toast.success('Email already verified!');
          router.push('/dashboard');
        } else {
          toast.success('Verification email sent!');
          setCooldown(RESEND_COOLDOWN_SECONDS);
        }
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  }, [cooldown, isResending, user, router, toast]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    await signout();
    router.push('/auth/signin');
  }, [signout, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="flex items-center justify-center min-h-screen">
          <CosmicLoader size="lg" />
        </div>
      </div>
    );
  }

  // Don't render if not in correct state
  if (!isAuthenticated || !user || user.emailVerified || user.isCreator || user.isAdmin || user.isDemo) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      <div className="flex items-center justify-center min-h-screen px-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          {/* Email Icon */}
          <div className="text-6xl mb-6">
            <span role="img" aria-label="email">&#128231;</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-white mb-2">
            Verify Your Email
          </h1>

          {/* Message */}
          <p className="text-white/70 mb-4">
            We sent a verification link to
          </p>
          <p className="text-emerald-400 font-medium mb-6">
            {user.email}
          </p>

          {/* Instructions */}
          <p className="text-white/50 text-sm mb-8">
            Check your inbox (and spam folder) for the verification email.
            Click the link to verify your account.
          </p>

          {/* Resend Button */}
          <GlowButton
            variant="cosmic"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="w-full"
          >
            {isResending
              ? 'Sending...'
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend Verification Email'}
          </GlowButton>

          {/* Sign Out Link */}
          <button
            onClick={handleSignOut}
            className="mt-6 text-white/50 text-sm hover:text-white/70 transition-colors"
          >
            Sign out and use a different email
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
