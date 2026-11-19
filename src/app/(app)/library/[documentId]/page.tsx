import { CheckCircleIcon, FileDocIcon, FilePdfIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { DeleteQuestionButton } from '@/components/documents/DeleteButtons';
import { DocumentActions } from '@/components/documents/DocumentActions';
import { Loading } from '@/components/ui/Loading';
import { PageHeader } from '@/components/ui/PageHeader';
import { SelectableRow, SelectionProvider, SelectionToolbar } from '@/components/ui/selection';
import { Tag } from '@/components/ui/Tag';
import { deleteQuestions } from '@/features/documents/actions';
import { findDocument } from '@/features/documents/store';
import type { ParsedQuestion } from '@/features/documents/types';
import { t } from '@/lib/i18n';
import { currentDeviceId } from '@/lib/device';

function sectionsOf(questions: ParsedQuestion[]) {
	const sections: { name: string; questions: ParsedQuestion[] }[] = [];
	for (const q of questions) {
		const last = sections.at(-1);
		if (last?.name === q.section) last.questions.push(q);
		else sections.push({ name: q.section, questions: [q] });
	}
	return sections;
}

async function Preview({ params }: Readonly<Pick<PageProps<'/library/[documentId]'>, 'params'>>) {
	await connection();
	const { documentId } = await params;
	const doc = await findDocument(await currentDeviceId(), documentId);
	if (!doc) notFound();

	const ready = doc.questions.filter((q) => q.status === 'ready').length;
	const published = doc.status === 'published';
	const Glyph = doc.filename.toLowerCase().endsWith('.pdf') ? FilePdfIcon : FileDocIcon;

	return (
		<>
			<PageHeader title={doc.title} back={{ href: '/library', label: t('nav.library') }} />

			<div className="mb-10 space-y-4 rounded-lg border border-line bg-surface p-4">
				<div className="flex flex-wrap items-center gap-3">
					<span className="grid size-10 shrink-0 place-items-center rounded-md bg-sunken text-muted">
						<Glyph weight="bold" size={20} aria-hidden />
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">{doc.filename}</p>
						<p className="text-sm text-muted">
							{t('common.questions', { count: doc.questions.length })} ·{' '}
							{t('library.questionsReady', { ready, review: doc.questions.length - ready })}
						</p>
					</div>
					<Tag tone={published ? 'good' : 'warn'}>{t(`library.${doc.status}`)}</Tag>
				</div>
				<p className="text-sm text-muted">
					{published ? t('document.publishedNote') : t('document.draftNote')}
				</p>
				<DocumentActions id={doc.id} title={doc.title} published={published} readyCount={ready} />
			</div>

			<SelectionProvider keys={doc.questions.map((q) => `${doc.id}:${q.number}`)}>
				<SelectionToolbar
					deleteSelected={deleteQuestions}
					confirmKey="document.deleteSelectedConfirm"
					className="mb-6"
				/>
				<div className="space-y-10">
					{sectionsOf(doc.questions).map(({ name, questions }) => (
						<section key={name}>
							<h2 className="mb-3 flex items-baseline justify-between gap-3 font-serif text-xl">
								{name}
								<span className="font-sans text-sm text-muted">
									{t('common.questions', { count: questions.length })}
								</span>
							</h2>
							<ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
								{questions.map((q) => (
									<SelectableRow
										key={q.number}
										itemKey={`${doc.id}:${q.number}`}
										label={t('document.selectQuestion', { number: q.number })}
										className="px-4 py-5"
									>
										<div className="flex gap-3">
											<span className="grid size-7 shrink-0 place-items-center rounded-md bg-sunken text-xs font-medium text-muted">
												{q.number}
											</span>
											<div className="min-w-0 flex-1">
												<p className="font-medium">{q.stem}</p>
												<ul className="mt-3 space-y-1.5">
													{q.options.map((o) => {
														const correct = o.label === q.answerLabel;
														return (
															<li
																key={o.label}
																className={clsx(
																	'flex items-start gap-2 text-sm',
																	correct ? 'font-medium text-ink' : 'text-muted'
																)}
															>
																<span className="w-4 shrink-0 font-mono text-xs leading-5">
																	{o.label}
																</span>
																<span className="flex-1">{o.text}</span>
																{correct && (
																	<CheckCircleIcon
																		weight="fill"
																		size={18}
																		className="shrink-0 text-accent"
																		aria-label={t('document.correct')}
																	/>
																)}
															</li>
														);
													})}
												</ul>
												<div className="mt-3 flex flex-wrap items-center gap-2">
													<Tag tone={q.status === 'ready' ? 'good' : 'bad'}>
														{q.status === 'ready' ? t('document.ready') : t('document.needsReview')}
													</Tag>
													{q.bloomLevel && <Tag>{q.bloomLevel}</Tag>}
													{q.clo && <Tag>{q.clo}</Tag>}
													<span className="ml-auto">
														<DeleteQuestionButton documentId={doc.id} number={q.number} compact />
													</span>
												</div>
												{q.issues.length > 0 && (
													<ul className="mt-3 space-y-1 text-sm">
														{q.issues.map((issue) => (
															<li
																key={issue.code + issue.message}
																className={clsx(
																	'flex items-start gap-2',
																	issue.severity === 'error' ? 'text-bad-ink' : 'text-warn-ink'
																)}
															>
																<WarningIcon
																	weight="bold"
																	size={16}
																	className="mt-0.5 shrink-0"
																	aria-hidden
																/>
																{issue.message}
															</li>
														))}
													</ul>
												)}
											</div>
										</div>
									</SelectableRow>
								))}
							</ol>
						</section>
					))}
				</div>
			</SelectionProvider>
		</>
	);
}

export default function DocumentPage({ params }: PageProps<'/library/[documentId]'>) {
	return (
		<Suspense fallback={<Loading />}>
			<Preview params={params} />
		</Suspense>
	);
}
