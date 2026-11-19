import type { Difficulty } from '@/features/quizzes/types';

export const difficultyTone = {
	easy: 'good',
	medium: 'warn',
	hard: 'bad'
} as const satisfies Record<Difficulty, 'good' | 'warn' | 'bad'>;
