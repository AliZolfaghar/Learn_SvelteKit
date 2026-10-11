# درس ۸: Runeهای Svelte 5 — راهنمای کامل

## هدف درس
بعد از این درس می‌فهمی **rune** چیست، چرا در Svelte ۵ آمده، هر rune اصلی و فرعی چه کاری می‌کند، و چطور همان‌ها را در کامپوننت‌هایی مثل `Counter` و صفحات SvelteKit استفاده کنی.

## پیش‌نیاز
- درس ۶ (کامپوننت‌ها و Counter)
- درس ۷ (snippet و `$props` برای `children`)
- دانستن که پروژه با **Svelte 5** است (`svelte` در `package.json`)

---

## قدم ۱: Rune چیست؟

**Rune** علامت‌هایی با پیشوند `$` هستند که به **کامپایلر Svelte** می‌گویند رفتار reactive چطور باشد.

ظاهرشان شبیه تابع است:

```ts
let count = $state(0);
```

ولی تابع معمولی JavaScript نیستند:

| ویژگی | معنی |
|--------|------|
| import نمی‌خواهند | جزء خود زبان Svelteاند |
| نمی‌شود به متغیر پاس‌شان داد | `$state` را مثل مقدار جابه‌جا نکن |
| فقط در جای درست مجازند | بیرون از `.svelte` / `.svelte.js` / `.svelte.ts` کار نمی‌کنند |

اگر Svelte را یک زبان بدانی، runeها **کلمهٔ کلیدی** آن زبان‌اند.

---

## قدم ۲: چرا rune آمد؟ (مقایسه با Svelte 4)

در Svelte ۴ واکنش‌پذیری اغلب **حدسی** بود:

| Svelte 4 | معنی ضمنی |
|----------|-----------|
| `let count = 0` بالای کامپوننت | reactive است |
| `$: doubled = count * 2` | مشتق / گاهی side effect |
| `export let name` | prop |
| store + پیشوند `$count` | اشتراک state بین فایل‌ها |

مشکل‌ها:

1. بیرون از بالای `.svelte` جادو قطع می‌شد  
2. با استخراج منطق به تابع، وابستگی‌ها گم می‌شدند  
3. دو مدل موازی: reactivity کامپوننت + store  

در Svelte ۵ **صریح** می‌نویسی چه چیزی state است، چه چیزی derived، چه چیزی effect.

### جدول مهاجرت سریع

| Svelte 4 | Svelte 5 |
|----------|----------|
| `let x = 0` (بالای کامپوننت) | `let x = $state(0)` |
| `$: y = x * 2` | `let y = $derived(x * 2)` |
| `$: { console.log(x) }` | `$effect(() => { console.log(x) })` |
| `export let name` | `let { name } = $props()` |
| `bind:` روی هر prop | فقط propهای `$bindable()` |

---

## قدم ۳: نقشهٔ همهٔ Runeها

گروه‌بندی بر اساس کار:

### ۱) State — مقدار تغییرپذیر
- `$state`
- `$state.raw`
- `$state.snapshot`
- `$state.eager`

### ۲) Derived — مقدار محاسبه‌شده
- `$derived`
- `$derived.by`

### ۳) Effect — اثر جانبی
- `$effect`
- `$effect.pre`
- `$effect.root`
- `$effect.tracking`
- `$effect.pending`

### ۴) Props — ورودی کامپوننت
- `$props`
- `$props.id`
- `$bindable`

### ۵) ابزار و خاص
- `$inspect` / `$inspect.trace` (عمدتاً dev)
- `$host` (custom element)

برای کار روزمره معمولاً همین چهار تا کافی است:

> `$state` · `$derived` · `$effect` · `$props`

بقیه را وقتی به مسئلهٔ خاص خوردی یاد بگیر.

---

## قدم ۴: `$state` — قلب واکنش‌پذیری

```ts
let count = $state(0);
count += 1; // UI وابسته به‌روز می‌شود
```

مثل متغیر عادی می‌خوانی و می‌نویسی؛ کامپایلر پشت صحنه آن را به signal تبدیل می‌کند.

