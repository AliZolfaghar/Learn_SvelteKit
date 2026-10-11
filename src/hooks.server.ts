import { db } from '#lib/server/db/index.js';

/**
 * `init` فقط یک‌بار اجرا می‌شود — وقتی پروسهٔ سرور بالا می‌آید
 * (قبل از پاسخ به اولین درخواست)، نه در هر جابه‌جایی صفحه.
 *
 * کاربرد این پروژه: اعمال migrationهای مانده.
 */
export const init = async () => {
	console.info('[hooks.server init] server starting — running migrations');
	await db.migrate.latest();
	console.info('[hooks.server init] migrations ready');
};

/**
 * `handle` برای هر درخواست HTTP که به سرور Kit می‌رسد اجرا می‌شود:
 * - بار اول صفحه (full load)
 * - درخواست‌های `load` سرور هنگام client-side navigation
 * - form actions، +server، …
 *
 * این همان «hook در هر درخواست» سمت سرور است.
 * @type {import('@sveltejs/kit').Handle}
 */
export const handle = async ({ event, resolve }) => {
	const started = Date.now();
	event.locals.requestStartedAt = started;

	console.info(
		`[hooks.server handle] ${event.request.method} ${event.url.pathname}${event.url.search}`
	);

	const response = await resolve(event);

	console.info(
		`[hooks.server handle] ${event.request.method} ${event.url.pathname} → ${response.status} (${Date.now() - started}ms)`
	);

	return response;
};
