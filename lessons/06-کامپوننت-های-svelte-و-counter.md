# درس ۶: کامپوننت‌های Svelte در SvelteKit (با مثال Counter)

## هدف درس
بعد از این درس می‌فهمی کامپوننت Svelte چیست، کجا در پروژهٔ SvelteKit قرار می‌گیرد، چطور با **Svelte 5** (runes) state و props می‌سازی، و یک شمارندهٔ واقعی را در صفحه استفاده می‌کنی.

## پیش‌نیاز
- درس‌های ۱ و ۲ (ساختار پروژه و `#lib`)
- اجرای برنامه با خود SvelteKit: `npm run dev`  
  (فعلاً روی مسیر Express کار نمی‌کنیم؛ بعداً در صورت نیاز برمی‌گردیم)

---

## قدم ۱: کامپوننت چیست؟

**کامپوننت** یک تکه UI قابل استفادهٔ مجدد است: HTML + منطق + استایل، داخل یک فایل `.svelte`.

به‌جای اینکه همهٔ کد را داخل `+page.svelte` بریزی، بخش‌های تکراری یا مستقل را جدا می‌کنی:

| بدون کامپوننت | با کامپوننت |
|----------------|-------------|
| صفحه شلوغ و سخت برای نگهداری | صفحه فقط «مونتاژ» می‌کند |
| کپی‌پیست برای استفادهٔ دوباره | یک بار بنویس، چند جا import کن |

در SvelteKit، کامپوننت‌های معمولی Svelte همان‌طور کار می‌کنند که در یک اپ خالص Svelte.  
SvelteKit دورشان **مسیریابی، SSR، load و …** می‌چیند؛ خود کامپوننت همان UI تعاملی است.

---

## قدم ۲: کامپوننت را کجا بگذاریم؟

قرارداد رایج در همین پروژه:

```text
src/lib/components/Counter.svelte
```

- `src/lib/` → کد مشترک قابل import
- `components/` → فقط کامپوننت‌های UI (اختیاری ولی مرتب)

صفحات و layoutها در `src/routes/` می‌مانند (`+page.svelte`, `+layout.svelte`).  
آن‌ها هم فایل `.svelte` هستند، ولی نقششان «مسیر/قالب صفحه» است، نه لزوماً قطعهٔ قابل استفادهٔ مجدد.

### import با `#lib`

طبق تنظیم پروژه (SvelteKit 3):

```ts
import Counter from '#lib/components/Counter.svelte';
```

معادل ذهنی: از فولدر `src/lib/...` بیاور.

---

## قدم ۳: سه بخش یک فایل `.svelte`

هر کامپوننت معمولاً تا سه بخش دارد:

```svelte
<script lang="ts">
  // منطق، state، props، توابع
</script>

<!-- نشانه‌گذاری (markup) -->

<style>
  /* استایل محدود به همین کامپوننت (scoped) */
</style>
```

| بخش | نقش |
|-----|-----|
| `<script>` | TypeScript/JavaScript |
| markup | HTML + دستورات Svelte مثل `{count}` و `{#if}` |
| `<style>` | CSS که به‌صورت پیش‌فرض فقط روی همین کامپوننت اثر دارد |

---

## قدم ۴: واکنش‌پذیری با `$state` و `$derived` (Svelte 5)

در **Svelte 5** به‌جای `let count = 0` قدیمیِ جادویی، از **runes** استفاده می‌کنیم.

### `$state` — مقدار تغییرپذیر

```ts
let count = $state(0);
```

هر جا در markup از `count` استفاده کنی، با تغییرش UI به‌روز می‌شود.

### `$derived` — مقدار محاسبه‌شده از روی state

```ts
let doubled = $derived(count * 2);
let isEven = $derived(count % 2 === 0);
```

خودت `doubled` را دستی عوض نکن؛ وقتی `count` عوض شود، مشتق‌ها هم تازه می‌شوند.

در کامپوننت `Counter` همین الگو پیاده شده است.

---

## قدم ۵: ورودی از بیرون با `$props`

والد می‌تواند به کامپوننت داده بدهد (مثل attribute در HTML).

```ts
type Props = {
  initial?: number;
  step?: number;
  label?: string;
  onchange?: (value: number) => void;
};

let { initial = 0, step = 1, label = 'شمارنده', onchange }: Props = $props();
```

| prop | معنی در Counter |
|------|------------------|
| `initial` | مقدار شروع |
| `step` | گام + و − |
| `label` | عنوان |
| `onchange` | تابعی که والد می‌دهد تا از تغییر باخبر شود |

استفاده در صفحه:

```svelte
<Counter initial={0} step={1} label="شمارنده آموزشی" />
```

نکته: بعد از mount، عوض کردن `initial` از طرف والد به‌طور خودکار `count` داخلی را عوض نمی‌کند مگر خودت با `$effect` همگام‌سازی کنی. برای شمارندهٔ آموزشی، مقدار اولیه معمولاً یک‌بار کافی است.

---

## قدم ۶: رویدادها و ارتباط با والد

### رویداد DOM داخل کامپوننت

در Svelte 5 به‌جای `on:click` قدیمی، از ویژگی‌های معمولی DOM استفاده می‌کنیم:

```svelte
<button type="button" onclick={increment}>+</button>
```

### خبر دادن به والد (callback prop)

به‌جای `createEventDispatcher` قدیمی، یک prop تابعی می‌دهی:

```ts
onchange?.(count);
```

در صفحه:

