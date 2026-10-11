# درس ۳۱: Hookهای `init` و اجرای کد در هر جابه‌جایی صفحه

## هدف درس
بعد از این درس فرق **`init`** (یک‌بار در شروع) با **`handle`** (هر درخواست سرور) و **`afterNavigate` / `onPageNavigate`** (هر جابه‌جایی در مرورگر) را بلدی، می‌دانی الان در پروژه چه فایل‌هایی این کار را می‌کنند، و کی سراغ کدام بروی.

## پیش‌نیاز
- درس ۱۱ (نمای کلی hooks)
- درس ۱۳ (layout ریشه — جای `onPageNavigate`)

---

## قدم ۱: سه لحظهٔ مختلف — قاطی‌شان نکن

| لحظه | ابزار | چند بار؟ | کجا |
|------|--------|----------|-----|
| بالا آمدن سرور Node | `export const init` در `hooks.server.ts` | **یک‌بار** per process | سرور |
| بالا آمدن اپ در مرورگر | `export const init` در `hooks.client.ts` | **یک‌بار** بعد از hydrate | کلاینت |
| هر درخواست HTTP به Kit | `export const handle` در `hooks.server.ts` | **هر request** | سرور |
| هر جابه‌جایی صفحه در SPA | `afterNavigate` / `onPageNavigate` | **هر navigation** | کلاینت |

اشتباه رایج:

> «می‌خواهم در هر صفحه migration بزنم → بگذار داخل init»

`init` سرور فقط وقتی پروسه شروع می‌شود صدا زده می‌شود، نه وقتی کاربر از `/users` به `/notes` می‌رود.

---

## قدم ۲: `init` فعلی سرور — کامل

فایل: `src/hooks.server.ts`

```ts
export const init = async () => {
  console.info('[hooks.server init] server starting — running migrations');
  await db.migrate.latest();
  console.info('[hooks.server init] migrations ready');
};
```

### چه زمانی اجرا می‌شود؟

1. پروسهٔ سرور SvelteKit بالا می‌آید (`npm run dev` یا `node build`).  
2. **قبل از** پاسخ به اولین درخواست، Kit تابع `init` را await می‌کند.  
3. تا وقتی همان پروسه زنده است، دوباره صدا زده **نمی‌شود**.

اگر سرور را restart کنی → دوباره یک‌بار اجرا می‌شود.  
اگر فقط در مرورگر بین صفحات بگردی → **اجرا نمی‌شود**.

### اینجا چه کار می‌کند؟

`db.migrate.latest()` یعنی: همهٔ migrationهای pending را اعمال کن (درس ۲۹).

برای کلاس راحت است: دیتابیس با استارت اپ هم‌تراز می‌شود.

### محدودیت / نکتهٔ production

- استارت اپ را به migrate وابسته می‌کند.  
- اگر migration خراب باشد، سرور بالا نمی‌آید.  
- بعضی تیم‌ها در production فقط با `npm run db:migrate` در CI/deploy مایگریت می‌کنند و `init` را خالی/سبک می‌گذارند.

### `init` کلاینت

فایل: `src/hooks.client.ts`

```ts
export const init = async () => {
  console.info('[hooks.client init] app hydrated in browser');
};
```

این هم **یک‌بار** است — وقتی JS اپ در مرورگر آماده شد. برای analytics bootstrap یا ثبت یک listener سراسری خوب است؛ برای «هر صفحه» نه.

---

## قدم ۳: `handle` — hook هر درخواست روی سرور

همان فایل `hooks.server.ts`:

```ts
export const handle: Handle = async ({ event, resolve }) => {
  const started = Date.now();
  event.locals.requestStartedAt = started;

  console.info(
    `[hooks.server handle] ${event.request.method} ${event.url.pathname}${event.url.search}`
  );

  const response = await resolve(event);

  console.info(
    `[hooks.server handle] ${event.request.method} ${event.url.pathname} → ${response.status} (${Date.now() - started}ms)`
  );

  return response;
};
```

### جریان

```text
درخواست می‌آید
    → handle شروع
    → resolve(event)  (= loadها + رندر / action / endpoint)
    → handle تمام می‌شود و Response برمی‌گردد
```

اگر `resolve` را صدا نزنی، صفحه رندر نمی‌شود (مگر خودت `Response` برگردانی).

### آیا «هر جابه‌جایی صفحه» است؟

**نزدیک، ولی دقیق‌تر بگو: هر درخواست سرور.**

- بار اول که URL را باز می‌کنی → حتماً `handle` می‌خورد.  
- وقتی با کلیک لینک SvelteKit به‌صورت client-side می‌روی، اگر `+page.server.ts` / layout server load دوباره از سرور داده بخواهد → معمولاً باز هم request می‌زند و `handle` اجرا می‌شود.  
- اگر صفحه‌ای فقط دادهٔ کلاینت داشته باشد و هیچ درخواست سروری نزند → ممکن است این بار `handle` را نبینی.

