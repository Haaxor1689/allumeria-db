'use client';

import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';

import useIsMobile from '#utils/useIsMobile.tsx';

import Button from './Button.tsx';
import Dialog, { closeDialog } from './Dialog.tsx';

const PADDING = 8;
const OFFSET = 20;

type TriggerProps = {
	onClick?: (e: React.MouseEvent) => void;
	onMouseMove?: (e: React.MouseEvent) => void;
	onMouseLeave?: () => void;
};

type Props = {
	children: (props: TriggerProps) => React.ReactElement;
	tooltip: React.ReactNode | (() => React.ReactNode);
	actions?: React.ReactNode | (() => React.ReactNode);
	hidden?: boolean;
};

const resolveContent = (content?: React.ReactNode | (() => React.ReactNode)) =>
	typeof content === 'function' ? content() : content;

const MobileTooltip = ({ children, tooltip, actions }: Props) => (
	<Dialog
		trigger={open =>
			children({
				onClick: e => {
					e.preventDefault();
					open();
				}
			})
		}
		className="flex flex-col items-center gap-5"
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

type Position = {
	top: number;
	left: number;
};

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
let desktopLastPosition: Position | null = null;

const emitDesktopTooltip = () => {
	for (const listener of desktopListeners) {
		listener();
	}
};

const subscribeDesktopTooltip = (listener: () => void) => {
	desktopListeners.add(listener);
	return () => {
		desktopListeners.delete(listener);
	};
};

const getDesktopTooltipSnapshot = () => desktopSnapshot;

const updateDesktopTooltipPosition = () => {
	desktopMoveRaf = null;

	if (!desktopSnapshot.visible || !desktopTooltipElement || !desktopPointer) {
		return;
	}

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
	if (desktopMoveRaf !== null) {
		return;
	}

	desktopMoveRaf = window.requestAnimationFrame(updateDesktopTooltipPosition);
};

const showDesktopTooltip = ({
	tooltip,
	container
}: {
	tooltip: Props['tooltip'];
	container: HTMLElement | null;
}) => {
	if (
		desktopSnapshot.visible &&
		desktopSnapshot.tooltip === tooltip &&
		desktopSnapshot.container === container
	) {
		return;
	}

	desktopSnapshot = {
		visible: true,
		tooltip,
		container
	};
	desktopLastPosition = null;
	emitDesktopTooltip();
};

const moveDesktopTooltip = (x: number, y: number) => {
	desktopPointer = { x, y };
	scheduleDesktopTooltipMove();
};

const hideDesktopTooltip = () => {
	if (!desktopSnapshot.visible) {
		return;
	}

	desktopSnapshot = {
		visible: false,
		container: null
	};
	desktopPointer = null;
	desktopLastPosition = null;

	if (desktopMoveRaf !== null) {
		window.cancelAnimationFrame(desktopMoveRaf);
		desktopMoveRaf = null;
	}

	emitDesktopTooltip();
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

const DesktopTooltip = ({ children, tooltip, hidden }: Props) => (
	<>
		{children({
			onMouseMove: e => {
				if (hidden) {
					return;
				}

				ensureDesktopTooltipLayer();
				showDesktopTooltip({
					tooltip,
					container: e.currentTarget.closest('dialog')
				});
				moveDesktopTooltip(e.clientX, e.clientY);
			},
			onMouseLeave: () => {
				hideDesktopTooltip();
			}
		})}
	</>
);

const Tooltip = (props: Props) =>
	useIsMobile() ? <MobileTooltip {...props} /> : <DesktopTooltip {...props} />;

export default Tooltip;
