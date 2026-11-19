import { BooksIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { QuestionBrowser } from '@/components/questions/QuestionBrowser';
import { buttonClass } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { PageHeader } from '@/components/ui/PageHeader';
import { getBank, publishedDocuments } from '@/features/documents/store';
import { t } from '@/lib/i18n';

async function Bank() {
	await connection();
	const questions = getBank();
	if (questions.length === 0) {
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
	return <QuestionBrowser questions={questions} documents={publishedDocuments()} />;
}

export default function QuestionsPage() {
	return (
		<>
			<PageHeader title={t('questions.title')} subtitle={t('questions.subtitle')} />
			<Suspense fallback={<Loading />}>
				<Bank />
			</Suspense>
		</>
	);
}
