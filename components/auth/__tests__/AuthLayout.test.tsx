import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import AuthLayout from '../AuthLayout';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock GlassCard for isolation testing
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({
    children,
    className,
    elevated,
  }: {
    children: React.ReactNode;
    className?: string;
    elevated?: boolean;
  }) => (
    <div data-testid="glass-card" data-elevated={elevated} className={className}>
      {children}
    </div>
  ),
}));

describe('AuthLayout', () => {
  describe('rendering', () => {
    test('renders children content', () => {
      render(
        <AuthLayout>
          <div>Form content</div>
        </AuthLayout>
      );
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });

    test('renders inside GlassCard', () => {
      render(<AuthLayout>Content</AuthLayout>);
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    test('GlassCard is elevated', () => {
      render(<AuthLayout>Content</AuthLayout>);
      expect(screen.getByTestId('glass-card')).toHaveAttribute('data-elevated', 'true');
    });

    test('renders form elements as children', () => {
      render(
        <AuthLayout>
          <input type="email" placeholder="Email" />
          <button type="submit">Submit</button>
        </AuthLayout>
      );
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    test('renders multiple children correctly', () => {
      render(
        <AuthLayout>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
          <div data-testid="child-3">Third</div>
        </AuthLayout>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });
  });

  describe('layout structure', () => {
    test('centers content with flexbox', () => {
      const { container } = render(<AuthLayout>Content</AuthLayout>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    test('has min-height screen', () => {
      const { container } = render(<AuthLayout>Content</AuthLayout>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-screen');
    });

    test('has responsive padding', () => {
      const { container } = render(<AuthLayout>Content</AuthLayout>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('px-4');
      expect(wrapper).toHaveClass('py-12');
    });

    test('has relative z-index positioning', () => {
      const { container } = render(<AuthLayout>Content</AuthLayout>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('relative');
      expect(wrapper).toHaveClass('z-10');
    });

    test('has max-width container', () => {
      const { container } = render(<AuthLayout>Content</AuthLayout>);
      const inner = container.querySelector('.max-w-md');
      expect(inner).toBeInTheDocument();
    });

    test('inner container has full width', () => {
      const { container } = render(<AuthLayout>Content</AuthLayout>);
      const inner = container.querySelector('.w-full');
      expect(inner).toBeInTheDocument();
    });
  });

  describe('logo', () => {
    test('renders logo emoji', () => {
      render(<AuthLayout>Content</AuthLayout>);
      expect(screen.getByText(/Mirror of Dreams/)).toBeInTheDocument();
    });

    test('renders mirror emoji', () => {
      render(<AuthLayout>Content</AuthLayout>);
      // The mirror emoji is rendered as a separate span
      const link = screen.getByRole('link');
      const spans = link.querySelectorAll('span');
      // First span has emoji, second has text
      expect(spans[0]).toHaveTextContent(/[\u{1F300}-\u{1FAD6}]/u);
    });

    test('logo links to home page', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/');
    });

    test('logo link contains app name', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('Mirror of Dreams');
    });

    test('logo has hover styling classes', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('transition-all');
    });

    test('logo has centered flex layout', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('flex');
      expect(link).toHaveClass('items-center');
      expect(link).toHaveClass('justify-center');
    });

    test('logo has spacing gap', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('gap-3');
    });
  });

  describe('title', () => {
    test('renders default title "Welcome"', () => {
      render(<AuthLayout>Content</AuthLayout>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome');
    });

    test('renders custom title when provided', () => {
      render(<AuthLayout title="Sign In">Content</AuthLayout>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign In');
    });

    test('renders "Create Account" title', () => {
      render(<AuthLayout title="Create Account">Content</AuthLayout>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create Account');
    });

    test('renders "Reset Password" title', () => {
      render(<AuthLayout title="Reset Password">Content</AuthLayout>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Reset Password');
    });

    test('title has gradient text styling', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('bg-gradient-to-r');
      expect(title).toHaveClass('bg-clip-text');
    });

    test('title has text-transparent for gradient effect', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-transparent');
    });

    test('title has center alignment', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-center');
    });

    test('title has correct typography', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-3xl');
      expect(title).toHaveClass('font-light');
    });

    test('title has bottom margin', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('mb-2');
    });
  });

  describe('subtitle', () => {
    test('renders subtitle when provided', () => {
      render(<AuthLayout subtitle="Enter your credentials">Content</AuthLayout>);
      expect(screen.getByText('Enter your credentials')).toBeInTheDocument();
    });

    test('does not render subtitle when not provided', () => {
      render(<AuthLayout>Content</AuthLayout>);
      // Only logo text and title should be present, no paragraph
      expect(screen.queryByText(/enter your/i)).not.toBeInTheDocument();
    });

    test('subtitle has center alignment', () => {
      render(<AuthLayout subtitle="Test subtitle">Content</AuthLayout>);
      const subtitle = screen.getByText('Test subtitle');
      expect(subtitle).toHaveClass('text-center');
    });

    test('subtitle has muted text color', () => {
      render(<AuthLayout subtitle="Test subtitle">Content</AuthLayout>);
      const subtitle = screen.getByText('Test subtitle');
      expect(subtitle).toHaveClass('text-white/60');
    });

    test('subtitle has correct typography', () => {
      render(<AuthLayout subtitle="Test subtitle">Content</AuthLayout>);
      const subtitle = screen.getByText('Test subtitle');
      expect(subtitle).toHaveClass('text-lg');
    });

    test('subtitle has bottom margin', () => {
      render(<AuthLayout subtitle="Test subtitle">Content</AuthLayout>);
      const subtitle = screen.getByText('Test subtitle');
      expect(subtitle).toHaveClass('mb-8');
    });

    test('renders both title and subtitle together', () => {
      render(
        <AuthLayout title="Welcome Back" subtitle="Sign in to continue">
          Content
        </AuthLayout>
      );
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome Back');
      expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
    });
  });

  describe('spacer logic', () => {
    test('renders spacer when title exists but no subtitle', () => {
      const { container } = render(<AuthLayout title="Title Only">Content</AuthLayout>);
      // The spacer div has mb-6 class and is empty
      const spacer = container.querySelector('.mb-6');
      expect(spacer).toBeInTheDocument();
    });

    test('does not render spacer when subtitle is present', () => {
      const { container } = render(
        <AuthLayout title="Title" subtitle="Subtitle">
          Content
        </AuthLayout>
      );
      // With subtitle, mb-8 is on the subtitle, spacer should not exist
      const paragraphs = container.querySelectorAll('p');
      const subtitleP = Array.from(paragraphs).find((p) => p.textContent === 'Subtitle');
      expect(subtitleP).toHaveClass('mb-8');
    });
  });

  describe('accessibility', () => {
    test('title is h1 element', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    test('logo link is keyboard accessible', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    test('single h1 on the page', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
    });

    test('form controls are accessible', () => {
      render(
        <AuthLayout>
          <label htmlFor="test-input">Test Label</label>
          <input id="test-input" type="text" />
        </AuthLayout>
      );
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    test('GlassCard has responsive padding', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const card = screen.getByTestId('glass-card');
      // p-8 md:p-10 from the className
      expect(card).toHaveClass('p-8');
      expect(card).toHaveClass('md:p-10');
    });
  });

  describe('edge cases', () => {
    test('handles empty children', () => {
      render(<AuthLayout>{null}</AuthLayout>);
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    test('handles empty title', () => {
      render(<AuthLayout title="">Content</AuthLayout>);
      // Empty title should not render h1
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });

    test('handles empty subtitle with title', () => {
      render(
        <AuthLayout title="Title" subtitle="">
          Content
        </AuthLayout>
      );
      // Empty subtitle should not render p with that content
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
    });

    test('handles long title gracefully', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      render(<AuthLayout title={longTitle}>Content</AuthLayout>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(longTitle);
    });

    test('handles special characters in title', () => {
      render(<AuthLayout title="Welcome! & Sign In">Content</AuthLayout>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome! & Sign In');
    });
  });
});
