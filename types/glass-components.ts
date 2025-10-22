import { ReactNode } from 'react';

/**
 * Base props shared by all glass components
 */
export interface GlassBaseProps {
  /** Additional Tailwind classes */
  className?: string;
  /** Glass blur intensity */
  glassIntensity?: 'subtle' | 'medium' | 'strong';
  /** Glow color theme */
  glowColor?: 'purple' | 'blue' | 'cosmic' | 'electric';
  /** Enable entrance animations */
  animated?: boolean;
}

/**
 * Props for GlassCard component
 */
export interface GlassCardProps extends GlassBaseProps {
  /** Visual style variant */
  variant?: 'default' | 'elevated' | 'inset';
  /** Enable hover animations */
  hoverable?: boolean;
  /** Card content */
  children: ReactNode;
}

/**
 * Props for GlowButton component
 */
export interface GlowButtonProps extends GlassBaseProps {
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Button content */
  children: ReactNode;
}

/**
 * Props for GradientText component
 */
export interface GradientTextProps {
  /** Gradient style */
  gradient?: 'cosmic' | 'primary' | 'dream';
  /** Additional Tailwind classes */
  className?: string;
  /** Text content */
  children: ReactNode;
}

/**
 * Props for GlassModal component
 */
export interface GlassModalProps extends GlassBaseProps {
  /** Modal open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
}

/**
 * Props for ProgressOrbs component
 */
export interface ProgressOrbsProps {
  /** Total number of steps */
  steps: number;
  /** Current active step (0-indexed) */
  currentStep: number;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Props for GlowBadge component
 */
export interface GlowBadgeProps {
  /** Badge variant */
  variant?: 'success' | 'warning' | 'error' | 'info';
  /** Enable pulsing glow animation */
  glowing?: boolean;
  /** Additional Tailwind classes */
  className?: string;
  /** Badge content */
  children: ReactNode;
}

/**
 * Props for CosmicLoader component
 */
export interface CosmicLoaderProps {
  /** Loader size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Props for DreamCard component
 */
export interface DreamCardProps extends Omit<GlassCardProps, 'children'> {
  /** Dream title */
  title: string;
  /** Dream content */
  content: string;
  /** Dream date */
  date?: string;
  /** Dream tone/category */
  tone?: string;
  /** Click handler */
  onClick?: () => void;
  /** Optional additional content */
  children?: ReactNode;
}

/**
 * Props for FloatingNav component
 */
export interface FloatingNavProps {
  /** Navigation items */
  items: Array<{
    label: string;
    href: string;
    icon?: ReactNode;
    active?: boolean;
  }>;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Props for AnimatedBackground component
 */
export interface AnimatedBackgroundProps {
  /** Gradient variant */
  variant?: 'cosmic' | 'dream' | 'glow';
  /** Animation intensity */
  intensity?: 'subtle' | 'medium' | 'strong';
  /** Additional Tailwind classes */
  className?: string;
}
