'use client';

import { HourglassMediumIcon, TimerIcon } from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Timing } from '@/features/quizzes/types';

type QuizTimerProp = {
	timing: Exclude<Timing, { kind: 'none' }>;
	startedAt: number;
	serverNow: number;
	onExpire: () => void;
};

function clock(totalSeconds: number) {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const h = Math.floor(seconds / 3600);
	const m = String(Math.floor((seconds % 3600) / 60)).padStart(h > 0 ? 2 : 1, '0');
	const s = String(seconds % 60).padStart(2, '0');
	return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export function QuizTimer({ timing, startedAt, serverNow, onExpire }: Readonly<QuizTimerProp>) {
	const { t } = useTranslation();
	const [now, setNow] = useState<number | null>(null);
	const expired = useRef(false);

	const totalMs = timing.kind === 'countdown' ? timing.minutes * 60_000 : 0;
	const remainingMs = now === null ? totalMs : startedAt + totalMs - now;

	useEffect(() => {
		const skew = serverNow - Date.now();
		const tick = () => setNow(Date.now() + skew);
		tick();
		const interval = setInterval(tick, 250);
		return () => clearInterval(interval);
	}, [serverNow]);

	useEffect(() => {
		if (timing.kind === 'countdown' && now !== null && remainingMs <= 0 && !expired.current) {
			expired.current = true;
			onExpire();
		}
	}, [timing.kind, now, remainingMs, onExpire]);

	const countdown = timing.kind === 'countdown';
	const seconds = countdown ? remainingMs / 1000 : ((now ?? startedAt) - startedAt) / 1000;
	const fraction = countdown ? Math.max(0, remainingMs / totalMs) : 0;
	const urgent = countdown && remainingMs <= 10_000;
	const low = countdown && (remainingMs <= 60_000 || fraction <= 0.2);
	const Glyph = countdown ? HourglassMediumIcon : TimerIcon;

	return (
		<div className="sticky top-14 z-10 -mx-4 mb-5 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur">
			<div className="flex items-center justify-between gap-3">
				<span className="flex items-center gap-2 text-sm text-muted">
					<Glyph weight="bold" size={16} aria-hidden />
					{countdown ? t('player.timeLeft') : t('player.elapsed')}
				</span>
				<time
					dateTime={`PT${Math.max(0, Math.floor(seconds))}S`}
					className={clsx(
						'font-mono text-lg font-medium tabular-nums',
						urgent ? 'text-bad-ink' : low ? 'text-warn-ink' : 'text-ink'
					)}
				>
					{now === null ? '--:--' : clock(seconds)}
				</time>
			</div>
			{countdown && (
				<div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
					<div
						className={clsx(
							'h-full origin-left transition-[width] duration-300 ease-linear',
							urgent ? 'bg-bad-ink' : low ? 'bg-warn-ink' : 'bg-accent'
						)}
						style={{ width: `${fraction * 100}%` }}
					/>
				</div>
			)}
			<p className="sr-only" aria-live="assertive">
				{countdown && now !== null && remainingMs <= 0 ? t('player.timeUp') : ''}
			</p>
		</div>
	);
}
