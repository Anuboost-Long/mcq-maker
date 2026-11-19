'use client';

import { ArrowLeftIcon, PaperPlaneRightIcon } from '@phosphor-icons/react/ssr';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import type { PlayerQuestion } from '@/features/quizzes/types';

type ReviewDialogProp = {
	open: boolean;
	questions: PlayerQuestion[];
	submitting: boolean;
	onClose: () => void;
	onJump: (index: number) => void;
	onSubmit: () => void;
};

export function ReviewDialog({
	open,
	questions,
	submitting,
	onClose,
	onJump,
	onSubmit
}: Readonly<ReviewDialogProp>) {
	const { t } = useTranslation();
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	const unanswered = questions.filter((q) => !q.selectedOptionId);
	const flagged = questions.filter((q) => q.flagged);
	const attention = questions
		.map((q, index) => ({ q, index }))
		.filter(({ q }) => !q.selectedOptionId || q.flagged);

	return (
		<dialog
			ref={ref}
			onClose={onClose}
			className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-black/40"
		>
			<h2 className="font-serif text-2xl">{t('review.title')}</h2>
			<dl className="mt-4 grid grid-cols-3 divide-x divide-line border-y border-line text-center">
				{[
					[t('review.answered'), questions.length - unanswered.length],
					[t('review.unanswered'), unanswered.length],
					[t('review.flagged'), flagged.length]
				].map(([label, value]) => (
					<div key={label} className="py-3">
						<dt className="text-xs text-muted">{label}</dt>
						<dd className="font-serif text-2xl">{value}</dd>
					</div>
				))}
			</dl>

			{unanswered.length > 0 && (
				<p className="mt-4 text-sm text-warn-ink">
					{t('review.unansweredWarning', { count: unanswered.length })}
				</p>
			)}

			{attention.length > 0 && (
				<ul className="mt-3 flex flex-wrap gap-2">
					{attention.map(({ index }) => (
						<li key={index}>
							<button
								type="button"
								aria-label={t('review.jumpTo', { number: index + 1 })}
								onClick={() => {
									onJump(index);
									onClose();
								}}
								className="size-11 rounded-md border border-line text-sm hover:bg-sunken"
							>
								{index + 1}
							</button>
						</li>
					))}
				</ul>
			)}

			<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button variant="quiet" icon={ArrowLeftIcon} label={t('review.goBack')} onClick={onClose} />
				<Button
					variant="positive"
					icon={PaperPlaneRightIcon}
					label={submitting ? t('review.submitting') : t('review.submit')}
					loading={submitting}
					onClick={onSubmit}
				/>
			</div>
		</dialog>
	);
}
