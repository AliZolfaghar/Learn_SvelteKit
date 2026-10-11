# درس ۹: TypeScript لازم برای کار با SvelteKit

## هدف درس
بعد از این درس، همان بخش‌هایی از TypeScript را بلدی که واقعاً در SvelteKit روزمره به‌کارت می‌آید: تایپ props، دادهٔ صفحه، فایل‌های `$types`، `app.d.ts`، و خواندن خطاهای `svelte-check` — بدون غرق شدن در کل زبان TypeScript.

## پیش‌نیاز
- درس‌های ۶ تا ۸ (کامپوننت، snippet، rune)
- آشنایی خیلی کم با JavaScript (متغیر، تابع، شیء، آرایه)

---

## قدم ۱: TypeScript اینجا چه نقشی دارد؟

TypeScript = JavaScript + **توضیح نوع داده‌ها** برای ابزارها و ویرایشگر.

در SvelteKit کمک می‌کند:

1. قبل از اجرا بفهمی prop اشتباه داده‌ای (`step="یک"` به‌جای عدد)  
2. بدانی `data` برگشتی از `load` چه فیلدهایی دارد  
3. اشتباهات تایپی در `+page.server.ts` و کامپوننت را زود ببینی  
4. autocomplete دقیق‌تری در VS Code / Cursor بگیری  

لازم نیست کل TypeScript را بلد باشی. برای شروع SvelteKit، یک زیرمجموعهٔ کوچک کافی است.

در همین پروژه:

- `tsconfig.json` با `"strict": true`
- کامپوننت‌ها `lang="ts"` دارند
- دستور بررسی: `npm run check` (همان `svelte-check`)

---

## قدم ۲: انواع پایه که مدام می‌بینی

| نوع | مثال | معنی |
|-----|------|------|
| `string` | `'شمارنده'` | متن |
| `number` | `0`, `3.14` | عدد |
| `boolean` | `true` / `false` | بله/خیر |
| `null` | `null` | عمداً خالی |
| `undefined` | `undefined` | مقدار ندارد |
| `void` | تابع بدون return مفید | «چیزی برنگردان» |
| `unknown` | دادهٔ نامشخص امن‌تر از `any` | بعداً باید تنگ‌ترش کنی |
| `any` | هر چیزی | حتی‌الامکان پرهیز کن |

آرایه و شیء:

```ts
let tags: string[] = ['svelte', 'kit'];
let user: { name: string; age: number } = { name: 'سجاد', age: 30 };
```

اتحاد نوع (union) — خیلی پرکاربرد:

```ts
let status: 'idle' | 'loading' | 'error' = 'idle';
let id: string | number = 1;
```

اختیاری با `?`:

```ts
type Props = {
	label?: string; // می‌تواند نباشد
};
```

یعنی `label` یا `string` است یا اصلاً در شیء نیست (عملاً با `undefined` سروکار داری).

---

## قدم ۳: `type` و `interface` — همین‌قدر کافی است

هر دو برای توصیف شکل داده استفاده می‌شوند.

```ts
type Props = {
	initial?: number;
	step?: number;
	label?: string;
	onchange?: (value: number) => void;
};
```

```ts
interface Props {
	initial?: number;
	step?: number;
}
```

در عمل برای props کامپوننت، **`type`** کاملاً رایج و کافی است (مثل `Counter.svelte`).

تفاوت‌های پیشرفتهٔ type/interface را فعلاً لازم نیست حفظ کنی. یک قرارداد ساده:

- شکل props / دادهٔ صفحه → `type` یا `interface`
- اتحاد (`A | B`) و بعضی ترکیب‌ها → معمولاً `type`

---

## قدم ۴: تایپ تابع و callback

در Counter، والد یک تابع می‌دهد:

```ts
onchange?: (value: number) => void;
```

خواندن این خط:

1. `onchange` اختیاری است (`?`)  
2. یک تابع است  
3. یک آرگومان `number` می‌گیرد  
4. چیزی برنمی‌گرداند (`void`)

استفاده:

```ts
onchange?.(count); // اگر بود صدا بزن
```

الگوی کلی:

