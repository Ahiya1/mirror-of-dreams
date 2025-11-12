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
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const colors = {
    success: 'border-green-500/30 bg-green-950/50',
    error: 'border-red-500/30 bg-red-950/50',
    warning: 'border-yellow-500/30 bg-yellow-950/50',
    info: 'border-blue-500/30 bg-blue-950/50',
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
