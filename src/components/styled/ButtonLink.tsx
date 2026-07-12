import cn from 'classnames';
import Link from 'next/link';
import { type ReactNode } from 'react';

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
	href: string;
	active?: boolean;
	className?: string;
	children?: ReactNode;
};

const ButtonLink = ({
	variant,
	size,
	active,
	href,
	className,
	children
}: Props) => (
	<Link
		href={href}
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
	</Link>
);

export default ButtonLink;
