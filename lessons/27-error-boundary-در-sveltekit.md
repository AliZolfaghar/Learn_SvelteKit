# درس ۲۷: مدیریت خطا با Error Boundary در SvelteKit

## هدف درس
بعد از این درس می‌فهمی در SvelteKit دو لایهٔ Error Boundary داری: سطح مسیر با `+error.svelte` و سطح کامپوننت با `<svelte:boundary>`. یاد می‌گیری خطا کجا حباب می‌زند، `failed` / `pending` / `onerror` / `reset` چه کار می‌کنند، و چه خطاهایی اصلاً داخل boundary گیر نمی‌افتند.

## پیش‌نیاز
- درس ۷ (snippet)
- درس ۱۰ و ۱۲ (`+error.svelte` و layout)
- درس ۱۴ (`load` و خطا در data fetching)
- درس ۲۶ (`error()`, `handleError`, `App.Error`)

---

## قدم ۱: Error Boundary یعنی چه؟

فرض کن یک بخش از UI خراب می‌شود (مثلاً یک کامپوننت دادهٔ `null` را می‌خواند). بدون boundary، کل صفحه یا حتی کل اپ ممکن است از کار بیفتد.

**Error Boundary** مثل دیوار آتش است:

> خطا را آنجا متوقف کن، UI خراب را بردار، و به‌جایش یک UI جایگزین (یا دکمهٔ «دوباره تلاش کن») نشان بده — بدون اینکه بقیهٔ صفحه بمیرد.

در اکوسیستم Svelte / SvelteKit دو ابزار داری:

| لایه | ابزار | مقیاس |
|------|--------|--------|
| مسیر / صفحه | `+error.svelte` | نزدیک‌ترین فایل خطا در درخت route |
| بخش از UI | `<svelte:boundary>` (از Svelte 5.3) | یک تکهٔ دلخواه داخل کامپوننت |

هر دو «boundary» هستند؛ فقط سطح کنترل‌شان فرق دارد.

---

## قدم ۲: لایهٔ ۱ — `+error.svelte` (boundary سطح مسیر)

وقتی در `load` یا هنگام رندر صفحه/لایوت خطا رخ دهد، Kit به **نزدیک‌ترین** `+error.svelte` می‌رود.

ساختار نمونه:

```text
src/routes/
├── +layout.svelte
├── +error.svelte          ← خطای عمومی اپ
├── blog/
│   ├── +page.server.ts
│   ├── +page.svelte
│   └── +error.svelte      ← فقط بخش blog
└── admin/
    ├── +layout.server.ts
    └── +error.svelte
```

نمونهٔ ساده:

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
	import { page } from '$app/state';

	let { error, status } = $props();
</script>

