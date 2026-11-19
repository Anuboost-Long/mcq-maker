'use client';

import { CheckIcon, MinusIcon } from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';

type CheckboxProp = {
	checked: boolean;
	indeterminate?: boolean;
	label: string;
	onChange: () => void;
	className?: string;
};

export function Checkbox({
	checked,
	indeterminate,
	label,
	onChange,
	className
}: Readonly<CheckboxProp>) {
	const input = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (input.current) input.current.indeterminate = Boolean(indeterminate) && !checked;
	}, [indeterminate, checked]);

	const filled = checked || indeterminate;

	return (
		<span className={clsx('relative inline-grid size-10 shrink-0 place-items-center', className)}>
			<input
				ref={input}
				type="checkbox"
				aria-label={label}
				checked={checked}
				onChange={onChange}
				className="peer absolute inset-0 cursor-pointer opacity-0"
			/>
			<span
				aria-hidden
				className={clsx(
					'grid size-5 place-items-center rounded border text-canvas transition-colors',
					filled ? 'border-accent bg-accent' : 'border-line bg-surface',
					'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink'
				)}
			>
				{checked && <CheckIcon weight="bold" size={12} />}
				{!checked && indeterminate && <MinusIcon weight="bold" size={12} />}
			</span>
		</span>
	);
}
