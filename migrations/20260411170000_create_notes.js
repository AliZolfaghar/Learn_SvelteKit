/**
 * Migration دوم — نشان می‌دهد schema قدم‌به‌قدم رشد می‌کند.
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
	const exists = await knex.schema.hasTable('notes');
	if (exists) return;

	await knex.schema.createTable('notes', (table) => {
		table.increments('id').primary();
		table.string('title', 200).notNullable();
		table.text('body').notNullable().defaultTo('');
		table
			.integer('user_id')
			.unsigned()
			.nullable()
			.references('id')
			.inTable('users')
			.onDelete('SET NULL');
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
	});
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
	await knex.schema.dropTableIfExists('notes');
}
