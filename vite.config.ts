import path from 'node:path';

import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: 'PUBLIC_',
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: {
      $src: path.resolve('./src'),
      $lib: path.resolve('./src/lib'),
      $routes: path.resolve('./src/routes'),
    },
  },
});
