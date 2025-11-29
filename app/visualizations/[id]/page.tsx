'use client';

import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  // Detect if content has markdown syntax
  const hasMarkdown = visualization.narrative ? /^#{1,3}\s|^\*\s|^-\s|^>\s|```/.test(visualization.narrative) : false;

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

                  // Paragraphs with immersive styling
                  p: ({ node, ...props }) => (
                    <p className="text-lg md:text-xl text-purple-50 leading-loose tracking-wide mb-6" style={{ lineHeight: '1.8' }} {...props} />
                  ),

                  // Emphasis with cosmic colors
                  strong: ({ node, ...props }) => (
                    <strong className="text-amber-400 font-semibold bg-amber-400/10 px-1 rounded" {...props} />
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
                    <li className="text-purple-100 leading-relaxed text-lg" {...props} />
                  ),

                  // Blockquotes
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-purple-400/60 pl-6 py-3 my-6 bg-purple-500/5 rounded-r-lg"
                      {...props}
                    >
                      <div className="text-white/90 italic">{props.children}</div>
                    </blockquote>
                  ),

                  // Horizontal rules
                  hr: () => (
                    <hr className="border-t border-purple-400/30 my-8" />
                  ),
                }}
              >
                {visualization.narrative || ''}
              </ReactMarkdown>
            ) : (
              // Fallback for plain text - split by paragraphs
              <div className="space-y-8">
                {(visualization.narrative?.split('\n\n').filter((p: string) => p.trim()) || []).map((paragraph: string, index: number) => (
                  <p
                    key={index}
                    className="text-lg md:text-xl text-purple-50 leading-loose tracking-wide"
                    style={{ lineHeight: '1.8' }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
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
