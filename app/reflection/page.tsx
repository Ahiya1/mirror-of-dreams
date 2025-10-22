'use client';

import React, { Suspense } from 'react';
import MirrorExperience from './MirrorExperience';
import { CosmicLoader } from '@/components/ui/glass';

function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-4">
        <CosmicLoader size="lg" />
        <p className="text-white/60 text-sm">Loading reflection experience...</p>
      </div>
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
