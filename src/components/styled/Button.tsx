import cn from 'classnames';
import { type MouseEvent, type ReactNode } from 'react';

type Props = {
	variant?:
		| 'dark'
		| 'negative'
		| 'orange'
		| 'pink'
		| 'positive'
		| 'purple'
		| 'red'
		| 'teal';
	size?: 'icon';
	type?: 'submit';
	active?: boolean;
	onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
	className?: string;
	children?: ReactNode;
};

const Button = ({
	variant,
	size,
	type,
	active,
	onClick,
	className,
	children
}: Props) => (
	<button
		type={type ?? 'button'}
		onClick={onClick}
		className={cn(
			'h-full cursor-pointer select-none font-bold pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover',
			{
				'px-3': !size,
				'ns-btn': !variant,
				'ns-btn-dark': variant === 'dark',
				'ns-btn-negative': variant === 'negative',
				'ns-btn-orange': variant === 'orange',
				'ns-btn-pink': variant === 'pink',
				'ns-btn-positive': variant === 'positive',
				'ns-btn-purple': variant === 'purple',
				'ns-btn-red': variant === 'red',
				'ns-btn-teal': variant === 'teal',
				'ns-btn-active!': active
			},
			className
		)}
	>
		{children}
	</button>
);

export default Button;
