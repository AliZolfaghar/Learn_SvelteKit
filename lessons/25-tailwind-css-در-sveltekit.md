# درس ۲۵: استفاده از Tailwind CSS در SvelteKit

## هدف درس
بعد از این درس می‌توانی Tailwind CSS (نسخهٔ ۴، مسیر رسمی Vite) را به SvelteKit وصل کنی، utility classها را در صفحات و کامپوننت‌ها به کار ببری، با `$derived` کلاس پویا بسازی، و بدانی فرق رویکردش با Bootstrap و استایل scoped چیست.

## پیش‌نیاز
- درس ۱۲ (layout ریشه)
- درس ۲۴ (اختیاری — مقایسه با Bootstrap)
- آشنایی خیلی کم با ایدهٔ «کلاس‌های کمکی» مثل `p-4`, `flex`, `text-lg`

---

## قدم ۱: Tailwind چیست؟

**Tailwind CSS** یک فریم‌ورک **utility-first** است: به‌جای کامپوننت آمادهٔ `.btn-primary`، کلاس‌های کوچک می‌چسبانی و ظاهر را می‌سازی.

```html
<button class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
	ذخیره
</button>
```

| Bootstrap (درس ۲۴) | Tailwind |
|--------------------|----------|
| کامپوننت‌محور (`btn btn-primary`) | utility‌محور (`bg-blue-600 px-4 ...`) |
| ظاهر پیش‌فرض مشخص | طراحی آزادتر، کنترل ریزتر |
| JS برای بعضی پلاگین‌ها | معمولاً فقط CSS |

با Svelte خیلی خوب جفت می‌شود: منطق در `$state`، ظاهر در `class="..."`.

---

## قدم ۲: مسیر رسمی امروز — Tailwind v4 + Vite Plugin

برای SvelteKit فعلی، مستند رسمی این است:

1. نصب `tailwindcss` و `@tailwindcss/vite`  
2. ثبت پلاگین در `vite.config.ts`  
3. فایل `src/app.css` با `@import "tailwindcss"`  
4. import همان CSS در `+layout.svelte`  

دیگر برای شروع به `tailwind.config.js` + PostCSS اجباریِ نسخهٔ ۳ نیاز نداری (مدل قدیم هنوز در اینترنت زیاد دیده می‌شود).

این پروژه Vite ۸ دارد؛ هنگام نصب، نسخهٔ `@tailwindcss/vite` را طوری بگیر که با Vite ۸ سازگار باشد (طبق releaseهای Tailwind، از حدود ۴.۲.۲ به بعد پشتیبانی رسمی Vite ۸ آمده است).

---

## قدم ۳: نصب

در ریشهٔ پروژه:

```bash
npm install tailwindcss @tailwindcss/vite
```

(گاهی به‌عنوان `devDependencies` هم نصب می‌شود؛ برای کلاس فرقی ندارد.)

---

## قدم ۴: تنظیم `vite.config.ts`

پلاگین Tailwind را **کنار** `sveltekit` بگذار. ترتیب رایج در مستند: اول `tailwindcss()` بعد `sveltekit()`.

با حفظ تنظیمات فعلی پروژه، شکلی شبیه این می‌شود:

```ts
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				out: 'build',
				precompress: true
			})
		})
	]
});
```

---

## قدم ۵: ساخت `src/app.css`

```css
/* src/app.css */
@import 'tailwindcss';
```

همین یک خط هستهٔ Tailwind v4 را می‌آورد (base / components / utilities به‌صورت یکپارچه).

بعداً سفارشی‌سازی تم همین‌جا یا با `@theme` انجام می‌شود.

---

## قدم ۶: وصل کردن به layout ریشه

در `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
```

مسیر `../app.css` از `src/routes/` به `src/app.css` درست است.

حالا:

```bash
npm run dev
```

---

## قدم ۷: اولین استفاده در صفحه

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
	import Counter from '#lib/components/Counter.svelte';
</script>

