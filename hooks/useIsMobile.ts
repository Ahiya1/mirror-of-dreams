'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Matches Tailwind md: breakpoint

/**
 * Hook to detect if viewport is mobile-sized
 * Returns false during SSR, then updates on client
 *
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) return <MobileView />;
 * return <DesktopView />;
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
