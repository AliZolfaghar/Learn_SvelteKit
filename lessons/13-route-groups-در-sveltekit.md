# درس ۱۳: Route Groups در SvelteKit — راهنمای کامل

## هدف درس
بعد از این درس می‌فهمی **Route Group** چیست، چرا نام فولدر داخل `(پرانتز)` روی URL اثر ندارد، چطور با آن چند پوستهٔ layout برای بخش‌های مختلف سایت می‌سازی، کِی سراغش بروی و کِی نروی، و چطور با layout ریشه و تکنیک `+page@` جمع می‌شود.

## پیش‌نیاز
- درس ۱۰ (routing)
- درس ۱۲ (layoutها)
- دانستن تفاوت فولدر عادی مثل `blog/` با مسیر URL

---

## قدم ۱: مشکل را با یک مثال ببین

فرض کن دو جور صفحه داری:

| بخش | مثال URL | پوستهٔ UI |
|-----|----------|-----------|
| بازاریابی | `/`, `/about`, `/pricing` | هدر ساده، فوتر بزرگ |
| اپلیکیشن | `/dashboard`, `/settings` | سایدبار، بدون فوتر بازاریابی |

اگر بنویسی:

```text
src/routes/marketing/about/+page.svelte  →  /marketing/about  ❌ نمی‌خوای
src/routes/app/dashboard/+page.svelte      →  /app/dashboard    ❌ نمی‌خوای
```

نام فولدر **وارد URL شده**.  
تو می‌خوای URL همان `/about` و `/dashboard` بماند، ولی **layout جدا** داشته باشند.

راه‌حل SvelteKit: **Route Group**.

---

## قدم ۲: Route Group چیست؟

یک دایرکتوری داخل `src/routes` که نامش داخل **پرانتز** است:

```text
(marketing)
(app)
(auth)
```

ویژگی کلیدی:

> نام گروه در **pathname** دیده نمی‌شود؛ فقط برای سازماندهی فایل‌ها و اعمال `+layout` / `+error` / `load` مشترک است.

| مسیر فایل | URL واقعی |
|-----------|-----------|
| `src/routes/(marketing)/about/+page.svelte` | `/about` |
| `src/routes/(app)/dashboard/+page.svelte` | `/dashboard` |
| `src/routes/(app)/settings/profile/+page.svelte` | `/settings/profile` |

پرانتز = «این سگمنت را در آدرس حساب نکن».

---

## قدم ۳: مقایسه با فولدر عادی

```text
# فولدر عادی — روی URL اثر دارد
src/routes/blog/+page.svelte        → /blog

# گروه — روی URL اثر ندارد
src/routes/(blog)/+page.svelte      → /     (اگر +page مستقیم داخل گروه باشد)
src/routes/(blog)/posts/+page.svelte → /posts
```

پس:

- برای بخش واقعی URL مثل `/blog/...` → فولدر عادی `blog/`  
- فقط برای دسته‌بندی و layout مشترک بدون اثر روی URL → `(something)/`

---

## قدم ۴: الگوی کلاسیک دو پوسته

```text
src/routes/
├── +layout.svelte                 ← چیزهای خیلی مشترک (فاوآیکون، فونت، جهت RTL)
├── +error.svelte                  ← خطای سراسری (اختیاری)
│
├── (marketing)/
│   ├── +layout.svelte             ← هدر/فوتر بازاریابی
│   ├── +page.svelte               → /          (خانه داخل این گروه)
│   ├── about/+page.svelte         → /about
│   └── pricing/+page.svelte       → /pricing
│
└── (app)/
    ├── +layout.svelte             ← سایدبار اپ
    ├── +layout.server.ts          ← مثلاً چک لاگین برای کل اپ
    ├── dashboard/+page.svelte     → /dashboard
    └── settings/+page.svelte      → /settings
```

زنجیره برای `/dashboard`:

```text
routes/+layout.svelte          (ریشه)
  └─ (app)/+layout.svelte      (سایدبار)
       └─ dashboard/+page.svelte
```

زنجیره برای `/about`:

```text
routes/+layout.svelte
  └─ (marketing)/+layout.svelte
       └─ about/+page.svelte
```

`(app)` در هیچ‌کدام از URLها ظاهر نمی‌شود.

در پروژهٔ فعلی فقط layout ریشه را داری؛ هنوز group نساخته‌ای — این درس نقشهٔ مرحلهٔ بعد است.

---

## قدم ۵: `+page` مستقیم داخل گروه

می‌توانی صفحه را بدون فولدر اضافه داخل خود گروه بگذاری:

```text
src/routes/(marketing)/+page.svelte  →  /
```

این یعنی «خانه مال بستهٔ marketing است و layout همان گروه را می‌گیرد».

اگر همزمان داشته باشی:

```text
src/routes/+page.svelte
src/routes/(marketing)/+page.svelte
```

هر دو می‌خواهند `/` را match کنند → **تداخل / خطای build**.  
پس برای هر URL فقط یک `+page` تعریف کن.

---

## قدم ۶: چه فایل‌هایی داخل گروه معنی دارند؟

