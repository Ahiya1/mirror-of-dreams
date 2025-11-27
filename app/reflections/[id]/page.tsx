'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';
import { FeedbackForm } from '@/components/reflections/FeedbackForm';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import { GlowButton } from '@/components/ui/glass/GlowButton';

interface ReflectionDetailPageProps {
  params: {
    id: string;
  };
}

export default function ReflectionDetailPage({ params }: ReflectionDetailPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const utils = trpc.useUtils();

  // Fetch reflection
  const { data: reflection, isLoading, error } = trpc.reflections.getById.useQuery({
    id: params.id,
  });

  // Update mutation
  const updateMutation = trpc.reflections.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.reflections.getById.invalidate({ id: params.id });
    },
  });

  // Delete mutation
  const deleteMutation = trpc.reflections.delete.useMutation({
    onSuccess: () => {
      router.push('/reflections');
    },
  });

  // Feedback mutation
  const feedbackMutation = trpc.reflections.submitFeedback.useMutation({
    onSuccess: () => {
      setShowFeedbackForm(false);
      utils.reflections.getById.invalidate({ id: params.id });
    },
  });

  // Initialize edited title when reflection loads
  if (reflection && !editedTitle && !isEditing) {
    setEditedTitle(reflection.title || '');
  }

  const handleUpdate = () => {
    updateMutation.mutate({
      id: params.id,
      title: editedTitle,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: params.id });
  };

  const handleFeedbackSubmit = (rating: number, feedback?: string) => {
    feedbackMutation.mutate({
      id: params.id,
      rating,
      feedback,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-300">Loading reflection...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !reflection) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg border border-red-500/20 bg-red-900/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-300">Reflection not found</h3>
                <p className="text-sm text-red-400 mt-1">
                  {error?.message || 'This reflection does not exist or you do not have access to it'}
                </p>
              </div>
            </div>
            <Link
              href="/reflections"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Reflections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(reflection.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getToneBadge = (tone: string) => {
    const styles = {
      gentle: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      intense: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      fusion: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    };
    return styles[tone as keyof typeof styles] || styles.fusion;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      {/* Centered reading column layout (720px max-width) */}
      <div className="container mx-auto px-4 sm:px-8 py-8 max-w-screen-md">
        {/* Back button */}
        <div className="mb-8">
          <GlowButton
            variant="ghost"
            size="sm"
            onClick={() => router.push('/reflections')}
            className="mb-4"
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Reflections
            </div>
          </GlowButton>
        </div>

        {/* Dream badge at top */}
        {reflection.title && (
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-full text-sm text-purple-300 font-medium">
              {reflection.title || 'Untitled Reflection'}
            </span>
          </div>
        )}

        {/* Metadata (date + tone) */}
        <div className="flex items-center gap-4 text-sm text-white/40 mb-12">
          <span>{formattedDate}</span>
          <span>•</span>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 font-medium capitalize ${getToneBadge(reflection.tone)}`}>
            {reflection.tone}
          </span>
          {reflection.isPremium && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-300">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Premium
              </span>
            </>
          )}
        </div>

        {/* User's questions and answers (collapsible) */}
        <details className="mb-12 rounded-xl border border-purple-500/20 bg-slate-900/50 p-6 backdrop-blur-sm">
          <summary className="cursor-pointer text-lg font-medium text-white/90 hover:text-white/95 transition-colors flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Your Original Answers
          </summary>
          <div className="space-y-6 mt-6 pl-2">
            <div>
              <h4 className="text-sm font-semibold text-white/60 mb-2">Your Dream</h4>
              <p className="text-base text-white/90 leading-relaxed">{reflection.dream}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white/60 mb-2">Your Plan</h4>
              <p className="text-base text-white/90 leading-relaxed">{reflection.plan}</p>
            </div>
            {reflection.dreamDate && (
              <div>
                <h4 className="text-sm font-semibold text-white/60 mb-2">Date</h4>
                <p className="text-base text-white/90 leading-relaxed">{reflection.dreamDate}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold text-white/60 mb-2">Your Relationship</h4>
              <p className="text-base text-white/90 leading-relaxed">{reflection.relationship}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white/60 mb-2">Your Offering</h4>
              <p className="text-base text-white/90 leading-relaxed">{reflection.offering}</p>
            </div>
          </div>
        </details>

        {/* AI Response with cosmic glow container */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-8 sm:p-12 backdrop-blur-sm shadow-lg shadow-purple-500/10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white/95 mb-8 flex items-center gap-3">
            <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Your Mirror's Reflection
          </h2>
          {/* SECURITY FIX: Replace dangerouslySetInnerHTML with AIResponseRenderer */}
          <AIResponseRenderer content={reflection.aiResponse} />
        </div>

        {/* Feedback Form */}
        <div className="mt-8">
          {showFeedbackForm ? (
            <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-purple-300 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Rate This Reflection
                </h3>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <FeedbackForm
                reflectionId={reflection.id}
                currentRating={reflection.rating}
                currentFeedback={reflection.userFeedback}
                onSubmit={handleFeedbackSubmit}
                isSubmitting={feedbackMutation.isPending}
              />
            </div>
          ) : (
            !reflection.rating && (
              <button
                onClick={() => setShowFeedbackForm(true)}
                className="w-full rounded-lg border border-purple-500/20 bg-slate-900/50 px-4 py-3 text-purple-300 hover:bg-slate-900/70 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Rate this reflection
              </button>
            )
          )}
        </div>

        {/* Stats and Actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Stats Card */}
          <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Word Count</span>
                <span className="text-gray-200">{reflection.wordCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Read Time</span>
                <span className="text-gray-200">{reflection.estimatedReadTime} min</span>
              </div>
              {reflection.rating && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Your Rating</span>
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-yellow-400 font-medium">{reflection.rating}/10</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Views</span>
                <span className="text-gray-200">{reflection.viewCount}</span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reflection.aiResponse);
                  toast.success('Reflection copied to clipboard!');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-slate-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Text
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-900/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/30 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="max-w-md w-full rounded-xl border border-red-500/20 bg-slate-900 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/20">
                  <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Reflection</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this reflection? All data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
