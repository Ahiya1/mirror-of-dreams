/**
 * Toast - Toast notification component
 * Iteration: 21 (Plan plan-3), Updated: Iteration 26 (Plan 17)
 * Builder: Builder-2, Updated by Builder-3
 *
 * Added action button support for interactive toasts
 */

'use client';

import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: () => void;
  action?: ToastAction;
}

export function Toast({ type, message, onDismiss, action }: ToastProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-mirror-success" />,
    error: <XCircle className="h-5 w-5 text-mirror-error" />,
    warning: <AlertTriangle className="h-5 w-5 text-mirror-warning" />,
    info: <Info className="h-5 w-5 text-mirror-info" />,
  };

  const colors = {
    success: 'border-mirror-success/30 bg-mirror-success/10',
    error: 'border-mirror-error/30 bg-mirror-error/10',
    warning: 'border-mirror-warning/30 bg-mirror-warning/10',
    info: 'border-mirror-info/30 bg-mirror-info/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-start gap-3 rounded-xl p-4',
        'border shadow-2xl backdrop-blur-xl',
        'w-full max-w-sm',
        colors[type]
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">{icons[type]}</div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Message */}
        <p className="text-sm leading-relaxed text-white/90">{message}</p>

        {/* Action Button */}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onDismiss();
            }}
            className="mt-2 text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4 text-white/60" />
      </button>
    </motion.div>
  );
}
