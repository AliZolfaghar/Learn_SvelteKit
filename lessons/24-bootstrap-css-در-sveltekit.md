# درس ۲۴: افزودن CSSهای Bootstrap به SvelteKit

## هدف درس
بعد از این درس می‌توانی Bootstrap را به پروژهٔ SvelteKit اضافه کنی (ترجیحاً با npm)، CSS سراسری را یک‌بار در layout ریشه لود کنی، کلاس‌های Bootstrap را در صفحات و کامپوننت‌ها استفاده کنی، و بدانی JSِ Bootstrap را چطور بدون خطای SSR لود کنی.

## پیش‌نیاز
- درس ۲ و ۱۲ (layout ریشه و `{@render children()}`)
- آشنایی خیلی کم با کلاس‌های Bootstrap مثل `container`, `btn`, `row`
- داشتن پروژه با `npm run dev`

---

## قدم ۱: Bootstrap اینجا چه نقشی دارد؟

**Bootstrap** یک فریم‌ورک CSS (و اختیاری JS) است برای:

- گرید و layout واکنش‌گرا  
- دکمه‌ها، فرم‌ها، کارت‌ها، ناوبری  
- utilityهایی مثل `mt-3`, `d-flex`, `text-center`  

در SvelteKit، Bootstrap **جای `$state` و کامپوننت Svelte را نمی‌گیرد**؛ فقط ظاهر و کلاس می‌دهد. تعامل را معمولاً با Svelte می‌نویسی؛ JSِ Bootstrap فقط اگر به پلاگین‌هایی مثل Modal/Dropdown رسمی Bootstrap نیاز داری.

در پروژهٔ فعلی هنوز استایل سراسری Bootstrap نداری؛ Counter استایل scoped خودش را دارد.

---

## قدم ۲: سه روش افزودن — کدام را انتخاب کنیم؟

| روش | خوبی | بدی |
|-----|------|-----|
| **npm + import در layout** | نسخه قفل در `package.json`، سازگار با Vite، پیشنهادی | باید پکیج نصب کنی |
| **CDN در `app.html`** | سریع برای تست | وابستگی به شبکه، کنترل کمتر روی باندل |
| **کپی فایل در `static/`** | آفلاین | آپدیت دستی، معمولاً توصیه نمی‌شود |

برای کلاس و کار واقعی: **npm**.

---

## قدم ۳: نصب با npm (پیشنهادی)

در ریشهٔ پروژه:

```bash
npm install bootstrap
```

اگر بعداً JSِ Bootstrap (Dropdown، Tooltip، …) خواستی و به Popper نیاز داشت:

```bash
npm install @popperjs/core
```

فقط برای CSS و کلاس‌ها، همان `bootstrap` کافی است.

---

## قدم ۴: لود کردن CSS یک‌بار در layout ریشه

بهترین جا: `src/routes/+layout.svelte` — چون دور همهٔ صفحات است.

```svelte
<script lang="ts">
	import 'bootstrap/dist/css/bootstrap.min.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
```

همین. بعد از ذخیره، `npm run dev` را اگر روشن است نگه دار یا یک‌بار ری‌استارت کن و کلاس‌ها را در صفحه امتحان کن.

### مسیر جایگزین: فایل CSS سراسری

اگر `src/app.css` داری (یا می‌سازی):

```css
/* src/app.css */
@import 'bootstrap/dist/css/bootstrap.min.css';
```

و در layout:

```ts
import '../app.css';
```

قانون:

> CSS سراسری Bootstrap را از **چند کامپوننت** import نکن — یک‌بار در ریشه کافی است تا تکراری و گیج‌کننده نشود.

---

## قدم ۵: استفاده در صفحه و کامپوننت

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
	import Counter from '#lib/components/Counter.svelte';
</script>

<div class="container py-4">
	<h1 class="mb-3">یادگیری SvelteKit</h1>
	<p class="lead text-secondary">Bootstrap فقط ظاهر می‌دهد؛ منطق با Svelte است.</p>

	<button type="button" class="btn btn-primary mb-4">دکمهٔ Bootstrap</button>

	<Counter label="شمارنده آموزشی" />
</div>
```

کلاس‌های رایج برای شروع:

| کلاس | کار |
|------|-----|
| `container` / `container-fluid` | عرض صفحه |
| `row` + `col-*` | گرید |
| `btn btn-primary` | دکمه |
| `form-control` | اینپوت |
| `card` | کارت |
| `navbar` | نوار بالا |
| `mt-3`, `p-4`, `d-flex`, `gap-2` | فاصله و فلکس |

کامپوننت‌هایی مثل Counter که `<style>` scoped دارند، ظاهر خودشان را نگه می‌دارند مگر کلاس Bootstrap روی همان عنصرها بگذاری یا استایلشان را کم کنی.

---

## قدم ۶: روش CDN (فقط برای آزمایش سریع)

در `src/app.html` داخل `<head>`:

```html
<link
	href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
	rel="stylesheet"
	integrity="..."
	crossorigin="anonymous"
/>
```

و در صورت نیاز JS در انتهای `body` (با `integrity` از سایت Bootstrap).

معایب برای پروژهٔ کلاس ما:

- نسخه در `package.json` قفل نیست  
- آفلاین/شبکه مشکل می‌سازد  
- با pipelineی Vite کمتر یکپارچه است  

اگر CDN گذاشتی، همزمان همان CSS را از npm هم import نکن (دوبار لود می‌شود).

---

## قدم ۷: JSِ Bootstrap و دام SSR

اگر بنویسی:

```ts
import 'bootstrap'; // یا bootstrap.min.js
```

مستقیم در سطح بالای layout، ممکن است هنگام SSR خطای **`document is not defined`** بگیری — چون Node `document` ندارد.

### چه وقت JS لازم است؟

- Collapse، Modal، Dropdown، Tab، Tooltip رسمی Bootstrap که به JS وابسته‌اند  

برای بیشتر UIها در SvelteKit بهتر است:

- باز/بسته مودال را با `$state` خودت کنترل کنی  
- یا از کامپوننت Svelte مخصوص Bootstrap استفاده کنی  

### اگر حتماً JS رسمی Bootstrap می‌خواهی

فقط در مرورگر لود کن:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import 'bootstrap/dist/css/bootstrap.min.css';

	onMount(async () => {
		await import('bootstrap');
	});
</script>
```

