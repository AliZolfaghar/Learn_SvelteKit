# درس ۱۴: Data Fetching و Load Functions در SvelteKit

## هدف درس
بعد از این درس می‌فهمی قبل از رندر صفحه داده از کجا می‌آید، فرق `+page.ts` و `+page.server.ts` چیست، چطور `data` به صفحه و layout می‌رسد، `fetch` / `parent` / `error` / `redirect` را چطور در `load` استفاده کنی، و کِی اصلاً نباید در کامپوننت `fetch` بزنی.

## پیش‌نیاز
- درس ۱۰ (routing و جای فایل‌های `+page`)
- درس ۱۲ (layout و دادهٔ مشترک)
- درس ۹ (تایپ‌های `PageLoad` / `PageServerLoad` / `PageProps`)

---

## قدم ۱: مشکل را بفهم — صفحه بدون داده کامل نیست

قبل از اینکه `+page.svelte` دیده شود، اغلب لازم است چیزی از بیرون بیاید:

- پست بلاگ از دیتابیس  
- لیست محصول از API  
- کاربر فعلی از نشست  

در SvelteKit جای رسمی این کار **تابع `load`** است — نه `$effect` داخل کامپوننت برای اولین بارگذاری صفحه.

جریان ذهنی:

```text
درخواست /blog/hello
    → اجرای loadهای layout (از بالا به پایین)
    → اجرای load صفحه
    → ساختن شیء data
    → رندر +layout و +page با propِ data
```

در پروژهٔ فعلی هنوز `load` نداری؛ صفحات فقط UI ثابت‌اند. این درس همان بخش بعدی است.

---

## قدم ۲: اولین `load` — صفحه + داده

فایل کنار صفحه:

```ts
// src/routes/blog/[slug]/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return {
		post: {
			title: `عنوان ${params.slug}`,
			content: `متن برای ${params.slug}`
		}
	};
};
```

در UI:

```svelte
<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{data.post.title}</h1>
<p>{data.post.content}</p>
```

| بخش | نقش |
|-----|-----|
| `export const load` | قرارداد Kit: این تابع را قبل از رندر صدا بزن |
| `return { ... }` | می‌شود `data` در صفحه |
| `PageProps` / `data` | تایپ از روی همان return ساخته می‌شود (`$types`) |

---

## قدم ۳: دو خانوادهٔ `load`

| فایل | نوع | کجا اجرا می‌شود |
|------|-----|------------------|
| `+page.ts` / `+layout.ts` | Universal | SSR اولیه روی سرور + بعداً اغلب در مرورگر هنگام ناوبری |
| `+page.server.ts` / `+layout.server.ts` | Server-only | همیشه فقط سرور |

### کی `.server`؟

- دیتابیس  
- فایل‌سیستم سرور  
- env خصوصی / API key  
- `cookies` / `locals` / خواندن خام `request`  

```ts
// +page.server.ts
import type { PageServerLoad } from './$types';
import * as db from '#lib/server/database';

export const load: PageServerLoad = async ({ params }) => {
	return {
		post: await db.getPost(params.slug)
	};
};
```

### کی یونیورسال (`+page.ts`)؟

- `fetch` به API عمومی بدون راز  
- وقتی می‌خواهی در کلاینت هم همان منطق دوباره اجرا شود  
- وقتی چیزی برمی‌گردانی که سریالایز شبکه سخت است (مورد خاص، مثل بعضی مقادیر خاص)

### اگر هر دو را با هم داشته باشی

1. اول `load` سرور اجرا می‌شود  
2. خروجی‌اش به‌صورت `data` به آرگومان `load` یونیورسال می‌رسد  
3. چیزی که یونیورسال برمی‌گرداند به صفحه می‌رود (نه الزاماً خامِ سرور)

```ts
// +page.server.ts
export const load: PageServerLoad = async () => {
	return { serverMessage: 'از سرور' };
};

// +page.ts
export const load: PageLoad = async ({ data }) => {
	return {
		message: data.serverMessage.toUpperCase()
	};
};
```

