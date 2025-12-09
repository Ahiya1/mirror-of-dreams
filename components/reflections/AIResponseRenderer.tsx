'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GradientText } from '@/components/ui/glass/GradientText';

interface AIResponseRendererProps {
  content: string;
}

/**
 * Strips HTML tags and converts to clean text for re-rendering
 */
function stripHtmlToText(html: string): string {
  // Replace <br> with newlines
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  // Replace </p><p> with double newlines
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  // Replace <span style="font-weight:600...">text</span> with **text**
  text = text.replace(/<span[^>]*font-weight:\s*600[^>]*>([^<]*)<\/span>/gi, '**$1**');
  // Replace <span style="font-style:italic...">text</span> with *text*
  text = text.replace(/<span[^>]*font-style:\s*italic[^>]*>([^<]*)<\/span>/gi, '*$1*');
  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

/**
 * AIResponseRenderer - Safely render AI responses with markdown support
 * Handles both markdown and legacy HTML content
 *
 * Security: XSS-safe, sanitizes all HTML
 */
export function AIResponseRenderer({ content }: AIResponseRendererProps) {
  // Detect if content is HTML (legacy format from toSacredHTML)
  const isHtml = /<div class="mirror-reflection"|<p style="|<span style=/i.test(content);

  // If it's HTML, convert to markdown-like format for consistent rendering
  let processedContent = content;
  if (isHtml) {
    processedContent = stripHtmlToText(content);
  }

  // Detect if content has markdown syntax (anywhere in content)
  const hasMarkdown = /#{1,3}\s|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|^\s*[-*]\s|^\s*>\s|```|\[[^\]]+\]\([^)]+\)/m.test(processedContent);

  // Fallback for plain text (no markdown detected)
  if (!hasMarkdown) {
    return (
      <div className="max-w-[720px] mx-auto space-y-4">
        {processedContent.split('\n\n').map((para, i) => (
          <p
            key={i}
            className={i === 0
              ? "text-xl leading-[1.8] text-white"
              : "text-lg leading-[1.8] text-white/95"
            }
          >
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
          // First paragraph is larger (1.25rem) to draw reader in
          p: ({ node, ...props }) => (
            <p className="text-lg leading-[1.8] text-white/95 mb-4 first:text-xl first:text-white" {...props} />
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

          // Strong (bold) with gold background highlight for key insights
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-amber-400 bg-amber-400/10 px-1 rounded" {...props} />
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
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
