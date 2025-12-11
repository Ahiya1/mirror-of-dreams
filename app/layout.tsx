import type { Metadata, Viewport } from 'next';

import '@/styles/variables.css'; // First: CSS custom properties
import '@/styles/animations.css'; // Second: Keyframe animations
import '@/styles/globals.css';
import '@/styles/reflection.css'; // Reflection experience sacred styling
import '@/styles/mirror-experience.css'; // Mirror experience ambient effects
import { TRPCProvider } from '@/components/providers/TRPCProvider';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { ToastProvider } from '@/contexts/ToastContext';

export const metadata: Metadata = {
  title: 'Mirror of Dreams - A Companion for Dreamers',
  description:
    'A sacred space for those who want to listen more deeply to their dreams and inner life.',
  keywords: ['reflection', 'dreams', 'self-discovery', 'journaling', 'inner work'],
};

// Separate viewport export (Next.js 14 pattern)
// viewportFit: 'cover' enables safe area insets for notched devices
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevent zoom on input focus
  viewportFit: 'cover', // Enable safe area insets
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Skip to main content link (WCAG 2.4.1 - appears on first Tab press) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-mirror-amethyst focus:px-6 focus:py-3 focus:text-white focus:shadow-amethyst-mid focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2"
        >
          Skip to main content
        </a>

        {/* Cosmic background preserved from existing design */}
        <div className="cosmic-background">
          <div className="stars" />
        </div>

        {/* Main content wrapped with tRPC provider, Toast provider, and Navigation provider */}
        <TRPCProvider>
          <ToastProvider>
            <NavigationProvider>
              <main id="main-content" tabIndex={-1} className="relative z-10 focus:outline-none">
                {children}
              </main>
            </NavigationProvider>
          </ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
