# درس ۱۱: Hooks در SvelteKit — راهنمای کامل

## هدف درس
بعد از این درس می‌فهمی **hook** در SvelteKit چیست (و با lifecycle کامپوننت قاطی‌اش نمی‌کنی)، هر فایل hooks چه کار می‌کند، `handle` / `locals` / `handleFetch` / `handleError` / `init` / `reroute` / `transport` را کی استفاده کنی، و چطور به `app.d.ts` وصلشان کنی.

## پیش‌نیاز
- درس ۹ (TypeScript و `App.Locals` / `App.Error`)
- درس ۱۰ (routing و تفاوت `+page` / `+server` / `load`)
- دانستن اینکه درخواست HTTP از مرورگر یا سرور به اپ می‌رسد

---

## قدم ۱: Hook اینجا یعنی چه؟

در SvelteKit، **hooks** توابع سراسریِ اپ هستند که فریم‌ورک در لحظه‌های مشخص صدا می‌زند تا رفتار پیش‌فرض را سفارشی کنی.

مثال‌های ذهنی:

- قبل از رسیدن به صفحه، کاربر را از روی کوکی بشناس  
- برای همهٔ پاسخ‌ها یک هدر امنیتی بگذار  
- خطاها را لاگ کن و پیام امن به کاربر بده  
- بعضی URLها را به مسیر داخلی دیگری نگاشت کن  

### با چه چیزی قاطی نشود؟

| مفهوم | کجاست | کار |
|--------|--------|-----|
| Hooksِ SvelteKit | `src/hooks*.ts` | سراسریِ اپ / درخواست |
| `$effect` و lifecycle کامپوننت | داخل `.svelte` | واکنش به state همان کامپوننت |
| Express middleware | `server.js` (درس ۴) | لایهٔ جدا؛ فعلاً روی مسیر Kit کار می‌کنیم |

این درس فقط دربارهٔ **hooksِ SvelteKit** است.

در پروژهٔ فعلی هنوز فایل hooks نداری — اختیاری‌اند. تا وقتی نسازی، Kit رفتار پیش‌فرض دارد.

---

## قدم ۲: سه فایل hooks

همه اختیاری‌اند:

| فایل | کجا اجرا می‌شود | معمولاً چه چیزی |
|------|------------------|------------------|
| `src/hooks.server.ts` | فقط سرور | `handle`, `handleFetch`, `handleError`, `init` |
| `src/hooks.client.ts` | فقط مرورگر | `handleError`, `init` |
| `src/hooks.ts` | هم سرور هم کلاینت | `reroute`, `transport` |

کد بالای این ماژول‌ها موقع بالا آمدن اپ اجرا می‌شود؛ برای initialize کردن کلاینت DB و مشابه آن هم مناسب‌اند (به‌خصوص با `init`).

---

## قدم ۳: جریان یک درخواست (جای hookها)

برای یک صفحهٔ معمولی تقریباً این ترتیب را در ذهن داشته باش:

```text
درخواست HTTP می‌آید
    │
    ▼
reroute  (hooks.ts)     ← مسیر داخلی را عوض کند؟
    │
    ▼
handle   (hooks.server) ← locals، هدر، یا پاسخ سفارشی
    │
    ▼
resolve(event)          ← loadها + رندر صفحه/endpoint
    │
    ▼
پاسخ Response
```

اگر وسط راه خطا پرتاب شود (و redirect نباشد) → `handleError`.

اگر داخل `load` با `event.fetch` چیزی بگیری → ممکن است از `handleFetch` رد شود.

---

## قدم ۴: `handle` — مهم‌ترین hook سرور

فایل: `src/hooks.server.ts`

هر بار سرور SvelteKit درخواستی را پردازش می‌کند (از جمله هنگام prerender)، `handle` اجرا می‌شود.

ورودی:

- `event` → اطلاعات درخواست (`url`, `cookies`, `request`, `locals`, …)  
- `resolve` → تابعی که می‌گوید «ادامه بده و صفحه/مسیر را رندر کن»

حداقلِ ممکن (پیش‌فرض Kit هم همین است):

```ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
```

### مثال ۱: پاسخ سفارشی بدون رفتن به route

```ts
export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/custom')) {
		return new Response('custom response');
	}
	return resolve(event);
};
```

