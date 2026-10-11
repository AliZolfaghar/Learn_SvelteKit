# درس ۲۱: Authentication در SvelteKit — روش‌ها و الگوها

## هدف درس
بعد از این درس فرق Authentication و Authorization را می‌دانی، دو مدل اصلی Session و JWT را می‌شناسی، الگوی رسمی SvelteKit با کوکی + `hooks` + `locals` را قدم‌به‌قدم بلدی، می‌دانی چطور صفحه/اکشن را محافظت کنی، و با گزینه‌های کتابخانه‌ای (مثل Better Auth) و روش‌های رایج (رمزعبور، OAuth، لینک جادویی) آشنا می‌شوی.

## پیش‌نیاز
- درس ۱۱ (`handle` و `locals`)
- درس ۱۶ (Form Actions برای لاگین/خروج)
- درس ۱۸ (نریختن state کاربر در متغیر سراسری سرور)
- درس ۲۰ (در صورت ذخیرهٔ session در DB با Knex — مفید ولی اجباری نیست)

---

## قدم ۱: دو واژه را جدا کن

| مفهوم | معنی ساده |
|--------|-----------|
| **Authentication** | کاربر کیست؟ (ثابت کردن هویت) |
| **Authorization** | این کاربر اجازهٔ چه کاری را دارد؟ |

مثال:

- Authentication: با ایمیل/رمز ثابت شد که «سجاد» است  
- Authorization: سجاد `admin` است پس می‌تواند کاربر حذف کند  

SvelteKit خودش «سیستم لاگین آماده» داخل هسته ندارد؛ نقاط اتصال می‌دهد تا خودت یا یک کتابخانه auth را وصل کنی.

---

## قدم ۲: بعد از لاگین چه چیزی کاربر را «به‌یاد» می‌آورد؟

کاربر هر بار رمز نمی‌دهد. معمولاً یکی از این دو:

### الف) Session ID (پیشنهادی برای اپ وب کلاسیک)

```text
لاگین موفق
  → سرور یک session در DB می‌سازد
  → فقط شناسهٔ session داخل کوکی HttpOnly می‌رود
  → هر درخواست: کوکی خوانده می‌شود → session در DB چک می‌شود → user مشخص می‌شود
```

| خوبی | بدی |
|------|-----|
| باطل کردن فوری (logout / دزدیده‌شدن) | هر درخواست یک خواندن DB (یا کش) |
| کنترل کامل سمت سرور | پیاده‌سازی کمی بیشتر |

### ب) Token امضاشده (مثلاً JWT)

```text
لاگین موفق
  → سرور یک JWT امضا می‌کند
  → توکن به کلاینت داده می‌شود (اغلب کوکی یا گاهی header)
  → هر درخواست: امضا verify می‌شود — معمولاً بدون DB
```

| خوبی | بدی |
|------|-----|
| سریع‌تر، فشار کمتر روی DB | باطل کردن فوری سخت‌تر است |
| مناسب بعضی APIها / موبایل | اگر لو برود تا انقضا معتبر می‌ماند مگر blacklist بسازی |

مستند رسمی Kit همین دو مدل را مطرح می‌کند. برای سایت SvelteKit با فرم و کوکی، **session در DB + کوکی** معمولاً انتخاب اول آموزشی و عملی است.

---

## قدم ۳: نقطهٔ اتصال اصلی — `handle` و `locals`

تقریباً همهٔ روش‌های خوب در Kit به اینجا می‌رسند:

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { db } from '#lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');

	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	const user = await findUserBySession(db, sessionId);
	event.locals.user = user; // یا null اگر session نامعتبر

	return resolve(event);
};
```

و در `src/app.d.ts`:

```ts
declare global {
	namespace App {
		interface Locals {
			user: { id: string; email: string; name: string } | null;
		}
	}
}

