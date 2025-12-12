// lib/voice/__tests__/mirror-voice.test.ts
// Tests for Mirror of Dreams voice system

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  greetings,
  navigation,
  landing,
  pricing,
  emptyStates,
  loading,
  errors,
  success,
  cta,
  auth,
  dashboard,
  reflection,
  getTimeGreeting,
  getPersonalizedGreeting,
  getLoadingMessage,
} from '../mirror-voice';

// =====================================================
// GREETINGS TESTS
// =====================================================

describe('greetings', () => {
  describe('timeOfDay', () => {
    it('should have morning greeting', () => {
      expect(greetings.timeOfDay.morning).toBe('Good morning');
    });

    it('should have afternoon greeting', () => {
      expect(greetings.timeOfDay.afternoon).toBe('Good afternoon');
    });

    it('should have evening greeting', () => {
      expect(greetings.timeOfDay.evening).toBe('Good evening');
    });

    it('should have night greeting (same as evening)', () => {
      expect(greetings.timeOfDay.night).toBe('Good evening');
    });
  });

  describe('dashboard', () => {
    it('should have greeting with dreams', () => {
      expect(greetings.dashboard.withDreams).toBeDefined();
      expect(typeof greetings.dashboard.withDreams).toBe('string');
    });

    it('should have greeting without dreams', () => {
      expect(greetings.dashboard.noDreams).toBeDefined();
      expect(typeof greetings.dashboard.noDreams).toBe('string');
    });
  });

  it('should have returning user greeting', () => {
    expect(greetings.returning).toBe('Welcome back');
  });

  it('should have first time user greeting', () => {
    expect(greetings.firstTime).toBe('Welcome, dreamer');
  });
});

// =====================================================
// NAVIGATION TESTS
// =====================================================

describe('navigation', () => {
  it('should have dashboard label', () => {
    expect(navigation.dashboard).toBe('Home');
  });

  it('should have dreams label', () => {
    expect(navigation.dreams).toBe('Dreams');
  });

  it('should have reflections label', () => {
    expect(navigation.reflections).toBe('Reflections');
  });

  it('should have evolution label', () => {
    expect(navigation.evolution).toBe('Journey');
  });

  it('should have settings label', () => {
    expect(navigation.settings).toBe('Settings');
  });

  it('should have profile label', () => {
    expect(navigation.profile).toBe('Profile');
  });
});

// =====================================================
// LANDING PAGE TESTS
// =====================================================

describe('landing', () => {
  describe('hero', () => {
    it('should have headline', () => {
      expect(landing.hero.headline).toBe('Your dreams know things');
    });

    it('should have subheadline', () => {
      expect(landing.hero.subheadline).toBeDefined();
      expect(typeof landing.hero.subheadline).toBe('string');
    });
  });

  describe('features', () => {
    it('should have 3 features', () => {
      expect(landing.features).toHaveLength(3);
    });

    it('each feature should have id, icon, title, and description', () => {
      landing.features.forEach((feature) => {
        expect(feature.id).toBeDefined();
        expect(feature.icon).toBeDefined();
        expect(feature.title).toBeDefined();
        expect(feature.description).toBeDefined();
      });
    });

    it('should have witness, patterns, and journey features', () => {
      const ids = landing.features.map((f) => f.id);
      expect(ids).toContain('witness');
      expect(ids).toContain('patterns');
      expect(ids).toContain('journey');
    });
  });

  describe('cta', () => {
    it('should have primary CTA', () => {
      expect(landing.cta.primary).toBe('Begin');
    });

    it('should have secondary CTA', () => {
      expect(landing.cta.secondary).toBe('Learn More');
    });

    it('should have demo CTA', () => {
      expect(landing.cta.demo).toBe('Try It');
    });
  });

  describe('footer', () => {
    it('should have tagline', () => {
      expect(landing.footer.tagline).toBeDefined();
      expect(typeof landing.footer.tagline).toBe('string');
    });
  });
});

// =====================================================
// PRICING TESTS
// =====================================================

describe('pricing', () => {
  it('should have headline', () => {
    expect(pricing.headline).toBe('Find Your Space');
  });

  it('should have subheadline', () => {
    expect(pricing.subheadline).toBeDefined();
  });

  describe('tiers', () => {
    it('should have free tier', () => {
      expect(pricing.tiers.free.name).toBe('Wanderer');
      expect(pricing.tiers.free.description).toBeDefined();
    });

    it('should have pro tier', () => {
      expect(pricing.tiers.pro.name).toBe('Seeker');
      expect(pricing.tiers.pro.description).toBeDefined();
    });

    it('should have unlimited tier', () => {
      expect(pricing.tiers.unlimited.name).toBe('Devoted');
      expect(pricing.tiers.unlimited.description).toBeDefined();
    });
  });

  describe('terms', () => {
    it('should reframe SaaS language', () => {
      expect(pricing.terms.reflections).toBe('conversations');
      expect(pricing.terms.features).toBe('what you receive');
      expect(pricing.terms.upgrade).toBe('expand your space');
      expect(pricing.terms.limit).toBe('monthly conversations');
    });
  });
});

