import type { Difficulty, Question } from '@/features/quizzes/types';

import type { ParsedQuestion } from '../types';

function difficultyOf(bloomLevel: string | null): Difficulty {
	const rank = Number(bloomLevel?.slice(1));
	if (rank <= 2) return 'easy';
	return rank === 3 || Number.isNaN(rank) ? 'medium' : 'hard';
}

export function toQuestions(parsed: ParsedQuestion[], documentId: string): Question[] {
	return parsed
		.filter((q) => q.status === 'ready')
		.map((q) => {
			const id = `${documentId}-q${q.number}`;
			const options = q.options.map((o) => ({
				id: `${id}-${o.label.toLowerCase()}`,
				text: o.text
			}));
			return {
				id,
				revision: 1,
				documentId,
				sourceNumber: q.number,
				topic: q.section,
				stem: q.stem,
				options,
				correctOptionId: `${id}-${q.answerLabel!.toLowerCase()}`,
				bloomLevel: q.bloomLevel ?? '',
				difficulty: difficultyOf(q.bloomLevel),
				explanation: ''
			};
		});
}
