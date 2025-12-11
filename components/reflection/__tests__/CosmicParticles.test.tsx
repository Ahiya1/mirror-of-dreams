import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CosmicParticles } from '../CosmicParticles';

describe('CosmicParticles', () => {
  it('renders the default number of particles (20)', () => {
    const { container } = render(<CosmicParticles />);

    const particles = container.querySelectorAll('.particle');
    expect(particles).toHaveLength(20);
  });

  it('renders a custom number of particles when count prop is provided', () => {
    const { container } = render(<CosmicParticles count={10} />);

    const particles = container.querySelectorAll('.particle');
    expect(particles).toHaveLength(10);
  });

  it('renders particles with random positions', () => {
    const { container } = render(<CosmicParticles count={5} />);

    const particles = container.querySelectorAll('.particle');
    const positions = Array.from(particles).map((particle) => ({
      left: (particle as HTMLElement).style.left,
      animationDelay: (particle as HTMLElement).style.animationDelay,
      animationDuration: (particle as HTMLElement).style.animationDuration,
    }));

    // Verify all particles have valid position styles
    positions.forEach((pos) => {
      expect(pos.left).toMatch(/^\d+(\.\d+)?%$/);
      expect(pos.animationDelay).toMatch(/^\d+(\.\d+)?s$/);
      expect(pos.animationDuration).toMatch(/^\d+(\.\d+)?s$/);
    });
  });

  it('renders the cosmic-particles container', () => {
    const { container } = render(<CosmicParticles />);

    expect(container.querySelector('.cosmic-particles')).toBeInTheDocument();
  });

  it('particles have animation duration between 15s and 25s', () => {
    const { container } = render(<CosmicParticles count={50} />);

    const particles = container.querySelectorAll('.particle');

    particles.forEach((particle) => {
      const duration = parseFloat((particle as HTMLElement).style.animationDuration);
      expect(duration).toBeGreaterThanOrEqual(15);
      expect(duration).toBeLessThanOrEqual(25);
    });
  });

  it('particles have animation delay between 0s and 20s', () => {
    const { container } = render(<CosmicParticles count={50} />);

    const particles = container.querySelectorAll('.particle');

    particles.forEach((particle) => {
      const delay = parseFloat((particle as HTMLElement).style.animationDelay);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(20);
    });
  });

  it('handles zero count gracefully', () => {
    const { container } = render(<CosmicParticles count={0} />);

    const particles = container.querySelectorAll('.particle');
    expect(particles).toHaveLength(0);
  });
});
