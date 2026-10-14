import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    // Keep the full suite reliable on this Windows workstation without competing worker heaps.
    maxWorkers: 1,
    testTimeout: 15000,
  },
});
