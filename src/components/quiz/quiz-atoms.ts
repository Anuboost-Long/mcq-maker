import { atom } from 'jotai';

import type { PlayerQuestion } from '@/features/quizzes/types';

export const questionsAtom = atom<PlayerQuestion[]>([]);
export const indexAtom = atom(0);
export const errorAtom = atom<string | null>(null);