<main class="mx-auto max-w-3xl px-4 py-10">
	<h1 class="mb-2 text-3xl font-bold tracking-tight text-slate-900">
		یادگیری SvelteKit
	</h1>
	<p class="mb-6 text-slate-600">
		استایل این صفحه با Tailwind نوشته شده است.
	</p>

	<button
		type="button"
		class="mb-8 rounded-lg bg-sky-600 px-4 py-2 text-white shadow hover:bg-sky-700"
	>
		دکمهٔ نمونه
	</button>

	<Counter label="شمارنده آموزشی" />
</main>
```

چند utility پرتکرار:

| کلاس | معنی تقریبی |
|------|-------------|
| `flex`, `grid` | چیدمان |
| `gap-4`, `p-4`, `m-2` | فاصله |
| `text-lg`, `font-bold` | تایپ |
| `bg-slate-100`, `text-red-600` | رنگ |
| `rounded-xl`, `shadow` | گوشه و سایه |
| `hover:`, `focus:`, `md:` | حالت و breakpoint |

---

## قدم ۸: کلاس پویا با Svelte 5

```svelte
<script lang="ts">
	let active = $state(false);

	let btnClass = $derived(
		active
			? 'bg-emerald-600 hover:bg-emerald-700'
			: 'bg-slate-400 hover:bg-slate-500'
	);
</script>

<button
	type="button"
	class="rounded px-3 py-2 text-white {btnClass}"
	onclick={() => (active = !active)}
>
	وضعیت
</button>
```

یا شرطی داخل خود `class`:

```svelte
<div class={['p-4 rounded', active ? 'bg-green-100' : 'bg-gray-100']}>
	...
</div>
```

(بسته به نسخه/عادات تیم، گاهی از کتابخانه‌های کمکی `clsx` / `tailwind-merge` هم استفاده می‌شود.)

---

## قدم ۹: `<style>` داخل کامپوننت و `@reference`

اگر داخل `<style>` بخواهی از توابع/تم Tailwind استفاده کنی، مستند رسمی برای Svelte چیزی شبیه این می‌گوید:

```svelte
<h1 class="text-3xl font-bold underline">Hello world!</h1>

<style lang="postcss">
	@reference 'tailwindcss';

	:global(html) {
		background-color: theme(--color-gray-100);
	}
</style>
```

- برای اکثر کارها همان `class="..."` روی HTML کافی است  
- `@reference` وقتی لازم است که در بلوک style به تم Tailwind ارجاع بدهی  
- استایل scoped معمولی Svelte همچنان کنار Tailwind زندگی می‌کند  

Counter فعلی با scoped CSS خودش کار می‌کند؛ مجبور نیستی فوراً همه‌اش را به utility تبدیل کنی.

---

## قدم ۱۰: سفارشی‌سازی تم در v4 (`@theme`)

در `app.css`:

```css
@import 'tailwindcss';

@theme {
	--color-brand: #0ea5e9;
	--font-sans: 'Vazirmatn', ui-sans-serif, system-ui, sans-serif;
}
```

بعد می‌توانی کلاس‌هایی مثل رنگ برند را طبق قرارداد تم Tailwind استفاده کردن (بسته به نام‌گذاری توکِن‌ها).  
جزئیات پیشرفتهٔ `@theme` را از مستند Tailwind بخوان؛ برای شروع همان پالت پیش‌فرض کافی است.

---

## قدم ۱۱: Dark mode (آشنایی)

الگوی رایج: کلاس `dark` روی `<html>` و utilityهای `dark:`.

```svelte
<div class="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
	محتوا
