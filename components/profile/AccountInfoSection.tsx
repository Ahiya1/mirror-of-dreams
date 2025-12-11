/**
 * Account Information Section
 *
 * Displays user account details (name, email, member since)
 * with inline editing capabilities for name and email.
 *
 * Iteration: 3 of Plan 23
 * Builder: Builder-3
 */

'use client';

import { formatDistanceToNow } from 'date-fns';

import type { User } from '@/types';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';

export interface AccountInfoSectionProps {
  user: User;
  // Name editing
  isEditingName: boolean;
  name: string;
  onNameChange: (value: string) => void;
  onEditNameStart: () => void;
  onSaveName: () => void;
  onCancelName: () => void;
  isNameSaving: boolean;
  // Email editing
  isEditingEmail: boolean;
  newEmail: string;
  emailPassword: string;
  onNewEmailChange: (value: string) => void;
  onEmailPasswordChange: (value: string) => void;
  onEditEmailStart: () => void;
  onChangeEmail: () => void;
  onCancelEmail: () => void;
  isEmailChanging: boolean;
}

export function AccountInfoSection({
  user,
  isEditingName,
  name,
  onNameChange,
  onEditNameStart,
  onSaveName,
  onCancelName,
  isNameSaving,
  isEditingEmail,
  newEmail,
  emailPassword,
  onNewEmailChange,
  onEmailPasswordChange,
  onEditEmailStart,
  onChangeEmail,
  onCancelEmail,
  isEmailChanging,
}: AccountInfoSectionProps) {
  return (
    <GlassCard elevated className="mb-6">
      <h2 className="mb-4 text-xl font-semibold text-white">Account Information</h2>

      {/* Name Field */}
      <div className="mb-4">
        <label className="mb-1 block text-sm text-white/60">Name</label>
        {isEditingName ? (
          <div className="space-y-3">
            <GlassInput
              value={name}
              onChange={onNameChange}
              placeholder="Your name"
              autoComplete="name"
            />
            <div className="flex gap-2">
              <GlowButton onClick={onSaveName} disabled={isNameSaving}>
                {isNameSaving ? 'Saving...' : 'Save'}
              </GlowButton>
              <GlowButton variant="secondary" onClick={onCancelName} disabled={isNameSaving}>
                Cancel
              </GlowButton>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-lg text-white">{user.name}</p>
            <GlowButton variant="secondary" onClick={onEditNameStart} disabled={user.isDemo}>
              Edit
            </GlowButton>
          </div>
        )}
      </div>

      {/* Email Field */}
      <div className="mb-4">
        <label className="mb-1 block text-sm text-white/60">Email</label>
        {isEditingEmail ? (
          <div className="space-y-3">
            <GlassInput
              type="email"
              value={newEmail}
              onChange={onNewEmailChange}
              placeholder="New email address"
              autoComplete="email"
            />
            <GlassInput
              type="password"
              value={emailPassword}
              onChange={onEmailPasswordChange}
              placeholder="Current password (required)"
              showPasswordToggle
              autoComplete="current-password"
            />
            <div className="flex gap-2">
              <GlowButton onClick={onChangeEmail} disabled={isEmailChanging}>
                {isEmailChanging ? 'Updating...' : 'Update Email'}
              </GlowButton>
              <GlowButton variant="secondary" onClick={onCancelEmail} disabled={isEmailChanging}>
                Cancel
              </GlowButton>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-lg text-white">{user.email}</p>
            <GlowButton variant="secondary" onClick={onEditEmailStart} disabled={user.isDemo}>
              Change Email
            </GlowButton>
          </div>
        )}
      </div>

      {/* Member Since */}
      <div>
        <label className="mb-1 block text-sm text-white/60">Member Since</label>
        <p className="text-lg text-white">
          {user.createdAt && formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
        </p>
      </div>
    </GlassCard>
  );
}
