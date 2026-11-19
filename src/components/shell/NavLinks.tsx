'use client';

import type { Icon } from '@phosphor-icons/react';
import { BooksIcon, HouseIcon, ListChecksIcon, PlayCircleIcon } from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const links: { href: string; key: string; icon: Icon }[] = [
	{ href: '/dashboard', key: 'nav.dashboard', icon: HouseIcon },
	{ href: '/library', key: 'nav.library', icon: BooksIcon },
	{ href: '/questions', key: 'nav.questions', icon: ListChecksIcon },
	{ href: '/quiz/new', key: 'nav.newQuiz', icon: PlayCircleIcon }
];

export function NavLinks({ variant }: Readonly<{ variant: 'top' | 'bottom' }>) {
	const pathname = usePathname();
	const { t } = useTranslation();
	if (variant === 'bottom' && /^\/quiz\/(?!new$)[^/]+$/.test(pathname)) return null;

	const bottom = variant === 'bottom';

	return (
		<nav
			aria-label="Main"
			className={clsx(
				!bottom && 'hidden sm:block',
				bottom &&
					'fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:hidden'
			)}
		>
			<ul className={clsx('flex', bottom ? 'mx-auto max-w-md px-2' : 'gap-1')}>
				{links.map(({ href, key, icon: Glyph }) => {
					const active = pathname.startsWith(href);
					return (
						<li key={href} className={clsx(bottom && 'flex-1')}>
							<Link
								href={href}
								aria-current={active ? 'page' : undefined}
								className={clsx(
									'flex items-center transition-colors',
									bottom
										? 'flex-col gap-1 rounded-lg py-1 text-xs'
										: 'h-9 gap-2 rounded-md px-3 text-sm font-medium',
									active ? 'text-ink' : 'text-muted hover:text-ink',
									active && !bottom && 'bg-sunken'
								)}
							>
								<span
									className={clsx(
										bottom && 'grid h-8 w-14 place-items-center rounded-full transition-colors',
										bottom && active && 'bg-accent-soft text-accent'
									)}
								>
									<Glyph weight={active ? 'fill' : 'bold'} size={bottom ? 22 : 16} aria-hidden />
								</span>
								<span className={clsx(active && bottom && 'font-medium')}>{t(key)}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
