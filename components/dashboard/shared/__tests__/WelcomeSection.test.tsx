import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import WelcomeSection from '../WelcomeSection';

// Mock CSS modules
vi.mock('../WelcomeSection.module.css', () => ({
  default: {
    welcomeSection: 'welcomeSection',
    welcomeContent: 'welcomeContent',
    welcomeTitle: 'welcomeTitle',
  },
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// ============================================================================
// Tests
// ============================================================================

describe('WelcomeSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // Time-based Greeting Tests
  // --------------------------------------------------------------------------
  describe('time-based greetings', () => {
    it('should show morning greeting at 5am', () => {
      vi.setSystemTime(new Date('2025-01-10T05:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'John Doe' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
    });

    it('should show morning greeting at 9am', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'John Doe' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
    });

    it('should show morning greeting at 11:59am', () => {
      vi.setSystemTime(new Date('2025-01-10T11:59:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'Jane Smith' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
    });

    it('should show afternoon greeting at 12:00pm', () => {
      vi.setSystemTime(new Date('2025-01-10T12:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
    });

    it('should show afternoon greeting at 3pm', () => {
      vi.setSystemTime(new Date('2025-01-10T15:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
    });

    it('should show afternoon greeting at 4:59pm', () => {
      vi.setSystemTime(new Date('2025-01-10T16:59:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
    });

    it('should show evening greeting at 5pm', () => {
      vi.setSystemTime(new Date('2025-01-10T17:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });

    it('should show evening greeting at 9pm', () => {
      vi.setSystemTime(new Date('2025-01-10T21:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });

    it('should show evening greeting at 9:59pm', () => {
      vi.setSystemTime(new Date('2025-01-10T21:59:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });

    it('should show evening greeting at 10pm (night time)', () => {
      // Based on the code, >= 22 returns "Good evening" (the default)
      vi.setSystemTime(new Date('2025-01-10T22:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });

    it('should show evening greeting at midnight', () => {
      // Based on the code, hours < 5 returns "Good evening" (the default)
      vi.setSystemTime(new Date('2025-01-10T00:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });

    it('should show evening greeting at 4:59am', () => {
      vi.setSystemTime(new Date('2025-01-10T04:59:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Name Display Tests
  // --------------------------------------------------------------------------
  describe('name display', () => {
    it('should extract first name from full name', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'John Doe' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/john/i)).toBeInTheDocument();
      expect(screen.queryByText(/doe/i)).not.toBeInTheDocument();
    });

    it('should handle single name correctly', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'Alice' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/alice/i)).toBeInTheDocument();
    });

    it('should handle multiple space-separated names', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'Mary Jane Watson' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/mary/i)).toBeInTheDocument();
      expect(screen.queryByText(/jane/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/watson/i)).not.toBeInTheDocument();
    });

    it('should fallback to "there" when user has no name', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: null } });

      render(<WelcomeSection />);

      expect(screen.getByText(/there/i)).toBeInTheDocument();
    });

    it('should fallback to "there" when user name is undefined', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: undefined } });

      render(<WelcomeSection />);

      expect(screen.getByText(/there/i)).toBeInTheDocument();
    });

    it('should fallback to "there" when user name is empty string', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: '' } });

      render(<WelcomeSection />);

      expect(screen.getByText(/there/i)).toBeInTheDocument();
    });

    it('should handle null user gracefully', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: null });

      render(<WelcomeSection />);

      expect(screen.getByText(/there/i)).toBeInTheDocument();
    });

    it('should handle undefined user gracefully', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: undefined });

      render(<WelcomeSection />);

      expect(screen.getByText(/there/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // CSS Class Tests
  // --------------------------------------------------------------------------
  describe('CSS classes', () => {
    it('should apply welcomeSection class from CSS module', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      const { container } = render(<WelcomeSection />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('welcomeSection');
    });

    it('should apply custom className', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      const { container } = render(<WelcomeSection className="custom-welcome" />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-welcome');
    });

    it('should combine CSS module class with custom className', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      const { container } = render(<WelcomeSection className="my-class" />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('welcomeSection');
      expect(section).toHaveClass('my-class');
    });

    it('should apply welcomeContent class to content wrapper', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      const { container } = render(<WelcomeSection />);

      const content = container.querySelector('.welcomeContent');
      expect(content).toBeInTheDocument();
    });

    it('should apply welcomeTitle class to h1', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      const { container } = render(<WelcomeSection />);

      const title = container.querySelector('h1');
      expect(title).toHaveClass('welcomeTitle');
    });
  });

  // --------------------------------------------------------------------------
  // Structure Tests
  // --------------------------------------------------------------------------
  describe('structure', () => {
    it('should render as a section element', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'User' } });

      const { container } = render(<WelcomeSection />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render h1 with greeting', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: { name: 'Test User' } });

      render(<WelcomeSection />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/good morning, test/i);
    });
  });
});
