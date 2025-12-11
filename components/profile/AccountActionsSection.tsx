/**
 * Account Actions Section
 *
 * Contains password change form and tutorial link.
 *
 * Iteration: 3 of Plan 23
 * Builder: Builder-3
 */

'use client';

import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';

export interface AccountActionsSectionProps {
  isEditingPassword: boolean;
  currentPassword: string;
  newPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onEditPasswordStart: () => void;
  onChangePassword: () => void;
  onCancelPassword: () => void;
  isPasswordChanging: boolean;
}

export function AccountActionsSection({
  isEditingPassword,
  currentPassword,
  newPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onEditPasswordStart,
  onChangePassword,
  onCancelPassword,
  isPasswordChanging,
}: AccountActionsSectionProps) {
  const router = useRouter();

  return (
    <GlassCard elevated className="mb-6">
      <h2 className="mb-4 text-xl font-semibold text-white">Account Actions</h2>

      {/* Change Password */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-white/60">Password</label>
        {isEditingPassword ? (
          <div className="space-y-3">
            <GlassInput
              type="password"
              value={currentPassword}
              onChange={onCurrentPasswordChange}
              placeholder="Current password"
              showPasswordToggle
              autoComplete="current-password"
            />
            <GlassInput
              type="password"
              value={newPassword}
              onChange={onNewPasswordChange}
              placeholder="New password (min 6 characters)"
              showPasswordToggle
              autoComplete="new-password"
            />
            <div className="flex gap-2">
              <GlowButton onClick={onChangePassword} disabled={isPasswordChanging}>
                {isPasswordChanging ? 'Changing...' : 'Change Password'}
              </GlowButton>
              <GlowButton
                variant="secondary"
                onClick={onCancelPassword}
                disabled={isPasswordChanging}
              >
                Cancel
              </GlowButton>
            </div>
          </div>
        ) : (
          <GlowButton variant="secondary" onClick={onEditPasswordStart}>
            Change Password
          </GlowButton>
        )}
      </div>

      {/* View Tutorial */}
      <div className="border-t border-white/10 pt-4">
        <label className="mb-2 block text-sm text-white/60">Tutorial</label>
        <button
          onClick={() => router.push('/onboarding')}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <span className="text-white">View Tutorial</span>
          </div>
          <span className="text-white/40">&rarr;</span>
        </button>
      </div>
    </GlassCard>
  );
}
