// components/shared/__tests__/DemoBanner.test.tsx
// Tests for DemoBanner component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, variant, size, className }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

import { DemoBanner } from '../DemoBanner';

describe('DemoBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      height: 50,
      width: 1000,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 50,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    // Reset CSS variable
    document.documentElement.style.setProperty('--demo-banner-height', '0px');
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--demo-banner-height');
  });

  describe('visibility', () => {
    it('renders when user is demo', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      render(<DemoBanner />);

      expect(screen.getByText(/You're viewing a demo account/)).toBeInTheDocument();
    });

    it('does not render when user is not demo', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: false } });
      render(<DemoBanner />);

      expect(screen.queryByText(/You're viewing a demo account/)).not.toBeInTheDocument();
    });

    it('does not render when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null });
      render(<DemoBanner />);

      expect(screen.queryByText(/You're viewing a demo account/)).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('shows demo indicator emoji', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      render(<DemoBanner />);

      expect(screen.getByLabelText('Demo indicator')).toHaveTextContent('👁️');
    });

    it('shows encouraging message', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      render(<DemoBanner />);

      expect(
        screen.getByText(/Create your own to start reflecting and save your progress/)
      ).toBeInTheDocument();
    });

    it('shows sign up button', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      render(<DemoBanner />);

      expect(screen.getByText('Sign Up for Free')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to signup when button clicked', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      render(<DemoBanner />);

      fireEvent.click(screen.getByText('Sign Up for Free'));

      expect(mockPush).toHaveBeenCalledWith('/auth/signup');
    });
  });

  describe('CSS variable', () => {
    it('sets --demo-banner-height when demo user', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      render(<DemoBanner />);

      expect(document.documentElement.style.getPropertyValue('--demo-banner-height')).toBe('50px');
    });

    it('sets --demo-banner-height to 0px when not demo user', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: false } });
      render(<DemoBanner />);

      expect(document.documentElement.style.getPropertyValue('--demo-banner-height')).toBe('0px');
    });
  });

  describe('button styling', () => {
    it('uses primary variant', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      render(<DemoBanner />);

      const button = screen.getByText('Sign Up for Free');
      expect(button).toHaveAttribute('data-variant', 'primary');
    });

    it('uses sm size', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      render(<DemoBanner />);

      const button = screen.getByText('Sign Up for Free');
      expect(button).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('styling', () => {
    it('has fixed positioning', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      const { container } = render(<DemoBanner />);

      // The banner is the first child of container after null check
      const banner = container.firstChild;
      expect(banner).toHaveClass('fixed');
    });

    it('has high z-index', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      const { container } = render(<DemoBanner />);

      const banner = container.firstChild;
      expect(banner).toHaveClass('z-[110]');
    });

    it('has amber gradient background', () => {
      mockUseAuth.mockReturnValue({ user: { isDemo: true } });
      const { container } = render(<DemoBanner />);

      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-gradient-to-r');
      expect(banner).toHaveClass('from-amber-500/20');
    });
  });
});
