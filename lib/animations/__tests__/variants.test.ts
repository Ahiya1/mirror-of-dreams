// lib/animations/__tests__/variants.test.ts
// Tests for animation variant exports

import { describe, it, expect } from 'vitest';

import {
  cardVariants,
  glowVariants,
  staggerContainer,
  staggerItem,
  modalOverlayVariants,
  modalContentVariants,
  pulseGlowVariants,
  rotateVariants,
  fadeInVariants,
  slideUpVariants,
  buttonVariants,
  orbVariants,
  badgeGlowVariants,
  scalePulseVariants,
  slideInLeftVariants,
  slideInRightVariants,
  floatVariants,
  inputFocusVariants,
  cardPressVariants,
  characterCounterVariants,
  wordCounterVariants,
  pageTransitionVariants,
  bottomNavVariants,
  bottomSheetVariants,
  bottomSheetBackdropVariants,
  stepTransitionVariants,
  gazingOverlayVariants,
  statusTextVariants,
  mobileModalVariants,
} from '../variants';

// =====================================================
// HELPER FUNCTIONS FOR TESTING
// =====================================================

function hasVariantState(variants: object, state: string): boolean {
  return state in variants;
}

function getVariantValue(variants: Record<string, unknown>, state: string): unknown {
  return variants[state];
}

// =====================================================
// CARD VARIANTS TESTS
// =====================================================

describe('cardVariants', () => {
  it('should have hidden state', () => {
    expect(hasVariantState(cardVariants, 'hidden')).toBe(true);
  });

  it('should have visible state', () => {
    expect(hasVariantState(cardVariants, 'visible')).toBe(true);
  });

  it('should have hover state', () => {
    expect(hasVariantState(cardVariants, 'hover')).toBe(true);
  });

  it('hidden state should have opacity 0', () => {
    const hidden = getVariantValue(cardVariants, 'hidden') as Record<string, number>;
    expect(hidden.opacity).toBe(0);
  });

  it('visible state should have opacity 1', () => {
    const visible = getVariantValue(cardVariants, 'visible') as Record<string, number>;
    expect(visible.opacity).toBe(1);
  });

  it('hover state should have negative y offset', () => {
    const hover = getVariantValue(cardVariants, 'hover') as Record<string, number>;
    expect(hover.y).toBe(-2);
  });
});

// =====================================================
// GLOW VARIANTS TESTS
// =====================================================

describe('glowVariants', () => {
  it('should have initial state', () => {
    expect(hasVariantState(glowVariants, 'initial')).toBe(true);
  });

  it('should have hover state', () => {
    expect(hasVariantState(glowVariants, 'hover')).toBe(true);
  });

  it('initial state should have boxShadow', () => {
    const initial = getVariantValue(glowVariants, 'initial') as Record<string, string>;
    expect(initial.boxShadow).toBeDefined();
    expect(initial.boxShadow).toContain('rgba(139, 92, 246');
  });

  it('hover state should have stronger boxShadow', () => {
    const hover = getVariantValue(glowVariants, 'hover') as Record<string, unknown>;
    expect(hover.boxShadow).toBeDefined();
    expect(String(hover.boxShadow)).toContain('30px');
  });
});

// =====================================================
// STAGGER VARIANTS TESTS
// =====================================================

describe('staggerContainer', () => {
  it('should have hidden state', () => {
    expect(hasVariantState(staggerContainer, 'hidden')).toBe(true);
  });

  it('should have show state', () => {
    expect(hasVariantState(staggerContainer, 'show')).toBe(true);
  });

  it('show state should have staggerChildren', () => {
    const show = getVariantValue(staggerContainer, 'show') as Record<string, unknown>;
    expect((show.transition as Record<string, number>).staggerChildren).toBeDefined();
  });
});

describe('staggerItem', () => {
  it('should have hidden state', () => {
    expect(hasVariantState(staggerItem, 'hidden')).toBe(true);
  });

  it('should have show state', () => {
    expect(hasVariantState(staggerItem, 'show')).toBe(true);
  });

  it('hidden state should have opacity 0 and y offset', () => {
    const hidden = getVariantValue(staggerItem, 'hidden') as Record<string, number>;
    expect(hidden.opacity).toBe(0);
    expect(hidden.y).toBe(20);
  });
});

// =====================================================
// MODAL VARIANTS TESTS
// =====================================================

