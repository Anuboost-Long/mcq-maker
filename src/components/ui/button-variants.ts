import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'positive' | 'quiet' | 'danger' | 'dangerQuiet';

export const buttonClass = (variant: ButtonVariant = 'primary') =>
	clsx(
		'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4',
		variant === 'primary' && 'bg-ink text-canvas hover:opacity-90',
		variant === 'positive' && 'bg-accent text-canvas hover:opacity-90',
		variant === 'danger' && 'bg-bad-ink text-canvas hover:opacity-90',
		variant === 'quiet' && 'border border-line bg-surface text-ink hover:bg-sunken',
		variant === 'dangerQuiet' &&
			'border border-line bg-surface text-bad-ink hover:border-bad-ink hover:bg-bad',
		'text-sm font-medium whitespace-nowrap transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'
	);
