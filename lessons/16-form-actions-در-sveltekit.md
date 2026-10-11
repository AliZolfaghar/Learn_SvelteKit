# درس ۱۶: Form Actions در SvelteKit

## هدف درس
بعد از این درس می‌فهمی Form Action چیست، چطور بدون JavaScript با `<form method="POST">` به سرور داده بفرستی، فرق `default` و named action چیست، `fail` / `redirect` / propِ `form` چطور کار می‌کنند، و `use:enhance` چه بهبودی به UX می‌دهد.

## پیش‌نیاز
- درس ۱۴ و ۱۵ (`load` و جریان داده سرور→فرانت)
- آشنایی با HTML فرم (`input`, `name`, `submit`)
- دانستن اینکه `+page.server.ts` فقط روی سرور اجرا می‌شود

---

## قدم ۱: Form Action چیست؟

**Form Action** تابعی روی سرور است که با **ارسال فرم HTML** (`POST`) صدا زده می‌شود.

جای تعریف:

```text
src/routes/.../+page.server.ts
export const actions = { ... }
```

تفاوت ذهنی با `load`:

| | `load` | `actions` |
|--|--------|-----------|
| هدف | **خواندن** داده برای رندر | **نوشتن** / انجام کار (لاگین، ذخیره، حذف) |
| تریگر | باز شدن/ناوبری صفحه | submit فرم |
| متد HTTP | GETگونه برای صفحه | همیشه **POST** |
| خروجی برای UI | propِ `data` | propِ `form` (موقتی) |

قانون وب:

> درخواست‌های `GET` نباید side-effect داشته باشند. پس actionها همیشه `POST`اند.

> نکتهٔ آینده: در مستندات جدید، remote functionهای `form` به‌صورت آزمایشی همان نیازها را با تایپ قوی‌تر پوشش می‌دهند. **Form Actions کامل و پایدارند** و برای یادگیری و پروژه‌های فعلی کاملاً معتبرند؛ این درس روی همین مدل کلاسیک تمرکز دارد.

---

## قدم ۲: ساده‌ترین حالت — `default` action

```ts
// src/routes/login/+page.server.ts
import type { Actions } from './$types';

export const actions = {
	default: async (event) => {
		// TODO: لاگین کاربر
	}
} satisfies Actions;
```

در صفحه:

```svelte
<!-- src/routes/login/+page.svelte -->
<form method="POST">
	<label>
		ایمیل
		<input name="email" type="email" />
	</label>
	<label>
		رمز
		<input name="password" type="password" />
	</label>
	<button>ورود</button>
</form>
```

بدون هیچ JS:

1. کاربر دکمه را می‌زند  
2. مرورگر `POST` به همان URL صفحه (`/login`) می‌فرستد  
3. Kit تابع `actions.default` را اجرا می‌کند  
4. صفحه دوباره رندر می‌شود (یا redirect می‌کنی)

این همان **progressive enhancement** پایه است: اول HTML کار می‌کند، بعد می‌توانی با JS بهترش کنی.

---

## قدم ۳: صدا زدن action از صفحهٔ دیگر

اگر فرم در layout یا صفحهٔ دیگری است:

```svelte
<form method="POST" action="/login">
	<!-- ... -->
</form>
```

بعد از submit، مرورگر (و رفتار پیش‌فرض `enhance`) معمولاً تو را به `/login` می‌برد — همان صفحه‌ای که action مال آن است.

---

## قدم ۴: Named actions — چند عمل روی یک صفحه

```ts
export const actions = {
	login: async (event) => { /* ... */ },
	register: async (event) => { /* ... */ }
} satisfies Actions;
```

در فرم، نام action را با `?/` مشخص کن:

```svelte
<form method="POST" action="?/login">
	<!-- ... -->
	<button>ورود</button>
	<button formaction="?/register">ثبت‌نام</button>
</form>
```

یا از صفحهٔ دیگر:

```svelte
<form method="POST" action="/login?/register">
```

| ویژگی | معنی |
|--------|------|
| `action="?/login"` | POST به همین صفحه، action به نام `login` |
| `formaction="?/register"` | همان فرم، دکمهٔ دیگر → action دیگر |

### نکتهٔ مهم

نباید `default` را کنار named actions قاطی کنی.  
اگر به named action بدون redirect پست کنی، query در URL می‌ماند و POST بعدیِ «default» ممکن است اشتباهی همان named را بزند.

قانون سادهٔ کلاس: یا فقط `default`، یا فقط namedها.

---

## قدم ۵: آناتومی یک action — خواندن `FormData`

```ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		// اعتبارسنجی، کار با DB، ست کردن کوکی...
		cookies.set('sessionid', '...' /* session */, { path: '/' });

		return { success: true };
	}
} satisfies Actions;
```

نکات:

