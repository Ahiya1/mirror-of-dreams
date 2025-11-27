'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './ReflectionItem.module.css';

interface ReflectionItemProps {
  reflection: {
    id: string | number;
    title?: string;
    dream?: string;
    content?: string;
    preview?: string;
    created_at?: string;
    timeAgo?: string;
    tone?: string;
    is_premium?: boolean;
  };
  index?: number;
  animated?: boolean;
  animationDelay?: number;
  onClick?: (reflection: any) => void;
  className?: string;
}

/**
 * Individual reflection item with rich preview and interactions
 * Migrated from: src/components/dashboard/shared/ReflectionItem.jsx
 */
const ReflectionItem: React.FC<ReflectionItemProps> = ({
  reflection,
  index = 0,
  animated = true,
  animationDelay = 0,
  onClick,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Format reflection data with fallbacks
  const reflectionData = {
    id: reflection.id || index,
    title: reflection.title || 'Sacred Reflection',
    preview: getReflectionPreview(reflection),
    timeAgo: reflection.timeAgo || formatTimeAgo(reflection.created_at),
    tone: reflection.tone || 'fusion',
    isPremium: reflection.is_premium || false,
  };

  function getReflectionPreview(refl: any): string {
    // Try to get AI response first for better snippets
    const text = refl.aiResponse || refl.ai_response || refl.dream || refl.content || refl.preview;
    if (!text) return 'Your reflection content...';

    // Use 120 chars as per plan requirement
    const maxLength = 120;
    // Strip any markdown/HTML for clean preview
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/[#*_]/g, '').trim();
    return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
  }

  function formatTimeAgo(dateString?: string): string {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined,
    });
  }

  const formatToneName = (tone: string) => {
    const toneNames: Record<string, string> = {
      gentle: 'Gentle',
      intense: 'Intense',
      fusion: 'Fusion',
    };
    return toneNames[tone] || 'Fusion';
  };

  const handleClick = () => {
    if (onClick) {
      onClick(reflection);
    }
  };

  return (
    <Link
      href={`/reflections/view?id=${reflectionData.id}`}
      className={`${styles.reflectionItem} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: animated ? `${animationDelay + index * 100}ms` : '0ms',
      }}
    >
      {/* Reflection Header */}
      <div className={styles.reflectionHeader}>
        <div className={styles.reflectionTitle} title={reflectionData.title}>
          {reflectionData.title}
        </div>
        <div className={styles.reflectionDate}>{reflectionData.timeAgo}</div>
      </div>

      {/* Reflection Preview */}
      <div className={styles.reflectionPreview}>{reflectionData.preview}</div>

      {/* Reflection Meta */}
      <div className={styles.reflectionMeta}>
        <div className={`${styles.reflectionTone} ${styles[`reflectionTone${reflectionData.tone}`]}`}>
          {formatToneName(reflectionData.tone)}
        </div>

        {reflectionData.isPremium && <div className={styles.reflectionPremium}>Premium</div>}
      </div>

      {/* Hover indicator */}
      <div className={`${styles.reflectionHoverIndicator} ${isHovered ? styles.visible : ''}`}>
        <span>→</span>
      </div>
    </Link>
  );
};

export default ReflectionItem;
