<script lang="ts">
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import '#lib/vendor.js';
	import '#lib/fonts/iransans.css';
	import '../app.css';
	import AppShell from '#lib/layout/AppShell.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const isAuthPage = $derived(
		page.url.pathname === '/login' || page.url.pathname.startsWith('/login/')
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title
		>{page.data.title
			? `${page.data.title} | یادگیری SvelteKit`
			: 'یادگیری SvelteKit'}</title
	>
</svelte:head>

{#if isAuthPage}
	{@render children()}
{:else}
	<AppShell>
		{@render children()}
	</AppShell>
{/if}
