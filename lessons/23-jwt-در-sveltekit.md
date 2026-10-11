# درس ۲۳: استفاده از JWT در SvelteKit

## هدف درس
بعد از این درس می‌فهمی JWT چیست، از چه بخش‌هایی تشکیل شده، کِی در SvelteKit به session دیتابیسی ترجیح داده می‌شود، چطور آن را امن (معمولاً در کوکی HttpOnly) نگه داری، در `handle` اعتبارسنجی کنی، و الگوی Access + Refresh را در حد نیاز کلاس بشناسی.

## پیش‌نیاز
- درس ۲۱ (Authentication — تصویر کلی Session در برابر Token)
- درس ۲۲ (کوکی و APIی `cookies`)
- درس ۱۱ (`handle` و `locals`)

---

## قدم ۱: JWT با یک جمله

**JWT (JSON Web Token)** یک رشتهٔ امضاشده است که سرور صادر می‌کند تا کلاینت/درخواست‌های بعدی بتواند بدون پرس‌وجوی همیشگی به DB ثابت کند «این ادعاها دربارهٔ کاربر معتبرند».

شکل ظاهری معمولاً سه بخش با نقطه:

```text
header.payload.signature
```

مثال ذهنی payload بعد از decode (نه لزوماً رمزنگاری‌شده — اغلب فقط Base64Url است):

```json
{
  "sub": "user_42",
  "name": "سجاد",
  "role": "admin",
  "exp": 1710000000
}
```

| بخش | نقش |
|-----|-----|
| Header | الگوریتم و نوع توکن |
| Payload | ادعاها (claims) مثل `sub`, `exp`, `role` |
| Signature | امضا با کلید مخفی / کلید خصوصی — جلوی جعل |

نکتهٔ حیاتی:

> Payload به‌طور پیش‌فرض **مخفی نیست**. هرکس توکن را داشته باشد می‌تواند محتوا را بخواند.  
> پس رمز، کد ملی، راز و دادهٔ خیلی حساس را داخل JWT نگذار. فقط چیزهایی که برای authorize لازم است.

امضا جلوی **دستکاری** را می‌گیرد، نه لزوماً جلوی **خواندن**.

---

## قدم ۲: JWT در برابر Session در DB (یادآوری عملی)

| | Session ID در کوکی | JWT |
|--|-------------------|-----|
| محتوای کوکی | فقط یک id تصادفی | خود توکن (ادعاها + امضا) |
| هر درخواست | معمولاً خواندن DB/کش | verify امضا (بدون DB) |
| Logout فوری | آسان (حذف ردیف session) | سخت‌تر مگر blacklist / عمر خیلی کوتاه |
| مناسب | اپ وب کلاسیک Kit | API، موبایل، سرویس‌های stateless، ادغام با IdP |

مستند Kit هر دو را معتبر می‌داند. برای خیلی از سایت‌های SvelteKit، session ساده‌تر و امن‌تر از نظر revoke است.  
JWT را وقتی یاد بگیر که واقعاً به توکن امضاشده نیاز داری — یا بک‌اند جدا JWT می‌دهد.

---

## قدم ۳: قانون امنیتی در مرورگر

بد:

```text
JWT در localStorage
JWT در کوکی قابل‌خواندن با document.cookie
فرستادن JWT به کلاینت و نگه داشتنش در $state
```

بهتر برای اپ SvelteKit:

```text
JWT داخل کوکی HttpOnly (+ Secure + SameSite)
خواندن و verify فقط روی سرور (handle / load.server / actions)
locals.user از روی claims پر می‌شود
کلاینت فقط { id, name } غیرحساس را از data می‌بیند
```

الگوی خیلی امن (BFF):

- توکن اصلاً به JS مرورگر نرسد  
- APIهای بیرونی را از سرور Kit با `Authorization` پروکسی کنی  

برای کلاس، حداقل قابل قبول: **کوکی HttpOnly + verify در `handle`**.

---

## قدم ۴: کتابخانه — با دست امضا نکن

در Node/Kit معمولاً از کتابخانه‌های استاندارد استفاده می‌کنی، مثلاً **`jose`** (مدرن، مناسب Web Crypto) یا معادل معتبر دیگر.

مفهومی:

```ts
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signUserToken(user: { id: string; email: string }) {
	return new SignJWT({ email: user.email })
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(user.id)
		.setIssuedAt()
		.setExpirationTime('15m')
		.sign(secret);
}

export async function verifyUserToken(token: string) {
	const { payload } = await jwtVerify(token, secret);
	return payload; // sub, email, exp, ...
}
```

`JWT_SECRET` باید:

- بلند و تصادفی باشد  
- فقط در env خصوصی سرور باشد (درس ۱۹)  
- هرگز `PUBLIC_` نشود  

