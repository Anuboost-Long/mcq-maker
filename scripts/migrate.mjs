import { readdirSync, readFileSync } from 'node:fs';

import postgres from 'postgres';

try {
	process.loadEnvFile('.env.local');
} catch {
	// variables may already be in the environment
}

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set.');
	process.exit(1);
}

const local = /localhost|127\.0\.0\.1/.test(url);
const sql = postgres(url, { prepare: false, max: 1, ssl: local ? false : 'require' });

await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
const applied = new Set((await sql`select name from schema_migrations`).map((row) => row.name));

for (const name of readdirSync('supabase/migrations')
	.filter((f) => f.endsWith('.sql'))
	.sort()) {
	if (applied.has(name)) continue;
	await sql.begin(async (tx) => {
		await tx.unsafe(readFileSync(`supabase/migrations/${name}`, 'utf8'));
		await tx`insert into schema_migrations (name) values (${name})`;
	});
	console.log(`applied ${name}`);
}

console.log('database is up to date');
await sql.end();
