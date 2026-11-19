import {
	CheckCircleIcon,
	ClockIcon,
	MinusCircleIcon,
	XCircleIcon
} from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { RetryActions } from '@/components/results/RetryActions';
import { ScoreReveal } from '@/components/results/ScoreReveal';
import { Loading } from '@/components/ui/Loading';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tag } from '@/components/ui/Tag';
import { answerStatus, gradeSession } from '@/features/quizzes/grading';
import { topicRates } from '@/features/quizzes/stats';
import { findSession, listSessions } from '@/features/quizzes/store';
import { t } from '@/lib/i18n';

const statusStyle = {
	correct: { tone: 'good', icon: CheckCircleIcon },
	wrong: { tone: 'bad', icon: XCircleIcon },
	unanswered: { tone: 'warn', icon: MinusCircleIcon }
} as const;

async function Results({
	params
}: Readonly<Pick<PageProps<'/quiz/[sessionId]/results'>, 'params'>>) {
	await connection();
	const { sessionId } = await params;
	const session = findSession(sessionId);
	if (!session) notFound();
	if (!session.submittedAt) redirect(`/quiz/${sessionId}`);

	const grade = gradeSession(session);
	const earlier = listSessions().find(
		(other) =>
			other.id !== session.id && other.submittedAt && other.submittedAt < session.submittedAt!
	);
	const previous = earlier ? gradeSession(earlier).percentage : null;
	const minutes = Math.max(1, Math.round((session.submittedAt - session.startedAt) / 60000));
	const stats = [
		{
			icon: CheckCircleIcon,
			label: t('results.correct'),
			value: grade.correct,
			tone: 'text-good-ink'
		},
		{ icon: XCircleIcon, label: t('results.wrong'), value: grade.wrong, tone: 'text-bad-ink' },
		{
			icon: MinusCircleIcon,
			label: t('results.unanswered'),
			value: grade.unanswered,
			tone: 'text-warn-ink'
		},
		{ icon: ClockIcon, label: t('results.duration'), value: `${minutes} min`, tone: 'text-muted' }
	];

	return (
		<div className="space-y-10">
			<section aria-label={t('results.title')} className="space-y-5">
				<ScoreReveal
					sessionId={session.id}
					percentage={grade.percentage}
					correct={grade.correct}
					total={grade.total}
					previous={previous}
				/>
				<dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
					{stats.map(({ icon: Glyph, label, value, tone }) => (
						<div key={label} className="bg-surface px-4 py-3">
							<dt className={clsx('flex items-center gap-1.5 text-xs', tone)}>
								<Glyph weight="fill" size={14} aria-hidden />
								{label}
							</dt>
							<dd className="mt-0.5 font-serif text-2xl">{value}</dd>
						</div>
					))}
				</dl>
				<RetryActions sessionId={session.id} />
			</section>

			<section>
				<h2 className="mb-3 font-serif text-xl">{t('results.byTopic')}</h2>
				<ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
					{topicRates([session]).map(({ topic, rate, total }) => (
						<li key={topic} className="px-4 py-3">
							<div className="flex items-center justify-between gap-3">
								<span className="min-w-0 truncate">{topic}</span>
								<span className="shrink-0 text-sm text-muted">
									{rate}% · {t('common.questions', { count: total })}
								</span>
							</div>
							<div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
								<div className="h-full bg-accent" style={{ width: `${rate}%` }} />
							</div>
						</li>
					))}
				</ul>
			</section>

			<section>
				<h2 className="mb-3 font-serif text-xl">{t('results.review')}</h2>
				<ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
					{session.questions.map((sq, i) => {
						const { id, question, selectedOptionId } = sq;
						const status = answerStatus(sq);
						const { tone, icon: Glyph } = statusStyle[status];
						const chosen = question.options.find((o) => o.id === selectedOptionId);
						const answer = question.options.find((o) => o.id === question.correctOptionId);
						return (
							<li key={id} className="px-4 py-5">
								<div className="mb-2 flex items-center gap-2">
									<span className="grid size-7 place-items-center rounded-md bg-sunken text-xs font-medium text-muted">
										{i + 1}
									</span>
									<Tag tone={tone}>
										<Glyph weight="fill" size={14} className="mr-1" aria-hidden />
										{t(`results.${status}`)}
									</Tag>
								</div>
								<p className="font-medium">{question.stem}</p>
								<dl className="mt-3 space-y-1.5 text-sm">
									{status !== 'correct' && (
										<div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
											<dt className="shrink-0 text-muted">{t('results.yourAnswer')}:</dt>
											<dd className={clsx(chosen && 'text-bad-ink')}>
												{chosen?.text ?? t('results.noAnswer')}
											</dd>
										</div>
									)}
									<div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
										<dt className="shrink-0 text-muted">{t('results.correctAnswer')}:</dt>
										<dd className="text-good-ink">{answer?.text}</dd>
									</div>
								</dl>
								{question.explanation && (
									<p className="mt-3 rounded-md bg-sunken px-3 py-2 text-sm text-muted">
										{question.explanation}
									</p>
								)}
							</li>
						);
					})}
				</ol>
			</section>
		</div>
	);
}

export default function ResultsPage({ params }: PageProps<'/quiz/[sessionId]/results'>) {
	return (
		<>
			<PageHeader
				title={t('results.title')}
				back={{ href: '/dashboard', label: t('nav.dashboard') }}
			/>
			<Suspense fallback={<Loading />}>
				<Results params={params} />
			</Suspense>
		</>
	);
}
