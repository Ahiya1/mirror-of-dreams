/**
 * Profile Page - User Account Management
 *
 * Iteration: 27 (Iteration 2 of Plan 17)
 * Builder: Builder-1
 *
 * Features:
 * - Account information (name editable, email display, member since)
 * - Tier and subscription display (current tier, usage stats)
 * - Account actions (change email, change password, view tutorial)
 * - Danger zone (delete account with confirmation)
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { BottomNavigation } from '@/components/navigation';
import { AppNavigation } from '@/components/shared/AppNavigation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { SubscriptionStatusCard } from '@/components/subscription/SubscriptionStatusCard';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { CLARIFY_SESSION_LIMITS } from '@/lib/utils/constants';

export default function ProfilePage() {
  const { user, isLoading: authLoading, isAuthenticated, setUser } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // UI state
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Initialize name from user
  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Mutations
  const updateProfileMutation = trpc.users.updateProfile.useMutation({
    onSuccess: (data) => {
      setUser((prev) => (prev ? { ...prev, ...data.user } : null));
      toast.success(data.message);
      setIsEditingName(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const changeEmailMutation = trpc.users.changeEmail.useMutation({
    onSuccess: (data) => {
      // Token is now refreshed via cookie by server
      // No localStorage needed
      setUser(data.user);
      toast.success(data.message);
      setIsEditingEmail(false);
      setNewEmail('');
      setEmailPassword('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      // Cookie is cleared by server during account deletion
      // No localStorage needed
      router.push('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const handleSaveName = () => {
    if (name === user?.name) {
      setIsEditingName(false);
      return;
    }

    if (name.trim().length === 0) {
      toast.error('Name cannot be empty');
      return;
    }

    updateProfileMutation.mutate({ name: name.trim() });
  };

  const handleCancelName = () => {
    setName(user?.name || '');
    setIsEditingName(false);
  };

  const handleChangeEmail = () => {
    if (!newEmail || !emailPassword) {
      toast.error('Email and password are required');
      return;
    }

    changeEmailMutation.mutate({
      newEmail,
      currentPassword: emailPassword,
    });
  };

  const handleCancelEmail = () => {
    setIsEditingEmail(false);
    setNewEmail('');
    setEmailPassword('');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast.error('Both passwords are required');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleCancelPassword = () => {
    setIsEditingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleDeleteAccount = () => {
    if (confirmEmail.toLowerCase() !== user?.email.toLowerCase()) {
      toast.error('Email confirmation does not match');
      return;
    }

    if (!deletePassword) {
      toast.error('Password is required');
      return;
    }

    deleteAccountMutation.mutate({
      confirmEmail,
      password: deletePassword,
    });
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setConfirmEmail('');
    setDeletePassword('');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="relative min-h-screen">
        <CosmicBackground />
        <div className="flex min-h-screen items-center justify-center">
          <CosmicLoader size="lg" />
        </div>
      </div>
    );
  }

  // Not authenticated (redirect in progress)
  if (!isAuthenticated) return null;

  return (
    <div className="relative min-h-screen">
      <CosmicBackground />
      <AppNavigation currentPage="profile" />

      <main className="relative z-10 min-h-screen pb-20 pt-nav md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-h1 mb-8 text-white">Profile</h1>

          {/* Demo User Banner */}
          {user?.isDemo && (
            <div className="mb-6 rounded-xl border border-mirror-info/30 bg-mirror-info/10 p-4">
              <p className="text-sm text-mirror-info">
                You're viewing the demo account. Sign up to modify your profile and save changes.
              </p>
            </div>
          )}

          {/* Account Information */}
          <GlassCard elevated className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Account Information</h2>

            {/* Name Field */}
            <div className="mb-4">
              <label className="mb-1 block text-sm text-white/60">Name</label>
              {isEditingName ? (
                <div className="space-y-3">
                  <GlassInput
                    value={name}
                    onChange={setName}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                  <div className="flex gap-2">
                    <GlowButton onClick={handleSaveName} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                    </GlowButton>
                    <GlowButton
                      variant="secondary"
                      onClick={handleCancelName}
                      disabled={updateProfileMutation.isPending}
                    >
                      Cancel
                    </GlowButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-white">{user?.name}</p>
                  <GlowButton
                    variant="secondary"
                    onClick={() => setIsEditingName(true)}
                    disabled={user?.isDemo}
                  >
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
                    onChange={setNewEmail}
                    placeholder="New email address"
                    autoComplete="email"
                  />
                  <GlassInput
                    type="password"
                    value={emailPassword}
                    onChange={setEmailPassword}
                    placeholder="Current password (required)"
                    showPasswordToggle
                    autoComplete="current-password"
                  />
                  <div className="flex gap-2">
                    <GlowButton
                      onClick={handleChangeEmail}
                      disabled={changeEmailMutation.isPending}
                    >
                      {changeEmailMutation.isPending ? 'Updating...' : 'Update Email'}
                    </GlowButton>
                    <GlowButton
                      variant="secondary"
                      onClick={handleCancelEmail}
                      disabled={changeEmailMutation.isPending}
                    >
                      Cancel
                    </GlowButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-white">{user?.email}</p>
                  <GlowButton
                    variant="secondary"
                    onClick={() => setIsEditingEmail(true)}
                    disabled={user?.isDemo}
                  >
                    Change Email
                  </GlowButton>
                </div>
              )}
            </div>

            {/* Member Since */}
            <div>
              <label className="mb-1 block text-sm text-white/60">Member Since</label>
              <p className="text-lg text-white">
                {user?.createdAt &&
                  formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </p>
            </div>
          </GlassCard>

          {/* Subscription & Billing Section */}
          <SubscriptionStatusCard />

          {/* Usage Statistics */}
          <GlassCard elevated className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Usage Statistics</h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-white/60">Reflections This Month</label>
                <p className="text-lg text-white">
                  {user?.reflectionCountThisMonth} /{' '}
                  {user?.tier === 'free' ? '2' : user?.tier === 'pro' ? '30' : '60'}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/60">Total Reflections</label>
                <p className="text-lg text-white">{user?.totalReflections}</p>
              </div>

              {/* Clarify stats - paid users only */}
              {user && (user.tier !== 'free' || user.isCreator || user.isAdmin) && (
                <>
                  <div>
                    <label className="mb-1 block text-sm text-white/60">
                      Clarify Sessions This Month
                    </label>
                    <p className="text-lg text-white">
                      {user.clarifySessionsThisMonth} / {CLARIFY_SESSION_LIMITS[user.tier]}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-white/60">
                      Total Clarify Sessions
                    </label>
                    <p className="text-lg text-white">{user.totalClarifySessions}</p>
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {/* Account Actions */}
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
                    onChange={setCurrentPassword}
                    placeholder="Current password"
                    showPasswordToggle
                    autoComplete="current-password"
                  />
                  <GlassInput
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="New password (min 6 characters)"
                    showPasswordToggle
                    autoComplete="new-password"
                  />
                  <div className="flex gap-2">
                    <GlowButton
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </GlowButton>
                    <GlowButton
                      variant="secondary"
                      onClick={handleCancelPassword}
                      disabled={changePasswordMutation.isPending}
                    >
                      Cancel
                    </GlowButton>
                  </div>
                </div>
              ) : (
                <GlowButton variant="secondary" onClick={() => setIsEditingPassword(true)}>
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

          {/* Danger Zone */}
          <GlassCard elevated className="border-mirror-error/30">
            <h2 className="mb-2 text-xl font-semibold text-mirror-error">Danger Zone</h2>
            <p className="mb-4 text-white/60">
              Permanently delete your account and all data. This action cannot be undone.
            </p>
            <GlowButton
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              disabled={user?.isDemo}
            >
              Delete Account
            </GlowButton>
            {user?.isDemo && (
              <p className="mt-2 text-sm text-white/40">
                Demo accounts cannot be deleted. Sign up for a real account.
              </p>
            )}
          </GlassCard>
        </div>
      </main>

      {/* Delete Account Modal */}
      <GlassModal isOpen={showDeleteModal} onClose={handleCancelDelete} title="Delete Account">
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
            onChange={setConfirmEmail}
            placeholder={user?.email}
            autoComplete="email"
          />

          <GlassInput
            type="password"
            label="Enter your password"
            value={deletePassword}
            onChange={setDeletePassword}
            showPasswordToggle
            autoComplete="current-password"
          />

          <div className="flex gap-3 pt-4">
            <GlowButton
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Forever'}
            </GlowButton>
            <GlowButton
              variant="secondary"
              onClick={handleCancelDelete}
              disabled={deleteAccountMutation.isPending}
            >
              Cancel
            </GlowButton>
          </div>
        </div>
      </GlassModal>

      {/* Bottom Navigation - visible only on mobile (< 768px) */}
      <BottomNavigation />
    </div>
  );
}
