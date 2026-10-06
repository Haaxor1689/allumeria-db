import cn from 'classnames';

import { DatabaseLinks, ToolsLinks } from '#utils/constants.ts';

import NavLink from './NavLink';

const Navigation = ({ className }: { className?: string }) => (
	<div className={cn('flex grow flex-col gap-3', className)}>
		<h3 className="-mb-2 text-xl font-semibold text-muted pixel-shadow">
			Database:
		</h3>
		<nav className="relative flex flex-col before:pointer-events-none before:absolute before:inset-0 before:ns-borderless-panel before:opacity-50">
			{DatabaseLinks.map(item => (
				<NavLink
					key={item.href}
					href={item.href}
					icon={item.icon}
					label={item.label}
				/>
			))}
		</nav>
		<h3 className="-mb-2 text-xl font-semibold text-muted pixel-shadow">
			Tools:
		</h3>
		<nav className="relative flex flex-col before:pointer-events-none before:absolute before:inset-0 before:ns-borderless-panel before:opacity-50">
			{ToolsLinks.map(item => (
				<NavLink
					key={item.href}
					href={item.href}
					icon={item.icon}
					label={item.label}
				/>
			))}
		</nav>
	</div>
);

export default Navigation;
