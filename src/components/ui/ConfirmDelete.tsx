'use client';

import { TrashIcon, XIcon } from '@phosphor-icons/react/ssr';
import { useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';

type ConfirmDeleteProp = {
	label: string;
	message: string;
	onConfirm: () => Promise<void>;
	compact?: boolean;
	className?: string;
};

export function ConfirmDelete({
	label,
	message,
	onConfirm,
	compact,
	className
}: Readonly<ConfirmDeleteProp>) {
	const { t } = useTranslation();
	const [confirming, setConfirming] = useState(false);
	const [pending, start] = useTransition();

	if (!confirming) {
		return compact ? (
			<button
				type="button"
				aria-label={label}
				title={label}
				onClick={() => setConfirming(true)}
				className="grid size-10 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-bad hover:text-bad-ink"
			>
				<TrashIcon weight="bold" size={18} aria-hidden />
			</button>
		) : (
			<Button
				variant="dangerQuiet"
				icon={TrashIcon}
				label={label}
				className={className}
				onClick={() => setConfirming(true)}
			/>
		);
	}

	return (
		<div
			role="alert"
			className="col-span-2 flex w-full flex-wrap items-center gap-2 rounded-md bg-bad p-3 text-bad-ink sm:col-span-1"
		>
			<p className="w-full text-sm sm:w-auto sm:flex-1">{message}</p>
			<Button
				variant="danger"
				icon={TrashIcon}
				label={t('document.confirmDelete')}
				loading={pending}
				onClick={() => start(onConfirm)}
			/>
			<Button
				variant="quiet"
				icon={XIcon}
				label={t('document.cancel')}
				onClick={() => setConfirming(false)}
			/>
		</div>
	);
}
