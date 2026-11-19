import { ExamIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { Suspense } from 'react';

import { NavLinks } from '@/components/shell/NavLinks';
import { PageTransition } from '@/components/shell/PageTransition';
import { t } from '@/lib/i18n';

export default function AppLayout({ children }: LayoutProps<'/'>) {
	return (
		<>
			<header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
				<div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
					<Link
						href="/dashboard"
						className="flex items-center gap-2 font-serif text-xl tracking-tight"
					>
						<span className="grid size-8 place-items-center rounded-md bg-accent-soft text-accent">
							<ExamIcon weight="bold" size={18} aria-hidden />
						</span>
						{t('app.name')}
					</Link>
					<Suspense fallback={null}>
						<NavLinks variant="top" />
					</Suspense>
				</div>
			</header>
			<main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-32 pt-8 sm:pb-12 sm:pt-10">
				<Suspense fallback={null}>
					<PageTransition>{children}</PageTransition>
				</Suspense>
			</main>
			<Suspense fallback={null}>
				<NavLinks variant="bottom" />
			</Suspense>
		</>
	);
}