```ts
type Handler = (event: MouseEvent) => void;
type Mapper = (n: number) => string;
```

---

## قدم ۵: TypeScript داخل فایل `.svelte`

بالای اسکریپت:

```svelte
<script lang="ts">
  // اینجا TypeScript مجاز است
</script>
```

بدون `lang="ts"`، تایپ‌ها یا کار نمی‌کنند یا محدودند. در این پروژه صفحه و layout و Counter همه با `lang="ts"` هستند.

### تایپ props با `$props` (Svelte 5)

الگوی توصیه‌شده — همان Counter:

```ts
type Props = {
	initial?: number;
	step?: number;
	label?: string;
	onchange?: (value: number) => void;
};

let { initial = 0, step = 1, label = 'شمارنده', onchange }: Props = $props();
```

اینجا TypeScript می‌فهمد:

- `initial` عدد است  
- `onchange` یا تابع است یا `undefined`  
- اگر کسی `<Counter initial="hi" />` بدهد، `svelte-check` / ویرایشگر اعتراض می‌کند  

### تایپ `Snippet` برای children

وقتی محتوا از بیرون می‌آید (درس ۷):

```ts
import type { Snippet } from 'svelte';

type Props = {
	children: Snippet;
	header?: Snippet;
	row?: Snippet<[ { id: number; title: string } ]>;
};
```

`Snippet<[Item]>` یعنی این قطعه موقع render یک `Item` می‌گیرد.

`import type` یعنی «فقط نوع را بیاور، در خروجی JS چیزی import نشود» — برای type-only درست و تمیز است.

---

## قدم ۶: فایل‌های تولیدشدهٔ `$types` — جادوی SvelteKit

در `+layout.svelte` همین پروژه:

```ts
import type { LayoutProps } from './$types';

let { children }: LayoutProps = $props();
```

`./$types` را خودت نمی‌نویسی؛ SvelteKit بعد از sync/build آن را برای هر مسیر می‌سازد.

انواع رایجی که در route می‌بینی:

| نوع | کجا | معنی تقریبی |
|-----|-----|-------------|
| `PageProps` | `+page.svelte` | props صفحه، از جمله `data` |
| `LayoutProps` | `+layout.svelte` | props قالب، از جمله `children` و `data` |
| `PageData` | تایپ `data` صفحه | شکل داده‌ای که `load` برمی‌گرداند |
| `LayoutData` | تایپ `data` layout | دادهٔ layout |
| `PageServerData` | مخصوص load سرور | دادهٔ فقط سرور |
| `ActionData` | فرم‌ها | خروجی form action |
| `RouteParams` / `PageParams` | پارامتر URL | مثل `[id]` |

مثال ذهنی برای بعداً:

```ts
// +page.svelte
import type { PageProps } from './$types';

let { data }: PageProps = $props();
// data اینجا تایپ دقیق همان چیزی است که load برگردانده
```

```ts
// +page.server.ts یا +page.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { title: 'خانه' };
};
```

اگر `title` را number برگردانی، TypeScript در صفحه هم همان را انتظار دارد و زنجیرهٔ تایپ حفظ می‌شود.

---

## قدم ۷: `src/app.d.ts` — تایپ‌های سراسری اپ

در پروژه:

```ts
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
```

این فایل برای **گسترش تایپ‌های داخلی Kit** است. وقتی از حالت کامنت درشان بیاوری:

| Interface | کاربرد |
|-----------|--------|
| `App.Locals` | داده روی `event.locals` (مثلاً کاربر لاگین‌شده در hooks) |
| `App.PageData` | شکل مشترک/پایه برای `data` صفحات |
| `App.Error` | شکل شیء خطا برای صفحات error |
| `App.PageState` | state کلاینتی shallow routing |
| `App.Platform` | چیزهای مخصوص adapter (مثلاً Cloudflare) |

مثال آموزشی برای آینده:

```ts
declare global {
	namespace App {
		interface Locals {
			user?: { id: string; name: string };
		}
	}
}

export {};
```

بعد در `hooks.server.ts` و `load`، `event.locals.user` autocomplete و چک نوعی دارد.

