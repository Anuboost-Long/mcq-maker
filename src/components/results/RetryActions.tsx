'use client';

import { ArrowCounterClockwiseIcon, PlusCircleIcon, RepeatIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/button-variants';
import { retryQuiz } from '@/features/quizzes/actions';

export function RetryActions({ sessionId }: Readonly<{ sessionId: string }>) {
	const { t } = useTranslation();
	const [pending, start] = useTransition();
	const [message, setMessage] = useState<string | null>(null);

	const retry = (only: 'all' | 'incorrect') =>
		start(async () => {
			const result = await retryQuiz(sessionId, only);
			if (result?.error) setMessage(t('results.nothingToRetry'));
		});

	return (
		<div>
			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				<Button
					icon={ArrowCounterClockwiseIcon}
					label={t('results.retryIncorrect')}
					loading={pending}
					onClick={() => retry('incorrect')}
				/>
				<Button
					variant="quiet"
					icon={RepeatIcon}
					label={t('results.retryAll')}
					disabled={pending}
					onClick={() => retry('all')}
				/>
				<Link href="/quiz/new" className={buttonClass('quiet')}>
					<PlusCircleIcon weight="bold" size={18} aria-hidden />
					{t('results.newQuiz')}
				</Link>
			</div>
			{message && (
				<p role="status" className="mt-3 text-sm text-muted">
					{message}
				</p>
			)}
		</div>
	);
}
