import path from 'node:path';

import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    runes: true,
  },
  kit: {
    adapter: adapter({
      out: 'build',
      precompress: false,
    }),
    alias: {
      $core: path.resolve('./src/core'),
      $features: path.resolve('./src/features'),
      $src: path.resolve('./src'),
      $lib: path.resolve('./src/lib'),
      $routes: path.resolve('./src/routes'),
    },
  },
};

export default config;