`export {}` لازم است تا فایل به‌عنوان module شناخته شود.

---

## قدم ۸: `tsconfig.json` در SvelteKit چه می‌گوید؟

```json
{
  "extends": "$app/tsconfig",
  "compilerOptions": {
    "strict": true
  },
  "include": ["src", "vite.config.ts"]
}
```

| مورد | معنی برای تو |
|------|----------------|
| `extends: "$app/tsconfig"` | تنظیمات پیشنهادی Kit را ارث ببر (pathها، انواع خاص Svelte و …) |
| `strict: true` | سخت‌گیرانه: `null`/`undefined` را جدی بگیر، implicit any کمتر |
| `include` | کدام فایل‌ها بررسی شوند |

با `strict` باید عادت کنی:

```ts
onchange?.(count);           // امن
// onchange(count);          // اگر اختیاری باشد، خطا می‌دهد
```

```ts
let n: number | undefined = maybe();
if (n !== undefined) {
	console.log(n + 1); // اینجا n قطعاً number است
}
```

این همان «تنگ کردن نوع» (narrowing) است — خیلی در فرم و `load` می‌بینی.

---

## قدم ۹: Generic به زبان ساده (فقط مقداری که لازم است)

Generic = «نوع را پارامتر کن».

مثال‌هایی که در Kit/Svelte می‌بینی:

```ts
Promise<string>           // قولی که string می‌دهد
Array<number>             // همان number[]
Snippet<[Item]>           // snippet با یک آرگومان Item
Partial<Props>            // همهٔ فیلدهای Props اختیاری شوند
Pick<User, 'id' | 'name'> // فقط بعضی فیلدها
```

لازم نیست الان generic بنویسی؛ کافی است بخوانی‌شان:

> `Promise<Post[]>` یعنی «async که آرایه‌ای از Post برمی‌گرداند».

---

## قدم ۱۰: الگوهای TypeScript مخصوص مسیرهای SvelteKit

بعداً وقتی `load` و form را خواندی، این امضاها تکراری می‌شوند:

### Load سمت سرور

```ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	return {
		id: params.id
	};
};
```

### Load همگانی (سرور یا یونیورسال)

```ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/items');
	return { items: await res.json() };
};
```

### Actions فرم

```ts
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		return { ok: true };
	}
};
```

### تایپ کردن دستی دادهٔ JSON

وقتی `res.json()` می‌گیری، TypeScript پیش‌فرض `any` می‌بیند مگر بگویی:

```ts
type Item = { id: number; title: string };
const items: Item[] = await res.json();
// یا
const items = (await res.json()) as Item[];
```

`as` یعنی «من مطمئنم این شکل را دارد» — اگر API عوض شود، TS کمکت نمی‌کند. وقتی ممکن است، validation (مثلاً با zod) بهتر است؛ برای کلاس اول، `type` + `as` قابل قبول آموزشی است.

---

## قدم ۱۱: چیزهایی که برای شروع SvelteKit لازم نیست

عمداً عقب بینداز:

- Decoratorها  
- Namespaceهای پیچیده  
- Conditional types سنگین (`infer`, `extends` تو در تو)  
- ساختن library types حرفه‌ای  
- `enum` (اغلب union رشته‌ای ساده‌تر است)  
- کلاس‌های OOP پیچیده فقط برای تایپ  

اگر خطا دیدی که متنش خیلی پیشرفته بود، روی همان خطِ پروژه تمرکز کن: «چه مقداری انتظار می‌رفت و چه دادی؟»

---

## قدم ۱۲: ابزارها — ویرایشگر و `npm run check`

1. **خط قرمز در ادیتور**  
   همان TypeScript language service + افزونه Svelte است.

2. **`npm run check`**  
   `svelte-kit sync` تایپ‌های `$types` را تازه می‌کند، بعد `svelte-check` کل پروژه را بررسی می‌کند.

عادت خوب قبل از commit یا بعد از تغییر بزرگ:

```bash
npm run check
```

3. **`svelte-kit sync`**  
   اگر `./$types` پیدا نشد یا کهنه بود، یک بار sync/check معمولاً درستش می‌کند.

