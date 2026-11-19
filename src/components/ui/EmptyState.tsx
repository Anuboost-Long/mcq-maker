import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

type EmptyStateProp = { icon?: Icon; title: string; body: string; action?: ReactNode };

export function EmptyState({ icon: Glyph, title, body, action }: Readonly<EmptyStateProp>) {
	return (
		<div className="flex flex-col items-center rounded-lg border border-dashed border-line px-6 py-12 text-center">
			{Glyph && (
				<span className="mb-4 grid size-12 place-items-center rounded-lg bg-sunken text-muted">
					<Glyph weight="bold" size={22} aria-hidden />
				</span>
			)}
			<h2 className="font-serif text-xl">{title}</h2>
			<p className="mx-auto mt-1 max-w-sm text-muted">{body}</p>
			{action && <div className="mt-5">{action}</div>}
		</div>
	);
}