export {};
```

معنی:

1. هر درخواست از `handle` رد می‌شود  
2. اگر کوکی نشست معتبر باشد، `locals.user` پر می‌شود  
3. `load` / actions / `+server` همان را می‌خوانند  
4. `locals` به‌خود‌ی‌خود به مرورگر نمی‌رود مگر در `return` بیاوری  

این الگو مستقل از این است که خودت نوشته باشی یا Better Auth / راهنمای Lucia.

---

## قدم ۴: کوکی درست برای session

ویژگی‌های مهم:

| گزینه | توصیه |
|--------|--------|
| `httpOnly: true` | JS مرورگر به کوکی دسترسی نداشته باشد (ضد XSS سرقت session) |
| `secure: true` | فقط روی HTTPS (در dev اغلب false) |
| `sameSite: 'lax'` یا `'strict'` | کاهش ریسک CSRF همراه با محافظت Kit |
| `path: '/'` | در کل سایت ارسال شود |
| عمر مناسب | نه ابدی؛ با تمدید/چرخش session |

Kit برای فرم‌ها **محافظت CSRF پایه** دارد؛ باز هم کوکی session را درست تنظیم کن.

هرگز session id را در `localStorage` نگذار اگر می‌توانی از کوکی HttpOnly استفاده کنی.

---

## قدم ۵: جریان Username / Password (الگوی دستی آموزشی)

### ۱) ثبت‌نام / لاگین با Form Action

```ts
// مفهومی — src/routes/login/+page.server.ts
export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');

		const user = await findUserByEmail(email);
		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return fail(400, { email, incorrect: true });
		}

		const sessionId = await createSession(user.id); // ذخیره در DB
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7
		});

		redirect(303, '/dashboard');
	}
};
```

رمز را **همیشه hash** کن (مثلاً با الگوریتم مدرن مثل argon2 / scrypt / bcrypt).  
هرگز hash را به کلاینت `return` نکن.

### ۲) خروج

```ts
// logout action
await deleteSession(locals.sessionId);
cookies.delete('session', { path: '/' });
redirect(303, '/login');
```

### ۳) نشان دادن کاربر در UI

```ts
// +layout.server.ts
export const load = async ({ locals }) => {
	return {
		user: locals.user // فقط فیلدهای امن: id, name, email
	};
};
```

```svelte
{#if data.user}
	<p>سلام {data.user.name}</p>
{:else}
	<a href="/login">ورود</a>
{/if}
```

---

## قدم ۶: محافظت صفحه و اکشن (Authorization عملی)

### محافظت یک صفحه

```ts
// src/routes/(app)/dashboard/+page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	return { /* ... */ };
};
```

یا در سطح گروه `(app)` با `+layout.server.ts` (درس ۱۳) تا همهٔ زیرمسیرها یکجا چک شوند.

### مهم: فقط layout کافی نیست

برای Form Action و `+server.ts` **دوباره** چک کن:

```ts
export const actions = {
	delete: async ({ locals }) => {
		if (!locals.user) {
			return fail(401);
		}
		// ...
	}
};
```

چرا؟ چون ممکن است کسی مستقیم POST بزند؛ نباید فقط به مخفی بودن دکمه در UI تکیه کنی.

### نقش‌ها (RBAC ساده)

```ts
if (locals.user.role !== 'admin') {
	error(403, 'Forbidden');
}
```

Authentication ≠ اجازهٔ admin.

---

## قدم ۷: روش‌های رایج Authentication (منوی انتخاب)

| روش | توضیح کوتاه | کِی |
|-----|-------------|-----|
| ایمیل + رمز | کلاسیک؛ session کوکی | اپ داخلی، یادگیری |
| OAuth / OIDC | ورود با Google/GitHub/… | وقتی نمی‌خواهی رمز نگه داری |
| Magic Link | لینک یک‌بارمصرف ایمیل | UX مدرن بدون رمز |
| OTP / کد پیامکی | کد کوتاه‌مدت | موبایل‌محور |
| Passkey / WebAuthn | کلید زیستی/دستگاه | امنیت بالا، کمی پیچیده‌تر |
| API Token / JWT | برای کلاینت غیروب یا موبایل | جدا از session صفحه |

در همهٔ حالت‌های وبِ Kit، بعد از موفقیت معمولاً باز هم به **کوکی session** (یا توکن در کوکی) می‌رسی و `handle` همان `locals.user` را پر می‌کند.

OAuth خلاصه:

```text
کلیک «ورود با Google»
  → ریدایرکت به Google
  → برگشت با code
  → سرور token/user می‌گیرد
  → user را در DB upsert می‌کند
  → session کوکی می‌سازد
