// components/shared/__tests__/MarkdownPreview.test.tsx
// Tests for MarkdownPreview component

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownPreview } from '../MarkdownPreview';

describe('MarkdownPreview', () => {
  describe('basic rendering', () => {
    it('renders plain text', () => {
      render(<MarkdownPreview content="Hello World" />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('renders empty content without error', () => {
      render(<MarkdownPreview content="" />);
      // Should render without crashing
    });

    it('handles undefined content gracefully', () => {
      render(<MarkdownPreview content={undefined as any} />);
      // Should render without crashing
    });
  });

  describe('inline formatting', () => {
    it('renders bold text', () => {
      render(<MarkdownPreview content="This is **bold** text" />);
      const strong = screen.getByText('bold');
      expect(strong.tagName).toBe('STRONG');
      expect(strong).toHaveClass('font-semibold');
    });

    it('renders italic text', () => {
      render(<MarkdownPreview content="This is *italic* text" />);
      const em = screen.getByText('italic');
      expect(em.tagName).toBe('EM');
      expect(em).toHaveClass('italic');
    });

    it('renders inline code', () => {
      render(<MarkdownPreview content="Use `code` here" />);
      const code = screen.getByText('code');
      expect(code.tagName).toBe('CODE');
      expect(code).toHaveClass('rounded');
    });
  });

  describe('content truncation', () => {
    it('truncates content at maxLength', () => {
      const longContent = 'A'.repeat(300);
      render(<MarkdownPreview content={longContent} maxLength={100} />);
      // Should only render first 100 chars
      const text = screen.getByText(/^A+$/);
      expect(text.textContent?.length).toBeLessThanOrEqual(105);
    });

    it('uses default maxLength of 200', () => {
      const longContent = 'B'.repeat(250);
      render(<MarkdownPreview content={longContent} />);
      const text = screen.getByText(/^B+$/);
      expect(text.textContent?.length).toBeLessThanOrEqual(205);
    });

    it('renders full content when shorter than maxLength', () => {
      render(<MarkdownPreview content="Short text" maxLength={100} />);
      expect(screen.getByText('Short text')).toBeInTheDocument();
    });
  });

  describe('block elements stripped', () => {
    it('strips headings', () => {
      render(<MarkdownPreview content="# Heading\nText" />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('strips lists', () => {
      render(<MarkdownPreview content="- Item 1\n- Item 2" />);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('strips blockquotes', () => {
      render(<MarkdownPreview content="> Quote text" />);
      const container = document.querySelector('blockquote');
      expect(container).not.toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(<MarkdownPreview content="Test" className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders as span wrapper', () => {
      const { container } = render(<MarkdownPreview content="Test" />);
      expect(container.firstChild?.nodeName).toBe('SPAN');
    });
  });

  describe('links', () => {
    it('renders links as styled text', () => {
      render(<MarkdownPreview content="Click [here](https://example.com)" />);
      expect(screen.getByText('here')).toBeInTheDocument();
      // Links should be converted to spans (no navigation in preview)
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });
});
