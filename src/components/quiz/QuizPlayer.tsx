'use client';

import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CheckCircleIcon,
	CheckFatIcon,
	CircleNotchIcon,
	ClipboardTextIcon,
	FlagIcon,
	PaperPlaneRightIcon,
	XCircleIcon
} from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import { createStore, Provider, useAtom } from 'jotai';
import { useCallback, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { checkAnswer, saveAnswer, submitQuiz, toggleFlag } from '@/features/quizzes/actions';
import type { PlayerQuestion, QuizMode, Timing } from '@/features/quizzes/types';

import { errorAtom, indexAtom, questionsAtom } from './quiz-atoms';
import { QuizTimer } from './QuizTimer';
import { ReviewDialog } from './ReviewDialog';

type QuizPlayerProp = {
	sessionId: string;
	mode: QuizMode;
	questions: PlayerQuestion[];
	timing: Timing;
	startedAt: number;
	serverNow: number;
};

export function QuizPlayer(props: Readonly<QuizPlayerProp>) {
	const [store] = useState(() => {
		const created = createStore();
		created.set(questionsAtom, props.questions);
		const firstOpen = props.questions.findIndex((q) => !q.selectedOptionId);
		created.set(indexAtom, Math.max(firstOpen, 0));
		return created;
	});

	return (
		<Provider store={store}>
			<Player
				sessionId={props.sessionId}
				mode={props.mode}
				timing={props.timing}
				startedAt={props.startedAt}
				serverNow={props.serverNow}
			/>
		</Provider>
	);
}

function Player({
	sessionId,
	mode,
	timing,
	startedAt,
	serverNow
}: Readonly<Omit<QuizPlayerProp, 'questions'>>) {
	const { t } = useTranslation();
	const [questions, setQuestions] = useAtom(questionsAtom);
	const [index, setIndex] = useAtom(indexAtom);
	const [error, setError] = useAtom(errorAtom);
	const [reviewing, setReviewing] = useState(false);
	const [submitting, startSubmit] = useTransition();
	const [timeUp, setTimeUp] = useState(false);

	const endOnTimeUp = useCallback(() => {
		setTimeUp(true);
		startSubmit(() => submitQuiz(sessionId));
	}, [sessionId]);

	const question = questions[index];
	const total = questions.length;
	const locked = Boolean(question.reveal);
	const answeredCount = questions.filter((q) => q.selectedOptionId).length;
	const ids = (q: PlayerQuestion) => ({ sessionId, sessionQuestionId: q.sessionQuestionId });

	const patch = (change: Partial<PlayerQuestion>) =>
		setQuestions((all) => all.map((q, i) => (i === index ? { ...q, ...change } : q)));

	const select = async (optionId: string) => {
		const previous = question.selectedOptionId;
		setError(null);
		patch({ selectedOptionId: optionId });
		try {
			await saveAnswer({ ...ids(question), optionId });
		} catch {
			patch({ selectedOptionId: previous });
			setError(t('player.saveFailed'));
		}
	};

	const flag = async () => {
		patch({ flagged: !question.flagged });
		try {
			await toggleFlag(ids(question));
		} catch {
			patch({ flagged: question.flagged });
			setError(t('player.saveFailed'));
		}
	};

	const check = async () => {
		try {
			patch({ reveal: await checkAnswer(ids(question)) });
		} catch {
			setError(t('player.saveFailed'));
		}
	};

	const isLast = index === total - 1;

	return (
		<div>
			{timing.kind !== 'none' && (
				<QuizTimer
					timing={timing}
					startedAt={startedAt}
					serverNow={serverNow}
					onExpire={endOnTimeUp}
				/>
			)}
			{timeUp && (
				<div
					role="alert"
					className="fixed inset-0 z-40 grid place-items-center bg-canvas/85 px-6 backdrop-blur-sm"
				>
					<div className="flex flex-col items-center gap-3 text-center">
						<CircleNotchIcon
							weight="bold"
							size={36}
							className="animate-spin text-accent"
							aria-hidden
						/>
						<p className="font-serif text-2xl">{t('player.timeUp')}</p>
						<p className="text-muted">{t('player.timeUpBody')}</p>
					</div>
				</div>
			)}
			<div className="flex items-center justify-between gap-4">
				<p className="text-sm text-muted" aria-live="polite">
					{t('player.question', { current: index + 1, total })}
				</p>
				<Tag>{question.topic}</Tag>
			</div>
			<div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
				<div
					className="h-full bg-accent transition-[width]"
					style={{ width: `${(answeredCount / total) * 100}%` }}
				/>
			</div>

			<fieldset className="mt-8" key={question.sessionQuestionId}>
				<legend className="font-serif text-2xl leading-snug sm:text-3xl">{question.stem}</legend>
				<div className="mt-6 space-y-2">
					{question.options.map((option, position) => {
						const selected = question.selectedOptionId === option.id;
						const isCorrect = question.reveal?.correctOptionId === option.id;
						const isWrong = locked && selected && !isCorrect;
						return (
							<label
								key={option.id}
								className={clsx(
									'flex min-h-14 items-center gap-3 rounded-lg border px-3 py-3',
									isCorrect && 'border-good-ink bg-good',
									isWrong && 'border-bad-ink bg-bad',
									!locked && selected && 'border-accent bg-accent-soft',
									!locked && !selected && 'border-line bg-surface hover:bg-sunken',
									locked ? 'cursor-default' : 'cursor-pointer',
									'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink'
								)}
							>
								<input
									type="radio"
									name={question.sessionQuestionId}
									checked={selected}
									disabled={locked}
									onChange={() => select(option.id)}
									className="sr-only"
								/>
								<span
									aria-hidden
									className={clsx(
										'grid size-8 shrink-0 place-items-center rounded-md border font-mono text-sm',
										selected && !locked
											? 'border-accent bg-accent text-canvas'
											: 'border-line text-muted',
										isCorrect && 'border-good-ink bg-good-ink text-canvas',
										isWrong && 'border-bad-ink bg-bad-ink text-canvas'
									)}
								>
									{'ABCD'[position]}
								</span>
								<span className="flex-1">{option.text}</span>
								{isCorrect && (
									<Tag tone="good">
										<CheckCircleIcon weight="fill" size={14} className="mr-1" aria-hidden />
										{t('player.correct')}
									</Tag>
								)}
								{isWrong && (
									<Tag tone="bad">
										<XCircleIcon weight="fill" size={14} className="mr-1" aria-hidden />
										{t('player.incorrect')}
									</Tag>
								)}
							</label>
						);
					})}
				</div>
			</fieldset>

			{question.reveal && (
				<p className="mt-4 rounded-md bg-sunken px-4 py-3 text-sm">
					<span className="font-medium">{t('player.explanation')}: </span>
					{question.reveal.explanation || t('player.noExplanation')}
				</p>
			)}
			{error && (
				<p role="alert" className="mt-4 text-sm text-bad-ink">
					{error}
				</p>
			)}

			<div className="mt-6 flex flex-wrap items-center gap-2">
				<Button
					variant="quiet"
					icon={FlagIcon}
					label={question.flagged ? t('player.flagged') : t('player.flag')}
					aria-pressed={question.flagged}
					onClick={flag}
					className={clsx(question.flagged && 'border-warn-ink bg-warn text-warn-ink')}
				/>
				{mode === 'practice' && !locked && (
					<Button
						variant="positive"
						icon={CheckFatIcon}
						label={t('player.check')}
						disabled={!question.selectedOptionId}
						onClick={check}
					/>
				)}
				{!isLast && (
					<Button
						variant="quiet"
						icon={ClipboardTextIcon}
						label={t('player.review')}
						onClick={() => setReviewing(true)}
						className="sm:ml-auto"
					/>
				)}
			</div>

			<nav aria-label={t('player.palette')} className="mt-8 border-t border-line pt-4">
				<ul className="flex flex-wrap gap-1.5">
					{questions.map((q, i) => (
						<li key={q.sessionQuestionId}>
							<button
								type="button"
								onClick={() => setIndex(i)}
								aria-current={i === index ? 'step' : undefined}
								className={clsx(
									'relative size-10 rounded-md border text-sm',
									i === index ? 'border-ink font-medium' : 'border-line',
									q.selectedOptionId ? 'bg-accent-soft' : 'bg-transparent'
								)}
							>
								{i + 1}
								{q.flagged && (
									<>
										<span
											aria-hidden
											className="absolute right-1 top-1 size-1.5 rounded-full bg-warn-ink"
										/>
										<span className="sr-only">{t('player.flagged')}</span>
									</>
								)}
							</button>
						</li>
					))}
				</ul>
			</nav>

			<div className="mt-6 flex justify-between gap-3 max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-10 max-sm:mt-0 max-sm:border-t max-sm:border-line max-sm:bg-canvas max-sm:p-3 max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
				<Button
					variant="quiet"
					icon={ArrowLeftIcon}
					label={t('player.previous')}
					disabled={index === 0}
					onClick={() => setIndex(index - 1)}
					className="max-sm:flex-1"
				/>
				{isLast ? (
					<Button
						variant="positive"
						icon={PaperPlaneRightIcon}
						label={t('player.review')}
						onClick={() => setReviewing(true)}
						className="max-sm:flex-1"
					/>
				) : (
					<Button
						icon={ArrowRightIcon}
						label={t('player.next')}
						onClick={() => setIndex(index + 1)}
						className="flex-row-reverse max-sm:flex-1"
					/>
				)}
			</div>

			<ReviewDialog
				open={reviewing}
				questions={questions}
				submitting={submitting}
				onClose={() => setReviewing(false)}
				onJump={setIndex}
				onSubmit={() => startSubmit(() => submitQuiz(sessionId))}
			/>
		</div>
	);
}
