# درس ۲۰: Knex برای ارتباط با دیتابیس در SvelteKit

## هدف درس
بعد از این درس می‌فهمی Knex چیست، چرا فقط سمت سرور استفاده می‌شود، چطور یک اتصال singleton امن در `#lib/server` بسازی، در `load` و Form Actions کوئری بزنی، و نقش migration/seed و `hooks` را در یک اپ SvelteKit بدانی.

## پیش‌نیاز
- درس ۱۱ (hooks و `init`)
- درس ۱۴ و ۱۶ (`load` و Form Actions)
- درس ۱۸ (نریختن دادهٔ کاربر در متغیر سراسری سرور)
- درس ۱۹ (env خصوصی برای `DATABASE_URL`)
- آشنایی خیلی کم با SQL (`SELECT` / `INSERT`)

---

## قدم ۱: Knex چیست؟

**Knex.js** یک **SQL query builder** برای Node است (نه ORM کامل مثل Prisma با مدل‌های اتوماتیک).

کارهایی که خوب بلداست:

- ساخت کوئری‌های type-friendlyتر از SQL خامِ پراکنده  
- پشتیبانی از PostgreSQL، MySQL، SQLite، …  
- **Migrations** و **Seeds**  
- Connection pool  
- Transaction  

مثال ذهنی:

```ts
const posts = await db('posts').select('id', 'title').where({ published: true });
```

تقریباً معادل:

```sql
SELECT id, title FROM posts WHERE published = true;
```

برای یادگیری کلاس: Knex = پل امن بین SvelteKit سرور و دیتابیس.

---

## قدم ۲: قانون طلایی در SvelteKit — فقط سرور

دیتابیس، رمز اتصال، و Knex **هرگز** نباید به مرورگر برسند.

| درست | غلط |
|------|-----|
| `src/lib/server/db.ts` | import در `Counter.svelte` |
| استفاده در `+page.server.ts` | استفاده در `+page.ts` یونیورسال (خطر لو رفتن به کلاینت) |
| Form Actions / hooks / `+server.ts` | `$effect` + fetch مستقیم به DB از کلاینت |

قرارداد فولدر:

```text
src/lib/server/     ← کد فقط‌سرور (db، auth، …)
```

در این پروژه alias برابر `#lib` است؛ پس:

```ts
import { db } from '#lib/server/db';
```

اگر از کلاینت به `#lib/server/...` import کنی، Vite/Kit معمولاً build را می‌شکند — عمداً.

---

## قدم ۳: نصب پکیج‌ها

بسته به دیتابیس:

```bash
npm install knex
```

و یکی از درایورها:

```bash
# PostgreSQL
npm install pg

# MySQL
npm install mysql2

# SQLite (برای تمرین محلی راحت است)
npm install better-sqlite3
```

برای TypeScript (اختیاری ولی مفید):

```bash
npm install -D @types/better-sqlite3
# برای pg معمولاً @types/pg
```

در درس‌های بعدی کلاس می‌توانی با SQLite شروع کنی و بعد به Postgres بروی؛ الگوی Knex تقریباً یکی است.

---

## قدم ۴: اتصال singleton — یک نمونه برای کل سرور

```ts
// src/lib/server/db.ts
import knex, { type Knex } from 'knex';

function createDb(): Knex {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL is not set');
	}

	// مثال SQLite فایل محلی:
	if (url.startsWith('sqlite:')) {
		const filename = url.replace('sqlite:', '');
		return knex({
			client: 'better-sqlite3',
			connection: { filename },
			useNullAsDefault: true
		});
	}

	// مثال Postgres:
	return knex({
		client: 'pg',
		connection: url,
		pool: { min: 0, max: 10 }
	});
}

// در dev با HMR ممکن است ماژول چندبار لود شود؛ از globalThis استفاده کن
const globalForDb = globalThis as unknown as { __db?: Knex };

export const db = globalForDb.__db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
	globalForDb.__db = db;
}
```

چرا singleton؟

- هر درخواست `new knex()` نسازد (اتلاف pool)  
- یک pool مشترک برای کل پروسهٔ Node  

چرا `globalThis` در dev؟

- Hot reload ممکن است بدون بستن اتصال قبلی، instance جدید بسازد  

در `.env` (و `.env.example` بدون راز واقعی):

```env
DATABASE_URL=sqlite:./data/app.sqlite3
# یا
# DATABASE_URL=postgres://user:pass@localhost:5432/learn_sveltekit
```

بعداً می‌توانی همین را در `src/env.ts` به‌صورت private تعریف کنی (درس ۱۹).

---

## قدم ۵: کوئری‌های روزمره

فرض جدول `posts` با ستون‌های `id`, `title`, `slug`, `body`, `created_at`.

