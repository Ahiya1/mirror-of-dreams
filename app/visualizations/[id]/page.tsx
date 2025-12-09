'use client';

import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { AppNavigation } from '@/components/shared/AppNavigation';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { GradientText } from '@/components/ui/glass/GradientText';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-white">Visualization not found</div>
      </div>
    );
  }

  const style = styleInfo[visualization.style as keyof typeof styleInfo];

  // Detect if content has markdown syntax
  const hasMarkdown = visualization.narrative
    ? /^#{1,3}\s|^\*\s|^-\s|^>\s|```/.test(visualization.narrative)
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4 pb-8 pt-nav sm:px-8">
      <AppNavigation currentPage="visualizations" />

      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/visualizations')}
          className="mb-6 flex items-center gap-2 text-purple-200 transition-colors hover:text-white"
        >
          ← Back to Visualizations
        </button>

        {/* Visualization Header */}
        <div
          className={`bg-gradient-to-r ${style.gradient} mb-6 rounded-lg border border-white/20 p-6 shadow-lg`}
        >
          <div className="flex items-start gap-4">
            <div className="text-6xl">{style.icon}</div>
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-white">{style.title}</h1>
              <p className="mb-3 text-lg text-white/90">
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
        <div className="relative mb-6 overflow-hidden rounded-lg border border-white/20 bg-white/10 p-10 backdrop-blur-md">
          {/* Background glow effects for atmosphere */}
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-600 blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600 blur-[120px]" />
          </div>

          {/* Content with Markdown support */}
          <div className="relative z-10">
            {hasMarkdown ? (
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

                  // Paragraphs with immersive styling
                  p: ({ node, ...props }) => (
                    <p
                      className="mb-6 text-lg leading-loose tracking-wide text-purple-50 md:text-xl"
                      style={{ lineHeight: '1.8' }}
                      {...props}
                    />
                  ),

                  // Emphasis with cosmic colors
                  strong: ({ node, ...props }) => (
                    <strong
                      className="rounded bg-amber-400/10 px-1 font-semibold text-amber-400"
                      {...props}
                    />
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
                    <li className="text-lg leading-relaxed text-purple-100" {...props} />
                  ),

                  // Blockquotes
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="my-6 rounded-r-lg border-l-4 border-purple-400/60 bg-purple-500/5 py-3 pl-6"
                      {...props}
                    >
                      <div className="italic text-white/90">{props.children}</div>
                    </blockquote>
                  ),

                  // Horizontal rules
                  hr: () => <hr className="my-8 border-t border-purple-400/30" />,
                }}
              >
                {visualization.narrative || ''}
              </ReactMarkdown>
            ) : (
              // Fallback for plain text - split by paragraphs
              <div className="space-y-8">
                {(visualization.narrative?.split('\n\n').filter((p: string) => p.trim()) || []).map(
                  (paragraph: string, index: number) => (
                    <p
                      key={index}
                      className="text-lg leading-loose tracking-wide text-purple-50 md:text-xl"
                      style={{ lineHeight: '1.8' }}
                    >
                      {paragraph}
                    </p>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        {visualization.dreams && (
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <h2 className="mb-3 text-xl font-semibold text-white">Dream Context</h2>
            <div className="space-y-2 text-purple-200">
              <div>
                <span className="font-medium">Dream:</span> {visualization.dreams.title}
              </div>
              <div>
                <span className="font-medium">Category:</span>{' '}
                <span className="capitalize">
                  {visualization.dreams.category?.replace(/_/g, ' ')}
                </span>
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