```

---

## قدم ۸: کتابخانه‌ها — خودت ننویس مگر برای یادگیری

مستند رسمی SvelteKit می‌گوید:

- CLI سvelte می‌تواند **Better Auth** را به پروژه اضافه کند  
- برای پیاده‌سازی دستی مبتنی بر session، راهنمای **Lucia** مرجع آموزشی خوبی است (حتی اگر پکیج Lucia مسیرش عوض شده باشد، الگو همان است)

| گزینه | نقش |
|--------|-----|
| Better Auth | مسیر پیشنهادی CLI برای پروژهٔ واقعی |
| الگوی Lucia (session + cookie + locals) | یادگیری عمیق و کنترل دستی |
| Auth.js (Auth.js/SvelteKit) | اکوسیستم OAuth گسترده؛ یکپارچگی را با دقت و مستند روز بخوان |

برای کلاس این ریپو پیشنهاد مسیر:

1. اول الگوی دستی session + `handle` + Form Actions را بفهم  
2. بعد برای اپ واقعی Better Auth (یا معادل به‌روز) را ارزیابی کن  

---

## قدم ۹: جدول «کجا چه چیزی را چک کنیم؟»

| لایه | کار auth |
|------|-----------|
| `hooks.server` `handle` | خواندن کوکی، پر کردن `locals.user` |
| `+layout.server` گروه محافظت‌شده | redirect اگر لاگین نیست |
| هر `+page.server` / action / `+server` حساس | چک مجدد `locals.user` (+ نقش) |
| UI | فقط نمایش (لینک ورود/خروج) — منبع حقیقت نیست |
| Remote functions / API | هویت از کوکی/`locals`؛ نه از `url` دستکاری‌پذیر |

---

## قدم ۱۰: امنیت — چک‌لیست کوتاه

1. رمز را hash کن؛ plain ذخیره نکن  
2. کوکی session: `httpOnly` + `secure` در prod + `sameSite`  
3. رازها در env خصوصی (درس ۱۹)  
4. فیلدهای حساس user را به کلاینت `return` نکن  
5. از CSRF پیش‌فرض Kit برای فرم‌ها غافل نشو؛ برای APIهای جداگانه جدا فکر کن  
6. Rate limit روی `/login` (ضد brute-force) در پروداکشن  
7. Session را در logout و در صورت نیاز «خروج از همهٔ دستگاه‌ها» باطل کن  
8. هرگز فقط با مخفی کردن دکمه در UI «امن» فرض نکن  

---

## قدم ۱۱: ضدالگوهای خطرناک

```ts
// ❌ متغیر سراسری روی سرور
let currentUser = null;
```

```ts
// ❌ اعتماد به کلاینت
if (browser && localStorage.getItem('isAdmin')) { ... }
```

```ts
// ❌ JWT در localStorage بدون نیاز
localStorage.setItem('token', jwt);
```

```ts
// ❌ فقط چک در +layout و فراموشی actions
```

```ts
// ❌ برگرداندن passwordHash داخل data
return { user: rowFromDb };
```

---

## قدم ۱۲: اسکلت پیشنهادی برای همین پروژهٔ یادگیری

```text
src/
├── hooks.server.ts              ← validate session → locals.user
├── app.d.ts                     ← App.Locals
├── lib/server/
│   ├── db.ts                    ← Knex (درس ۲۰)
│   ├── auth.ts                  ← hash/verify، create/invalidate session
│   └── users.ts
└── routes/
    ├── login/+page.svelte
    ├── login/+page.server.ts    ← action لاگین
    ├── logout/+page.server.ts   ← action خروج
    └── (app)/
        ├── +layout.server.ts    ← if (!locals.user) redirect
        └── dashboard/+page.server.ts
```

جریان یک درخواست به داشبورد:

```text
Browser (cookie: session=...)
  → handle: session معتبر؟ → locals.user
  → (app)/+layout.server: اگر null → /login
  → dashboard load: دادهٔ مخصوص کاربر
  → HTML با data.user امن
```

---

## قدم ۱۳: Session در برابر JWT — تصمیم سریع کلاس

| اگر… | انتخاب |
|------|--------|
| سایت کلاسیک با فرم و کوکی | Session در DB |
| نیاز به باطل کردن فوری | Session |
| میکروسرویس‌های زیاد و stateless محض | گاهی JWT (با استراتژی revoke) |
| یادگیری امنیت وب با Kit | Session + `locals` |

می‌توانی بعداً hybrid کنی (session برای وب، token برای API موبایل) — اول یکی را درست یاد بگیر.

---

## جمع‌بندی

- Authentication هویت را ثابت می‌کند؛ Authorization اجازه را.  
- دو مدل رایج بعد از لاگین: **Session ID در کوکی** یا **JWT**. برای Kit وب معمولاً session بهتر است.  
- نقطهٔ مرکزی: `handle` → خواندن کوکی → `event.locals.user`.  
- لاگین/خروج با Form Actions؛ رمز فقط به‌صورت hash در DB.  
- صفحه و **هر action/API حساس** را جداگانه محافظت کن.  
- UI منبع حقیقت auth نیست.  
- برای پروژهٔ واقعی به کتابخانه‌هایی مثل Better Auth فکر کن؛ برای فهم عمیق، الگوی session دستی را بلد باش.  
- در این ریپو هنوز auth پیاده نشده؛ اسکلت بالا نقشهٔ پیاده‌سازی بعدی است.

## تمرین

1. جریان لاگین را در ۵ فلش از «submit فرم» تا «`locals.user` پر می‌شود» روی کاغذ بکش.  
2. توضیح بده چرا چک کردن کاربر فقط در `+layout.server.ts` برای یک action حذف‌کننده کافی نیست.  
3. سه ویژگی کوکی session امن را نام ببر و برای هر کدام یک جمله دلیل بگو.  
4. جدول مقایسهٔ یک‌خطی Session در برابر JWT برای «logout فوری» و «فشار روی DB» بنویس.
