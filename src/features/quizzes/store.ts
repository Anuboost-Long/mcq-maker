import 'server-only';
import { sql } from '@/lib/db';

import { expireIfDue, withTiming } from './timing';
import type { Question, QuizConfig, Session, SessionQuestion } from './types';

type SessionRow = {
	id: string;
	config: QuizConfig;
	started_at: string | number;
	submitted_at: string | number | null;
};

type SessionQuestionRow = {
	id: string;
	session_id: string;
	snapshot: Question;
	option_order: string[];
	selected_option_id: string | null;
	flagged: boolean;
	checked: boolean;
};

const listLimit = 50;

const toSession = (row: SessionRow, questions: SessionQuestionRow[]): Session => ({
	id: row.id,
	config: row.config,
	startedAt: Number(row.started_at),
	submittedAt: row.submitted_at === null ? null : Number(row.submitted_at),
	questions: questions.map((q): SessionQuestion => ({
		id: q.id,
		question: q.snapshot,
		optionOrderIds: q.option_order,
		selectedOptionId: q.selected_option_id,
		flagged: q.flagged,
		checked: q.checked
	}))
});

async function settle(deviceId: string, session: Session) {
	const before = session.submittedAt;
	expireIfDue(withTiming(session));
	if (session.submittedAt !== before) {
		await sql()`
      update quiz_sessions set submitted_at = ${session.submittedAt}
      where id = ${session.id} and device_id = ${deviceId} and submitted_at is null`;
	}
	return session;
}

export async function insertSession(deviceId: string, session: Session) {
	await sql().begin(async (tx) => {
		await tx`
      insert into quiz_sessions (id, device_id, config, started_at)
      values (${session.id}, ${deviceId}, ${tx.json(session.config)}, ${session.startedAt})`;

		const rows = session.questions.map((q, position) => ({
			id: q.id,
			session_id: session.id,
			position,
			snapshot: tx.json(q.question),
			option_order: tx.json(q.optionOrderIds),
			selected_option_id: q.selectedOptionId,
			flagged: q.flagged,
			checked: q.checked
		}));
		if (rows.length > 0) await tx`insert into quiz_session_questions ${tx(rows)}`;
	});
}

export async function findSession(deviceId: string, id: string) {
	const [row] = await sql()<SessionRow[]>`
    select id, config, started_at, submitted_at
    from quiz_sessions where id = ${id} and device_id = ${deviceId}`;
	if (!row) return undefined;

	const questions = await sql()<SessionQuestionRow[]>`
    select * from quiz_session_questions where session_id = ${id} order by position`;
	return settle(deviceId, toSession(row, questions));
}

export async function listSessions(deviceId: string) {
	const rows = await sql()<SessionRow[]>`
    select id, config, started_at, submitted_at
    from quiz_sessions where device_id = ${deviceId}
    order by started_at desc limit ${listLimit}`;
	if (rows.length === 0) return [];

	const questions = await sql()<SessionQuestionRow[]>`
    select * from quiz_session_questions
    where session_id in ${sql()(rows.map((row) => row.id))}
    order by session_id, position`;

	const bySession = Map.groupBy(questions, (q) => q.session_id);
	return Promise.all(
		rows.map((row) => settle(deviceId, toSession(row, bySession.get(row.id) ?? [])))
	);
}

type SessionQuestionPatch = Partial<
	Pick<SessionQuestion, 'selectedOptionId' | 'flagged' | 'checked'>
>;

export async function updateSessionQuestion(
	deviceId: string,
	sessionId: string,
	sessionQuestionId: string,
	patch: SessionQuestionPatch
) {
	await sql()`
    update quiz_session_questions q set
      selected_option_id = ${patch.selectedOptionId === undefined ? sql()`q.selected_option_id` : patch.selectedOptionId},
      flagged = ${patch.flagged ?? sql()`q.flagged`},
      checked = ${patch.checked ?? sql()`q.checked`}
    where q.id = ${sessionQuestionId} and q.session_id = ${sessionId}
      and exists (select 1 from quiz_sessions s where s.id = q.session_id and s.device_id = ${deviceId})`;
}

export async function submitSession(deviceId: string, id: string, submittedAt: number) {
	await sql()`
    update quiz_sessions set submitted_at = ${submittedAt}
    where id = ${id} and device_id = ${deviceId} and submitted_at is null`;
}

export async function deleteSessions(deviceId: string, ids: readonly string[]) {
	if (ids.length === 0) return;
	await sql()`delete from quiz_sessions where device_id = ${deviceId} and id in ${sql()(ids)}`;
}

export async function clearSessions(deviceId: string) {
	await sql()`delete from quiz_sessions where device_id = ${deviceId}`;
}
