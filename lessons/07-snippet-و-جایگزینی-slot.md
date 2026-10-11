# درس ۷: Snippet، `{@render}`، `children` و جایگزینی Slot در Svelte 5

## هدف درس
بعد از این درس می‌فهمی در Svelte ۴ مفهوم **slot** چه بود، چرا در Svelte ۵ با **snippet** جایگزین شد، چطور با `{@render}` قطعهٔ UI را نشان می‌دهی، و چرا در `+layout.svelte` همین پروژه می‌نویسیم `{@render children()}`.

## پیش‌نیاز
- درس ۶ (کامپوننت‌های Svelte و `$props`)
- دیدن فایل `src/routes/+layout.svelte` در همین پروژه

---

## قدم ۱: مشکل را با یک جمله بفهم

گاهی کامپوننت «قاب» است و **محتوای وسطش را والد تعیین می‌کند**:

- یک `Card` که عنوان ثابت دارد، ولی بدنه را صفحه می‌دهد  
- یک `Modal` که دکمه‌ها را خودش دارد، ولی متن داخلش از بیرون می‌آید  
- یک `+layout.svelte` که هدر/فاوآیکون دارد، ولی **صفحهٔ فعلی** را وسطش می‌گذارد  

در Svelte ۴ این کار با **slot** بود.  
در Svelte ۵ همان نقش را **snippet** + **`{@render}`** بازی می‌کند.

---

## قدم ۲: Slot در Svelte ۴ چطور بود؟ (مرور کوتاه)

### Slot پیش‌فرض

```svelte
<!-- Box.svelte — Svelte 4 -->
<div class="box">
  <slot />
</div>
```

```svelte
<!-- استفاده -->
<Box>
  <p>سلام</p>
</Box>
```

هرچه بین تگ‌های `<Box>...</Box>` می‌نوشتی، جای `<slot />` قرار می‌گرفت.

### Named slot

```svelte
<!-- Panel.svelte — Svelte 4 -->
<header>
  <slot name="header" />
</header>
<main>
  <slot />
</main>
<footer>
  <slot name="footer" />
</footer>
```

```svelte
<Panel>
  <h2 slot="header">عنوان</h2>
  <p>بدنه</p>
  <span slot="footer">پایین</span>
</Panel>
```

### Slot با داده (slot props)

```svelte
<!-- Svelte 4 -->
<slot {item} />
```

```svelte
<List let:item>
  <p>{item.name}</p>
</List>
```

این مدل کار می‌کرد، ولی با بقیهٔ سیستم props/رویدادها یکدست نبود و برای TypeScript و ترکیب‌های پیچیده سخت‌تر می‌شد.

---

## قدم ۳: Snippet چیست؟

**Snippet** یک **قطعهٔ نشانه‌گذاری (markup) قابل‌استفادهٔ مجدد** است که:

- می‌توانی داخل همان فایل تعریفش کنی  
- یا به‌عنوان **prop** به کامپوننت دیگر بدهی  
- و هر جا لازم شد با `{@render ...}` نمایشش بدهی  

ذهنی شبیه «تابع UI» است: وقتی صداش بزنی، آن تکه HTML/Svelte رندر می‌شود.

### تعریف snippet داخل همان فایل

```svelte
{#snippet hello(name)}
	<p>سلام {name}</p>
{/snippet}

{@render hello('سجاد')}
{@render hello('کلاس')}
```

| بخش | معنی |
|-----|------|
| `{#snippet hello(name)}` | قطعه‌ای به نام `hello` با پارامتر `name` |
| بدنه | همان markup |
| `{@render hello('سجاد')}` | اجرای آن قطعه با آرگومان |

بدون `{@render}` فقط تعریف کرده‌ای؛ چیزی روی صفحه دیده نمی‌شود.

---

## قدم ۴: `{@render}` دقیقاً چه می‌کند؟

`{@render snippet(args)}` یعنی:

> همین حالا این snippet را با این آرگومان‌ها اینجا بکش روی صفحه.

قوانین مهم:

1. چیزی که render می‌کنی باید **snippet** باشد (یا `undefined` / اختیاری با احتیاط).  
2. اگر ممکن است نباشد، شرط بگذار:

```svelte
{#if header}
	{@render header()}
{/if}
```

یا با مقدار پیش‌فرض در props (پایین‌تر).

3. فراخوانی شبیه تابع است: `children()` با پرانتز — حتی اگر پارامتری نگیرد.

---

## قدم ۵: `children` — جایگزین slot پیش‌فرض

