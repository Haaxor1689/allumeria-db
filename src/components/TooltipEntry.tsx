import cn from 'classnames';
import { type ReactNode } from 'react';

type Props = {
	icon?: string;
	className?: string;
	children: ReactNode;
};

const TooltipEntry = ({ icon, className, children }: Props) => (
	<div className={cn('flex items-center gap-2 text-tooltip', className)}>
		{icon && <img src={icon} alt="" className="size-6" />}
		{children}
	</div>
);

export default TooltipEntry;
