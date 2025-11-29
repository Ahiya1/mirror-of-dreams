'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlassCard, GlowButton, CosmicLoader, GlassInput } from '@/components/ui/glass';
import { ReflectionQuestionCard } from '@/components/reflection/ReflectionQuestionCard';
import { ToneSelectionCard } from '@/components/reflection/ToneSelectionCard';
import { ProgressBar } from '@/components/reflection/ProgressBar';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import { cn } from '@/lib/utils';
import type { ToneId } from '@/lib/utils/constants';
import { QUESTION_LIMITS, REFLECTION_MICRO_COPY } from '@/lib/utils/constants';

interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}

type ViewMode = 'questionnaire' | 'output';

// Guiding text for each question - sets contemplative tone
const QUESTION_GUIDES = {
  dream: 'Take a moment to describe your dream in vivid detail...',
  plan: 'What concrete steps will you take on this journey?',
  relationship: 'How does this dream connect to who you are becoming?',
  offering: 'What are you willing to give, sacrifice, or commit?',
};

// Warm placeholder text - creates sacred, welcoming space
const WARM_PLACEHOLDERS = {
  dream: 'Your thoughts are safe here... what\'s present for you right now?',
  plan: 'What step feels right to take next?',
  relationship: 'How does this dream connect to who you\'re becoming?',
  offering: 'What gift is this dream offering you?',
};

/**
 * Mesmerizing single-page Mirror Experience
 * Enhanced with depth, atmosphere, and immersive transitions
 */
