'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import CosmicBackground from '@/components/shared/CosmicBackground';
import type { ToneId } from '@/lib/utils/constants';
import { QUESTION_LIMITS } from '@/lib/utils/constants';

interface FormData {
  dream: string;
  plan: string;
  hasDate: string;
  dreamDate: string;
  relationship: string;
  offering: string;
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

  // Determine view mode from URL
  const reflectionId = searchParams.get('id');
  const initialMode: ViewMode = reflectionId ? 'output' : 'questionnaire';

  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [currentStep, setCurrentStep] = useState(1); // 1-5 questions, 6 = tone, 7 = submitting
  const [selectedTone, setSelectedTone] = useState<ToneId>('fusion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mirrorGlow, setMirrorGlow] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    dream: '',
    plan: '',
    hasDate: '',
    dreamDate: '',
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
      setMirrorGlow(true);
      setTimeout(() => {
        router.push(`/reflection?id=${data.reflectionId}`);
        setViewMode('output');
      }, 1000);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // TODO: Replace with actual dream selection
    // For now, this will need a dream to be created first
    createReflection.mutate({
      dreamId: '00000000-0000-0000-0000-000000000000', // Placeholder - will be replaced with real dream selection
      dream: formData.dream,
      plan: formData.plan,
      hasDate: formData.hasDate as 'yes' | 'no',
      dreamDate: formData.dreamDate || null,
      relationship: formData.relationship,
      offering: formData.offering,
      tone: selectedTone,
    });
  };

  const questions = [
    {
      id: 'dream',
      text: 'What is your deepest dream?',
      placeholder: 'Describe the vision that calls to your soul...',
      limit: QUESTION_LIMITS.dream,
    },
    {
      id: 'plan',
      text: 'What is your plan to bring it to life?',
      placeholder: 'Share the steps you envision taking...',
      limit: QUESTION_LIMITS.plan,
    },
    {
      id: 'hasDate',
      text: 'Do you have a timeline in mind?',
      type: 'choice' as const,
      choices: ['yes', 'no'],
    },
    ...(formData.hasDate === 'yes' ? [{
      id: 'dreamDate',
      text: 'When do you envision this becoming reality?',
      placeholder: 'Enter your target date or timeframe...',
      limit: 500,
    }] : []),
    {
      id: 'relationship',
      text: 'What relationship do you seek with your dream?',
      placeholder: 'Describe how you want to relate to this aspiration...',
      limit: QUESTION_LIMITS.relationship,
    },
    {
      id: 'offering',
      text: 'What are you willing to offer in service of this dream?',
      placeholder: 'What will you give, sacrifice, or commit...',
      limit: QUESTION_LIMITS.sacrifice,
    },
  ];

