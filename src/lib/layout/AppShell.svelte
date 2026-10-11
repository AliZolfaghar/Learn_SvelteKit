<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import logo from '#lib/assets/logo.svg';
	import { NAV_ITEMS, titleForPath, type NavItem } from './nav';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		/** نام نمایشی کاربر در سایدبار (اختیاری) */
		userName?: string;
		userRole?: string;
	}

	let { children, userName = 'کاربر نمونه', userRole = 'ادمین سامانه' }: Props = $props();

	let expandedGroups = $state<Record<string, boolean>>({});
	let lastNavPath = $state('');

	const pageTitle = $derived(
		(page.data.title as string | undefined) ?? titleForPath(page.url.pathname)
	);

	onMount(async () => {
		await import('bootstrap');
	});

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	function isExactActive(href: string) {
		return page.url.pathname === href;
	}

	function routeSuggestsOpen(item: NavItem) {
		if (!item.children?.length) return false;
		if (isExactActive(item.href)) return true;
		return item.children.some((child) => isActive(child.href));
	}

	function isGroupOpen(item: NavItem) {
		if (!item.children?.length) return false;
		const manual = expandedGroups[item.href];
		if (typeof manual === 'boolean') return manual;
		return routeSuggestsOpen(item);
	}

	function isGroupActive(item: NavItem) {
		if (!item.children?.length) return isActive(item.href);
		return isExactActive(item.href) || item.children.some((child) => isActive(child.href));
	}

	function toggleGroup(item: NavItem, event?: MouseEvent) {
		event?.preventDefault();
		event?.stopPropagation();
		if (!item.children?.length) return;
		expandedGroups = {
			...expandedGroups,
			[item.href]: !isGroupOpen(item)
		};
	}

	function openGroup(item: NavItem) {
		if (!item.children?.length) return;
		expandedGroups = {
			...expandedGroups,
			[item.href]: true
		};
	}

	function onParentClick(item: NavItem, event: MouseEvent) {
		if (!item.children?.length) return;
		if (isExactActive(item.href)) {
			event.preventDefault();
			toggleGroup(item);
			return;
		}
		openGroup(item);
	}

	$effect(() => {
		const path = page.url.pathname;
		if (path === lastNavPath) return;
		lastNavPath = path;

		const next = { ...expandedGroups };
		for (const item of NAV_ITEMS) {
			if (!item.children?.length) continue;
			if (routeSuggestsOpen(item)) {
				next[item.href] = true;
			}
		}
		expandedGroups = next;
	});
</script>

<div class="app-shell">
	<aside class="app-sidebar">
		<div class="brand">
			<img class="brand-logo" src={logo} alt="لوگوی برنامه" />
			<span class="brand-name">یادگیری SvelteKit</span>
		</div>

		<div class="sidebar-user">
			<div class="sidebar-user-main">
				<div class="sidebar-user-photo sidebar-user-photo-fallback" aria-hidden="true">
					<i class="bi bi-person"></i>
				</div>
				<div class="sidebar-user-meta">
					<div class="sidebar-user-name">{userName}</div>
					<span class="badge text-bg-warning">{userRole}</span>
				</div>
			</div>
			<div class="sidebar-logout">
				<a class="btn btn-sm btn-danger w-100" href="/login">
					<i class="bi bi-box-arrow-right me-1"></i>
					خروج از سامانه
				</a>
			</div>
		</div>

		<nav class="nav flex-column gap-1">
			{#each NAV_ITEMS as item}
				{#if item.children?.length}
					<div class="nav-group" class:open={isGroupOpen(item)}>
						<a
							class="nav-link nav-link-parent"
							class:active={isGroupActive(item)}
							href={item.href}
							onclick={(event) => onParentClick(item, event)}
						>
							<span class="nav-link-toggle-label">
								<i class={`bi ${item.icon} me-1`}></i>
								{item.label}
							</span>
							<button
								type="button"
								class="nav-chevron-btn"
								class:open={isGroupOpen(item)}
								aria-label={isGroupOpen(item) ? 'بستن زیرمنو' : 'باز کردن زیرمنو'}
								aria-expanded={isGroupOpen(item)}
								onclick={(event) => toggleGroup(item, event)}
							>
								<i class="bi bi-chevron-down nav-chevron" aria-hidden="true"></i>
							</button>
						</a>

						{#if isGroupOpen(item)}
							<div class="nav-submenu">
								{#each item.children as child}
									<a class="nav-link" class:active={isActive(child.href)} href={child.href}>
										{child.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<a class="nav-link" class:active={isActive(item.href)} href={item.href}>
						<i class={`bi ${item.icon} me-1`}></i>
						{item.label}
					</a>
				{/if}
			{/each}
		</nav>
	</aside>

	<div class="app-main">
		<header class="app-topbar">
			<h1 class="h5 mb-0">{pageTitle}</h1>
		</header>
		<main class="app-content">
			{#key page.url.pathname}
				<div class="page-enter">
					{@render children()}
				</div>
			{/key}
		</main>
	</div>
</div>