describe('modalOverlayVariants', () => {
  it('should have hidden, visible, and exit states', () => {
    expect(hasVariantState(modalOverlayVariants, 'hidden')).toBe(true);
    expect(hasVariantState(modalOverlayVariants, 'visible')).toBe(true);
    expect(hasVariantState(modalOverlayVariants, 'exit')).toBe(true);
  });

  it('hidden state should have opacity 0', () => {
    const hidden = getVariantValue(modalOverlayVariants, 'hidden') as Record<string, number>;
    expect(hidden.opacity).toBe(0);
  });

  it('visible state should have opacity 1', () => {
    const visible = getVariantValue(modalOverlayVariants, 'visible') as Record<string, number>;
    expect(visible.opacity).toBe(1);
  });
});

describe('modalContentVariants', () => {
  it('should have hidden, visible, and exit states', () => {
    expect(hasVariantState(modalContentVariants, 'hidden')).toBe(true);
    expect(hasVariantState(modalContentVariants, 'visible')).toBe(true);
    expect(hasVariantState(modalContentVariants, 'exit')).toBe(true);
  });

  it('should use slide animation (y offset)', () => {
    const hidden = getVariantValue(modalContentVariants, 'hidden') as Record<string, number>;
    expect(hidden.y).toBeDefined();
  });
});

// =====================================================
// FADE AND SLIDE VARIANTS TESTS
// =====================================================

describe('fadeInVariants', () => {
  it('should have hidden and visible states', () => {
    expect(hasVariantState(fadeInVariants, 'hidden')).toBe(true);
    expect(hasVariantState(fadeInVariants, 'visible')).toBe(true);
  });

  it('hidden should be opacity 0', () => {
    const hidden = getVariantValue(fadeInVariants, 'hidden') as Record<string, number>;
    expect(hidden.opacity).toBe(0);
  });

  it('visible should be opacity 1', () => {
    const visible = getVariantValue(fadeInVariants, 'visible') as Record<string, number>;
    expect(visible.opacity).toBe(1);
  });
});

describe('slideUpVariants', () => {
  it('should have hidden and visible states', () => {
    expect(hasVariantState(slideUpVariants, 'hidden')).toBe(true);
    expect(hasVariantState(slideUpVariants, 'visible')).toBe(true);
  });

  it('hidden should have y offset of 20', () => {
    const hidden = getVariantValue(slideUpVariants, 'hidden') as Record<string, number>;
    expect(hidden.y).toBe(20);
  });

  it('visible should have y offset of 0', () => {
    const visible = getVariantValue(slideUpVariants, 'visible') as Record<string, number>;
    expect(visible.y).toBe(0);
  });
});

describe('slideInLeftVariants', () => {
  it('hidden should have negative x offset', () => {
    const hidden = getVariantValue(slideInLeftVariants, 'hidden') as Record<string, number>;
    expect(hidden.x).toBe(-20);
  });

  it('visible should have x offset of 0', () => {
    const visible = getVariantValue(slideInLeftVariants, 'visible') as Record<string, number>;
    expect(visible.x).toBe(0);
  });
});

describe('slideInRightVariants', () => {
  it('hidden should have positive x offset', () => {
    const hidden = getVariantValue(slideInRightVariants, 'hidden') as Record<string, number>;
    expect(hidden.x).toBe(20);
  });

  it('visible should have x offset of 0', () => {
    const visible = getVariantValue(slideInRightVariants, 'visible') as Record<string, number>;
    expect(visible.x).toBe(0);
  });
});

// =====================================================
// BUTTON AND INTERACTIVE VARIANTS TESTS
// =====================================================

describe('buttonVariants', () => {
  it('should have rest, hover, and tap states', () => {
    expect(hasVariantState(buttonVariants, 'rest')).toBe(true);
    expect(hasVariantState(buttonVariants, 'hover')).toBe(true);
    expect(hasVariantState(buttonVariants, 'tap')).toBe(true);
  });

  it('should not have scale effects (accessibility)', () => {
    const hover = getVariantValue(buttonVariants, 'hover') as Record<string, unknown>;
    expect(hover.scale).toBeUndefined();
  });
});

describe('cardPressVariants', () => {
  it('should have rest and tap states', () => {
    expect(hasVariantState(cardPressVariants, 'rest')).toBe(true);
    expect(hasVariantState(cardPressVariants, 'tap')).toBe(true);
  });

  it('tap should have subtle scale down', () => {
    const tap = getVariantValue(cardPressVariants, 'tap') as Record<string, number>;
    expect(tap.scale).toBe(0.98);
  });
});

// =====================================================
// ORB AND BADGE VARIANTS TESTS
// =====================================================

