/**
 * Profile Page - User Account Management
 *
 * Iteration: 13 (Plan plan-7)
 * Builder: Builder-1
 *
 * Features:
 * - Account information (name editable, email display, member since)
 * - Tier and subscription display (current tier, usage stats)
 * - Account actions (change email, change password)
 * - Danger zone (delete account with confirmation)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';
import { AppNavigation } from '@/components/shared/AppNavigation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GlassModal } from '@/components/ui/glass/GlassModal';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { formatDistanceToNow } from 'date-fns';

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
      setUser((prev) => prev ? { ...prev, ...data.user } : null);
      toast.success(data.message);
      setIsEditingName(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const changeEmailMutation = trpc.users.changeEmail.useMutation({
    onSuccess: (data) => {
      // CRITICAL: Replace old token with new one
      localStorage.setItem('mirror_auth_token', data.token);
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
      localStorage.removeItem('mirror_auth_token');
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
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="flex items-center justify-center min-h-screen">
          <CosmicLoader size="lg" />
        </div>
      </div>
    );
  }

  // Not authenticated (redirect in progress)
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      <AppNavigation currentPage="profile" />

      <main className="relative z-10 pt-[var(--nav-height)] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

          {/* Demo User Banner */}
          {user?.isDemo && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-blue-400 text-sm">
                You're viewing the demo account. Sign up to modify your profile and save changes.
              </p>
            </div>
          )}

          {/* Account Information */}
          <GlassCard elevated className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>

            {/* Name Field */}
            <div className="mb-4">
              <label className="text-sm text-white/60 block mb-1">Name</label>
              {isEditingName ? (
                <div className="space-y-3">
                  <GlassInput
                    value={name}
                    onChange={setName}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                  <div className="flex gap-2">
                    <GlowButton
                      onClick={handleSaveName}
                      disabled={updateProfileMutation.isPending}
                    >
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
              <label className="text-sm text-white/60 block mb-1">Email</label>
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
              <label className="text-sm text-white/60 block mb-1">Member Since</label>
              <p className="text-lg text-white">
                {user?.createdAt && formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </p>
            </div>
          </GlassCard>

          {/* Tier & Subscription */}
          <GlassCard elevated className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Tier & Subscription</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-white/60 block mb-1">Current Tier</label>
                <p className="text-lg text-white capitalize">{user?.tier}</p>
              </div>

              <div>
                <label className="text-sm text-white/60 block mb-1">Reflections This Month</label>
                <p className="text-lg text-white">
                  {user?.reflectionCountThisMonth} / {user?.tier === 'free' ? '10' : user?.tier === 'essential' ? '50' : 'Unlimited'}
                </p>
              </div>

              <div>
                <label className="text-sm text-white/60 block mb-1">Total Reflections</label>
                <p className="text-lg text-white">{user?.totalReflections}</p>
              </div>
            </div>
          </GlassCard>

          {/* Account Actions */}
          <GlassCard elevated className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Actions</h2>

            {/* Change Password */}
            <div className="mb-4">
              <label className="text-sm text-white/60 block mb-2">Password</label>
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
                <GlowButton
                  variant="secondary"
                  onClick={() => setIsEditingPassword(true)}
                >
                  Change Password
                </GlowButton>
              )}
            </div>
          </GlassCard>

          {/* Danger Zone */}
          <GlassCard elevated className="border-red-500/30">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-white/60 mb-4">
              Permanently delete your account and all data. This action cannot be undone.
            </p>
            <GlowButton
              variant="secondary"
              onClick={() => setShowDeleteModal(true)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              disabled={user?.isDemo}
            >
              Delete Account
            </GlowButton>
            {user?.isDemo && (
              <p className="text-sm text-white/40 mt-2">
                Demo accounts cannot be deleted. Sign up for a real account.
              </p>
            )}
          </GlassCard>
        </div>
      </main>

      {/* Delete Account Modal */}
      <GlassModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            This action cannot be undone. All your reflections, dreams, and data will be permanently deleted.
          </p>

          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">
              <strong>Warning:</strong> You will lose access to:
            </p>
            <ul className="list-disc list-inside text-red-400/80 text-sm mt-2 space-y-1">
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
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
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
    </div>
  );
}