هر چیز route که در فولدر عادی می‌گذاری، داخل گروه هم می‌تواند باشد:

| فایل | اثر |
|------|-----|
| `+layout.svelte` | پوستهٔ مشترک اعضای گروه |
| `+layout.ts` / `+layout.server.ts` | داده و page options پیش‌فرض گروه |
| `+error.svelte` | خطای مخصوص همان بخش |
| `+page.svelte` | صفحه (بدون افزودن نام گروه به URL) |
| زیرپوشه‌های عادی مثل `dashboard/` | بخش واقعی URL |

گروه فقط یک «لایهٔ نامرئی» در درخت است؛ بقیهٔ قراردادهای routing سر جایشان هستند.

---

## قدم ۷: داده و امنیت در سطح گروه

یکی از بهترین کاربردها: **کل بخش اپ باید لاگین باشد**.

```ts
// src/routes/(app)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	return { user: locals.user };
};
```

صفحات داخل `(app)` همه این `load` را به ارث می‌برند.  
صفحات `(marketing)` کاری به این چک ندارند.

این تمیزتر از تکرار `if (!user) redirect` در هر `+page.server.ts` است.

---

## قدم ۸: صفحه بیرون از گروه‌ها — «استثنا»

```text
src/routes/
├── +layout.svelte
├── (marketing)/...
├── (app)/...
└── admin/
    └── +page.svelte          → /admin
```

`/admin` فقط layout ریشه را می‌گیرد؛ نه marketing و نه app.  
برای صفحهٔ خاص (پنل خام، صفحهٔ چاپ، health UI ساده) همین الگو اغلب از `+page@` ساده‌تر است.

صفحهٔ لاگین را هم معمولاً بیرون از `(app)` می‌گذاری تا با redirect لاگین حلقه نسازد:

```text
src/routes/(auth)/login/+page.svelte   → /login
# یا
src/routes/login/+page.svelte          → /login
```

اگر login داخل `(app)` باشد و layout اپ هرکسِ بدون user را به `/login` بفرستد، ممکن است گیر بیفتی.

---

## قدم ۹: چند گروه، تودرتو، و نام‌گذاری

### چند گروه هم‌سطح

کاملاً رایج است: `(marketing)`, `(app)`, `(auth)`.

### گروه تودرتو

ممکن است، ولی زود شلوغ می‌شود:

```text
src/routes/(app)/(shop)/cart/+page.svelte  → /cart
```

هر دو نامرئی‌اند؛ فقط وقتی layoutهای لایه‌لایهٔ واقعاً متفاوت لازم داری سراغش برو.

### اسم گروه

- روی URL اثر ندارد → می‌تواند فارسی معنی‌دار در ذهن تیم باشد، ولی در عمل معمولاً انگلیسی کوتاه: `(app)`, `(marketing)`, `(auth)`  
- فقط برای انسان و ساختار فایل است  
- دو گروه هم‌نام در یک سطح معنی ندارد؛ مثل دو فولدر هم‌اسم  

### تداخل نام گروه با فولدر واقعی

این‌ها هم‌زمان می‌توانند گیج‌کننده باشند:

```text
src/routes/(blog)/...     # گروه نامرئی
src/routes/blog/...       # URL واقعی /blog
```

مجاز است، ولی برای شاگرد بهتر است نام‌ها را قاطی نکنی: گروه را `(marketing)` بگذار، بخش URL را `blog/`.

---

## قدم ۱۰: گروه در برابر `+page@` / `+layout@`

| نیاز | ابزار مناسب‌تر |
|------|----------------|
| یک دسته صفحه با یک پوستهٔ مشترک | Route Group + `+layout` |
| کل بخش اپ با یک `load` سرور مشترک | Group + `+layout.server.ts` |
| فقط یک صفحه از وسط زنجیره بپرد بیرون | `+page@(app).svelte` یا مشابه |
| نمی‌خواهی درخت را پیچانده کنی | کامپوننت مشترک در `#lib` |

قانون کلاس:

1. اول group  
2. اگر یک outlier داشتی، بیرون گروه بگذار  
3. `@` را برای موارد خاص نگه دار  

---

## قدم ۱۱: ناوبری و حفظ layout بین گروه‌ها

- رفتن از `/dashboard` به `/settings` (هر دو داخل `(app)`) → layout اپ معمولاً **می‌ماند**  
- رفتن از `/dashboard` به `/about` (گروه دیگر) → layout اپ عوض می‌شود با layout marketing؛ layout ریشه می‌تواند بماند  

پس state منوی سایدبار بین صفحات اپ حفظ می‌شود، ولی با رفتن به سایت بازاریابی طبیعی است که ریست شود.

لینک‌ها همان `/about` و `/dashboard`اند؛ هیچ `/ (app)/` در `href` نمی‌نویسی:

```svelte
<a href="/about">درباره</a>
<a href="/dashboard">داشبورد</a>
```

---

## قدم ۱۲: Error مخصوص یک گروه

```text
src/routes/(app)/
├── +layout.svelte
├── +error.svelte          ← ظاهر خطای داخل اپ
└── dashboard/+page.svelte
```

