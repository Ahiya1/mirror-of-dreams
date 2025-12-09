'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Layers, TrendingUp, BarChart2, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// Context imports
import { useNavigation } from '@/contexts/NavigationContext';

// Shared hook imports (from Builder-1)
import { useScrollDirection } from '@/hooks';

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

// Base navigation items (always shown)
const BASE_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dreams', icon: Sparkles, label: 'Dreams' },
];

// Clarify item (paid-only)
const CLARIFY_NAV_ITEM: NavItem = { href: '/clarify', icon: MessageSquare, label: 'Clarify' };

// Remaining navigation items
const REMAINING_NAV_ITEMS: NavItem[] = [
  { href: '/reflection', icon: Layers, label: 'Reflect' },
  { href: '/evolution', icon: TrendingUp, label: 'Evolution' },
  { href: '/profile', icon: User, label: 'Profile' },
];

// ============================================
// BottomNavigation Component
// ============================================

/**
 * BottomNavigation - Fixed bottom navigation bar for mobile devices
 *
 * Features:
 * - 5-6 navigation tabs depending on user tier:
 *   - Free: Home, Dreams, Reflect, Evolution, Profile
 *   - Paid (Pro/Unlimited): Home, Dreams, Clarify, Reflect, Evolution, Profile
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
  const { user } = useAuth();

  // Build nav items dynamically based on user tier
  // Paid users (pro/unlimited) get the Clarify tab
  const navItems: NavItem[] = [
    ...BASE_NAV_ITEMS,
    ...(user?.tier !== 'free' ? [CLARIFY_NAV_ITEM] : []),
    ...REMAINING_NAV_ITEMS,
  ];

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
            {navItems.map((item) => {
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
                    'flex-1 h-full min-w-0',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset'
                  )}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Icon */}
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors duration-200',
                        isActive ? 'text-purple-400' : 'text-white/60'
                      )}
                      aria-hidden="true"
                    />

                    {/* Label */}
                    <span
                      className={cn(
                        'text-[10px] mt-0.5 transition-colors duration-200 truncate max-w-full',
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