// =====================================================
// EMPTY STATES TESTS
// =====================================================

describe('emptyStates', () => {
  const emptyStateKeys = ['dreams', 'reflections', 'evolution', 'visualizations'] as const;

  emptyStateKeys.forEach((key) => {
    describe(key, () => {
      it('should have title', () => {
        expect(emptyStates[key].title).toBeDefined();
        expect(typeof emptyStates[key].title).toBe('string');
      });

      it('should have message', () => {
        expect(emptyStates[key].message).toBeDefined();
        expect(typeof emptyStates[key].message).toBe('string');
      });

      it('should have CTA', () => {
        expect(emptyStates[key].cta).toBeDefined();
        expect(typeof emptyStates[key].cta).toBe('string');
      });
    });
  });
});

// =====================================================
// LOADING STATES TESTS
// =====================================================

describe('loading', () => {
  const loadingKeys = [
    'default',
    'dashboard',
    'reflection',
    'dreams',
    'evolution',
    'saving',
    'generating',
  ] as const;

  loadingKeys.forEach((key) => {
    it(`should have ${key} loading message`, () => {
      expect(loading[key]).toBeDefined();
      expect(typeof loading[key]).toBe('string');
    });
  });

  it('default loading message should be "Holding space..."', () => {
    expect(loading.default).toBe('Holding space...');
  });
});

// =====================================================
// ERROR STATES TESTS
// =====================================================

describe('errors', () => {
  const errorKeys = ['generic', 'network', 'notFound', 'limitReached'] as const;

  errorKeys.forEach((key) => {
    describe(key, () => {
      it('should have title', () => {
        expect(errors[key].title).toBeDefined();
        expect(typeof errors[key].title).toBe('string');
      });

      it('should have message', () => {
        expect(errors[key].message).toBeDefined();
        expect(typeof errors[key].message).toBe('string');
      });

      it('should have CTA', () => {
        expect(errors[key].cta).toBeDefined();
        expect(typeof errors[key].cta).toBe('string');
      });
    });
  });
});

// =====================================================
// SUCCESS STATES TESTS
// =====================================================

describe('success', () => {
  it('should have reflectionSaved message', () => {
    expect(success.reflectionSaved).toBe('Your reflection is held safe');
  });

  it('should have dreamCreated message', () => {
    expect(success.dreamCreated).toBe('Your dream has a name now');
  });

  it('should have profileUpdated message', () => {
    expect(success.profileUpdated).toBe('Changes saved');
  });

  it('should have subscription message', () => {
    expect(success.subscription).toBe('Welcome to your expanded space');
  });
});

// =====================================================
// CTA TESTS
// =====================================================

describe('cta', () => {
  const ctaKeys = [
    'reflect',
    'reflectNow',
    'begin',
    'continue',
    'save',
    'createDream',
    'viewJourney',
    'tryAgain',
    'goHome',
    'signIn',
    'signUp',
  ] as const;

  ctaKeys.forEach((key) => {
    it(`should have ${key} CTA`, () => {
      expect(cta[key]).toBeDefined();
      expect(typeof cta[key]).toBe('string');
    });
  });

  it('save CTA should be "Hold Safe" (not "Save")', () => {
    expect(cta.save).toBe('Hold Safe');
  });
});

// =====================================================
// AUTH PAGES TESTS
// =====================================================

describe('auth', () => {
  describe('signin', () => {
    it('should have title', () => {
      expect(auth.signin.title).toBe('Welcome Back');
    });

    it('should have all required properties', () => {
      expect(auth.signin.subtitle).toBeDefined();
      expect(auth.signin.cta).toBeDefined();
      expect(auth.signin.loading).toBeDefined();
      expect(auth.signin.success).toBeDefined();
      expect(auth.signin.switchPrompt).toBeDefined();
      expect(auth.signin.switchCta).toBeDefined();
    });
  });

  describe('signup', () => {
    it('should have title', () => {
      expect(auth.signup.title).toBe('Begin Your Journey');
    });

    it('should have all required properties', () => {
      expect(auth.signup.subtitle).toBeDefined();
      expect(auth.signup.cta).toBeDefined();
      expect(auth.signup.loading).toBeDefined();
      expect(auth.signup.success).toBeDefined();
      expect(auth.signup.switchPrompt).toBeDefined();
      expect(auth.signup.switchCta).toBeDefined();
    });
  });

  describe('forgotPassword', () => {
    it('should have title', () => {
      expect(auth.forgotPassword.title).toBe('Lost Your Way?');
    });

    it('should have subtitle and cta', () => {
      expect(auth.forgotPassword.subtitle).toBeDefined();
      expect(auth.forgotPassword.cta).toBeDefined();
    });
  });

  describe('verifyEmail', () => {
    it('should have title and message', () => {
      expect(auth.verifyEmail.title).toBe('One More Step');
      expect(auth.verifyEmail.message).toBeDefined();
    });
  });
});

