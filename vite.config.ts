import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/pokemetrics/',
  server: { watch: { ignored: ['**/public/media/**', '**/public/data/**'] } },
  plugins: [svelte(), tailwindcss()],
  build: { rollupOptions: { input: { app: 'index.html', emulator: 'emulator.html' } } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
