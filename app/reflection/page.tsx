'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import CosmicBackground from '@/components/shared/CosmicBackground';
import QuestionStep from '@/components/reflection/QuestionStep';
import ToneSelection from '@/components/reflection/ToneSelection';
import ProgressIndicator from '@/components/reflection/ProgressIndicator';
import { QUESTION_LIMITS, RESPONSE_MESSAGES } from '@/lib/utils/constants';
import type { ToneId } from '@/lib/utils/constants';
import '@/styles/mirror.css';

interface FormData {
  dream: string;
  plan: string;
  hasDate: string;
  dreamDate: string;
  relationship: string;
  offering: string;
  tone: ToneId;
}

export default function ReflectionPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1); // 1-5 for questions, 6 for tone
  const [formData, setFormData] = useState<FormData>({
    dream: '',
    plan: '',
    hasDate: '',
    dreamDate: '',
    relationship: '',
    offering: '',
    tone: 'fusion',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createReflection = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      router.push(`/reflection/output?id=${data.reflectionId}`);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleChoiceSelect = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));

    // Clear date if "no" is selected
    if (field === 'hasDate' && value === 'no') {
      setFormData((prev) => ({ ...prev, dreamDate: '' }));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 && !formData.dream.trim()) {
      newErrors.dream = 'Please share your dream';
    }
    if (step === 2 && !formData.plan.trim()) {
      newErrors.plan = 'Please share your plan';
    }
    if (step === 3 && !formData.hasDate) {
      newErrors.hasDate = 'Please select yes or no';
    }
    if (step === 4 && !formData.relationship.trim()) {
      newErrors.relationship = 'Please share your relationship with this dream';
    }
    if (step === 5 && !formData.offering.trim()) {
      newErrors.offering = 'Please share what you are willing to give';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    await createReflection.mutateAsync({
      dream: formData.dream,
      plan: formData.plan,
      hasDate: formData.hasDate as 'yes' | 'no',
      dreamDate: formData.dreamDate || null,
      relationship: formData.relationship,
      offering: formData.offering,
      tone: formData.tone,
      isPremium: user?.tier === 'premium' || user?.isCreator || false,
    });
  };

  if (isAuthLoading) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2xl)',
          }}
        >
          <div className="loading-circle" />
          <div className="loading-text">Preparing your reflection space...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div
          style={{
            textAlign: 'center',
            color: 'var(--cosmic-text)',
            padding: 'var(--space-2xl)',
          }}
        >
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              marginBottom: 'var(--space-lg)',
            }}
          >
            Authentication Required
          </h1>
          <p style={{ marginBottom: 'var(--space-xl)', opacity: 0.8 }}>
            {RESPONSE_MESSAGES.AUTH_REQUIRED}
          </p>
          <button
            className="cosmic-button cosmic-button--primary"
            onClick={() => router.push('/auth/signin')}
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  if (createReflection.isPending) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2xl)',
            padding: 'var(--space-2xl)',
            textAlign: 'center',
          }}
        >
          <div className="loading-circle" />
          <div className="loading-text">Creating your reflection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mirror-container">
      <CosmicBackground />

      {/* Back Navigation */}
      <a href="/dashboard" className="back-link">
        <span>←</span>
        <span>Return to Dashboard</span>
      </a>

      <div className="mirror-content">
        {/* Admin/Creator Notice */}
        {(user?.isCreator || user?.isAdmin) && (
          <div className="admin-notice">
            <span>
              ✨{' '}
              {user.isCreator
                ? 'Creator mode — unlimited premium reflections'
                : 'Admin mode'}
            </span>
          </div>
        )}

        {/* Progress Indicator */}
        {step <= 5 && <ProgressIndicator current={step} total={5} />}

        {/* Question 1: Dream */}
        {step === 1 && (
          <QuestionStep
            questionNumber={1}
            question="What is your dream?"
            subtitle="Choose just one — the one that calls you most right now."
            value={formData.dream}
            onChange={(v) => handleChange('dream', v)}
            maxLength={QUESTION_LIMITS.dream}
            error={errors.dream}
          />
        )}

        {/* Question 2: Plan */}
        {step === 2 && (
          <QuestionStep
            questionNumber={2}
            question="What is your plan for achieving this dream?"
            subtitle="Write what you already know. It's okay if it's unclear."
            value={formData.plan}
            onChange={(v) => handleChange('plan', v)}
            maxLength={QUESTION_LIMITS.plan}
            error={errors.plan}
          />
        )}

        {/* Question 3: Date */}
        {step === 3 && (
          <QuestionStep
            questionNumber={3}
            question="Have you set a definite date for fulfilling your dream?"
            type="choice"
            value=""
            onChange={() => {}}
            maxLength={0}
            choices={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            selectedChoice={formData.hasDate}
            onChoiceSelect={(v) => handleChoiceSelect('hasDate', v)}
            showDateInput={formData.hasDate === 'yes'}
            dateValue={formData.dreamDate}
            onDateChange={(v) => handleChange('dreamDate', v)}
            error={errors.hasDate}
          />
        )}

        {/* Question 4: Relationship */}
        {step === 4 && (
          <QuestionStep
            questionNumber={4}
            question="What is your current relationship with this dream?"
            subtitle="Do you believe you'll achieve it? Why or why not?"
            value={formData.relationship}
            onChange={(v) => handleChange('relationship', v)}
            maxLength={QUESTION_LIMITS.relationship}
            error={errors.relationship}
          />
        )}

        {/* Question 5: Offering */}
        {step === 5 && (
          <QuestionStep
            questionNumber={5}
            question="What are you willing to give in return?"
            subtitle="Energy, focus, love, time — what will you offer to this dream?"
            value={formData.offering}
            onChange={(v) => handleChange('offering', v)}
            maxLength={QUESTION_LIMITS.sacrifice}
            error={errors.offering}
          />
        )}

        {/* Step 6: Tone Selection */}
        {step === 6 && (
          <ToneSelection
            selectedTone={formData.tone}
            onSelect={(tone) => handleChange('tone', tone)}
            disabled={createReflection.isPending}
          />
        )}

        {/* Navigation Buttons */}
        <div className="reflection-navigation">
          {step > 1 && (
            <button
              type="button"
              className="cosmic-button"
              onClick={handleBack}
              disabled={createReflection.isPending}
            >
              Back
            </button>
          )}

          {step < 6 && (
            <button
              type="button"
              className="cosmic-button cosmic-button--primary"
              onClick={handleNext}
            >
              Continue
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              className="cosmic-button cosmic-button--primary"
              onClick={handleSubmit}
              disabled={createReflection.isPending}
              style={{
                width: '100%',
                padding: 'var(--space-lg) var(--space-xl)',
                fontSize: 'var(--text-lg)',
                fontWeight: 500,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                minHeight: '64px',
              }}
            >
              {createReflection.isPending
                ? 'Creating your reflection...'
                : 'Receive Your Reflection'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
