# درس ۱۲: Layoutها در SvelteKit — راهنمای کامل

## هدف درس
بعد از این درس می‌فهمی `+layout.svelte` چیست، چرا بدون `{@render children()}` صفحه خالی می‌ماند، layout تو در تو و دادهٔ مشترک چطور کار می‌کند، گروه‌های `(app)` چه نقشی دارند، و چطور گاهی با `+page@` از زنجیرهٔ layout خارج شوی.

## پیش‌نیاز
- درس ۷ (snippet و `children`)
- درس ۱۰ (routing و درخت `src/routes`)
- دیدن فایل `src/routes/+layout.svelte` همین پروژه

---

## قدم ۱: Layout چیست؟

**Layout** قالب مشترکی است که دور یک یا چند صفحه پیچیده می‌شود: هدر، فوتر، سایدبار، فاوآیکون، پوستهٔ داشبورد و …

به‌جای کپی کردن هدر در هر `+page.svelte`، یک‌بار در `+layout.svelte` می‌نویسی و صفحات فقط «محتوای وسط» را می‌سازند.

| بدون layout | با layout |
|-------------|-----------|
| هدر در هر صفحه تکرار می‌شود | هدر یک‌بار در layout |
| تغییر منو = ویرایش چند فایل | تغییر منو = یک فایل |
| ساختار شکننده | ساختار درختی و واضح |

در SvelteKit layout فقط یک کامپوننت معمولی نیست؛ بخشی از **سیستم routing** است و با نام فایل `+layout.svelte` شناخته می‌شود.

---

## قدم ۲: Layout ریشه در همین پروژه

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
```

معنی خط‌به‌خط:

1. این فایل برای **همهٔ صفحات** زیر `src/routes` اعمال می‌شود (مگر بعداً با تکنیک‌های پیشرفته جدا شوی).  
2. `children` یک **snippet** است که محتوای سطح بعدی را دارد (صفحه یا layout فرزند).  
3. `{@render children()}` آن محتوا را نشان می‌دهد.  
4. بدون این خط، فاوآیکون می‌ماند ولی **بدنهٔ صفحه دیده نمی‌شود**.  
5. اگر اصلاً `+layout.svelte` ریشه نگذاری، Kit یک layout پیش‌فرض معادل همان `{@render children()}` در نظر می‌گیرد.

تصویر ذهنی برای `/` فعلی:

```text
+layout.svelte (ریشه)
┌────────────────────────────┐
│ <svelte:head> favicon      │
│                            │
│   {@render children()} ──► │  محتوای +page.svelte
│                            │  (عنوان، Counter، …)
└────────────────────────────┘
```

---

## قدم ۳: قانون درخت — layout مال فولدر و زیرش است

`+layout.svelte` روی **همان دایرکتوری و همهٔ زیرمسیرها** اثر دارد.

```text
src/routes/
├── +layout.svelte          ← همه چیز
├── +page.svelte            ← /
├── about/
│   └── +page.svelte        ← /about  (همان layout ریشه)
└── blog/
    ├── +layout.svelte      ← فقط /blog و زیرش
    ├── +page.svelte        ← /blog
    └── [slug]/
        └── +page.svelte    ← /blog/hello
```

برای `/blog/hello` زنجیره این است:

```text
routes/+layout.svelte
  └─ blog/+layout.svelte
       └─ blog/[slug]/+page.svelte
```

هر سطح باید `children` را render کند تا سطح بعدی دیده شود.

مثال layout بخش بلاگ:

```svelte
<!-- src/routes/blog/+layout.svelte -->
<script lang="ts">
	import type { LayoutProps } from './$types';
	let { children }: LayoutProps = $props();
</script>

<nav>
	<a href="/blog">همهٔ پست‌ها</a>
</nav>

<section class="blog-shell">
	{@render children()}