در Svelte ۵، محتوایی که بین تگ باز/بستهٔ کامپوننت می‌نویسی، به‌صورت خودکار به propی به نام **`children`** تبدیل می‌شود.  
نوعش **snippet** است.

### کامپوننت

```svelte
<!-- Box.svelte — Svelte 5 -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="box">
	{@render children()}
</div>
```

### استفاده

```svelte
<Box>
	<p>سلام</p>
</Box>
```

اینجا:

1. `<p>سلام</p>` می‌شود محتوای snippetِ `children`  
2. داخل `Box` با `{@render children()}` همانجا نشان داده می‌شود  

### مقایسه سریع

| Svelte 4 | Svelte 5 |
|----------|----------|
| `<slot />` | `{@render children()}` |
| محتوا بین تگ‌ها → slot پیش‌فرض | محتوا بین تگ‌ها → prop به نام `children` |
| نیازی به گرفتن prop نبود | معمولاً `let { children } = $props()` |

---

## قدم ۶: همین پروژه — `+layout.svelte`

فایل واقعی پروژه:

```svelte
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

معنی قدم‌به‌قدم:

1. SvelteKit برای layout یک prop به نام `children` می‌سازد.  
2. مقدار `children` یک **snippet** است که محتوای صفحهٔ فعلی (مثلاً `+page.svelte`) را دارد.  
3. `{@render children()}` آن صفحه را داخل layout نشان می‌دهد.  

بدون این خط، هدر/فاوآیکون می‌ماند ولی **بدنهٔ صفحه دیده نمی‌شود**.

تصویر ذهنی:

```text
+layout.svelte
┌─────────────────────────────┐
│ favicon در <head>           │
│                             │
│  {@render children()}  ──►  │  محتوای +page.svelte
│                             │
└─────────────────────────────┘
```

اگر بعداً هدر یا فوتر مشترک بسازی، معمولاً این شکلی می‌شود:

```svelte
<header>سایت من</header>

<main>
	{@render children()}
</main>

<footer>© کلاس SvelteKit</footer>
```

---

## قدم ۷: Named snippet — جایگزین named slot

به‌جای `slot="header"`، snippet را **به‌نام** به کامپوننت می‌دهی.

### کامپوننت

```svelte
<!-- Panel.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		header?: Snippet;
		children: Snippet;
		footer?: Snippet;
	};

	let { header, children, footer }: Props = $props();
</script>

