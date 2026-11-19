import { CircleNotchIcon } from '@phosphor-icons/react/ssr';

import { t } from '@/lib/i18n';

export function Loading() {
	return (
		<div role="status" aria-live="polite" className="space-y-3">
			<p className="flex items-center gap-2 text-sm text-muted">
				<CircleNotchIcon weight="bold" size={16} className="animate-spin" aria-hidden />
				{t('common.loading')}
			</p>
			{[0, 1, 2].map((row) => (
				<div key={row} className="h-16 animate-pulse rounded-lg bg-sunken" />
			))}
		</div>
	);
}
