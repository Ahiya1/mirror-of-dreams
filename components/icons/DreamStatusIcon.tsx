// components/icons/DreamStatusIcon.tsx
// Centralized dream status icon component (functional icons only)

export type DreamStatus = 'active' | 'achieved' | 'archived' | 'released';

const STATUS_ICONS: Record<DreamStatus, string> = {
  active: '✨',
  achieved: '🎉',
  archived: '📦',
  released: '🕊️',
};

const STATUS_LABELS: Record<DreamStatus, string> = {
  active: 'Active',
  achieved: 'Achieved',
  archived: 'Archived',
  released: 'Released',
};

interface DreamStatusIconProps {
  status: DreamStatus;
  className?: string;
  showLabel?: boolean;
}

export function DreamStatusIcon({
  status,
  className = '',
  showLabel = false,
}: DreamStatusIconProps) {
  const icon = STATUS_ICONS[status];
  const label = STATUS_LABELS[status];

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
