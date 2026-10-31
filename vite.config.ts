import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export default defineConfig({
  base: '/pokemetrics/',
  server: { watch: { ignored: ['**/public/media/**', '**/public/data/**'] } },
  plugins: [svelte(), tailwindcss(), {
    name: 'pokemetrics-offline', apply: 'build',
    async writeBundle(options, bundle) {
      const output = resolve(options.dir ?? 'dist');
      const files = ['index.html', 'emulator.html', 'manifest.webmanifest', 'favicon.svg', 'icon-192.png', 'icon-512.png', ...Object.keys(bundle).filter(name => /\.(js|css)$/.test(name))];
      const template = await readFile('scripts/service-worker.js', 'utf8');
      const version = createHash('sha256').update(files.join(',') + template).digest('hex').slice(0, 16);
      await writeFile(resolve(output, 'sw.js'), template.replace('__SHELL_CACHE__', `pokemetrics-shell-${version}`).replace('__SHELL_FILES__', JSON.stringify(files)));
      const vendor = await readdir('public/emulator/vendor/4.2.3', { recursive: true, withFileTypes: true });
      const player = vendor.filter(file => file.isFile() && !file.parentPath.replaceAll('\\', '/').includes('/src')).map(file => resolve(file.parentPath, file.name).slice(resolve('public').length + 1).replaceAll('\\', '/'));
      await writeFile(resolve(output, 'offline-player.json'), JSON.stringify(player));
    },
  }],
  build: { rollupOptions: { input: { app: 'index.html', emulator: 'emulator.html' } } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