// =====================================================
// DASHBOARD TESTS
// =====================================================

describe('dashboard', () => {
  describe('hero', () => {
    it('should have withDreams message', () => {
      expect(dashboard.hero.withDreams).toBeDefined();
    });

    it('should have noDreams message', () => {
      expect(dashboard.hero.noDreams).toBeDefined();
    });

    it('should have noDreamsCta', () => {
      expect(dashboard.hero.noDreamsCta).toBeDefined();
    });
  });

  describe('cards', () => {
    const cardKeys = ['dreams', 'reflections', 'evolution', 'subscription'] as const;

    cardKeys.forEach((key) => {
      it(`should have ${key} card with title`, () => {
        expect(dashboard.cards[key].title).toBeDefined();
      });
    });

    it('dreams card should have empty state', () => {
      expect(dashboard.cards.dreams.empty).toBeDefined();
    });

    it('reflections card should have empty state', () => {
      expect(dashboard.cards.reflections.empty).toBeDefined();
    });

    it('evolution card should have empty state', () => {
      expect(dashboard.cards.evolution.empty).toBeDefined();
    });
  });
});

// =====================================================
// REFLECTION FLOW TESTS
// =====================================================

describe('reflection', () => {
  it('should have intro', () => {
    expect(reflection.intro).toBe('What would you like to explore?');
  });

  it('should have placeholder', () => {
    expect(reflection.placeholder).toBeDefined();
  });

  it('should have submit text', () => {
    expect(reflection.submit).toBe('Send to Mirror');
  });

  it('should have generating text', () => {
    expect(reflection.generating).toBe('The mirror is listening...');
  });

  it('should have complete text', () => {
    expect(reflection.complete).toBe('Your reflection');
  });

  it('should have savePrompt text', () => {
    expect(reflection.savePrompt).toBeDefined();
  });
});

// =====================================================
// HELPER FUNCTIONS TESTS
// =====================================================

describe('getTimeGreeting', () => {
  const originalDate = global.Date;

  afterEach(() => {
    global.Date = originalDate;
  });

  it('should return morning greeting for hours 5-11', () => {
    const testHours = [5, 6, 7, 8, 9, 10, 11];

    testHours.forEach((hour) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 1, hour, 0, 0));

      expect(getTimeGreeting()).toBe('Good morning');

      vi.useRealTimers();
    });
  });

  it('should return afternoon greeting for hours 12-17', () => {
    const testHours = [12, 13, 14, 15, 16, 17];

    testHours.forEach((hour) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 1, hour, 0, 0));

      expect(getTimeGreeting()).toBe('Good afternoon');

      vi.useRealTimers();
    });
  });

  it('should return evening greeting for hours 18-23 and 0-4', () => {
    const testHours = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];

    testHours.forEach((hour) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 1, hour, 0, 0));

      expect(getTimeGreeting()).toBe('Good evening');

      vi.useRealTimers();
    });
  });
});

describe('getPersonalizedGreeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 10, 0, 0)); // Morning
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should include time greeting and name', () => {
    const result = getPersonalizedGreeting('John');
    expect(result).toBe('Good morning, John');
  });

  it('should use first name only when full name provided', () => {
    const result = getPersonalizedGreeting('John Smith');
    expect(result).toBe('Good morning, John');
  });

  it('should default to "dreamer" when name is undefined', () => {
    const result = getPersonalizedGreeting(undefined);
    expect(result).toBe('Good morning, dreamer');
  });

  it('should default to "dreamer" when name is empty string', () => {
    const result = getPersonalizedGreeting('');
    expect(result).toBe('Good morning, dreamer');
  });
});

describe('getLoadingMessage', () => {
  it('should return default message when no context provided', () => {
    expect(getLoadingMessage()).toBe('Holding space...');
  });

  it('should return default message when "default" context provided', () => {
    expect(getLoadingMessage('default')).toBe('Holding space...');
  });

  it('should return dashboard message', () => {
    expect(getLoadingMessage('dashboard')).toBe('Preparing your space...');
  });

  it('should return reflection message', () => {
    expect(getLoadingMessage('reflection')).toBe('The mirror is listening...');
  });

  it('should return dreams message', () => {
    expect(getLoadingMessage('dreams')).toBe('Gathering your dreams...');
  });

  it('should return evolution message', () => {
    expect(getLoadingMessage('evolution')).toBe('Tracing your journey...');
  });

  it('should return saving message', () => {
    expect(getLoadingMessage('saving')).toBe('Holding your words safe...');
  });

  it('should return generating message', () => {
    expect(getLoadingMessage('generating')).toBe('Listening to what wants to emerge...');
  });

  it('should return default for invalid context', () => {
    // TypeScript would catch this, but test runtime behavior
    expect(getLoadingMessage('invalid' as keyof typeof loading)).toBe('Holding space...');
  });
});
