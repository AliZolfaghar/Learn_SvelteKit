# درس ۲۶: مدیریت خطاها و ساخت Function کمکی در SvelteKit

## هدف درس
بعد از این درس می‌فهمی SvelteKit خطا را چطور دسته‌بندی می‌کند، فرق `error()` و `fail()` و exception خام چیست، چطور یک لایهٔ helper در `#lib/server` برای پرتاب خطاهای یکدست بسازی، و `handleError` + `+error.svelte` + `App.Error` را به هم وصل کنی.

## پیش‌نیاز
- درس ۱۰ و ۱۴ (`+error.svelte` و `error` داخل `load`)
- درس ۱۱ (`handleError`)
- درس ۱۶ (`fail` در Form Actions)
- درس ۹ (`App.Error` در `app.d.ts`)

---

## قدم ۱: چرا «یک فانکشن مدیریت خطا»؟

اگر همه‌جا این را تکرار کنی:

```ts
if (!post) error(404, 'پست پیدا نشد');
if (!user) error(401, 'وارد شوید');
if (!allowed) error(403, 'دسترسی ندارید');
```

مشکلاتش:

- پیام‌ها ناهماهنگ می‌شوند  
- کد خطا (`code`) فراموش می‌شود  
- لاگ و ردیابی یکدست نیست  
- تایپ `App.Error` کامل استفاده نمی‌شود  

هدف helper:

> یک قرارداد واحد برای «خطای قابل‌نمایش به کاربر» بساز، بقیهٔ اپ فقط همان را صدا بزنند.

SvelteKit خودش موتور خطا را دارد (`error`, `handleError`, `+error.svelte`). تو معمولاً **دور همان‌ها** لایه می‌سازی، نه یک سیستم موازی.

---

## قدم ۲: چهار جور خطا در Kit

| نوع | چطور ساخته می‌شود | `kind` در `handleError` | به کاربر چه می‌رسد؟ |
|-----|-------------------|-------------------------|---------------------|
| App error | `error(404, '...')` از `@sveltejs/kit` | `'app'` | همان message/status که دادی (امن فرض می‌شود) |
| Framework | 404 مسیر، 405، 413، … | `'framework'` | پیام کوتاه امن مثل `Not Found` |
| Validation | آرگومان remote نامعتبر | `'validation'` | معمولاً 400؛ issues را خودت کنترل کن |
| Unknown | `throw new Error(...)` یا کرش DB | `'unknown'` | پیش‌فرض `{ status: 500, message: 'Internal Error' }` |

`redirect(...)` خطا نیست و به `handleError` نمی‌رود.

قانون طلایی:

- برای «کاربر اشتباه کرده / منبع نیست» → `error(...)` یا `fail(...)`  
- برای باگ غیرمنتظره → بگذار unknown بماند (یا بعد از لاگ، پیام عمومی برگردان)  
- **جزئیات داخلی و stack را به UI لو نده**

---

## قدم ۳: هستهٔ رسمی — `error()` از Kit

```ts
import { error } from '@sveltejs/kit';

error(404, 'Not found');
// یا با فیلد اضافه (اگر App.Error را گسترش داده باشی):
error(404, 'Not found', { code: 'NOT_FOUND' });
```

اثر:

1. پاسخ با status مناسب  
2. نزدیک‌ترین `+error.svelte` (برای خطاهای صفحه/`load`)  
3. عبور از `handleError` با `kind: 'app'`  

این تابع را **catch نکن** مگر عمداً خودت دوباره مدیریت کنی؛ وگرنه Kit نمی‌تواند صفحهٔ خطا را نشان دهد.

---

## قدم ۴: تعریف شکل خطا — `App.Error`

در `src/app.d.ts`:

```ts
declare global {
	namespace App {
		interface Error {
			code?: string;
			id?: string;
		}
	}
}

export {};
```

`status` و `message` از قبل جزو قراردادند.  
فیلدهای اضافه مثل `code` و `id` برای UI و پشتیبانی‌اند.

---

## قدم ۵: ساخت helper — لایهٔ اول (پرتاب یکدست)

