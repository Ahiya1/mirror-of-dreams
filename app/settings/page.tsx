/**
 * Settings Page - User Preferences Configuration
 *
 * Iteration: 13 (Plan plan-7)
 * Builder: Builder-1
 *
 * Features:
 * - Notification preferences (email notifications, reflection reminders, evolution email)
 * - Reflection preferences (default tone, show character counter)
 * - Display preferences (reduce motion override)
 * - Privacy preferences (analytics opt-in, marketing emails)
 * - Immediate save on toggle (no Save button)
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import type { UserPreferences } from '@/types/user';

import { BottomNavigation } from '@/components/navigation';
import { AppNavigation } from '@/components/shared/AppNavigation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';

export default function SettingsPage() {
  const { user, isLoading: authLoading, isAuthenticated, setUser } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Initialize preferences from user
  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Update preferences mutation
  const updatePreferencesMutation = trpc.users.updatePreferences.useMutation({
    onSuccess: (data) => {
      setUser((prev) => (prev ? { ...prev, preferences: data.preferences } : null));
      toast.success('Setting saved', 2000);
    },
    onError: (error) => {
      toast.error('Failed to save setting');
      // Revert optimistic update
      if (user?.preferences) {
        setPreferences(user.preferences);
      }
    },
  });

  // Handle toggle (immediate save)
  const handleToggle = (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;

    // Optimistic update
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    // Save to database
    updatePreferencesMutation.mutate({ [key]: value });
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
  if (!isAuthenticated || !preferences) return null;

  return (
    <div className="relative min-h-screen">
      <CosmicBackground />
      <AppNavigation currentPage="settings" />

      <main className="relative z-10 min-h-screen pb-20 pt-nav md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold text-white">Settings</h1>

          {/* Notification Preferences */}
          <GlassCard elevated className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Notification Preferences</h2>

            <SettingRow
              label="Email Notifications"
              description="Receive email updates about your reflections"
              checked={preferences.notification_email}
              onChange={(checked) => handleToggle('notification_email', checked)}
              disabled={updatePreferencesMutation.isPending}
            />

            <SettingRow
              label="Reflection Reminders"
              description="How often to send reflection reminders"
              type="select"
              value={preferences.reflection_reminders}
              onChange={(value) => handleToggle('reflection_reminders', value)}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
              ]}
              disabled={updatePreferencesMutation.isPending}
            />

            <SettingRow
              label="Evolution Reports"
              description="Receive emails when evolution reports are ready"
              checked={preferences.evolution_email}
              onChange={(checked) => handleToggle('evolution_email', checked)}
              disabled={updatePreferencesMutation.isPending}
            />
          </GlassCard>

          {/* Reflection Preferences */}
          <GlassCard elevated className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Reflection Preferences</h2>

            <SettingRow
              label="Default Tone"
              description="Your preferred reflection tone"
              type="select"
              value={preferences.default_tone}
              onChange={(value) => handleToggle('default_tone', value)}
              options={[
                { value: 'fusion', label: 'Sacred Fusion' },
                { value: 'gentle', label: 'Gentle Clarity' },
                { value: 'intense', label: 'Luminous Intensity' },
              ]}
              disabled={updatePreferencesMutation.isPending}
            />

            <SettingRow
              label="Show Character Counter"
              description="Display character counter while writing reflections"
              checked={preferences.show_character_counter}
              onChange={(checked) => handleToggle('show_character_counter', checked)}
              disabled={updatePreferencesMutation.isPending}
            />
          </GlassCard>

          {/* Display Preferences */}
          <GlassCard elevated className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Display Preferences</h2>

            <SettingRow
              label="Reduce Motion"
              description="Override browser preference for animations"
              type="tristate"
              value={preferences.reduce_motion_override}
              onChange={(value) => handleToggle('reduce_motion_override', value)}
              options={[
                { value: null, label: 'Respect Browser' },
                { value: true, label: 'Reduce Motion' },
                { value: false, label: 'Full Animation' },
              ]}
              disabled={updatePreferencesMutation.isPending}
            />
          </GlassCard>

          {/* Privacy Preferences */}
          <GlassCard elevated>
            <h2 className="mb-4 text-xl font-semibold text-white">Privacy & Data</h2>

            <SettingRow
              label="Analytics"
              description="Help improve Mirror of Dreams by sharing usage data"
              checked={preferences.analytics_opt_in}
              onChange={(checked) => handleToggle('analytics_opt_in', checked)}
              disabled={updatePreferencesMutation.isPending}
            />

            <SettingRow
              label="Marketing Emails"
              description="Receive product updates and tips"
              checked={preferences.marketing_emails}
              onChange={(checked) => handleToggle('marketing_emails', checked)}
              disabled={updatePreferencesMutation.isPending}
            />
          </GlassCard>
        </div>
      </main>

      {/* Bottom Navigation - visible only on mobile (< 768px) */}
      <BottomNavigation />
    </div>
  );
}

// Reusable setting row component
interface SettingRowProps {
  label: string;
  description: string;
  checked?: boolean;
  onChange: (value: any) => void;
  disabled?: boolean;
  type?: 'toggle' | 'select' | 'tristate';
  value?: any;
  options?: Array<{ value: any; label: string }>;
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  type = 'toggle',
  value,
  options = [],
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-4 last:border-0">
      <div className="flex-1">
        <p className="font-medium text-white">{label}</p>
        <p className="mt-1 text-sm text-white/60">{description}</p>
      </div>

      {type === 'toggle' && (
        <label className="relative ml-4 inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-500 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-purple-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"></div>
        </label>
      )}

      {type === 'select' && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="ml-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-900">
              {option.label}
            </option>
          ))}
        </select>
      )}

      {type === 'tristate' && (
        <select
          value={value === null ? 'null' : value.toString()}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === 'null' ? null : val === 'true');
          }}
          disabled={disabled}
          className="ml-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((option) => (
            <option
              key={option.value === null ? 'null' : option.value.toString()}
              value={option.value === null ? 'null' : option.value.toString()}
              className="bg-gray-900"
            >
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
