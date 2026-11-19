import {
	ArrowRightIcon,
	CaretRightIcon,
	CheckCircleIcon,
	PlayCircleIcon,
	TargetIcon,
	TrendUpIcon
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { buttonClass } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { PageHeader } from '@/components/ui/PageHeader';
import { gradeSession } from '@/features/quizzes/grading';
import { summarize } from '@/features/quizzes/stats';
import { listSessions } from '@/features/quizzes/store';
import { formatPercent } from '@/lib/format';
import { t } from '@/lib/i18n';

async function DashboardContent() {
	await connection();
	const sessions = listSessions();
	const open = sessions.find((s) => !s.submittedAt);
	const finished = sessions.filter((s) => s.submittedAt);
	const stats = summarize(sessions);

	if (sessions.length === 0) {
		return (
			<EmptyState
				icon={PlayCircleIcon}
				title={t('dashboard.emptyTitle')}
				body={t('dashboard.emptyBody')}
				action={
					<Link href="/quiz/new" className={buttonClass()}>
						<PlayCircleIcon weight="bold" size={18} aria-hidden />
						{t('dashboard.startQuiz')}
					</Link>
				}
			/>
		);
	}

	const answeredInOpen = open?.questions.filter((q) => q.selectedOptionId).length ?? 0;
	const statCards = [
		{ icon: CheckCircleIcon, label: t('dashboard.quizzes'), value: String(stats.quizCount) },
		{ icon: TargetIcon, label: t('dashboard.average'), value: formatPercent(stats.averageScore) },
		{ icon: TrendUpIcon, label: t('dashboard.latest'), value: formatPercent(stats.latestScore) }
	];

	return (
		<div className="space-y-10">
			{open && (
				<Link
					href={`/quiz/${open.id}`}
					className="group flex items-center gap-4 rounded-lg border border-accent bg-accent-soft px-5 py-4"
				>
					<span className="grid size-10 shrink-0 place-items-center rounded-md bg-canvas text-accent">
						<PlayCircleIcon weight="fill" size={22} aria-hidden />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block font-medium">{t('dashboard.continue')}</span>
						<span className="text-sm text-muted">
							{t('dashboard.continueHint', {
								answered: answeredInOpen,
								total: open.questions.length
							})}
						</span>
					</span>
					<ArrowRightIcon
						weight="bold"
						size={18}
						aria-hidden
						className="transition-transform group-hover:translate-x-0.5"
					/>
				</Link>
			)}

			<dl className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-lg border border-line bg-surface">
				{statCards.map(({ icon: Glyph, label, value }) => (
					<div key={label} className="flex flex-col-reverse justify-end gap-1 px-4 py-4 sm:px-6">
						<dt className="flex items-start gap-1.5 text-xs leading-4 text-muted sm:text-sm sm:leading-5">
							<Glyph weight="bold" size={14} className="mt-px shrink-0" aria-hidden />
							{label}
						</dt>
						<dd className="font-serif text-2xl leading-none sm:text-3xl">{value}</dd>
					</div>
				))}
			</dl>

			<section>
				<h2 className="mb-3 font-serif text-xl">{t('dashboard.weakTopics')}</h2>
				{stats.weakTopics.length === 0 ? (
					<p className="text-muted">{t('dashboard.weakEmpty')}</p>
				) : (
					<ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
						{stats.weakTopics.map(({ topic, rate, total }) => (
							<li key={topic} className="px-4 py-3">
								<div className="flex items-center justify-between gap-3">
									<span className="truncate">{topic}</span>
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
				)}
			</section>

			{finished.length > 0 && (
				<section>
					<h2 className="mb-3 font-serif text-xl">{t('dashboard.recent')}</h2>
					<ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
						{finished.slice(0, 5).map((session) => {
							const grade = gradeSession(session);
							return (
								<li key={session.id}>
									<Link
										href={`/quiz/${session.id}/results`}
										className="group flex items-center gap-3 px-4 py-3 hover:bg-sunken"
									>
										<span className="min-w-0 flex-1">
											<span className="block">{new Date(session.startedAt).toLocaleString()}</span>
											<span className="text-sm text-muted">
												{grade.correct}/{grade.total}
											</span>
										</span>
										<span className="font-serif text-xl">{formatPercent(grade.percentage)}</span>
										<CaretRightIcon weight="bold" size={16} aria-hidden className="text-muted" />
									</Link>
								</li>
							);
						})}
					</ul>
				</section>
			)}
		</div>
	);
}

export default function DashboardPage() {
	return (
		<>
			<PageHeader
				title={t('dashboard.title')}
				subtitle={t('dashboard.subtitle')}
				action={
					<Link href="/quiz/new" className={buttonClass()}>
						<PlayCircleIcon weight="bold" size={18} aria-hidden />
						{t('dashboard.startQuiz')}
					</Link>
				}
			/>
			<Suspense fallback={<Loading />}>
				<DashboardContent />
			</Suspense>
		</>
	);
}