```ts
// src/lib/server/errors.ts
import { error, type NumericRange } from '@sveltejs/kit';

type ErrorCode =
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'BAD_REQUEST'
	| 'CONFLICT'
	| 'INTERNAL';

const messages: Record<ErrorCode, string> = {
	UNAUTHORIZED: 'برای ادامه وارد شوید',
	FORBIDDEN: 'اجازهٔ این کار را ندارید',
	NOT_FOUND: 'مورد درخواستی پیدا نشد',
	BAD_REQUEST: 'درخواست نامعتبر است',
	CONFLICT: 'تداخل داده؛ دوباره تلاش کنید',
	INTERNAL: 'خطای داخلی سرور'
};

const statuses: Record<ErrorCode, NumericRange<400, 599>> = {
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	BAD_REQUEST: 400,
	CONFLICT: 409,
	INTERNAL: 500
};

/** خطای قابل‌انتظار اپ را با قرارداد یکسان پرتاب می‌کند */
export function appError(code: ErrorCode, message?: string): never {
	error(statuses[code], message ?? messages[code], { code });
}

export function notFound(message = messages.NOT_FOUND): never {
	appError('NOT_FOUND', message);
}

export function unauthorized(message = messages.UNAUTHORIZED): never {
	appError('UNAUTHORIZED', message);
}

export function forbidden(message = messages.FORBIDDEN): never {
	appError('FORBIDDEN', message);
}
```

استفاده در `load`:

```ts
import { notFound, unauthorized } from '#lib/server/errors';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) unauthorized();

	const post = await db('posts').where({ slug: params.slug }).first();
	if (!post) notFound('این پست وجود ندارد');

	return { post };
};
```

به‌جای تکرار `error(404, ...)` همه‌جا، نام خوانا داری و `code` همیشه می‌آید.

---

## قدم ۶: helper برای «نتیجه یا خطا» (اختیاری)

گاهی از توابع پایین‌دستی `null` برمی‌گردد:

```ts
// src/lib/server/posts.ts
import { notFound } from '#lib/server/errors';
import { db } from '#lib/server/db';

export async function requirePost(slug: string) {
	const post = await db('posts').where({ slug }).first();
	if (!post) notFound(`پست «${slug}» پیدا نشد`);
	return post;
}
```

```ts
export const load: PageServerLoad = async ({ params }) => {
	const post = await requirePost(params.slug);
	return { post };
};
```

این هم «فانکشن مدیریت خطا» است: منطق «اگر نبود → 404» یک‌جا متمرکز می‌شود.

---

## قدم ۷: تبدیل Unknown به App Error — با احتیاط

```ts
// src/lib/server/errors.ts (ادامه)
export async function tryOrAppError<T>(
	fn: () => Promise<T>,
	fallbackMessage = 'عملیات ناموفق بود'
): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		// اگر خودش HttpError/اپ‌ارور Kit بود، دوباره پرتاب کن
		if (e && typeof e === 'object' && 'status' in e) throw e;

		console.error(e); // لاگ کامل سمت سرور
		appError('INTERNAL', fallbackMessage);
	}
}
```

استفاده:

```ts
const rows = await tryOrAppError(() => db.raw('SELECT 1'), 'دیتابیس در دسترس نیست');
```

هشدار:

- پیام `fallback` باید برای کاربر امن باشد  
- جزئیات `e.message` دیتابیس را مستقیماً نشان نده  
- برای تشخیص نوع خطای خاص (مثلاً unique violation) بهتر است exception دامنه‌ای خودت (`ConflictError`) تعریف کنی و در catch نگاشت کنی  

---

## قدم ۸: `fail` برای فرم — جای `error` صفحه

| ابزار | کِی |
|--------|-----|
| `error(404)` | صفحه/منبع نیست → برو `+error.svelte` |
| `fail(400, {...})` | فرم غلط است → بمان روی همان فرم با `form` |

Helper مخصوص فرم:

```ts
import { fail } from '@sveltejs/kit';

export function formError(
	status: 400 | 401 | 403 | 422,
	data: Record<string, unknown>
) {
	return fail(status, { code: 'FORM_ERROR', ...data });
}
```

```ts
if (!title) {
	return formError(400, { missing: true, title });
}
```

`fail` را با `appError` قاطی نکن؛ UX فرم فرق دارد.

---

## قدم ۹: `handleError` — مرکز لاگ و پیام نهایی

```ts
// src/hooks.server.ts
import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({ error, event, kind }) => {
	if (kind === 'app' || kind === 'framework') {
		// معمولاً امن‌اند؛ فقط در صورت نیاز غنی‌سازی کن
		return error;
	}

	const id = crypto.randomUUID();
	console.error({
		id,
		kind,
		path: event.url.pathname,
		error
	});

	// به سرویس مانیتورینگ بفرست (Sentry و …)

	return {
		message: 'یک خطای غیرمنتظره رخ داد',
		code: 'INTERNAL',
		id
	};
};
```

اینجا `id` را به کاربر می‌دهی تا به پشتیبانی بگوید؛ stack را نه.

`handleError` **هرگز نباید خودش throw کند**.

---

## قدم ۱۰: UI خطا — `+error.svelte`

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
	import { page } from '$app/state';
</script>

