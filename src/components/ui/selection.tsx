'use client';

import { TrashIcon, XIcon } from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import { createContext, type ReactNode, useContext, useMemo, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { Checkbox } from './Checkbox';

type SelectionState = {
	keys: string[];
	selected: string[];
	isSelected: (key: string) => boolean;
	toggle: (key: string) => void;
	toggleAll: () => void;
	clear: () => void;
};

const SelectionContext = createContext<SelectionState | null>(null);

function useSelection() {
	const state = useContext(SelectionContext);
	if (!state) throw new Error('Selection components must be inside SelectionProvider');
	return state;
}

type SelectionProviderProp = { keys: string[]; children: ReactNode };

export function SelectionProvider({ keys, children }: Readonly<SelectionProviderProp>) {
	const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());

	const state = useMemo<SelectionState>(() => {
		const selected = keys.filter((key) => chosen.has(key));
		return {
			keys,
			selected,
			isSelected: (key) => chosen.has(key),
			toggle: (key) =>
				setChosen((current) => {
					const next = new Set(current);
					if (!next.delete(key)) next.add(key);
					return next;
				}),
			toggleAll: () => setChosen(selected.length === keys.length ? new Set() : new Set(keys)),
			clear: () => setChosen(new Set())
		};
	}, [keys, chosen]);

	return <SelectionContext.Provider value={state}>{children}</SelectionContext.Provider>;
}

type SelectionToolbarProp = {
	deleteSelected: (keys: string[]) => Promise<void>;
	confirmKey: string;
	className?: string;
};

export function SelectionToolbar({
	deleteSelected,
	confirmKey,
	className
}: Readonly<SelectionToolbarProp>) {
	const { t } = useTranslation();
	const { keys, selected, toggleAll, clear } = useSelection();
	const [confirming, setConfirming] = useState(false);
	const [pending, start] = useTransition();
	const count = selected.length;
	const asking = confirming && count > 0;

	const finish = () => {
		setConfirming(false);
		clear();
	};

	return (
		<div
			className={clsx(
				'sticky top-14 z-10 rounded-lg border px-2 py-1.5',
				count > 0 ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
				className
			)}
		>
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
				<label className="flex min-h-10 cursor-pointer items-center gap-1 text-sm font-medium">
					<Checkbox
						checked={keys.length > 0 && count === keys.length}
						indeterminate={count > 0 && count < keys.length}
						label={t('document.selectAll')}
						onChange={toggleAll}
					/>
					{t('document.selectAll')}
				</label>
				{count > 0 && (
					<>
						<span className="text-sm text-muted" aria-live="polite">
							{t('document.selectedCount', { count })}
						</span>
						<div className="ml-auto flex items-center gap-1">
							<Button
								variant="dangerQuiet"
								icon={TrashIcon}
								label={t('document.deleteSelected')}
								iconOnlyOnMobile
								aria-expanded={asking}
								onClick={() => setConfirming((open) => !open)}
							/>
							<button
								type="button"
								aria-label={t('document.clearSelection')}
								title={t('document.clearSelection')}
								onClick={finish}
								className="grid size-10 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink"
							>
								<XIcon weight="bold" size={18} aria-hidden />
							</button>
						</div>
					</>
				)}
			</div>

			{asking && (
				<div
					role="alert"
					className="mt-1.5 mb-1 flex flex-wrap items-center gap-2 rounded-md bg-bad p-3 text-bad-ink"
				>
					<p className="w-full text-sm sm:w-auto sm:flex-1">{t(confirmKey, { count })}</p>
					<Button
						variant="danger"
						icon={TrashIcon}
						label={t('document.confirmDelete')}
						loading={pending}
						onClick={() =>
							start(async () => {
								await deleteSelected(selected);
								finish();
							})
						}
					/>
					<Button
						variant="quiet"
						icon={XIcon}
						label={t('document.cancel')}
						onClick={() => setConfirming(false)}
					/>
				</div>
			)}
		</div>
	);
}

type SelectableRowProp = {
	itemKey: string;
	label: string;
	centered?: boolean;
	className?: string;
	children: ReactNode;
};

export function SelectableRow({
	itemKey,
	label,
	centered,
	className,
	children
}: Readonly<SelectableRowProp>) {
	const { isSelected, toggle } = useSelection();
	const selected = isSelected(itemKey);

	return (
		<li
			className={clsx(
				'flex gap-1 transition-colors',
				centered ? 'items-center' : 'items-start',
				selected && 'bg-accent-soft',
				className
			)}
		>
			<Checkbox
				checked={selected}
				label={label}
				onChange={() => toggle(itemKey)}
				className={clsx(!centered && '-mt-1', '-ml-2')}
			/>
			<div className="min-w-0 flex-1">{children}</div>
		</li>
	);
}