برای الگوریتم‌های نامتقارن (RS256) جفت کلید public/private داری؛ verify با public، sign با private.

---

## قدم ۵: صادر کردن JWT موقع لاگین

```ts
// مفهومی — login/+page.server.ts
export const actions = {
	default: async ({ request, cookies }) => {
		const user = await authenticate(request); // ایمیل/رمز
		if (!user) return fail(400, { incorrect: true });

		const token = await signUserToken(user);

		cookies.set('token', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 15 // هم‌تراز با exp توکن (مثلاً ۱۵ دقیقه)
		});

		redirect(303, '/dashboard');
	}
};
```

نکات:

- `maxAge` کوکی و `exp` توکن را منطقی هم‌راستا کن  
- بعد از لاگین معمولاً redirect (درس ۱۶)  
- خود JWT را در `return` به صفحه نفرست مگر دلیل خیلی خاص داشته باشی  

---

## قدم ۶: اعتبارسنجی در `handle` → `locals`

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { verifyUserToken } from '#lib/server/jwt';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('token');

	if (!token) {
		event.locals.user = null;
		return resolve(event);
	}

	try {
		const payload = await verifyUserToken(token);
		event.locals.user = {
			id: String(payload.sub),
			email: String(payload.email ?? '')
		};
	} catch {
		// امضا باطل، منقضی، دستکاری‌شده
		event.cookies.delete('token', { path: '/' });
		event.locals.user = null;
	}

	return resolve(event);
};
```

```ts
// app.d.ts
interface Locals {
	user: { id: string; email: string } | null;
}
```

از اینجا به بعد مثل session عمل می‌کنی:

```ts
if (!locals.user) redirect(303, '/login');
```

فرق این است که به‌جای `SELECT * FROM sessions`، **verify امضا** کرده‌ای.

---

## قدم ۷: Access Token + Refresh Token (الگوی رایج)

Access JWT کوتاه‌عمر است (۵–۱۵ دقیقه).  
Refresh طولانی‌تر است و فقط برای گرفتن access جدید.

```text
لاگین
  → access_token (کوتاه) در کوکی HttpOnly
  → refresh_token (بلند) در کوکی HttpOnly جدا
هر درخواست
  → اگر access معتبر: locals.user
  → اگر access مرده ولی refresh زنده: توکن تازه صادر کن، کوکی‌ها را عوض کن
خروج
  → هر دو کوکی را پاک کن
  → اگر refresh در DB است، باطلش کن
```

جای درست برای refresh معمولاً **`hooks.server.ts`** است — نه داخل چند `load` موازی (race روی `cookies.set`).

```ts
// اسکلت ذهنی handle
const access = cookies.get('access_token');
const refresh = cookies.get('refresh_token');

