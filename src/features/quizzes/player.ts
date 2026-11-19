import type { PlayerQuestion, SessionQuestion } from './types';

export function toPlayerQuestion(sq: SessionQuestion): PlayerQuestion {
	const { question, optionOrderIds } = sq;
	const textById = new Map(question.options.map((o) => [o.id, o.text]));
	return {
		sessionQuestionId: sq.id,
		topic: question.topic,
		stem: question.stem,
		options: optionOrderIds.map((id) => ({ id, text: textById.get(id) ?? '' })),
		selectedOptionId: sq.selectedOptionId,
		flagged: sq.flagged,
		reveal: sq.checked
			? { correctOptionId: question.correctOptionId, explanation: question.explanation }
			: undefined
	};
}
