// app/dreams/[id]/ritual/page.tsx - Release Ritual 4-step wizard

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  AnimatedBackground,
} from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { Bird, BookOpen, Heart, Feather, Sparkles, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

type Step = 'intro' | 'learned' | 'grateful' | 'release' | 'final' | 'complete';

const RELEASE_REASONS = [
  { value: 'evolved_beyond', label: 'I have evolved beyond this dream' },
  { value: 'no_longer_resonates', label: 'This dream no longer resonates with me' },
  { value: 'completed_differently', label: 'I achieved this in a different way' },
  { value: 'circumstances_changed', label: 'My circumstances have changed' },
  { value: 'other', label: 'Other reason' },
] as const;

export default function RitualPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  const [whatILearned, setWhatILearned] = useState('');
  const [whatImGratefulFor, setWhatImGratefulFor] = useState('');
  const [whatIRelease, setWhatIRelease] = useState('');
  const [finalMessage, setFinalMessage] = useState('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState('');

  // Fetch dream details
  const { data: dream, isLoading: dreamLoading } = trpc.dreams.get.useQuery({ id: params.id });

  // Check if ritual already exists
  const { data: existingRitual, isLoading: ritualLoading } = trpc.lifecycle.getRitual.useQuery(
    { dreamId: params.id },
    { retry: false }
  );

  const releaseMutation = trpc.lifecycle.release.useMutation();

  const handleNext = () => {
    setError('');

    if (step === 'intro') {
      setStep('learned');
    } else if (step === 'learned') {
      if (whatILearned.length < 10) {
        setError('Please share at least 10 characters');
        return;
      }
      setStep('grateful');
    } else if (step === 'grateful') {
      if (whatImGratefulFor.length < 10) {
        setError('Please share at least 10 characters');
        return;
      }
      setStep('release');
    } else if (step === 'release') {
      if (whatIRelease.length < 10) {
        setError('Please share at least 10 characters');
        return;
      }
      setStep('final');
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 'learned') setStep('intro');
    else if (step === 'grateful') setStep('learned');
    else if (step === 'release') setStep('grateful');
    else if (step === 'final') setStep('release');
  };

  const handleComplete = async () => {
    setError('');

    try {
      await releaseMutation.mutateAsync({
        dreamId: params.id,
        whatILearned,
        whatImGratefulFor,
        whatIRelease,
        finalMessage: finalMessage || undefined,
        reason: reason as any || undefined,
      });

      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to complete ritual');
    }
  };

  const isLoading = dreamLoading || ritualLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <CosmicLoader size="lg" label="Loading..." />
        </div>
      </div>
    );
  }

  // If ritual already exists, show it
  if (existingRitual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <AppNavigation currentPage="dreams" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] pb-8">
          <GlowButton
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dreams/${params.id}`)}
            className="mb-6"
          >
            Back to Dream
          </GlowButton>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-mirror-info to-mirror-purple mb-4">
              <Bird className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-h1 font-bold mb-2">
              <GradientText gradient="cosmic">Release Ritual</GradientText>
            </h1>
            <p className="text-white/70 text-lg">{existingRitual.dream_title}</p>
            <p className="text-white/50 text-sm mt-2">
              Released on {new Date(existingRitual.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-6">
            <GlassCard elevated className="border-mirror-purple/20">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-mirror-purple" />
                <h3 className="font-semibold text-white">What I Learned</h3>
              </div>
              <p className="text-white/80 whitespace-pre-wrap">{existingRitual.what_i_learned}</p>
            </GlassCard>

            <GlassCard elevated className="border-mirror-success/20">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-mirror-success" />
                <h3 className="font-semibold text-white">What I'm Grateful For</h3>
              </div>
              <p className="text-white/80 whitespace-pre-wrap">{existingRitual.what_im_grateful_for}</p>
            </GlassCard>

            <GlassCard elevated className="border-mirror-info/20">
              <div className="flex items-center gap-2 mb-3">
                <Feather className="w-5 h-5 text-mirror-info" />
                <h3 className="font-semibold text-white">What I Release</h3>
              </div>
              <p className="text-white/80 whitespace-pre-wrap">{existingRitual.what_i_release}</p>
            </GlassCard>

            {existingRitual.final_message && (
              <GlassCard elevated className="border-mirror-gold/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-mirror-gold" />
                  <h3 className="font-semibold text-white">Final Words</h3>
                </div>
                <p className="text-white/80 italic whitespace-pre-wrap">"{existingRitual.final_message}"</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dream not found or not active
  if (!dream || dream.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <AppNavigation currentPage="dreams" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <GlassCard className="p-8 text-center" elevated>
            <p className="text-h3 text-white mb-4">Cannot perform ritual</p>
            <p className="text-white/60 mb-4">
              {!dream ? 'Dream not found.' : 'Only active dreams can be released.'}
            </p>
            <GlowButton
              variant="ghost"
              onClick={() => router.push('/dreams')}
            >
              Back to Dreams
            </GlowButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Completion screen
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="medium" />
        <AppNavigation currentPage="dreams" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+2rem)] pb-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-mirror-info to-mirror-purple mb-4">
              <Bird className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-h1 font-bold">
              <GradientText gradient="cosmic">Released with Gratitude</GradientText>
            </h1>

            <p className="text-white/80 text-lg max-w-md mx-auto">
              Your dream "{dream.title}" has been released. The lessons and growth it brought you remain forever.
            </p>

            <div className="pt-6">
              <GlowButton
                variant="primary"
                size="lg"
                onClick={() => router.push('/dreams')}
              >
                Return to Dreams
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wizard steps
  const stepConfig = {
    intro: {
      icon: Bird,
      title: 'Release Ritual',
      subtitle: dream.title,
    },
    learned: {
      icon: BookOpen,
      title: 'What I Learned',
      subtitle: 'Every dream teaches us something',
    },
    grateful: {
      icon: Heart,
      title: 'What I\'m Grateful For',
      subtitle: 'Honor what this dream gave you',
    },
    release: {
      icon: Feather,
      title: 'What I Release',
      subtitle: 'Let go with intention',
    },
    final: {
      icon: Sparkles,
      title: 'Final Words',
      subtitle: 'Any closing thoughts (optional)',
    },
  };

  const currentConfig = stepConfig[step as keyof typeof stepConfig];
  const Icon = currentConfig.icon;
  const steps: Step[] = ['intro', 'learned', 'grateful', 'release', 'final'];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <AnimatedBackground intensity="subtle" />
      <AppNavigation currentPage="dreams" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] pb-8">
        {/* Back to Dream */}
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dreams/${params.id}`)}
          className="mb-6"
        >
          Cancel
        </GlowButton>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                i === currentIndex
                  ? 'bg-mirror-purple'
                  : i < currentIndex
                  ? 'bg-mirror-purple/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Step Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-mirror-info to-mirror-purple mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-h2 font-bold text-white mb-2">{currentConfig.title}</h2>
          <p className="text-white/60">{currentConfig.subtitle}</p>
        </div>

        {error && (
          <GlassCard className="border-l-4 border-mirror-error/60 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-mirror-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-mirror-error">{error}</p>
            </div>
          </GlassCard>
        )}

        <GlassCard elevated className="mb-6">
          {step === 'intro' && (
            <div className="space-y-4 text-center">
              <p className="text-white/80 leading-relaxed">
                Releasing a dream is not failure - it is wisdom. Sometimes our dreams evolve,
                sometimes our path changes, and sometimes we realize a dream was protecting
                a deeper truth we were not ready to face.
              </p>
              <p className="text-white/80 leading-relaxed">
                This ritual guides you through releasing "{dream.title}" with gratitude
                and intention, honoring what it gave you while letting it go.
              </p>
              <p className="text-white/60 text-sm mt-4">
                Take your time. There's no rush.
              </p>
            </div>
          )}

          {step === 'learned' && (
            <div className="space-y-4">
              <p className="text-white/70 text-sm">
                What did pursuing this dream teach you? What do you know now that you didn't before?
              </p>
              <textarea
                value={whatILearned}
                onChange={(e) => setWhatILearned(e.target.value)}
                placeholder="Through this dream, I learned that..."
                maxLength={2000}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              <div className="text-xs text-white/40 text-right">
                {whatILearned.length} / 2000 (min 10)
              </div>
            </div>
          )}

          {step === 'grateful' && (
            <div className="space-y-4">
              <p className="text-white/70 text-sm">
                What gifts did this dream give you? What are you grateful for, even if the dream is ending?
              </p>
              <textarea
                value={whatImGratefulFor}
                onChange={(e) => setWhatImGratefulFor(e.target.value)}
                placeholder="I am grateful for..."
                maxLength={2000}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              <div className="text-xs text-white/40 text-right">
                {whatImGratefulFor.length} / 2000 (min 10)
              </div>
            </div>
          )}

          {step === 'release' && (
            <div className="space-y-4">
              <p className="text-white/70 text-sm">
                What are you consciously letting go of? What weight are you setting down?
              </p>
              <textarea
                value={whatIRelease}
                onChange={(e) => setWhatIRelease(e.target.value)}
                placeholder="I release..."
                maxLength={2000}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              <div className="text-xs text-white/40 text-right">
                {whatIRelease.length} / 2000 (min 10)
              </div>
            </div>
          )}

          {step === 'final' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-white/70 text-sm">
                  Any final words you want to record? (Optional)
                </p>
                <textarea
                  value={finalMessage}
                  onChange={(e) => setFinalMessage(e.target.value)}
                  placeholder="As I close this chapter..."
                  maxLength={2000}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
                />
              </div>

              <div className="space-y-3">
                <p className="text-white/70 text-sm">Why are you releasing this dream?</p>
                <div className="space-y-2">
                  {RELEASE_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        reason === r.value
                          ? 'bg-mirror-purple/20 border border-mirror-purple/40'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={(e) => setReason(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        reason === r.value ? 'border-mirror-purple bg-mirror-purple' : 'border-white/40'
                      }`}>
                        {reason === r.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-white/80 text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between">
          <GlowButton
            variant="ghost"
            size="md"
            onClick={handleBack}
            disabled={step === 'intro'}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </GlowButton>

          {step !== 'final' ? (
            <GlowButton
              variant="primary"
              size="md"
              onClick={handleNext}
            >
              {step === 'intro' ? 'Begin Ritual' : 'Continue'} <ArrowRight className="w-4 h-4 ml-1" />
            </GlowButton>
          ) : (
            <GlowButton
              variant="cosmic"
              size="md"
              onClick={handleComplete}
              disabled={releaseMutation.isPending}
            >
              {releaseMutation.isPending ? 'Releasing...' : 'Complete Ritual'}
            </GlowButton>
          )}
        </div>
      </div>
    </div>
  );
}
