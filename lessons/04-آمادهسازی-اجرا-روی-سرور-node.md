# درس ۴: آماده‌سازی SvelteKit برای اجرا روی سرور Node.js

## هدف درس
بعد از این درس، شاگرد می‌داند چرا برای سرور شخصی باید از `adapter-node` استفاده کند، پروژه را برای production آماده می‌کند، و فرق دو حالت اجرا را می‌فهمد:
1. اجرای مستقیم با **PM2**
2. اجرای پشت یک سرور **Express**

## پیش‌نیاز
- درس‌های ۱ تا ۳
- آشنایی اولیه با Node.js و ترمینال
- (اختیاری) آشنایی با PM2 و Express

---

## قدم ۱: چرا `adapter-auto` کافی نیست؟

`adapter-auto` برای پلتفرم‌هایی مثل Vercel/Netlify خوب است و محیط را حدس می‌زند.

اما وقتی می‌گویی:
> برنامه روی **سرور خودم** با Node.js اجرا می‌شود

باید خروجی مشخص Node بسازی. ابزار درست: **`@sveltejs/adapter-node`**.

این adapter بعد از `npm run build` دو نقطهٔ ورود مهم می‌سازد:

| فایل | کاربرد |
|------|--------|
| `build/index.js` | سرور آمادهٔ خود Kit → مستقیم با Node/PM2 اجرا می‌شود |
| `build/handler.js` | یک handler برای وصل کردن به Express/Connect/Polka |

---

## قدم ۲: تغییراتی که در این پروژه اعمال شد

### ۱) نصب پکیج‌ها
- حذف: `@sveltejs/adapter-auto`
- اضافه: `@sveltejs/adapter-node`
- اضافه: `express` (برای حالت دوم)

### ۲) `vite.config.ts`
به‌جای `adapter-auto` الان این را داریم:

```ts
import adapter from '@sveltejs/adapter-node';

adapter: adapter({
  out: 'build',
  precompress: true
})
```

| گزینه | معنی |
|--------|------|
| `out: 'build'` | خروجی production داخل فولدر `build/` |
| `precompress: true` | ساخت فایل‌های فشرده `.gz` / `.br` برای سرو سریع‌تر |

### ۳) اسکریپت‌های جدید در `package.json`

| دستور | کار |
|--------|-----|
| `npm run build` | ساخت خروجی production |
| `npm start` | اجرای مستقیم سرور Kit (`node build`) |
| `npm run start:express` | اجرا پشت Express (`node server.js`) |

### ۴) فایل‌های کمکی
- `server.js` → سرور Express نمونه
- `ecosystem.config.cjs` → تنظیم PM2 برای هر دو حالت
- `.env.example` → نمونه متغیرهای محیطی

---

## قدم ۳: حالت ۱ — اجرای خود برنامه با PM2

### جریان کار

```bash
npm run build
pm2 start ecosystem.config.cjs --only learn-sveltekit
```

یا بدون ecosystem:

```bash
npm run build
PORT=3000 HOST=0.0.0.0 pm2 start build/index.js --name learn-sveltekit
```

در این حالت PM2 مستقیماً `build/index.js` را نگه می‌دارد (ری‌استارت خودکار، لاگ، مانیتورینگ).

همچنین می‌توانی بدون PM2 تست کنی:

```bash
npm run build
npm start
```

### خوبی‌ها
- ساده‌ترین مسیر رسمی SvelteKit
- متغیرهایی مثل `PORT` و `HOST` توسط خود سرور Kit پشتیبانی می‌شوند
- لایه‌ی اضافه نداری؛ باگ و سربار کمتر
- برای بیشتر اپ‌های معمولی کافی و تمیز است
- با PM2 به‌راحتی cluster/ری‌استارت/لاگ می‌گیری

### بدی‌ها / محدودیت‌ها
- اگر از قبل یک سرور Express بزرگ داری، همه‌چیز را جداگانه نگه می‌داری مگر ادغام کنی
- مسیرهای سفارشی خارج از SvelteKit (مثل `/healthcheck` جدا، پروکسی خاص، آپلود پیچیده) را باید جای دیگری حل کنی یا به Express بروی
- کنترل lifecycle سرور محدودتر از وقتی است که خودت `listen` را نوشته باشی

**چه زمانی انتخابش کن؟**  
وقتی اپ عمدتاً همان SvelteKit است و فقط می‌خواهی پایدار روی سرور شخصی بالا بماند.

---

## قدم ۴: حالت ۲ — اجرا با سرور Express خودت

### جریان کار

```bash
npm run build
npm run start:express
```

یا با PM2:

```bash
npm run build
pm2 start ecosystem.config.cjs --only learn-sveltekit-express
```

