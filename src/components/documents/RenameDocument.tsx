'use client';

import { CheckIcon, PencilSimpleIcon, XIcon } from '@phosphor-icons/react/ssr';
import { useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { renameDocument } from '@/features/documents/actions';

type RenameDocumentProp = { id: string; title: string; className?: string };

export function RenameDocument({ id, title, className }: Readonly<RenameDocumentProp>) {
	const { t } = useTranslation();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(title);
	const [pending, start] = useTransition();

	if (!editing) {
		return (
			<Button
				variant="quiet"
				icon={PencilSimpleIcon}
				label={t('document.rename')}
				className={className}
				onClick={() => setEditing(true)}
			/>
		);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				start(async () => {
					await renameDocument(id, name);
					setEditing(false);
				});
			}}
			className="col-span-2 flex w-full flex-wrap items-center gap-2 sm:col-span-1"
		>
			<input
				autoFocus
				aria-label={t('document.nameLabel')}
				value={name}
				maxLength={120}
				onChange={(e) => setName(e.target.value)}
				className="h-11 min-w-0 flex-1 basis-full rounded-md border border-line bg-surface px-3 sm:basis-0"
			/>
			<Button
				type="submit"
				variant="positive"
				icon={CheckIcon}
				label={t('document.saveName')}
				disabled={!name.trim()}
				loading={pending}
			/>
			<Button
				variant="quiet"
				icon={XIcon}
				label={t('document.cancel')}
				onClick={() => setEditing(false)}
			/>
		</form>
	);
}