describe('orbVariants', () => {
  it('should have inactive, active, and complete states', () => {
    expect(hasVariantState(orbVariants, 'inactive')).toBe(true);
    expect(hasVariantState(orbVariants, 'active')).toBe(true);
    expect(hasVariantState(orbVariants, 'complete')).toBe(true);
  });

  it('inactive should have low opacity', () => {
    const inactive = getVariantValue(orbVariants, 'inactive') as Record<string, number>;
    expect(inactive.opacity).toBe(0.5);
  });

  it('active should have full opacity', () => {
    const active = getVariantValue(orbVariants, 'active') as Record<string, number>;
    expect(active.opacity).toBe(1);
  });
});

describe('badgeGlowVariants', () => {
  it('should have rest and glow states', () => {
    expect(hasVariantState(badgeGlowVariants, 'rest')).toBe(true);
    expect(hasVariantState(badgeGlowVariants, 'glow')).toBe(true);
  });
});

// =====================================================
// INPUT AND FORM VARIANTS TESTS
// =====================================================

describe('inputFocusVariants', () => {
  it('should have rest and focus states', () => {
    expect(hasVariantState(inputFocusVariants, 'rest')).toBe(true);
    expect(hasVariantState(inputFocusVariants, 'focus')).toBe(true);
  });

  it('focus should have enhanced boxShadow', () => {
    const focus = getVariantValue(inputFocusVariants, 'focus') as Record<string, unknown>;
    expect(focus.boxShadow).toBeDefined();
    expect(String(focus.boxShadow)).toContain('rgba(139, 92, 246');
  });
});

describe('characterCounterVariants', () => {
  it('should have safe, warning, and danger states', () => {
    expect(hasVariantState(characterCounterVariants, 'safe')).toBe(true);
    expect(hasVariantState(characterCounterVariants, 'warning')).toBe(true);
    expect(hasVariantState(characterCounterVariants, 'danger')).toBe(true);
  });

  it('danger should use purple color (not red)', () => {
    const danger = getVariantValue(characterCounterVariants, 'danger') as Record<string, string>;
    expect(danger.color).toBe('#a855f7'); // Purple, not red
  });
});

describe('wordCounterVariants', () => {
  it('should have low, mid, and high states', () => {
    expect(hasVariantState(wordCounterVariants, 'low')).toBe(true);
    expect(hasVariantState(wordCounterVariants, 'mid')).toBe(true);
    expect(hasVariantState(wordCounterVariants, 'high')).toBe(true);
  });
});

// =====================================================
// PAGE TRANSITION VARIANTS TESTS
// =====================================================

describe('pageTransitionVariants', () => {
  it('should have initial, enter, and exit states', () => {
    expect(hasVariantState(pageTransitionVariants, 'initial')).toBe(true);
    expect(hasVariantState(pageTransitionVariants, 'enter')).toBe(true);
    expect(hasVariantState(pageTransitionVariants, 'exit')).toBe(true);
  });
});

// =====================================================
// BOTTOM NAV/SHEET VARIANTS TESTS
// =====================================================

describe('bottomNavVariants', () => {
  it('should have hidden, visible, and exit states', () => {
    expect(hasVariantState(bottomNavVariants, 'hidden')).toBe(true);
    expect(hasVariantState(bottomNavVariants, 'visible')).toBe(true);
    expect(hasVariantState(bottomNavVariants, 'exit')).toBe(true);
  });

  it('hidden should slide off screen (y: 100%)', () => {
    const hidden = getVariantValue(bottomNavVariants, 'hidden') as Record<string, string>;
    expect(hidden.y).toBe('100%');
  });

  it('visible should use spring animation', () => {
    const visible = getVariantValue(bottomNavVariants, 'visible') as Record<string, unknown>;
    expect((visible.transition as Record<string, string>).type).toBe('spring');
  });
});

describe('bottomSheetVariants', () => {
  it('should have hidden, visible, and exit states', () => {
    expect(hasVariantState(bottomSheetVariants, 'hidden')).toBe(true);
    expect(hasVariantState(bottomSheetVariants, 'visible')).toBe(true);
    expect(hasVariantState(bottomSheetVariants, 'exit')).toBe(true);
  });
});

describe('bottomSheetBackdropVariants', () => {
  it('should have hidden, visible, and exit states', () => {
    expect(hasVariantState(bottomSheetBackdropVariants, 'hidden')).toBe(true);
    expect(hasVariantState(bottomSheetBackdropVariants, 'visible')).toBe(true);
    expect(hasVariantState(bottomSheetBackdropVariants, 'exit')).toBe(true);
  });
});

// =====================================================
// STEP TRANSITION VARIANTS TESTS
// =====================================================

