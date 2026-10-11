import { fail } from '@sveltejs/kit';
import { createUser, deleteUser, listUsers } from '#lib/server/users/users.repo.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const users = await listUsers();
	return {
		title: 'کاربران',
		users
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();

		if (!name || !email) {
			return fail(400, { message: 'نام و ایمیل الزامی است.', name, email });
		}

		try {
			await createUser({ name, email });
		} catch (err) {
			const message =
				err instanceof Error && /unique/i.test(err.message)
					? 'این ایمیل قبلاً ثبت شده است.'
					: 'ثبت کاربر ناموفق بود.';
			return fail(400, { message, name, email });
		}

		return { success: true as const };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id) || id <= 0) {
			return fail(400, { message: 'شناسه نامعتبر است.' });
		}
		await deleteUser(id);
		return { success: true as const };
	}
};