### در همین پروژه

`Counter.svelte`:

```ts
let count = $state(initial);
```

`+page.svelte`:

```ts
let lastValue = $state(0);
```

### Deep reactivity (پیش‌فرض)

شیء و آرایه داخل `$state` معمولاً **عمیق** reactive می‌شوند:

```ts
let user = $state({ name: 'سجاد', tags: ['svelte'] });

user.name = 'Sajad';     // UI به‌روز می‌شود
user.tags.push('kit');   // UI به‌روز می‌شود
```

لازم نیست کل شیء را عوض کنی (برخلاف خیلی از الگوی‌های store قدیمی).

### دام رایج: destructure کردن state

```ts
let user = $state({ name: 'سجاد' });
let { name } = user; // واکنش‌پذیری این کپی از بین می‌رود
```

برای خواندن در markup مستقیماً `user.name` را استفاده کن، یا از الگوی درست reactive استفاده کن.

---

## قدم ۵: خانواده‌ٔ `$state`

### `$state.raw`

برای دادهٔ بزرگ که نمی‌خواهی proxy عمیق بسازی:

```ts
let payload = $state.raw(bigJson);

payload.foo = 1;                 // UI را تریگر نمی‌کند
payload = { ...payload, foo: 1 }; // فقط جایگزینی کل مقدار تریگر می‌کند
```

وقتی: پاسخ API بزرگ، کانفیگ تقریباً ثابت، دادهٔ فقط‌خواندنی.

### `$state.snapshot`

کپی ساده و غیرproxy از state — وقتی API بیرونی با Proxy مشکل دارد:

```ts
await fetch('/api/save', {
	method: 'POST',
	body: JSON.stringify($state.snapshot(user))
});
```

### `$state.eager`

در سناریوهای خاص (مثلاً به‌روزرسانی پشت `await`) خواندن را طوری حساس‌تر می‌کند که UI ورودی کاربر عقب نماند. برای شمارندهٔ ساده لازم نیست؛ وقتی «کلیک کردم ولی aria/کلاس یک فریم دیر عوض شد» دیدی سراغش برو.

---

## قدم ۶: `$derived` و `$derived.by`

`$derived` مقداری است که **فقط از روی بقیه** حساب می‌شود:

```ts
let count = $state(0);
let doubled = $derived(count * 2);
let isEven = $derived(count % 2 === 0);
```

در `Counter` همین پروژه دقیقاً همین دو derived را داری.

قوانین ذهنی:

1. خودت معمولاً به derived **assign** نکن تا منبع حقیقت بماند.  
2. اگر محاسبه فقط یک عبارت است → `$derived(...)`  
3. اگر چند خط / شرط پیچیده است → `$derived.by(() => { ... return value })`

```ts
let label = $derived.by(() => {
	if (count === 0) return 'خالی';
	if (count > 10) return 'زیاد';
	return 'عادی';
});
```

### `$derived` در برابر `$effect`

| می‌خواهی… | استفاده کن |
|-----------|------------|
| مقدار جدید برای نشان دادن در UI | `$derived` |
| کار بیرونی: `localStorage`، `fetch`، `console`، تایمر | `$effect` |

اگر با `$effect` داری state می‌سازی که می‌توانست derived باشد، معمولاً اشتباه طراحی است.

---

## قدم ۷: `$effect` و انواعش

`$effect` وقتی dependencyهای داخلش عوض شوند دوباره اجرا می‌شود:

```ts
$effect(() => {
	console.log('count =', count);
});
```

### Cleanup

اگر تایمر/اشتراک باز می‌کنی، از تابع برگشتی برای پاکسازی استفاده کن:

```ts
$effect(() => {
	const id = setInterval(() => {
		count += 1;
	}, 1000);

	return () => clearInterval(id);
});
```

قبل از اجرای دوباره (یا destroy شدن کامپوننت)، cleanup قبلی صدا زده می‌شود.

### فقط سمت مرورگر

