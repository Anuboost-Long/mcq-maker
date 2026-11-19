'use client';

import {
	CheckIcon,
	ExamIcon,
	LightbulbIcon,
	PlayIcon,
	WarningCircleIcon
} from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import { type ReactNode, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { startQuiz } from '@/features/quizzes/actions';
import { eligibleQuestions } from '@/features/quizzes/selection';
import type {
	DifficultyFilter,
	Ordering,
	Question,
	QuizMode,
	Timing
} from '@/features/quizzes/types';

type QuizSetupFormProp = {
	documents: { id: string; title: string }[];
	pool: Pick<Question, 'documentId' | 'difficulty'>[];
};

const counts = [10, 20, 50, 'custom', 'all'] as const;

export function QuizSetupForm({ documents, pool }: Readonly<QuizSetupFormProp>) {
	const { t } = useTranslation();
	const [documentIds, setDocumentIds] = useState(documents.map((d) => d.id));
	const [countChoice, setCountChoice] = useState<(typeof counts)[number]>(10);
	const [custom, setCustom] = useState(15);
	const [difficulty, setDifficulty] = useState<DifficultyFilter>('mixed');
	const [ordering, setOrdering] = useState<Ordering>('mixed');
	const [mode, setMode] = useState<QuizMode>('practice');
	const [timerKind, setTimerKind] = useState<Timing['kind']>('none');
	const [minutes, setMinutes] = useState(15);
	const [pending, start] = useTransition();

	const eligible = eligibleQuestions(pool, { documentIds, difficulty }).length;
	const requested =
		countChoice === 'all' ? eligible : countChoice === 'custom' ? custom : countChoice;

	const toggleDocument = (id: string) =>
		setDocumentIds((ids) => (ids.includes(id) ? ids.filter((d) => d !== id) : [...ids, id]));

	const submit = () =>
		start(async () => {
			await startQuiz({
				documentIds,
				difficulty,
				ordering,
				mode,
				timing: timerKind === 'countdown' ? { kind: 'countdown', minutes } : { kind: timerKind },
				count: countChoice === 'all' ? 'all' : requested
			});
		});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
			className="space-y-8"
		>
			<Group legend={t('setup.documents')}>
				<ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
					{documents.map((d) => (
						<li key={d.id}>
							<label className="group flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 hover:bg-sunken">
								<input
									type="checkbox"
									checked={documentIds.includes(d.id)}
									onChange={() => toggleDocument(d.id)}
									className="peer sr-only"
								/>
								<span className="grid size-5 shrink-0 place-items-center rounded border border-line text-canvas peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
									<CheckIcon weight="bold" size={12} aria-hidden />
								</span>
								<span className="min-w-0 flex-1">{d.title}</span>
							</label>
						</li>
					))}
				</ul>
			</Group>

			<Group legend={t('setup.count')}>
				<div className="flex flex-wrap gap-2">
					{counts.map((c) => (
						<Chip
							key={c}
							name="count"
							checked={countChoice === c}
							onSelect={() => setCountChoice(c)}
							label={typeof c === 'number' ? String(c) : t(`common.${c}`)}
						/>
					))}
				</div>
				{countChoice === 'custom' && (
					<div className="mt-3">
						<NumberInput
							label={t('setup.customCount')}
							value={custom}
							min={1}
							max={500}
							onChange={setCustom}
						/>
					</div>
				)}
			</Group>

			<Group legend={t('setup.difficulty')} hint={t('setup.difficultyHint')}>
				<div className="flex flex-wrap gap-2">
					{(['mixed', 'easy', 'medium', 'hard'] as const).map((d) => (
						<Chip
							key={d}
							name="difficulty"
							checked={difficulty === d}
							onSelect={() => setDifficulty(d)}
							label={t(`common.${d}`)}
						/>
					))}
				</div>
			</Group>

			<Group legend={t('setup.order')}>
				<div className="flex flex-wrap gap-2">
					<Chip
						name="ordering"
						checked={ordering === 'mixed'}
						onSelect={() => setOrdering('mixed')}
						label={t('setup.orderMixed')}
					/>
					<Chip
						name="ordering"
						checked={ordering === 'sequential'}
						onSelect={() => setOrdering('sequential')}
						label={t('setup.orderSequential')}
					/>
				</div>
			</Group>

			<Group legend={t('setup.mode')}>
				<div className="grid gap-2 sm:grid-cols-2">
					<ModeCard
						checked={mode === 'practice'}
						onSelect={() => setMode('practice')}
						icon={<LightbulbIcon weight="bold" size={20} aria-hidden />}
						title={t('setup.modePractice')}
						hint={t('setup.modePracticeHint')}
					/>
					<ModeCard
						checked={mode === 'exam'}
						onSelect={() => setMode('exam')}
						icon={<ExamIcon weight="bold" size={20} aria-hidden />}
						title={t('setup.modeExam')}
						hint={t('setup.modeExamHint')}
					/>
				</div>
			</Group>

			<Group legend={t('setup.timer')}>
				<div className="flex flex-wrap gap-2">
					{(['none', 'stopwatch', 'countdown'] as const).map((kind) => (
						<Chip
							key={kind}
							name="timer"
							checked={timerKind === kind}
							onSelect={() => setTimerKind(kind)}
							label={t(`setup.timer${kind[0].toUpperCase()}${kind.slice(1)}`)}
						/>
					))}
				</div>
				{timerKind === 'countdown' && (
					<div className="mt-3 flex flex-wrap items-center gap-3">
						<NumberInput
							label={t('setup.timerMinutes')}
							value={minutes}
							min={1}
							max={600}
							onChange={setMinutes}
						/>
						<span className="text-sm text-muted">{t('setup.timerMinutes')}</span>
					</div>
				)}
				{timerKind === 'countdown' && (
					<p className="mt-2 text-sm text-muted">{t('setup.timerHint')}</p>
				)}
			</Group>

			<div className="space-y-4 border-t border-line pt-6">
				<EligibilityNote eligible={eligible} requested={requested} />
				<Button
					type="submit"
					icon={PlayIcon}
					label={pending ? t('setup.starting') : t('setup.start')}
					disabled={eligible === 0}
					loading={pending}
					className="max-sm:w-full"
				/>
			</div>
		</form>
	);
}

