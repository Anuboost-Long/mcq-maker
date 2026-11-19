import { eligibleQuestions, selectQuestions } from './selection';
import { shuffle } from './shuffle';
import type { Question, QuizConfig, Rng, Session, SessionQuestion } from './types';

function freshQuestion(question: Question, optionIds: string[], rng: Rng): SessionQuestion {
	return {
		id: crypto.randomUUID(),
		question,
		optionOrderIds: shuffle(optionIds, rng),
		selectedOptionId: null,
		flagged: false,
		checked: false
	};
}

export function createSession(
	bank: readonly Question[],
	config: QuizConfig,
	rng: Rng = Math.random
): Session {
	const selected = selectQuestions(eligibleQuestions(bank, config), config, rng);
	return {
		id: crypto.randomUUID(),
		config,
		startedAt: Date.now(),
		submittedAt: null,
		questions: selected.map((q) =>
			freshQuestion(
				q,
				q.options.map((o) => o.id),
				rng
			)
		)
	};
}

export function restartSession(
	session: Session,
	keep: (question: SessionQuestion) => boolean = () => true,
	rng: Rng = Math.random
): Session {
	return {
		...session,
		id: crypto.randomUUID(),
		startedAt: Date.now(),
		submittedAt: null,
		questions: session.questions
			.filter(keep)
			.map((q) => freshQuestion(q.question, q.optionOrderIds, rng))
	};
}
