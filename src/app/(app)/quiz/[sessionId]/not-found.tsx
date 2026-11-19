import { HouseIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import { buttonClass } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/ui/EmptyState';
import { t } from '@/lib/i18n';

export default function QuizNotFound() {
	return (
		<EmptyState
			icon={MagnifyingGlassIcon}
			title={t('notFound.title')}
			body={t('notFound.body')}
			action={
				<Link href="/dashboard" className={buttonClass()}>
					<HouseIcon weight="bold" size={18} aria-hidden />
					{t('notFound.back')}
				</Link>
			}
		/>
	);
}
