import { BooksIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { QuizSetupForm } from '@/components/quiz/QuizSetupForm';
import { buttonClass } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { PageHeader } from '@/components/ui/PageHeader';
import { getBank, publishedDocuments } from '@/features/documents/store';
import { t } from '@/lib/i18n';

async function Setup() {
	await connection();
	const documents = await publishedDocuments();
	if (documents.length === 0) {
		return (
			<EmptyState
				icon={BooksIcon}
				title={t('questions.bankEmpty')}
				body={t('questions.bankEmptyBody')}
				action={
					<Link href="/library" className={buttonClass()}>
						<BooksIcon weight="bold" size={18} aria-hidden />
						{t('nav.library')}
					</Link>
				}
			/>
		);
	}
	const pool = (await getBank()).map(({ documentId, difficulty }) => ({ documentId, difficulty }));
	return (
		<div className="max-w-xl">
			<QuizSetupForm documents={documents} pool={pool} />
		</div>
	);
}

export default function NewQuizPage() {
	return (
		<>
			<PageHeader
				title={t('setup.title')}
				subtitle={t('setup.subtitle')}
				back={{ href: '/dashboard', label: t('nav.dashboard') }}
			/>
			<Suspense fallback={<Loading />}>
				<Setup />
			</Suspense>
		</>
	);
}
