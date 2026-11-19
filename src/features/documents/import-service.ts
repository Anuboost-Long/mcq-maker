import 'server-only';
import { createHash } from 'node:crypto';

import { extractBlocks } from './extractors';
import { parseMcqs } from './mcq-parser/parse';
import { findDocumentByChecksum, saveDocument } from './store';
import type { ImportResult } from './types';

const maxBytes = 10 * 1024 * 1024;
const signatures = { docx: Buffer.from([0x50, 0x4b, 0x03, 0x04]), pdf: Buffer.from('%PDF') };

const titleOf = (filename: string) =>
	filename
		.replace(/\.(docx|pdf)$/i, '')
		.replace(/[_\s]+/g, ' ')
		.trim();

export async function importDocument(filename: string, buffer: Buffer): Promise<ImportResult> {
	const format = /\.(docx|pdf)$/i.exec(filename)?.[1].toLowerCase() as
		keyof typeof signatures | undefined;
	if (!format) return { ok: false, error: 'unsupported' };
	if (buffer.length > maxBytes) return { ok: false, error: 'too_large' };
	if (!buffer.subarray(0, 4).equals(signatures[format]))
		return { ok: false, error: 'invalid_file' };

	const checksum = createHash('sha256').update(buffer).digest('hex');
	const existing = findDocumentByChecksum(checksum);
	const summarize = (doc: NonNullable<typeof existing>, duplicate: boolean): ImportResult => {
		const ready = doc.questions.filter((q) => q.status === 'ready').length;
		return {
			ok: true,
			id: doc.id,
			duplicate,
			total: doc.questions.length,
			ready,
			needsReview: doc.questions.length - ready
		};
	};
	if (existing) return summarize(existing, true);

	let parsed;
	try {
		parsed = parseMcqs(await extractBlocks(format, buffer));
	} catch {
		return { ok: false, error: 'unreadable' };
	}
	if (parsed.questions.length === 0) return { ok: false, error: 'no_questions' };

	const doc = {
		id: `doc-${checksum.slice(0, 12)}`,
		filename,
		title: titleOf(filename),
		checksum,
		uploadedAt: Date.now(),
		status: 'draft' as const,
		...parsed
	};
	await saveDocument(doc);
	return summarize(doc, false);
}