<main class="p-6">
	<h1>{page.status}</h1>
	<p>{page.error?.message}</p>

	{#if page.error?.code}
		<p>کد: {page.error.code}</p>
	{/if}

	{#if page.error?.id}
		<p>شناسهٔ پیگیری: {page.error.id}</p>
	{/if}

	<a href="/">بازگشت به خانه</a>
</main>
```

می‌توانی برای بخش `(app)` یک `+error.svelte` جدا با ظاهر داشبورد بسازی.

برای خطاهای خارج از درخت صفحه (مثلاً بعضی خطاهای `handle` / `+server`)، `src/error.html` fallback است:

```html
<title>%sveltekit.error.message%</title>
<p>%sveltekit.status% — %sveltekit.error.message%</p>
```

---

## قدم ۱۱: مرز ریزتر — `<svelte:boundary>`

برای خطای داخل بخشی از UI (نه لزوماً کل صفحه):

```svelte
<svelte:boundary>
	{#snippet failed(error)}
		<p>{error.message}</p>
	{/snippet}

	<!-- محتوای ممکن است خطا بدهد -->
</svelte:boundary>
```

خطا از `handleError` رد شده و شکل `App.Error` دارد.  
این مکمل `+error.svelte` است، نه جایگزین helper سرور.

---

## قدم ۱۲: نقشهٔ کامل جریان

```text
load / action / db helper
        │
        ├─ appError('NOT_FOUND') ──► error() Kit ──► kind:'app'
        │                                    │
        ├─ fail(...) ──► همان فرم (بدون +error صفحه)
        │
        └─ throw خام / کرش ──► kind:'unknown'
                                      │
                              handleError (لاگ + id)
                                      │
                              +error.svelte / JSON / error.html
```

---

## قدم ۱۳: کجا helper بگذاری؟

```text
src/lib/server/errors.ts     ← appError, notFound, tryOrAppError
src/lib/server/posts.ts      ← requirePost و مشابه
src/hooks.server.ts          ← handleError
src/routes/+error.svelte     ← UI
src/app.d.ts                 ← App.Error
```

فقط سرور: چون `error()` برای جریان درخواست سرور است.  
پیام‌های نمایشی فرم می‌توانند در همان فایل یا `errors-form.ts` جدا باشند.

---

## قدم ۱۴: اشتباهات رایج

1. **`catch` کردن `error()` و بلعیدنش** بدون rethrow  
2. **نشان دادن `e.message` دیتابیس به کاربر**  
3. **استفاده از `error(400)` به‌جای `fail` برای اعتبارسنجی فرم**  
4. **فراموش کردن گسترش `App.Error` وقتی `code` می‌فرستی**  
5. **لاگ کردن همهٔ 404های framework به‌عنوان بحران**  
6. **ساخت سیستم خطا موازی که به `+error.svelte` وصل نیست**  
7. **throw کردن داخل `handleError`**  

---

## قدم ۱۵: چک‌لیست پیاده‌سازی در کلاس

1. `App.Error` را با `code?` و `id?` گسترش بده  
2. `#lib/server/errors.ts` با `appError` / `notFound` / … بساز  
3. در یک `load` واقعی از `notFound()` استفاده کن  
4. `+error.svelte` ریشه را برای `message` و `code` آماده کن  
5. `handleError` برای unknown با `id` بنویس  
6. برای فرم از `fail` / `formError` استفاده کن نه `error` صفحه  

---

## جمع‌بندی

- موتور خطا مال Kit است: `error`, `fail`, `handleError`, `+error.svelte`.  
- فانکشن مدیریت خطای تو معمولاً **wrapper یکدست** روی `error()` است (`appError`, `notFound`, …).  
- App errors امن و عمدی‌اند؛ unknownها را لاگ کن و پیام عمومی بده.  
- فرم → `fail`؛ نبود منبع/عدم دسترسی صفحه → `error`/helper.  
- `App.Error` را برای `code` و `id` تایپ کن و در UI نشان بده.  
- جزئیات داخلی را هرگز مستقیم به کاربر برنگردان.

## تمرین

1. فایل `#lib/server/errors.ts` را (روی کاغذ یا کد) با حداقل `notFound` و `unauthorized` طراحی کن و در یک `load` فرضی صدا بزن.  
2. توضیح بده چرا برای «ایمیل خالی در فرم لاگین» باید `fail` بدهی نه `error(400)`.  
3. یک `handleError` بنویس که برای `unknown` مقدار `id` برگرداند و بگو آن `id` در `+error.svelte` کجا چاپ می‌شود.  
4. فرق `kind: 'app'` و `kind: 'unknown'` را از نظر «چه چیزی به کاربر نشان می‌دهیم» در دو جمله بگو.
