# درس ۱۸: State Management در Svelte و SvelteKit

## هدف درس
بعد از این درس می‌فهمی «state» چیست، انواعش در اپ SvelteKit کدام‌اند، با `$state` / `$derived` / props / context / ماژول `.svelte.ts` / URL / snapshots چطور مدیریتش کنی، و چرا روی سرور نباید state را در متغیر سراسری نگه داری.

## پیش‌نیاز
- درس ۸ (runeها — مخصوصاً `$state` و `$derived`)
- درس ۶ (کامپوننت و Counter)
- درس ۱۴ و ۱۵ (`data` از سرور در برابر state کلاینت)

---

## قدم ۱: State یعنی چه؟

**State** = داده‌ای که UI به آن واکنش نشان می‌دهد و در طول زمان عوض می‌شود.

مثال‌ها:

- عدد شمارنده  
- باز/بسته بودن منو  
- کاربر لاگین‌شده  
- فیلتر جدول  
- متن پیش‌نویس فرم  

**State Management** یعنی تصمیم بگیری:

1. این داده کجا زندگی کند؟  
2. چه کسی بخواند/بنویسد؟  
3. با رفرش، ناوبری، یا کاربر دیگر چه شود؟  

در اپ فقط‌کلاینتی ساده‌تر است. در SvelteKit چون **سرور + چند کاربر + SSR** داری، باید مراقب نشتی داده بین درخواست‌ها باشی.

---

## قدم ۲: نقشهٔ انواع state در SvelteKit

| نوع | مثال | کجا نگه دار |
|-----|------|-------------|
| UI محلی | باز بودن مودال | `$state` داخل کامپوننت |
| UI مشترک درخت | تم سایدبار برای فرزندان | context یا props |
| UI سراسری کلاینت | ترجیح theme (فقط مرورگر) | ماژول `.svelte.ts` (با احتیاط SSR) |
| دادهٔ سرور برای رندر | پست بلاگ، پروفایل | `load` → `data` (نه store سراسری) |
| هویت درخواست | session | کوکی + `locals` + DB |
| قابل‌اشتراک‌گذاری / SEO | مرتب‌سازی جدول | URL (`?sort=`) |
| موقت بین عقب/جلو | اسکرول یا آکاردئون | snapshots |

قانون طلایی:

> دادهٔ کاربر و سرور را در متغیر سراسری ماژول روی سرور نگذار.

---

## قدم ۳: State محلی با `$state` و `$derived`

پایهٔ Svelte ۵ — همان Counter:

```ts
let count = $state(0);
let doubled = $derived(count * 2);
```

در `+page.svelte` همین پروژه:

```ts
let lastValue = $state(0);
```

و Counter با callback به والد خبر می‌دهد:

```svelte
<Counter onchange={(value) => (lastValue = value)} />
```

این ساده‌ترین و درست‌ترین الگو برای اکثر UIهاست:

1. state جایی بماند که مصرف می‌شود  
2. اگر والد لازم دارد بداند → callback یا `$bindable`  
3. محاسبات → `$derived` نه کپی دستی  

---

## قدم ۴: Props — state را پایین بفرست (lifting)

گاهی چند فرزند یک مقدار را می‌بینند:

```svelte
<script lang="ts">
	let query = $state('');
</script>

<SearchBox bind:value={query} />
<Results {query} />
```

- منبع حقیقت در والد است  
- به پایین پاس داده می‌شود  
- برای دادهٔ دوطرفه از `$bindable` (درس ۸) استفاده کن  

در SSR بهتر است state را **پایین** بفرستی تا بالا؛ آپدیت از فرزند به والد هنگام SSR ممکن است دیر برسد و flash بسازد.

---

## قدم ۵: Context — بدون prop drilling

وقتی وسط درخت به داده نیاز داری و نمی‌خواهی از ده لایه prop رد کنی:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
	import { setContext } from 'svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// تابع برای حفظ واکنش‌پذیری
	setContext('user', () => data.user);
</script>

{@render children()}
```

```svelte
<!-- یک کامپوننت پایین‌تر -->
<script lang="ts">
	import { getContext } from 'svelte';

	const user = getContext<() => { name: string } | null>('user');
</script>

