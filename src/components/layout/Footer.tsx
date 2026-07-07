import cn from 'classnames';
import Link from 'next/link';

import { SocialLinks } from '#utils/constants.ts';

type Props = {
	className?: string;
};

const Footer = ({ className }: Props) => (
	<footer className={cn('space-y-8', className)}>
		<div className="flex justify-center">
			{SocialLinks.map(item => (
				<Link
					key={item.href}
					href={item.href}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={item.label}
					className="-my-5 p-3 active:ns-borderless-card-pressed hocus:ns-borderless-card-hover"
				>
					<img
						src={item.icon}
						alt={item.label}
						width={16}
						height={16}
						className="size-8"
					/>
				</Link>
			))}
		</div>
		<div className="relative shrink space-y-2 text-center text-xs text-muted/80">
			<p className="shrink">
				AllumeriaDB is a fan-made database site for the game Allumeria and is
				not affiliated with the official Allumeria developers.
			</p>
			<p className="shrink">
				All content, including images and descriptions, is used for
				informational purposes only. All rights to the game and its assets
				belong to their respective owners.
			</p>
		</div>
	</footer>
);

export default Footer;
