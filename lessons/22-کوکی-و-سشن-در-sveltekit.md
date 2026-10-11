# درس ۲۲: کوکی و Session در SvelteKit

## هدف درس
بعد از این درس می‌فهمی کوکی چیست، APIی `cookies` در SvelteKit چطور کار می‌کند، Session با کوکی چه فرقی از «فقط یک کوکی ساده» دارد، چطور session را بسازی/بخوانی/پاک کنی، و گزینه‌هایی مثل `httpOnly` و `sameSite` چرا برای امنیت مهم‌اند.

## پیش‌نیاز
- درس ۱۱ (`handle` و `locals`)
- درس ۲۱ (تصویر بزرگ Authentication — این درس روی مکانیزم کوکی/سشن زوم می‌کند)
- درس ۱۶ (Form Actions جایی که معمولاً کوکی لاگین ست می‌شود)

---

## قدم ۱: کوکی چیست؟

**Cookie** تکه‌دادهٔ کوچکی است که سرور برای مرورگر می‌فرستد و مرورگر در درخواست‌های بعدی همان سایت معمولاً آن را برمی‌گرداند.

```text
پاسخ سرور:  Set-Cookie: visited=true; Path=/; HttpOnly; ...
درخواست بعد: Cookie: visited=true
```

کاربردها:

- «قبلاً آمده‌ای؟» (`visited`)  
- ترجیح زبان/تم (گاهی)  
- **شناسهٔ نشست (session id)** برای لاگین  

محدودیت‌ها:

- حجم کم (حدود چند کیلوبایت)  
- با هر درخواستِ مطابق Path/Domain ارسال می‌شود  
- برای دادهٔ بزرگ یا حساسِ کامل کاربر جای DB نیست — فقط شناسه یا فلگ کوچک  

---

## قدم ۲: Session چیست؟ (و ربطش به کوکی)

**Session** = وضعیت کاربر بین چند درخواست.

مدل امن رایج در وب:

```text
کوکی فقط این را نگه می‌دارد:  session=<شناسه تصادفی بلند>
سرور در DB/حافظهٔ نشست نگه می‌دارد:  session_id → user_id, expires_at, ...
```

| در کوکی | در سرور (DB) |
|---------|----------------|
| `abc123...` (id) | کاربر، نقش، زمان انقضا، … |

چرا کل user را داخل کوکی نمی‌گذاریم؟

- قابل دستکاری/دزدیدن آسان‌تر می‌شود  
- باطل کردن سخت‌تر است  
- حجم و افشای داده بیشتر می‌شود  

پس:

> **کوکی = کلید قفسه**  
> **Session در سرور = محتویات قفسه**

---

## قدم ۳: APIی `cookies` فقط سمت سرور

در SvelteKit به‌جای دستکاری خام هدر `Set-Cookie`، از `event.cookies` استفاده می‌کنی. در دسترس است در:

- `hooks.server.ts` → `handle`  
- `+page.server.ts` / `+layout.server.ts` → `load` و `actions`  
- `+server.ts`  

**در کامپوننت کلاینت یا `+page.ts` یونیورسال برای session لاگین استفاده نکن.**

متدهای اصلی:

| متد | کار |
|-----|-----|
| `cookies.get(name)` | خواندن مقدار |
| `cookies.getAll()` | همهٔ کوکی‌های درخواست |
| `cookies.set(name, value, options)` | نوشتن / به‌روزرسانی |
| `cookies.delete(name, options)` | پاک کردن (معمولاً با همان `path`) |
| `cookies.serialize(name, value, options)` | ساخت رشتهٔ `Set-Cookie` در صورت نیاز خاص |

نکتهٔ مهم: بعد از `cookies.set` در **همان درخواست**، `cookies.get` همان مقدار جدید را می‌دهد (نقشهٔ داخلی به‌روز می‌شود).

`setHeaders` را برای `Set-Cookie` به کار نبر؛ از `cookies` استفاده کن.

---

## قدم ۴: اولین مثال — کوکی ساده (بدون لاگین)

```ts
// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const visited = cookies.get('visited') === 'true';

	cookies.set('visited', 'true', {
		path: '/',
		maxAge: 60 * 60 * 24 * 365, // یک سال
		httpOnly: true,
		sameSite: 'lax'
	});

	return { visited };
};
```

```svelte
<h1>سلام {data.visited ? 'دوست قدیمی' : 'تازه‌وارد'}!</h1>
```

بار اول: `visited` هنوز false بوده، بعد ست می‌شود.  
رفرش: دیگر دوست قدیمی دیده می‌شود.

این session لاگین نیست؛ فقط یک فلگ است. ولی API همان است.

---

## قدم ۵: گزینه‌های مهم `cookies.set`

