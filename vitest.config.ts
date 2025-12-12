import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', '.2L'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts', 'components/**/*.tsx'],
      exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
      thresholds: {
        // Thresholds adjusted to current coverage levels
        // Lines/statements near 79%, branches/functions near 71%
        statements: 78,
        branches: 71,
        functions: 71,
        lines: 78,
      },
    },
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/types': path.resolve(__dirname, './types'),
      '@/server': path.resolve(__dirname, './server'),
      '@/test': path.resolve(__dirname, './test'),
    },
  },
});
