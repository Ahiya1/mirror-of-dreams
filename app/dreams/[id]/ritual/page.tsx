// app/dreams/[id]/ritual/page.tsx - Release Ritual 4-step wizard

'use client';

import {
  Bird,
  BookOpen,
  Heart,
  Feather,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { AppNavigation } from '@/components/shared/AppNavigation';
import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  AnimatedBackground,
} from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

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
        reason: (reason as any) || undefined,
      });

      setStep('complete');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete ritual';
      setError(message);
    }
  };

  const isLoading = dreamLoading || ritualLoading;

  if (isLoading) {
    return (
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br">
        <AnimatedBackground intensity="subtle" />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <CosmicLoader size="lg" label="Loading..." />
        </div>
      </div>
    );
  }

  // If ritual already exists, show it
  if (existingRitual) {
    return (
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br">
        <AnimatedBackground intensity="subtle" />
        <AppNavigation currentPage="dreams" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 pb-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] sm:px-6 lg:px-8">
          <GlowButton
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dreams/${params.id}`)}
            className="mb-6"
          >
            Back to Dream
          </GlowButton>

          <div className="mb-8 text-center">
            <div className="to-mirror-purple mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-mirror-info">
              <Bird className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-h1 mb-2 font-bold">
              <GradientText gradient="cosmic">Release Ritual</GradientText>
            </h1>
            <p className="text-lg text-white/70">{existingRitual.dream_title}</p>
            <p className="mt-2 text-sm text-white/50">
              Released on {new Date(existingRitual.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-6">
            <GlassCard elevated className="border-mirror-purple/20">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="text-mirror-purple h-5 w-5" />
                <h3 className="font-semibold text-white">What I Learned</h3>
              </div>
              <p className="whitespace-pre-wrap text-white/80">{existingRitual.what_i_learned}</p>
            </GlassCard>

            <GlassCard elevated className="border-mirror-success/20">
              <div className="mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-mirror-success" />
                <h3 className="font-semibold text-white">What I'm Grateful For</h3>
              </div>
              <p className="whitespace-pre-wrap text-white/80">
                {existingRitual.what_im_grateful_for}
              </p>
            </GlassCard>

            <GlassCard elevated className="border-mirror-info/20">
              <div className="mb-3 flex items-center gap-2">
                <Feather className="h-5 w-5 text-mirror-info" />
                <h3 className="font-semibold text-white">What I Release</h3>
              </div>
              <p className="whitespace-pre-wrap text-white/80">{existingRitual.what_i_release}</p>
            </GlassCard>

            {existingRitual.final_message && (
              <GlassCard elevated className="border-mirror-gold/20">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="text-mirror-gold h-5 w-5" />
                  <h3 className="font-semibold text-white">Final Words</h3>
                </div>
                <p className="whitespace-pre-wrap italic text-white/80">
                  "{existingRitual.final_message}"
                </p>
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
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br">
        <AnimatedBackground intensity="subtle" />
        <AppNavigation currentPage="dreams" />
        <div className="flex min-h-[50vh] items-center justify-center">
          <GlassCard className="p-8 text-center" elevated>
            <p className="text-h3 mb-4 text-white">Cannot perform ritual</p>
            <p className="mb-4 text-white/60">
              {!dream ? 'Dream not found.' : 'Only active dreams can be released.'}
            </p>
            <GlowButton variant="ghost" onClick={() => router.push('/dreams')}>
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
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br">
        <AnimatedBackground intensity="medium" />
        <AppNavigation currentPage="dreams" />

        <div className="relative z-10 mx-auto max-w-2xl px-4 pb-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+2rem)] sm:px-6 lg:px-8">
          <div className="space-y-6 text-center">
            <div className="to-mirror-purple mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-mirror-info">
              <Bird className="h-12 w-12 text-white" />
            </div>

            <h1 className="text-h1 font-bold">
              <GradientText gradient="cosmic">Released with Gratitude</GradientText>
            </h1>

            <p className="mx-auto max-w-md text-lg text-white/80">
              Your dream "{dream.title}" has been released. The lessons and growth it brought you
              remain forever.
            </p>

            <div className="pt-6">
              <GlowButton variant="primary" size="lg" onClick={() => router.push('/dreams')}>
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
      title: "What I'm Grateful For",
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
    <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br">
      <AnimatedBackground intensity="subtle" />
      <AppNavigation currentPage="dreams" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] sm:px-6 lg:px-8">
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
        <div className="mb-8 flex justify-center gap-2">
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
        <div className="mb-8 text-center">
          <div className="to-mirror-purple mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mirror-info">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-h2 mb-2 font-bold text-white">{currentConfig.title}</h2>
          <p className="text-white/60">{currentConfig.subtitle}</p>
        </div>

        {error && (
          <GlassCard className="mb-6 border-l-4 border-mirror-error/60">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-mirror-error" />
              <p className="text-sm text-mirror-error">{error}</p>
            </div>
          </GlassCard>
        )}

        <GlassCard elevated className="mb-6">
          {step === 'intro' && (
            <div className="space-y-4 text-center">
              <p className="leading-relaxed text-white/80">
                Releasing a dream is not failure - it is wisdom. Sometimes our dreams evolve,
                sometimes our path changes, and sometimes we realize a dream was protecting a deeper
                truth we were not ready to face.
              </p>
              <p className="leading-relaxed text-white/80">
                This ritual guides you through releasing "{dream.title}" with gratitude and
                intention, honoring what it gave you while letting it go.
              </p>
              <p className="mt-4 text-sm text-white/60">Take your time. There's no rush.</p>
            </div>
          )}

          {step === 'learned' && (
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                What did pursuing this dream teach you? What do you know now that you didn't before?
              </p>
              <textarea
                value={whatILearned}
                onChange={(e) => setWhatILearned(e.target.value)}
                placeholder="Through this dream, I learned that..."
                maxLength={2000}
                rows={6}
                className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full resize-none rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 placeholder:text-white/40 focus:outline-none"
              />
              <div className="text-right text-xs text-white/40">
                {whatILearned.length} / 2000 (min 10)
              </div>
            </div>
          )}

          {step === 'grateful' && (
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                What gifts did this dream give you? What are you grateful for, even if the dream is
                ending?
              </p>
              <textarea
                value={whatImGratefulFor}
                onChange={(e) => setWhatImGratefulFor(e.target.value)}
                placeholder="I am grateful for..."
                maxLength={2000}
                rows={6}
                className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full resize-none rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 placeholder:text-white/40 focus:outline-none"
              />
              <div className="text-right text-xs text-white/40">
                {whatImGratefulFor.length} / 2000 (min 10)
              </div>
            </div>
          )}

          {step === 'release' && (
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                What are you consciously letting go of? What weight are you setting down?
              </p>
              <textarea
                value={whatIRelease}
                onChange={(e) => setWhatIRelease(e.target.value)}
                placeholder="I release..."
                maxLength={2000}
                rows={6}
                className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full resize-none rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 placeholder:text-white/40 focus:outline-none"
              />
              <div className="text-right text-xs text-white/40">
                {whatIRelease.length} / 2000 (min 10)
              </div>
            </div>
          )}

          {step === 'final' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-white/70">
                  Any final words you want to record? (Optional)
                </p>
                <textarea
                  value={finalMessage}
                  onChange={(e) => setFinalMessage(e.target.value)}
                  placeholder="As I close this chapter..."
                  maxLength={2000}
                  rows={4}
                  className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full resize-none rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 placeholder:text-white/40 focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm text-white/70">Why are you releasing this dream?</p>
                <div className="space-y-2">
                  {RELEASE_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${
                        reason === r.value
                          ? 'bg-mirror-purple/20 border-mirror-purple/40 border'
                          : 'border border-transparent bg-white/5 hover:bg-white/10'
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
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                          reason === r.value
                            ? 'border-mirror-purple bg-mirror-purple'
                            : 'border-white/40'
                        }`}
                      >
                        {reason === r.value && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm text-white/80">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          <GlowButton variant="ghost" size="md" onClick={handleBack} disabled={step === 'intro'}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </GlowButton>

          {step !== 'final' ? (
            <GlowButton variant="primary" size="md" onClick={handleNext}>
              {step === 'intro' ? 'Begin Ritual' : 'Continue'}{' '}
              <ArrowRight className="ml-1 h-4 w-4" />
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
