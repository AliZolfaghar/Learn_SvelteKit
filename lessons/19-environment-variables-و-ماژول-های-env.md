# درس ۱۹: Environment Variables در SvelteKit (`$env/*` و مدل جدید `$app/env`)

## هدف درس
بعد از این درس می‌فهمی در SvelteKit متغیر محیطی چطور به کد می‌رسد، معنی `$env/static/public` و `$env/dynamic/private` چیست، چرا در SvelteKit ۳ این ماژول‌ها deprecated شده‌اند، و معادل مدرن‌شان با `src/env.ts` و `$app/env/public` / `$app/env/private` چطور کار می‌کند.

## پیش‌نیاز
- درس ۵ (فایل `.env` و مفاهیم پایه)
- دانستن اینکه پروژهٔ فعلی **SvelteKit 3** است
- فرق کد سرور (`+page.server.ts`) با کد کلاینت (`.svelte` در مرورگر)

---

## قدم ۱: یادآوری — env چیست؟

متغیر محیطی مقداری بیرون از سورس است:

```env
API_KEY=secret-do-not-commit
PUBLIC_SITE_NAME=کلاس SvelteKit
PORT=3000
```

- در dev/build معمولاً از `.env` / `.env.local` می‌آید  
- در پروداکشن از سیستم، PM2، Docker و …  
- رازها نباید commit شوند (درس ۵)

در `server.js` همین پروژه هنوز با Node خام می‌خوانی:

```js
const port = Number(process.env.PORT) || 3000;
```

داخل اپ SvelteKit معمولاً از ماژول‌های مخصوص Kit استفاده می‌کنی — نه لزوماً `process.env` همه‌جا.

---

## قدم ۲: دو سؤال امنیتی قبل از هر متغیر

برای هر env از خودت بپرس:

1. **آیا مرورگر اجازه دارد ببیندش؟**  
   - بله → public  
   - خیر → private (فقط سرور)
2. **مقدار کی قفل شود؟**  
   - موقع **build** → static (داخل باندل inline می‌شود)  
   - موقع **اجرای اپ** → dynamic (از محیط runtime خوانده می‌شود)

از تلاقی این دو سؤال، چهار حالت کلاسیک ساخته شد.

---

## قدم ۳: چهار ماژول قدیمی `$env/*` (همان چیزی که پرسیدی)

این‌ها مدل SvelteKit ۲ بودند و هنوز در خیلی از آموزش‌ها دیده می‌شوند:

| ماژول | عمومی؟ | کی خوانده می‌شود | کاربرد ذهنی |
|--------|--------|-------------------|-------------|
| `$env/static/private` | خیر | build-time | رازهایی که در زمان build معلوم‌اند |
| `$env/static/public` | بله (`PUBLIC_*`) | build-time | مقادیر عمومی برای بهینه‌سازی باندل |
| `$env/dynamic/private` | خیر | runtime | رازهایی که روی سرور در اجرا عوض می‌شوند |
| `$env/dynamic/public` | بله (`PUBLIC_*`) | runtime | مقادیر عمومی که در اجرا خوانده می‌شوند |

### قاعدهٔ نام‌گذاری قدیمی برای public

در مدل `$env`، متغیرهای قابل‌ارسال به کلاینت باید با پیشوند **`PUBLIC_`** شروع می‌شدند:

```env
PUBLIC_API_BASE=https://api.example.com
SECRET_KEY=never-in-browser
```

### مثال مفهومی (مدل قدیمی)

```ts
// فقط سرور — مثلاً +page.server.ts
import { SECRET_KEY } from '$env/static/private';
// یا
import { env } from '$env/dynamic/private';
const key = env.SECRET_KEY;
```

```ts
// قابل استفاده در کلاینت
import { PUBLIC_API_BASE } from '$env/static/public';
// یا
import { env } from '$env/dynamic/public';
const base = env.PUBLIC_API_BASE;
```

| شکل import | معنی |
|------------|------|
| `import { NAME } from '$env/static/...'` | مقدار در build داخل کد می‌نشیند |
| `import { env } from '$env/dynamic/...'` | شیء شبیه `process.env` در زمان اجرا |

### هشدار برای همین پروژه (SvelteKit 3)

> ماژول‌های `$env/*` در SvelteKit ۳ **deprecated** شده‌اند و در SvelteKit ۴ حذف می‌شوند.  
> مسیر رسمی جدید: **explicit environment variables** با `src/env.ts`.

پس این قدم را برای فهم تاریخچه و خواندن کد/مقالات قدیمی یاد بگیر؛ برای کد جدید پروژه از قدم ۴ به بعد استفاده کن.

---

## قدم ۴: مدل جدید SvelteKit 3 — تعریف صریح در `src/env.ts`

به‌جای چهار ماژول جادویی، اعلام می‌کنی اپ به کدام متغیرها وابسته است:

