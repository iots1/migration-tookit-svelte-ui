import adapter from '@sveltejs/adapter-static';
import path from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: true
	},
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		alias: {
			$core: path.resolve('./src/core'),
			$features: path.resolve('./src/features')
		}
	}
};

export default config;
