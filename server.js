/**
 * سرور سفارشی Express برای اجرای خروجی adapter-node
 * استفاده: بعد از `npm run build` → `npm run start:express`
 * یا با PM2: `pm2 start ecosystem.config.cjs --only learn-sveltekit-express`
 */
import express from 'express';
import { handler } from './build/handler.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

// مسیرهای خودت را قبل از handler اضافه کن
app.get('/healthcheck', (_req, res) => {
	res.status(200).send('ok');
});

// بقیهٔ درخواست‌ها را SvelteKit جواب می‌دهد (صفحات، API، static)
app.use(handler);

app.listen(port, host, () => {
	console.log(`Express + SvelteKit listening on http://${host}:${port}`);
});
