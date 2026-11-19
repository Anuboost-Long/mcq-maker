'use client';

import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';

type SelectOption = { value: string; label: string };

type SelectProp = {
	label: string;
	value: string;
	options: SelectOption[];
	onChange: (value: string) => void;
	className?: string;
};

export function Select({ label, value, options, onChange, className }: Readonly<SelectProp>) {
	const [open, setOpen] = useState(false);
	const root = useRef<HTMLDivElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const name = useId();
	const current = options.find((o) => o.value === value) ?? options[0];
	const filtered = current.value !== options[0].value;

	useEffect(() => {
		if (!open) return;
		const closeOnOutsidePress = (event: PointerEvent) => {
			if (!root.current?.contains(event.target as Node)) setOpen(false);
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			setOpen(false);
			trigger.current?.focus();
		};
		root.current?.querySelector<HTMLInputElement>('input:checked')?.focus();
		document.addEventListener('pointerdown', closeOnOutsidePress);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('pointerdown', closeOnOutsidePress);
			document.removeEventListener('keydown', closeOnEscape);
		};
	}, [open]);

	const finish = () => {
		setOpen(false);
		trigger.current?.focus();
	};

	return (
		<div ref={root} className={clsx('relative min-w-0', className)}>
			<button
				ref={trigger}
				type="button"
				aria-label={`${label}: ${current.label}`}
				aria-haspopup="true"
				aria-expanded={open}
				onClick={() => setOpen((isOpen) => !isOpen)}
				className={clsx(
					'flex h-11 w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-left text-sm transition-colors hover:bg-sunken',
					filtered || open ? 'border-accent' : 'border-line'
				)}
			>
				<span className="truncate">{current.label}</span>
				<CaretDownIcon
					weight="bold"
					size={14}
					aria-hidden
					className={clsx('shrink-0 text-muted transition-transform', open && 'rotate-180')}
				/>
			</button>

			{open && (
				<fieldset
					onKeyDown={(event) => event.key === 'Enter' && finish()}
					className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 min-w-0 overflow-y-auto rounded-lg border border-line bg-surface p-1"
				>
					<legend className="sr-only">{label}</legend>
					{options.map((option) => (
						<label
							key={option.value}
							className={clsx(
								'flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-3 text-sm hover:bg-sunken',
								'has-checked:bg-accent-soft has-checked:font-medium has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-ink'
							)}
						>
							<input
								type="radio"
								name={name}
								value={option.value}
								checked={option.value === value}
								onChange={() => onChange(option.value)}
								onClick={(event) => event.detail > 0 && finish()}
								className="sr-only"
							/>
							<span className="min-w-0 flex-1 wrap-break-word">{option.label}</span>
							{option.value === value && (
								<CheckIcon weight="bold" size={14} className="shrink-0 text-accent" aria-hidden />
							)}
						</label>
					))}
				</fieldset>
			)}
		</div>
	);
}