### مثال ۲: گذاشتن داده روی `locals` (الگوی احراز هویت)

```ts
export const handle: Handle = async ({ event, resolve }) => {
	const session = event.cookies.get('sessionid');
	event.locals.user = session ? await getUser(session) : null;

	const response = await resolve(event);
	response.headers.set('x-custom-header', 'potato');
	return response;
};
```

بعد در `+page.server.ts` یا `+server.ts`:

```ts
export const load: PageServerLoad = async ({ locals }) => {
	return { user: locals.user };
};
```

`locals` فقط سمت سرور است؛ مستقیم به مرورگر نمی‌رود مگر خودت در `load` برگردانی.

### تایپ `locals` در `app.d.ts`

همین پروژه الان این را دارد (کامنت‌شده):

```ts
// interface Locals {}
```

باید فعال و پرش کنی:

```ts
declare global {
	namespace App {
		interface Locals {
			user: { id: string; name: string } | null;
		}
	}
}

export {};
```

بدون این، TypeScript نمی‌داند `event.locals.user` چیست.

### گزینه‌های `resolve(event, options)`

آرگومان دوم اختیاری است:

| گزینه | کار |
|--------|-----|
| `transformPageChunk` | HTML را تکه‌تکه تغییر بده |
| `filterSerializedResponseHeaders` | کدام هدرهای `fetch` داخل `load` به کلاینت سریال شود |
| `preload` | کدام js/css/font از قبل preload شود |

برای شروع کلاس، فقط `locals` و برگرداندن `resolve(event)` کافی است.

### نکات ایمنی

- درخواست فایل‌های استاتیک / صفحات از قبل prerenderشده لزوماً از `handle` رد نمی‌شوند.  
- اگر داخل `handle` خودت `throw` کنی (خارج از مسیر عادی خطاهای Kit)، ممکن است fatal دیده شود؛ `resolve` خودش معمولاً throw نمی‌کند و `Response` با status مناسب می‌دهد.  
- بعضی `Response`ها هدر immutable دارند؛ برای تغییر هدر گاهی باید clone کنی.  
- برای remote functionها، `url`/`params` ممکن است مربوط به **صفحه‌ای که از آن صدا زده شده** باشد، نه endpoint داخلی — برای authorize فقط به آن‌ها تکیه نکن.

---

## قدم ۵: چند `handle` با `sequence`

وقتی منطق را تکه می‌کنی (لاگ، auth، هدر امنیتی):

```ts
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const auth: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	return resolve(event);
};

const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Frame-Options', 'DENY');
	return response;
};

export const handle = sequence(auth, securityHeaders);
```

ترتیب مهم است: اولی زودتر `event` را می‌بیند؛ معمولاً auth قبل از بقیه می‌آید.

---

## قدم ۶: `handleFetch` — دستکاری `event.fetch` روی سرور

فایل: `src/hooks.server.ts`

وقتی در `load` / `action` / endpoint روی **سرور** می‌نویسی `event.fetch(...)` (یا `fetch` مخصوص Kit)، می‌توانی درخواست را قبل از ارسال عوض کنی.

کاربرد کلاسیک: در مرورگر به `https://api.yourapp.com` بزن، ولی در SSR مستقیم به سرویس داخلی:

```ts
import type { HandleFetch } from '@sveltejs/kit';

export const handleFetch: HandleFetch = async ({ request, fetch }) => {
	if (request.url.startsWith('https://api.yourapp.com/')) {
		request = new Request(
			request.url.replace('https://api.yourapp.com/', 'http://localhost:9999/'),
			request
		);
	}
	return fetch(request);
};
```

کاربرد دیگر: پاس دادن دستی `cookie` وقتی دامنهٔ API خواهر/برادر ساب‌دامین است و خودکار جلو نمی‌رود.

`handleFetch` فقط برای fetchهای سمت سرور (و prerender) داخل اکوسیستم Kit است؛ هر `fetch` جهانی در هر جای کد لزوماً از اینجا رد نمی‌شود.

---

## قدم ۷: `handleError` — خطاها را امن و قابل‌ردیابی کن

می‌تواند در **سرور** و **کلاینت** باشد:

- `src/hooks.server.ts` → نوع `HandleServerError`  
- `src/hooks.client.ts` → نوع `HandleClientError`  

