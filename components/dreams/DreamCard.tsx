// components/dreams/DreamCard.tsx - Glass redesigned dream display card

'use client';

import Link from 'next/link';
import React from 'react';

import { GlassCard, GlowButton, GlowBadge } from '@/components/ui/glass';

interface DreamCardProps {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  status: 'active' | 'achieved' | 'archived' | 'released';
  category?: string;
  reflectionCount: number;
  lastReflectionAt?: string | null;
  onReflect?: () => void;
  onEvolution?: () => void;
  onVisualize?: () => void;
}

export function DreamCard({
  id,
  title,
  description,
  targetDate,
  daysLeft,
  status,
  category,
  reflectionCount,
  lastReflectionAt,
  onReflect,
  onEvolution,
  onVisualize,
}: DreamCardProps) {
  const statusEmoji = {
    active: '✨',
    achieved: '🎉',
    archived: '📦',
    released: '🕊️',
  }[status];

  const categoryEmoji = {
    health: '🏃',
    career: '💼',
    relationships: '❤️',
    financial: '💰',
    personal_growth: '🌱',
    creative: '🎨',
    spiritual: '🙏',
    entrepreneurial: '🚀',
    educational: '📚',
    other: '⭐',
  }[category || 'other'];

  const statusBadgeVariant = {
    active: 'info' as const,
    achieved: 'success' as const,
    archived: 'warning' as const,
    released: 'info' as const,
  }[status];

  const categoryGlowColor = {
    health: 'electric' as const,
    career: 'purple' as const,
    relationships: 'purple' as const,
    financial: 'cosmic' as const,
    personal_growth: 'purple' as const,
    creative: 'purple' as const,
    spiritual: 'cosmic' as const,
    entrepreneurial: 'electric' as const,
    educational: 'blue' as const,
    other: 'purple' as const,
  }[category || 'other'];

  const getDaysLeftText = () => {
    if (!daysLeft) return null;
    if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
    if (daysLeft === 0) return 'Today!';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  };

  const daysLeftText = getDaysLeftText();
  const daysLeftColor =
    daysLeft === null || daysLeft === undefined
      ? ''
      : daysLeft < 0
        ? 'text-mirror-error'
        : daysLeft <= 7
          ? 'text-mirror-warning'
          : daysLeft <= 30
            ? 'text-mirror-warning/80'
            : 'text-white/60';

  return (
    <GlassCard elevated interactive className="flex h-full flex-col">
      <Link href={`/dreams/${id}`} className="flex-1 text-white no-underline">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-4xl">{categoryEmoji}</div>
          <GlowBadge variant={statusBadgeVariant}>
            {statusEmoji} {status.charAt(0).toUpperCase() + status.slice(1)}
          </GlowBadge>
        </div>

        <h3 className="mb-2 text-xl font-semibold leading-tight text-white">{title}</h3>

        {description && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-white/70">{description}</p>
        )}

        <div className="mb-4 flex items-center gap-4 text-sm">
          {daysLeftText && <div className={`font-medium ${daysLeftColor}`}>{daysLeftText}</div>}
          <div className="text-mirror-purple font-medium">
            {reflectionCount} {reflectionCount === 1 ? 'reflection' : 'reflections'}
          </div>
        </div>
      </Link>

      {status === 'active' && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <GlowButton variant="primary" size="sm" onClick={() => onReflect?.()} className="flex-1">
            Reflect
          </GlowButton>
          {reflectionCount >= 4 && (
            <>
              <GlowButton
                variant="secondary"
                size="sm"
                onClick={() => onEvolution?.()}
                className="flex-1"
              >
                Evolution
              </GlowButton>
              <GlowButton
                variant="secondary"
                size="sm"
                onClick={() => onVisualize?.()}
                className="flex-1"
              >
                Visualize
              </GlowButton>
            </>
          )}
        </div>
      )}
    </GlassCard>
  );
}
