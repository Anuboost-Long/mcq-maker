import 'server-only';
import { createHash } from 'node:crypto';

import { extractBlocks } from './extractors';
import { parseMcqs } from './mcq-parser/parse';
import { findDocumentByChecksum, insertDocument } from './store';
import type { ImportResult } from './types';

const maxBytes = 10 * 1024 * 1024;
const signatures = { docx: Buffer.from([0x50, 0x4b, 0x03, 0x04]), pdf: Buffer.from('%PDF') };

const titleOf = (filename: string) =>
	filename
		.replace(/\.(docx|pdf)$/i, '')
		.replace(/[_\s]+/g, ' ')
		.trim();

export async function importDocument(
	deviceId: string,
	filename: string,
	buffer: Buffer
): Promise<ImportResult> {
	const format = /\.(docx|pdf)$/i.exec(filename)?.[1].toLowerCase() as
		keyof typeof signatures | undefined;
	if (!format) return { ok: false, error: 'unsupported' };
	if (buffer.length > maxBytes) return { ok: false, error: 'too_large' };
	if (!buffer.subarray(0, 4).equals(signatures[format]))
		return { ok: false, error: 'invalid_file' };

	const checksum = createHash('sha256').update(buffer).digest('hex');
	const summarize = (
		doc: { id: string; total: number; ready: number },
		duplicate: boolean
	): ImportResult => ({
		ok: true,
		id: doc.id,
		duplicate,
		total: doc.total,
		ready: doc.ready,
		needsReview: doc.total - doc.ready
	});

	const existing = await findDocumentByChecksum(deviceId, checksum);
	if (existing) return summarize(existing, true);

	let parsed;
	try {
		parsed = parseMcqs(await extractBlocks(format, buffer));
	} catch {
		return { ok: false, error: 'unreadable' };
	}
	if (parsed.questions.length === 0) return { ok: false, error: 'no_questions' };

	try {
		const id = await insertDocument(deviceId, {
			filename,
			title: titleOf(filename),
			checksum,
			...parsed
		});
		const ready = parsed.questions.filter((q) => q.status === 'ready').length;
		return summarize({ id, total: parsed.questions.length, ready }, false);
	} catch (error) {
		const raced = await findDocumentByChecksum(deviceId, checksum);
		if (raced) return summarize(raced, true);
		throw error;
	}
}