هدف دو چیز است:

1. لاگ / ارسال به Sentry و مشابه  
2. ساختن شیء خطای **امن برای کاربر** (بدون stack و راز)

آرگومان مهم: `kind`

| `kind` | معنی |
|--------|------|
| `'app'` | خودت با `error(...)` از `@sveltejs/kit` انداختی |
| `'framework'` | مثل 404 / 405 / 413 از خود Kit |
| `'validation'` | (عمدتاً سرور) آرگومان remote function نامعتبر |
| `'unknown'` | پرتاب خام از کد تو یا کتابخانه — ممکن است حساس باشد |

پیش‌فرض برای `unknown` چیزی شبیه `{ status: 500, message: 'Internal Error' }` است تا جزئیات لو نرود.

مثال آموزشی سرور:

```ts
import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({ error, event, kind }) => {
	if (kind === 'app') {
		return error; // از قبل شکل App.Error را دارد
	}

	const errorId = crypto.randomUUID();
	console.error({ errorId, kind, path: event.url.pathname, error });

	if (kind === 'framework') {
		return { ...error, errorId };
	}

	return {
		message: 'یک خطای داخلی رخ داد',
		errorId
	};
};
```

و در `app.d.ts`:

```ts
interface Error {
	errorId?: string;
}
```

نکات:

- **Redirect خطا نیست** و به `handleError` نمی‌رسد.  
- `handleError` **هرگز نباید خودش throw کند**.  
- خطایی که سرور قبلاً تبدیل کرده، دوباره به hook کلاینت داده نمی‌شود.  
- صفحهٔ `+error.svelte` همان `page.error` را نشان می‌دهد که از اینجا (و defaults) می‌آید.

---

## قدم ۸: `init` — یک‌بار هنگام شروع

در `hooks.server.ts` و/یا `hooks.client.ts`:

```ts
import type { ServerInit } from '@sveltejs/kit';
import * as db from '#lib/server/database';

export const init: ServerInit = async () => {
	await db.connect();
};
```

- سرور: قبل از پاسخ به اولین درخواست  
- کلاینت: هنگام استارت اپ؛ کار سنگین اینجا **hydration را عقب می‌اندازد**  

اگر محیط top-level await داشته باشد، گاهی همان منطق بالای فایل هم کافی است؛ `init` مخصوص محیط‌هایی است که آن را دوست ندارند (مثلاً محدودیت‌های مرورگر قدیمی‌تر).

---

## قدم ۹: `reroute` — تغییر نگاشت URL به route

فایل: `src/hooks.ts` (هم سرور هم کلاینت)

قبل از `handle` اجرا می‌شود و می‌گوید «این pathname را برای پیدا کردن route در نظر بگیر».

مثال: URLهای ترجمه‌شده به یک صفحهٔ داخلی:

```ts
import type { Reroute } from '@sveltejs/kit';

const map: Record<string, string> = {
	'/de/ueber-uns': '/de/about',
	'/fr/a-propos': '/fr/about'
};

export const reroute: Reroute = ({ url }) => {
	return map[url.pathname];
};
```

نکات مهم:

- نوار آدرس مرورگر عوض نمی‌شود؛ `event.url` هم همان URL اصلی می‌ماند  
- چیزی که برمی‌گردانی pathname داخلی برای match کردن route است  
- باید **خالص و بدون side effect** باشد؛ روی کلاینت نتیجه cache می‌شود  
- می‌تواند async باشد و `fetch` بگیرد، ولی باید سریع باشد وگرنه ناوبری کند می‌شود  

---

## قدم ۱۰: `transport` — عبور نوع‌های سفارشی از مرز سرور/کلاینت

فایل: `src/hooks.ts`

خروجی `load` و form actions باید قابل سریالایز باشد. اگر کلاس سفارشی برمی‌گردانی، با `transport` یاد می‌دهی چطور encode/decode شود:

```ts
import type { Transport } from '@sveltejs/kit';
import { Vector } from '#lib/math';

export const transport: Transport = {
	Vector: {
		encode: (value) => value instanceof Vector && [value.x, value.y],
		decode: ([x, y]) => new Vector(x, y)
	}
};
```

برای دادهٔ معمولی (`string`, `number`, آرایه، شیء ساده، `Date`, `Map`, …) Kit/devalue معمولاً کافی است؛ `transport` وقتی لازم است که نوع خودت را داری.

