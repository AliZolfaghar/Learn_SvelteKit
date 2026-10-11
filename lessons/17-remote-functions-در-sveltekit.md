# درس ۱۷: Remote Functions در SvelteKit

## هدف درس
بعد از این درس می‌فهمی Remote Function چیست، چرا آزمایشی (experimental) است، چهار طعم `query` / `form` / `command` / `prerender` چه کاری می‌کنند، فرق‌شان با `load` و Form Actions چیست، و چطور (اگر خواستی) در پروژه فعال‌شان کنی — بدون اینکه فعلاً مجبور باشی کل اپ را روی آن‌ها بنا کنی.

## پیش‌نیاز
- درس ۱۴ (`load`)
- درس ۱۶ (Form Actions)
- درس ۱۵ (مرز سرور↔فرانت و سریالایز)

---

## قدم ۱: Remote Function با یک جمله

**Remote Function** تابعی است که:

- در کد مثل تابع معمولی صدا زده می‌شود (حتی از کامپوننت)  
- **همیشه روی سرور اجرا می‌شود**  
- روی کلاینت به یک `fetch` امن به endpoint تولیدشده تبدیل می‌شود  
- تایپ آرگومان و خروجی بین کلاینت و سرور یکدست می‌ماند  

از نسخهٔ **۲.۲۷** به بعد در دسترس است و هنوز **experimental** است: ممکن است باگ داشته باشد و API بدون اخطار قبلی عوض شود.

---

## قدم ۲: چرا اصلاً به وجود آمد؟

الگوی کلاسیک SvelteKit:

| کار | ابزار سنتی |
|-----|------------|
| خواندن دادهٔ صفحه | `load` در `+page.server.ts` |
| نوشتن با فرم | Form Actions |
| API عمومی | `+server.ts` |

Remote Functions می‌خواهند:

1. صدا زدن منطق سرور را از **هر جای اپ** ساده‌تر کنند (نه فقط از فایل route)  
2. با `await` آزمایشی داخل کامپوننت Svelte، داده را مستقیم در UI بخوانی  
3. تایپ و اعتبارسنجی آرگومان را سر میز طراحی بیاورند  
4. برای فرم‌ها «single-flight mutation» و همگام‌سازی query بعد از submit را راحت‌تر کنند  

پس جایگزین صددرصدِ `load`/actions نیستند؛ لایهٔ جدید و در حال پخت‌اند. برای کلاس ما: **اول load و actions را بلد باش، بعد remote را بشناس.**

---

## قدم ۳: روشن کردن قابلیت (opt-in)

بدون تنظیم، کار نمی‌کند. در `vite.config.ts` باید چیزی شبیه این باشد:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-node';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({ out: 'build', precompress: true }),
			compilerOptions: {
				experimental: {
					async: true // اجازهٔ await در کامپوننت / derived
				}
			},
			experimental: {
				remoteFunctions: true
			}
		})
	]
});
```

در پروژهٔ فعلی هنوز `remoteFunctions` روشن نیست — درس مفهومی است؛ وقتی خواستی آزمایش کنی این فلگ‌ها را اضافه کن.

همچنین برای `await` داخل `.svelte` به پشتیبانی آزمایشی async کامپایلر نیاز داری.

---

## قدم ۴: فایل Remote Module

توابع remote از فایلی export می‌شوند که در نامش بخش **`remote`** باشد:

```text
data.remote.ts
posts.remote.ts
auth.remote.js
```

قوانین مهم:

| قانون | معنی |
|--------|------|
| جای فایل | هر جا داخل `src/` (معمولاً کنار route یا در `#lib`) |
| نه داخل `server/` | فولدر `server` را نمی‌شود به کلاینت import کرد؛ remote باید از کلاینت قابل import باشد |
| import از `$app/server` | `query`, `form`, `command`, `prerender`, `getRequestEvent` |
| اجرای واقعی | همیشه سرور؛ کلاینت فقط wrapper می‌بیند |

