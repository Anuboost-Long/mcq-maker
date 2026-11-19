import { shuffle } from './shuffle';
import type { Question, QuizConfig, Rng } from './types';

export function eligibleQuestions<T extends Pick<Question, 'documentId' | 'difficulty'>>(
	bank: readonly T[],
	{ documentIds, difficulty }: Pick<QuizConfig, 'documentIds' | 'difficulty'>
): T[] {
	return bank.filter(
		(question) =>
			documentIds.includes(question.documentId) &&
			(difficulty === 'mixed' || question.difficulty === difficulty)
	);
}

export function selectQuestions(
	eligible: readonly Question[],
	{ count, ordering, documentIds }: Pick<QuizConfig, 'count' | 'ordering' | 'documentIds'>,
	rng: Rng = Math.random
): Question[] {
	const limit = count === 'all' ? eligible.length : Math.min(count, eligible.length);
	if (ordering === 'mixed') return shuffle(eligible, rng).slice(0, limit);
	const inFileOrder = documentIds.flatMap((id) =>
		eligible.filter((question) => question.documentId === id)
	);
	return inFileOrder.slice(0, limit);
}
