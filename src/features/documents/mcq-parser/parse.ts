import type { Block, ImportIssue, ParsedOption, ParsedQuestion, ParseResult } from '../types';

const questionLine = /^(\d+)\.\s+(\S.*)$/;
const optionLine = /^([A-Z])\.\s+(\S.*)$/;
const answerLine = /^Answer:\s*([A-Z])\b[\s.:)\-–—]*([^\s.:)\-–—].*)?$/i;
const bloomCell = /^(C\d)\s*[–-]\s*(\S.*)$/;

type Draft = {
	number: number;
	section: string;
	stem: string;
	options: ParsedOption[];
	inlineLabel: string | null;
	inlineText: string;
	closed: boolean;
};

type KeyRow = {
	answer: string;
	bloomLevel: string | null;
	bloomName: string | null;
	clo: string | null;
};

const error = (code: ImportIssue['code'], message: string): ImportIssue => ({
	code,
	message,
	severity: 'error'
});
const warning = (code: ImportIssue['code'], message: string): ImportIssue => ({
	code,
	message,
	severity: 'warning'
});
const normalize = (text: string) =>
	text
		.toLowerCase()
		.replace(/["“”'‘’]/g, '')
		.replace(/\s+/g, ' ')
		.replace(/\.$/, '')
		.trim();

const mentions = (haystack: string, needle: string) =>
	needle !== '' &&
	new RegExp(String.raw`\b${needle.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}\b`).test(
		haystack
	);

const matches = (answer: string, option: string) => {
	const [a, o] = [normalize(answer), normalize(option)];
	return a === o || mentions(a, o) || mentions(o, a);
};

function readDrafts(blocks: Block[]) {
	const drafts: Draft[] = [];
	let section = '';
	let current: Draft | null = null;

	const lines = blocks.flatMap((block) => (block.kind === 'paragraph' ? block.lines : []));
	for (const line of lines) {
		const answer = answerLine.exec(line);
		const question = questionLine.exec(line);
		const option = optionLine.exec(line);

		if (answer && current) {
			current.inlineLabel = answer[1].toUpperCase();
			current.inlineText = answer[2] ?? '';
			current.closed = true;
		} else if (question) {
			current = {
				number: Number(question[1]),
				section,
				stem: question[2],
				options: [],
				inlineLabel: null,
				inlineText: '',
				closed: false
			};
			drafts.push(current);
		} else if (option && current && !current.closed) {
			current.options.push({ label: option[1], text: option[2] });
		} else if (current && !current.closed && current.options.length === 0) {
			current.stem += ` ${line}`;
		} else if (current && !current.closed) {
			current.options.at(-1)!.text += ` ${line}`;
		} else {
			section = line;
			current = null;
		}
	}
	return drafts;
}

function readKey(blocks: Block[]) {
	const key = new Map<number, KeyRow>();
	for (const block of blocks) {
		if (block.kind !== 'table') continue;
		const [header, ...rows] = block.rows;
		const column = (name: string) =>
			header?.findIndex((cell) => cell.toLowerCase().includes(name)) ?? -1;
		const [answerAt, bloomAt, cloAt] = [column('answer'), column('bloom'), column('clo')];
		if (answerAt < 0) continue;

		for (const row of rows) {
			const number = Number.parseInt(row[0], 10);
			if (Number.isNaN(number)) continue;
			const bloom = bloomCell.exec(row[bloomAt] ?? '');
			key.set(number, {
				answer: row[answerAt].toUpperCase(),
				bloomLevel: bloom?.[1] ?? row[bloomAt] ?? null,
				bloomName: bloom?.[2] ?? null,
				clo: row[cloAt] || null
			});
		}
	}
	return key;
}

function validate(draft: Draft, keyRow: KeyRow | undefined, hasKey: boolean, seen: Set<number>) {
	const issues: ImportIssue[] = [];
	const labels = draft.options.map((o) => o.label);
	if (draft.options.length !== 4)
		issues.push(error('option_count', `Expected 4 options, found ${draft.options.length}.`));
	if (new Set(labels).size !== labels.length)
		issues.push(error('duplicate_label', 'Two options share the same label.'));
	if (seen.has(draft.number))
		issues.push(error('duplicate_number', `Question ${draft.number} appears more than once.`));
	if (hasKey && !keyRow) issues.push(warning('missing_key_row', 'No row in the answer-key table.'));

	const inline = draft.inlineLabel;
	const keyed = keyRow?.answer ?? null;
	if (!inline && !keyed) issues.push(error('missing_answer', 'No answer found.'));
	if (inline && keyed && inline !== keyed) {
		issues.push(
			error('key_conflict', `Inline answer ${inline} conflicts with answer-key table ${keyed}.`)
		);
	}
	return issues;
}

export function parseMcqs(blocks: Block[]): ParseResult {
	const key = readKey(blocks);
	const seen = new Set<number>();

	const questions = readDrafts(blocks).map((draft): ParsedQuestion => {
		const keyRow = key.get(draft.number);
		const issues = validate(draft, keyRow, key.size > 0, seen);
		seen.add(draft.number);

		const conflict = issues.some((i) => i.code === 'key_conflict');
		const label = conflict ? null : (draft.inlineLabel ?? keyRow?.answer ?? null);
		const correct = draft.options.find((o) => o.label === label);

		if (label && !correct)
			issues.push(error('answer_not_in_options', `Answer ${label} is not one of the options.`));
		if (correct && draft.inlineText) {
			const others = draft.options.filter(
				(o) => o !== correct && matches(draft.inlineText, o.text)
			);
			if (!matches(draft.inlineText, correct.text)) {
				const message = `Answer text "${draft.inlineText}" differs from option ${label}.`;
				issues.push(
					others.length
						? error('answer_text_mismatch', message)
						: warning('answer_text_mismatch', message)
				);
			}
		}

		return {
			number: draft.number,
			section: draft.section,
			stem: draft.stem,
			options: draft.options,
			answerLabel: label,
			bloomLevel: keyRow?.bloomLevel ?? null,
			bloomName: keyRow?.bloomName ?? null,
			clo: keyRow?.clo ?? null,
			issues,
			status: issues.some((i) => i.severity === 'error') ? 'needs_review' : 'ready'
		};
	});

	const numbers = new Set(questions.map((q) => q.number));
	const issues = [...key.keys()]
		.filter((number) => !numbers.has(number))
		.map((number) =>
			warning('orphan_key_row', `Answer-key row ${number} has no matching question.`)
		);

	return { questions, issues };
}
