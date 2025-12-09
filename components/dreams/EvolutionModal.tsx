// components/dreams/EvolutionModal.tsx - Multi-step evolution flow

'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassModal, GlowButton, GlassCard } from '@/components/ui/glass';
import { AlertTriangle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

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
              <AlertTriangle className="w-5 h-5 text-mirror-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-mirror-error">{error}</p>
            </div>
          </GlassCard>
        )}

        {/* Step 1: Current Dream (Read-only) */}
        {step === 'old' && (
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              This is your dream as it exists now. Review it before making changes.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Title</label>
                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  {dream.title}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Description</label>
                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 min-h-[80px]">
                  {dream.description || <span className="text-white/40 italic">No description</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Target Date</label>
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80">
                    {dream.target_date || <span className="text-white/40">Not set</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Category</label>
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80">
                    {CATEGORIES.find(c => c.value === dream.category)?.emoji}{' '}
                    {CATEGORIES.find(c => c.value === dream.category)?.label || 'Other'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: New Form (Editable) */}
        {step === 'new' && (
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              Update your dream to reflect how it has evolved. What has changed?
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="newTitle" className="block text-sm font-medium text-white/90 mb-1">
                  New Title *
                </label>
                <input
                  id="newTitle"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={200}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow"
                />
              </div>

              <div>
                <label htmlFor="newDescription" className="block text-sm font-medium text-white/90 mb-1">
                  New Description
                </label>
                <textarea
                  id="newDescription"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="newTargetDate" className="block text-sm font-medium text-white/90 mb-1">
                    Target Date
                  </label>
                  <input
                    id="newTargetDate"
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label htmlFor="newCategory" className="block text-sm font-medium text-white/90 mb-1">
                    Category
                  </label>
                  <select
                    id="newCategory"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow cursor-pointer"
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
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 text-mirror-purple mx-auto" />
              <p className="text-white/90">
                What led to this evolution? Why is your dream transforming?
              </p>
              <p className="text-white/60 text-sm">
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              <div className="text-xs text-white/40 text-right mt-1">
                {evolutionReflection.length} / 2000 (min 10)
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-between pt-4 border-t border-white/10">
          <GlowButton
            variant="ghost"
            size="md"
            onClick={step === 'old' ? handleClose : handleBack}
          >
            {step === 'old' ? 'Cancel' : (
              <>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </>
            )}
          </GlowButton>

          {step !== 'reflection' ? (
            <GlowButton
              variant="primary"
              size="md"
              onClick={handleNext}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
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
