/**
 * Toast - Toast notification component
 * Iteration: 21 (Plan plan-3)
 * Builder: Builder-2
 */

'use client';

import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: () => void;
}

export function Toast({ type, message, onDismiss }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-mirror-success" />,
    error: <XCircle className="w-5 h-5 text-mirror-error" />,
    warning: <AlertTriangle className="w-5 h-5 text-mirror-warning" />,
    info: <Info className="w-5 h-5 text-mirror-info" />,
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
        'flex items-start gap-3 p-4 rounded-xl',
        'border backdrop-blur-xl shadow-2xl',
        'max-w-sm w-full',
        colors[type]
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>

      {/* Message */}
      <p className="flex-1 text-sm text-white/90 leading-relaxed">{message}</p>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-white/60" />
      </button>
    </motion.div>
  );
}
