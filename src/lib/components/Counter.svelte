<script lang="ts">
	type Props = {
		/** مقدار شروع شمارنده */
		initial?: number;
		/** مقدار افزایش/کاهش در هر کلیک */
		step?: number;
		/** عنوان نمایشی */
		label?: string;
		/** وقتی مقدار عوض شد، والد را خبر کن */
		onchange?: (value: number) => void;
	};

	let { initial = 0, step = 1, label = 'شمارنده', onchange }: Props = $props();

	let count = $state(initial);
	let doubled = $derived(count * 2);
	let isEven = $derived(count % 2 === 0);

	function increment() {
		count += step;
		onchange?.(count);
	}

	function decrement() {
		count -= step;
		onchange?.(count);
	}

	function reset() {
		count = initial;
		onchange?.(count);
	}
</script>

<section class="counter">
	<h2>{label}</h2>

	<p class="value" class:even={isEven}>{count}</p>

	{#if isEven}
		<p class="hint">عدد زوج است — دو برابرش: {doubled}</p>
	{:else}
		<p class="hint">عدد فرد است — دو برابرش: {doubled}</p>
	{/if}

	<div class="actions">
		<button type="button" onclick={decrement} aria-label="کم کردن">−</button>
		<button type="button" class="reset" onclick={reset}>ریست</button>
		<button type="button" onclick={increment} aria-label="زیاد کردن">+</button>
	</div>
</section>

<style>
	.counter {
		max-width: 20rem;
		margin: 1.5rem 0;
		padding: 1.25rem 1.5rem;
		border: 1px solid #d0d7de;
		border-radius: 0.75rem;
		background: #f6f8fa;
		text-align: center;
		font-family: system-ui, sans-serif;
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.value {
		margin: 0;
		font-size: 2.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: #24292f;
	}

	.value.even {
		color: #1a7f37;
	}

	.hint {
		margin: 0.5rem 0 1rem;
		font-size: 0.9rem;
		color: #57606a;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	button {
		min-width: 2.75rem;
		padding: 0.45rem 0.75rem;
		border: 1px solid #d0d7de;
		border-radius: 0.5rem;
		background: #fff;
		font-size: 1.1rem;
		cursor: pointer;
	}

	button:hover {
		background: #eaeef2;
	}

	button.reset {
		min-width: 4rem;
		font-size: 0.9rem;
	}
</style>
