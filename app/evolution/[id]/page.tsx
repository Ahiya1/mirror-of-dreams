'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

export default function EvolutionReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const reportId = params.id as string;

  const { data: report, isLoading } = trpc.evolution.get.useQuery(
    { id: reportId },
    { enabled: !!user && !!reportId }
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

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white">Report not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/evolution')}
          className="text-purple-200 hover:text-white mb-6 flex items-center gap-2"
        >
          ← Back to Evolution Reports
        </button>

        {/* Report Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {report.report_category === 'dream-specific' ? (
                  <>{report.dreams?.title || 'Dream Evolution Report'}</>
                ) : (
                  'Cross-Dream Evolution Report'
                )}
              </h1>
              {report.dreams && (
                <p className="text-purple-300">
                  Category: {report.dreams.category}
                </p>
              )}
            </div>
            <span className="text-purple-200">
              {new Date(report.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex gap-6 text-sm text-purple-200">
            <div>
              <span className="font-medium">Reflections Analyzed:</span> {report.reflection_count}
            </div>
            <div>
              <span className="font-medium">Type:</span>{' '}
              {report.report_category === 'dream-specific' ? 'Dream-Specific' : 'Cross-Dream'}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8">
          <div className="prose prose-invert prose-purple max-w-none">
            <div className="whitespace-pre-wrap text-purple-50 leading-relaxed">
              {report.evolution || ''}
            </div>
          </div>
        </div>

        {/* Generate Visualization Button */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Create Visualization</h2>
          <p className="text-purple-200 mb-4">
            Transform this evolution report into a beautiful narrative visualization
          </p>
          <button
            onClick={() => router.push(`/visualizations/create?dreamId=${report.dream_id || ''}`)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Visualization
          </button>
        </div>
      </div>
    </div>
  );
}
