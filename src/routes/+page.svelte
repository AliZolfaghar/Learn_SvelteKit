<script lang="ts">
	import Counter from '#lib/components/Counter.svelte';

	let lastValue = $state(0);
</script>

<div class="row g-3">
	<div class="col-12 col-lg-8">
		<div class="card shadow-sm border-0">
			<div class="card-body">
				<h2 class="h5 card-title mb-2">خوش آمدید</h2>
				<p class="text-secondary mb-3">
					اسکلت برنامه با همان الگوی <strong>sidebar / topbar</strong> پروژه overtimeng ساخته شده:
					Bootstrap RTL، Bootstrap Icons، فونت IRANSans و کلاس‌های
					<code>app-shell</code> / <code>app-sidebar</code> / <code>app-topbar</code>.
				</p>
				<ul class="mb-0 text-secondary">
					<li>منو را از <code>src/lib/layout/nav.ts</code> گسترش بده</li>
					<li>استایل شل در <code>src/app.css</code> است</li>
					<li>صفحه ورود بدون سایدبار است: <a href="/login">/login</a></li>
				</ul>
			</div>
		</div>
	</div>

	<div class="col-12 col-lg-4">
		<div class="card shadow-sm border-0 h-100">
			<div class="card-body">
				<h2 class="h6 card-title">شمارنده آموزشی</h2>
				<Counter
					initial={0}
					step={1}
					label="شمارنده"
					onchange={(value) => {
						lastValue = value;
					}}
				/>
				<p class="small text-secondary mt-3 mb-0">آخرین مقدار: <strong>{lastValue}</strong></p>
			</div>
		</div>
	</div>

	<div class="col-12 col-md-4">
		<div class="card shadow-sm border-0">
			<div class="card-body">
				<div class="d-flex align-items-center gap-2 mb-2">
					<i class="bi bi-people fs-4 text-primary"></i>
					<span class="fw-semibold">کاربران</span>
				</div>
				<p class="small text-secondary mb-3">صفحه نمونه برای شروع CRUD</p>
				<a class="btn btn-sm btn-outline-primary" href="/users">باز کردن</a>
			</div>
		</div>
	</div>
	<div class="col-12 col-md-4">
		<div class="card shadow-sm border-0">
			<div class="card-body">
				<div class="d-flex align-items-center gap-2 mb-2">
					<i class="bi bi-gear fs-4 text-primary"></i>
					<span class="fw-semibold">تنظیمات</span>
				</div>
				<p class="small text-secondary mb-3">نمای کلی + زیرمنوی سایدبار</p>
				<a class="btn btn-sm btn-outline-primary" href="/settings">باز کردن</a>
			</div>
		</div>
	</div>
	<div class="col-12 col-md-4">
		<div class="card shadow-sm border-0">
			<div class="card-body">
				<div class="d-flex align-items-center gap-2 mb-2">
					<i class="bi bi-layout-text-window-reverse fs-4 text-primary"></i>
					<span class="fw-semibold">صفحه خالی</span>
				</div>
				<p class="small text-secondary mb-3">قالب شروع برای صفحات جدید</p>
				<a class="btn btn-sm btn-outline-primary" href="/demo/blank">باز کردن</a>
			</div>
		</div>
	</div>
</div>
