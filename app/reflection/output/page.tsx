'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import '@/styles/mirror.css';

// Separate component that uses searchParams
function ReflectionOutputContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const reflectionId = searchParams.get('id');
  const [reflectionVisible, setReflectionVisible] = useState(false);

  const { data: reflection, isLoading, error } = trpc.reflections.getById.useQuery(
    { id: reflectionId || '' },
    { enabled: !!reflectionId }
  );

  useEffect(() => {
    if (reflection && !reflectionVisible) {
      const timer = setTimeout(() => {
        setReflectionVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reflection, reflectionVisible]);

  const handleCopy = async () => {
    if (!reflection?.aiResponse) {
      toast.warning('No reflection to copy.');
      return;
    }

    try {
      // Remove HTML tags for clean text copy
      const cleanText = reflection.aiResponse.replace(/<[^>]*>/g, '');
      await navigator.clipboard.writeText(cleanText);
      toast.success('Reflection copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy reflection');
    }
  };

  const startNewReflection = () => {
    router.push('/reflection?fresh=true');
  };

  if (isLoading) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div className="loading-state">
          <div className="mirror-frame">
            <div className="mirror-surface loading">
              <div className="loading-spinner" />
              <div className="loading-text">Surfacing your reflection...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reflection) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div className="error-state">
          <div className="mirror-frame">
            <div className="mirror-surface error">
              <div className="error-content">
                <span className="error-icon">⚠</span>
                <span className="error-message">
                  {error?.message || 'Failed to load reflection'}
                </span>
                <button className="simple-button" onClick={startNewReflection}>
                  Try New Reflection
                </button>
              </div>
            </div>
          </div>
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

      <div className="content-wrapper">
        {/* Square Mirror */}
        <div className="mirror-frame">
          <div className="mirror-surface">
            {/* Mirror reflections */}
            <div className="mirror-glow-top" />
            <div className="mirror-glow-center" />

            {/* Reflection content */}
            <div
              className={`reflection-text ${
                reflectionVisible ? 'visible' : ''
              }`}
            >
              <AIResponseRenderer content={reflection.aiResponse || ''} />
            </div>

            {/* Subtle shimmer */}
            <div className="mirror-shimmer" />
          </div>
        </div>

        {/* Reflection Metadata */}
        <div className="reflection-metadata">
          <span>{new Date(reflection.createdAt).toLocaleDateString()}</span>
          <span>{reflection.tone}</span>
          <span>{reflection.wordCount || 0} words</span>
        </div>

        {/* Action Buttons */}
        <div className="action-grid">
          <button
            className="action-button"
            onClick={handleCopy}
            title="Copy reflection"
          >
            <span className="button-icon">📋</span>
            <span>Copy Text</span>
          </button>

          <button
            className="action-button"
            onClick={startNewReflection}
            title="New reflection"
          >
            <span>New Reflection</span>
          </button>

          <button
            className="action-button"
            onClick={() => router.push('/reflections/history')}
            title="View history"
          >
            <span className="button-icon">📖</span>
            <span>Your Journey</span>
          </button>

          <button
            className="action-button"
            onClick={() => router.push('/dashboard')}
            title="Back to dashboard"
          >
            <span className="button-icon">🏠</span>
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function ReflectionOutputLoading() {
  return (
    <div className="mirror-container">
      <CosmicBackground />
      <div className="loading-state">
        <div className="mirror-frame">
          <div className="mirror-surface loading">
            <div className="loading-spinner" />
            <div className="loading-text">Preparing your reflection...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ReflectionOutputPage() {
  return (
    <Suspense fallback={<ReflectionOutputLoading />}>
      <ReflectionOutputContent />
    </Suspense>
  );
}
