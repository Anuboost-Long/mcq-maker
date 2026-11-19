import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Question } from '@/features/quizzes/types';

import { toQuestions } from './mcq-parser/to-questions';
import type { DocumentSummary, StoredDocument } from './types';

const file = path.join(process.cwd(), '.data', 'documents.json');

const globalStore = globalThis as typeof globalThis & {
	qcmDocuments?: Map<string, StoredDocument>;
};

function load() {
	if (!existsSync(file)) return new Map<string, StoredDocument>();
	const saved: StoredDocument[] = JSON.parse(readFileSync(file, 'utf8'));
	return new Map(saved.map((doc) => [doc.id, doc]));
}

const documents = () => (globalStore.qcmDocuments ??= load());

let pendingWrite: Promise<unknown> = Promise.resolve();

function persist() {
	const snapshot = JSON.stringify([...documents().values()]);
	pendingWrite = pendingWrite.then(async () => {
		await mkdir(path.dirname(file), { recursive: true });
		await writeFile(file, snapshot);
	});
	return pendingWrite;
}

export const findDocument = (id: string) => documents().get(id);

export const findDocumentByChecksum = (checksum: string) =>
	[...documents().values()].find((doc) => doc.checksum === checksum);

export async function saveDocument(doc: StoredDocument) {
	documents().set(doc.id, doc);
	await persist();
}

export async function removeDocument(id: string) {
	documents().delete(id);
	await persist();
}

export async function removeQuestion(documentId: string, number: number) {
	const doc = findDocument(documentId);
	if (!doc) return;
	await saveDocument({ ...doc, questions: doc.questions.filter((q) => q.number !== number) });
}

export async function removeQuestions(documentId: string, numbers: readonly number[]) {
	const doc = findDocument(documentId);
	if (!doc) return;
	const doomed = new Set(numbers);
	await saveDocument({ ...doc, questions: doc.questions.filter((q) => !doomed.has(q.number)) });
}

export function listDocuments(): DocumentSummary[] {
	return [...documents().values()]
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

export function getBank(): Question[] {
	return [...documents().values()]
		.filter((doc) => doc.status === 'published')
		.flatMap((doc) => toQuestions(doc.questions, doc.id));
}

export const publishedDocuments = () => listDocuments().filter((doc) => doc.status === 'published');
