import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/pokemetrics/',
  plugins: [svelte(), tailwindcss()],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
