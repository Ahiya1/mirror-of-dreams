/**
 * Danger Zone Section
 *
 * Contains delete account functionality with confirmation modal.
 *
 * Iteration: 3 of Plan 23
 * Builder: Builder-3
 */

'use client';

import type { User } from '@/types';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';

export interface DangerZoneSectionProps {
  user: User;
  showDeleteModal: boolean;
  confirmEmail: string;
  deletePassword: string;
  onConfirmEmailChange: (value: string) => void;
  onDeletePasswordChange: (value: string) => void;
  onOpenDeleteModal: () => void;
  onDeleteAccount: () => void;
  onCancelDelete: () => void;
  isDeleting: boolean;
}

export function DangerZoneSection({
  user,
  showDeleteModal,
  confirmEmail,
  deletePassword,
  onConfirmEmailChange,
  onDeletePasswordChange,
  onOpenDeleteModal,
  onDeleteAccount,
  onCancelDelete,
  isDeleting,
}: DangerZoneSectionProps) {
  return (
    <>
      <GlassCard elevated className="border-mirror-error/30">
        <h2 className="mb-2 text-xl font-semibold text-mirror-error">Danger Zone</h2>
        <p className="mb-4 text-white/60">
          Permanently delete your account and all data. This action cannot be undone.
        </p>
        <GlowButton variant="danger" onClick={onOpenDeleteModal} disabled={user.isDemo}>
          Delete Account
        </GlowButton>
        {user.isDemo && (
          <p className="mt-2 text-sm text-white/40">
            Demo accounts cannot be deleted. Sign up for a real account.
          </p>
        )}
      </GlassCard>

      {/* Delete Account Modal */}
      <GlassModal isOpen={showDeleteModal} onClose={onCancelDelete} title="Delete Account">
        <div className="space-y-4">
          <p className="text-white/80">
            This action cannot be undone. All your reflections, dreams, and data will be permanently
            deleted.
          </p>

          <div className="rounded-lg border border-mirror-error/30 bg-mirror-error/10 p-4">
            <p className="text-sm text-mirror-error">
              <strong>Warning:</strong> You will lose access to:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-mirror-error/80">
              <li>All reflections and dreams</li>
              <li>Evolution reports and insights</li>
              <li>Subscription benefits</li>
              <li>Account history</li>
            </ul>
          </div>

          <GlassInput
            type="email"
            label="Confirm your email"
            value={confirmEmail}
            onChange={onConfirmEmailChange}
            placeholder={user.email}
            autoComplete="email"
          />

          <GlassInput
            type="password"
            label="Enter your password"
            value={deletePassword}
            onChange={onDeletePasswordChange}
            showPasswordToggle
            autoComplete="current-password"
          />

          <div className="flex gap-3 pt-4">
            <GlowButton variant="danger" onClick={onDeleteAccount} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Forever'}
            </GlowButton>
            <GlowButton variant="secondary" onClick={onCancelDelete} disabled={isDeleting}>
              Cancel
            </GlowButton>
          </div>
        </div>
      </GlassModal>
    </>
  );
}