- `name` روی `<input>` باید با `data.get('...')` یکی باشد  
- مقدار معمولاً `string | File | null` است (برای فایل‌ها `File`)  
- خروجی `return` باید قابل سریالایز باشد (مثل `load` سرور)  
- **رمز را در `return` برنگردان**؛ حداکثر email برای پر کردن دوبارهٔ فرم  

---

## قدم ۶: propِ `form` در صفحه — نتیجهٔ موقت

```svelte
<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

{#if form?.success}
	<p>ورود موفق — خوش آمدی {data.user.name}</p>
{/if}
```

| prop | نقش |
|------|-----|
| `data` | از `load` — پایدارتر برای رندر عادی |
| `form` | از آخرین action — **موقتی**؛ با reload معمولی معمولاً می‌پرد |

`page.form` هم در سطح اپ تا به‌روزرسانی بعدی در دسترس است.

---

## قدم ۷: اعتبارسنجی با `fail`

وقتی داده غلط است، به‌جای پرتاب خام، `fail(status, data)` برگردان:

```ts
import { fail } from '@sveltejs/kit';

export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		if (!email) {
			return fail(400, { email, missing: true });
		}

		const user = await findUser(String(email));
		if (!user || !checkPassword(user, password)) {
			return fail(400, { email, incorrect: true });
		}

		cookies.set('sessionid', await createSession(user), { path: '/' });
		return { success: true };
	}
} satisfies Actions;
```

در UI:

```svelte
<form method="POST" action="?/login">
	{#if form?.missing}
		<p class="error">ایمیل الزامی است</p>
	{/if}
	{#if form?.incorrect}
		<p class="error">اطلاعات نادرست است</p>
	{/if}

	<label>
		ایمیل
		<input name="email" type="email" value={form?.email ?? ''} />
	</label>
	<label>
		رمز
		<input name="password" type="password" />
	</label>
	<button>ورود</button>
</form>
```

| ابزار | کِی |
|--------|-----|
| `fail(400, {...})` | خطای اعتبارسنجی / درخواست بد — بمان روی فرم |
| `error(500, ...)` | خطای جدی‌تر → صفحهٔ error |
| `redirect(303, '/dashboard')` | بعد از موفقیت برو جای دیگر |

Statusهای رایج برای `fail`: `400` یا `422`.

با `use:enhance`، status همان عدد `fail` در پاسخ دیده می‌شود؛ return موفق معمولاً 200 و return خالی 204 است.

---

## قدم ۸: `redirect` بعد از موفقیت

بعد از لاگین موفق معمولاً نمی‌مانی روی فرم:

```ts
import { redirect } from '@sveltejs/kit';

// ...
cookies.set('sessionid', sessionId, { path: '/' });
redirect(303, '/dashboard');
```

`303` برای «بعد از POST برو به GET این آدرس» الگوی کلاسیک است (Post/Redirect/Get) تا با رفرش، فرم دوباره ارسال نشود.

---

## قدم ۹: جریان کامل درخواست فرم

بدون JS:

```text
کاربر Submit
  → POST + body فرم (multipart/form-urlencoded یا multipart)
  → SvelteKit action مربوط را پیدا می‌کند
  → اجرای تابع روی سرور
  → یا fail → دوباره رندر همان صفحه با form
  → یا return داده → رندر با form
  → یا redirect → برو به URL جدید
  → یا error → +error.svelte
```

مقایسه با `load`:

```text
GET  /login     → load  → data
POST /login?/login → action → form (و احتمالاً cookies)
```

---

## قدم ۱۰: Progressive Enhancement با `use:enhance`

بدون JS هم فرم کار می‌کند. با JS می‌توانی:

- بدون رفرش کامل صفحه submit کنی  
- حالت loading نشان بدهی  
- focus و UX را بهتر کنی  

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<form method="POST" action="?/login" use:enhance>
	<!-- فیلدها -->
	<button>ورود</button>
