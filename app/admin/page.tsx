/**
 * Admin Dashboard Page
 *
 * Builder: Builder-2 (Iteration 21)
 *
 * Features:
 * - Admin/Creator authorization check (redirects non-admins)
 * - Stats overview cards (total users, users by tier, total reflections)
 * - Recent users table (last 10 users)
 * - Webhook events table (last 10 events)
 * - Cosmic glass UI styling
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import {
  GlassCard,
  CosmicLoader,
  GradientText,
  GlowBadge,
} from '@/components/ui/glass';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { BottomNavigation } from '@/components/navigation';
import { cn, timeAgo } from '@/lib/utils';

// Type definitions for admin data
interface UserStats {
  total: number;
  free: number;
  essential: number;
  premium: number;
  active: number;
}

interface AdminStats {
  users: UserStats;
  reflections: { total: number };
  evolutionReports: { total: number };
  artifacts: { total: number };
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  subscription_status: string | null;
  total_reflections: number;
  reflection_count_this_month: number;
  created_at: string;
  last_sign_in_at: string | null;
  is_creator: boolean;
  is_admin: boolean;
}

interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  processed_at: string | null;
  payload: Record<string, unknown> | null;
  user_id: string | null;
}

// Tier badge styling
const tierStyles: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  pro: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  unlimited: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  essential: 'bg-purple-500/20 text-purple-300 border-purple-500/30', // Legacy tier name
  premium: 'bg-amber-500/20 text-amber-300 border-amber-500/30', // Legacy tier name
};

// Status badge styling
const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date with time
function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Map legacy tier names to display names
function mapTierName(tier: string): string {
  const tierMap: Record<string, string> = {
    essential: 'Pro',
    premium: 'Unlimited',
    free: 'Free',
    pro: 'Pro',
    unlimited: 'Unlimited',
  };
  return tierMap[tier] || tier;
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  subValue,
}: {
  label: string;
  value: number | string;
  icon: string;
  subValue?: string;
}) {
  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="text-2xl sm:text-3xl" aria-hidden="true">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white/50 text-xs sm:text-sm truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <p className="text-white/40 text-xs mt-1 truncate">{subValue}</p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// Badge Component for tiers and status
function Badge({
  variant,
  children,
}: {
  variant: string;
  children: React.ReactNode;
}) {
  const colorClass =
    tierStyles[variant] || statusStyles[variant] || 'bg-gray-500/20 text-gray-300';
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium border inline-block',
        colorClass
      )}
    >
      {children}
    </span>
  );
}

// Users Table Component
function UsersTable({
  users,
  isLoading,
}: {
  users: AdminUser[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <CosmicLoader size="md" />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        No users found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-white/50 font-medium text-sm">
              Email
            </th>
            <th className="text-left py-3 px-4 text-white/50 font-medium text-sm">
              Tier
            </th>
            <th className="text-left py-3 px-4 text-white/50 font-medium text-sm">
              Status
            </th>
            <th className="text-left py-3 px-4 text-white/50 font-medium text-sm">
              Reflections
            </th>
            <th className="text-left py-3 px-4 text-white/50 font-medium text-sm">
              Joined
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-sm truncate max-w-[200px]">
                    {user.email}
                  </span>
                  {(user.is_admin || user.is_creator) && (
                    <span className="text-xs text-amber-400">
                      {user.is_admin ? 'Admin' : 'Creator'}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <Badge variant={user.tier}>{mapTierName(user.tier)}</Badge>
              </td>
              <td className="py-3 px-4">
                <Badge variant={user.subscription_status || 'pending'}>
                  {user.subscription_status || 'N/A'}
                </Badge>
              </td>
              <td className="py-3 px-4 text-white/70 text-sm">
                {user.total_reflections}
              </td>
              <td className="py-3 px-4 text-white/50 text-sm">
                {formatDate(user.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Webhook Events Table Component
function WebhookEventsTable({
  events,
  isLoading,
}: {
  events: WebhookEvent[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <CosmicLoader size="md" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        <p>No webhook events yet</p>
        <p className="text-sm mt-2 text-white/30">
          Events will appear here when PayPal webhooks are received
        </p>
      </div>
    );
  }

  // Format event type for display (e.g., BILLING.SUBSCRIPTION.ACTIVATED -> Subscription Activated)
  const formatEventType = (eventType: string): string => {
    const parts = eventType.split('.');
    if (parts.length >= 2) {
      const action = parts[parts.length - 1];
      const subject = parts[parts.length - 2];
      return `${subject.charAt(0)}${subject.slice(1).toLowerCase()} ${action.charAt(0)}${action.slice(1).toLowerCase()}`;
    }
    return eventType;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-white/50 font-medium text-sm">
              Event Type
            </th>
            <th className="text-left py-3 px-4 text-white/50 font-medium text-sm">
              Event ID
            </th>
            <th className="text-left py-3 px-4 text-white/50 font-medium text-sm">
              Processed At
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 px-4">
                <span className="text-emerald-400 text-sm font-medium">
                  {formatEventType(event.event_type)}
                </span>
                <p className="text-white/40 text-xs mt-0.5 font-mono">
                  {event.event_type}
                </p>
              </td>
              <td className="py-3 px-4 text-white/50 text-xs font-mono truncate max-w-[150px]">
                {event.event_id.slice(0, 20)}...
              </td>
              <td className="py-3 px-4 text-white/50 text-sm">
                {event.processed_at ? timeAgo(event.processed_at) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Error display component
function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-900/10 p-6 text-center">
      <p className="text-red-400">{message}</p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isPageVisible, setIsPageVisible] = useState(false);

  // Admin authorization check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (!user?.isAdmin && !user?.isCreator) {
        // Redirect non-admins to dashboard
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Page visibility animation
  useEffect(() => {
    const timer = setTimeout(() => setIsPageVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch admin data (only when user is admin/creator)
  const isAdmin = !!user?.isAdmin || !!user?.isCreator;

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isAdmin,
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = trpc.admin.getAllUsers.useQuery(
    { page: 1, limit: 10 },
    { enabled: isAdmin }
  );

  const {
    data: webhookData,
    isLoading: webhooksLoading,
    error: webhooksError,
  } = trpc.admin.getWebhookEvents.useQuery(
    { limit: 10 },
    { enabled: isAdmin }
  );

  // Loading state
  if (authLoading) {
    return (
      <div
        className="min-h-screen relative"
        style={{ opacity: isPageVisible ? 1 : 0, transition: 'opacity 0.6s ease-out' }}
      >
        <CosmicBackground />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 z-10 relative">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Guard: Not authenticated or not admin
  if (!isAuthenticated || (!user?.isAdmin && !user?.isCreator)) {
    return null; // Let useEffect handle redirect
  }

  // Calculate pro and unlimited counts
  // Note: Stats returns legacy names (essential/premium), map to current (pro/unlimited)
  const userStats = stats?.users as (UserStats & { pro?: number; unlimited?: number }) | undefined;
  const proCount = (userStats?.essential || 0) + (userStats?.pro || 0);
  const unlimitedCount = (userStats?.premium || 0) + (userStats?.unlimited || 0);

  return (
    <div
      className="min-h-screen relative bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark"
      style={{ opacity: isPageVisible ? 1 : 0, transition: 'opacity 0.6s ease-out' }}
    >
      <CosmicBackground />

      {/* Navigation */}
      <AppNavigation currentPage="admin" />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto pt-[calc(var(--nav-height)+var(--demo-banner-height,0px))] px-4 sm:px-8 pb-24 relative z-10">
        {/* Header */}
        <div className="mb-8 pt-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold">
              <GradientText>Admin Dashboard</GradientText>
            </h1>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-medium">
              {user?.isAdmin ? 'Admin' : 'Creator'}
            </span>
          </div>
          <p className="text-white/60">
            System overview and management
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={stats?.users?.total || 0}
            icon="👥"
            subValue={`${stats?.users?.active || 0} active`}
          />
          <StatCard
            label="Free Tier"
            value={stats?.users?.free || 0}
            icon="🆓"
          />
          <StatCard
            label="Pro Tier"
            value={proCount}
            icon="✨"
          />
          <StatCard
            label="Unlimited"
            value={unlimitedCount}
            icon="💎"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Reflections"
            value={stats?.reflections?.total || 0}
            icon="🪞"
          />
          <StatCard
            label="Evolution Reports"
            value={stats?.evolutionReports?.total || 0}
            icon="📊"
          />
          <StatCard
            label="Artifacts"
            value={stats?.artifacts?.total || 0}
            icon="🎨"
          />
        </div>

        {/* Recent Users Section */}
        <GlassCard className="mb-8">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span>👥</span>
              Recent Users
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Last 10 registered users
            </p>
          </div>
          <div className="p-4">
            {usersError ? (
              <ErrorDisplay message={usersError.message} />
            ) : (
              <UsersTable
                users={usersData?.items as AdminUser[] || []}
                isLoading={usersLoading}
              />
            )}
          </div>
        </GlassCard>

        {/* Webhook Events Section */}
        <GlassCard className="mb-8">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span>🔔</span>
              Recent Webhook Events
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Last 10 PayPal webhook events
            </p>
          </div>
          <div className="p-4">
            {webhooksError ? (
              <ErrorDisplay message={webhooksError.message} />
            ) : (
              <WebhookEventsTable
                events={webhookData?.items as WebhookEvent[] || []}
                isLoading={webhooksLoading}
              />
            )}
          </div>
        </GlassCard>
      </main>

      {/* Bottom Navigation - visible only on mobile */}
      <BottomNavigation />
    </div>
  );
}