<section>
	<h1>{status}</h1>
	<p>{error.message}</p>
	<a href="/">بازگشت به خانه</a>
	<!-- اگر App.Error را گسترش داده باشی: -->
	{#if error.code}
		<small>کد: {error.code}</small>
	{/if}
</section>
```

### قوانین مهم حباب خطا در `load`

1. خطا در `+page(.server).ts` → نزدیک‌ترین `+error.svelte` همان مسیر یا بالاتر.
2. خطا در `+layout(.server).ts` → نزدیک‌ترین `+error.svelte` **بالای** آن لایوت (نه کنارش).
3. خطا در `+layout` ریشه → معمولاً صفحهٔ fallback (`src/error.html`)، چون root layout معمولاً خودش میزبان `+error.svelte` است.

`error` که به `+error.svelte` می‌رسد از نوع `App.Error` است و از `handleError` گذشته (درس ۲۶).

---

## قدم ۳: لایهٔ ۲ — `<svelte:boundary>` (boundary سطح UI)

برای خطاهای **ریزتر** — مثلاً یک ویجت، یک نمودار، یا یک remote query — کل صفحه را با `+error.svelte` عوض نکن. دور همان بخش دیوار بکش:

```svelte
<script lang="ts">
	import FlakyWidget from '$lib/components/FlakyWidget.svelte';
</script>

<aside>
	<!-- بقیهٔ صفحه سالم می‌ماند -->
	<svelte:boundary>
		<FlakyWidget />

		{#snippet failed(error, reset)}
			<p>این بخش خراب شد: {error.message}</p>
			<button type="button" onclick={reset}>دوباره تلاش کن</button>
		{/snippet}
	</svelte:boundary>
</aside>
```

وقتی داخل boundary خطا رخ دهد:

1. محتوای فعلی boundary پاک می‌شود.
2. snippet به نام `failed` رندر می‌شود.
3. آرگومان دوم (`reset`) محتوا را از نو می‌سازد تا بتوانی retry کنی.

بدون `failed` یا `onerror`، boundary عملاً کاری نمی‌کند — باید حداقل یکی را بدهی.

---

## قدم ۴: سه قابلیت boundary — `failed`، `pending`، `onerror`

برای اینکه boundary «کاری بکند»، یکی یا چندتا از این‌ها لازم است:

### ۱) `failed` — UI خطا

```svelte
<svelte:boundary>
	<RiskyChart data={data.points} />

	{#snippet failed(error, reset)}
		<div class="error-box">
			<p>{error.message}</p>
			<button type="button" onclick={reset}>Retry</button>
		</div>
	{/snippet}
</svelte:boundary>
```

در SvelteKit، خطایی که از مسیر رسمی Kit می‌آید معمولاً بعد از `handleError` به شکل `App.Error` به `failed` می‌رسد:

```svelte
{#snippet failed(error: App.Error, reset)}
	<p>{error.message}</p>
	<button type="button" onclick={reset}>Retry</button>
{/snippet}
```

### ۲) `pending` — UI در حال بارگذاری برای `await`

اگر داخل boundary از `await` استفاده کنی (مثلاً remote function)، می‌توانی تا resolve شدن، loading نشان بدهی:

```svelte
<svelte:boundary>
	<p>{await loadGreeting()}</p>

	{#snippet pending()}
		<p>در حال بارگذاری…</p>
	{/snippet}

	{#snippet failed(error, reset)}
		<p>خطا: {error.message}</p>
		<button type="button" onclick={reset}>دوباره</button>
	{/snippet}
</svelte:boundary>
```

نکتهٔ SSR: اگر `pending` داشته باشی، روی سرور اغلب همان pending رندر می‌شود و کار async روی کلاینت ادامه پیدا می‌کند. این گاهی باعث می‌شود خطای async روی کلاینت داخل `failed` گیر بیفتد (به‌جای صفحهٔ خطای کل Kit). بدون `pending`، خطای SSR ممکن است به `+error.svelte` یا fallback برود.

### ۳) `onerror` — لاگ / گزارش بدون UI داخل boundary

```svelte
<script lang="ts">
	function report(error: unknown) {
		console.error(error);
		// مثلاً ارسال به Sentry
	}
</script>

<svelte:boundary onerror={(e) => report(e)}>
	<FlakyWidget />

	{#snippet failed(error, reset)}
		<button type="button" onclick={reset}>oops! try again</button>
	{/snippet}
</svelte:boundary>
```

می‌توانی state را بیرون boundary نگه داری:

```svelte
<script lang="ts">
	let error = $state<unknown>(null);
	let reset = $state(() => {});

	function onerror(e: unknown, r: () => void) {
		error = e;
		reset = r;
	}
</script>

<svelte:boundary {onerror}>
	<FlakyWidget />
</svelte:boundary>

{#if error}
	<button
		type="button"
		onclick={() => {
			error = null;
			reset();
		}}
	>
		دوباره تلاش کن
	</button>
{/if}
```

اگر داخل `onerror` دوباره خطا بیندازی (یا rethrow کنی)، parent boundary آن را می‌گیرد.

---

## قدم ۵: چه چیزهایی boundary می‌گیرد — و چه چیزهایی نه؟

### `<svelte:boundary>` معمولاً می‌گیرد:

- خطا هنگام **رندر** تمپلیت (مثلاً خواندن از `null`)
- خطا داخل `$effect` و به‌روزرسانی‌های reactive مرتبط با رندر
- در بسیاری از سناریوهای کلاینت: خطای `await` داخل همان boundary (با `failed` / گاهی همراه `pending`)

### معمولاً **نمی‌گیرد**:

| محل خطا | چرا؟ | جایگزین |
|---------|------|---------|
| event handler (`onclick` و …) | خارج از فرآیند رندر است | `try/catch` داخل handler |
| `setTimeout` / Promise جدا | async خارج از درخت رندر | `try/catch` همان‌جا |
| خطای `load` صفحه | قبل از رندر صفحه؛ مال Kit است | `+error.svelte` |
| خطای `+server.ts` / داخل `handle` | پاسخ HTTP است، نه UI درخت | JSON/fallback / `error.html` |
| باگ داخل خود `failed`/`onerror` بدون parent | جایی برای بالا رفتن نیست | parent boundary یا صفحهٔ خطا |

قانون ذهنی:

> `svelte:boundary` = دیوار دور **رندر UI**  
> `+error.svelte` = دیوار دور **مسیر و data loading**

---

## قدم ۶: مثال عملی — ویجت شکننده + صفحهٔ سالم

کامپوننتی که عمداً می‌ترکد:

```svelte
<!-- src/lib/components/FlakyCounter.svelte -->
<script lang="ts">
	let count = $state(0);
	let boom = $state(false);

	function explode() {
		boom = true;
	}
</script>

{#if boom}
	<!-- این رندر را می‌ترکاند -->
	<p>{(null as unknown as { x: number }).x}</p>
{:else}
	<p>شمارنده: {count}</p>
	<button type="button" onclick={() => count++}>+</button>
	<button type="button" onclick={explode}>ترکاندن ویجت</button>
{/if}
```

صفحه:

```svelte
<!-- src/routes/demo-boundary/+page.svelte -->
<script lang="ts">
	import FlakyCounter from '$lib/components/FlakyCounter.svelte';
</script>

<h1>صفحه سالم است</h1>
<p>اگر ویجت بترکد، فقط کادر پایین عوض می‌شود.</p>

<svelte:boundary>
	<FlakyCounter />

	{#snippet failed(error, reset)}
		<div role="alert">
			<strong>ویجت از کار افتاد</strong>
			<p>{error instanceof Error ? error.message : 'خطای ناشناخته'}</p>
			<button type="button" onclick={reset}>بازنشانی ویجت</button>
		</div>
	{/snippet}
</svelte:boundary>

<p>این پاراگراف حتی بعد از خطا هم می‌ماند.</p>
```

تمرین ذهنی: اگر همان ترکیدن را بدون boundary بگذاری و به ریشه برسد، ممکن است به `+error.svelte` برود و کل محتوای مسیر عوض شود.

---

## قدم ۷: ترکیب با `load` و `error()`

```ts
// src/routes/posts/[id]/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = await db.getPost(params.id);
	if (!post) error(404, 'پست پیدا نشد');
	return { post };
};
```

اینجا `<svelte:boundary>` روی `+page.svelte` معمولاً کمکت نمی‌کند — خطا قبل از رسیدن به تمپلیت صفحه در `load` رخ داده. مسیر درست:

```svelte
<!-- src/routes/posts/+error.svelte یا routes/+error.svelte -->
<script lang="ts">
	let { error, status } = $props();
</script>

<h1>{status}</h1>
<p>{error.message}</p>
```

الگوی خوب:

- **منبع داده نیست / دسترسی نداری** → `error()` + `+error.svelte`
- **یک ویجت اختیاری خراب شد** → `<svelte:boundary>`
- **فرم validation** → `fail()` (درس ۱۶ و ۲۶)، نه boundary

---

## قدم ۸: boundary تودرتو و استراتژی UI

می‌توانی boundaryها را تو در تو بگذاری:

```svelte
<svelte:boundary>
	<!-- بخش بزرگ صفحه -->
	<main>
		<svelte:boundary>
			<ExpensiveChart />
			{#snippet failed(error, reset)}
				<p>نمودار لود نشد</p>
				<button type="button" onclick={reset}>Retry</button>
			{/snippet}
		</svelte:boundary>

		<article>...</article>
	</main>

	{#snippet failed(error)}
		<p>کل main از کار افتاد: {error.message}</p>
	{/snippet}
</svelte:boundary>
```

پیشنهاد طراحی:

1. برای کل اپ یک `src/routes/+error.svelte` تمیز داشته باش.
2. برای بخش‌های حساس/اختیاری (چت، نقشه، پیش‌نمایش، remote query) boundary محلی بگذار.
3. در `onerror` فقط گزارش بده؛ پیام کاربر را ساده و امن نگه دار.
4. `reset` را وقتی معنا دارد نشان بده که با retry احتمال موفقیت هست (مثلاً شبکه)، نه برای باگ قطعی کدنویسی.

---

## قدم ۹: SSR، fallback و محدودیت‌ها

چند نکتهٔ واقعی برای پروژه:

1. **به‌طور پیش‌فرض**، خطای رندر روی سرور ممکن است کل render را شکست بدهد و boundary سمت سرور مثل کلاینت رفتار نکند. پشتیبانی کامل‌تر از طریق `transformError` در Svelte در حال تکامل است؛ در Kit اغلب هنوز به `handleError` / `+error.svelte` / `error.html` تکیه می‌کنی.
2. برای remote + `await`، ترکیب `pending` + `failed` در عمل پایدارتر است تا فقط `failed`.
3. خطای داخل `handle` یا `+server.ts` → UI درخت route نیست؛ از `src/error.html` یا JSON استفاده می‌شود:

```html
<!-- src/error.html -->
<!doctype html>
<html lang="fa">
	<head>
		<meta charset="utf-8" />
		<title>%sveltekit.error.message%</title>
	</head>
	<body>
		<h1>خطا</h1>
		<p>وضعیت: %sveltekit.status%</p>
		<p>%sveltekit.error.message%</p>
	</body>
</html>
```

---

## قدم ۱۰: جدول تصمیم سریع

| سناریو | ابزار |
|--------|--------|
| `load` پست را پیدا نکرد | `error(404)` → `+error.svelte` |
| کل بخش `/admin` باید صفحهٔ خطای خودش را داشته باشد | `src/routes/admin/+error.svelte` |
| یک کارت داشبورد ترکید، بقیه سالم | `<svelte:boundary>` + `failed` + `reset` |
| می‌خواهم به Sentry بفرستم | `onerror` روی boundary و/یا `handleError` |
| دکمهٔ فرم validation | `fail()` / remote validation — نه boundary |
| کلیک handler کرش کرد | `try/catch` داخل handler |
| خطای ریشهٔ layout | `src/error.html` (fallback) |

---

## جمع‌بندی

- در SvelteKit، Error Boundary فقط یک چیز نیست: **`+error.svelte` برای مسیر** و **`<svelte:boundary>` برای تکهٔ UI**.
- `+error.svelte` خطاهای `load` و رندر مسیر را می‌گیرد؛ شکل خطا `App.Error` است.
- `<svelte:boundary>` با `failed` / `pending` / `onerror` بخش خراب را ایزوله می‌کند و با `reset` قابل بازیابی است.
- خطاهای خارج از رندر (event handler، تایمر، …) را boundary نمی‌گیرد.
- برای data/HTTP از helpers درس ۲۶ استفاده کن؛ برای UI شکننده از boundary محلی.

---

## تمرین

1. یک صفحه بساز که دو ویجت داشته باشد؛ فقط یکی را داخل `<svelte:boundary>` بگذار و عمداً ترکاندنش را تست کن. ببین آیا ویجت دیگر و تیتر صفحه سالم می‌مانند.
2. برای `src/routes/demo/+error.svelte` یک UI سفارشی بنویس و از `+page.server.ts` با `error(403, '...')` آن را صدا بزن. فرق تجربهٔ کاربر با boundary محلی را توضیح بده.
3. روی یک `await` (یا remote query ساده) هم `pending` و هم `failed` بگذار؛ یک بار با `pending` و یک بار بدون آن رفتار SSR/کلاینت را مقایسه کن.