### منطق `server.js` (خلاصه)

```js
import express from 'express';
import { handler } from './build/handler.js';

const app = express();

app.get('/healthcheck', (_req, res) => {
  res.status(200).send('ok');
});

// اول مسیرهای خودت، بعد SvelteKit
app.use(handler);

app.listen(port, host);
```

قانون طلایی:
1. مسیرهای Express خودت را **قبل** از `handler` بگذار
2. بقیه را به SvelteKit بسپار (`app.use(handler)`)

### نکتهٔ مهم متغیرهای محیطی
وقتی از `handler.js` داخل Express استفاده می‌کنی:
- چیزهایی مثل `ORIGIN` و هدرهای پروکسی روی handler اثر دارند
- ولی `PORT` / `HOST` دیگر خودکار توسط Kit خوانده نمی‌شوند؛ **خودت در Express** باید `listen` کنی (در `server.js` همین کار شده)

### خوبی‌ها
- می‌توانی API قدیمی Express، webhook، healthcheck، یا middlewareهای موجود را کنار SvelteKit نگه داری
- کنترل کامل روی سرور HTTP (timeout، middleware امنیتی، مسیرهای خاص)
- مهاجرت تدریجی از یک بک‌اند Express به SvelteKit راحت‌تر است
- همچنان می‌توانی همین `server.js` را با PM2 اجرا کنی

### بدی‌ها / هزینه‌ها
- یک لایهٔ اضافه داری: پیچیدگی بیشتر، دیباگ سخت‌تر
- ممکن است middleware Express با رفتار Kit تداخل کند (body parser، CORS، static و …)
- باید حواست به ترتیب middlewareها باشد
- بخشی از امکانات lifecycle سرور داخلی Kit را خودت باید پیاده کنی
- برای شاگرد تازه‌کار، مسیر مستقیم PM2 معمولاً ساده‌تر و کم‌خطاتر است

**چه زمانی انتخابش کن؟**  
وقتی از قبل Express داری، یا به مسیر/middleware خارج از Kit واقعاً نیاز داری.

---

## قدم ۵: مقایسهٔ سریع دو حالت

| موضوع | PM2 روی `build/index.js` | Express + `handler` |
|--------|---------------------------|----------------------|
| سادگی | بالاتر | متوسط |
| کنترل سفارشی سرور | کمتر | بیشتر |
| سازگاری با بک‌اند قدیمی Express | ضعیف‌تر | عالی |
| پشتیبانی آماده از `PORT`/`HOST` | بله | باید خودت بنویسی |
| مناسب کلاس/شروع | خیلی مناسب | وقتی نیاز واقعی باشد |
| می‌توان با PM2 اجرا کرد؟ | بله | بله |

جمع‌بندی پیشنهادی برای این دوره:
- پیش‌فرض کلاس: **حالت ۱ (PM2 مستقیم)**
- حالت ۲ فقط وقتی Express لازم است

---

## قدم ۶: استقرار عملی روی سرور (چک‌لیست)

1. کد را روی سرور بگیر / آپلود کن
2. `npm ci` یا `npm install`
3. `npm run build`
4. متغیرها را تنظیم کن (`PORT`, `HOST`, در صورت نیاز `ORIGIN`)
5. یکی از دو حالت را اجرا کن:
   - `pm2 start ecosystem.config.cjs --only learn-sveltekit`
   - یا `pm2 start ecosystem.config.cjs --only learn-sveltekit-express`
6. ترجیحاً جلوی آن Nginx/Caddy برای HTTPS بگذار و به پورت Node پروکسی کن

نمونهٔ مفهومی Nginx:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

اگر پشت پروکسی هستی، معمولاً `ORIGIN` را هم درست تنظیم کن.

---

## جمع‌بندی
- برای سرور شخصی Node: از **`adapter-node`** استفاده کن
- خروجی مهم: `build/index.js` و `build/handler.js`
- حالت ۱: PM2 مستقیم روی Kit → ساده و رسمی
- حالت ۲: Express + handler → انعطاف بیشتر، پیچیدگی بیشتر
- در این ریپو هر دو حالت آماده شده‌اند

## تمرین
1. یک‌بار `npm run build` بزن و بگو داخل `build/` چه فایل‌های ورودی می‌بینی.
2. تفاوت `npm start` و `npm run start:express` را آزمایش کن و `/healthcheck` را فقط در یکی از آن‌ها تست کن.
3. بنویس برای یک فروشگاه سادهٔ فقط-SvelteKit کدام حالت را انتخاب می‌کنی و چرا.
4. بنویس اگر از قبل `/api/old` روی Express داری و می‌خواهی کم‌کم به Kit مهاجرت کنی، کدام حالت بهتر است.
