# درس ۳۰: استفاده از چند نوع دیتابیس با Knex

## هدف درس
بعد از این درس می‌فهمی Knex فقط به SQLite محدود نیست، برای هر دیتابیس چه درایوری لازم است، چطور با env بین SQLite / PostgreSQL / MySQL جابه‌جا شوی، کدام بخش کد ثابت می‌ماند و کجاها (مهاجرت، تایپ‌ها، ویژگی‌های SQL) باید حواست به تفاوت dialect باشد.

## پیش‌نیاز
- درس ۲۰ (مفاهیم Knex)
- درس ۲۸ (پیاده‌سازی SQLite در این پروژه)
- درس ۲۹ (migrationها)

---

## قدم ۱: ایدهٔ اصلی — یک API، چند موتور

Knex یک **query builder** است، نه خودِ دیتابیس. تو می‌نویسی:

```ts
await db('users').select('id', 'name').where({ email });
```

و Knex آن را به SQL مناسب همان موتور ترجمه می‌کند:

- SQLite  
- PostgreSQL  
- MySQL / MariaDB  
- و چند گزینهٔ دیگر (MSSQL، Oracle، … بسته به نسخه و درایور)

پس در لایهٔ `*.repo.ts` معمولاً **همان کد** می‌ماند؛ چیزی که عوض می‌شود بیشتر **تنظیم اتصال (`client` + `connection`)** و گاهی جزئیات migration است.

---

## قدم ۲: جدول موتورها و درایورها

Knex خودش دیتابیس را نصب نمی‌کند؛ باید **client** را بگویی و پکیج درایور را نصب کنی:

| موتور | مقدار `client` در Knex | پکیج npm رایج | اتصال نمونه |
|--------|-------------------------|---------------|-------------|
| SQLite | `better-sqlite3` | `better-sqlite3` | `{ filename: 'data/app.sqlite3' }` |
| PostgreSQL | `pg` | `pg` | connection string یا `{ host, user, password, database }` |
| MySQL / MariaDB | `mysql2` | `mysql2` | `{ host, user, password, database }` |
| SQL Server | `mssql` | `tedious` (و تنظیمات مرتبط) | host / user / password / database |
| Oracle | `oracledb` | `oracledb` | user / password / connectString |

نصب مثال:

```bash
# همین پروژه الان:
npm install knex better-sqlite3

# اگر PostgreSQL خواستی:
npm install pg

# اگر MySQL خواستی:
npm install mysql2
```

فقط درایوری را نصب کن که واقعاً استفاده می‌کنی تا `node_modules` سبک بماند.

---

## قدم ۳: الان پروژه روی چه چیزی است؟

در این ریپو فعلاً hard-code شده روی SQLite:

```ts
// خلاصهٔ src/lib/server/db/client.ts و knexfile.js
client: 'better-sqlite3',
connection: { filename },
useNullAsDefault: true
```

`useNullAsDefault: true` مخصوص محدودیت‌های SQLite است؛ برای Postgres/MySQL معمولاً لازم نیست (و گاهی گمراه‌کننده است).

برای چنددیتابیسی، بهتر است **client از env خوانده شود** نه اینکه در کد قفل شود.

---

## قدم ۴: طراحی env برای چند موتور

یک الگوی خوانا:

```env
# sqlite | pg | mysql2
DB_CLIENT=sqlite

# --- SQLite ---
DATABASE_PATH=data/app.sqlite3

# --- PostgreSQL / MySQL ---
# DATABASE_URL=postgres://user:pass@localhost:5432/learn_kit
# یا جداگانه:
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_USER=app
# DB_PASSWORD=secret
# DB_NAME=learn_kit
```

یا فقط یک `DATABASE_URL` با scheme:

```env
DATABASE_URL=sqlite:./data/app.sqlite3
# DATABASE_URL=postgres://user:pass@localhost:5432/learn_kit
# DATABASE_URL=mysql://user:pass@localhost:3306/learn_kit
```

هر دو الگو درست است؛ مهم این است که `knexfile.js` و `db/client.ts` **یک تابع مشترک** برای ساخت config داشته باشند تا CLI و runtime یکی باشند.

---

