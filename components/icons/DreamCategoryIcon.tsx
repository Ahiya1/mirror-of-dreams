// components/icons/DreamCategoryIcon.tsx
// Centralized dream category icon component (functional icons only)

export type DreamCategory =
  | 'health'
  | 'career'
  | 'relationships'
  | 'financial'
  | 'personal_growth'
  | 'creative'
  | 'spiritual'
  | 'entrepreneurial'
  | 'educational'
  | 'other';

const CATEGORY_ICONS: Record<DreamCategory, string> = {
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
};

const CATEGORY_LABELS: Record<DreamCategory, string> = {
  health: 'Health & Fitness',
  career: 'Career',
  relationships: 'Relationships',
  financial: 'Financial',
  personal_growth: 'Personal Growth',
  creative: 'Creative',
  spiritual: 'Spiritual',
  entrepreneurial: 'Entrepreneurial',
  educational: 'Educational',
  other: 'Other',
};

interface DreamCategoryIconProps {
  category: DreamCategory;
  className?: string;
  showLabel?: boolean;
}

export function DreamCategoryIcon({
  category,
  className = '',
  showLabel = false,
}: DreamCategoryIconProps) {
  const icon = CATEGORY_ICONS[category];
  const label = CATEGORY_LABELS[category];

  if (showLabel) {
    return (
      <span className={`flex items-center gap-2 ${className}`}>
        <span className="text-xl" role="img" aria-label={label}>
          {icon}
        </span>
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className={`text-xl ${className}`} role="img" aria-label={label}>
      {icon}
    </span>
  );
}
