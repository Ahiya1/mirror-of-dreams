'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

type VisualizationStyle = 'achievement' | 'spiral' | 'synthesis';

export default function VisualizationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedDreamId, setSelectedDreamId] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<VisualizationStyle>('achievement');
  const [generating, setGenerating] = useState(false);

  // Fetch user's dreams for selection
  const { data: dreamsData } = trpc.dreams.list.useQuery(
    { status: 'active' },
    { enabled: !!user }
  );

  // Fetch visualizations
  const { data: visualizationsData, refetch: refetchVisualizations } = trpc.visualizations.list.useQuery(
    { page: 1, limit: 20 },
    { enabled: !!user }
  );

  // Mutation
  const generateVisualization = trpc.visualizations.generate.useMutation({
    onSuccess: () => {
      refetchVisualizations();
      setGenerating(false);
      setSelectedDreamId('');
    },
    onError: (error) => {
      alert(error.message);
      setGenerating(false);
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    generateVisualization.mutate({
      dreamId: selectedDreamId || undefined,
      style: selectedStyle,
    });
  };

  const styleDescriptions = {
    achievement: {
      title: 'Achievement Path',
      description: 'Linear journey showing progress like climbing steps or waypoints on a path',
      icon: '🏔️',
    },
    spiral: {
      title: 'Growth Spiral',
      description: 'Circular growth pattern showing deepening understanding in spiraling cycles',
      icon: '🌀',
    },
    synthesis: {
      title: 'Synthesis Map',
      description: 'Network of interconnected insights like a constellation or web',
      icon: '🌌',
    },
  };

  if (authLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Visualizations</h1>
          <p className="text-purple-200">
            Poetic narrative visualizations of your personal growth journey
          </p>
        </div>

        {/* Generation Controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Create New Visualization</h2>

          {user.tier === 'free' && !selectedDreamId ? (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
              <p className="text-yellow-200">
                Cross-dream visualizations require Essential tier or higher. You can still create dream-specific visualizations.
              </p>
            </div>
          ) : null}

          <div className="space-y-6">
            {/* Dream Selection */}
            <div>
              <label className="block text-white font-medium mb-2">
                Select Dream (optional - leave blank for cross-dream)
              </label>
              <select
                value={selectedDreamId}
                onChange={(e) => setSelectedDreamId(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                disabled={generating}
              >
                <option value="">All Dreams (Cross-Dream Analysis)</option>
                {dreamsData?.map((dream) => (
                  <option key={dream.id} value={dream.id}>
                    {dream.title} ({dream.reflection_count || 0} reflections)
                  </option>
                ))}
              </select>
            </div>

            {/* Style Selection */}
            <div>
              <label className="block text-white font-medium mb-3">Choose Visualization Style</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(styleDescriptions) as VisualizationStyle[]).map((style) => {
                  const info = styleDescriptions[style];
                  return (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedStyle === style
                          ? 'border-purple-400 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                      disabled={generating}
                    >
                      <div className="text-3xl mb-2">{info.icon}</div>
                      <h3 className="text-white font-semibold mb-1">{info.title}</h3>
                      <p className="text-purple-200 text-sm">{info.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              {generating ? 'Creating Visualization...' : 'Generate Visualization'}
            </button>
          </div>
        </div>

        {/* Visualizations List */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Your Visualizations</h2>

          {!visualizationsData || visualizationsData.items.length === 0 ? (
            <p className="text-purple-200">No visualizations yet. Create your first one above!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visualizationsData.items.map((viz: any) => (
                <div
                  key={viz.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => router.push(`/visualizations/${viz.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">
                          {styleDescriptions[viz.style as VisualizationStyle]?.icon}
                        </span>
                        <h3 className="text-lg font-medium text-white">
                          {styleDescriptions[viz.style as VisualizationStyle]?.title}
                        </h3>
                      </div>
                      <p className="text-sm text-purple-300">
                        {viz.dreams?.title || 'Cross-Dream'} • {viz.reflection_count} reflections
                      </p>
                    </div>
                    <span className="text-sm text-purple-300">
                      {new Date(viz.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-purple-200 text-sm line-clamp-3">
                    {viz.narrative?.substring(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