---

## قدم ۱۱: جدول «کی کدام hook؟»

| نیاز | Hook | فایل |
|------|------|------|
| شناخت کاربر از کوکی برای همهٔ درخواست‌ها | `handle` + `locals` | `hooks.server.ts` |
| هدر امنیتی روی پاسخ‌ها | `handle` | `hooks.server.ts` |
| چند middleware پشت سر هم | `sequence(...)` | `hooks.server.ts` |
| عوض کردن URL داخلی API هنگام SSR | `handleFetch` | `hooks.server.ts` |
| لاگ خطا + پیام امن + errorId | `handleError` | server و/یا client |
| اتصال DB یک‌بار | `init` | معمولاً server |
| alias مسیر / i18n URL | `reroute` | `hooks.ts` |
| برگرداندن کلاس سفارشی از load | `transport` | `hooks.ts` |

---

## قدم ۱۲: ارتباط با بقیهٔ اپ

```text
hooks.server (handle)
    → event.locals پر می‌شود
        → +layout.server.ts / +page.server.ts / +server.ts می‌خوانند
            → هرچه لازم است در return load به صفحه می‌رسد (data)
```

```text
error(404, '...') در load
    → kind: 'app'
    → handleError (اختیاری)
    → +error.svelte با page.error
```

```text
app.d.ts
    App.Locals  ← شکل event.locals
    App.Error   ← شکل خروجی handleError / page.error
```

بدون hooks هم می‌توانی `load` بنویسی؛ hooks برای **سیاست سراسری** است، نه جای منطق یک صفحهٔ تکی.

---

## قدم ۱۳: اشتباهات رایج

1. **گذاشتن راز در `locals` و بعد برگرداندن کل `locals` به کلاینت**  
2. **فکر کردن `handle` جای `+server` برای همهٔ APIهاست** — برای REST واضح معمولاً `+server.ts` بهتر است  
3. **authorize فقط با `event.url` در سناریوهای remote function**  
4. **throw دوباره داخل `handleError`**  
5. **کار سنگین در `init` کلاینت** و کند شدن hydrate  
6. **side effect داخل `reroute`** (خلاف فرض cache)  
7. **فراموش کردن تایپ `App.Locals`** و جنگ با TypeScript  

---

## قدم ۱۴: حداقل اسکلت پیشنهادی برای همین پروژه (بعداً)

وقتی خواستی شروع کنی، یک فایل ساده کافی است:

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	return resolve(event);
};
```

و در `src/app.d.ts`:

```ts
interface Locals {
	user: { id: string; name: string } | null;
}
```

بعداً auth واقعی، `handleError` و در صورت نیاز بقیه را اضافه کن. فعلاً لازم نیست Express را درگیر کنی.

---

## جمع‌بندی

- Hooks توابع سراسری SvelteKitاند در `hooks.server` / `hooks.client` / `hooks`.  
- `handle` قلب سرور است: `locals`، هدر، یا پاسخ سفارشی قبل/بعد از `resolve`.  
- `handleFetch` fetchهای سروری Kit را تنظیم می‌کند.  
- `handleError` خطا را لاگ و برای کاربر امن می‌کند (`kind` مهم است).  
- `init` یک‌بار در شروع؛ `reroute` نگاشت URL؛ `transport` نوع سفارشی بین سرور و کلاینت.  
- تایپ‌ها را در `app.d.ts` با `App.Locals` و `App.Error` قفل کن.  
- منطق یک صفحه را در `load` بگذار؛ سیاست کل اپ را در hooks.

## تمرین

1. روی کاغذ بنویس برای «خواندن کوکی نشست و گذاشتن کاربر روی `locals`» کدام فایل و کدام تابع را لازم داری و `app.d.ts` را چطور عوض می‌کنی.  
2. فرق `handleError` با `+error.svelte` را در دو جمله بگو: یکی سیاست/لاگ/شکل داده، دیگری UI.  
3. سناریو بده که در آن `reroute` مفید است ولی `redirect()` داخل `load` انتخاب بدتری باشد (یا برعکس).  
4. (امتیازی) توضیح بده چرا `sequence(auth, headers)` معمولاً بهتر از یک `handle` دویست‌خطی است.