</form>
```

`enhance` پیش‌فرض:

- submit را با `fetch` انجام می‌دهد  
- نتیجه را روی صفحه اعمال می‌کند  
- رفتار نزدیک به مرورگر را شبیه‌سازی می‌کند (مثلاً رفتن به صفحهٔ action)

می‌توانی تابع سفارشی بدهی تا `pending` و ریست فرم را کنترل کنی (در صورت نیاز در پروژهٔ بعدی).

اگر JS از کار بیفتد، همان `<form method="POST">` هنوز کار می‌کند — این قدرت مدل Form Action است.

---

## قدم ۱۱: چند فرم روی یک صفحه

ساختار `form` دست خودت است. برای تشخیص اینکه کدام فرم جواب داده:

```ts
return fail(400, { id: 'create-post', message: 'عنوان خالی است' });
```

```svelte
{#if form?.id === 'create-post' && form.message}
	<p>{form.message}</p>
{/if}
```

یا برای هر فرم named action جدا (`?/create`, `?/delete`).

---

## قدم ۱۲: TypeScript و فایل‌ها

| نماد | معنی |
|------|------|
| `Actions` | تایپ شیء `actions` |
| `ActionData` | شکل propِ `form` |
| `PageProps` | شامل `data` و `form` |
| `satisfies Actions` | چک می‌کند export با قرارداد Kit جور باشد |

همیشه actions را در **`+page.server.ts`** بگذار — نه `+page.ts` (چون باید فقط سرور باشد و به `request`/`cookies` دسترسی دارد).

---

## قدم ۱۳: مثال آموزشی کوچک برای همین ریپو

یک صفحهٔ `/guestbook` فرضی:

```ts
// src/routes/guestbook/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const messages: string[] = [];

export const load: PageServerLoad = async () => {
	return { messages };
};

export const actions = {
	add: async ({ request }) => {
		const data = await request.formData();
		const text = String(data.get('text') ?? '').trim();

		if (!text) {
			return fail(400, { text, missing: true });
		}

		messages.push(text);
		return { success: true };
	}
} satisfies Actions;
```

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<ul>
	{#each data.messages as msg}
		<li>{msg}</li>
	{/each}
</ul>

<form method="POST" action="?/add" use:enhance>
	{#if form?.missing}
		<p>متن خالی است</p>
	{/if}
	<input name="text" value={form?.text ?? ''} />
	<button>ارسال</button>
</form>
```

توجه: آرایهٔ در حافظه فقط برای دمو است؛ با ری‌استارت سرور پاک می‌شود. در کار واقعی DB بگذار.

---

## قدم ۱۴: Form Action در برابر جایگزین‌ها

| نیاز | ابزار |
|------|--------|
| ذخیره/حذف با فرم HTML | Form Action |
| خواندن اولیهٔ صفحه | `load` |
| API برای موبایل/کلاینت خارجی | `+server.ts` |
| فراخوانی تایپ‌شدهٔ آزمایشی جدید | remote `form` (آینده/experimental) |

برای اپ وب کلاسیک SvelteKit، Form Action هنوز انتخاب درجهٔ یک آموزشی و عملی است.

---

## قدم ۱۵: اشتباهات رایج

1. **`method="GET"` برای عملی که چیزی را تغییر می‌دهد**  
2. **فراموش کردن `name` روی input** → `formData.get` می‌شود `null`  
3. **برگرداندن password در `fail`/`return`**  
4. **مخلوط `default` و named actions**  
5. **گذاشتن action در `+page.ts` به‌جای `.server.ts`**  
6. **فکر کردن `form` مثل `data` با reload می‌ماند**  
7. **بعد از POST موفق بدون redirect؛ رفرش = ارسال دوبارهٔ فرم**  
8. **اعتبارسنجی فقط در کلاینت** — سرور را همیشه دوباره چک کن  

---

## قدم ۱۶: چک‌لیست ساخت یک فرم

1. `+page.server.ts` با `export const actions`  
2. `<form method="POST">` یا `action="?/name"`  
3. `name` روی فیلدها  
4. خواندن با `request.formData()`  
5. اعتبارسنجی → `fail` + برگرداندن مقادیر امن  
6. موفقیت → کوکی/DB + `redirect` یا `return`  
7. در UI خواندن `form` برای خطا/پیام  
8. اختیاری: `use:enhance`  
9. `npm run check` برای تایپ‌ها  

---

## جمع‌بندی

- Form Actions توابع سرور در `+page.server.ts` برای پردازش `POST` فرم‌اند.  
- بدون JS هم کار می‌کنند؛ `use:enhance` UX را بهتر می‌کند.  
- `default` یا named (`?/actionName`) — با هم قاطی نکن.  
- نتیجهٔ موقت در propِ `form` می‌آید؛ دادهٔ پایدار صفحه در `data` از `load`.  
- `fail` برای خطاهای فرم، `redirect` برای موفقیت جابه‌جایی، `error` برای شکست جدی.  
- هرگز راز و رمز را در `return`/`fail` برنگردان.  
- در پروژهٔ فعلی هنوز action نداری؛ `/guestbook` یا یک فرم تماس تمرین خوبی برای قدم بعدی است.

## تمرین

1. صفحهٔ `/contact` با actionِ `default` بساز که `name` و `message` را بگیرد؛ اگر خالی بود `fail(400, ...)` و فیلدها را دوباره پر کن.  
2. همان صفحه را با دو دکمه به named actionsِ `save` و `clear` تبدیل کن و فرق `action` و `formaction` را در عمل ببین.  
3. توضیح بده چرا بعد از لاگین موفق معمولاً `redirect(303, ...)` می‌زنیم نه فقط `return { success: true }`.  
4. یک جمله بنویس: فرق `data` و `form` در `PageProps` چیست؟