روی کلاینت، exportها تبدیل می‌شوند به صدا زننده‌های HTTP؛ تو DB را مستقیماً در مرورگر اجرا نمی‌کنی.

---

## قدم ۵: چهار طعم Remote Function

| طعم | کار | شبیه سنتی |
|-----|-----|-----------|
| `query` | خواندن دادهٔ پویا | `load` / GET |
| `prerender` | خواندن دادهٔ تقریباً ثابت در build | prerender + cache |
| `form` | نوشتن از روی `<form>` | Form Actions |
| `command` | نوشتن از هر جا (مثلاً کلیک دکمه) | `fetch` به API / RPC |

---

## قدم ۶: `query` — خواندن از سرور

```ts
// src/routes/blog/data.remote.ts
import { query } from '$app/server';
import * as db from '#lib/server/database';

export const getPosts = query(async () => {
	return await db.getPostSummaries();
});
```

در کامپوننت (با async آزمایشی):

```svelte
<script lang="ts">
	import { getPosts } from './data.remote';
</script>

<ul>
	{#each await getPosts() as post}
		<li><a href="/blog/{post.slug}">{post.title}</a></li>
	{/each}
</ul>
```

تا resolve نشود (یا اگر error بدهد)، نزدیک‌ترین `<svelte:boundary>` درگیر می‌شود.

بدون `await` می‌توانی از `.loading` / `.error` / `.current` استفاده کنی.

### آرگومان + اعتبارسنجی

چون query در عمل یک endpoint است، آرگومان را **حتماً** با Standard Schema (مثلاً Valibot/Zod) اعتبارسنجی کن:

```ts
import * as v from 'valibot';
import { query } from '$app/server';
import { error } from '@sveltejs/kit';

export const getPost = query(v.string(), async (slug) => {
	const post = await db.getPost(slug);
	if (!post) error(404, 'Not found');
	return post;
});
```

```svelte
const post = $derived(await getPost(params.slug));
```

آرگومان و خروجی با **devalue** سریالایز می‌شوند (مثل `load` سرور).

### Cache و `refresh`

- صداهای یکسان با آرگومان یکسان **dedupe** می‌شوند (یک کار، چند مصرف‌کننده)  
- روی کلاینت تا وقتی query «فعال» است cache می‌ماند  
- برای تازه کردن: `getPosts().refresh()`  

### محدودیت مهم با prerender کل صفحه

اگر کل صفحه `export const prerender = true` باشد (مثلاً با `adapter-static`)، `query` برای آن مناسب نیست؛ سراغ `prerender` remote برو.

### `query.batch` و `query.live` (آشنایی)

- `query.batch` چند صدا در یک macrotask را دسته می‌کند (ضد مشکل n+1)  
- `query.live` برای دادهٔ زنده‌تر/به‌روزشونده است (جزئیاتش را وقتی نیاز داشتی در مستند بخوان)  

---

## قدم ۷: `form` — نسخهٔ remote فرم‌ها

```ts
import * as v from 'valibot';
import { form } from '$app/server';
import { redirect } from '@sveltejs/kit';

export const createPost = form(
	v.object({
		title: v.pipe(v.string(), v.nonEmpty()),
		content: v.pipe(v.string(), v.nonEmpty())
	}),
	async (data) => {
		await db.insertPost(data);
		redirect(303, '/blog');
	}
);
```

در UI معمولاً شیء form را روی `<form>` spread می‌کنی (API دقیق‌اش در حال تکامل است؛ الگوی مستند: attach به عنصر form).

مزیت نسبت به Form Actions کلاسیک:

- اسکیمای ورودی کنار تابع  
- تایپ قوی‌تر  
- همگام‌سازی با queryها (single-flight mutations در مستند)  

ولی:

- هنوز experimental است  
- Form Actions پایدار و feature-complete مانده‌اند  

**ترجیح رسمی برای degradable UX:** تا جایی که می‌شود `form` remote (یا Form Action کلاسیک) را به `command` ترجیح بده، چون بدون JS بهتر زنده می‌ماند.

---

## قدم ۸: `command` — نوشتن از هر جا

