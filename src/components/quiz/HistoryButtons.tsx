'use client';

import { useTranslation } from 'react-i18next';

import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { clearAllQuizzes, deleteQuizzes } from '@/features/quizzes/actions';

export function DiscardQuizButton({ id }: Readonly<{ id: string }>) {
	const { t } = useTranslation();
	return (
		<ConfirmDelete
			label={t('dashboard.discard')}
			message={t('dashboard.discardConfirm')}
			onConfirm={() => deleteQuizzes([id])}
			compact
		/>
	);
}

export function ClearHistoryButton({ count }: Readonly<{ count: number }>) {
	const { t } = useTranslation();
	return (
		<ConfirmDelete
			label={t('dashboard.clearAll')}
			message={t('dashboard.clearAllConfirm', { count })}
			onConfirm={clearAllQuizzes}
		/>
	);
}
