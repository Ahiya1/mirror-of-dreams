'use client';

import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { AppNavigation } from '@/components/shared/AppNavigation';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GradientText } from '@/components/ui/glass/GradientText';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-white">Report not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4 pb-8 pt-nav sm:px-8">
      <AppNavigation currentPage="evolution" />

      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/evolution')}
          className="mb-4 flex items-center gap-2 text-purple-200 transition-colors hover:text-white"
        >
          ← Back to Evolution Reports
        </button>

        {/* Report Header */}
        <div className="mb-4 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-md sm:mb-6 sm:p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                {report.report_category === 'dream-specific' ? (
                  <>{report.dreams?.title || 'Dream Evolution Report'}</>
                ) : (
                  'Cross-Dream Evolution Report'
                )}
              </h1>
              {report.dreams && (
                <p className="capitalize text-purple-300">
                  Category: {report.dreams.category?.replace(/_/g, ' ')}
                </p>
              )}
            </div>
            <span className="text-sm text-purple-200">
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
        <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-md sm:p-6 lg:p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings with gradient text
              h1: ({ node, ...props }) => (
                <GradientText
                  gradient="cosmic"
                  className="mb-6 mt-8 block text-4xl font-bold first:mt-0"
                >
                  {props.children}
                </GradientText>
              ),
              h2: ({ node, ...props }) => (
                <GradientText gradient="cosmic" className="mb-4 mt-6 block text-3xl font-bold">
                  {props.children}
                </GradientText>
              ),
              h3: ({ node, ...props }) => (
                <h3 className="mb-3 mt-4 text-2xl font-semibold text-purple-300" {...props} />
              ),

              // Emphasis with cosmic colors
              strong: ({ node, ...props }) => (
                <strong className="font-semibold text-purple-400" {...props} />
              ),
              em: ({ node, ...props }) => <em className="italic text-indigo-300" {...props} />,

              // Lists with proper spacing
              ul: ({ node, ...props }) => (
                <ul
                  className="my-4 ml-4 list-inside list-disc space-y-2 text-purple-100"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="my-4 ml-4 list-inside list-decimal space-y-2 text-purple-100"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <li className="leading-relaxed text-purple-100" {...props} />
              ),

              // Paragraphs with generous spacing
              p: ({ node, ...props }) => (
                <p className="mb-4 text-base leading-relaxed text-purple-50" {...props} />
              ),

              // Blockquotes (if AI uses them)
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="my-4 border-l-4 border-purple-400 pl-4 italic text-indigo-200"
                  {...props}
                />
              ),

              // Code blocks (if any)
              code: ({ node, inline, ...props }: any) =>
                inline ? (
                  <code
                    className="rounded bg-purple-900/30 px-2 py-1 text-sm text-purple-200"
                    {...props}
                  />
                ) : (
                  <code
                    className="my-4 block overflow-x-auto rounded bg-purple-900/30 p-4 text-sm text-purple-200"
                    {...props}
                  />
                ),
            }}
          >
            {report.analysis || ''}
          </ReactMarkdown>
        </div>

        {/* Generate Visualization Button */}
        <div className="mt-6 rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <h2 className="mb-3 text-xl font-semibold text-white">Create Visualization</h2>
          <p className="mb-4 text-purple-200">
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
            className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white transition-colors hover:from-purple-700 hover:to-pink-700"
          >
            {report.dream_id ? 'Go to Dream & Create Visualization' : 'Create Visualization'}
          </button>
        </div>
      </div>
    </div>
  );
}
