'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardVariants } from '@/lib/animations/variants';
import { GlassCard } from './GlassCard';
import type { DreamCardProps } from '@/types/glass-components';

/**
 * DreamCard - Specialized card for displaying dream entries with gradient border
 *
 * @param title - Dream title
 * @param content - Dream content/description
 * @param date - Dream date (optional)
 * @param tone - Dream tone/category (optional)
 * @param onClick - Click handler (optional)
 * @param elevated - Elevated state (inherited from GlassCard)
 * @param interactive - Interactive state (inherited from GlassCard)
 * @param className - Additional Tailwind classes
 */
export function DreamCard({
  title,
  content,
  date,
  tone,
  onClick,
  elevated = true,
  interactive = true,
  className,
  ...props
}: DreamCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <GlassCard
      elevated={elevated}
      interactive={interactive}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden',
        'before:absolute before:inset-0 before:bg-gradient-dream before:opacity-20',
        className
      )}
      {...props}
    >
      <motion.div
        className="relative z-10"
        whileTap={onClick && !prefersReducedMotion ? { scale: 0.98 } : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          {tone && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-mirror-purple/20 text-mirror-violet-light border border-mirror-purple/30">
              {tone}
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-white/80 leading-relaxed mb-4 line-clamp-3">
          {content}
        </p>

        {/* Footer */}
        {date && (
          <div className="flex items-center justify-between">
            <time className="text-sm text-white/60">{date}</time>
          </div>
        )}
      </motion.div>
    </GlassCard>
  );
}
