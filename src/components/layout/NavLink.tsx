'use client';
import cn from 'classnames';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
	href: string;
	icon: string;
	label: string;
};

const NavLink = ({ href, icon, label }: Props) => {
	const pathname = usePathname();
	return (
		<Link
			href={href}
			className={cn(
				'flex items-center grow lg:grow-0 justify-center lg:justify-start gap-3 transparent-btn active:ns-btn-pressed hocus:ns-btn-hover font-semibold pixel-shadow select-none text-xl',
				{ 'ns-btn-active': pathname === href }
			)}
		>
			<img
				src={icon}
				alt={`${label} icon`}
				width={16}
				height={16}
				className="size-8"
			/>
			<span
				className={cn(
					'pr-3 hidden',
					pathname !== href ? 'lg:inline' : 'sm:inline'
				)}
			>
				{label}
			</span>
		</Link>
	);
};

export default NavLink;
