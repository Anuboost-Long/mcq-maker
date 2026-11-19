'use client';

import {
	CircleNotchIcon,
	MedalIcon,
	PlantIcon,
	RocketLaunchIcon,
	TrendUpIcon,
	TrophyIcon
} from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ScoreRevealProp = {
	sessionId: string;
	percentage: number;
	correct: number;
	total: number;
	previous: number | null;
};

const tiers = [
	{ min: 100, key: 'perfect', icon: TrophyIcon },
	{ min: 80, key: 'excellent', icon: MedalIcon },
	{ min: 60, key: 'solid', icon: RocketLaunchIcon },
	{ min: 40, key: 'building', icon: TrendUpIcon },
	{ min: 0, key: 'keepGoing', icon: PlantIcon }
] as const;

const radius = 52;
const circumference = 2 * Math.PI * radius;
const markingMs = 1500;
const countUpMs = 1100;

export function ScoreReveal({
	sessionId,
	percentage,
	correct,
	total,
	previous
}: Readonly<ScoreRevealProp>) {
	const { t } = useTranslation();
	const [revealed, setRevealed] = useState(false);
	const [shown, setShown] = useState(0);

	useEffect(() => {
		const seenKey = `qcm-revealed-${sessionId}`;
		const seen = sessionStorage.getItem(seenKey) === '1';
		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

		let timer: ReturnType<typeof setTimeout> | undefined;
		let frame = 0;

		const showScore = () => {
			sessionStorage.setItem(seenKey, '1');
			setRevealed(true);
			if (seen || reduceMotion) {
				setShown(percentage);
				return;
			}
			const start = performance.now();
			const tick = (now: number) => {
				const progress = Math.min((now - start) / countUpMs, 1);
				setShown(Math.round(percentage * (1 - (1 - progress) ** 3)));
				if (progress < 1) frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
		};

		if (seen || reduceMotion) showScore();
		else timer = setTimeout(showScore, markingMs);

		return () => {
			clearTimeout(timer);
			cancelAnimationFrame(frame);
		};
	}, [sessionId, percentage]);

	if (!revealed) {
		return (
			<div
				role="status"
				className="flex flex-col items-center gap-4 rounded-lg border border-line bg-surface px-6 py-14 text-center"
			>
				<CircleNotchIcon weight="bold" size={40} className="animate-spin text-accent" aria-hidden />
				<p className="font-serif text-xl">{t('results.grading')}</p>
				<div className="h-1 w-48 overflow-hidden rounded-full bg-sunken" aria-hidden>
					<div className="h-full origin-left animate-fill bg-accent" />
				</div>
			</div>
		);
	}

	const tier = tiers.find(({ min }) => percentage >= min) ?? tiers[tiers.length - 1];
	const Glyph = tier.icon;
	const points = previous === null ? null : Math.round(percentage - previous);

	return (
		<section
			aria-label={`${t('results.title')}: ${Math.round(percentage)}%`}
			className="flex flex-col items-center gap-6 rounded-lg border border-line bg-surface px-6 py-8 text-center sm:flex-row sm:gap-8 sm:text-left"
		>
			<div className="relative size-36 shrink-0" aria-hidden>
				<svg viewBox="0 0 120 120" className="size-full -rotate-90">
					<circle
						cx="60"
						cy="60"
						r={radius}
						fill="none"
						strokeWidth="10"
						className="stroke-sunken"
					/>
					<circle
						cx="60"
						cy="60"
						r={radius}
						fill="none"
						strokeWidth="10"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={circumference * (1 - shown / 100)}
						className={percentage >= 40 ? 'stroke-accent' : 'stroke-warn-ink'}
					/>
				</svg>
				<span className="absolute inset-0 grid place-items-center font-serif text-4xl">
					{shown}%
				</span>
			</div>

			<div className="min-w-0">
				<span className="mx-auto mb-3 grid size-11 animate-pop place-items-center rounded-full bg-accent-soft text-accent sm:mx-0">
					<Glyph weight="fill" size={24} aria-hidden />
				</span>
				<h2 className="font-serif text-2xl">{t(`results.tier.${tier.key}.title`)}</h2>
				<p className="mt-1 text-muted">{t(`results.tier.${tier.key}.body`)}</p>
				<p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm sm:justify-start">
					<span className="font-medium">{t('results.score', { correct, total })}</span>
					{points !== null && (
						<span className={clsx(points > 0 ? 'text-good-ink' : 'text-muted')}>
							{points > 0 && t('results.deltaUp', { points })}
							{points < 0 && t('results.deltaDown', { points: Math.abs(points) })}
							{points === 0 && t('results.deltaSame')}
						</span>
					)}
				</p>
			</div>
		</section>
	);
}
