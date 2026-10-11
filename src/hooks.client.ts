/**
 * `init` سمت کلاینت — فقط یک‌بار وقتی اپ در مرورگر boot می‌شود
 * (نه در هر جابه‌جایی بین صفحات).
 *
 * برای ناوبری هر صفحه از `onPageNavigate` / `afterNavigate` در layout استفاده کن.
 */
export const init = async () => {
	console.info('[hooks.client init] app hydrated in browser');
};
