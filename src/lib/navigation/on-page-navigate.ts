import { afterNavigate } from '$app/navigation';

export type PageNavigateInfo = {
	from: string | null;
	to: string;
	type: string;
};

type PageNavigateHandler = (info: PageNavigateInfo) => void;

/**
 * در root layout صدا بزن — بعد از هر جابه‌جایی کلاینت (و mount اول) اجرا می‌شود.
 * این معادل «hook ناوبری» سمت مرورگر است؛ با `handle` سرور فرق دارد.
 */
export function onPageNavigate(handler: PageNavigateHandler) {
	afterNavigate((nav) => {
		const to = nav.to?.url.pathname;
		if (!to) return;

		handler({
			from: nav.from?.url.pathname ?? null,
			to,
			type: nav.type
		});
	});
}
