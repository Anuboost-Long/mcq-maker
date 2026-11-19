import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { QuizPlayer } from '@/components/quiz/QuizPlayer';
import { BackLink } from '@/components/ui/BackLink';
import { Loading } from '@/components/ui/Loading';
import { toPlayerQuestion } from '@/features/quizzes/player';
import { findSession } from '@/features/quizzes/store';
import { nowMs } from '@/features/quizzes/timing';
import { t } from '@/lib/i18n';
import { currentDeviceId } from '@/lib/device';

async function Player({ params }: Readonly<Pick<PageProps<'/quiz/[sessionId]'>, 'params'>>) {
	await connection();
	const { sessionId } = await params;
	const session = await findSession(await currentDeviceId(), sessionId);
	if (!session) notFound();
	if (session.submittedAt) redirect(`/quiz/${sessionId}/results`);

	return (
		<QuizPlayer
			sessionId={session.id}
			mode={session.config.mode}
			timing={session.config.timing}
			startedAt={session.startedAt}
			serverNow={nowMs()}
			questions={session.questions.map(toPlayerQuestion)}
		/>
	);
}

export default function QuizPage({ params }: PageProps<'/quiz/[sessionId]'>) {
	return (
		<>
			<BackLink href="/dashboard" label={t('nav.dashboard')} />
			<Suspense fallback={<Loading />}>
				<Player params={params} />
			</Suspense>
		</>
	);
}
