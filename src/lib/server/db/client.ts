import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import knex, { type Knex } from 'knex';

function resolveDbPath(): string {
	const raw = process.env.DATABASE_PATH?.trim() || 'data/app.sqlite3';
	return isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
}

function createDb(filename: string): Knex {
	mkdirSync(dirname(filename), { recursive: true });

	return knex({
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
	});
}

const globalForDb = globalThis as unknown as { __learnKitDb?: Knex };

/**
 * یک نمونهٔ Knex برای کل پروسهٔ Node.
 * در dev با HMR از globalThis استفاده می‌کنیم تا اتصال تکراری ساخته نشود.
 */
function getDb(): Knex {
	// هنگام `vite build` فایل واقعی را باز نکن
	if (process.env.npm_lifecycle_event === 'build') {
		return knex({
			client: 'better-sqlite3',
			connection: { filename: ':memory:' },
			useNullAsDefault: true
		});
	}

	if (!globalForDb.__learnKitDb) {
		globalForDb.__learnKitDb = createDb(resolveDbPath());
	}
	return globalForDb.__learnKitDb;
}

export const db = getDb();
