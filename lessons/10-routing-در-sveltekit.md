# درس ۱۰: Routing در SvelteKit — راهنمای کامل

## هدف درس
بعد از این درس می‌فهمی مسیریابی (routing) در SvelteKit چطور از روی فولدرها و فایل‌های `+...` ساخته می‌شود، فرق صفحه و layout و API چیست، پارامترهای پویا چطور کار می‌کنند، و چطور در همین پروژه از یک صفحهٔ `/` به چند مسیر واقعی برسی.

## پیش‌نیاز
- درس ۲ (ساختار `src/routes`)
- درس ۷ (`{@render children()}` در layout)
- درس ۹ (آشنایی با `./$types` و TypeScript)

---

## قدم ۱: ایدهٔ اصلی — مسیر از روی فایل‌سیستم

SvelteKit یک **filesystem-based router** است:

> شکل فولدرهای داخل `src/routes` ≈ شکل URL

| مسیر فایل | URL |
|-----------|-----|
| `src/routes/+page.svelte` | `/` |
| `src/routes/about/+page.svelte` | `/about` |
| `src/routes/blog/[slug]/+page.svelte` | `/blog/hello-world` (مثلاً) |

در همین پروژه فعلاً فقط این‌ها را داری:

```text
src/routes/
├── +layout.svelte   ← قالب مشترک
└── +page.svelte     ← صفحهٔ /
```

یعنی فقط مسیر `/` تعریف شده؛ بقیهٔ درس برای ساختن بقیه است.

### سه قانون طلایی

1. **همهٔ فایل‌های route می‌توانند روی سرور اجرا شوند**  
2. **همه به‌جز `+server` روی کلاینت هم معنا دارند** (صفحه/layout hydrate می‌شوند)  
3. **`+layout` و `+error` روی زیرمسیرها هم اثر دارند**

---

## قدم ۲: پیشوند `+` یعنی چه؟

فقط فایل‌هایی که با `+` شروع می‌شوند «فایل route» حساب می‌شوند.  
بقیهٔ فایل‌ها داخل `routes` (مثلاً یک کامپوننت کمکی) URL نمی‌سازند.

فایل‌های مهم:

| فایل | نقش |
|------|-----|
| `+page.svelte` | خود صفحه (UI) |
| `+page.ts` / `+page.js` | `load` و تنظیمات صفحه (یونیورسال) |
| `+page.server.ts` | `load` / `actions` فقط سرور |
| `+layout.svelte` | قالب مشترک |
| `+layout.ts` / `+layout.server.ts` | داده و تنظیمات layout |
| `+error.svelte` | UI خطا برای این بخش از درخت |
| `+server.ts` | endpoint / API (پاسخ HTTP خام) |

پسوند در پروژهٔ ما معمولاً `.ts` است؛ در مستندات اغلب `.js` می‌بینی — مفهوم یکی است.

---

## قدم ۳: `+page.svelte` — یک صفحه

هر جایی که `+page.svelte` بگذاری، یک صفحهٔ قابل‌بازدید ساخته می‌شود.

```svelte
<!-- src/routes/about/+page.svelte -->
<h1>درباره</h1>
<a href="/">خانه</a>
```

نکتهٔ مهم ناوبری:

- بین صفحات با **`<a href="...">` معمولی** جابه‌جا شو  
- SvelteKit آن را intercept می‌کند و معمولاً بدون رفرش کامل (client-side navigation) می‌رود  
- لازم نیست کامپوننت مخصوص `<Link>` مثل بعضی فریم‌ورک‌ها

صفحه می‌تواند از `load` داده بگیرد:

```svelte
<script lang="ts">
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();
</script>

<h1>{data.title}</h1>
```

- `data` → خروجی تابع‌های `load`  
- `params` → پارامترهای پویای URL (مثل `slug`)

---

## قدم ۴: `+page.ts` در برابر `+page.server.ts`

### `+page.ts` (یونیورسال)

```ts
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
	if (params.slug === 'hello') {
		return { title: 'سلام' };
	}
	error(404, 'پیدا نشد');
};
```

- هنگام SSR روی سرور اجرا می‌شود  
- هنگام ناوبری کلاینتی، در مرورگر هم می‌تواند اجرا شود  
- برای دادهٔ عمومی / `fetch` به API عمومی مناسب است  

همچنین می‌توانی page options بدهی:

