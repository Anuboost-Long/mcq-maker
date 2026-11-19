import 'server-only';
import { sharedStore } from '@/lib/kv';

import { expireIfDue, withTiming } from './timing';
import type { Session } from './types';

const INDEX = 'qcm:sessions';
const keyOf = (id: string) => `qcm:session:${id}`;
const sixtyDays = 60 * 24 * 3600;
const listLimit = 50;

const globalStore = globalThis as typeof globalThis & {
	qcmSessions?: Map<string, Session>;
};
const local = () => (globalStore.qcmSessions ??= new Map<string, Session>());

export async function saveSession(session: Session) {
	const redis = sharedStore();
	if (!redis) {
		local().set(session.id, session);
		return;
	}
	await Promise.all([
		redis.set(keyOf(session.id), session, { ex: sixtyDays }),
		redis.zadd(INDEX, { score: session.startedAt, member: session.id })
	]);
}

async function settle(session: Session) {
	const before = session.submittedAt;
	expireIfDue(withTiming(session));
	if (session.submittedAt !== before) await saveSession(session);
	return session;
}

export async function findSession(id: string) {
	const redis = sharedStore();
	const session = redis ? await redis.get<Session>(keyOf(id)) : local().get(id);
	return session ? settle(session) : undefined;
}

export async function listSessions() {
	const redis = sharedStore();
	let sessions: Session[];
	if (redis) {
		const ids = await redis.zrange<string[]>(INDEX, 0, listLimit - 1, { rev: true });
		sessions = ids.length
			? (await redis.mget<(Session | null)[]>(...ids.map(keyOf))).filter((s) => s !== null)
			: [];
	} else {
		sessions = [...local().values()];
	}
	const settled = await Promise.all(sessions.map(settle));
	return settled.sort((a, b) => b.startedAt - a.startedAt);
}

export async function deleteSessions(ids: readonly string[]) {
	if (ids.length === 0) return;
	const redis = sharedStore();
	if (!redis) {
		for (const id of ids) local().delete(id);
		return;
	}
	await Promise.all([redis.del(...ids.map(keyOf)), redis.zrem(INDEX, ...ids)]);
}

export async function clearSessions() {
	const redis = sharedStore();
	if (!redis) {
		local().clear();
		return;
	}
	await deleteSessions(await redis.zrange<string[]>(INDEX, 0, -1));
	await redis.del(INDEX);
}
