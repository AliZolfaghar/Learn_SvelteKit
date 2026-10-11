<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="row g-3">
	<div class="col-12 col-lg-5">
		<div class="card shadow-sm border-0">
			<div class="card-body">
				<h2 class="h6 mb-3">یادداشت جدید</h2>
				<p class="small text-secondary">جدول <code>notes</code> با migration دوم ساخته شده است.</p>

				{#if form?.message}
					<div class="alert alert-danger py-2" role="alert">{form.message}</div>
				{/if}

				<form method="POST" action="?/create" class="vstack gap-3">
					<div>
						<label class="form-label" for="title">عنوان</label>
						<input
							class="form-control"
							id="title"
							name="title"
							required
							value={form?.title ?? ''}
						/>
					</div>
					<div>
						<label class="form-label" for="body">متن</label>
						<textarea class="form-control" id="body" name="body" rows="4"
							>{form?.body ?? ''}</textarea
						>
					</div>
					<button class="btn btn-primary" type="submit">ذخیره</button>
				</form>
			</div>
		</div>
	</div>

	<div class="col-12 col-lg-7">
		<div class="card shadow-sm border-0">
			<div class="card-body">
				<h2 class="h6 mb-3">لیست یادداشت‌ها ({data.notes.length})</h2>
				{#if data.notes.length === 0}
					<p class="text-secondary mb-0">هنوز یادداشتی نیست.</p>
				{:else}
					<ul class="list-group list-group-flush">
						{#each data.notes as note (note.id)}
							<li class="list-group-item px-0">
								<div class="d-flex justify-content-between gap-2">
									<div>
										<div class="fw-semibold">{note.title}</div>
										{#if note.body}
											<div class="small text-secondary">{note.body}</div>
										{/if}
									</div>
									<form method="POST" action="?/delete">
										<input type="hidden" name="id" value={note.id} />
										<button class="btn btn-sm btn-outline-danger" type="submit">حذف</button>
									</form>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>
</div>
