/**
 * قالب migration جدید (با npm run db:make ساخته می‌شود)
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
	// await knex.schema.createTable('...', (table) => { ... });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
	// await knex.schema.dropTableIfExists('...');
}
