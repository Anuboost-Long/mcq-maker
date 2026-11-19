'use client';

import { MinusIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { useState } from 'react';

type NumberInputProp = {
	label: string;
	value: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const stepClass =
	'grid size-11 shrink-0 place-items-center text-muted transition-colors hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-40';

export function NumberInput({ label, value, min, max, onChange }: Readonly<NumberInputProp>) {
	const [text, setText] = useState(String(value));

	const commit = (n: number) => {
		const next = clamp(n, min, max);
		setText(String(next));
		onChange(next);
	};

	return (
		<div className="inline-flex items-center overflow-hidden rounded-md border border-line bg-surface focus-within:border-accent">
			<button
				type="button"
				aria-label={`${label} −1`}
				disabled={value <= min}
				onClick={() => commit(value - 1)}
				className={stepClass}
			>
				<MinusIcon weight="bold" size={16} aria-hidden />
			</button>
			<input
				type="text"
				inputMode="numeric"
				autoComplete="off"
				aria-label={label}
				value={text}
				onChange={(e) => {
					const digits = e.target.value.replaceAll(/\D/g, '');
					setText(digits);
					if (digits) onChange(clamp(Number(digits), min, max));
				}}
				onBlur={() => commit(Number(text) || min)}
				className="h-11 w-16 border-x border-line bg-transparent text-center text-sm font-medium"
			/>
			<button
				type="button"
				aria-label={`${label} +1`}
				disabled={value >= max}
				onClick={() => commit(value + 1)}
				className={stepClass}
			>
				<PlusIcon weight="bold" size={16} aria-hidden />
			</button>
		</div>
	);
}
