'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations/variants';
import type { FloatingNavProps } from '@/types/glass-components';

/**
 * FloatingNav - Floating navigation bar with glass effect
 *
 * @param items - Navigation items with label, href, icon, and active state
 * @param className - Additional Tailwind classes
 */
export function FloatingNav({ items, className }: FloatingNavProps) {
  return (
    <motion.nav
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'fixed bottom-8 left-1/2 -translate-x-1/2 z-40',
        'bg-white/5 backdrop-blur-glass backdrop-saturate-glass',
        'border border-white/10 rounded-full',
        'shadow-glow-lg',
        'px-6 py-3',
        className
      )}
    >
      <ul className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={index}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'transition-all duration-300',
                'hover:bg-white/10',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                item.active && 'bg-gradient-primary shadow-glow'
              )}
            >
              {item.icon && <span className="w-5 h-5">{item.icon}</span>}
              <span
                className={cn(
                  'text-sm font-medium',
                  item.active ? 'text-white' : 'text-white/70 hover:text-white'
                )}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
