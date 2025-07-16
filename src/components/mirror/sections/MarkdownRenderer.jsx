// components/mirror/sections/MarkdownRenderer.jsx - Enhanced markdown parser and renderer

import React, { useMemo } from "react";

/**
 * Enhanced markdown renderer with safety features and accessibility
 * @param {Object} props - Component props
 * @param {string} props.content - Markdown content to render
 * @param {Object} props.options - Rendering options
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered markdown component
 */
const MarkdownRenderer = ({ content = "", options = {}, className = "" }) => {
  const {
    allowHtml = false,
    sanitizeHtml = true,
    enhanceAccessibility = true,
    addTableOfContents = false,
  } = options;

  /**
   * Parse and render markdown content
   */
  const renderedContent = useMemo(() => {
    if (!content || typeof content !== "string") {
      return "<p>No content available</p>";
    }

    // Enhanced markdown parsing rules
    const rules = [
      // Headers with accessibility improvements
      {
        pattern: /^### (.*$)/gm,
        replacement: (match, title) =>
          `<h3 id="${generateId(title)}" tabindex="0">${title}</h3>`,
      },
      {
        pattern: /^## (.*$)/gm,
        replacement: (match, title) =>
          `<h2 id="${generateId(title)}" tabindex="0">${title}</h2>`,
      },
      {
        pattern: /^# (.*$)/gm,
        replacement: (match, title) =>
          `<h1 id="${generateId(title)}" tabindex="0">${title}</h1>`,
      },

      // Horizontal rules
      { pattern: /^---$/gm, replacement: '<hr role="separator">' },
      { pattern: /^\*\*\*$/gm, replacement: '<hr role="separator">' },

      // Blockquotes with accessibility
      {
        pattern: /^> (.*)$/gm,
        replacement: '<blockquote role="note"><p>$1</p></blockquote>',
      },

      // Code blocks with syntax highlighting hint
      {
        pattern: /```([\w]*)\n([\s\S]*?)```/g,
        replacement: (match, lang, code) =>
          `<pre role="code"><code${
            lang ? ` class="language-${lang}"` : ""
          }>${escapeHtml(code)}</code></pre>`,
      },

      // Inline code
      {
        pattern: /`([^`]+)`/g,
        replacement: '<code class="inline-code">$1</code>',
      },

      // Bold and italic combinations
      {
        pattern: /\*\*\*(.*?)\*\*\*/g,
        replacement: "<strong><em>$1</em></strong>",
      },
      {
        pattern: /\_\_\_(.*?)\_\_\_/g,
        replacement: "<strong><em>$1</em></strong>",
      },

      // Bold
      { pattern: /\*\*(.*?)\*\*/g, replacement: "<strong>$1</strong>" },
      { pattern: /\_\_(.*?)\_\_/g, replacement: "<strong>$1</strong>" },

      // Italic
      { pattern: /\*(.*?)\*/g, replacement: "<em>$1</em>" },
      { pattern: /\_(.*?)\_/g, replacement: "<em>$1</em>" },

      // Strikethrough
      { pattern: /~~(.*?)~~/g, replacement: "<del>$1</del>" },

      // Highlight
      { pattern: /==(.*?)==/g, replacement: "<mark>$1</mark>" },

      // Links with security attributes
      {
        pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
        replacement: (match, text, url) => {
          const isExternal = !url.startsWith("/") && !url.startsWith("#");
          const securityAttrs = isExternal
            ? ' rel="noopener noreferrer" target="_blank"'
            : "";
          return `<a href="${escapeHtml(url)}"${securityAttrs}>${text}</a>`;
        },
      },

      // Unordered lists
      { pattern: /^\* (.*)$/gm, replacement: "<li>$1</li>" },
      { pattern: /^- (.*)$/gm, replacement: "<li>$1</li>" },
      { pattern: /^\+ (.*)$/gm, replacement: "<li>$1</li>" },

      // Ordered lists
      { pattern: /^\d+\. (.*)$/gm, replacement: "<li>$1</li>" },

      // Line breaks and paragraphs
      { pattern: /\n\n/g, replacement: "</p><p>" },
      { pattern: /\n/g, replacement: "<br>" },
    ];

    let html = content.trim();

    // Apply parsing rules
    rules.forEach((rule) => {
      if (typeof rule.replacement === "function") {
        html = html.replace(rule.pattern, rule.replacement);
      } else {
        html = html.replace(rule.pattern, rule.replacement);
      }
    });

    // Process lists into proper HTML structure
    html = html.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, (match) => {
      const isOrderedList = match.includes("1.") || match.includes("2.");
      const listTag = isOrderedList ? "ol" : "ul";
      return `<${listTag} role="list">${match}</${listTag}>`;
    });

    // Wrap in paragraphs if needed
    if (
      !html.includes("<p>") &&
      !html.includes("<h1>") &&
      !html.includes("<h2>") &&
      !html.includes("<h3>")
    ) {
      html = `<p>${html}</p>`;
    } else if (!html.startsWith("<")) {
      html = `<p>${html}`;
    }

    if (!html.endsWith("</p>") && !html.endsWith(">")) {
      html += "</p>";
    }

    // Sanitize HTML if enabled
    if (sanitizeHtml) {
      html = sanitizeHtmlContent(html);
    }

    return html;
  }, [content, allowHtml, sanitizeHtml]);

  /**
   * Generate heading ID for accessibility
   */
  const generateId = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  /**
   * Escape HTML special characters
   */
  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  /**
   * Basic HTML sanitization
   */
  const sanitizeHtmlContent = (html) => {
    if (!allowHtml) {
      return html;
    }

    // Remove potentially dangerous elements and attributes
    const dangerousElements = /<script[^>]*>[\s\S]*?<\/script>/gi;
    const dangerousAttributes = /on\w+="[^"]*"/gi;

    return html.replace(dangerousElements, "").replace(dangerousAttributes, "");
  };

  /**
   * Handle link clicks for accessibility announcements
   */
  const handleLinkClick = (event) => {
    const link = event.target.closest("a");
    if (link && link.target === "_blank") {
      // Announce to screen readers that link opens in new tab
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.style.position = "absolute";
      announcement.style.left = "-10000px";
      announcement.textContent = "Link opens in new tab";
      document.body.appendChild(announcement);

      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  return (
    <div
      className={`mirror-response markdown-content ${className}`}
      onClick={handleLinkClick}
      role="article"
      aria-label="Reflection content"
    >
      <div dangerouslySetInnerHTML={{ __html: renderedContent }} />

      {/* Component Styles */}
      <style jsx>{`
        .markdown-content {
          background: rgba(255, 255, 255, 0.97);
          color: #1a1a2e;
          padding: var(--space-2xl) var(--space-xl);
          border-radius: var(--card-radius);
          box-shadow: var(--shadow-xl);
          position: relative;
          font-size: var(--text-base);
          line-height: var(--leading-loose);
          font-weight: var(--font-light);
          max-width: var(--prose-max-width);
          animation: contentReveal 0.6s ease-out;
        }

        .markdown-content :global(h1),
        .markdown-content :global(h2),
        .markdown-content :global(h3) {
          font-weight: var(--font-semibold);
          margin: 2rem 0 1rem 0;
          line-height: var(--leading-tight);
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          scroll-margin-top: var(--space-xl);
        }

        .markdown-content :global(h1) {
          font-size: var(--text-2xl);
          margin-top: 0;
          text-align: center;
          margin-bottom: 2rem;
        }

        .markdown-content :global(h2) {
          font-size: var(--text-xl);
          margin-top: 2.5rem;
          padding-left: 1rem;
          border-left: 3px solid rgba(102, 126, 234, 0.3);
        }

        .markdown-content :global(h3) {
          font-size: var(--text-lg);
          margin-top: 2rem;
        }

        .markdown-content :global(p) {
          margin: 0 0 1.5rem 0;
          text-align: justify;
          hyphens: auto;
        }

        .markdown-content :global(strong) {
          font-weight: var(--font-semibold);
          color: #16213e;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .markdown-content :global(em) {
          font-style: italic;
          color: #4a5568;
        }

        .markdown-content :global(code.inline-code) {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          padding: 0.125rem 0.25rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-family-mono);
          font-size: 0.9em;
        }

        .markdown-content :global(pre) {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          margin: var(--space-4) 0;
          overflow-x: auto;
          font-family: var(--font-family-mono);
          font-size: var(--text-sm);
        }

        .markdown-content :global(pre code) {
          background: none;
          color: inherit;
          padding: 0;
          border-radius: 0;
        }

        .markdown-content :global(blockquote) {
          border-left: 4px solid rgba(102, 126, 234, 0.3);
          margin: var(--space-4) 0;
          padding: var(--space-4) var(--space-6);
          background: rgba(102, 126, 234, 0.05);
          border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
          font-style: italic;
        }

        .markdown-content :global(blockquote p) {
          margin: 0;
        }

        .markdown-content :global(ul),
        .markdown-content :global(ol) {
          margin: var(--space-4) 0;
          padding-left: var(--space-6);
        }

        .markdown-content :global(li) {
          margin: var(--space-2) 0;
          line-height: var(--leading-relaxed);
        }

        .markdown-content :global(a) {
          color: #667eea;
          text-decoration: underline;
          text-decoration-color: rgba(102, 126, 234, 0.3);
          transition: var(--transition-fast);
        }

        .markdown-content :global(a:hover) {
          color: #764ba2;
          text-decoration-color: rgba(118, 75, 162, 0.5);
        }

        .markdown-content :global(a:focus) {
          outline: var(--focus-ring);
          outline-offset: var(--focus-ring-offset);
          border-radius: var(--radius-sm);
        }

        .markdown-content :global(hr) {
          border: none;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(102, 126, 234, 0.3),
            transparent
          );
          margin: var(--space-8) 0;
        }

        .markdown-content :global(mark) {
          background: rgba(251, 191, 36, 0.2);
          color: #1a1a2e;
          padding: 0.125rem 0.25rem;
          border-radius: var(--radius-sm);
        }

        .markdown-content :global(del) {
          opacity: var(--opacity-60);
          text-decoration-color: rgba(239, 68, 68, 0.5);
        }

        @keyframes contentReveal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .markdown-content {
            padding: var(--space-lg) var(--space-md);
            font-size: var(--text-sm);
          }

          .markdown-content :global(h1) {
            font-size: var(--text-xl);
          }

          .markdown-content :global(h2) {
            font-size: var(--text-lg);
            padding-left: var(--space-3);
          }

          .markdown-content :global(h3) {
            font-size: var(--text-base);
          }

          .markdown-content :global(ul),
          .markdown-content :global(ol) {
            padding-left: var(--space-4);
          }

          .markdown-content :global(blockquote) {
            padding: var(--space-3) var(--space-4);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .markdown-content {
            animation: none;
          }
        }

        @media print {
          .markdown-content {
            background: white;
            color: black;
            box-shadow: none;
          }

          .markdown-content :global(h1),
          .markdown-content :global(h2),
          .markdown-content :global(h3) {
            background: none;
            -webkit-text-fill-color: black;
            color: black;
          }

          .markdown-content :global(a) {
            color: black;
            text-decoration: underline;
          }
        }
      `}</style>
    </div>
  );
};

export default MarkdownRenderer;
