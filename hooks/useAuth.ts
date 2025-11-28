'use client';

import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signin: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

/**
 * Authentication hook that manages user state and auth operations
 * Migrated from useAuth.js with tRPC integration
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user (auto-fetches on mount)
  const { data: userData, isLoading: userLoading, refetch } = trpc.users.getProfile.useQuery(
    undefined,
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Signin mutation
  const signinMutation = trpc.auth.signin.useMutation({
    onSuccess: (data) => {
      setUser(data.user);
      setError(null);
      router.push('/dashboard');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Signup mutation
  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: (data) => {
      setUser(data.user);
      setError(null);
      router.push('/dashboard');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Signout mutation
  const signoutMutation = trpc.auth.signout.useMutation({
    onSuccess: () => {
      setUser(null);
      setError(null);
      router.push('/');
    },
    onError: (err) => {
      console.error('Signout error:', err);
      // Still clear user even if API call fails
      setUser(null);
      router.push('/');
    },
  });

  // Update user state when userData changes
  useEffect(() => {
    if (userData) {
      // Map getProfile response to User type
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        tier: userData.tier,
        subscriptionStatus: userData.subscription_status,
        subscriptionPeriod: userData.subscription_period,
        reflectionCountThisMonth: userData.reflection_count_this_month,
        totalReflections: userData.total_reflections,
        currentMonthYear: new Date().toISOString().slice(0, 7), // "2025-01" format
        isCreator: userData.is_creator,
        isAdmin: userData.is_admin,
        isDemo: userData.is_demo || false, // NEW: Demo user flag
        language: userData.language,
        emailVerified: true, // getProfile doesn't return this, default to true
        preferences: userData.preferences || {
          notification_email: true,
          reflection_reminders: 'off',
          evolution_email: true,
          marketing_emails: false,
          default_tone: 'fusion',
          show_character_counter: true,
          reduce_motion_override: null,
          analytics_opt_in: true,
        }, // NEW: User preferences with defaults
        createdAt: userData.created_at,
        lastSignInAt: userData.last_sign_in_at,
        updatedAt: userData.created_at, // getProfile doesn't return updated_at, use created_at
      };
      setUser(user);
    } else {
      setUser(null);
    }
    setIsLoading(userLoading);
  }, [userData, userLoading]);

  /**
   * Sign in user
   */
  const signin = useCallback(
    async (email: string, password: string) => {
      setError(null);
      await signinMutation.mutateAsync({ email, password });
    },
    [signinMutation]
  );

  /**
   * Sign up new user
   */
  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      await signupMutation.mutateAsync({ name, email, password });
    },
    [signupMutation]
  );

  /**
   * Sign out user
   */
  const signout = useCallback(async () => {
    await signoutMutation.mutateAsync();
  }, [signoutMutation]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    user,
    isLoading: isLoading || signinMutation.isPending || signupMutation.isPending || signoutMutation.isPending,
    isAuthenticated: !!user,
    error,
    signin,
    signup,
    signout,
    refreshUser,
    setUser,
  };
}
