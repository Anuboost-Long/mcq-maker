'use client';

import { CloudArrowUpIcon } from '@phosphor-icons/react/ssr';
import axios from 'axios';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ImportResult } from '@/features/documents/types';

type Upload = { name: string; percent: number; result?: ImportResult | 'failed' };

export function FileDropzone() {
	const { t } = useTranslation();
	const router = useRouter();
	const [uploads, setUploads] = useState<Upload[]>([]);
	const [dragging, setDragging] = useState(false);

	const patch = (name: string, change: Partial<Upload>) =>
		setUploads((all) => all.map((u) => (u.name === name ? { ...u, ...change } : u)));

	const upload = async (file: File) => {
		const body = new FormData();
		body.set('file', file);
		try {
			const { data } = await axios.post<ImportResult>('/api/documents', body, {
				validateStatus: () => true,
				onUploadProgress: ({ progress = 0 }) =>
					patch(file.name, { percent: Math.round(progress * 100) })
			});
			patch(file.name, { percent: 100, result: data });
		} catch {
			patch(file.name, { result: 'failed' });
		}
	};

	const addFiles = async (list: FileList | null) => {
		const files = Array.from(list ?? []);
		setUploads((all) => [...files.map((f) => ({ name: f.name, percent: 0 })), ...all]);
		await Promise.all(files.map(upload));
		router.refresh();
	};

	const statusText = ({ percent, result }: Upload) => {
		if (!result) return t('library.uploading', { percent });
		if (result === 'failed') return t('library.errors.failed');
		if (!result.ok) return t(`library.errors.${result.error}`);
		return result.duplicate
			? t('library.duplicate')
			: t('library.imported', { ready: result.ready, total: result.total });
	};

	return (
		<div>
			<label
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					addFiles(e.dataTransfer.files);
				}}
				className={clsx(
					'flex cursor-pointer flex-col items-center rounded-lg border border-dashed px-6 py-10 text-center',
					dragging ? 'border-ink bg-sunken' : 'border-line hover:bg-sunken',
					'transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ink'
				)}
			>
				<span className="mb-3 grid size-12 place-items-center rounded-lg bg-sunken text-muted">
					<CloudArrowUpIcon weight="bold" size={24} aria-hidden />
				</span>
				<span className="font-medium">{t('library.dropTitle')}</span>
				<span className="mt-1 text-sm text-muted">{t('library.dropHint')}</span>
				<input
					type="file"
					multiple
					accept=".docx,.pdf"
					className="sr-only"
					onChange={(e) => {
						addFiles(e.target.files);
						e.target.value = '';
					}}
				/>
			</label>

			{uploads.length > 0 && (
				<ul className="mt-4 divide-y divide-line border-y border-line" aria-live="polite">
					{uploads.map((u, index) => (
						<li key={`${u.name}-${index}`} className="flex items-center justify-between gap-4 py-3">
							<span className="min-w-0 truncate">{u.name}</span>
							<span
								className={clsx(
									'shrink-0 text-sm',
									u.result && (u.result === 'failed' || !u.result.ok)
										? 'text-bad-ink'
										: 'text-muted'
								)}
							>
								{statusText(u)}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