type GroupProp = { legend: string; hint?: string; children: ReactNode };

function Group({ legend, hint, children }: Readonly<GroupProp>) {
	return (
		<fieldset className="min-w-0">
			<legend className="mb-3 font-serif text-lg">{legend}</legend>
			{children}
			{hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
		</fieldset>
	);
}

type ChipProp = { name: string; checked: boolean; label: string; onSelect: () => void };

function Chip({ name, checked, label, onSelect }: Readonly<ChipProp>) {
	return (
		<label
			className={clsx(
				'flex h-11 cursor-pointer items-center rounded-md border px-4 text-sm font-medium transition-colors',
				checked
					? 'border-accent bg-accent-soft text-ink'
					: 'border-line bg-surface text-muted hover:bg-sunken hover:text-ink',
				'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink'
			)}
		>
			<input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
			{label}
		</label>
	);
}

type ModeCardProp = {
	checked: boolean;
	icon: ReactNode;
	title: string;
	hint: string;
	onSelect: () => void;
};

function ModeCard({ checked, icon, title, hint, onSelect }: Readonly<ModeCardProp>) {
	return (
		<label
			className={clsx(
				'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
				checked ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:bg-sunken',
				'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink'
			)}
		>
			<input type="radio" name="mode" checked={checked} onChange={onSelect} className="sr-only" />
			<span
				className={clsx(
					'grid size-9 shrink-0 place-items-center rounded-md',
					checked ? 'bg-accent text-canvas' : 'bg-sunken text-muted'
				)}
			>
				{icon}
			</span>
			<span className="min-w-0">
				<span className="block font-medium">{title}</span>
				<span className="block text-sm text-muted">{hint}</span>
			</span>
		</label>
	);
}

type EligibilityNoteProp = { eligible: number; requested: number };

function EligibilityNote({ eligible, requested }: Readonly<EligibilityNoteProp>) {
	const { t } = useTranslation();
	let text = t('setup.eligible', { count: eligible });
	if (eligible === 0) text = t('setup.none');
	else if (eligible < requested) text = t('setup.fewer', { available: eligible });

	return (
		<p
			aria-live="polite"
			className={clsx(
				'flex items-start gap-2 text-sm',
				eligible === 0 ? 'text-bad-ink' : 'text-muted'
			)}
		>
			{(eligible === 0 || eligible < requested) && (
				<WarningCircleIcon weight="bold" size={18} className="mt-0.5 shrink-0" aria-hidden />
			)}
			{text}
		</p>
	);
}