<p>سلام {user()?.name}</p>
```

چرا در Kit مهم است؟

- روی سرور، state سراسری بین درخواست‌ها خطرناک است  
- context به **درخت همان درخواست/همان hydrate** وصل است و نشت نمی‌کند  
- خودِ `page` از `$app/state` هم پشت صحنه با الگوی context کار می‌کند  

می‌توانی شیء `$state` را هم در context بگذاری؛ برای primitiveها معمولاً getter/تابع رد کن تا reactivity قطع نشود.

---

## قدم ۶: اشتراک در ماژول `.svelte.ts` (کلاینت)

```ts
// src/lib/stores/ui.svelte.ts
export const ui = $state({
	sidebarOpen: true,
	theme: 'light' as 'light' | 'dark'
});
```

```svelte
<script lang="ts">
	import { ui } from '#lib/stores/ui.svelte';
</script>

<button onclick={() => (ui.sidebarOpen = !ui.sidebarOpen)}>منو</button>
```

قواعد مهم:

1. **شیء را export کن و فیلد را عوض کن** — نه `export let count = $state(0)` با reassign از فایل دیگر  
2. روی سرور اگر این state را با دادهٔ کاربر mutate کنی، ممکن است به درخواست بعدی نشت کند  
3. اگر SSR داری و داده per-user است → context یا فقط `data`؛ ماژول سراسری را برای UI خالص کلاینت نگه دار  
4. اگر مطمئنی SSR نداری، ماژول سراسری آزادتر است — ولی در مسیر یادگیری Kit معمولاً SSR هست  

---

## قدم ۷: خطر بزرگ — shared state روی سرور

هرگز چنین چیزی ننویس:

```ts
// ❌ خطرناک
let user: any;

export const load = () => ({ user });

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		user = { name: data.get('name') }; // همهٔ کاربران این را می‌بینند!
	}
};
```

سرور Node طولانی‌عمر و مشترک است. متغیر ماژول = حافظهٔ مشترک بین Alice و Bob.

به‌جایش:

- کوکی نشست  
- دیتابیس  
- `return` از `load` / action  

و در `load` هم side-effect روی store سراسری نزن:

```ts
// ❌
userStore.set(await getUser());

// ✅
return { user: await getUser() };
```

---

## قدم ۸: Server state در برابر Client state

| Server / درخواست | Client / مرورگر |
|------------------|-----------------|
| `load` → `data` | `$state` در کامپوننت |
| `locals` در hooks | theme، مودال، draft UI |
| کوکی + DB | snapshot اسکرول |
| Form action نتیجه → `form` | state موقت فرم قبل از submit |

`data` را با `$state` قاطی نکن به‌عنوان منبع حقیقت سرور.  
اگر از `data` مقدار محاسبه می‌کنی:

```ts
// ❌ یک‌بار حساب می‌شود و با ناوبری کهنه می‌ماند
const minutes = data.content.split(' ').length / 250;

