<script lang="ts">
	import { goto } from '$app/navigation';
	import logo from '#lib/assets/logo.svg';

	function onsubmit(e: Event) {
		e.preventDefault();
		goto('/');
	}
</script>

<div class="min-vh-100 d-flex align-items-center justify-content-center p-3">
	<div class="card shadow-sm border-0" style="width: min(100%, 26rem)">
		<div class="card-body p-4">
			<div class="text-center mb-4">
				<img src={logo} alt="" width="56" height="56" class="mb-2" />
				<h1 class="h5 mb-1">ورود به سامانه</h1>
				<p class="text-secondary small mb-0">اسکلت auth بدون sidebar</p>
			</div>

			<form {onsubmit}>
				<div class="mb-3">
					<label class="form-label" for="email">ایمیل</label>
					<input type="email" id="email" class="form-control" required placeholder="you@company.com" />
				</div>
				<div class="mb-3">
					<label class="form-label" for="password">رمز عبور</label>
					<input type="password" id="password" class="form-control" required placeholder="••••••••" />
				</div>
				<button type="submit" class="btn btn-primary w-100">ورود</button>
			</form>

			<div class="text-center mt-3">
				<a class="small" href="/">بازگشت به داشبورد</a>
			</div>
		</div>
	</div>
</div>
