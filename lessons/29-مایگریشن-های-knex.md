# درس ۲۹: مایگریشن‌های Knex برای ساخت و تغییر دیتابیس

## هدف درس
بعد از این درس می‌فهمی migration چیست، چرا schema را با دست در SQLite Browser عوض نمی‌کنیم، چطور با Knex جدول بسازی و تغییر بدهی، دستورهای CLI پروژه چه می‌کنند، و مسیر امن رشد دیتابیس از صفر تا جدول جدید چیست.

## پیش‌نیاز
- درس ۲۰ (Knex)
- درس ۲۸ (SQLite + better-sqlite3 + اتصال در این پروژه)

---

## قدم ۱: Migration یعنی چه؟

**Migration** یک فایل نسخه‌دار از تغییر schema است:

- ساخت جدول  
- افزودن/حذف ستون  
- ایندکس، foreign key، …  

به‌جای اینکه روی سیستم خودت دستی جدول بسازی و بگویی «روی سرور هم همین کار را بکن»، فایل migration را commit می‌کنی و همه با یک دستور همان تغییر را می‌گیرند.

دو تابع در هر فایل:

| تابع | معنی |
|------|------|
| `up` | اعمال تغییر (مثلاً `createTable`) |
| `down` | برگرداندن همان تغییر (مثلاً `dropTable`) |

Knex جدولی به نام `knex_migrations` می‌سازد و یادش می‌ماند کدام فایل‌ها قبلاً اجرا شده‌اند.

---

## قدم ۲: ساختار فولدر در این پروژه

```text
Learn_SvelteKit/
├── knexfile.js                 ← تنظیمات CLI و مسیر migrations
├── migrations/
│   ├── 20260411160000_create_users.js
│   └── 20260411170000_create_notes.js
├── scripts/knex/
│   └── migration.stub.js       ← قالب فایل جدید (داخل migrations نگذار)
├── data/app.sqlite3            ← فایل SQLite
└── src/lib/server/db/client.ts ← همان تنظیم migrations برای runtime
```

### قانون مهم دربارهٔ stub

قالب `migration.stub.js` را **داخل** `migrations/` نگذار. Knex هر `.js` آن پوشه را migration حساب می‌کند. قالب این پروژه اینجاست:

`scripts/knex/migration.stub.js`

---

## قدم ۳: `knexfile.js` چه می‌گوید؟

```js
migrations: {
  directory: resolve(process.cwd(), 'migrations'),
  extension: 'js',
  loadExtensions: ['.js'],
  tableName: 'knex_migrations',
  stub: resolve(process.cwd(), 'scripts/knex/migration.stub.js')
}
```

- `directory` → کجا دنبال فایل بگردد  
- `tableName` → جدول تاریخچه  
- `stub` → وقتی `db:make` می‌زنی از چه قالبی فایل بسازد  
- `DATABASE_PATH` از `.env` خوانده می‌شود  

همان تنظیمات migration روی instance داخل `src/lib/server/db/client.ts` هم هست تا `hooks.server.ts` بتواند `db.migrate.latest()` را صدا بزند.

---

## قدم ۴: شکل یک فایل migration

نمونهٔ واقعی پروژه — ساخت `users`:

```js
// migrations/20260411160000_create_users.js
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 120).notNullable();
    table.string('email', 190).notNullable().unique();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
```

نمونهٔ دوم — جدول وابسته `notes` با foreign key:

```js
// migrations/20260411170000_create_notes.js
export async function up(knex) {
  await knex.schema.createTable('notes', (table) => {
    table.increments('id').primary();
    table.string('title', 200).notNullable();
    table.text('body').notNullable().defaultTo('');
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}
```

نام فایل با **timestamp** شروع می‌شود تا ترتیب اجرا قطعی باشد.

---

## قدم ۵: دستورهای npm این پروژه

| دستور | کار |
|--------|-----|
| `npm run db:migrate` | همهٔ migrationهای باقی‌مانده را اجرا کن (`migrate:latest`) |
| `npm run db:migrate:up` | فقط **یک** migration بعدی |
| `npm run db:migrate:down` | فقط **یک** migration آخر را برگردان |
| `npm run db:rollback` | آخرین **batch** را برگردان |
| `npm run db:status` | ببین کدام‌ها Completed / Pending هستند |
| `npm run db:make نام` | فایل جدید از روی stub بساز |

مثال ساخت فایل جدید:

```bash
npm run db:make add_status_to_notes
```