`$effect` در SSR اجرا نمی‌شود (مخصوص کار کلاینت است). برای منطق سرور از `load` / APIهای Kit استفاده کن.

### `$effect.pre`

مثل effect است ولی **قبل از** به‌روزرسانی DOM اجرا می‌شود. برای اندازه‌گیری/همگام‌سازی دقیق با DOM قبلی به‌ندرت لازم می‌شود.

### `$effect.root`

یک درخت effect دستی می‌سازد که به lifecycle کامپوننت وصل نیست؛ خودت باید disposeاش کنی. برای کتابخانه‌ها و state بیرون از کامپوننت پیشرفته است — در کلاس مبتدی لازم نیست.

### `$effect.tracking` و `$effect.pending`

ابزارهای پیشرفته‌تر:

- `$effect.tracking()` → آیا الان داخل یک tracking context هستیم؟  
- `$effect.pending()` → مربوط به وضعیت‌های async/pending در مدل جدیدتر  

برای Counter و صفحات اول دوره، نادیده گرفتنشان اشکالی ندارد.

---

## قدم ۸: `$props` و `$bindable`

### `$props`

همهٔ ورودی‌های کامپوننت از یک جا:

```ts
let { initial = 0, step = 1, label = 'شمارنده', onchange } = $props();
```

همین الگو در `Counter` و گرفتن `children` در `+layout.svelte` استفاده شده:

```ts
let { children }: LayoutProps = $props();
```

امکانات رایج:

```ts
let { title, ...rest } = $props(); // rest props
let { name: userName } = $props(); // تغییر نام
```

### `$props.id`

یک id پایدار برای همان نمونهٔ کامپوننت — مفید برای اتصال `label` و `input`:

```ts
const id = $props.id();
```

```svelte
<label for="{id}-email">ایمیل</label>
<input id="{id}-email" />
```

### `$bindable` — داده دوطرفه

در Svelte ۵ به‌طور پیش‌فرض propها bindable نیستند. اگر والد باید `bind:value` کند:

```svelte
<!-- InputBox.svelte -->
<script lang="ts">
	let { value = $bindable('') }: { value?: string } = $props();
</script>

<input bind:value={value} />
```

```svelte
<!-- والد -->
<script lang="ts">
	let text = $state('');
</script>

<InputBox bind:value={text} />
```

بدون `$bindable`، `bind:value` روی آن prop کار درست/مجاز نیست.

---

## قدم ۹: `$inspect` و `$host`

### `$inspect` (عمدتاً توسعه)

برای دیباگ واکنش‌پذیری:

```ts
$inspect(count);
$inspect(count).with(console.trace);
```

در production معمولاً حذف یا بی‌اثر می‌شود؛ ابزار یادگیری و دیباگ است نه منطق اصلی اپ.

`$inspect.trace` برای ردگیری عمیق‌تر وابستگی‌هاست وقتی «چرا این دوباره اجرا شد؟» می‌پرسی.

### `$host`

برای وقتی کامپوننت را به‌صورت **custom element** بسته‌بندی می‌کنی و به عنصر میزبان DOM نیاز داری. در اپ معمولی SvelteKit به‌ندرت استفاده می‌شود.

---

## قدم ۱۰: Rune بیرون از کامپوننت — فایل `.svelte.ts`

یکی از بزرگ‌ترین بردهای Svelte ۵: همان runeها در ماژول‌های خاص هم کار می‌کنند.

نام فایل باید شبیه این باشد:

- `counter.svelte.ts`
- `app-state.svelte.js`

مثال مفهومی اشتراک state:

```ts
// src/lib/stores/app.svelte.ts
export const app = $state({
	theme: 'light',
	lastCount: 0
});
```

```svelte
<script lang="ts">
	import { app } from '#lib/stores/app.svelte.ts';
</script>

<p>{app.theme}</p>
<button onclick={() => (app.theme = 'dark')}>تاریک</button>
```

### نکتهٔ مهم export