```ts
// خواندن لیست
const posts = await db('posts')
	.select('id', 'title', 'slug')
	.orderBy('created_at', 'desc');

// خواندن یکی
const post = await db('posts').where({ slug }).first();

// درج
const [id] = await db('posts').insert({
	title,
	slug,
	body,
	created_at: db.fn.now()
});

// به‌روزرسانی
await db('posts').where({ id }).update({ title });

// حذف
await db('posts').where({ id }).del();
```

همیشه فقط فیلدهای لازم را `select` کن؛ کل ردیف با ستون‌های حساس را بی‌فکر به `return` صفحه نده (درس ۱۵).

---

## قدم ۶: استفاده در `load` (خواندن)

```ts
// src/routes/blog/+page.server.ts
import { db } from '#lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const posts = await db('posts')
		.select('id', 'title', 'slug')
		.orderBy('created_at', 'desc');

	return { posts };
};
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<ul>
	{#each data.posts as post}
		<li><a href="/blog/{post.slug}">{post.title}</a></li>
	{/each}
</ul>
```

جریان:

```text
درخواست → +page.server load → Knex → DB
       → return { posts } → سریالایز → data در UI
```

---

## قدم ۷: استفاده در Form Action (نوشتن)

```ts
// src/routes/blog/new/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();

		if (!title || !body) {
			return fail(400, { title, body, missing: true });
		}

		const slug = title.toLowerCase().replace(/\s+/g, '-');

		await db('posts').insert({
			title,
			slug,
			body,
			created_at: db.fn.now()
		});

		redirect(303, `/blog/${slug}`);
	}
} satisfies Actions;
```

نوشتن همیشه در سرور؛ کلاینت فقط فرم `POST` می‌فرستد (درس ۱۶).

---

## قدم ۸: Transaction — چند کار یا همه یا هیچ

```ts
await db.transaction(async (trx) => {
	const [userId] = await trx('users').insert({ email });
	await trx('profiles').insert({ user_id: userId, display_name: name });
});
```

اگر وسط راه خطا بخورد، تغییرات rollback می‌شوند.  
برای ثبت‌نام، سفارش، انتقال موجودی و مشابه ضروری است.

---

## قدم ۹: Migrations — نسخهٔ اسکیمای دیتابیس

به‌جای دستکاری دستی جدول در پروداکشن، فایل migration می‌نویسی.

### knexfile (نمونه ESM)

```js
// knexfile.js
/** @type {import('knex').Knex.Config} */
export default {
	client: 'better-sqlite3',
	connection: {
		filename: './data/app.sqlite3'
	},
	useNullAsDefault: true,
	migrations: {
		directory: './migrations'
	},
	seeds: {
		directory: './seeds'
	}
};
```

برای Postgres مقدار `client` و `connection` را عوض کن (مثلاً از `DATABASE_URL`).

### ساخت و اجرای migration

```bash
npx knex migrate:make create_posts
npx knex migrate:latest
npx knex migrate:rollback
```

نمونهٔ فایل migration:

```js
/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
	await knex.schema.createTable('posts', (t) => {
		t.increments('id').primary();
		t.string('title').notNullable();
		t.string('slug').notNullable().unique();
		t.text('body').notNullable();
		t.timestamps(true, true);
	});
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
	await knex.schema.dropTableIfExists('posts');
}
```

در `package.json` می‌توانی اسکریپت بگذاری:

```json
"migrate": "knex migrate:latest",
"migrate:make": "knex migrate:make"
```

### Seeds (دادهٔ نمونه)

```bash
npx knex seed:make demo_posts
npx knex seed:run
```

فقط برای محیط توسعه/تست؛ در پروداکشن با احتیاط.

---

## قدم ۱۰: کِی migration را اجرا کنیم؟

| روش | توضیح |
|-----|--------|
| CLI دستی / CI | `npm run migrate` قبل از deploy — رایج و امن |
| `init` در `hooks.server.ts` | هنگام استارت سرور `migrate.latest()` — راحت برای اپ کوچک |
| اسکریپت جدا در Docker entrypoint | کنترل‌شده در کانتینر |

نمونه با hook (درس ۱۱):

```ts
// src/hooks.server.ts
import type { ServerInit } from '@sveltejs/kit';
import { db } from '#lib/server/db';

export const init: ServerInit = async () => {
	await db.migrate.latest();
};
```

برای پروژهٔ جدی‌تر اغلب migrate را در CI/CD جدا می‌زنند تا استارت HTTP منتظر migration سنگین نماند.

بعد از اسکریپت‌های یک‌بارهٔ CLI یادت باشد در صورت ساخت instance جدا، `await knex.destroy()` کنی تا پروسه آویزان نماند.

---

## قدم ۱۱: لایهٔ کوچک repository (اختیاری ولی تمیز)

به‌جای پخش `db('posts')` همه‌جا:

```ts
// src/lib/server/posts.ts
import { db } from '#lib/server/db';

export function listPosts() {
	return db('posts').select('id', 'title', 'slug').orderBy('created_at', 'desc');
}

export function getPostBySlug(slug: string) {
	return db('posts').where({ slug }).first();
}
```

