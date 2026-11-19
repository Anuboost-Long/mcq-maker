'use client';

import { MagnifyingGlassIcon, XCircleIcon } from '@phosphor-icons/react/ssr';
import { useTranslation } from 'react-i18next';

type SearchInputProp = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	className?: string;
};

export function SearchInput({ label, value, onChange, className }: Readonly<SearchInputProp>) {
	const { t } = useTranslation();

	return (
		<div className={`relative ${className ?? ''}`}>
			<MagnifyingGlassIcon
				weight="bold"
				size={16}
				aria-hidden
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
			/>
			<input
				type="text"
				inputMode="search"
				enterKeyHint="search"
				autoComplete="off"
				aria-label={label}
				placeholder={label}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="h-11 w-full min-w-0 appearance-none rounded-md border border-line bg-surface pl-9 pr-10 text-sm transition-colors placeholder:text-muted focus:border-accent"
			/>
			{value && (
				<button
					type="button"
					aria-label={t('common.clear')}
					title={t('common.clear')}
					onClick={() => onChange('')}
					className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-ink"
				>
					<XCircleIcon weight="fill" size={18} aria-hidden />
				</button>
			)}
		</div>
	);
}
