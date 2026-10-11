<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="row g-3">
	<div class="col-12 col-lg-5">
		<div class="card shadow-sm border-0">
			<div class="card-body">
				<h2 class="h6 mb-3">افزودن کاربر</h2>

				{#if form?.message}
					<div class="alert alert-danger py-2" role="alert">{form.message}</div>
				{/if}
				{#if form?.success}
					<div class="alert alert-success py-2" role="alert">با موفقیت ذخیره شد.</div>
				{/if}

				<form method="POST" action="?/create" class="vstack gap-3">
					<div>
						<label class="form-label" for="name">نام</label>
						<input
							class="form-control"
							id="name"
							name="name"
							required
							value={form?.name ?? ''}
						/>
					</div>
					<div>
						<label class="form-label" for="email">ایمیل</label>
						<input
							class="form-control input-ltr"
							id="email"
							name="email"
							type="email"
							required
							value={form?.email ?? ''}
						/>
					</div>
					<button class="btn btn-primary" type="submit">ثبت در SQLite</button>
				</form>
			</div>
		</div>
	</div>

	<div class="col-12 col-lg-7">
		<div class="card shadow-sm border-0">
			<div class="card-body">
				<h2 class="h6 mb-3">کاربران از دیتابیس ({data.users.length})</h2>
				{#if data.users.length === 0}
					<p class="text-secondary mb-0">هنوز کاربری نیست.</p>
				{:else}
					<div class="table-responsive">
						<table class="table table-sm align-middle mb-0">
							<thead>
								<tr>
									<th>شناسه</th>
									<th>نام</th>
									<th>ایمیل</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each data.users as user (user.id)}
									<tr>
										<td class="input-ltr">{user.id}</td>
										<td>{user.name}</td>
										<td class="input-ltr">{user.email}</td>
										<td class="text-end">
											<form method="POST" action="?/delete">
												<input type="hidden" name="id" value={user.id} />
												<button class="btn btn-sm btn-outline-danger" type="submit"
													>حذف</button
												>
											</form>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