  const currentQuestion = questions[currentStep - 1];
  const progress = (currentStep / 6) * 100;

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
          {/* Mirror frame that glows */}
          <div className={`mirror-frame ${mirrorGlow ? 'glowing' : ''}`}>
            <div className="mirror-surface">
              {currentStep <= 5 ? (
                /* Question view */
                <div className="question-view">
                  <div className="progress-ring">
                    <svg className="progress-svg" viewBox="0 0 120 120">
                      <circle
                        className="progress-background"
                        cx="60"
                        cy="60"
                        r="54"
                      />
                      <circle
                        className="progress-bar"
                        cx="60"
                        cy="60"
                        r="54"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 54}`,
                          strokeDashoffset: `${2 * Math.PI * 54 * (1 - progress / 100)}`,
                        }}
                      />
                      <text
                        className="progress-text"
                        x="60"
                        y="65"
                        textAnchor="middle"
                      >
                        {currentStep}/5
                      </text>
                    </svg>
                  </div>

                  <h2 className="question-text">{currentQuestion?.text}</h2>

                  {currentQuestion?.type === 'choice' ? (
                    <div className="choice-buttons">
                      {currentQuestion.choices?.map(choice => (
                        <button
                          key={choice}
                          className={`choice-button ${formData.hasDate === choice ? 'selected' : ''}`}
                          onClick={() => {
                            handleFieldChange('hasDate', choice);
                            setTimeout(handleNext, 300);
                          }}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="answer-container">
                      <textarea
                        className="answer-input"
                        value={(formData as any)[currentQuestion?.id || 'dream']}
                        onChange={(e) => handleFieldChange(currentQuestion?.id as keyof FormData, e.target.value)}
                        placeholder={currentQuestion?.placeholder}
                        maxLength={currentQuestion?.limit}
                        rows={6}
                      />
                      <div className="character-counter">
                        {(formData as any)[currentQuestion?.id || 'dream']?.length || 0} / {currentQuestion?.limit}
                      </div>
                    </div>
                  )}

                  <div className="navigation-buttons">
                    {currentStep > 1 && (
                      <button className="nav-button back" onClick={handleBack}>
                        ← Back
                      </button>
                    )}
                    <button
                      className="nav-button next"
                      onClick={handleNext}
                      disabled={!((formData as any)[currentQuestion?.id || 'dream'])}
                    >
                      {currentStep === 5 ? 'Choose Tone →' : 'Continue →'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Tone selection */
                <div className="tone-view">
                  <h2 className="tone-title">Choose Your Reflection Tone</h2>
                  <p className="tone-subtitle">How shall the mirror speak to you?</p>

                  <div className="tone-options">
                    {[
                      { id: 'fusion' as ToneId, name: 'Sacred Fusion', desc: 'Balanced wisdom and warmth', color: '#fbbf24' },
                      { id: 'gentle' as ToneId, name: 'Gentle Clarity', desc: 'Compassionate and nurturing', color: '#ffffff' },
                      { id: 'intense' as ToneId, name: 'Luminous Intensity', desc: 'Direct and transformative', color: '#9333ea' },
                    ].map(tone => (
                      <button
                        key={tone.id}
                        className={`tone-card ${selectedTone === tone.id ? 'selected' : ''}`}
                        onClick={() => setSelectedTone(tone.id)}
                        style={{ '--tone-color': tone.color } as React.CSSProperties}
                      >
                        <div className="tone-icon" style={{ color: tone.color }}>✨</div>
                        <h3 className="tone-name">{tone.name}</h3>
                        <p className="tone-desc">{tone.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="submit-container">
                    <button className="nav-button back" onClick={handleBack}>
                      ← Back
                    </button>
                    <button
                      className="submit-button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating your reflection...' : 'Gaze into the Mirror ✨'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Output view */
        <div className="output-container">
          {reflectionLoading ? (
            <div className="loading-mirror">
              <div className="cosmic-spinner" />
              <p>Revealing your reflection...</p>
            </div>
          ) : reflection ? (
            <div className="reflection-output">
              <div className="mirror-frame">
                <div className="mirror-surface">
                  <div className="reflection-content">
                    <h1 className="reflection-title">Your Reflection</h1>
                    <div
                      className="reflection-text"
                      dangerouslySetInnerHTML={{ __html: reflection.aiResponse }}
                    />
                    <button
                      className="new-reflection-button"
                      onClick={() => {
                        setViewMode('questionnaire');
                        setCurrentStep(1);
                        setFormData({
                          dream: '',
                          plan: '',
                          hasDate: '',
                          dreamDate: '',
                          relationship: '',
                          offering: '',
                        });
                        router.push('/reflection');
                      }}
                    >
                      Create New Reflection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

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

        .mirror-frame {
          position: relative;
          padding: var(--space-2xl);
          background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          backdrop-filter: blur(40px) saturate(150%);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 30px;
          box-shadow:
            0 0 80px rgba(255, 255, 255, 0.1),
            inset 0 0 80px rgba(255, 255, 255, 0.03);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          animation: mirror-entrance 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mirror-frame.glowing {
          border-color: rgba(251, 191, 36, 0.6);
          box-shadow:
            0 0 120px rgba(251, 191, 36, 0.4),
            inset 0 0 80px rgba(251, 191, 36, 0.1);
        }

        @keyframes mirror-entrance {
          from {
            opacity: 0;
            transform: scale(0.9) rotateX(10deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotateX(0deg);
          }
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
        .tone-view,
        .reflection-output {
          width: 100%;
          animation: fade-in 0.6s ease-out;
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

        .progress-ring {
          margin: 0 auto var(--space-xl);
          width: 120px;
          height: 120px;
        }

        .progress-svg {
          transform: rotate(-90deg);
        }

        .progress-background {
          fill: none;
          stroke: rgba(255, 255, 255, 0.1);
          stroke-width: 3;
        }

        .progress-bar {
          fill: none;
          stroke: url(#progress-gradient);
          stroke-width: 3;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-text {
          fill: rgba(255, 255, 255, 0.9);
          font-size: 24px;
          font-weight: 600;
          transform: rotate(90deg);
          transform-origin: center;
        }

        .question-text {
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 300;
          color: rgba(255, 255, 255, 0.95);
          text-align: center;
          margin-bottom: var(--space-xl);
          line-height: 1.4;
        }

        .answer-container {
          width: 100%;
          margin-bottom: var(--space-lg);
        }

        .answer-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: var(--space-lg);
          color: rgba(255, 255, 255, 0.95);
          font-size: var(--text-lg);
          font-family: inherit;
          line-height: 1.6;
          resize: none;
          transition: all 0.3s ease;
        }

        .answer-input:focus {
          outline: none;
          border-color: rgba(251, 191, 36, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.2);
        }

        .answer-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .character-counter {
          text-align: right;
          color: rgba(255, 255, 255, 0.5);
          font-size: var(--text-sm);
          margin-top: var(--space-sm);
        }

        .choice-buttons {
          display: flex;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .choice-button {
          flex: 1;
          padding: var(--space-lg) var(--space-xl);
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          color: rgba(255, 255, 255, 0.9);
          font-size: var(--text-lg);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .choice-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .choice-button.selected {
          background: rgba(251, 191, 36, 0.2);
          border-color: rgba(251, 191, 36, 0.6);
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.3);
        }

        .navigation-buttons,
        .submit-container {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          margin-top: var(--space-xl);
        }

        .nav-button {
          position: relative;
          padding: var(--space-md) var(--space-xl);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.9);
          font-size: var(--text-base);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .nav-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .nav-button:hover::before {
          transform: translateX(100%);
        }

        .nav-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(255, 255, 255, 0.1);
        }

        .nav-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .nav-button.next,
        .submit-button {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(251, 191, 36, 0.2));
          border-color: rgba(251, 191, 36, 0.5);
          color: rgba(251, 191, 36, 1);
        }

        .submit-button {
          position: relative;
          padding: var(--space-lg) var(--space-2xl);
          font-size: var(--text-lg);
          overflow: hidden;
        }

        .nav-button.next:hover,
        .submit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(251, 191, 36, 0.3));
          box-shadow: 0 15px 40px rgba(251, 191, 36, 0.3);
          transform: translateY(-3px) scale(1.02);
        }

        .tone-title {
          font-size: var(--text-2xl);
          font-weight: 300;
          text-align: center;
          margin-bottom: var(--space-md);
        }

        .tone-subtitle {
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: var(--space-2xl);
        }

        .tone-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-2xl);
        }

        .tone-card {
          padding: var(--space-xl);
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
        }

        .tone-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-4px);
        }

        .tone-card.selected {
          border-color: var(--tone-color);
          background: linear-gradient(135deg,
            color-mix(in srgb, var(--tone-color) 15%, transparent),
            color-mix(in srgb, var(--tone-color) 5%, transparent)
          );
          box-shadow: 0 0 40px color-mix(in srgb, var(--tone-color) 30%, transparent);
        }

        .tone-icon {
          font-size: 3rem;
          margin-bottom: var(--space-md);
        }

        .tone-name {
          font-size: var(--text-lg);
          font-weight: 500;
          margin-bottom: var(--space-sm);
        }

        .tone-desc {
          font-size: var(--text-sm);
          color: rgba(255, 255, 255, 0.6);
        }

        .reflection-content {
          text-align: left;
          max-width: 700px;
        }

        .reflection-title {
          font-size: var(--text-3xl);
          font-weight: 600;
          margin-bottom: var(--space-2xl);
          text-align: center;
          background: linear-gradient(135deg, #fbbf24, #9333ea);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.3;
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

        .new-reflection-button {
          padding: var(--space-lg) var(--space-2xl);
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(251, 191, 36, 0.2));
          border: 1px solid rgba(251, 191, 36, 0.5);
          border-radius: 12px;
          color: rgba(251, 191, 36, 1);
          font-size: var(--text-lg);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .new-reflection-button:hover {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(251, 191, 36, 0.3));
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.3);
          transform: translateY(-2px);
        }

        .loading-mirror {
          text-align: center;
          padding: var(--space-2xl);
        }

        .cosmic-spinner {
          width: clamp(140px, 30vw, 180px);
          height: clamp(140px, 30vw, 180px);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(251, 191, 36, 0.15) 0%,
            rgba(251, 191, 36, 0.05) 40%,
            rgba(251, 191, 36, 0.02) 70%,
            transparent 85%
          );
          animation: breatheLoading 4.5s ease-in-out infinite;
          position: relative;
          box-shadow: 0 0 60px rgba(251, 191, 36, 0.2), inset 0 0 30px rgba(251, 191, 36, 0.1);
          margin: 0 auto var(--space-lg);
        }

        .cosmic-spinner::after {
          content: "";
          position: absolute;
          inset: 25px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(251, 191, 36, 0.2) 0%,
            rgba(251, 191, 36, 0.08) 50%,
            transparent 75%
          );
          animation: breatheInner 4.5s ease-in-out infinite;
        }

        @keyframes breatheLoading {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        @keyframes breatheInner {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.3) rotate(180deg);
            opacity: 0.9;
          }
        }

        @media (max-width: 768px) {
          .mirror-frame {
            padding: var(--space-lg);
          }

          .mirror-surface {
            padding: var(--space-lg);
          }

          .tone-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* SVG defs for gradients */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
