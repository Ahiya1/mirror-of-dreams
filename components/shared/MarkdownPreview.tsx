'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  maxLength?: number;
  className?: string;
}

/**
 * MarkdownPreview - Render markdown in line-clamped contexts
 *
 * Converts block elements to inline spans so CSS line-clamp works.
 * Supports: bold, italic, inline code, links
 * Strips: headings, lists, blockquotes, code blocks, images
 */
export function MarkdownPreview({
  content,
  maxLength = 200,
  className = '',
}: MarkdownPreviewProps) {
  // Truncate content before parsing to limit processing
  const truncated = content?.substring(0, maxLength) || '';

  return (
    <span className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Convert all block elements to inline spans
          p: ({ children }) => <span>{children} </span>,

          // Preserve inline formatting with cosmic styling
          strong: ({ children }) => (
            <strong className="font-semibold text-purple-300">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-purple-200">{children}</em>,

          // Inline code - subtle highlight
          code: ({ children }) => (
            <code className="rounded bg-purple-900/30 px-1 text-xs">{children}</code>
          ),

          // Links - render as styled text (no navigation in preview)
          a: ({ children }) => <span className="text-purple-300">{children}</span>,

          // Strip block elements entirely
          h1: () => null,
          h2: () => null,
          h3: () => null,
          h4: () => null,
          h5: () => null,
          h6: () => null,
          ul: () => null,
          ol: () => null,
          li: () => null,
          blockquote: () => null,
          pre: () => null,
          hr: () => null,
          img: () => null,
          table: () => null,
          thead: () => null,
          tbody: () => null,
          tr: () => null,
          th: () => null,
          td: () => null,
        }}
      >
        {truncated}
      </ReactMarkdown>
    </span>
  );
}