</section>
```

صفحهٔ `/about` این nav بلاگ را نمی‌گیرد؛ فقط layout ریشه را دارد.

---

## قدم ۴: `children` و تفاوت layout با کامپوننت معمولی

از نظر Svelte 5، layout هم مثل بقیه `$props` و snippet دارد (درس ۷).  
فرق مهمش با یک `Card.svelte` این است:

| | Layout (`+layout.svelte`) | کامپوننت در `#lib` |
|--|---------------------------|---------------------|
| چه کسی محتوا را می‌دهد؟ | سیستم routing / صفحهٔ فعلی | تو وقتی `<Card>...</Card>` می‌نویسی |
| روی کدام URLها؟ | خودکار بر اساس جای فایل | فقط جایی که import کنی |
| داده از `load`؟ | بله، `data` مخصوص layout | معمولاً props دستی |

پس:

- پوستهٔ مسیر → `+layout.svelte`  
- قطعهٔ UI قابل استفاده در چند جا → کامپوننت در `src/lib/components`

گاهی داخل layout یک کامپوننت reusable صدا می‌زنی — هر دو با هم خوب‌اند.

---

## قدم ۵: دادهٔ مشترک با `+layout.ts` / `+layout.server.ts`

مثل صفحه، layout هم می‌تواند `load` داشته باشد.

### یونیورسال

```ts
// src/routes/+layout.ts
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	return {
		siteName: 'یادگیری SvelteKit'
	};
};
```

### فقط سرور

```ts
// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
	};
};
```

در خود layout:

```svelte
<script lang="ts">
	import type { LayoutProps } from './$types';
	let { data, children }: LayoutProps = $props();
</script>

<header>{data.siteName}</header>
{@render children()}
```

### ارث‌بری `data`

دادهٔ layoutهای بالایی با دادهٔ پایین‌تر **ادغام** می‌شود و به صفحه هم می‌رسد.

مثال ذهنی:

- ریشه برمی‌گرداند `{ siteName }`  
- `blog` برمی‌گرداند `{ posts }`  
- صفحهٔ `[slug]` در `data` هم `siteName` را می‌بیند هم چیزهای خودش را  

پس منوی کاربر یا تنظیمات سایت را معمولاً در layout ریشه `load` می‌کنی، نه در هر صفحه.

**قانون سرانگشتی (مثل صفحات):** راز و DB → `+layout.server.ts`؛ دادهٔ عمومی → `+layout.ts`.

---

## قدم ۶: Page options روی layout

از `+layout.ts` / `+layout.server.ts` می‌توانی پیش‌فرض رفتار فرزندها را بدهی:

```ts
export const prerender = true;
export const ssr = true;
export const csr = true;
```

این مقادیر به‌عنوان **پیش‌فرض برای صفحات فرزند** استفاده می‌شوند؛ صفحه می‌تواند خودش override کند.

کاربرد: مثلاً کل بخش مستندات را `prerender = true` بگذار.

---

## قدم ۷: ناوبری و حفظ layout مشترک

وقتی کاربر با `<a href>` بین دو صفحه جابه‌جا می‌شود که **layout مشترک** دارند، SvelteKit آن layout را از نو نمی‌سازد؛ فقط بخش متفاوت (صفحه یا layoutهای پایین‌تر) عوض می‌شود.

فایده:

- state داخل layout (مثلاً منوی باز) می‌تواند بماند  
- کار کمتر و حس اپ سریع‌تر  

اگر به صفحه‌ای بروی که زنجیرهٔ layout فرق دارد، همان سطح‌هایی که فرق دارند عوض می‌شوند.

---

## قدم ۸: Layout و `+error.svelte`

`+error.svelte` هم در درخت مسیر معنی دارد.

- اگر در یک صفحه زیر `/blog` خطا بخورد، ممکن است `blog/+error.svelte` (در صورت وجود) یا ریشه نشان داده شود.  
- Layoutهای **بالای** جایی که error boundary فعال می‌شود معمولاً می‌مانند؛ جزئیات دقیق به محل پرتاب خطا بستگی دارد.  

برای شاگرد کافی است بداند:

> error صفحهٔ جایگزین برای بخش شکست‌خورده است؛ layout ریشه اغلب هنوز پوسته را نگه می‌دارد.

