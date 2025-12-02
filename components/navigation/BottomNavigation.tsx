'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Layers, TrendingUp, BarChart2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Context imports
import { useNavigation } from '@/contexts/NavigationContext';

// Shared hook imports (from Builder-1)
import { useScrollDirection } from '@/lib/hooks/useScrollDirection';

// Shared utility imports (from Builder-1)
import { haptic } from '@/lib/utils/haptics';

// Animation imports (from Builder-1)
import { bottomNavVariants } from '@/lib/animations/variants';

// ============================================
// Types (component-specific only)
// ============================================

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

interface BottomNavigationProps {
  className?: string;
}

// ============================================
// Constants
// ============================================

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dreams', icon: Sparkles, label: 'Dreams' },
  { href: '/reflection', icon: Layers, label: 'Reflect' },
  { href: '/evolution', icon: TrendingUp, label: 'Evolution' },
  { href: '/visualizations', icon: BarChart2, label: 'Visual' },
  { href: '/profile', icon: User, label: 'Profile' },
] as const;

// ============================================
// BottomNavigation Component
// ============================================

/**
 * BottomNavigation - Fixed bottom navigation bar for mobile devices
 *
 * Features:
 * - 6 navigation tabs: Home, Dreams, Reflect, Evolution, Visual, Profile
 * - Active state with animated pill indicator
 * - Hides on scroll down, reveals on scroll up
 * - Safe area padding for notched devices (iPhone X+)
 * - Haptic feedback on tap (Android Chrome)
 * - Hidden on desktop (md:hidden)
 * - Glass morphism styling consistent with cosmic design system
 *
 * @param className - Additional Tailwind classes
 */
export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const { showBottomNav } = useNavigation();

  // Hide nav on scroll down, show on scroll up (or at top)
  // Also hide when showBottomNav is false (e.g., during reflection wizard)
  const isVisible = showBottomNav && scrollDirection !== 'down';

  /**
   * Determine if a nav item is active
   * Checks exact match for dashboard, prefix match for other routes
   */
  const isItemActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.nav
          key="bottom-nav"
          variants={bottomNavVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            // Positioning
            'fixed bottom-0 inset-x-0 z-40',

            // Glass morphism styling
            'bg-white/5 backdrop-blur-lg backdrop-saturate-150',
            'border-t border-white/10',

            // Safe area padding for notched devices
            'pb-[env(safe-area-inset-bottom)]',

            // Responsive - hidden on desktop
            'md:hidden',

            // Subtle shadow for depth
            'shadow-lg shadow-black/20',

            className
          )}
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-around h-16">
            {NAV_ITEMS.map((item) => {
              const isActive = isItemActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => haptic('light')}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Navigate to ${item.label}`}
                  className={cn(
                    'flex flex-col items-center justify-center',
                    'flex-1 h-full min-w-[64px]',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset'
                  )}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Icon */}
                    <Icon
                      className={cn(
                        'w-6 h-6 transition-colors duration-200',
                        isActive ? 'text-purple-400' : 'text-white/60'
                      )}
                      aria-hidden="true"
                    />

                    {/* Label */}
                    <span
                      className={cn(
                        'text-xs mt-1 transition-colors duration-200',
                        isActive ? 'text-white' : 'text-white/60'
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Active indicator pill - animated with layoutId */}
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavActiveTab"
                        className="absolute -bottom-1 w-1 h-1 bg-purple-400 rounded-full"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
