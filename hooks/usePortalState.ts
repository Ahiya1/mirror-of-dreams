'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';

import type { User } from '@/types';

interface PortalStateReturn {
  tagline: {
    main: string;
    sub: string;
  };
  showReflectButton: boolean;
  showStartFreeButton: boolean;
  reflectButtonText: string;
  reflectButtonHref: string;
  handleReflectClick: () => void;
  handleStartFreeClick: () => void;
}

/**
 * Portal state management hook
 * Handles landing page state based on authentication status
 * Migrated from usePortalState.js
 */
export function usePortalState(user: User | null): PortalStateReturn {
  const router = useRouter();
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);

  // Taglines for unauthenticated users
  const unauthenticatedTaglines = [
    {
      main: 'Stop asking what to do.<br />See who you already are.',
      sub: '<strong>Start completely free.</strong> Your truth awaits.',
    },
    {
      main: 'Your dreams are not random.<br />They are your teacher.',
      sub: '<strong>3 free reflections forever.</strong> No credit card needed.',
    },
    {
      main: 'The answers you seek<br />are already within you.',
      sub: '<strong>AI-powered reflections.</strong> Start your journey today.',
    },
  ];

  // Taglines for authenticated users
  const authenticatedTaglines = useMemo(() => {
    if (!user) return [];

    if (user.isCreator || user.isAdmin) {
      return [
        {
          main: 'Sacred creator space<br/>awaits your truth.',
          sub: '<strong>Unlimited reflections</strong> for the mirror maker.',
        },
      ];
    }

    return [
      {
        main: 'Ready for your next<br/>moment of truth?',
        sub: '<strong>Your reflection awaits.</strong> Continue your journey.',
      },
      {
        main: "See how far<br/>you've traveled.",
        sub: '<strong>Your reflections</strong> hold your evolution.',
      },
    ];
  }, [user]);

  // Rotate taglines
  useEffect(() => {
    const taglines = user ? authenticatedTaglines : unauthenticatedTaglines;
    if (taglines.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [user, authenticatedTaglines]);

  // Get current tagline
  const tagline = useMemo(() => {
    const taglines = user ? authenticatedTaglines : unauthenticatedTaglines;
    return taglines[currentTaglineIndex] || taglines[0];
  }, [user, authenticatedTaglines, currentTaglineIndex]);

  // Button configuration
  const showReflectButton = true;
  const showStartFreeButton = !user;

  const reflectButtonText = user ? 'Continue Journey' : 'Reflect Me';
  const reflectButtonHref = user ? '/reflection' : '/auth/signin';

  // Button handlers
  const handleReflectClick = useCallback(() => {
    router.push(reflectButtonHref);
  }, [router, reflectButtonHref]);

  const handleStartFreeClick = useCallback(() => {
    router.push('/auth/signup');
  }, [router]);

  return {
    tagline,
    showReflectButton,
    showStartFreeButton,
    reflectButtonText,
    reflectButtonHref,
    handleReflectClick,
    handleStartFreeClick,
  };
}
