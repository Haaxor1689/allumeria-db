'use client';

import { usePathname } from 'next/navigation';
import { useId, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';

import useIsMobile from '#utils/useIsMobile.tsx';

import Button from './Button.tsx';
import Dialog, { closeDialog } from './Dialog.tsx';

const PADDING = 8;
const OFFSET = 20;

type TriggerProps<T extends HTMLElement = HTMLElement> = {
	ref?: React.Ref<T>;
	onClick?: (e: React.MouseEvent<T>) => void;
	onMouseMove?: (e: React.MouseEvent<T>) => void;
	onMouseLeave?: () => void;
};

type Props<T extends HTMLElement = HTMLElement> = {
	children: (props: TriggerProps<T>) => React.ReactElement;
	tooltip: React.ReactNode | (() => React.ReactNode);
	actions?: React.ReactNode | (() => React.ReactNode);
	hidden?: boolean;
};

const resolveContent = (content?: React.ReactNode | (() => React.ReactNode)) =>
	typeof content === 'function' ? content() : content;

const MobileTooltip = <T extends HTMLElement>({
	children,
	tooltip,
	actions
}: Props<T>) => (
	<Dialog
		trigger={open =>
			children({
				onClick: e => {
					e.preventDefault();
					open();
				}
			})
		}
		contentClassName="flex flex-col items-center gap-5"
	>
		<div className="group/tooltip pointer-events-none">{children({})}</div>
		{resolveContent(tooltip)}
		<div className="flex flex-col items-center gap-1">
			{resolveContent(actions)}
			<Button variant="negative" onClick={closeDialog}>
				Close
			</Button>
		</div>
	</Dialog>
);

type Position = { top: number; left: number };

type DesktopTooltipSnapshot = {
	visible: boolean;
	tooltip?: Props['tooltip'];
	container: HTMLElement | null;
};

let desktopSnapshot: DesktopTooltipSnapshot = {
	visible: false,
	container: null
};

const desktopListeners = new Set<() => void>();
let desktopMoveRaf: number | null = null;
let desktopLayerRoot: Root | null = null;
let desktopLayerHost: HTMLDivElement | null = null;
let desktopTooltipElement: HTMLDivElement | null = null;
let desktopPointer: { x: number; y: number } | null = null;
let desktopLastMousePoint: { x: number; y: number } | null = null;
let desktopPointerListenerCount = 0;
let desktopLastPosition: Position | null = null;
let desktopActiveOwnerId: string | null = null;
let desktopPathname: string | null = null;

const emitDesktopTooltip = () => {
	for (const listener of desktopListeners) {
		listener();
	}
};

const subscribeDesktopTooltip = (listener: () => void) => {
	desktopListeners.add(listener);
	return () => desktopListeners.delete(listener);
};

const getDesktopTooltipSnapshot = () => desktopSnapshot;

const updateDesktopTooltipPosition = () => {
	desktopMoveRaf = null;

	if (!desktopSnapshot.visible || !desktopTooltipElement || !desktopPointer)
		return;

	const { width: tooltipWidth, height: tooltipHeight } =
		desktopTooltipElement.getBoundingClientRect();
	const width = window.innerWidth;
	const height = window.innerHeight;

	const x = desktopPointer.x + OFFSET;
	const y = desktopPointer.y + OFFSET;

	const overflowX = Math.max(x + tooltipWidth - width, 0);
	const overflowY = Math.max(y + tooltipHeight - height, 0);

	const next = {
		left: Math.max(x - overflowX, PADDING),
		top: Math.max(y - overflowY, PADDING)
	};

	if (
		desktopLastPosition?.left === next.left &&
		desktopLastPosition?.top === next.top
	) {
		return;
	}

	desktopLastPosition = next;
	desktopTooltipElement.style.transform = `translate3d(${next.left}px, ${next.top}px, 0)`;
};

const scheduleDesktopTooltipMove = () => {
	if (desktopMoveRaf !== null) return;
	desktopMoveRaf = window.requestAnimationFrame(updateDesktopTooltipPosition);
};

const showDesktopTooltip = ({
	ownerId,
	tooltip,
	container
}: {
	ownerId: string;
	tooltip: Props['tooltip'];
	container: HTMLElement | null;
}) => {
	if (
		desktopSnapshot.visible &&
		desktopActiveOwnerId === ownerId &&
		desktopSnapshot.tooltip === tooltip &&
		desktopSnapshot.container === container
	)
		return;

	desktopActiveOwnerId = ownerId;
	desktopSnapshot = { visible: true, tooltip, container };
	desktopLastPosition = null;
	emitDesktopTooltip();
};

const moveDesktopTooltip = (x: number, y: number) => {
	desktopLastMousePoint = { x, y };
	desktopPointer = { x, y };
	scheduleDesktopTooltipMove();
};

const handleDesktopPointerMove = (event: PointerEvent) => {
	if (event.pointerType !== 'mouse') return;
	desktopLastMousePoint = { x: event.clientX, y: event.clientY };
};

const addDesktopPointerListener = () => {
	if (desktopPointerListenerCount === 0) {
		window.addEventListener('pointermove', handleDesktopPointerMove, {
			passive: true
		});
	}

	desktopPointerListenerCount += 1;
};

const removeDesktopPointerListener = () => {
	if (desktopPointerListenerCount === 0) return;
	desktopPointerListenerCount -= 1;
	if (desktopPointerListenerCount === 0)
		window.removeEventListener('pointermove', handleDesktopPointerMove);
};

const resetDesktopTooltip = () => {
	if (!desktopSnapshot.visible && desktopActiveOwnerId === null) return;

	desktopSnapshot = { visible: false, container: null };
	desktopActiveOwnerId = null;
	desktopPointer = null;
	desktopLastPosition = null;

	if (desktopMoveRaf !== null) {
		window.cancelAnimationFrame(desktopMoveRaf);
		desktopMoveRaf = null;
	}

	emitDesktopTooltip();
};

const hideDesktopTooltip = (ownerId: string) => {
	if (desktopActiveOwnerId !== ownerId) return;
	resetDesktopTooltip();
};

const DesktopTooltipLayer = () => {
	const snapshot = useSyncExternalStore(
		subscribeDesktopTooltip,
		getDesktopTooltipSnapshot
	);
	const tooltipRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!snapshot.visible) {
			desktopTooltipElement = null;
			return;
		}

		const tooltip = tooltipRef.current;
		if (!tooltip) {
			return;
		}

		desktopTooltipElement = tooltip;
		scheduleDesktopTooltipMove();

		return () => {
			if (desktopTooltipElement === tooltip) {
				desktopTooltipElement = null;
			}
		};
	}, [snapshot.visible, snapshot.tooltip, snapshot.container]);

	if (
		!snapshot.visible ||
		!snapshot.tooltip ||
		typeof document === 'undefined'
	) {
		return null;
	}

	return createPortal(
		<div
			ref={tooltipRef}
			className="pointer-events-none fixed z-10 max-w-100 min-w-62.5"
			style={{
				left: 0,
				top: 0,
				transform: `translate3d(${PADDING}px, ${PADDING}px, 0)`,
				willChange: 'transform'
			}}
		>
			{resolveContent(snapshot.tooltip)}
		</div>,
		snapshot.container ?? document.body
	);
};

