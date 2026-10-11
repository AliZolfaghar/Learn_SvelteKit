# درس ۲۸: SQLite + better-sqlite3 + Knex در SvelteKit

## هدف درس
بعد از این درس می‌فهمی در همین پروژه چطور لایهٔ دیتابیس با **SQLite**، درایور **better-sqlite3** و **Knex** پیاده شده، هر فایل/فولدر چه نقشی دارد، داده فقط سمت سرور می‌ماند، و چطور از migration تا `load` / Form Actions مسیر کامل را دنبال کنی.

## پیش‌نیاز
- درس ۲۰ (مفاهیم Knex)
- درس ۱۱ (`hooks` و `init`)
- درس ۱۴ و ۱۶ (`+page.server.ts` و actions)
- درس ۱۳ (route groups — صفحهٔ `/users` داخل `(app)` است)

---

## قدم ۱: این سه ابزار با هم چه کار می‌کنند؟

| لایه | پکیج | نقش |
|------|------|-----|
| فایل دیتابیس | **SQLite** | یک فایل محلی مثل `data/app.sqlite3` — بدون سرور جدا |
| درایور Node | **better-sqlite3** | کتابخانهٔ native برای باز کردن/خواندن SQLite |
| Query builder | **Knex** | ساخت کوئری، migration، seed؛ روی better-sqlite3 سوار می‌شود |

جریان ذهنی:

```text
+page.server.ts  →  users.repo.ts  →  db (Knex)  →  better-sqlite3  →  app.sqlite3
```

قانون طلایی (مثل درس ۲۰): این زنجیره **هرگز** وارد کامپوننت کلاینت یا `+page.ts` یونیورسال نشود.

---

## قدم ۲: ساختار فولدرها در این پروژه

```text
Learn_SvelteKit/
├── data/
│   ├── .gitkeep
│   └── app.sqlite3          ← فایل واقعی DB (در gitignore)
├── migrations/
│   └── 20260411160000_create_users.js
├── knexfile.js              ← تنظیم Knex برای CLI
├── .env / .env.example      ← DATABASE_PATH=...
├── src/
│   ├── hooks.server.ts      ← init → migrate.latest()
│   └── lib/
│       └── server/          ← فقط سرور
│           ├── db/
│           │   ├── client.ts   ← ساخت singleton Knex
│           │   └── index.ts    ← export { db }
│           └── users/
│               └── users.repo.ts   ← کوئری‌های دامنهٔ کاربران
└── src/routes/(app)/users/
    ├── +page.server.ts      ← load + actions
    └── +page.svelte         ← UI (بدون import از db)
```

### چرا این جداسازی؟

1. **`src/lib/server/`** — قرارداد SvelteKit: هرچه اینجاست فقط سرور است؛ از مرورگر import نشود.
2. **`db/client.ts`** — فقط «اتصال»؛ منطق کسب‌وکار اینجا ننویس.
3. **`users.repo.ts`** — کوئری‌های مربوط به جدول `users`؛ صفحه فقط همین توابع را صدا می‌زند.
4. **`migrations/`** — تاریخچهٔ schema؛ قابل تکرار روی هر ماشین.
5. **`knexfile.js`** — برای دستورهای CLI مثل `npm run db:migrate`.
6. **`data/`** — محل فایل SQLite؛ از کد جدا است تا مسیر را با env عوض کنی.

---

## قدم ۳: نصب پکیج‌ها

```bash
npm install knex better-sqlite3 dotenv
npm install -D @types/better-sqlite3 tsx
```

در `vite.config.ts` این‌ها را `ssr.external` کن تا Vite ماژول native را داخل باندل نکند:

```ts
ssr: {
  external: ['better-sqlite3', 'knex']
}
```

---

## قدم ۴: متغیر محیط

در `.env` و `.env.example`:

```env
DATABASE_PATH=data/app.sqlite3
```

نکته: `NODE_ENV=production` را داخل `.env` برای `vite dev` نگذار؛ SvelteKit/Vite را گیج می‌کند.

مسیر می‌تواند نسبی (نسبت به ریشهٔ پروژه) یا absolute باشد.

---

## قدم ۵: ساخت اتصال — `db/client.ts`

ایده‌های مهم پیاده‌سازی:

1. **`client: 'better-sqlite3'`** + **`useNullAsDefault: true`** (برای SQLite لازم است).
2. **یک instance (singleton)** با `globalThis` تا در HMR چند اتصال باز نشود.
3. ساخت خودکار فولدر `data/` با `mkdirSync`.
4. مسیر migrations روی instance تنظیم شود تا `db.migrate.latest()` در `hooks` کار کند.
5. هنگام `vite build` به‌جای فایل واقعی از `:memory:` استفاده شود تا بیلد فایل دیسک را قفل نکند.

