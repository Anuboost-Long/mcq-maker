import 'server-only';
import { expireIfDue, withTiming } from './timing';
import type { Session } from './types';

const globalStore = globalThis as typeof globalThis & {
	qcmSessions?: Map<string, Session>;
};
const sessions = (globalStore.qcmSessions ??= new Map<string, Session>());

export const saveSession = (session: Session) => sessions.set(session.id, session);
export const findSession = (id: string) => {
	const session = sessions.get(id);
	return session && expireIfDue(withTiming(session));
};
export const listSessions = () =>
	[...sessions.values()]
		.map((session) => expireIfDue(withTiming(session)))
		.sort((a, b) => b.startedAt - a.startedAt);
