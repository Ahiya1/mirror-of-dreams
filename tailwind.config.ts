import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          gold: '#F59E0B',
          indigo: '#6366F1',
          pink: '#EC4899',
        },
        // Mirror design system colors
        mirror: {
          // Backgrounds
          dark: '#0f172a',
          midnight: '#1e293b',
          slate: '#334155',

          // Primary Colors
          blue: '#3b82f6',
          purple: '#a855f7',
          violet: '#8b5cf6',
          indigo: '#6366f1',
          cyan: '#06b6d4',

          // Gradient Colors
          'purple-deep': '#7c3aed',
          'blue-deep': '#1e3a8a',
          'violet-light': '#c4b5fd',

          // Semantic Colors
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
      },
      backgroundImage: {
        'gradient-cosmic': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-primary': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        'gradient-dream': 'radial-gradient(circle at top right, #a855f7, transparent)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'gradient-glow': 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.3), transparent)',
      },
      backdropBlur: {
        'glass-sm': '8px',
        'glass': '16px',
        'glass-lg': '24px',
      },
      backdropSaturate: {
        'glass': '180%',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(139, 92, 246, 0.2)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
        'glow-electric': '0 0 30px rgba(59, 130, 246, 0.4)',
        'glow-purple': '0 0 25px rgba(168, 85, 247, 0.4)',
        'glass-border': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'rotate-slow': 'rotate 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