const ensureDesktopTooltipLayer = () => {
	if (typeof document === 'undefined' || desktopLayerRoot) {
		return;
	}

	desktopLayerHost = document.createElement('div');
	document.body.append(desktopLayerHost);
	desktopLayerRoot = createRoot(desktopLayerHost);
	desktopLayerRoot.render(<DesktopTooltipLayer />);
};

const findHoveredElementWithin = (element: HTMLElement) => {
	const point = desktopLastMousePoint;
	if (point) {
		const pointedElement = document.elementFromPoint(point.x, point.y);
		if (
			pointedElement instanceof HTMLElement &&
			element.contains(pointedElement)
		) {
			return pointedElement;
		}
	}

	const hoveredElements = Array.from(document.querySelectorAll(':hover'));
	for (let i = hoveredElements.length - 1; i >= 0; i -= 1) {
		const candidate = hoveredElements[i];
		if (candidate instanceof HTMLElement && element.contains(candidate)) {
			return candidate;
		}
	}

	return null;
};

const showDesktopTooltipFromCurrentHover = ({
	ownerId,
	tooltip,
	element
}: {
	ownerId: string;
	tooltip: Props['tooltip'];
	element: HTMLElement;
}) => {
	const hoveredElement = findHoveredElementWithin(element);
	const isCursorOverElement =
		element.matches(':hover') || hoveredElement !== null;
	if (!isCursorOverElement) {
		return;
	}

	const hoveredRect = hoveredElement?.getBoundingClientRect();
	const point =
		desktopLastMousePoint ??
		(hoveredRect
			? {
					x: hoveredRect.left + hoveredRect.width / 2,
					y: hoveredRect.top + hoveredRect.height / 2
				}
			: null);

	if (!point) return;

	ensureDesktopTooltipLayer();
	showDesktopTooltip({
		ownerId,
		tooltip,
		container: element.closest('dialog')
	});
	moveDesktopTooltip(point.x, point.y);
};

const DesktopTooltip = <T extends HTMLElement>({
	children,
	tooltip,
	hidden
}: Props<T>) => {
	const ref = useRef<T>(null);
	const ownerId = useId();
	const pathname = usePathname();

	useLayoutEffect(() => {
		if (desktopPathname === null) {
			desktopPathname = pathname;
			return;
		}

		if (desktopPathname !== pathname) {
			desktopPathname = pathname;
			resetDesktopTooltip();
		}
	}, [pathname]);

	useLayoutEffect(() => {
		addDesktopPointerListener();

		return () => {
			removeDesktopPointerListener();
			hideDesktopTooltip(ownerId);
		};
	}, [ownerId]);

	useLayoutEffect(() => {
		if (hidden) {
			hideDesktopTooltip(ownerId);
			return;
		}

		const element = ref.current;
		if (!element) return;

		showDesktopTooltipFromCurrentHover({
			ownerId,
			tooltip,
			element
		});
	}, [hidden, ownerId, tooltip]);

	return (
		<>
			{children({
				ref,
				onMouseMove: e => {
					if (hidden) return;
					ensureDesktopTooltipLayer();
					showDesktopTooltip({
						ownerId,
						tooltip,
						container: e.currentTarget.closest('dialog')
					});
					moveDesktopTooltip(e.clientX, e.clientY);
				},
				onMouseLeave: () => {
					hideDesktopTooltip(ownerId);
				}
			})}
		</>
	);
};

const Tooltip = <T extends HTMLElement>(props: Props<T>) =>
	useIsMobile() ? <MobileTooltip {...props} /> : <DesktopTooltip {...props} />;

export default Tooltip;
