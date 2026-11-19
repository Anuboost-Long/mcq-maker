'use client';

import { useTranslation } from 'react-i18next';

import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { deleteDocument, deleteQuestion } from '@/features/documents/actions';

export function DeleteDocumentButton({
	id,
	compact,
	className
}: Readonly<{ id: string; compact?: boolean; className?: string }>) {
	const { t } = useTranslation();
	return (
		<ConfirmDelete
			label={t('document.delete')}
			message={t('document.deleteConfirm')}
			onConfirm={() => deleteDocument(id)}
			compact={compact}
			className={className}
		/>
	);
}

type DeleteQuestionButtonProp = { documentId: string; number: number; compact?: boolean };

export function DeleteQuestionButton({
	documentId,
	number,
	compact
}: Readonly<DeleteQuestionButtonProp>) {
	const { t } = useTranslation();
	return (
		<ConfirmDelete
			label={t('document.deleteQuestion')}
			message={t('document.deleteQuestionConfirm')}
			onConfirm={() => deleteQuestion(documentId, number)}
			compact={compact}
		/>
	);
}
