import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock CosmicBackground
vi.mock('@/components/shared/CosmicBackground', () => ({
  default: () => <div data-testid="cosmic-background" />,
}));

// Mock framer-motion with useReducedMotion
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
      ),
    },
    useReducedMotion: () => false,
  };
});

import { DemoUserCTA } from '../DemoUserCTA';

describe('DemoUserCTA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading and description', () => {
    render(<DemoUserCTA />);

    expect(screen.getByText('Ready to Start Your Journey?')).toBeInTheDocument();
    expect(screen.getByText(/You've explored what Mirror of Dreams can offer/)).toBeInTheDocument();
  });

  it('displays the benefits list', () => {
    render(<DemoUserCTA />);

    expect(screen.getByText('2 reflections per month')).toBeInTheDocument();
    expect(screen.getByText('Track up to 2 dreams')).toBeInTheDocument();
    expect(screen.getByText('Personal reflection history')).toBeInTheDocument();
  });

  it('navigates to signup when "Create Free Account" is clicked', () => {
    render(<DemoUserCTA />);

    const createAccountButton = screen.getByText('Create Free Account');
    fireEvent.click(createAccountButton);

    expect(mockPush).toHaveBeenCalledWith('/auth/signup');
  });

  it('navigates to reflections when "Continue Exploring" is clicked', () => {
    render(<DemoUserCTA />);

    const continueButton = screen.getByText('Continue Exploring');
    fireEvent.click(continueButton);

    expect(mockPush).toHaveBeenCalledWith('/reflections');
  });

  it('navigates to signin when "Sign in" link is clicked', () => {
    render(<DemoUserCTA />);

    const signinLink = screen.getByText('Sign in');
    fireEvent.click(signinLink);

    expect(mockPush).toHaveBeenCalledWith('/auth/signin');
  });

  it('renders the cosmic background', () => {
    render(<DemoUserCTA />);

    expect(screen.getByTestId('cosmic-background')).toBeInTheDocument();
  });

  it('has the correct class structure', () => {
    const { container } = render(<DemoUserCTA />);

    expect(container.querySelector('.reflection-experience')).toBeInTheDocument();
    expect(container.querySelector('.reflection-vignette')).toBeInTheDocument();
  });
});