if (access && (await isValid(access))) {
	locals.user = userFrom(access);
} else if (refresh && (await isValidRefresh(refresh))) {
	const tokens = await rotateTokens(refresh);
	cookies.set('access_token', tokens.access, { ... });
	cookies.set('refresh_token', tokens.refresh, { ... });
	locals.user = userFrom(tokens.access);
} else {
	locals.user = null;
}
```

Refresh را بهتر است در DB هم ثبت کنی تا:

- logout از همهٔ دستگاه‌ها ممکن شود  
- سرقت refresh قابل ابطال باشد  

وگرنه با JWT خالصِ بدون ذخیره، revoke سخت می‌ماند.

---

## قدم ۸: استفاده در `load` و API داخلی

```ts
// +page.server.ts
export const load = async ({ locals, fetch }) => {
	if (!locals.user) redirect(303, '/login');

	// اگر API بیرونی توکن می‌خواهد، از سرور بفرست — نه از کلاینت
	const res = await fetch('https://api.example.com/me', {
		headers: {
			// توکن را از کوکی/locals در سرور بردار، نه از مرورگر
		}
	});

	return { profile: await res.json() };
};
```

با `handleFetch` می‌توانی برای `event.fetch` به‌صورت متمرکز هدر `Authorization` اضافه کنی (درس ۱۱) — توکن همان‌جا از کوکی خوانده می‌شود و به باندل کلاینت نمی‌رود.

---

## قدم ۹: Logout با JWT

```ts
cookies.delete('access_token', { path: '/' });
cookies.delete('refresh_token', { path: '/' });
// اگر refresh در DB است:
await db('refresh_tokens').where({ id: ... }).del();
redirect(303, '/login');
```

اگر فقط access JWT بدون ذخیره داشته باشی، بعد از logout تا `exp` هنوز از نظر رمزنگاری «معتبر» است مگر:

- عمرش خیلی کوتاه باشد، یا  
- blacklist/`jti` در سرور چک کنی، یا  
- فقط به کوکی وابسته باشی و کوکی را پاک کرده باشی (برای مرورگر همان کاربر کافی است؛ دزد توکن جداست)

به همین خاطر access کوتاه‌عمر مهم است.

---

## قدم ۱۰: Claims مفید

| Claim | معنی |
|--------|------|
| `sub` | شناسهٔ کاربر (subject) |
| `iat` | زمان صدور |
| `exp` | انقضا |
| `nbf` | قبل از این زمان قبول نکن |
| `jti` | شناسهٔ یکتای توکن (برای revoke لیست) |
| سفارشی | `role`, `email` — حداقل لازم |

اشتباه رایج: گذاشتن `passwordHash` یا مجوزهای خیلی جزئیِ حساس در payload.

---

## قدم ۱۱: کِی JWT در همین مسیر یادگیری کلاس؟

| سناریو | پیشنهاد |
|--------|---------|
| اپ آموزشی با فرم و داشبورد | Session DB (درس ۲۱–۲۲) ساده‌تر است |
| باید به API خارجی با Bearer وصل شوی | JWT/OAuth؛ در Kit داخل کوکی HttpOnly نگه دار |
| اپ موبایل + سایت | گاهی JWT برای موبایل، session برای وب |
| نیاز به logout فوری سخت‌گیرانه | Session یا refresh ذخیره‌شده در DB |

JWT ابزار است نه الزام SvelteKit.

---

## قدم ۱۲: اشتباهات رایج

1. **JWT در `localStorage`**  
2. **verify فقط در کلاینت** (کلید یا اعتماد به payload بدون امضا)  
3. **Access با عمر چند روز بدون قابلیت revoke**  
4. **گذاشتن راز داخل payload**  
5. **استفاده از `alg: none` یا قبول الگوریتم غلط**  
6. **refresh را داخل چند `load` موازی ست کردن** → race؛ جایش `handle` است  
7. **یکی دانستن «decode» با «verify»** — decode بدون verify بی‌ارزش امنیتی است  
8. **فرض اینکه پاک کردن کوکی، توکن دزدیده‌شده را باطل می‌کند** اگر جایی کپی شده باشد  

---

## قدم ۱۳: اسکلت فایل‌ها در پروژهٔ فرضی

```text
src/lib/server/jwt.ts       ← sign / verify با jose
src/hooks.server.ts         ← خواندن کوکی، refresh، locals.user
src/routes/login/+page.server.ts
src/routes/logout/+page.server.ts
.env                        ← JWT_SECRET (خصوصی)
```

جریان:

```text
login action → signJWT → cookies.set
request بعد → handle → jwtVerify → locals.user
pages/actions → چک locals.user
logout → delete cookies (+ invalidate refresh در DB)
```

---

## قدم ۱۴: چک‌لیست تصمیم JWT در Kit

1. آیا واقعاً به JWT نیاز دارم یا session کافی است؟  
2. توکن کجا ذخیره می‌شود؟ → ترجیحاً HttpOnly cookie  
3. Access کوتاه‌عمر؟  
4. Refresh قابل ابطال در DB؟  
5. verify فقط روی سرور با secret/private key؟  
6. `locals.user` از claims ساخته می‌شود نه از اعتماد کور به کلاینت؟  
7. اکشن‌های حساس دوباره authorize می‌شوند؟  

---

## جمع‌بندی

- JWT رشتهٔ امضاشده با claims است؛ محتوایش را مخفی فرض نکن، فقط دست‌نخورده بودنش را با verify ثابت کن.  
- در SvelteKit الگوی امن رایج: JWT در کوکی HttpOnly + اعتبارسنجی در `handle` + `locals.user`.  
- Access کوتاه + Refresh (ترجیحاً قابل ابطال) مدل بالغ‌تری است؛ refresh را در `handle` بچرخان نه در `load`های موازی.  
- برای خیلی از اپ‌های Kit، session در DB هنوز ساده‌تر و برای logout فوری بهتر است.  
- هرگز JWT لاگین را در `localStorage` یا باندل کلاینت رها نکن.  
- این درس مکمل ۲۱ و ۲۲ است: همان لولهٔ کوکی/`locals`، با موتور اعتبارسنجی متفاوت (امضا به‌جای ردیف session).

## تمرین

1. یک payload فرضی بنویس و بگو کدام فیلدها مجازند و کدام‌ها نباید داخل JWT باشند.  
2. توضیح بده فرق `jwtVerify` با فقط Base64 decode کردن وسط توکن چیست.  
3. بگو چرا چرخاندن refresh داخل دو `load` همزمان خطر race روی کوکی دارد و جایش کجاست.  
4. برای اپ «داشبورد آموزشی همین ریپو» یک پاراگراف بنویس: Session را انتخاب می‌کنی یا JWT؟ چرا؟
