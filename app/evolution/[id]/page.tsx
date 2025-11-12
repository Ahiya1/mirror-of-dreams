'use client';

import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { GradientText } from '@/components/ui/glass/GradientText';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

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
        <CosmicLoader size="lg" label="Loading evolution report..." />
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
          className="text-purple-200 hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          ← Back to Evolution Reports
        </button>

        {/* Report Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6 border border-white/20">
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
                <p className="text-purple-300 capitalize">
                  Category: {report.dreams.category?.replace(/_/g, ' ')}
                </p>
              )}
            </div>
            <span className="text-purple-200 text-sm">
              {new Date(report.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
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

        {/* Report Content with Markdown Rendering */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings with gradient text
              h1: ({ node, ...props }) => (
                <GradientText
                  gradient="cosmic"
                  className="block text-4xl font-bold mb-6 mt-8 first:mt-0"
                >
                  {props.children}
                </GradientText>
              ),
              h2: ({ node, ...props }) => (
                <GradientText
                  gradient="cosmic"
                  className="block text-3xl font-bold mb-4 mt-6"
                >
                  {props.children}
                </GradientText>
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-2xl font-semibold text-purple-300 mb-3 mt-4"
                  {...props}
                />
              ),

              // Emphasis with cosmic colors
              strong: ({ node, ...props }) => (
                <strong className="text-purple-400 font-semibold" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="text-indigo-300 italic" {...props} />
              ),

              // Lists with proper spacing
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-2 ml-4 my-4 text-purple-100" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside space-y-2 ml-4 my-4 text-purple-100" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-purple-100 leading-relaxed" {...props} />
              ),

              // Paragraphs with generous spacing
              p: ({ node, ...props }) => (
                <p className="text-purple-50 leading-relaxed mb-4 text-base" {...props} />
              ),

              // Blockquotes (if AI uses them)
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-purple-400 pl-4 my-4 italic text-indigo-200"
                  {...props}
                />
              ),

              // Code blocks (if any)
              code: ({ node, inline, ...props }: any) =>
                inline ? (
                  <code
                    className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-sm"
                    {...props}
                  />
                ) : (
                  <code
                    className="block bg-purple-900/30 text-purple-200 p-4 rounded my-4 text-sm overflow-x-auto"
                    {...props}
                  />
                ),
            }}
          >
            {report.evolution || ''}
          </ReactMarkdown>
        </div>

        {/* Generate Visualization Button */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-3">Create Visualization</h2>
          <p className="text-purple-200 mb-4">
            Transform this evolution report into a beautiful narrative visualization
          </p>
          <button
            onClick={() => {
              if (report.dream_id) {
                router.push(`/dreams/${report.dream_id}`);
              } else {
                router.push('/visualizations');
              }
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {report.dream_id ? 'Go to Dream & Create Visualization' : 'Create Visualization'}
          </button>
        </div>
      </div>
    </div>
  );
}