همیشه **`path` را صریح بگذار** (از SvelteKit 2 به بعد اجباری/ضروری برای ابهام‌نداشتن است). معمولاً:

```ts
path: '/'
```

| گزینه | معنی | توصیه برای session |
|--------|------|---------------------|
| `path` | روی کدام مسیرهای سایت ارسال شود | `'/'` برای کل اپ |
| `httpOnly` | عدم دسترسی `document.cookie` به آن | `true` برای session |
| `secure` | فقط روی HTTPS | در production معمولاً `true`؛ در HTTP لوکال گاهی باید `false` |
| `sameSite` | `'lax'` / `'strict'` / `'none'` | معمولاً `'lax'`؛ سخت‌گیرانه‌تر `'strict'` |
| `maxAge` | عمر به ثانیه | مثلاً یک هفته؛ اگر نگذاری اغلب «تا بسته شدن مرورگر» (session cookie مرورگر) |
| `expires` | تاریخ انقضای مطلق | جایگزین/مکمل `maxAge` |
| `domain` | دامنهٔ کوکی | معمولاً نگذار مگر ساب‌دامین مشترک لازم باشد |

مقادیر پیش‌فرض Kit در نسخه‌های جدید معمولاً به سمت امن تمایل دارند (`httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'`) — باز هم برای session صریح بنویس تا قصدت روشن باشد.

```ts
cookies.set('session', sessionId, {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: process.env.NODE_ENV === 'production',
	maxAge: 60 * 60 * 24 * 7
});
```

`sameSite: 'none'` فقط با `secure: true` معنی دارد (برای سناریوهای کراس‌سایت خاص).

---

## قدم ۶: ساخت Session واقعی (الگوی کامل)

### ۱) جدول مفهومی

```text
sessions
  id          متن تصادفی بلند (کلید کوکی)
  user_id     کاربر
  expires_at  زمان انقضا
  created_at
```

### ۲) بعد از لاگین موفق (Form Action)

```ts
const sessionId = crypto.randomUUID(); // در عمل از شناسهٔ امن‌تر/بلندتر هم استفاده می‌شود
await db('sessions').insert({
	id: sessionId,
	user_id: user.id,
	expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

cookies.set('session', sessionId, {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: process.env.NODE_ENV === 'production',
	maxAge: 60 * 60 * 24 * 7
});

redirect(303, '/dashboard');
```

### ۳) خواندن در هر درخواست (`handle`)

```ts
// src/hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');

	if (!sessionId) {
		event.locals.user = null;
		event.locals.sessionId = null;
		return resolve(event);
	}

	const row = await findValidSession(sessionId);
	if (!row) {
		// کوکی یتیم / منقضی
		event.cookies.delete('session', { path: '/' });
		event.locals.user = null;
		event.locals.sessionId = null;
		return resolve(event);
	}

	event.locals.user = row.user;
	event.locals.sessionId = sessionId;
	return resolve(event);
};
```

### ۴) خروج

```ts
if (locals.sessionId) {
	await db('sessions').where({ id: locals.sessionId }).del();
}
cookies.delete('session', { path: '/' });
redirect(303, '/login');
```

`delete` باید **همان `path`** (و در صورت استفاده همان `domain`) را داشته باشد که موقع `set` داشتی؛ وگرنه کوکی پاک نمی‌شود.

---

## قدم ۷: جریان یک درخواست با session

```text
Browser
  Cookie: session=abc
        │
        ▼
hooks.handle
  cookies.get('session') → abc
  DB: session معتبر؟ → user
  locals.user = user
        │
        ▼
+layout.server / +page.server / actions
  از locals.user استفاده می‌کنند
        │
        ▼
در صورت نیاز return { user: { id, name } }  ← نه کل ردیف DB
        │
        ▼
UI
```

کوکی در مرورگر می‌ماند؛ هویت کامل در سرور resolve می‌شود.

---

## قدم ۸: کوکی در `load` در برابر `handle`

| جا | مناسب برای |
|----|------------|
| `handle` | شناخت کاربر برای **همه** مسیرها (`locals`) |
| `load` | خواندن/نوشتن کوکی مخصوص همان صفحه (مثل `visited`) |
| `actions` | ست کردن session بعد از لاگین، پاک کردن بعد از logout |

الگوی تمیز auth:

- ست session در action لاگین  
- validate در `handle`  
- پاک کردن در action خروج  
- `load` فقط از `locals` مصرف می‌کند  

---

## قدم ۹: Session Cookie مرورگر در برابر Persistent Cookie

| نوع | چطور | رفتار |
|-----|------|--------|
| Session cookie (مرورگر) | بدون `maxAge`/`expires` | معمولاً با بستهنگ شدن مرورگر پاک می‌شود |
| Persistent | با `maxAge` یا `expires` | تا آن زمان می‌ماند |

