import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks: (id) => id.includes('/node_modules/zod/') ? 'validation-vendor' : ['/node_modules/react/','/node_modules/react-dom/','/node_modules/scheduler/','/node_modules/react-router/','/node_modules/react-router-dom/'].some((path)=>id.includes(path)) ? 'react-vendor' : undefined } } },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    // Keep the full suite reliable on this Windows workstation without competing worker heaps.
    maxWorkers: 1,
    testTimeout: 60000,
  },
});
