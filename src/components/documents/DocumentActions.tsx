'use client';

import { ArrowUUpLeftIcon, RocketLaunchIcon } from '@phosphor-icons/react/ssr';
import { useTransition } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { publishDocument, unpublishDocument } from '@/features/documents/actions';

import { DeleteDocumentButton } from './DeleteButtons';
import { RenameDocument } from './RenameDocument';

type DocumentActionsProp = { id: string; title: string; published: boolean; readyCount: number };

export function DocumentActions({
	id,
	title,
	published,
	readyCount
}: Readonly<DocumentActionsProp>) {
	const { t } = useTranslation();
	const [pending, start] = useTransition();

	return (
		<div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
			{published ? (
				<Button
					variant="quiet"
					icon={ArrowUUpLeftIcon}
					label={t('document.unpublish')}
					loading={pending}
					className="col-span-2 sm:col-span-1"
					onClick={() => start(() => unpublishDocument(id))}
				/>
			) : (
				<Button
					variant="positive"
					icon={RocketLaunchIcon}
					label={t('document.publish', { count: readyCount })}
					disabled={readyCount === 0}
					loading={pending}
					className="col-span-2 sm:col-span-1"
					onClick={() => start(() => publishDocument(id))}
				/>
			)}
			<RenameDocument key={title} id={id} title={title} className="w-full sm:w-auto" />
			<DeleteDocumentButton id={id} className="w-full sm:w-auto" />
		</div>
	);
}
