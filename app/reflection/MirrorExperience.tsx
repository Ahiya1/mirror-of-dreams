'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlassCard, GlowButton, CosmicLoader, GlassInput } from '@/components/ui/glass';
import { cn } from '@/lib/utils';
import type { ToneId } from '@/lib/utils/constants';
import { QUESTION_LIMITS } from '@/lib/utils/constants';

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

/**
 * Mesmerizing single-page Mirror Experience
 * Combines questionnaire and output in one immersive flow
 */
export default function MirrorExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

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
      setStatusText('Crafting your reflection...');
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
      placeholder: 'Describe your dream in detail...',
      limit: QUESTION_LIMITS.dream,
    },
    {
      id: 'plan' as keyof FormData,
      number: 2,
      text: selectedDream ? `What is your plan for ${selectedDream.title}?` : 'What is your plan to bring it to life?',
      placeholder: 'Share the steps you envision taking...',
      limit: QUESTION_LIMITS.plan,
    },
    {
      id: 'relationship' as keyof FormData,
      number: 3,
      text: selectedDream ? `What's your relationship with ${selectedDream.title}?` : 'What relationship do you seek with your dream?',
      placeholder: 'Describe your relationship with this dream...',
      limit: QUESTION_LIMITS.relationship,
    },
    {
      id: 'offering' as keyof FormData,
      number: 4,
      text: selectedDream ? `What are you willing to give for ${selectedDream.title}?` : 'What are you willing to offer in service of this dream?',
      placeholder: 'What will you give, sacrifice, or commit...',
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
    <div className="mirror-experience">
      <CosmicBackground />

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

      {viewMode === 'questionnaire' ? (
        <div className="questionnaire-container">
          {/* Mirror frame with GlassCard */}
          <GlassCard
            elevated
            className={cn(
              'p-12 rounded-[30px] transition-all duration-800',
              mirrorGlow && 'border-mirror-gold/60 shadow-[0_0_120px_rgba(251,191,36,0.4)]'
            )}
          >
            <div className="mirror-surface">
              {!selectedDreamId ? (
                /* Dream selection view */
                <div className="question-view">
                  {/* Progress Orbs - Show as inactive for step 0 */}
                  <div className="flex justify-center mb-6">
                    {/* Removed decorative emoji */}
                  </div>

                  <h2 className="text-center mb-8 text-2xl md:text-3xl font-light bg-gradient-to-r from-mirror-purple via-mirror-violet to-mirror-blue bg-clip-text text-transparent">
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
                                isSelected && 'border-mirror-purple/60'
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-4xl flex-shrink-0">{emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="mb-1 text-lg font-medium bg-gradient-to-r from-mirror-purple to-mirror-blue bg-clip-text text-transparent">
                                    {dream.title}
                                  </h3>
                                  {dream.daysLeft !== null && dream.daysLeft !== undefined && (
                                    <p className="text-sm text-mirror-purple/90">
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
                                    className="text-mirror-purple flex-shrink-0"
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
                  {/* Dream Context Display */}
                  {selectedDream && (
                    <div className="mb-8 text-center">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <h2 className="text-2xl md:text-3xl font-light bg-gradient-to-r from-mirror-purple via-mirror-violet to-mirror-blue bg-clip-text text-transparent">
                          {selectedDream.title}
                        </h2>
                      </div>
                      {selectedDream.daysLeft !== null && selectedDream.daysLeft !== undefined && (
                        <p className="text-sm text-mirror-purple/90">
                          {selectedDream.daysLeft < 0
                            ? `${Math.abs(selectedDream.daysLeft)} days overdue`
                            : selectedDream.daysLeft === 0
                            ? 'Target date: Today!'
                            : `${selectedDream.daysLeft} days left`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* All 4 Questions */}
                  <div className="space-y-8 mb-8">
                    {questions.map((question) => (
                      <div key={question.id} className="question-block">
                        <h3 className="text-lg mb-3 font-light bg-gradient-to-r from-mirror-purple to-mirror-blue bg-clip-text text-transparent">
                          {question.number}. {question.text}
                        </h3>
                        <GlassInput
                          variant="textarea"
                          value={formData[question.id]}
                          onChange={(value) => handleFieldChange(question.id, value)}
                          placeholder={question.placeholder}
                          maxLength={question.limit}
                          showCounter={true}
                          rows={6}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Tone Selection */}
                  <div className="tone-selection-section mb-8">
                    <h2 className="text-center mb-4 text-2xl md:text-3xl font-light bg-gradient-to-r from-mirror-purple via-mirror-violet to-mirror-blue bg-clip-text text-transparent">
                      Choose Your Reflection Tone
                    </h2>
                    <p className="text-center text-white/70 mb-6">How shall the mirror speak to you?</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'fusion' as ToneId, name: 'Fusion', desc: 'Balanced and thoughtful', glowColor: 'cosmic' as const },
                      { id: 'gentle' as ToneId, name: 'Gentle', desc: 'Compassionate and nurturing', glowColor: 'blue' as const },
                      { id: 'intense' as ToneId, name: 'Intense', desc: 'Direct and challenging', glowColor: 'purple' as const },
                    ].map(tone => {
                      const isSelected = selectedTone === tone.id

                      return (
                        <div
                          key={tone.id}
                          onClick={() => setSelectedTone(tone.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedTone(tone.id);
                            }
                          }}
                        >
                          <GlassCard
                            elevated={isSelected}
                            interactive
                            className={cn(
                              'cursor-pointer transition-all text-center',
                              isSelected && 'border-2'
                            )}
                          >
                            <div className="space-y-3 py-4">
                              <h3 className={cn(
                                'text-lg font-medium',
                                isSelected && 'bg-gradient-to-r from-mirror-purple to-mirror-blue bg-clip-text text-transparent'
                              )}>
                                {tone.name}
                              </h3>
                              <p className="text-sm text-white/60">{tone.desc}</p>
                            </div>
                          </GlassCard>
                        </div>
                      )
                    })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center mt-8">
                    <GlowButton
                      variant="primary"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="min-w-[250px]"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <CosmicLoader size="sm" />
                          Creating...
                        </span>
                      ) : (
                        <>
                          Submit Reflection
                        </>
                      )}
                    </GlowButton>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      ) : (
        /* Output view */
        <div className="output-container">
          {reflectionLoading ? (
            <div className="flex flex-col items-center justify-center gap-6 py-20">
              <CosmicLoader size="lg" />
              <p className="text-white/70 text-lg">Loading reflection...</p>
            </div>
          ) : reflection ? (
            <GlassCard
              elevated
              className="p-12 rounded-[30px]"
            >
              <div className="mirror-surface">
                <div className="reflection-content">
                  <h1 className="text-center mb-8 text-4xl md:text-5xl font-semibold bg-gradient-to-r from-[#fbbf24] to-[#9333ea] bg-clip-text text-transparent">
                    Your Reflection
                  </h1>
                  <div
                    className="reflection-text"
                    dangerouslySetInnerHTML={{ __html: reflection.aiResponse }}
                  />
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
        </div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-mirror-void-deep/95 backdrop-blur-lg"
          >
            <CosmicLoader size="lg" />
            <motion.div
              className="text-center space-y-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
        .mirror-experience {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          perspective: 1000px;
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
          max-width: 800px;
          padding: var(--space-xl);
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

        .question-block {
          scroll-margin-top: 20px;
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
          .mirror-surface {
            padding: var(--space-lg);
          }
        }
      `}</style>
    </div>
  );
}
