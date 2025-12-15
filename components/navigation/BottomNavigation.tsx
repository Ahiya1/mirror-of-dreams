'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, Sparkles, Layers, TrendingUp, User, MessageSquare, Eye } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useNavigation } from '@/contexts/NavigationContext';
import { useScrollDirection } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { bottomNavVariants } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';

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
  { href: '/visualizations', icon: Eye, label: 'Insights' },
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
 * - 6-7 navigation tabs depending on user tier:
 *   - Free: Home, Dreams, Reflect, Insights, Evolution, Profile
 *   - Paid (Pro/Unlimited): Home, Dreams, Clarify, Reflect, Insights, Evolution, Profile
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
            'fixed inset-x-0 bottom-0 z-40',

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
          <div className="flex h-16 items-center justify-around">
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
                    'h-full min-w-0 flex-1',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50'
                  )}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Icon */}
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-colors duration-200',
                        isActive ? 'text-purple-400' : 'text-white/60'
                      )}
                      aria-hidden="true"
                    />

                    {/* Label */}
                    <span
                      className={cn(
                        'mt-0.5 max-w-full truncate text-[10px] transition-colors duration-200',
                        isActive ? 'text-white' : 'text-white/60'
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Active indicator pill - animated with layoutId */}
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavActiveTab"
                        className="absolute -bottom-1 h-1 w-1 rounded-full bg-purple-400"
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
