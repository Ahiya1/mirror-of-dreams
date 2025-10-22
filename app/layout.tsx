import type { Metadata } from 'next';
import '@/styles/variables.css';  // First: CSS custom properties
import '@/styles/animations.css'; // Second: Keyframe animations
import '@/styles/globals.css';
import { TRPCProvider } from '@/components/providers/TRPCProvider';

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
        {/* Cosmic background preserved from existing design */}
        <div className="cosmic-background">
          <div className="stars" />
        </div>

        {/* Main content wrapped with tRPC provider */}
        <TRPCProvider>
          <div className="relative z-10">
            {children}
          </div>
        </TRPCProvider>
      </body>
    </html>
  );
}
