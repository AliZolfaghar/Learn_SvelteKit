export type NavChild = { href: string; label: string };

export type NavItem = {
	href: string;
	label: string;
	icon: string;
	children?: NavChild[];
};

/** منوی اسکلت — همان الگوی overtimeng (Bootstrap Icons) */
export const NAV_ITEMS: NavItem[] = [
	{ href: '/', label: 'داشبورد', icon: 'bi-house-door' },
	{ href: '/users', label: 'کاربران', icon: 'bi-people' },
	{
		href: '/settings',
		label: 'تنظیمات',
		icon: 'bi-gear',
		children: [
			{ href: '/settings', label: 'نمای کلی' },
			{ href: '/demo/counter', label: 'شمارنده آموزشی' },
			{ href: '/demo/blank', label: 'صفحه خالی' }
		]
	}
];

export function titleForPath(pathname: string): string {
	const clean = pathname.replace(/\/$/, '') || '/';
	for (const item of NAV_ITEMS) {
		if (item.href === clean) return item.label;
		if (item.children) {
			for (const child of item.children) {
				if (child.href === clean) return child.label;
			}
		}
	}
	return 'داشبورد';
}
