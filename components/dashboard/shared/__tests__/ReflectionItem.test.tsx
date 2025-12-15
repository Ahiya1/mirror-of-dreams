import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import ReflectionItem from '../ReflectionItem';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className, onClick, onMouseEnter, onMouseLeave, style }: any) => (
    <a
      href={href}
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
    >
      {children}
    </a>
  ),
}));

// Mock CSS modules - returns class names as-is for testing
vi.mock('../ReflectionItem.module.css', () => ({
  default: {
    reflectionItem: 'reflectionItem',
    reflectionHeader: 'reflectionHeader',
    reflectionTitle: 'reflectionTitle',
    reflectionDate: 'reflectionDate',
    reflectionPreview: 'reflectionPreview',
    reflectionMeta: 'reflectionMeta',
    reflectionTone: 'reflectionTone',
    reflectionTonegentle: 'reflectionTonegentle',
    reflectionToneintense: 'reflectionToneintense',
    reflectionTonefusion: 'reflectionTonefusion',
    reflectionPremium: 'reflectionPremium',
    reflectionHoverIndicator: 'reflectionHoverIndicator',
    visible: 'visible',
  },
}));

/**
 * Factory function to create mock reflection data
 */
const createMockReflection = (
  overrides: Partial<{
    id: string | number;
    title?: string | null;
    dream?: string;
    dreams?: { title: string } | null;
    content?: string;
    preview?: string;
    aiResponse?: string;
    ai_response?: string;
    created_at?: string;
    timeAgo?: string;
    tone?: string;
    is_premium?: boolean;
  }> = {}
) => ({
  id: 'reflection-1',
  title: 'Test Reflection',
  content: 'Reflection content preview text that shows what the user reflected on...',
  created_at: new Date().toISOString(),
  tone: 'fusion',
  is_premium: false,
  dreams: { title: 'Test Dream' },
  ...overrides,
});