برای «مرا به خاطر بسپار» معمولاً persistent می‌گذاری؛ برای حساسیت بالاتر عمر کوتاه‌تر یا تمدید چرخشی (session fresh) بهتر است.

---

## قدم ۱۰: تمدید و چرخش session (آشنایی)

کتابخانه‌های خوب گاهی وقتی session نزدیک انقضاست آن را **تمدید** می‌کنند و کوکی تازه می‌نویسند (`session.fresh` در الگوی Lucia).

فایده:

- کاربر فعال از سیستم پرت نمی‌شود  
- می‌توانی id را بچرخانی تا سرقت کوکی قدیمی کم‌اثرتر شود  

در پیاده‌سازی دستی: اگر `expires_at` نزدیک بود، در `handle` هم DB را آپدیت کن هم `cookies.set` دوباره.

---

## قدم ۱۱: چند دام در عمل

### ۱) `path` اشتباه در delete

```ts
cookies.set('session', id, { path: '/' });
cookies.delete('session'); // ممکن است پاک نشود اگر path لازم است
cookies.delete('session', { path: '/' }); // درست
```

### ۲) گذاشتن کل JSON کاربر در کوکی

حجم، افشا، جعل — به‌جاش session id.

### ۳) خواندن session فقط در کلاینت

`document.cookie` برای `httpOnly` خالی است — عمداً.

### ۴) یک session برای همهٔ کاربران در متغیر ماژول

ضدالگوی درس ۱۸؛ session باید per-user در DB/کوکی باشد.

### ۵) `secure: true` روی `http://localhost` بدون توجه

در بعضی محیط‌ها کوکی ست نمی‌شود؛ در dev معمولاً `secure: false` یا شرطی.

### ۶) اعتماد به وجود کوکی بدون چک DB

کوکی جعلی/منقضی را در `handle` بی‌اعتبار کن و پاک کن.

---

## قدم ۱۲: کوکی‌های غیرجلسه‌ای — کی مجازند؟

| کوکی | HttpOnly؟ | مثال |
|------|-----------|------|
| session id | بله | لاگین |
| فلگ visited | ترجیحاً بله | آمار ساده |
| ترجیح UI که JS باید بخواند | خیر (و مراقب XSS) | تم — گاهی بهتر است در `localStorage` یا URL |

اگر JS باید مقدار را بخواند، `httpOnly: false` لازم است — ولی آن را برای توکن لاگین استفاده نکن.

---

## قدم ۱۳: ارتباط با بقیهٔ درس‌ها

| درس | ربط |
|-----|-----|
| ۱۱ Hooks | جای validate کوکی → `locals` |
| ۱۶ Form Actions | جای `cookies.set` بعد از لاگین |
| ۲۱ Authentication | تصویر روش‌ها؛ این درس مکانیزم کوکی/سشن |
| ۲۰ Knex | ذخیرهٔ جدول `sessions` |
| ۱۵ جریان داده | `locals` ≠ خودکار به فرانت |

---

## قدم ۱۴: چک‌لیست Session امن در Kit

1. شناسهٔ تصادفی بلند و غیرقابل حدس  
2. ذخیره در DB با `user_id` و `expires_at`  
3. کوکی فقط id با `httpOnly` + `path: '/'` + `sameSite` + `secure` مناسب  
4. validate در `handle` هر درخواست  
5. logout = حذف DB + `cookies.delete` با همان path  
6. به UI فقط فیلدهای غیرحساس از `locals.user`  
7. اکشن‌های حساس دوباره `locals.user` را چک کنند  

---

## جمع‌بندی

- کوکی دادهٔ کوچک سمت مرورگر است؛ Session وضعیت کاربر سمت سرور.  
- الگوی درست: کوکی = session id، سرور = جزئیات نشست/کاربر.  
- در Kit با `cookies.get/set/delete` فقط روی سرور کار کن و همیشه `path` را مشخص کن.  
- برای لاگین: set در action، validate در `handle`، delete در logout.  
- `httpOnly` و `sameSite` و `secure` ستون امنیت کوکی sessionاند.  
- کوکی جعلی را با چک DB رد کن؛ به وجود نام کوکی alone اعتماد نکن.

## تمرین

1. یک `load` بنویس (روی کاغذ یا کد) که کوکی `lang` را بخواند و اگر نبود `fa` ست کند و در `data` برگرداند.  
2. توضیح بده چرا `cookies.delete('session', { path: '/' })` باید همان pathِ `set` را داشته باشد.  
3. جریان logout را در سه گام بنویس: DB، کوکی، redirect.  
4. فرق «session cookie مرورگر» (بدون maxAge) با «session لاگین در DB» را در دو جمله بگو تا قاطی نشوند.
