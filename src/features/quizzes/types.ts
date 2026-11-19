export type Difficulty = 'easy' | 'medium' | 'hard';
export type DifficultyFilter = Difficulty | 'mixed';
export type QuizMode = 'practice' | 'exam';
export type Ordering = 'sequential' | 'mixed';

export type Option = { id: string; text: string };

export type Question = {
	id: string;
	revision: number;
	documentId: string;
	sourceNumber: number;
	topic: string;
	stem: string;
	options: Option[];
	correctOptionId: string;
	bloomLevel: string;
	difficulty: Difficulty;
	explanation: string;
};

export type PlayerQuestion = Pick<Question, 'topic' | 'stem'> & {
	sessionQuestionId: string;
	options: Option[];
	selectedOptionId: string | null;
	flagged: boolean;
	reveal?: { correctOptionId: string; explanation: string };
};

export type SessionQuestion = {
	id: string;
	question: Question;
	optionOrderIds: string[];
	selectedOptionId: string | null;
	flagged: boolean;
	checked: boolean;
};

export type Timing =
	{ kind: 'none' } | { kind: 'stopwatch' } | { kind: 'countdown'; minutes: number };

export type QuizConfig = {
	timing: Timing;
	documentIds: string[];
	difficulty: DifficultyFilter;
	ordering: Ordering;
	mode: QuizMode;
	count: number | 'all';
};

export type Session = {
	id: string;
	config: QuizConfig;
	questions: SessionQuestion[];
	startedAt: number;
	submittedAt: number | null;
};

export type Rng = () => number;
