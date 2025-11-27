'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { type ReflectionTone } from '@/types/reflection';
import { ReflectionCard } from '@/components/reflections/ReflectionCard';
import { ReflectionFilters } from '@/components/reflections/ReflectionFilters';
import { EmptyState } from '@/components/shared/EmptyState';
import { AppNavigation } from '@/components/shared/AppNavigation';

export default function ReflectionsPage() {
  const router = useRouter();

  // Filter state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tone, setTone] = useState<ReflectionTone | undefined>(undefined);
  const [isPremium, setIsPremium] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'created_at' | 'word_count' | 'rating'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-300">Loading your reflections...</p>
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
          <div className="rounded-lg border border-red-500/20 bg-red-900/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-300">Error loading reflections</h3>
                <p className="text-sm text-red-400 mt-1">{error.message}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Your Reflections {total > 0 && `(${total})`}
              </h1>
              <p className="text-gray-400">
                {total === 0
                  ? 'Your reflection journey begins here'
                  : `${total} reflection${total === 1 ? '' : 's'} captured`}
              </p>
            </div>
            <Link
              href="/reflection"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-purple-700 hover:to-pink-700 transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Reflection
            </Link>
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
          />
        </div>

        {/* Empty state */}
        {reflections.length === 0 && (
          <EmptyState
            icon="💭"
            title={search || tone || isPremium !== undefined
              ? 'No reflections found'
              : 'Your reflection journey begins here'}
            description={search || tone || isPremium !== undefined
              ? 'Try adjusting your filters or search criteria'
              : 'Reflection is how you water your dreams. Take a moment to gaze into the mirror and explore your inner landscape.'}
            ctaLabel={!search && !tone && isPremium === undefined ? 'Reflect Now' : undefined}
            ctaAction={!search && !tone && isPremium === undefined ? () => router.push('/reflection') : undefined}
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
