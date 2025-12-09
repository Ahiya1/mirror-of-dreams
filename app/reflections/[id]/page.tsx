'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ToneBadge } from '@/components/reflection/ToneBadge';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import { FeedbackForm } from '@/components/reflections/FeedbackForm';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GradientText } from '@/components/ui/glass/GradientText';
import { useToast } from '@/contexts/ToastContext';
import { trpc } from '@/lib/trpc';
import { formatReflectionDate } from '@/lib/utils';

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
  const {
    data: reflection,
    isLoading,
    error,
  } = trpc.reflections.getById.useQuery({
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
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br p-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="text-5xl">🪞</div>
              <CosmicLoader size="lg" label="Retrieving your reflection" />
              <p className="text-lg text-white/70">Retrieving your reflection...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !reflection) {
    return (
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-mirror-error/20 bg-mirror-error/10 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <svg
                className="h-6 w-6 text-mirror-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-mirror-error">Reflection not found</h3>
                <p className="mt-1 text-sm text-mirror-error/80">
                  {error?.message ||
                    'This reflection does not exist or you do not have access to it'}
                </p>
              </div>
            </div>
            <GlowButton variant="danger" size="sm" onClick={() => router.push('/reflections')}>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Reflections
              </div>
            </GlowButton>
          </div>
        </div>
      </div>
    );
  }

  // Format date with ordinal suffix and time of day
  const formattedDate = formatReflectionDate(reflection.createdAt);

  return (
    <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br">
      {/* Centered reading column layout (720px max-width) */}
      <div className="container mx-auto max-w-screen-md px-4 py-8 sm:px-8">
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Reflections
            </div>
          </GlowButton>
        </div>

        {/* Visual Header - Dream name with gradient, date, and tone */}
        <div className="mb-12">
          {/* Dream name - large gradient text */}
          {reflection.title && (
            <GradientText gradient="cosmic" className="mb-4 block text-3xl font-bold md:text-4xl">
              {reflection.title}
            </GradientText>
          )}

          {/* Metadata row (date + tone + premium) */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-white/60">{formattedDate}</span>
            <span className="text-white/30">•</span>
            <ToneBadge tone={reflection.tone} showGlow={true} />
            {reflection.isPremium && (
              <>
                <span className="text-white/30">•</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Premium
                </span>
              </>
            )}
          </div>
        </div>

        {/* User's questions and answers (collapsible) */}
        <details className="mb-12 rounded-xl border border-purple-500/20 bg-slate-900/50 p-6 backdrop-blur-sm">
          <summary className="flex cursor-pointer items-center gap-2 text-lg font-medium text-white/90 transition-colors hover:text-white/95">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Your Original Answers
          </summary>
          <div className="mt-6 space-y-6 pl-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-white/60">Your Dream</h4>
              <p className="text-base leading-relaxed text-white/90">{reflection.dream}</p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-white/60">Your Plan</h4>
              <p className="text-base leading-relaxed text-white/90">{reflection.plan}</p>
            </div>
            {reflection.dreamDate && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-white/60">Date</h4>
                <p className="text-base leading-relaxed text-white/90">{reflection.dreamDate}</p>
              </div>
            )}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-white/60">Your Relationship</h4>
              <p className="text-base leading-relaxed text-white/90">{reflection.relationship}</p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-white/60">Your Offering</h4>
              <p className="text-base leading-relaxed text-white/90">{reflection.offering}</p>
            </div>
          </div>
        </details>

        {/* AI Response with cosmic glow container */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-8 shadow-lg shadow-purple-500/10 backdrop-blur-sm sm:p-12">
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white/95 sm:text-3xl">
            <svg
              className="h-6 w-6 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Your Mirror's Reflection
          </h2>
          {/* SECURITY FIX: Replace dangerouslySetInnerHTML with AIResponseRenderer */}
          <AIResponseRenderer content={reflection.aiResponse} />
        </div>

        {/* Feedback Form */}
        <div className="mt-8">
          {showFeedbackForm ? (
            <div className="rounded-xl border border-purple-500/20 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-white/90">
                  <span className="text-xl">💜</span>
                  How did this land?
                </h3>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
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
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/20 bg-white/5 px-4 py-4 text-white/80 transition-all hover:border-amber-400/30 hover:bg-white/10"
              >
                <span className="text-lg">💜</span>
                Share how this landed
              </button>
            )
          )}
        </div>

        {/* Stats and Actions */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Stats Card */}
          <GlassCard elevated>
            <h3 className="mb-4 text-lg font-semibold text-purple-300">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Word Count</span>
                <span className="text-gray-200">{reflection.wordCount.toLocaleString()}</span>
              </div>
              {reflection.estimatedReadTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Read Time</span>
                  <span className="text-gray-200">{reflection.estimatedReadTime} min</span>
                </div>
              )}
              {reflection.rating && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Your Rating</span>
                  <div className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4 text-mirror-warning"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium text-mirror-warning">{reflection.rating}/10</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Views</span>
                <span className="text-gray-200">{reflection.viewCount}</span>
              </div>
            </div>
          </GlassCard>

          {/* Actions Card */}
          <GlassCard elevated>
            <h3 className="mb-4 text-lg font-semibold text-purple-300">Actions</h3>
            <div className="space-y-3">
              {/* Reflect Again button */}
              <GlowButton
                variant="cosmic"
                onClick={() => {
                  const reflectUrl = reflection.dreamId
                    ? `/reflection?dreamId=${reflection.dreamId}`
                    : '/reflection';
                  router.push(reflectUrl);
                }}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Reflect Again
                </div>
              </GlowButton>

              {/* Copy Text button */}
              <GlowButton
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(reflection.aiResponse);
                  toast.success('Reflection copied to clipboard!');
                }}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Text
                </div>
              </GlowButton>

              {/* Delete button */}
              <GlowButton
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </div>
              </GlowButton>
            </div>
          </GlassCard>
        </div>

        {/* Delete confirmation modal */}
        <GlassModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Reflection"
        >
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mirror-error/20">
                <svg
                  className="h-6 w-6 text-mirror-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-400">This action cannot be undone</p>
            </div>
            <p className="mb-6 text-gray-300">
              Are you sure you want to delete this reflection? All data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <GlowButton
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </GlowButton>
              <GlowButton
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </GlowButton>
            </div>
          </div>
        </GlassModal>
      </div>
    </div>
  );
}
