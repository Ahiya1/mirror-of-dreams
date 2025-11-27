'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { GradientText } from '@/components/ui/glass/GradientText';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { AppNavigation } from '@/components/shared/AppNavigation';

const styleInfo = {
  achievement: {
    title: 'Achievement Path',
    icon: '🏔️',
    gradient: 'from-orange-600 to-red-600',
  },
  spiral: {
    title: 'Growth Spiral',
    icon: '🌀',
    gradient: 'from-blue-600 to-purple-600',
  },
  synthesis: {
    title: 'Synthesis Map',
    icon: '🌌',
    gradient: 'from-indigo-600 to-pink-600',
  },
};

export default function VisualizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const vizId = params.id as string;

  const { data: visualization, isLoading } = trpc.visualizations.get.useQuery(
    { id: vizId },
    { enabled: !!user && !!vizId }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <CosmicLoader size="lg" label="Loading visualization..." />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  if (!visualization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white">Visualization not found</div>
      </div>
    );
  }

  const style = styleInfo[visualization.style as keyof typeof styleInfo];

  // Highlight "I am..." and "I'm..." phrases with gradient
  const highlightAchievementPhrases = (text: string) => {
    // Split by achievement phrases while preserving them
    const regex = /\b(I am|I'm|I've|I have achieved|I stand|I've become|I embody|I possess)\b/gi;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        regex.lastIndex = 0; // Reset regex
        return (
          <GradientText key={index} gradient="cosmic" className="font-semibold">
            {part}
          </GradientText>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Split into paragraphs for better formatting
  const paragraphs = visualization.narrative?.split('\n\n').filter((p: string) => p.trim()) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-nav px-4 sm:px-8 pb-8">
      <AppNavigation currentPage="visualizations" />

      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/visualizations')}
          className="text-purple-200 hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          ← Back to Visualizations
        </button>

        {/* Visualization Header */}
        <div className={`bg-gradient-to-r ${style.gradient} rounded-lg p-6 mb-6 shadow-lg border border-white/20`}>
          <div className="flex items-start gap-4">
            <div className="text-6xl">{style.icon}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{style.title}</h1>
              <p className="text-white/90 mb-3 text-lg">
                {visualization.dreams?.title || 'Cross-Dream Analysis'}
              </p>
              <div className="flex gap-6 text-sm text-white/80">
                <div>
                  <span className="font-medium">Reflections:</span> {visualization.reflection_count}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(visualization.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Content - Immersive Formatting */}
        <div className="relative bg-white/10 backdrop-blur-md rounded-lg p-10 mb-6 border border-white/20 overflow-hidden">
          {/* Background glow effects for atmosphere */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]" />
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-8">
            {paragraphs.map((paragraph: string, index: number) => (
              <p
                key={index}
                className="text-lg md:text-xl text-purple-50 leading-loose tracking-wide"
                style={{ lineHeight: '1.8' }}
              >
                {highlightAchievementPhrases(paragraph)}
              </p>
            ))}
          </div>
        </div>

        {/* Metadata */}
        {visualization.dreams && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-3">Dream Context</h2>
            <div className="space-y-2 text-purple-200">
              <div>
                <span className="font-medium">Dream:</span> {visualization.dreams.title}
              </div>
              <div>
                <span className="font-medium">Category:</span>{' '}
                <span className="capitalize">{visualization.dreams.category?.replace(/_/g, ' ')}</span>
              </div>
              {visualization.dreams.target_date && (
                <div>
                  <span className="font-medium">Target Date:</span>{' '}
                  {new Date(visualization.dreams.target_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