---

## قدم ۴: Layout هم `load` دارد

```ts
// src/routes/blog/+layout.server.ts
export const load: LayoutServerLoad = async () => {
	return {
		posts: await db.getPostSummaries()
	};
};
```

- خروجی در همان layout و **فرزندان** در `data` در دسترس است  
- صفحه می‌تواند `data.posts` را ببیند حتی اگر خودش برنگردانده باشد  

### ادغام کلیدها

اگر چند `load` یک کلید هم‌نام برگردانند، **آخری برنده است**:

```text
layout → { a: 1, b: 2 }
page   → { b: 3, c: 4 }
نتیجه  → { a: 1, b: 3, c: 4 }
```

### `page.data` برای مسیر برعکس

Layout والد معمولاً `data` خودش را دارد، نه دادهٔ صفحه.  
اگر ریشه بخواهد `title` صفحه را در `<svelte:head>` بگذارد:

```svelte
<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.data.title}</title>
</svelte:head>
```

`page.data` ترکیب داده‌های مسیر فعلی است. تایپ گسترده‌اش با `App.PageData` در `app.d.ts` مرتبط است.

---

## قدم ۵: آرگومان‌های مهم `load` (event)

### مشترک (یونیورسال و سرور)

| ویژگی / تابع | کار |
|--------------|-----|
| `params` | پارامترهای پویای مسیر (`slug`, …) |
| `url` | شیء `URL` درخواست |
| `route` | اطلاعات route id |
| `fetch` | fetch ویژهٔ Kit (در SSR کوکی/relative URL را درست‌تر هندل می‌کند) |
| `parent()` | منتظر ماندن و گرفتن دادهٔ layoutهای بالاتر |
| `depends(...)` | اعلام وابستگی سفارشی برای invalidate |
| `setHeaders(...)` | تنظیم هدرهای پاسخ (مثلاً cache) |
| `untrack(...)` | خواندن بدون ثبت dependency |

### فقط سرور (`PageServerLoad`)

| ویژگی | کار |
|--------|-----|
| `cookies` | خواندن/نوشتن کوکی |
| `locals` | داده از `hooks.server` (مثل کاربر) |
| `request` | درخواست خام |
| `getClientAddress()` | IP کلاینت |
| `platform` | چیزهای adapter (مثلاً Cloudflare) |

---

## قدم ۶: `fetch` داخل `load` — نه `fetch` خام بی‌فکر

```ts
export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/items');
	if (!res.ok) {
		error(res.status, 'نتوانستیم آیتم‌ها را بگیریم');
	}
	return { items: await res.json() };
};
```

چرا `event.fetch` بهتر از `fetch` سراسری است؟

1. در SSR آدرس نسبی مثل `/api/...` درست resolve می‌شود  
2. کوکی‌های همان origin معمولاً جلو می‌روند  
3. با `handleFetch` در hooks می‌توانی رفتار سرور را عوض کنی (درس ۱۱)  
4. در hydrate، پاسخ‌های SSR می‌توانند reuse شوند و درخواست تکراری کمتر شود  

API داخلی را می‌توانی با `+server.ts` بسازی و از `load` صدا بزنی؛ یا مستقیم در `.server.ts` به DB بزنی و اصلاً HTTP داخلی نسازی (برای اپ خودت اغلب مستقیم DB ساده‌تر است).

---

## قدم ۷: `error` و `redirect`

```ts
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}

	const post = await db.getPost(params.slug);
	if (!post) {
		error(404, 'پست پیدا نشد');
	}

	return { post };
};
```

| ابزار | معنی |
|--------|------|
| `error(status, message)` | برو سراغ `+error.svelte` / `handleError` |
| `redirect(status, location)` | برو به URL دیگر — **خطا نیست** |

`redirect` را معمولاً `throw`گونه استفاده می‌کنی (همان helper از Kit)؛ بعد از آن کدی که وابسته به ادامه است نباید بیاید.

---

## قدم ۸: `await parent()` — وقتی به دادهٔ بالا نیاز داری