بعد فایل را پر کن و دوباره:

```bash
npm run db:migrate
npm run db:status
```

---

## قدم ۶: Batch چیست؟

هر بار که `migrate:latest` اجرا می‌شود، فایل‌های pending داخل یک **batch** شماره می‌خورند.

مثال بعد از دو بار migrate جداگانه:

| name | batch |
|------|-------|
| `..._create_users.js` | 1 |
| `..._create_notes.js` | 2 |

`db:rollback` معمولاً کل آخرین batch را برمی‌گرداند (همهٔ فایل‌های همان شماره).  
`db:migrate:down` فقط یک فایل را برمی‌گرداند.

---

## قدم ۷: دو راه اجرای migration در این پروژه

### ۱) CLI (پیشنهادی برای کنترل دستی)

```bash
npm run db:migrate
```

### ۲) هنگام استارت سرور — `hooks.server.ts`

```ts
export const init = async () => {
  await db.migrate.latest();
};
```

برای کلاس و محیط محلی راحت است: `npm run dev` می‌زنی و schema خودش به‌روز می‌شود.

در production حساس، بعضی تیم‌ها فقط در CI/deploy با CLI مایگریت می‌کنند و `init` را خالی می‌گذارند تا استارتاپ اپ به migrate وابسته نباشد.

---

## قدم ۸: جریان کاری پیشنهادی وقتی جدول جدید می‌خواهی

1. `npm run db:make create_products`  
2. داخل `up` / `down` را بنویس.  
3. `npm run db:migrate`  
4. `npm run db:status` و مطمئن شو Completed است.  
5. در `src/lib/server/...` یک `*.repo.ts` بنویس.  
6. در `+page.server.ts` از repo استفاده کن — نه SQL خام پراکنده در همه جا.

در این پروژه برای `notes` همین مسیر طی شده: migration → `notes.repo.ts` → صفحهٔ `/notes`.

---

## قدم ۹: کارهایی که نباید بکنی

1. **ویرایش migrationی که قبلاً روی ماشین دیگران/سرور اجرا شده**  
   به‌جایش migration جدید بنویس (مثلاً `alterTable`).

2. **گذاشتن فایل غیرmigration داخل `migrations/`**  
   stub یا README را جای دیگر بگذار.

3. **حذف دستی جدول بدون `down`**  
   تاریخچهٔ `knex_migrations` با واقعیت DB ناسازگار می‌شود.

4. **ساخت schema فقط با UI ابزار SQLite**  
   بقیهٔ تیم آن تغییر را ندارند.

5. **مخلوط کردن seed حجیم با migration** (در حد دمو آموزشی گاهی OK است)  
   برای دادهٔ آزمایشی زیاد بهتر است از Knex Seed جدا استفاده کنی.

---

## قدم ۱۰: تغییر ستون روی جدول موجود (الگو)

فرض: می‌خواهی به `notes` ستون `status` اضافه کنی.

```bash
npm run db:make add_status_to_notes
```

```js
export async function up(knex) {
  await knex.schema.alterTable('notes', (table) => {
    table.string('status', 32).notNullable().defaultTo('draft');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('notes', (table) => {
    table.dropColumn('status');
  });
}
```

بعد `npm run db:migrate`.

توجه: محدودیت‌های SQLite برای بعضی `alter`ها بیشتر از Postgres است؛ Knex تا حد ممکن کمک می‌کند، ولی برای تغییر پیچیده گاهی جدول موقت لازم است.

---

## جمع‌بندی

- Migration = تاریخچهٔ قابل‌اجرای schema با `up` / `down`.  
- فایل‌ها در `migrations/`، تنظیمات در `knexfile.js` و `db/client.ts`.  
- با `db:make` بساز، با `db:migrate` اعمال کن، با `db:status` وضعیت را ببین.  
- Stub بیرون از `migrations/` بماند.  
- بعد از schema، لایهٔ `repo` + `+page.server.ts` را وصل کن.

---

## تمرین

1. با `npm run db:status` وضعیت فعلی را ببین و معنی Completed را توضیح بده.  
2. یک migration به نام `add_pinned_to_notes` بساز که ستون boolean/integer به نام `pinned` اضافه کند؛ migrate کن؛ بعد با rollback یا `migrate:down` برگردان و دوباره اعمال کن.  
3. عمداً یک فایل `hello.js` داخل `migrations/` بگذار (خالی)، `db:status` را ببین، بعد فایل را پاک کن و توضیح بده چرا stub را جدا کردیم.
