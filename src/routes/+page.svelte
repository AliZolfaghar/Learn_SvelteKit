<script lang="ts">
	import Counter from '#lib/components/Counter.svelte';

	let lastValue = $state(0);
</script>

<h1>یادگیری SvelteKit</h1>
<p>
	اجرای برنامه در حال حاضر با خود SvelteKit است (<code>npm run dev</code> /
	<code>npm start</code>) — بدون Express.
</p>

<Counter
	initial={0}
	step={1}
	label="شمارنده آموزشی"
	onchange={(value) => {
		lastValue = value;
	}}
/>

<p>آخرین مقدار گزارش‌شده از کامپوننت: <strong>{lastValue}</strong></p>
