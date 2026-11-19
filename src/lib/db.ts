import 'server-only';
import postgres from 'postgres';

const globalDb = globalThis as typeof globalThis & { qcmSql?: postgres.Sql };

export function sql() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is not set.');

	return (globalDb.qcmSql ??= postgres(url, {
		prepare: false,
		max: Number(process.env.DB_POOL_MAX ?? 5),
		idle_timeout: 20,
		connect_timeout: 10,
		ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require'
	}));
}