```ts
// src/env.ts
import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	// خصوصی (پیش‌فرض) — فقط سرور
	API_KEY: {},

	// عمومی — قابل استفاده در مرورگر
	GOOGLE_ANALYTICS_ID: {
		public: true
	},

	// عمومی + static — مقدار build داخل باندل می‌رود
	SHOW_DEBUG_OVERLAY: {
		public: true,
		static: true,
		schema: (value) => value !== undefined && value !== ''
	},

	// خصوصی با اعتبارسنجی / پیش‌فرض
	PORT: {
		schema: (value) => {
			if (value === undefined) return 3000;
			const port = Number(value);
			if (!Number.isInteger(port)) throw new Error('PORT must be an integer');
			return port;
		}
	}
});
```

سپس در کد:

```ts
import { API_KEY } from '$app/env/private';
import { GOOGLE_ANALYTICS_ID } from '$app/env/public';
```

| ماژول جدید | معنی |
|------------|------|
| `$app/env/private` | فقط سرور — import در کلاینت خطا می‌دهد |
| `$app/env/public` | مجاز در کلاینت و سرور |

در `app.html` برای متغیر public:

```html
%sveltekit.env.GOOGLE_ANALYTICS_ID%
```

پروژهٔ فعلی هنوز `src/env.ts` ندارد؛ وقتی خواستی env داخل اپ Kit استفاده کنی، همین فایل را اضافه می‌کنی.

---

## قدم ۵: جدول مهاجرت ذهنی — قدیم → جدید

| مفهوم قدیمی | مفهوم جدید |
|-------------|------------|
| `$env/static/private` | تعریف در `env.ts` بدون `public` + معمولاً `static: true` در صورت نیاز به inline |
| `$env/dynamic/private` | تعریف خصوصی پیش‌فرض (**dynamic** به‌طور پیش‌فرض) → `$app/env/private` |
| `$env/static/public` + `PUBLIC_*` | `{ public: true, static: true }` → `$app/env/public` (پیشوند `PUBLIC_` دیگر اجباری قرارداد اصلی نیست؛ خودت `public: true` می‌دهی) |
| `$env/dynamic/public` + `PUBLIC_*` | `{ public: true }` → `$app/env/public` |
| پیشوند اجباری `PUBLIC_` | فلگ `public: true` در `defineEnvVars` |

نکته: در مدل جدید، **پیش‌فرض dynamic است**؛ static را صریح روشن می‌کنی.  
در مدل قدیمی، «static» و «dynamic» دو ماژول جدا بودند.

---

## قدم ۶: `static: true` دقیقاً چه می‌کند؟

```ts
SHOW_DEBUG_OVERLAY: {
	public: true,
	static: true,
	schema: (value) => Boolean(value && value !== '')
}
```

- مقدار در **زمان build** داخل کد می‌نشیند  
- برای بهینه‌سازی عالی است: اگر false باشد، کامپایلر می‌تواند شاخهٔ debug را از باندل حذف کند (dead-code elimination)  
- بعد از build، عوض کردن env روی سرور **آن مقدار static را عوض نمی‌کند** مگر دوباره build کنی  

پس:

| نوع | مناسب برای |
|-----|------------|
| dynamic (پیش‌فرض) | کلید API پروداکشن، تنظیمات سرور که per-deploy عوض می‌شود بدون rebuild کامل ایده |
| static | فلگ فیچر build-time، چیزهایی که می‌خواهی در باندل بهینه شوند |

برای رازهایی که در هر محیط فرق دارند، معمولاً **dynamic private** امن‌تر و عملی‌تر است.

---

## قدم ۷: اعتبارسنجی (Validation)

با Standard Schema (Valibot/Zod) یا تابع خودت:

```ts
import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
	API_URL: {
		schema: v.pipe(v.string(), v.url())
	}
});
```

اگر مقدار نامعتبر باشد، اپ در start یا build شکست می‌خورد — بهتر از خطای عجیب وسط درخواست کاربر.

گاهی موقع `building` مقدار را اختیاری می‌کنی و موقع اجرای واقعی اجباری (با کمک `building` از `$app/env`).

---

## قدم ۸: کجا کدام را import کنی؟

### فقط سرور

```ts
// +page.server.ts / hooks.server.ts / *.server.ts / remote server code
import { API_KEY } from '$app/env/private';
```

### کلاینت یا مشترک

```ts
// +page.svelte / کامپوننت UI
import { GOOGLE_ANALYTICS_ID } from '$app/env/public';
```

اگر private را در کامپوننت کلاینت import کنی، Kit جلویش را می‌گیرد — این ویژگی است نه باگ.

### بیرون از Kit (مثل `server.js` Express)

اینجا ماژول‌های `$app/env/...` معمولاً همان مسیر اپ Kit نیستند.  
برای پورت/هاست Express همان `process.env` درس ۵ کافی است:

```js
const port = Number(process.env.PORT) || 3000;
```

---

## قدم ۹: جریان از `.env` تا UI