گاهی `load` صفحه باید روی خروجی layout حساب کند:

```ts
export const load: PageLoad = async ({ parent }) => {
	const { posts } = await parent();
	return {
		first: posts[0]
	};
};
```

بدون `parent()`، اجرای موازی layout/page ممکن است باعث شود هنوز دادهٔ والد آماده نباشد.

نکته: زیاده‌روی در `parent()` زنجیره را سریالی و کند می‌کند. فقط وقتی واقعاً به دادهٔ والد وابسته هستی صدا بزن.

---

## قدم ۹: تازه‌سازی داده — `invalidate` و `depends`

به‌طور پیش‌فرض با تغییر URL مرتبط، `load` دوباره اجرا می‌شود.  
برای وابستگی‌های سفارشی:

```ts
// در load
export const load: PageLoad = async ({ fetch, depends }) => {
	depends('app:items');
	const res = await fetch('/api/items');
	return { items: await res.json() };
};
```

```ts
// جایی در UI بعد از تغییر داده
import { invalidate } from '$app/navigation';

await invalidate('app:items');
```

`invalidateAll()` همه را تازه می‌کند (سنگین‌تر).  
برای فرم‌ها بعداً با `actions` و `enhance` هم الگوی تازه‌سازی داری؛ فعلاً بدان `load` فقط «یک‌بار اول» نیست.

---

## قدم ۱۰: Streaming با Promise (آشنایی)

در `load` سرور می‌توانی به‌جای `await` کردن همه چیز، خودِ Promise را برگردانی تا HTML زودتر بیاید و بقیه stream شود:

```ts
export const load: PageServerLoad = async () => {
	return {
		// فوری
		title: 'داشبورد',
		// دیرتر آماده می‌شود
		stats: loadHeavyStats() // بدون await
	};
};
```

در صفحه با `{#await data.stats}` نشان می‌دهی.  
جزئیات را وقتی به UX لود سنگین رسیدی عمیق‌تر کن؛ مفهوم مهم: لازم نیست همه چیز قبل از اولین بایت آماده باشد.

خروجی `load` سرور باید با **devalue** قابل انتقال باشد (JSON-like + Date/Map/Set/… و Promise). کلاس خام دلخواه → `transport` در hooks (درس ۱۱).

---

## قدم ۱۱: ترتیب اجرا و ناوبری کلاینتی

برای بازدید اول (SSR):

```text
handle (hooks)
  → loadهای server (layoutها سپس صفحه؛ با امکان موازی‌سازی هوشمند)
  → در صورت وجود، loadهای universal
  → رندر HTML
  → hydrate در مرورگر
```

برای کلیک روی `<a href>` داخل اپ:

- اغلب دوباره فقط data لازم گرفته می‌شود  
- `load` سرور از سرور data می‌آورد  
- `load` یونیورسال در مرورگر اجرا می‌شود  

Layout مشترکی که داده و UIاش عوض نشده، معمولاً از نو ساخته نمی‌شود.

---

## قدم ۱۲: Data Fetching فقط با `load` نیست — ولی اول `load`

| روش | کِی |
|-----|-----|
| `load` در `+page` / `+layout` | دادهٔ لازم برای رندر اول و SEO |
| `+server.ts` + `fetch` از کلاینت | API برای کلاینت / موبایل / بعد از تعامل |
| `$effect` + `fetch` در کامپوننت | دادهٔ صرفاً کلاینتی بعد از mount (ویجت، چیز غیرضروری برای SSR) |
| Form actions | نوشتن/ارسال فرم (درس جدا) |

اشتباه رایج تازه‌کارها:

```svelte
<script lang="ts">
	let items = $state([]);
	$effect(() => {
		fetch('/api/items').then(...); // برای دادهٔ اصلی صفحه معمولاً غلط است
	});
</script>
```

مشکلات: دوباره‌کاری با SSR، چشمک خالی، SEO ضعیف‌تر، آبشار درخواست بعد از JS.

برای دادهٔ اصلی صفحه → `load`.

---

