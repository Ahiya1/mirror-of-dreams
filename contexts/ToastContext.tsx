/**
 * ToastContext - Global toast notification system
 * Iteration: 21 (Plan plan-3), Updated: Iteration 26 (Plan 17)
 * Builder: Builder-2, Updated by Builder-3
 *
 * Added action button support for toast notifications
 */

'use client';

import { AnimatePresence } from 'framer-motion';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import { Toast } from '@/components/shared/Toast';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (type: ToastMessage['type'], message: string, options?: ToastOptions | number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: ToastMessage['type'], message: string, options?: ToastOptions | number) => {
      const id = Math.random().toString(36).substring(7);

      // Support both old signature (duration as number) and new signature (options object)
      const resolvedOptions: ToastOptions =
        typeof options === 'number' ? { duration: options } : (options ?? {});

      const duration = resolvedOptions.duration ?? 5000;

      const newToast: ToastMessage = {
        id,
        type,
        message,
        duration,
        action: resolvedOptions.action,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex max-w-sm flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              type={toast.type}
              message={toast.message}
              onDismiss={() => dismissToast(toast.id)}
              action={toast.action}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return {
    success: (message: string, options?: ToastOptions | number) =>
      context.showToast('success', message, options),
    error: (message: string, options?: ToastOptions | number) =>
      context.showToast('error', message, options),
    warning: (message: string, options?: ToastOptions | number) =>
      context.showToast('warning', message, options),
    info: (message: string, options?: ToastOptions | number) =>
      context.showToast('info', message, options),
  };
}

// Export types for use in other components
export type { ToastAction, ToastOptions };
