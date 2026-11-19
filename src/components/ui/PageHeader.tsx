import type { ReactNode } from 'react';

import { BackLink } from './BackLink';

type PageHeaderProp = {
	title: string;
	subtitle?: string;
	action?: ReactNode;
	back?: { href: string; label: string };
};

export function PageHeader({ title, subtitle, action, back }: Readonly<PageHeaderProp>) {
	return (
		<header className="mb-8">
			{back && <BackLink href={back.href} label={back.label} />}
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="min-w-0">
					<h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{title}</h1>
					{subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
				</div>
				{action}
			</div>
		</header>
	);
}
