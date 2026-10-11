import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

const raw = process.env.DATABASE_PATH?.trim() || 'data/app.sqlite3';
const filename = isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
mkdirSync(dirname(filename), { recursive: true });

/** @type {import('knex').Knex.Config} */
const config = {
	client: 'better-sqlite3',
	connection: { filename },
	useNullAsDefault: true,
	migrations: {
		directory: resolve(process.cwd(), 'migrations'),
		extension: 'js',
		loadExtensions: ['.js'],
		tableName: 'knex_migrations',
		stub: resolve(process.cwd(), 'scripts/knex/migration.stub.js')
	}
};

export default config;
