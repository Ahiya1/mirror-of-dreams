'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GradientText } from '@/components/ui/glass/GradientText';

interface AIResponseRendererProps {
  content: string;
}

/**
 * AIResponseRenderer - Safely render AI responses with markdown support
 * Replaces dangerouslySetInnerHTML with secure react-markdown
 *
 * Security: XSS-safe, sanitizes all HTML
 * Pattern: Copied from Evolution page (proven, working code)
 */
export function AIResponseRenderer({ content }: AIResponseRendererProps) {
  // Detect if content has markdown syntax
  const hasMarkdown = /^#{1,3}\s|^\*\s|^-\s|^>\s|```/.test(content);

  // Fallback for plain text (no markdown detected)
  if (!hasMarkdown) {
    return (
      <div className="max-w-[720px] mx-auto space-y-4">
        {content.split('\n\n').map((para, i) => (
          <p key={i} className="text-lg leading-relaxed text-white/95">
            {para}
          </p>
        ))}
      </div>
    );
  }

  // Render markdown with custom components
  return (
    <div className="max-w-[720px] mx-auto">
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
              className="block text-3xl font-semibold mb-4 mt-6"
            >
              {props.children}
            </GradientText>
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-medium text-purple-300 mb-3 mt-4" {...props} />
          ),

          // Body text with optimal readability (18px, line-height 1.8)
          p: ({ node, ...props }) => (
            <p className="text-lg leading-relaxed text-white/95 mb-4" {...props} />
          ),

          // Blockquotes with cosmic accent
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-purple-400/60 pl-6 py-3 my-6 bg-purple-500/5 rounded-r-lg"
              {...props}
            >
              <div className="text-white/90 italic">{props.children}</div>
            </blockquote>
          ),

          // Lists with proper spacing
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-white/90 ml-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-white/90 ml-4" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-white/90 leading-relaxed" {...props} />
          ),

          // Strong (bold) with gradient emphasis
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-purple-300" {...props} />
          ),

          // Emphasis (italic)
          em: ({ node, ...props }) => (
            <em className="text-purple-200 italic" {...props} />
          ),

          // Code blocks (inline and block)
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code
                className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-sm font-mono"
                {...props}
              />
            ) : (
              <code
                className="block bg-purple-900/30 text-purple-200 p-4 rounded-lg my-4 text-sm font-mono overflow-x-auto border border-purple-500/20"
                {...props}
              />
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
