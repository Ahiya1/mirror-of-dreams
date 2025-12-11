import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ToneAmbientEffects } from '../ToneAmbientEffects';

describe('ToneAmbientEffects', () => {
  describe('fusion tone', () => {
    it('renders fusion breath elements', () => {
      const { container } = render(<ToneAmbientEffects selectedTone="fusion" />);

      const fusionElements = container.querySelectorAll('.fusion-breath');
      expect(fusionElements).toHaveLength(2);
    });

    it('does not render gentle stars or intense swirl', () => {
      const { container } = render(<ToneAmbientEffects selectedTone="fusion" />);

      expect(container.querySelectorAll('.gentle-star')).toHaveLength(0);
      expect(container.querySelectorAll('.intense-swirl')).toHaveLength(0);
    });
  });

  describe('gentle tone', () => {
    it('renders gentle star elements', () => {
      const { container } = render(<ToneAmbientEffects selectedTone="gentle" />);

      const gentleStars = container.querySelectorAll('.gentle-star');
      expect(gentleStars).toHaveLength(12);
    });

    it('does not render fusion breath or intense swirl', () => {
      const { container } = render(<ToneAmbientEffects selectedTone="gentle" />);

      expect(container.querySelectorAll('.fusion-breath')).toHaveLength(0);
      expect(container.querySelectorAll('.intense-swirl')).toHaveLength(0);
    });

    it('assigns unique positions to each star', () => {
      const { container } = render(<ToneAmbientEffects selectedTone="gentle" />);

      const stars = container.querySelectorAll('.gentle-star');
      const positions = Array.from(stars).map((star) => ({
        left: (star as HTMLElement).style.left,
        top: (star as HTMLElement).style.top,
      }));

      // Check that positions are within expected bounds
      positions.forEach((pos) => {
        const leftValue = parseFloat(pos.left);
        const topValue = parseFloat(pos.top);
        expect(leftValue).toBeGreaterThanOrEqual(10);
        expect(leftValue).toBeLessThanOrEqual(90);
        expect(topValue).toBeGreaterThanOrEqual(10);
        expect(topValue).toBeLessThanOrEqual(90);
      });
    });
  });

  describe('intense tone', () => {
    it('renders intense swirl elements', () => {
      const { container } = render(<ToneAmbientEffects selectedTone="intense" />);

      const intenseSwirls = container.querySelectorAll('.intense-swirl');
      expect(intenseSwirls).toHaveLength(2);
    });

    it('does not render fusion breath or gentle stars', () => {
      const { container } = render(<ToneAmbientEffects selectedTone="intense" />);

      expect(container.querySelectorAll('.fusion-breath')).toHaveLength(0);
      expect(container.querySelectorAll('.gentle-star')).toHaveLength(0);
    });
  });

  it('renders the tone-elements container', () => {
    const { container } = render(<ToneAmbientEffects selectedTone="fusion" />);

    expect(container.querySelector('.tone-elements')).toBeInTheDocument();
  });
});