export default function MirrorExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const prefersReducedMotion = useReducedMotion();

  // Determine view mode from URL
  const reflectionId = searchParams.get('id');
  const dreamIdFromUrl = searchParams.get('dreamId'); // Pre-selected dream from URL
  const initialMode: ViewMode = reflectionId ? 'output' : 'questionnaire';

  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [selectedDreamId, setSelectedDreamId] = useState<string>(dreamIdFromUrl || '');
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneId>('fusion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('Gazing into the mirror...');
  const [mirrorGlow, setMirrorGlow] = useState(false);

  // Fetch user's dreams for selection
  const { data: dreams } = trpc.dreams.list.useQuery({
    status: 'active',
    includeStats: true,
  }, { enabled: viewMode === 'questionnaire' });

  const [formData, setFormData] = useState<FormData>({
    dream: '',
    plan: '',
    relationship: '',
    offering: '',
  });

  // Fetch reflection if viewing output
  const { data: reflection, isLoading: reflectionLoading } = trpc.reflections.getById.useQuery(
    { id: reflectionId! },
    { enabled: !!reflectionId && viewMode === 'output' }
  );

  const createReflection = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      // Transition to output with smooth animation
      setStatusText('Reflection complete!');
      setMirrorGlow(true);
      setTimeout(() => {
        router.push(`/reflection?id=${data.reflectionId}`);
        setViewMode('output');
      }, 1000);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Update selected dream when dreams load or selection changes
  useEffect(() => {
    if (dreams && selectedDreamId) {
      const dream = dreams.find((d: any) => d.id === selectedDreamId);
      if (dream) {
        setSelectedDream(dream);
      }
    }
  }, [dreams, selectedDreamId]);

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDreamSelect = (dreamId: string) => {
    const dream = dreams?.find((d: any) => d.id === dreamId);
    setSelectedDream(dream || null);
    setSelectedDreamId(dreamId);
  };

  const validateForm = (): boolean => {
    if (!selectedDreamId) {
      toast.warning('Please select a dream');
      return false;
    }

    if (!formData.dream.trim()) {
      toast.warning('Please elaborate on your dream');
      return false;
    }

    if (!formData.plan.trim()) {
      toast.warning('Please describe your plan');
      return false;
    }

    if (!formData.relationship.trim()) {
      toast.warning('Please share your relationship with this dream');
      return false;
    }

    if (!formData.offering.trim()) {
      toast.warning('Please describe what you\'re willing to give');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setStatusText('Gazing into the mirror...');

    // Update status text after 3 seconds
    setTimeout(() => {
      setStatusText('Crafting your insight...');
    }, 3000);

    createReflection.mutate({
      dreamId: selectedDreamId,
      dream: formData.dream,
      plan: formData.plan,
      relationship: formData.relationship,
      offering: formData.offering,
      tone: selectedTone,
    });
  };

  const questions = [
    {
      id: 'dream' as keyof FormData,
      number: 1,
      text: selectedDream ? `What is ${selectedDream.title}?` : 'What is this dream?',
      guide: QUESTION_GUIDES.dream,
      placeholder: WARM_PLACEHOLDERS.dream,
      limit: QUESTION_LIMITS.dream,
    },
    {
      id: 'plan' as keyof FormData,
      number: 2,
      text: selectedDream ? `What is your plan for ${selectedDream.title}?` : 'What is your plan to bring it to life?',
      guide: QUESTION_GUIDES.plan,
      placeholder: WARM_PLACEHOLDERS.plan,
      limit: QUESTION_LIMITS.plan,
    },
    {
      id: 'relationship' as keyof FormData,
      number: 3,
      text: selectedDream ? `What's your relationship with ${selectedDream.title}?` : 'What relationship do you seek with your dream?',
      guide: QUESTION_GUIDES.relationship,
      placeholder: WARM_PLACEHOLDERS.relationship,
      limit: QUESTION_LIMITS.relationship,
    },
    {
      id: 'offering' as keyof FormData,
      number: 4,
      text: selectedDream ? `What are you willing to give for ${selectedDream.title}?` : 'What are you willing to offer in service of this dream?',
      guide: QUESTION_GUIDES.offering,
      placeholder: WARM_PLACEHOLDERS.offering,
      limit: QUESTION_LIMITS.sacrifice,
    },
  ];

  // Category emoji mapping for dreams
  const categoryEmoji: Record<string, string> = {
    health: '🏃',
    career: '💼',
    relationships: '❤️',
    financial: '💰',
    personal_growth: '🌱',
    creative: '🎨',
    spiritual: '🙏',
    entrepreneurial: '🚀',
    educational: '📚',
    other: '⭐',
  };

  return (
    <div className="reflection-experience">
      {/* Darker cosmic background with vignette */}
      <CosmicBackground />
      <div className="reflection-vignette" />

      {/* Tone-based ambient elements */}
      <div className="tone-elements">
        {selectedTone === 'fusion' && (
          <>
            <div className="fusion-breath" style={{
              left: '20%',
              top: '30%',
              width: 'clamp(220px, 45vw, 300px)',
              height: 'clamp(220px, 45vw, 300px)',
            }} />
            <div className="fusion-breath" style={{
              right: '15%',
              bottom: '25%',
              width: 'clamp(180px, 35vw, 240px)',
              height: 'clamp(180px, 35vw, 240px)',
              animationDelay: '-12s',
            }} />
          </>
        )}
        {selectedTone === 'gentle' && (
          <>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="gentle-star" style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${-i * 0.8}s`,
              }} />
            ))}
          </>
        )}
        {selectedTone === 'intense' && (
          <>
            <div className="intense-swirl" style={{
              left: '15%',
              top: '20%',
            }} />
            <div className="intense-swirl" style={{
              right: '10%',
              bottom: '15%',
              animationDelay: '-9s',
            }} />
          </>
        )}
      </div>

      {/* Floating cosmic particles */}
      <div className="cosmic-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'questionnaire' && (
          <motion.div
            key="questionnaire"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="questionnaire-container"
          >
            {/* Centered narrow content (800px) */}
            <GlassCard
              elevated
              className={cn(
                'reflection-card',
                mirrorGlow && 'border-mirror-gold/60 shadow-[0_0_120px_rgba(251,191,36,0.4)]'
              )}
            >
              <div className="mirror-surface">
                {!selectedDreamId ? (
                  /* Dream selection view */
                  <div className="question-view">
                    <h2 className="text-center mb-8 text-2xl md:text-3xl font-light bg-gradient-to-r from-mirror-amethyst via-mirror-amethyst-light to-cosmic-blue bg-clip-text text-transparent">
                      Which dream are you reflecting on?
                    </h2>

                    <div className="dream-selection-list">
                      {dreams && dreams.length > 0 ? (
                        dreams.map((dream: any) => {
                          const emoji = categoryEmoji[dream.category || 'other'] || '⭐';
                          const isSelected = selectedDreamId === dream.id;

                          return (
                            <div
                              key={dream.id}
                              onClick={() => handleDreamSelect(dream.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleDreamSelect(dream.id);
                                }
                              }}
                            >
                              <GlassCard
                                elevated={isSelected}
                                interactive
                                className={cn(
                                  'cursor-pointer transition-all',
                                  isSelected && 'border-mirror-amethyst/60'
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-4xl flex-shrink-0">{emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="mb-1 text-lg font-medium text-white">
                                      {dream.title}
                                    </h3>
                                    {dream.daysLeft !== null && dream.daysLeft !== undefined && (
                                      <p className="text-sm text-mirror-amethyst-light">
                                        {dream.daysLeft < 0
                                          ? `${Math.abs(dream.daysLeft)}d overdue`
                                          : dream.daysLeft === 0
                                          ? 'Today!'
                                          : `${dream.daysLeft}d left`}
                                      </p>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="text-mirror-amethyst flex-shrink-0"
                                    >
                                      <Check className="h-6 w-6" />
                                    </motion.div>
                                  )}
                                </div>
                              </GlassCard>
                            </div>
                          );
                        })
                      ) : (
                        <GlassCard elevated className="text-center">
                          <p className="text-white/70 mb-6">No active dreams yet.</p>
                          <GlowButton
                            variant="primary"
                            size="md"
                            onClick={() => router.push('/dreams')}
                          >
                            Create Your First Dream
                          </GlowButton>
                        </GlassCard>
                      )}
                    </div>
                  </div>
                ) : (
                  /* One-Page Reflection Form */
                  <div className="one-page-form">
                    {/* Welcome Message */}
                    <div className="mb-6 text-center">
                      <p className="text-white/80 text-base md:text-lg font-light italic">
                        {REFLECTION_MICRO_COPY.welcome}
                      </p>
                    </div>

                    {/* Enhanced Dream Context Banner - Sacred Display */}
                    {selectedDream && (
                      <div className="dream-context-banner">
                        <h2>
                          Reflecting on: {selectedDream.title}
                        </h2>
                        <div className="dream-meta">
                          {selectedDream.category && (
                            <span className="category-badge">
                              {selectedDream.category}
                            </span>
                          )}
                          {selectedDream.daysLeft !== null && selectedDream.daysLeft !== undefined && (
                            <span className="days-remaining">
                              {selectedDream.daysLeft < 0
                                ? `${Math.abs(selectedDream.daysLeft)} days overdue`
                                : selectedDream.daysLeft === 0
                                ? 'Today!'
                                : `${selectedDream.daysLeft} days remaining`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="mb-8">
                      <ProgressBar currentStep={1} totalSteps={4} />
                    </div>

                    {/* All 4 Questions with enhanced sacred styling */}
                    <div className="questions-container">
                      {questions.map((question) => (
                        <ReflectionQuestionCard
                          key={question.id}
                          questionNumber={question.number}
                          totalQuestions={4}
                          questionText={question.text}
                          guidingText={question.guide}
                          placeholder={question.placeholder}
                          value={formData[question.id]}
                          onChange={(value) => handleFieldChange(question.id, value)}
                          maxLength={question.limit}
                        />
                      ))}
                    </div>

                    {/* Enhanced Tone Selection */}
                    <div className="mb-8">
                      <ToneSelectionCard
                        selectedTone={selectedTone}
                        onSelect={setSelectedTone}
                      />
                    </div>

                    {/* Ready message before submit */}
                    <div className="text-center mb-6">
                      <p className="text-white/70 text-sm italic">
                        {REFLECTION_MICRO_COPY.readyToSubmit}
                      </p>
                    </div>

                    {/* "Gaze into the Mirror" Submit Button with breathing animation */}
                    <div className="flex justify-center">
                      <GlowButton
                        variant="cosmic"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="min-w-[280px] text-lg font-medium submit-button-breathe"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-3">
                            <CosmicLoader size="sm" />
                            Gazing...
                          </span>
                        ) : (
                          <>
                            ✨ Gaze into the Mirror ✨
                          </>
                        )}
                      </GlowButton>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {viewMode === 'output' && (
          <motion.div
            key="output"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
            className="output-container"
          >
            {reflectionLoading ? (
              <div className="flex flex-col items-center justify-center gap-6 py-20">
                <CosmicLoader size="lg" />
                <p className="text-white/70 text-lg">Loading reflection...</p>
              </div>
            ) : reflection ? (
              <GlassCard
                elevated
                className="reflection-card"
              >
                <div className="mirror-surface">
                  <div className="reflection-content">
                    <h1 className="text-center mb-8 text-4xl md:text-5xl font-semibold bg-gradient-to-r from-[#fbbf24] to-[#9333ea] bg-clip-text text-transparent">
                      Your Reflection
                    </h1>
                    <div className="reflection-text">
                      <AIResponseRenderer content={reflection.aiResponse} />
                    </div>
                    <div className="flex justify-center mt-8">
                      <GlowButton
                        variant="primary"
                        size="lg"
                        onClick={() => {
                          setViewMode('questionnaire');
                          setSelectedDreamId('');
                          setSelectedDream(null);
                          setFormData({
                            dream: '',
                            plan: '',
                            relationship: '',
                            offering: '',
                          });
                          router.push('/reflection');
                        }}
                      >
                        Create New Reflection
                      </GlowButton>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay with smooth transitions */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-mirror-void-deep/95 backdrop-blur-lg"
          >
            <motion.div
              animate={
                !prefersReducedMotion
                  ? { scale: [1, 1.05, 1] }
                  : undefined
              }
              transition={
                !prefersReducedMotion
                  ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  : undefined
              }
            >
              <CosmicLoader size="lg" />
            </motion.div>
            <motion.div
              className="text-center space-y-2"
              animate={
                !prefersReducedMotion
                  ? { opacity: [0.7, 1, 0.7] }
                  : { opacity: 1 }
              }
              transition={
                !prefersReducedMotion
                  ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  : undefined
              }
            >
              <p className="text-white/90 text-xl font-light">
                {statusText}
              </p>
              <p className="text-white/60 text-sm">
                This may take a few moments
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .reflection-experience {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          perspective: 1000px;
          /* Darker background for depth */
          background: radial-gradient(
            ellipse at center,
            rgba(15, 23, 42, 0.95) 0%,
            rgba(2, 6, 23, 1) 100%
          );
        }

        /* Vignette effect for focus */
        .reflection-vignette {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            rgba(0, 0, 0, 0.4) 100%
          );
          z-index: 1;
        }

        .tone-elements {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .fusion-breath {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(251, 191, 36, 0.3) 0%,
            rgba(245, 158, 11, 0.15) 30%,
            rgba(217, 119, 6, 0.08) 60%,
            transparent 80%
          );
          filter: blur(35px);
          animation: fusionBreathe 25s ease-in-out infinite;
        }

        @keyframes fusionBreathe {
          0%, 100% {
            opacity: 0;
            transform: scale(0.4) translate(0, 0);
          }
          25% {
            opacity: 0.6;
            transform: scale(1.1) translate(30px, -40px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.4) translate(-15px, 25px);
          }
          75% {
            opacity: 0.5;
            transform: scale(0.9) translate(40px, 15px);
          }
        }

        .gentle-star {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.7), 0 0 15px rgba(255, 255, 255, 0.4);
          animation: gentleTwinkle 10s ease-in-out infinite;
        }

        @keyframes gentleTwinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0.4);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        .intense-swirl {
          position: absolute;
          width: clamp(180px, 35vw, 240px);
          height: clamp(180px, 35vw, 240px);
          background: radial-gradient(
            circle at 30% 30%,
            rgba(147, 51, 234, 0.35) 0%,
            rgba(168, 85, 247, 0.18) 30%,
            rgba(139, 92, 246, 0.1) 60%,
            transparent 80%
          );
          filter: blur(30px);
          border-radius: 50%;
          animation: intenseSwirl 18s ease-in-out infinite;
        }

        @keyframes intenseSwirl {
          0%, 100% {
            opacity: 0;
            transform: rotate(0deg) scale(0.2);
          }
          25% {
            opacity: 0.7;
            transform: rotate(180deg) scale(1.1);
          }
          50% {
            opacity: 0.9;
            transform: rotate(360deg) scale(1.4);
          }
          75% {
            opacity: 0.6;
            transform: rotate(540deg) scale(0.8);
          }
        }

        .cosmic-particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
          border-radius: 50%;
          animation: float-up linear infinite;
        }

        @keyframes float-up {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(1);
            opacity: 0;
          }
        }

        .questionnaire-container,
        .output-container {
          position: relative;
          z-index: 10;
          width: 100%;
          /* Centered narrow content (800px) */
          max-width: 800px;
          padding: var(--space-xl);
        }

        .reflection-card {
          padding: 3rem;
          border-radius: 30px;
          transition: border-color 0.8s ease, box-shadow 0.8s ease;
        }

        .mirror-surface {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 20px;
          padding: var(--space-2xl);
          min-height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .question-view,
        .one-page-form,
        .reflection-output {
          width: 100%;
          animation: fade-in 0.6s ease-out;
        }

        /* Mobile-optimized scrollable form */
        .one-page-form {
          max-height: calc(100vh - 250px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-right: 8px;
        }

        .one-page-form::-webkit-scrollbar {
          width: 8px;
        }

        .one-page-form::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .one-page-form::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 4px;
        }

        .one-page-form::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .reflection-content {
          text-align: left;
          max-width: 700px;
        }

        .reflection-text {
          font-size: var(--text-lg);
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: var(--space-2xl);
          white-space: pre-wrap;
          text-align: justify;
          hyphens: auto;
        }

        .reflection-text strong {
          font-weight: 600;
          background: linear-gradient(135deg, #fbbf24, #9333ea);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .reflection-text em {
          font-style: italic;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Dream selection styles */
        .dream-selection-list {
          max-width: 600px;
          margin: var(--space-xl) auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-height: 400px;
          overflow-y: auto;
          padding: var(--space-2);
        }

        @media (max-width: 768px) {
          .reflection-card {
            padding: 2rem;
          }

          .mirror-surface {
            padding: var(--space-lg);
          }
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .fusion-breath,
          .gentle-star,
          .intense-swirl,
          .particle {
            animation: none;
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
