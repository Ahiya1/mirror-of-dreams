/**
 * Profile Page - User Account Management
 *
 * Iteration: 3 of Plan 23 (Refactored)
 * Builder: Builder-3
 *
 * Features:
 * - Account information (name editable, email display, member since)
 * - Tier and subscription display (current tier, usage stats)
 * - Account actions (change email, change password, view tutorial)
 * - Danger zone (delete account with confirmation)
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { BottomNavigation } from '@/components/navigation';
import { AccountInfoSection, AccountActionsSection, DangerZoneSection } from '@/components/profile';
import { AppNavigation } from '@/components/shared/AppNavigation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { SubscriptionStatusCard } from '@/components/subscription/SubscriptionStatusCard';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GlassCard } from '@/components/ui/glass/GlassCard';
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
  if (!isAuthenticated || !user) return null;

  return (
    <div className="relative min-h-screen">
      <CosmicBackground />
      <AppNavigation currentPage="profile" />

      <main className="relative z-10 min-h-screen pb-20 pt-nav md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-h1 mb-8 text-white">Profile</h1>

          {/* Demo User Banner */}
          {user.isDemo && (
            <div className="mb-6 rounded-xl border border-mirror-info/30 bg-mirror-info/10 p-4">
              <p className="text-sm text-mirror-info">
                You're viewing the demo account. Sign up to modify your profile and save changes.
              </p>
            </div>
          )}

          {/* Account Information */}
          <AccountInfoSection
            user={user}
            isEditingName={isEditingName}
            name={name}
            onNameChange={setName}
            onEditNameStart={() => setIsEditingName(true)}
            onSaveName={handleSaveName}
            onCancelName={handleCancelName}
            isNameSaving={updateProfileMutation.isPending}
            isEditingEmail={isEditingEmail}
            newEmail={newEmail}
            emailPassword={emailPassword}
            onNewEmailChange={setNewEmail}
            onEmailPasswordChange={setEmailPassword}
            onEditEmailStart={() => setIsEditingEmail(true)}
            onChangeEmail={handleChangeEmail}
            onCancelEmail={handleCancelEmail}
            isEmailChanging={changeEmailMutation.isPending}
          />

          {/* Subscription & Billing Section */}
          <SubscriptionStatusCard />

          {/* Usage Statistics */}
          <GlassCard elevated className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Usage Statistics</h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-white/60">Reflections This Month</label>
                <p className="text-lg text-white">
                  {user.reflectionCountThisMonth} /{' '}
                  {user.tier === 'free' ? '2' : user.tier === 'pro' ? '30' : '60'}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/60">Total Reflections</label>
                <p className="text-lg text-white">{user.totalReflections}</p>
              </div>

              {/* Clarify stats - paid users only */}
              {(user.tier !== 'free' || user.isCreator || user.isAdmin) && (
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
          <AccountActionsSection
            isEditingPassword={isEditingPassword}
            currentPassword={currentPassword}
            newPassword={newPassword}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onEditPasswordStart={() => setIsEditingPassword(true)}
            onChangePassword={handleChangePassword}
            onCancelPassword={handleCancelPassword}
            isPasswordChanging={changePasswordMutation.isPending}
          />

          {/* Danger Zone */}
          <DangerZoneSection
            user={user}
            showDeleteModal={showDeleteModal}
            confirmEmail={confirmEmail}
            deletePassword={deletePassword}
            onConfirmEmailChange={setConfirmEmail}
            onDeletePasswordChange={setDeletePassword}
            onOpenDeleteModal={() => setShowDeleteModal(true)}
            onDeleteAccount={handleDeleteAccount}
            onCancelDelete={handleCancelDelete}
            isDeleting={deleteAccountMutation.isPending}
          />
        </div>
      </main>

      {/* Bottom Navigation - visible only on mobile (< 768px) */}
      <BottomNavigation />
    </div>
  );
}
