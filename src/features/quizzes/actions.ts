'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getBank } from '@/features/documents/store';

import { createSession, restartSession } from './session';
import { findSession, saveSession } from './store';
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

async function openSession(sessionId: string) {
	const session = await findSession(sessionId);
	if (!session || session.submittedAt) throw new Error('Quiz is not open');
	return session;
}

async function openQuestion(input: unknown) {
	const { sessionId, sessionQuestionId } = await answerSchema.parseAsync(input);
	const session = await openSession(sessionId);
	const sq = session.questions.find((q) => q.id === sessionQuestionId);
	if (!sq) throw new Error('Question not in this quiz');
	return { session, sq };
}

export async function startQuiz(input: unknown) {
	const config = await configSchema.parseAsync(input);
	const session = createSession(await getBank(), config);
	if (session.questions.length === 0) return { error: 'noEligible' as const };
	await saveSession(session);
	redirect(`/quiz/${session.id}`);
}

export async function saveAnswer(input: unknown) {
	const { optionId } = await choiceSchema.parseAsync(input);
	const { session, sq } = await openQuestion(input);
	if (sq.checked) return;
	if (!sq.question.options.some((o) => o.id === optionId)) {
		throw new Error('Option does not belong to this question');
	}
	sq.selectedOptionId = optionId;
	await saveSession(session);
}

export async function toggleFlag(input: unknown) {
	const { session, sq } = await openQuestion(input);
	sq.flagged = !sq.flagged;
	await saveSession(session);
}

export async function checkAnswer(input: unknown) {
	const { session, sq } = await openQuestion(input);
	if (session.config.mode !== 'practice' || !sq.selectedOptionId) {
		throw new Error('Nothing to check');
	}
	sq.checked = true;
	await saveSession(session);
	return {
		correctOptionId: sq.question.correctOptionId,
		explanation: sq.question.explanation
	};
}

export async function submitQuiz(sessionId: unknown) {
	const id = await z.string().parseAsync(sessionId);
	const session = await findSession(id);
	if (!session) throw new Error('Quiz not found');
	if (!session.submittedAt) {
		session.submittedAt = Math.min(Date.now(), deadlineOf(session) ?? Infinity);
		await saveSession(session);
	}
	redirect(`/quiz/${id}/results`);
}

export async function retryQuiz(sessionId: unknown, only: unknown) {
	const id = await z.string().parseAsync(sessionId);
	const which = await z.enum(['all', 'incorrect']).parseAsync(only);
	const session = await findSession(id);
	if (!session?.submittedAt) throw new Error('Quiz is not finished');
	const retry = restartSession(
		session,
		which === 'all' ? undefined : (q) => q.selectedOptionId !== q.question.correctOptionId
	);
	if (retry.questions.length === 0) return { error: 'nothingToRetry' as const };
	await saveSession(retry);
	redirect(`/quiz/${retry.id}`);
}
