import type { Metadata, Viewport } from 'next';
import '@/styles/variables.css';  // First: CSS custom properties
import '@/styles/animations.css'; // Second: Keyframe animations
import '@/styles/globals.css';
import '@/styles/reflection.css';  // Reflection experience sacred styling
import { TRPCProvider } from '@/components/providers/TRPCProvider';
import { ToastProvider } from '@/contexts/ToastContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

export const metadata: Metadata = {
  title: 'Mirror of Dreams - Reflect, Discover, Transform',
  description: 'An AI-powered reflection experience for personal growth and self-discovery',
  keywords: ['reflection', 'dreams', 'self-discovery', 'AI', 'personal growth'],
};

// Separate viewport export (Next.js 14 pattern)
// viewportFit: 'cover' enables safe area insets for notched devices
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevent zoom on input focus
  viewportFit: 'cover', // Enable safe area insets
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Skip to main content link (WCAG 2.4.1 - appears on first Tab press) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-mirror-amethyst focus:text-white focus:px-6 focus:py-3 focus:rounded-lg focus:shadow-amethyst-mid focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2"
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
