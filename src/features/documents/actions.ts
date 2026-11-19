'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
	findDocument,
	removeDocument,
	removeQuestion,
	removeQuestions,
	saveDocument
} from './store';

export async function publishDocument(id: string) {
	const doc = findDocument(id);
	if (!doc) throw new Error('Document not found');
	if (!doc.questions.some((q) => q.status === 'ready')) throw new Error('Nothing to publish');
	await saveDocument({ ...doc, status: 'published' });
	revalidatePath('/', 'layout');
}

export async function unpublishDocument(id: string) {
	const doc = findDocument(id);
	if (!doc) throw new Error('Document not found');
	await saveDocument({ ...doc, status: 'draft' });
	revalidatePath('/', 'layout');
}

export async function deleteDocument(id: string) {
	await removeDocument(id);
	revalidatePath('/', 'layout');
	redirect('/library');
}

export async function renameDocument(id: string, title: string) {
	const doc = findDocument(id);
	const name = title.trim().slice(0, 120);
	if (!doc || !name) throw new Error('Invalid name');
	await saveDocument({ ...doc, title: name });
	revalidatePath('/', 'layout');
}

export async function deleteQuestion(documentId: string, number: number) {
	await removeQuestion(documentId, number);
	revalidatePath('/', 'layout');
}

const keysSchema = z.array(z.string()).max(2000);

export async function deleteQuestions(keys: unknown) {
	const byDocument = Map.groupBy(
		(await keysSchema.parseAsync(keys)).map((key) => {
			const [documentId, number] = key.split(':');
			return { documentId, number: Number(number) };
		}),
		(item) => item.documentId
	);
	for (const [documentId, group] of byDocument) {
		await removeQuestions(
			documentId,
			group.map((item) => item.number)
		);
	}
	revalidatePath('/', 'layout');
}

export async function deleteDocuments(ids: unknown) {
	await Promise.all((await keysSchema.parseAsync(ids)).map((id) => removeDocument(id)));
	revalidatePath('/', 'layout');
}
