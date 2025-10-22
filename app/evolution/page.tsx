'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function EvolutionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedDreamId, setSelectedDreamId] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // Fetch user's dreams for selection
  const { data: dreamsData } = trpc.dreams.list.useQuery(
    { status: 'active' },
    { enabled: !!user }
  );

  // Fetch evolution reports
  const { data: reportsData, refetch: refetchReports } = trpc.evolution.list.useQuery(
    { page: 1, limit: 20 },
    { enabled: !!user }
  );

  // Check eligibility
  const { data: eligibility } = trpc.evolution.checkEligibility.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutations
  const generateDreamEvolution = trpc.evolution.generateDreamEvolution.useMutation({
    onSuccess: () => {
      refetchReports();
      setGenerating(false);
      setSelectedDreamId('');
    },
    onError: (error) => {
      alert(error.message);
      setGenerating(false);
    },
  });

  const generateCrossDreamEvolution = trpc.evolution.generateCrossDreamEvolution.useMutation({
    onSuccess: () => {
      refetchReports();
      setGenerating(false);
    },
    onError: (error) => {
      alert(error.message);
      setGenerating(false);
    },
  });

  const handleGenerateDreamEvolution = async () => {
    if (!selectedDreamId) {
      alert('Please select a dream');
      return;
    }
    setGenerating(true);
    generateDreamEvolution.mutate({ dreamId: selectedDreamId });
  };

  const handleGenerateCrossDreamEvolution = async () => {
    setGenerating(true);
    generateCrossDreamEvolution.mutate();
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
          <h1 className="text-4xl font-bold text-white mb-2">Evolution Reports</h1>
          <p className="text-purple-200">
            AI-powered insights into your growth journey across time
          </p>
        </div>

        {/* Generation Controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Generate New Report</h2>

          {user.tier === 'free' ? (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-200">
                Evolution reports are available for Essential tier and higher.
                <button
                  onClick={() => router.push('/dashboard')}
                  className="ml-2 underline hover:text-yellow-100"
                >
                  Upgrade now
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dream-Specific Report */}
              <div className="border border-white/20 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">Dream-Specific Report</h3>
                <p className="text-purple-200 text-sm mb-4">
                  Analyze your evolution on a single dream (requires 4+ reflections)
                </p>
                <div className="flex gap-3">
                  <select
                    value={selectedDreamId}
                    onChange={(e) => setSelectedDreamId(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    disabled={generating}
                  >
                    <option value="">Select a dream...</option>
                    {dreamsData?.map((dream) => (
                      <option key={dream.id} value={dream.id}>
                        {dream.title} ({dream.reflection_count || 0} reflections)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleGenerateDreamEvolution}
                    disabled={generating || !selectedDreamId}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Cross-Dream Report */}
              <div className="border border-white/20 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">Cross-Dream Report</h3>
                <p className="text-purple-200 text-sm mb-4">
                  Analyze patterns across all your dreams (requires 12+ total reflections)
                </p>
                <button
                  onClick={handleGenerateCrossDreamEvolution}
                  disabled={generating}
                  className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {generating ? 'Generating...' : 'Generate Cross-Dream Report'}
                </button>
              </div>

              {/* Eligibility Info */}
              {eligibility && !eligibility.eligible && (
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-blue-200">{eligibility.reason}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Your Reports</h2>

          {!reportsData || reportsData.reports.length === 0 ? (
            <p className="text-purple-200">No evolution reports yet. Generate your first one above!</p>
          ) : (
            <div className="space-y-4">
              {reportsData.reports.map((report: any) => (
                <div
                  key={report.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => router.push(`/evolution/${report.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {report.report_category === 'dream-specific' ? (
                          <>{report.dreams?.title || 'Dream Report'}</>
                        ) : (
                          'Cross-Dream Analysis'
                        )}
                      </h3>
                      <p className="text-sm text-purple-300">
                        {report.reflection_count} reflections analyzed
                      </p>
                    </div>
                    <span className="text-sm text-purple-300">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-purple-200 text-sm line-clamp-2">
                    {report.evolution?.substring(0, 200)}...
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
