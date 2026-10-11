<script lang="ts">
	import AppShell from '#lib/layout/AppShell.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<AppShell>
	{@render children()}
</AppShell>
