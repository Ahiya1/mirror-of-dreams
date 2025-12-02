'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ============================================
// Types
// ============================================

interface NavigationContextValue {
  showBottomNav: boolean;
  setShowBottomNav: (show: boolean) => void;
}

interface NavigationProviderProps {
  children: ReactNode;
}

// ============================================
// Context
// ============================================

const NavigationContext = createContext<NavigationContextValue | null>(null);

// ============================================
// Provider
// ============================================

/**
 * Provider for controlling bottom navigation visibility
 * Wrap this around the app layout
 *
 * @example
 * // In app/layout.tsx
 * <NavigationProvider>
 *   {children}
 *   <BottomNavigation />
 * </NavigationProvider>
 */
export function NavigationProvider({ children }: NavigationProviderProps) {
  const [showBottomNav, setShowBottomNav] = useState(true);

  return (
    <NavigationContext.Provider value={{ showBottomNav, setShowBottomNav }}>
      {children}
    </NavigationContext.Provider>
  );
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to access navigation context
 * @throws Error if used outside NavigationProvider
 *
 * @example
 * const { showBottomNav, setShowBottomNav } = useNavigation();
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }

  return context;
}

/**
 * Hook to hide bottom nav while component is mounted
 * Automatically restores visibility on unmount
 *
 * This is the recommended way to hide the bottom nav during
 * full-screen experiences like the mobile reflection wizard.
 *
 * @example
 * // In MobileReflectionFlow
 * useHideBottomNav();
 * // Bottom nav will be hidden while this component is mounted
 * // and automatically restored when it unmounts
 */
export function useHideBottomNav(): void {
  const { setShowBottomNav } = useNavigation();

  useEffect(() => {
    setShowBottomNav(false);
    return () => setShowBottomNav(true);
  }, [setShowBottomNav]);
}
