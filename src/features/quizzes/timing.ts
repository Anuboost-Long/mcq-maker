import type { Session } from './types';

export function deadlineOf({ config, startedAt }: Pick<Session, 'config' | 'startedAt'>) {
	return config.timing.kind === 'countdown' ? startedAt + config.timing.minutes * 60_000 : null;
}

export function withTiming(session: Session) {
	// Sessions created before timers existed have no timing.
	(session.config as Partial<Session['config']>).timing ??= { kind: 'none' };
	return session;
}

export function expireIfDue(session: Session, now: number = Date.now()) {
	const deadline = deadlineOf(session);
	if (deadline !== null && !session.submittedAt && now >= deadline) {
		session.submittedAt = deadline;
	}
	return session;
}

export const nowMs = () => Date.now();