یا با چک محیط مرورگر (بسته به نسخهٔ Kit، ماژول محیط ممکن است `$app/env` / نام مشابه باشد):

```ts
onMount(async () => {
	await import('bootstrap/dist/js/bootstrap.bundle.min.js');
});
```

`bootstrap.bundle` معمولاً Popper را هم همراه دارد.

---

## قدم ۸: سفارشی‌سازی با SCSS (اختیاری)

برای تغییر رنگ primary قبل از تولید CSS:

```bash
npm install -D sass
```

```scss
// src/styles/main.scss
$primary: #0d6efd; // یا رنگ برند خودت

@import 'bootstrap/scss/bootstrap';
```

در layout:

```ts
import '../styles/main.scss';
```

می‌توانی فقط بخش‌های لازم Bootstrap را import کنی تا باندل سبک‌تر شود (طبق مستند Bootstrap — advanced).

برای شروع کلاس، همان `bootstrap.min.css` کافی است.

---

## قدم ۹: RTL (فارسی) — نکتهٔ عملی

Bootstrap ۵ پشتیبانی RTL دارد (`bootstrap.rtl.min.css`) وقتی `dir="rtl"` روی صفحه باشد.

در `app.html` می‌توانی:

```html
<html lang="fa" dir="rtl">
```

و به‌جای CSS معمولی:

```ts
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
```

اگر کل UI فارسی/راست‌چین است، از اول RTL را انتخاب کن تا فاصله‌ها و floatها درست بیفتند.

---

## قدم ۱۰: Icons و پکیج‌های کمکی

```bash
npm install bootstrap-icons
```

```ts
import 'bootstrap-icons/font/bootstrap-icons.css';
```

```html
<i class="bi bi-heart"></i>
```

کامپوننت‌های Svelte مخصوص Bootstrap (مثل wrapperهای جامعه) اختیاری‌اند؛ اول کلاس خام را یاد بگیر.

---

## قدم ۱۱: تداخل با استایل scoped

CSS Bootstrap سراسری است.  
`<style>` داخل `.svelte` به‌طور پیش‌فرض scoped است و معمولاً قوی روی همان کامپوننت می‌ماند.

اگر دکمه‌ات هم `btn` دارد هم استایل scoped عجیب:

1. اول scoped اضافی را کم کن  
2. یا از `:global(.btn)` فقط وقتی لازم است با احتیاط استفاده کن  

برای Counter آموزشی، می‌توانی دکمه‌ها را به `btn btn-outline-secondary` عوض کنی یا ظاهر خودش را نگه داری — هر دو درست است.

---

## قدم ۱۲: چک‌لیست افزودن به همین ریپو

1. `npm install bootstrap`  
2. در `src/routes/+layout.svelte` خط `import 'bootstrap/dist/css/bootstrap.min.css';`  
3. در `+page.svelte` یک `container` و `btn` تست کن  
4. اگر UI فارسی است: `dir="rtl"` + `bootstrap.rtl.min.css`  
5. JS را فقط در صورت نیاز با `onMount` لود کن  
6. CDN موازی اضافه نکن  

فعلاً لازم نیست Express یا چیز دیگری درگیر شود — همان `npm run dev`.

---

## قدم ۱۳: اشتباهات رایج

1. **import Bootstrap JS بدون توجه به SSR** → `document is not defined`  
2. **import CSS در هر صفحه** → تکراری و شلوغ  
3. **CDN + npm همزمان**  
4. **گذاشتن مسیر اشتباه در `app.html` به فایل داخل `node_modules`** (Vite آن را مثل static سرو نمی‌کند)  
5. **فکر کردن Bootstrap جای Form Actions / `$state` را می‌گیرد**  
6. **لود کل JS فقط برای یک دکمهٔ رنگی** — برای رنگ همان CSS کافی است  

---

## جمع‌بندی

- برای SvelteKit بهترین مسیر: `npm install bootstrap` و import CSS در `+layout.svelte`.  
- کلاس‌ها را روی markup صفحات/کامپوننت‌ها بگذار.  
- JSِ Bootstrap اختیاری است و باید فقط در مرورگر (`onMount`) لود شود.  
- برای فارسی، RTL را از اول درست انتخاب کن.  
- یک منبع CSS سراسری؛ بدون دوباره‌کاری CDN+npm.  
- پروژهٔ فعلی هنوز Bootstrap ندارد؛ با دو قدم نصب + import در layout راه می‌افتد.

## تمرین

1. Bootstrap را نصب کن و در layout ریشه CSS را import کن؛ یک دکمهٔ `btn btn-success` در صفحهٔ اصلی بگذار.  
2. یک ردیف `row` با دو `col-md-6` بساز و Counter را داخل یکی از ستون‌ها بگذار.  
3. توضیح بده چرا `import 'bootstrap'` مستقیم بالای script ممکن است در SSR خطا بدهد و راه‌حل چیست.  
4. (امتیازی) بین `bootstrap.min.css` و `bootstrap.rtl.min.css` برای یک صفحهٔ فارسی انتخاب کن و دلیلش را یک جمله بنویس.
