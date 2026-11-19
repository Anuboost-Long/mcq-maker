'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode, ViewTransition } from 'react';

export function PageTransition({ children }: Readonly<{ children: ReactNode }>) {
	const pathname = usePathname();

	return (
		<ViewTransition key={pathname} enter="page-in" exit="page-out" default="none">
			{children}
		</ViewTransition>
	);
}
