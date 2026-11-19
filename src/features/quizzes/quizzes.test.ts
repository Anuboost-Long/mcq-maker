import { describe, expect, it } from 'vitest';

import { fixtureQuestions } from './fixtures';
import { gradeSession } from './grading';
import { toPlayerQuestion } from './player';
import { eligibleQuestions, selectQuestions } from './selection';
import { createSession, restartSession } from './session';
import { shuffle } from './shuffle';
import { deadlineOf, expireIfDue, withTiming } from './timing';
import type { QuizConfig } from './types';

const allDocs = ['doc-physiology', 'doc-structures'];
const config: QuizConfig = {
	timing: { kind: 'none' },
	documentIds: allDocs,
	difficulty: 'mixed',
	ordering: 'mixed',
	mode: 'exam',
	count: 10
};

function seededRng(seed: number) {
	return () => {
		seed = (seed * 1664525 + 1013904223) % 4294967296;
		return seed / 4294967296;
	};
}

describe('shuffle', () => {
	it('keeps exactly the same items', () => {
		const result = shuffle([1, 2, 3, 4], seededRng(1));
		expect([...result].sort()).toEqual([1, 2, 3, 4]);
	});
});

describe('selection', () => {
	it('returns unique questions and never exceeds eligible', () => {
		const picked = selectQuestions(fixtureQuestions, config);
		expect(new Set(picked.map((q) => q.id)).size).toBe(10);
		expect(selectQuestions(fixtureQuestions, { ...config, count: 999 })).toHaveLength(
			fixtureQuestions.length
		);
	});

	it("'all' includes every eligible question", () => {
		expect(selectQuestions(fixtureQuestions, { ...config, count: 'all' })).toHaveLength(
			fixtureQuestions.length
		);
	});

	it('sequential mode finishes the first file before the second', () => {
		const picked = selectQuestions(fixtureQuestions, {
			...config,
			ordering: 'sequential',
			count: 'all',
			documentIds: ['doc-structures', 'doc-physiology']
		});
		expect(picked[0].documentId).toBe('doc-structures');
	});

	it('does not insert other difficulties into a hard-only filter', () => {
		const hard = eligibleQuestions(fixtureQuestions, { ...config, difficulty: 'hard' });
		expect(hard.every((q) => q.difficulty === 'hard')).toBe(true);
	});
});

describe('session options', () => {
	it('restart reorders options but keeps the same correct option IDs', () => {
		const first = createSession(fixtureQuestions, config, seededRng(7));
		const second = restartSession(first, undefined, seededRng(99));
		first.questions.forEach((q, i) => {
			expect(second.questions[i].question.correctOptionId).toBe(q.question.correctOptionId);
			expect([...second.questions[i].optionOrderIds].sort()).toEqual([...q.optionOrderIds].sort());
		});
		expect(
			second.questions.some(
				(q, i) => q.optionOrderIds.join() !== first.questions[i].optionOrderIds.join()
			)
		).toBe(true);
	});
});

describe('grading', () => {
	it('scores one correct, one wrong, one unanswered as 1/3', () => {
		const session = createSession(fixtureQuestions, { ...config, count: 3 });
		const [a, b] = session.questions;
		a.selectedOptionId = a.question.correctOptionId;
		b.selectedOptionId = b.question.options.find((o) => o.id !== b.question.correctOptionId)!.id;
		expect(gradeSession(session)).toEqual({
			correct: 1,
			wrong: 1,
			unanswered: 1,
			total: 3,
			percentage: 33.33
		});
	});
});

describe('player payload', () => {
	it('never exposes correctness', () => {
		const session = createSession(fixtureQuestions, config);
		const json = JSON.stringify(session.questions.map(toPlayerQuestion));
		expect(json).not.toMatch(/isCorrect|correctOptionId|explanation/);
	});
});

describe('timing', () => {
	const timed = (minutes: number) =>
		createSession(fixtureQuestions, { ...config, timing: { kind: 'countdown', minutes } });

	it('only a countdown has a deadline', () => {
		expect(deadlineOf(createSession(fixtureQuestions, config))).toBeNull();
		const session = timed(5);
		expect(deadlineOf(session)).toBe(session.startedAt + 5 * 60_000);
	});

	it('ends an unfinished countdown at its deadline, not before', () => {
		const session = timed(1);
		expireIfDue(session, session.startedAt + 59_000);
		expect(session.submittedAt).toBeNull();
		expireIfDue(session, session.startedAt + 90_000);
		expect(session.submittedAt).toBe(session.startedAt + 60_000);
	});

	it('never expires a stopwatch or an untimed quiz', () => {
		const session = createSession(fixtureQuestions, { ...config, timing: { kind: 'stopwatch' } });
		expireIfDue(session, session.startedAt + 10 * 3_600_000);
		expect(session.submittedAt).toBeNull();
	});

	it('treats a session saved before timers existed as untimed', () => {
		const legacy = createSession(fixtureQuestions, config);
		delete (legacy.config as Partial<QuizConfig>).timing;
		expect(withTiming(legacy).config.timing).toEqual({ kind: 'none' });
		expect(expireIfDue(legacy, legacy.startedAt + 3_600_000).submittedAt).toBeNull();
	});
});
