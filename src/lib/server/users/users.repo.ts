import { db } from '#lib/server/db/index.js';

export type UserRow = {
	id: number;
	name: string;
	email: string;
	created_at: string | Date;
};

export async function listUsers(): Promise<UserRow[]> {
	return db<UserRow>('users').select('id', 'name', 'email', 'created_at').orderBy('id', 'asc');
}

export async function createUser(input: { name: string; email: string }): Promise<number> {
	const [id] = await db('users').insert({
		name: input.name.trim(),
		email: input.email.trim().toLowerCase()
	});
	return Number(id);
}

export async function deleteUser(id: number): Promise<void> {
	await db('users').where({ id }).del();
}
