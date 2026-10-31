import { Dialog as Base } from '@base-ui/react/dialog';
import cls from 'classnames';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import ScrollArea from './ScrollArea';

type InteractionType = 'mouse' | 'touch' | 'pen' | 'keyboard' | '';

const getInteractionType = (
	event: Pick<Event, 'currentTarget'>
): InteractionType => {
	const nativeEvent = (
		'nativeEvent' in event
			? (event as typeof event & { nativeEvent: Event }).nativeEvent
			: event
	) as Event & { pointerType?: string };
	const pointerType =
		'pointerType' in nativeEvent ? nativeEvent.pointerType : undefined;
	if (
		pointerType === 'mouse' ||
		pointerType === 'touch' ||
		pointerType === 'pen'
	) {
		return pointerType;
	}
	if (nativeEvent.type === 'click') {
		return (nativeEvent as MouseEvent).detail === 0 ? 'keyboard' : 'mouse';
	}
	return '';
};

export const closeDialog = (event: Pick<Event, 'currentTarget'>) => {
	window.dispatchEvent(
		new CustomEvent('dialog-close', {
			detail: {
				sender: event.currentTarget,
				interactionType: getInteractionType(event)
			}
		})
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
	const closeInteractionTypeRef = useRef<InteractionType>('');

	const [open, setOpen] = useState(defaultOpen ?? false);

	const handleOpenChange = (open: boolean) => {
		setOpen(open);
		onOpenChange?.(open);
	};

	const handleClose = useEffectEvent((e: Event) => {
		const detail = (e as CustomEvent).detail as
			| { sender?: HTMLElement; interactionType?: InteractionType }
			| undefined;
		if (!detail?.sender || !ref.current?.contains(detail.sender)) return;
		closeInteractionTypeRef.current = detail.interactionType ?? '';
		handleOpenChange(false);
	});

	useEffect(() => {
		if (!open) return;

		closeInteractionTypeRef.current = '';
		window.addEventListener('dialog-close', handleClose);
		return () => window.removeEventListener('dialog-close', handleClose);
	}, [open]);

	return (
		<Base.Root open={open} onOpenChange={handleOpenChange}>
			{trigger(() => handleOpenChange(true))}
			<Base.Portal>
				<Base.Backdrop className="haax-backdrop-blur" />
				<Base.Viewport>
					<Base.Popup
						ref={ref}
						initialFocus={false}
						finalFocus={closeType =>
							closeType !== 'mouse' &&
							closeInteractionTypeRef.current !== 'mouse'
						}
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
