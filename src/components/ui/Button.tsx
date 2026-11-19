import type { Icon } from '@phosphor-icons/react';
import { CircleNotchIcon } from '@phosphor-icons/react/ssr';
import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

import { type ButtonVariant, buttonClass } from './button-variants';

type ButtonProp = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	icon: Icon;
	label: string;
	loading?: boolean;
	iconOnlyOnMobile?: boolean;
};

export function Button({
	variant,
	icon: Glyph,
	label,
	loading,
	iconOnlyOnMobile,
	className,
	disabled,
	type = 'button',
	...rest
}: Readonly<ButtonProp>) {
	const Shown = loading ? CircleNotchIcon : Glyph;
	return (
		<button
			type={type}
			aria-label={iconOnlyOnMobile ? label : undefined}
			aria-busy={loading || undefined}
			title={iconOnlyOnMobile ? label : undefined}
			disabled={disabled || loading}
			className={clsx(
				buttonClass(variant),
				iconOnlyOnMobile && 'max-sm:w-11 max-sm:px-0',
				className
			)}
			{...rest}
		>
			<Shown
				weight="bold"
				size={18}
				aria-hidden
				className={clsx('shrink-0', loading && 'animate-spin')}
			/>
			<span className={clsx(iconOnlyOnMobile && 'max-sm:sr-only')}>{label}</span>
		</button>
	);
}
