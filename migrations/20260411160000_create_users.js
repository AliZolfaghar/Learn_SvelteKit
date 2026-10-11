/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
	const exists = await knex.schema.hasTable('users');
	if (exists) return;

	await knex.schema.createTable('users', (table) => {
		table.increments('id').primary();
		table.string('name', 120).notNullable();
		table.string('email', 190).notNullable().unique();
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
	});

	await knex('users').insert([
		{ name: 'سجاد', email: 'sajad@example.com' },
		{ name: 'کاربر نمونه', email: 'demo@example.com' }
	]);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
	await knex.schema.dropTableIfExists('users');
}