<section class="panel">
	{#if header}
		<header>{@render header()}</header>
	{/if}

	<main>{@render children()}</main>

	{#if footer}
		<footer>{@render footer()}</footer>
	{/if}
</section>
```

### استفاده در والد

```svelte
<Panel>
	{#snippet header()}
		<h2>عنوان پنل</h2>
	{/snippet}

	<p>این متن همان children است (snippet پیش‌فرض).</p>

	{#snippet footer()}
		<small>پاورقی</small>
	{/snippet}
</Panel>
```

نکته‌های مهم:

- `{#snippet header()}` وقتی **مستقیم داخل** `<Panel>...</Panel>` باشد، به‌عنوان prop به نام `header` پاس داده می‌شود.  
- هرچه snippet نام‌دار نباشد و بین تگ‌ها بماند → `children`.  
- نام snippet باید با نام prop یکی باشد (`header` با `header`).

### جدول مهاجرت

| Svelte 4 | Svelte 5 |
|----------|----------|
| `<slot name="header" />` | `{@render header?.()}` یا با `{#if header}` |
| `<h2 slot="header">` | `{#snippet header()}<h2>...</h2>{/snippet}` |
| `<slot />` پیش‌فرض | `{@render children()}` |

---

## قدم ۸: Snippet با پارامتر — جایگزین slot props

گاهی لیست‌زن می‌خواهد برای هر آیتم، UI را از بیرون بگیرد.

### Svelte ۴ (یادآوری)

```svelte
<slot {item} />
<!-- والد: let:item -->
```

### Svelte ۵

```svelte
<!-- FancyList.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Item = { id: number; title: string };

	type Props = {
		items: Item[];
		row: Snippet<[Item]>; // یک آرگومان از نوع Item
	};

	let { items, row }: Props = $props();
</script>

<ul>
	{#each items as item (item.id)}
		<li>{@render row(item)}</li>
	{/each}
</ul>
```

```svelte
<FancyList items={todos}>
	{#snippet row(item)}
		<strong>{item.title}</strong>
	{/snippet}
</FancyList>
```

اینجا `row` مثل یک تابع UI است: کامپوننت داخلی `item` را می‌دهد، والد تصمیم می‌گیرد چطور نشانش دهد.

---

## قدم ۹: snippet اختیاری و مقدار پیش‌فرض

اگر snippet نیامد، می‌توانی پیش‌فرض بدهی:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children
	}: {
		children?: Snippet;
	} = $props();
</script>

{#if children}
	{@render children()}
{:else}
	<p>محتوایی نفرستاده‌اند.</p>
{/if}
```

یا در خود تعریف props با snippet پیش‌فرض (الگوی پیشرفته‌تر) — برای شروع همان `{#if}` کافی و خوانا است.

---

## قدم ۱۰: چرا Svelte این تغییر را داد؟

دلایل کاربردی برای شاگرد:

1. **یکدست با props**  
   children و header هم مثل `label` و `initial` از `$props()` می‌آیند؛ مدل ذهنی یکی است.

2. **TypeScript قوی‌تر**  
   با نوع `Snippet` و `Snippet<[Item]>` می‌شود قرارداد را تایپ کرد.

3. **قدرت بیشتر**  
   snippet را می‌شود در متغیر نگه داشت، شرطی render کرد، یا چند بار صدا زد.

4. **کمتر جادوی مخصوص slot**  
   دیگر `slot="..."` و `let:item` جدا از بقیهٔ زبان نیست؛ همان مفهوم «تابع UI + render» است.

---

## قدم ۱۱: اشتباهات رایج

1. **نوشتن `children` بدون `{@render}`**  
   `{children}` معمولاً همان چیزی که می‌خواهی نیست؛ باید `{@render children()}`.

2. **فراموش کردن پرانتز**  
   درست: `{@render children()}`  
   غلط رایج: `{@render children}`

3. **انتظار داشتن `<slot />` در Svelte ۵**  
   در کامپوننت‌های جدید دیگر از slot استفاده نکن (مگر کد قدیمی).

4. **نام اشتباه snippet**  
   `{#snippet title()}` فقط وقتی به propِ `title` وصل می‌شود که کامپوننت همان نام را در `$props` گرفته باشد.

5. **فکر کردن که `children` فقط برای layout است**  
   خیر؛ هر کامپوننت wrapper می‌تواند `children` داشته باشد. Layout فقط یک نمونهٔ خیلی مهم در SvelteKit است.

6. **تداخل با محتوای پیش‌فرض و named snippet**  
   محتوای بدون نام → `children`  
   تکه‌های `{#snippet name()}` → props نام‌دار  
   قاطی کردنشان در ذهن، باگ UI می‌سازد.

---

## قدم ۱۲: چک‌لیست ذهنی

وقتی می‌خواهی «محتوا از بیرون داخل کامپوننت برود»:

1. آیا فقط یک حفرهٔ وسط است؟ → `children` + `{@render children()}`  
2. آیا چند ناحیه است (هدر/بدنه/فوتر)؟ → چند snippet نام‌دار  
3. آیا داده هم باید به آن قطعه برگردد؟ → `Snippet<[T]>` و `{@render row(item)}`  
4. در layout کیت؟ → همان `children` که Kit می‌دهد را render کن  

---

## جمع‌بندی

- در Svelte ۴ برای تزریق محتوا **slot** داشتیم.  
- در Svelte ۵ جایش را **snippet** گرفته است.  
- `{@render snippet()}` قطعه را روی صفحه می‌آورد.  
- محتوای بین تگ‌های کامپوننت → propِ **`children`** (از نوع snippet).  
- named slot → `{#snippet name()}` + prop هم‌نام + `{@render name()}`.  
- slot props → پارامترهای snippet مثل `row(item)`.  
- در همین پروژه، `{@render children()}` داخل `+layout.svelte` همان جایی است که صفحهٔ فعلی داخل قالب مشترک نشان داده می‌شود.

## تمرین

1. با نگاه به `src/routes/+layout.svelte` توضیح بده اگر خط `{@render children()}` را حذف کنی، در مرورگر چه چیزی می‌ماند و چه چیزی می‌رود.  
2. یک کامپوننت فرضی `Card.svelte` با `children` طراحی کن (فقط روی کاغذ یا در کد) و یک عنوان را با prop معمولی `title: string` بده — فرق prop متنی با prop از نوع snippet را بنویس.  
3. جدول مهاجرت سه‌ردیفی برای پروژهٔ خودت بنویس: یک مورد slot پیش‌فرض، یک named slot، یک slot با داده — و معادل Svelte ۵ هر کدام.
