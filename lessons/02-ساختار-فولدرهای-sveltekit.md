# درس ۲: ساختار فولدرها و فایل‌های پروژه SvelteKit

## هدف درس
بعد از این درس، شاگرد می‌تواند ساختار یک پروژهٔ SvelteKit (نسخهٔ ۳) را بخواند، نقش هر فولدر و فایل مهم را توضیح دهد و بداند برای تغییر صفحه، استایل مشترک، یا فایل ثابت به کجا برود.

## پیش‌نیاز
- درس ۱: ساخت پروژه خام با `npx sv create`
- داشتن یک پروژهٔ ساخته‌شده در همین ریپو (مثل پروژه‌ای که با `npx sv create .` ساختی)

## قدم ۱: تصویر کلی ساختار

پروژهٔ فعلی تقریباً این شکلی است:

```text
Learn_SvelteKit/
├── src/
│   ├── lib/
│   │   ├── assets/
│   │   │   └── favicon.svg
│   │   └── index.ts
│   ├── routes/
│   │   ├── +layout.svelte
│   │   └── +page.svelte
│   ├── app.d.ts
│   └── app.html
├── static/
│   └── robots.txt
├── lessons/                 ← درس‌های کلاس ما (جزء SvelteKit نیست)
├── .cursor/                 ← تنظیمات Cursor (جزء SvelteKit نیست)
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── .npmrc
├── .gitignore
└── README.md
```

دو بخش خیلی مهم را جدا کن:
1. **کد برنامه** → عمدتاً داخل `src/`
2. **تنظیمات پروژه** → فایل‌های ریشه مثل `package.json` و `vite.config.ts`

## قدم ۲: فولدر `src/` — قلب برنامه

تقریباً همهٔ کدی که می‌نویسی اینجا است.

### `src/routes/` — صفحات و مسیرها

این مهم‌ترین فولدر برای تازه‌کارهاست.

| فایل | نقش |
|------|-----|
| `+page.svelte` | محتوای صفحهٔ اصلی (`/`) |
| `+layout.svelte` | قالب مشترک دور صفحات (هدر، فوتر، فاوآیکون و …) |

در پروژهٔ تو:

- `+page.svelte` همان متن «Welcome to SvelteKit» را نشان می‌دهد.
- `+layout.svelte` فاوآیکون را می‌گذارد و با `{@render children()}` صفحهٔ فرزند را داخل خودش نشان می‌دهد.

قانون کلی:
- مسیر URL از نام فولدرهای داخل `routes` ساخته می‌شود.
- مثال بعدی: اگر `src/routes/about/+page.svelte` بسازی، آدرس `/about` ساخته می‌شود.

### `src/lib/` — کدهای مشترک و قابل استفاده مجدد

اینجا کامپوننت‌ها، توابع کمکی، استورها و assetهایی را می‌گذاری که بین صفحات مشترک‌اند.

در پروژهٔ تو:
- `src/lib/index.ts` نقطهٔ ورود ساده برای `#lib` است.
- `src/lib/assets/favicon.svg` تصویر فاوآیکون است.

### alias به نام `#lib`

در SvelteKit 3 به‌جای `$lib` قدیمی، از **`#lib`** استفاده می‌شود.

در `package.json` این تنظیم را می‌بینی:

```json
"imports": {
  "#lib": "./src/lib/index.js",
  "#lib/*": "./src/lib/*"
}
```

یعنی وقتی می‌نویسی:

```ts
import favicon from '#lib/assets/favicon.svg';
```

در واقع از `src/lib/assets/favicon.svg` می‌خوانی.

### `src/app.html` — اسکلت HTML کل سایت

این فایل قالب پایهٔ HTML است. دو جایگذاری مهم دارد:

| علامت | معنی |
|--------|------|
| `%sveltekit.head%` | تگ‌های head (مثل title و linkها) |
| `%sveltekit.body%` | محتوای اصلی اپ |

همچنین `data-sveltekit-preload-data="hover"` باعث می‌شود وقتی موس روی لینک می‌رود، دادهٔ صفحه از قبل بارگذاری شود.

### `src/app.d.ts` — تایپ‌های سراسری اپ

اینجا می‌توانی تایپ‌های سراسری App را تعریف کنی (مثل `Locals`, `PageData`, `Error`). فعلاً خالی و آماده‌اند؛ وقتی احراز هویت یا دادهٔ سراسری اضافه کنی، اینجا به کار می‌آید.

## قدم ۳: فولدر `static/` — فایل‌های ثابت

هر فایلی که داخل `static/` بگذاری، بدون پردازش خاص، از ریشهٔ سایت در دسترس است.

مثال فعلی:
- `static/robots.txt` → در آدرس `/robots.txt`

