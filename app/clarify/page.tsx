// app/clarify/page.tsx - Clarify session list page
// Builder: Phase 1 Part C (Iteration 24)
// Purpose: Shows list of user's Clarify sessions with create/archive/delete actions

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { CosmicLoader, GlowButton, GlassCard, GradientText } from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { BottomNavigation } from '@/components/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { Constellation } from '@/components/shared/illustrations/Constellation';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Archive, Trash2, MoreVertical, RotateCcw } from 'lucide-react';

export default function ClarifyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | undefined>('active');
  const [showDropdownId, setShowDropdownId] = useState<string | null>(null);

  // Auth redirects
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo) {
        router.push('/auth/verify-required');
      } else if (user && user.tier === 'free' && !user.isCreator && !user.isAdmin) {
        router.push('/pricing?feature=clarify');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Fetch sessions
  const { data, isLoading, refetch } = trpc.clarify.listSessions.useQuery(
    {
      status: statusFilter,
      limit: 20,
    },
    {
      enabled: isAuthenticated && (user?.tier !== 'free' || user?.isCreator || user?.isAdmin),
    }
  );

  // Fetch limits
  const { data: limits } = trpc.clarify.getLimits.useQuery(undefined, {
    enabled: isAuthenticated && (user?.tier !== 'free' || user?.isCreator || user?.isAdmin),
  });

  // Mutations
  const createSession = trpc.clarify.createSession.useMutation({
    onSuccess: (data) => {
      router.push(`/clarify/${data.session.id}`);
    },
  });

  const archiveSession = trpc.clarify.archiveSession.useMutation({
    onSuccess: () => {
      refetch();
      setShowDropdownId(null);
    },
  });

  const restoreSession = trpc.clarify.restoreSession.useMutation({
    onSuccess: () => {
      refetch();
      setShowDropdownId(null);
    },
  });

  const deleteSession = trpc.clarify.deleteSession.useMutation({
    onSuccess: () => {
      refetch();
      setShowDropdownId(null);
    },
  });

  const handleNewSession = () => {
    createSession.mutate({});
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/clarify/${sessionId}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdownId) {
        setShowDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdownId]);

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-small text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Guard - return null while redirect happens
  if (!isAuthenticated || (user && user.tier === 'free' && !user.isCreator && !user.isAdmin)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-small text-white/60">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  const sessions = data?.sessions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-4 sm:px-8 pb-20 md:pb-8">
      <AppNavigation currentPage="clarify" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <GlassCard elevated className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <GradientText gradient="cosmic" className="text-h1 mb-2">
                Clarify
              </GradientText>
              <p className="text-body text-white/70">
                Explore what's emerging before it becomes a dream
              </p>
            </div>
            <GlowButton
              variant="primary"
              size="md"
              onClick={handleNewSession}
              disabled={(limits && !limits.canCreateSession) || createSession.isPending}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              {createSession.isPending ? 'Creating...' : '+ New Conversation'}
            </GlowButton>
          </div>
        </GlassCard>

        {/* Limits Info */}
        {limits && (
          <GlassCard className="mb-6 border-l-4 border-purple-500/60">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <span className="text-white/90 font-medium">
                {limits.sessionsUsed} / {limits.sessionsLimit} sessions this month
              </span>
              {!limits.canCreateSession && (
                <span className="text-small text-amber-400">
                  Session limit reached - resets next month
                </span>
              )}
            </div>
          </GlassCard>
        )}

        {/* Status Filter */}
        <div className="flex gap-3 mb-6">
          <GlowButton
            variant={statusFilter === 'active' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </GlowButton>
          <GlowButton
            variant={statusFilter === 'archived' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('archived')}
          >
            Archived
          </GlowButton>
          <GlowButton
            variant={statusFilter === undefined ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(undefined)}
          >
            All
          </GlowButton>
        </div>

        {/* Sessions List */}
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <GlassCard
                key={session.id}
                className="cursor-pointer hover:bg-white/8 transition-colors relative group"
                onClick={() => handleSessionClick(session.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-white truncate mb-1">
                      {session.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {session.messageCount} messages
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
                      </span>
                      {session.status === 'archived' && (
                        <span className="text-amber-400/80">Archived</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdownId(showDropdownId === session.id ? null : session.id);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Session options"
                    >
                      <MoreVertical className="w-5 h-5 text-white/60" />
                    </button>

                    {showDropdownId === session.id && (
                      <div
                        className="absolute right-0 top-full mt-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GlassCard elevated className="min-w-[160px] p-1">
                          {session.status === 'active' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveSession.mutate({ sessionId: session.id });
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                              Archive
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreSession.mutate({ sessionId: session.id });
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Restore
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this conversation? This cannot be undone.')) {
                                deleteSession.mutate({ sessionId: session.id });
                              }
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </GlassCard>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <EmptyState
            illustration={<Constellation />}
            icon=""
            title="Start exploring"
            description="Clarify is a space to explore what's emerging - thoughts, feelings, possibilities - before they crystallize into dreams."
            ctaLabel="Start a Conversation"
            ctaAction={handleNewSession}
          />
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