---

## قدم ۱۳: خواندن خطاهای رایج (به زبان شاگرد)

| پیام تقریبی | معنی ساده |
|-------------|-----------|
| `Type 'string' is not assignable to type 'number'` | متن دادی، عدد می‌خواست |
| `Object is possibly 'undefined'` | قبل از استفاده چک کن یا `?.` بگذار |
| `Property 'x' does not exist on type ...` | آن فیلد در تایپ تعریف نشده |
| `Module '"./$types"' has no exported member ...` | sync لازم است یا فایل route جفتش نیست |
| `Argument of type 'X' is not assignable to parameter of type 'Snippet'` | جای children/snippet چیز دیگری پاس دادی |

روش رفع کلی:

1. ببین نوع **انتظار** چیست  
2. ببین نوع **واقعی** چیست  
3. یا داده را درست کن، یا تایپ را (اگر تایپ غلط بوده)

---

## قدم ۱۴: حداقل چک‌لیست TypeScript برای هر فیچر SvelteKit

وقتی چیزی می‌سازی، این‌ها را مرور کن:

1. فایل `.svelte` → `lang="ts"`  
2. props → یک `type Props` + `$props()`  
3. callbackها → `(arg: T) => void`  
4. مقادیر اختیاری → `?` و استفاده با `?.`  
5. صفحه/layout → در صورت نیاز `PageProps` / `LayoutProps` از `./$types`  
6. `load`/actions → تایپ از `./$types`  
7. دادهٔ مشترک سرور → `App.Locals` در `app.d.ts`  
8. آخر کار → `npm run check`

اگر این هشت مورد را رعایت کنی، برای بخش بزرگی از مسیر یادگیری SvelteKit از نظر TypeScript آماده‌ای.

---

## قدم ۱۵: اتصال به کد فعلی پروژه

| فایل | TypeScriptاش را ببین |
|------|----------------------|
| `src/lib/components/Counter.svelte` | `type Props` و تابع `onchange` |
| `src/routes/+layout.svelte` | `import type { LayoutProps } from './$types'` |
| `src/routes/+page.svelte` | `lang="ts"` و `$state` (نوع از مقدار اولیه استنباط می‌شود) |
| `src/app.d.ts` | جای گسترش `App.Locals` و … |
| `tsconfig.json` | `strict: true` |

نکته دربارهٔ استنباط (inference):

```ts
let lastValue = $state(0); // TypeScript می‌فهمد number است
```

گاهی لازم نیست صریح بنویسی ` $state<number>(0) `؛ از مقدار اولیه می‌فهمد. وقتی مقدار اولیه `null` است یا مبهم است، تایپ صریح بده:

```ts
let user = $state<User | null>(null);
```

---

## جمع‌بندی

- برای SvelteKit لازم نیست TypeScriptدان کامل باشی؛ انواع پایه، `type`، اختیاری، union، تایپ تابع، و خواندن generic ساده کافی است.  
- در کامپوننت: `lang="ts"` + `type Props` + `$props()`.  
- در routeها: انواع تولیدشده از `./$types`.  
- در کل اپ: `app.d.ts` برای `Locals` / `Error` / …  
- `strict` یعنی `null` و `undefined` را جدی بگیر.  
- کیفیت را با `npm run check` قفل کن.  
- پیشرفته‌های زبان را وقتی به خطا یا نیاز مشخص خوردی یاد بگیر، نه از قبل.

## تمرین

1. به `Counter` یک prop اختیاری `max?: number` اضافه کن، تایپش را در `Props` بنویس، و اگر `count >= max` شد دکمهٔ + را `disabled` کن. بعد `npm run check` را اجرا کن.  
2. در `+page.svelte` به‌جای استنباط، بنویس `let lastValue = $state<number>(0)` و یک متغیر `let note = $state<string | null>(null)` بساز؛ در UI فقط وقتی `note !== null` است نشانش بده.  
3. توضیح بده فرق `import type { LayoutProps } from './$types'` با یک `type` دستی داخل همان فایل چیست و چرا Kit فایل `$types` را می‌سازد.