```ts
import * as v from 'valibot';
import { command, query } from '$app/server';

export const getLikes = query(v.string(), async (id) => {
	return await db.getLikes(id);
});

export const addLike = command(v.string(), async (id) => {
	await db.incrementLikes(id);
});
```

```svelte
<script lang="ts">
	import { getLikes, addLike } from './likes.remote';

	let { item } = $props();
</script>

<button
	onclick={async () => {
		try {
			await addLike(item.id);
			await getLikes(item.id).refresh();
		} catch {
			/* toast */
		}
	}}
>
	لایک
</button>

<p>لایک‌ها: {await getLikes(item.id)}</p>
```

| | `form` | `command` |
|--|--------|-----------|
| به عنصر فرم گره خورده؟ | بله | خیر |
| از onclick؟ | کمتر ایده‌آل | بله |
| بدون JS؟ | معمولاً بهتر degrade می‌شود | وابسته به JS |
| redirect | پشتیبانی می‌شود | توصیه نمی‌شود؛ اگر لازم شد الگوی خاص کلاینت |

---

## قدم ۹: `prerender` — دادهٔ تقریباً ثابت

شبیه `query` است ولی نتیجه در **زمان build** گرفته و ذخیره می‌شود.

```ts
import { prerender } from '$app/server';

export const getPosts = prerender(async () => {
	return await db.getPostSummaries();
});
```

کاربرد: چیزی که حداکثر با هر deploy عوض می‌شود (مستندات، لیست ثابت، …).

- می‌توانی روی صفحهٔ دینامیک هم دادهٔ prerenderشده داشته باشی (partial)  
- در مرورگر اغلب با Cache API نگه داشته می‌شود و با deploy جدید پاک/عوض می‌شود  
- برای آرگومان‌ها می‌توانی `inputs` بدهی تا crawler بداند کدام مقادیر را از پیش بسازد  

---

## قدم ۱۰: `getRequestEvent` داخل remote

برای کوکی / `locals` / کاربر:

```ts
import { query, getRequestEvent } from '$app/server';

export const getUser = query(async () => {
	const { cookies } = getRequestEvent();
	return findUser(cookies.get('session_id'));
});
```

هشدارهای حیاتی امنیت و صحت:

1. در `query` دسترسی به `route` / `params` / `url` **خطا می‌دهد** — چون query با آرگومان cache می‌شود و با ناوبری دوباره اجرا نمی‌شود. مقادیر صفحه را به‌عنوان آرگومان پاس بده.  
2. در `form`/`command`، `url`/`params` مربوط به **صفحه‌ای که از آن صدا زده شده** است، نه endpoint داخلی — برای authorize فقط به آن‌ها تکیه نکن (قابل دستکاری‌اند).  
3. هویت را از کوکی + `locals` (پر شده در `handle`) بگیر.  
4. در `query` معمولاً نمی‌توانی هدر دلخواه ست کنی؛ نوشتن کوکی بیشتر برای `form`/`command` معنا دارد.  

---

## قدم ۱۱: جریان ذهنی — از کلیک تا سرور

```text
کامپوننت: await getPost('hello')
        │
        ▼
[Browser] wrapper → HTTP به endpoint تولیدشدهٔ Kit
        │
        ▼
[Server]  اجرای تابع واقعی در *.remote.ts
        │  (DB، env خصوصی، cookies via getRequestEvent)
        ▼
     return مقدار قابل سریالایز
        │
        ▼
[Browser] deserialize → نتیجهٔ Promise / query.current
```

این همان ایدهٔ درس ۱۵ است، فقط لوله به‌جای `load`→`data` صفحه، **RPC تایپ‌شده** است.

---

## قدم ۱۲: جدول مقایسه با ابزارهای کلاسیک

| نیاز | کلاسیک پایدار | Remote (experimental) |
|------|----------------|------------------------|
| دادهٔ صفحه + SEO مشخص | `+page.server.ts` load | `query` داخل صفحه / کامپوننت |
| فرم HTML مقاوم | Form Actions + `enhance` | `form` remote |
| دکمهٔ لایک / RPC | `+server.ts` یا action | `command` |
| دادهٔ استاتیک build | `prerender = true` روی صفحه | `prerender()` remote |
| یادگیری مسیر رسمی امروز | همین‌ها | اختیاری / آینده‌نگر |

