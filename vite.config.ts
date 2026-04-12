import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: 'PUBLIC_',
  plugins: [tailwindcss(), sveltekit()],
});