```text
.env / سیستم‌عامل / PM2
        │
        ▼
Vite/Kit در dev و build محیط را پر می‌کند
        │
        ▼
src/env.ts  →  defineEnvVars({ ... })
        │
        ├─ public: false  →  $app/env/private  →  فقط سرور
        │
        └─ public: true   →  $app/env/public   →  سرور + مرورگر
                              (+ اختیاری static: true برای inline در build)
```

قانون امنیتی تغییر نکرده:

> هر چیز public را فرض کن همه می‌بینند.  
> رمز دیتابیس، کلید پرداخت، توکن ادمین → همیشه private.

---

## قدم ۱۰: ارتباط با `.env.example` همین پروژه

الان نمونه داری:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
# ORIGIN=https://example.com
```

این‌ها بیشتر برای **اجرای Node/PM2/Express**اند.  
برای استفاده داخل صفحات Kit، قدم بعدی منطقی:

1. ساخت `src/env.ts`  
2. تعریف متغیرهایی که واقعاً در کد اپ می‌خوانی  
3. import از `$app/env/private` یا `public`  
4. نگه‌داشتن `.env.example` هم‌نام با همان کلیدها برای تیم  

`PORT`/`HOST` را می‌توانی در `env.ts` هم تعریف کنی؛ ولی `server.js` همچنان می‌تواند مستقیم `process.env` بخواند.

---

## قدم ۱۱: `$app/env` جدا از `$app/env/public|private`

علاوه بر متغیرهای خودت، ماژول `$app/env` چیزهایی مثل وضعیت build/dev را می‌دهد (مثلاً `building`).  
این را با متغیرهای `.env` قاطی نکن:

| ماژول | محتوا |
|--------|--------|
| `$app/env` | فلگ‌های محیطی فریم‌ورک (مثل building) |
| `$app/env/private` | envهای تعریف‌شدهٔ خصوصی تو |
| `$app/env/public` | envهای تعریف‌شدهٔ عمومی تو |

(نام قدیمی `$app/environment` در مهاجرت به ۳ به `$app/env` نزدیک شده؛ جزئیات را در migrating guide ببین.)

---

## قدم ۱۲: اشتباهات رایج

1. **گذاشتن راز در public / یا قدیم با `PUBLIC_`**  
2. **import کردن `$app/env/private` (یا `$env/.../private`) در کامپوننت کلاینت**  
3. **static کردن رازی که باید per-environment عوض شود بدون rebuild**  
4. **فرض اینکه `process.env` در مرورگر مثل Node کار می‌کند**  
5. **استفاده از `$env/*` در پروژهٔ Kit 3 جدید بدون دانستن deprecation**  
6. **تعریف نکردن متغیر در `src/env.ts` و انتظار autocomplete/ایمنی**  
7. **commit کردن `.env` واقعی**  

---

## قدم ۱۳: چک‌لیست عملی برای شاگرد

1. در `.env` مقدار را بگذار (و در `.env.example` نام بدون راز)  
2. در `src/env.ts` با `defineEnvVars` تعریف کن  
3. `public: true` فقط اگر واقعاً عمومی است  
4. `static: true` فقط اگر build-time می‌خواهی  
5. در کد سرور از `$app/env/private` بخوان  
6. در UI از `$app/env/public` بخوان  
7. برای Express/`server.js` در صورت نیاز همان `process.env`  
8. `npm run check` / اجرای dev برای دیدن خطای validation  

---

## جمع‌بندی

- env مقادیر بیرون از کدند؛ رازها private می‌مانند، چیزهای بی‌خطر می‌توانند public باشند.  
- مدل قدیمی چهار ماژول داشت: `$env/static|dynamic` × `public|private`.  
- در SvelteKit ۳ آن ماژول‌ها deprecatedاند؛ مسیر رسمی `src/env.ts` + `$app/env/public|private` است.  
- پیش‌فرض جدید: private و dynamic؛ با `public: true` و `static: true` صریح تنظیم کن.  
- `$env/dynamic/private` ≈ متغیر خصوصی runtime در مدل قدیم؛ `$env/static/public` ≈ عمومی build-time.  
- در همین ریپو هنوز `src/env.ts` نداری؛ `.env.example` بیشتر برای Node/PM2 است.  
- هیچ‌وقت فرض نکن چیزی که public کردی مخفی می‌ماند.

## تمرین

1. جدول چهارخانه بکش: برای `API_KEY`، `PUBLIC_SITE_NAME`، فلگ `ENABLE_BETA` (build-time)، و `DATABASE_URL` بگو در مدل قدیم کدام `$env/...` و در مدل جدید چه تنظیم `defineEnvVars` مناسب است.  
2. توضیح بده چرا `import { API_KEY } from '$app/env/private'` داخل `+page.svelte` باید خطا بدهد.  
3. فرق `static: true` با dynamic پیش‌فرض را با مثال «عوض کردن کلید روی سرور بدون rebuild» بنویس.  
4. (امتیازی) یک `src/env.ts` فرضی برای همین پروژه بنویس که `PORT` را با پیش‌فرض ۳۰۰۰ validate کند — فعلاً فقط روی کاغذ کافی است.
