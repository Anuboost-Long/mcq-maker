import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { extractDocxBlocks } from '../extractors/docx';
import type { ParseResult } from '../types';
import { parseMcqs } from './parse';
import { toQuestions } from './to-questions';

const fixture = fileURLToPath(
	new URL('../../../../tests/fixtures/31-ent-mcqs.docx', import.meta.url)
);

let result: ParseResult;
const question = (number: number) => result.questions.find((q) => q.number === number)!;

beforeAll(async () => {
	result = parseMcqs(await extractDocxBlocks(readFileSync(fixture)));
});

describe('31 ENT physiology fixture', () => {
	it('T1/T2: finds 31 questions with 124 options, not 62', () => {
		expect(result.questions).toHaveLength(31);
		expect(result.questions.flatMap((q) => q.options)).toHaveLength(124);
	});

	it('imports every question cleanly, with no issues', () => {
		expect(result.questions.filter((q) => q.status !== 'ready')).toEqual([]);
		expect(result.issues).toEqual([]);
	});

	it("T3: Q1's answer resolves to option B's content", () => {
		const q = question(1);
		expect(q.options.find((o) => o.label === q.answerLabel)?.text).toBe(
			'Detect sound and convert mechanical vibrations into neural signals'
		);
	});

	it("T4: 'Answer: C. CN VIII' records CN VIII as correct", () => {
		const q = question(4);
		expect(q.options.find((o) => o.label === q.answerLabel)?.text).toBe('CN VIII');
	});

	it('T5: Bloom and CLO come from the answer-key table', () => {
		expect([question(12).bloomLevel, question(12).bloomName]).toEqual(['C4', 'Analyze']);
		expect([question(31).bloomLevel, question(31).clo]).toEqual(['C4', 'CLO4/CLO5']);
	});

	it('T6: keeps section titles and Q1-Q31 order', () => {
		expect(result.questions.map((q) => q.number)).toEqual(
			Array.from({ length: 31 }, (_, i) => i + 1)
		);
		const counts = new Map<string, number>();
		result.questions.forEach((q) => counts.set(q.section, (counts.get(q.section) ?? 0) + 1));
		expect([...counts.values()]).toEqual([7, 5, 6, 6, 7]);
		expect([...counts.keys()][0]).toBe('Hearing Physiology');
	});

	it('T13: re-importing gives identical question and option IDs', () => {
		const first = toQuestions(result.questions, 'doc-x');
		const again = toQuestions(result.questions, 'doc-x');
		expect(again).toEqual(first);
		expect(new Set(first.map((q) => q.id)).size).toBe(31);
	});

	it('maps Bloom levels to difficulty (C4 hard)', () => {
		const bank = toQuestions(result.questions, 'doc-x');
		expect(bank.find((q) => q.id === 'doc-x-q12')?.difficulty).toBe('hard');
		expect(bank.find((q) => q.id === 'doc-x-q1')?.difficulty).toBe('easy');
		expect(bank.find((q) => q.id === 'doc-x-q6')?.difficulty).toBe('medium');
	});
});

describe('flagging instead of inventing', () => {
	const paragraph = (...lines: string[]) => ({ kind: 'paragraph' as const, lines });
	const table = (...rows: string[][]) => ({ kind: 'table' as const, rows });

	it('T7: a key-table conflict needs review and has no answer', () => {
		const { questions } = parseMcqs([
			paragraph('Topic'),
			paragraph('1. Stem?', 'A. One', 'B. Two', 'C. Three', 'D. Four'),
			paragraph('Answer: B'),
			table(['No', 'Answer'], ['1', 'C'])
		]);
		expect(questions[0].status).toBe('needs_review');
		expect(questions[0].answerLabel).toBeNull();
		expect(questions[0].issues.map((i) => i.code)).toContain('key_conflict');
	});

	it('accepts a dash after the answer letter and quoted option text', () => {
		const { questions } = parseMcqs([
			paragraph('1. Stem?', 'A. One', 'B. Two', 'C. Three', 'D. Four'),
			paragraph('Answer: B — Two'),
			paragraph('2. Quoted?', 'A. "One."', 'B. "Two."', 'C. "Three."', 'D. "Four."'),
			paragraph('Answer: C. Three.')
		]);
		expect(questions.map((q) => q.status)).toEqual(['ready', 'ready']);
		expect(questions[1].options[2].text).toBe('"Three."');
	});

	it('tolerates an elaborated answer but rejects text that names another option', () => {
		const { questions } = parseMcqs([
			paragraph('1. Stem?', 'A. II', 'B. III', 'C. V', 'D. VIII'),
			paragraph('Answer: A — Cranial nerve II, optic nerve'),
			paragraph('2. Stem?', 'A. One', 'B. Two', 'C. Three', 'D. Four'),
			paragraph('Answer: B — Vestibulocochlear nerve'),
			paragraph('3. Stem?', 'A. Brain', 'B. Spinal cord', 'C. Nerves', 'D. Ganglia'),
			paragraph('Answer: A — Spinal cord')
		]);
		expect(questions.map((q) => q.status)).toEqual(['ready', 'ready', 'needs_review']);
		expect(questions[0].issues).toEqual([]);
		expect(questions[1].issues[0].severity).toBe('warning');
	});

	it('flags a missing option, a missing answer and mismatched answer text', () => {
		const { questions } = parseMcqs([
			paragraph('1. Stem?', 'A. One', 'B. Two', 'C. Three'),
			paragraph('Answer: B'),
			paragraph('2. Other?', 'A. One', 'B. Two', 'C. Three', 'D. Four'),
			paragraph('3. Third?', 'A. One', 'B. Two', 'C. Three', 'D. Four'),
			paragraph('Answer: C. Four')
		]);
		expect(questions[0].issues.map((i) => i.code)).toContain('option_count');
		expect(questions[1].issues.map((i) => i.code)).toContain('missing_answer');
		expect(questions[2].issues.map((i) => i.code)).toContain('answer_text_mismatch');
		expect(toQuestions(questions, 'd')).toHaveLength(0);
	});
});

describe('PDF input', () => {
	const pdf = fileURLToPath(new URL('../../../../tests/fixtures/31-ent-mcqs.pdf', import.meta.url));

	it('reads the same 31 questions and 124 options from a text PDF', async () => {
		const { extractPdfBlocks } = await import('../extractors/pdf');
		const parsed = parseMcqs(await extractPdfBlocks(readFileSync(pdf)));
		expect(parsed.questions).toHaveLength(31);
		expect(parsed.questions.flatMap((q) => q.options)).toHaveLength(124);
		expect(parsed.questions.filter((q) => q.status !== 'ready')).toEqual([]);
		const q4 = parsed.questions[3];
		expect(q4.options.find((o) => o.label === q4.answerLabel)?.text).toBe('CN VIII');
	});

	it('joins a wrapped option line to its option', () => {
		const { questions } = parseMcqs([
			{
				kind: 'paragraph',
				lines: [
					'1. Stem?',
					'A. One',
					'B. Two that',
					'continues here',
					'C. Three',
					'D. Four',
					'Answer: B'
				]
			}
		]);
		expect(questions[0].options[1].text).toBe('Two that continues here');
		expect(questions[0].status).toBe('ready');
	});
});
