'use client';

import { CheckCircleIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteQuestionButton } from '@/components/documents/DeleteButtons';
import { difficultyTone } from '@/components/ui/difficulty';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { SelectableRow, SelectionProvider, SelectionToolbar } from '@/components/ui/selection';
import { Tag } from '@/components/ui/Tag';
import { deleteQuestions } from '@/features/documents/actions';
import type { Question } from '@/features/quizzes/types';

type QuestionBrowserProp = {
	questions: Question[];
	documents: { id: string; title: string }[];
};

export function QuestionBrowser({ questions, documents }: Readonly<QuestionBrowserProp>) {
	const { t } = useTranslation();
	const [search, setSearch] = useState('');
	const [documentId, setDocumentId] = useState('');
	const [difficulty, setDifficulty] = useState('');

	const needle = search.trim().toLowerCase();
	const shown = questions.filter(
		(q) =>
			(!documentId || q.documentId === documentId) &&
			(!difficulty || q.difficulty === difficulty) &&
			(!needle || q.stem.toLowerCase().includes(needle) || q.topic.toLowerCase().includes(needle))
	);

	return (
		<div>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_14rem_10rem]">
				<SearchInput
					label={t('questions.search')}
					value={search}
					onChange={setSearch}
					className="col-span-2 sm:col-span-1"
				/>
				<Select
					label={t('setup.documents')}
					value={documentId}
					onChange={setDocumentId}
					options={[
						{ value: '', label: t('questions.allDocuments') },
						...documents.map((d) => ({ value: d.id, label: d.title }))
					]}
				/>
				<Select
					label={t('setup.difficulty')}
					value={difficulty}
					onChange={setDifficulty}
					options={[
						{ value: '', label: t('questions.allDifficulties') },
						...(['easy', 'medium', 'hard'] as const).map((d) => ({
							value: d,
							label: t(`common.${d}`)
						}))
					]}
				/>
			</div>

			<p className="mb-3 mt-4 text-sm text-muted" aria-live="polite">
				{t('questions.shown', { count: shown.length })}
			</p>

			{shown.length === 0 ? (
				<EmptyState
					icon={MagnifyingGlassIcon}
					title={t('questions.noMatch')}
					body={t('questions.noMatchBody')}
				/>
			) : (
				<SelectionProvider keys={shown.map((q) => `${q.documentId}:${q.sourceNumber}`)}>
					<SelectionToolbar
						deleteSelected={deleteQuestions}
						confirmKey="document.deleteSelectedConfirm"
						className="mb-3"
					/>
					<ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
						{shown.map((q) => {
							const correct = q.options.find((o) => o.id === q.correctOptionId);
							return (
								<SelectableRow
									key={q.id}
									itemKey={`${q.documentId}:${q.sourceNumber}`}
									label={t('document.selectQuestion', { number: q.sourceNumber })}
									className="px-4 py-4"
								>
									<div className="mb-2 flex items-center gap-2">
										<div className="flex min-w-0 flex-1 flex-wrap gap-2">
											<Tag>{q.topic}</Tag>
											<Tag tone={difficultyTone[q.difficulty]}>{t(`common.${q.difficulty}`)}</Tag>
											{q.bloomLevel && <Tag>{q.bloomLevel}</Tag>}
										</div>
										<DeleteQuestionButton
											documentId={q.documentId}
											number={q.sourceNumber}
											compact
										/>
									</div>
									<p className="font-medium">{q.stem}</p>
									<p className="mt-2 flex items-start gap-2 text-sm text-muted">
										<CheckCircleIcon
											weight="fill"
											size={18}
											className="shrink-0 text-accent"
											aria-hidden
										/>
										<span>
											<span className="sr-only">{t('questions.correctAnswer')}: </span>
											<span className="text-ink">{correct?.text}</span>
										</span>
									</p>
								</SelectableRow>
							);
						})}
					</ol>
				</SelectionProvider>
			)}
		</div>
	);
}
