import { Dialog as Base } from '@base-ui/react/dialog';
import cls from 'classnames';
import { useRef, useState } from 'react';

import ScrollArea from './ScrollArea';

export const closeDialog = (event: Pick<Event, 'currentTarget'>) => {
	window.dispatchEvent(
		new CustomEvent('dialog-close', { detail: event.currentTarget })
	);
};

type Props = {
	trigger: (open: (...args: unknown[]) => void) => React.ReactNode;
	children: React.ReactNode;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	containerClassName?: string;
	contentClassName?: string;
};

const Dialog = ({
	trigger,
	children,
	defaultOpen,
	onOpenChange,
	containerClassName,
	contentClassName
}: Props) => {
	const ref = useRef<HTMLDivElement>(null);
	const cbRef = useRef<((e: Event) => void) | null>(null);

	const [open, setOpen] = useState(defaultOpen ?? false);

	const handleOpenChange = (open: boolean) => {
		setOpen(open);
		onOpenChange?.(open);
		if (open) {
			cbRef.current = (e: Event) => {
				const sender = (e as CustomEvent).detail as HTMLElement | undefined;
				if (!sender || !ref.current?.contains(sender)) return;
				handleOpenChange(false);
			};
			window.addEventListener('dialog-close', cbRef.current);
		} else {
			if (cbRef.current)
				window.removeEventListener('dialog-close', cbRef.current);
			cbRef.current = null;
		}
	};

	return (
		<Base.Root open={open} onOpenChange={handleOpenChange}>
			{trigger(() => handleOpenChange(true))}
			<Base.Portal>
				<Base.Backdrop className="haax-backdrop-blur" />
				<Base.Viewport>
					<Base.Popup
						ref={ref}
						className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform data-nested-dialog-open:after:haax-backdrop-blur"
					>
						<ScrollArea
							offset={32}
							containerClassName={cls('dialog-sizing', containerClassName)}
							contentClassName={contentClassName}
						>
							{children}
						</ScrollArea>
					</Base.Popup>
				</Base.Viewport>
			</Base.Portal>
		</Base.Root>
	);
};

export default Dialog;