export کردن یک **مقدار اولیهٔ primitive که reassign می‌شود** اغلب آن‌طور که فکر می‌کنی reactive نمی‌ماند. الگوهای امن‌تر:

1. export کردن **شیء** reactive و mutate کردن فیلدها  
2. کلاس با فیلد `$state`  
3. توابع getter/setter  

Stores قدیمی (`writable`) منسوخ اعلام نشده‌اند، ولی برای state جدید معمولاً rune کافی است.

---

## قدم ۱۱: اتصال به چیزی که در پروژه داری

| فایل | Runeهای درگیر |
|------|----------------|
| `Counter.svelte` | `$props`، `$state`، `$derived` |
| `+page.svelte` | `$state` (+ callback به‌جای bind) |
| `+layout.svelte` | `$props` برای `children` (snippet) |

جریان داده در صفحهٔ فعلی:

```text
+page: lastValue = $state(0)
        │
        │ onchange(value)  ←──  Counter داخل خودش count = $state(...)
        ▼
   lastValue به‌روز می‌شود → متن صفحه عوض می‌شود
```

اینجا از `$bindable` استفاده نشده؛ ارتباط با **callback prop** است (الگوی یک‌طرفهٔ تمیز). هر دو معتبرند؛ bindable وقتی حس «این همان متغیر والد است» قوی باشد مناسب‌تر است.

---

## قدم ۱۲: ترتیب یادگیری پیشنهادی (برای کلاس)

1. `$state` روی عدد و رشته  
2. `$derived` ساده  
3. `$props` با مقدار پیش‌فرض  
4. رویداد + عوض کردن state  
5. شیء/آرایه در `$state`  
6. `$effect` + cleanup فقط وقتی واقعاً side effect داری  
7. `$bindable`  
8. `.svelte.ts` برای state مشترک  
9. بقیه (`raw`, `snapshot`, `eager`, `effect.root`, …) بر اساس نیاز  

---

## قدم ۱۳: اشتباهات رایج

1. **به‌جای derived از effect برای ساخت مقدار UI استفاده کردن**  
2. **destructure کردن `$state` شیء و انتظار reactivity**  
3. **فکر کردن `$effect` در سرور هم اجرا می‌شود**  
4. **`$bindable` نذاشتن و انتظار `bind:`**  
5. **استفاده از rune داخل `.ts` معمولی** (باید `.svelte.ts` باشد)  
6. **`$state` را به متغیر assign کردن** مثل `const s = $state` — مجاز نیست  
7. **همگام کردن prop با state فقط با effect** وقتی کافی است از همان prop / derived استفاده کنی  

---

## جمع‌بندی

- Runeها دستورات کامپایلر Svelte ۵ با پیشوند `$` هستند.  
- واکنش‌پذیری را صریح و قابل‌حمل می‌کنند (حتی بیرون از `.svelte`).  
- ستون فقرات روزمره: `$state`، `$derived`، `$effect`، `$props`.  
- `$bindable` برای داده دوطرفه؛ `$state.raw` / `snapshot` / `eager` برای موارد خاص.  
- `$inspect` برای دیباگ؛ `$host` برای custom element.  
- در همین پروژه، Counter و صفحه و layout نمونه‌های واقعی `$state` / `$derived` / `$props` هستند.  
- اگر مقدار «از روی بقیه حساب می‌شود» → derived؛ اگر «با دنیای بیرون حرف می‌زند» → effect.

## تمرین

1. در `Counter` یک `$derived` جدید به نام `status` بساز که برای `0` بگوید «صفر»، برای مثبت «مثبت»، برای منفی «منفی» و در UI نشان بده.  
2. یک `$effect` موقتی بنویس که هر بار `count` عوض شد مقدار را در `console.log` چاپ کند؛ بعد توضیح بده چرا برای نشان دادن روی صفحه به‌جایش باید derived/markup استفاده کنی.  
3. یک کامپوننت کوچک با `let { open = $bindable(false) } = $props()` طراحی کن و از صفحه با `bind:open` کنترلش کن — فرق این الگو را با `onchange` در Counter بنویس.