```ts
export const prerender = true;
export const ssr = true;
export const csr = true;
```

### `+page.server.ts` (فقط سرور)

```ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPostFromDatabase(params.slug);
	if (!post) error(404, 'پیدا نشد');
	return post;
};
```

وقتی لازم است:

- دیتابیس  
- کلید مخفی / env خصوصی  
- کوکی و نشست کاربر روی سرور  

خروجی باید قابل سریالایز باشد تا به کلاینت برسد.

**قانون سرانگشتی:** اگر شک داری «این کد نباید به مرورگر برود» → `.server.ts`.

---

## قدم ۵: `+layout.svelte` — قالب تو در تو

Layout دور صفحات همان شاخه و زیرشاخه‌ها پیچیده می‌شود.

در ریشهٔ همین پروژه:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import type { LayoutProps } from './$types';
	let { children }: LayoutProps = $props();
</script>

{@render children()}
```

اگر بنویسی:

```svelte
<header>سایت من</header>
<main>{@render children()}</main>
```

همهٔ صفحات آن هدر را می‌گیرند.

### Layout تو در تو

```text
src/routes/
├── +layout.svelte          ← برای همه
├── +page.svelte            ← /
└── blog/
    ├── +layout.svelte      ← فقط زیر /blog/*
    ├── +page.svelte        ← /blog
    └── [slug]/+page.svelte ← /blog/something
```

برای `/blog/hello`:

```text
root layout
  └─ blog layout
       └─ page [slug]
```

هر layout با `{@render children()}` سطح بعدی را نشان می‌دهد.

Layout هم می‌تواند `+layout.ts` / `+layout.server.ts` داشته باشد تا دادهٔ مشترک (مثلاً منو، کاربر) را بیاورد.

---

## قدم ۶: `+error.svelte` — خطای مسیر

اگر در `load` بنویسی `error(404, '...')` یا خطای غیرمنتظره رخ بدهد، نزدیک‌ترین `+error.svelte` نشان داده می‌شود.

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
	import { page } from '$app/state';
</script>

<h1>{page.status}</h1>
<p>{page.error?.message}</p>
```

`+error` مثل layout روی زیرشاخه‌ها هم اثر دارد، مگر سطح پایین‌تر error خودش را تعریف کند.

---

## قدم ۷: `+server.ts` — API / endpoint

برای پاسخ HTTP خام (JSON، فایل، …) نه صفحهٔ HTML:

```ts
// src/routes/api/hello/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json({ message: 'سلام' });
};
```

توابع exportشده با نام متد HTTP:

`GET` · `POST` · `PUT` · `PATCH` · `DELETE` · `OPTIONS` · `HEAD` · …

- فقط سرور  
- hydrate نمی‌شود  
- می‌تواند کنار `+page` در همان فولدر باشد؛ Kit بر اساس نوع درخواست تصمیم می‌گیرد صفحه یا endpoint را جواب بدهد  

---

## قدم ۸: پارامتر پویا `[name]`

یک بخش متغیر از URL:

```text
src/routes/blog/[slug]/+page.svelte  →  /blog/anything
```

در `load` یا صفحه:

```ts
params.slug // مثلاً 'anything'
```

چند پارامتر:

```text
src/routes/shop/[category]/[item]/+page.svelte
→ /shop/shoes/nike-1
→ params.category = 'shoes', params.item = 'nike-1'
```

---

## قدم ۹: پارامتر اختیاری `[[name]]`

با دو براکت، آن بخش می‌تواند نباشد:

```text
src/routes/[[lang]]/home/+page.svelte
```

هر دو یکی می‌شوند از نظر صفحه:

- `/home`  
- `/en/home`  

در `params.lang` برای حالت اول معمولاً `undefined` است و خودت پیش‌فرض می‌دهی.

محدودیت: بعد از `[...rest]` نمی‌توانی `[[optional]]` بگذاری (rest حریص است و optional بی‌مصرف می‌ماند).

مراقب تداخل با مسیرهای دیگر باش؛ مثلاً همزمان `src/routes/+page.svelte` و `src/routes/[[lang]]/+page.svelte` هر دو ممکن است `/` را بخواهند و build خطا بدهد.

---

## قدم ۱۰: Rest parameter — `[...name]`

برای تعداد نامشخص از بخش‌های مسیر:

```text
src/routes/files/[...path]/+page.svelte
```

| URL | `params.path` تقریبی |
|-----|----------------------|
| `/files` | `''` یا خالی (بسته به حالت) |
| `/files/a` | `a` |
| `/files/a/b/c` | `a/b/c` |

کاربردها: فایل‌ویوور، اپ‌های تو در تو، و **catch-all** برای 404 سفارشی داخل یک بخش.

مثال ذهنی 404 داخل `/docs`:

```text
src/routes/docs/
├── intro/+page.svelte
├── [...path]/+page.server.ts   ← error(404)
└── +error.svelte
```

بدون یک route که واقعاً match شود، گاهی error تو در تو برای URL نامعتبر آن بخش اجرا نمی‌شود.

---

## قدم ۱۱: Matcher — محدود کردن پارامتر (SvelteKit 3)

بدون matcher، `[page]` هر رشته‌ای را قبول می‌کند (`/fruits/rocketship` هم).

در SvelteKit ۳ معمولاً در `src/params.ts` با `defineParams` تعریف می‌کنی، بعد در نام فولدر:

```text
src/routes/fruits/[page=fruit]
```

مفهومی:

```ts
// src/params.ts — شکل آموزشی
import { defineParams } from '@sveltejs/kit/params';

export const params = defineParams({
	fruit: (param) => {
		if (param !== 'apple' && param !== 'orange') return;
		return param;
	}
});
```

- اگر match نشود، Kit سراغ routeهای دیگر می‌رود و در نهایت 404  
- matcher هم روی سرور هم روی کلاینت اجرا می‌شود  
- می‌تواند مقدار را تبدیل کند (مثلاً رشته → عدد) اگر مطابق قرارداد Kit باشد  

> در نسخه‌های قبل‌تر، هر matcher یک فایل جدا در `src/params/name.js` با `export function match` بود. اگر مطلب قدیمی دیدی، همان ایده است با API جدیدتر.

اولویت: `[name=matcher]` معمولاً از `[name]` خام مشخص‌تر است.

---

## قدم ۱۲: Route groups — `(name)` بدون اثر روی URL

گاهی می‌خواهی چند صفحه یک layout مشترک داشته باشند، بدون اینکه نام فولدر وارد URL شود.

```text
src/routes/
├── (marketing)/
│   ├── +layout.svelte
│   ├── about/+page.svelte      → /about
│   └── contact/+page.svelte    → /contact
└── (app)/
    ├── +layout.svelte
    ├── dashboard/+page.svelte  → /dashboard
    └── settings/+page.svelte   → /settings
```

پرانتز یعنی **گروه منطقی**؛ `(marketing)` در آدرس دیده نمی‌شود.

---

## قدم ۱۳: شکستن ارث‌بری layout (پیشرفته)

به‌طور پیش‌فرض هر layout، layoutهای بالایی را به ارث می‌برد.  
گاهی صفحهٔ خاص نباید layout بالایی را بگیرد (مثلاً صفحهٔ چاپ یا login تمام‌صفحه).

SvelteKit برای این کار از نام‌گذاری پیشرفته مثل `+page@.svelte` / `+layout@....svelte` استفاده می‌کند تا بگویی از کدام سطح layout به بعد را می‌خواهی.  
جزئیات را وقتی به UI چندقالبی پیچیده رسیدی در مستند [Advanced layouts](https://svelte.dev/docs/kit/advanced-routing) بخوان؛ برای اکثر اپ‌های آموزشی، groups + چند `+layout` کافی است.

---

## قدم ۱۴: ناوبری، اولویت routeها، و کاراکترهای خاص

### ناوبری

```svelte
<a href="/about">درباره</a>
<a href="/blog/{post.slug}">ادامه</a>
```

برای ساختن مسیر امن‌تر از روی route id می‌توانی از `$app/paths` و `resolve` استفاده کنی (وقتی base path یا پارامتر پویا داری).

### اولویت وقتی چند route با یک URL جور می‌شوند

Kit تقریباً این‌طور مرتب می‌کند:

1. مسیر ثابت مشخص‌تر (`/foo-abc`)  
2. بعد پارامتر با matcher  
3. بعد پارامتر معمولی  
4. optional و rest معمولاً اولویت پایین‌تر (مخصوصاً در انتها)

پس `/foo-abc` به فایل ثابت می‌رود، نه به `[...catchall]`.

### کاراکترهای ممنوع در نام فایل

چیزهایی مثل `:` `*` `?` روی بعضی OSها یا به‌خاطر معنی خاص Kit/URL مستقیم در نام فولدر نمی‌آیند؛ می‌شود با escape هگز مثل `[x+3a]` برای `:` مسیر ساخت. به‌ندرت لازم می‌شود.

---

## قدم ۱۵: تصویر ذهنی از درخواست یک صفحه

برای URL فرضی `/blog/hello`:

```text
1) Match مسیر → blog/[slug]
2) اجرای loadهای layout از ریشه تا صفحه (سرور / یونیورسال)
3) اجرای load صفحه
4) رندر: layout ریشه → layoutهای میانی → +page
5) ارسال HTML (SSR) + hydrate در مرورگر
6) کلیک لینک بعدی → اغلب فقط data + صفحهٔ جدید، بدون رفرش کامل
```

اگر `load` بگوید `error(404)` → به‌جای page، نزدیک‌ترین `+error.svelte`.

---

## قدم ۱۶: نقشهٔ پیشنهادی برای تمرین روی همین ریپو

یک ساختار آموزشی تمیز:

```text
src/routes/
├── +layout.svelte
├── +error.svelte
├── +page.svelte                 → /
├── about/+page.svelte           → /about
├── blog/
│   ├── +page.svelte             → /blog
│   └── [slug]/+page.svelte      → /blog/:slug
└── api/
    └── health/+server.ts        → /api/health
```

گام‌ها:

1. `about/+page.svelte` بساز و از خانه لینک بده  
2. `blog/[slug]` با نشان دادن `params.slug`  
3. برای slug یک `+page.ts` با `load` و `error(404)`  
4. یک `+server.ts` ساده که `json({ ok: true })` برگرداند  
5. یک `+error.svelte` ریشه برای دیدن وضعیت خطا  

فعلاً Express را لازم نداری؛ همان `npm run dev` برای دیدن همه‌چیز کافی است.

---

## قدم ۱۷: چک‌لیست تصمیم‌گیری سریع

| سؤال | انتخاب |
|------|--------|
| کاربر HTML می‌بیند؟ | `+page.svelte` |
| قالب مشترک؟ | `+layout.svelte` |
| داده عمومی / قابل اجرا در مرورگر؟ | `+page.ts` |
| داده مخفی / DB؟ | `+page.server.ts` |
| JSON یا پاسخ خام؟ | `+server.ts` |
| بخش متغیر URL؟ | `[param]` |
| بخش می‌تواند نباشد؟ | `[[param]]` |
| چند بخش نامشخص؟ | `[...param]` |
| محدود کردن مقدار param؟ | matcher در `params.ts` |
| گروه layout بدون تغییر URL؟ | `(group)` |
| UI خطا؟ | `+error.svelte` |

---

## جمع‌بندی

- Routing در SvelteKit از روی درخت `src/routes` ساخته می‌شود.  
- `+page` صفحه است، `+layout` قالب، `+error` خطا، `+server` API.  
- داده با `load` در `+page.ts` یا `+page.server.ts` می‌آید و از طریق `data` به UI می‌رسد.  
- `[param]` / `[[param]]` / `[...param]` / matcher قدرت پویایی URL را می‌دهند.  
- `(group)` فقط برای سازماندهی و layout است، نه برای شکل URL.  
- ناوبری با `<a href>`؛ اولویت با مسیر مشخص‌تر است.  
- پروژهٔ فعلی فقط `/` دارد؛ با ساختن فولدر+`+page` مسیرهای جدید اضافه می‌کنی.

## تمرین

1. صفحهٔ `/about` بساز و از `+page.svelte` ریشه به آن لینک بده؛ ببین layout ریشه دور هر دو می‌ماند.  
2. مسیر `/blog/[slug]` بساز و `params.slug` را در صفحه چاپ کن؛ برای یک slug خاص از `load` مقدار `title` برگردان.  
3. یک `GET` در `/api/health` با `+server.ts` بنویس که `{ ok: true }` برگرداند و در مرورگر یا با `fetch` تستش کن.  
4. (امتیازی) توضیح بده چرا برای خواندن رمز دیتابیس نباید `load` را در `+page.ts` بگذاری و باید `+page.server.ts` باشد.
