<script lang="ts">
	import Counter from '#lib/components/Counter.svelte';

	let lastValue = $state(0);
</script>

<div class="card shadow-sm border-0">
	<div class="card-body">
		<Counter
			initial={0}
			step={1}
			label="شمارنده آموزشی"
			onchange={(value) => {
				lastValue = value;
			}}
		/>
		<p class="text-secondary small mt-3 mb-0">آخرین مقدار: <strong>{lastValue}</strong></p>
	</div>
</div>