```svelte
<Counter
  onchange={(value) => {
    lastValue = value;
  }}
/>
```

این الگوی رایج Svelte 5 است: **داده‌ها پایین می‌آیند (props)، رویدادها بالا می‌روند (callback).**

---

## قدم ۷: نشانه‌گذاری شرطی و اتصال کلاس

### نمایش شرطی

```svelte
{#if isEven}
  <p>عدد زوج است</p>
{:else}
  <p>عدد فرد است</p>
{/if}
```

### چاپ مقدار

```svelte
<p>{count}</p>
```

### کلاس شرطی

```svelte
<p class="value" class:even={isEven}>{count}</p>
```

یعنی اگر `isEven` درست باشد، کلاس `even` اضافه می‌شود.

سایر بلوک‌های مهم (برای ادامهٔ یادگیری):

| دستور | کاربرد |
|--------|---------|
| `{#each items as item}` | لیست |
| `{#await promise}` | دادهٔ async |
| `{@render snippet()}` | قطعهٔ UI قابل ارسال (مثل children در layout) |

در `+layout.svelte` همین پروژه از `{@render children()}` استفاده شده؛ آن هم خانوادهٔ snippet است.

---

## قدم ۸: استایل scoped

CSS داخل `<style>` همان فایل، به‌طور پیش‌فرض فقط روی عناصر همان کامپوننت اعمال می‌شود.  
یعنی `.value` در `Counter` صفحهٔ دیگر را خراب نمی‌کند.

اگر روزی خواستی استایل سراسری بدهی، معمولاً در layout یا فایل CSS全局 می‌گذاری — نه داخل هر کامپوننت کوچک.

---

## قدم ۹: Counter واقعی در همین پروژه

فایل ساخته‌شده:

`src/lib/components/Counter.svelte`

و در صفحهٔ اصلی:

`src/routes/+page.svelte`

```svelte
<script lang="ts">
  import Counter from '#lib/components/Counter.svelte';

  let lastValue = $state(0);
</script>

<Counter
  initial={0}
  step={1}
  label="شمارنده آموزشی"
  onchange={(value) => {
    lastValue = value;
  }}
/>

<p>آخرین مقدار گزارش‌شده از کامپوننت: <strong>{lastValue}</strong></p>
```

برای دیدن نتیجه:

```bash
npm run dev
```

مرورگر را باز کن، دکمه‌های + / − / ریست را بزن و ببین هم عدد داخل Counter عوض می‌شود، هم متن «آخرین مقدار» در صفحه.

برای production بدون Express (مسیر فعلی کلاس):

```bash
npm run build
npm start
```

---

## قدم ۱۰: چه چیزهایی را در کامپوننت بگذاریم، چه چیزهایی را نه؟

| مناسب داخل کامپوننت UI | معمولاً جای دیگر |
|-------------------------|-------------------|
| نمایش، کلیک، state محلی | گرفتن داده از سرور (`+page.server.ts` / `load`) |
| props و ظاهر | منطق دسترسی/احراز هویت |
| انیمیشن و فرم ساده | تنظیمات محیطی (`.env`) |

قانون سرانگشتی:  
**کامپوننت = قطعهٔ دیداری/تعاملی.**  
**مسیر (route) = صفحه + داده + آدرس URL.**

---

## قدم ۱۱: چک‌لیست یادگیری کامپوننت در SvelteKit

این موارد را برای کار روزمره با کامپوننت‌ها بلد باش:

1. فایل `.svelte` با سه بخش script / markup / style  
2. جای مناسب: `src/lib/components/`  
3. import با `#lib/...`  
4. `$state` برای state محلی  
5. `$derived` برای مقادیر محاسبه‌شده  
6. `$props` برای ورودی از والد  
7. `onclick={...}` و سایر رویدادهای DOM  
8. callback prop مثل `onchange` برای صحبت با والد  
9. `{#if}` / `{#each}` / چاپ `{value}`  
10. `class:name={شرط}`  
11. CSS scoped  
12. استفاده داخل `+page.svelte` یا کامپوننت دیگر  
13. دانستن که SSR اول HTML می‌سازد و بعد در مرورگر hydrate می‌شود تا دکمه کار کند  

هنوز عمداً عمیق نشده‌ایم (برای درس‌های بعد): store سراسری، context، form actions، transitionها، و کامپوننت‌های خیلی پیچیده با snippet.

---

## جمع‌بندی

- کامپوننت Svelte قطعهٔ قابل استفادهٔ مجدد UI است و در SvelteKit همان‌طور استفاده می‌شود.
- جای رایج: `src/lib/components/` و import با `#lib`.
- در Svelte 5 با `$state`، `$derived` و `$props` کار می‌کنیم.
- Counter نمونهٔ کامل کوچک است: props، state، derived، رویداد، شرط، کلاس، استایل، و ارتباط با والد.
- فعلاً اجرای برنامه با خود Kit است (`dev` / `start`)؛ Express را کنار گذاشته‌ایم تا روی خود Svelte تمرکز کنیم.

## تمرین

1. یک `Counter` دوم در همان صفحه بگذار با `initial={10}` و `step={5}` و برچسب متفاوت.  
2. prop جدیدی مثل `max` اضافه کن تا وقتی `count` به سقف رسید، دکمهٔ + غیرفعال شود (`disabled={count >= max}`).  
3. توضیح بده چرا `lastValue` در `+page.svelte` با `onchange` عوض می‌شود، ولی خودِ `count` داخل Counter از بیرون مستقیم دیده نمی‌شود.
