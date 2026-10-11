import { db } from '#lib/server/db/index.js';

export type NoteRow = {
	id: number;
	title: string;
	body: string;
	user_id: number | null;
	created_at: string | Date;
};

export async function listNotes(): Promise<NoteRow[]> {
	return db<NoteRow>('notes')
		.select('id', 'title', 'body', 'user_id', 'created_at')
		.orderBy('id', 'desc');
}

export async function createNote(input: {
	title: string;
	body?: string;
	userId?: number | null;
}): Promise<number> {
	const [id] = await db('notes').insert({
		title: input.title.trim(),
		body: (input.body ?? '').trim(),
		user_id: input.userId ?? null
	});
	return Number(id);
}

export async function deleteNote(id: number): Promise<void> {
	await db('notes').where({ id }).del();
}
