'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Global Error Boundary
 *
 * Catches errors in the root layout itself. This is the last resort error handler.
 * Must include its own <html> and <body> tags since the root layout may have failed.
 *
 * Uses inline styles since CSS might not have loaded.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture critical error in Sentry with context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
        digest: error.digest,
      },
      extra: {
        componentStack: error.stack,
      },
      level: 'fatal', // Global errors are critical
    });

    // Also log to console for development
    console.error('[Global Error Boundary] Critical error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          // Cosmic background color
          background: 'linear-gradient(180deg, #020617 0%, #0f0a1e 50%, #020617 100%)',
          color: 'white',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            padding: '32px',
            borderRadius: '16px',
            // Glass effect with error accent
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(239, 68, 68, 0.05))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Error icon */}
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.9,
            }}
            aria-hidden="true"
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(239, 68, 68, 0.9)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto', display: 'block' }}
            >
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 500,
              color: 'rgba(239, 68, 68, 0.9)',
              margin: '0 0 12px 0',
            }}
          >
            Critical Error
          </h1>

          {/* Message */}
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 20px 0',
            }}
          >
            The application encountered a critical error and could not recover.
          </p>

          {/* Error digest */}
          {error.digest && (
            <p
              style={{
                fontSize: '0.75rem',
                fontFamily: "'SF Mono', Monaco, monospace",
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0 0 24px 0',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                display: 'inline-block',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          {/* Reload button */}
          <button
            onClick={reset}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 500,
              color: 'white',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
