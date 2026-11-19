import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Question } from '@/features/quizzes/types';
import { sharedStore } from '@/lib/kv';

import { toQuestions } from './mcq-parser/to-questions';
import type { DocumentSummary, StoredDocument } from './types';

const HASH = 'qcm:documents';
const file = path.join(process.cwd(), '.data', 'documents.json');

const globalStore = globalThis as typeof globalThis & {
	qcmDocuments?: Map<string, StoredDocument>;
};

function loadLocal() {
	if (!existsSync(file)) return new Map<string, StoredDocument>();
	const saved: StoredDocument[] = JSON.parse(readFileSync(file, 'utf8'));
	return new Map(saved.map((doc) => [doc.id, doc]));
}

const local = () => (globalStore.qcmDocuments ??= loadLocal());

let pendingWrite: Promise<unknown> = Promise.resolve();

function persistLocal() {
	const snapshot = JSON.stringify([...local().values()]);
	pendingWrite = pendingWrite.then(async () => {
		await mkdir(path.dirname(file), { recursive: true });
		await writeFile(file, snapshot);
	});
	return pendingWrite;
}

async function allDocuments(): Promise<StoredDocument[]> {
	const redis = sharedStore();
	if (!redis) return [...local().values()];
	return Object.values((await redis.hgetall<Record<string, StoredDocument>>(HASH)) ?? {});
}

export async function findDocument(id: string): Promise<StoredDocument | undefined> {
	const redis = sharedStore();
	if (!redis) return local().get(id);
	return (await redis.hget<StoredDocument>(HASH, id)) ?? undefined;
}

export async function findDocumentByChecksum(checksum: string) {
	return (await allDocuments()).find((doc) => doc.checksum === checksum);
}

export async function saveDocument(doc: StoredDocument) {
	const redis = sharedStore();
	if (redis) {
		await redis.hset(HASH, { [doc.id]: doc });
		return;
	}
	local().set(doc.id, doc);
	await persistLocal();
}

export async function removeDocument(id: string) {
	const redis = sharedStore();
	if (redis) {
		await redis.hdel(HASH, id);
		return;
	}
	local().delete(id);
	await persistLocal();
}

export async function removeQuestion(documentId: string, number: number) {
	const doc = await findDocument(documentId);
	if (!doc) return;
	await saveDocument({ ...doc, questions: doc.questions.filter((q) => q.number !== number) });
}

export async function removeQuestions(documentId: string, numbers: readonly number[]) {
	const doc = await findDocument(documentId);
	if (!doc) return;
	const doomed = new Set(numbers);
	await saveDocument({ ...doc, questions: doc.questions.filter((q) => !doomed.has(q.number)) });
}

export async function listDocuments(): Promise<DocumentSummary[]> {
	return (await allDocuments())
		.sort((a, b) => b.uploadedAt - a.uploadedAt)
		.map((doc) => {
			const ready = doc.questions.filter((q) => q.status === 'ready').length;
			return {
				id: doc.id,
				title: doc.title,
				filename: doc.filename,
				status: doc.status,
				questionCount: doc.questions.length,
				publishableCount: ready,
				reviewCount: doc.questions.length - ready
			};
		});
}

export async function getBank(): Promise<Question[]> {
	return (await allDocuments())
		.filter((doc) => doc.status === 'published')
		.flatMap((doc) => toQuestions(doc.questions, doc.id));
}

export const publishedDocuments = async () =>
	(await listDocuments()).filter((doc) => doc.status === 'published');