// ✅
let minutes = $derived(data.content.split(' ').length / 250);
```

چون Kit هنگام ناوبری کامپوننت را معمولاً **از نو نمی‌سازد**؛ فقط `data` عوض می‌شود. پس باید reactive باشی.

اگر عمداً می‌خواهی کامپوننت کامل ریست شود:

```svelte
{#key page.url.pathname}
	<BlogPost {data} />
{/key}
```

---

## قدم ۹: `$app/state` — state رسمی اپ

```ts
import { page, navigating } from '$app/state';
```

| مورد | کاربرد |
|------|--------|
| `page.url` | مسیر و query فعلی |
| `page.params` | پارامترهای دینامیک |
| `page.data` | دادهٔ ادغام‌شدهٔ loadها |
| `page.form` | نتیجهٔ آخرین form action |
| `page.status` / `page.error` | وضعیت خطا |
| `navigating` | آیا ناوبری در جریان است؟ |

این‌ها جایگزین بسیاری از «store سراسری خودت برای route» می‌شوند.

(در نسخه‌های قدیمی‌تر `$app/stores` با `$page` بود؛ در مسیر جدید `$app/state` را ترجیح بده.)

---

## قدم ۱۰: URL به‌عنوان state

برای فیلتر، تب، مرتب‌سازی که:

- با رفرش بماند  
- قابل لینک دادن باشد  
- روی SSR اثر بگذارد  

بهترین جا اغلب **query string** است:

```text
/products?sort=price&order=asc
```

- در `load`: `url.searchParams.get('sort')`  
- در UI: `page.url.searchParams`  
- با `<a href="?sort=price">` یا `goto`  

مزیت: دکمهٔ Back مرورگر رایگان کار می‌کند و لینک را می‌شود اشتراک گذاشت.

---

## قدم ۱۱: Snapshots — state موقت تاریخچه

برای چیزهایی مثل «آکاردئون باز بود» که:

- لازم نیست در URL باشد  
- با برگشت Back خوب است برگردد  
- در DB ذخیره نمی‌کنی  

SvelteKit **snapshots** دارد: state را به یک history entry می‌چسباند.  
جزئیات API را وقتی به UX پیچیده رسیدی در مستند [State management](https://svelte.dev/docs/kit/state-management) ببین؛ مفهومش را الان بدان کافی است.

---

## قدم ۱۲: Stores قدیمی (`writable`) کجا می‌مانند؟

قبل از runeها، `writable` / `readable` / `derived` از `svelte/store` ابزار اصلی بودند.

در Svelte ۵:

- برای state عادی → `$state` و `.svelte.ts`  
- store هنوز برای قرارداد subscribe، RxJS، یا کتابخانه‌های قدیمی مفید است  
- لازم نیست برای شمارنده یا تم ساده store بسازی  

اگر کد قدیمی دیدی:

```ts
import { writable } from 'svelte/store';
export const count = writable(0);
// در قالب: $count
```

معادل ذهنی جدید:

```ts
export const app = $state({ count: 0 });
// app.count
```

---

## قدم ۱۳: اتصال به همین پروژه

الان چه stateای داری؟

| جا | state |
|----|--------|
| `Counter.svelte` | `count` محلی + derived |
| `+page.svelte` | `lastValue` + ارتباط با `onchange` |
| سرور | هنوز `load`/session state نداری |

گام‌های طبیعی بعدی:

1. state UI بیشتر با `$state` محلی  
2. کاربر از `load` → `data` → شاید context در layout  
3. فیلترها در URL  
4. فقط برای UI کلاینتی خالص، `ui.svelte.ts`  

---

## قدم ۱۴: درخت تصمیم سریع

```text
آیا فقط یک کامپوننت لازم دارد؟
  → $state همان‌جا

آیا والد و چند فرزند؟
  → props / bindable

آیا عمیق در درخت بدون prop drilling؟
  → context (مخصوصاً با SSR)

آیا از سرور برای رندر می‌آید؟
  → load → data (هرگز store سراسری در load)

آیا باید لینک‌پذیر / بعد از رفرش بماند؟
  → URL

آیا فقط UI کلاینت و بدون دادهٔ کاربر؟
  → .svelte.ts اختیاری

آیا هویت/راز کاربر است؟
  → کوکی + DB + locals — نه حافظهٔ ماژول سرور
```

---

## قدم ۱۵: اشتباهات رایج

1. **متغیر سراسری روی سرور برای user**  
2. **`store.set` داخل `load`**  
3. **محاسبه از `data` بدون `$derived` و تعجب از ناوبری**  
4. **Reduxگونه پیچیده کردن اپ کوچک**  
5. **reassign کردن `export let count = $state(0)` از فایل دیگر**  
6. **گذاشتن دادهٔ per-user در ماژول `.svelte.ts` در حالی که SSR روشن است**  
7. **فکر کردن `data` همان `$state` قابل mutate برای ذخیره در DB است**  

---

## جمع‌بندی

- State Management در Kit = انتخاب جای درست برای هر جور داده، با حساسیت به SSR و چندکاربره بودن سرور.  
- روزمره: `$state` / `$derived` / props.  
- درخت عمیق: context.  
- دادهٔ سرور: `load` → `data` / `page.data`.  
- اشتراک کلاینتی UI: `.svelte.ts` با mutate فیلدها — نه راز کاربر.  
- لینک‌پذیر: URL؛ موقت تاریخچه: snapshots.  
- Storeهای قدیمی اختیاری‌اند؛ runeها مسیر اصلی Svelte ۵ هستند.  
- در پروژهٔ فعلی، Counter نمونهٔ تمیز state محلی + اطلاع به والد است.

## تمرین

1. یک `$state` برای باز/بسته کردن یک باکس توضیح در `+page.svelte` بساز — بدون هیچ store.  
2. توضیح بده چرا آرایهٔ `messages` در حافظهٔ ماژول سرور (دموی guestbook درس ۱۶) برای production خطرناک/ضعیف است.  
3. برای فیلتر `?q=` روی یک لیست فرضی بنویس state را کجا می‌خوانی (`load` و UI) و چرا بهتر از `$state` تنها است.  
4. فرق «state در context از `data.user`» با «`export const user = $state(...)` در ماژول» را از نظر SSR در دو جمله بگو.
