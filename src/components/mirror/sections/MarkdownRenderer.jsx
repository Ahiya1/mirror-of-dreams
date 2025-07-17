// components/mirror/sections/MarkdownRenderer.jsx - Clean Yellow-Gold Text

import React, { useMemo } from "react";

const MarkdownRenderer = ({ content = "", options = {}, className = "" }) => {
  const {
    allowHtml = false,
    sanitizeHtml = true,
    enhanceAccessibility = true,
  } = options;

  const generateId = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const sanitizeHtmlContent = (html) => {
    if (!allowHtml) return html;

    const dangerousElements = /<script[^>]*>[\s\S]*?<\/script>/gi;
    const dangerousAttributes = /on\w+="[^"]*"/gi;

    return html.replace(dangerousElements, "").replace(dangerousAttributes, "");
  };

  const renderedContent = useMemo(() => {
    if (!content || typeof content !== "string") {
      return "<p>Your reflection appears here...</p>";
    }

    const rules = [
      // Headers
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

      // Blockquotes
      {
        pattern: /^> (.*)$/gm,
        replacement: '<blockquote role="note"><p>$1</p></blockquote>',
      },

      // Code blocks
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
        replacement: "<code>$1</code>",
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

      // Links
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
  }, [
    content,
    allowHtml,
    sanitizeHtml,
    generateId,
    escapeHtml,
    sanitizeHtmlContent,
  ]);

  const handleLinkClick = (event) => {
    const link = event.target.closest("a");
    if (link && link.target === "_blank") {
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.style.position = "absolute";
      announcement.style.left = "-10000px";
      announcement.textContent = "Link opens in new tab";
      document.body.appendChild(announcement);

      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    }
  };

  return (
    <div
      className={`clean-reflection ${className}`}
      onClick={handleLinkClick}
      role="article"
      aria-label="Reflection content"
    >
      <div dangerouslySetInnerHTML={{ __html: renderedContent }} />

      <style jsx>{`
        .clean-reflection {
          font-family: "Georgia", "Times New Roman", serif;
          font-size: 1.2rem;
          line-height: 2;
          color: #daa520;
          font-weight: 300;
          letter-spacing: 0.5px;
          width: 100%;
          padding: 3rem 2rem;
        }

        .clean-reflection :global(h1),
        .clean-reflection :global(h2),
        .clean-reflection :global(h3) {
          font-weight: 400;
          margin: 3rem 0 2rem 0;
          line-height: 1.4;
          color: #daa520;
          font-family: "Georgia", serif;
        }

        .clean-reflection :global(h1) {
          font-size: 1.8rem;
          margin-top: 0;
          text-align: center;
          margin-bottom: 3rem;
          border-bottom: 1px solid rgba(218, 165, 32, 0.3);
          padding-bottom: 1.5rem;
        }

        .clean-reflection :global(h2) {
          font-size: 1.5rem;
          margin-top: 3rem;
          border-left: 3px solid rgba(218, 165, 32, 0.5);
          padding-left: 1.5rem;
        }

        .clean-reflection :global(h3) {
          font-size: 1.3rem;
          margin-top: 2.5rem;
        }

        .clean-reflection :global(p) {
          margin: 0 0 2rem 0;
          text-align: left;
          color: #daa520;
        }

        .clean-reflection :global(strong) {
          font-weight: 600;
          color: #daa520;
        }

        .clean-reflection :global(em) {
          font-style: italic;
          color: #daa520;
        }

        .clean-reflection :global(code) {
          background: rgba(218, 165, 32, 0.1);
          color: #daa520;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          font-family: "Monaco", "Menlo", monospace;
          font-size: 0.9em;
        }

        .clean-reflection :global(pre) {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 8px;
          padding: 1.5rem;
          margin: 2rem 0;
          overflow-x: auto;
          font-family: "Monaco", "Menlo", monospace;
          font-size: 0.9rem;
        }

        .clean-reflection :global(pre code) {
          background: none;
          color: #daa520;
          padding: 0;
        }

        .clean-reflection :global(blockquote) {
          border-left: 4px solid rgba(218, 165, 32, 0.4);
          margin: 2rem 0;
          padding: 1.5rem 2rem;
          background: rgba(218, 165, 32, 0.03);
          border-radius: 0 8px 8px 0;
          font-style: italic;
          position: relative;
        }

        .clean-reflection :global(blockquote::before) {
          content: '"';
          position: absolute;
          top: -10px;
          left: 15px;
          font-size: 3rem;
          color: rgba(218, 165, 32, 0.3);
          line-height: 1;
          font-family: "Georgia", serif;
        }

        .clean-reflection :global(blockquote p) {
          margin: 0;
          color: #daa520;
        }

        .clean-reflection :global(ul),
        .clean-reflection :global(ol) {
          margin: 2rem 0;
          padding-left: 2rem;
        }

        .clean-reflection :global(li) {
          margin: 1rem 0;
          line-height: 1.8;
          color: #daa520;
        }

        .clean-reflection :global(a) {
          color: #daa520;
          text-decoration: underline;
          text-decoration-color: rgba(218, 165, 32, 0.4);
          transition: all 0.3s ease;
        }

        .clean-reflection :global(a:hover) {
          text-decoration-color: rgba(218, 165, 32, 0.8);
        }

        .clean-reflection :global(a:focus) {
          outline: 2px solid rgba(218, 165, 32, 0.5);
          outline-offset: 2px;
          border-radius: 3px;
        }

        .clean-reflection :global(hr) {
          border: none;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(218, 165, 32, 0.4),
            transparent
          );
          margin: 3rem 0;
        }

        .clean-reflection :global(mark) {
          background: rgba(218, 165, 32, 0.2);
          color: #daa520;
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
        }

        .clean-reflection :global(del) {
          opacity: 0.6;
          color: #daa520;
        }

        /* Scrollbar styling */
        .clean-reflection::-webkit-scrollbar {
          width: 8px;
        }

        .clean-reflection::-webkit-scrollbar-track {
          background: transparent;
        }

        .clean-reflection::-webkit-scrollbar-thumb {
          background: rgba(218, 165, 32, 0.3);
          border-radius: 4px;
        }

        .clean-reflection::-webkit-scrollbar-thumb:hover {
          background: rgba(218, 165, 32, 0.5);
        }

        @media (max-width: 768px) {
          .clean-reflection {
            font-size: 1.1rem;
            line-height: 1.8;
            padding: 2rem 1.5rem;
          }

          .clean-reflection :global(h1) {
            font-size: 1.5rem;
          }

          .clean-reflection :global(h2) {
            font-size: 1.3rem;
            padding-left: 1rem;
          }

          .clean-reflection :global(h3) {
            font-size: 1.2rem;
          }

          .clean-reflection :global(ul),
          .clean-reflection :global(ol) {
            padding-left: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .clean-reflection {
            font-size: 1rem;
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MarkdownRenderer;
