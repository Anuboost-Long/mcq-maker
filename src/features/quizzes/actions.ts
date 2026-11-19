'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getBank } from '@/features/documents/store';
import { currentDeviceId } from '@/lib/device';

import { createSession, restartSession } from './session';
import {
	findSession,
	insertSession,
	submitSession,
	updateSessionQuestion
} from './store';
import { deadlineOf } from './timing';

const timingSchema = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('none') }),
	z.object({ kind: z.literal('stopwatch') }),
	z.object({ kind: z.literal('countdown'), minutes: z.number().int().min(1).max(600) })
]);

const configSchema = z.object({
	timing: timingSchema,
	documentIds: z.array(z.string()).min(1),
	difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
	ordering: z.enum(['sequential', 'mixed']),
	mode: z.enum(['practice', 'exam']),
	count: z.union([z.literal('all'), z.number().int().min(1).max(500)])
});

const answerSchema = z.object({
	sessionId: z.string(),
	sessionQuestionId: z.string()
});

const choiceSchema = answerSchema.extend({ optionId: z.string() });

async function openQuestion(input: unknown) {
	const deviceId = await currentDeviceId();
	const { sessionId, sessionQuestionId } = await answerSchema.parseAsync(input);
	const session = await findSession(deviceId, sessionId);
	if (!session || session.submittedAt) throw new Error('Quiz is not open');
	const sq = session.questions.find((q) => q.id === sessionQuestionId);
	if (!sq) throw new Error('Question not in this quiz');
	return { deviceId, session, sq };
}

export async function startQuiz(input: unknown) {
	const deviceId = await currentDeviceId();
	const config = await configSchema.parseAsync(input);
	const session = createSession(await getBank(deviceId), config);
	if (session.questions.length === 0) return { error: 'noEligible' as const };
	await insertSession(deviceId, session);
	redirect(`/quiz/${session.id}`);
}

export async function saveAnswer(input: unknown) {
	const { optionId } = await choiceSchema.parseAsync(input);
	const { deviceId, session, sq } = await openQuestion(input);
	if (sq.checked) return;
	if (!sq.question.options.some((o) => o.id === optionId)) {
		throw new Error('Option does not belong to this question');
	}
	await updateSessionQuestion(deviceId, session.id, sq.id, { selectedOptionId: optionId });
}

export async function toggleFlag(input: unknown) {
	const { deviceId, session, sq } = await openQuestion(input);
	await updateSessionQuestion(deviceId, session.id, sq.id, { flagged: !sq.flagged });
}

export async function checkAnswer(input: unknown) {
	const { deviceId, session, sq } = await openQuestion(input);
	if (session.config.mode !== 'practice' || !sq.selectedOptionId) {
		throw new Error('Nothing to check');
	}
	await updateSessionQuestion(deviceId, session.id, sq.id, { checked: true });
	return {
		correctOptionId: sq.question.correctOptionId,
		explanation: sq.question.explanation
	};
}

export async function submitQuiz(sessionId: unknown) {
	const deviceId = await currentDeviceId();
	const id = await z.string().uuid().parseAsync(sessionId);
	const session = await findSession(deviceId, id);
	if (!session) throw new Error('Quiz not found');
	if (!session.submittedAt) {
		await submitSession(deviceId, id, Math.min(Date.now(), deadlineOf(session) ?? Infinity));
	}
	redirect(`/quiz/${id}/results`);
}

export async function retryQuiz(sessionId: unknown, only: unknown) {
	const deviceId = await currentDeviceId();
	const id = await z.string().uuid().parseAsync(sessionId);
	const which = await z.enum(['all', 'incorrect']).parseAsync(only);
	const session = await findSession(deviceId, id);
	if (!session?.submittedAt) throw new Error('Quiz is not finished');
	const retry = restartSession(
		session,
		which === 'all' ? undefined : (q) => q.selectedOptionId !== q.question.correctOptionId
	);
	if (retry.questions.length === 0) return { error: 'nothingToRetry' as const };
	await insertSession(deviceId, retry);
	redirect(`/quiz/${retry.id}`);
}