describe('stepTransitionVariants', () => {
  it('should have enter, center, and exit states', () => {
    expect(hasVariantState(stepTransitionVariants, 'enter')).toBe(true);
    expect(hasVariantState(stepTransitionVariants, 'center')).toBe(true);
    expect(hasVariantState(stepTransitionVariants, 'exit')).toBe(true);
  });

  it('enter should be a function accepting direction', () => {
    const enter = getVariantValue(stepTransitionVariants, 'enter');
    expect(typeof enter).toBe('function');
  });

  it('enter with positive direction should slide from right', () => {
    const enter = getVariantValue(stepTransitionVariants, 'enter') as (d: number) => {
      x: string;
    };
    const result = enter(1);
    expect(result.x).toBe('100%');
  });

  it('enter with negative direction should slide from left', () => {
    const enter = getVariantValue(stepTransitionVariants, 'enter') as (d: number) => {
      x: string;
    };
    const result = enter(-1);
    expect(result.x).toBe('-100%');
  });

  it('exit should be a function accepting direction', () => {
    const exit = getVariantValue(stepTransitionVariants, 'exit');
    expect(typeof exit).toBe('function');
  });

  it('exit with positive direction should slide to left', () => {
    const exit = getVariantValue(stepTransitionVariants, 'exit') as (d: number) => { x: string };
    const result = exit(1);
    expect(result.x).toBe('-100%');
  });

  it('exit with negative direction should slide to right', () => {
    const exit = getVariantValue(stepTransitionVariants, 'exit') as (d: number) => { x: string };
    const result = exit(-1);
    expect(result.x).toBe('100%');
  });
});

// =====================================================
// GAZING OVERLAY VARIANTS TESTS
// =====================================================

describe('gazingOverlayVariants', () => {
  it('should have hidden, visible, and exit states', () => {
    expect(hasVariantState(gazingOverlayVariants, 'hidden')).toBe(true);
    expect(hasVariantState(gazingOverlayVariants, 'visible')).toBe(true);
    expect(hasVariantState(gazingOverlayVariants, 'exit')).toBe(true);
  });
});

describe('statusTextVariants', () => {
  it('should have hidden, visible, and exit states', () => {
    expect(hasVariantState(statusTextVariants, 'hidden')).toBe(true);
    expect(hasVariantState(statusTextVariants, 'visible')).toBe(true);
    expect(hasVariantState(statusTextVariants, 'exit')).toBe(true);
  });
});

// =====================================================
// MOBILE MODAL VARIANTS TESTS
// =====================================================

describe('mobileModalVariants', () => {
  it('should have hidden, visible, and exit states', () => {
    expect(hasVariantState(mobileModalVariants, 'hidden')).toBe(true);
    expect(hasVariantState(mobileModalVariants, 'visible')).toBe(true);
    expect(hasVariantState(mobileModalVariants, 'exit')).toBe(true);
  });

  it('should slide up from bottom', () => {
    const hidden = getVariantValue(mobileModalVariants, 'hidden') as Record<string, string>;
    expect(hidden.y).toBe('100%');
  });

  it('visible should use spring animation', () => {
    const visible = getVariantValue(mobileModalVariants, 'visible') as Record<string, unknown>;
    expect((visible.transition as Record<string, string>).type).toBe('spring');
  });
});

// =====================================================
// DEPRECATED VARIANTS TESTS (ensure backward compatibility)
// =====================================================

describe('deprecated variants (backward compatibility)', () => {
  describe('pulseGlowVariants', () => {
    it('should have initial and animate states', () => {
      expect(hasVariantState(pulseGlowVariants, 'initial')).toBe(true);
      expect(hasVariantState(pulseGlowVariants, 'animate')).toBe(true);
    });
  });

  describe('floatVariants', () => {
    it('should have animate state', () => {
      expect(hasVariantState(floatVariants, 'animate')).toBe(true);
    });

    it('animate should have y of 0 (no float)', () => {
      const animate = getVariantValue(floatVariants, 'animate') as Record<string, number>;
      expect(animate.y).toBe(0);
    });
  });

  describe('rotateVariants', () => {
    it('should have animate state with infinite rotation', () => {
      expect(hasVariantState(rotateVariants, 'animate')).toBe(true);
      const animate = getVariantValue(rotateVariants, 'animate') as Record<string, unknown>;
      expect((animate.transition as Record<string, unknown>).repeat).toBe(Infinity);
    });
  });

  describe('scalePulseVariants', () => {
    it('should have animate state with repeating opacity', () => {
      expect(hasVariantState(scalePulseVariants, 'animate')).toBe(true);
      const animate = getVariantValue(scalePulseVariants, 'animate') as Record<string, unknown>;
      expect(Array.isArray(animate.opacity)).toBe(true);
    });
  });
});