## قدم ۵: تابع واحد `createKnexConfig` (الگوی پیشنهادی)

این کد را به‌عنوان نقشهٔ ذهنی یاد بگیر (می‌توانی بعداً در پروژه پیاده کنی):

```ts
import type { Knex } from 'knex';
import { resolve, isAbsolute } from 'node:path';

type DbClient = 'better-sqlite3' | 'pg' | 'mysql2';

export function createKnexConfig(): Knex.Config {
  const client = (process.env.DB_CLIENT || 'sqlite') as string;

  const migrations: Knex.MigratorConfig = {
    directory: resolve(process.cwd(), 'migrations'),
    extension: 'js',
    loadExtensions: ['.js'],
    tableName: 'knex_migrations'
  };

  if (client === 'sqlite' || client === 'better-sqlite3') {
    const raw = process.env.DATABASE_PATH || 'data/app.sqlite3';
    const filename = isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
    return {
      client: 'better-sqlite3',
      connection: { filename },
      useNullAsDefault: true,
      migrations
    };
  }

  if (client === 'pg' || client === 'postgres') {
    return {
      client: 'pg',
      connection: process.env.DATABASE_URL || {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      },
      pool: { min: 0, max: 10 },
      migrations
    };
  }

  if (client === 'mysql' || client === 'mysql2') {
    return {
      client: 'mysql2',
      connection: process.env.DATABASE_URL || {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      },
      pool: { min: 0, max: 10 },
      migrations
    };
  }

  throw new Error(`Unsupported DB_CLIENT: ${client}`);
}
```

بعد:

- `knexfile.js` → `export default createKnexConfig()`  
- `client.ts` → `knex(createKnexConfig())`  

یک منبع حقیقت برای CLI (`db:migrate`) و اپ.

---

## قدم ۶: چه چیزی بین دیتابیس‌ها ثابت می‌ماند؟

این لایه‌ها معمولاً **بدون تغییر** کار می‌کنند:

| لایه | مثال | چرا ثابت است؟ |
|------|------|----------------|
| Repository | `users.repo.ts` / `notes.repo.ts` | API نکس یکسان است |
| `load` / actions | `+page.server.ts` | فقط repo را صدا می‌زنند |
| بیشتر migrationهای ساده | `createTable` + `string` + `increments` | Knex به SQL موتور ترجمه می‌کند |

مثال که در Postgres و SQLite هر دو معنی دارد:

```ts
await db('notes').insert({ title, body }).returning('id'); // دقت: returning در همه موتورها یکسان نیست
```

اینجا باید حواس‌ات باشد — برو قدم ۷.

---

## قدم ۷: تفاوت‌هایی که باید بلد باشی

### ۱) `returning` بعد از insert

- **PostgreSQL / برخی دیگر:** `returning('id')` عالی کار می‌کند.  
- **MySQL / SQLite (بسته به نسخه/درایور):** گاهی آرایهٔ id برمی‌گردد، گاهی باید از روش دیگر استفاده کنی.

الگوی امن‌تر کراس‌دیتابیس:

```ts
const [id] = await db('users').insert({ name, email });
// یا
const row = await db('users').where({ email }).first();
```

### ۲) `useNullAsDefault`

فقط برای SQLite رایج و مفید است. برای `pg` / `mysql2` پیش‌فرض‌ها را از خودِ ستون/DB بگیر.

### ۳) نوع ستون‌ها و JSON

- Postgres: `jsonb` قوی است.  
- MySQL: `json` دارد.  
- SQLite: اغلب متن JSON ذخیره می‌کنی.

اگر migrationت `table.jsonb` باشد روی SQLite ممکن است رفتار فرق کند. برای کراس‌دیتابیس، به متدهای عمومی‌تر Knex بچسب یا برای هر محیط migration جدا/شرطی داشته باش (پیشرفته‌تر).

### ۴) Foreign key در SQLite

SQLite به‌صورت پیش‌فرض FK را enforce نمی‌کند مگر PRAGMA؛ better-sqlite3/Knex معمولاً قابل تنظیم است. در Postgres/MySQL FK جدی‌تر است. migrationهایی که `references()` دارند روی همه «کار» می‌کنند، ولی سخت‌گیری runtime فرق دارد.

