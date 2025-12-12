// components/shared/__tests__/CosmicBackground.test.tsx
// Tests for CosmicBackground component - Enhanced cosmic background with accessibility support

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import CosmicBackground from '../CosmicBackground';

describe('CosmicBackground', () => {
  // Store original matchMedia
  const originalMatchMedia = window.matchMedia;

  // Helper to mock matchMedia for reduced motion preference
  const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to no reduced motion preference
    mockMatchMedia(false);
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
  });

  // --------------------------------------------------------------------------
  // Basic Rendering Tests
  // --------------------------------------------------------------------------
  describe('basic rendering', () => {
    it('renders the cosmic background container', () => {
      const { container } = render(<CosmicBackground />);
      const background = container.querySelector('.cosmic-background');
      expect(background).toBeInTheDocument();
    });

    it('has aria-hidden attribute for accessibility', () => {
      const { container } = render(<CosmicBackground />);
      const background = container.querySelector('.cosmic-background');
      expect(background).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders cosmic gradient layer', () => {
      const { container } = render(<CosmicBackground />);
      const gradient = container.querySelector('.cosmic-gradient');
      expect(gradient).toBeInTheDocument();
    });

    it('renders starfield layer', () => {
      const { container } = render(<CosmicBackground />);
      const starfield = container.querySelector('.starfield');
      expect(starfield).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Props Tests
  // --------------------------------------------------------------------------
  describe('props handling', () => {
    it('applies custom className', () => {
      const { container } = render(<CosmicBackground className="custom-class" />);
      const background = container.querySelector('.cosmic-background');
      expect(background).toHaveClass('custom-class');
    });

    it('applies default className when not provided', () => {
      const { container } = render(<CosmicBackground />);
      const background = container.querySelector('.cosmic-background');
      expect(background).toHaveClass('cosmic-background');
    });

    it('sets animation intensity via CSS custom property', () => {
      const { container } = render(<CosmicBackground intensity={0.5} />);
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background.style.getPropertyValue('--animation-intensity')).toBe('0.5');
    });

    it('uses default intensity of 1 when not provided', () => {
      const { container } = render(<CosmicBackground />);
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background.style.getPropertyValue('--animation-intensity')).toBe('1');
    });
  });

  // --------------------------------------------------------------------------
  // Animation State Tests
  // --------------------------------------------------------------------------
  describe('animation state', () => {
    it('sets animation play state to running when animated=true', () => {
      mockMatchMedia(false);
      const { container } = render(<CosmicBackground animated={true} />);
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background.style.getPropertyValue('--animation-play-state')).toBe('running');
    });

    it('sets animation play state to paused when animated=false', () => {
      const { container } = render(<CosmicBackground animated={false} />);
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background.style.getPropertyValue('--animation-play-state')).toBe('paused');
    });

    it('defaults to animated=true', () => {
      mockMatchMedia(false);
      const { container } = render(<CosmicBackground />);
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background.style.getPropertyValue('--animation-play-state')).toBe('running');
    });
  });

  // --------------------------------------------------------------------------
  // Reduced Motion Tests
  // --------------------------------------------------------------------------
  describe('reduced motion preference', () => {
    it('disables animation when prefers-reduced-motion is enabled', () => {
      mockMatchMedia(true);
      const { container } = render(<CosmicBackground animated={true} />);
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background.style.getPropertyValue('--animation-play-state')).toBe('paused');
    });

    it('does not render nebula layer when reduced motion is preferred', () => {
      mockMatchMedia(true);
      const { container } = render(<CosmicBackground />);
      const nebula = container.querySelector('.cosmic-nebula');
      expect(nebula).not.toBeInTheDocument();
    });

    it('does not render particles layer when reduced motion is preferred', () => {
      mockMatchMedia(true);
      const { container } = render(<CosmicBackground />);
      const particles = container.querySelector('.cosmic-particles');
      expect(particles).not.toBeInTheDocument();
    });

    it('renders nebula layer when reduced motion is not preferred and animated', () => {
      mockMatchMedia(false);
      const { container } = render(<CosmicBackground animated={true} />);
      const nebula = container.querySelector('.cosmic-nebula');
      expect(nebula).toBeInTheDocument();
    });

    it('renders particles layer when reduced motion is not preferred and animated', () => {
      mockMatchMedia(false);
      const { container } = render(<CosmicBackground animated={true} />);
      const particles = container.querySelector('.cosmic-particles');
      expect(particles).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Intensity Affecting Styles Tests
  // --------------------------------------------------------------------------
  describe('intensity affects styles', () => {
    it('applies intensity to nebula layer opacity', () => {
      mockMatchMedia(false);
      const { container } = render(<CosmicBackground intensity={0.8} />);
      const nebula = container.querySelector('.cosmic-nebula') as HTMLElement;
      expect(nebula).toBeInTheDocument();
      expect(nebula.style.opacity).toBe('0.8');
    });

    it('applies intensity to particles layer opacity (with factor)', () => {
      mockMatchMedia(false);
      const { container } = render(<CosmicBackground intensity={1} />);
      const particles = container.querySelector('.cosmic-particles') as HTMLElement;
      expect(particles).toBeInTheDocument();
      // Opacity is intensity * 0.6
      expect(particles.style.opacity).toBe('0.6');
    });

    it('adjusts particles opacity based on intensity', () => {
      mockMatchMedia(false);
      const { container } = render(<CosmicBackground intensity={0.5} />);
      const particles = container.querySelector('.cosmic-particles') as HTMLElement;
      expect(particles).toBeInTheDocument();
      // Opacity is 0.5 * 0.6 = 0.3
      expect(particles.style.opacity).toBe('0.3');
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles intensity of 0', () => {
      mockMatchMedia(false);
      const { container } = render(<CosmicBackground intensity={0} />);
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background.style.getPropertyValue('--animation-intensity')).toBe('0');
    });

    it('handles high intensity values', () => {
      mockMatchMedia(false);
      const { container } = render(<CosmicBackground intensity={2} />);
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background.style.getPropertyValue('--animation-intensity')).toBe('2');
    });

    it('combines animated=false with prefers-reduced-motion=true', () => {
      mockMatchMedia(true);
      const { container } = render(<CosmicBackground animated={false} />);
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background.style.getPropertyValue('--animation-play-state')).toBe('paused');
      expect(container.querySelector('.cosmic-nebula')).not.toBeInTheDocument();
    });

    it('renders correctly with all props combined', () => {
      mockMatchMedia(false);
      const { container } = render(
        <CosmicBackground animated={true} intensity={0.75} className="test-class" />
      );
      const background = container.querySelector('.cosmic-background') as HTMLElement;
      expect(background).toHaveClass('test-class');
      expect(background.style.getPropertyValue('--animation-intensity')).toBe('0.75');
      expect(background.style.getPropertyValue('--animation-play-state')).toBe('running');
    });
  });
});