```ts
// +page.server.ts
import { listPosts } from '#lib/server/posts';

export const load = async () => {
	return { posts: await listPosts() };
};
```

فایده: تست و تغییر اسکیما ساده‌تر؛ صفحه فقط به «چه داده‌ای می‌خواهم» فکر می‌کند.

---

## قدم ۱۲: تایپ ردیف‌ها (حداقل لازم)

```ts
export type Post = {
	id: number;
	title: string;
	slug: string;
	body: string;
	created_at: Date | string;
};

const post = await db<Post>('posts').where({ slug }).first();
```

یا نتیجه را بعد از query assert/validate کن.  
Knex ORM کامل نیست؛ تایپ‌ها را خودت نگه می‌داری (این یکی از فرق‌هایش با Prisma است).

---

## قدم ۱۳: نقشهٔ جای Knex در معماری SvelteKit

```text
Browser
  │  GET/POST صفحه
  ▼
SvelteKit server
  │  load / actions / hooks
  ▼
#lib/server/posts.ts   (منطق دامنه)
  │
  ▼
#lib/server/db.ts      (Knex singleton)
  │
  ▼
PostgreSQL / SQLite / MySQL
```

چیزهایی که Knex جایگزینشان **نیست**:

- `load` / Form Actions (هنوز لازم‌اند)  
- state کلاینت (`$state`)  
- auth کامل (کوکی + session در DB را خودت می‌سازی)  

---

## قدم ۱۴: اشتباهات رایج

1. **import دیتابیس در کامپوننت کلاینت**  
2. **ساخت knex جدید در هر `load`**  
3. **نگه داشتن نتیجهٔ query در متغیر ماژول سراسری به‌عنوان «کش کاربر»** (درس ۱۸)  
4. **`return` کردن ردیف کامل با فیلدهای حساس**  
5. **SQL injection با چسباندن رشته** — از `where({...})` / bindingهای Knex استفاده کن، نه `'...'+userInput`  
6. **فراموش کردن migration در محیط جدید**  
7. **باز گذاشتن اتصال در اسکریپت CLI بدون `destroy()`**  
8. **استفاده از `+page.ts` یونیورسال برای کد شامل Knex**  

---

## قدم ۱۵: مسیر پیشنهادی پیاده‌سازی روی همین ریپو

هنوز Knex در پروژه نصب نیست. وقتی خواستی عملی کنی:

1. `npm install knex better-sqlite3`  
2. `DATABASE_URL=sqlite:./data/app.sqlite3` در `.env`  
3. `src/lib/server/db.ts` singleton  
4. `knexfile.js` + اولین migration جدول `posts`  
5. `npm run migrate`  
6. یک مسیر `/blog` با `+page.server.ts` + لیست  
7. یک فرم ایجاد پست با action  

فعلاً Express لازم نیست؛ همان `npm run dev` و بعداً `npm start` کافی است.

---

## قدم ۱۶: چک‌لیست تصمیم‌گیری

| سؤال | جواب |
|------|------|
| داده را از کجا بخوانم برای SSR؟ | `+page.server.ts` + Knex |
| داده را کجا بنویسم؟ | Form Action / `+server.ts` + Knex |
| اتصال کجا ساخته شود؟ | `#lib/server/db.ts` یک‌بار |
| اسکیما چطور عوض شود؟ | migrations |
| راز اتصال کجاست؟ | env خصوصی — نه کلاینت |
| کش کاربر بین درخواست‌ها؟ | DB/کوکی — نه متغیر سراسری |

---

## جمع‌بندی

- Knex query builder + migration برای SQL در Node است.  
- در SvelteKit فقط در کد سرور (`#lib/server`, `*.server.ts`, hooks) استفاده می‌شود.  
- یک singleton با pool بساز؛ در dev مراقب HMR باش.  
- خواندن در `load`، نوشتن در actions؛ نتیجه را امن `return` کن.  
- اسکیما را با migration نسخه کن.  
- هرگز DB را به کلاینت قاطی نکن و state کاربر را در حافظهٔ ماژول سرور نگه ندار.  
- برای این ریپوی آموزشی، SQLite + Knex شروع مناسبی است.

## تمرین

1. روی کاغذ درخت فایل `db.ts`، `posts.ts`، `blog/+page.server.ts` و فرم `new/+page.server.ts` را بکش و فلش «چه کسی Knex را صدا می‌زند» را مشخص کن.  
2. توضیح بده چرا `import { db } from '#lib/server/db'` داخل `Counter.svelte` اشتباه است.  
3. یک migration فرضی برای جدول `comments` با `post_id` بنویس (`up`/`down`).  
4. فرق «کش کردن لیست پست در متغیر ماژول» با «هر بار `load` از DB بخواند» را از نظر چندکاربره بودن سرور بگو.