اگر داخل اپ خطا بخورد، می‌توانی UI خطا را با سایدبار/تم اپ هماهنگ کنی؛  
خطاهای بخش marketing ظاهر دیگری داشته باشند.

این یکی از دلیل‌های خوب برای group است: نه فقط layout موفق، بلکه **مرز خطا** هم.

---

## قدم ۱۳: Page options در سطح گروه

```ts
// src/routes/(marketing)/+layout.ts
export const prerender = true;
```

همهٔ صفحات marketing به‌صورت پیش‌فرض prerender می‌شوند؛  
`(app)` می‌تواند `prerender = false` بماند چون وابسته به کاربر است.

---

## قدم ۱۴: چه زمانی Route Group لازم نیست؟

از group استفاده نکن اگر:

1. فقط یک صفحه است و یک شرط `{#if}` در layout ریشه کافی است  
2. واقعاً می‌خواهی URL شامل آن بخش باشد (`/docs/...` → فولدر `docs/`)  
3. داری گروه تودرتو می‌سازی فقط برای «مرتب به نظر رسیدن» بدون تفاوت layout/`load`  
4. می‌توانی با یک کامپوننت `Shell.svelte` در `#lib` همان UI را بدون پیچاندن درخت بدهی  

Group ابزار **مرز مسیر و پوسته** است، نه جایگزین فولدربندی سلیقه‌ای در `lib`.

---

## قدم ۱۵: اشتباهات رایج

1. **نوشتن لینک `/app/dashboard`** به‌خاطر نام گروه `(app)` — غلط است؛ درست: `/dashboard`  
2. **دو `+page` برای یک URL** (یکی در ریشه، یکی در گروه)  
3. **گذاشتن `login` داخل `(app)`** همراه با redirect اجباری لاگین  
4. **فکر کردن `(app)` مثل namespace در سرور Express است** — فقط قرارداد فایل‌سیستم Kit است  
5. **ساخت گروه بدون `+layout`** وقتی هیچ تفاوت پوسته‌ای نیست — فقط شلوغی اضافه  
6. **قاطی کردن نام گروه با پارامتر `[app]` یا فولدر `app/`**  

---

## قدم ۱۶: نقشهٔ پیشنهادی برای همین پروژهٔ یادگیری

وقتی خواستی از تک‌صفحه‌ای فعلی جلوتر بروی:

```text
src/routes/
├── +layout.svelte                 ← همان favicon فعلی (+ شاید جهت/فونت)
├── (marketing)/
│   ├── +layout.svelte             ← هدر ساده کلاس
│   ├── +page.svelte               → /   (خانه + Counter)
│   └── about/+page.svelte         → /about
└── (app)/
    ├── +layout.svelte             ← nav اپ آموزشی
    └── playground/
        └── +page.svelte           → /playground
```

تمرین ذهنی: Counter را در خانهٔ marketing بگذار؛ یک صفحهٔ playground داخل `(app)` با layout متفاوت بساز و با لینک جابه‌جا شو.

---

## قدم ۱۷: چک‌لیست تصمیم‌گیری سریع

| سؤال | جواب |
|------|------|
| می‌خواهم URL عوض نشود ولی layout عوض شود؟ | Route Group |
| می‌خواهم `/blog` در آدرس باشد؟ | فولدر عادی `blog/` |
| چند صفحه یک `load` سرور مشترک دارند؟ | `+layout.server` داخل group |
| یک صفحه نباید پوستهٔ گروه را بگیرد؟ | بیرون گروه بگذار (یا در نهایت `@`) |
| فقط UI تکراری است نه مرز مسیر؟ | کامپوننت `#lib` |

---

## جمع‌بندی

- Route Group = فولدر `(name)` داخل `routes` که **روی URL اثر ندارد**.  
- کاربرد اصلی: چند پوستهٔ layout / چند سیاست `load` / چند `+error` برای بخش‌های مختلف سایت.  
- صفحات را با مسیر واقعی‌شان لینک کن (`/about`)، نه با نام گروه.  
- برای هر URL فقط یک صفحه تعریف کن.  
- لاگین و صفحات استثنا را معمولاً بیرون از گروه «محافظت‌شده» بگذار.  
- اگر گروه درخت را پیچیده می‌کند، composition با کامپوننت را ترجیح بده.  
- در پروژهٔ فعلی هنوز group نداری؛ وقتی دو UI متفاوت خواستی، زمان اضافه کردنش است.

## تمرین

1. روی کاغذ درخت `(marketing)` و `(app)` را طوری بکش که `/` و `/about` یک هدر داشته باشند و `/dashboard` سایدبار؛ URLها را کنار هر فایل بنویس.  
2. توضیح بده چرا `src/routes/(app)/dashboard/+page.svelte` برابر `/dashboard` است نه `/app/dashboard`.  
3. بنویس اگر `login` را داخل `(app)` بگذاری و layout آن گروه کاربرِ لاگین‌نشده را به `/login` redirect کند، چه مشکلی پیش می‌آید.  
4. یک مورد واقعی از اپ خودت بگو که با group حل می‌شود و یک مورد که بهتر است فقط فولدر عادی یا کامپوننت باشد.
