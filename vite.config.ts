import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// خروجی Node برای سرور شخصی (PM2 یا Express)
			adapter: adapter({
				out: 'build',
				precompress: true
			})
		})
	],
	// ماژول‌های native نباید داخل باندل Vite بروند
	ssr: {
		external: ['better-sqlite3', 'knex']
	}
});