---

## قدم ۹: Route groups — `(name)` بدون تغییر URL

گاهی دو «دنیای UI» داری:

- بازاریابی: هدر ساده (`/about`, `/pricing`)  
- اپ: سایدبار (`/dashboard`, `/settings`)  

اگر فولدر عادی بسازی، نامش وارد URL می‌شود.  
با **گروه** داخل پرانتز، فقط برای سازماندهی و layout است:

```text
src/routes/
├── +layout.svelte                 ← پوستهٔ خیلی کلی (مثلاً فقط فونت/فاوآیکون)
├── (marketing)/
│   ├── +layout.svelte             ← هدر بازاریابی
│   ├── about/+page.svelte         → /about
│   └── pricing/+page.svelte       → /pricing
└── (app)/
    ├── +layout.svelte             ← سایدبار اپ
    ├── dashboard/+page.svelte     → /dashboard
    └── settings/+page.svelte      → /settings
```

`(marketing)` و `(app)` در آدرس دیده نمی‌شوند.

می‌توانی `+page.svelte` را مستقیم داخل گروه بگذاری تا `/` مال آن گروه شود.

### شکستن ارث فقط با گروه

در مثال بالا اگر `admin/+page.svelte` را **بیرون** از `(app)` و `(marketing)` بگذاری، فقط layout ریشه را می‌گیرد — نه سایدبار اپ و نه هدر مارکتینگ. این ساده‌ترین راه «صفحهٔ جدا» است.

---

## قدم ۱۰: خروج از زنجیره با `+page@` و `+layout@` (پیشرفته)

گاهی یک صفحه باید بعضی layoutهای میانی را رد کند (مثلاً `/item/5/embed` بدون سایدبار اپ).

نام فایل را با `@` و نام سگمنت هدف پسوند می‌دهی:

فرض زنجیره:

```text
/ + (app) + item + [id] + embed/page
```

گزینه‌ها (مفهومی):

| نام فایل | تقریباً از کجا به بعد ارث می‌برد |
|----------|-----------------------------------|
| `+page@(app).svelte` | از layout گروه `(app)` |
| `+page@item.svelte` | از layout فولدر `item` |
| `+page@[id].svelte` | از layout فولدر `[id]` |
| `+page@.svelte` | فقط از layout ریشه |

`+layout@.svelte` همان ایده را برای خود layout دارد: کل زیرشاخه‌ها از یک سطح بالاتر «ریست» می‌شوند.

### هشدار آموزشی

این قدرت‌مند ولی گیج‌کننده است. قبل از `@`:

1. آیا با `(group)` حل می‌شود؟  
2. آیا با یک کامپوننت مشترک + شرط ساده‌تر است؟  

مستندات رسمی هم می‌گوید مجبور نیستی برای هر outlier یک گروه پیچیده بسازی؛ composition هم معتبر است.

---

## قدم ۱۱: ترکیب بهتر از پیچاندن درخت — composition

الگوی تمیز:

```svelte
<!-- +layout@.svelte یا یک layout خاص -->
<script lang="ts">
	import Shell from '#lib/components/Shell.svelte';
	let { data, children } = $props();
</script>

<Shell {data}>
	{@render children()}
</Shell>
```

منطق `load` مشترک را هم می‌توانی در یک تابع در `#lib` بگذاری و از چند `+layout.server.ts` صدا بزنی.

یعنی: **درخت route برای URL و مرزهای واقعی؛ کامپوننت برای UI تکراری.**

---

## قدم ۱۲: props مهم layout در TypeScript

از `./$types`:

```ts
import type { LayoutProps } from './$types';

let { data, children }: LayoutProps = $props();
```

| prop | نقش |
|------|-----|
| `children` | snippet سطح بعدی (اجباری برای دیده شدن محتوا) |
| `data` | خروجی `load`های layout (و ادغام‌شده‌ها) |

برای فایل‌های load:

- `LayoutLoad` → `+layout.ts`  
- `LayoutServerLoad` → `+layout.server.ts`  

