import type { Session, SessionQuestion } from './types';

export function answerStatus({ selectedOptionId, question }: SessionQuestion) {
	if (selectedOptionId === null) return 'unanswered';
	return selectedOptionId === question.correctOptionId ? 'correct' : 'wrong';
}

export type Grade = {
	correct: number;
	wrong: number;
	unanswered: number;
	total: number;
	percentage: number;
};

export function gradeSession({ questions }: Pick<Session, 'questions'>): Grade {
	const count = (status: ReturnType<typeof answerStatus>) =>
		questions.filter((q) => answerStatus(q) === status).length;
	const correct = count('correct');
	const total = questions.length;
	return {
		correct,
		wrong: count('wrong'),
		unanswered: count('unanswered'),
		total,
		percentage: total > 0 ? Math.round((correct / total) * 10000) / 100 : 0
	};
}
