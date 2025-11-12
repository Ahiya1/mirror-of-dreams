import type { Metadata } from 'next';
import '@/styles/variables.css';  // First: CSS custom properties
import '@/styles/animations.css'; // Second: Keyframe animations
import '@/styles/globals.css';
import { TRPCProvider } from '@/components/providers/TRPCProvider';
import { ToastProvider } from '@/contexts/ToastContext';

export const metadata: Metadata = {
  title: 'Mirror of Dreams - Reflect, Discover, Transform',
  description: 'An AI-powered reflection experience for personal growth and self-discovery',
  keywords: ['reflection', 'dreams', 'self-discovery', 'AI', 'personal growth'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Skip to main content link (accessibility) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-mirror-purple focus:text-white focus:rounded-lg focus:shadow-glow"
        >
          Skip to main content
        </a>

        {/* Cosmic background preserved from existing design */}
        <div className="cosmic-background">
          <div className="stars" />
        </div>

        {/* Main content wrapped with tRPC provider and Toast provider */}
        <TRPCProvider>
          <ToastProvider>
            <main id="main-content" className="relative z-10">
              {children}
            </main>
          </ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
