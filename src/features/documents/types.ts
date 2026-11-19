export type Block = { kind: 'paragraph'; lines: string[] } | { kind: 'table'; rows: string[][] };

export type ImportIssue = {
	code:
		| 'option_count'
		| 'duplicate_label'
		| 'duplicate_number'
		| 'missing_answer'
		| 'answer_not_in_options'
		| 'answer_text_mismatch'
		| 'key_conflict'
		| 'missing_key_row'
		| 'orphan_key_row';
	message: string;
	severity: 'error' | 'warning';
};

export type ParsedOption = { label: string; text: string };

export type ParsedQuestion = {
	number: number;
	section: string;
	stem: string;
	options: ParsedOption[];
	answerLabel: string | null;
	bloomLevel: string | null;
	bloomName: string | null;
	clo: string | null;
	issues: ImportIssue[];
	status: 'ready' | 'needs_review';
};

export type ParseResult = { questions: ParsedQuestion[]; issues: ImportIssue[] };

export type StoredDocument = {
	id: string;
	filename: string;
	title: string;
	checksum: string;
	uploadedAt: number;
	status: 'draft' | 'published';
	questions: ParsedQuestion[];
	issues: ImportIssue[];
};

export type DocumentSummary = {
	id: string;
	title: string;
	filename: string;
	status: StoredDocument['status'];
	questionCount: number;
	publishableCount: number;
	reviewCount: number;
};

export type ImportResult =
	| { ok: true; id: string; duplicate: boolean; total: number; ready: number; needsReview: number }
	| {
			ok: false;
			error: 'unsupported' | 'too_large' | 'invalid_file' | 'no_questions' | 'unreadable' | 'failed';
	  };
