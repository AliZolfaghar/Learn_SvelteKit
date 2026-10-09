/**
 * تنظیمات PM2
 *
 * حالت ۱ — مستقیم با سرور داخلی Kit:
 *   pm2 start ecosystem.config.cjs --only learn-sveltekit
 *
 * حالت ۲ — با Express:
 *   pm2 start ecosystem.config.cjs --only learn-sveltekit-express
 *
 * قبل از هر دو: npm run build
 */
module.exports = {
	apps: [
		{
			name: 'learn-sveltekit',
			script: 'build/index.js',
			instances: 1,
			exec_mode: 'fork',
			env: {
				NODE_ENV: 'production',
				PORT: 3000,
				HOST: '0.0.0.0'
			}
		},
		{
			name: 'learn-sveltekit-express',
			script: 'server.js',
			instances: 1,
			exec_mode: 'fork',
			env: {
				NODE_ENV: 'production',
				PORT: 3000,
				HOST: '0.0.0.0'
			}
		}
	]
};