پس برای لاگ/امنیت/سشن روی سرور → `handle`.  
برای «حتماً بعد از هر عوض شدن URL در UI» → کلاینت (`afterNavigate`).

### `event.locals`

در `app.d.ts`:

```ts
interface Locals {
  requestStartedAt?: number;
}
```

هر چیزی که در `handle` روی `event.locals` بگذاری، در همان درخواست به `load` و actions می‌رسد (مثلاً `user` بعد از خواندن کوکی — درس ۲۱/۲۲).

---

## قدم ۴: ناوبری هر صفحه در مرورگر — `onPageNavigate`

SvelteKit در `hooks.client.ts` چیزی به نام `handle` برای هر navigation ندارد. ابزار رسمی:

- `beforeNavigate`  
- `onNavigate`  
- `afterNavigate`  

از `$app/navigation`.

در این پروژه یک helper گذاشته‌ایم:

`src/lib/navigation/on-page-navigate.ts`

```ts
import { afterNavigate } from '$app/navigation';

export function onPageNavigate(handler) {
  afterNavigate((nav) => {
    handler({
      from: nav.from?.url.pathname ?? null,
      to: nav.to.url.pathname,
      type: nav.type
    });
  });
}
```

و در root layout (`src/routes/+layout.svelte`):

```ts
onPageNavigate(({ from, to, type }) => {
  console.info(`[onPageNavigate] ${from ?? '(start)'} → ${to} (${type})`);
});
```

### رفتار

- یک‌بار هنگام mount اول layout (ورود به اپ)  
- بعد از هر جابه‌جایی موفق به URL جدید  

`type` می‌تواند مثلاً `link`، `goto`، `popstate` و … باشد.

### چرا در `+layout.svelte` ریشه؟

چون layout ریشه تا وقتی اپ باز است mount می‌ماند؛ پس listener ناوبری زنده می‌ماند. اگر در یک صفحهٔ فرزند بگذاری، با ترک آن صفحه از بین می‌رود.

---

## قدم ۵: جدول تصمیم سریع

| نیاز | کجا |
|------|-----|
| Migrate / اتصال DB هنگام استارت سرور | `hooks.server.ts` → `init` |
| شناخت کاربر از کوکی در هر request | `hooks.server.ts` → `handle` + `locals` |
| هدر امنیتی روی همهٔ پاسخ‌ها | `handle` بعد از `resolve` |
| لاگ «از کدام صفحه به کدام» در UI | `onPageNavigate` در root layout |
| یک‌بار تنظیم analytics در مرورگر | `hooks.client.ts` → `init` |
| خطای سراسری سرور/کلاینت | `handleError` (درس ۱۱) |

---

## قدم ۶: آزمایش عملی در همین پروژه

1. `npm run dev` را بزن.  
2. در ترمینال باید خطوط `hooks.server init` را **یک‌بار** ببینی.  
3. صفحه را باز کن → `hooks.server handle` برای همان request.  
4. در DevTools → Console مرورگر: `hooks.client init` یک‌بار.  
5. بین `/users` و `/notes` کلیک کن:  
   - Console مرورگر: `[onPageNavigate] /users → /notes (...)`  
   - ترمینال سرور: معمولاً باز هم `handle` برای درخواست‌های load سرور.

اگر سرور را restart کنی، دوباره `init` سرور را می‌بینی؛ با فقط کلیک بین صفحات، `init` تکرار نمی‌شود.

---

## قدم ۷: فایل‌های مرتبط این درس در ریپو

```text
src/hooks.server.ts              ← init + handle
src/hooks.client.ts              ← init کلاینت
src/lib/navigation/on-page-navigate.ts
src/routes/+layout.svelte        ← onPageNavigate(...)
src/app.d.ts                     ← App.Locals.requestStartedAt
```

---

## جمع‌بندی

- **`init` سرور** = یک‌بار در عمر پروسه؛ مال migration و bootstrap سنگین.  
- **`init` کلاینت** = یک‌بار بعد از hydrate.  
- **`handle`** = هر درخواست سرور؛ جای سشن، هدر، لاگ request.  
- **جابه‌جایی صفحه در SPA** = `afterNavigate` / `onPageNavigate` در layout ریشه؛ این را با `init` عوضی نگیر.

---

## تمرین

1. در `handle` اگر مسیر با `/settings` شروع شد یک هدر سفارشی مثل `X-Learn-Area: settings` روی `response` بگذار و در Network تب ببین.  
2. در `onPageNavigate` به‌جای `console.info` مقدار را در یک `$state` در layout نشان بده: «آخرین مسیر: …».  
3. عمداً `db.migrate.latest()` را از `init` بردار و فقط با CLI مایگریت کن؛ توضیح بده چه زمانی `init` را برمی‌گردانی.
