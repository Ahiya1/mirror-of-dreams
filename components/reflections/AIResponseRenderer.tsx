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
  // First decode any HTML entities that might be double-encoded
  let text = html;
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');

  // Remove the outer mirror-reflection div wrapper
  text = text.replace(/<div[^>]*class="mirror-reflection"[^>]*>/gi, '');
  text = text.replace(/<\/div>/gi, '');

  // Replace <br> with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  // Replace </p><p> with double newlines
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  // Replace opening <p> tags with nothing (content follows)
  text = text.replace(/<p[^>]*>/gi, '');
  // Replace closing </p> with newline
  text = text.replace(/<\/p>/gi, '\n');
  // Replace <span style="font-weight:600...">text</span> with **text**
  text = text.replace(/<span[^>]*font-weight:\s*600[^>]*>([^<]*)<\/span>/gi, '**$1**');
  // Replace <span style="font-style:italic...">text</span> with *text*
  text = text.replace(/<span[^>]*font-style:\s*italic[^>]*>([^<]*)<\/span>/gi, '*$1*');
  // Strip remaining HTML tags (use a more robust pattern that handles attributes with quotes)
  text = text.replace(/<[^>]*>/g, '');
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
  // Also check for HTML entities that might indicate encoded HTML
  const isHtml =
    /<div[^>]*class="mirror-reflection"|<p\s+style="|<span\s+style="|&lt;div|&lt;p\s+style/i.test(
      content
    );

  // If it's HTML, convert to markdown-like format for consistent rendering
  let processedContent = content;
  if (isHtml) {
    processedContent = stripHtmlToText(content);
  }

  // Detect if content has markdown syntax (anywhere in content)
  const hasMarkdown =
    /#{1,3}\s|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|^\s*[-*]\s|^\s*>\s|```|\[[^\]]+\]\([^)]+\)/m.test(
      processedContent
    );

  // Fallback for plain text (no markdown detected)
  if (!hasMarkdown) {
    return (
      <div className="mx-auto max-w-[720px] space-y-4">
        {processedContent.split('\n\n').map((para, i) => (
          <p
            key={i}
            className={
              i === 0 ? 'text-xl leading-[1.8] text-white' : 'text-lg leading-[1.8] text-white/95'
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
    <div className="mx-auto max-w-[720px]">
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
            <GradientText gradient="cosmic" className="mb-4 mt-6 block text-3xl font-semibold">
              {props.children}
            </GradientText>
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mb-3 mt-4 text-2xl font-medium text-purple-300" {...props} />
          ),

          // Body text with optimal readability (18px, line-height 1.8)
          // First paragraph is larger (1.25rem) to draw reader in
          p: ({ node, ...props }) => (
            <p
              className="mb-4 text-lg leading-[1.8] text-white/95 first:text-xl first:text-white"
              {...props}
            />
          ),

          // Blockquotes with cosmic accent
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-6 rounded-r-lg border-l-4 border-purple-400/60 bg-purple-500/5 py-3 pl-6"
              {...props}
            >
              <div className="italic text-white/90">{props.children}</div>
            </blockquote>
          ),

          // Lists with proper spacing
          ul: ({ node, ...props }) => (
            <ul className="mb-4 ml-4 list-inside list-disc space-y-2 text-white/90" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-4 ml-4 list-inside list-decimal space-y-2 text-white/90" {...props} />
          ),
          li: ({ node, ...props }) => <li className="leading-relaxed text-white/90" {...props} />,

          // Strong (bold) with gold background highlight for key insights
          strong: ({ node, ...props }) => (
            <strong
              className="rounded bg-amber-400/10 px-1 font-semibold text-amber-400"
              {...props}
            />
          ),

          // Emphasis (italic)
          em: ({ node, ...props }) => <em className="italic text-purple-200" {...props} />,

          // Code blocks (inline and block)
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code
                className="rounded bg-purple-900/30 px-2 py-1 font-mono text-sm text-purple-200"
                {...props}
              />
            ) : (
              <code
                className="my-4 block overflow-x-auto rounded-lg border border-purple-500/20 bg-purple-900/30 p-4 font-mono text-sm text-purple-200"
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
