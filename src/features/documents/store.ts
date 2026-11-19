import 'server-only';
import type { Question } from '@/features/quizzes/types';
import { sql } from '@/lib/db';

import { toQuestions } from './mcq-parser/to-questions';
import type { DocumentSummary, ImportIssue, ParsedQuestion, StoredDocument } from './types';

type QuestionRow = {
	document_id: string;
	number: number;
	section: string;
	stem: string;
	answer_label: string | null;
	bloom_level: string | null;
	bloom_name: string | null;
	clo: string | null;
	status: ParsedQuestion['status'];
	issues: ImportIssue[];
	options: { label: string; text: string }[];
};

type NewDocument = Pick<StoredDocument, 'filename' | 'title' | 'checksum' | 'questions' | 'issues'>;

const toParsed = (row: QuestionRow): ParsedQuestion => ({
	number: row.number,
	section: row.section,
	stem: row.stem,
	options: row.options,
	answerLabel: row.answer_label,
	bloomLevel: row.bloom_level,
	bloomName: row.bloom_name,
	clo: row.clo,
	issues: row.issues,
	status: row.status
});

async function loadQuestions(documentIds: string[]) {
	const byDocument = new Map<string, ParsedQuestion[]>(documentIds.map((id) => [id, []]));
	if (documentIds.length === 0) return byDocument;

	const rows = await sql()<QuestionRow[]>`
    select q.*,
      coalesce(
        json_agg(json_build_object('label', o.label, 'text', o.text) order by o.label)
          filter (where o.label is not null),
        '[]'::json
      ) as options
    from questions q
    left join question_options o on o.document_id = q.document_id and o.number = q.number
    where q.document_id in ${sql()(documentIds)}
    group by q.document_id, q.number
    order by q.document_id, q.number`;

	for (const row of rows) byDocument.get(row.document_id)?.push(toParsed(row));
	return byDocument;
}

export async function listDocuments(deviceId: string): Promise<DocumentSummary[]> {
	const rows = await sql()<
		{
			id: string;
			title: string;
			filename: string;
			status: DocumentSummary['status'];
			total: number;
			ready: number;
		}[]
	>`
    select d.id, d.title, d.filename, d.status,
      count(q.number)::int as total,
      (count(q.number) filter (where q.status = 'ready'))::int as ready
    from documents d
    left join questions q on q.document_id = d.id
    where d.device_id = ${deviceId}
    group by d.id
    order by d.uploaded_at desc`;

	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		filename: row.filename,
		status: row.status,
		questionCount: row.total,
		publishableCount: row.ready,
		reviewCount: row.total - row.ready
	}));
}

export const publishedDocuments = async (deviceId: string) =>
	(await listDocuments(deviceId)).filter((doc) => doc.status === 'published');

export async function findDocument(
	deviceId: string,
	id: string
): Promise<StoredDocument | undefined> {
	const [row] = await sql()<
		{
			id: string;
			filename: string;
			title: string;
			checksum: string;
			status: StoredDocument['status'];
			issues: ImportIssue[];
			uploaded_at: Date;
		}[]
	>`select id, filename, title, checksum, status, issues, uploaded_at
    from documents where id = ${id} and device_id = ${deviceId}`;
	if (!row) return undefined;

	const questions = (await loadQuestions([row.id])).get(row.id) ?? [];
	return {
		id: row.id,
		filename: row.filename,
		title: row.title,
		checksum: row.checksum,
		status: row.status,
		issues: row.issues,
		uploadedAt: row.uploaded_at.getTime(),
		questions
	};
}

export async function findDocumentByChecksum(deviceId: string, checksum: string) {
	const [row] = await sql()<{ id: string; total: number; ready: number }[]>`
    select d.id,
      count(q.number)::int as total,
      (count(q.number) filter (where q.status = 'ready'))::int as ready
    from documents d
    left join questions q on q.document_id = d.id
    where d.device_id = ${deviceId} and d.checksum = ${checksum}
    group by d.id`;
	return row;
}

export async function insertDocument(deviceId: string, doc: NewDocument) {
	return sql().begin(async (tx) => {
		const [created] = await tx<{ id: string }[]>`
      insert into documents (device_id, filename, title, checksum, issues)
      values (${deviceId}, ${doc.filename}, ${doc.title}, ${doc.checksum}, ${tx.json(doc.issues)})
      returning id`;

		const questionRows = doc.questions.map((q) => ({
			document_id: created.id,
			number: q.number,
			section: q.section,
			stem: q.stem,
			answer_label: q.answerLabel,
			bloom_level: q.bloomLevel,
			bloom_name: q.bloomName,
			clo: q.clo,
			status: q.status,
			issues: tx.json(q.issues)
		}));
		if (questionRows.length > 0) await tx`insert into questions ${tx(questionRows)}`;

		const optionRows = doc.questions.flatMap((q) =>
			q.options.map((o) => ({
				document_id: created.id,
				number: q.number,
				label: o.label,
				text: o.text
			}))
		);
		if (optionRows.length > 0) await tx`insert into question_options ${tx(optionRows)}`;

		return created.id;
	});
}

export async function setDocumentStatus(
	deviceId: string,
	id: string,
	status: StoredDocument['status']
) {
	await sql()`update documents set status = ${status} where id = ${id} and device_id = ${deviceId}`;
}

export async function renameDocument(deviceId: string, id: string, title: string) {
	await sql()`update documents set title = ${title} where id = ${id} and device_id = ${deviceId}`;
}

export async function removeDocument(deviceId: string, id: string) {
	await sql()`delete from documents where id = ${id} and device_id = ${deviceId}`;
}

export async function removeQuestions(
	deviceId: string,
	documentId: string,
	numbers: readonly number[]
) {
	if (numbers.length === 0) return;
	await sql()`
    delete from questions
    where document_id = ${documentId}
      and number = any(${[...numbers]}::int[])
      and exists (select 1 from documents d where d.id = questions.document_id and d.device_id = ${deviceId})`;
}

export async function getBank(deviceId: string): Promise<Question[]> {
	const published = await sql()<{ id: string }[]>`
    select id from documents where device_id = ${deviceId} and status = 'published'`;
	const questions = await loadQuestions(published.map((doc) => doc.id));
	return published.flatMap((doc) => toQuestions(questions.get(doc.id) ?? [], doc.id));
}
