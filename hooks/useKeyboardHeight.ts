'use client';

import { useState, useEffect } from 'react';

const KEYBOARD_THRESHOLD = 150; // Minimum height to consider as keyboard

/**
 * Hook to detect virtual keyboard height using visualViewport API
 * Returns 0 when keyboard is hidden, positive number when visible
 *
 * Uses a 150px threshold to avoid false positives from address bar changes
 * on iOS Safari and Android Chrome.
 *
 * @example
 * const keyboardHeight = useKeyboardHeight();
 * <div style={{ paddingBottom: keyboardHeight || 'var(--safe-area-bottom)' }}>
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Check for visualViewport support
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentViewportHeight = viewport.height;
      const diff = initialHeight - currentViewportHeight;

      // Only consider it a keyboard if difference exceeds threshold
      // This avoids false positives from address bar changes
      if (diff > KEYBOARD_THRESHOLD) {
        setKeyboardHeight(diff);
      } else {
        setKeyboardHeight(0);
      }
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  return keyboardHeight;
}