کاربردهای رایج:
- تصویرهایی که لازم نیست import شوند
- `favicon.ico` (اگر بخواهی از این روش استفاده کنی)
- فایل‌های عمومی مثل `manifest` یا اسناد ثابت

تفاوت با `src/lib/assets`:
- `static/` → آدرس مستقیم مثل `/robots.txt`
- `src/lib/assets` → معمولاً با import و hash در build (بهینه برای باندل)

## قدم ۴: فایل‌های ریشهٔ پروژه

### `package.json`
شناسنامهٔ پروژه:
- نام و نسخه
- اسکریپت‌ها (`dev`, `build`, `preview`, `check`)
- وابستگی‌ها (`svelte`, `@sveltejs/kit`, `vite`, …)
- تنظیم `#lib`

اسکریپت‌های مهم:

| دستور | کار |
|--------|-----|
| `npm run dev` | اجرای سرور توسعه |
| `npm run build` | ساخت نسخهٔ نهایی |
| `npm run preview` | پیش‌نمایش نسخهٔ buildشده |
| `npm run check` | بررسی تایپ و خطاهای Svelte |

### `vite.config.ts`
در SvelteKit 3، تنظیمات اصلی (از جمله **adapter**) اینجا و داخل پلاگین `sveltekit(...)` قرار دارد؛ دیگر لزوماً فایل جداگانهٔ `svelte.config.js` در قالب minimal نمی‌بینی.

در پروژهٔ تو:
- `adapter-auto` برای انتخاب خودکار محیط استقرار
- `runes: true` برای اجبار حالت جدید Svelte 5 در کد پروژه

### `tsconfig.json`
تنظیمات TypeScript. از `$app/tsconfig` ارث می‌برد و `strict` روشن است.

### `.npmrc`
الان `engine-strict=true` دارد؛ یعنی اگر نسخهٔ Node با نیاز پروژه جور نباشد، npm سخت‌گیرانه‌تر برخورد می‌کند.

### `.gitignore`
می‌گوید چه چیزهایی داخل Git نروند (مثل `node_modules` و خروجی build).

### `package-lock.json`
نسخهٔ دقیق پکیج‌های نصب‌شده را قفل می‌کند تا نصب روی سیستم‌های مختلف یکسان باشد.

## قدم ۵: فولدرهایی که بعداً می‌بینی (هنوز در قالب minimal ساخته نشده‌اند)

این‌ها جزء ساختار کامل‌تر SvelteKit هستند و وقتی نیاز شد اضافه می‌شوند:

| مسیر | کاربرد |
|------|--------|
| `src/routes/+page.ts` / `+page.server.ts` | بارگذاری داده برای صفحه |
| `src/routes/+layout.ts` / `+layout.server.ts` | دادهٔ مشترک لایه‌ها |
| `src/routes/+error.svelte` | صفحهٔ خطا |
| `src/hooks.server.ts` | منطق سمت سرور قبل از درخواست‌ها |
| `src/params/` | اعتبارسنجی پارامترهای داینامیک مسیر |
| `.svelte-kit/` | خروجی داخلی tooling (معمولاً gitignore می‌شود و دستی ویرایش نمی‌شود) |
| `build/` یا خروجی adapter | نتیجهٔ `npm run build` |

## قدم ۶: مسیر خواندن یک درخواست (درک جریان)

وقتی کاربر `/` را باز می‌کند:

1. `app.html` اسکلت HTML را می‌سازد
2. `+layout.svelte` قالب مشترک را اعمال می‌کند
3. `+page.svelte` محتوای همان مسیر را نشان می‌دهد
4. assetهایی مثل favicon از `#lib/...` یا `static/` می‌آیند

این مدل را به خاطر بسپار: **Layout دور Page می‌پیچد**.

## جمع‌بندی
- `src/routes` = صفحات و URLها
- `src/lib` + `#lib` = کد و asset مشترک
- `src/app.html` = اسکلت HTML
- `static` = فایل‌های ثابت عمومی
- `vite.config.ts` = تنظیم Vite + SvelteKit + adapter
- `package.json` = اسکریپت‌ها و وابستگی‌ها
- فولدرهایی مثل `lessons/` مربوط به کلاس‌اند، نه خود فریمورک

## تمرین
1. بدون نگاه کردن به این درس، نقش این سه مورد را بنویس: `+page.svelte`، `+layout.svelte`، `static/`.
2. یک فایل `static/hello.txt` بساز و در مرورگر آدرس `/hello.txt` را باز کن. چه اتفاقی می‌افتد؟
3. توضیح بده تفاوت `#lib/assets/favicon.svg` با گذاشتن همان فایل داخل `static/` چیست.
4. بگو اگر بخواهیم صفحهٔ `/contact` بسازیم، دقیقاً چه فایلی باید اضافه کنیم.
