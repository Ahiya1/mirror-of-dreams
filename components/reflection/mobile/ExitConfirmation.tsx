'use client';

import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';

interface ExitConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ExitConfirmation - Modal to confirm exiting reflection with unsaved changes
 *
 * Shows when user attempts to leave with dirty form state.
 * Provides options to continue writing or leave anyway.
 */
export function ExitConfirmation({ isOpen, onConfirm, onCancel }: ExitConfirmationProps) {
  return (
    <GlassModal isOpen={isOpen} onClose={onCancel} title="Leave reflection?">
      <p className="mb-6 leading-relaxed text-white/80">
        Your answers will be lost if you leave now. Are you sure you want to exit?
      </p>

      <div className="flex gap-3">
        <GlowButton variant="secondary" onClick={onCancel} className="flex-1">
          Keep Writing
        </GlowButton>

        <GlowButton variant="primary" onClick={onConfirm} className="flex-1">
          Leave
        </GlowButton>
      </div>
    </GlassModal>
  );
}
