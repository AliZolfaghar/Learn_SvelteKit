import { fail } from '@sveltejs/kit';
import { createNote, deleteNote, listNotes } from '#lib/server/notes/notes.repo.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const notes = await listNotes();
	return {
		title: 'یادداشت‌ها',
		notes
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const body = String(form.get('body') ?? '').trim();

		if (!title) {
			return fail(400, { message: 'عنوان الزامی است.', title, body });
		}

		await createNote({ title, body });
		return { success: true as const };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id) || id <= 0) {
			return fail(400, { message: 'شناسه نامعتبر است.' });
		}
		await deleteNote(id);
		return { success: true as const };
	}
};
