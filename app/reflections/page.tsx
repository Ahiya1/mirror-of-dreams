'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { type ReflectionTone } from '@/types/reflection';
import { type DateRangeOption, getDateRangeFilter } from '@/lib/utils/dateRange';
import { ReflectionCard } from '@/components/reflections/ReflectionCard';
import { ReflectionFilters } from '@/components/reflections/ReflectionFilters';
import { EmptyState } from '@/components/shared/EmptyState';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { BlankJournal } from '@/components/shared/illustrations/BlankJournal';
import { useAuth } from '@/hooks/useAuth';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GradientText } from '@/components/ui/glass/GradientText';

export default function ReflectionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to signin if not authenticated, or to verify-required if not verified
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo) {
        router.push('/auth/verify-required');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Filter state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tone, setTone] = useState<ReflectionTone | undefined>(undefined);
  const [isPremium, setIsPremium] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'created_at' | 'word_count' | 'rating'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<DateRangeOption>('all');

  // Fetch reflections with tRPC (20 per page as per plan)
  const { data, isLoading, error } = trpc.reflections.list.useQuery({
    page,
    limit: 20, // Pattern from plan: 20 per page
    search: search || undefined,
    tone,
    isPremium,
    sortBy,
    sortOrder,
  });

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <CosmicLoader size="lg" label="Loading..." />
              <p className="text-gray-300 mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auth/verification guard - return null while redirect happens
  if (!isAuthenticated || (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo)) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <CosmicLoader size="lg" label="Loading your reflections..." />
              <p className="text-gray-300 mt-4">Loading your reflections...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-lg border border-mirror-error/20 bg-mirror-error/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-mirror-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-mirror-error">Error loading reflections</h3>
                <p className="text-sm text-mirror-error/80 mt-1">{error.message}</p>
              </div>
            </div>
            <GlowButton
              variant="danger"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Retry
            </GlowButton>
          </div>
        </div>
      </div>
    );
  }

  const reflections = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <AppNavigation currentPage="reflection" />

      <div className="max-w-6xl mx-auto pt-nav px-4 sm:px-8 pb-8">
        {/* Header with count */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-h1 mb-2">
                <GradientText gradient="cosmic">
                  Your Reflections {total > 0 && `(${total})`}
                </GradientText>
              </h1>
              <p className="text-gray-400">
                {total === 0
                  ? 'Your reflection journey begins here'
                  : `${total} reflection${total === 1 ? '' : 's'} captured`}
              </p>
            </div>
            <GlowButton
              variant="cosmic"
              onClick={() => router.push('/reflection')}
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Reflection
              </div>
            </GlowButton>
          </div>

          {/* Back to dashboard */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <ReflectionFilters
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1); // Reset to first page on search
            }}
            tone={tone}
            onToneChange={(value) => {
              setTone(value);
              setPage(1);
            }}
            isPremium={isPremium}
            onIsPremiumChange={(value) => {
              setIsPremium(value);
              setPage(1);
            }}
            sortBy={sortBy}
            onSortByChange={(value) => {
              setSortBy(value);
              setPage(1);
            }}
            sortOrder={sortOrder}
            onSortOrderChange={(value) => {
              setSortOrder(value);
              setPage(1);
            }}
            dateRange={dateRange}
            onDateRangeChange={(value) => {
              setDateRange(value);
              setPage(1);
            }}
          />
        </div>

        {/* Empty state */}
        {reflections.length === 0 && (
          <EmptyState
            illustration={!search && !tone && isPremium === undefined && dateRange === 'all' ? <BlankJournal /> : undefined}
            icon="💭"
            title={search || tone || isPremium !== undefined || dateRange !== 'all'
              ? 'No reflections found'
              : 'Your first reflection awaits'}
            description={search || tone || isPremium !== undefined || dateRange !== 'all'
              ? 'Try adjusting your filters or search criteria'
              : 'Take a moment to explore your thoughts and let your inner wisdom guide you.'}
            ctaLabel={!search && !tone && isPremium === undefined && dateRange === 'all' ? 'Start Reflecting' : undefined}
            ctaAction={!search && !tone && isPremium === undefined && dateRange === 'all' ? () => router.push('/reflection') : undefined}
          />
        )}

        {/* Reflections grid - Desktop: 2-3 columns, Mobile: single column (Pattern from plan) */}
        {reflections.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reflections.map((reflection) => (
                <ReflectionCard key={reflection.id} reflection={reflection} />
              ))}
            </div>

            {/* Pagination (20 per page) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-500/20 bg-slate-900/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-purple-500/50 hover:bg-slate-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'border border-purple-500/20 bg-slate-900/50 text-gray-300 hover:border-purple-500/50 hover:bg-slate-900/70'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-500/20 bg-slate-900/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-purple-500/50 hover:bg-slate-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