خروجی عمومی:

```ts
import { db } from '#lib/server/db/index.js';
```

---

## قدم ۶: Migration

فایل نمونه: `migrations/20260411160000_create_users.js`

- `up` → ساخت جدول `users` + چند ردیف seed اولیه  
- `down` → حذف جدول  

دستورها:

```bash
npm run db:migrate      # اعمال آخرین migrationها
npm run db:rollback     # برگشت یک batch
npm run db:make نام     # ساخت فایل migration جدید
```

این اسکریپت‌ها از `knexfile.js` و `dotenv` استفاده می‌کنند تا همان `DATABASE_PATH` را بخوانند.

نام فایل migration معمولاً با timestamp شروع می‌شود تا ترتیب اجرا مشخص باشد.

---

## قدم ۷: Repository دامنه

`src/lib/server/users/users.repo.ts`:

```ts
export async function listUsers() { ... }
export async function createUser({ name, email }) { ... }
export async function deleteUser(id) { ... }
```

صفحهٔ route نباید مستقیماً `db('users').insert(...)` پر کند. فایده:

- تست و خوانایی بهتر  
- یک جا برای قانون‌های دامنه (مثلاً `email.toLowerCase()`)  
- اگر فردا جدول عوض شد، فقط repo را عوض می‌کنی  

---

## قدم ۸: اتصال به UI از مسیر سرور

فقط در `+page.server.ts`:

```ts
export const load = async () => {
  const users = await listUsers();
  return { title: 'کاربران', users };
};

export const actions = {
  create: async ({ request }) => { ... },
  delete: async ({ request }) => { ... }
};
```

`+page.svelte` فقط `data.users` و فرم‌های `method="POST"` را نشان می‌دهد — هیچ `import` از Knex ندارد.

صفحهٔ زنده در پروژه: **`/users`**.

---

## قدم ۹: `hooks.server.ts` و auto-migrate

```ts
export const init = async () => {
  await db.migrate.latest();
};
```

قبل از اولین درخواست، migrationهای جدید اعمال می‌شوند. برای کلاس و محیط محلی راحت است.

در production جدی‌تر گاهی فقط با CI/CLI مایگریت می‌کنند و `init` را خالی می‌گذارند تا استارتاپ اپ به schema وابستهٔ خودکار نباشد. برای این پروژهٔ آموزشی، auto-migrate مناسب است.

---

## قدم ۱۰: جریان کامل یک درخواست «ثبت کاربر»

1. کاربر فرم را در `/users` submit می‌کند (`?/create`).  
2. `actions.create` در `+page.server.ts` اجرا می‌شود.  
3. `createUser` در repo صدا زده می‌شود.  
4. Knex با better-sqlite3 یک `INSERT` روی `data/app.sqlite3` می‌زند.  
5. صفحه دوباره `load` می‌شود و لیست به‌روز را می‌بینی.

اگر ایمیل تکراری باشد، SQLite خطای unique می‌دهد و action با `fail(400, …)` پیام فارسی برمی‌گرداند.

---

## قدم ۱۱: چه چیزهایی را عمداً اینجا نگذاشتیم؟

برای اسکلت اولیه کافی بود؛ بعداً می‌توانی اضافه کنی:

- لایهٔ جدا برای transactionهای چندجدوله  
- seed جدا (`knex seed:run`) به‌جای insert داخل migration  
- تایپ‌های تولیدشده یا Zod برای اعتبارسنجی فرم  
- Postgres در production با همان Knex و عوض کردن `client`  

الگوی فولدر (`server/db` + `server/<domain>/*.repo.ts` + `migrations`) همان می‌ماند.

---

## جمع‌بندی

- **SQLite** = فایل؛ **better-sqlite3** = درایور؛ **Knex** = query builder + migration.  
- همه داخل **`src/lib/server`**؛ UI فقط از `+page.server.ts` داده می‌گیرد.  
- **`client.ts`** اتصال، **`*.repo.ts`** کوئری دامنه، **`migrations/`** schema.  
- **`DATABASE_PATH`** مسیر فایل را کنترل می‌کند؛ فایل DB را commit نکن.  
- دموی واقعی: صفحهٔ `/users` با لیست/افزودن/حذف.

---

## تمرین

1. یک migration جدید برای جدول `notes` (`id`, `title`, `body`, `created_at`) بساز و با `npm run db:migrate` اعمال کن.  
2. فولدر `src/lib/server/notes/notes.repo.ts` و یک مسیر `(app)/notes` با `load` + action اضافه کن.  
3. عمداً از یک کامپوننت `.svelte` به `#lib/server/db` import کن و ببین build چه خطایی می‌دهد — بعد import را پاک کن.
