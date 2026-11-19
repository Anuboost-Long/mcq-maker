import {
	CaretRightIcon,
	FileDocIcon,
	FilePdfIcon,
	UploadSimpleIcon
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { DeleteDocumentButton } from '@/components/documents/DeleteButtons';
import { FileDropzone } from '@/components/documents/FileDropzone';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { PageHeader } from '@/components/ui/PageHeader';
import { SelectableRow, SelectionProvider, SelectionToolbar } from '@/components/ui/selection';
import { Tag } from '@/components/ui/Tag';
import { deleteDocuments } from '@/features/documents/actions';
import { listDocuments } from '@/features/documents/store';
import { t } from '@/lib/i18n';

async function Documents() {
	await connection();
	const documents = await listDocuments();
	if (documents.length === 0) {
		return (
			<EmptyState
				icon={UploadSimpleIcon}
				title={t('library.empty')}
				body={t('library.emptyBody')}
			/>
		);
	}

	return (
		<SelectionProvider keys={documents.map((doc) => doc.id)}>
			<SelectionToolbar
				deleteSelected={deleteDocuments}
				confirmKey="document.deleteSelectedDocumentsConfirm"
				className="mb-3"
			/>
			<ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
				{documents.map((doc) => {
					const Glyph = doc.filename.toLowerCase().endsWith('.pdf') ? FilePdfIcon : FileDocIcon;
					return (
						<SelectableRow
							key={doc.id}
							itemKey={doc.id}
							label={t('document.selectDocument', { title: doc.title })}
							centered
							className="px-4 py-3"
						>
							<div className="flex flex-wrap items-center gap-3">
								<Link
									href={`/library/${doc.id}`}
									className="group flex min-w-0 flex-1 items-center gap-3"
								>
									<span className="grid size-10 shrink-0 place-items-center rounded-md bg-sunken text-muted">
										<Glyph weight="bold" size={20} aria-hidden />
									</span>
									<span className="min-w-0 flex-1">
										<span className="line-clamp-2 font-medium leading-snug">{doc.title}</span>
										<span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
											<Tag tone={doc.status === 'published' ? 'good' : 'warn'}>
												{t(`library.${doc.status}`)}
											</Tag>
											{t('common.questions', { count: doc.questionCount })}
											{doc.reviewCount > 0 &&
												` · ${t('library.needReview', { count: doc.reviewCount })}`}
										</span>
									</span>
									<CaretRightIcon
										weight="bold"
										size={16}
										aria-hidden
										className="hidden shrink-0 text-muted transition-transform group-hover:translate-x-0.5 sm:block"
									/>
								</Link>
								<DeleteDocumentButton id={doc.id} compact />
							</div>
						</SelectableRow>
					);
				})}
			</ul>
		</SelectionProvider>
	);
}

export default function LibraryPage() {
	return (
		<>
			<PageHeader title={t('library.title')} subtitle={t('library.subtitle')} />
			<FileDropzone />
			<div className="mt-8">
				<Suspense fallback={<Loading />}>
					<Documents />
				</Suspense>
			</div>
		</>
	);
}
