import { ArrowLeftIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

type BackLinkProp = { href: string; label: string };

export function BackLink({ href, label }: Readonly<BackLinkProp>) {
	return (
		<Link
			href={href}
			className="-ml-2.5 mb-5 inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-muted transition-colors hover:bg-sunken hover:text-ink"
		>
			<ArrowLeftIcon weight="bold" size={16} aria-hidden />
			{label}
		</Link>
	);
}