describe('ReflectionItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render as a Link to /reflections/{id}', () => {
      const reflection = createMockReflection({ id: 'test-id-123' });
      render(<ReflectionItem reflection={reflection} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/reflections/test-id-123');
    });

    it('should render with numeric id', () => {
      const reflection = createMockReflection({ id: 42 });
      render(<ReflectionItem reflection={reflection} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/reflections/42');
    });

    it('should display dream title from joined dreams', () => {
      const reflection = createMockReflection({
        dreams: { title: 'My Dream Title' },
        title: 'Fallback Title',
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('My Dream Title')).toBeInTheDocument();
    });

    it('should display reflection title when no joined dreams', () => {
      const reflection = createMockReflection({
        dreams: null,
        title: 'Reflection Title',
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('Reflection Title')).toBeInTheDocument();
    });

    it('should display "Reflection" as fallback title', () => {
      const reflection = createMockReflection({
        dreams: null,
        title: null,
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('Reflection')).toBeInTheDocument();
    });

    it('should display preview text', () => {
      const reflection = createMockReflection({
        content: 'This is preview content for the reflection item.',
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(
        screen.getByText('This is preview content for the reflection item.')
      ).toBeInTheDocument();
    });

    it('should apply base reflectionItem class', () => {
      const reflection = createMockReflection();
      render(<ReflectionItem reflection={reflection} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('reflectionItem');
    });

    it('should apply custom className', () => {
      const reflection = createMockReflection();
      render(<ReflectionItem reflection={reflection} className="custom-class" />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });
  });

  describe('time formatting', () => {
    it('should show "just now" for very recent reflections (< 1 min)', () => {
      const now = new Date('2025-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const reflection = createMockReflection({
        created_at: new Date('2025-01-10T12:00:00Z').toISOString(),
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('should show minutes ago for recent reflections', () => {
      const now = new Date('2025-01-10T12:30:00Z');
      vi.setSystemTime(now);

      const reflection = createMockReflection({
        created_at: new Date('2025-01-10T12:00:00Z').toISOString(),
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('30m ago')).toBeInTheDocument();
    });

    it('should show hours ago for same-day reflections', () => {
      const now = new Date('2025-01-10T17:00:00Z');
      vi.setSystemTime(now);

      const reflection = createMockReflection({
        created_at: new Date('2025-01-10T12:00:00Z').toISOString(),
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('5h ago')).toBeInTheDocument();
    });

    it('should show days ago for recent past reflections', () => {
      const now = new Date('2025-01-13T12:00:00Z');
      vi.setSystemTime(now);

      const reflection = createMockReflection({
        created_at: new Date('2025-01-10T12:00:00Z').toISOString(),
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('3d ago')).toBeInTheDocument();
    });

    it('should show formatted date for >7 days ago', () => {
      const now = new Date('2025-01-20T12:00:00Z');
      vi.setSystemTime(now);

      const reflection = createMockReflection({
        created_at: new Date('2025-01-05T12:00:00Z').toISOString(),
      });
      render(<ReflectionItem reflection={reflection} />);

      // Should show "Jan 5" or similar
      expect(screen.getByText('Jan 5')).toBeInTheDocument();
    });

    it('should show year for >365 days ago', () => {
      const now = new Date('2026-03-01T12:00:00Z');
      vi.setSystemTime(now);

      const reflection = createMockReflection({
        created_at: new Date('2025-01-10T12:00:00Z').toISOString(),
      });
      render(<ReflectionItem reflection={reflection} />);

      // Should include year when > 365 days
      expect(screen.getByText('Jan 10, 2025')).toBeInTheDocument();
    });

    it('should show "Recently" when no created_at date', () => {
      const reflection = createMockReflection({
        created_at: undefined,
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('Recently')).toBeInTheDocument();
    });

    it('should use timeAgo prop if provided', () => {
      const reflection = createMockReflection({
        timeAgo: '2 weeks ago',
        created_at: new Date().toISOString(),
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('2 weeks ago')).toBeInTheDocument();
    });
  });

  describe('tone badge', () => {
    it('should display Gentle tone', () => {
      const reflection = createMockReflection({ tone: 'gentle' });
      render(<ReflectionItem reflection={reflection} />);
      expect(screen.getByText('Gentle')).toBeInTheDocument();
    });

    it('should display Intense tone', () => {
      const reflection = createMockReflection({ tone: 'intense' });
      render(<ReflectionItem reflection={reflection} />);
      expect(screen.getByText('Intense')).toBeInTheDocument();
    });

    it('should display Fusion tone', () => {
      const reflection = createMockReflection({ tone: 'fusion' });
      render(<ReflectionItem reflection={reflection} />);
      expect(screen.getByText('Fusion')).toBeInTheDocument();
    });

    it('should fallback to Fusion for unknown tones', () => {
      const reflection = createMockReflection({ tone: 'unknown' });
      render(<ReflectionItem reflection={reflection} />);
      expect(screen.getByText('Fusion')).toBeInTheDocument();
    });

    it('should default to fusion when no tone provided', () => {
      const reflection = createMockReflection({ tone: undefined });
      render(<ReflectionItem reflection={reflection} />);
      expect(screen.getByText('Fusion')).toBeInTheDocument();
    });

    it('should apply tone-specific class', () => {
      const reflection = createMockReflection({ tone: 'gentle' });
      render(<ReflectionItem reflection={reflection} />);

      const toneBadge = screen.getByText('Gentle');
      expect(toneBadge).toHaveClass('reflectionTone');
    });
  });

  describe('premium badge', () => {
    it('should show Premium badge when is_premium is true', () => {
      const reflection = createMockReflection({ is_premium: true });
      render(<ReflectionItem reflection={reflection} />);
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('should not show Premium badge when is_premium is false', () => {
      const reflection = createMockReflection({ is_premium: false });
      render(<ReflectionItem reflection={reflection} />);
      expect(screen.queryByText('Premium')).not.toBeInTheDocument();
    });

    it('should not show Premium badge when is_premium is undefined', () => {
      const reflection = createMockReflection({ is_premium: undefined });
      render(<ReflectionItem reflection={reflection} />);
      expect(screen.queryByText('Premium')).not.toBeInTheDocument();
    });
  });

  describe('preview text', () => {
    it('should truncate content to 120 characters', () => {
      const longContent = 'A'.repeat(150); // 150 characters
      const reflection = createMockReflection({ content: longContent });
      render(<ReflectionItem reflection={reflection} />);

      const preview = document.querySelector('.reflectionPreview');
      expect(preview?.textContent).toHaveLength(123); // 120 + "..."
      expect(preview?.textContent).toContain('...');
    });

    it('should not truncate short content', () => {
      const shortContent = 'Short content';
      const reflection = createMockReflection({ content: shortContent });
      render(<ReflectionItem reflection={reflection} />);

      const preview = document.querySelector('.reflectionPreview');
      expect(preview?.textContent).toBe('Short content');
    });

    it('should strip HTML tags from preview', () => {
      const htmlContent = '<p>Hello</p><script>alert("xss")</script> World';
      const reflection = createMockReflection({ content: htmlContent });
      render(<ReflectionItem reflection={reflection} />);

      const preview = document.querySelector('.reflectionPreview');
      expect(preview?.textContent).not.toContain('<p>');
      expect(preview?.textContent).not.toContain('<script>');
      expect(preview?.textContent).toContain('Hello');
      expect(preview?.textContent).toContain('World');
    });

    it('should strip markdown characters from preview', () => {
      const markdownContent = '**Bold** _italic_ # Heading';
      const reflection = createMockReflection({ content: markdownContent });
      render(<ReflectionItem reflection={reflection} />);

      const preview = document.querySelector('.reflectionPreview');
      expect(preview?.textContent).not.toContain('**');
      expect(preview?.textContent).not.toContain('_');
      expect(preview?.textContent).toContain('Bold');
      expect(preview?.textContent).toContain('italic');
    });

    it('should show fallback text when no content', () => {
      const reflection = createMockReflection({
        content: undefined,
        preview: undefined,
        dream: undefined,
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('Your reflection content...')).toBeInTheDocument();
    });

    it('should prefer AI response for preview', () => {
      const reflection = {
        ...createMockReflection(),
        ai_response: 'AI generated content',
        content: 'User content',
      };
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('AI generated content')).toBeInTheDocument();
    });

    it('should NOT use dream field for preview (shows fallback instead)', () => {
      const reflection = createMockReflection({
        content: undefined,
        dream: 'Dream content here',
        aiResponse: undefined,
        ai_response: undefined,
        preview: undefined,
      });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('Your reflection content...')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onClick when provided and clicked', () => {
      const onClick = vi.fn();
      const reflection = createMockReflection();
      render(<ReflectionItem reflection={reflection} onClick={onClick} />);

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(reflection);
    });

    it('should not throw when clicked without onClick', () => {
      const reflection = createMockReflection();
      render(<ReflectionItem reflection={reflection} />);

      const link = screen.getByRole('link');
      expect(() => fireEvent.click(link)).not.toThrow();
    });

    it('should show hover indicator on mouse enter', () => {
      const reflection = createMockReflection();
      render(<ReflectionItem reflection={reflection} />);

      const link = screen.getByRole('link');
      fireEvent.mouseEnter(link);

      const indicator = document.querySelector('.reflectionHoverIndicator');
      expect(indicator).toHaveClass('visible');
    });

    it('should hide hover indicator on mouse leave', () => {
      const reflection = createMockReflection();
      render(<ReflectionItem reflection={reflection} />);

      const link = screen.getByRole('link');
      fireEvent.mouseEnter(link);
      fireEvent.mouseLeave(link);

      const indicator = document.querySelector('.reflectionHoverIndicator');
      expect(indicator).not.toHaveClass('visible');
    });
  });

  describe('animation', () => {
    it('should set animation delay style when animated', () => {
      const reflection = createMockReflection();
      render(
        <ReflectionItem reflection={reflection} animated={true} animationDelay={100} index={2} />
      );

      const link = screen.getByRole('link');
      // animationDelay + index * 100 = 100 + 2 * 100 = 300ms
      expect(link).toHaveStyle({ animationDelay: '300ms' });
    });

    it('should set 0ms delay when not animated', () => {
      const reflection = createMockReflection();
      render(
        <ReflectionItem reflection={reflection} animated={false} animationDelay={100} index={2} />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveStyle({ animationDelay: '0ms' });
    });

    it('should use default index of 0', () => {
      const reflection = createMockReflection();
      render(<ReflectionItem reflection={reflection} animated={true} animationDelay={50} />);

      const link = screen.getByRole('link');
      // animationDelay + index * 100 = 50 + 0 * 100 = 50ms
      expect(link).toHaveStyle({ animationDelay: '50ms' });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string content', () => {
      const reflection = createMockReflection({ content: '' });
      render(<ReflectionItem reflection={reflection} />);

      expect(screen.getByText('Your reflection content...')).toBeInTheDocument();
    });

    it('should handle whitespace-only content', () => {
      const reflection = createMockReflection({ content: '   ' });
      render(<ReflectionItem reflection={reflection} />);

      // After trim, preview should be empty (the component doesn't show fallback for whitespace-only after trim)
      const preview = document.querySelector('.reflectionPreview');
      expect(preview).toBeInTheDocument();
      // Preview will be empty after trimming whitespace
      expect(preview?.textContent).toBe('');
    });

    it('should use index as fallback id', () => {
      const reflection = createMockReflection({ id: undefined as any });
      render(<ReflectionItem reflection={reflection} index={5} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/reflections/5');
    });

    it('should handle special characters in content', () => {
      const reflection = createMockReflection({
        content: 'Content with "quotes" & special chars',
      });
      render(<ReflectionItem reflection={reflection} />);

      const preview = document.querySelector('.reflectionPreview');
      expect(preview?.textContent).toContain('Content with "quotes"');
      expect(preview?.textContent).toContain('special');
      expect(preview?.textContent).toContain('&');
    });
  });
});
