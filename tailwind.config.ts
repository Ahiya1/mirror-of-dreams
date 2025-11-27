import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        'nav': '80px', // Navigation bar height for padding
        // Responsive spacing variables mapped from variables.css
        'xs': 'var(--space-xs)',   // clamp(0.5rem, 1vw, 0.75rem) = 8-12px
        'sm': 'var(--space-sm)',   // clamp(0.75rem, 1.5vw, 1rem) = 12-16px
        'md': 'var(--space-md)',   // clamp(1rem, 2.5vw, 1.5rem) = 16-24px
        'lg': 'var(--space-lg)',   // clamp(1.5rem, 3vw, 2rem) = 24-32px
        'xl': 'var(--space-xl)',   // clamp(2rem, 4vw, 3rem) = 32-48px
        '2xl': 'var(--space-2xl)', // clamp(3rem, 6vw, 4rem) = 48-64px
        '3xl': 'var(--space-3xl)', // clamp(4rem, 8vw, 6rem) = 64-96px
      },
      colors: {
        cosmic: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          gold: '#F59E0B',
          indigo: '#6366F1',
          pink: '#EC4899',
        },
        // ═══════════════════════════════════════════════════════════════
        // MIRROR OF DREAMS - Architecture of Feeling
        // Not colors. Presences.
        // ═══════════════════════════════════════════════════════════════
        mirror: {
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // DEPTH LAYER 1: THE VOID (Far Plane - Atmospheric)
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          'void-deep': '#0a0416',          // Infinite depth
          'void': '#120828',               // Deep cosmic void
          'nebula-dark': '#1a0f2e',        // Purple nebula darkness
          'nebula': '#2d1b4e',             // Atmospheric purple

          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // DEPTH LAYER 2: AMETHYST ENERGY (Mid Plane - Crystal Glow)
          // Ancient 10,000-year-old crystal energy
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          'amethyst-deep': '#4c1d95',      // Deep ancient purple
          'amethyst': '#7c3aed',           // Core amethyst glow
          'amethyst-bright': '#9333ea',    // Bright crystal energy
          'amethyst-light': '#a855f7',     // Light emanation

          // Purple Glow Layers (breathing, pulsing)
          'glow-core': 'rgba(124, 58, 237, 0.4)',      // Deep inner core
          'glow-mid': 'rgba(124, 58, 237, 0.2)',       // Mid emanation
          'glow-outer': 'rgba(124, 58, 237, 0.1)',     // Outer aura
          'glow-atmosphere': 'rgba(124, 58, 237, 0.05)', // Atmospheric

          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // DEPTH LAYER 3: MIRROR TRUTH (Near Plane - Reflections)
          // Pure white clarity and refraction
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          'mirror': 'rgba(255, 255, 255, 0.95)',       // Pure mirror
          'reflection': 'rgba(255, 255, 255, 0.6)',    // Reflection
          'refraction': 'rgba(255, 255, 255, 0.3)',    // Light bend
          'shimmer': 'rgba(255, 255, 255, 0.15)',      // Subtle shimmer

          // Crystal Glass (depth transparency)
          'glass-deep': 'rgba(124, 58, 237, 0.03)',    // Deep purple tint
          'glass-mid': 'rgba(124, 58, 237, 0.05)',     // Mid purple tint
          'glass-near': 'rgba(255, 255, 255, 0.08)',   // Near clarity

          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // GOLDEN PRESENCE (Ambient - Always There, Never Loud)
          // Eternal warm light seeping through
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          'gold-ambient': 'rgba(251, 191, 36, 0.05)',  // Always present
          'gold-seep': 'rgba(251, 191, 36, 0.08)',     // Seeping through
          'gold-edge': 'rgba(251, 191, 36, 0.12)',     // Edge presence
          'gold-flicker': 'rgba(251, 191, 36, 0.15)',  // Candle flicker

          // Golden Warmth (atmospheric)
          'warmth-deep': 'rgba(217, 119, 6, 0.03)',    // Deep warmth
          'warmth': 'rgba(245, 158, 11, 0.05)',        // Ambient warmth
          'warmth-bright': 'rgba(251, 191, 36, 0.08)', // Bright moment

          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // Semantic
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          success: '#34d399',
          warning: '#fbbf24',
          error: '#f87171',
          info: '#818cf8',
        },
      },
      backgroundImage: {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ATMOSPHERIC DEPTH (Far Plane - Nebula)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'nebula': 'radial-gradient(ellipse at top, #2d1b4e 0%, #1a0f2e 50%, #120828 100%)',
        'void-gradient': 'radial-gradient(circle at center, #120828 0%, #0a0416 100%)',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // AMETHYST EMANATION (Mid Plane - Breathing Crystal)
        // Multi-layer purple glow that breathes
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'amethyst-core': 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, rgba(124, 58, 237, 0.2) 40%, rgba(124, 58, 237, 0.1) 70%, transparent 100%)',
        'amethyst-glow': 'radial-gradient(circle, #7c3aed 0%, #9333ea 50%, transparent 100%)',
        'amethyst-breath': 'radial-gradient(ellipse, rgba(124, 58, 237, 0.3) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 100%)',

        // Purple Gradients (ancient energy flow)
        'gradient-ancient': 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #9333ea 100%)',
        'gradient-crystal': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // GLASS DEPTH (Multi-layer transparency)
        // Three planes of glass creating depth
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'glass-triple': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(124, 58, 237, 0.05) 50%, rgba(255, 255, 255, 0.03) 100%)',
        'glass-refract': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(124, 58, 237, 0.03) 100%)',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // MIRROR REFLECTIONS (Near Plane - Sharp highlights)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'reflection-sharp': 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%)',
        'reflection-edge': 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent)',
        'refraction': 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // GOLDEN AMBIENT PRESENCE (Always there, soft)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'warmth-ambient': 'radial-gradient(circle, rgba(251, 191, 36, 0.05) 0%, transparent 100%)',
        'gold-seep': 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
        'gold-edge-glow': 'radial-gradient(circle at bottom right, rgba(251, 191, 36, 0.12), transparent 60%)',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // CAUSTIC LIGHT PATTERNS (Living light)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'caustic-purple': 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(124, 58, 237, 0.15), transparent)',
        'caustic-shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), rgba(251, 191, 36, 0.05), transparent)',
      },
      backdropBlur: {
        'crystal-clear': '1px',  // Nearly transparent
        'crystal': '3px',        // Sharp crystal clarity
        'glass': '8px',          // Depth layer
      },
      backdropSaturate: {
        'vibrant': '200%',       // Rich purple saturation
      },
      boxShadow: {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // AMETHYST GLOW (Multi-layer breathing energy)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'amethyst-core': 'inset 0 0 40px rgba(124, 58, 237, 0.4), inset 0 0 20px rgba(124, 58, 237, 0.6)',
        'amethyst-mid': 'inset 0 0 30px rgba(124, 58, 237, 0.2), 0 0 30px rgba(124, 58, 237, 0.3)',
        'amethyst-outer': '0 0 40px rgba(124, 58, 237, 0.3), 0 0 80px rgba(124, 58, 237, 0.2)',
        'amethyst-breath': '0 0 60px rgba(124, 58, 237, 0.35), 0 0 120px rgba(124, 58, 237, 0.15)',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // CRYSTAL DEPTH (Three-plane glass effect)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'glass-triple': 'inset 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2), 0 2px 8px rgba(124, 58, 237, 0.1)',
        'glass-refract': 'inset 0 0 0 1.5px rgba(255, 255, 255, 0.25), 0 4px 12px rgba(124, 58, 237, 0.15)',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // MIRROR REFLECTIONS (Sharp white highlights)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'reflection': 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'reflection-corner': 'inset 3px 3px 6px rgba(255, 255, 255, 0.3)',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // GOLDEN AMBIENT (Soft warmth seeping through)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'warmth': '0 0 80px rgba(251, 191, 36, 0.05), 0 0 40px rgba(217, 119, 6, 0.03)',
        'gold-seep': 'inset -2px -2px 8px rgba(251, 191, 36, 0.08)',
      },
      animation: {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // BACKGROUND AMBIENT (Living light patterns - slow, atmospheric)
        // These are kept for background depth only
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'flicker': 'flicker 14s ease-in-out infinite',
        'shimmer-soft': 'shimmerSoft 8s ease-in-out infinite',
        'caustic': 'caustic 13s ease-in-out infinite',
        'light-dance': 'lightDance 11s ease-in-out infinite',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // PAGE TRANSITIONS (Fast, functional - 300ms)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        'fade-in': 'fadeIn 300ms ease-out',
      },
      keyframes: {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // BACKGROUND AMBIENT (Kept for atmospheric depth)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        flicker: {
          '0%, 100%': { opacity: '0.05' },
          '23%': { opacity: '0.08' },
          '47%': { opacity: '0.06' },
          '61%': { opacity: '0.09' },
          '83%': { opacity: '0.07' },
        },
        shimmerSoft: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        caustic: {
          '0%, 100%': {
            opacity: '0.1',
            transform: 'scale(1) rotate(0deg)',
          },
          '50%': {
            opacity: '0.15',
            transform: 'scale(1.1) rotate(5deg)',
          },
        },
        lightDance: {
          '0%': { transform: 'translateY(0%) scaleY(1)' },
          '30%': { transform: 'translateY(-8%) scaleY(1.1)' },
          '60%': { transform: 'translateY(-4%) scaleY(0.95)' },
          '100%': { transform: 'translateY(0%) scaleY(1)' },
        },

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // PAGE TRANSITIONS (Fast, functional)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
