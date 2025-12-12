// components/shared/__tests__/NavigationBase.test.tsx
// Tests for NavigationBase component

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// =============================================================================
// Mocks - MUST be before component imports
// =============================================================================

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

vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({
    children,
    elevated,
    className,
  }: {
    children: React.ReactNode;
    elevated?: boolean;
    className?: string;
  }) => (
    <div data-testid="glass-card" data-elevated={elevated} className={className}>
      {children}
    </div>
  ),
}));

// =============================================================================
// Component Import - AFTER mocks
// =============================================================================

import NavigationBase from '../NavigationBase';

// =============================================================================
// Test Suite
// =============================================================================

describe('NavigationBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders children correctly', () => {
      render(
        <NavigationBase>
          <div data-testid="nav-content">Navigation Content</div>
        </NavigationBase>
      );

      expect(screen.getByTestId('nav-content')).toBeInTheDocument();
      expect(screen.getByText('Navigation Content')).toBeInTheDocument();
    });

    it('renders logo link', () => {
      render(
        <NavigationBase>
          <div>Content</div>
        </NavigationBase>
      );

      const logoLink = screen.getByRole('link');
      expect(logoLink).toBeInTheDocument();
    });

    it('renders logo emoji', () => {
      render(
        <NavigationBase>
          <div>Content</div>
        </NavigationBase>
      );

      expect(screen.getByText(/Mirror of Dreams/i)).toBeInTheDocument();
    });
  });

  describe('homeHref prop', () => {
    it('defaults homeHref to "/"', () => {
      render(
        <NavigationBase>
          <div>Content</div>
        </NavigationBase>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/');
    });

    it('uses custom homeHref when provided', () => {
      render(
        <NavigationBase homeHref="/dashboard">
          <div>Content</div>
        </NavigationBase>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('supports external homeHref', () => {
      render(
        <NavigationBase homeHref="/custom-home">
          <div>Content</div>
        </NavigationBase>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/custom-home');
    });
  });

  describe('transparent mode', () => {
    it('defaults to non-transparent mode', () => {
      render(
        <NavigationBase>
          <div>Content</div>
        </NavigationBase>
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard.className).not.toContain('bg-transparent');
    });

    it('applies transparent styling when transparent is true', () => {
      render(
        <NavigationBase transparent>
          <div>Content</div>
        </NavigationBase>
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard.className).toContain('bg-transparent');
      expect(glassCard.className).toContain('backdrop-blur-sm');
    });
  });

  describe('elevated prop', () => {
    it('passes elevated prop to GlassCard', () => {
      render(
        <NavigationBase>
          <div>Content</div>
        </NavigationBase>
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard).toHaveAttribute('data-elevated', 'true');
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      render(
        <NavigationBase className="custom-nav-class">
          <div>Content</div>
        </NavigationBase>
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard.className).toContain('custom-nav-class');
    });

    it('merges custom className with default classes', () => {
      render(
        <NavigationBase className="my-class">
          <div>Content</div>
        </NavigationBase>
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard.className).toContain('my-class');
      expect(glassCard.className).toContain('fixed');
    });
  });

  describe('styling', () => {
    it('has fixed positioning classes', () => {
      render(
        <NavigationBase>
          <div>Content</div>
        </NavigationBase>
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard.className).toContain('fixed');
      expect(glassCard.className).toContain('left-0');
      expect(glassCard.className).toContain('right-0');
      expect(glassCard.className).toContain('top-0');
    });

    it('has high z-index', () => {
      render(
        <NavigationBase>
          <div>Content</div>
        </NavigationBase>
      );

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard.className).toContain('z-[100]');
    });
  });
});
