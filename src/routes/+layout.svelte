<script lang="ts">
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { onPageNavigate } from '#lib/navigation/on-page-navigate.js';
	import '#lib/vendor.js';
	import '#lib/fonts/iransans.css';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// بعد از هر جابه‌جایی کلاینت (از صفحه به صفحه) — و یک‌بار در mount اول
	onPageNavigate(({ from, to, type }) => {
		console.info(`[onPageNavigate] ${from ?? '(start)'} → ${to} (${type})`);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title
		>{page.data.title
			? `${page.data.title} | یادگیری SvelteKit`
			: 'یادگیری SvelteKit'}</title
	>
</svelte:head>

{@render children()}
