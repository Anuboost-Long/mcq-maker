import type { Session, Timing } from './types';

export function deadlineOf({ config, startedAt }: Pick<Session, "config" | "startedAt">) {
  // Sessions created before timers existed have no timing.
  const timing = config.timing as Timing | undefined;
  return timing?.kind === "countdown" ? startedAt + timing.minutes * 60_000 : null;
}

export function expireIfDue(session: Session, now: number = Date.now()) {
	const deadline = deadlineOf(session);
	if (deadline !== null && !session.submittedAt && now >= deadline) {
		session.submittedAt = deadline;
	}
	return session;
}

export const nowMs = () => Date.now();
