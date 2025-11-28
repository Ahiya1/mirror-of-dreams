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

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';
import { AppNavigation } from '@/components/shared/AppNavigation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import type { UserPreferences } from '@/types/user';

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
      setUser((prev) => prev ? { ...prev, preferences: data.preferences } : null);
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
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="flex items-center justify-center min-h-screen">
          <CosmicLoader size="lg" />
        </div>
      </div>
    );
  }

  // Not authenticated (redirect in progress)
  if (!isAuthenticated || !preferences) return null;

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      <AppNavigation currentPage="settings" />

      <main className="relative z-10 pt-[var(--nav-height)] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

          {/* Notification Preferences */}
          <GlassCard elevated className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Notification Preferences</h2>

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
            <h2 className="text-xl font-semibold text-white mb-4">Reflection Preferences</h2>

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
            <h2 className="text-xl font-semibold text-white mb-4">Display Preferences</h2>

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
            <h2 className="text-xl font-semibold text-white mb-4">Privacy & Data</h2>

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
    <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
      <div className="flex-1">
        <p className="text-white font-medium">{label}</p>
        <p className="text-sm text-white/60 mt-1">{description}</p>
      </div>

      {type === 'toggle' && (
        <label className="relative inline-flex items-center cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
        </label>
      )}

      {type === 'select' && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
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
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
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