پیشنهاد مسیر کلاس این ریپو:

1. فعلاً با `load` + Form Actions بساز  
2. Remote را بشناس و در یک شاخهٔ آزمایشی امتحان کن  
3. وقتی API پایدارتر اعلام شد، برای فیچرهای جدید ارزیابی کن  

---

## قدم ۱۳: Single-flight mutations (ایده)

الگوی قدرتمند remote: بعد از `form`/`command`، queryهای مرتبط را در همان رفت‌وبرگشت تازه کنی تا UI بدون آبشار درخواست اضافه به‌روز شود.

جزئیات API در حال تغییر است؛ مفهومش را بدان:

> submit → سرور کار را می‌کند → پاسخ هم نتیجهٔ mutation را می‌آورد هم دادهٔ query تازه را.

---

## قدم ۱۴: اشتباهات رایج

1. **ساختن اپ production فقط روی remote بدون دانستن experimental بودنش**  
2. **گذاشتن فایل remote داخل `src/lib/server`** و انتظار import از کلاینت  
3. **آرگومان بدون schema** روی endpoint عمومی  
4. **authorize با `url.pathname` داخل query/command**  
5. **استفاده از `query` روی صفحهٔ تمام‌prerender**  
6. **ترجیح `command` به `form` برای کاری که فرم HTML می‌تواند بدهد**  
7. **فرض اینکه remote جادویی SSR/`data` صفحه را جایگزین درک `load` می‌کند** — مفاهیم مرز سرور همان‌اند  

---

## قدم ۱۵: چک‌لیست ورود آزمایشی در همین پروژه

اگر خواستی بعداً امتحان کنی:

1. فلگ‌های `experimental.remoteFunctions` و `compilerOptions.experimental.async` در `vite.config.ts`  
2. یک فایل `src/routes/demo/data.remote.ts` با یک `query` ساده  
3. یک صفحه که `await getHello()` را نشان دهد  
4. اسکیما برای هر آرگومان  
5. هیچ رازی در return  
6. آمادگی برای تغییر API با آپدیت Kit  

فعلاً برای مسیر اصلی یادگیری لازم نیست این را روشن کنی.

---

## جمع‌بندی

- Remote Functions ارتباط تایپ‌شدهٔ کلاینت↔سرورند؛ اجرا همیشه روی سرور است.  
- هنوز experimentalاند و باید صریحاً در Vite روشن شوند.  
- فایل‌ها: `*.remote.ts` — نه داخل پوشهٔ `server`.  
- چهار طعم: `query` (خواندن)، `prerender` (خواندن build-time)، `form` (فرم)، `command` (RPC نوشتن).  
- آرگومان‌ها را با Standard Schema اعتبارسنجی کن.  
- برای هویت از کوکی/`locals` استفاده کن؛ به `url`/`params` برای authorize تکیه نکن.  
- در کنار `load` و Form Actions زندگی می‌کنند؛ برای شاگرد این دوره، کلاسیک‌ها ستون فقرات‌اند و remote افق بعدی است.

## تمرین

1. در یک جدول سه‌ستونی بنویس: برای «لیست پست»، «ثبت پست با فرم»، «دکمهٔ لایک» کدام remote را برمی‌گزینی و معادل کلاسیک‌اش چیست.  
2. توضیح بده چرا `query` نباید به `event.url` وابسته باشد و به‌جاش `slug` را آرگومان می‌گیرد.  
3. دو دلیل بیاور که چرا برای پروژهٔ کلاس فعلاً Form Actions را به `form` remote ترجیح می‌دهیم.  
4. (امتیازی) با خواندن `vite.config.ts` فعلی بگو برای فعال‌سازی remote دقیقاً کدام دو بخش `experimental` را باید اضافه کنی.