(جزئیات تایپ در درس ۹.)

---

## قدم ۱۳: اسکلت پیشنهادی برای ادامهٔ همین ریپو

با توجه به اینکه فعلاً فقط ریشه را داری، مسیر رشد طبیعی:

```text
src/routes/
├── +layout.svelte              ← فاوآیکون + شاید هدر ساده
├── +layout.server.ts           ← (بعداً) user از locals
├── +error.svelte
├── +page.svelte                ← /
├── about/+page.svelte
└── (app)/
    ├── +layout.svelte          ← پوستهٔ اپ با nav
    ├── counter/+page.svelte    ← انتقال Counter به اینجا (اختیاری)
    └── blog/
        ├── +layout.svelte
        └── [slug]/+page.svelte
```

گام اول عملی در کلاس: فقط به layout ریشه یک `<header>` و لینک اضافه کن و ببین هر صفحهٔ جدید همان هدر را دارد.

---

## قدم ۱۴: چک‌لیست تصمیم‌گیری

| سؤال | انتخاب |
|------|--------|
| برای همهٔ سایت است؟ | `src/routes/+layout.svelte` |
| فقط برای `/blog/*`؟ | `src/routes/blog/+layout.svelte` |
| دو پوستهٔ متفاوت بدون تغییر URL؟ | `(marketing)` / `(app)` |
| یک صفحه نباید سایدبار بگیرد؟ | اول گروه؛ اگر نشد `+page@...` |
| دادهٔ مشترک منو/کاربر؟ | `+layout.server.ts` ریشه |
| فقط UI تکراری بدون مرز مسیر؟ | کامپوننت در `#lib` |

---

## قدم ۱۵: اشتباهات رایج

1. **فراموش کردن `{@render children()}`** → صفحه سفید  
2. **گذاشتن کل منطق صفحه داخل layout** → layout باید پوسته باشد  
3. **راز را در `+layout.ts` آوردن** به‌جای `.server`  
4. **ساخت `(group)` تودرتوی بی‌دلیل** وقتی یک کامپوننت کافی است  
5. **فکر کردن نام `(app)` بخشی از URL است**  
6. **دو layout که هر دو فکر می‌کنند مسئول `<html>` / `<body>`اند** — آن‌ها در `app.html` هستند؛ layout معمولاً داخل body محتوا می‌چیند  
7. **استفاده زودهنگام از `+page@` قبل از فهم گروه‌ها**

---

## جمع‌بندی

- Layout قالب مشترک مسیر است؛ فایلش `+layout.svelte`.  
- همیشه با `{@render children()}` سطح بعدی را نشان بده.  
- Layoutها تو در تو می‌شوند و با ناوبری، مشترک‌ها حفظ می‌شوند.  
- دادهٔ مشترک با `+layout.ts` / `+layout.server.ts` و propِ `data` می‌آید.  
- `(group)` برای پوسته‌های متفاوت بدون تغییر URL است.  
- `+page@` / `+layout@` برای خروج پیشرفته از زنجیره است.  
- برای UI تکراری ساده، کامپوننت `#lib` را با layout قاطی نکن — هر کدام جای خود را دارند.  
- در پروژهٔ فعلی، ریشه فقط فاوآیکون + `children` دارد؛ جای طبیعی افزودن هدر/فوتر همینجاست.

## تمرین

1. در `src/routes/+layout.svelte` یک هدر با لینک به `/` و `/about` بگذار؛ صفحهٔ `about/+page.svelte` بساز و ببین هدر روی هر دو هست.  
2. یک `blog/+layout.svelte` با عنوان «بخش بلاگ» بساز و توضیح بده چرا `/about` آن عنوان را ندارد.  
3. با یک گروه `(app)`، یک layout سایدبار فرضی طراحی کن (حتی روی کاغذ) طوری که URLها `/dashboard` بمانند نه `/app/dashboard`.  
4. توضیح بده اگر `{@render children()}` را از layout ریشه حذف کنی، دقیقاً چه چیزی از صفحه می‌ماند و چه چیزی می‌رود.
