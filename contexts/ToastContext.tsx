/**
 * ToastContext - Global toast notification system
 * Iteration: 21 (Plan plan-3)
 * Builder: Builder-2
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '@/components/shared/Toast';
import { AnimatePresence } from 'framer-motion';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: ToastMessage['type'], message: string, duration = 5000) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: ToastMessage = { id, type, message, duration };

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
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              type={toast.type}
              message={toast.message}
              onDismiss={() => dismissToast(toast.id)}
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
    success: (message: string, duration?: number) => context.showToast('success', message, duration),
    error: (message: string, duration?: number) => context.showToast('error', message, duration),
    warning: (message: string, duration?: number) => context.showToast('warning', message, duration),
    info: (message: string, duration?: number) => context.showToast('info', message, duration),
  };
}