## قدم ۱۳: مثال آموزشی کامل (قابل پیاده روی همین ریپو)

### ۱) API ساده

```ts
// src/routes/api/hello/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json({ message: 'سلام از API' });
};
```

### ۲) صفحه با universal load

```ts
// src/routes/hello/+page.ts
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/hello');
	if (!res.ok) error(500, 'API در دسترس نیست');
	return { hello: await res.json() };
};
```

```svelte
<!-- src/routes/hello/+page.svelte -->
<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<p>{data.hello.message}</p>
```

### ۳) نسخهٔ فقط سرور (بدون HTTP داخلی)

```ts
// src/routes/hello/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { hello: { message: 'سلام مستقیم از سرور' } };
};
```

برای یادگیری، هر دو را جدا امتحان کن و فرق Network تب مرورگر را ببین.

---

## قدم ۱۴: چک‌لیست تصمیم‌گیری

| سؤال | انتخاب |
|------|--------|
| داده برای اولین رندر صفحه لازم است؟ | `load` |
| به DB یا راز نیاز دارد؟ | `+page.server.ts` / `+layout.server.ts` |
| API عمومی است و می‌شود از مرورگر هم زد؟ | اغلب `+page.ts` + `fetch` |
| برای چند صفحه مشترک است؟ | `+layout(.server).ts` |
| کاربر لاگین نباشد نباید ببیند؟ | `locals` در server load + `redirect` |
| پیدا نشد؟ | `error(404, ...)` |
| بعد از یک اقدام باید تازه شود؟ | `invalidate` / `depends` |
| ویجت کلاینتی غیرضروری برای SSR؟ | آن‌وقت `fetch` در کامپوننت قابل قبول‌تر است |

---

## قدم ۱۵: اشتباهات رایج

1. **`fetch` در `$effect` برای دادهٔ اصلی صفحه**  
2. **گذاشتن API key در `+page.ts`** (به کلاینت می‌رود)  
3. **برگرداندن مقدار غیرقابل‌سریال از server load** بدون `transport`  
4. **فراموش کردن `await` روی `res.json()` یا خود `load` async**  
5. **استفاده از `parent()` همه‌جا** و سریالی کردن بی‌دلیل  
6. **اشتباه گرفتن `data` صفحه با `page.data`**  
7. **فکر کردن `load` فقط یک‌بار در عمر اپ اجرا می‌شود**  
8. **برگرداندن کل `locals` شامل راز به کلاینت**  

---

## جمع‌بندی

- قبل از رندر، SvelteKit توابع `load` را اجرا می‌کند و نتیجه را به‌صورت `data` به صفحه/layout می‌دهد.  
- `.server.ts` فقط سرور؛ `.ts` یونیورسال (سرور + کلاینت).  
- دادهٔ layout با صفحه ادغام می‌شود؛ کلید تکراری → آخری برنده.  
- برای شبکه داخل `load` از `event.fetch` استفاده کن.  
- `error` و `redirect` کنترل جریان شکست/جابه‌جایی‌اند.  
- `parent` / `depends` / `invalidate` برای وابستگی و تازه‌سازی‌اند.  
- دادهٔ اصلی صفحه را در کامپوننت fetch نکن؛ جایش `load` است.  
- پروژهٔ فعلی هنوز load ندارد — قدم بعدی طبیعی بعد از routing/layout همین است.

## تمرین

1. مسیر `/hello` بساز با `+page.ts` که از `/api/hello` با `event.fetch` بخواند و `data.hello.message` را نشان دهد.  
2. همان صفحه را به `+page.server.ts` تبدیل کن که بدون API و مستقیم یک شیء برگرداند؛ فرق را توضیح بده.  
3. در یک `blog/+layout.server.ts` فرضی لیست `posts` برگردان و در `[slug]/+page.server.ts` با `error(404)` برای slug نامعتبر هندل کن.  
4. بنویس چرا این کد برای صفحهٔ محصول معمولاً ضدالگو است: `$effect(() => fetch('/api/product').then(...))`.
