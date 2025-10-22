'use client';

import React, { Suspense } from 'react';
import MirrorExperience from './MirrorExperience';

function Loading() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#020617'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTopColor: 'rgba(251, 191, 36, 0.8)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function ReflectionPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MirrorExperience />
    </Suspense>
  );
}