### ۵) Connection pool

- SQLite فایل محلی: pool بزرگ معنی کمتری دارد.  
- Postgres/MySQL: `pool: { min, max }` مهم است.

### ۶) Concurrent write

SQLite برای ترافیک همزمان سنگین محدودیت دارد. برای production چندنوده‌ای معمولاً Postgres/MySQL انتخاب می‌شود؛ Knex فقط جابه‌جایی را آسان می‌کند، معجزهٔ مقیاس نمی‌کند.

---

## قدم ۸: Migration یک‌بار بنویس، چندجا اجرا کن؟

ایده‌آل آموزشی:

1. با SQLite لوکال توسعه بده (`DB_CLIENT=sqlite`).  
2. همان پوشهٔ `migrations/` را روی Postgres استیجینگ اجرا کن (`npm run db:migrate`).  
3. اگر جایی SQL خاص موتور نوشتی، همان‌جا جدا کن.

چک‌لیست قبل از عوض کردن موتور:

```bash
# درایور را نصب کن
npm install pg

# env را عوض کن
# DB_CLIENT=pg
# DATABASE_URL=postgres://...

# schema را روی دیتابیس جدید بساز
npm run db:migrate
npm run db:status
```

فایل SQLite قبلی (`data/app.sqlite3`) به Postgres منتقل نمی‌شود؛ فقط **schema از روی migrationها دوباره ساخته می‌شود**. برای انتقال داده باید dump/import یا اسکریپت جدا بنویسی.

---

## قدم ۹: چند اتصال همزمان (پیشرفته)

گاهی در یک اپ دو دیتابیس داری (مثلاً app DB + گزارش‌گیری):

```ts
export const db = knex(createKnexConfig());           // اصلی
export const reportingDb = knex(createReportingConfig()); // دوم
```

قواعد:

- هر دو فقط در `src/lib/server`  
- نام‌گذاری واضح (`db` / `reportingDb`)  
- migration معمولاً فقط برای DB اصلی؛ دومی را جدا مدیریت کن  

این پروژه فعلاً یک اتصال کافی است؛ فقط بدان Knex محدود به یک instance نیست.

---

## قدم ۱۰: استراتژی پیشنهادی برای کلاس / این ریپو

| محیط | پیشنهاد |
|------|---------|
| یادگیری و لپ‌تاپ | SQLite + better-sqlite3 (وضعیت فعلی) |
| استیجینگ شبیه production | PostgreSQL + `pg` |
| سرور قدیمی سازمانی | گاهی MySQL/MSSQL/Oracle — همان الگوی `client` |

مسیر رشد:

1. الان: SQLite ثابت در `client.ts` (درس ۲۸).  
2. بعد: `createKnexConfig()` مشترک + `DB_CLIENT`.  
3. repoها را تا حد ممکن استاندارد Knex نگه دار؛ از SQL خامِ وابسته به یک موتور پرهیز کن مگر ضروری.

---

## جمع‌بندی

- Knex از چند موتور پشتیبانی می‌کند؛ برای هر کدام **درایور npm** جدا لازم است.  
- جابه‌جایی اصلی در **config اتصال** است، نه بازنویسی کل اپ.  
- `knexfile` و runtime باید از **یک تابع config** تغذیه شوند.  
- تفاوت‌های واقعی: `returning`، JSON، FK، pool، و محدودیت‌های SQLite.  
- Migrationها schema را روی موتور جدید می‌سازند؛ دادهٔ قدیمی خودکار منتقل نمی‌شود.

---

## تمرین

1. جدول قدم ۲ را برای پروژهٔ خودت کامل کن: اگر فردا Postgres بروی، کدام پکیج و کدام env لازم است؟  
2. روی کاغذ (یا شاخهٔ جدا) تابع `createKnexConfig` را طوری بنویس که `sqlite` و `pg` را پشتیبانی کند؛ بگو `useNullAsDefault` کجا باید باشد.  
3. یک query در `users.repo.ts` پیدا کن و بگو آیا روی MySQL هم بدون تغییر کار می‌کند یا نه؛ اگر شک داری، همان را با `toSQL()` در یک اسکریپت کوچک چاپ کن و SQL تولیدی را مقایسه کن.
