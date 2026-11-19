import clsx from 'clsx';
import type { ReactNode } from 'react';

type TagProp = { tone?: 'neutral' | 'good' | 'bad' | 'warn'; children: ReactNode };

export function Tag({ tone = 'neutral', children }: Readonly<TagProp>) {
	return (
		<span
			className={clsx(
				'inline-flex items-center rounded-full',
				tone === 'neutral' && 'bg-sunken text-muted',
				tone === 'good' && 'bg-good text-good-ink',
				tone === 'bad' && 'bg-bad text-bad-ink',
				tone === 'warn' && 'bg-warn text-warn-ink',
				'px-2 py-0.5 text-xs font-medium'
			)}
		>
			{children}
		</span>
	);
}
