// components/dreams/EvolutionModal.tsx - Multi-step evolution flow

'use client';

import { AlertTriangle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

import { GlassModal, GlowButton, GlassCard } from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

interface EvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dream: {
    id: string;
    title: string;
    description?: string | null;
    target_date?: string | null;
    category?: string | null;
  };
}

const CATEGORIES = [
  { value: 'health', label: 'Health & Fitness', emoji: '🏃' },
  { value: 'career', label: 'Career', emoji: '💼' },
  { value: 'relationships', label: 'Relationships', emoji: '❤️' },
  { value: 'financial', label: 'Financial', emoji: '💰' },
  { value: 'personal_growth', label: 'Personal Growth', emoji: '🌱' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'spiritual', label: 'Spiritual', emoji: '🙏' },
  { value: 'entrepreneurial', label: 'Entrepreneurial', emoji: '🚀' },
  { value: 'educational', label: 'Educational', emoji: '📚' },
  { value: 'other', label: 'Other', emoji: '⭐' },
] as const;

type Step = 'old' | 'new' | 'reflection';

export function EvolutionModal({ isOpen, onClose, onSuccess, dream }: EvolutionModalProps) {
  const [step, setStep] = useState<Step>('old');
  const [newTitle, setNewTitle] = useState(dream.title);
  const [newDescription, setNewDescription] = useState(dream.description || '');
  const [newTargetDate, setNewTargetDate] = useState(dream.target_date || '');
  const [newCategory, setNewCategory] = useState(dream.category || 'personal_growth');
  const [evolutionReflection, setEvolutionReflection] = useState('');
  const [error, setError] = useState('');

  const evolveMutation = trpc.lifecycle.evolve.useMutation();

  const handleNext = () => {
    if (step === 'old') {
      setStep('new');
    } else if (step === 'new') {
      // Validate that something changed
      const hasChanges =
        newTitle !== dream.title ||
        newDescription !== (dream.description || '') ||
        newTargetDate !== (dream.target_date || '') ||
        newCategory !== (dream.category || 'personal_growth');

      if (!hasChanges) {
        setError('Please make at least one change to evolve your dream');
        return;
      }
      setError('');
      setStep('reflection');
    }
  };

  const handleBack = () => {
    if (step === 'new') {
      setStep('old');
    } else if (step === 'reflection') {
      setStep('new');
    }
  };

  const handleSubmit = async () => {
    if (evolutionReflection.length < 10) {
      setError('Please share at least 10 characters about why your dream evolved');
      return;
    }

    setError('');

    try {
      await evolveMutation.mutateAsync({
        dreamId: dream.id,
        newTitle,
        newDescription: newDescription || undefined,
        newTargetDate: newTargetDate || null,
        newCategory: newCategory as any,
        evolutionReflection,
      });

      // Reset form
      setStep('old');
      setEvolutionReflection('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to evolve dream';
      setError(message);
    }
  };

  const handleClose = () => {
    setStep('old');
    setError('');
    setNewTitle(dream.title);
    setNewDescription(dream.description || '');
    setNewTargetDate(dream.target_date || '');
    setNewCategory(dream.category || 'personal_growth');
    setEvolutionReflection('');
    onClose();
  };

  const stepTitles: Record<Step, string> = {
    old: 'Your Dream Now',
    new: 'What It Is Becoming',
    reflection: 'Why This Evolution?',
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Evolve Dream: ${stepTitles[step]}`}
      disableSwipeDismiss={true}
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          {(['old', 'new', 'reflection'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s === step
                  ? 'bg-mirror-purple'
                  : i < ['old', 'new', 'reflection'].indexOf(step)
                    ? 'bg-mirror-purple/50'
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {error && (
          <GlassCard className="border-l-4 border-mirror-error/60">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-mirror-error" />
              <p className="text-sm text-mirror-error">{error}</p>
            </div>
          </GlassCard>
        )}

        {/* Step 1: Current Dream (Read-only) */}
        {step === 'old' && (
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              This is your dream as it exists now. Review it before making changes.
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">Title</label>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                  {dream.title}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">Description</label>
                <div className="min-h-[80px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
                  {dream.description || (
                    <span className="italic text-white/40">No description</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">
                    Target Date
                  </label>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
                    {dream.target_date || <span className="text-white/40">Not set</span>}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">Category</label>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
                    {CATEGORIES.find((c) => c.value === dream.category)?.emoji}{' '}
                    {CATEGORIES.find((c) => c.value === dream.category)?.label || 'Other'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: New Form (Editable) */}
        {step === 'new' && (
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              Update your dream to reflect how it has evolved. What has changed?
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="newTitle" className="mb-1 block text-sm font-medium text-white/90">
                  New Title *
                </label>
                <input
                  id="newTitle"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={200}
                  required
                  className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 placeholder:text-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="newDescription"
                  className="mb-1 block text-sm font-medium text-white/90"
                >
                  New Description
                </label>
                <textarea
                  id="newDescription"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full resize-none rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 placeholder:text-white/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="newTargetDate"
                    className="mb-1 block text-sm font-medium text-white/90"
                  >
                    Target Date
                  </label>
                  <input
                    id="newTargetDate"
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 [color-scheme:dark] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newCategory"
                    className="mb-1 block text-sm font-medium text-white/90"
                  >
                    Category
                  </label>
                  <select
                    id="newCategory"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full cursor-pointer rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-mirror-midnight">
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Reflection */}
        {step === 'reflection' && (
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <Sparkles className="text-mirror-purple mx-auto h-8 w-8" />
              <p className="text-white/90">
                What led to this evolution? Why is your dream transforming?
              </p>
              <p className="text-sm text-white/60">
                This reflection will be saved as part of your dream's history.
              </p>
            </div>

            <div>
              <textarea
                id="evolutionReflection"
                value={evolutionReflection}
                onChange={(e) => setEvolutionReflection(e.target.value)}
                placeholder="I've realized that... / What I truly want is... / This dream evolved because..."
                maxLength={2000}
                rows={6}
                className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full resize-none rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 placeholder:text-white/40 focus:outline-none"
              />
              <div className="mt-1 text-right text-xs text-white/40">
                {evolutionReflection.length} / 2000 (min 10)
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between gap-3 border-t border-white/10 pt-4">
          <GlowButton variant="ghost" size="md" onClick={step === 'old' ? handleClose : handleBack}>
            {step === 'old' ? (
              'Cancel'
            ) : (
              <>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </>
            )}
          </GlowButton>

          {step !== 'reflection' ? (
            <GlowButton variant="primary" size="md" onClick={handleNext}>
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </GlowButton>
          ) : (
            <GlowButton
              variant="cosmic"
              size="md"
              onClick={handleSubmit}
              disabled={evolveMutation.isPending}
            >
              {evolveMutation.isPending ? 'Evolving...' : 'Complete Evolution'}
            </GlowButton>
          )}
        </div>
      </div>
    </GlassModal>
  );
}
