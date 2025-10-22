'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

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
        <div className="text-white">Loading...</div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/visualizations')}
          className="text-purple-200 hover:text-white mb-6 flex items-center gap-2"
        >
          ← Back to Visualizations
        </button>

        {/* Visualization Header */}
        <div className={`bg-gradient-to-r ${style.gradient} rounded-lg p-6 mb-6 shadow-lg`}>
          <div className="flex items-start gap-4">
            <div className="text-6xl">{style.icon}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{style.title}</h1>
              <p className="text-white/90 mb-3">
                {visualization.dreams?.title || 'Cross-Dream Analysis'}
              </p>
              <div className="flex gap-6 text-sm text-white/80">
                <div>
                  <span className="font-medium">Reflections:</span> {visualization.reflection_count}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(visualization.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 mb-6">
          <div className="prose prose-lg prose-invert prose-purple max-w-none">
            <div className="whitespace-pre-wrap text-purple-50 leading-relaxed">
              {visualization.narrative}
            </div>
          </div>
        </div>

        {/* Metadata */}
        {visualization.dreams && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Dream Context</h2>
            <div className="space-y-2 text-purple-200">
              <div>
                <span className="font-medium">Dream:</span> {visualization.dreams.title}
              </div>
              <div>
                <span className="font-medium">Category:</span> {visualization.dreams.category}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