</div>
```

فعال‌سازی `dark` را با Svelte (مثلاً `$state` تم + کلاس روی `document.documentElement`) یا ترجیح سیستم انجام می‌دهی — خود Tailwind فقط variant را فراهم می‌کند.

---

## قدم ۱۲: RTL و فارسی

Tailwind utilityهای منطقی مثل `ms-4` / `me-4` (margin-inline) برای RTL دوست‌ترند تا فقط `ml-4` / `mr-4`.

در `app.html`:

```html
<html lang="fa" dir="rtl">
```

و در کلاس‌ها تا حد ممکن از ویژگی‌های منطقی استفاده کن.  
فونت فارسی را با `@theme` یا CSS سراسری اضافه کن.

---

## قدم ۱۳: Tailwind در برابر Bootstrap در همین دوره

| سؤال | انتخاب سرانگشتی |
|------|------------------|
| می‌خواهم سریع با کامپوننت آماده پیش بروم | Bootstrap |
| می‌خواهم UI سفارشی و یکدست با طراحی خودم | Tailwind |
| هر دو را همزمان؟ | معمولاً نه — تداخل ذهنی و حجم زیاد |

برای یادگیری SvelteKit هر دو را جداگانه امتحان کن؛ در یک اپ واقعی معمولاً یکی را محور کن.

---

## قدم ۱۴: مدل قدیمی (v3) که در مقالات می‌بینی

ممکن است ببینی:

```bash
npx tailwindcss init
# postcss.config.cjs + tailwind.config.js
# @tailwind base; @tailwind components; @tailwind utilities;
```

این مسیر **v3** است. اگر آموزش قدیمی دیدی، با جدول ذهنی مهاجرت کن:

| v3 | v4 (مسیر رسمی Kit امروز) |
|----|---------------------------|
| PostCSS plugin | `@tailwindcss/vite` |
| `tailwind.config.js` اجباری | اغلب `@import "tailwindcss"` + `@theme` |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |

برای پروژهٔ جدید کلاس، v4 را برو.

---

## قدم ۱۵: اشتباهات رایج

1. **فراموش کردن import `app.css` در layout** → هیچ utilityای کار نمی‌کند  
2. **ثبت نکردن `tailwindcss()` در Vite**  
3. **نوشتن کلاس‌های پویا طوری که کامل در سورس دیده نشوند** (رشتهٔ خیلی عجیب ساخته‌شده) — بهتر کلاس‌های کامل را در سورس داشته باشی یا از الگوی امن `$derived` با رشته‌های کامل استفاده کنی  
4. **قاطی کردن Bootstrap و Tailwind بدون نیاز**  
5. **فکر کردن Tailwind جای منطق Svelte را می‌گیرد**  
6. **نسخهٔ ناسازگار `@tailwindcss/vite` با Vite 8** → خطای پلاگین؛ نسخه را بالا ببر  

---

## قدم ۱۶: چک‌لیست برای همین ریپو

1. `npm install tailwindcss @tailwindcss/vite`  
2. `tailwindcss()` را به `vite.config.ts` اضافه کن  
3. `src/app.css` با `@import "tailwindcss"` بساز  
4. در `+layout.svelte` همان فایل را import کن  
5. در `+page.svelte` چند utility تست کن  
6. `npm run dev`  

فعلاً لازم نیست در پروژه اعمال شود مگر خودت بخواهی؛ این درس نقشهٔ کار است.

---

## جمع‌بندی

- Tailwind با utility class ظاهر را می‌سازد و با SvelteKit از طریق پلاگین Vite v4 وصل می‌شود.  
- نصب: `tailwindcss` + `@tailwindcss/vite` → ثبت در Vite → `app.css` → import در layout.  
- استایل روزمره: `class="..."`؛ منطق UI: runeها.  
- کلاس پویا با `$derived`؛ در `<style>` در صورت نیاز `@reference "tailwindcss"`.  
- با Bootstrap قاطی‌اش نکن مگر دلیل قوی داشته باشی.  
- آموزش‌های v3 با PostCSS را با مسیر v4 اشتباه نگیر.

## تمرین

1. طبق چک‌لیست Tailwind را وصل کن و یک کارت با `rounded-xl border bg-white p-6 shadow` بساز.  
2. دکمه‌ای با `$state` بساز که بین دو رنگ Tailwind سوییچ کند.  
3. توضیح بده چرا import کردن `app.css` فقط در یک کامپوننت برگ (نه layout) ایدهٔ بدی برای استایل سراسری است.  
4. سه فرق مهم مسیر نصب Tailwind v4 با چیزی که در مقاله‌های v3 دیدی را لیست کن.
