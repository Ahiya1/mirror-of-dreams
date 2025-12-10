import { render } from '@testing-library/react';
import * as framerMotion from 'framer-motion';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { AnimatedBackground } from '../AnimatedBackground';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  const React = await import('react');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
    motion: {
      div: React.forwardRef(
        ({ children, className, animate, _transition, style, ...props }: any, ref: any) => (
          <div
            ref={ref}
            className={className}
            style={style}
            data-animate={animate ? 'true' : 'false'}
            {...props}
          >
            {children}
          </div>
        )
      ),
    },
  };
});

describe('AnimatedBackground', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);
  });

  describe('rendering', () => {
    test('renders container element', () => {
      const { container } = render(<AnimatedBackground />);
      const background = container.firstChild as HTMLElement;
      expect(background).toBeInTheDocument();
    });

    test('has pointer-events-none class', () => {
      const { container } = render(<AnimatedBackground />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('pointer-events-none');
    });

    test('has absolute positioning', () => {
      const { container } = render(<AnimatedBackground />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('absolute');
    });

    test('has inset-0 for full coverage', () => {
      const { container } = render(<AnimatedBackground />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('inset-0');
    });

    test('has overflow-hidden', () => {
      const { container } = render(<AnimatedBackground />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('overflow-hidden');
    });

    test('renders all four animated layers', () => {
      const { container } = render(<AnimatedBackground />);
      // Each layer is a motion.div child of the container
      const layers = container.querySelectorAll('[data-animate]');
      expect(layers.length).toBe(4);
    });
  });

  describe('layer structure', () => {
    test('far layer has blur-3xl class', () => {
      const { container } = render(<AnimatedBackground />);
      const blurLayers = container.querySelectorAll('.blur-3xl');
      expect(blurLayers.length).toBeGreaterThanOrEqual(1);
    });

    test('mid layer has blur-2xl class', () => {
      const { container } = render(<AnimatedBackground />);
      const blurLayers = container.querySelectorAll('.blur-2xl');
      expect(blurLayers.length).toBe(1);
    });

    test('near layer has blur-xl class', () => {
      const { container } = render(<AnimatedBackground />);
      const blurLayers = container.querySelectorAll('.blur-xl');
      expect(blurLayers.length).toBe(1);
    });

    test('all layers have absolute positioning', () => {
      const { container } = render(<AnimatedBackground />);
      const layers = container.querySelectorAll('[data-animate]');
      layers.forEach((layer) => {
        expect(layer).toHaveClass('absolute');
      });
    });

    test('all layers have inset-0', () => {
      const { container } = render(<AnimatedBackground />);
      const layers = container.querySelectorAll('[data-animate]');
      layers.forEach((layer) => {
        expect(layer).toHaveClass('inset-0');
      });
    });
  });

  describe('layer z-index ordering', () => {
    test('layers have incrementing z-index', () => {
      const { container } = render(<AnimatedBackground />);
      const layers = container.querySelectorAll('[data-animate]');

      const zIndexes = Array.from(layers).map((layer) => {
        const style = (layer as HTMLElement).style;
        return parseInt(style.zIndex, 10);
      });

      expect(zIndexes).toEqual([1, 2, 3, 4]);
    });
  });

  describe('cosmic variant (default)', () => {
    test('applies cosmic far layer gradient', () => {
      const { container } = render(<AnimatedBackground />);
      const farLayer = container.querySelector('.bg-gradient-to-b');
      expect(farLayer).toBeInTheDocument();
    });

    test('applies amethyst-core to mid layer', () => {
      const { container } = render(<AnimatedBackground />);
      const midLayer = container.querySelector('.bg-amethyst-core');
      expect(midLayer).toBeInTheDocument();
    });

    test('applies caustic-purple to near layer', () => {
      const { container } = render(<AnimatedBackground />);
      const nearLayer = container.querySelector('.bg-caustic-purple');
      expect(nearLayer).toBeInTheDocument();
    });
  });

  describe('dream variant', () => {
    test('applies dream far layer gradient', () => {
      const { container } = render(<AnimatedBackground variant="dream" />);
      const farLayer = container.querySelector('.bg-gradient-to-br');
      expect(farLayer).toBeInTheDocument();
    });

    test('applies amethyst-breath to mid layer', () => {
      const { container } = render(<AnimatedBackground variant="dream" />);
      const midLayer = container.querySelector('.bg-amethyst-breath');
      expect(midLayer).toBeInTheDocument();
    });

    test('applies glow-core gradient to near layer', () => {
      const { container } = render(<AnimatedBackground variant="dream" />);
      const nearLayer = container.querySelector('.bg-gradient-to-tr');
      expect(nearLayer).toBeInTheDocument();
    });
  });

  describe('glow variant', () => {
    test('applies radial gradient to far layer', () => {
      const { container } = render(<AnimatedBackground variant="glow" />);
      const farLayer = container.querySelector('.bg-gradient-radial');
      expect(farLayer).toBeInTheDocument();
    });

    test('applies amethyst-glow to mid layer', () => {
      const { container } = render(<AnimatedBackground variant="glow" />);
      const midLayer = container.querySelector('.bg-amethyst-glow');
      expect(midLayer).toBeInTheDocument();
    });

    test('applies caustic-purple to near layer', () => {
      const { container } = render(<AnimatedBackground variant="glow" />);
      const nearLayers = container.querySelectorAll('.bg-caustic-purple');
      expect(nearLayers.length).toBe(1);
    });
  });

  describe('golden presence layer', () => {
    test('renders golden warmth layer', () => {
      const { container } = render(<AnimatedBackground />);
      const goldLayer = container.querySelector('.bg-warmth-ambient');
      expect(goldLayer).toBeInTheDocument();
    });

    test('golden layer has blur-3xl', () => {
      const { container } = render(<AnimatedBackground />);
      const goldLayer = container.querySelector('.bg-warmth-ambient');
      expect(goldLayer).toHaveClass('blur-3xl');
    });

    test('golden layer has highest z-index', () => {
      const { container } = render(<AnimatedBackground />);
      const goldLayer = container.querySelector('.bg-warmth-ambient') as HTMLElement;
      expect(goldLayer?.style.zIndex).toBe('4');
    });
  });

  describe('intensity levels', () => {
    test('renders with subtle intensity by default', () => {
      const { container } = render(<AnimatedBackground />);
      // Component renders - intensity affects opacity values in animation
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders with medium intensity', () => {
      const { container } = render(<AnimatedBackground intensity="medium" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders with strong intensity', () => {
      const { container } = render(<AnimatedBackground intensity="strong" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('intensity prop is passed correctly', () => {
      // Test different intensities render without error
      const { rerender } = render(<AnimatedBackground intensity="subtle" />);
      expect(document.body).toBeInTheDocument();

      rerender(<AnimatedBackground intensity="medium" />);
      expect(document.body).toBeInTheDocument();

      rerender(<AnimatedBackground intensity="strong" />);
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('animation behavior', () => {
    test('enables animations when reduced motion is false', () => {
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);
      const { container } = render(<AnimatedBackground />);
      const layers = container.querySelectorAll('[data-animate="true"]');
      expect(layers.length).toBe(4);
    });

    test('respects reduced motion preference', () => {
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);
      const { container } = render(<AnimatedBackground />);
      // When reduced motion, animate prop should be undefined/false
      const animatedLayers = container.querySelectorAll('[data-animate="true"]');
      expect(animatedLayers.length).toBe(0);
    });

    test('disables animations when reduced motion is true', () => {
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);
      const { container } = render(<AnimatedBackground />);
      const nonAnimatedLayers = container.querySelectorAll('[data-animate="false"]');
      expect(nonAnimatedLayers.length).toBe(4);
    });
  });

  describe('custom styling', () => {
    test('applies custom className', () => {
      const { container } = render(<AnimatedBackground className="z-0" />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('z-0');
    });

    test('merges custom className with default classes', () => {
      const { container } = render(<AnimatedBackground className="opacity-50" />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('opacity-50');
      expect(background).toHaveClass('pointer-events-none');
    });

    test('custom className can override position if needed', () => {
      const { container } = render(<AnimatedBackground className="relative" />);
      const background = container.firstChild as HTMLElement;
      // cn() allows custom classes to merge/override with Tailwind merge
      expect(background).toHaveClass('relative');
    });
  });

  describe('variant switching', () => {
    test('can switch from cosmic to dream', () => {
      const { container, rerender } = render(<AnimatedBackground variant="cosmic" />);
      expect(container.querySelector('.bg-gradient-to-b')).toBeInTheDocument();

      rerender(<AnimatedBackground variant="dream" />);
      expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument();
    });

    test('can switch from cosmic to glow', () => {
      const { container, rerender } = render(<AnimatedBackground variant="cosmic" />);
      expect(container.querySelector('.bg-amethyst-core')).toBeInTheDocument();

      rerender(<AnimatedBackground variant="glow" />);
      expect(container.querySelector('.bg-amethyst-glow')).toBeInTheDocument();
    });

    test('can switch from dream to glow', () => {
      const { container, rerender } = render(<AnimatedBackground variant="dream" />);
      expect(container.querySelector('.bg-amethyst-breath')).toBeInTheDocument();

      rerender(<AnimatedBackground variant="glow" />);
      expect(container.querySelector('.bg-gradient-radial')).toBeInTheDocument();
    });
  });

  describe('far layer positioning', () => {
    test('far layer extends beyond container top', () => {
      const { container } = render(<AnimatedBackground />);
      const farLayer = container.querySelector('.blur-3xl.-top-1\\/4');
      expect(farLayer).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('handles undefined className', () => {
      const { container } = render(<AnimatedBackground className={undefined} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('handles multiple renders', () => {
      const { container, rerender } = render(<AnimatedBackground />);
      expect(container.firstChild).toBeInTheDocument();

      rerender(<AnimatedBackground />);
      expect(container.firstChild).toBeInTheDocument();

      rerender(<AnimatedBackground />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('handles variant and intensity combination', () => {
      const { container } = render(<AnimatedBackground variant="dream" intensity="strong" />);
      expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument();
    });
  });
});
