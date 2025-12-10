import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReflectionOutputView } from '../ReflectionOutputView';

// Mock AIResponseRenderer
vi.mock('@/components/reflections/AIResponseRenderer', () => ({
  AIResponseRenderer: ({ content }: { content: string }) => (
    <div data-testid="ai-response">{content}</div>
  ),
}));

// Mock glass components
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({
    children,
    className,
    elevated,
    ...props
  }: React.PropsWithChildren<{ className?: string; elevated?: boolean }>) => (
    <div className={className} data-elevated={elevated} {...props}>
      {children}
    </div>
  ),
  GlowButton: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    ...props
  }: React.PropsWithChildren<{
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }>) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
  CosmicLoader: ({ size }: { size?: string }) => (
    <div data-testid="cosmic-loader" data-size={size}>
      Loading animation...
    </div>
  ),
}));

describe('ReflectionOutputView', () => {
  const mockOnCreateNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows CosmicLoader when isLoading is true', () => {
      render(<ReflectionOutputView content="" isLoading={true} onCreateNew={mockOnCreateNew} />);
      expect(screen.getByTestId('cosmic-loader')).toBeInTheDocument();
    });

    it('shows "Loading reflection..." text when isLoading is true', () => {
      render(<ReflectionOutputView content="" isLoading={true} onCreateNew={mockOnCreateNew} />);
      expect(screen.getByText('Loading reflection...')).toBeInTheDocument();
    });

    it('does not show content when loading', () => {
      render(
        <ReflectionOutputView
          content="Test content"
          isLoading={true}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.queryByTestId('ai-response')).not.toBeInTheDocument();
    });

    it('does not show "Your Reflection" heading when loading', () => {
      render(<ReflectionOutputView content="" isLoading={true} onCreateNew={mockOnCreateNew} />);
      expect(screen.queryByText('Your Reflection')).not.toBeInTheDocument();
    });

    it('does not show "Create New Reflection" button when loading', () => {
      render(<ReflectionOutputView content="" isLoading={true} onCreateNew={mockOnCreateNew} />);
      expect(screen.queryByText('Create New Reflection')).not.toBeInTheDocument();
    });

    it('passes correct size to CosmicLoader', () => {
      render(<ReflectionOutputView content="" isLoading={true} onCreateNew={mockOnCreateNew} />);
      const loader = screen.getByTestId('cosmic-loader');
      expect(loader).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('content display', () => {
    it('renders AIResponseRenderer with content when not loading', () => {
      render(
        <ReflectionOutputView
          content="Your reflection content"
          isLoading={false}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByTestId('ai-response')).toBeInTheDocument();
      expect(screen.getByText('Your reflection content')).toBeInTheDocument();
    });

    it('renders "Your Reflection" heading', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      expect(screen.getByText('Your Reflection')).toBeInTheDocument();
    });

    it('renders "Create New Reflection" button', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      expect(screen.getByText('Create New Reflection')).toBeInTheDocument();
    });

    it('does not show CosmicLoader when not loading', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      expect(screen.queryByTestId('cosmic-loader')).not.toBeInTheDocument();
    });

    it('does not show loading text when not loading', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      expect(screen.queryByText('Loading reflection...')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onCreateNew when button clicked', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      fireEvent.click(screen.getByText('Create New Reflection'));
      expect(mockOnCreateNew).toHaveBeenCalledTimes(1);
    });

    it('button has correct variant prop', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      const button = screen.getByText('Create New Reflection');
      expect(button).toHaveAttribute('data-variant', 'primary');
    });

    it('button has correct size prop', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      const button = screen.getByText('Create New Reflection');
      expect(button).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('edge cases', () => {
    it('handles empty content gracefully', () => {
      render(<ReflectionOutputView content="" isLoading={false} onCreateNew={mockOnCreateNew} />);
      expect(screen.getByTestId('ai-response')).toBeInTheDocument();
    });

    it('handles long content', () => {
      const longContent =
        'This is a very long reflection content that spans multiple paragraphs. '.repeat(50);
      render(
        <ReflectionOutputView
          content={longContent}
          isLoading={false}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByTestId('ai-response')).toBeInTheDocument();
      // Check that the ai-response container contains the long content
      const aiResponse = screen.getByTestId('ai-response');
      expect(aiResponse.textContent).toContain('This is a very long reflection content');
    });

    it('handles content with special characters', () => {
      const specialContent = 'Content with <special> "characters" & symbols';
      render(
        <ReflectionOutputView
          content={specialContent}
          isLoading={false}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it('handles content with markdown syntax', () => {
      const markdownContent = '# Heading\n\n**Bold** and *italic* text';
      render(
        <ReflectionOutputView
          content={markdownContent}
          isLoading={false}
          onCreateNew={mockOnCreateNew}
        />
      );
      // AIResponseRenderer receives the markdown content - check the container
      const aiResponse = screen.getByTestId('ai-response');
      expect(aiResponse.textContent).toContain('# Heading');
      expect(aiResponse.textContent).toContain('**Bold**');
    });
  });

  describe('styling', () => {
    it('heading has gradient text styling', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      const heading = screen.getByText('Your Reflection');
      expect(heading).toHaveClass('bg-gradient-to-r');
      expect(heading).toHaveClass('bg-clip-text');
      expect(heading).toHaveClass('text-transparent');
    });

    it('GlassCard has elevated prop', () => {
      const { container } = render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      const card = container.querySelector('[data-elevated="true"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('heading has correct level', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Your Reflection');
    });

    it('button is focusable', () => {
      render(
        <ReflectionOutputView content="Content" isLoading={false} onCreateNew={mockOnCreateNew} />
      );
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });
});
